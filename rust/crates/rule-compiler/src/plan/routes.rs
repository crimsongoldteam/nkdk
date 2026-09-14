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
        (&common.value, &common.yaml),
        (
            LinkedType::Record(_),
            YamlRepresentation::Mapping(_) | YamlRepresentation::TextPattern(_)
        )
    ) || super::values::xml_fields(&common.xml).is_none()
        || !common.shorthands.is_empty()
        || common.normalization.is_some()
        || !common.resources.is_empty()
        || !common.contributions.is_empty()
    {
        return Ok(None);
    }
    // Shared scalar-sequence expressions and collection-owned headers still
    // use their existing backend; declared record items use the common body.
    for mapping in super::values::xml_fields(&common.xml).expect("record routes") {
        if !mapping.path.is_empty() || mapping.attribute.is_some() {
            continue;
        }
        let LinkedType::Record(fields) = &common.value else {
            unreachable!()
        };
        let field = fields
            .iter()
            .find(|field| field.name == mapping.field)
            .expect("linked mapping");
        let Some((id, _, _)) = field.value.as_reference() else {
            return Ok(None);
        };
        let value = program
            .entries
            .iter()
            .find(|entry| entry.id == id)
            .expect("linked value");
        if !matches!(&value.yaml, YamlRepresentation::Sequence { item, .. } if **item == YamlRepresentation::Declared)
            && !matches!(value.yaml, YamlRepresentation::RecordMapping { .. })
        {
            return Ok(None);
        }
        let mut representation = &value.xml;
        while let LinkedXml::WithAttributes {
            attributes,
            content,
        } = representation
        {
            if !attributes.is_empty() {
                return Ok(None);
            }
            representation = content;
        }
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
    place_record(&mut entry, &mapping.path)?;
    entry.field_dependencies = super::scopes::dependencies(&entry.value, &entry.presence)?;
    Ok(Some(RecordUsage {
        entry,
        path: mapping.path.clone(),
        key: key.key.clone(),
        xml_missing,
        yaml_missing,
    }))
}

/// Placement changes routes, preserving the record's declared header and field scope.
pub(crate) fn place_record(
    entry: &mut LinkedEntry,
    prefix: &[ExpandedName],
) -> Result<(), Diagnostic> {
    let mut xml = &mut entry.xml;
    while let LinkedXml::WithAttributes { content, .. } = xml {
        xml = content;
    }
    let LinkedXml::Record(fields) = xml else {
        return Err(super::unsupported(
            entry,
            "Record placement requires record XML routes",
        ));
    };
    for field in fields {
        field.path = prefix.iter().chain(&field.path).cloned().collect();
    }
    Ok(())
}
