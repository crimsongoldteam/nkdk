#[path = "support/dcs_enumeration_inputs.rs"]
#[allow(dead_code)]
mod dcs_enumeration_inputs;
use nkdk_compiled_rules::{Direction, PreparedInputs, convert_file, entry_id, validate_file};
use nkdk_compiled_rules_probes as nkdk_compiled_rules;
#[path = "support/candidate.rs"]
mod candidate_support;
use candidate_support::{assert_valid_candidate, preserved_raw_yaml};
#[path = "support/metadata_value_inputs.rs"]
#[allow(dead_code)]
mod metadata_value_inputs_support;
use metadata_value_inputs_support::dcs_language_inputs;
include!("support/style_item_inputs.rs");

fn assert_anomalous_dcs_choice(
    entry: nkdk_compiled_rules::EntryId,
    inputs: &PreparedInputs,
    value: &str,
) {
    let xml = format!(
        "<Root xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:xs=\"http://www.w3.org/2001/XMLSchema\" xmlns:dcscor=\"http://v8.1c.ru/8.1/data-composition-system/core\">{value}<Other>Сосед</Other></Root>"
    );
    let imported = convert_file(entry, Direction::XmlToYaml, xml.as_bytes(), inputs)
        .unwrap_or_else(|error| panic!("{value}: {error:?}"));
    let yaml = String::from_utf8_lossy(&imported.bytes);
    assert!(
        yaml.contains("!xml/") && yaml.contains("Сосед: Сосед"),
        "{yaml}"
    );
    assert_valid_candidate(entry, xml.as_bytes(), &imported.bytes, inputs);
}

fn assert_nil_choice_anomalies(entry: nkdk_compiled_rules::EntryId, inputs: &PreparedInputs) {
    for value in [
        "<Value xsi:nil=\"false\"/>",
        "<Value xsi:nil=\"true\" xsi:type=\"xs:string\"/>",
        "<Value xsi:nil=\"true\">Ссылка</Value>",
    ] {
        assert_anomalous_dcs_choice(entry, inputs, value);
    }
}

fn assert_nil_choice_distinct_from_missing(
    entry: nkdk_compiled_rules::EntryId,
    inputs: &PreparedInputs,
) {
    let nil = "<Root xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\"><Value xsi:nil=\"true\"/></Root>";
    let imported = convert_file(entry, Direction::XmlToYaml, nil.as_bytes(), inputs).unwrap();
    assert_eq!(
        String::from_utf8_lossy(&imported.bytes).trim(),
        "Значение: null"
    );
    assert_valid_candidate(entry, nil.as_bytes(), &imported.bytes, inputs);
    let absent = convert_file(entry, Direction::XmlToYaml, b"<Root/>", inputs).unwrap();
    assert!(!String::from_utf8_lossy(&absent.bytes).contains("Значение"));
    assert_valid_candidate(entry, b"<Root/>", &absent.bytes, inputs);
    let fresh = convert_file(entry, Direction::YamlToXml, b"{}", inputs).unwrap();
    assert!(!String::from_utf8_lossy(&fresh.bytes).contains("<Value"));
    assert_nil_choice_anomalies(entry, inputs);
}

fn imported_yaml(
    entry: nkdk_compiled_rules::EntryId,
    xml: &str,
    inputs: &PreparedInputs,
) -> String {
    let output = convert_file(entry, Direction::XmlToYaml, xml.as_bytes(), inputs).unwrap();
    String::from_utf8(output.bytes).unwrap()
}

#[test]
fn dcs_metadata_field_round_trips_a_real_xml_value_without_reference() {
    let source = include_str!(
        "../../../../e2e/fixtures/xml/cf/Reports/ОтчетСКД/Templates/ОсновнаяСхемаКомпоновкиДанных/Ext/Template.xml"
    );
    let opening = "<dcsset:left xsi:type=\"dcscor:Field\">";
    let start = source.find(opening).unwrap();
    let end = start + source[start..].find("</dcsset:left>").unwrap() + "</dcsset:left>".len();
    let field = source[start..end].replace("dcsset:left", "Field");
    let xml = format!(
        "<Root xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:dcscor=\"http://v8.1c.ru/8.1/data-composition-system/core\">{field}</Root>"
    );
    for (id, expected) in [
        ("migration.dcs-metadata-value-basic", "Поле: Ссылка"),
        ("migration.dcs-filter-field", "Поле: .Ссылка"),
    ] {
        let entry = entry_id(id).unwrap();
        let inputs = nkdk_compiled_rules::prepare_inputs(entry, Vec::new()).unwrap();
        let yaml = imported_yaml(entry, &xml, &inputs);
        assert!(yaml.contains(expected), "{yaml}");
        let rebuilt = convert_file(entry, Direction::YamlToXml, yaml.as_bytes(), &inputs).unwrap();
        let rebuilt = String::from_utf8(rebuilt.bytes).unwrap();
        nkdk_compiled_rules::verify_candidate(entry, xml.as_bytes(), yaml.as_bytes(), &inputs)
            .unwrap();
        assert!(rebuilt.contains(":Field\">Ссылка</Field>"), "{rebuilt}");
        if id == "migration.dcs-filter-field" {
            for (yaml, valid) in [
                ("Поле: .Ссылка", true),
                ("Поле: .Ссылка.Код", true),
                ("Поле: Ссылка", false),
                ("Поле: 42", false),
            ] {
                assert_eq!(
                    validate_file(entry, yaml.as_bytes(), &inputs).is_empty(),
                    valid,
                    "{yaml}"
                );
            }
            let fresh =
                convert_file(entry, Direction::YamlToXml, expected.as_bytes(), &inputs).unwrap();
            nkdk_conversion_core::proof::verify(xml.as_bytes(), &fresh.bytes, |_| false).unwrap();
        }
        let unusual = xml.replace("dcscor:Field", "dcscor:Unknown");
        let result =
            convert_file(entry, Direction::XmlToYaml, unusual.as_bytes(), &inputs).unwrap();
        assert!(String::from_utf8_lossy(&result.bytes).contains("!xml/"));
        assert_valid_candidate(entry, unusual.as_bytes(), &result.bytes, &inputs);
    }
}

