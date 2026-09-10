use nkdk_rule_compiler::{SourceFile, generate, link, parse};
use std::{fs, process::Command};

#[test]
fn generated_text_transitions_preserve_the_independent_contract() {
    let fixture =
        include_str!("../../../../tests/declaration-corpus/valid/name-text-transform.yaml");
    let local_types = fixture
        .split_once("types:\n")
        .unwrap()
        .1
        .split_once("\nvalue:\n")
        .unwrap()
        .0;
    let owner = format!(
        "format: nkdk-declarations/1\nkind: object\nid: test.text-transition\ntypes:\n{local_types}\nvalue:\n  kind: record\n  fields:\n    - {{name: source, type: {{kind: scalar, scalar: text}}}}\n    - {{name: expected, type: {{kind: scalar, scalar: text}}}}\nrepresentations:\n  xml:\n    kind: record\n    fields:\n      - {{field: source, path: [Root, Source]}}\n      - {{field: expected, path: [Root, Expected]}}\n  yaml:\n    kind: mapping\n    fields:\n      - {{field: source, key: Source}}\n      - {{field: expected, key: Expected}}\nconstraints:\n  - id: transformed-text\n    appliesTo: [yaml-validation, xml-import]\n    assert:\n      match:\n        value: {{transform: {{local: name-words, value: {{field: source}}}}}}\n        present:\n          as: converted\n          then: {{eq: [{{var: converted}}, {{field: expected}}]}}\n        absent: {{literal: false}}\n    diagnostic:\n      code: example.text-result\n      severity: error\n      at: {{field: source}}\n      message: Unexpected transformed text\n"
    );
    let root = std::env::temp_dir().join(format!(
        "nkdk-text-generated-{}-{}",
        std::process::id(),
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_nanos()
    ));
    fs::create_dir_all(root.join("src")).unwrap();
    let core = std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
        .parent()
        .unwrap()
        .join("conversion-core");
    fs::write(root.join("Cargo.toml"), format!("[package]\nname=\"text-generated-contract\"\nversion=\"0.0.0\"\nedition=\"2024\"\n[dependencies]\nnkdk-conversion-core={{path={core:?}}}\n[workspace]\n")).unwrap();
    let observations: serde_json::Value = serde_json::from_str(include_str!(
        "../../../../tests/migration/name-text-contract.json"
    ))
    .unwrap();
    for separator in [" ", "_"] {
        let source = owner.replace("separator: \" \"", &format!("separator: {separator:?}"));
        let mut main = String::from(
            "include!(\"generated.rs\");\nfn main() {\nlet entry=entry_id(\"test.text-transition\").unwrap(); let inputs=PreparedInputs::default();\n",
        );
        for case in observations["cases"].as_array().unwrap() {
            let input = case["input"].as_str().unwrap();
            let expected = case["expected"]["text"]
                .as_str()
                .map(|text| text.replace(' ', separator));
            let yaml = format!(
                "Source: {}\nExpected: {}",
                serde_json::to_string(input).unwrap(),
                serde_json::to_string(&expected.clone().unwrap_or_default()).unwrap()
            );
            main.push_str(&format!(
                "assert_eq!(validate_file(entry, {yaml:?}.as_bytes(), &inputs).is_empty(), {});\n",
                expected.is_some()
            ));
            main.push_str(&format!("let converted=convert_file(entry, Direction::YamlToXml, {yaml:?}.as_bytes(), &inputs); assert_eq!(converted.is_ok(), {}); if let Ok(xml)=converted {{ let back=convert_file(entry, Direction::XmlToYaml, &xml.bytes, &inputs).unwrap(); assert!(validate_file(entry, &back.bytes, &inputs).is_empty()); }}\n", expected.is_some()));
        }
        main.push_str("let errors=validate_file(entry, b\"Source: TestTest\\nExpected: wrong\", &inputs); assert_eq!(errors[0].code, \"example.text-result\"); assert_eq!((errors[0].line, errors[0].column), (1, 9));\n}\n");
        execute(&root, &source, &main);
    }
    let generic = "  name-words:\n    kind: text-transform\n    units: utf16\n    classes: {digit: [[48, 57], [49, 50]], upper: [[65, 90]]}\n    state: {}\n    transitions:\n      - when: {nextAfterRun: {class: digit, is: upper}}\n        emit: append\n        set: {}\n      - emit: discard\n        set: {}\n    result:\n      separator: \"\"\n      first: {kind: identity}\n      rest: {kind: identity}\n      lowercase: []\n      emptyInput: empty-text\n      noTokens: absent\n";
    let source = owner.replace(local_types, generic);
    let body = r#"include!("generated.rs");
fn main() {
    let entry=entry_id("test.text-transition").unwrap();
    let input = format!("{}A{}b", "1".repeat(20000), "2".repeat(20000));
    let expected = format!("{}A", "1".repeat(20000));
    let yaml = format!("Source: {input}\nExpected: {expected}");
    assert!(validate_file(entry, yaml.as_bytes(), &PreparedInputs::default()).is_empty());
}"#;
    execute(&root, &source, body);
    let malformed = generic
        .replace(
            "{digit: [[48, 57], [49, 50]], upper: [[65, 90]]}",
            "{high: [[55296, 56319]]}",
        )
        .replace("{nextAfterRun: {class: digit, is: upper}}", "{class: high}");
    let source = owner.replace(local_types, &malformed);
    execute(
        &root,
        &source,
        r#"include!("generated.rs");
fn main() {
    let errors=validate_file(entry_id("test.text-transition").unwrap(), "Source: 😀\nExpected: x".as_bytes(), &PreparedInputs::default());
    assert_eq!(errors[0].code, "text.invalid-utf16");
    assert_eq!(errors[0].path, ["Source"]);
    let errors=convert_file(entry_id("test.text-transition").unwrap(), Direction::XmlToYaml, "<Root><Source>😀</Source><Expected>x</Expected></Root>".as_bytes(), &PreparedInputs::default()).unwrap_err();
    assert_eq!(errors[0].code, "text.invalid-utf16");
    assert_eq!(errors[0].path, ["Source"]);
    assert_eq!((errors[0].line, errors[0].column), (1, 7));
}"#,
    );
    fs::remove_dir_all(root).unwrap();
}

fn execute(root: &std::path::Path, source: &str, main: &str) {
    let source = source
        .replace("kind: object", "kind: fragment")
        .replace("id: test.text-transition", "id: common.text-transition");
    let module = parse(SourceFile {
        path: "fragment.yaml",
        bytes: source.as_bytes(),
    })
    .unwrap();
    let owner = parse(SourceFile { path: "owner.yaml", bytes: b"format: nkdk-declarations/1\nkind: object\nid: test.text-transition\nimports: {part: common.text-transition}\ncompose: [{use: part}]\nvalue: {kind: record, fields: []}\nrepresentations: {xml: {kind: record, fields: []}, yaml: {kind: mapping, fields: []}}\n" }).unwrap();
    let generated =
        generate(&link(&[module, owner]).unwrap()).expect("generate declarative text transitions");
    for file in generated.files {
        fs::write(root.join("src").join(file.path), file.contents).unwrap();
    }
    fs::write(root.join("src/main.rs"), main).unwrap();
    let output = Command::new("cargo")
        .args(["+1.98.1", "run", "--offline", "--quiet"])
        .env("RUSTFLAGS", "-D warnings")
        .current_dir(root)
        .output()
        .unwrap();
    assert!(
        output.status.success(),
        "{}: {}",
        root.display(),
        String::from_utf8_lossy(&output.stderr)
    );
}
