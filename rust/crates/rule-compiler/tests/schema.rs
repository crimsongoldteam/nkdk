use nkdk_rule_compiler::{SourceFile, link, parse, schema};
mod support;

#[test]
fn group_item_collection_schema_accepts_both_item_kinds() {
    let program = declaration_program(&[
        "common/string.yaml",
        "common/boolean.yaml",
        "common/typed-date-time.yaml",
        "common/system-enumerations.yaml",
        "common/group-item-auto.yaml",
        "common/group-item-field.yaml",
        "common/group-item-collection.yaml",
        "probes/group-item-collection.yaml",
    ]);
    let actual: serde_json::Value =
        serde_json::from_slice(&schema(&program, "migration.group-item-collection").unwrap())
            .unwrap();
    let validator = jsonschema::validator_for(&actual).unwrap();
    for value in [
        serde_json::json!({"ПоляГруппировки": ["Наименование", "[Авто]", {"Поле": "Код", "Использование": "Ложь"}]}),
        serde_json::json!({"ПоляГруппировки": ["([Авто])", "(Наименование)"]}),
    ] {
        assert!(validator.is_valid(&value), "{value}");
    }
    assert!(!validator.is_valid(
        &serde_json::json!({"ПоляГруппировки": [{"Поле": "Код", "ТипГруппировки": "Неверный"}]})
    ));
    let chain = declaration_program(&[
        "common/string.yaml",
        "common/boolean.yaml",
        "common/typed-date-time.yaml",
        "common/system-enumerations.yaml",
        "common/group-item-auto.yaml",
        "common/group-item-field.yaml",
        "common/group-item-collection.yaml",
        "common/structure-item-group.yaml",
        "probes/structure-item-group.yaml",
    ]);
    let chain_schema: serde_json::Value =
        serde_json::from_slice(&schema(&chain, "migration.structure-item-group").unwrap()).unwrap();
    let chain_validator = jsonschema::validator_for(&chain_schema).unwrap();
    assert!(
        chain_validator.is_valid(&serde_json::json!({"Группировка": ["Наименование", "[Авто]"]}))
    );
    assert!(!chain_validator.is_valid(
        &serde_json::json!({"Группировка": [{"Поле": "Код", "ТипГруппировки": "Неверный"}]})
    ));
}

#[test]
fn group_item_field_schema_accepts_both_short_forms_and_the_full_record() {
    let program = declaration_program(&[
        "common/string.yaml",
        "common/boolean.yaml",
        "common/typed-date-time.yaml",
        "common/system-enumerations.yaml",
        "common/group-item-field.yaml",
        "probes/group-item-field.yaml",
    ]);
    let actual: serde_json::Value =
        serde_json::from_slice(&schema(&program, "migration.group-item-field").unwrap()).unwrap();
    let validator = jsonschema::validator_for(&actual).unwrap();
    for value in [
        serde_json::json!({"Значение": "Наименование"}),
        serde_json::json!({"Значение": "(Наименование)"}),
        serde_json::json!({"Значение": {"Поле": "Наименование", "Использование": "Ложь"}}),
    ] {
        assert!(validator.is_valid(&value), "{value}");
    }
    assert!(!validator.is_valid(&serde_json::json!({"Значение": {"Использование": "Ложь"}})));
    assert!(
        !validator.is_valid(
            &serde_json::json!({"Значение": {"Поле": "Код", "ТипГруппировки": "Неверный"}})
        )
    );
}

