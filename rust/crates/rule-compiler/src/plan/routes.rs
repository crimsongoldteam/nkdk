use super::*;

pub(crate) struct RecordUsage {
    pub entry: LinkedEntry,
    pub path: Vec<ExpandedName>,
    pub key: String,
    pub xml_missing: bool,
    pub yaml_missing: bool,
}

/// A property changes placement; the referenced record keeps its own field scope.
pub(crate) fn record_usage(
    owner: &LinkedEntry,
    program: &Program,
) -> Result<Option<RecordUsage>, Diagnostic> {
    let (LinkedType::Record(fields), LinkedXml::Record(xml), YamlRepresentation::Mapping(yaml)) =
        (&owner.value, &owner.xml, &owner.yaml)
    else {
        return Ok(None);
    };
    if fields.len() != 1 || !owner.constraints.is_empty() {
        return Ok(None);
    }
    let Some((id, bindings, arguments)) = fields[0].value.as_reference() else {
        return Ok(None);
    };
    let common = program
        .entries
        .iter()
        .find(|entry| entry.id == id)
        .expect("linked value");
    if !matches!(
        (&common.value, &common.xml, &common.yaml),
        (
            LinkedType::Record(_),
            LinkedXml::Record(_),
            YamlRepresentation::Mapping(_)
        )
    ) || !common.shorthands.is_empty()
        || common.normalization.is_some()
        || !common.resources.is_empty()
        || !common.contributions.is_empty()
    {
        return Ok(None);
    }
    // A shared wrapper needs the collection's element routes, rather than the
    // property's container route. Keep that placement on its existing backend
    // until the shared route plan represents it explicitly.
    if let LinkedXml::Record(fields) = &common.xml
        && fields
            .iter()
            .any(|field| field.path.is_empty() && field.attribute.is_none())
    {
        return Ok(None);
    }
    let mapping = xml
        .iter()
        .find(|mapping| mapping.field == fields[0].name)
        .expect("linked route");
    let Some(key) = yaml.iter().find(|mapping| mapping.field == fields[0].name) else {
        return Ok(None);
    };
    if mapping.path.len() < 2 || mapping.attribute.is_some() {
        return Ok(None);
    }
    let rules: Vec<_> = common
        .presence
        .iter()
        .filter(|rule| rule.target == LinkedPresenceTarget::SelfValue)
        .chain(owner.presence.iter())
        .collect();
    let (mut xml_missing, mut yaml_missing) = (false, false);
    for rule in rules {
        if !rule.xml_empty.is_empty()
            || !rule.yaml_empty.is_empty()
            || !rule.canonical.is_empty()
            || rule.yaml_omit_when.is_some()
        {
            return Ok(None);
        }
        for (value, missing) in [
            (&rule.xml_missing, &mut xml_missing),
            (&rule.yaml_missing, &mut yaml_missing),
        ] {
            if let Some(value) = value {
                if !matches!(value.kind, LinkedExpressionKind::Absent) {
                    return Ok(None);
                }
                *missing = true;
            }
        }
    }
    let mut entry = common.clone();
    crate::link::sequence_item::instantiate(&mut entry, bindings, arguments)?;
    entry.id = owner.id;
    entry.kind = ModuleKind::Object;
    entry.inputs = owner.inputs.clone();
    entry
        .presence
        .retain(|rule| rule.target != LinkedPresenceTarget::SelfValue);
    let LinkedXml::Record(fields) = &mut entry.xml else {
        unreachable!()
    };
    for field in fields {
        field.path = mapping.path.iter().chain(&field.path).cloned().collect();
    }
    entry.field_dependencies = super::scopes::dependencies(&entry.value, &entry.presence)?;
    Ok(Some(RecordUsage {
        entry,
        path: mapping.path.clone(),
        key: key.key.clone(),
        xml_missing,
        yaml_missing,
    }))
}
