use super::*;

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
                        project_fields(value, index as u32, variant as u32);
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
