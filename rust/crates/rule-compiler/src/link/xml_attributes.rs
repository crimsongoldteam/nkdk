use super::*;

pub(super) fn resolve(
    module: &Module,
    attributes: &[XmlAttribute],
    modules: &BTreeMap<&str, &Module>,
    ids: &BTreeMap<&str, u32>,
) -> Result<Vec<LinkedXmlAttribute>, Diagnostic> {
    attributes
        .iter()
        .map(|attribute| {
            if attribute.name == "xmlns" || attribute.name.starts_with("xmlns:") {
                return Err(diagnostic(
                    "invalid_attribute_name",
                    &attribute.source,
                    "Namespace declarations are not value attributes",
                ));
            }
            let mut name = expand_path(
                module,
                std::slice::from_ref(&attribute.name),
                &attribute.source,
            )?
            .remove(0);
            if !attribute.name.contains(':') {
                name.namespace.clear();
            }
            let value = match &attribute.value {
                XmlAttributeValue::Text(text) => LinkedXmlAttributeValue::Text(text.clone()),
                XmlAttributeValue::QName(name) => LinkedXmlAttributeValue::QName(
                    expand_path(module, std::slice::from_ref(name), &attribute.source)?.remove(0),
                ),
            };
            let when = attribute
                .when
                .as_ref()
                .map(|value| {
                    let value = expressions::resolve_expression(module, value, modules, ids)?;
                    expressions::require_boolean(&value)?;
                    Ok(value)
                })
                .transpose()?;
            Ok(LinkedXmlAttribute {
                name,
                value,
                when,
                source: attribute.source.clone(),
            })
        })
        .collect()
}

pub(super) fn check_ownership(mut xml: &LinkedXml) -> Result<(), Diagnostic> {
    let mut names = BTreeMap::new();
    while let LinkedXml::WithAttributes {
        attributes,
        content,
    } = xml
    {
        for attribute in attributes {
            insert(&mut names, &attribute.name, &attribute.source)?;
        }
        xml = content;
    }
    if let LinkedXml::Record(fields) = xml {
        for field in fields {
            if field.path.is_empty()
                && let Some(name) = &field.attribute
            {
                insert(&mut names, name, &field.source)?;
            }
        }
    }
    Ok(())
}
fn insert<'a>(
    names: &mut BTreeMap<(&'a str, &'a str), &'a SourceLocation>,
    name: &'a ExpandedName,
    source: &'a SourceLocation,
) -> Result<(), Diagnostic> {
    if let Some(first) = names.insert((&name.namespace, &name.local), source) {
        let mut error = diagnostic(
            "xml_path_collision",
            source,
            "Canonical attribute has multiple owners",
        );
        error.related.push(first.clone());
        return Err(error);
    }
    Ok(())
}
