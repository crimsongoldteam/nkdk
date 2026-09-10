use super::*;
use expressions::{Scope, resolve_expression_in};

pub(super) fn resolve(
    module: &Module,
    expression: &Expression,
    modules: &BTreeMap<&str, &Module>,
    ids: &BTreeMap<&str, u32>,
    scope: &Scope,
) -> Result<LinkedExpression, Diagnostic> {
    let (operator, arguments, value_type) = match &expression.kind {
        ExpressionKind::StateTest { predicate, value } => {
            let value = resolve_expression_in(module, value, modules, ids, scope)?;
            (
                LinkedOperator::State(predicate.clone()),
                vec![value],
                LinkedType::Scalar(ScalarType::Boolean),
            )
        }
        ExpressionKind::Take { input, count } => {
            let input = resolve_expression_in(module, input, modules, ids, scope)?;
            sequence_item(&input)?;
            let value_type = input.value_type.clone();
            (LinkedOperator::Take(*count), vec![input], value_type)
        }
        ExpressionKind::FirstBy {
            input,
            binding,
            key,
        }
        | ExpressionKind::Ordered {
            input,
            binding,
            key,
            ..
        } => {
            let input = resolve_expression_in(module, input, modules, ids, scope)?;
            let item = sequence_item(&input)?.clone();
            let slot = scope.variables.len() as u32;
            let nested = scope.bind(binding, item, &expression.source)?;
            let key = resolve_expression_in(module, key, modules, ids, &nested)?;
            if !matches!(key.value_type, LinkedType::Scalar(_)) {
                return Err(diagnostic(
                    "expression_type_mismatch",
                    &key.source,
                    "Collection key must be scalar",
                ));
            }
            if let ExpressionKind::Ordered { unique, first, .. } = &expression.kind {
                if key.value_type != LinkedType::Scalar(ScalarType::Text) {
                    return Err(diagnostic(
                        "expression_type_mismatch",
                        &key.source,
                        "UTF-16 ordering requires text keys",
                    ));
                }
                let mut arguments = vec![input, key];
                for value in first {
                    let value = resolve_expression_in(module, value, modules, ids, scope)?;
                    if value.value_type != LinkedType::Scalar(ScalarType::Text) {
                        return Err(diagnostic(
                            "expression_type_mismatch",
                            &value.source,
                            "Preferred key must be text",
                        ));
                    }
                    arguments.push(value);
                }
                (
                    LinkedOperator::Ordered {
                        slot,
                        unique: *unique,
                    },
                    arguments,
                    LinkedType::Scalar(ScalarType::Boolean),
                )
            } else {
                let value_type = input.value_type.clone();
                (LinkedOperator::FirstBy(slot), vec![input, key], value_type)
            }
        }
        _ => unreachable!("caller selects collection operators"),
    };
    Ok(LinkedExpression {
        kind: LinkedExpressionKind::Operation {
            operator,
            arguments,
        },
        value_type,
        source: expression.source.clone(),
    })
}

fn sequence_item(value: &LinkedExpression) -> Result<&LinkedType, Diagnostic> {
    if let LinkedType::Sequence(item) = &value.value_type {
        Ok(item)
    } else {
        Err(diagnostic(
            "expression_type_mismatch",
            &value.source,
            "Collection operator requires sequence input",
        ))
    }
}
