//! Finite attribute domains declared by reusable record values.
use nkdk_rule_model::{ExpandedName, LinkedEntry, LinkedType, LinkedXml, YamlRepresentation};

pub(crate) fn finite_domain<'a>(
    entry: &'a LinkedEntry,
    attribute: &ExpandedName,
    entries: &'a [LinkedEntry],
) -> Option<Vec<&'a ExpandedName>> {
    if let LinkedXml::DiscriminatedChoice(choice) = &entry.xml
        && &choice.attribute == attribute
    {
        return Some(
            choice
                .variants
                .iter()
                .flat_map(|case| case.values.iter())
                .collect(),
        );
    }
    let LinkedXml::Record(routes) = &entry.xml else {
        return None;
    };
    let LinkedType::Record(fields) = &entry.value else {
        return None;
    };
    if let Some(route) = routes
        .iter()
        .find(|route| route.path.is_empty() && route.attribute.as_ref() == Some(attribute))
    {
        let field = fields.iter().find(|field| field.name == route.field)?;
        let (id, _, _) = field.value.as_reference()?;
        let value = entries.iter().find(|entry| entry.id == id)?;
        return match &value.xml {
            LinkedXml::QNameTable(rows) => Some(rows.iter().map(|row| &row.name).collect()),
            LinkedXml::QNameTextTable(rows) if rows.iter().all(|row| row.separator.is_none()) => {
                Some(
                    rows.iter()
                        .flat_map(|row| std::iter::once(&row.name).chain(&row.accepted))
                        .collect(),
                )
            }
            _ => None,
        };
    }
    let YamlRepresentation::Projection(projected) = &entry.yaml else {
        return None;
    };
    let route = routes.iter().find(|route| {
        route.field == *projected && route.path.is_empty() && route.attribute.is_none()
    })?;
    let field = fields.iter().find(|field| field.name == route.field)?;
    let (id, _, _) = field.value.as_reference()?;
    let nested = entries.iter().find(|entry| entry.id == id)?;
    finite_domain(nested, attribute, entries)
}
