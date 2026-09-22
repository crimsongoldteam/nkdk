use super::*;

pub(super) fn resolve(
    module: &Module,
    expression: &Expression,
    expected: &LinkedType,
    modules: &BTreeMap<&str, &Module>,
    ids: &BTreeMap<&str, u32>,
) -> Result<LinkedExpression, Diagnostic> {
    resolve_scoped(
        module,
        expression,
        expected,
        modules,
        ids,
        &expressions::Scope::default(),
    )
}

fn resolve_scoped(
    module: &Module,
    expression: &Expression,
    expected: &LinkedType,
    modules: &BTreeMap<&str, &Module>,
    ids: &BTreeMap<&str, u32>,
    scope: &expressions::Scope,
) -> Result<LinkedExpression, Diagnostic> {
    let expected_value = match expected {
        LinkedType::Optional(inner) => inner.as_ref(),
        value => value,
    };
    let expected_shape = if let Some((id, _, _)) = expected_value.as_reference() {
        let target = modules
            .values()
            .find(|module| ids[module.id.as_str()] == id)
            .expect("linked declaration");
        expressions::module_shape(target, modules, ids, &mut BTreeSet::new())?
    } else {
        expected_value.clone()
    };
    let (kind, value_type) = match &expression.kind {
        ExpressionKind::Absent => (LinkedExpressionKind::Absent, LinkedType::Absent),
        ExpressionKind::ConstructVariant { name, value } => {
            let LinkedType::Choice(variants) = &expected_shape else {
                return Err(type_error(expression));
            };
            let index = variants
                .iter()
                .position(|variant| variant.name == *name)
                .ok_or_else(|| {
                    diagnostic(
                        "unknown_choice_variant",
                        &expression.source,
                        "Choice variant is not declared",
                    )
                })?;
            let selected =
                resolve_scoped(module, value, &variants[index].value, modules, ids, scope)?;
            (
                LinkedExpressionKind::Operation {
                    operator: LinkedOperator::ConstructVariant(index as u32),
                    arguments: vec![selected],
                },
                expected.clone(),
            )
        }
        ExpressionKind::Conditional {
            condition,
            then_value,
            else_value,
        } => {
            let condition =
                expressions::resolve_expression_in(module, condition, modules, ids, scope)?;
            expressions::require_boolean(&condition)?;
            let then_value = resolve_scoped(module, then_value, expected, modules, ids, scope)?;
            let else_value = resolve_scoped(module, else_value, expected, modules, ids, scope)?;
            let optional = [&then_value.value_type, &else_value.value_type]
                .iter()
                .any(|value| matches!(value, LinkedType::Absent | LinkedType::Optional(_)));
            let value_type = if optional {
                LinkedType::Optional(Box::new(expected.clone()))
            } else {
                expected.clone()
            };
            (
                LinkedExpressionKind::Operation {
                    operator: LinkedOperator::Conditional,
                    arguments: vec![condition, then_value, else_value],
                },
                value_type,
            )
        }
        ExpressionKind::Concat(items) if matches!(expected_shape, LinkedType::Sequence(_)) => {
            let arguments = items
                .iter()
                .map(|value| {
                    let result = resolve_scoped(module, value, expected, modules, ids, scope)?;
                    if !expressions::same_type(&result.value_type, expected) {
                        return Err(type_error(value));
                    }
                    Ok(result)
                })
                .collect::<Result<_, Diagnostic>>()?;
            (
                LinkedExpressionKind::Operation {
                    operator: LinkedOperator::SequenceConcat,
                    arguments,
                },
                expected.clone(),
            )
        }
        ExpressionKind::Sequence(items) => {
            let LinkedType::Sequence(item) = &expected_shape else {
                return Err(type_error(expression));
            };
            let arguments = items
                .iter()
                .map(|value| {
                    let result = resolve_scoped(module, value, item, modules, ids, scope)?;
                    if !expressions::same_type(&result.value_type, item) {
                        return Err(type_error(value));
                    }
                    Ok(result)
                })
                .collect::<Result<_, Diagnostic>>()?;
            (
                LinkedExpressionKind::Operation {
                    operator: LinkedOperator::Sequence,
                    arguments,
                },
                expected.clone(),
            )
        }
        ExpressionKind::Record(fields) => {
            let LinkedType::Record(expected_fields) = &expected_shape else {
                return Err(diagnostic(
                    "expression_type_mismatch",
                    &expression.source,
                    &format!("Record denotation expected a record target, got {expected_shape:?}"),
                ));
            };
            if fields.len() != expected_fields.len() {
                return Err(diagnostic(
                    "expression_type_mismatch",
                    &expression.source,
                    &format!(
                        "Record denotation has {} fields, expected {}",
                        fields.len(),
                        expected_fields.len()
                    ),
                ));
            }
            let arguments = expected_fields
                .iter()
                .map(|field| {
                    let value = fields
                        .iter()
                        .find(|value| value.name == field.name)
                        .ok_or_else(|| type_error(expression))?;
                    let result =
                        resolve_scoped(module, &value.value, &field.value, modules, ids, scope)?;
                    if !expressions::same_type(&result.value_type, &field.value) {
                        return Err(diagnostic(
                            "expression_type_mismatch",
                            &value.value.source,
                            &format!(
                                "Denotation field has type {:?}, expected {:?}",
                                result.value_type, field.value
                            ),
                        ));
                    }
                    Ok(result)
                })
                .collect::<Result<_, Diagnostic>>()?;
            (
                LinkedExpressionKind::Operation {
                    operator: LinkedOperator::Record(
                        expected_fields
                            .iter()
                            .map(|field| field.name.clone())
                            .collect(),
                    ),
                    arguments,
                },
                expected.clone(),
            )
        }
        ExpressionKind::Map {
            input,
            binding,
            value,
        } => {
            let LinkedType::Sequence(expected_item) = &expected_shape else {
                return Err(diagnostic(
                    "expression_type_mismatch",
                    &expression.source,
                    &format!("Map target must be a sequence, got {expected_shape:?}"),
                ));
            };
            let input = expressions::resolve_expression_in(module, input, modules, ids, scope)?;
            let LinkedType::Sequence(input_item) = &input.value_type else {
                return Err(diagnostic(
                    "expression_type_mismatch",
                    &expression.source,
                    &format!("Map input must be a sequence, got {:?}", input.value_type),
                ));
            };
            let slot = scope.variables.len() as u32;
            let nested = scope.bind(binding, *input_item.clone(), &expression.source)?;
            let value = resolve_scoped(module, value, expected_item, modules, ids, &nested)?;
            (
                LinkedExpressionKind::Operation {
                    operator: LinkedOperator::Map(slot),
                    arguments: vec![input, value],
                },
                expected.clone(),
            )
        }
        _ => {
            let mut value =
                expressions::resolve_expression_in(module, expression, modules, ids, scope)?;
            expressions::contextual_literals(&expected_shape, &mut value)?;
            let compatible = expressions::same_type(&value.value_type, &expected_shape)
                || matches!(&value.value_type, LinkedType::Optional(inner) if expressions::same_type(inner, &expected_shape));
            if !compatible {
                return Err(diagnostic(
                    "expression_type_mismatch",
                    &expression.source,
                    &format!(
                        "Denotation has type {:?}, expected {:?}",
                        value.value_type, expected_shape
                    ),
                ));
            }
            return Ok(value);
        }
    };
    Ok(LinkedExpression {
        kind,
        value_type,
        source: expression.source.clone(),
    })
}
fn type_error(expression: &Expression) -> Diagnostic {
    diagnostic(
        "expression_type_mismatch",
        &expression.source,
        "Denotation does not match its target type",
    )
}
