use super::{Name, Payload, Result, Tree, failure};
use crate::yaml::Node;

enum Frame {
    Mapping(Vec<(String, Payload)>, Option<String>),
    Sequence(Vec<Payload>),
}
fn attach(stack: &mut [Frame], root: &mut Option<Payload>, value: Payload) -> Result<()> {
    match stack.last_mut() {
        Some(Frame::Mapping(fields, key)) => {
            let key = key
                .take()
                .ok_or_else(|| failure("Preserved mapping keys must be text"))?;
            if fields.iter().any(|(name, _)| *name == key) {
                return Err(failure("Repeated preserved mapping key"));
            }
            fields.push((key, value));
        }
        Some(Frame::Sequence(values)) => values.push(value),
        None => {
            if root.is_some() {
                return Err(failure("Expected one preservation payload"));
            }
            *root = Some(value);
        }
    }
    Ok(())
}
pub(super) fn parse(source: &[u8]) -> Result<Payload> {
    if source.is_empty() {
        return Ok(Payload::Null);
    }
    let mut stack = Vec::new();
    let mut root = None;
    crate::yaml::visit_nodes(source, |node, _| {
        match node {
            Node::MappingStart(None) => stack.push(Frame::Mapping(Vec::new(), None)),
            Node::SequenceStart(None) => stack.push(Frame::Sequence(Vec::new())),
            Node::MappingEnd => {
                let Some(Frame::Mapping(fields, None)) = stack.pop() else {
                    return Err(failure("Incomplete preserved mapping"));
                };
                attach(&mut stack, &mut root, Payload::Mapping(fields))?;
            }
            Node::SequenceEnd => {
                let Some(Frame::Sequence(values)) = stack.pop() else {
                    return Err(failure("Incomplete preserved sequence"));
                };
                attach(&mut stack, &mut root, Payload::Sequence(values))?;
            }
            Node::Scalar(value, None) => {
                if let Some(Frame::Mapping(_, key @ None)) = stack.last_mut() {
                    *key = Some(value.into_text()?);
                } else {
                    let value = value
                        .into_nullable_text()?
                        .map_or(Payload::Null, Payload::Text);
                    attach(&mut stack, &mut root, value)?;
                }
            }
            _ => {
                return Err(failure(
                    "Nested tags are not accepted in a preservation payload",
                ));
            }
        }
        Ok(())
    })?;
    if !stack.is_empty() {
        return Err(failure("Incomplete preservation payload"));
    }
    root.ok_or_else(|| failure("Missing preservation payload"))
}
pub(super) fn expand(value: &str, namespaces: &[(&str, &str)], attribute: bool) -> Result<Name> {
    let (prefix, local) = value
        .split_once(':')
        .map_or((None, value), |(prefix, local)| (Some(prefix), local));
    if !super::super::is_ncname(local)
        || prefix.is_some_and(|prefix| !super::super::is_ncname(prefix) || prefix == "xmlns")
        || (attribute && value == "xmlns")
    {
        return Err(failure("Invalid preserved XML name"));
    }
    let namespace = match prefix {
        Some("xml") => "http://www.w3.org/XML/1998/namespace",
        Some(prefix) => namespaces
            .iter()
            .find(|(name, _)| *name == prefix)
            .map(|(_, uri)| *uri)
            .ok_or_else(|| failure("Undeclared preserved XML prefix"))?,
        None if attribute => "",
        None => namespaces
            .iter()
            .find(|(name, _)| name.is_empty())
            .map_or("", |(_, uri)| *uri),
    };
    Ok(Name {
        namespace: namespace.to_owned(),
        local: local.to_owned(),
    })
}
fn text(value: Payload) -> Result<String> {
    match value {
        Payload::Text(text) => {
            super::super::validate_text(&text)?;
            Ok(text)
        }
        Payload::Null => Ok(String::new()),
        _ => Err(failure("Expected preserved text")),
    }
}
pub(super) fn build(
    name: Name,
    payload: Payload,
    namespaces: &[(&str, &str)],
    qnames: &[(&str, &str)],
) -> Result<Tree> {
    let mut tree = Tree {
        name,
        attributes: Vec::new(),
        text: String::new(),
        children: Vec::new(),
    };
    let mut order = None;
    match payload {
        Payload::Null => (),
        Payload::Text(value) => tree.text = text(Payload::Text(value))?,
        Payload::Sequence(_) => return Err(failure("An element payload cannot be a sequence")),
        Payload::Mapping(fields) => {
            for (key, value) in fields {
                if key == "#order" {
                    let Payload::Sequence(values) = value else {
                        return Err(failure("Preserved child order must be a sequence"));
                    };
                    order = Some(
                        values
                            .into_iter()
                            .map(|value| expand(&text(value)?, namespaces, false))
                            .collect::<Result<Vec<_>>>()?,
                    );
                } else if key == "#text" {
                    tree.text = text(value)?;
                } else if let Some(key) = key.strip_prefix('_') {
                    let name = expand(key, namespaces, true)?;
                    if tree
                        .attributes
                        .iter()
                        .any(|attribute| attribute.name == name)
                    {
                        return Err(failure("Repeated expanded attribute name"));
                    }
                    let value = text(value)?;
                    let qname = if qnames
                        .iter()
                        .any(|(uri, local)| *uri == name.namespace && *local == name.local)
                    {
                        Some(expand(&value, namespaces, false)?)
                    } else {
                        None
                    };
                    tree.attributes.push(super::Attribute {
                        name,
                        text: value,
                        qname,
                    });
                } else {
                    let name = expand(&key, namespaces, false)?;
                    match value {
                        Payload::Sequence(values) => {
                            for value in values {
                                tree.children
                                    .push(build(name.clone(), value, namespaces, qnames)?);
                            }
                        }
                        value => tree.children.push(build(name, value, namespaces, qnames)?),
                    }
                }
            }
        }
    }
    if let Some(order) = order {
        if order.len() != tree.children.len() {
            return Err(failure(
                "Preserved order must address every child occurrence",
            ));
        }
        let mut children: std::collections::BTreeMap<Name, std::collections::VecDeque<Tree>> =
            std::collections::BTreeMap::new();
        for child in std::mem::take(&mut tree.children) {
            children
                .entry(child.name.clone())
                .or_default()
                .push_back(child);
        }
        tree.children.reserve(order.len());
        for name in order {
            tree.children.push(
                children
                    .get_mut(&name)
                    .and_then(|values| values.pop_front())
                    .ok_or_else(|| failure("Preserved order names a missing child occurrence"))?,
            );
        }
    }
    if !tree.children.is_empty() && !tree.text.is_empty() {
        return Err(failure(
            "Mixed content requires an explicit ordered text representation",
        ));
    }
    Ok(tree)
}
pub(super) fn restore(
    source: &[u8],
    name: Name,
    namespaces: &[(&str, &str)],
    qnames: &[(&str, &str)],
) -> Result<Tree> {
    if !super::super::is_ncname(&name.local) {
        return Err(failure("Invalid preservation root name"));
    }
    build(name, parse(source)?, namespaces, qnames)
}
