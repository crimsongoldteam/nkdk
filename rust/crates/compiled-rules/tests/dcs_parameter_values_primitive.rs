#[path = "support/dcs_enumeration_inputs.rs"]
mod dcs_enumeration_inputs;
#[path = "support/dcs_parameter_test.rs"]
mod dcs_parameter_test;
#[path = "support/metadata_value_inputs.rs"]
mod metadata_value_inputs_support;

use nkdk_compiled_rules_probes::{Direction, InputValue, convert_file, entry_id, verify_candidate};

#[test]
fn primitive_text_from_the_form_round_trips_on_its_own() {
    let entry = entry_id("migration.dcs-primitive-text").unwrap();
    let xml = "<Root xmlns:dcscor=\"http://v8.1c.ru/8.1/data-composition-system/core\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:xs=\"http://www.w3.org/2001/XMLSchema\"><dcscor:value xsi:type=\"xs:string\">123</dcscor:value></Root>";
    let inputs = Default::default();
    let imported = convert_file(entry, Direction::XmlToYaml, xml.as_bytes(), &inputs).unwrap();
    let yaml = String::from_utf8(imported.bytes).unwrap();
    assert!(yaml.contains("123"), "{yaml}");
    assert!(!yaml.contains("!xml/raw"), "{yaml}");
    verify_candidate(entry, xml.as_bytes(), yaml.as_bytes(), &inputs).unwrap();
}

#[test]
fn primitive_parameter_value_uses_the_existing_primitive_declaration() {
    let entry = entry_id("migration.dcs-parameter-value-primitive").unwrap();
    for (source, parameter, expected) in [
        (
            include_str!(
                "../../../../e2e/fixtures/xml/cf/CommonForms/ДинамическийСписок/Ext/Form.xml"
            ),
            "БыстрыйВыбор",
            "Значение: Истина",
        ),
        (
            include_str!(
                "../../../../e2e/fixtures/xml/cf/CommonForms/ДинамическийСписок/Ext/Form.xml"
            ),
            "ВыборГруппИЭлементов",
            "Значение:",
        ),
        (
            include_str!(
                "../../../../e2e/fixtures/xml/cf/CommonForms/ДинамическийСписок/Ext/Form.xml"
            ),
            "Маска",
            "Значение: \"123\"",
        ),
        (
            include_str!(
                "../../../../e2e/fixtures/xml/cf/CommonForms/ДинамическийСписок/Ext/Form.xml"
            ),
            "ФормаВыбора",
            "Значение: ФормаВыбора",
        ),
        (
            include_str!(
                "../../../../e2e/fixtures/xml/cf/CommonForms/ДинамическийСписок/Ext/Form.xml"
            ),
            "ФорматРедактирования",
            "Значение: ЧЦ=15; ЧДЦ=2",
        ),
    ] {
        let marker = format!("<dcscor:parameter>{parameter}</dcscor:parameter>");
        let fragment = dcs_parameter_test::dcs_parameter_fragment(source, &marker);
        let xml = format!(
            "<Root xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:xs=\"http://www.w3.org/2001/XMLSchema\" xmlns:ent=\"http://v8.1c.ru/8.1/data/enterprise\" xmlns:dcscor=\"http://v8.1c.ru/8.1/data-composition-system/core\" xmlns:dcsset=\"http://v8.1c.ru/8.1/data-composition-system/settings\">{fragment}</Root>"
        );
        let inputs = dcs_enumeration_inputs::inputs_with(
            entry,
            &["ru"],
            vec![("parameterName".into(), InputValue::Text(parameter.into()))],
        );
        let imported = convert_file(entry, Direction::XmlToYaml, xml.as_bytes(), &inputs).unwrap();
        let yaml = String::from_utf8(imported.bytes).unwrap();
        assert!(yaml.contains(expected), "{yaml}");
        assert!(!yaml.contains("!xml/"), "{yaml}");
        dcs_parameter_test::assert_plain_round_trip(entry, &xml, &yaml, &inputs);
        if parameter == "БыстрыйВыбор" {
            let invalid = xml.replace(">true</dcscor:value>", ">oops</dcscor:value>");
            assert_ne!(invalid, xml);
            let anomalous = dcs_parameter_test::preserved_raw_yaml(entry, &invalid, &inputs);
            assert!(anomalous.contains("Значение: !xml/raw"), "{anomalous}");
            assert!(!anomalous.starts_with("Item: !xml/raw"), "{anomalous}");
        }
    }
}

#[test]
fn primitive_parameter_keeps_exact_decimal_and_localizes_invalid_value() {
    let entry = entry_id("migration.dcs-parameter-value-primitive").unwrap();
    let inputs = dcs_enumeration_inputs::inputs_with(
        entry,
        &["ru"],
        vec![(
            "parameterName".into(),
            InputValue::Text("БольшоеЧисло".into()),
        )],
    );
    let xml = "<Root xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:xs=\"http://www.w3.org/2001/XMLSchema\" xmlns:dcscor=\"http://v8.1c.ru/8.1/data-composition-system/core\"><Item><dcscor:parameter>БольшоеЧисло</dcscor:parameter><dcscor:value xsi:type=\"xs:decimal\">9007199254740993</dcscor:value></Item></Root>";
    let imported = convert_file(entry, Direction::XmlToYaml, xml.as_bytes(), &inputs).unwrap();
    let yaml = String::from_utf8(imported.bytes).unwrap();
    assert!(yaml.contains("9007199254740993"), "{yaml}");
    assert!(!yaml.contains("!xml/"), "{yaml}");
    dcs_parameter_test::assert_plain_round_trip(entry, xml, &yaml, &inputs);
    for (kind, value, expected) in [
        ("xs:dateTime", "2025-12-24T12:00:00", "24.12.2025 12:00:00"),
        ("v8:Type", "d6p1:Undefined", "$значение: null"),
    ] {
        let source = format!(
            "<Root xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:xs=\"http://www.w3.org/2001/XMLSchema\" xmlns:v8=\"http://v8.1c.ru/8.1/data/core\" xmlns:dcscor=\"http://v8.1c.ru/8.1/data-composition-system/core\"><Item><dcscor:parameter>БольшоеЧисло</dcscor:parameter><dcscor:value xsi:type=\"{kind}\">{value}</dcscor:value></Item></Root>"
        );
        let imported =
            convert_file(entry, Direction::XmlToYaml, source.as_bytes(), &inputs).unwrap();
        let yaml = String::from_utf8(imported.bytes).unwrap();
        assert!(yaml.contains(expected), "{kind}: {yaml}");
        if kind == "v8:Type" {
            assert!(yaml.contains("Значение: !xml/raw"), "{yaml}");
            assert!(!yaml.starts_with("Item: !xml/raw"), "{yaml}");
        }
        verify_candidate(entry, source.as_bytes(), yaml.as_bytes(), &inputs).unwrap();
    }

    let invalid = xml.replace("9007199254740993", "not-a-number");
    let anomalous = dcs_parameter_test::preserved_raw_yaml(entry, &invalid, &inputs);
    assert!(anomalous.contains("Значение: !xml/raw"), "{anomalous}");
    assert!(!anomalous.starts_with("Item: !xml/raw"), "{anomalous}");
}
