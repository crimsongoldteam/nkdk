use super::*;

pub(super) fn lift(entries: &mut [LinkedEntry]) -> Result<(), Diagnostic> {
    lift_kind(entries, false)?;
    lift_kind(entries, true)
}

fn lift_kind(entries: &mut [LinkedEntry], pattern: bool) -> Result<(), Diagnostic> {
    let originals = snapshot(entries);
    for owner in entries {
        for (index, field, common) in referenced_fields(&owner.value, &originals) {
            let eligible = if pattern {
                matches!(common.yaml, YamlRepresentation::TextPattern(_))
                    && !super::text_sequence::tail_id(common).is_some_and(|id| {
                        matches!(originals[&id].xml, LinkedXml::TextSequence { .. })
                    })
            } else {
                matches!(common.value, LinkedType::Scalar(_) | LinkedType::Enum(_))
            };
            if !eligible {
                continue;
            }
            for constraint in &common.constraints {
                if constraint.for_each.is_some()
                    || !common.inputs.is_empty()
                    || !common.parameters.is_empty()
                {
                    return Err(diagnostic(
                        "unsupported_scalar_contract",
                        &constraint.source,
                        "Scalar constraint inputs require explicit specialization",
                    ));
                }
                let mut constraint = constraint.clone();
                constraint.id = format!("{}.{}", field.name, constraint.id);
                let project = |value: &mut LinkedExpression| {
                    if pattern {
                        crate::expressions::project_record(value, index, &common.value);
                    } else {
                        crate::expressions::replace_self(value, index);
                    }
                };
                crate::expressions::map_constraint(&mut constraint, project);
                constraint.diagnostic.at = match constraint.diagnostic.at {
                    LinkedDiagnosticTarget::SelfValue => {
                        LinkedDiagnosticTarget::Field(index as u32)
                    }
                    LinkedDiagnosticTarget::Field(_) if pattern => {
                        LinkedDiagnosticTarget::Field(index as u32)
                    }
                    _ => {
                        return Err(diagnostic(
                            "unsupported_scalar_contract",
                            &constraint.source,
                            "Scalar diagnostic must address its value",
                        ));
                    }
                };
                for form in &mut constraint.forms {
                    *form = match form {
                        LinkedForm::XmlText
                            if matches!(owner.yaml, YamlRepresentation::TextPattern(_)) =>
                        {
                            LinkedForm::XmlText
                        }
                        LinkedForm::YamlScalar
                            if matches!(owner.yaml, YamlRepresentation::TextPattern(_)) =>
                        {
                            LinkedForm::YamlScalar
                        }
                        LinkedForm::XmlText => LinkedForm::XmlRecord,
                        LinkedForm::YamlScalar => LinkedForm::YamlMapping,
                        _ => {
                            return Err(diagnostic(
                                "unsupported_scalar_contract",
                                &constraint.source,
                                "Scalar constraint has a non-scalar form",
                            ));
                        }
                    };
                }
                owner.constraints.push(constraint);
            }
        }
        owner.field_dependencies = dependencies::field_dependencies(&owner.value, &owner.presence)?;
    }
    Ok(())
}

/// Resolve the direct common fields without imposing an owner storage representation.
pub(super) fn referenced_fields<'a>(
    value: &'a LinkedType,
    entries: &'a BTreeMap<u32, LinkedEntry>,
) -> impl Iterator<Item = (usize, &'a LinkedField, &'a LinkedEntry)> {
    let fields = match value {
        LinkedType::Record(fields) => fields.as_slice(),
        _ => &[],
    };
    fields.iter().enumerate().filter_map(|(index, field)| {
        if let LinkedType::Reference(id) = field.value {
            Some((index, field, &entries[&id]))
        } else {
            None
        }
    })
}

pub(super) fn snapshot(entries: &[LinkedEntry]) -> BTreeMap<u32, LinkedEntry> {
    entries
        .iter()
        .map(|entry| (entry.id, entry.clone()))
        .collect()
}

/// Resolve inherited scalar restoration before representation coverage checks.
pub(super) fn inherit_presence(
    owner: &mut LinkedEntry,
    modules: &BTreeMap<&str, &Module>,
    ids: &BTreeMap<&str, u32>,
    visiting: &mut BTreeSet<u32>,
    cache: &mut BTreeMap<u32, LinkedEntry>,
) -> Result<(), Diagnostic> {
    let LinkedType::Record(fields) = &owner.value else {
        return Ok(());
    };
    let mut inherited = Vec::new();
    for (slot, field) in fields.iter().enumerate() {
        let explicit = owner
            .presence
            .iter()
            .position(|rule| rule.target == LinkedPresenceTarget::Field(slot as u32));
        let Some((id, bindings, arguments)) = field.value.as_reference() else {
            continue;
        };
        let module = modules
            .values()
            .find(|module| ids[module.id.as_str()] == id)
            .expect("linked reference");
        if explicit.is_some()
            && !matches!(module.representations.yaml, YamlRepresentation::States(_))
        {
            continue;
        }
        let mut common = build_entry(module, modules, ids, visiting, cache)?;
        if !matches!(common.value, LinkedType::Scalar(_) | LinkedType::Enum(_)) {
            continue;
        }
        if common.presence.is_empty() {
            continue;
        }
        composition::instantiate_value(&mut common, bindings, arguments)?;
        for mut rule in common.presence {
            if rule.target != LinkedPresenceTarget::SelfValue {
                continue;
            }
            rule.target = LinkedPresenceTarget::Field(slot as u32);
            for expression in rule.expressions_mut() {
                crate::expressions::replace_self(expression, slot);
            }
            if let Some(index) = explicit {
                let explicit = &mut owner.presence[index];
                if explicit.yaml_missing.is_some() || !explicit.yaml_empty.is_empty() {
                    return Err(diagnostic(
                        "conflicting_state_presence",
                        &explicit.source,
                        "YAML state table already defines presence",
                    ));
                }
                explicit.yaml_missing = rule.yaml_missing;
                explicit.yaml_omit_when =
                    match (explicit.yaml_omit_when.take(), rule.yaml_omit_when) {
                        (Some(left), Some(right)) => Some(LinkedExpression {
                            kind: LinkedExpressionKind::Operation {
                                operator: LinkedOperator::Or,
                                arguments: vec![left, right],
                            },
                            value_type: LinkedType::Scalar(ScalarType::Boolean),
                            source: explicit.source.clone(),
                        }),
                        (left, right) => left.or(right),
                    };
                if explicit.xml_missing.is_none() {
                    explicit.xml_missing = rule.xml_missing;
                }
            } else {
                inherited.push(rule);
            }
        }
    }
    owner.presence.extend(inherited);
    Ok(())
}
