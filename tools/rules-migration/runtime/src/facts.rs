use crate::rules;
use nkdk_conversion_core::{Direction, EntryId, InputValue, PreparedInputs, facts::Generation};
use serde_json::Value;

pub fn prepare(entry: EntryId, case: &Value, manifest: &Value) -> PreparedInputs {
    let input = serde_json::to_vec(case.get("inputs").unwrap_or(&serde_json::json!({}))).unwrap();
    let Some(bindings) = case.get("factBindings").and_then(Value::as_object) else {
        return rules::read_inputs(entry, &input).unwrap();
    };
    let generation = Generation(1);
    let sources = manifest["factSources"]
        .as_array()
        .unwrap()
        .iter()
        .map(|source| {
            let entry = rules::entry_id(source["entry"].as_str().unwrap()).unwrap();
            let (direction, bytes) = match source.get("yaml").and_then(Value::as_str) {
                Some(yaml) => {
                    assert!(source.get("xml").is_none(), "Ambiguous fact source format");
                    (Direction::YamlToXml, yaml.as_bytes())
                }
                None => (
                    Direction::XmlToYaml,
                    source["xml"].as_str().unwrap().as_bytes(),
                ),
            };
            let input =
                serde_json::to_vec(source.get("inputs").unwrap_or(&serde_json::json!({}))).unwrap();
            nkdk_conversion_core::facts::preparation::Source {
                entry,
                direction,
                bytes,
                inputs: rules::read_inputs(entry, &input).unwrap(),
            }
        })
        .collect();
    let prepared = nkdk_conversion_core::facts::preparation::prepare::<rules::FactCatalog>(
        sources,
        &[entry],
        generation,
        nkdk_conversion_core::facts::prepared::FactBudget {
            text: nkdk_conversion_core::facts::text::TextBudget {
                entries: 10_000,
                bytes: 1_000_000,
            },
            rows: 10_000,
        },
        100_000,
    )
    .unwrap_or_else(|errors| panic!("Index preparation: {errors:?}"));
    let facts = prepared.facts;
    let mut values = nkdk_conversion_core::inputs::read(&input).unwrap();
    for (name, index) in bindings {
        let index = rules::fact_id(index.as_str().unwrap()).unwrap();
        let value = if rules::fact_is_union(index) {
            InputValue::TextUnionIndex(
                nkdk_conversion_core::facts::prepared::TextUnionIndexInput::new(
                    facts.clone(),
                    generation,
                    index,
                ),
            )
        } else {
            InputValue::TextIndex(nkdk_conversion_core::facts::prepared::TextIndexInput::new(
                facts.clone(),
                generation,
                index,
            ))
        };
        values.push((name.clone(), value));
    }
    rules::prepare_inputs(entry, values).unwrap()
}
