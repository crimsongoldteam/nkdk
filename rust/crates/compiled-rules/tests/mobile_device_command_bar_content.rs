use nkdk_compiled_rules_probes::{
    Direction, EntryId, InputValue, PreparedInputs, convert_file, entry_id, prepare_inputs,
};

#[path = "support/round_trip.rs"]
mod round_trip;

fn inputs() -> (EntryId, PreparedInputs) {
    let entry = entry_id("migration.mobile-device-command-bar-content").unwrap();
    let values = [
        ("defaultLanguage", InputValue::Text("ru".into())),
        (
            "registeredLanguages",
            InputValue::Sequence(vec![InputValue::Text("ru".into())]),
        ),
    ];
    let prepared = prepare_inputs(
        entry,
        values
            .into_iter()
            .map(|(name, value)| (name.into(), value))
            .collect(),
    )
    .unwrap();
    (entry, prepared)
}

fn wrapped(content: &str) -> String {
    format!(
        "<Root xmlns:xr=\"http://v8.1c.ru/8.3/xcf/readable\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:xs=\"http://www.w3.org/2001/XMLSchema\">{content}</Root>"
    )
}

fn round_trip(xml: &str) -> String {
    let (entry, inputs) = inputs();
    round_trip::yaml_and_verify(entry, xml, &inputs)
}

fn extracted(source: &str) -> String {
    let start = source.find("<MobileDeviceCommandBarContent>").unwrap();
    let end = source[start..]
        .find("</MobileDeviceCommandBarContent>")
        .unwrap()
        + start
        + "</MobileDeviceCommandBarContent>".len();
    wrapped(&source[start..end])
}

#[test]
fn legacy_mobile_command_bar_examples_round_trip() {
    for source in [
        include_str!(
            "../../../../packages/rules/metadata/commonObjects/mobileDeviceCommandBarContent/__fixtures__/full.xml"
        ),
        include_str!(
            "../../../../packages/rules/metadata/commonObjects/mobileDeviceCommandBarContent/__fixtures__/twoItems.xml"
        ),
    ] {
        let yaml = round_trip(&wrapped(source));
        assert!(yaml.contains("ФормаКоманда1"), "{yaml}");
        assert!(!yaml.starts_with("!xml"), "{yaml}");
    }
}

#[test]
fn real_forms_round_trip_without_root_annotation() {
    for source in [
        include_str!(
            "../../../../e2e/fixtures/xml/cf/Tasks/ЗадачаВсеСвойства/Forms/ФормаСписка/Ext/Form.xml"
        ),
        include_str!(
            "../../../../e2e/fixtures/xml/cf/BusinessProcesses/БизнесПроцессВсеСвойства/Forms/ФормаЗадачи/Ext/Form.xml"
        ),
    ] {
        let yaml = round_trip(&extracted(source));
        assert!(yaml.contains("Команда1"), "{yaml}");
        assert!(!yaml.starts_with("!xml"), "{yaml}");
    }
}

#[test]
fn authored_yaml_builds_mobile_command_bar_without_reference() {
    let yaml =
        "СоставКоманднойПанелиНаМобильномУстройстве:\n  - ФормаКоманда1\n  - ФормаКоманда2\n";
    let (entry, inputs) = inputs();
    let converted = convert_file(entry, Direction::YamlToXml, yaml.as_bytes(), &inputs).unwrap();
    let xml = String::from_utf8(converted.bytes).unwrap();
    assert_eq!(xml.matches("<n0:Item>").count(), 2, "{xml}");
    assert!(xml.contains("ФормаКоманда1"), "{xml}");
    assert!(xml.contains("<n0:CheckState>0</n0:CheckState>"), "{xml}");
}

#[test]
fn typed_item_reuses_the_shared_metadata_value_declaration() {
    let yaml =
        "СоставКоманднойПанелиНаМобильномУстройстве:\n  - Представление: Первый\n    Значение: 1\n";
    let (entry, inputs) = inputs();
    let converted = convert_file(entry, Direction::YamlToXml, yaml.as_bytes(), &inputs).unwrap();
    let xml = String::from_utf8(converted.bytes).unwrap();
    assert!(xml.contains("FormChoiceListDesTimeValue"), "{xml}");
    assert!(xml.contains("Первый"), "{xml}");
}

#[test]
fn empty_and_invalid_forms_keep_the_original_xml() {
    for content in [
        "<MobileDeviceCommandBarContent/>",
        "<MobileDeviceCommandBarContent><xr:Item/></MobileDeviceCommandBarContent>",
        "<MobileDeviceCommandBarContent><xr:Item><xr:CheckState>oops</xr:CheckState><xr:Value xsi:type=\"xs:string\">Команда</xr:Value></xr:Item></MobileDeviceCommandBarContent>",
    ] {
        let yaml = round_trip(&wrapped(content));
        assert!(!yaml.starts_with("!xml"), "{yaml}");
    }
}
