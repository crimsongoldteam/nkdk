use super::{Node, Scalar, visit_nodes};
use crate::{Result, RuntimeDiagnostic};
use std::collections::HashSet;

/// Visit a nested scalar record directly in the original YAML event stream.
pub fn visit_record_scalars(
    source: &[u8],
    property: &str,
    mut consume: impl FnMut(String, Scalar, Option<String>) -> Result<()>,
) -> Result<bool> {
    let mut depth = 0;
    let mut selected = false;
    let mut present = false;
    let mut key = None;
    let mut keys = HashSet::new();
    visit_nodes(if source.is_empty() { b"{}" } else { source }, |node, _| {
        match node {
            Node::MappingStart(None) if depth == 0 => depth = 1,
            Node::Scalar(value, None) if depth == 1 && !selected && !present => {
                if value.into_text()? != property {
                    return Err(failure("Unknown record property"));
                }
                selected = true;
            }
            Node::MappingStart(None) if depth == 1 && selected && !present => {
                present = true;
                depth = 2;
            }
            Node::Scalar(value, tag) if depth == 2 => {
                if let Some(name) = key.take() {
                    consume(name, value, tag)?;
                } else {
                    if tag.is_some() {
                        return Err(failure("Annotated record key"));
                    }
                    let name = value.into_text()?;
                    if !keys.insert(name.clone()) {
                        return Err(failure("Repeated record field"));
                    }
                    key = Some(name);
                }
            }
            Node::MappingEnd if depth == 2 && key.is_none() => depth = 1,
            Node::MappingEnd if depth == 1 && (!selected || present) => depth = 0,
            _ => return Err(failure("Expected one nested scalar record")),
        }
        Ok(())
    })?;
    if depth != 0 {
        return Err(failure("Incomplete record"));
    }
    Ok(present)
}
fn failure(message: &str) -> RuntimeDiagnostic {
    RuntimeDiagnostic::new("yaml.record-form", message)
}
