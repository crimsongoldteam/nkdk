use super::*;

/// Place constraints on a collection property in the collection value scope.
pub(super) fn merge(
    common: &LinkedEntry,
    owner: &LinkedEntry,
    program: &Program,
    bindings: &[LinkedBinding],
    arguments: &[LinkedExpression],
) -> Result<LinkedEntry, Diagnostic> {
    let mut result = common.clone();
    result.inputs = owner.inputs.clone();
    for constraint in &mut result.constraints {
        super::shorthand::specialize_constraint(constraint, bindings, arguments, owner)?;
    }
    for mut constraint in owner.constraints.clone() {
        rebind(&mut constraint.assertion, common, owner, program)?;
        if let Some(when) = &mut constraint.when {
            rebind(when, common, owner, program)?;
        }
        if let Some(iteration) = &mut constraint.for_each {
            rebind(&mut iteration.input, common, owner, program)?;
        }
        for part in &mut constraint.diagnostic.message {
            if let LinkedMessagePart::Expression(value) = part {
                rebind(value, common, owner, program)?;
            }
        }
        constraint.diagnostic.at = match constraint.diagnostic.at {
            LinkedDiagnosticTarget::Field(0) => LinkedDiagnosticTarget::SelfValue,
            LinkedDiagnosticTarget::SelfValue => LinkedDiagnosticTarget::SelfValue,
            LinkedDiagnosticTarget::Field(_) | LinkedDiagnosticTarget::Occurrence { .. } => {
                return Err(unsupported(
                    owner,
                    "Collection constraints must target their collection property",
                ));
            }
        };
        result.constraints.push(constraint);
    }
    Ok(result)
}

fn rebind(
    value: &mut LinkedExpression,
    common: &LinkedEntry,
    owner: &LinkedEntry,
    program: &Program,
) -> Result<(), Diagnostic> {
    match &mut value.kind {
        LinkedExpressionKind::Field(0) => {
            value.kind = LinkedExpressionKind::SelfValue;
            value.value_type = match &common.value {
                LinkedType::Sequence(item) => {
                    let item = if let Some((id, _, _)) = item.as_reference() {
                        program
                            .entries
                            .iter()
                            .find(|entry| entry.id == id)
                            .expect("linked collection item")
                            .value
                            .clone()
                    } else {
                        *item.clone()
                    };
                    LinkedType::Sequence(Box::new(item))
                }
                value => value.clone(),
            };
        }
        LinkedExpressionKind::Field(_) | LinkedExpressionKind::SelfValue => {
            return Err(unsupported(
                owner,
                "Collection constraints can read only their collection property",
            ));
        }
        LinkedExpressionKind::Operation { arguments, .. } => {
            for argument in arguments {
                rebind(argument, common, owner, program)?;
            }
        }
        _ => {}
    }
    Ok(())
}
