use crate::rules;
use nkdk_conversion_core::{Direction, EntryId, InputValue, PreparedInputs, facts::Generation};
use serde_json::Value;

fn sources_for_case<'a>(case: &Value, manifest: &'a Value) -> Vec<&'a Value> {
    let sources = manifest["factSources"].as_array().unwrap();
    let Some(selected) = case.get("factSourceEntries").and_then(Value::as_array) else {
        return sources.iter().collect();
    };
    let wanted: std::collections::HashSet<_> = selected
        .iter()
        .map(|entry| entry.as_str().unwrap())
        .collect();
    assert_eq!(
        wanted.len(),
        selected.len(),
        "Repeated fact source selection"
    );
    let result: Vec<_> = sources
        .iter()
        .filter(|source| {
            wanted.contains(
                source
                    .get("id")
                    .and_then(Value::as_str)
                    .unwrap_or_else(|| source["entry"].as_str().unwrap()),
            )
        })
        .collect();
    assert_eq!(
        result.len(),
        wanted.len(),
        "Unknown or repeated fact source"
    );
    result
}

pub fn prepare(entry: EntryId, case: &Value, manifest: &Value) -> PreparedInputs {
    let input = serde_json::to_vec(case.get("inputs").unwrap_or(&serde_json::json!({}))).unwrap();
    let Some(bindings) = case.get("factBindings").and_then(Value::as_object) else {
        return rules::read_inputs(entry, &input).unwrap();
    };
    let generation = Generation(1);
    let selected_sources = sources_for_case(case, manifest);
    let sources = selected_sources
        .iter()
        .map(|source| {
            let name = source["entry"].as_str().unwrap();
            let entry = rules::entry_id(name)
                .unwrap_or_else(|| panic!("Missing compiled fact-source entry: {name}"));
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
            let inputs = rules::read_inputs(entry, &input).unwrap();
            nkdk_conversion_core::facts::preparation::Source {
                entry,
                direction,
                bytes,
                inputs,
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
    for (original, source) in selected_sources.iter().zip(&prepared.sources) {
        let expected_fields = original.get("snapshotFields").and_then(Value::as_object);
        let expected_yaml = original.get("snapshotYAML").and_then(Value::as_str);
        if expected_fields.is_some() || expected_yaml.is_some() {
            let snapshot = match source.direction {
                Direction::XmlToYaml => {
                    rules::snapshot_fact_source(source.entry, source.bytes, &source.inputs)
                }
                Direction::YamlToXml => {
                    rules::materialize_fact_source(source.entry, source.bytes, &source.inputs)
                }
            }
            .unwrap();
            if let Some(expected) = expected_yaml {
                crate::compare_yaml(expected, std::str::from_utf8(&snapshot).unwrap());
            }
            if let Some(expected) = expected_fields {
                let actual =
                    yaml_rust2::YamlLoader::load_from_str(std::str::from_utf8(&snapshot).unwrap())
                        .unwrap();
                let expected = yaml_rust2::YamlLoader::load_from_str(
                    &serde_json::to_string(expected).unwrap(),
                )
                .unwrap();
                assert_eq!(actual.len(), 1);
                for key in expected[0].as_hash().unwrap().keys() {
                    assert_eq!(
                        actual[0][key.as_str().unwrap()],
                        expected[0][key.as_str().unwrap()],
                        "fact snapshot field {key:?}"
                    );
                }
            }
        }
    }
    let facts = prepared.facts;
    if let Some(expected) = case.get("expectedFacts").and_then(Value::as_array) {
        for row in expected {
            let index = rules::fact_id(row["index"].as_str().unwrap()).unwrap();
            let key: Vec<_> = row["key"]
                .as_array()
                .unwrap()
                .iter()
                .map(|value| value.as_str().unwrap())
                .collect();
            assert_eq!(
                facts.lookup_parts(generation, index, &key),
                nkdk_conversion_core::facts::FactState::Ready(row["value"].as_str().unwrap()),
                "prepared fact {row}"
            );
        }
    }

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
