use nkdk_rule_compiler::{SourceFile, compile, link, parse, schema};

const COMMON: &str = include_str!("fixtures/qname-common.yaml");
const OWNER: &str = include_str!("fixtures/qname-owner.yaml");

#[test]
fn qname_representation_binds_two_distinct_text_fields() {
    let modules = [COMMON, OWNER].map(|value| {
        parse(SourceFile {
            path: "qname.yaml",
            bytes: value.as_bytes(),
        })
        .unwrap()
    });
    let program = link(&modules).unwrap();
    let document: serde_json::Value =
        serde_json::from_slice(&schema(&program, "test.qualified").unwrap()).unwrap();
    assert_eq!(
        document["properties"]["Qualified"]["properties"]["Name"]["type"],
        "string"
    );
    compile(&[
        SourceFile {
            path: "common.yaml",
            bytes: COMMON.as_bytes(),
        },
        SourceFile {
            path: "owner.yaml",
            bytes: OWNER.as_bytes(),
        },
    ])
    .unwrap();
    for invalid in [
        COMMON.replace("local: part", "local: uri"),
        COMMON.replace("namespace: uri", "namespace: absent"),
        COMMON.replace(
            "name: part, type: {kind: scalar, scalar: text}",
            "name: part, type: {kind: scalar, scalar: boolean}",
        ),
    ] {
        let module = parse(SourceFile {
            path: "invalid.yaml",
            bytes: invalid.as_bytes(),
        })
        .unwrap();
        assert!(link(&[module]).is_err());
    }
}
