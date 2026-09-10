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
