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
