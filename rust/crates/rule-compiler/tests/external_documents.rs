use nkdk_rule_compiler::{SourceFile, generate, link, parse};

#[test]
fn document_routes_own_roots_and_empty_sequences_get_comparison_context() {
    let source = r#"format: nkdk-declarations/1
kind: object
id: owner
value: {kind: record, fields: [{name: name, type: {kind: scalar, scalar: text}}, {name: extra, type: {kind: scalar, scalar: text}}]}
representations:
  xml: {kind: record, fields: [{field: name, path: [Root, Name]}, {field: extra, path: [Extra], file: [Ext, Extra.xml]}]}
  yaml: {kind: mapping, fields: [{field: name, key: Name}, {field: extra, key: Extra}]}
"#;
    let module = parse(SourceFile {
        path: "owner.yaml",
        bytes: source.as_bytes(),
    })
    .unwrap();
    let program = link(&[module]).unwrap();
    generate(&program).unwrap();
    for route in ["[]", "[.., Extra.xml]", "[/tmp, Extra.xml]", "[Ext, 'a/b']"] {
        let text = source.replace("[Ext, Extra.xml]", route);
        assert!(
            parse(SourceFile {
                path: "owner.yaml",
                bytes: text.as_bytes()
            })
            .is_err()
        );
    }
    let text = source.replace("path: [Extra]", "path: [Extra, Value]");
    let module = parse(SourceFile {
        path: "owner.yaml",
        bytes: text.as_bytes(),
    })
    .unwrap();
    assert_eq!(
        link(&[module]).unwrap_err()[0].code,
        "invalid_file_boundary"
    );
    let common = include_str!("../../../declarations/common/help-pages.yaml");
    for comparison in [
        "{eq: [{self: true}, {sequence: []}]}",
        "{eq: [{sequence: []}, {self: true}]}",
    ] {
        let text = common.replace("{eq: [{self: true}, {sequence: []}]}", comparison);
        let module = parse(SourceFile {
            path: "common.yaml",
            bytes: text.as_bytes(),
        })
        .unwrap();
        link(&[module]).unwrap();
    }
    let text = common.replace(
        "{eq: [{self: true}, {sequence: []}]}",
        "{eq: [{literal: true}, {sequence: []}]}",
    );
    let module = parse(SourceFile {
        path: "common.yaml",
        bytes: text.as_bytes(),
    })
    .unwrap();
    assert_eq!(
        link(&[module]).unwrap_err()[0].code,
        "expression_type_mismatch"
    );
}
