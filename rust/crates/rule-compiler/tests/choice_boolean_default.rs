mod support;

#[test]
fn imported_boolean_choice_default_owns_its_payload() {
    // Reuse the existing mixed-choice fixture and vary only its scalar type.
    let source = include_str!("../../../declarations/probes/choice-default.yaml")
        .replace("scalar: number, profile: decimal", "scalar: boolean")
        .replace("scalar: number", "scalar: boolean")
        .replace("literal: 0", "literal: false")
        .replacen("xml: {kind: text}", "xml: {kind: text, values: [{value: false, text: 'false'}, {value: true, text: 'true'}]}", 1)
        .replace("yaml: {kind: scalar, scalar: boolean}", "yaml: {kind: scalar, values: [{value: false, literal: Ложь}, {value: true, literal: Истина}]}");
    let (generated, id) =
        support::compile_catalog("boolean-choice.yaml", &source, "probe.choice-default");
    support::run_generated(
        "boolean-choice-default",
        generated,
        id,
        r#"
mod generated;
use generated::*;
use nkdk_conversion_core as core;
fn main() {
    let entry=EntryId(OWNER);
    for yaml in ["{}", "Значение: Ложь", "Значение: Истина"] {
        let exported=convert_file(entry,Direction::YamlToXml,yaml.as_bytes(),&PreparedInputs::default()).unwrap();
        let imported=convert_file(entry,Direction::XmlToYaml,&exported.bytes,&PreparedInputs::default()).unwrap();
        let text=String::from_utf8(imported.bytes).unwrap();
        if yaml.ends_with("Истина") {assert!(text.contains("Истина"),"{text}");}
        else {assert!(!text.contains("Значение:"),"{text}");}
    }
}
"#,
    );
}