#[test]
fn dcs_filter_boolean_keeps_xml_type_and_text_value() {
    let source =
        include_str!("../../../../e2e/fixtures/xml/cf/CommonForms/УсловноеОформление/Ext/Form.xml");
    let entry = entry_id("migration.dcs-filter-boolean").unwrap();
    let inputs = nkdk_compiled_rules::prepare_inputs(entry, Vec::new()).unwrap();
    for spelling in ["true", "false"] {
        let fragment = format!("<dcsset:right xsi:type=\"xs:boolean\">{spelling}</dcsset:right>");
        assert!(source.contains(&fragment), "missing e2e value {spelling}");
        let xml = format!(
            "<Root xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:xs=\"http://www.w3.org/2001/XMLSchema\">{}</Root>",
            fragment.replace("dcsset:right", "Value")
        );
        let yaml = imported_yaml(entry, &xml, &inputs);
        assert!(
            yaml.contains(&format!("Значение: \"{spelling}\"")),
            "{yaml}"
        );
        assert_valid_candidate(entry, xml.as_bytes(), yaml.as_bytes(), &inputs);
        let rebuilt = convert_file(entry, Direction::YamlToXml, yaml.as_bytes(), &inputs).unwrap();
        nkdk_conversion_core::proof::verify(xml.as_bytes(), &rebuilt.bytes, |_| false).unwrap();
    }
    let malformed = "<Root xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:xs=\"http://www.w3.org/2001/XMLSchema\"><Value xsi:type=\"xs:boolean\">oops</Value><Other>Сосед</Other></Root>";
    let imported =
        convert_file(entry, Direction::XmlToYaml, malformed.as_bytes(), &inputs).unwrap();
    let yaml = String::from_utf8(imported.bytes).unwrap();
    assert!(yaml.contains("!xml/") && yaml.contains("Сосед"), "{yaml}");
    assert_valid_candidate(entry, malformed.as_bytes(), yaml.as_bytes(), &inputs);
    assert!(!validate_file(entry, "Значение: oops".as_bytes(), &inputs).is_empty());
    let wrong_type = malformed
        .replace("xs:boolean", "xs:string")
        .replace("oops", "true");
    let imported =
        convert_file(entry, Direction::XmlToYaml, wrong_type.as_bytes(), &inputs).unwrap();
    assert!(String::from_utf8_lossy(&imported.bytes).contains("!xml/"));
    assert_valid_candidate(entry, wrong_type.as_bytes(), &imported.bytes, &inputs);
}

#[test]
fn dcs_field_choice_keeps_fields_strings_and_primitives_distinct() {
    let entry = entry_id("migration.dcs-field-choice").unwrap();
    let inputs = nkdk_compiled_rules::prepare_inputs(entry, Vec::new()).unwrap();
    for (xml_type, text, expected) in [
        ("dcscor:Field", "Ссылка", "Значение: .Ссылка"),
        (
            "xs:string",
            ".Ссылка",
            "Значение:\n  Тип: Строка\n  Значение: .Ссылка",
        ),
        (
            "xs:string",
            "Истина",
            "Значение:\n  Тип: Строка\n  Значение: Истина",
        ),
        (
            "dcscor:DesignTimeValue",
            "Перечисление.СтраницыЖурналаОтчетность.ЕГРЮЛ",
            "Значение: Перечисление.СтраницыЖурналаОтчетность.ЕГРЮЛ",
        ),
        ("xs:boolean", "true", "Значение: Истина"),
        (
            "xs:decimal",
            "9007199254740993",
            "Значение: 9007199254740993",
        ),
        (
            "xs:dateTime",
            "2026-09-25T12:34:56",
            "Значение: 25.09.2026 12:34:56",
        ),
    ] {
        let xml = format!(
            "<Root xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:xs=\"http://www.w3.org/2001/XMLSchema\" xmlns:dcscor=\"http://v8.1c.ru/8.1/data-composition-system/core\"><Value xsi:type=\"{xml_type}\">{text}</Value></Root>"
        );
        let imported = convert_file(entry, Direction::XmlToYaml, xml.as_bytes(), &inputs).unwrap();
        assert_eq!(
            String::from_utf8_lossy(&imported.bytes).trim(),
            expected,
            "{xml_type}"
        );
        assert_valid_candidate(entry, xml.as_bytes(), &imported.bytes, &inputs);
        let exported =
            convert_file(entry, Direction::YamlToXml, expected.as_bytes(), &inputs).unwrap();
        nkdk_conversion_core::proof::verify(xml.as_bytes(), &exported.bytes, |_| false).unwrap();
    }
    for (xml_type, text) in [
        ("xs:boolean", "oops"),
        ("xs:decimal", "1.2.3"),
        ("dcscor:Unknown", "Ссылка"),
    ] {
        let value = format!("<Value xsi:type=\"{xml_type}\">{text}</Value>");
        assert_anomalous_dcs_choice(entry, &inputs, &value);
    }
}

#[test]
fn dcs_field_choice_distinguishes_nil_from_missing() {
    let entry = entry_id("migration.dcs-field-choice").unwrap();
    let inputs = nkdk_compiled_rules::prepare_inputs(entry, Vec::new()).unwrap();
    assert_nil_choice_distinct_from_missing(entry, &inputs);
}

#[test]
fn dcs_design_time_choice_distinguishes_nil_from_missing() {
    let entry = entry_id("migration.dcs-design-time-choice").unwrap();
    let inputs = dcs_language_inputs(entry, &["ru", "en"]);
    assert_nil_choice_distinct_from_missing(entry, &inputs);
}

