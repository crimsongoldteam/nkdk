//! Full YAML storage is reserved for exceptional XML preservation envelopes.
use super::{Node, Scalar, visit_nodes};
use crate::{Position, Result, RuntimeDiagnostic};
pub(crate) enum Kind {
    Scalar(Scalar),
    Mapping(Vec<(Value, Value)>),
    Sequence(Vec<Value>),
}
pub(crate) struct Value {
    pub kind: Kind,
    pub tag: Option<String>,
}
impl Value {
    pub fn text(text: &str) -> Self {
        Self {
            kind: Kind::Scalar(Scalar {
                text: text.into(),
                plain: false,
                position: Position::default(),
            }),
            tag: None,
        }
    }
    pub fn null() -> Self {
        Self {
            kind: Kind::Scalar(Scalar {
                text: String::new(),
                plain: true,
                position: Position::default(),
            }),
            tag: None,
        }
    }
    pub fn mapping(entries: Vec<(Self, Self)>) -> Self {
        Self {
            kind: Kind::Mapping(entries),
            tag: None,
        }
    }
    pub fn key(&self) -> Result<&str> {
        let Kind::Scalar(value) = &self.kind else {
            return Err(invalid("Expected a scalar mapping key"));
        };
        if value.plain
            && !value.text.is_empty()
            && !matches!(
                yaml_rust2::Yaml::from_str(&value.text),
                yaml_rust2::Yaml::String(_)
            )
        {
            return Err(invalid("Expected a text mapping key"));
        }
        Ok(&value.text)
    }
    fn inline(&self) -> Option<String> {
        let text = match &self.kind {
            Kind::Scalar(value)
                if value.plain
                    && !matches!(
                        yaml_rust2::Yaml::from_str(&value.text),
                        yaml_rust2::Yaml::String(_)
                    ) =>
            {
                value.text.clone()
            }
            Kind::Scalar(value) => super::scalar(&value.text),
            Kind::Mapping(entries) if entries.is_empty() => "{}".into(),
            Kind::Sequence(entries) if entries.is_empty() => "[]".into(),
            _ => return None,
        };
        Some(match &self.tag {
            Some(tag) if text.is_empty() => tag.clone(),
            Some(tag) => format!("{tag} {text}"),
            None => text,
        })
    }
    fn block(&self, indent: usize) -> Result<String> {
        let pad = " ".repeat(indent);
        Ok(match &self.kind {
            Kind::Mapping(entries) => entries
                .iter()
                .map(|(key, value)| {
                    let key = key
                        .inline()
                        .ok_or_else(|| invalid("Complex YAML keys are not supported"))?;
                    if let Some(value) = value.inline() {
                        Ok(if value.is_empty() {
                            format!("{pad}{key}:")
                        } else {
                            format!("{pad}{key}: {value}")
                        })
                    } else {
                        let tag = value
                            .tag
                            .as_ref()
                            .map_or(String::new(), |tag| format!(" {tag}"));
                        Ok(format!("{pad}{key}:{tag}\n{}", value.block(indent + 2)?))
                    }
                })
                .collect::<Result<Vec<_>>>()?
                .join("\n"),
            Kind::Sequence(values) => values
                .iter()
                .map(|value| {
                    if let Some(value) = value.inline() {
                        Ok(if value.is_empty() {
                            format!("{pad}-")
                        } else {
                            format!("{pad}- {value}")
                        })
                    } else if let Some(tag) = &value.tag {
                        Ok(format!("{pad}- {tag}\n{}", value.block(indent + 2)?))
                    } else {
                        let block = value.block(indent + 2)?;
                        let (first, rest) = block.split_once('\n').unwrap_or((&block, ""));
                        Ok(if rest.is_empty() {
                            format!("{pad}- {}", first.trim_start())
                        } else {
                            format!("{pad}- {}\n{rest}", first.trim_start())
                        })
                    }
                })
                .collect::<Result<Vec<_>>>()?
                .join("\n"),
            Kind::Scalar(_) => return Err(invalid("Expected a block value")),
        })
    }
    pub fn render(&self) -> Result<Vec<u8>> {
        let text = if let Some(value) = self.inline() {
            value
        } else if let Some(tag) = &self.tag {
            format!("{tag}\n{}", self.block(0)?)
        } else {
            self.block(0)?
        };
        Ok(text.into_bytes())
    }
    pub fn document(&self) -> Result<Vec<u8>> {
        if self.tag.is_none() && matches!(&self.kind, Kind::Mapping(entries) if entries.is_empty())
        {
            Ok(Vec::new())
        } else {
            self.render()
        }
    }
}
fn invalid(message: &str) -> RuntimeDiagnostic {
    RuntimeDiagnostic::new("yaml.preservation-envelope", message)
}
enum Frame {
    Mapping(Vec<(Value, Value)>, Option<Value>, Option<String>),
    Sequence(Vec<Value>, Option<String>),
}
fn attach(stack: &mut [Frame], root: &mut Option<Value>, value: Value) -> Result<()> {
    match stack.last_mut() {
        Some(Frame::Mapping(entries, key, _)) => match key.take() {
            Some(key) => entries.push((key, value)),
            None => {
                if !matches!(value.kind, Kind::Scalar(_)) {
                    return Err(invalid("Complex YAML keys are not supported"));
                }
                *key = Some(value);
            }
        },
        Some(Frame::Sequence(values, _)) => values.push(value),
        None => {
            if root.is_some() {
                return Err(invalid("Expected one YAML document"));
            }
            *root = Some(value);
        }
    }
    Ok(())
}
pub(crate) fn parse(source: &[u8]) -> Result<Value> {
    if source.is_empty() {
        return Ok(Value::mapping(Vec::new()));
    }
    let mut stack = Vec::new();
    let mut root = None;
    visit_nodes(source, |node, _| {
        match node {
            Node::MappingStart(tag) => stack.push(Frame::Mapping(Vec::new(), None, tag)),
            Node::SequenceStart(tag) => stack.push(Frame::Sequence(Vec::new(), tag)),
            Node::MappingEnd => {
                let Some(Frame::Mapping(entries, None, tag)) = stack.pop() else {
                    return Err(invalid("Incomplete mapping"));
                };
                attach(
                    &mut stack,
                    &mut root,
                    Value {
                        kind: Kind::Mapping(entries),
                        tag,
                    },
                )?;
            }
            Node::SequenceEnd => {
                let Some(Frame::Sequence(values, tag)) = stack.pop() else {
                    return Err(invalid("Incomplete sequence"));
                };
                attach(
                    &mut stack,
                    &mut root,
                    Value {
                        kind: Kind::Sequence(values),
                        tag,
                    },
                )?;
            }
            Node::Scalar(value, tag) => attach(
                &mut stack,
                &mut root,
                Value {
                    kind: Kind::Scalar(value),
                    tag,
                },
            )?,
        }
        Ok(())
    })?;
    root.ok_or_else(|| invalid("Missing YAML document"))
}
