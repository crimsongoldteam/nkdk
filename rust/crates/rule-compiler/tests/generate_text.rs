use nkdk_rule_compiler::{SourceFile, generate, link, parse};
use std::{fs, process::Command};
mod support;

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
    let root = support::generated_crate_root("text-generated");
    let core = support::conversion_core_path();
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
                "assert!({}validate_file(entry, {yaml:?}.as_bytes(), &inputs).is_empty());\n",
                if expected.is_some() { "" } else { "!" }
            ));
            main.push_str(&format!("let converted=convert_file(entry, Direction::YamlToXml, {yaml:?}.as_bytes(), &inputs); assert!({}converted.is_ok()); if let Ok(xml)=converted {{ let back=convert_file(entry, Direction::XmlToYaml, &xml.bytes, &inputs).unwrap(); assert!(validate_file(entry, &back.bytes, &inputs).is_empty()); }}\n", if expected.is_some() { "" } else { "!" }));
        }
        main.push_str("let errors=validate_file(entry, b\"Source: TestTest\\nExpected: wrong\", &inputs); assert_eq!(errors[0].code.as_deref(), Some(\"example.text-result\")); assert_eq!((errors[0].line, errors[0].column), (1, 9));\n}\n");
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
    assert_eq!(errors[0].code.as_deref(), Some("text.invalid-utf16"));
    assert_eq!(errors[0].path, ["Source"]);
    let errors=convert_file(entry_id("test.text-transition").unwrap(), Direction::XmlToYaml, "<Root><Source>😀</Source><Expected>x</Expected></Root>".as_bytes(), &PreparedInputs::default()).unwrap_err();
    assert_eq!(errors[0].code.as_deref(), Some("text.invalid-utf16"));
    assert_eq!(errors[0].path, ["Source"]);
    assert_eq!((errors[0].line, errors[0].column), (1, 7));
}"#,
    );
    let source = owner
        .replace("code: example.text-result", "source: structure")
        .replace(
            "message: Unexpected transformed text",
            "message: {parts: [\"Unexpected transformed text: \", {field: source}]} ",
        );
    execute(
        &root,
        &source,
        r#"include!("generated.rs");
fn main() {
    let errors=validate_file(entry_id("test.text-transition").unwrap(), b"Source: TestTest\nExpected: wrong", &PreparedInputs::default());
    assert!(errors[0].code.is_none());
    assert_eq!(errors[0].source.as_deref(), Some("structure"));
    assert_eq!(errors[0].message, "Unexpected transformed text: TestTest");
}"#,
    );
    let message = "message: {parts: [\"Converted: \", {match: {value: {transform: {local: name-words, value: {field: source}}}, present: {as: text, then: {var: text}}, absent: {literal: absent}}}]}";
    let source = owner.replace("message: Unexpected transformed text", message);
    execute(
        &root,
        &source,
        r#"include!("generated.rs");
fn main() {
    let errors=validate_file(entry_id("test.text-transition").unwrap(), b"Source: TestTest\nExpected: wrong", &PreparedInputs::default());
    assert_eq!(errors[0].message, "Converted: Test test");
}"#,
    );
    let assertion = source
        .split_once("    assert:\n")
        .unwrap()
        .1
        .split_once("    diagnostic:")
        .unwrap()
        .0;
    let lazy = source.replace(local_types, &malformed).replace(
        assertion,
        "      eq: [{field: expected}, {literal: skip}]\n",
    );
    execute(
        &root,
        &lazy,
        r#"include!("generated.rs");
fn main() {
    let entry=entry_id("test.text-transition").unwrap();
    let inputs=PreparedInputs::default();
    assert!(validate_file(entry, "Source: 😀\nExpected: skip".as_bytes(), &inputs).is_empty());
    let errors=validate_file(entry, "Source: 😀\nExpected: wrong".as_bytes(), &inputs);
    assert_eq!(errors[0].code.as_deref(), Some("text.invalid-utf16"));
    assert_eq!(errors[0].path, ["Source"]);
}"#,
    );
    let with_inputs = owner
        .replace(
            "types:\n",
            "inputs:\n  wanted: {type: {kind: scalar, scalar: text}}\ntypes:\n",
        )
        .replace("{field: expected}", "{input: wanted}");
    execute(
        &root,
        &with_inputs,
        r#"include!("generated.rs");
fn main() {
    let entry=entry_id("test.text-transition").unwrap();
    let inputs=prepare_inputs(entry, vec![("wanted".into(), InputValue::Text("Test test".into()))]).unwrap();
    assert!(validate_file(entry, b"Source: TestTest\nExpected: ignored", &inputs).is_empty());
    assert!(prepare_inputs(entry, vec![("wanted".into(), InputValue::Boolean(true))]).is_err());
    assert!(prepare_inputs(entry, vec![("typo".into(), InputValue::Text("x".into()))]).is_err());
    assert!(prepare_inputs(entry, vec![("wanted".into(), InputValue::Text("x".into())), ("wanted".into(), InputValue::Text("y".into()))]).is_err());
    let errors=validate_file(entry, b"Source: TestTest\nExpected: ignored", &PreparedInputs::default());
    assert_eq!(errors[0].code.as_deref(), Some("input.not-ready"));
}"#,
    );
    let readiness = with_inputs.replace(
        "    assert:\n",
        "    when: {isReady: {input: wanted}}\n    assert:\n",
    );
    execute(
        &root,
        &readiness,
        r#"include!("generated.rs");
fn main() {
    let entry=entry_id("test.text-transition").unwrap();
    assert!(validate_file(entry, b"Source: TestTest\nExpected: ignored", &PreparedInputs::default()).is_empty());
    let inputs=read_inputs(entry, b"{\"wanted\":\"wrong\"}").unwrap();
    assert_eq!(validate_file(entry, b"Source: TestTest\nExpected: ignored", &inputs).len(), 1);
}"#,
    );
    let sequence = with_inputs.replace(
        "wanted: {type: {kind: scalar, scalar: text}}",
        "wanted: {type: {kind: sequence, item: {kind: scalar, scalar: text}}}",
    );
    let assertion = sequence
        .split_once("    assert:\n")
        .unwrap()
        .1
        .split_once("    diagnostic:")
        .unwrap()
        .0;
    let sequence = sequence.replace(assertion, "      exists:\n        in: {input: wanted}\n        as: candidate\n        where: {eq: [{var: candidate}, {field: expected}]}\n");
    let sequence_main = r#"include!("generated.rs");
