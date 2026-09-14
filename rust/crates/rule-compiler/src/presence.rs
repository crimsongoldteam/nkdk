//! Shared meaning of absent and empty representation forms.
use nkdk_rule_model::*;

pub(crate) fn supported_empty(rule: &LinkedPresence) -> bool {
    rule.xml_empty.iter().all(|empty| {
        matches!(empty.form, EmptyKind::Element | EmptyKind::Nil)
            && matches!(empty.denotes.kind, LinkedExpressionKind::Absent)
    })
}

pub(crate) fn supported_canonical(rule: &LinkedPresence) -> bool {
    if rule.canonical.is_empty() {
        return true;
    }
    let [canonical] = rule.canonical.as_slice() else {
        return false;
    };
    if canonical.form == XmlForm::Missing && canonical.when.is_some() {
        return true;
    }
    if !matches!(
        canonical.form,
        XmlForm::Nil | XmlForm::EmptyElement | XmlForm::Missing
    ) {
        return false;
    }
    let Some(LinkedExpression {
        kind:
            LinkedExpressionKind::Operation {
                operator: LinkedOperator::Not,
                arguments,
            },
        ..
    }) = &canonical.when
    else {
        return false;
    };
    let [
        LinkedExpression {
            kind:
                LinkedExpressionKind::Operation {
                    operator: LinkedOperator::State(StatePredicate::Present),
                    arguments,
                },
            ..
        },
    ] = arguments.as_slice()
    else {
        return false;
    };
    let [value] = arguments.as_slice() else {
        return false;
    };
    matches!(
        (&rule.target, &value.kind),
        (
            LinkedPresenceTarget::SelfValue,
            LinkedExpressionKind::SelfValue
        )
    ) || matches!((&rule.target, &value.kind), (LinkedPresenceTarget::Field(a), LinkedExpressionKind::Field(b)) if a == b)
}
