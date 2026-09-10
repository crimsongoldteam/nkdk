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
    let modules = sources.map(parse_module);
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

#[test]
fn composed_schema_requires_text_or_a_true_flag_and_reuses_text_constraints() {
    let sources = [
        (
            "text",
            include_bytes!("../../../declarations/common/i8n-text.yaml").as_slice(),
        ),
        (
            "flag",
            include_bytes!("../../../declarations/common/boolean-flag.yaml").as_slice(),
        ),
        (
            "composite",
            include_bytes!("../../../declarations/common/formatted-i8n-text.yaml").as_slice(),
        ),
        (
            "owner",
            include_bytes!("../../../declarations/probes/formatted-i8n-ordinary.yaml").as_slice(),
        ),
    ];
    let modules = sources.map(|(path, bytes)| parse(SourceFile { path, bytes }).unwrap());
    let program = link(&modules).unwrap();
    let value: serde_json::Value =
        serde_json::from_slice(&schema(&program, &modules[3].id).unwrap()).unwrap();
    jsonschema::meta::validate(&value).unwrap();
    let validator = jsonschema::validator_for(&value).unwrap();
    for (value, accepted) in [
        (serde_json::json!({}), true),
        (
            serde_json::json!({"Заголовок":{"Форматированный":"Истина"}}),
            true,
        ),
        (serde_json::json!({"Заголовок":{"Текст":"Hello"}}), true),
        (
            serde_json::json!({"Заголовок":{"Текст":{"ru":"Hello"},"Форматированный":"Истина"}}),
            true,
        ),
        (serde_json::json!({"Заголовок":{}}), false),
        (
            serde_json::json!({"Заголовок":{"Форматированный":"Ложь"}}),
            false,
        ),
        (serde_json::json!({"Заголовок":{"Текст":{"ru":""}}}), false),
        (
            serde_json::json!({"Заголовок":{"Текст":"Hello","Extra":true}}),
            false,
        ),
    ] {
        assert_eq!(validator.is_valid(&value), accepted, "{value}");
    }
}

#[test]
fn scalar_absence_changes_required_fields_without_widening_boolean_values() {
    let modules = [
        (
            "boolean.yaml",
            include_bytes!("../../../declarations/common/boolean.yaml").as_slice(),
        ),
        (
            "owner.yaml",
            include_bytes!("../../../declarations/probes/boolean.yaml").as_slice(),
        ),
    ]
    .map(|(path, bytes)| parse(SourceFile { path, bytes }).unwrap());
    let program = link(&modules).unwrap();
    let value: serde_json::Value =
        serde_json::from_slice(&schema(&program, "pilot.boolean").unwrap()).unwrap();
    let validator = jsonschema::validator_for(&value).unwrap();
    for (input, valid) in [
        (serde_json::json!({}), true),
        (serde_json::json!({"Значение":"Истина"}), true),
        (serde_json::json!({"Значение":"Ложь"}), true),
        (serde_json::json!({"Значение":false}), false),
        (serde_json::json!({"Значение":null}), false),
        (serde_json::json!({"Значение":""}), false),
    ] {
        assert_eq!(validator.is_valid(&input), valid, "{input}");
    }
}

#[test]
fn scalar_default_schema_accepts_omission_and_rejects_explicit_shortened_values() {
    let modules = [
        (
            "date",
            include_str!("../../../declarations/common/typed-date-time.yaml"),
        ),
        (
            "date-owner",
            include_str!("../../../declarations/probes/date-time-default.yaml"),
        ),
        (
            "boolean",
            include_str!("../../../declarations/common/boolean.yaml"),
        ),
        (
            "string",
            include_str!("../../../declarations/common/string.yaml"),
        ),
        (
            "number",
            include_str!("../../../declarations/common/number.yaml"),
        ),
        (
            "owner",
            include_str!("../../../declarations/probes/scalar-defaults.yaml"),
        ),
    ]
    .map(parse_module);
    let program = link(&modules).unwrap();
    let schema: serde_json::Value =
        serde_json::from_slice(&schema(&program, "migration.scalar-defaults").unwrap()).unwrap();
    let validator = jsonschema::validator_for(&schema).unwrap();
    for (value, valid) in [
        (serde_json::json!({}), true),
        (
            serde_json::json!({"Enabled":"Истина","Text":"001","Amount":1}),
            true,
        ),
        (serde_json::json!({"Enabled":"Ложь"}), false),
        (serde_json::json!({"Text":""}), false),
        (serde_json::json!({"Amount":0}), false),
    ] {
        assert_eq!(validator.is_valid(&value), valid, "{value}");
    }
    let date_schema: serde_json::Value = serde_json::from_slice(
        &nkdk_rule_compiler::schema(&program, "migration.date-time-default").unwrap(),
    )
    .unwrap();
    let validator = jsonschema::validator_for(&date_schema).unwrap();
    assert!(validator.is_valid(&serde_json::json!({})));
    assert!(!validator.is_valid(&serde_json::json!({"Сумма":"01.01.0001"})));
    assert!(validator.is_valid(&serde_json::json!({"Сумма":"02.01.0001"})));
}

#[test]
fn metadata_name_schema_lifts_the_common_pattern_without_a_second_rule() {
    let modules = [
        (
            "common",
            include_str!("../../../declarations/common/metadata-name.yaml"),
        ),
        (
            "owner",
            include_str!("../../../declarations/probes/metadata-name.yaml"),
        ),
    ]
    .map(parse_module);
    let program = link(&modules).unwrap();
    let value: serde_json::Value =
        serde_json::from_slice(&schema(&program, "migration.metadata-name").unwrap()).unwrap();
    let validator = jsonschema::validator_for(&value).unwrap();
    for (name, valid) in [
        ("ИмяЁ_1", true),
        ("_name", true),
        ("1Имя", false),
        ("Имя-с-дефисом", false),
        ("Name\n", false),
        ("", false),
    ] {
        assert_eq!(
            validator.is_valid(&serde_json::json!({"Имя":name})),
            valid,
            "{name:?}"
        );
    }
}

fn parse_module((path, source): (&str, &str)) -> nkdk_rule_model::Module {
    parse(SourceFile {
        path,
        bytes: source.as_bytes(),
    })
    .unwrap()
}

#[test]
fn scalar_choices_share_a_precise_union_schema() {
    for (name, common, owner) in [
        (
            "string-or-number",
            include_str!("../../../declarations/common/string-or-number.yaml"),
            include_str!("../../../declarations/probes/string-or-number.yaml"),
        ),
        (
            "predefined-code",
            include_str!("../../../declarations/common/predefined-code.yaml"),
            include_str!("../../../declarations/probes/predefined-code.yaml"),
        ),
    ] {
        let modules = [("common", common), ("owner", owner)].map(parse_module);
        let program = link(&modules).unwrap();
        let value: serde_json::Value =
            serde_json::from_slice(&schema(&program, &format!("migration.{name}")).unwrap())
                .unwrap();
        let validator = jsonschema::validator_for(&value).unwrap();
        for (value, valid) in [
            (serde_json::json!("001"), true),
            (serde_json::json!(9007199254740993u64), true),
            (serde_json::json!(""), true),
            (serde_json::json!(true), false),
            (serde_json::json!(null), false),
            (serde_json::json!([]), false),
        ] {
            assert_eq!(
                validator.is_valid(&serde_json::json!({"Значение":value})),
                valid
            );
        }
    }
}
