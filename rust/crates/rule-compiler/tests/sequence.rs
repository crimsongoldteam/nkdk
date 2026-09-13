use nkdk_rule_compiler::{SourceFile, compile, link, parse, schema};

#[test]
fn ordinary_sequences_have_typed_items_and_generate_both_directions() {
    for (item, xml, yaml) in [
        (
            "{kind: scalar, scalar: text}",
            "{kind: with-attributes, attributes: [{name: mode, value: {text: fixed}}], content: {kind: text}}",
            "{kind: scalar, scalar: text}",
        ),
        (
            "{kind: scalar, scalar: text}",
            "{kind: text}",
            "{kind: scalar, scalar: text}",
        ),
        (
            "{kind: scalar, scalar: text}",
            "{kind: tree, children: [{name: Text, self: true, attributes: [{name: mode, value: {text: first}, when: {matches: {value: {self: true}, pattern: 'A.*'}}}, {name: mode, value: {text: other}, when: {not: {matches: {value: {self: true}, pattern: 'A.*'}}}}]}]}",
            "{kind: scalar, scalar: text}",
        ),
        (
            "{kind: record, fields: [{name: key, type: {kind: scalar, scalar: text}}, {name: value, type: {kind: scalar, scalar: text}}]}",
            "{kind: record, fields: [{field: key, path: [Key]}, {field: value, path: [Value]}]}",
            "{kind: mapping, fields: [{field: key, key: Key}, {field: value, key: Value}]}",
        ),
        (
            "{kind: record, fields: [{name: key, type: {kind: scalar, scalar: text}}, {name: value, type: {kind: scalar, scalar: text}}]}",
            "{kind: tree, children: [{name: Mode, text: ready}, {name: Pair, attributes: [{name: version, value: {text: '1'}}], children: [{name: Code, field: key}, {name: Text, field: value}]}]}",
            "{kind: mapping, fields: [{field: key, key: Key}, {field: value, key: Value}]}",
        ),
    ] {
        let common = format!(
            "format: nkdk-declarations/1\nkind: value\nid: common.list\nvalue: {{kind: sequence, item: {item}}}\nrepresentations:\n  xml: {{kind: element-sequence, path: [Item], item: {xml}}}\n  yaml: {{kind: sequence, item: {yaml}}}\npresence:\n- target: self\n  xml: {{missing: {{denotes: {{absent: true}}}}}}\n  yaml: {{missing: {{denotes: {{absent: true}}}}}}\n"
        );
        let owner = b"format: nkdk-declarations/1\nkind: object\nid: test.list\nimports: {list: common.list}\nvalue: {kind: record, fields: [{name: list, type: {use: list}}]}\nrepresentations:\n  xml: {kind: record, fields: [{field: list, path: [Root, List]}]}\n  yaml: {kind: mapping, fields: [{field: list, key: List}]}\n";
        let sources = [
            SourceFile {
                path: "common.yaml",
                bytes: common.as_bytes(),
            },
            SourceFile {
                path: "owner.yaml",
                bytes: owner,
            },
        ];
        let modules = sources
            .iter()
            .map(|source| {
                parse(SourceFile {
                    path: source.path,
                    bytes: source.bytes,
                })
                .unwrap()
            })
            .collect::<Vec<_>>();
        let program = link(&modules).unwrap();
        let value: serde_json::Value =
            serde_json::from_slice(&schema(&program, "test.list").unwrap()).unwrap();
        assert_eq!(value["properties"]["List"]["type"], "array");
        compile(&sources).unwrap();
        let owner_defaults = format!(
            "{}\npresence:\n- target: {{field: list}}\n  xml:\n    missing: {{denotes: {{sequence: []}}}}\n    empty: [{{form: empty-element, denotes: {{sequence: []}}}}]\n  yaml:\n    missing: {{denotes: {{sequence: []}}}}\n    omitWhen: {{not: {{exists: {{in: {{field: list}}, as: row, where: {{literal: true}}}}}}}}\n",
            std::str::from_utf8(owner).unwrap()
        );
        compile(&[
            SourceFile {
                path: "common.yaml",
                bytes: common.as_bytes(),
            },
            SourceFile {
                path: "owner.yaml",
                bytes: owner_defaults.as_bytes(),
            },
        ])
        .unwrap();
    }
}

#[test]
fn literal_sequence_shorthand_has_one_inverse() {
    let source = "format: nkdk-declarations/1\nkind: value\nid: common.shortcuts\nvalue: {kind: sequence, item: {kind: scalar, scalar: text}}\nrepresentations:\n  xml: {kind: element-sequence, path: [Item], item: {kind: text}}\n  yaml:\n    kind: sequence\n    item: {kind: scalar, scalar: text}\n    shorthand:\n    - id: pair\n      representation: {kind: literal, value: Pair}\n      denotes: {sequence: [{literal: a}, {literal: b}]}\n";
    let module = parse(SourceFile {
        path: "shortcuts.yaml",
        bytes: source.as_bytes(),
    })
    .unwrap();
    link(&[module]).unwrap();
    let empty_item = format!(
        "{source}presence:\n- target: self\n  xml:\n    empty: [{{form: empty-item, denotes: {{sequence: []}}}}]\n"
    );
    let module = parse(SourceFile {
        path: "empty-item.yaml",
        bytes: empty_item.as_bytes(),
    })
    .unwrap();
    link(&[module]).unwrap();
    let duplicate = format!(
        "{source}    - id: other\n      representation: {{kind: literal, value: Pair}}\n      denotes: {{sequence: [{{literal: b}}]}}\n"
    );
    let result = parse(SourceFile {
        path: "shortcuts.yaml",
        bytes: duplicate.as_bytes(),
    })
    .and_then(|module| link(&[module]).map(|_| ()));
    assert!(result.is_err());
}

