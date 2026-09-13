use nkdk_rule_model::{LinkedExpression, LinkedExpressionKind};

pub(crate) fn replace_self(expression: &mut LinkedExpression, index: usize) {
    match &mut expression.kind {
        LinkedExpressionKind::SelfValue => {
            expression.kind = LinkedExpressionKind::Field(index as u32)
        }
        LinkedExpressionKind::Operation { arguments, .. } => {
            for argument in arguments {
                replace_self(argument, index)
            }
        }
        _ => (),
    }
}

/// Project a record contract into one field of its physical owner.
pub(crate) fn project_record(
    expression: &mut LinkedExpression,
    index: usize,
    record: &nkdk_rule_model::LinkedType,
) {
    use nkdk_rule_model::LinkedOperator;
    let owner = LinkedExpression {
        kind: LinkedExpressionKind::Field(index as u32),
        value_type: record.clone(),
        source: expression.source.clone(),
    };
    match &mut expression.kind {
        LinkedExpressionKind::SelfValue => *expression = owner,
        LinkedExpressionKind::Field(slot) => {
            expression.kind = LinkedExpressionKind::Operation {
                operator: LinkedOperator::Get(*slot),
                arguments: vec![owner],
            };
        }
        LinkedExpressionKind::Operation { arguments, .. } => {
            for argument in arguments {
                project_record(argument, index, record);
            }
        }
        _ => (),
    }
}

/// Visit each expression owned by one constraint, including its diagnostic message.
pub(crate) fn map_constraint(
    constraint: &mut nkdk_rule_model::LinkedConstraint,
    mut project: impl FnMut(&mut LinkedExpression),
) {
    project(&mut constraint.assertion);
    if let Some(when) = &mut constraint.when {
        project(when);
    }
    for part in &mut constraint.diagnostic.message {
        if let nkdk_rule_model::LinkedMessagePart::Expression(value) = part {
            project(value);
        }
    }
}
