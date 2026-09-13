//! Materialize property documents only while recovering an exceptional envelope.
use super::document::{self, Kind, Value};
use crate::{Result, RuntimeDiagnostic};

pub fn split_properties(source: &[u8], groups: &[&[&str]]) -> Result<Vec<Vec<u8>>> {
    let value = document::parse(if source.is_empty() { b"{}" } else { source })?;
    Ok(split_value(value, groups)?.parts)
}

pub struct SplitProperties {
    pub parts: Vec<Vec<u8>>,
    pub present: Vec<bool>,
}
fn split_value(value: Value, groups: &[&[&str]]) -> Result<SplitProperties> {
    let Kind::Mapping(entries) = value.kind else {
        return Err(failure("Expected an owner mapping"));
    };
    if value.tag.is_some() {
        return Err(failure("Expected an untagged owner mapping"));
    }
    let mut result: Vec<Vec<(Value, Value)>> = (0..groups.len()).map(|_| Vec::new()).collect();
    let mut seen = std::collections::HashSet::new();
    for (key, value) in entries {
        let name = key.key()?;
        if key.tag.is_some() || !seen.insert(name.to_owned()) {
            return Err(failure("Repeated or annotated owner property"));
        }
        let mut slots = groups
            .iter()
            .enumerate()
            .filter(|(_, keys)| keys.contains(&name));
        let Some((slot, _)) = slots.next() else {
            return Err(failure("Undeclared owner property").field(name));
        };
        if slots.next().is_some() {
            return Err(failure("Ambiguous owner property").field(name));
        }
        result[slot].push((key, value));
    }
    let present = result.iter().map(|entries| !entries.is_empty()).collect();
    let parts = result
        .into_iter()
        .map(|entries| Value::mapping(entries).document())
        .collect::<Result<_>>()?;
    Ok(SplitProperties { parts, present })
}
fn failure(message: &str) -> RuntimeDiagnostic {
    RuntimeDiagnostic::new("yaml.owner-property", message)
}

/// Recovery path for annotated fields inside a record. Ordinary reads use events.
pub fn split_record_properties(
    source: &[u8],
    property: &str,
    groups: &[&[&str]],
) -> Result<SplitProperties> {
    let value = document::parse(if source.is_empty() { b"{}" } else { source })?;
    let Kind::Mapping(mut entries) = value.kind else {
        return Err(failure("Expected a record mapping"));
    };
    if value.tag.is_some() || entries.len() > 1 {
        return Err(failure("Expected one record property"));
    }
    let child = if let Some((key, child)) = entries.pop() {
        if key.tag.is_some() || key.key()? != property {
            return Err(failure("Unknown record property"));
        }
        child
    } else {
        Value::mapping(Vec::new())
    };
    split_value(child, groups)
}