#[test]
fn dcs_design_time_value_preserves_the_real_metadata_path() {
    let entry = entry_id("migration.dcs-design-time-value").unwrap();
    let inputs = nkdk_compiled_rules::prepare_inputs(entry, Vec::new()).unwrap();
    let source = include_str!(
        "../../../../e2e/fixtures/xml/cf/Reports/ОтчетСКД/Templates/ОсновнаяСхемаКомпоновкиДанных/Ext/Template.xml"
    );
    let opening = "<dcsset:right xsi:type=\"dcscor:DesignTimeValue\">";
    let start = source.find(opening).unwrap();
    let end = start + source[start..].find("</dcsset:right>").unwrap() + "</dcsset:right>".len();
    let value = source[start..end].replace("dcsset:right", "Value");
    let (xml, yaml) = import_dcs_value(entry, &value, &inputs);
    assert!(
        yaml.contains("Значение: Справочник.Справочник1.ПустаяСсылка"),
        "{yaml}"
    );
    nkdk_compiled_rules::verify_candidate(entry, xml.as_bytes(), yaml.as_bytes(), &inputs).unwrap();
    let restored = convert_file(entry, Direction::YamlToXml, yaml.as_bytes(), &inputs).unwrap();
    nkdk_conversion_core::proof::verify(xml.as_bytes(), &restored.bytes, |_| false).unwrap();
    let unknown = xml.replace("Справочник.Справочник1", "НеизвестныйТип.Справочник1");
    let imported = convert_file(entry, Direction::XmlToYaml, unknown.as_bytes(), &inputs).unwrap();
    let yaml = String::from_utf8(imported.bytes).unwrap();
    assert!(yaml.contains("!xml/"), "{yaml}");
    nkdk_compiled_rules::verify_candidate(entry, unknown.as_bytes(), yaml.as_bytes(), &inputs)
        .unwrap();
    let enum_value = include_str!(
        "../../../../packages/rules/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/__fixtures__/design-time-ref.xml"
    )
    .replace("dcscor:value", "Value");
    let xml = wrap_dcs_typed_value(&enum_value);
    let yaml = imported_yaml(entry, &xml, &inputs);
    assert!(
        yaml.contains("Перечисление.СтраницыЖурналаОтчетность.ЕГРЮЛ"),
        "{yaml}"
    );
    nkdk_compiled_rules::verify_candidate(entry, xml.as_bytes(), yaml.as_bytes(), &inputs).unwrap();
}

#[test]
fn dcs_design_time_choice_preserves_invalid_path_as_anomaly() {
    let entry = entry_id("migration.dcs-design-time-choice").unwrap();
    let inputs = dcs_language_inputs(entry, &["ru", "en"]);
    let xml = "<Root xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:dcscor=\"http://v8.1c.ru/8.1/data-composition-system/core\"><Value xsi:type=\"dcscor:DesignTimeValue\">Справочник.123.ПустаяСсылка</Value><Other>Соседнее значение</Other></Root>";
    let imported = convert_file(entry, Direction::XmlToYaml, xml.as_bytes(), &inputs).unwrap();
    let yaml = String::from_utf8(imported.bytes).unwrap();
    assert!(yaml.contains("!xml/"), "{yaml}");
    assert!(yaml.contains("Сосед: Соседнее значение"), "{yaml}");
    assert_valid_candidate(entry, xml.as_bytes(), yaml.as_bytes(), &inputs);
    let valid = xml.replace("Справочник.123", "Справочник.Справочник1");
    let imported = convert_file(entry, Direction::XmlToYaml, valid.as_bytes(), &inputs).unwrap();
    let yaml = String::from_utf8(imported.bytes).unwrap();
    assert!(
        yaml.contains("Значение: Справочник.Справочник1.ПустаяСсылка"),
        "{yaml}"
    );
    assert_valid_candidate(entry, valid.as_bytes(), yaml.as_bytes(), &inputs);
    let localized = "<Root xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:v8=\"http://v8.1c.ru/8.1/data/core\"><Value xsi:type=\"v8:LocalStringType\"><v8:item><v8:lang>ru</v8:lang><v8:content>Текст</v8:content></v8:item></Value></Root>";
    let imported =
        convert_file(entry, Direction::XmlToYaml, localized.as_bytes(), &inputs).unwrap();
    let yaml = String::from_utf8(imported.bytes).unwrap();
    assert!(yaml.contains("Тип: МногоязычнаяСтрока"), "{yaml}");
    assert_valid_candidate(entry, localized.as_bytes(), yaml.as_bytes(), &inputs);
    let field = "<Root xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:dcscor=\"http://v8.1c.ru/8.1/data-composition-system/core\"><Value xsi:type=\"dcscor:Field\">Сертификаты.СертификатПредставление</Value></Root>";
    let imported = convert_file(entry, Direction::XmlToYaml, field.as_bytes(), &inputs).unwrap();
    let yaml = String::from_utf8(imported.bytes).unwrap();
    assert!(yaml.contains("Тип: Поле"), "{yaml}");
    assert_valid_candidate(entry, field.as_bytes(), yaml.as_bytes(), &inputs);
    let formatted = "<Root xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:v8=\"http://v8.1c.ru/8.1/data/core\"><Value xsi:type=\"v8:LocalFormattedStringType\"><v8:lws><v8:item><v8:lang>ru</v8:lang><v8:content>Текст</v8:content></v8:item></v8:lws><v8:formatted>true</v8:formatted></Value></Root>";
    let imported =
        convert_file(entry, Direction::XmlToYaml, formatted.as_bytes(), &inputs).unwrap();
    let yaml = String::from_utf8(imported.bytes).unwrap();
    assert!(
        yaml.contains("Тип: МногоязычнаяФорматированнаяСтрока"),
        "{yaml}"
    );
    assert_valid_candidate(entry, formatted.as_bytes(), yaml.as_bytes(), &inputs);
    let text_xml = "<Root xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:xs=\"http://www.w3.org/2001/XMLSchema\"><Value xsi:type=\"xs:string\">123</Value></Root>";
    let imported = convert_file(entry, Direction::XmlToYaml, text_xml.as_bytes(), &inputs).unwrap();
    let yaml = String::from_utf8(imported.bytes).unwrap();
    assert!(yaml.contains("Значение: \"123\""), "{yaml}");
    assert_valid_candidate(entry, text_xml.as_bytes(), yaml.as_bytes(), &inputs);
    for (yaml, expected) in [
        (
            "Значение: Справочник.Справочник1.ПустаяСсылка\n",
            "DesignTimeValue",
        ),
        (
            "Значение:\n  Тип: Поле\n  Значение: Сертификаты.СертификатПредставление\n",
            "Field",
        ),
        (
            "Значение:\n  Тип: МногоязычнаяСтрока\n  Значение: Текст\n",
            "LocalStringType",
        ),
        (
            "Значение:\n  Тип: МногоязычнаяФорматированнаяСтрока\n  Значение:\n    Форматированный: Истина\n    Текст: Текст\n",
            "LocalFormattedStringType",
        ),
        ("Значение: \"123\"\n", "string"),
    ] {
        let exported = convert_file(entry, Direction::YamlToXml, yaml.as_bytes(), &inputs).unwrap();
        let xml = String::from_utf8(exported.bytes).unwrap();
        assert!(xml.contains(expected), "{xml}");
    }
}

