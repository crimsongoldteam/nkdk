#[path = "support/dcs_parameter_test.rs"]
mod dcs_parameter_test;
use dcs_parameter_test::*;

#[test]
fn a_choice_can_contain_another_declarative_choice() {
    let source =
        include_str!("../../../../e2e/fixtures/xml/cf/CommonForms/УсловноеОформление/Ext/Form.xml");
    let start = source
        .find("<dcscor:parameter>Формат</dcscor:parameter>")
        .expect("real e2e format parameter");
    let value = &source[start..];
    let value_start = start + value.find("<dcscor:value").unwrap();
    let value_end = value_start
        + source[value_start..].find("</dcscor:value>").unwrap()
        + "</dcscor:value>".len();
    let xml = format!(
        "<Root xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:dcscor=\"http://v8.1c.ru/8.1/data-composition-system/core\" xmlns:v8=\"http://v8.1c.ru/8.1/data/core\"><Item>{}</Item></Root>",
        &source[value_start..value_end]
    );
    let (entry, inputs) = style_item_inputs("migration.dcs-nested-design-time-owner", &[]);
    let imported = convert_file(entry, Direction::XmlToYaml, xml.as_bytes(), &inputs).unwrap();
    let yaml = String::from_utf8(imported.bytes).unwrap();
    assert!(yaml.contains("Тип: МногоязычнаяСтрока"), "{yaml}");
    assert_plain_round_trip(entry, &xml, &yaml, &inputs);
    let unknown = xml.replace("v8:LocalStringType", "v8:UnknownValueType");
    preserved_raw_yaml(entry, &unknown, &inputs);
}

#[test]
fn design_time_and_field_profiles_share_qname_without_confusion() {
    let source =
        include_str!("../../../../e2e/fixtures/xml/cf/CommonForms/УсловноеОформление/Ext/Form.xml");
    let fragment = dcs_parameter_fragment(source, "<dcscor:parameter>Формат</dcscor:parameter>");
    let xml = format!(
        "<Root xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:dcscor=\"http://v8.1c.ru/8.1/data-composition-system/core\" xmlns:dcsset=\"http://v8.1c.ru/8.1/data-composition-system/settings\" xmlns:v8=\"http://v8.1c.ru/8.1/data/core\">{fragment}</Root>"
    );
    let (entry, inputs) = style_item_inputs("migration.dcs-parameter-value-design-time", &[]);
    let imported = convert_file(entry, Direction::XmlToYaml, xml.as_bytes(), &inputs).unwrap();
    let yaml = String::from_utf8(imported.bytes).unwrap();
    assert!(yaml.contains("Тип: МногоязычнаяСтрока"), "{yaml}");
    assert!(yaml.contains("ЧЦ=3; ЧДЦ=2"), "{yaml}");
    assert_plain_round_trip(entry, &xml, &yaml, &inputs);
    let wrong_type = xml.replace("v8:LocalStringType", "dcscor:Field");
    let anomalous = preserved_raw_yaml(entry, &wrong_type, &inputs);
    assert!(anomalous.contains("Формат:\n  Значение:"), "{anomalous}");
    assert!(anomalous.contains("Тип: Поле"), "{anomalous}");
    assert!(!anomalous.starts_with("Item: !xml/raw"), "{anomalous}");
}
