use nkdk_conversion_core::{
    EntryId, InputType, InputValue, PreparedInputs,
    facts::{
        Generation,
        prepared::{FactBudget, FactId, TextFactsBuilder, TextIndexInput},
        text::TextBudget,
    },
    inputs::InputRef,
};
use std::sync::Arc;

fn union_builder(generation: Generation) -> TextFactsBuilder {
    use nkdk_conversion_core::facts::{graph::GraphBudget, prepared::text_union_index};
    TextFactsBuilder::with_indexes(
        generation,
        vec![text_union_index(
            generation,
            "ОпределяемыйТип.",
            GraphBudget {
                nodes: 8,
                edges: 8,
                members: 8,
            },
        )],
        FactBudget {
            text: TextBudget {
                entries: 8,
                bytes: 150,
            },
            rows: 8,
        },
    )
}

#[test]
fn prepared_union_input_borrows_expanded_values_without_a_second_context() {
    use nkdk_conversion_core::facts::prepared::TextUnionIndexInput;
    let generation = Generation(16);
    let mut builder = union_builder(generation);
    builder.begin_union(FactId(0), "ОпределяемыйТип.А").unwrap();
    builder.push_union(FactId(0), "Строка").unwrap();
    let facts = Arc::new(builder.finish());
    let index = TextUnionIndexInput::new(facts.clone(), generation, FactId(0));
    let inputs = PreparedInputs::prepare(
        EntryId(4),
        &[("types", InputType::TextUnionIndex)],
        vec![("types".into(), InputValue::TextUnionIndex(index))],
    )
    .unwrap();
    let values = inputs
        .view()
        .text_union_index(0)
        .unwrap()
        .lookup("ОпределяемыйТип.А")
        .unwrap()
        .unwrap();
    assert_eq!(values.collect::<Vec<_>>(), vec!["Строка"]);
    let Err(issue) = inputs
        .view()
        .text_union_index(0)
        .unwrap()
        .lookup("ОпределяемыйТип.Нет")
    else {
        panic!("unknown named type must be unresolved")
    };
    assert_eq!(issue.code.as_deref(), Some("fact.missing"));
    assert_eq!(issue.severity, nkdk_conversion_core::Severity::Warning);
    assert_eq!(Arc::strong_count(&facts), 2);
}

#[test]
fn cyclic_union_is_a_data_anomaly_instead_of_a_fatal_error() {
    use nkdk_conversion_core::facts::prepared::TextUnionIndexInput;
    use nkdk_conversion_core::{Severity, annotations::IssueKind};
    let generation = Generation(17);
    let mut builder = union_builder(generation);
    builder.begin_union(FactId(0), "ОпределяемыйТип.А").unwrap();
    builder.push_union(FactId(0), "ОпределяемыйТип.Б").unwrap();
    builder.begin_union(FactId(0), "ОпределяемыйТип.Б").unwrap();
    builder.push_union(FactId(0), "ОпределяемыйТип.А").unwrap();
    let input = TextUnionIndexInput::new(Arc::new(builder.finish()), generation, FactId(0));
    let Err(issue) = input.lookup("ОпределяемыйТип.А") else {
        panic!("cycle must be reported")
    };
    assert_eq!(issue.code.as_deref(), Some("fact.cycle"));
    assert_eq!(issue.severity, Severity::Warning);
    assert_eq!(issue.kind, IssueKind::Semantic);
}

#[test]
fn empty_named_definition_is_unresolved_data() {
    use nkdk_conversion_core::facts::prepared::TextUnionIndexInput;
    use nkdk_conversion_core::{Severity, annotations::IssueKind};
    let generation = Generation(18);
    let mut builder = union_builder(generation);
    builder
        .begin_union(FactId(0), "ОпределяемыйТип.Пустой")
        .unwrap();
    let input = TextUnionIndexInput::new(Arc::new(builder.finish()), generation, FactId(0));
    let Err(issue) = input.lookup("ОпределяемыйТип.Пустой") else {
        panic!("empty definition must be unresolved")
    };
    assert_eq!(issue.code.as_deref(), Some("fact.unresolved"));
    assert_eq!(issue.severity, Severity::Warning);
    assert_eq!(issue.kind, IssueKind::Semantic);
}