#[test]
fn available_fields_schema_accepts_short_and_full_rows() {
    let program = declaration_program(&[
        "common/string.yaml",
        "common/boolean.yaml",
        "common/i8n-text.yaml",
        "common/system-enumerations.yaml",
        "common/dcs-available-fields.yaml",
        "probes/dcs-available-fields.yaml",
    ]);
    let actual: serde_json::Value =
        serde_json::from_slice(&schema(&program, "migration.dcs-available-fields").unwrap())
            .unwrap();
    let validator = jsonschema::validator_for(&actual).unwrap();
    for row in [
        serde_json::json!("Документ"),
        serde_json::json!({"Поле": "Документ"}),
        serde_json::json!({"Поле": "Документ", "Использование": "Ложь", "Заголовок": "Название", "РежимОтображения": "Обычный"}),
    ] {
        assert!(
            validator.is_valid(&serde_json::json!({"Поля": [row]})),
            "{row}"
        );
    }
    for row in [
        serde_json::json!({"Использование": "Истина"}),
        serde_json::json!({"Поле": "Документ", "РежимОтображения": "Неверный"}),
        serde_json::json!({"Поле": "Документ", "Лишнее": "значение"}),
    ] {
        assert!(
            !validator.is_valid(&serde_json::json!({"Поля": [row]})),
            "{row}"
        );
    }
}

#[test]
fn dcs_local_string_schema_accepts_text_and_language_mapping() {
    let program = declaration_program(&[
        "common/i8n-text.yaml",
        "common/dcs-local-string-type.yaml",
        "probes/dcs-local-string-type.yaml",
    ]);
    let actual: serde_json::Value =
        serde_json::from_slice(&schema(&program, "migration.dcs-local-string-type").unwrap())
            .unwrap();
    let validator = jsonschema::validator_for(&actual).unwrap();
    assert!(validator.is_valid(&serde_json::json!({"Заголовок": "Текст"})));
    assert!(validator.is_valid(&serde_json::json!({"Заголовок": {"ru": "Текст", "en": "Text"}})));
    assert!(!validator.is_valid(&serde_json::json!({"Заголовок": 42})));
    assert!(!validator.is_valid(&serde_json::json!({"Заголовок": ["Текст"]})));
}

#[test]
fn user_visible_schema_uses_declared_role_map_and_boolean_values() {
    let program = declaration_program(&[
        "common/boolean.yaml",
        "common/user-visible.yaml",
        "probes/user-visible.yaml",
    ]);
    let actual: serde_json::Value =
        serde_json::from_slice(&schema(&program, "probe.user-visible").unwrap()).unwrap();
    let validator = jsonschema::validator_for(&actual).unwrap();
    assert!(validator.is_valid(&serde_json::json!({"Использование": {
        "Разрешить": "Ложь",
        "Роли": {"Менеджер": "Истина"}
    }})));
    assert!(!validator.is_valid(&serde_json::json!({"Использование": {
        "Роли": {"Менеджер": "Неверно"}
    }})));
}

#[test]
fn calculated_field_use_restriction_schema_is_inferred_from_boolean_fields() {
    let program = declaration_program(&[
        "common/boolean.yaml",
        "common/calculated-field-use-restriction.yaml",
        "probes/calculated-field-use-restriction.yaml",
    ]);
    let actual: serde_json::Value = serde_json::from_slice(
        &schema(&program, "migration.calculated-field-use-restriction").unwrap(),
    )
    .unwrap();
    let validator = jsonschema::validator_for(&actual).unwrap();
    assert!(
        validator.is_valid(&serde_json::json!({"ОграничениеИспользования": {"Поле": "Истина"}}))
    );
    assert!(
        !validator.is_valid(&serde_json::json!({"ОграничениеИспользования": {"Поле": "Неверно"}}))
    );
    assert!(
        !validator.is_valid(&serde_json::json!({"ОграничениеИспользования": {"Лишнее": true}}))
    );
}

#[test]
fn calculated_field_order_expression_schema_reuses_the_sort_direction() {
    let program = declaration_program(&[
        "common/boolean.yaml",
        "common/string.yaml",
        "common/system-enumerations.yaml",
        "common/calculated-field-order-expressions.yaml",
        "probes/calculated-field-order-expressions.yaml",
    ]);
    let actual: serde_json::Value = serde_json::from_slice(
        &schema(&program, "migration.calculated-field-order-expressions").unwrap(),
    )
    .unwrap();
    let validator = jsonschema::validator_for(&actual).unwrap();
    assert!(
        validator.is_valid(&serde_json::json!({"ВыраженияУпорядочивания": [
            {"Выражение": "Дата", "ТипУпорядочивания": "Возр", "Автоупорядочивание": "Истина"}
        ]}))
    );
    assert!(
        !validator.is_valid(&serde_json::json!({"ВыраженияУпорядочивания": [
            {"Выражение": "Дата", "ТипУпорядочивания": "Вперед"}
        ]}))
    );
    assert!(!validator.is_valid(&serde_json::json!({"ВыраженияУпорядочивания": "Дата"})));
}

