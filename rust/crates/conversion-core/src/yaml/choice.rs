use super::{Node, Scalar};
use crate::{Position, Result, RuntimeDiagnostic};

#[derive(Clone, Copy)]
pub enum ChoiceSelector {
    Tagged {
        variant: usize,
        tag: &'static str,
    },
    Sequence {
        variant: usize,
    },
    Mapping {
        variant: usize,
        key: &'static str,
        value: Option<&'static str>,
    },
    MappingDynamic {
        key: &'static str,
        select: fn(&str) -> Result<Option<usize>>,
    },
    MappingAny {
        variant: usize,
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
    mapping_fallback: Option<usize>,
    events: Vec<(Node, Position)>,
    buffer_events: bool,
    depth: usize,
    expecting_key: bool,
    key: Option<&'static str>,
}

impl ChoiceReader {
    pub fn new(selectors: &'static [ChoiceSelector]) -> Self {
        Self {
            selectors,
            mapping_fallback: None,
            events: Vec::new(),
            buffer_events: true,
            depth: 0,
            expecting_key: false,
            key: None,
        }
    }

    pub fn with_mapping_fallback(mut self, variant: usize) -> Self {
        self.mapping_fallback = Some(variant);
        self
    }

    /// Use when the caller already retains the complete event stream.
    pub fn without_event_buffer(mut self) -> Self {
        self.buffer_events = false;
        self
    }

    pub fn consume(&mut self, node: Node, position: Position) -> Result<ChoiceSelection> {
        if self.depth == 0 {
            let tag = match &node {
                Node::Scalar(_, tag) | Node::MappingStart(tag) | Node::SequenceStart(tag) => {
                    tag.as_deref()
                }
                _ => None,
            };
            if let Some(tag) = tag {
                let variant = self
                    .selectors
                    .iter()
                    .find_map(|selector| match selector {
                        ChoiceSelector::Tagged {
                            variant,
                            tag: expected,
                        } if *expected == tag => Some(*variant),
                        _ => None,
                    })
                    .ok_or_else(|| {
                        RuntimeDiagnostic::new(
                            "yaml.choice-form",
                            "No declared semantic tag matched",
                        )
                    })?;
                return Ok(ChoiceSelection::Selected {
                    variant,
                    events: if self.buffer_events {
                        vec![(node, position)]
                    } else {
                        Vec::new()
                    },
                });
            }
        }
        let selected = match (&node, self.depth) {
            (Node::SequenceStart(_), 0) => {
                self.selectors.iter().find_map(|selector| match selector {
                    ChoiceSelector::Sequence { variant } => Some(*variant),
                    ChoiceSelector::Tagged { .. }
                    | ChoiceSelector::Mapping { .. }
                    | ChoiceSelector::MappingDynamic { .. }
                    | ChoiceSelector::MappingAny { .. } => None,
                })
            }
            (Node::MappingStart(None), 0) => {
                if let Some(variant) = self.selectors.iter().find_map(|selector| match selector {
                    ChoiceSelector::MappingAny { variant } => Some(*variant),
                    _ => None,
                }) {
                    self.depth = 1;
                    self.expecting_key = true;
                    if self.buffer_events {
                        self.events.push((node, position));
                    }
                    return Ok(ChoiceSelection::Selected {
                        variant,
                        events: std::mem::take(&mut self.events),
                    });
                }
                self.depth = 1;
                self.expecting_key = true;
                None
            }
            (Node::Scalar(value, None), 1) if self.expecting_key => {
                let key = value.mapping_key_ref()?;
                self.key = self.selectors.iter().find_map(|selector| match selector {
                    ChoiceSelector::Mapping { key: candidate, .. }
                    | ChoiceSelector::MappingDynamic { key: candidate, .. }
                        if *candidate == key =>
                    {
                        Some(*candidate)
                    }
                    _ => None,
                });
                self.expecting_key = false;
                None
            }
            (value, 1) if !self.expecting_key => {
                let key = self.key.take();
                let needs_literal = key.is_some()
                    && self.selectors.iter().any(|selector| match selector {
                        ChoiceSelector::Mapping {
                            key: candidate,
                            value: Some(_),
                            ..
                        }
                        | ChoiceSelector::MappingDynamic { key: candidate, .. } => {
                            Some(*candidate) == key
                        }
                        _ => false,
                    });
                let literal = if needs_literal {
                    match value {
                        Node::Scalar(value, _) => value.plain_text(),
                        _ => None,
                    }
                } else {
                    None
                };
                let exact = self.selectors.iter().find_map(|selector| match selector {
                    ChoiceSelector::Mapping {
                        variant,
                        key: candidate,
                        value: Some(expected),
                    } if Some(*candidate) == key && literal == Some(*expected) => Some(*variant),
                    _ => None,
                });
                let dynamic = self
                    .selectors
                    .iter()
                    .find_map(|selector| match selector {
                        ChoiceSelector::MappingDynamic {
                            key: candidate,
                            select,
                        } if Some(*candidate) == key => Some(select(literal.unwrap_or(""))),
                        _ => None,
                    })
                    .transpose()?
                    .flatten();
                let fallback = self.selectors.iter().find_map(|selector| match selector {
                    ChoiceSelector::Mapping {
                        variant,
                        key: candidate,
                        value: None,
                    } if Some(*candidate) == key => Some(*variant),
                    _ => None,
                });
                if matches!(value, Node::MappingStart(_) | Node::SequenceStart(_)) {
                    self.depth = 2;
                } else {
                    self.expecting_key = true;
                }
                exact.or(dynamic).or(fallback)
            }
            (Node::MappingEnd, 1) if self.expecting_key => {
                self.depth = 0;
                self.mapping_fallback
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
        if self.buffer_events {
            self.events.push((node, position));
        }
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
