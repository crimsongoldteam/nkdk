//! A subtree is materialized only on the exceptional preservation path.
mod patch;
mod read;
use super::{Attribute, Name, Token, is_whitespace, matches, visit};
use crate::{Result, RuntimeDiagnostic};
pub use patch::Patch;

pub struct Tree {
    name: Name,
    attributes: Vec<Attribute>,
    text: String,
    children: Vec<Tree>,
}
#[derive(Clone, PartialEq, Eq)]
enum Payload {
    Null,
    Text(String),
    Mapping(Vec<(String, Payload)>),
    Sequence(Vec<Payload>),
}
fn failure(message: &str) -> RuntimeDiagnostic {
    RuntimeDiagnostic::new("xml.preservation-shape", message)
}
fn qualified(name: &Name, namespaces: &[(&str, &str)]) -> Result<String> {
    if name.namespace.is_empty() {
        return Ok(name.local.clone());
    }
    let Some(prefix) = namespaces
        .iter()
        .find(|(_, uri)| *uri == name.namespace)
        .map(|(prefix, _)| *prefix)
    else {
        return Ok(format!("{{{}}}{}", name.namespace, name.local));
    };
    if prefix.is_empty() {
        return Err(failure(
            "Preserved qualified names require a nonempty prefix",
        ));
    }
    Ok(format!("{prefix}:{}", name.local))
}
impl Tree {
    /// Register names from an exceptional subtree without a global namespace table.
    pub fn collect_namespaces<'a>(&'a self, namespaces: &mut Vec<&'a str>) {
        let mut register = |name: &'a Name| {
            if !name.namespace.is_empty() && !namespaces.contains(&name.namespace.as_str()) {
                namespaces.push(&name.namespace);
            }
        };
        register(&self.name);
        for attribute in &self.attributes {
            register(&attribute.name);
            if let Some(name) = &attribute.qname {
                register(name);
            }
        }
        for child in &self.children {
            child.collect_namespaces(namespaces);
        }
    }
    pub fn from_payload_yaml(
        source: &[u8],
        root: Name,
        namespaces: &[(&str, &str)],
        qname_attributes: &[(&str, &str)],
    ) -> Result<Self> {
        read::restore(source, root, namespaces, qname_attributes)
    }
    pub fn capture(source: &[u8], target: &[(&str, &str)]) -> Result<Option<Self>> {
        if target.is_empty() {
            return Err(failure("A preservation boundary must name an element"));
        }
        let mut stack: Vec<Self> = Vec::new();
        let mut result = None;
        visit(source, |path, token| {
            if path.len() < target.len() || !matches(&path[..target.len()], target) {
                return Ok(());
            }
            match token {
                Token::Start(_) => {
                    if path.len() == target.len() && result.is_some() {
                        return Err(failure("Preservation boundary has multiple occurrences"));
                    }
                    stack.push(Self {
                        name: path.last().expect("element path").clone(),
                        attributes: Vec::new(),
                        text: String::new(),
                        children: Vec::new(),
                    });
                }
                Token::Attribute(attribute) => stack
                    .last_mut()
                    .expect("opened element")
                    .attributes
                    .push(attribute),
                Token::Text(text) => stack
                    .last_mut()
                    .expect("opened element")
                    .text
                    .push_str(text),
                Token::End => {
                    let mut node = stack.pop().expect("opened element");
                    if !node.children.is_empty() {
                        if !is_whitespace(&node.text) {
                            return Err(failure(
                                "Mixed content requires an explicit ordered text representation",
                            ));
                        }
                        node.text.clear();
                    }
                    if let Some(parent) = stack.last_mut() {
                        parent.children.push(node);
                    } else {
                        result = Some(node);
                    }
                }
            }
            Ok(())
        })?;
        Ok(result)
    }
    pub fn write_at<'a>(
        &'a self,
        writer: &mut super::Writer<'a>,
        parent: &[(&'a str, &'a str)],
        qname_attributes: &[(&str, &str)],
    ) -> Result<()> {
        let mut path = parent.to_vec();
        self.write_node(writer, &mut path, qname_attributes)
    }
    fn write_node<'a>(
        &'a self,
        writer: &mut super::Writer<'a>,
        path: &mut Vec<(&'a str, &'a str)>,
        qname_attributes: &[(&str, &str)],
    ) -> Result<()> {
        let registered = |name: &Name| {
            name.namespace.is_empty() || writer.namespaces.contains(&name.namespace.as_str())
        };
        if !registered(&self.name) {
            return Err(failure(
                "Preserved element namespace is not registered with the writer",
            ));
        }
        let mut attributes = Vec::new();
        for attribute in &self.attributes {
            if !registered(&attribute.name) {
                return Err(failure(
                    "Preserved attribute namespace is not registered with the writer",
                ));
            }
            let value = if qname_attributes.iter().any(|(uri, local)| {
                *uri == attribute.name.namespace && *local == attribute.name.local
            }) {
                let name = attribute
                    .qname
                    .as_ref()
                    .ok_or_else(|| failure("Declared QName attribute cannot be resolved"))?;
                if !registered(name) {
                    return Err(failure(
                        "Preserved QName namespace is not registered with the writer",
                    ));
                }
                super::AttributeValue::QName((&name.namespace, &name.local))
            } else {
                super::AttributeValue::Text(&attribute.text)
            };
            attributes.push(super::WriteAttribute {
                name: (&attribute.name.namespace, &attribute.name.local),
                value,
            });
        }
        path.push((&self.name.namespace, &self.name.local));
        writer.container_with_attributes(path, &attributes);
        if self.children.is_empty() {
            super::validate_text(&self.text)?;
            writer.output.push_str(&super::escape(&self.text));
        } else {
            for child in &self.children {
                child.write_node(writer, path, qname_attributes)?;
            }
        }
        writer.end_container();
        path.pop();
        Ok(())
    }
    fn payload(
        &self,
        namespaces: &[(&str, &str)],
        qname_attributes: &[(&str, &str)],
    ) -> Result<Payload> {
        if self.attributes.is_empty() && self.children.is_empty() {
            return Ok(if self.text.is_empty() {
                Payload::Null
            } else {
                Payload::Text(self.text.clone())
            });
        }
        let mut fields = Vec::new();
        for attribute in &self.attributes {
            let value = if qname_attributes.iter().any(|(uri, local)| {
                *uri == attribute.name.namespace && *local == attribute.name.local
            }) {
                qualified(
                    attribute
                        .qname
                        .as_ref()
                        .ok_or_else(|| failure("Declared QName attribute cannot be resolved"))?,
                    namespaces,
                )?
            } else {
                attribute.text.clone()
            };
            fields.push((
                format!("_{}", qualified(&attribute.name, namespaces)?),
                Payload::Text(value),
            ));
        }
        if !self.text.is_empty() {
            fields.push(("#text".into(), Payload::Text(self.text.clone())));
        }
        let mut groups: Vec<Vec<&Tree>> = Vec::new();
        let mut indices = std::collections::BTreeMap::new();
        for child in &self.children {
            let index = *indices.entry(&child.name).or_insert_with(|| {
                groups.push(Vec::new());
                groups.len() - 1
            });
            groups[index].push(child);
        }
        let needs_order = !groups
            .iter()
            .flatten()
            .map(|child| &child.name)
            .eq(self.children.iter().map(|child| &child.name));
        for group in groups {
            let name = qualified(&group[0].name, namespaces)?;
            let value = if group.len() == 1 {
                group[0].payload(namespaces, qname_attributes)?
            } else {
                Payload::Sequence(
                    group
                        .iter()
                        .map(|child| child.payload(namespaces, qname_attributes))
                        .collect::<Result<_>>()?,
                )
            };
            fields.push((name, value));
        }
        if needs_order {
            fields.push((
                "#order".into(),
                Payload::Sequence(
                    self.children
                        .iter()
                        .map(|child| qualified(&child.name, namespaces).map(Payload::Text))
                        .collect::<Result<_>>()?,
                ),
            ));
        }
        Ok(Payload::Mapping(fields))
    }
    pub fn payload_yaml(
        &self,
        namespaces: &[(&str, &str)],
        qname_attributes: &[(&str, &str)],
    ) -> Result<String> {
        Ok(render(&self.payload(namespaces, qname_attributes)?, 0))
    }
}
fn render(value: &Payload, indent: usize) -> String {
    let padding = " ".repeat(indent);
    match value {
        Payload::Null => String::new(),
        Payload::Text(text) => crate::yaml::scalar(text),
        Payload::Mapping(fields) => fields
            .iter()
            .map(|(key, value)| {
                let key = crate::yaml::scalar(key);
                match value {
                    Payload::Null if key.starts_with('_') => format!("{padding}{key}: null"),
                    Payload::Null => format!("{padding}{key}:"),
                    Payload::Text(_) => format!("{padding}{key}: {}", render(value, 0)),
                    _ => format!("{padding}{key}:\n{}", render(value, indent + 2)),
                }
            })
            .collect::<Vec<_>>()
            .join("\n"),
        Payload::Sequence(values) => values
            .iter()
            .map(|value| match value {
                Payload::Null => format!("{padding}-"),
                Payload::Text(_) => format!("{padding}- {}", render(value, 0)),
                _ => {
                    let content = render(value, indent + 2);
                    let (first, rest) = content.split_once('\n').unwrap_or((&content, ""));
                    if rest.is_empty() {
                        format!("{padding}- {}", first.trim_start())
                    } else {
                        format!("{padding}- {}\n{rest}", first.trim_start())
                    }
                }
            })
            .collect::<Vec<_>>()
            .join("\n"),
    }
}
