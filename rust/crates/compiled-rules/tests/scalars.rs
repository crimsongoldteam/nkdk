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
        assert!(convert_file(entry, Direction::XmlToYaml, xml.as_bytes(), &inputs).is_err());
    }
}
