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
