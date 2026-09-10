use super::*;

pub(super) fn yaml_table(
    table: &[BooleanLexeme],
    presence: &[LinkedPresence],
    source: &SourceLocation,
) -> Result<(), Diagnostic> {
    if table.len() != 1 {
        return validate_boolean_table(table, source);
    }
    let missing_value = !table[0].value;
    let reversible = presence.iter().any(|rule| {
        rule.target == LinkedPresenceTarget::SelfValue
            && rule
                .yaml_missing
                .as_ref()
                .and_then(|value| evaluate(value, None))
                == Some(missing_value)
            && rule.yaml_omit_when.as_ref().is_some_and(|when| {
                evaluate(when, Some(missing_value)) == Some(true)
                    && evaluate(when, Some(!missing_value)) == Some(false)
            })
    });
    if !reversible {
        return Err(diagnostic(
            "unrepresented_boolean_value",
            source,
            "The missing boolean literal requires provably reversible YAML absence",
        ));
    }
    Ok(())
}

// Exhaustive proof over the two boolean values, not a runtime interpreter.
// Unknown inputs or unsupported operations do not count as a proof.
fn evaluate(value: &LinkedExpression, self_value: Option<bool>) -> Option<bool> {
    match &value.kind {
        LinkedExpressionKind::SelfValue => self_value,
        LinkedExpressionKind::Literal(ScalarLiteral::Boolean(value)) => Some(*value),
        LinkedExpressionKind::Operation {
            operator,
            arguments,
        } => {
            let argument = |index: usize| evaluate(&arguments[index], self_value);
            match operator {
                LinkedOperator::Not => Some(!argument(0)?),
                LinkedOperator::Equal => Some(argument(0)? == argument(1)?),
                LinkedOperator::And => arguments.iter().try_fold(true, |result, value| {
                    Some(result & evaluate(value, self_value)?)
                }),
                LinkedOperator::Or => arguments.iter().try_fold(false, |result, value| {
                    Some(result | evaluate(value, self_value)?)
                }),
                LinkedOperator::Conditional => argument(if argument(0)? { 1 } else { 2 }),
                _ => None,
            }
        }
        _ => None,
    }
}
