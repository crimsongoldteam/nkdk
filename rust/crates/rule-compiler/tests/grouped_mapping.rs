use nkdk_rule_compiler::{SourceFile, generate, link, parse};

const ROW: &str = r#"format: nkdk-declarations/1
kind: value
id: row
value: {kind: record, fields: [{name: key, type: {kind: scalar, scalar: text}}, {name: axis, type: {kind: scalar, scalar: text}}, {name: payload, type: {kind: scalar, scalar: text}}]}
representations:
  xml: {kind: record, fields: [{field: key, path: [], attribute: name}, {field: axis, path: [], attribute: mode}, {field: payload, path: [Payload]}]}
  yaml: {kind: mapping, fields: [{field: key, key: Ключ}, {field: axis, key: Режим}, {field: payload, key: Значение}]}
presence:
- target: {field: axis}
  xml: {missing: {denotes: {absent: true}}}
  yaml: {missing: {denotes: {absent: true}}}
"#;
const COLLECTION: &str = r#"format: nkdk-declarations/1
kind: value
id: collection
imports: {row: row}
value: {kind: sequence, item: {use: row}}
representations:
  xml: {kind: element-sequence, path: [Entry]}
  yaml: {kind: record-mapping, key: key, value: payload, groupKey: axis}
"#;
const OWNER: &str = r#"format: nkdk-declarations/1
kind: object
id: owner
imports: {collection: collection}
value: {kind: record, fields: [{name: rows, type: {use: collection}}]}
representations:
  xml: {kind: record, fields: [{field: rows, path: [Root,Entries]}]}
  yaml: {kind: mapping, fields: [{field: rows, key: Записи}]}
"#;

#[test]
fn grouped_mapping_is_compiled_from_unrelated_field_names() {
    let modules = [
        ("row.yaml", ROW),
        ("collection.yaml", COLLECTION),
        ("owner.yaml", OWNER),
    ]
    .map(|(path, source)| {
        parse(SourceFile {
            path,
            bytes: source.as_bytes(),
        })
        .unwrap()
    });
    let program = link(&modules).unwrap();
    generate(&program).unwrap();
}

#[test]
fn grouped_mapping_rejects_ambiguous_or_unrepresented_secondary_keys() {
    for collection in [
        COLLECTION.replace("groupKey: axis", "groupKey: payload"),
        COLLECTION.replace("groupKey: axis", "groupKey: absent"),
        COLLECTION.replace("value: payload", "value: absent"),
    ] {
        let modules = [
            ("row.yaml", ROW),
            ("collection.yaml", collection.as_str()),
            ("owner.yaml", OWNER),
        ]
        .map(|(path, source)| {
            parse(SourceFile {
                path,
                bytes: source.as_bytes(),
            })
            .unwrap()
        });
        assert!(link(&modules).is_err());
    }
    for row in [
        ROW.replace("{field: axis, key: Режим}, ", ""),
        ROW.replace(
            "name: axis, type: {kind: scalar, scalar: text}",
            "name: axis, type: {kind: scalar, scalar: boolean}",
        ),
        ROW.replace(
            "name: payload, type: {kind: scalar, scalar: text}",
            "name: payload, type: {kind: record, fields: []}",
        ),
    ] {
        let modules = [
            ("row.yaml", row.as_str()),
            ("collection.yaml", COLLECTION),
            ("owner.yaml", OWNER),
        ]
        .map(|(path, source)| {
            parse(SourceFile {
                path,
                bytes: source.as_bytes(),
            })
            .unwrap()
        });
        assert!(link(&modules).is_err());
    }
}

#[test]
fn grouped_mapping_schemas_accept_modes_and_reject_ambiguous_shapes() {
    let authoring: serde_json::Value =
        serde_json::from_slice(nkdk_rule_compiler::declaration_schema()).unwrap();
    let validator = jsonschema::validator_for(&authoring).unwrap();
    assert!(validator.is_valid(&serde_json::json!({
        "format":"nkdk-declarations/1", "kind":"value", "id":"collection",
        "imports":{"row":"row"}, "value":{"kind":"sequence","item":{"use":"row"}},
        "representations":{"xml":{"kind":"element-sequence","path":["Entry"]},
        "yaml":{"kind":"record-mapping","key":"key","value":"payload","groupKey":"axis"}}
    })));
    let row = ROW
        .replace("value:", "imports: {axis: axis}\nvalue:")
        .replace(
            "name: axis, type: {kind: scalar, scalar: text}",
            "name: axis, type: {use: axis}",
        );
    let modules = [
        ("axis.yaml", "format: nkdk-declarations/1\nkind: value\nid: axis\nenum: {Before: Перед, After: После}\n"),
        ("row.yaml", row.as_str()), ("collection.yaml", COLLECTION), ("owner.yaml", OWNER),
    ].map(|(path, source)| parse(SourceFile {path, bytes:source.as_bytes()}).unwrap());
    let program = link(&modules).unwrap();
    let shape: serde_json::Value =
        serde_json::from_slice(&nkdk_rule_compiler::schema(&program, "owner").unwrap()).unwrap();
    let validator = jsonschema::validator_for(&shape).unwrap();
    assert!(
        validator
            .is_valid(&serde_json::json!({"Записи":{"Один":"a","Два":{"Перед":"b","После":"c"}}}))
    );
    for value in [
        serde_json::json!({"Записи":{"Два":{}}}),
        serde_json::json!({"Записи":{"Два":{"Неизвестно":"b"}}}),
        serde_json::json!({"Записи":{"Два":{"Перед":17}}}),
    ] {
        assert!(
            !validator.is_valid(&value),
            "Unexpected valid shape: {value}"
        );
    }
}
