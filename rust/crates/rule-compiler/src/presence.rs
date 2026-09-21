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
    rule.canonical.iter().enumerate().all(|(index, canonical)| {
        matches!(
            canonical.form,
            XmlForm::Nil | XmlForm::EmptyElement | XmlForm::Missing | XmlForm::Ordinary
        ) && (canonical.when.is_some() || index + 1 == rule.canonical.len())
    })
}
