use nkdk_conversion_core::{RuntimeDiagnostic, annotations::*};
use std::num::NonZeroU32;

#[test]
fn annotations_accept_only_semantic_issues_at_the_exact_occurrence() {
    assert_eq!(
        RuntimeDiagnostic::new("yaml.syntax", "broken").kind,
        IssueKind::Structural
    );
    assert_eq!(
        RuntimeDiagnostic::declared(
            None,
            Some("structure"),
            nkdk_conversion_core::Severity::Error,
            "language"
        )
        .kind,
        IssueKind::Semantic
    );
    let parent = RuntimeDiagnostic::declared(
        Some("fixture.order"),
        None,
        nkdk_conversion_core::Severity::Error,
        "order",
    )
    .field("Title");
    let child = RuntimeDiagnostic::declared(
        Some("fixture.language"),
        None,
        nkdk_conversion_core::Severity::Error,
        "language",
    )
    .field("Title")
    .field("de");
    let duplicate = child.clone().with_occurrence(NonZeroU32::new(2).unwrap());
    for (parent_present, child_present) in [(true, true), (false, true), (true, false)] {
        let mut issues = Vec::new();
        if parent_present {
            issues.push(parent.clone());
        }
        if child_present {
            issues.push(child.clone());
        }
        for (target, expected) in [(&parent, parent_present), (&child, child_present)] {
            let result = evaluate(Annotation::Invalid, target, &issues, false, false);
            assert_eq!(result.accepted.len(), usize::from(expected));
            assert_eq!(
                result.contract,
                if expected {
                    None
                } else {
                    Some(ContractViolation::Unnecessary)
                }
            );
        }
    }
    let mut structural = child.clone();
    structural.kind = IssueKind::Structural;
    let issues = [structural.clone(), duplicate.clone()];
    let result = evaluate(Annotation::Invalid, &child, &issues, false, false);
    assert!(result.accepted.is_empty());
    assert_eq!(result.visible.len(), 2);
    let result = evaluate(Annotation::Invalid, &duplicate, &issues, false, false);
    assert_eq!(result.accepted, [&duplicate]);
    assert_eq!(result.visible, [&structural]);
    assert_eq!(
        evaluate(Annotation::Important, &child, &[], false, false).contract,
        Some(ContractViolation::ImportantNotRegistered)
    );
    assert_eq!(
        evaluate(Annotation::Invalid, &child, &[], true, false).contract,
        Some(ContractViolation::ImportantRequired)
    );
    let pending = evaluate(Annotation::Invalid, &child, &[], false, true);
    assert_eq!(pending.state, Some(State::Pending));
    assert_eq!(pending.contract, None);
}
