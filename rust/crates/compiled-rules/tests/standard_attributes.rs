use nkdk_compiled_rules::{Direction, convert_file, entry_id, read_inputs, verify_candidate};
use nkdk_conversion_core::{
    InputValue,
    facts::{
        Generation,
        preparation::{self, Source},
        prepared::{FactBudget, TextIndexInput, TextUnionIndexInput},
        text::TextBudget,
    },
    inputs,
};

#[test]
fn working_document_attributes_restore_real_document_rows_without_xml_reference() {
    let manifest: serde_json::Value = serde_json::from_str(include_str!(
        "../../../../tests/migration/document-attributes-operation.json"
    ))
    .unwrap();
    for case in manifest["cases"].as_array().unwrap() {
        let entry = entry_id(case["entry"].as_str().unwrap()).unwrap();
        let generation = Generation(1);
        let sources = manifest["factSources"]
            .as_array()
            .unwrap()
            .iter()
            .map(|source| {
                let source_entry = entry_id(source["entry"].as_str().unwrap()).unwrap();
                Source {
                    entry: source_entry,
                    direction: Direction::XmlToYaml,
                    bytes: source["xml"].as_str().unwrap().as_bytes(),
                    inputs: read_inputs(
                        source_entry,
                        &serde_json::to_vec(&source["inputs"]).unwrap(),
                    )
                    .unwrap(),
                }
            })
            .collect();
        let prepared = preparation::prepare::<nkdk_compiled_rules::FactCatalog>(
            sources,
            &[entry],
            generation,
            FactBudget {
                text: TextBudget {
                    entries: 10_000,
                    bytes: 1_000_000,
                },
                rows: 10_000,
            },
            100_000,
        )
        .unwrap();
        let mut values = inputs::read(&serde_json::to_vec(&case["inputs"]).unwrap()).unwrap();
        for (name, index_name) in case["factBindings"].as_object().unwrap() {
            let index = nkdk_compiled_rules::fact_id(index_name.as_str().unwrap()).unwrap();
            let input = if nkdk_compiled_rules::fact_is_union(index) {
                InputValue::TextUnionIndex(TextUnionIndexInput::new(
                    prepared.facts.clone(),
                    generation,
                    index,
                ))
            } else {
                InputValue::TextIndex(TextIndexInput::new(
                    prepared.facts.clone(),
                    generation,
                    index,
                ))
            };
            values.push((name.clone(), input));
        }
        let inputs = nkdk_compiled_rules::prepare_inputs(entry, values).unwrap();
        let xml = case["xml"].as_str().unwrap().as_bytes();
        let yaml = convert_file(entry, Direction::XmlToYaml, xml, &inputs).unwrap();
        assert!(
            String::from_utf8_lossy(&yaml.bytes).contains("Реквизиты:"),
            "{}",
            String::from_utf8_lossy(&yaml.bytes)
        );
        if case["entry"] == "migration.document-attribute-form-links" {
            assert!(
                String::from_utf8_lossy(&yaml.bytes).contains("ПоляБлокировкиДанных:\n  - СтандартныйРеквизит.Номер"),
                "{}",
                String::from_utf8_lossy(&yaml.bytes)
            );
        }
        verify_candidate(entry, xml, &yaml.bytes, &inputs).unwrap();
    }
}

#[test]
fn complete_standard_attribute_profiles_are_in_the_working_catalog() {
    let name = "metadata.standard-attribute-owner";
    assert!(
        entry_id(name).is_some(),
        "missing working declaration: {name}"
    );
}

#[test]
fn working_standard_attribute_profiles_round_trip_complete_e2e_collections() {
    let contract: serde_json::Value = serde_json::from_str(include_str!(
        "../../../../tests/migration/rules-contract-cases.json"
    ))
    .unwrap();
    for case_id in [
        "standard-attribute-family-task",
        "standard-attribute-family-information-register",
        "standard-attribute-family-exchange-plan",
        "standard-attribute-family-enumeration",
        "standard-attribute-family-document-journal",
        "standard-attribute-family-document",
        "standard-attribute-family-characteristic-plan",
        "standard-attribute-family-calculation-plan",
        "standard-attribute-family-accounts-plan",
        "standard-attribute-family-catalog",
        "standard-attribute-family-calculation-register",
        "standard-attribute-family-business-process",
        "standard-attribute-family-accumulation-register",
        "standard-attribute-family-accounting-register",
    ] {
        let case = contract["cases"]
            .as_array()
            .unwrap()
            .iter()
            .find(|case| case["id"] == case_id)
            .unwrap();
        let entry = entry_id("metadata.standard-attribute-owner").unwrap();
        let inputs = read_inputs(entry, &serde_json::to_vec(&case["inputs"]).unwrap()).unwrap();
        let xml = case["xml"].as_str().unwrap().as_bytes();
        let expected_yaml = case["yaml"].as_str().unwrap().as_bytes();
        let converted = convert_file(entry, Direction::XmlToYaml, xml, &inputs).unwrap();
        assert!(
            String::from_utf8_lossy(&converted.bytes).contains("СтандартныеРеквизиты"),
            "{case_id}"
        );
        verify_candidate(entry, xml, &converted.bytes, &inputs).unwrap();
        verify_candidate(entry, xml, expected_yaml, &inputs).unwrap();
    }
}