fn wrap_dcs_typed_value(value: &str) -> String {
    format!(
        "<Root xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:dcscor=\"http://v8.1c.ru/8.1/data-composition-system/core\">{value}</Root>"
    )
}

fn import_dcs_value(
    entry: nkdk_compiled_rules::EntryId,
    value: &str,
    inputs: &nkdk_compiled_rules::PreparedInputs,
) -> (String, String) {
    let xml = wrap_dcs_typed_value(value);
    let imported = convert_file(entry, Direction::XmlToYaml, xml.as_bytes(), inputs).unwrap();
    (xml, String::from_utf8(imported.bytes).unwrap())
}

#[test]
fn dcs_design_time_explicit_field_restores_its_type_from_yaml() {
    let entry = entry_id("migration.dcs-design-time-explicit-field").unwrap();
    let inputs = nkdk_compiled_rules::prepare_inputs(entry, Vec::new()).unwrap();
    let value = include_str!(
        "../../../../packages/rules/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/__fixtures__/design-time-field.xml"
    )
    .replace("dcscor:value", "Value");
    let (xml, yaml) = import_dcs_value(entry, &value, &inputs);
    assert!(yaml.contains("Тип: Поле"), "{yaml}");
    assert!(
        yaml.contains("Значение: Сертификаты.СертификатПредставление"),
        "{yaml}"
    );
    nkdk_compiled_rules::verify_candidate(entry, xml.as_bytes(), yaml.as_bytes(), &inputs).unwrap();
    let invalid = "Значение:\n  Тип: НеПоле\n  Значение: Сертификаты.СертификатПредставление";
    assert!(!nkdk_compiled_rules::validate_file(entry, invalid.as_bytes(), &inputs).is_empty());
    let unknown_type = xml.replace("dcscor:Field", "dcscor:Unknown");
    let imported = convert_file(
        entry,
        Direction::XmlToYaml,
        unknown_type.as_bytes(),
        &inputs,
    )
    .unwrap();
    let yaml = String::from_utf8(imported.bytes).unwrap();
    assert!(yaml.contains("!xml/"), "{yaml}");
    nkdk_compiled_rules::verify_candidate(entry, unknown_type.as_bytes(), yaml.as_bytes(), &inputs)
        .unwrap();
}

#[test]
fn dcs_design_time_localized_text_keeps_its_variant_and_anomalies() {
    let entry = entry_id("migration.dcs-design-time-localized-text").unwrap();
    let inputs = dcs_language_inputs(entry, &["ru", "en"]);
    let value = include_str!(
        "../../../../packages/rules/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/__fixtures__/design-time-value.xml"
    )
    .replace("dcscor:value", "Value");
    let xml = format!(
        "<Root xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:v8=\"http://v8.1c.ru/8.1/data/core\">{value}</Root>"
    );
    let imported = convert_file(entry, Direction::XmlToYaml, xml.as_bytes(), &inputs).unwrap();
    let yaml = String::from_utf8(imported.bytes).unwrap();
    assert!(yaml.contains("Тип: МногоязычнаяСтрока"), "{yaml}");
    assert!(yaml.contains("Значение: ЧЦ=3; ЧДЦ=2"), "{yaml}");
    assert_valid_candidate(entry, xml.as_bytes(), yaml.as_bytes(), &inputs);
    let fresh =
        "Значение:\n  Тип: МногоязычнаяСтрока\n  Значение: ЧЦ=3; ЧДЦ=2\nСосед: Соседнее значение\n";
    let exported = convert_file(entry, Direction::YamlToXml, fresh.as_bytes(), &inputs).unwrap();
    let restored = String::from_utf8(exported.bytes).unwrap();
    assert!(restored.contains("LocalStringType"), "{restored}");
    assert!(
        restored.contains("<Other>Соседнее значение</Other>"),
        "{restored}"
    );

    let unexpected = "<Root xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:xs=\"http://www.w3.org/2001/XMLSchema\"><Value xsi:type=\"xs:string\">Текст</Value><Other>Соседнее значение</Other></Root>";
    let imported =
        convert_file(entry, Direction::XmlToYaml, unexpected.as_bytes(), &inputs).unwrap();
    let yaml = String::from_utf8(imported.bytes).unwrap();
    assert!(yaml.contains("!xml/raw"), "{yaml}");
    assert!(yaml.contains("Сосед: Соседнее значение"), "{yaml}");
    assert_valid_candidate(entry, unexpected.as_bytes(), yaml.as_bytes(), &inputs);
}