fn main() {
    let entry=entry_id("test.text-transition").unwrap();
    for (values, valid) in [("wanted: [ru, ru, en]", true), ("wanted: [ru, ru]", false), ("wanted: []", false)] {
        let inputs=read_inputs(entry, values.as_bytes()).unwrap();
        assert_eq!(validate_file(entry, b"Source: x\nExpected: en", &inputs).is_empty(), valid);
    }
}"#;
    execute(&root, &sequence, sequence_main);
    let first_text = sequence.replace(
        "in: {input: wanted}",
        "in: {firstBy: {in: {input: wanted}, as: key, key: {var: key}}}",
    );
    for first_text in [
        first_text.clone(),
        first_text.replace(
            "key: {var: key}",
            "key: {concat: [{var: key}, {literal: suffix}]}",
        ),
        first_text.replace(
            "in: {input: wanted}",
            "in: {firstBy: {in: {input: wanted}, as: inner, key: {var: inner}}}",
        ),
    ] {
        execute(&root, &first_text, sequence_main);
    }
    // Select the first physical row per key while retaining all source rows.
    let assertion = sequence
        .split_once("    assert:\n")
        .unwrap()
        .1
        .split_once("    diagnostic:")
        .unwrap()
        .0;
    let rows = sequence.replace(
        "wanted: {type: {kind: sequence, item: {kind: scalar, scalar: text}}}",
        "wanted: {type: {kind: sequence, item: {kind: record, fields: [{name: key, type: {kind: scalar, scalar: text}}, {name: result, type: {kind: scalar, scalar: text}}]}}}",
    ).replace(assertion, "      each:\n        in: {firstBy: {in: {input: wanted}, as: row, key: {get: {of: {var: row}, field: key}}}}\n        as: row\n        where: {eq: [{get: {of: {var: row}, field: result}}, {field: expected}]}\n");
    for (kind, first, second) in [
        ("text", "ru", "en"),
        ("boolean", "true", "false"),
        (
            "number, profile: decimal",
            "9007199254740993",
            "9007199254740992",
        ),
    ] {
        let source = rows.replace(
            "name: key, type: {kind: scalar, scalar: text}",
            &format!("name: key, type: {{kind: scalar, scalar: {kind}}}"),
        );
        let duplicate = if kind.starts_with("number") {
            format!("{first}.0")
        } else {
            first.to_owned()
        };
        let main = format!(
            r#"include!("generated.rs");
fn main() {{
    let entry=entry_id("test.text-transition").unwrap();
    for (values, valid) in [
        ("wanted: [{{key: {first}, result: ok}}, {{key: {duplicate}, result: wrong}}, {{key: {second}, result: ok}}]", true),
        ("wanted: [{{key: {first}, result: wrong}}, {{key: {first}, result: ok}}]", false),
        ("wanted: [{{key: {first}, result: ok}}, {{key: {second}, result: wrong}}]", false),
        ("wanted: []", true),
    ] {{
        let inputs=read_inputs(entry, values.as_bytes()).unwrap();
        assert_eq!(validate_file(entry, b"Source: x\nExpected: ok", &inputs).is_empty(), valid, "{{values}}");
    }}
}}"#
        );
        execute(&root, &source, &main);
    }
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
    let input_declarations = source
        .split_once("inputs:\n")
        .map(|(_, rest)| rest.split_once("types:\n").unwrap().0);
    let (inputs, bindings) = if let Some(declarations) = input_declarations {
        let bindings = module
            .inputs
            .iter()
            .map(|input| format!("{}: {{input: {}}}", input.name, input.name))
            .collect::<Vec<_>>()
            .join(", ");
        (
            format!("inputs:\n{declarations}"),
            format!(", bind: {{{bindings}}}"),
        )
    } else {
        (String::new(), String::new())
    };
    let owner_source = format!(
        "format: nkdk-declarations/1\nkind: object\nid: test.text-transition\nimports: {{part: common.text-transition}}\n{inputs}compose: [{{use: part{bindings}}}]\nvalue: {{kind: record, fields: []}}\nrepresentations: {{xml: {{kind: record, fields: []}}, yaml: {{kind: mapping, fields: []}}}}\n"
    );
    let owner = parse(SourceFile {
        path: "owner.yaml",
        bytes: owner_source.as_bytes(),
    })
    .unwrap();

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
    let lint = Command::new("cargo")
        .args([
            "+1.98.1",
            "clippy",
            "--offline",
            "--quiet",
            "--",
            "-D",
            "warnings",
        ])
        .current_dir(root)
        .output()
        .unwrap();
    assert!(
        lint.status.success(),
        "{}",
        String::from_utf8_lossy(&lint.stderr)
    );
}
