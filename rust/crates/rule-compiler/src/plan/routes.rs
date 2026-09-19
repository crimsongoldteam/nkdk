use super::*;

pub(crate) struct RecordUsage {
    pub entry: LinkedEntry,
    pub path: Vec<ExpandedName>,
    pub key: String,
    pub xml_missing: bool,
    pub yaml_missing: bool,
    pub xml_empty: bool,
    pub xml_absent_empty: bool,
    pub canonical: Vec<LinkedCanonical>,
    pub yaml_default: Option<LinkedExpression>,
    pub required_constraints: Vec<LinkedConstraint>,
}

pub(crate) fn required_constraint_field(constraint: &LinkedConstraint) -> Option<usize> {
    if constraint.for_each.is_some()
        || constraint.when.is_some()
        || !constraint.forms.is_empty()
        || !constraint
            .diagnostic
            .message
            .iter()
            .all(|part| matches!(part, LinkedMessagePart::Text(_)))
    {
        return None;
    }
    let LinkedDiagnosticTarget::Field(diagnostic_field) = constraint.diagnostic.at else {
        return None;
    };
    match &constraint.assertion.kind {
        LinkedExpressionKind::Operation {
            operator: LinkedOperator::State(StatePredicate::Present),
            arguments,
        } if matches!(arguments.as_slice(), [LinkedExpression { kind: LinkedExpressionKind::Field(field), .. }] if *field == diagnostic_field) => {
            Some(diagnostic_field as usize)
        }
        _ => None,
    }
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
    if fields.len() != 1 {
        return Ok(None);
    }
    if owner
        .constraints
        .iter()
        .any(|constraint| required_constraint_field(constraint) != Some(0))
    {
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
            YamlRepresentation::Mapping(_)
                | YamlRepresentation::TextPattern(_)
                | YamlRepresentation::Projection(_)
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
    let Some(mapping) = xml.iter().find(|mapping| mapping.field == fields[0].name) else {
        return Ok(None);
    };
    let Some(key) = yaml.iter().find(|mapping| mapping.field == fields[0].name) else {
        return Ok(None);
    };
    if mapping.path.is_empty() || mapping.attribute.is_some() {
        return Ok(None);
    }
    let rules: Vec<_> = common
        .presence
        .iter()
        .filter(|rule| rule.target == LinkedPresenceTarget::SelfValue)
        .chain(owner.presence.iter())
        .collect();
    let (mut xml_missing, mut yaml_missing) = (false, false);
    let (mut xml_empty, mut xml_absent_empty) = (false, false);
    let mut canonical = Vec::new();
    let mut yaml_default = None;
    for rule in rules {
        if rule.xml_empty.iter().any(|empty| {
            empty.form != EmptyKind::Element
                || !matches!(empty.denotes.kind, LinkedExpressionKind::Absent)
        }) || !rule.yaml_empty.is_empty()
            || rule.yaml_omit_when.is_some()
        {
            return Ok(None);
        }
        xml_empty |= !rule.xml_empty.is_empty();
        if !rule.canonical.is_empty() {
            if crate::presence::supported_canonical(rule)
                && rule.canonical[0].form == XmlForm::EmptyElement
            {
                xml_absent_empty = true;
            } else if canonical.is_empty()
                && rule.canonical.iter().all(|form| {
                    matches!(
                        form.form,
                        XmlForm::Missing | XmlForm::EmptyElement | XmlForm::Ordinary
                    )
                })
                && (rule
                    .canonical
                    .last()
                    .is_some_and(|form| form.when.is_none())
                    || rule.canonical.iter().all(|form| form.when.is_some()))
            {
                canonical = rule.canonical.clone();
            } else {
                return Ok(None);
            }
        }
        if let Some(value) = &rule.xml_missing {
            if !matches!(value.kind, LinkedExpressionKind::Absent) {
                return Ok(None);
            }
            xml_missing = true;
        }
        if let Some(value) = &rule.yaml_missing {
            if !matches!(value.kind, LinkedExpressionKind::Absent) {
                if yaml_default.is_some() {
                    return Ok(None);
                }
                yaml_default = Some(value.clone());
            }
            yaml_missing = true;
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
        xml_empty,
        xml_absent_empty,
        canonical,
        yaml_default,
        required_constraints: owner.constraints.clone(),
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