#[test]
fn dcs_primitive_value_reuses_metadata_value_for_existing_xml() {
    let entry = entry_id("migration.dcs-primitive-value").unwrap();
    let inputs = dcs_enumeration_inputs::inputs_with(
        entry,
        &["ru", "en"],
        vec![(
            "exportMissing".into(),
            nkdk_compiled_rules::InputValue::Boolean(false),
        )],
    );
    for (xml, yaml) in [
        ("<Root/>", ""),
        (
            "<Root xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\"><Value xsi:nil=\"true\"/></Root>",
            "Значение: null",
        ),
    ] {
        let imported = convert_file(entry, Direction::XmlToYaml, xml.as_bytes(), &inputs).unwrap();
        assert_eq!(String::from_utf8_lossy(&imported.bytes).trim(), yaml);
        let authored = if yaml.is_empty() { "{}" } else { yaml };
        assert_valid_candidate(entry, xml.as_bytes(), authored.as_bytes(), &inputs);
    }
    let export_missing = dcs_enumeration_inputs::inputs_with(
        entry,
        &["ru", "en"],
        vec![(
            "exportMissing".into(),
            nkdk_compiled_rules::InputValue::Boolean(true),
        )],
    );
    for yaml in ["{}", "Значение: null"] {
        let expected = "<Root xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\"><Value xsi:nil=\"true\"/></Root>";
        assert_valid_candidate(entry, expected.as_bytes(), yaml.as_bytes(), &export_missing);
    }
    for (kind, text, expected) in [
        ("v8:Type", "d6p1:Undefined", "null"),
        ("v8:Type", "alias:Undefined", "null"),
        ("xs:string", "alias:Undefined", "alias:Undefined"),
        ("v8:Type", "alias:Other", "alias:Other"),
        ("v8:Type", "Undefined", "Undefined"),
    ] {
        let xml = format!(
            "<Root xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:xs=\"http://www.w3.org/2001/XMLSchema\" xmlns:v8=\"http://v8.1c.ru/8.1/data/core\"><Value xsi:type=\"{kind}\">{text}</Value></Root>"
        );
        let imported = convert_file(entry, Direction::XmlToYaml, xml.as_bytes(), &inputs).unwrap();
        let yaml = String::from_utf8(imported.bytes).unwrap();
        if kind == "v8:Type" {
            assert!(yaml.contains(&format!("$значение: {expected}")), "{yaml}");
        } else {
            assert_eq!(yaml.trim(), format!("Значение: {expected}"));
        }
        assert_valid_candidate(entry, xml.as_bytes(), yaml.as_bytes(), &inputs);
    }
    let invalid_xml = "<Root xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:xs=\"http://www.w3.org/2001/XMLSchema\"><Value xsi:type=\"xs:boolean\">maybe</Value></Root>";
    let invalid =
        convert_file(entry, Direction::XmlToYaml, invalid_xml.as_bytes(), &inputs).unwrap();
    let invalid_yaml = String::from_utf8_lossy(&invalid.bytes);
    assert!(
        invalid_yaml.contains("Значение: !xml/raw"),
        "{invalid_yaml}"
    );
    assert!(invalid_yaml.contains("#replace"), "{invalid_yaml}");
    assert_valid_candidate(entry, invalid_xml.as_bytes(), &invalid.bytes, &inputs);
    for (fixture, expected) in [
        (
            include_str!(
                "../../../../packages/rules/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/__fixtures__/primitive-type-ref.xml"
            ),
            "$значение: null",
        ),
        (
            include_str!(
                "../../../../packages/rules/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/__fixtures__/primitive-boolean.xml"
            ),
            "Значение: Истина",
        ),
        (
            include_str!(
                "../../../../packages/rules/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/__fixtures__/primitive-uuid.xml"
            ),
            "00000000-0000-0000-0000-000000000000",
        ),
        (
            "<dcscor:value xsi:type=\"xs:string\">123</dcscor:value>",
            "Значение: \"123\"",
        ),
        (
            "<dcscor:value xsi:type=\"v8:StandardPeriod\"><v8:variant xsi:type=\"v8:StandardPeriodVariant\">Custom</v8:variant><v8:startDate>2026-03-25T12:34:56</v8:startDate></dcscor:value>",
            "Вариант: ПроизвольныйПериод",
        ),
    ] {
        let xml = format!(
            "<Root xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:xs=\"http://www.w3.org/2001/XMLSchema\" xmlns:v8=\"http://v8.1c.ru/8.1/data/core\">{}</Root>",
            fixture.replace("dcscor:value", "Value")
        );
        let imported = convert_file(entry, Direction::XmlToYaml, xml.as_bytes(), &inputs).unwrap();
        let yaml = String::from_utf8(imported.bytes).unwrap();
        assert!(yaml.contains(expected), "{yaml}");
        assert_valid_candidate(entry, xml.as_bytes(), yaml.as_bytes(), &inputs);
    }
    for (yaml, xml_type) in [
        ("Значение: Истина\n", "boolean"),
        ("Значение: 9007199254740993\n", "decimal"),
        ("Значение: 'обычный: текст'\n", "string"),
    ] {
        let exported = convert_file(entry, Direction::YamlToXml, yaml.as_bytes(), &inputs).unwrap();
        let xml = String::from_utf8(exported.bytes).unwrap();
        assert!(xml.contains(xml_type), "{xml}");
    }
}

#[test]
fn dcs_metadata_type_link_reuses_the_declared_path() {
    let entry = entry_id("migration.dcs-metadata-value-basic").unwrap();
    let inputs = nkdk_compiled_rules::prepare_inputs(entry, Vec::new()).unwrap();
    let source =
        include_str!("../../../../e2e/fixtures/xml/cf/CommonForms/ДинамическийСписок/Ext/Form.xml");
    let opening = "<dcscor:value xsi:type=\"dcscor:TypeLink\">";
    let start = source.find(opening).unwrap();
    let end = start + source[start..].find("</dcscor:value>").unwrap() + "</dcscor:value>".len();
    let link = source[start..end].replace("dcscor:value", "Link");
    let xml = format!(
        "<Root xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:dcscor=\"http://v8.1c.ru/8.1/data-composition-system/core\">{link}</Root>"
    );
    let imported = convert_file(entry, Direction::XmlToYaml, xml.as_bytes(), &inputs).unwrap();
    let yaml = String::from_utf8(imported.bytes).unwrap();
    assert!(yaml.contains("СвязьТипа: Поле1(2)"), "{yaml}");
    nkdk_compiled_rules::verify_candidate(entry, xml.as_bytes(), yaml.as_bytes(), &inputs).unwrap();
}

