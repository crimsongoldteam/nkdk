use super::{DocumentSource, Node, PropertyReader, Scalar, ScalarEntry, Source};
use crate::{Result, RuntimeDiagnostic};
use std::collections::HashSet;

/// Visit a nested scalar record directly in the original YAML event stream.
pub fn visit_record_scalars(
    source: &[u8],
    property: &str,
    consume: impl FnMut(String, Scalar, Option<String>) -> Result<()>,
) -> Result<bool> {
    visit_record_scalar_events(
        DocumentSource(if source.is_empty() { b"{}" } else { source }),
        property,
        consume,
    )
}
pub fn visit_record_scalar_events(
    source: impl Source,
    property: &str,
    mut consume: impl FnMut(String, Scalar, Option<String>) -> Result<()>,
) -> Result<bool> {
    let mut state = ScalarRecordReader::default();
    source.visit(|node, _| {
        if let Some(entry) = state.consume(node, property)? {
            consume(entry.key, entry.value, entry.tag)?;
        }
        Ok(())
    })?;
    state.finish()
}

/// One nested scalar record, fed directly from its parent's event stream.
#[derive(Default)]
pub struct ScalarRecordReader {
    property: PropertyReader,
    open: bool,
    key: Option<String>,
    keys: HashSet<String>,
}
impl ScalarRecordReader {
    pub fn consume(&mut self, node: Node, property: &str) -> Result<Option<ScalarEntry>> {
        let Some(node) = self.property.consume(node, property, "yaml.record-form")? else {
            return Ok(None);
        };
        match node {
            Node::MappingStart(None) if !self.open => self.open = true,
            Node::Scalar(value, tag) if self.open => {
                if let Some(key) = self.key.take() {
                    return Ok(Some(ScalarEntry { key, value, tag }));
                }
                if tag.is_some() {
                    return Err(failure("Annotated record key"));
                }
                let name = value.into_text()?;
                if !self.keys.insert(name.clone()) {
                    return Err(failure("Repeated record field"));
                }
                self.key = Some(name);
            }
            Node::MappingEnd if self.open && self.key.is_none() => self.open = false,
            _ => return Err(failure("Expected one nested scalar record")),
        }
        Ok(None)
    }
    pub fn finish(self) -> Result<bool> {
        let present = self.property.finish("yaml.record-form")?;
        if self.open {
            return Err(failure("Incomplete record"));
        }
        Ok(present)
    }
}

fn failure(message: &str) -> RuntimeDiagnostic {
    RuntimeDiagnostic::new("yaml.record-form", message)
}