#[test]
fn referenced_sequence_items_keep_their_own_contract() {
    let row = include_str!("fixtures/declared-row.yaml");
    let list = include_str!("fixtures/declared-rows.yaml");
    let owner = "format: nkdk-declarations/1\nkind: object\nid: test.rows\nimports: {rows: common.rows}\nvalue: {kind: record, fields: [{name: rows, type: {use: rows}}]}\nrepresentations:\n  xml: {kind: record, fields: [{field: rows, path: [Root, Rows]}]}\n  yaml: {kind: mapping, fields: [{field: rows, key: Rows}]}\n";
    let modules = [row, list, owner]
        .into_iter()
        .enumerate()
        .map(|(i, source)| {
            parse(SourceFile {
                path: &format!("{i}.yaml"),
                bytes: source.as_bytes(),
            })
            .unwrap()
        })
        .collect::<Vec<_>>();
    let program = link(&modules).unwrap();
    let schema: serde_json::Value =
        serde_json::from_slice(&schema(&program, "test.rows").unwrap()).unwrap();
    let item = &schema["properties"]["Rows"]["items"];
    assert_eq!(item["required"], serde_json::json!(["Name"]));
    assert_eq!(item["properties"]["Mode"]["type"], "string");
    assert!(item.to_string().contains("reserved"));
    let validator = jsonschema::validator_for(&schema).unwrap();
    assert!(validator.is_valid(
        &serde_json::json!({"Rows":[{"Name":"first"},{"Name":"second","Mode":"other"}]})
    ));
    assert!(!validator.is_valid(&serde_json::json!({"Rows":[{"Mode":"normal"}]})));
    assert!(!validator.is_valid(&serde_json::json!({"Rows":[{"Name":"reserved"}]})));
    let parameterized = row.replace("{literal: reserved}", "{parameter: forbidden}")
        + "parameters:\n  forbidden: {type: {kind: scalar, scalar: text}, default: reserved}\n";
    for (usage, forbidden) in [
        ("{use: row}", "reserved"),
        ("{use: row, with: {forbidden: other}}", "other"),
    ] {
        let mut bound = modules.clone();
        bound[0] = parse(SourceFile {
            path: "parameterized.yaml",
            bytes: parameterized.as_bytes(),
        })
        .unwrap();
        bound[1] = parse(SourceFile {
            path: "bound.yaml",
            bytes: list.replace("{use: row}", usage).as_bytes(),
        })
        .unwrap();
        let bound = link(&bound).unwrap();
        let schema: serde_json::Value =
            serde_json::from_slice(&nkdk_rule_compiler::schema(&bound, "test.rows").unwrap())
                .unwrap();
        let validator = jsonschema::validator_for(&schema).unwrap();
        assert!(!validator.is_valid(&serde_json::json!({"Rows":[{"Name":forbidden}]})));
        assert!(validator.is_valid(&serde_json::json!({"Rows":[{"Name":"allowed"}]})));
    }
    let mut unsupported = modules.clone();
    let conditional =
        format!("{list}\npresence:\n- target: self\n  yaml: {{omitWhen: {{literal: true}}}}\n");
    unsupported[1] = parse(SourceFile {
        path: "conditional.yaml",
        bytes: conditional.as_bytes(),
    })
    .unwrap();
    let unsupported = link(&unsupported).unwrap();
    assert!(
        nkdk_rule_compiler::generate(&unsupported)
            .unwrap_err()
            .iter()
            .any(|error| error.code == "unsupported_generation_feature")
    );
    let mut incomplete = modules.clone();
    incomplete[1] = parse(SourceFile {
        path: "incomplete.yaml",
        bytes: list
            .replace(
                "yaml: {kind: sequence}",
                "yaml: {kind: sequence, item: {kind: scalar, scalar: text}}",
            )
            .as_bytes(),
    })
    .unwrap();
    assert!(
        link(&incomplete)
            .unwrap_err()
            .iter()
            .any(|error| error.code == "incomplete_item_contract")
    );
    // An omitted representation must never silently reinterpret an inline type.
    let mut invalid = modules.clone();
    invalid[1] = parse(SourceFile {
        path: "inline.yaml",
        bytes: list
            .replace("{use: row}", "{kind: scalar, scalar: text}")
            .as_bytes(),
    })
    .unwrap();
    assert!(link(&invalid).is_err());
}