#[test]
fn dcs_metadata_type_link_distinguishes_nil_from_missing() {
    let entry = entry_id("migration.dcs-metadata-value-basic").unwrap();
    let inputs = nkdk_compiled_rules::prepare_inputs(entry, Vec::new()).unwrap();
    let xml = "<Root xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\"><Link xsi:nil=\"true\"/></Root>";
    let imported = convert_file(entry, Direction::XmlToYaml, xml.as_bytes(), &inputs).unwrap();
    let yaml = String::from_utf8(imported.bytes).unwrap();
    assert!(yaml.contains("СвязьТипа: null"), "{yaml}");
    assert!(!yaml.contains("!xml/"), "{yaml}");
    assert_valid_candidate(entry, xml.as_bytes(), yaml.as_bytes(), &inputs);
    let missing = convert_file(entry, Direction::XmlToYaml, b"<Root/>", &inputs).unwrap();
    assert!(!String::from_utf8_lossy(&missing.bytes).contains("СвязьТипа"));
    let absent = convert_file(entry, Direction::YamlToXml, b"{}", &inputs).unwrap();
    assert!(!String::from_utf8_lossy(&absent.bytes).contains("<Link"));
    let explicit = convert_file(
        entry,
        Direction::YamlToXml,
        "СвязьТипа: null".as_bytes(),
        &inputs,
    )
    .unwrap();
    nkdk_conversion_core::proof::verify(xml.as_bytes(), &explicit.bytes, |_| false).unwrap();
    let invalid = "<Root xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:dcscor=\"http://v8.1c.ru/8.1/data-composition-system/core\"><Link xsi:nil=\"true\"><dcscor:field>Поле1</dcscor:field></Link></Root>";
    let imported = convert_file(entry, Direction::XmlToYaml, invalid.as_bytes(), &inputs).unwrap();
    let yaml = String::from_utf8(imported.bytes).unwrap();
    assert!(yaml.contains("!xml/"), "{yaml}");
    assert_valid_candidate(entry, invalid.as_bytes(), yaml.as_bytes(), &inputs);
    let false_nil = xml.replace("xsi:nil=\"true\"", "xsi:nil=\"false\"");
    let imported =
        convert_file(entry, Direction::XmlToYaml, false_nil.as_bytes(), &inputs).unwrap();
    let yaml = String::from_utf8(imported.bytes).unwrap();
    assert!(yaml.contains("!xml/"), "{yaml}");
    assert_valid_candidate(entry, false_nil.as_bytes(), yaml.as_bytes(), &inputs);
}

#[test]
fn dcs_metadata_system_enumeration_uses_generated_projection() {
    let entry = entry_id("migration.dcs-metadata-value-basic").unwrap();
    let inputs = nkdk_compiled_rules::prepare_inputs(entry, Vec::new()).unwrap();
    let source =
        include_str!("../../../../e2e/fixtures/xml/cf/CommonForms/УсловноеОформление/Ext/Form.xml");
    let opening = "<dcscor:value xsi:type=\"v8ui:HorizontalAlign\">";
    let start = source.find(opening).unwrap();
    let end = start + source[start..].find("</dcscor:value>").unwrap() + "</dcscor:value>".len();
    let value = source[start..end].replace("dcscor:value", "Align");
    let xml = format!(
        "<Root xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:v8ui=\"http://v8.1c.ru/8.1/data/ui\">{value}</Root>"
    );
    let imported = convert_file(entry, Direction::XmlToYaml, xml.as_bytes(), &inputs).unwrap();
    let yaml = String::from_utf8(imported.bytes).unwrap();
    assert!(yaml.contains("Выравнивание: Центр"), "{yaml}");
    nkdk_compiled_rules::verify_candidate(entry, xml.as_bytes(), yaml.as_bytes(), &inputs).unwrap();
    let fresh = "Выравнивание: Центр";
    assert_valid_candidate(entry, xml.as_bytes(), fresh.as_bytes(), &inputs);
    for value in ["Unknown", "", "Center"] {
        for attribute in [
            "xsi:type=\"v8ui:HorizontalAlign\"",
            "xsi:type=\"v8ui:Font\"",
            "",
        ] {
            let source = format!(
                "<Root xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:v8ui=\"http://v8.1c.ru/8.1/data/ui\"><Align {attribute}>{value}</Align><Link xsi:type=\"dcscor:TypeLink\" xmlns:dcscor=\"http://v8.1c.ru/8.1/data-composition-system/core\"><dcscor:field>Поле1</dcscor:field><dcscor:linkItem>2</dcscor:linkItem></Link></Root>"
            );
            let imported = convert_file(entry, Direction::XmlToYaml, source.as_bytes(), &inputs)
                .unwrap_or_else(|errors| panic!("{value}/{attribute}: {errors:?}"));
            let yaml = String::from_utf8(imported.bytes).unwrap();
            assert!(yaml.contains("СвязьТипа: Поле1(2)"), "{yaml}");
            assert_valid_candidate(entry, source.as_bytes(), yaml.as_bytes(), &inputs);
            if value != "Center" || attribute != "xsi:type=\"v8ui:HorizontalAlign\"" {
                assert!(yaml.contains("!xml/"), "{yaml}");
            }
        }
    }
}

#[test]
fn dcs_metadata_system_enumeration_distinguishes_nil_from_missing() {
    let entry = entry_id("migration.dcs-metadata-value-basic").unwrap();
    let inputs = nkdk_compiled_rules::prepare_inputs(entry, Vec::new()).unwrap();
    let nil = br#"<Root xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><Align xsi:nil="true"/></Root>"#;
    let imported = convert_file(entry, Direction::XmlToYaml, nil, &inputs).unwrap();
    assert_eq!(
        String::from_utf8_lossy(&imported.bytes).trim(),
        "Выравнивание: null"
    );
    assert_valid_candidate(entry, nil, &imported.bytes, &inputs);
    let absent = convert_file(entry, Direction::XmlToYaml, b"<Root/>", &inputs).unwrap();
    assert!(!String::from_utf8_lossy(&absent.bytes).contains("Выравнивание"));
    assert_valid_candidate(entry, b"<Root/>", &absent.bytes, &inputs);
    let fresh = convert_file(entry, Direction::YamlToXml, b"{}", &inputs).unwrap();
    assert!(!String::from_utf8_lossy(&fresh.bytes).contains("<Align"));
    for align in [
        "<Align xsi:nil=\"false\"/>",
        "<Align xsi:nil=\"true\" xsi:type=\"v8ui:HorizontalAlign\"/>",
        "<Align xsi:nil=\"true\">Center</Align>",
    ] {
        let xml = format!(
            "<Root xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:v8ui=\"http://v8.1c.ru/8.1/data/ui\" xmlns:dcscor=\"http://v8.1c.ru/8.1/data-composition-system/core\">{align}<Field xsi:type=\"dcscor:Field\">Ссылка</Field></Root>"
        );
        let imported = convert_file(entry, Direction::XmlToYaml, xml.as_bytes(), &inputs).unwrap();
        let yaml = String::from_utf8(imported.bytes).unwrap();
        assert!(yaml.contains("Поле: Ссылка"), "{align}: {yaml}");
        assert!(yaml.contains("!xml/"), "{align}: {yaml}");
        assert_valid_candidate(entry, xml.as_bytes(), yaml.as_bytes(), &inputs);
    }
}