#[test]
fn common_attribute_content_schema_reuses_the_declared_paths_and_enum() {
    let program = declaration_program(&[
        "common/common-attribute-content.yaml",
        "common/metadata-name.yaml",
        "common/metadata-path-lexicons.yaml",
        "common/string.yaml",
        "common/system-enumerations.yaml",
        "probes/common-attribute-content.yaml",
    ]);
    let actual: serde_json::Value =
        serde_json::from_slice(&schema(&program, "migration.common-attribute-content").unwrap())
            .unwrap();
    let validator = jsonschema::validator_for(&actual).unwrap();
    assert!(validator.is_valid(&serde_json::json!({"Состав": [{
        "Объект": "Справочники.Товары",
        "Использование": "Использовать",
        "УсловноеРазделение": ""
    }]})));
    assert!(!validator.is_valid(&serde_json::json!({"Состав": "Товары"})));
    assert!(!validator.is_valid(&serde_json::json!({"Состав": [{
        "Объект": "Справочники.Товары",
        "Использование": "Неверно"
    }]})));
    assert!(!validator.is_valid(&serde_json::json!({"Состав": [{
        "Объект": "Справочники.Товары",
        "Использование": "Использовать",
        "ЛишнееПоле": true
    }]})));
}

#[test]
fn metadata_link_collection_schema_comes_from_the_shared_declaration() {
    let program = declaration_program(&[
        "common/metadata-name.yaml",
        "common/metadata-path-lexicons.yaml",
        "common/metadata-field-segments.yaml",
        "common/metadata-member-paths.yaml",
        "common/metadata-root-path.yaml",
        "common/metadata-structural-path.yaml",
        "common/metadata-ref.yaml",
        "common/standard-attribute-name.yaml",
        "probes/metadata-item-links.yaml",
    ]);
    let actual: serde_json::Value =
        serde_json::from_slice(&schema(&program, "migration.metadata-item-links").unwrap())
            .unwrap();
    let validator = jsonschema::validator_for(&actual).unwrap();
    assert!(validator.is_valid(&serde_json::json!({"Ссылки": ["Catalog.Товары", ""]})));
    assert!(!validator.is_valid(&serde_json::json!({"Ссылки": "Catalog.Товары"})));
    assert!(!validator.is_valid(&serde_json::json!({"Ссылки": [42]})));
}

#[test]
fn choice_list_schema_is_derived_from_its_item_declaration() {
    let program = declaration_program(&[
        "common/boolean.yaml",
        "common/choice-list.yaml",
        "common/date-time-seconds.yaml",
        "common/i8n-text.yaml",
        "common/metadata-field-segments.yaml",
        "common/metadata-member-paths.yaml",
        "common/metadata-name.yaml",
        "common/metadata-path-lexicons.yaml",
        "common/metadata-root-path.yaml",
        "common/metadata-value-path.yaml",
        "common/metadata-value.yaml",
        "common/number.yaml",
        "common/standard-attribute-name.yaml",
        "common/standard-beginning-date.yaml",
        "common/standard-period.yaml",
        "common/string.yaml",
        "common/system-enumerations.yaml",
        "probes/choice-list.yaml",
    ]);
    let actual: serde_json::Value =
        serde_json::from_slice(&schema(&program, "migration.choice-list").unwrap()).unwrap();
    let validator = jsonschema::validator_for(&actual).unwrap();
    assert!(validator.is_valid(&serde_json::json!({"СписокВыбора": []})));
    assert!(validator.is_valid(&serde_json::json!({"СписокВыбора": [
        {"Представление": "Первый", "Значение": "1"},
        {"Представление": "Второй", "Значение": 2}
    ]})));
    assert!(!validator.is_valid(&serde_json::json!({"СписокВыбора": "Первый"})));
    assert!(!validator.is_valid(&serde_json::json!({"СписокВыбора": {"Значение": "1"}})));
    assert!(!validator.is_valid(&serde_json::json!({"СписокВыбора": [{"НеизвестноеПоле": 1}]})));
}

