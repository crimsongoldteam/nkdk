use super::{Node, Source};
use crate::{Position, Result, RuntimeDiagnostic};
use yaml_rust2::Yaml;

/// Select a decoder once per property. Nested nodes move directly to that decoder.
/// None is emitted only for the shared mapping start and end.
pub fn visit_partitions(
    source: impl Source,
    mut select: impl FnMut(&str) -> Option<usize>,
    mut consume: impl FnMut(Option<usize>, Node, Position) -> Result<()>,
) -> Result<()> {
    let mut routing = PartitionRouter::default();
    source.visit(|node, position| {
        let selected = routing.route(&node, &mut select)?;
        consume(selected, node, position)
    })?;
    routing.finish()
}

/// Routing state for one mapping; payload nodes stay owned by their decoder.
#[derive(Default)]
pub struct PartitionRouter {
    depth: usize,
    opened: bool,
    closed: bool,
    selected: Option<usize>,
}
impl PartitionRouter {
    pub fn route(
        &mut self,
        node: &Node,
        mut select: impl FnMut(&str) -> Option<usize>,
    ) -> Result<Option<usize>> {
        if !self.opened {
            if !matches!(node, Node::MappingStart(None)) {
                return Err(failure());
            }
            self.opened = true;
            self.depth = 1;
            return Ok(None);
        }
        if self.closed {
            return Err(failure());
        }
        if self.depth == 1 && self.selected.is_none() {
            if matches!(node, Node::MappingEnd) {
                self.closed = true;
                return Ok(None);
            }
            let Node::Scalar(value, None) = node else {
                return Err(failure());
            };
            if value.plain && !matches!(Yaml::from_str(&value.text), Yaml::String(_)) {
                return Err(RuntimeDiagnostic::new(
                    "yaml.expected-text",
                    "Expected a textual mapping key",
                ));
            }
            self.selected = Some(select(&value.text).ok_or_else(|| {
                RuntimeDiagnostic::new("yaml.unknown-field", "Undeclared owner property")
                    .field(&value.text)
            })?);
            Ok(self.selected)
        } else {
            node.advance_depth(&mut self.depth)?;
            let destination = self.selected;
            if self.depth == 1 {
                self.selected = None;
            }
            Ok(destination)
        }
    }
    pub fn finish(self) -> Result<()> {
        if !self.closed {
            return Err(failure());
        }
        Ok(())
    }
}

/// Route complete top-level property values to two decoders in one parse.
pub struct PartitionSource<S, F, C> {
    pub source: S,
    pub select: F,
    pub sibling: C,
}
impl<S, F, C> Source for PartitionSource<S, F, C>
where
    S: Source,
    F: FnMut(&str) -> bool,
    C: FnMut(Node, Position) -> Result<()>,
{
    fn visit(self, mut consume: impl FnMut(Node, Position) -> Result<()>) -> Result<()> {
        let Self {
            source,
            mut select,
            mut sibling,
        } = self;
        visit_partitions(
            source,
            |key| Some(usize::from(select(key))),
            |slot, node, position| match slot {
                Some(0) => sibling(node, position),
                Some(1) => consume(node, position),
                None => {
                    match &node {
                        Node::MappingStart(None) => sibling(Node::MappingStart(None), position)?,
                        Node::MappingEnd => sibling(Node::MappingEnd, position)?,
                        _ => return Err(failure()),
                    }
                    consume(node, position)
                }
                _ => unreachable!("binary partition"),
            },
        )
    }
}
fn failure() -> RuntimeDiagnostic {
    RuntimeDiagnostic::new(
        "yaml.expected-mapping",
        "Expected one untagged property mapping",
    )
}