#[test]
fn dcs_folders_and_items_use_reuses_the_nullable_enumeration_projection() {
    let entry = entry_id("migration.dcs-metadata-value-basic").unwrap();
    let inputs = nkdk_compiled_rules::prepare_inputs(entry, Vec::new()).unwrap();
    let source = include_str!(
        "../../../../packages/rules/metadata/commonObjects/dataCompositionSystem/dcsParameter/__fixtures__/full.xml"
    );
    let original = "<dcscor:value xsi:type=\"ent:FoldersAndItemsUse\">Items</dcscor:value>";
    assert!(source.contains(original));
    let xml = format!(
        "<Root xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:ent=\"http://v8.1c.ru/8.1/data/enterprise\">{}</Root>",
        original.replace("dcscor:value", "Folders")
    );
    let imported = convert_file(entry, Direction::XmlToYaml, xml.as_bytes(), &inputs).unwrap();
    assert_eq!(
        String::from_utf8_lossy(&imported.bytes).trim(),
        "ГруппыИЭлементы: Элементы"
    );
    assert_valid_candidate(entry, xml.as_bytes(), &imported.bytes, &inputs);
    let nil = br#"<Root xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><Folders xsi:nil="true"/></Root>"#;
    let imported = convert_file(entry, Direction::XmlToYaml, nil, &inputs).unwrap();
    assert_eq!(
        String::from_utf8_lossy(&imported.bytes).trim(),
        "ГруппыИЭлементы: null"
    );
    assert_valid_candidate(entry, nil, &imported.bytes, &inputs);
}

fn assert_nil_value(id: &str, element: &str, property: &str, inputs: &PreparedInputs) {
    let entry = entry_id(id).unwrap();
    let xml = format!(
        "<Root xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\"><{element} xsi:nil=\"true\"/></Root>"
    );
    let yaml = format!("{property}: null");
    let imported = convert_file(entry, Direction::XmlToYaml, xml.as_bytes(), inputs).unwrap();
    assert_eq!(String::from_utf8_lossy(&imported.bytes).trim(), yaml);
    assert_valid_candidate(entry, xml.as_bytes(), yaml.as_bytes(), inputs);
    let absent = convert_file(entry, Direction::XmlToYaml, b"<Root/>", inputs).unwrap();
    assert!(
        absent.bytes.is_empty(),
        "{}",
        String::from_utf8_lossy(&absent.bytes)
    );
    assert_valid_candidate(entry, b"<Root/>", b"{}", inputs);
}

#[test]
fn dcs_color_uses_the_common_declaration_with_its_xml_type() {
    let entry = entry_id("migration.dcs-metadata-color").unwrap();
    let inputs = nkdk_compiled_rules::prepare_inputs(entry, Vec::new()).unwrap();
    assert_nil_value("migration.dcs-metadata-color", "Color", "Цвет", &inputs);
    for (value, expected) in [("web:Red", "Цвет: Красный"), ("#oops", "!xml/invalid")] {
        let xml = format!(
            "<Root xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:v8ui=\"http://v8.1c.ru/8.1/data/ui\"><Color xsi:type=\"v8ui:Color\">{value}</Color></Root>"
        );
        let imported = convert_file(entry, Direction::XmlToYaml, xml.as_bytes(), &inputs).unwrap();
        let yaml = String::from_utf8(imported.bytes).unwrap();
        assert!(yaml.contains(expected), "{yaml}");
        nkdk_compiled_rules::verify_candidate(entry, xml.as_bytes(), yaml.as_bytes(), &inputs)
            .unwrap();
    }
}

#[test]
fn dcs_font_reuses_the_common_font_with_a_declared_xml_type() {
    let (entry, inputs) = style_item_inputs("migration.dcs-metadata-font", &[]);
    assert_nil_value("migration.dcs-metadata-font", "Font", "Шрифт", &inputs);
    let fragment = include_str!(
        "../../../../packages/rules/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/__fixtures__/font.xml"
    )
    .replace("dcscor:value", "Font");
    let xml = format!(
        "<Root xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:v8ui=\"http://v8.1c.ru/8.1/data/ui\">{fragment}</Root>"
    );
    let imported = convert_file(entry, Direction::XmlToYaml, xml.as_bytes(), &inputs).unwrap();
    let yaml = String::from_utf8(imported.bytes).unwrap();
    assert!(yaml.contains("ОченьКрупныйШрифтТекста"), "{yaml}");
    assert!(!yaml.contains("!xml/"), "{yaml}");
    assert_valid_candidate(entry, xml.as_bytes(), yaml.as_bytes(), &inputs);

    let fresh = "Шрифт:\n  Вид: ОченьКрупныйШрифтТекста\n";
    let exported = convert_file(entry, Direction::YamlToXml, fresh.as_bytes(), &inputs).unwrap();
    let restored = String::from_utf8(exported.bytes).unwrap();
    assert!(
        restored.contains("type=\"") && restored.contains(":Font\""),
        "{restored}"
    );
    assert!(
        restored.contains("ref=\"style:ExtraLargeTextFont\""),
        "{restored}"
    );

    let invalid = xml.replace("kind=\"StyleItem\"", "kind=\"StyleItem\" bold=\"oops\"");
    preserved_raw_yaml(entry, &invalid, &inputs);
    preserved_raw_yaml(entry, &xml.replace(" xsi:type=\"v8ui:Font\"", ""), &inputs);
    preserved_raw_yaml(
        entry,
        &xml.replace("xsi:type=\"v8ui:Font\"", "xsi:type=\"v8ui:Color\""),
        &inputs,
    );
}

