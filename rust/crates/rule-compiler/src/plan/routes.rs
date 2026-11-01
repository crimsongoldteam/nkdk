use super::*;

pub(crate) struct RecordUsage {
    pub entry: LinkedEntry,
    pub path: Vec<ExpandedName>,
    pub key: String,
    pub projected: bool,
    pub xml_missing: bool,
    pub yaml_missing: bool,
    pub xml_empty: bool,
    pub xml_nil: bool,
    pub yaml_null: bool,
    pub xml_absent_empty: bool,
    pub canonical: Vec<LinkedCanonical>,
    pub canonical_value_scope: bool,
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
    let (LinkedType::Record(fields), LinkedXml::Record(xml)) = (&owner.value, &owner.xml) else {
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
                | YamlRepresentation::GroupedSequence(_)
        )
    ) || super::values::xml_fields(&common.xml).is_none()
        || common.normalization.is_some()
        || !common.resources.is_empty()
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
        if matches!(field.value, LinkedType::Scalar(_) | LinkedType::Enum(_)) {
            continue;
        }
        let Some((id, _, _)) = field.value.as_reference() else {
            return Ok(None);
        };
        let value = program
            .entries
            .iter()
            .find(|entry| entry.id == id)
            .expect("linked value");
        if matches!(value.value, LinkedType::Scalar(_) | LinkedType::Enum(_)) {
            continue;
        }
        // A nested record keeps its own projection and wrapper attributes.
        // The shared record body places and composes those at this boundary.
        if matches!(value.value, LinkedType::Record(_))
            && matches!(
                value.yaml,
                YamlRepresentation::Mapping(_)
                    | YamlRepresentation::Projection(_)
                    | YamlRepresentation::GroupedSequence(_)
                    | YamlRepresentation::TextPattern(_)
            )
            && super::values::xml_fields(&value.xml).is_some()
        {
            continue;
        }
        if matches!(
            (&value.value, &value.yaml),
            (
                LinkedType::Sequence(_),
                YamlRepresentation::KeyedMapping { .. }
            )
        ) {
            continue;
        }
        if !matches!(&value.yaml, YamlRepresentation::Sequence { item, .. } if **item == YamlRepresentation::Declared)
            && !matches!(value.yaml, YamlRepresentation::RecordMapping { .. })
            && !matches!(value.value, LinkedType::Choice(_))
            && !matches!(
                (&value.value, &value.yaml),
                (LinkedType::Record(_), YamlRepresentation::Mapping(_))
            )
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
    if mapping.path.is_empty() || mapping.attribute.is_some() {
        return Ok(None);
    }
    let (key, projected) = match &owner.yaml {
        YamlRepresentation::Mapping(yaml) => {
            let Some(key) = yaml.iter().find(|item| item.field == fields[0].name) else {
                return Ok(None);
            };
            (key.key.clone(), false)
        }
        YamlRepresentation::Projection(field) if field == &fields[0].name => (
            mapping
                .path
                .last()
                .expect("non-empty record route")
                .local
                .clone(),
            true,
        ),
        _ => return Ok(None),
    };
    // Wrapper presence belongs to the same instantiated contract as its body.
    // Extracting it from the generic definition leaks parameter/input slots
    // into the caller when that definition was not scalar-specialized.
    let mut entry = common.clone();
    crate::link::sequence_item::instantiate(&mut entry, bindings, arguments)?;
    let rules: Vec<_> = entry
        .presence
        .iter()
        .filter(|rule| rule.target == LinkedPresenceTarget::SelfValue)
        .map(|rule| (rule, true))
        .chain(owner.presence.iter().map(|rule| (rule, false)))
        .collect();
    let (mut xml_missing, mut yaml_missing) = (false, false);
    let (mut xml_empty, mut xml_absent_empty) = (false, false);
    let (mut xml_nil, mut yaml_null) = (false, false);
    let mut canonical = Vec::new();
    let mut canonical_value_scope = false;
    let mut yaml_default = None;
    for (rule, value_scope) in rules {
        let mut rule = rule.clone();
        rule.canonical.retain(|form| {
            !form.when.as_ref().is_some_and(|when| {
                matches!(
                    when.kind,
                    LinkedExpressionKind::Literal(ScalarLiteral::Boolean(false))
                )
            })
        });
        if rule.xml_empty.iter().any(|empty| {
            !matches!(empty.form, EmptyKind::Element | EmptyKind::Nil)
                || !matches!(empty.denotes.kind, LinkedExpressionKind::Absent)
        }) || rule.yaml_empty.iter().any(|empty| {
            empty.form != EmptyKind::Null
                || !matches!(empty.denotes.kind, LinkedExpressionKind::Absent)
        }) || rule.yaml_omit_when.is_some()
        {
            return Ok(None);
        }
        xml_empty |= rule
            .xml_empty
            .iter()
            .any(|form| form.form == EmptyKind::Element);
        xml_nil |= rule
            .xml_empty
            .iter()
            .any(|form| form.form == EmptyKind::Nil);
        yaml_null |= !rule.yaml_empty.is_empty();
        if !rule.canonical.is_empty() {
            if crate::presence::supported_canonical(&rule)
                && rule.canonical.len() == 1
                && rule.canonical[0].form == XmlForm::EmptyElement
            {
                xml_absent_empty = true;
            } else if canonical.is_empty()
                && rule.canonical.iter().all(|form| {
                    form.xml_type.is_none()
                        && matches!(
                            form.form,
                            XmlForm::Missing
                                | XmlForm::EmptyElement
                                | XmlForm::Ordinary
                                | XmlForm::Nil
                        )
                })
                && (rule
                    .canonical
                    .last()
                    .is_some_and(|form| form.when.is_none())
                    || rule.canonical.iter().all(|form| form.when.is_some()))
            {
                canonical = rule.canonical.clone();
                canonical_value_scope = value_scope;
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
        key,
        projected,
        xml_missing,
        yaml_missing,
        xml_empty,
        xml_nil,
        yaml_null,
        xml_absent_empty,
        canonical,
        canonical_value_scope,
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
