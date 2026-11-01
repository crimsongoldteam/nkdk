#[path = "support/dcs_parameter_test.rs"]
#[allow(unused_imports)]
mod dcs_parameter_test;
use dcs_parameter_test::*;

#[test]
fn choice_parameters_are_selected_from_the_declared_profile() {
    let source =
        include_str!("../../../../e2e/fixtures/xml/cf/CommonForms/ДинамическийСписок/Ext/Form.xml");
    let fragment = dcs_parameter_fragment(
        source,
        "<dcscor:parameter>ПараметрыВыбора</dcscor:parameter>",
    );
    let xml = format!(
        "<Root xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:xs=\"http://www.w3.org/2001/XMLSchema\" xmlns:dcscor=\"http://v8.1c.ru/8.1/data-composition-system/core\" xmlns:dcsset=\"http://v8.1c.ru/8.1/data-composition-system/settings\">{fragment}</Root>"
    );
    let (entry, inputs) = style_item_inputs("migration.dcs-parameter-value-choice-parameters", &[]);
    let imported = convert_file(entry, Direction::XmlToYaml, xml.as_bytes(), &inputs).unwrap();
    let yaml = String::from_utf8(imported.bytes).unwrap();
    assert!(
        yaml.contains("ПараметрыВыбора:\n  Значение:\n    Параметр: 123"),
        "{yaml}"
    );
    assert_plain_round_trip(entry, &xml, &yaml, &inputs);
    let invalid = xml.replace(">123<", ">oops<");
    let imported = convert_file(entry, Direction::XmlToYaml, invalid.as_bytes(), &inputs).unwrap();
    let anomalous = String::from_utf8(imported.bytes).unwrap();
    assert!(
        anomalous.contains("Параметр: !xml/raw"),
        "anomaly should stay at the dictionary value: {anomalous}"
    );
    let restored =
        convert_file(entry, Direction::YamlToXml, anomalous.as_bytes(), &inputs).unwrap();
    nkdk_conversion_core::proof::verify(invalid.as_bytes(), &restored.bytes, |_| false).unwrap();
}