#[test]
fn border_schema_comes_from_the_shared_declaration() {
    let program = declaration_program(&[
        "common/system-enumerations.yaml",
        "common/metadata-name.yaml",
        "common/number.yaml",
        "common/border.yaml",
    ]);
    let actual: serde_json::Value =
        serde_json::from_slice(&schema(&program, "common.border").unwrap()).unwrap();
    let validator = jsonschema::validator_for(&actual).unwrap();
    assert!(validator.is_valid(&serde_json::json!({
        "Имя": "ЭлементСтиля.Рамка",
        "Ширина": 2,
        "ТипРамки": "Одинарная"
    })));
    assert!(validator.is_valid(&serde_json::json!({"Имя": null, "Ширина": 1})));
    assert!(!validator.is_valid(&serde_json::json!({"Ширина": "два"})));
    assert!(!validator.is_valid(&serde_json::json!({"ТипРамки": "Неизвестная"})));
    assert_eq!(actual["x-nkdk-runtime-validation"], true);
}

#[test]
fn color_schema_is_generated_from_the_shared_declaration() {
    let program = declaration_program(&[
        "common/system-enumerations.yaml",
        "common/metadata-name.yaml",
        "fragments/metadata-style-item-type.yaml",
        "common/color.yaml",
    ]);
    let actual: serde_json::Value =
        serde_json::from_slice(&schema(&program, "common.color").unwrap()).unwrap();
    let validator = jsonschema::validator_for(&actual).unwrap();
    for color in [
        "ЦветОсобогоТекста",
        "ЭлементСтиля.ПоясняющийТекст",
        "ТеньКнопкиСветлая",
        "АкварельноСиний",
        "#C3C0C3",
        "0:615512b6-4378-4fce-86f1-a56725f945da",
    ] {
        assert!(validator.is_valid(&serde_json::json!(color)), "{color}");
    }
    assert!(!validator.is_valid(&serde_json::json!(42)));
    assert_eq!(actual["x-nkdk-runtime-validation"], true);
}

#[test]
fn font_schema_is_generated_from_the_shared_declaration() {
    let program = declaration_program(&[
        "common/system-enumerations.yaml",
        "common/metadata-name.yaml",
        "common/string.yaml",
        "common/number.yaml",
        "common/boolean.yaml",
        "common/font-reference.yaml",
    ]);
    let actual: serde_json::Value =
        serde_json::from_slice(&schema(&program, "common.font").unwrap()).unwrap();
    let validator = jsonschema::validator_for(&actual).unwrap();
    for font in [
        serde_json::json!({"Вид":"КрупныйШрифтТекста","Размер":20,"Полужирный":"Истина"}),
        serde_json::json!({"Вид":"ЭлементСтиля","Значение":"0","Размер":10}),
        serde_json::json!({"ВидXML":"Absolute","Имя":"Arial"}),
    ] {
        assert!(validator.is_valid(&font), "{font}");
    }
    assert!(!validator.is_valid(&serde_json::json!({"Размер":"двадцать"})));
    assert_eq!(actual["x-nkdk-runtime-validation"], true);
}

#[test]
fn picture_schema_covers_simple_and_expanded_yaml() {
    let program = declaration_program(&[
        "common/system-enumerations.yaml",
        "common/metadata-name.yaml",
        "common/string.yaml",
        "common/boolean.yaml",
        "common/number.yaml",
        "common/picture-reference.yaml",
        "common/picture.yaml",
    ]);
    let actual: serde_json::Value =
        serde_json::from_slice(&schema(&program, "common.picture").unwrap()).unwrap();
    let validator = jsonschema::validator_for(&actual).unwrap();
    for picture in [
        serde_json::json!("БизнесПроцесс"),
        serde_json::json!("ОбщаяКартинка.Логотип"),
        serde_json::json!("0"),
        serde_json::json!("Picture.png"),
        serde_json::json!({"Ссылка":"0","ПрозрачныйПиксель":{"x":12,"y":2}}),
        serde_json::json!({"Ссылка":"Picture.png","ПрозрачныйФон":"Истина"}),
    ] {
        assert!(validator.is_valid(&picture), "{picture}");
    }
    assert!(!validator.is_valid(&serde_json::json!({"ПрозрачныйФон":"Истина"})));
    assert!(
        !validator.is_valid(
            &serde_json::json!({"Ссылка":"0","ПрозрачныйПиксель":{"x":"двенадцать","y":2}})
        )
    );
    assert_eq!(actual["x-nkdk-runtime-validation"], true);
}

