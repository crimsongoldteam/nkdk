use nkdk_compiled_rules::{Direction, PreparedInputs, convert_file, entry_id, validate_file};
#[test]
fn existing_boolean_corpus_matches_exact_bytes_in_both_directions() {
    let inputs = PreparedInputs::default();
    let entry = entry_id("pilot.boolean").unwrap();
    for (xml, yaml) in [
        (
            include_bytes!("../../../../tests/conversion-corpus/cases/boolean-true/input.xml")
                .as_slice(),
            include_bytes!("../../../../tests/conversion-corpus/cases/boolean-true/expected.yaml")
                .as_slice(),
        ),
        (
            include_bytes!("../../../../tests/conversion-corpus/cases/boolean-false/input.xml")
                .as_slice(),
            include_bytes!("../../../../tests/conversion-corpus/cases/boolean-false/expected.yaml")
                .as_slice(),
        ),
    ] {
        assert_eq!(
            convert_file(entry, Direction::XmlToYaml, xml, &inputs)
                .unwrap()
                .bytes,
            yaml
        );
        assert_eq!(
            convert_file(entry, Direction::YamlToXml, yaml, &inputs)
                .unwrap()
                .bytes,
            xml
        );
        assert!(validate_file(entry, yaml, &inputs).is_empty());
    }
}

#[test]
fn boolean_absence_is_distinct_from_false_and_invalid_tokens() {
    let entry = entry_id("pilot.boolean").unwrap();
    let inputs = PreparedInputs::default();
    let absent = convert_file(entry, Direction::XmlToYaml, b"<Root/>", &inputs).unwrap();
    assert!(absent.bytes.is_empty());
    for yaml in [b"".as_slice(), b"{}"] {
        assert!(validate_file(entry, yaml, &inputs).is_empty());
        nkdk_compiled_rules::verify_candidate(entry, b"<Root/>", yaml, &inputs).unwrap();
    }
    for yaml in [
        "Значение: true",
        "Значение: false",
        "Значение: null",
        "Значение: 0",
        "Значение: неизвестно",
    ] {
        assert!(!validate_file(entry, yaml.as_bytes(), &inputs).is_empty());
    }
    for xml in [
        "<Root><Value/></Root>",
        "<Root><Value>0</Value></Root>",
        "<Root><Value> true </Value></Root>",
    ] {
        let result = convert_file(entry, Direction::XmlToYaml, xml.as_bytes(), &inputs).unwrap();
        assert!(String::from_utf8_lossy(&result.bytes).contains("!xml/raw"));
        assert!(validate_file(entry, &result.bytes, &inputs).is_empty());
        nkdk_compiled_rules::verify_candidate(entry, xml.as_bytes(), &result.bytes, &inputs)
            .unwrap();
    }
}

#[test]
fn scalar_anomalies_preserve_lexemes_and_neighbouring_values() {
    let inputs = PreparedInputs::default();
    for (entry, xml) in [
        ("test.decimal-owner", "<Root><Amount>NaN</Amount></Root>"),
        (
            "test.decimal-owner",
            "<Root xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:xs=\"http://www.w3.org/2001/XMLSchema\"><Amount xsi:type=\"xs:unknown\">NaN</Amount></Root>",
        ),
        (
            "test.scalar-owner",
            "<Root xmlns:c=\"urn:custom\"><Server>false</Server><Description c:extra=\"x\">unchanged</Description></Root>",
        ),
        ("test.decimal-owner", "<Root><Amount>1e3</Amount></Root>"),
        ("test.decimal-owner", "<Root><Amount>-0.00</Amount></Root>"),
        (
            "test.scalar-owner",
            "<Root><Server>1</Server><Description>unchanged</Description></Root>",
        ),
        (
            "test.scalar-owner",
            "<Root><Server>false</Server><Description extra=\"x\">unchanged</Description></Root>",
        ),
    ] {
        let entry = entry_id(entry).unwrap();
        let result = convert_file(entry, Direction::XmlToYaml, xml.as_bytes(), &inputs).unwrap();
        let yaml = String::from_utf8_lossy(&result.bytes);
        assert!(yaml.contains("!xml/raw"));
        if xml.contains("extra=") {
            assert!(yaml.contains("$значение: unchanged"), "{yaml}");
        }
        assert!(validate_file(entry, &result.bytes, &inputs).is_empty());
        nkdk_compiled_rules::verify_candidate(entry, xml.as_bytes(), &result.bytes, &inputs)
            .unwrap();
    }
}

#[test]
fn scalar_constraints_infer_annotations_without_duplicate_rules() {
    let entry = entry_id("test.numeric-bound").unwrap();
    let inputs = PreparedInputs::default();
    let xml = b"<Root><CodeType>Number</CodeType><CodeLength>39</CodeLength></Root>";
    let result = convert_file(entry, Direction::XmlToYaml, xml, &inputs).unwrap();
    let yaml = String::from_utf8_lossy(&result.bytes);
    assert!(yaml.contains("!xml/invalid"), "{yaml}");
    assert!(validate_file(entry, &result.bytes, &inputs).is_empty());
    nkdk_compiled_rules::verify_candidate(entry, xml, &result.bytes, &inputs).unwrap();
    let noncanonical = b"<Root><CodeType>Number</CodeType><CodeLength>39.0</CodeLength></Root>";
    let result = convert_file(entry, Direction::XmlToYaml, noncanonical, &inputs).unwrap();
    let yaml = String::from_utf8_lossy(&result.bytes);
    assert!(yaml.contains("!xml/raw") && yaml.contains("!xml/invalid"));
    nkdk_compiled_rules::verify_candidate(entry, noncanonical, &result.bytes, &inputs).unwrap();
    assert!(
        !validate_file(
            entry,
            "ТипКода: Число\nДлинаКода: !xml/invalid 38".as_bytes(),
            &inputs
        )
        .is_empty()
    );
}
