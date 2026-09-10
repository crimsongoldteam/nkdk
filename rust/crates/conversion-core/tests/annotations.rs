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

#[test]
fn keyed_mapping_derives_duplicate_tags_and_checks_their_numbering() {
    use nkdk_conversion_core::{Position, Severity};
    let rows = [
        ("ru", Position::default()),
        ("en", Position::default()),
        ("ru", Position::default()),
        ("ru", Position::default()),
    ];
    let tags = Mapping::infer("Title", rows.iter().copied(), &[]).unwrap();
    assert_eq!(tags.label(Some(0)), None);
    assert_eq!(tags.label(Some(2)).as_deref(), Some("!xml/invalid"));
    assert_eq!(tags.label(Some(3)).as_deref(), Some("!xml/invalid/2"));
    assert!(
        tags.validate("Title", rows.iter().copied(), vec![])
            .is_empty()
    );
    assert!(
        !Mapping::default()
            .validate("Title", rows.iter().copied(), vec![])
            .is_empty()
    );
    let mut bad = Mapping::default();
    bad.read(Some(2), Some("!xml/invalid/2"), Position::default())
        .unwrap();
    assert!(
        bad.validate("Title", rows.iter().copied(), vec![])
            .iter()
            .any(|error| error.code.as_deref() == Some("yaml.annotation-number"))
    );
    for tag in [
        "!xml/invalid/1",
        "!xml/invalid/0",
        "!xml/invalid/02",
        "!xml/raw",
        "!xml/invalid/4294967296",
    ] {
        assert!(
            Mapping::default()
                .read(Some(0), Some(tag), Position::default())
                .is_err(),
            "{tag}"
        );
    }
    let unknown = RuntimeDiagnostic::declared(
        None,
        Some("structure"),
        Severity::Error,
        "Unregistered language",
    )
    .field("Title")
    .field("de")
    .with_occurrence(NonZeroU32::new(1).unwrap());
    let rows = [("de", Position::default()), ("de", Position::default())];
    let tags = Mapping::infer(
        "Title",
        rows.iter().copied(),
        std::slice::from_ref(&unknown),
    )
    .unwrap();
    assert_eq!(tags.label(Some(0)).as_deref(), Some("!xml/invalid"));
    assert_eq!(tags.label(Some(1)).as_deref(), Some("!xml/invalid/2"));
    assert!(
        tags.validate("Title", rows.iter().copied(), vec![unknown])
            .is_empty()
    );
    assert!(
        tags.validate("Title", rows.iter().copied(), vec![])
            .iter()
            .any(|error| error.code.as_deref() == Some("xml/anomaly-tag-unnecessary"))
    );
    let structural =
        RuntimeDiagnostic::new("input.not-ready", "Missing language input").field("Title");
    assert!(Mapping::infer("Title", rows.iter().copied(), &[structural]).is_err());
}