#[test]
fn dcs_formatted_local_string_uses_declarations_in_both_directions() {
    let entry = entry_id("migration.dcs-design-time-formatted-text").unwrap();
    let inputs = dcs_language_inputs(entry, &["ru", "en"]);
    let source =
        include_str!("../../../../e2e/fixtures/xml/cf/CommonForms/УсловноеОформление/Ext/Form.xml");
    let opening = "<dcscor:value xsi:type=\"v8:LocalFormattedStringType\">";
    let start = source.find(opening).unwrap();
    let end = start + source[start..].find("</dcscor:value>").unwrap() + "</dcscor:value>".len();
    let fragment = source[start..end].replace("dcscor:value", "Value");
    let xml = format!(
        "<Root xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:v8=\"http://v8.1c.ru/8.1/data/core\">{fragment}</Root>"
    );
    let imported = convert_file(entry, Direction::XmlToYaml, xml.as_bytes(), &inputs).unwrap();
    let yaml = String::from_utf8(imported.bytes).unwrap();
    assert!(yaml.contains("МногоязычнаяФорматированнаяСтрока"), "{yaml}");
    assert!(
        yaml.contains("Многоязычная форматированная строка"),
        "{yaml}"
    );
    assert!(!yaml.contains("!xml/"), "{yaml}");
    assert_valid_candidate(entry, xml.as_bytes(), yaml.as_bytes(), &inputs);

    let fresh = "Значение:\n  Тип: МногоязычнаяФорматированнаяСтрока\n  Значение:\n    Форматированный: Истина\n    Текст: Многоязычная форматированная строка\n";
    let exported = convert_file(entry, Direction::YamlToXml, fresh.as_bytes(), &inputs).unwrap();
    let restored = String::from_utf8(exported.bytes).unwrap();
    assert!(
        restored.contains(":LocalFormattedStringType\""),
        "{restored}"
    );
    assert!(
        restored.contains("<n0:formatted>true</n0:formatted>")
            || restored.contains("<n1:formatted>true</n1:formatted>"),
        "{restored}"
    );

    let invalid = xml.replace(
        "<v8:formatted>true</v8:formatted>",
        "<v8:formatted>maybe</v8:formatted>",
    );
    preserved_raw_yaml(entry, &invalid, &inputs);
}

#[test]
fn dcs_local_string_type_uses_the_same_declared_choice_for_real_xml() {
    let entry = entry_id("migration.dcs-local-string-type").unwrap();
    let inputs = dcs_language_inputs(entry, &["ru", "en"]);
    let corpus = [
        (
            include_str!(
                "../../../../e2e/fixtures/xml/cf/Reports/ОтчетСКД/Templates/ОсновнаяСхемаКомпоновкиДанных/Ext/Template.xml"
            ),
            "<dcsset:presentation xsi:type=\"xs:string\">",
            "</dcsset:presentation>",
            "!xml/string",
        ),
        (
            include_str!(
                "../../../../e2e/fixtures/xml/cf/CommonForms/ДинамическийСписок/Ext/Form.xml"
            ),
            "<dcssch:title xsi:type=\"v8:LocalStringType\">",
            "</dcssch:title>",
            "Заголовок:",
        ),
    ];
    for (source, open, close, expected) in corpus {
        let start = source.find(open).expect("real DCS value");
        let end = start + source[start..].find(close).unwrap() + close.len();
        let fragment = source[start..end]
            .replacen(
                open,
                &open
                    .replace("dcsset:presentation", "Title")
                    .replace("dcssch:title", "Title"),
                1,
            )
            .replace(close, "</Title>");
        let xml = format!(
            "<Root xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:xs=\"http://www.w3.org/2001/XMLSchema\" xmlns:v8=\"http://v8.1c.ru/8.1/data/core\">{fragment}</Root>"
        );
        let result = convert_file(entry, Direction::XmlToYaml, xml.as_bytes(), &inputs).unwrap();
        let yaml = String::from_utf8(result.bytes).unwrap();
        assert!(yaml.contains(expected), "{yaml}");
        assert_valid_candidate(entry, xml.as_bytes(), yaml.as_bytes(), &inputs);
    }
    for (yaml, expected) in [
        ("Заголовок: !xml/string Текст\n", "string"),
        ("Заголовок: Текст\n", "LocalStringType"),
        ("Заголовок:\n  ru: Текст\n  en: Text\n", "LocalStringType"),
    ] {
        let converted =
            convert_file(entry, Direction::YamlToXml, yaml.as_bytes(), &inputs).unwrap();
        let xml = String::from_utf8(converted.bytes).unwrap();
        assert!(xml.contains(expected), "{yaml}: {xml}");
        if expected == "LocalStringType" {
            let expected_items = if yaml.contains("en: Text") { 2 } else { 1 };
            assert_eq!(
                xml.matches(":item>").count() / 2,
                expected_items,
                "{yaml}: {xml}"
            );
        }
        let imported = convert_file(entry, Direction::XmlToYaml, xml.as_bytes(), &inputs)
            .unwrap_or_else(|errors| panic!("{yaml}: {errors:?}"));
        assert_valid_candidate(entry, xml.as_bytes(), &imported.bytes, &inputs);
    }
    let untyped = [
        "Текст",
        "<v8:item><v8:lang>ru</v8:lang><v8:content>Текст</v8:content></v8:item>",
    ]
    .map(|body| {
        (
            format!(
                "<Root xmlns:v8=\"http://v8.1c.ru/8.1/data/core\"><Title>{body}</Title></Root>"
            ),
            "!xml/raw",
            true,
        )
    });
    let typed = [
        ("<Title/>", "!xml/raw"),
        ("<Title xsi:type=\"xs:string\"/>", "!xml/string"),
        ("<Title xsi:type=\"v8:LocalStringType\"/>", "!xml/raw"),
        ("<Title xsi:type=\"xs:integer\">Текст</Title>", "!xml/raw"),
    ]
    .map(|(body, marker)| {
        (
            format!("<Root xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:xs=\"http://www.w3.org/2001/XMLSchema\" xmlns:v8=\"http://v8.1c.ru/8.1/data/core\">{body}</Root>"),
            marker,
            false,
        )
    });
    for (xml, expected_marker, semantic) in untyped.into_iter().chain(typed) {
        let imported = convert_file(entry, Direction::XmlToYaml, xml.as_bytes(), &inputs)
            .unwrap_or_else(|errors| panic!("{xml}: {errors:?}"));
        let yaml = String::from_utf8(imported.bytes).unwrap();
        assert!(yaml.contains(expected_marker), "{xml}: {yaml}");
        if semantic {
            assert!(yaml.contains("$значение"), "{yaml}");
        }
        assert_valid_candidate(entry, xml.as_bytes(), yaml.as_bytes(), &inputs);
    }
}
