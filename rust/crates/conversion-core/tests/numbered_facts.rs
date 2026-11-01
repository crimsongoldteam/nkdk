use nkdk_conversion_core::facts::prepared::{
    FactBudget, FactId, FactLimit, TextFactsBuilder, text_number_index,
};
use nkdk_conversion_core::facts::text::TextBudget;
use nkdk_conversion_core::facts::{FactState, Generation};

fn builder(entries: usize) -> TextFactsBuilder {
    TextFactsBuilder::with_indexes(
        Generation(1),
        vec![text_number_index(
            Generation(1),
            ["scope", "name"],
            [0],
            true,
        )],
        FactBudget {
            rows: 100,
            text: TextBudget {
                entries,
                bytes: 10_000,
            },
        },
    )
}

#[test]
fn reserves_late_values_before_assigning_requests_and_keeps_scopes_independent() {
    let mut b = builder(100);
    for key in [["a", "new"], ["b", "new"], ["a", "second"], ["a", "new"]] {
        b.request_number(FactId(0), &key, 1).unwrap();
    }
    for key in [["a", "old"], ["a", "duplicate-old"]] {
        b.push_parts(FactId(0), &key, "1").unwrap();
    }
    assert_eq!(
        b.snapshot()
            .lookup_parts(Generation(1), FactId(0), &["a", "new"]),
        FactState::Unready
    );
    b.publish(FactId(0)).unwrap();
    let facts = b.finish();
    for (scope, name, value) in [
        ("a", "new", "2"),
        ("a", "second", "3"),
        ("b", "new", "1"),
        ("a", "old", "1"),
        ("a", "duplicate-old", "1"),
    ] {
        assert_eq!(
            facts.lookup_parts(Generation(1), FactId(0), &[scope, name]),
            FactState::Ready(value)
        );
    }
    assert_eq!(
        facts.lookup_parts(Generation(2), FactId(0), &["a", "new"]),
        FactState::Unready
    );
}

#[test]
fn retained_values_win_without_hiding_conflicts_or_invalid_spelling() {
    let mut b = builder(100);
    for (name, values) in [
        ("old", vec!["9", "9"]),
        ("conflict", vec!["4", "5"]),
        ("invalid", vec!["oops"]),
        ("large", vec!["9007199254740993"]),
    ] {
        b.request_number(FactId(0), &["s", name], 1).unwrap();
        for value in values {
            b.push_parts(FactId(0), &["s", name], value).unwrap();
        }
    }
    let f = b.finish();
    for (name, expected) in [
        ("old", FactState::Ready("9")),
        ("conflict", FactState::Ambiguous),
        ("invalid", FactState::Ready("oops")),
        ("large", FactState::Ready("9007199254740993")),
    ] {
        assert_eq!(
            f.lookup_parts(Generation(1), FactId(0), &["s", name]),
            expected
        );
    }
}

#[test]
fn reserved_numbers_without_identity_block_only_their_own_scope() {
    let mut b = builder(100);
    b.request_number(FactId(0), &["a", "new"], 1).unwrap();
    b.request_number(FactId(0), &["b", "new"], 1).unwrap();
    for value in ["1", "2", "2", "-3", "03", "oops", "18446744073709551616"] {
        b.reserve_number(FactId(0), &["a"], value).unwrap();
    }
    let f = b.finish();
    for (scope, expected) in [("a", "3"), ("b", "1")] {
        assert_eq!(
            f.lookup_parts(Generation(1), FactId(0), &[scope, "new"]),
            FactState::Ready(expected)
        );
    }
    assert_eq!(
        f.lookup_parts(Generation(1), FactId(0), &["a", "1"]),
        FactState::Missing
    );
}

