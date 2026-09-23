use super::*;

pub(super) fn validate_selectors(program: &Program) -> Result<(), Diagnostic> {
    for choice in &program.entries {
        let (
            LinkedType::Choice(variants),
            YamlRepresentation::Choice {
                variants: selectors,
                ..
            },
        ) = (&choice.value, &choice.yaml)
        else {
            continue;
        };
        let mut sequence = None;
        let mut mappings = BTreeMap::new();
        for selector in selectors {
            let variant = variants
                .iter()
                .find(|variant| variant.name == selector.variant)
                .expect("choice selector names were checked while linking");
            let (target, _, _) = variant
                .value
                .as_reference()
                .expect("checked choice reference");
            let target = program
                .entries
                .iter()
                .find(|entry| entry.id == target)
                .expect("linked choice variant");
            match (&selector.form, &target.yaml) {
                (YamlChoiceForm::Sequence, YamlRepresentation::Sequence { .. }) => {
                    if let Some(first) = sequence.replace(&selector.source) {
                        let mut error = diagnostic(
                            "choice_selector_collision",
                            &selector.source,
                            "Several choice variants select the YAML sequence form",
                        );
                        error.related.push(first.clone());
                        return Err(error);
                    }
                }
                (YamlChoiceForm::Mapping { key, value }, YamlRepresentation::Mapping(_)) => {
                    let selector_key = (key.as_str(), value.as_deref());
                    if let Some(first) = mappings.insert(selector_key, &selector.source) {
                        let mut error = diagnostic(
                            "choice_selector_collision",
                            &selector.source,
                            "Several choice variants have the same YAML mapping selector",
                        );
                        error.related.push(first.clone());
                        return Err(error);
                    }
                }
                _ => {
                    return Err(diagnostic(
                        "choice_selector_shape",
                        &selector.source,
                        "YAML choice selector does not match the selected declaration shape",
                    ));
                }
            }
        }
        for variant in variants {
            let Some((target, _, _)) = variant.value.as_reference() else {
                continue;
            };
            let target = program
                .entries
                .iter()
                .find(|entry| entry.id == target)
                .expect("linked choice variant");
            if matches!(
                target.yaml,
                YamlRepresentation::Mapping(_) | YamlRepresentation::Sequence { .. }
            ) && !selectors
                .iter()
                .any(|selector| selector.variant == variant.name)
            {
                return Err(diagnostic(
                    "missing_choice_selector",
                    &variant.source,
                    "A structured YAML choice variant requires a selector",
                ));
            }
        }
    }
    Ok(())
}

pub(super) fn lift(entries: &mut [LinkedEntry]) -> Result<(), Diagnostic> {
    let originals = scalar_contracts::snapshot(entries);
    for owner in entries {
        for (index, field, choice) in scalar_contracts::referenced_fields(&owner.value, &originals)
        {
            let LinkedType::Choice(variants) = &choice.value else {
                continue;
            };
            if !choice.constraints.is_empty() {
                return Err(diagnostic(
                    "unsupported_choice_contract",
                    &choice.source,
                    "Choice-level constraints need variant expressions; use variant constraints in this profile",
                ));
            }
            for (variant, item) in variants.iter().enumerate() {
                let LinkedType::Reference(id) = item.value else {
                    continue;
                };
                let common = &originals[&id];
                for constraint in &common.constraints {
                    if constraint.for_each.is_some()
                        || !common.inputs.is_empty()
                        || !common.parameters.is_empty()
                    {
                        return Err(diagnostic(
                            "unsupported_choice_contract",
                            &constraint.source,
                            "Text choice constraints currently require plain variant values",
                        ));
                    }
                    let mut constraint = constraint.clone();
                    constraint.id = format!("{}.{}.{}", field.name, item.name, constraint.id);
                    let project = |value: &mut LinkedExpression| {
                        crate::expressions::project_record(value, index, &common.value);
                        if matches!(common.value, LinkedType::Scalar(_)) {
                            project_scalar(value, index as u32, variant as u32);
                        } else {
                            project_fields(value, index as u32, variant as u32);
                        }
                    };
                    crate::expressions::map_constraint(&mut constraint, project);
                    let guard = LinkedExpression {
                        kind: LinkedExpressionKind::Operation {
                            operator: LinkedOperator::IsVariant(variant as u32),
                            arguments: vec![LinkedExpression {
                                kind: LinkedExpressionKind::Field(index as u32),
                                value_type: choice.value.clone(),
                                source: constraint.source.clone(),
                            }],
                        },
                        value_type: LinkedType::Scalar(ScalarType::Boolean),
                        source: constraint.source.clone(),
                    };
                    constraint.when = Some(if let Some(when) = constraint.when.take() {
                        LinkedExpression {
                            kind: LinkedExpressionKind::Operation {
                                operator: LinkedOperator::And,
                                arguments: vec![guard, when],
                            },
                            value_type: LinkedType::Scalar(ScalarType::Boolean),
                            source: constraint.source.clone(),
                        }
                    } else {
                        guard
                    });
                    constraint.diagnostic.at = match constraint.diagnostic.at {
                        LinkedDiagnosticTarget::SelfValue | LinkedDiagnosticTarget::Field(_) => {
                            LinkedDiagnosticTarget::Field(index as u32)
                        }
                        _ => {
                            return Err(diagnostic(
                                "unsupported_choice_contract",
                                &constraint.source,
                                "Text choice diagnostics must address the variant value",
                            ));
                        }
                    };
                    for form in &mut constraint.forms {
                        *form = match form {
                            LinkedForm::XmlText => LinkedForm::XmlRecord,
                            LinkedForm::YamlScalar => LinkedForm::YamlMapping,
                            _ => {
                                return Err(diagnostic(
                                    "unsupported_choice_contract",
                                    &constraint.source,
                                    "Text choice variant needs scalar forms",
                                ));
                            }
                        };
                    }
                    owner.constraints.push(constraint);
                }
            }
        }
    }
    Ok(())
}

fn project_fields(value: &mut LinkedExpression, owner: u32, variant: u32) {
    if let LinkedExpressionKind::Operation {
        operator,
        arguments,
    } = &mut value.kind
    {
        if let LinkedOperator::Get(field) = operator
            && arguments.len() == 1
            && arguments[0].kind == LinkedExpressionKind::Field(owner)
        {
            *operator = LinkedOperator::VariantField {
                variant,
                field: *field,
            };
        } else {
            for argument in arguments {
                project_fields(argument, owner, variant);
            }
        }
    }
}

fn project_scalar(value: &mut LinkedExpression, owner: u32, variant: u32) {
    if value.kind == LinkedExpressionKind::Field(owner) {
        value.kind = LinkedExpressionKind::Operation {
            operator: LinkedOperator::VariantValue(variant),
            arguments: vec![value.clone()],
        };
    } else if let LinkedExpressionKind::Operation { arguments, .. } = &mut value.kind {
        for argument in arguments {
            project_scalar(argument, owner, variant);
        }
    }
}
