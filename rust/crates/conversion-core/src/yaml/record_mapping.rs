mod grouped;
use super::{Node, Scalar};
use crate::{Position, Result, RuntimeDiagnostic};
pub use grouped::{GroupedRecordMappingReader, GroupedRecordMappingWriter};

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
    scalar_row: bool,
    absent_null_row: bool,
    key_input: bool,
}
impl<'a> RecordMappingFields<'a> {
    pub fn new(key: &'a str, value: Option<&'a str>) -> Self {
        Self {
            key,
            value,
            scalar_row: false,
            absent_null_row: false,
            key_input: false,
        }
    }
    /// A declared reversible shorthand owns the whole scalar row. Its key is
    /// provided through the existing row-key callback and lexical input scope.
    /// Absence is a declaration-level meaning, distinct from an empty record.
    pub fn with_absent_null_row(mut self, enabled: bool) -> Self {
        self.absent_null_row = enabled;
        self
    }
    pub fn with_key_input(mut self, enabled: bool) -> Self {
        self.key_input = enabled;
        self
    }
    pub fn with_scalar_row(mut self, enabled: bool) -> Self {
        self.scalar_row = enabled;
        self
    }
}
impl RecordMappingReader {
    pub fn consume(
        &mut self,
        node: Node,
        position: Position,
        fields: RecordMappingFields<'_>,
        map_key: impl FnOnce(String, Option<&str>) -> Result<String>,
        allow_null: impl FnOnce(&str) -> Result<bool>,
        mut emit: impl FnMut(Node, Position) -> Result<()>,
    ) -> Result<()> {
        let RecordMappingFields {
            key: field,
            value: value_field,
            scalar_row,
            absent_null_row,
            key_input,
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
                self.key = Some(read_mapping_key(node, position, &mut self.names, map_key)?);
                return Ok(());
            }
            if absent_null_row
                && value_field.is_none()
                && matches!(&node, Node::Scalar(value, None) if value.is_null())
            {
                if !allow_null(&self.key.as_ref().expect("pending key").text)? {
                    return Err(failure("Null is not an absent record for this key"));
                }
                self.key.take();
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
            if scalar_row
                && value_field.is_none()
                && matches!(&node, Node::Scalar(value, None) if !value.is_null())
            {
                self.key.take();
                return emit(node, position);
            }
            if value_field.is_none() && !matches!(node, Node::MappingStart(_)) {
                return Err(failure("Expected a record value"));
            }
            if value_field.is_none() && key_input {
                self.key.take();
                self.depth = 2;
                return emit(node, position);
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

/// Remove one known field wrapper from generated YAML, without parsing it.
/// This only accepts the block layout emitted by the compiler's own writers.
pub fn append_generated_field_value(
    source: &str,
    field: &str,
    mapping: bool,
    out: &mut String,
    indent: &str,
) -> Result<bool> {
    if source.is_empty() {
        return Ok(false);
    }
    let prefix = format!("{}:", super::scalar(field));
    let body = source.strip_prefix(&prefix).ok_or_else(|| {
        RuntimeDiagnostic::new(
            "yaml.projection-output",
            "Generated field wrapper does not match",
        )
    })?;
    if let Some(value) = body.strip_prefix(' ') {
        let first = value.trim_start();
        let is_mapping = first.starts_with('{');
        if first.starts_with('[') || first.starts_with('!') || is_mapping != mapping {
            return Ok(false);
        }
        super::Indented::new(out, indent).push_str(value);
        return Ok(true);
    }
    let Some(value) = body.strip_prefix('\n') else {
        return Err(RuntimeDiagnostic::new(
            "yaml.projection-output",
            "Unexpected generated field layout",
        ));
    };
    if !mapping || value.trim_start().starts_with("- ") {
        return Ok(false);
    }
    for line in value.split_inclusive('\n') {
        let line = if line == "\n" {
            line
        } else {
            line.strip_prefix("  ").ok_or_else(|| {
                RuntimeDiagnostic::new(
                    "yaml.projection-output",
                    "Generated field indentation does not match",
                )
            })?
        };
        super::Indented::new(out, indent).push_str(line);
    }
    Ok(true)
}

pub fn mapping_value(source: &[u8], field: &str, physical: &str) -> Result<Vec<u8>> {
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
    if fields.len() != 1 {
        return Err(failure("Expected exactly the projected record field"));
    }
    let key = fields[0].0.key()?;
    if key != field && !(key == physical && fields[0].1.tag.as_deref() == Some("!xml/raw")) {
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
    physical_value: Option<&str>,
    map_key: impl FnOnce(String, Option<&str>) -> Result<String>,
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
    let name = map_key(key.key()?.to_owned(), key.tag.as_deref())?;
    if value.tag.as_deref() == Some("!xml/raw")
        && let (Some(value_field), Some(physical_value)) = (value_field, physical_value)
    {
        let Kind::Mapping(raw_fields) = &value.kind else {
            return Err(failure("Expected a raw record value"));
        };
        let semantic = raw_fields
            .iter()
            .any(|(key, _)| key.key().is_ok_and(|key| key == "$значение"));
        let raw_key = if semantic {
            value_field
        } else {
            physical_value
        };
        return Value::mapping(vec![
            (Value::text(field), Value::text(&name)),
            (Value::text(raw_key), value),
        ])
        .render();
    }
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
    fields.insert(0, (Value::text(field), Value::text(&name)));
    let meaning = value.render()?;
    if let Some(envelope) = envelope {
        crate::raw::Document::encode(&meaning, &envelope.payload)
    } else {
        Ok(meaning)
    }
}

fn read_mapping_key(
    node: Node,
    position: Position,
    names: &mut std::collections::HashSet<String>,
    map_key: impl FnOnce(String, Option<&str>) -> Result<String>,
) -> Result<Scalar> {
    let Node::Scalar(key, annotation) = node else {
        return Err(failure("Expected a textual record key"));
    };
    let text = map_key(key.into_mapping_key()?, annotation.as_deref())?;
    if !names.insert(text.clone()) {
        return Err(failure("Repeated record key"));
    }
    Ok(Scalar {
        annotation: None,
        text,
        plain: false,
        position,
    })
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
            reader.consume(
                node,
                position,
                fields,
                |key, _| Ok(key),
                &mut allow_null,
                |node, _| {
                    result.push(match node {
                        Node::MappingStart(_) => "{".into(),
                        Node::MappingEnd => "}".into(),
                        Node::SequenceStart(_) => "[".into(),
                        Node::SequenceEnd => "]".into(),
                        Node::Scalar(value, _) => value.text,
                    });
                    Ok(())
                },
            )
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
    fn reports_each_semantic_row_key_before_emitting_its_fields() {
        let mut reader = RecordMappingReader::default();
        let trace = std::cell::RefCell::new(Vec::new());
        super::super::visit_nodes(
            b"External: {Value: one}\nNext: {Value: two}",
            |node, position| {
                reader.consume(
                    node,
                    position,
                    RecordMappingFields::new("name", None),
                    |key, _| {
                        let key = if key == "External" {
                            "Internal".into()
                        } else {
                            key
                        };
                        trace.borrow_mut().push(format!("key:{key}"));
                        Ok(key)
                    },
                    |_| Ok(false),
                    |node, _| {
                        if matches!(node, Node::MappingStart(_)) {
                            trace.borrow_mut().push("row".into());
                        }
                        Ok(())
                    },
                )
            },
        )
        .unwrap();
        reader.finish().unwrap();
        assert_eq!(*trace.borrow(), ["key:Internal", "row", "key:Next", "row"]);
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
    fn generated_field_projection_keeps_scalar_and_mapping_layouts() {
        for (source, mapping, expected) in [
            ("Value: '123'\n", false, "  '123'\n"),
            ("Value: 123\n", false, "  123\n"),
            (
                "Value:\n  Kind: text\n  Text: example\n",
                true,
                "  Kind: text\n  Text: example\n",
            ),
            ("Value: {}\n", true, "  {}\n"),
        ] {
            let mut out = String::new();
            assert!(
                append_generated_field_value(source, "Value", mapping, &mut out, "  ").unwrap()
            );
            assert_eq!(out, expected);
        }
        let mut out = String::new();
        assert!(
            !append_generated_field_value("Value: 'text'\n", "Value", true, &mut out, "").unwrap()
        );
        assert!(
            !append_generated_field_value("Value:\n  - first\n", "Value", true, &mut out, "")
                .unwrap()
        );
        assert!(out.is_empty());
        assert!(
            append_generated_field_value("Other: text\n", "Value", false, &mut out, "").is_err()
        );
    }

    #[test]
    fn declared_null_record_form_is_distinct_from_an_invalid_scalar() {
        assert_eq!(
            record(b"Empty: null", "Empty").unwrap(),
            vec!["[", "{", "name", "Empty", "}", "]"]
        );
        assert!(record(b"Filled: null", "Empty").is_err());
        assert!(record(b"Text: hello", "Empty").is_err());
        assert_eq!(
            events(
                b"First: {value: x}\nSecond: {}",
                RecordMappingFields::new("name", None).with_key_input(true),
                |_| Ok(false)
            )
            .unwrap(),
            vec!["[", "{", "value", "x", "}", "{", "}", "]"]
        );
        let absent = RecordMappingFields::new("name", None).with_absent_null_row(true);
        assert_eq!(
            events(b"Absent: null\nPresent: {}", absent, |_| Ok(true)).unwrap(),
            vec!["[", "{", "name", "Present", "}", "]"]
        );
        assert!(
            events(
                b"Unknown: null",
                RecordMappingFields::new("name", None).with_absent_null_row(true),
                |_| Ok(false)
            )
            .is_err()
        );
        assert!(
            events(
                b"Absent: null\nAbsent: {}",
                RecordMappingFields::new("name", None).with_absent_null_row(true),
                |_| Ok(true)
            )
            .is_err()
        );

        for text in ["hello", "''"] {
            assert_eq!(
                events(
                    format!("Text: {text}").as_bytes(),
                    RecordMappingFields::new("name", None).with_scalar_row(true),
                    |_| Ok(false)
                )
                .unwrap(),
                vec!["[", if text == "''" { "" } else { text }, "]"]
            );
        }
        assert!(
            events(
                b"Text: null",
                RecordMappingFields::new("name", None).with_scalar_row(true),
                |_| Ok(false)
            )
            .is_err()
        );
    }

    #[test]
    fn missing_projected_field_is_written_as_an_empty_mapping() {
        assert_eq!(mapping_value(b"", "value", "Value").unwrap(), b"{}");
        assert_eq!(mapping_value(b"{}", "value", "Value").unwrap(), b"{}");
    }

    #[test]
    fn projected_raw_field_uses_only_its_declared_xml_name() {
        let raw = b"Value: !xml/raw data";
        assert_eq!(
            mapping_value(raw, "Значение", "Value").unwrap(),
            b"!xml/raw data"
        );
        assert!(mapping_value(raw, "Значение", "Other").is_err());
        assert!(mapping_value(b"Value: ordinary", "Значение", "Value").is_err());
    }
}
