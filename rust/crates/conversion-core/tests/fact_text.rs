use nkdk_conversion_core::facts::text::{TextBudget, TextBuilder, TextId, TextLimit};
use nkdk_conversion_core::facts::{FactState, Generation};

#[test]
fn prepared_strings_share_ids_preserve_spelling_and_enforce_generation_and_budget() {
    let generation = Generation(7);
    let mut builder = TextBuilder::new(
        generation,
        TextBudget {
            entries: 2,
            bytes: 4,
        },
    );
    let lower = builder.intern("é").unwrap();
    let first_snapshot = builder.snapshot();
    let upper = builder.intern("É").unwrap();
    let second_snapshot = builder.snapshot();
    assert_eq!(first_snapshot.lookup(generation, "É"), FactState::Missing);
    assert_eq!(
        second_snapshot.lookup(generation, "É"),
        FactState::Ready(upper)
    );
    assert_ne!(lower, upper);
    assert_eq!(builder.intern("é"), Ok(lower));
    assert_eq!(builder.intern("other"), Err(TextLimit::Entries));
    let text = builder.finish();
    let FactState::Ready(before) = first_snapshot.resolve(generation, lower) else {
        panic!("first value")
    };
    let FactState::Ready(after) = text.resolve(generation, lower) else {
        panic!("shared value")
    };
    assert!(std::ptr::eq(before, after));
    assert_eq!(text.lookup(generation, "é"), FactState::Ready(lower));
    assert_eq!(text.lookup(generation, "e\u{301}"), FactState::Missing);
    assert_eq!(text.resolve(generation, upper), FactState::Ready("É"));
    assert_eq!(text.resolve(generation, TextId(99)), FactState::Missing);
    assert_eq!(text.lookup(Generation(8), "é"), FactState::Unready);
    assert_eq!(text.resolve(Generation(8), lower), FactState::Unready);

    let mut small = TextBuilder::new(
        generation,
        TextBudget {
            entries: 2,
            bytes: 1,
        },
    );
    assert_eq!(small.intern("é"), Err(TextLimit::Bytes));
    let first = small.intern("a").unwrap();
    let empty = small.intern("").unwrap();
    assert_eq!(first, TextId(0));
    assert_eq!(empty, TextId(1));
    assert_eq!(
        small.finish().resolve(generation, empty),
        FactState::Ready("")
    );
}
