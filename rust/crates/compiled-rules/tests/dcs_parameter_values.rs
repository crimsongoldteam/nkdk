#[path = "support/dcs_parameter_test.rs"]
mod dcs_parameter_test;
use dcs_parameter_test::*;

#[test]
fn settings_parameter_value_color_uses_declared_wrapper() {
    let source =
        include_str!("../../../../e2e/fixtures/xml/cf/CommonForms/УсловноеОформление/Ext/Form.xml");
    let fragment = dcs_parameter_fragment(source, "<dcscor:parameter>ЦветФона</dcscor:parameter>");
    let real_color = format!(
        "<Root xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:dcscor=\"http://v8.1c.ru/8.1/data-composition-system/core\" xmlns:dcsset=\"http://v8.1c.ru/8.1/data-composition-system/settings\" xmlns:v8ui=\"http://v8.1c.ru/8.1/data/ui\">{fragment}</Root>"
    );
    {
        let xml = real_color;
        let (entry, inputs) = style_item_inputs("migration.dcs-parameter-value-color", &[]);
        let imported = convert_file(entry, Direction::XmlToYaml, xml.as_bytes(), &inputs).unwrap();
        let yaml = String::from_utf8(imported.bytes).unwrap();
        assert!(yaml.contains("Использовать: Ложь"), "{yaml}");
        assert!(yaml.contains("Значение: Красный"), "{yaml}");
        assert_plain_round_trip(entry, &xml, &yaml, &inputs);

        for unusual in [
            xml.replace("web:Red", "web:DoesNotExist"),
            xml.replace(
                "<dcscor:parameter>ЦветФона",
                "<dcscor:parameter>ДругойПараметр",
            ),
        ] {
            let imported =
                convert_file(entry, Direction::XmlToYaml, unusual.as_bytes(), &inputs).unwrap();
            let anomalous = String::from_utf8(imported.bytes).unwrap();
            assert!(anomalous.contains("!xml/"), "{anomalous}");
            assert_valid_candidate(entry, unusual.as_bytes(), anomalous.as_bytes(), &inputs);
        }
    }
}

#[test]
fn settings_parameter_value_auto_color_has_an_explicit_marker() {
    let (entry, inputs) = style_item_inputs("migration.dcs-parameter-value-color", &[]);
    let xml = r#"<Root xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:dcscor="http://v8.1c.ru/8.1/data-composition-system/core" xmlns:dcsset="http://v8.1c.ru/8.1/data-composition-system/settings" xmlns:v8ui="http://v8.1c.ru/8.1/data/ui"><Item xsi:type="dcsset:SettingsParameterValue"><dcscor:parameter>ЦветФона</dcscor:parameter><dcscor:value xsi:type="v8ui:Color">auto</dcscor:value></Item></Root>"#;
    let imported = convert_file(entry, Direction::XmlToYaml, xml.as_bytes(), &inputs).unwrap();
    let yaml = String::from_utf8(imported.bytes).unwrap();
    assert_eq!(yaml.trim(), "ЦветФона:\n  Значение: Авто");
    assert!(!yaml.contains("!xml/"), "{yaml}");
    assert_valid_candidate(entry, xml.as_bytes(), yaml.as_bytes(), &inputs);
}

#[test]
fn settings_parameter_value_binds_style_index_through_choice() {
    let (entry, inputs) = style_item_inputs(
        "migration.dcs-parameter-value-color",
        &[("СпециальныйЦвет", "Color")],
    );
    let xml = r#"<Root xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:dcscor="http://v8.1c.ru/8.1/data-composition-system/core" xmlns:dcsset="http://v8.1c.ru/8.1/data-composition-system/settings" xmlns:v8ui="http://v8.1c.ru/8.1/data/ui"><Item xsi:type="dcsset:SettingsParameterValue"><dcscor:parameter>ЦветФона</dcscor:parameter><dcscor:value xsi:type="v8ui:Color">style:СпециальныйЦвет</dcscor:value></Item></Root>"#;
    let imported = convert_file(entry, Direction::XmlToYaml, xml.as_bytes(), &inputs).unwrap();
    let yaml = String::from_utf8(imported.bytes).unwrap();
    assert!(yaml.contains("ЭлементСтиля.СпециальныйЦвет"), "{yaml}");
    assert!(!yaml.contains("!xml/"), "{yaml}");
    assert_valid_candidate(entry, xml.as_bytes(), yaml.as_bytes(), &inputs);
}

