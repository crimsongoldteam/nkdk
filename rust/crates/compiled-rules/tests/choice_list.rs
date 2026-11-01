use nkdk_compiled_rules_probes::{
    Direction, EntryId, InputValue, PreparedInputs, convert_file, entry_id, prepare_inputs,
    verify_candidate,
};

const ROOT: &str = "<Root xmlns:xr=\"http://v8.1c.ru/8.3/xcf/readable\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:xs=\"http://www.w3.org/2001/XMLSchema\" xmlns:v8=\"http://v8.1c.ru/8.1/data/core\">";

fn inputs() -> (EntryId, PreparedInputs) {
    let entry = entry_id("migration.choice-list").unwrap();
    let languages = ["ru"]
        .into_iter()
        .map(|code| InputValue::Text(code.into()))
        .collect();
    let values = [
        ("defaultLanguage", InputValue::Text("ru".into())),
        ("registeredLanguages", InputValue::Sequence(languages)),
    ];
    let inputs = prepare_inputs(
        entry,
        values
            .into_iter()
            .map(|(name, value)| (name.into(), value))
            .collect(),
    )
    .unwrap();
    (entry, inputs)
}

fn wrapped(choice_list: &str) -> String {
    format!("{ROOT}{choice_list}</Root>")
}

fn extracted(source: &str) -> String {
    let start = source.find("<ChoiceList>").unwrap();
    let end = source[start..].find("</ChoiceList>").unwrap() + start + "</ChoiceList>".len();
    wrapped(&source[start..end])
}

fn round_trip(xml: &str) -> String {
    let (entry, inputs) = inputs();
    let result = convert_file(entry, Direction::XmlToYaml, xml.as_bytes(), &inputs).unwrap();
    verify_candidate(entry, xml.as_bytes(), &result.bytes, &inputs).unwrap();
    let yaml = String::from_utf8(result.bytes).unwrap();
    assert!(yaml.contains("СписокВыбора:"), "{yaml}");
    let restored = convert_file(entry, Direction::YamlToXml, yaml.as_bytes(), &inputs).unwrap();
    assert!(!restored.bytes.is_empty());
    yaml
}

#[test]
fn legacy_choice_lists_round_trip_without_root_annotation() {
    let cases = [
        include_str!(
            "../../../../packages/rules/metadata/commonObjects/choiceList/__fixtures__/oneItem.xml"
        ),
        include_str!(
            "../../../../packages/rules/metadata/commonObjects/choiceList/__fixtures__/twoItems.xml"
        ),
        include_str!(
            "../../../../packages/rules/metadata/commonObjects/choiceList/__fixtures__/empty.xml"
        ),
    ];
    for choice_list in cases {
        let yaml = round_trip(&wrapped(choice_list));
        assert!(!yaml.starts_with("!xml"), "{yaml}");
        assert!(yaml.contains("Представление:"), "{yaml}");
    }
}

#[test]
fn real_form_choice_lists_round_trip_without_root_annotation() {
    let forms = [
        include_str!("../../../../e2e/fixtures/xml/cf/CommonForms/Table/Ext/Form.xml"),
        include_str!("../../../../e2e/fixtures/xml/cf/CommonForms/InputField/Ext/Form.xml"),
        include_str!("../../../../e2e/fixtures/xml/cf/CommonForms/RadioButtonField/Ext/Form.xml"),
    ];
    for form in forms {
        let yaml = round_trip(&extracted(form));
        assert!(!yaml.contains("!xml"), "{yaml}");
    }
}

#[test]
fn malformed_check_state_is_preserved_as_anomaly() {
    let xml = wrapped(
        "<ChoiceList><xr:Item><xr:CheckState>oops</xr:CheckState><xr:Value xsi:type=\"FormChoiceListDesTimeValue\"><Presentation/><Value xsi:type=\"xs:string\">v</Value></xr:Value></xr:Item></ChoiceList>",
    );
    let yaml = round_trip(&xml);
    assert!(yaml.contains("!xml"), "{yaml}");
    assert!(!yaml.starts_with("!xml"), "{yaml}");
}

#[test]
fn empty_item_among_values_is_preserved_as_anomaly() {
    let xml = wrapped(
        "<ChoiceList><xr:Item/><xr:Item><xr:CheckState>0</xr:CheckState><xr:Value xsi:type=\"FormChoiceListDesTimeValue\"><Presentation/><Value xsi:type=\"xs:string\">v</Value></xr:Value></xr:Item></ChoiceList>",
    );
    let yaml = round_trip(&xml);
    assert!(yaml.contains("!xml"), "{yaml}");
    assert!(!yaml.starts_with("!xml"), "{yaml}");
}

#[test]
fn unexpected_value_type_is_preserved_as_anomaly() {
    let xml = wrapped(
        "<ChoiceList><xr:Item><xr:CheckState>0</xr:CheckState><xr:Value xsi:type=\"UnknownValue\">opaque</xr:Value></xr:Item></ChoiceList>",
    );
    let yaml = round_trip(&xml);
    assert!(yaml.contains("!xml"), "{yaml}");
    assert!(!yaml.starts_with("!xml"), "{yaml}");
}

#[test]
fn absent_and_empty_choice_list_have_no_yaml_property() {
    let (entry, inputs) = inputs();
    for xml in [wrapped(""), wrapped("<ChoiceList/>")] {
        let result = convert_file(entry, Direction::XmlToYaml, xml.as_bytes(), &inputs).unwrap();
        let yaml = String::from_utf8(result.bytes).unwrap();
        assert!(!yaml.contains("СписокВыбора"), "{yaml}");
    }
}

#[test]
fn authored_yaml_builds_choice_list_without_xml_reference() {
    let (entry, inputs) = inputs();
    let yaml = "СписокВыбора:\n  - Представление: Первый\n    Значение: '1'\n  - Представление: Второй\n    Значение: 2\n";
    let result = convert_file(entry, Direction::YamlToXml, yaml.as_bytes(), &inputs).unwrap();
    let xml = String::from_utf8(result.bytes).unwrap();
    assert_eq!(xml.matches("<n0:Item>").count(), 2, "{xml}");
    assert_eq!(
        xml.matches("<n0:CheckState>0</n0:CheckState>").count(),
        2,
        "{xml}"
    );
    assert!(xml.contains("<n0:Presentation"), "{xml}");
    let restored = convert_file(entry, Direction::XmlToYaml, xml.as_bytes(), &inputs).unwrap();
    let restored = String::from_utf8(restored.bytes).unwrap();
    assert!(restored.contains("Первый"), "{restored}");
    assert!(restored.contains("Второй"), "{restored}");
}

#[test]
fn authored_scalar_choice_item_keeps_its_text() {
    let (entry, inputs) = inputs();
    let result = convert_file(
        entry,
        Direction::YamlToXml,
        "СписокВыбора:\n  - ФормаКоманда1\n".as_bytes(),
        &inputs,
    )
    .unwrap();
    let xml = String::from_utf8(result.bytes).unwrap();
    assert!(xml.contains("ФормаКоманда1"), "{xml}");
}