#[test]
fn xml_reservations_keep_opaque_descendants_and_fail_as_one_index() {
    use nkdk_conversion_core::xml::{
        self,
        attribute_scan::{Preserved, Profile},
    };
    let profile = Profile {
        attribute: ("", "id"),
        default_scope: 0,
        max_depth: 16,
        boundaries: &[(("", "Other"), 1)],
    };
    let scopes: &[&[&str]] = &[&["a"], &["b"]];
    let patch = xml::Patch::read(
        b"_id: '1'\nNested: {_id: '2'}\nOther: {_id: '1'}\nRemoved: {_id: null}",
        &[],
        &[],
    )
    .unwrap();
    let mut b = builder(100);
    for scope in ["a", "b"] {
        b.request_number(FactId(0), &[scope, "new"], 1).unwrap();
    }
    b.reserve_attributes(
        FactId(0),
        &profile,
        scopes,
        Preserved {
            patch: &patch,
            root: ("", "Opaque"),
            namespaces: &[],
        },
    )
    .unwrap();
    let facts = b.finish();
    for (scope, expected) in [("a", "3"), ("b", "2")] {
        assert_eq!(
            facts.lookup_parts(Generation(1), FactId(0), &[scope, "new"]),
            FactState::Ready(expected)
        );
    }
    for (source, selected_scopes) in [
        (b"<Root id='1'><Broken></Root>".as_slice(), scopes),
        (b"<Root><Other id='1'/></Root>", &scopes[..1]),
    ] {
        let mut b = builder(100);
        b.request_number(FactId(0), &["a", "new"], 1).unwrap();
        assert!(
            b.reserve_attributes(
                FactId(0),
                &profile,
                selected_scopes,
                xml::DocumentSource(source)
            )
            .is_err()
        );
        assert_eq!(
            b.finish()
                .lookup_parts(Generation(1), FactId(0), &["a", "new"]),
            FactState::Unready
        );
    }
}

#[test]
fn original_forms_and_preserved_copies_reserve_the_same_numbers() {
    use nkdk_conversion_core::xml::{
        self,
        attribute_scan::{Preserved, Profile},
    };
    const NS: &str = "http://v8.1c.ru/8.3/xcf/logform";
    let boundaries = [
        ("Attributes", 1),
        ("Attribute", 1),
        ("Columns", 1),
        ("Column", 1),
        ("Commands", 2),
        ("Command", 2),
        ("Parameters", 3),
        ("Parameter", 3),
    ]
    .map(|(name, scope)| ((NS, name), scope));
    let profile = Profile {
        attribute: ("", "id"),
        default_scope: 0,
        boundaries: &boundaries,
        max_depth: 128,
    };
    let scopes: &[&[&str]] = &[
        &["elements"],
        &["attributes"],
        &["commands"],
        &["parameters"],
    ];
    let root = std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join("../../../e2e/fixtures/xml");
    // Expected first unused ids were read independently from these original files.
    for (file, expected) in [
        (
            "cf/CommonForms/ExtendedTooltip/Ext/Form.xml",
            ["3", "1", "1", "1"],
        ),
        (
            "cf/CommonForms/CommandBar/Ext/Form.xml",
            ["1", "3", "2", "1"],
        ),
        (
            "cfe/all-extension/CommonForms/InputField/Ext/Form.xml",
            ["1", "2", "1", "1"],
        ),
        ("", ["1", "1", "1", "3"]),
    ] {
        // The original corpus has no parameter ids; preserve this separate contract.
        let source = if file.is_empty() {
            format!("<Form xmlns=\"{NS}\"><Parameters><Parameter id=\"1\"><Nested id=\"2\"/></Parameter></Parameters></Form>").into_bytes()
        } else {
            std::fs::read(root.join(file)).unwrap()
        };
        let tree = xml::Tree::capture(&source, &[(NS, "Form")])
            .unwrap()
            .unwrap();
        let payload = tree.payload_yaml(&[], &[]).unwrap();
        let patch = xml::Patch::read_full(payload.as_bytes(), &[], &[]).unwrap();
        for view in 0..3 {
            let mut b = builder(200);
            for scope in scopes {
                b.request_number(FactId(0), &[scope[0], "new"], 1).unwrap();
            }
            #[cfg(feature = "test-probes")]
            let writers = xml::writer_count();
            match view {
                0 => {
                    b.reserve_attributes(FactId(0), &profile, scopes, xml::DocumentSource(&source))
                }
                1 => b.reserve_attributes(FactId(0), &profile, scopes, &tree),
                _ => b.reserve_attributes(
                    FactId(0),
                    &profile,
                    scopes,
                    Preserved {
                        patch: &patch,
                        root: (NS, "Form"),
                        namespaces: &[],
                    },
                ),
            }
            .unwrap();
            #[cfg(feature = "test-probes")]
            assert_eq!(
                writers,
                xml::writer_count(),
                "Scanner must not serialize XML"
            );
            let facts = b.finish();
            for (scope, expected) in scopes.iter().zip(expected) {
                assert_eq!(
                    facts.lookup_parts(Generation(1), FactId(0), &[scope[0], "new"]),
                    FactState::Ready(expected),
                    "{file}, representation {view}"
                );
            }
        }
    }
}