#[test]
fn settings_parameter_value_preserves_explicit_true_use() {
    let (entry, inputs) = style_item_inputs("migration.dcs-parameter-value-color", &[]);
    let xml = r#"<Root xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:dcscor="http://v8.1c.ru/8.1/data-composition-system/core" xmlns:dcsset="http://v8.1c.ru/8.1/data-composition-system/settings" xmlns:v8ui="http://v8.1c.ru/8.1/data/ui"><Item xsi:type="dcsset:SettingsParameterValue"><dcscor:use>true</dcscor:use><dcscor:parameter>ЦветФона</dcscor:parameter><dcscor:value xsi:type="v8ui:Color">web:Red</dcscor:value></Item></Root>"#;
    let imported = convert_file(entry, Direction::XmlToYaml, xml.as_bytes(), &inputs).unwrap();
    let yaml = String::from_utf8(imported.bytes).unwrap();
    assert!(!yaml.contains("Использовать: Истина"), "{yaml}");
    assert!(yaml.contains("!xml/"), "{yaml}");
    assert_valid_candidate(entry, xml.as_bytes(), yaml.as_bytes(), &inputs);
}

#[test]
fn settings_parameter_value_font_shares_the_color_envelope() {
    let (entry, inputs) = style_item_inputs("migration.dcs-parameter-value-font", &[]);
    let fragment = include_str!(
        "../../../../packages/rules/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/__fixtures__/font.xml"
    );
    let xml = format!(
        "<Root xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:dcscor=\"http://v8.1c.ru/8.1/data-composition-system/core\" xmlns:dcsset=\"http://v8.1c.ru/8.1/data-composition-system/settings\" xmlns:v8ui=\"http://v8.1c.ru/8.1/data/ui\"><Item xsi:type=\"dcsset:SettingsParameterValue\"><dcscor:parameter>Шрифт</dcscor:parameter>{fragment}</Item></Root>"
    );
    let imported = convert_file(entry, Direction::XmlToYaml, xml.as_bytes(), &inputs).unwrap();
    assert_valid_candidate(entry, xml.as_bytes(), &imported.bytes, &inputs);
    let yaml = String::from_utf8(imported.bytes).unwrap();
    assert!(yaml.contains("ОченьКрупныйШрифтТекста"), "{yaml}");
    assert!(!yaml.contains("!xml/"), "{yaml}");
    let invalid = xml.replace("kind=\"StyleItem\"", "kind=\"StyleItem\" bold=\"oops\"");
    preserved_raw_yaml(entry, &invalid, &inputs);
}

#[test]
fn settings_parameter_value_preserves_settings_fields() {
    let (entry, inputs) = style_item_inputs("migration.dcs-parameter-value-color", &[]);
    let xml = r#"<Root xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:dcscor="http://v8.1c.ru/8.1/data-composition-system/core" xmlns:dcsset="http://v8.1c.ru/8.1/data-composition-system/settings" xmlns:v8ui="http://v8.1c.ru/8.1/data/ui"><Item xsi:type="dcsset:SettingsParameterValue"><dcscor:parameter>ЦветФона</dcscor:parameter><dcscor:value xsi:type="v8ui:Color">web:Red</dcscor:value><dcsset:viewMode>Normal</dcsset:viewMode><dcsset:userSettingID>48553968-cd08-47dc-896c-8bb766f9e28f</dcsset:userSettingID></Item></Root>"#;
    let imported = convert_file(entry, Direction::XmlToYaml, xml.as_bytes(), &inputs).unwrap();
    let yaml = String::from_utf8(imported.bytes).unwrap();
    assert!(yaml.contains("РежимОтображения: Обычный"), "{yaml}");
    assert!(
        yaml.contains(
            "ИдентификаторПользовательскойНастройки: 48553968-cd08-47dc-896c-8bb766f9e28f"
        ),
        "{yaml}"
    );
    assert!(!yaml.contains("!xml/"), "{yaml}");
    assert_valid_candidate(entry, xml.as_bytes(), yaml.as_bytes(), &inputs);
    let invalid = xml.replace("<dcsset:viewMode>Normal", "<dcsset:viewMode>Unknown");
    preserved_raw_yaml(entry, &invalid, &inputs);
}

