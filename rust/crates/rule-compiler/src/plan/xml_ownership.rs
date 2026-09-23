use super::*;

#[derive(Clone, Debug)]
pub(crate) struct XmlRoute {
    pub path: Vec<ExpandedName>,
    pub attribute: Option<ExpandedName>,
    pub source: SourceLocation,
    pub owns_element: bool,
}

pub(crate) fn validate(entries: &BTreeMap<u32, LinkedEntry>) -> Result<(), Diagnostic> {
    for entry in entries.values() {
        routes(&entry.value, &entry.xml, &entry.source, &|id| &entries[&id])?;
    }
    Ok(())
}

pub(crate) fn routes<'a>(
    value: &LinkedType,
    xml: &LinkedXml,
    source: &SourceLocation,
    entries: &impl Fn(u32) -> &'a LinkedEntry,
) -> Result<Vec<XmlRoute>, Diagnostic> {
    routes_inner(value, xml, source, entries, &mut BTreeSet::new())
}

fn routes_inner<'a>(
    value: &LinkedType,
    xml: &LinkedXml,
    source: &SourceLocation,
    entries: &impl Fn(u32) -> &'a LinkedEntry,
    visiting: &mut BTreeSet<u32>,
) -> Result<Vec<XmlRoute>, Diagnostic> {
    let result = match xml {
        LinkedXml::Declared => {
            let id = match value {
                LinkedType::Reference(id) | LinkedType::BoundReference { entry: id, .. } => id,
                _ => unreachable!("declared representation requires a reference"),
            };
            if !visiting.insert(*id) {
                return Ok(Vec::new());
            }
            let entry = entries(*id);
            let result = routes_inner(&entry.value, &entry.xml, &entry.source, entries, visiting)?;
            visiting.remove(id);
            result
        }
        LinkedXml::WithAttributes {
            attributes,
            content,
        } => {
            let mut result = routes_inner(value, content, source, entries, visiting)?;
            result.extend(attributes.iter().map(|attribute| XmlRoute {
                path: vec![],
                attribute: Some(attribute.name.clone()),
                source: attribute.source.clone(),
                owns_element: false,
            }));
            result
        }
        LinkedXml::Record(mappings) => {
            let LinkedType::Record(fields) = value else {
                unreachable!("shape validated before ownership")
            };
            let mut result = vec![];
            for mapping in mappings {
                let field = fields
                    .iter()
                    .find(|field| field.name == mapping.field)
                    .expect("mapping validated");
                let reference = match field.value {
                    LinkedType::Reference(entry) | LinkedType::BoundReference { entry, .. } => {
                        Some(entry)
                    }
                    _ => None,
                };
                if mapping.attribute.is_some() && !attribute_type(&field.value, entries) {
                    return Err(diagnostic(
                        "invalid_attribute_type",
                        &mapping.source,
                        "XML attribute requires a scalar text representation without child nodes or attributes",
                    ));
                }
                if mapping.attribute.is_none()
                    && let Some(id) = reference
                {
                    if !visiting.insert(id) {
                        continue;
                    }
                    let entry = entries(id);
                    for mut route in
                        routes_inner(&entry.value, &entry.xml, &entry.source, entries, visiting)?
                    {
                        let mut path = mapping.path.clone();
                        path.extend(route.path);
                        route.path = path;
                        route.source = mapping.source.clone();
                        result.push(route);
                    }
                    visiting.remove(&id);
                } else {
                    result.push(XmlRoute {
                        path: mapping.path.clone(),
                        attribute: mapping.attribute.clone(),
                        source: mapping.source.clone(),
                        owns_element: false,
                    });
                }
            }
            result
        }
        LinkedXml::Tree(nodes) => nodes
            .iter()
            .map(|node| XmlRoute {
                path: vec![node.name.clone()],
                attribute: None,
                source: node.source.clone(),
                owns_element: true,
            })
            .collect(),
        LinkedXml::ElementSequence { path, item } => {
            let LinkedType::Sequence(value) = value else {
                unreachable!("shape validated before ownership")
            };
            routes_inner(value, item, source, entries, visiting)?;
            vec![XmlRoute {
                path: path.clone(),
                attribute: None,
                source: source.clone(),
                owns_element: true,
            }]
        }
        xml if scalar_xml(xml) => {
            vec![XmlRoute {
                path: vec![],
                attribute: None,
                source: source.clone(),
                owns_element: false,
            }]
        }
        _ => unreachable!("shape validated before ownership"),
    };
    for (index, route) in result.iter().enumerate() {
        if let Some(first) = result[..index].iter().find(|first| overlaps(first, route)) {
            let mut error = diagnostic(
                "xml_path_collision",
                &route.source,
                "XML path has multiple owners",
            );
            error.related.push(first.source.clone());
            return Err(error);
        }
    }
    Ok(result)
}

fn overlaps(a: &XmlRoute, b: &XmlRoute) -> bool {
    match (&a.attribute, &b.attribute) {
        (Some(a_name), Some(b_name)) => a.path == b.path && a_name == b_name,
        (None, None) => a.path.starts_with(&b.path) || b.path.starts_with(&a.path),
        (None, Some(_)) => {
            (b.path.len() > a.path.len() || a.owns_element) && b.path.starts_with(&a.path)
        }
        (Some(_), None) => {
            (a.path.len() > b.path.len() || b.owns_element) && a.path.starts_with(&b.path)
        }
    }
}

fn attribute_type<'a>(value: &LinkedType, entries: &impl Fn(u32) -> &'a LinkedEntry) -> bool {
    match value {
        LinkedType::Scalar(ScalarType::Text | ScalarType::Boolean | ScalarType::Decimal)
        | LinkedType::Enum(_) => true,
        LinkedType::Reference(id) | LinkedType::BoundReference { entry: id, .. } => {
            let xml = &entries(*id).xml;
            scalar_xml(xml)
                && !matches!(
                    xml,
                    LinkedXml::TextSequence { .. } | LinkedXml::QName { .. }
                )
        }
        _ => false,
    }
}

fn scalar_xml(value: &LinkedXml) -> bool {
    matches!(
        value,
        LinkedXml::Choice { .. }
            | LinkedXml::DiscriminatedChoice(_)
            | LinkedXml::Text
            | LinkedXml::TextPattern(_)
            | LinkedXml::TextSequence { .. }
            | LinkedXml::QName { .. }
            | LinkedXml::ScalarChoice(_)
            | LinkedXml::FormattedDecimal(_)
            | LinkedXml::Calendar
            | LinkedXml::Decimal
            | LinkedXml::BooleanTable(_)
            | LinkedXml::EnumTable(_)
            | LinkedXml::QNameTable(_)
            | LinkedXml::QNameTextTable(_)
    )
}
