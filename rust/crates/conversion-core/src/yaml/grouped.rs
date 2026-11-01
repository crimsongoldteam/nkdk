use super::Node;
use crate::{Position, Result, RuntimeDiagnostic};

/// Route a flat sequence to complete child sequence readers. State is bounded
/// by the number of declared groups, independently of the number of values.
pub struct GroupRouter<const N: usize> {
    tags: [Option<&'static str>; N],
    started: bool,
    closed: bool,
    depth: usize,
    active: Option<usize>,
    empty: bool,
    seen: [bool; N],
    empty_groups: [bool; N],
    order: Vec<usize>,
}
impl<const N: usize> GroupRouter<N> {
    pub fn new(tags: [Option<&'static str>; N]) -> Self {
        Self {
            tags,
            started: false,
            closed: false,
            depth: 0,
            active: None,
            empty: false,
            seen: [false; N],
            empty_groups: [false; N],
            order: Vec::with_capacity(N),
        }
    }
    pub fn consume(
        &mut self,
        node: Node,
        position: Position,
        mut consume: impl FnMut(usize, Node, Position) -> Result<()>,
    ) -> Result<()> {
        if self.closed {
            return Err(invalid("Unexpected value after grouped sequence"));
        }
        if !self.started {
            if !matches!(node, Node::SequenceStart(None)) {
                return Err(invalid("Expected a grouped sequence"));
            }
            self.started = true;
            return Ok(());
        }
        if let Some(slot) = self.active {
            if self.empty {
                if !matches!(node, Node::SequenceEnd) {
                    return Err(invalid("An empty group marker must be an empty sequence"));
                }
                self.empty = false;
                self.active = None;
                self.depth = 0;
                return Ok(());
            }
            node.advance_depth(&mut self.depth)?;
            if self.depth == 0 {
                self.active = None;
            }
            return consume(slot, node, position);
        }
        if matches!(node, Node::SequenceEnd) {
            self.closed = true;
            for &slot in &self.order {
                consume(slot, Node::SequenceEnd, position)?;
            }
            return Ok(());
        }
        let tag = match &node {
            Node::Scalar(_, tag) | Node::MappingStart(tag) | Node::SequenceStart(tag) => {
                tag.as_deref()
            }
            _ => return Err(invalid("Unexpected grouped item boundary")),
        };
        let slot = self
            .tags
            .iter()
            .position(|expected| *expected == tag)
            .ok_or_else(|| invalid("Unknown grouped item tag"))?;
        let node = if let Some(tag) = self.tags[slot] {
            node.consume_tag(tag)?
        } else {
            node
        };
        let empty_marker = matches!(node, Node::SequenceStart(_));
        if (empty_marker && self.seen[slot]) || self.empty_groups[slot] {
            return Err(invalid(
                "An empty group marker cannot be repeated or mixed with values",
            ));
        }
        self.empty_groups[slot] = empty_marker;
        if !self.seen[slot] {
            self.seen[slot] = true;
            self.order.push(slot);
            consume(slot, Node::SequenceStart(None), position)?;
        }
        match &node {
            Node::SequenceStart(_) => {
                self.active = Some(slot);
                self.depth = 1;
                self.empty = true;
                Ok(())
            }
            Node::MappingStart(_) => {
                self.active = Some(slot);
                self.depth = 1;
                consume(slot, node, position)
            }
            Node::Scalar(..) => consume(slot, node, position),
            _ => Err(invalid("Unexpected grouped item boundary")),
        }
    }
    pub fn finish(self) -> Result<Vec<usize>> {
        if !self.closed {
            return Err(invalid("Incomplete grouped sequence"));
        }
        Ok(self.order)
    }
}
fn invalid(message: &str) -> RuntimeDiagnostic {
    RuntimeDiagnostic::new("yaml.group-sequence", message)
}
