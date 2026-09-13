//! A subtree is materialized only on the exceptional preservation path.
mod patch;
mod read;
use super::{Attribute, Name, Token, is_whitespace, matches, visit_scoped};
use crate::{Result, RuntimeDiagnostic};
pub use patch::Patch;

pub struct Tree {
    name: Name,
    attributes: Vec<Attribute>,
    text: String,
    text_qname: Option<Name>,
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
    pub fn qname_scalar(name: Name, value: Name) -> Result<Self> {
        super::validate_qname((&value.namespace, &value.local))?;
        let mut node = Self::scalar(name, "", &[]);
        node.text_qname = Some(value);
        Ok(node)
    }
    /// Materialize the canonical scalar only while applying an XML difference.
    pub fn scalar<'b, 'c: 'b>(
        name: Name,
        text: &str,
        attributes: impl IntoIterator<Item = &'b super::WriteAttribute<'c>>,
    ) -> Self {
        Self {
            name,
            text: text.into(),
            text_qname: None,
            children: Vec::new(),
            attributes: attributes
                .into_iter()
                .map(|attribute| {
                    let (text, qname) = match attribute.value {
                        super::AttributeValue::Text(text) => (text.into(), None),
                        super::AttributeValue::QName((namespace, local)) => (
                            format!("{{{namespace}}}{local}"),
                            Some(Name {
                                namespace: namespace.into(),
                                local: local.into(),
                            }),
                        ),
                    };
                    Attribute {
                        name: Name {
                            namespace: attribute.name.0.into(),
                            local: attribute.name.1.into(),
                        },
                        text,
                        qname,
                    }
                })
                .collect(),
        }
    }
    /// Register names from an exceptional subtree without a global namespace table.
    pub fn collect_namespaces<'a>(&'a self, namespaces: &mut Vec<&'a str>) {
        let mut register = |name: &'a Name| {
            if !name.namespace.is_empty() && !namespaces.contains(&name.namespace.as_str()) {
                namespaces.push(&name.namespace);
            }
        };
        register(&self.name);
        if let Some(name) = &self.text_qname {
            register(name);
        }
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
        Self::capture_with_qnames(source, target, |_| false)
    }
    /// Project one child at a time from an already captured exceptional subtree.
    /// Ancestor attributes and other siblings remain owned by the parent proof.
    pub fn visit_child_documents(
        &self,
        parent: &[(&str, &str)],
        member: (&str, &str),
        qnames: &[(&str, &str)],
        mut visit: impl FnMut(&[u8]) -> Result<()>,
    ) -> Result<()> {
        if parent.last().copied() != Some((self.name.namespace.as_str(), self.name.local.as_str()))
        {
            return Err(failure("Child projection must retain its parent path"));
        }
        for child in &self.children {
            if (child.name.namespace.as_str(), child.name.local.as_str()) != member {
                continue;
            }
            let mut namespaces: Vec<_> = parent
                .iter()
                .map(|(uri, _)| *uri)
                .filter(|uri| !uri.is_empty())
                .collect();
            child.collect_namespaces(&mut namespaces);
            let mut writer = super::Writer::new(&namespaces);
            child.write_at(&mut writer, parent, qnames)?;
            visit(&writer.finish())?;
        }
        Ok(())
    }
    pub fn capture_with_qnames(
        source: &[u8],
        target: &[(&str, &str)],
        qname_text: impl Fn(&[Name]) -> bool,
    ) -> Result<Option<Self>> {
        Self::capture_selected(source, target, None, qname_text)
    }
    /// Select a particular occurrence only on the exceptional preservation path.
    pub fn capture_at(
        source: &[u8],
        target: &[(&str, &str)],
        offset: usize,
    ) -> Result<Option<Self>> {
        Self::capture_selected(source, target, Some(offset), |_| false)
    }
    fn capture_selected(
        source: &[u8],
        target: &[(&str, &str)],
        offset: Option<usize>,
        qname_text: impl Fn(&[Name]) -> bool,
    ) -> Result<Option<Self>> {
        if target.is_empty() {
            return Err(failure("A preservation boundary must name an element"));
        }
        let mut stack: Vec<Self> = Vec::new();
        let mut result = None;
        let mut selected = false;
        visit_scoped(source, |path, token, scope| {
            if path.len() < target.len() || !matches(&path[..target.len()], target) {
                return Ok(());
            }
            if path.len() == target.len()
                && let Token::Start(position) = &token
            {
                selected = offset.is_none_or(|offset| offset == *position);
            }
            if !selected {
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
                        text_qname: None,
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
                    } else if qname_text(path)
                        && let Ok((namespace, local)) = scope.resolve_qname(&node.text)
                    {
                        node.text_qname = Some(Name {
                            namespace: namespace.into(),
                            local: local.into(),
                        });
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
    /// Select owned siblings only on the exceptional preservation path.
    pub(super) fn retain_children(&mut self, names: &[(&str, &str)]) {
        self.children.retain(|child| {
            names
                .iter()
                .any(|name| child.name.namespace == name.0 && child.name.local == name.1)
        });
        self.attributes.clear();
        self.text.clear();
        self.text_qname = None;
    }
    pub(super) fn retain_owned_path(&mut self, path: &[(&str, &str)]) {
        self.retain_children(&path[..1]);
        if path.len() > 1 {
            for child in &mut self.children {
                child.retain_owned_path(&path[1..]);
            }
        }
    }
    /// Write only owned descendants, leaving shared ancestors open for siblings.
    pub fn write_owned_at<'a>(
        &'a self,
        writer: &mut super::Writer<'a>,
        parent: &[(&'a str, &'a str)],
        route: &[(&str, &str)],
        qnames: &[(&str, &str)],
    ) -> Result<()> {
        let Some((head, tail)) = route.split_first() else {
            return Err(failure("A shared collection requires a member route"));
        };
        if !self.attributes.is_empty()
            || !self.text.is_empty()
            || self.text_qname.is_some()
            || self
                .children
                .iter()
                .any(|child| child.name.namespace != head.0 || child.name.local != head.1)
        {
            return Err(failure(
                "A collection patch cannot change a shared ancestor or sibling",
            ));
        }
        for child in &self.children {
            if tail.is_empty() {
                child.write_at(writer, parent, qnames)?;
            } else {
                let mut path = parent.to_vec();
                path.push((&child.name.namespace, &child.name.local));
                if child.children.is_empty() {
                    writer.ensure_container(&path);
                }
                child.write_owned_at(writer, &path, tail, qnames)?;
            }
        }
        Ok(())
    }
    pub(super) fn retain_record(&mut self, children: &[(&str, &str)], attributes: &[(&str, &str)]) {
        let mut saved = std::mem::take(&mut self.attributes);
        saved.retain(|attribute| {
            attributes
                .iter()
                .any(|name| attribute.name.namespace == name.0 && attribute.name.local == name.1)
        });
        self.retain_children(children);
        self.attributes = saved;
    }
    /// Append an unwrapped collection without reopening its shared container.
    pub fn write_children_at<'a>(
        &'a self,
        writer: &mut super::Writer<'a>,
        parent: &[(&'a str, &'a str)],
        member: (&str, &str),
        qname_attributes: &[(&str, &str)],
    ) -> Result<()> {
        self.write_owned_at(writer, parent, &[member], qname_attributes)?;
        writer.ensure_container(parent);
        Ok(())
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
        let registered = |name: &Name| writer.has_namespace(&name.namespace);
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
            if let Some(name) = &self.text_qname {
                if !writer.has_namespace(&name.namespace) {
                    return Err(failure(
                        "Preserved QName namespace is not registered with the writer",
                    ));
                }
                writer
                    .output
                    .push_str(&writer.name((&name.namespace, &name.local)));
            } else {
                super::validate_text(&self.text)?;
                writer.output.push_str(&super::escape(&self.text));
            }
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
        if self.attributes.is_empty() && self.children.is_empty() && self.text_qname.is_none() {
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
        if let Some(name) = &self.text_qname {
            fields.push((
                "#qname".into(),
                Payload::Sequence(vec![
                    Payload::Text(name.namespace.clone()),
                    Payload::Text(name.local.clone()),
                ]),
            ));
        } else if !self.text.is_empty() {
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
    render_payload(value, indent, false)
}
fn render_payload(value: &Payload, indent: usize, patch: bool) -> String {
    let render = |value: &Payload, indent| render_payload(value, indent, patch);
    let padding = " ".repeat(indent);
    match value {
        Payload::Null => {
            if patch {
                "null".into()
            } else {
                String::new()
            }
        }
        Payload::Mapping(fields) if patch && fields.is_empty() => "{}".into(),
        Payload::Sequence(values) if patch && values.is_empty() => "[]".into(),
        Payload::Text(text) => crate::yaml::scalar(text),
        Payload::Mapping(fields) => fields
            .iter()
            .map(|(key, value)| {
                let key = crate::yaml::scalar(key);
                match value {
                    Payload::Null if key.starts_with('_') => {
                        format!("{padding}{key}: null")
                    }
                    Payload::Null => format!("{padding}{key}:"),
                    Payload::Mapping(fields) if patch && fields.is_empty() => {
                        format!("{padding}{key}: {{}}")
                    }
                    Payload::Sequence(values) if patch && values.is_empty() => {
                        format!("{padding}{key}: []")
                    }
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
