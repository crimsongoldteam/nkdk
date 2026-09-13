use crate::rules;
use nkdk_conversion_core::{Direction, EntryId, InputValue, PreparedInputs, facts::Generation};
use serde_json::Value;
use std::sync::Arc;

pub fn prepare(entry: EntryId, case: &Value, manifest: &Value) -> PreparedInputs {
    let input = serde_json::to_vec(case.get("inputs").unwrap_or(&serde_json::json!({}))).unwrap();
    let Some(bindings) = case.get("factBindings").and_then(Value::as_object) else {
        return rules::read_inputs(entry, &input).unwrap();
    };
    let generation = Generation(1);
    let mut builder = rules::fact_builder(
        generation,
        nkdk_conversion_core::facts::prepared::FactBudget {
            text: nkdk_conversion_core::facts::text::TextBudget {
                entries: 10_000,
                bytes: 1_000_000,
            },
            rows: 10_000,
        },
    );
    let sources = manifest["factSources"].as_array().unwrap();
    let operations: Vec<_> = sources
        .iter()
        .map(|source| {
            (
                rules::entry_id(source["entry"].as_str().unwrap()).unwrap(),
                if source.get("yaml").is_some() {
                    Direction::YamlToXml
                } else {
                    Direction::XmlToYaml
                },
            )
        })
        .collect();
    let schedule = rules::fact_plan_for_sources(&operations, &[entry], 100_000).unwrap();
    for step in schedule
        .order()
        .iter()
        .filter(|step| (step.0 as usize) < sources.len())
    {
        let source = &sources[step.0 as usize];
        let (producer, _) = operations[step.0 as usize];
        let source_inputs =
            serde_json::to_vec(source.get("inputs").unwrap_or(&serde_json::json!({}))).unwrap();
        let context = rules::read_inputs(producer, &source_inputs).unwrap();
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
        let diagnostics =
            rules::contribute_file(producer, direction, bytes, &context, &mut builder);
        assert!(diagnostics.is_empty(), "Index preparation: {diagnostics:?}");
    }
    let facts = Arc::new(builder.finish());
    let mut values = nkdk_conversion_core::inputs::read(&input).unwrap();
    for (name, index) in bindings {
        values.push((
            name.clone(),
            InputValue::TextIndex(nkdk_conversion_core::facts::prepared::TextIndexInput::new(
                facts.clone(),
                generation,
                rules::fact_id(index.as_str().unwrap()).unwrap(),
            )),
        ));
    }
    rules::prepare_inputs(entry, values).unwrap()
}
