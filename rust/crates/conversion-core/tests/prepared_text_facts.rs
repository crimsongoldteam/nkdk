use nkdk_conversion_core::facts::{
    FactState, Generation,
    prepared::{FactBudget, FactId, FactLimit, TextFactsBuilder},
    text::TextBudget,
};

fn limited_union_builder(generation: Generation) -> TextFactsBuilder {
    use nkdk_conversion_core::facts::{graph::GraphBudget, prepared::text_union_index};
    TextFactsBuilder::with_indexes(
        generation,
        vec![text_union_index(
            generation,
            "ОпределяемыйТип.",
            GraphBudget {
                nodes: 2,
                edges: 1,
                members: 0,
            },
        )],
        FactBudget {
            text: TextBudget {
                entries: 2,
                bytes: 50,
            },
            rows: 2,
        },
    )
}

#[test]
fn named_union_index_preserves_alternatives_and_unresolved_states() {
    use nkdk_conversion_core::facts::{graph::GraphBudget, prepared::text_union_index};
    let generation = Generation(11);
    let mut builder = TextFactsBuilder::with_indexes(
        generation,
        vec![text_union_index(
            generation,
            "ОпределяемыйТип.",
            GraphBudget {
                nodes: 20,
                edges: 20,
                members: 20,
            },
        )],
        FactBudget {
            text: TextBudget {
                entries: 20,
                bytes: 300,
            },
            rows: 20,
        },
    );
    builder
        .begin_union(FactId(0), "ОпределяемыйТип.Основной")
        .unwrap();
    builder.push_union(FactId(0), "Строка").unwrap();
    builder
        .push_union(FactId(0), "ОпределяемыйТип.Дополнительный")
        .unwrap();
    builder.push_union(FactId(0), "Строка").unwrap();
    builder
        .begin_union(FactId(0), "ОпределяемыйТип.Дополнительный")
        .unwrap();
    builder.push_union(FactId(0), "Число").unwrap();
    builder
        .begin_union(FactId(0), "ОпределяемыйТип.Цикл")
        .unwrap();
    builder
        .push_union(FactId(0), "ОпределяемыйТип.Цикл")
        .unwrap();
    builder
        .begin_union(FactId(0), "ОпределяемыйТип.Пустой")
        .unwrap();
    let facts = builder.finish();
    let FactState::Ready(values) =
        facts.lookup_union(generation, FactId(0), "ОпределяемыйТип.Основной")
    else {
        panic!("named union must be ready")
    };
    assert_eq!(values.collect::<Vec<_>>(), vec!["Строка", "Число"]);
    assert!(matches!(
        facts.lookup_union(generation, FactId(0), "ОпределяемыйТип.Цикл"),
        FactState::Cycle
    ));
    assert!(matches!(
        facts.lookup_union(generation, FactId(0), "ОпределяемыйТип.Пустой"),
        FactState::Unready
    ));
    assert!(matches!(
        facts.lookup_union(generation, FactId(0), "ОпределяемыйТип.Нет"),
        FactState::Missing
    ));
    assert!(matches!(
        facts.lookup_union(Generation(12), FactId(0), "ОпределяемыйТип.Основной"),
        FactState::Unready
    ));
}

#[test]
fn graph_budget_failure_is_reported_and_never_publishes_partial_values() {
    use nkdk_conversion_core::facts::graph::GraphLimit;
    let generation = Generation(13);
    let mut builder = limited_union_builder(generation);
    builder.begin_union(FactId(0), "ОпределяемыйТип.А").unwrap();
    builder.push_union(FactId(0), "Строка").unwrap();
    let facts = builder.finish();
    assert_eq!(facts.graph_limit(FactId(0)), Some(GraphLimit::Members));
    assert!(matches!(
        facts.lookup_union(generation, FactId(0), "ОпределяемыйТип.А"),
        FactState::Unready
    ));

    let mut builder = limited_union_builder(generation);
    builder.begin_union(FactId(0), "ОпределяемыйТип.А").unwrap();
    builder.push_union(FactId(0), "Строка").unwrap();
    assert_eq!(
        builder.publish(FactId(0)),
        Err(FactLimit::Graph(GraphLimit::Members))
    );
}

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

#[test]
fn published_indexes_are_immutable_and_snapshots_share_values() {
    use std::sync::Arc;
    let generation = Generation(7);
    let mut builder = TextFactsBuilder::new(
        generation,
        2,
        FactBudget {
            text: TextBudget {
                entries: 8,
                bytes: 80,
            },
            rows: 4,
        },
    );
    builder.push(FactId(0), "a", "first").unwrap();
    builder.publish(FactId(0)).unwrap();
    let first = builder.snapshot();
    assert!(Arc::ptr_eq(&first, &builder.snapshot()));
    assert_eq!(first.lookup(generation, FactId(1), "b"), FactState::Unready);
    assert_eq!(
        builder.push(FactId(0), "b", "late"),
        Err(FactLimit::PublishedIndex(FactId(0)))
    );
    assert_eq!(
        builder.mark_unready(FactId(0)),
        Err(FactLimit::PublishedIndex(FactId(0)))
    );
    builder.push(FactId(1), "b", "second").unwrap();
    assert!(Arc::ptr_eq(&first, &builder.snapshot()));
    builder.publish(FactId(1)).unwrap();
    let second = builder.snapshot();
    assert_eq!(first.lookup(generation, FactId(1), "b"), FactState::Unready);
    assert_eq!(
        second.lookup(generation, FactId(1), "b"),
        FactState::Ready("second")
    );
    let finished = builder.finish();
    let FactState::Ready(before) = first.lookup(generation, FactId(0), "a") else {
        panic!("published value");
    };
    let FactState::Ready(after) = finished.lookup(generation, FactId(0), "a") else {
        panic!("final value");
    };
    assert!(std::ptr::eq(before, after));
}
