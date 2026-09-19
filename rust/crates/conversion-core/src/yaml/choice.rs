use super::{Node, Scalar};
use crate::{Position, Result, RuntimeDiagnostic};

#[derive(Clone, Copy)]
pub enum ChoiceSelector {
    Sequence {
        variant: usize,
    },
    Mapping {
        variant: usize,
        key: &'static str,
        value: Option<&'static str>,
    },
}

pub enum ChoiceSelection {
    Pending,
    Selected {
        variant: usize,
        events: Vec<(Node, Position)>,
    },
}

pub struct ChoiceReader {
    selectors: &'static [ChoiceSelector],
    events: Vec<(Node, Position)>,
    depth: usize,
    expecting_key: bool,
    key: Option<String>,
}

impl ChoiceReader {
    pub fn new(selectors: &'static [ChoiceSelector]) -> Self {
        Self {
            selectors,
            events: Vec::new(),
            depth: 0,
            expecting_key: false,
            key: None,
        }
    }

    pub fn consume(&mut self, node: Node, position: Position) -> Result<ChoiceSelection> {
        let selected = match (&node, self.depth) {
            (Node::SequenceStart(_), 0) => {
                self.selectors.iter().find_map(|selector| match selector {
                    ChoiceSelector::Sequence { variant } => Some(*variant),
                    ChoiceSelector::Mapping { .. } => None,
                })
            }
            (Node::MappingStart(None), 0) => {
                self.depth = 1;
                self.expecting_key = true;
                None
            }
            (Node::Scalar(value, None), 1) if self.expecting_key => {
                self.key = Some(value.mapping_key_ref()?.to_owned());
                self.expecting_key = false;
                None
            }
            (value, 1) if !self.expecting_key => {
                let key = self.key.take().expect("mapping key");
                let literal = match value {
                    Node::Scalar(value, None) => value.plain_text(),
                    _ => None,
                };
                let exact = self.selectors.iter().find_map(|selector| match selector {
                    ChoiceSelector::Mapping {
                        variant,
                        key: candidate,
                        value: Some(expected),
                    } if *candidate == key && literal == Some(*expected) => Some(*variant),
                    _ => None,
                });
                let fallback = self.selectors.iter().find_map(|selector| match selector {
                    ChoiceSelector::Mapping {
                        variant,
                        key: candidate,
                        value: None,
                    } if *candidate == key => Some(*variant),
                    _ => None,
                });
                if matches!(value, Node::MappingStart(_) | Node::SequenceStart(_)) {
                    self.depth = 2;
                } else {
                    self.expecting_key = true;
                }
                exact.or(fallback)
            }
            (Node::MappingEnd, 1) if self.expecting_key => {
                self.depth = 0;
                None
            }
            (node, depth) if depth >= 2 => {
                node.advance_depth(&mut self.depth)?;
                if self.depth == 1 {
                    self.expecting_key = true;
                }
                None
            }
            _ => {
                return Err(RuntimeDiagnostic::new(
                    "yaml.choice-form",
                    "Expected a declared mapping or sequence choice form",
                ));
            }
        };
        self.events.push((node, position));
        Ok(if let Some(variant) = selected {
            ChoiceSelection::Selected {
                variant,
                events: std::mem::take(&mut self.events),
            }
        } else {
            ChoiceSelection::Pending
        })
    }

    pub fn finish(self) -> Result<()> {
        Err(RuntimeDiagnostic::new(
            "yaml.choice-form",
            "No declared structured choice form matched",
        ))
    }
}

impl Scalar {
    fn mapping_key_ref(&self) -> Result<&str> {
        if self.text.is_empty()
            || !self.plain
            || matches!(
                yaml_rust2::Yaml::from_str(&self.text),
                yaml_rust2::Yaml::String(_)
            )
        {
            Ok(&self.text)
        } else {
            Err(RuntimeDiagnostic::new(
                "yaml.expected-text",
                "Expected a textual mapping key",
            ))
        }
    }

    fn plain_text(&self) -> Option<&str> {
        (!self.plain
            || matches!(
                yaml_rust2::Yaml::from_str(&self.text),
                yaml_rust2::Yaml::String(_)
            ))
        .then_some(self.text.as_str())
    }
}
