//! Project flat rows into a mapping with an optional secondary key.
use super::{RecordMappingFields, emit_projected_record_prefix, failure, read_mapping_key};
use crate::yaml::{Node, Scalar};
use crate::{Position, Result};
use std::collections::{HashMap, HashSet};

#[derive(Default)]
pub struct GroupedRecordMappingReader {
    depth: usize,
    opened: bool,
    outer: Option<Scalar>,
    secondary: Option<Scalar>,
    grouped: bool,
    active_value: bool,
    names: HashSet<String>,
    secondary_names: HashSet<String>,
}
impl GroupedRecordMappingReader {
    pub fn consume(
        &mut self,
        node: Node,
        position: Position,
        fields: RecordMappingFields<'_>,
        secondary_field: &str,
        mut map_key: impl FnMut(String, Option<&str>) -> Result<String>,
        mut emit: impl FnMut(Node, Position) -> Result<()>,
    ) -> Result<()> {
        let value = fields
            .value
            .ok_or_else(|| failure("Grouped mapping requires a value field"))?;
        if fields.key == secondary_field || fields.key == value || secondary_field == value {
            return Err(failure("Grouped mapping fields must be distinct"));
        }
        if self.depth == 0 {
            if self.opened || !matches!(node, Node::MappingStart(None)) {
                return Err(failure("Expected a grouped record mapping"));
            }
            self.opened = true;
            self.depth = 1;
            return emit(Node::SequenceStart(None), position);
        }
        if self.active_value {
            node.advance_depth(&mut self.depth)?;
            emit(node, position)?;
            if self.depth == if self.grouped { 2 } else { 1 } {
                self.active_value = false;
                emit(Node::MappingEnd, position)?;
                if !self.grouped {
                    self.outer = None;
                }
            }
            return Ok(());
        }
        if self.grouped {
            if self.secondary.is_none() {
                if matches!(node, Node::MappingEnd) {
                    if self.secondary_names.is_empty() {
                        return Err(failure("Empty secondary mapping"));
                    }
                    self.depth = 1;
                    self.grouped = false;
                    self.outer = None;
                    return Ok(());
                }
                self.secondary = Some(read_mapping_key(
                    node,
                    position,
                    &mut self.secondary_names,
                    |key, annotation| {
                        if annotation.is_some() {
                            return Err(failure("Unexpected secondary key annotation"));
                        }
                        Ok(key)
                    },
                )?);
                return Ok(());
            }
            emit_projected_record_prefix(
                self.outer.as_ref().expect("group key").clone(),
                position,
                fields.key,
                None,
                &mut emit,
            )?;
            emit(
                Node::Scalar(
                    Scalar {
                        annotation: None,
                        text: secondary_field.into(),
                        plain: false,
                        position,
                    },
                    None,
                ),
                position,
            )?;
            emit(
                Node::Scalar(self.secondary.take().expect("secondary key"), None),
                position,
            )?;
        } else if self.outer.is_none() {
            if matches!(node, Node::MappingEnd) {
                self.depth = 0;
                return emit(Node::SequenceEnd, position);
            }
            self.outer = Some(read_mapping_key(
                node,
                position,
                &mut self.names,
                &mut map_key,
            )?);
            return Ok(());
        } else if matches!(node, Node::MappingStart(None)) {
            self.grouped = true;
            self.depth = 2;
            self.secondary_names.clear();
            return Ok(());
        } else {
            emit_projected_record_prefix(
                self.outer.as_ref().expect("record key").clone(),
                position,
                fields.key,
                None,
                &mut emit,
            )?;
        }
        emit(
            Node::Scalar(
                Scalar {
                    annotation: None,
                    text: value.into(),
                    plain: false,
                    position,
                },
                None,
            ),
            position,
        )?;
        node.advance_depth(&mut self.depth)?;
        self.active_value = self.depth > if self.grouped { 2 } else { 1 };
        emit(node, position)?;
        if !self.active_value {
            emit(Node::MappingEnd, position)?;
            if !self.grouped {
                self.outer = None;
            }
        }
        Ok(())
    }
    pub fn finish(&self) -> Result<()> {
        if !self.opened
            || self.depth != 0
            || self.outer.is_some()
            || self.secondary.is_some()
            || self.active_value
        {
            return Err(failure("Incomplete grouped record mapping"));
        }
        Ok(())
    }
}

