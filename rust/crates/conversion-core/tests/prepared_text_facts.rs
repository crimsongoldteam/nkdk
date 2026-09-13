use nkdk_conversion_core::facts::{
    FactState, Generation,
    prepared::{FactBudget, FactId, FactLimit, TextFactsBuilder},
    text::TextBudget,
};

#[test]
fn prepared_columns_share_strings_and_preserve_completeness_per_index() {
    let generation = Generation(4);
    let mut builder = TextFactsBuilder::new(
        generation,
        3,
        FactBudget {
            text: TextBudget {
                entries: 4,
                bytes: 80,
            },
            rows: 8,
        },
    );
    builder.push(FactId(0), "one", "first").unwrap();
    builder.push(FactId(0), "two", "second").unwrap();
    builder.push(FactId(0), "two", "second").unwrap();
    builder.push(FactId(1), "one", "first").unwrap();
    builder.mark_unready(FactId(1)).unwrap();
    let facts = builder.finish();
    assert_eq!(
        facts.lookup(generation, FactId(0), "one"),
        FactState::Ready("first")
    );
    assert_eq!(
        facts.lookup(generation, FactId(0), "two"),
        FactState::Ambiguous
    );
    assert_eq!(
        facts.lookup(generation, FactId(0), "missing"),
        FactState::Missing
    );
    assert_eq!(
        facts.lookup(generation, FactId(1), "missing"),
        FactState::Unready
    );
    assert_eq!(
        facts.lookup(generation, FactId(1), "one"),
        FactState::Unready
    );
    assert_eq!(
        facts.lookup(generation, FactId(2), "one"),
        FactState::Missing
    );
    assert_eq!(
        facts.lookup(Generation(5), FactId(0), "one"),
        FactState::Unready
    );
    assert_eq!(
        facts.lookup(generation, FactId(3), "one"),
        FactState::Unready
    );
}

#[test]
fn budgets_never_publish_truncated_indexes_as_complete() {
    for budget in [
        FactBudget {
            text: TextBudget {
                entries: 1,
                bytes: 100,
            },
            rows: 3,
        },
        FactBudget {
            text: TextBudget {
                entries: 9,
                bytes: 1,
            },
            rows: 3,
        },
        FactBudget {
            text: TextBudget {
                entries: 9,
                bytes: 100,
            },
            rows: 0,
        },
    ] {
        let mut builder = TextFactsBuilder::new(Generation(1), 2, budget);
        assert!(builder.push(FactId(0), "key", "value").is_err());
        assert_eq!(
            builder.mark_unready(FactId(2)),
            Err(FactLimit::UnknownIndex(FactId(2)))
        );
        let facts = builder.finish();
        assert_eq!(
            facts.lookup(Generation(1), FactId(0), "key"),
            FactState::Unready
        );
        assert_eq!(
            facts.lookup(Generation(1), FactId(1), "key"),
            FactState::Missing
        );
    }
}

#[test]
fn composite_keys_keep_components_separate_without_path_serialization() {
    use nkdk_conversion_core::facts::prepared::{
        TextIndexInput, text_record_index, text_scalar_index,
    };
    use nkdk_conversion_core::{EntryId, InputType, InputValue, PreparedInputs};
    use std::sync::Arc;
    let generation = Generation(6);
    let mut builder = TextFactsBuilder::with_indexes(
        generation,
        vec![
            text_scalar_index(generation),
            text_record_index(generation, ["kind", "name"]),
        ],
        FactBudget {
            text: TextBudget {
                entries: 20,
                bytes: 200,
            },
            rows: 10,
        },
    );
    builder.push(FactId(0), "a.b.c", "scalar").unwrap();
    builder
        .push_parts(FactId(1), &["a.b", "c"], "first")
        .unwrap();
    builder
        .push_parts(FactId(1), &["a", "b.c"], "second")
        .unwrap();
    let facts = Arc::new(builder.finish());
    assert_eq!(
        facts.lookup_parts(generation, FactId(1), &["a.b", "c"]),
        FactState::Ready("first")
    );
    assert_eq!(
        facts.lookup_parts(generation, FactId(1), &["a", "b.c"]),
        FactState::Ready("second")
    );
    assert_eq!(
        facts.lookup(generation, FactId(0), "a.b.c"),
        FactState::Ready("scalar")
    );
    let binding = TextIndexInput::new(facts, generation, FactId(1));
    for (shape, valid) in [
        (InputType::TextRecordIndex(&["kind", "name"]), true),
        (InputType::TextRecordIndex(&["owner", "name"]), false),
        (InputType::TextIndex, false),
    ] {
        assert_eq!(
            PreparedInputs::prepare(
                EntryId(1),
                &[("index", shape)],
                vec![("index".into(), InputValue::TextIndex(binding.clone()))]
            )
            .is_ok(),
            valid
        );
    }
    assert_eq!(binding.lookup_parts(&["a.b", "c"]).unwrap(), Some("first"));
    assert!(binding.lookup("a.b.c").is_err());
}
