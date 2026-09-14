use super::{DocumentSource, Node, Scalar, Source};
use crate::{Position, Result, RuntimeDiagnostic};
use std::collections::BTreeSet;

/// Route a record's collection field directly to its existing event reader.
/// Scalar siblings are consumed in the same parse; no intermediate YAML is built.
fn visit_record(
    source: impl Source,
    property: &str,
    child: &str,
    mut consume: impl FnMut(Node, Position) -> Result<()>,
    mut sibling: impl FnMut(&str, Node, Position) -> Result<()>,
) -> Result<RecordState> {
    let mut property_position = Position::default();
    let mut depth = 0usize;
    let mut seen = false;
    let mut property_key = false;
    let mut field: Option<String> = None;
    let mut fields = BTreeSet::new();
    let mut forwarded = false;
    consume(Node::MappingStart(None), Position::default())?;
    source.visit(|node, position| {
        if forwarded {
            match &node {
                Node::MappingStart(_) | Node::SequenceStart(_) => depth += 1,
                Node::MappingEnd | Node::SequenceEnd => depth -= 1,
                _ => (),
            }
            consume(node, position)?;
            if depth == 2 {
                forwarded = false;
                field = None;
            }
            return Ok(());
        }
        match node {
            Node::MappingStart(None) if depth == 0 && !seen => {
                depth = 1;
                Ok(())
            }
            Node::Scalar(value, None) if depth == 1 && !property_key && !seen => {
                if value.into_text()? != property {
                    return Err(failure("Unknown record property"));
                }
                property_key = true;
                Ok(())
            }
            Node::MappingStart(None) if depth == 1 && property_key && !seen => {
                seen = true;
                property_position = position;
                depth = 2;
                Ok(())
            }
            Node::Scalar(value, None) if depth == 2 && field.is_none() => {
                let name = value.into_text()?;
                if !fields.insert(name.clone()) {
                    return Err(failure("Repeated record field"));
                }
                field = Some(name);
                Ok(())
            }
            Node::MappingEnd if depth == 2 && field.is_none() => {
                depth = 1;
                Ok(())
            }
            Node::MappingEnd if depth == 1 && (!property_key || seen) => {
                depth = 0;
                Ok(())
            }
            node if depth == 2 && field.is_some() => {
                let name = field.as_deref().unwrap();
                if name == child {
                    consume(
                        Node::Scalar(
                            Scalar {
                                annotation: None,
                                text: child.into(),
                                plain: false,
                                position,
                            },
                            None,
                        ),
                        position,
                    )?;
                    forwarded = matches!(node, Node::MappingStart(_) | Node::SequenceStart(_));
                    if forwarded {
                        depth += 1;
                    } else {
                        field = None;
                    }
                    consume(node, position)
                } else {
                    sibling(name, node, position)
                        .map_err(|error| position.apply(&[], error.field(name)))?;
                    field = None;
                    Ok(())
                }
            }
            _ => Err(failure("Expected a record mapping")),
        }
    })?;
    if depth != 0 || field.is_some() {
        return Err(failure("Incomplete record"));
    }
    consume(Node::MappingEnd, Position::default())?;
    Ok(RecordState {
        present: seen,
        child_present: fields.contains(child),
        position: property_position,
    })
}
fn failure(message: &str) -> RuntimeDiagnostic {
    RuntimeDiagnostic::new("yaml.record-form", message)
}

pub struct RecordSource<'a, F> {
    pub source: &'a [u8],
    pub property: &'a str,
    pub child: &'a str,
    pub seen: &'a mut RecordState,
    pub sibling: F,
}
impl<F: FnMut(&str, Node, Position) -> Result<()>> super::Source for RecordSource<'_, F> {
    fn visit(self, consume: impl FnMut(Node, Position) -> Result<()>) -> Result<()> {
        RecordEventsSource {
            source: DocumentSource(if self.source.is_empty() {
                b"{}"
            } else {
                self.source
            }),
            property: self.property,
            child: self.child,
            seen: self.seen,
            sibling: self.sibling,
        }
        .visit(consume)
    }
}

pub struct RecordEventsSource<'a, S, F> {
    pub source: S,
    pub property: &'a str,
    pub child: &'a str,
    pub seen: &'a mut RecordState,
    pub sibling: F,
}
impl<S: Source, F: FnMut(&str, Node, Position) -> Result<()>> Source
    for RecordEventsSource<'_, S, F>
{
    fn visit(self, consume: impl FnMut(Node, Position) -> Result<()>) -> Result<()> {
        *self.seen = visit_record(
            self.source,
            self.property,
            self.child,
            consume,
            self.sibling,
        )?;
        Ok(())
    }
}

#[derive(Default)]
pub struct RecordState {
    pub present: bool,
    pub child_present: bool,
    pub position: Position,
}
