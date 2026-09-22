use nkdk_compiled_rules::{Direction, convert_file, entry_id, read_inputs, verify_candidate};

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
