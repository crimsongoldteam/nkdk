//! Lift a record field into a mapping key without retaining the collection.
use super::{Node, Scalar};
use crate::{Position, Result, RuntimeDiagnostic};

#[derive(Default)]
pub struct RecordMappingReader {
    depth: usize,
    opened: bool,
    key: Option<Scalar>,
    names: std::collections::HashSet<String>,
}
impl RecordMappingReader {
    pub fn consume(
        &mut self,
        node: Node,
        position: Position,
        field: &str,
        mut emit: impl FnMut(Node, Position) -> Result<()>,
    ) -> Result<()> {
        if self.depth == 0 {
            if self.opened || !matches!(node, Node::MappingStart(None)) {
                return Err(failure("Expected a record mapping"));
            }
            self.opened = true;
            self.depth = 1;
            return emit(Node::SequenceStart(None), position);
        }
        if self.depth == 1 {
            if self.key.is_none() {
                if matches!(node, Node::MappingEnd) {
                    self.depth = 0;
                    return emit(Node::SequenceEnd, position);
                }
                let Node::Scalar(key, None) = node else {
                    return Err(failure("Expected a textual record key"));
                };
                let text = key.into_mapping_key()?;
                if !self.names.insert(text.clone()) {
                    return Err(failure("Repeated record key"));
                }
                self.key = Some(Scalar {
                    text,
                    plain: false,
                    position,
                });
                return Ok(());
            }
            if !matches!(node, Node::MappingStart(_)) {
                return Err(failure("Expected a record value"));
            }
            self.depth = 2;
            emit(node, position)?;
            emit(
                Node::Scalar(
                    Scalar {
                        text: field.into(),
                        plain: false,
                        position,
                    },
                    None,
                ),
                position,
            )?;
            return emit(
                Node::Scalar(self.key.take().expect("pending key"), None),
                position,
            );
        }
        node.advance_depth(&mut self.depth)?;
        emit(node, position)
    }
    pub fn finish(&self) -> Result<()> {
        if !self.opened || self.depth != 0 || self.key.is_some() {
            return Err(failure("Incomplete record mapping"));
        }
        Ok(())
    }
}
fn failure(message: &str) -> RuntimeDiagnostic {
    RuntimeDiagnostic::new("yaml.record-mapping", message)
}

/// Rebuild only after the row reader requests preservation recovery.
pub fn preserved_record_mapping_item(
    source: &[u8],
    property: Option<&str>,
    index: usize,
    field: &str,
) -> Result<Vec<u8>> {
    use super::document::{self, Kind, Value};
    let value = super::preserved_collection_value(source, property)?;
    let Kind::Mapping(mut entries) = value.kind else {
        return Err(failure("Expected a record mapping"));
    };
    if index >= entries.len() {
        return Err(failure("Missing record item"));
    }
    let (key, value) = entries.remove(index);
    let name = key.key()?;
    let bytes = value.render()?;
    let envelope = crate::raw::Document::decode(&bytes)?;
    let mut value = if let Some(envelope) = &envelope {
        document::parse(&envelope.meaning)?
    } else {
        value
    };
    let Kind::Mapping(fields) = &mut value.kind else {
        return Err(failure("Expected a record value"));
    };
    if fields
        .iter()
        .any(|(key, _)| key.key().is_ok_and(|key| key == field))
    {
        return Err(failure(
            "Record key appears both outside and inside the record",
        ));
    }
    fields.insert(0, (Value::text(field), Value::text(name)));
    let meaning = value.render()?;
    if let Some(envelope) = envelope {
        crate::raw::Document::encode(&meaning, &envelope.payload)
    } else {
        Ok(meaning)
    }
}
