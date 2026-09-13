//! A property document is built only after shared conversion needs preservation.
use super::{Name, Token, Tree, Writer, matches, visit};
use crate::{Result, RuntimeDiagnostic};

#[derive(Clone, Copy)]
pub enum PropertyProjection<'a> {
    Element,
    Members,
    Fields(&'a [(&'a str, &'a str)]),
    Record {
        fields: &'a [(&'a str, &'a str)],
        attributes: &'a [(&'a str, &'a str)],
    },
}

pub fn project_property(
    source: &[u8],
    target: &[(&str, &str)],
    projection: PropertyProjection<'_>,
    qname_attribute: impl Fn(&[Name], &Name) -> bool,
    qname_text: impl Fn(&[Name]) -> bool,
) -> Result<Vec<u8>> {
    let members = matches!(projection, PropertyProjection::Members);
    if target.is_empty()
        || (matches!(projection, PropertyProjection::Element) && target.len() < 2)
        || (members && target.len() < 3)
        || matches!(projection, PropertyProjection::Fields(names) if names.is_empty())
    {
        return Err(RuntimeDiagnostic::new(
            "xml.property-boundary",
            "Expected a property below the document root",
        ));
    }
    let boundary = if members {
        &target[..target.len() - 1]
    } else {
        target
    };
    let mut tree = Tree::capture_with_qnames(source, boundary, qname_text)?;
    let selected = match projection {
        PropertyProjection::Members => Some(&target[target.len() - 1..]),
        PropertyProjection::Fields(names) | PropertyProjection::Record { fields: names, .. } => {
            Some(names)
        }
        PropertyProjection::Element => None,
    };
    if let (Some(names), Some(tree)) = (selected, &mut tree) {
        if let PropertyProjection::Record { attributes, .. } = projection {
            tree.retain_record(names, attributes);
        } else {
            tree.retain_children(names);
        }
    }
    let owns = |path: &[Name]| {
        if let Some(names) = selected {
            path.len() > boundary.len()
                && matches(&path[..boundary.len()], boundary)
                && names.iter().any(|name| {
                    path[boundary.len()].namespace == name.0 && path[boundary.len()].local == name.1
                })
        } else {
            path.len() >= target.len() && matches(&path[..target.len()], target)
        }
    };
    let mut qnames = Vec::new();
    visit(source, |path, token| {
        if (owns(path)
            || matches!(projection, PropertyProjection::Record { .. }) && matches(path, boundary))
            && let Token::Attribute(attribute) = token
            && qname_attribute(path, &attribute.name)
            && !qnames.contains(&attribute.name)
        {
            qnames.push(attribute.name);
        }
        Ok(())
    })?;
    let mut namespaces: Vec<_> = target
        .iter()
        .map(|(uri, _)| *uri)
        .filter(|uri| !uri.is_empty())
        .collect();
    if let Some(tree) = &tree {
        tree.collect_namespaces(&mut namespaces);
    }
    let mut writer = Writer::new(&namespaces);
    let parent = &boundary[..boundary.len() - 1];
    if let Some(tree) = &tree {
        let qnames: Vec<_> = qnames
            .iter()
            .map(|name| (name.namespace.as_str(), name.local.as_str()))
            .collect();
        tree.write_at(&mut writer, parent, &qnames)?;
    } else {
        writer.ensure_container(parent);
    }
    Ok(writer.finish())
}

pub fn project_attributes(
    source: &[u8],
    target: &[(&str, &str)],
    names: &[(&str, &str)],
) -> Result<Vec<u8>> {
    if target.is_empty() {
        return Err(RuntimeDiagnostic::new(
            "xml.property-boundary",
            "Expected an attribute container",
        ));
    }
    let mut attributes = Vec::new();
    let mut present = false;
    visit(source, |path, token| {
        if matches(path, target) {
            match token {
                Token::Start(_) if present => {
                    return Err(RuntimeDiagnostic::new(
                        "xml.duplicate-field",
                        "Repeated attribute container",
                    ));
                }
                Token::Start(_) => present = true,
                Token::Attribute(attribute)
                    if names.iter().any(|(uri, local)| {
                        *uri == attribute.name.namespace && *local == attribute.name.local
                    }) =>
                {
                    attributes.push(attribute)
                }
                _ => {}
            }
        }
        Ok(())
    })?;
    let namespaces: Vec<_> = target
        .iter()
        .chain(names)
        .map(|(uri, _)| *uri)
        .filter(|uri| !uri.is_empty())
        .collect();
    let mut writer = Writer::new(&namespaces);
    if present {
        let attributes: Vec<_> = attributes
            .iter()
            .map(|attribute| super::WriteAttribute {
                name: (&attribute.name.namespace, &attribute.name.local),
                value: super::AttributeValue::Text(&attribute.text),
            })
            .collect();
        writer.container_with_attributes(target, &attributes);
    } else {
        writer.ensure_container(&target[..target.len() - 1]);
    }
    Ok(writer.finish())
}
