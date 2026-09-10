use nkdk_rule_compiler::{SourceFile, link, parse, schema};
#[test]
fn schema_preserves_conditional_decimal_bounds_and_enum_spellings() {
    let sources = [
        (
            "enum.yaml",
            include_str!("../../../../tests/declaration-corpus/valid/code-type-enum.yaml"),
        ),
        (
            "decimal.yaml",
            include_str!("../../../../tests/declaration-corpus/valid/exact-decimal.yaml"),
        ),
        (
            "owner.yaml",
            include_str!("../../../../tests/declaration-corpus/valid/numeric-bound.yaml"),
        ),
    ];
    let modules = sources.map(|(path, source)| {
        parse(SourceFile {
            path,
            bytes: source.as_bytes(),
        })
        .unwrap()
    });
    let program = link(&modules).unwrap();
    let actual: serde_json::Value =
        serde_json::from_slice(&schema(&program, "test.numeric-bound").unwrap()).unwrap();
    let expected: serde_json::Value = serde_json::from_str(include_str!(
        "../../../../tests/declaration-corpus/schemas/numeric-bound.schema.json"
    ))
    .unwrap();
    assert_eq!(actual, expected);
    jsonschema::meta::validate(&actual).unwrap();
    let validator = jsonschema::validator_for(&actual).unwrap();
    for (kind, length, accepted) in [
        ("Число", 38, true),
        ("Число", 39, false),
        ("Строка", 50, true),
        ("Строка", 51, false),
        ("Строка", -1, false),
        ("Число", 0, true),
    ] {
        assert_eq!(
            validator.is_valid(&serde_json::json!({"ТипКода":kind,"ДлинаКода":length})),
            accepted
        );
    }
    for invalid in [
        serde_json::json!({"ДлинаКода":38}),
        serde_json::json!({"ТипКода":"Unknown","ДлинаКода":38}),
    ] {
        assert!(!validator.is_valid(&invalid));
    }
    assert!(schema(&program, "missing").is_err());
}