#[test]
fn recursive_collection_schema_uses_defs_and_ref() {
    let program = link(&support::recursive_modules()).unwrap();
    let actual: serde_json::Value =
        serde_json::from_slice(&schema(&program, "applied.tree").unwrap()).unwrap();
    assert_eq!(
        actual["$defs"]["common.node"]["properties"]["Дети"]["items"]["$ref"],
        "#/$defs/common.node"
    );
    let validator = jsonschema::validator_for(&actual).unwrap();
    assert!(validator.is_valid(&serde_json::json!({
        "Корень": {"Имя":"корень", "Дети":[{"Имя":"лист", "Дети":[]}]}
    })));
    assert!(!validator.is_valid(&serde_json::json!({
        "Корень": {"Имя":"корень", "Дети":[{"Дети":[]}]}
    })));
}

#[test]
fn discriminated_choice_schema_preserves_yaml_scalar_kinds() {
    let program = declaration_program(&[
        "common/boolean.yaml",
        "common/number.yaml",
        "common/date-time.yaml",
        "common/date-time-seconds.yaml",
        "common/system-enumerations.yaml",
        "common/standard-period.yaml",
        "common/fields-list.yaml",
        "probes/discriminated-choice.yaml",
    ]);
    let actual: serde_json::Value =
        serde_json::from_slice(&schema(&program, "migration.discriminated-choice").unwrap())
            .unwrap();
    let validator = jsonschema::validator_for(&actual).unwrap();
    for (value, valid) in [
        (
            serde_json::json!({"Значение":9007199254740993.125_f64}),
            true,
        ),
        (serde_json::json!({"Значение":"9007199254740993.125"}), true),
        (
            serde_json::json!({"Значение":{"Вариант":"ПроизвольныйПериод","ДатаНачала":"25.03.2026 12:34:56"}}),
            true,
        ),
        (serde_json::json!({"Значение":["Alpha", "Beta"]}), true),
        (serde_json::json!({"Значение":true}), false),
        (serde_json::json!({"Значение":null}), false),
    ] {
        assert_eq!(validator.is_valid(&value), valid, "{value}");
    }
}
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