#[test]
fn prepared_index_inputs_borrow_values_and_keep_missing_distinct_from_unready() {
    let generation = Generation(9);
    let mut builder = TextFactsBuilder::new(
        generation,
        2,
        FactBudget {
            text: TextBudget {
                entries: 10,
                bytes: 100,
            },
            rows: 10,
        },
    );
    builder.push(FactId(0), "one", "First").unwrap();
    builder.push(FactId(0), "two", "Second").unwrap();
    builder.push(FactId(0), "two", "Second").unwrap();
    builder.mark_unready(FactId(1)).unwrap();
    let facts = Arc::new(builder.finish());
    let binding = TextIndexInput::new(facts.clone(), generation, FactId(0));
    let inputs = PreparedInputs::prepare(
        EntryId(2),
        &[("names", InputType::TextIndex)],
        vec![("names".into(), InputValue::TextIndex(binding.clone()))],
    )
    .unwrap();
    let other = PreparedInputs::prepare(
        EntryId(3),
        &[("names", InputType::TextIndex)],
        vec![("names".into(), InputValue::TextIndex(binding))],
    )
    .unwrap();
    let first = inputs
        .text_index(0)
        .unwrap()
        .lookup("one")
        .unwrap()
        .unwrap();
    let second = other.text_index(0).unwrap().lookup("one").unwrap().unwrap();
    assert!(std::ptr::eq(first, second));
    let references = Arc::strong_count(&facts);
    let view = inputs.view();
    let slots = [Some(InputRef::TextIndex(inputs.text_index(0).unwrap()))];
    let child = view.rebind(&slots);
    assert!(std::ptr::eq(
        child.text_index(0).unwrap(),
        inputs.text_index(0).unwrap()
    ));
    assert!(child.is_ready(0));
    assert_eq!(Arc::strong_count(&facts), references);
    assert_eq!(
        inputs.text_index(0).unwrap().lookup("missing").unwrap(),
        None
    );
    assert_eq!(
        inputs
            .text_index(0)
            .unwrap()
            .lookup("two")
            .unwrap_err()
            .code
            .as_deref(),
        Some("fact.ambiguous")
    );
    for binding in [
        TextIndexInput::new(facts.clone(), Generation(10), FactId(0)),
        TextIndexInput::new(facts.clone(), generation, FactId(1)),
    ] {
        assert!(!binding.is_ready());
        let slots = [Some(InputRef::TextIndex(&binding))];
        let unready = view.rebind(&slots);
        assert!(!unready.is_ready(0));
        assert_eq!(
            unready
                .text_index(0)
                .unwrap()
                .lookup("never-seen")
                .unwrap_err()
                .code
                .as_deref(),
            Some("fact.unready")
        );
        assert_eq!(
            binding.lookup("never-seen").unwrap_err().code.as_deref(),
            Some("fact.unready")
        );
    }
    assert!(
        PreparedInputs::prepare(
            EntryId(2),
            &[("names", InputType::TextIndex)],
            vec![("names".into(), InputValue::Text("fake".into()))]
        )
        .is_err()
    );
}

#[test]
fn replacing_indexes_moves_context_and_rejects_foreign_or_scalar_overlays() {
    let declaration = [("name", InputType::Text), ("index", InputType::TextIndex)];
    let original = PreparedInputs::prepare(
        EntryId(1),
        &declaration,
        vec![("name".into(), InputValue::Text("owned context".into()))],
    )
    .unwrap();
    let original = original
        .with_documents(vec![(
            nkdk_conversion_core::resources::RelativePath::new(["source.xml"], 100).unwrap(),
            b"<Source/>".to_vec(),
        )])
        .unwrap();
    let document = original.document(&["source.xml"]).as_ptr();
    let pointer = original.text(0).unwrap().as_ptr();
    let mut builder = TextFactsBuilder::new(
        Generation(1),
        1,
        FactBudget {
            text: TextBudget {
                entries: 10,
                bytes: 100,
            },
            rows: 10,
        },
    );
    builder.push(FactId(0), "key", "value").unwrap();
    let binding = TextIndexInput::new(Arc::new(builder.finish()), Generation(1), FactId(0));
    let overlay = PreparedInputs::prepare(
        EntryId(1),
        &declaration,
        vec![("index".into(), InputValue::TextIndex(binding))],
    )
    .unwrap();
    let merged = original.with_indexes(overlay).unwrap();
    assert_eq!(merged.text(0).unwrap().as_ptr(), pointer);
    assert_eq!(merged.document(&["source.xml"]).as_ptr(), document);
    assert_eq!(
        merged.text_index(1).unwrap().lookup("key").unwrap(),
        Some("value")
    );
    for (entry, values) in [
        (EntryId(2), vec![]),
        (
            EntryId(1),
            vec![("name".into(), InputValue::Text("replacement".into()))],
        ),
    ] {
        let original = PreparedInputs::prepare(EntryId(1), &declaration, vec![]).unwrap();
        let overlay = PreparedInputs::prepare(entry, &declaration, values).unwrap();
        assert!(original.with_indexes(overlay).is_err());
    }
}