#[test]
fn settings_parameter_value_localized_presentation_uses_owner_inputs() {
    let (entry, inputs) = style_item_inputs("migration.dcs-parameter-value-color", &[]);
    for (presentation, expected) in [
        (
            "<dcsset:userSettingPresentation xsi:type=\"xs:string\">Период с</dcsset:userSettingPresentation>",
            "ПредставлениеПользовательскойНастройки: !xml/string Период с",
        ),
        (
            "<dcsset:userSettingPresentation xsi:type=\"v8:LocalStringType\"><v8:item><v8:lang>ru</v8:lang><v8:content>Период с</v8:content></v8:item><v8:item><v8:lang>en</v8:lang><v8:content>Period from</v8:content></v8:item></dcsset:userSettingPresentation>",
            "en: Period from",
        ),
    ] {
        let xml = format!(
            "<Root xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:xs=\"http://www.w3.org/2001/XMLSchema\" xmlns:v8=\"http://v8.1c.ru/8.1/data/core\" xmlns:v8ui=\"http://v8.1c.ru/8.1/data/ui\" xmlns:dcscor=\"http://v8.1c.ru/8.1/data-composition-system/core\" xmlns:dcsset=\"http://v8.1c.ru/8.1/data-composition-system/settings\"><Item xsi:type=\"dcsset:SettingsParameterValue\"><dcscor:parameter>ЦветФона</dcscor:parameter><dcscor:value xsi:type=\"v8ui:Color\">web:Red</dcscor:value>{presentation}</Item></Root>"
        );
        let imported = convert_file(entry, Direction::XmlToYaml, xml.as_bytes(), &inputs).unwrap();
        let yaml = String::from_utf8(imported.bytes).unwrap();
        assert!(yaml.contains(expected), "{yaml}");
        assert!(!yaml.contains("!xml/raw"), "{yaml}");
        assert_valid_candidate(entry, xml.as_bytes(), yaml.as_bytes(), &inputs);
    }
}

#[test]
fn settings_parameter_value_keeps_inner_links_as_one_value() {
    let (entry, inputs) = style_item_inputs("migration.dcs-parameter-value-links", &[]);
    let xml = r#"<Root xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:dcscor="http://v8.1c.ru/8.1/data-composition-system/core" xmlns:dcsset="http://v8.1c.ru/8.1/data-composition-system/settings" xmlns:ent="http://v8.1c.ru/8.1/data/enterprise"><Item xsi:type="dcsset:SettingsParameterValue"><dcscor:parameter>СвязиПараметровВыбора</dcscor:parameter><dcscor:value xsi:type="dcscor:ChoiceParameterLinks"><dcscor:item><dcscor:choiceParameter>ПараметрВыбора</dcscor:choiceParameter><dcscor:value>Поле1</dcscor:value><dcscor:mode xsi:type="ent:LinkedValueChangeMode">DontChange</dcscor:mode></dcscor:item></dcscor:value></Item></Root>"#;
    let two_links = xml.replace(
        "</dcscor:item></dcscor:value>",
        "</dcscor:item><dcscor:item><dcscor:choiceParameter>ДругойПараметр</dcscor:choiceParameter><dcscor:value>Поле2</dcscor:value><dcscor:mode xsi:type=\"ent:LinkedValueChangeMode\">DontChange</dcscor:mode></dcscor:item></dcscor:value>",
    );
    for source in [xml, two_links.as_str()] {
        let imported =
            convert_file(entry, Direction::XmlToYaml, source.as_bytes(), &inputs).unwrap();
        let yaml = String::from_utf8(imported.bytes).unwrap();
        assert!(yaml.contains("ПараметрВыбора"), "{yaml}");
        assert!(yaml.contains("ПутьКДанным: Поле1"), "{yaml}");
        assert_eq!(
            yaml.contains("ДругойПараметр"),
            source == two_links,
            "{yaml}"
        );
        assert!(!yaml.contains("!xml/"), "{yaml}");
        assert_valid_candidate(entry, source.as_bytes(), yaml.as_bytes(), &inputs);
    }
}

