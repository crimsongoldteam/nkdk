//! A property document is built only after shared conversion needs preservation.
mod lexical;
use super::{Name, Token, Writer, matches, visit};
use crate::{Result, RuntimeDiagnostic};

#[derive(Clone, Copy)]
pub enum PropertyProjection<'a> {
    Element,
    WithoutAttributes(&'a [(&'a str, &'a str)]),
    Members,
    Fields(&'a [(&'a str, &'a str)]),
    Path(&'a [(&'a str, &'a str)]),
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
        || (members && target.len() < 2)
        || matches!(projection, PropertyProjection::Fields(names) if names.is_empty())
        || matches!(projection, PropertyProjection::Path(path) if path.is_empty())
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
    // Projection selects syntax, not a semantic alternative. Preserve lexical
    // values and namespace bindings until the selected declaration reads them.
    let _ = (qname_attribute, qname_text);
    let mut result = None;
    lexical::visit_documents(source, boundary, target, projection, &mut |document| {
        if result.is_some() {
            return Err(RuntimeDiagnostic::new(
                "xml.preservation-shape",
                format!("Repeated property boundary: {target:?}"),
            ));
        }
        result = Some(document.to_vec());
        Ok(())
    })?;
    if let Some(result) = result {
        return Ok(result);
    }
    let namespaces: Vec<_> = boundary
        .iter()
        .map(|name| name.0)
        .filter(|name| !name.is_empty())
        .collect();
    let mut writer = Writer::new(&namespaces);
    writer.ensure_container(&boundary[..boundary.len() - 1]);
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

/// Visit repeated properties without assigning semantic types to their text.
/// Each document retains ancestor namespace bindings and contains one occurrence.
pub fn visit_property_documents(
    source: &[u8],
    target: &[(&str, &str)],
    mut consume: impl FnMut(&[u8]) -> Result<()>,
) -> Result<()> {
    if target.is_empty() {
        return Err(RuntimeDiagnostic::new(
            "xml.property-boundary",
            "Expected a property route",
        ));
    }
    lexical::visit_documents(
        source,
        target,
        target,
        PropertyProjection::Element,
        &mut consume,
    )
}

/// Singular projections cannot represent repeated scalar boundaries. Readers
/// retain the original source in that exceptional case; the enclosing owner
/// remains responsible for preserving all occurrences.
pub fn borrow_or_project<'a>(
    source: &'a [u8],
    project: impl FnOnce(&[u8]) -> Result<Vec<u8>>,
) -> Result<std::borrow::Cow<'a, [u8]>> {
    match project(source) {
        Ok(piece) => Ok(std::borrow::Cow::Owned(piece)),
        Err(error) if error.code.as_deref() == Some("xml.preservation-shape") => {
            Ok(std::borrow::Cow::Borrowed(source))
        }
        Err(error) => Err(error),
    }
}
