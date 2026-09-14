use super::*;

pub(super) fn resolve(
    module: &Module,
    expression: &Expression,
    expected: &LinkedType,
    modules: &BTreeMap<&str, &Module>,
    ids: &BTreeMap<&str, u32>,
) -> Result<LinkedExpression, Diagnostic> {
    let (kind, value_type) = match &expression.kind {
        ExpressionKind::Absent => (LinkedExpressionKind::Absent, LinkedType::Absent),
        ExpressionKind::Conditional {
            condition,
            then_value,
            else_value,
        } => {
            let condition = expressions::resolve_expression(module, condition, modules, ids)?;
            expressions::require_boolean(&condition)?;
            let then_value = resolve(module, then_value, expected, modules, ids)?;
            let else_value = resolve(module, else_value, expected, modules, ids)?;
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
        ExpressionKind::Concat(items) if matches!(expected, LinkedType::Sequence(_)) => {
            let arguments = items
                .iter()
                .map(|value| {
                    let result = resolve(module, value, expected, modules, ids)?;
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
            let LinkedType::Sequence(item) = expected else {
                return Err(type_error(expression));
            };
            let arguments = items
                .iter()
                .map(|value| {
                    let result = resolve(module, value, item, modules, ids)?;
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
            let LinkedType::Record(expected_fields) = expected else {
                return Err(type_error(expression));
            };
            if fields.len() != expected_fields.len() {
                return Err(type_error(expression));
            }
            let arguments = expected_fields
                .iter()
                .map(|field| {
                    let value = fields
                        .iter()
                        .find(|value| value.name == field.name)
                        .ok_or_else(|| type_error(expression))?;
                    let result = resolve(module, &value.value, &field.value, modules, ids)?;
                    if !expressions::same_type(&result.value_type, &field.value) {
                        return Err(type_error(&value.value));
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
        _ => {
            let mut value = expressions::resolve_expression(module, expression, modules, ids)?;
            expressions::contextual_literals(expected, &mut value)?;
            let compatible = expressions::same_type(&value.value_type, expected)
                || matches!(&value.value_type, LinkedType::Optional(inner) if expressions::same_type(inner, expected));
            if !compatible {
                return Err(type_error(expression));
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