#[test]
fn grouped_sequence_schema_describes_whole_items_and_empty_groups() {
    let source = r#"format: nkdk-declarations/1
kind: catalog
declarations:
- kind: value
  id: test.row
  value: {kind: record, fields: [{name: text, type: {kind: scalar, scalar: text}}]}
  representations:
    xml: {kind: record, fields: [{field: text, path: [Text]}]}
    yaml: {kind: text-pattern, parts: [{field: text}]}
- kind: value
  id: test.rows
  imports: {row: test.row}
  value: {kind: sequence, item: {use: row}}
  representations: {xml: {kind: element-sequence, path: [Item], item: {kind: declared}}, yaml: {kind: sequence, item: {kind: declared}}}
- kind: object
  id: test.groups
  imports: {rows: test.rows}
  value: {kind: record, fields: [{name: first, type: {use: rows}}, {name: second, type: {use: rows}}]}
  representations:
    xml: {kind: record, fields: [{field: first, path: [Root, First]}, {field: second, path: [Root, Second]}]}
    yaml: {kind: grouped-sequence, groups: [{field: first}, {field: second, itemTag: другой}]}
- kind: object
  id: test.ordinary
  imports: {rows: test.rows}
  value: {kind: record, fields: [{name: rows, type: {use: rows}}]}
  representations:
    xml: {kind: record, fields: [{field: rows, path: [Root]}]}
    yaml: {kind: mapping, fields: [{field: rows, key: Rows}]}
"#;
    let program = link(
        &nkdk_rule_compiler::parse_many(SourceFile {
            path: "groups.yaml",
            bytes: source.as_bytes(),
        })
        .unwrap(),
    )
    .unwrap();
    let ordinary: serde_json::Value =
        serde_json::from_slice(&schema(&program, "test.ordinary").unwrap()).unwrap();
    let ordinary_validator = jsonschema::validator_for(&ordinary).unwrap();
    assert!(ordinary_validator.is_valid(&serde_json::json!({"Rows":["one", "two"]})));
    assert!(!ordinary_validator.is_valid(&serde_json::json!({"Rows":[42]})));
    let actual: serde_json::Value =
        serde_json::from_slice(&schema(&program, "test.groups").unwrap()).unwrap();
    let validator = jsonschema::validator_for(&actual).unwrap();
    for value in [
        serde_json::json!([]),
        serde_json::json!([[]]),
        serde_json::json!(["one", "two"]),
    ] {
        assert!(validator.is_valid(&value), "{value}: {actual}");
    }
    for value in [
        serde_json::json!({"First": []}),
        serde_json::json!([42]),
        serde_json::json!([["one"]]),
    ] {
        assert!(!validator.is_valid(&value), "{value}: {actual}");
    }
    assert_eq!(actual["items"]["anyOf"][1]["x-nkdk-yaml-tag"], "!другой");
}

#[test]
fn collection_position_checks_are_deferred_to_contextual_validation() {
    let source = r#"format: nkdk-declarations/1
kind: value
id: test.position-number
value: {kind: record, fields: [{name: number, type: {kind: scalar, scalar: number, profile: decimal}}]}
representations:
  xml: {kind: record, fields: [{field: number, path: [], attribute: number}]}
  yaml: {kind: mapping, fields: [{field: number, key: Number}]}
constraints:
- id: position
  appliesTo: [yaml-validation]
  assert: {eq: [{field: number}, {collectionPosition: true}]}
  diagnostic: {code: row.position, severity: error, at: {field: number}, message: Wrong position}
"#;
    let program = link(&[parse_module(("position-number.yaml", source))]).unwrap();
    let actual: serde_json::Value =
        serde_json::from_slice(&schema(&program, "test.position-number").unwrap()).unwrap();
    assert_eq!(actual["x-nkdk-runtime-validation"], true);
    let validator = jsonschema::validator_for(&actual).unwrap();
    assert!(validator.is_valid(&serde_json::json!({"Number": 1})));
    assert!(validator.is_valid(&serde_json::json!({"Number": 2})));
    assert!(!validator.is_valid(&serde_json::json!({"Number": "bad"})));
}

