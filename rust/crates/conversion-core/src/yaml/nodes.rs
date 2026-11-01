use super::{Result, RuntimeDiagnostic, Scalar};
use crate::Position;
use yaml_rust2::{
    parser::{Event, MarkedEventReceiver, Tag},
    scanner::{Marker, TScalarStyle},
};

#[derive(Clone)]
pub enum Node {
    MappingStart(Option<String>),
    MappingEnd,
    SequenceStart(Option<String>),
    SequenceEnd,
    Scalar(Scalar, Option<String>),
}
impl Node {
    /// Remove the declared semantic mark only at the root of one value.
    /// XML envelopes retain their own tag and remain the child's responsibility.
    pub fn consume_tag(mut self, expected: &str) -> Result<Self> {
        let annotation = match &mut self {
            Self::Scalar(_, tag) | Self::MappingStart(tag) | Self::SequenceStart(tag) => tag,
            _ => {
                return Err(RuntimeDiagnostic::new(
                    "yaml.item-tag",
                    "Expected a tagged value",
                ));
            }
        };
        if annotation
            .as_deref()
            .is_some_and(|tag| tag.starts_with("!xml/"))
        {
            return Ok(self);
        }
        if annotation.as_deref() != Some(expected) {
            return Err(RuntimeDiagnostic::new(
                "yaml.item-tag",
                "Unexpected or missing item tag",
            ));
        }
        *annotation = None;
        if let Self::Scalar(value, _) = &mut self {
            value.annotation = None;
        }
        Ok(self)
    }
    /// Track value nesting for streaming adapters without retaining nodes.
    pub(super) fn advance_depth(&self, depth: &mut usize) -> Result<()> {
        match self {
            Self::MappingStart(_) | Self::SequenceStart(_) => *depth += 1,
            Self::MappingEnd | Self::SequenceEnd => {
                *depth = depth.checked_sub(1).ok_or_else(|| {
                    RuntimeDiagnostic::new("yaml.structure", "Unexpected closing node")
                })?;
            }
            Self::Scalar(..) => (),
        }
        Ok(())
    }
}
fn tag(tag: Option<Tag>) -> Option<String> {
    tag.map(|tag| tag.handle + &tag.suffix)
}
pub fn visit_nodes(source: &[u8], consume: impl FnMut(Node, Position) -> Result<()>) -> Result<()> {
    let mut receiver = Receiver {
        consume,
        documents: 0,
        error: None,
    };
    super::parse_events(source, &mut receiver, "yaml.encoding", "yaml.syntax")?;
    if let Some(error) = receiver.error {
        return Err(error);
    }
    if receiver.documents != 1 {
        return Err(RuntimeDiagnostic::new(
            "yaml.document",
            "Expected one YAML document",
        ));
    }
    Ok(())
}
struct Receiver<F> {
    consume: F,
    documents: usize,
    error: Option<RuntimeDiagnostic>,
}
impl<F: FnMut(Node, Position) -> Result<()>> MarkedEventReceiver for Receiver<F> {
    fn on_event(&mut self, event: Event, mark: Marker) {
        if self.error.is_some() {
            return;
        }
        let position = Position::yaml(mark.line(), mark.col() + 1);
        let node = match event {
            Event::StreamStart | Event::StreamEnd | Event::DocumentEnd => return,
            Event::DocumentStart => {
                self.documents += 1;
                if self.documents > 1 {
                    self.error = Some(
                        RuntimeDiagnostic::new(
                            "yaml.multiple-documents",
                            "Multiple documents are not accepted",
                        )
                        .at(mark.line(), mark.col() + 1),
                    );
                }
                return;
            }
            Event::MappingStart(0, annotation) => Node::MappingStart(tag(annotation)),
            Event::MappingEnd => Node::MappingEnd,
            Event::SequenceStart(0, annotation) => Node::SequenceStart(tag(annotation)),
            Event::SequenceEnd => Node::SequenceEnd,
            Event::Scalar(text, style, 0, annotation) => Node::Scalar(
                Scalar {
                    annotation: None,
                    text,
                    plain: style == TScalarStyle::Plain,
                    position,
                },
                tag(annotation),
            ),
            _ => {
                self.error = Some(
                    RuntimeDiagnostic::new("yaml.alias", "Anchors and aliases are not accepted")
                        .at(mark.line(), mark.col() + 1),
                );
                return;
            }
        };
        self.error = (self.consume)(node, position)
            .err()
            .map(|error| position.apply(&[], error));
    }
}

/// Root-item marks of a sequence are removed before its ordinary item reader.
pub struct ItemTags {
    expected: &'static str,
    depth: usize,
    opened: bool,
}
impl ItemTags {
    pub fn new(expected: &'static str) -> Self {
        Self {
            expected,
            depth: 0,
            opened: false,
        }
    }
    pub fn consume(&mut self, node: Node) -> Result<Node> {
        if !self.opened {
            self.opened = true;
            if matches!(node, Node::SequenceStart(_)) {
                self.depth = 1;
                return Ok(node);
            }
            return node.consume_tag(self.expected);
        }
        let node = if self.depth == 1 && !matches!(node, Node::SequenceEnd) {
            node.consume_tag(self.expected)?
        } else {
            node
        };
        node.advance_depth(&mut self.depth)?;
        Ok(node)
    }
}
