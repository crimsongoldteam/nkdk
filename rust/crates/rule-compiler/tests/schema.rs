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

#[test]
fn keyed_collection_schema_is_derived_from_the_shared_declaration() {
    let common = include_bytes!("../../../declarations/common/i8n-text.yaml");
    for (owner, foldable) in [
        (
            include_bytes!("../../../declarations/probes/i8n-ordinary.yaml").as_slice(),
            false,
        ),
        (
            include_bytes!("../../../declarations/probes/i8n-exclude-equal-name.yaml").as_slice(),
            true,
        ),
    ] {
        let modules = [
            parse(SourceFile {
                path: "common.yaml",
                bytes: common,
            })
            .unwrap(),
            parse(SourceFile {
                path: "owner.yaml",
                bytes: owner,
            })
            .unwrap(),
        ];
        let name = modules[1].id.clone();
        let program = link(&modules).unwrap();
        let value: serde_json::Value =
            serde_json::from_slice(&schema(&program, &name).unwrap()).unwrap();
        jsonschema::meta::validate(&value).unwrap();
        let validator = jsonschema::validator_for(&value).unwrap();
        for valid in [
            serde_json::json!({}),
            serde_json::json!({"Заголовок":""}),
            serde_json::json!({"Заголовок":"Текст"}),
            serde_json::json!({"Заголовок":{"ru":"Текст"}}),
        ] {
            assert!(validator.is_valid(&valid));
        }
        assert_eq!(
            validator.is_valid(&serde_json::json!({"Заголовок":{"ru":""}})),
            foldable
        );
        for invalid in [
            serde_json::json!({"Заголовок":null}),
            serde_json::json!({"Заголовок":[]}),
            serde_json::json!({"Заголовок":{"ru":true}}),
            serde_json::json!({"Лишнее":"x"}),
        ] {
            assert!(!validator.is_valid(&invalid));
        }
    }
}