#[test]
fn settings_parameter_value_rejects_other_declared_profile_without_stopping_import() {
    let (entry, inputs) = style_item_inputs("migration.dcs-parameter-value-color", &[]);
    let xml = r#"<Root xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:dcscor="http://v8.1c.ru/8.1/data-composition-system/core" xmlns:dcsset="http://v8.1c.ru/8.1/data-composition-system/settings" xmlns:ent="http://v8.1c.ru/8.1/data/enterprise"><Item xsi:type="dcsset:SettingsParameterValue"><dcscor:parameter>ЦветФона</dcscor:parameter><dcscor:value xsi:type="dcscor:ChoiceParameterLinks"><dcscor:item><dcscor:choiceParameter>ПараметрВыбора</dcscor:choiceParameter><dcscor:value>Поле1</dcscor:value><dcscor:mode xsi:type="ent:LinkedValueChangeMode">DontChange</dcscor:mode></dcscor:item></dcscor:value><dcsset:viewMode>Normal</dcsset:viewMode></Item></Root>"#;
    let imported = convert_file(entry, Direction::XmlToYaml, xml.as_bytes(), &inputs).unwrap();
    let yaml = String::from_utf8(imported.bytes).unwrap();
    assert!(yaml.contains("!xml/"), "{yaml}");
    assert!(yaml.contains("Значение: !xml/raw"), "{yaml}");
    assert!(!yaml.starts_with("Item: !xml/raw"), "{yaml}");
    assert!(yaml.contains("РежимОтображения: Обычный"), "{yaml}");
    assert_valid_candidate(entry, xml.as_bytes(), yaml.as_bytes(), &inputs);
}

#[test]
fn settings_parameter_value_distinguishes_nil_from_missing_value() {
    let (entry, inputs) = style_item_inputs("migration.dcs-parameter-value-color", &[]);
    let body = "<dcscor:parameter>ЦветФона</dcscor:parameter>";
    let wrap = |tail: &str| {
        format!(
            "<Root xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:dcscor=\"http://v8.1c.ru/8.1/data-composition-system/core\" xmlns:dcsset=\"http://v8.1c.ru/8.1/data-composition-system/settings\"><Item xsi:type=\"dcsset:SettingsParameterValue\">{body}{tail}</Item></Root>"
        )
    };
    let nil = wrap("<dcscor:value xsi:nil=\"true\"/>");
    let imported = convert_file(entry, Direction::XmlToYaml, nil.as_bytes(), &inputs).unwrap();
    let yaml = String::from_utf8(imported.bytes).unwrap();
    assert!(yaml.contains("Значение: null"), "{yaml}");
    assert!(!yaml.contains("!xml/"), "{yaml}");
    assert_valid_candidate(entry, nil.as_bytes(), yaml.as_bytes(), &inputs);
    let created = convert_file(
        entry,
        Direction::YamlToXml,
        "ЦветФона:\n  Значение: null\n".as_bytes(),
        &inputs,
    )
    .unwrap();
    assert!(
        String::from_utf8_lossy(&created.bytes).contains(":nil=\"true\""),
        "{}",
        String::from_utf8_lossy(&created.bytes)
    );

    let conflicting = wrap("<dcscor:value xsi:nil=\"true\" xsi:type=\"dcscor:Field\"/>");
    let imported =
        convert_file(entry, Direction::XmlToYaml, conflicting.as_bytes(), &inputs).unwrap();
    let annotated = String::from_utf8(imported.bytes).unwrap();
    assert!(annotated.contains("!xml/"), "{annotated}");
    assert_valid_candidate(entry, conflicting.as_bytes(), annotated.as_bytes(), &inputs);

    for tail in ["", "<dcscor:value/>"] {
        let source = wrap(tail);
        let imported =
            convert_file(entry, Direction::XmlToYaml, source.as_bytes(), &inputs).unwrap();
        assert_valid_candidate(entry, source.as_bytes(), &imported.bytes, &inputs);
    }
}
