use nkdk_rule_compiler::{SourceFile, link, parse, schema};
#[test]
fn nested_record_schema_requires_a_variant_and_keeps_calendar_seconds() {
    let program = declaration_program(&[
        "common/system-enumerations.yaml",
        "common/date-time-seconds.yaml",
        "common/standard-beginning-date.yaml",
        "probes/standard-beginning-date.yaml",
        "common/standard-period.yaml",
        "probes/standard-period.yaml",
    ]);
    for (entry, label, key) in [
        (
            "migration.standard-beginning-date",
            "ПроизвольнаяДата",
            "Дата",
        ),
        (
            "migration.standard-period",
            "ПроизвольныйПериод",
            "ДатаНачала",
        ),
    ] {
        let actual: serde_json::Value =
            serde_json::from_slice(&schema(&program, entry).unwrap()).unwrap();
        let validator = jsonschema::validator_for(&actual).unwrap();
        for (value, valid) in [
            (serde_json::json!({}), true),
            (
                serde_json::json!({"Значение":{"Вариант":label,key:"25.03.2026 12:34:56"}}),
                true,
            ),
            (
                serde_json::json!({"Значение":{"Вариант":label,key:"25.03.2026 12:34"}}),
                false,
            ),
            (serde_json::json!({"Значение":{"Вариант":"unknown"}}), false),
            (serde_json::json!({"Значение":{}}), false),
        ] {
            assert_eq!(validator.is_valid(&value), valid, "{value}");
        }
    }
}
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
    let program = declaration_program(&[
        "common/metadata-path-lexicons.yaml",
        "common/metadata-name.yaml",
        "common/metadata-object-segments.yaml",
        "common/metadata-object-chain-path.yaml",
        "common/based-on-links.yaml",
        "probes/metadata-root-index.yaml",
        "probes/metadata-child-index.yaml",
        "probes/based-on-links.yaml",
    ]);
    let value: serde_json::Value =
        serde_json::from_slice(&schema(&program, "migration.based-on-links").unwrap()).unwrap();
    let validator = jsonschema::validator_for(&value).unwrap();
    for (candidate, valid) in [
        (serde_json::json!({}), true),
        (serde_json::json!({"ВводитсяНаОсновании":[]}), true),
        (
            serde_json::json!({"ВводитсяНаОсновании":["Справочник.Пример"]}),
            true,
        ),
        (
            serde_json::json!({"ВводитсяНаОсновании":"Справочник.Пример"}),
            false,
        ),
        (serde_json::json!({"ВводитсяНаОсновании":[42]}), false),
        (serde_json::json!({"ВводитсяНаОсновании":[{}]}), false),
    ] {
        assert_eq!(validator.is_valid(&candidate), valid, "{candidate}");
    }
    assert_eq!(value["x-nkdk-runtime-validation"], true);
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

fn declaration_program(names: &[&str]) -> nkdk_rule_model::Program {
    let directory = std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join("../../declarations");
    let mut modules = Vec::new();
    for name in names {
        let bytes = std::fs::read(directory.join(name)).unwrap();
        modules.extend(
            nkdk_rule_compiler::parse_many(SourceFile {
                path: name,
                bytes: &bytes,
            })
            .unwrap(),
        );
    }
    link(&modules).unwrap()
}

#[test]
fn xml_only_fields_are_restored_by_runtime_not_exposed_by_schema() {
    let source = r#"
format: nkdk-declarations/1
kind: object
id: test.xml-only
value:
  kind: record
  fields:
  - {name: token, type: {kind: scalar, scalar: text}}
  - {name: name, type: {kind: scalar, scalar: text}}
representations:
  xml: {kind: record, fields: [{field: token, path: [Root], attribute: token}, {field: name, path: [Root, Name]}]}
  yaml: {kind: mapping, fields: [{field: name, key: Name}]}
presence:
- target: {field: token}
  yaml: {missing: {denotes: {field: name}}}
constraints:
- id: restored-token
  appliesTo: [yaml-validation]
  assert: {eq: [{field: token}, {field: name}]}
  diagnostic: {code: test.restored-token, severity: error, at: {field: token}, message: Token must match name}
"#;
    let program = link(&[parse_module(("xml-only.yaml", source))]).unwrap();
    let actual: serde_json::Value =
        serde_json::from_slice(&schema(&program, "test.xml-only").unwrap()).unwrap();
    assert_eq!(actual["x-nkdk-runtime-validation"], true);
    let validator = jsonschema::validator_for(&actual).unwrap();
    assert!(validator.is_valid(&serde_json::json!({"Name":"First"})));
    for invalid in [
        serde_json::json!({}),
        serde_json::json!({"Name":"First","token":"First"}),
    ] {
        assert!(!validator.is_valid(&invalid));
    }
    let item = source.replace("kind: object", "kind: value")
        .replace("path: [Root]", "path: []")
        .replace("path: [Root, Name]", "path: [Name]")
        .replace("constraints:", "- target: self\n  xml: {missing: {denotes: {absent: true}}}\n  yaml: {missing: {denotes: {absent: true}}}\nconstraints:");
    for (representation, valid, invalid) in [
        (
            None,
            serde_json::json!({"Box":{"Name":"First"}}),
            serde_json::json!({"Box":{"Name":"First","token":"First"}}),
        ),
        (
            Some("{kind: sequence}"),
            serde_json::json!({"Box":[{"Name":"First"}]}),
            serde_json::json!({"Box":[{"Name":"First","token":"First"}]}),
        ),
        (
            Some("{kind: record-mapping, key: name}"),
            serde_json::json!({"Box":{"First":{}}}),
            serde_json::json!({"Box":{"First":{"token":"First"}}}),
        ),
    ] {
        let mut modules = vec![parse_module(("item.yaml", &item))];
        let target = if let Some(yaml) = representation {
            let sequence = format!(
                "format: nkdk-declarations/1\nkind: value\nid: test.hidden-list\nimports: {{item: test.xml-only}}\nvalue: {{kind: sequence, item: {{use: item}}}}\nrepresentations:\n  xml: {{kind: element-sequence, path: [Item]}}\n  yaml: {yaml}\n"
            );
            modules.push(parse_module(("list.yaml", &sequence)));
            "test.hidden-list"
        } else {
            "test.xml-only"
        };
        let owner = format!(
            "format: nkdk-declarations/1\nkind: object\nid: test.container\nimports: {{item: {target}}}\nvalue: {{kind: record, fields: [{{name: box, type: {{use: item}}}}]}}\nrepresentations:\n  xml: {{kind: record, fields: [{{field: box, path: [Root, Box]}}]}}\n  yaml: {{kind: mapping, fields: [{{field: box, key: Box}}]}}\n"
        );
        modules.push(parse_module(("owner.yaml", &owner)));
        let program = link(&modules).unwrap();
        let shape: serde_json::Value =
            serde_json::from_slice(&schema(&program, "test.container").unwrap()).unwrap();
        let validator = jsonschema::validator_for(&shape).unwrap();
        assert!(validator.is_valid(&valid), "{representation:?}: {shape}");
        assert!(!validator.is_valid(&invalid), "{representation:?}: {shape}");
    }
}
