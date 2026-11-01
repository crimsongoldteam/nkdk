fn text_index(entries: &[(&str, &str)]) -> nkdk_conversion_core::facts::prepared::TextIndexInput {
    use nkdk_conversion_core::facts::{
        Generation,
        prepared::{FactBudget, FactId, TextFactsBuilder, TextIndexInput},
        text::TextBudget,
    };
    let generation = Generation(1);
    let mut builder = TextFactsBuilder::new(
        generation,
        1,
        FactBudget {
            text: TextBudget {
                entries: entries.len() * 2,
                bytes: entries
                    .iter()
                    .map(|(key, value)| key.len() + value.len())
                    .sum(),
            },
            rows: entries.len(),
        },
    );
    for &(key, value) in entries {
        builder.push(FactId(0), key, value).unwrap();
    }
    TextIndexInput::new(std::sync::Arc::new(builder.finish()), generation, FactId(0))
}
