use nkdk_compiled_rules_probes as rules;
use nkdk_conversion_core::facts::{
    Generation,
    prepared::{FactBudget, PreparedTextFacts},
    text::TextBudget,
};
use rules::{Direction, InputValue, entry_id};

pub fn facts(
    entries: &[serde_json::Value],
    generation: Generation,
) -> std::sync::Arc<PreparedTextFacts> {
    let source = entry_id("migration.dcs-enumeration-lexeme").unwrap();
    let mut builder = rules::fact_builder(
        generation,
        FactBudget {
            text: TextBudget {
                entries: 20000,
                bytes: 2000000,
            },
            rows: 10000,
        },
    );
    for row in entries {
        for value in row["values"].as_array().unwrap() {
            let inputs = rules::prepare_inputs(
                source,
                vec![
                    (
                        "name".into(),
                        InputValue::Text(row["name"].as_str().unwrap().into()),
                    ),
                    (
                        "code".into(),
                        InputValue::Text(value["xml"].as_str().unwrap().into()),
                    ),
                    (
                        "label".into(),
                        InputValue::Text(value["yaml"].as_str().unwrap().into()),
                    ),
                ],
            )
            .unwrap();
            assert!(
                rules::contribute_file(
                    source,
                    Direction::XmlToYaml,
                    b"<Root/>",
                    &inputs,
                    &mut builder
                )
                .is_empty()
            );
        }
    }
    std::sync::Arc::new(builder.finish())
}

pub fn inputs(entry: rules::EntryId, languages: &[&str]) -> rules::PreparedInputs {
    inputs_with(entry, languages, Vec::new())
}

pub fn inputs_with(
    entry: rules::EntryId,
    languages: &[&str],
    mut extra: Vec<(String, InputValue)>,
) -> rules::PreparedInputs {
    extra.extend(super::metadata_value_inputs_support::language_values(
        languages,
    ));
    let corpus: serde_json::Value = serde_json::from_slice(include_bytes!(
        "../../../../../tests/migration/system-enumeration-tables.json"
    ))
    .unwrap();
    let generation = Generation(1);
    rules::prepare_fact_inputs(
        entry,
        facts(corpus["entries"].as_array().unwrap(), generation),
        generation,
        extra,
    )
    .unwrap()
}
