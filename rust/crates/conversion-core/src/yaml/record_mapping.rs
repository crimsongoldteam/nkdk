//! Lift a record field into a mapping key without retaining the collection.
use super::{Node, Scalar};
use crate::{Position, Result, RuntimeDiagnostic};

#[derive(Default)]
pub struct RecordMappingReader {
    depth: usize,
    opened: bool,
    key: Option<Scalar>,
    names: std::collections::HashSet<String>,
    projected_mapping: Option<Position>,
}

#[derive(Clone, Copy)]
pub struct RecordMappingFields<'a> {
    key: &'a str,
    value: Option<&'a str>,
}
impl<'a> RecordMappingFields<'a> {
    pub fn new(key: &'a str, value: Option<&'a str>) -> Self {
        Self { key, value }
    }
}
impl RecordMappingReader {
    pub fn consume(
        &mut self,
        node: Node,
        position: Position,
        fields: RecordMappingFields<'_>,
        map_key: impl FnOnce(String) -> Result<String>,
        allow_null: impl FnOnce(&str) -> Result<bool>,
        mut emit: impl FnMut(Node, Position) -> Result<()>,
    ) -> Result<()> {
        let RecordMappingFields {
            key: field,
            value: value_field,
        } = fields;
        if self.depth == 0 {
            if self.opened || !matches!(node, Node::MappingStart(None)) {
                return Err(failure("Expected a record mapping"));
            }
            self.opened = true;
            self.depth = 1;
            return emit(Node::SequenceStart(None), position);
        }
        if let Some(start) = self.projected_mapping.take() {
            let value_field = value_field.expect("projected mapping");
            if matches!(node, Node::MappingEnd) {
                self.depth = 1;
                emit_projected_record_prefix(
                    self.key.take().expect("pending key"),
                    position,
                    field,
                    None,
                    &mut emit,
                )?;
                return emit(Node::MappingEnd, position);
            }
            emit_projected_record_prefix(
                self.key.take().expect("pending key"),
                position,
                field,
                Some(value_field),
                &mut emit,
            )?;
            emit(Node::MappingStart(None), start)?;
            node.advance_depth(&mut self.depth)?;
            emit(node, position)?;
            if self.depth == 1 {
                emit(Node::MappingEnd, position)?;
            }
            return Ok(());
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
                let text = map_key(key.into_mapping_key()?)?;
                if !self.names.insert(text.clone()) {
                    return Err(failure("Repeated record key"));
                }
                self.key = Some(Scalar {
                    annotation: None,
                    text,
                    plain: false,
                    position,
                });
                return Ok(());
            }
            if value_field.is_none()
                && matches!(&node, Node::Scalar(value, None) if value.is_null())
                && allow_null(&self.key.as_ref().expect("pending key").text)?
            {
                emit_projected_record_prefix(
                    self.key.take().expect("pending key"),
                    position,
                    field,
                    None,
                    &mut emit,
                )?;
                return emit(Node::MappingEnd, position);
            }
            if value_field.is_none() && !matches!(node, Node::MappingStart(_)) {
                return Err(failure("Expected a record value"));
            }
            if value_field.is_none() {
                self.depth = 2;
                emit(node, position)?;
                emit(
                    Node::Scalar(
                        Scalar {
                            annotation: None,
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
            if value_field.is_some() && matches!(node, Node::MappingStart(_)) {
                self.depth = 2;
                self.projected_mapping = Some(position);
                return Ok(());
            }
            if value_field.is_some()
                && matches!(&node, Node::Scalar(value, None) if value.is_null())
            {
                emit_projected_record_prefix(
                    self.key.take().expect("pending key"),
                    position,
                    field,
                    None,
                    &mut emit,
                )?;
                return emit(Node::MappingEnd, position);
            }
            let nested = matches!(node, Node::SequenceStart(_));
            self.depth = if nested { 2 } else { 1 };
            let value_field = value_field.expect("projected value");
            emit_projected_record_prefix(
                self.key.take().expect("pending key"),
                position,
                field,
                Some(value_field),
                &mut emit,
            )?;
            emit(node, position)?;
            if !nested {
                emit(Node::MappingEnd, position)?;
            }
            return Ok(());
        }
        node.advance_depth(&mut self.depth)?;
        emit(node, position)?;
        if value_field.is_some() && self.depth == 1 {
            emit(Node::MappingEnd, position)?;
        }
        Ok(())
    }
    pub fn finish(&self) -> Result<()> {
        if !self.opened || self.depth != 0 || self.key.is_some() || self.projected_mapping.is_some()
        {
            return Err(failure("Incomplete record mapping"));
        }
        Ok(())
    }
}
fn emit_projected_record_prefix(
    key: Scalar,
    position: Position,
    field: &str,
    value_field: Option<&str>,
    emit: &mut impl FnMut(Node, Position) -> Result<()>,
) -> Result<()> {
    emit(Node::MappingStart(None), position)?;
    emit(
        Node::Scalar(
            Scalar {
                annotation: None,
                text: field.into(),
                plain: false,
                position,
            },
            None,
        ),
        position,
    )?;
    emit(Node::Scalar(key, None), position)?;
    if let Some(value_field) = value_field {
        emit(
            Node::Scalar(
                Scalar {
                    annotation: None,
                    text: value_field.into(),
                    plain: false,
                    position,
                },
                None,
            ),
            position,
        )?;
    }
    Ok(())
}
fn failure(message: &str) -> RuntimeDiagnostic {
    RuntimeDiagnostic::new("yaml.record-mapping", message)
}

pub fn mapping_value(source: &[u8], field: &str) -> Result<Vec<u8>> {
    use super::document::{self, Kind};
    if source.is_empty() {
        return Ok(b"{}".to_vec());
    }
    let value = document::parse(source)?;
    let Kind::Mapping(mut fields) = value.kind else {
        return Err(failure("Expected a record value"));
    };
    if fields.is_empty() {
        return Ok(b"{}".to_vec());
    }
    if fields.len() != 1 || fields[0].0.key()? != field {
        return Err(failure("Expected exactly the projected record field"));
    }
    fields.remove(0).1.render()
}

/// Rebuild only after the row reader requests preservation recovery.
pub fn preserved_record_mapping_item(
    source: &[u8],
    property: Option<&str>,
    index: usize,
    field: &str,
    value_field: Option<&str>,
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
    if let Some(value_field) = value_field {
        value = Value::mapping(vec![(Value::text(value_field), value)]);
    }
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

#[cfg(test)]
mod tests {
    use super::*;

    fn events(
        source: &[u8],
        fields: RecordMappingFields<'_>,
        mut allow_null: impl FnMut(&str) -> Result<bool>,
    ) -> Result<Vec<String>> {
        let mut reader = RecordMappingReader::default();
        let mut result = Vec::new();
        super::super::visit_nodes(source, |node, position| {
            reader.consume(node, position, fields, Ok, &mut allow_null, |node, _| {
                result.push(match node {
                    Node::MappingStart(_) => "{".into(),
                    Node::MappingEnd => "}".into(),
                    Node::SequenceStart(_) => "[".into(),
                    Node::SequenceEnd => "]".into(),
                    Node::Scalar(value, _) => value.text,
                });
                Ok(())
            })
        })?;
        reader.finish()?;
        Ok(result)
    }

    fn projected(source: &[u8]) -> Vec<String> {
        events(
            source,
            RecordMappingFields::new("name", Some("value")),
            |_| Ok(false),
        )
        .unwrap()
    }

    fn record(source: &[u8], null_name: &str) -> Result<Vec<String>> {
        events(source, RecordMappingFields::new("name", None), |name| {
            Ok(name == null_name)
        })
    }

    #[test]
    fn projected_empty_values_denote_an_absent_record_field() {
        let expected = vec!["[", "{", "name", "Missing", "}", "]"];
        assert_eq!(projected(b"Missing: {}"), expected);
        assert_eq!(projected(b"Missing: null"), expected);
    }

    #[test]
    fn projected_mapping_values_remain_nested_values() {
        assert_eq!(
            projected(b"Complex: {Kind: text}"),
            vec![
                "[", "{", "name", "Complex", "value", "{", "Kind", "text", "}", "}", "]"
            ]
        );
    }

    #[test]
    fn declared_null_record_form_is_distinct_from_an_invalid_scalar() {
        assert_eq!(
            record(b"Empty: null", "Empty").unwrap(),
            vec!["[", "{", "name", "Empty", "}", "]"]
        );
        assert!(record(b"Filled: null", "Empty").is_err());
    }

    #[test]
    fn missing_projected_field_is_written_as_an_empty_mapping() {
        assert_eq!(mapping_value(b"", "value").unwrap(), b"{}");
        assert_eq!(mapping_value(b"{}", "value").unwrap(), b"{}");
    }
}