#[test]
fn minimum_and_reopened_assignments_are_stable_in_different_request_order() {
    let mut b = builder(100);
    b.request_number(FactId(0), &["s", "first"], 1).unwrap();
    b.request_number(FactId(0), &["s", "first"], 1_000_001)
        .unwrap();
    b.request_number(FactId(0), &["s", "second"], 1).unwrap();
    let f = b.finish();
    let mut reopened = builder(100);
    for (name, expected) in [("second", "1000002"), ("first", "1000001")] {
        assert_eq!(
            f.lookup_parts(Generation(1), FactId(0), &["s", name]),
            FactState::Ready(expected)
        );
        reopened.request_number(FactId(0), &["s", name], 1).unwrap();
        reopened
            .push_parts(FactId(0), &["s", name], expected)
            .unwrap();
    }
    let r = reopened.finish();
    assert_eq!(
        r.lookup_parts(Generation(1), FactId(0), &["s", "first"]),
        FactState::Ready("1000001")
    );
}

#[test]
fn allocation_obeys_text_budget_and_never_publishes_a_partial_index() {
    for (entries, reservations, scope, text_limit) in [
        (2, 0, "s", true),
        (2, 1, "another", true),
        (100, 100, "s", false),
    ] {
        let mut b = builder(entries);
        b.request_number(FactId(0), &["s", "new"], 1).unwrap();
        let result = (0..reservations)
            .try_for_each(|_| b.reserve_number(FactId(0), &[scope], "1"))
            .and_then(|()| b.publish(FactId(0)));
        if text_limit {
            assert!(matches!(result, Err(FactLimit::Text(_))));
        } else {
            assert_eq!(result, Err(FactLimit::Rows));
        }
        assert_eq!(
            b.finish()
                .lookup_parts(Generation(1), FactId(0), &["s", "new"]),
            FactState::Unready
        );
    }
}

#[test]
fn exhausted_number_range_fails_without_overflow_or_replacing_existing_values() {
    let mut b = builder(100);
    b.push_parts(FactId(0), &["s", "old"], &u64::MAX.to_string())
        .unwrap();
    b.request_number(FactId(0), &["s", "new"], u64::MAX)
        .unwrap();
    assert_eq!(b.publish(FactId(0)), Err(FactLimit::NumberExhausted));
    assert_eq!(
        b.finish()
            .lookup_parts(Generation(1), FactId(0), &["s", "old"]),
        FactState::Unready
    );
}

#[test]
fn allocation_phases_keep_lower_ranges_first_in_both_source_orders() {
    for reverse in [false, true] {
        let mut b = builder(100);
        let current = [("current", 1, 0), ("shared", 1, 0)];
        let base = [("shared", 1_000_001, 1), ("base", 1_000_001, 1)];
        let sources = if reverse {
            [base, current]
        } else {
            [current, base]
        };
        for source in sources {
            for (name, first, phase) in source {
                b.request_number_in_phase(FactId(0), &["s", name], first, phase)
                    .unwrap();
            }
        }
        b.reserve_number(FactId(0), &["s"], "1000001").unwrap();
        b.request_number_in_phase(FactId(0), &["other", "base"], 1, 2)
            .unwrap();
        b.request_number_in_phase(FactId(0), &["s", "known"], 1, 0)
            .unwrap();
        b.push_parts(FactId(0), &["s", "known"], "17").unwrap();
        b.request_number_in_phase(FactId(0), &["s", "conflict"], 1, 0)
            .unwrap();
        for id in ["8", "9"] {
            b.push_parts(FactId(0), &["s", "conflict"], id).unwrap();
        }
        for first in [3, 5] {
            b.request_number_in_phase(FactId(0), &["equal", "floor"], first, 2)
                .unwrap();
        }
        let facts = b.finish();
        for (scope, name, expected) in [
            ("s", "shared", "2"),
            ("s", "current", "1"),
            ("s", "base", "1000002"),
            ("other", "base", "1"),
            ("s", "known", "17"),
            ("equal", "floor", "5"),
        ] {
            assert_eq!(
                facts.lookup_parts(Generation(1), FactId(0), &[scope, name]),
                FactState::Ready(expected)
            );
        }
        assert_eq!(
            facts.lookup_parts(Generation(1), FactId(0), &["s", "conflict"]),
            FactState::Ambiguous
        );
    }
}
