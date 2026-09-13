//! Expose one nested mapping as an event source without building a second tree.
use super::{Node, Source};
use crate::{Position, Result, RuntimeDiagnostic};

pub struct MappingPropertySource<'a, S> {
    pub source: S,
    pub property: &'a str,
    pub seen: &'a mut super::RecordState,
}
impl<S: Source> Source for MappingPropertySource<'_, S> {
    fn visit(self, mut consume: impl FnMut(Node, Position) -> Result<()>) -> Result<()> {
        let mut depth = 0usize;
        let mut selected = false;
        let mut found = false;
        self.source.visit(|node, position| {
            if depth >= 2 {
                match &node {
                    Node::MappingStart(_) | Node::SequenceStart(_) => depth += 1,
                    Node::MappingEnd | Node::SequenceEnd => depth -= 1,
                    _ => {}
                }
                return consume(node, position);
            }
            match node {
                Node::MappingStart(None) if depth == 0 => depth = 1,
                Node::Scalar(key, None) if depth == 1 && !selected && !found => {
                    if key.into_text()? != self.property {
                        return Err(failure("Unknown record property"));
                    }
                    selected = true;
                    self.seen.position = position;
                }
                Node::MappingStart(None) if depth == 1 && selected && !found => {
                    depth = 2;
                    found = true;
                    self.seen.present = true;
                    consume(Node::MappingStart(None), position)?;
                }
                Node::MappingEnd if depth == 1 && (!selected || found) => depth = 0,
                _ => return Err(failure("Expected one untagged record mapping")),
            }
            Ok(())
        })?;
        if depth != 0 {
            return Err(failure("Incomplete record mapping"));
        }
        self.seen.present = found;
        if !found {
            consume(Node::MappingStart(None), Position::default())?;
            consume(Node::MappingEnd, Position::default())?;
        }
        Ok(())
    }
}
fn failure(message: &str) -> RuntimeDiagnostic {
    RuntimeDiagnostic::new("yaml.record-form", message)
}
