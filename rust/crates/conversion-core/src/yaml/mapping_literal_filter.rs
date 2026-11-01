use super::Node;
use crate::{Result, RuntimeDiagnostic};

/// Removes one declared mapping discriminator before a selected value is read.
/// The discriminator is checked here; the selected value sees only its own fields.
pub struct MappingLiteralFilter {
    depth: usize,
    target_depth: usize,
    key: &'static str,
    value: &'static str,
    expecting_key: bool,
    skipping_value: bool,
    seen: bool,
}

impl MappingLiteralFilter {
    pub fn new(target_depth: usize, key: &'static str, value: &'static str) -> Self {
        Self {
            depth: 0,
            target_depth,
            key,
            value,
            expecting_key: false,
            skipping_value: false,
            seen: false,
        }
    }

    pub fn consume(&mut self, node: Node) -> Result<Option<Node>> {
        if self.skipping_value {
            let Node::Scalar(value, None) = node else {
                return Err(RuntimeDiagnostic::new(
                    "yaml.choice-form",
                    "Choice discriminator must be a scalar",
                ));
            };
            if self.depth != self.target_depth || value.into_text()? != self.value {
                return Err(RuntimeDiagnostic::new(
                    "yaml.choice-form",
                    "Choice discriminator differs from the selected variant",
                ));
            }
            self.skipping_value = false;
            self.expecting_key = true;
            self.seen = true;
            return Ok(None);
        }
        if self.depth == self.target_depth {
            if self.expecting_key {
                if let Node::Scalar(key, None) = &node {
                    self.expecting_key = false;
                    if key.clone().into_mapping_key()? == self.key {
                        if self.seen {
                            return Err(RuntimeDiagnostic::new(
                                "yaml.choice-form",
                                "Repeated choice discriminator",
                            ));
                        }
                        self.skipping_value = true;
                        return Ok(None);
                    }
                }
            } else {
                self.expecting_key = true;
            }
        }
        match &node {
            Node::MappingStart(_) | Node::SequenceStart(_) => {
                self.depth += 1;
                if self.depth == self.target_depth {
                    self.expecting_key = true;
                }
            }
            Node::MappingEnd | Node::SequenceEnd => {
                self.depth = self.depth.checked_sub(1).ok_or_else(|| {
                    RuntimeDiagnostic::new("yaml.structure", "Unexpected closing node")
                })?;
            }
            Node::Scalar(..) => {}
        }
        Ok(Some(node))
    }

    pub fn finish(self) -> Result<()> {
        if self.seen && self.depth == 0 && !self.skipping_value {
            Ok(())
        } else {
            Err(RuntimeDiagnostic::new(
                "yaml.choice-form",
                "Missing choice discriminator",
            ))
        }
    }
}