#[test]
fn mapping_field_alias_schema_keeps_the_referenced_value_shape() {
    let modules = [
        ("payload", r#"format: nkdk-declarations/1
kind: value
id: test.alias-payload
value: {kind: record, fields: [{name: width, type: {kind: scalar, scalar: number, profile: decimal}}]}
representations:
  xml: {kind: record, fields: [{field: width, path: [Width]}]}
  yaml: {kind: mapping, fields: [{field: width, key: Ширина}]}
"#),
        ("wrapper", r#"format: nkdk-declarations/1
kind: value
id: test.alias-wrapper
imports: {payload: test.alias-payload}
value: {kind: record, fields: [{name: value, type: {use: payload}}]}
representations:
  xml: {kind: record, fields: [{field: value, path: [Value]}]}
  yaml:
    kind: mapping
    fields: [{field: value, key: Значение}]
    shorthand:
    - id: direct-payload
      canonical: false
      representation: {kind: mapping, field: value}
"#),
    ].map(parse_module);
    let program = link(&modules).unwrap();
    let actual: serde_json::Value =
        serde_json::from_slice(&schema(&program, "test.alias-wrapper").unwrap()).unwrap();
    let validator = jsonschema::validator_for(&actual).unwrap();
    assert!(validator.is_valid(&serde_json::json!({"Ширина": 3})));
    assert!(validator.is_valid(&serde_json::json!({"Значение": {"Ширина": 3}})));
    assert!(!validator.is_valid(&serde_json::json!({"Ширина": "wrong"})));
    assert!(!validator.is_valid(&serde_json::json!({"ДругойКлюч": 3})));
}

#[test]
fn singleton_modes_keep_the_declared_item_shape() {
    let row=b"format: nkdk-declarations/1\nkind: value\nid: common.row\nvalue: {kind: record, fields: [{name: key, type: {kind: scalar, scalar: text}}]}\nrepresentations:\n  xml: {kind: record, fields: [{field: key, path: [Key]}]}\n  yaml: {kind: mapping, fields: [{field: key, key: Key}]}\n";
    for mode in ["scalar", "value"] {
        let collection = format!(
            "format: nkdk-declarations/1\nkind: value\nid: common.rows\nimports: {{row: common.row}}\nvalue: {{kind: sequence, item: {{use: row}}}}\nrepresentations:\n  xml: {{kind: element-sequence, path: [Item]}}\n  yaml: {{kind: sequence, singleton: {mode}}}\n"
        );
        let owner = "format: nkdk-declarations/1\nkind: object\nid: test.rows\nimports: {rows: common.rows}\nvalue: {kind: record, fields: [{name: rows, type: {use: rows}}]}\nrepresentations:\n  xml: {kind: record, fields: [{field: rows, path: [Root, Entries]}]}\n  yaml: {kind: mapping, fields: [{field: rows, key: Entries}]}\n";
        let sources = [
            ("row", row.as_slice()),
            ("rows", collection.as_bytes()),
            ("owner", owner.as_bytes()),
        ];
        let modules = sources
            .into_iter()
            .map(|(path, bytes)| parse(SourceFile { path, bytes }).unwrap())
            .collect::<Vec<_>>();
        let name = modules[2].id.clone();
        let program = link(&modules).unwrap();
        let actual: serde_json::Value =
            serde_json::from_slice(&schema(&program, &name).unwrap()).unwrap();
        let validator = jsonschema::validator_for(&actual).unwrap();
        for value in [
            serde_json::json!({"Entries": []}),
            serde_json::json!({"Entries": [{"Key":"first"}]}),
        ] {
            assert!(validator.is_valid(&value), "{value}");
        }
        assert_eq!(
            validator.is_valid(&serde_json::json!({"Entries":{"Key":"first"}})),
            mode == "value"
        );
        assert!(!validator.is_valid(&serde_json::json!({"Entries":{"Other":"first"}})));
        assert!(!validator.is_valid(&serde_json::json!({"Entries":123})));
    }
}

#[test]
fn settings_parameter_profiles_expose_their_public_yaml_shapes() {
    std::thread::Builder::new()
        .stack_size(16 * 1024 * 1024)
        .spawn(|| {
            #[path = "../../../build-support/declarations.rs"]
            mod declarations;
            #[path = "../../../build-support/family.rs"]
            mod family;
            let root = std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join("../..");
            let files = declarations::load(&root, &root.join("declarations")).unwrap();
            let entries = [
                "working.settings-parameters-field",
                "working.settings-parameters-primitive",
                "working.working.dcs-data-set-field",
                "working.working.filter-tree",
                "working.working.filter-owner",
                "working.working.conditional-items",
                "working.working.conditional-appearance",
            ];
            let selected = family::select(&files, &entries);
            let modules = selected
                .iter()
                .flat_map(|(path, bytes)| {
                    nkdk_rule_compiler::parse_many(SourceFile { path, bytes }).unwrap()
                })
                .collect::<Vec<_>>();
            let program = link(&modules).unwrap();
            for entry in entries {
                let bytes = schema(&program, entry).unwrap();
                let actual: serde_json::Value = serde_json::from_slice(&bytes).unwrap();
                let text = String::from_utf8(bytes).unwrap();
                if entry.starts_with("working.working.conditional-") {
                    let validator = jsonschema::validator_for(&actual).unwrap();
                    for value in [
                        serde_json::json!({"Элементы":[]}),
                        serde_json::json!({"Элементы":[{},{}]}),
                        serde_json::json!({"Элементы":[{"Поля":["Реквизит"],"Отбор":{"Элементы":[{}]},"Использование":"Ложь"}]}),
                    ] {
                        assert!(validator.is_valid(&value), "{entry}: {value}");
                    }
                    assert!(!validator.is_valid(&serde_json::json!({"Элементы":[{"Использование":"oops"}]})));
                    assert!(!validator.is_valid(&serde_json::json!({"ЧужоеПоле":1})));
                    continue;
                }
                if entry.starts_with("working.working.filter-") {
                    let validator = jsonschema::validator_for(&actual).unwrap();
                    for value in [
                        serde_json::json!({}),
                        serde_json::json!({"Элементы":[{}]}),
                        serde_json::json!({"Элементы":[{"ТипГруппы":"ГруппаИ","Элементы":[{},{}]}]}),
                    ] {
                        assert!(validator.is_valid(&value), "{entry}: {value}");
                    }
                    assert!(!validator.is_valid(&serde_json::json!({"Элементы":[{"ТипГруппы":"Неверный"}]})));
                    assert!(!validator.is_valid(&serde_json::json!({"ЧужоеПоле":1})));
                    continue;
                }
                if entry == "working.working.dcs-data-set-field" {
                    let validator = jsonschema::validator_for(&actual).unwrap();
                    for value in [
                        serde_json::json!({"Вид":"ПолеНабораДанныхСхемыКомпоновкиДанных","ПутьКДанным":"Код","Поле":"Код"}),
                        serde_json::json!({"Вид":"ПапкаПолейНабораДанныхСхемыКомпоновкиДанных","ПутьКДанным":"Группа"}),
                        serde_json::json!({"Вид":"ВложенныйНаборДанныхСхемыКомпоновкиДанных","ПутьКДанным":"Товары","Поле":"Товары"}),
                        serde_json::json!({"ПутьКДанным":"Код","Поле":"Код"}),
                    ] {
                        assert!(validator.is_valid(&value), "{entry}: {value}");
                    }
                    assert!(!validator.is_valid(&serde_json::json!({"Вид":"Неверный"})));
                    assert!(!validator.is_valid(&serde_json::json!({"ЧужоеПоле":1})));
                    for key in ["Роль", "ДоступныеЗначения", "ТипЗначения", "ОграничениеИспользованияРеквизитов", "НаборДанныхПроверкиИерархии"] {
                        assert!(text.contains(key), "{entry}: missing {key}");
                    }
                    continue;
                }
                for token in [
                    "Тип",
                    "Строка",
                    "Значение",
                    "Вид",
                    "ПутьКДанным",
                    "СистемноеПеречисление",
                ] {
                    assert!(text.contains(token), "{entry}: missing {token}");
                }
                let validator = jsonschema::validator_for(&actual).unwrap();
                for row in [
                    serde_json::json!({"Параметр1":"ПараметрыДанных.Параметр1"}),
                    serde_json::json!({"Параметр1":{"Значение":null}}),
                    serde_json::json!({"Параметр1":{"Значение":5,"Использовать":"Ложь"}}),
                serde_json::json!({"Шрифт":{"Значение":{"ВидXML":"Absolute","Имя":"Academy Engraved LET"}}}),
                serde_json::json!({"СвязиПараметровВыбора":{"Значение":[{"Имя":"ПараметрВыбора","ПутьКДанным":"Поле1","РежимИзменения":"НеИзменять"}]}}),
                serde_json::json!({"НоменклатураВключение":{"Использовать":"Ложь","Значение":{"Тип":"Строка","Значение":""}}}),
                ] {
                    let value = serde_json::json!({"ПараметрыДанных":row});
                    assert!(validator.is_valid(&value), "{entry}: {value}");
                }
                assert!(!validator.is_valid(&serde_json::json!({"ЧужоеПоле":1})));
            }
        })
        .unwrap()
        .join()
        .unwrap();
}
