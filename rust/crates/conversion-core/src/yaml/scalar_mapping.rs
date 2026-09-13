use super::{Node, Scalar};
use crate::{Position, Result, RuntimeDiagnostic};
use std::collections::HashSet;

pub struct ScalarEntry {
    pub key: String,
    pub value: Scalar,
    pub tag: Option<String>,
}

/// State for one flat mapping; separate instances may receive interleaved events.
#[derive(Default)]
pub struct ScalarMapping {
    key: Option<String>,
    keys: HashSet<String>,
    opened: bool,
    closed: bool,
}
impl ScalarMapping {
    pub fn consume(&mut self, node: Node, position: Position) -> Result<Option<ScalarEntry>> {
        let result = match node {
            Node::MappingStart(None) if !self.opened => {
                self.opened = true;
                Ok(None)
            }
            Node::MappingEnd if self.opened && !self.closed && self.key.is_none() => {
                self.closed = true;
                Ok(None)
            }
            Node::Scalar(value, tag) if self.opened && !self.closed => {
                if let Some(key) = self.key.take() {
                    Ok(Some(ScalarEntry { key, value, tag }))
                } else if tag.is_some() {
                    Err(RuntimeDiagnostic::new(
                        "yaml.annotation",
                        "Unexpected key annotation",
                    ))
                } else {
                    let name = value.into_text()?;
                    if !self.keys.insert(name.clone()) {
                        Err(RuntimeDiagnostic::new(
                            "yaml.duplicate-key",
                            format!("Duplicate key: {name}"),
                        )
                        .field(name))
                    } else {
                        self.key = Some(name);
                        Ok(None)
                    }
                }
            }
            _ => Err(RuntimeDiagnostic::new(
                "yaml.unsupported-form",
                "Expected an untagged flat mapping",
            )),
        };
        result.map_err(|error| position.apply(&[], error))
    }
    pub fn finish(self) -> Result<()> {
        if self.closed {
            Ok(())
        } else {
            Err(RuntimeDiagnostic::new(
                "yaml.expected-mapping",
                "Expected one YAML mapping",
            ))
        }
    }
}
