#[path = "support/dcs_parameter_test.rs"]
mod dcs_parameter_test;
use dcs_parameter_test::*;

#[test]
fn base_color_without_settings_wrapper() {
    let (entry, inputs) = style_item_inputs("migration.dcs-parameter-value-base-color", &[]);
    let xml = r#"<Root xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:dcscor="http://v8.1c.ru/8.1/data-composition-system/core" xmlns:v8ui="http://v8.1c.ru/8.1/data/ui"><Item><dcscor:parameter>ЦветФона</dcscor:parameter><dcscor:value xsi:type="v8ui:Color">web:Red</dcscor:value></Item></Root>"#;
    let imported = convert_file(entry, Direction::XmlToYaml, xml.as_bytes(), &inputs).unwrap();
    let yaml = String::from_utf8(imported.bytes).unwrap();
    assert!(yaml.contains("Значение: Красный"), "{yaml}");
    assert!(!yaml.contains("!xml/"), "{yaml}");
    assert_valid_candidate(entry, xml.as_bytes(), yaml.as_bytes(), &inputs);
}

#[test]
fn field_profile_round_trips_real_form_item() {
    let source =
        include_str!("../../../../e2e/fixtures/xml/cf/CommonForms/УсловноеОформление/Ext/Form.xml");
    let fragment = dcs_parameter_fragment(
        source,
        "<dcscor:value xsi:type=\"dcscor:Field\">Реквизит1</dcscor:value>",
    );
    let xml = format!(
        "<Root xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:dcscor=\"http://v8.1c.ru/8.1/data-composition-system/core\" xmlns:dcsset=\"http://v8.1c.ru/8.1/data-composition-system/settings\">{fragment}</Root>"
    );
    let (entry, inputs) = style_item_inputs("migration.dcs-parameter-value-field", &[]);
    let imported = convert_file(entry, Direction::XmlToYaml, xml.as_bytes(), &inputs).unwrap();
    let yaml = String::from_utf8(imported.bytes).unwrap();
    assert!(yaml.contains("Значение: Реквизит1"), "{yaml}");
    assert_plain_round_trip(entry, &xml, &yaml, &inputs);

    let wrong_profile = xml
        .replace(
            "xmlns:dcsset=\"http://v8.1c.ru/8.1/data-composition-system/settings\"",
            "xmlns:dcsset=\"http://v8.1c.ru/8.1/data-composition-system/settings\" xmlns:v8ui=\"http://v8.1c.ru/8.1/data/ui\" xmlns:web=\"http://v8.1c.ru/8.1/data/ui/colors/web\"",
        )
        .replace("dcscor:Field\">Реквизит1", "v8ui:Color\">web:Red");
    preserved_raw_yaml(entry, &wrong_profile, &inputs);
}

#[test]
fn horizontal_alignment_uses_existing_system_enum_projection() {
    let source =
        include_str!("../../../../e2e/fixtures/xml/cf/CommonForms/УсловноеОформление/Ext/Form.xml");
    let fragment = dcs_parameter_fragment(
        source,
        "<dcscor:parameter>ГоризонтальноеПоложение</dcscor:parameter>",
    );
    let xml = format!(
        "<Root xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:dcscor=\"http://v8.1c.ru/8.1/data-composition-system/core\" xmlns:dcsset=\"http://v8.1c.ru/8.1/data-composition-system/settings\" xmlns:v8ui=\"http://v8.1c.ru/8.1/data/ui\">{fragment}</Root>"
    );
    let (entry, inputs) = style_item_inputs("migration.dcs-parameter-value-horizontal-align", &[]);
    let imported = convert_file(entry, Direction::XmlToYaml, xml.as_bytes(), &inputs).unwrap();
    let yaml = String::from_utf8(imported.bytes).unwrap();
    assert!(yaml.contains("Значение: Центр"), "{yaml}");
    assert_plain_round_trip(entry, &xml, &yaml, &inputs);
    let unknown = xml.replace(">Center</dcscor:value>", ">DoesNotExist</dcscor:value>");
    preserved_raw_yaml(entry, &unknown, &inputs);
}

#[test]
fn type_link_reuses_common_declaration_in_real_form() {
    let source =
        include_str!("../../../../e2e/fixtures/xml/cf/CommonForms/ДинамическийСписок/Ext/Form.xml");
    let fragment =
        dcs_parameter_fragment(source, "<dcscor:parameter>СвязьПоТипу</dcscor:parameter>");
    let xml = format!(
        "<Root xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:dcscor=\"http://v8.1c.ru/8.1/data-composition-system/core\" xmlns:dcsset=\"http://v8.1c.ru/8.1/data-composition-system/settings\">{fragment}</Root>"
    );
    let (entry, inputs) = style_item_inputs("migration.dcs-parameter-value-type-link", &[]);
    let imported = convert_file(entry, Direction::XmlToYaml, xml.as_bytes(), &inputs).unwrap();
    let yaml = String::from_utf8(imported.bytes).unwrap();
    assert!(yaml.contains("Значение: Поле1(2)"), "{yaml}");
    assert_plain_round_trip(entry, &xml, &yaml, &inputs);
    let invalid = xml.replace(
        "<dcscor:linkItem>2</dcscor:linkItem>",
        "<dcscor:linkItem>oops</dcscor:linkItem>",
    );
    preserved_raw_yaml(entry, &invalid, &inputs);
}