enum GroupValue {
    Scalar(String),
    Mapping {
        rows: Vec<(String, String)>,
        names: HashSet<String>,
    },
}
#[derive(Default)]
pub struct GroupedRecordMappingWriter {
    rows: Vec<(String, GroupValue)>,
    names: HashMap<String, usize>,
}
impl GroupedRecordMappingWriter {
    /// False means this row cannot fit the ordinary YAML shape. The caller's
    /// round-trip proof preserves the original XML; no conflicting row wins.
    pub fn push(&mut self, key: &str, secondary: Option<&str>, value: String) -> bool {
        if let Some(&index) = self.names.get(key) {
            if let (GroupValue::Mapping { rows, names }, Some(secondary)) =
                (&mut self.rows[index].1, secondary)
                && names.insert(secondary.to_owned())
            {
                rows.push((secondary.to_owned(), value));
                return true;
            }
            return false;
        }
        let body = if let Some(secondary) = secondary {
            GroupValue::Mapping {
                rows: vec![(secondary.to_owned(), value)],
                names: HashSet::from([secondary.to_owned()]),
            }
        } else {
            GroupValue::Scalar(value)
        };
        self.names.insert(key.to_owned(), self.rows.len());
        self.rows.push((key.to_owned(), body));
        true
    }
    pub fn push_record(
        &mut self,
        key: &str,
        record: &[u8],
        secondary_field: &str,
        value_field: &str,
    ) -> Result<bool> {
        use crate::yaml::document::{self, Kind};
        // Ordinary scalar rows stream directly; build a YAML tree only for
        // structured values or preservation envelopes.
        let mut mapping = crate::yaml::ScalarMapping::default();
        let mut secondary = None;
        let mut payload = None;
        let mut representable = true;
        let flat = crate::yaml::visit_nodes(record, |node, position| {
            if let Some(entry) = mapping.consume(node, position)? {
                if entry.key == secondary_field {
                    if entry.tag.is_some() {
                        representable = false;
                    } else {
                        secondary = Some(entry.value.into_mapping_key()?);
                    }
                } else if entry.key == value_field {
                    payload = Some(
                        document::Value {
                            kind: Kind::Scalar(entry.value),
                            tag: entry.tag,
                        }
                        .render()?,
                    );
                } else if entry
                    .tag
                    .as_deref()
                    .is_some_and(|tag| tag.starts_with("!xml/"))
                {
                    representable = false;
                } else {
                    return Err(failure("Unexpected grouped row field"));
                }
            }
            Ok(())
        })
        .and_then(|()| mapping.finish());
        match flat {
            Ok(()) => {
                return if representable {
                    Ok(self.push(
                        key,
                        secondary.as_deref(),
                        String::from_utf8(payload.unwrap_or_else(|| b"{}".to_vec()))
                            .expect("rendered YAML"),
                    ))
                } else {
                    Ok(false)
                };
            }
            Err(error) if error.code.as_deref() == Some("yaml.unsupported-form") => {}
            Err(error) => return Err(error),
        }
        let Kind::Mapping(fields) = document::parse(record)?.kind else {
            return Err(failure("Expected a grouped row"));
        };
        let mut secondary = None;
        let mut payload = None;
        for (name, value) in fields {
            match name.key()? {
                name if name == secondary_field => {
                    if secondary.is_some() || value.tag.is_some() {
                        return Ok(false);
                    }
                    let Kind::Scalar(text) = value.kind else {
                        return Ok(false);
                    };
                    secondary = Some(text.into_mapping_key()?);
                }
                name if name == value_field => {
                    if payload.is_some() {
                        return Err(failure("Repeated grouped value"));
                    }
                    payload = Some(value.render()?);
                }
                _ if value
                    .tag
                    .as_deref()
                    .is_some_and(|tag| tag.starts_with("!xml/")) =>
                {
                    return Ok(false);
                }
                _ => return Err(failure("Unexpected grouped row field")),
            }
        }
        Ok(self.push(
            key,
            secondary.as_deref(),
            String::from_utf8(payload.unwrap_or_else(|| b"{}".to_vec())).expect("rendered YAML"),
        ))
    }
    pub fn write(&self, out: &mut String, indent: &str) -> Result<()> {
        if self.rows.is_empty() {
            out.push_str("{}");
            return Ok(());
        }
        for (index, (key, value)) in self.rows.iter().enumerate() {
            if index > 0 {
                out.push('\n');
            }
            out.push_str(indent);
            out.push_str(&crate::yaml::scalar(key));
            out.push(':');
            match value {
                GroupValue::Scalar(value) => write_value(out, value, &format!("{indent}  ")),
                GroupValue::Mapping { rows, .. } => {
                    for (key, value) in rows {
                        out.push('\n');
                        out.push_str(indent);
                        out.push_str("  ");
                        out.push_str(&crate::yaml::scalar(key));
                        out.push(':');
                        write_value(out, value, &format!("{indent}    "));
                    }
                }
            }
        }
        Ok(())
    }
}
fn write_value(out: &mut String, value: &str, indent: &str) {
    if value.is_empty() {
        out.push_str(" {}");
    } else if let Some((tag, body)) = crate::yaml::tagged_block(value) {
        out.push(' ');
        out.push_str(tag);
        out.push('\n');
        crate::yaml::Indented::new(out, indent).push_str(body);
    } else if crate::yaml::inline_scalar_rendering(value).is_some() {
        out.push(' ');
        out.push_str(value);
    } else {
        out.push('\n');
        crate::yaml::Indented::new(out, indent).push_str(value);
    }
}
