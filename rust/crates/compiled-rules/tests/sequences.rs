use nkdk_compiled_rules::{
    Direction, InputValue, PreparedInputs, convert_file, entry_id, prepare_inputs, validate_file,
    verify_candidate,
};
use nkdk_compiled_rules_probes as nkdk_compiled_rules;

fn metadata_value_inputs(entry: nkdk_compiled_rules::EntryId) -> PreparedInputs {
    prepare_inputs(
        entry,
        vec![
            ("defaultLanguage".into(), InputValue::Text("ru".into())),
            (
                "registeredLanguages".into(),
                InputValue::Sequence(vec![
                    InputValue::Text("ru".into()),
                    InputValue::Text("en".into()),
                ]),
            ),
        ],
    )
    .unwrap()
}

#[test]
fn typed_choice_default_restores_xml_without_reference() {
    let entry = entry_id("probe.choice-default").unwrap();
    let inputs = PreparedInputs::default();
    let xml = br#"<Root xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xs="http://www.w3.org/2001/XMLSchema"><Value xsi:type="xs:decimal">0</Value></Root>"#;
    let yaml = convert_file(entry, Direction::XmlToYaml, xml, &inputs).unwrap();
    assert!(!String::from_utf8_lossy(&yaml.bytes).contains("Значение:"));
    verify_candidate(entry, xml, &yaml.bytes, &inputs).unwrap();
    let restored = convert_file(entry, Direction::YamlToXml, &yaml.bytes, &inputs).unwrap();
    assert!(String::from_utf8_lossy(&restored.bytes).contains(">0</Value>"));
}

#[test]
fn fill_value_keeps_explicit_zero_distinct_from_nil() {
    let entry = entry_id("common.fill-value-profile").unwrap();
    let inputs = metadata_value_inputs(entry);
    let xml = convert_file(
        entry,
        Direction::YamlToXml,
        "Тип: Число".as_bytes(),
        &inputs,
    )
    .unwrap();
    assert!(String::from_utf8_lossy(&xml.bytes).contains(":nil=\"true\""));
    let yaml = convert_file(entry, Direction::XmlToYaml, &xml.bytes, &inputs).unwrap();
    assert!(!String::from_utf8_lossy(&yaml.bytes).contains("Значение:"));
    verify_candidate(entry, &xml.bytes, &yaml.bytes, &inputs).unwrap();
    let explicit = convert_file(
        entry,
        Direction::YamlToXml,
        "Тип: Число\nЗначение: 0".as_bytes(),
        &inputs,
    )
    .unwrap();
    let explicit_yaml =
        convert_file(entry, Direction::XmlToYaml, &explicit.bytes, &inputs).unwrap();
    assert!(String::from_utf8_lossy(&explicit_yaml.bytes).contains("Значение: 0"));
    verify_candidate(entry, &explicit.bytes, &explicit_yaml.bytes, &inputs).unwrap();
}

#[test]
fn fill_value_default_uses_type_only_for_empty_string() {
    let entry = entry_id("common.fill-value-profile").unwrap();
    for (type_name, expected_type) in [
        ("Число", None),
        ("ДатаВремя", None),
        ("Строка", Some("string")),
    ] {
        let inputs = metadata_value_inputs(entry);
        let yaml = format!("Тип: {type_name}");
        let xml = convert_file(entry, Direction::YamlToXml, yaml.as_bytes(), &inputs).unwrap();
        let restored = String::from_utf8_lossy(&xml.bytes);
        if let Some(expected_type) = expected_type {
            assert!(restored.contains(expected_type), "{restored}");
        } else {
            assert!(restored.contains(":nil=\"true\""), "{restored}");
        }
        let roundtrip = convert_file(entry, Direction::XmlToYaml, &xml.bytes, &inputs).unwrap();
        assert!(!String::from_utf8_lossy(&roundtrip.bytes).contains("Значение:"));
        verify_candidate(entry, &xml.bytes, &roundtrip.bytes, &inputs).unwrap();
    }
}

#[test]
fn structured_choice_does_not_invent_a_default_for_composite_or_boolean_types() {
    let entry = entry_id("common.fill-value-profile").unwrap();
    let inputs = metadata_value_inputs(entry);
    for yaml in ["Тип: Булево", "Тип:\n  - Число\n  - Строка"] {
        let xml = convert_file(entry, Direction::YamlToXml, yaml.as_bytes(), &inputs).unwrap();
        let output = String::from_utf8_lossy(&xml.bytes);
        assert!(!output.contains("dateTime"), "{output}");
        assert!(
            output.contains("<Value ") && output.contains(":nil=\"true\""),
            "{output}"
        );
        let imported = convert_file(entry, Direction::XmlToYaml, &xml.bytes, &inputs).unwrap();
        assert!(!String::from_utf8_lossy(&imported.bytes).contains("!xml/raw"));
        verify_candidate(entry, &xml.bytes, yaml.as_bytes(), &inputs).unwrap();
    }
}

fn assert_corpus_source_unchanged(case: &serde_json::Value) {
    let relative = case["source"].as_str().unwrap();
    let source_path = std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
        .ancestors()
        .nth(3)
        .unwrap()
        .join(relative);
    let source = std::fs::read(source_path).unwrap();
    let start = case["start"].as_u64().unwrap() as usize;
    let end = start + case["original"].as_str().unwrap().len();
    assert_eq!(
        source.get(start..end),
        Some(case["original"].as_str().unwrap().as_bytes()),
        "corpus source changed: {relative}"
    );
}

fn verify_corpus_case(
    entry: nkdk_compiled_rules::EntryId,
    case: &serde_json::Value,
    inputs: &PreparedInputs,
) {
    let xml = case["xml"].as_str().unwrap().as_bytes();
    let expected = case["yaml"].as_str().unwrap().as_bytes();
    let source = &case["source"];
    let converted = convert_file(entry, Direction::XmlToYaml, xml, inputs)
        .unwrap_or_else(|error| panic!("{source}: {error:?}"));
    assert_eq!(converted.bytes, expected, "{source}");
    verify_candidate(entry, xml, expected, inputs)
        .unwrap_or_else(|error| panic!("{source}: {error:?}"));
}

fn verify_empty_collection_variants(entry: nkdk_compiled_rules::EntryId, element: &str) {
    let inputs = PreparedInputs::default();
    for xml in [format!("<Root><{element}/></Root>"), "<Root/>".into()] {
        let converted = convert_file(entry, Direction::XmlToYaml, xml.as_bytes(), &inputs).unwrap();
        verify_candidate(entry, xml.as_bytes(), &converted.bytes, &inputs).unwrap();
    }
}

#[test]
fn metadata_value_derives_the_empty_xml_form_from_the_sibling_type() {
    let entry = entry_id("migration.metadata-value").unwrap();
    let inputs = metadata_value_inputs(entry);
    let string_xml = b"<Root xmlns:v8=\"http://v8.1c.ru/8.1/data/core\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:xs=\"http://www.w3.org/2001/XMLSchema\"><Type><v8:Type>xs:string</v8:Type></Type><FillValue xsi:type=\"xs:string\"/></Root>";
    let number_xml = b"<Root xmlns:v8=\"http://v8.1c.ru/8.1/data/core\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:xs=\"http://www.w3.org/2001/XMLSchema\"><Type><v8:Type>xs:decimal</v8:Type></Type><FillValue xsi:nil=\"true\"/></Root>";
    for xml in [string_xml.as_slice(), number_xml.as_slice()] {
        let converted = convert_file(entry, Direction::XmlToYaml, xml, &inputs).unwrap();
        verify_candidate(entry, xml, &converted.bytes, &inputs).unwrap();
        assert!(
            !String::from_utf8_lossy(&converted.bytes).contains("Значение:"),
            "{}",
            String::from_utf8_lossy(&converted.bytes)
        );
    }
}

#[test]
fn metadata_value_restores_absent_fill_value_from_declared_type_without_reference() {
    let entry = entry_id("migration.metadata-value").unwrap();
    let inputs = metadata_value_inputs(entry);
    for (yaml, string_only) in [
        ("Тип: Строка", true),
        ("Тип: ФиксированнаяСтрока(3)", true),
        ("Тип: Число", false),
        ("Тип:\n  -\n    Строка\n  -\n    Число", false),
    ] {
        let exported = convert_file(entry, Direction::YamlToXml, yaml.as_bytes(), &inputs).unwrap();
        let xml = String::from_utf8_lossy(&exported.bytes);
        let tag = xml
            .split("<FillValue")
            .nth(1)
            .and_then(|tail| tail.split('>').next())
            .expect("FillValue element");
        let typed_string = tag.contains(":type=\"") && tag.contains(":string\"");
        let nil = tag.contains(":nil=\"true\"");
        if string_only {
            assert!(typed_string && !nil, "{xml}");
        } else {
            assert!(nil && !typed_string, "{xml}");
        }
        verify_candidate(entry, &exported.bytes, yaml.as_bytes(), &inputs).unwrap();
    }
}

#[test]
fn metadata_value_selects_declared_scalar_and_structured_forms() {
    let entry = entry_id("migration.metadata-value-full").unwrap();
    let inputs = metadata_value_inputs(entry);
    let cases: &[(&str, &str)] = &[
        (
            "<Root xmlns:v8=\"http://v8.1c.ru/8.1/data/core\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:xs=\"http://www.w3.org/2001/XMLSchema\"><FillValue xsi:type=\"xs:string\">11</FillValue></Root>",
            "Значение: \"11\"",
        ),
        (
            "<Root xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:xs=\"http://www.w3.org/2001/XMLSchema\"><FillValue xsi:type=\"xs:decimal\">9007199254740993.25</FillValue></Root>",
            "Значение: 9007199254740993.25",
        ),
        (
            "<Root xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:xs=\"http://www.w3.org/2001/XMLSchema\"><FillValue xsi:type=\"xs:boolean\">true</FillValue></Root>",
            "Значение: Истина",
        ),
        (
            "<Root xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:xs=\"http://www.w3.org/2001/XMLSchema\"><FillValue xsi:type=\"xs:dateTime\">2025-12-24T12:00:00</FillValue></Root>",
            "Значение: 24.12.2025 12:00:00",
        ),
        (
            "<Root xmlns:v8=\"http://v8.1c.ru/8.1/data/core\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\"><FillValue xsi:type=\"v8:StandardPeriod\"><v8:variant xsi:type=\"v8:StandardPeriodVariant\">Custom</v8:variant><v8:startDate>0001-01-01T00:00:00</v8:startDate><v8:endDate>0001-01-01T00:00:00</v8:endDate></FillValue></Root>",
            "Значение:\n  Вариант: ПроизвольныйПериод\n  ДатаНачала: 01.01.0001 00:00:00\n  ДатаОкончания: 01.01.0001 00:00:00",
        ),
        (
            "<Root xmlns:xr=\"http://v8.1c.ru/8.3/xcf/readable\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\"><FillValue xsi:type=\"xr:DesignTimeRef\">Enum.ВидыДоговоров.EnumValue.СПоставщиком</FillValue></Root>",
            "Значение: Перечисление.ВидыДоговоров.СПоставщиком",
        ),
        (
            "<Root xmlns:xr=\"http://v8.1c.ru/8.3/xcf/readable\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\"><FillValue xsi:type=\"xr:DesignTimeRef\"/></Root>",
            "Значение: .",
        ),
        (
            "<Root xmlns:xr=\"http://v8.1c.ru/8.3/xcf/readable\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\"><FillValue xsi:type=\"xr:ValueList\"/></Root>",
            "Значение: СписокЗначений",
        ),
        (
            "<Root xmlns:ent=\"http://v8.1c.ru/8.1/data/enterprise\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\"><FillValue xsi:type=\"ent:ComparisonType\">Equal</FillValue></Root>",
            "Значение:\n  Тип: ВидСравнения\n  Значение: Равно",
        ),
        (
            "<Root xmlns:ent=\"http://v8.1c.ru/8.1/data/enterprise\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\"><FillValue xsi:type=\"ent:AccountType\">ActivePassive</FillValue></Root>",
            "Значение:\n  Тип: ВидСчета\n  Значение: АктивноПассивный",
        ),
        (
            "<Root xmlns:dcsset=\"http://v8.1c.ru/8.1/data-composition-system/settings\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\"><FillValue xsi:type=\"dcsset:DataCompositionComparisonType\">NotEqual</FillValue></Root>",
            "Значение:\n  Тип: ВидСравненияКомпоновкиДанных\n  Значение: НеРавно",
        ),
        (
            "<Root xmlns:v8=\"http://v8.1c.ru/8.1/data/core\" xmlns:xs=\"http://www.w3.org/2001/XMLSchema\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\"><FillValue xsi:type=\"v8:FixedArray\"><v8:Value xsi:type=\"xs:string\">11</v8:Value><v8:Value xsi:nil=\"true\"/><v8:Value xsi:type=\"xs:boolean\">true</v8:Value></FillValue></Root>",
            "Значение:\n  - \"11\"\n  -\n  - Истина",
        ),
        (
            "<Root xmlns:v8=\"http://v8.1c.ru/8.1/data/core\" xmlns:xr=\"http://v8.1c.ru/8.3/xcf/readable\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\"><FillValue xsi:type=\"v8:FixedArray\"><v8:Value xsi:type=\"FormChoiceListDesTimeValue\"><Presentation><v8:item><v8:lang>ru</v8:lang><v8:content>Физическое лицо</v8:content></v8:item></Presentation><Value xsi:type=\"xr:DesignTimeRef\">Enum.ТипыДоговоров.EnumValue.СПоставщиком</Value></v8:Value></FillValue></Root>",
            "Значение:\n  -\n    Тип: ЗначениеСпискаВыбора\n    Представление: Физическое лицо\n    Значение: Перечисление.ТипыДоговоров.СПоставщиком",
        ),
        (
            "<Root xmlns:v8=\"http://v8.1c.ru/8.1/data/core\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:xs=\"http://www.w3.org/2001/XMLSchema\"><FillValue xsi:type=\"FormChoiceListDesTimeValue\"><Presentation><v8:item><v8:lang>ru</v8:lang><v8:content>Физическое лицо</v8:content></v8:item></Presentation><Value xsi:type=\"xs:string\">ФЛ</Value></FillValue></Root>",
            "Значение:\n  Представление: Физическое лицо\n  Значение: ФЛ",
        ),
    ];
    for (xml, yaml) in cases {
        let converted = convert_file(entry, Direction::XmlToYaml, xml.as_bytes(), &inputs)
            .unwrap_or_else(|error| panic!("{xml}: {error:?}"));
        assert_eq!(String::from_utf8_lossy(&converted.bytes), *yaml);
        verify_candidate(entry, xml.as_bytes(), &converted.bytes, &inputs).unwrap();
    }
}

#[test]
fn metadata_value_exports_every_declared_form_without_an_xml_reference() {
    let entry = entry_id("migration.metadata-value-full").unwrap();
    let inputs = metadata_value_inputs(entry);
    let cases: &[(&str, (&str, &str))] = &[
        (
            "Значение: \"11\"",
            ("http://www.w3.org/2001/XMLSchema", "string"),
        ),
        (
            "Значение: 9007199254740993.25",
            ("http://www.w3.org/2001/XMLSchema", "decimal"),
        ),
        (
            "Значение: Истина",
            ("http://www.w3.org/2001/XMLSchema", "boolean"),
        ),
        (
            "Значение: 24.12.2025 12:00:00",
            ("http://www.w3.org/2001/XMLSchema", "dateTime"),
        ),
        (
            "Значение: Перечисление.ВидыДоговоров.СПоставщиком",
            ("http://v8.1c.ru/8.3/xcf/readable", "DesignTimeRef"),
        ),
        (
            "Значение: .",
            ("http://v8.1c.ru/8.3/xcf/readable", "DesignTimeRef"),
        ),
        (
            "Значение: СписокЗначений",
            ("http://v8.1c.ru/8.3/xcf/readable", "ValueList"),
        ),
        (
            "Значение:\n  Тип: ВидСравнения\n  Значение: Равно",
            ("http://v8.1c.ru/8.1/data/enterprise", "ComparisonType"),
        ),
        (
            "Значение:\n  Тип: ВидСчета\n  Значение: АктивноПассивный",
            ("http://v8.1c.ru/8.1/data/enterprise", "AccountType"),
        ),
        (
            "Значение:\n  Тип: ВидСравненияКомпоновкиДанных\n  Значение: НеРавно",
            (
                "http://v8.1c.ru/8.1/data-composition-system/settings",
                "DataCompositionComparisonType",
            ),
        ),
        (
            "Значение:\n  - \"11\"\n  -\n  - Истина",
            ("http://v8.1c.ru/8.1/data/core", "FixedArray"),
        ),
        (
            "Значение:\n  Представление: Физическое лицо\n  Значение: ФЛ",
            ("", "FormChoiceListDesTimeValue"),
        ),
        (
            "Значение:\n  Вариант: ПроизвольныйПериод\n  ДатаНачала: 01.01.0001 00:00:00\n  ДатаОкончания: 01.01.0001 00:00:00",
            ("http://v8.1c.ru/8.1/data/core", "StandardPeriod"),
        ),
    ];
    for (yaml, expected_type) in cases {
        let exported = convert_file(entry, Direction::YamlToXml, yaml.as_bytes(), &inputs)
            .unwrap_or_else(|error| panic!("{yaml}: {error:?}"));
        let mut actual_type = None;
        nkdk_conversion_core::xml::visit(&exported.bytes, |path, token| {
            if path.last().is_some_and(|name| name.local == "FillValue")
                && let nkdk_conversion_core::xml::Token::Attribute(attribute) = token
                && attribute.name.namespace == "http://www.w3.org/2001/XMLSchema-instance"
                && attribute.name.local == "type"
            {
                actual_type = attribute.qname.map(|name| (name.namespace, name.local));
            }
            Ok(())
        })
        .unwrap();
        assert_eq!(
            actual_type
                .as_ref()
                .map(|name| (name.0.as_str(), name.1.as_str())),
            Some(*expected_type),
            "{yaml}: {}",
            String::from_utf8_lossy(&exported.bytes)
        );
        let imported = convert_file(entry, Direction::XmlToYaml, &exported.bytes, &inputs)
            .unwrap_or_else(|error| {
                panic!("{}: {error:?}", String::from_utf8_lossy(&exported.bytes))
            });
        assert_eq!(String::from_utf8_lossy(&imported.bytes), *yaml);
    }
}

#[test]
fn metadata_value_preserves_unrepresentable_xml_variants_as_inferred_anomalies() {
    let entry = entry_id("migration.metadata-value-full").unwrap();
    let inputs = metadata_value_inputs(entry);
    for xml in [
        "<Root xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:q=\"urn:unknown\"><FillValue xsi:type=\"q:FutureValue\">payload</FillValue></Root>",
        "<Root xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:q=\"urn:unknown\"><FillValue xsi:type=\"q:FutureValue\"><q:Payload>payload</q:Payload></FillValue></Root>",
        "<Root xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:xr=\"http://v8.1c.ru/8.3/xcf/readable\"><FillValue xsi:type=\"xr:MDObjectRef\">Catalog.Products</FillValue></Root>",
        "<Root xmlns:app=\"http://v8.1c.ru/8.2/managed-application/core\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\"><FillValue xsi:type=\"app:ApplicationUsePurpose\">PlatformApplication</FillValue></Root>",
        "<Root xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:v8=\"http://v8.1c.ru/8.1/data/core\"><FillValue xsi:type=\"v8:Type\">xs:string</FillValue></Root>",
        "<Root xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:v8=\"http://v8.1c.ru/8.1/data/core\"><FillValue xsi:type=\"v8:UUID\">12345678-1234-1234-1234-123456789abc</FillValue></Root>",
        "<Root xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:xs=\"http://www.w3.org/2001/XMLSchema\"><FillValue xsi:type=\"xs:boolean\">maybe</FillValue></Root>",
        "<Root xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:xs=\"http://www.w3.org/2001/XMLSchema\"><FillValue xsi:type=\"xs:decimal\">NaN</FillValue></Root>",
        "<Root xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:xs=\"http://www.w3.org/2001/XMLSchema\"><FillValue xsi:type=\"xs:dateTime\">2026-02-30T12:00:00</FillValue></Root>",
    ] {
        let converted = convert_file(entry, Direction::XmlToYaml, xml.as_bytes(), &inputs)
            .unwrap_or_else(|error| panic!("{xml}: {error:?}"));
        assert!(
            String::from_utf8_lossy(&converted.bytes).contains("!xml/"),
            "{xml}: {}",
            String::from_utf8_lossy(&converted.bytes)
        );
        verify_candidate(entry, xml.as_bytes(), &converted.bytes, &inputs).unwrap();
    }
}

#[test]
fn metadata_value_covers_every_scalar_and_absent_e2e_form() {
    let corpus: serde_json::Value = serde_json::from_slice(include_bytes!(
        "../../../../tests/migration/metadata-value-e2e.json"
    ))
    .unwrap();
    assert_eq!(corpus["count"], 879);
    let cases = corpus["cases"].as_array().unwrap();
    assert_eq!(cases.len(), 17);
    for case in cases {
        assert_corpus_source_unchanged(case);
        let name = if case["original"]
            .as_str()
            .unwrap()
            .contains("xsi:nil=\"true\"")
        {
            "migration.metadata-value-nil"
        } else {
            "migration.metadata-value-full"
        };
        let entry = entry_id(name).unwrap();
        let inputs = metadata_value_inputs(entry);
        verify_corpus_case(entry, case, &inputs);
    }
}

#[test]
fn metadata_value_typed_empty_string_is_ordinary_absence() {
    let corpus: serde_json::Value = serde_json::from_slice(include_bytes!(
        "../../../../tests/migration/metadata-value-e2e.json"
    ))
    .unwrap();
    let case = &corpus["cases"][12];
    assert_corpus_source_unchanged(case);
    assert_eq!(case["original"], "<FillValue xsi:type=\"xs:string\"/>");
    let entry = entry_id("migration.metadata-value-full").unwrap();
    let inputs = metadata_value_inputs(entry);
    let xml = case["xml"].as_str().unwrap().as_bytes();
    let imported = convert_file(entry, Direction::XmlToYaml, xml, &inputs).unwrap();
    assert!(
        imported.bytes.is_empty(),
        "{}",
        String::from_utf8_lossy(&imported.bytes)
    );
    verify_candidate(entry, xml, &imported.bytes, &inputs).unwrap();
}

#[test]
fn choice_parameters_use_a_keyed_yaml_mapping_for_declared_values() {
    let entry = entry_id("migration.choice-parameters").unwrap();
    let inputs = metadata_value_inputs(entry);
    let xml = b"<Root xmlns:app=\"http://v8.1c.ru/8.2/managed-application/core\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:xs=\"http://www.w3.org/2001/XMLSchema\"><ChoiceParameters><app:item name=\"Text\"><app:value xsi:type=\"xs:string\">value</app:value></app:item></ChoiceParameters></Root>";
    let converted = convert_file(entry, Direction::XmlToYaml, xml, &inputs).unwrap();
    assert_eq!(
        String::from_utf8_lossy(&converted.bytes),
        "Параметры:\n  Text: value"
    );
    verify_candidate(entry, xml, &converted.bytes, &inputs).unwrap();

    let empty = b"<Root xmlns:app=\"http://v8.1c.ru/8.2/managed-application/core\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\"><ChoiceParameters><app:item name=\"Missing\"><app:value xsi:nil=\"true\"/></app:item></ChoiceParameters></Root>";
    let converted = convert_file(entry, Direction::XmlToYaml, empty, &inputs).unwrap();
    assert_eq!(
        String::from_utf8_lossy(&converted.bytes),
        "Параметры:\n  Missing:\n    {}"
    );
    verify_candidate(entry, empty, &converted.bytes, &inputs).unwrap();
}

#[test]
fn choice_parameter_links_are_structural_and_reversible() {
    let entry = entry_id("migration.choice-parameter-links").unwrap();
    let inputs = PreparedInputs::default();
    let xml = b"<Root xmlns:xr=\"http://v8.1c.ru/8.3/xcf/readable\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:xs=\"http://www.w3.org/2001/XMLSchema\"><ChoiceParameterLinks><xr:Link><xr:Name>Filter.Owner</xr:Name><xr:DataPath xsi:type=\"xs:string\">Catalog.Goods.Attribute.Owner</xr:DataPath><xr:ValueChange>DontChange</xr:ValueChange></xr:Link></ChoiceParameterLinks></Root>";
    let yaml = "Связи:\n  - Имя: Filter.Owner\n    ПутьКДанным: Справочник.Goods.Реквизит.Owner\n    РежимИзменения: НеИзменять";
    let converted = convert_file(entry, Direction::XmlToYaml, xml, &inputs).unwrap();
    assert_eq!(String::from_utf8_lossy(&converted.bytes), yaml);
    verify_candidate(entry, xml, &converted.bytes, &inputs).unwrap();
    verify_empty_collection_variants(entry, "ChoiceParameterLinks");
}

#[test]
fn metadata_fields_convert_each_path_and_preserve_empty_containers() {
    let entry = entry_id("migration.metadata-fields").unwrap();
    let inputs = PreparedInputs::default();
    let xml = "<Root xmlns:xr=\"http://v8.1c.ru/8.3/xcf/readable\"><DataLockFields><xr:Field>Document.ДокументВсеСвойства.StandardAttribute.Number</xr:Field><xr:Field>Document.ДокументВсеСвойства.StandardAttribute.Date</xr:Field></DataLockFields></Root>".as_bytes();
    let converted = convert_file(entry, Direction::XmlToYaml, xml, &inputs).unwrap();
    assert_eq!(
        String::from_utf8_lossy(&converted.bytes),
        "ПоляБлокировкиДанных:\n  - Документ.ДокументВсеСвойства.СтандартныйРеквизит.Номер\n  - Документ.ДокументВсеСвойства.СтандартныйРеквизит.Дата"
    );
    verify_candidate(entry, xml, &converted.bytes, &inputs).unwrap();

    verify_empty_collection_variants(entry, "DataLockFields");
    for (path, tag) in [
        ("Catalog.1Bad.StandardAttribute.Code", "!xml/invalid"),
        ("Catalog.Goods.Unknown.Name", "!xml/raw"),
    ] {
        let xml = format!(
            "<Root xmlns:xr=\"http://v8.1c.ru/8.3/xcf/readable\"><DataLockFields><xr:Field>{path}</xr:Field></DataLockFields></Root>"
        );
        let converted = convert_file(entry, Direction::XmlToYaml, xml.as_bytes(), &inputs).unwrap();
        assert!(String::from_utf8_lossy(&converted.bytes).contains(tag));
        verify_candidate(entry, xml.as_bytes(), &converted.bytes, &inputs).unwrap();
    }
}

#[test]
fn metadata_fields_owner_shorthand_restores_the_full_xml_path() {
    let entry = entry_id("migration.owner-metadata-fields").unwrap();
    let inputs = prepare_inputs(
        entry,
        vec![
            ("ownerRoot".into(), InputValue::Text("Document".into())),
            (
                "ownerName".into(),
                InputValue::Text("ДокументВсеСвойства".into()),
            ),
        ],
    )
    .unwrap();
    let xml = "<Root xmlns:xr=\"http://v8.1c.ru/8.3/xcf/readable\"><DataLockFields><xr:Field>Document.ДокументВсеСвойства.StandardAttribute.Number</xr:Field><xr:Field>Document.ДокументВсеСвойства.StandardAttribute.Date</xr:Field></DataLockFields></Root>";
    let converted = convert_file(entry, Direction::XmlToYaml, xml.as_bytes(), &inputs).unwrap();
    assert_eq!(
        String::from_utf8_lossy(&converted.bytes),
        "ПоляБлокировкиДанных:\n  - СтандартныйРеквизит.Номер\n  - СтандартныйРеквизит.Дата"
    );
    verify_candidate(entry, xml.as_bytes(), &converted.bytes, &inputs).unwrap();
    let foreign = "<Root xmlns:xr=\"http://v8.1c.ru/8.3/xcf/readable\"><DataLockFields><xr:Field>Document.Other.StandardAttribute.Number</xr:Field></DataLockFields></Root>";
    let converted = convert_file(entry, Direction::XmlToYaml, foreign.as_bytes(), &inputs).unwrap();
    assert!(String::from_utf8_lossy(&converted.bytes).contains("!xml/raw"));
    verify_candidate(entry, foreign.as_bytes(), &converted.bytes, &inputs).unwrap();
}

#[test]
fn metadata_fields_match_all_nonempty_applied_object_e2e_pairs() {
    let corpus: serde_json::Value = serde_json::from_slice(include_bytes!(
        "../../../../tests/migration/metadata-fields-e2e.json"
    ))
    .unwrap();
    let cases = corpus["cases"].as_array().unwrap();
    assert_eq!(cases.len(), 16);
    for case in cases {
        assert_corpus_source_unchanged(case);
        let yaml_path = std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
            .ancestors()
            .nth(3)
            .unwrap()
            .join(case["yamlSource"].as_str().unwrap());
        let yaml_source = std::fs::read_to_string(yaml_path).unwrap();
        assert!(
            yaml_source.contains(case["yaml"].as_str().unwrap()),
            "{}",
            case["yamlSource"]
        );
        let entry = entry_id(case["entry"].as_str().unwrap()).unwrap();
        let inputs = if case["entry"] == "migration.owner-metadata-fields" {
            prepare_inputs(
                entry,
                vec![
                    (
                        "ownerRoot".into(),
                        InputValue::Text(case["ownerRoot"].as_str().unwrap().into()),
                    ),
                    (
                        "ownerName".into(),
                        InputValue::Text(case["ownerName"].as_str().unwrap().into()),
                    ),
                ],
            )
            .unwrap()
        } else {
            PreparedInputs::default()
        };
        verify_corpus_case(entry, case, &inputs);
    }
}

#[test]
fn choice_parameter_families_cover_every_ordinary_e2e_form() {
    let corpus: serde_json::Value = serde_json::from_slice(include_bytes!(
        "../../../../tests/migration/choice-parameters-e2e.json"
    ))
    .unwrap();
    assert_eq!(corpus["counts"]["choiceParameters"], 281);
    assert_eq!(corpus["counts"]["choiceParameterLinks"], 274);
    let cases = corpus["cases"].as_array().unwrap();
    assert_eq!(cases.len(), 9);
    for case in cases {
        assert_corpus_source_unchanged(case);
        let name = case["entry"].as_str().unwrap();
        let entry = entry_id(name).unwrap();
        let inputs = if name == "migration.choice-parameters" {
            metadata_value_inputs(entry)
        } else {
            PreparedInputs::default()
        };
        let expected = case["yaml"].as_str().unwrap().as_bytes();
        verify_corpus_case(entry, case, &inputs);

        let exported = convert_file(entry, Direction::YamlToXml, expected, &inputs)
            .unwrap_or_else(|error| panic!("{}: {error:?}", case["source"]));
        let imported = convert_file(entry, Direction::XmlToYaml, &exported.bytes, &inputs)
            .unwrap_or_else(|error| panic!("{}: {error:?}", case["source"]));
        assert_eq!(imported.bytes, expected, "{}", case["source"]);
    }
}

#[test]
fn recursive_records_round_trip_through_one_reusable_declaration() {
    let entry = entry_id("migration.recursive-record").unwrap();
    let inputs = PreparedInputs::default();
    let xml = b"<Root><Name>root</Name><Item><Name>first</Name></Item><Item><Name>second</Name><Item><Name>leaf</Name></Item></Item></Root>";
    let converted = convert_file(entry, Direction::XmlToYaml, xml, &inputs).unwrap();
    assert_eq!(
        String::from_utf8_lossy(&converted.bytes),
        "Корень:\n  Имя: root\n  Дети:\n    -\n      Имя: first\n      Дети: []\n    -\n      Имя: second\n      Дети:\n        -\n          Имя: leaf\n          Дети: []"
    );
    verify_candidate(entry, xml, &converted.bytes, &inputs).unwrap();
    let exported = convert_file(entry, Direction::YamlToXml, &converted.bytes, &inputs).unwrap();
    let imported = convert_file(entry, Direction::XmlToYaml, &exported.bytes, &inputs).unwrap();
    assert_eq!(imported.bytes, converted.bytes);
}

#[test]
fn record_sequences_keep_typed_wrappers_and_infer_their_differences() {
    let entry = entry_id("migration.web-socket-client-headers").unwrap();
    let inputs = PreparedInputs::default();
    let row = "<xr:Item><xr:Presentation/><xr:CheckState>0</xr:CheckState><xr:Value xsi:type=\"v8:KeyAndValue\"><v8:Key xsi:type=\"xs:string\">a</v8:Key><v8:Value xsi:type=\"xs:string\">b</v8:Value></xr:Value></xr:Item>";
    let xml = format!(
        "<Root xmlns:xr=\"http://v8.1c.ru/8.3/xcf/readable\" xmlns:v8=\"http://v8.1c.ru/8.1/data/core\" xmlns:xs=\"http://www.w3.org/2001/XMLSchema\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\"><Value xsi:type=\"xr:ValueList\">{row}{row}</Value></Root>"
    );
    let result = convert_file(entry, Direction::XmlToYaml, xml.as_bytes(), &inputs).unwrap();
    assert_eq!(
        String::from_utf8_lossy(&result.bytes),
        "Headers:\n  - Ключ: a\n    Значение: b\n  - Ключ: a\n    Значение: b"
    );
    for original in [
        xml.clone(),
        xml.replace("<xr:Presentation/>", ""),
        xml.replace(">0</xr:CheckState>", ">1</xr:CheckState>"),
        xml.replace(" xsi:type=\"xs:string\"", ""),
        xml.replace("<v8:Key xsi:type=\"xs:string\">a</v8:Key>", ""),
        xml.replace("v8:KeyAndValue", "v8:Other"),
        xml.replace(row, ""),
        "<Root/>".into(),
    ] {
        assert_restored(entry, original.as_bytes(), &inputs);
    }
}

#[test]
fn text_sequences_preserve_order_duplicates_empty_items_and_unknown_content() {
    let inputs = PreparedInputs::default();
    for (name, element) in [
        ("fields-list", "f:Field"),
        ("fields-list-readable", "xr:Field"),
        ("index-field", "x:Field"),
    ] {
        let entry = entry_id(&format!("migration.{name}")).unwrap();
        let root = "<Root xmlns:xr=\"http://v8.1c.ru/8.3/xcf/readable\" xmlns:f=\"http://v8.1c.ru/8.3/xcf/logform\" xmlns:x=\"http://v8.1c.ru/8.3/xcf/extrnprops\">";
        let normal = format!(
            "{root}<Value><{element}>b</{element}><{element}>a</{element}><{element}>b</{element}><{element}/></Value></Root>"
        );
        let value = convert_file(entry, Direction::XmlToYaml, normal.as_bytes(), &inputs).unwrap();
        assert_eq!(
            String::from_utf8_lossy(&value.bytes),
            "List:\n  - b\n  - a\n  - b\n  - \"\""
        );
        verify_candidate(entry, normal.as_bytes(), &value.bytes, &inputs).unwrap();
        let singleton = format!("{root}<Value><{element}/></Value></Root>");
        let preserved =
            convert_file(entry, Direction::XmlToYaml, singleton.as_bytes(), &inputs).unwrap();
        let yaml = String::from_utf8_lossy(&preserved.bytes);
        assert!(yaml.contains("!xml/raw"));
        assert_eq!(yaml.contains("$значение: []"), name == "index-field");
        verify_candidate(entry, singleton.as_bytes(), &preserved.bytes, &inputs).unwrap();
        verify_candidate(entry, b"<Root/>", b"List: []", &inputs).unwrap();
        if name != "index-field" {
            verify_candidate(entry, b"<Root><Value/></Root>", b"List: {}", &inputs).unwrap();
            assert!(validate_file(entry, b"List: {}", &inputs).is_empty());
        } else {
            assert!(!validate_file(entry, b"List: {}", &inputs).is_empty());
        }
        for original in [
            "<Root/>".to_owned(),
            "<Root><Value/></Root>".to_owned(),
            normal.replace("</Value>", "<Unknown>keep</Unknown></Value>"),
            normal.replace("<Value>", "<Value flag=\"x\">"),
            normal.replace(
                "</Value>",
                "<other:Unknown xmlns:other=\"urn:test:unknown\">keep</other:Unknown></Value>",
            ),
        ] {
            let value = convert_file(entry, Direction::XmlToYaml, original.as_bytes(), &inputs)
                .unwrap_or_else(|error| panic!("{name}: {original}: {error:?}"));
            assert!(validate_file(entry, &value.bytes, &inputs).is_empty());
            verify_candidate(entry, original.as_bytes(), &value.bytes, &inputs).unwrap();
        }
        for invalid in ["List: [1]", "List: [a, null]", "List: [a]\nList: [b]"] {
            assert!(
                !validate_file(entry, invalid.as_bytes(), &inputs).is_empty(),
                "{invalid}"
            );
        }
    }
}

#[test]
fn scalar_tree_attributes_follow_the_current_item_and_preserve_other_forms() {
    let entry = entry_id("migration.xdto-packages").unwrap();
    let inputs = PreparedInputs::default();
    let xml = "<Root xmlns:xr=\"http://v8.1c.ru/8.3/xcf/readable\" xmlns:xs=\"http://www.w3.org/2001/XMLSchema\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\"><Value><xr:Item><xr:Presentation/><xr:CheckState>0</xr:CheckState><xr:Value xsi:type=\"xr:MDObjectRef\">XDTOPackage.Example</xr:Value></xr:Item><xr:Item><xr:Presentation/><xr:CheckState>0</xr:CheckState><xr:Value xsi:type=\"xs:string\">other</xr:Value></xr:Item></Value></Root>";
    let result = convert_file(entry, Direction::XmlToYaml, xml.as_bytes(), &inputs).unwrap();
    assert_eq!(
        String::from_utf8_lossy(&result.bytes),
        "List:\n  - XDTOPackage.Example\n  - other"
    );
    for original in [
        xml.to_owned(),
        xml.replace("xr:MDObjectRef", "xs:string"),
        xml.replace(" xsi:type=\"xs:string\"", ""),
        xml.replace("<xr:Presentation/>", ""),
        "<Root><Value/></Root>".into(),
        "<Root/>".into(),
    ] {
        assert_restored(entry, original.as_bytes(), &inputs);
    }
}

#[test]
fn collection_owner_defaults_restore_empty_wrappers_and_preserve_absence() {
    let inputs = PreparedInputs::default();
    for name in [
        "web-socket-client-headers",
        "xdto-packages",
        "index-field",
        "fields-list-readable",
    ] {
        let entry = entry_id(&format!("migration.{name}-default")).unwrap();
        let empty = convert_file(entry, Direction::YamlToXml, b"", &inputs).unwrap();
        assert!(String::from_utf8_lossy(&empty.bytes).contains("<Value"));
        let yaml = convert_file(entry, Direction::XmlToYaml, &empty.bytes, &inputs).unwrap();
        assert!(yaml.bytes.is_empty());
        verify_candidate(entry, &empty.bytes, &yaml.bytes, &inputs).unwrap();
        for original in [b"<Root/>".as_slice(), b"<Root><Value/></Root>"] {
            let yaml = convert_file(entry, Direction::XmlToYaml, original, &inputs).unwrap_or_else(
                |error| panic!("{name}: {}: {error:?}", String::from_utf8_lossy(original)),
            );
            assert!(validate_file(entry, &yaml.bytes, &inputs).is_empty());
            verify_candidate(entry, original, &yaml.bytes, &inputs).unwrap();
        }
    }
}

#[test]
fn purposes_use_declared_shortcuts_defaults_and_inferred_violations() {
    let inputs = PreparedInputs::default();
    let root = "<Root xmlns:v8=\"http://v8.1c.ru/8.1/data/core\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:app=\"http://v8.1c.ru/8.2/managed-application/core\">";
    let xml = |values: &[&str]| {
        format!(
            "{root}<Value>{}</Value></Root>",
            values
                .iter()
                .map(|value| format!(
                    "<v8:Value xsi:type=\"app:ApplicationUsePurpose\">{value}</v8:Value>"
                ))
                .collect::<String>()
        )
    };
    let platform = "PlatformApplication";
    let mobile = "MobilePlatformApplication";
    for name in ["migration.use-purposes", "migration.use-purposes-default"] {
        let entry = entry_id(name).unwrap();
        for (values, expected) in [
            (vec![mobile], "НазначенияИспользования: МобильноеПриложение"),
            (
                vec![platform, mobile],
                "НазначенияИспользования: ПлатформаИМобильноеПриложение",
            ),
            (
                vec![mobile, platform],
                "НазначенияИспользования:\n  - MobilePlatformApplication\n  - PlatformApplication",
            ),
            (
                vec![platform, platform],
                "НазначенияИспользования:\n  - PlatformApplication\n  - PlatformApplication",
            ),
            (
                vec!["Future"],
                "НазначенияИспользования: !xml/invalid\n  - Future",
            ),
        ] {
            let original = xml(&values);
            let converted =
                convert_file(entry, Direction::XmlToYaml, original.as_bytes(), &inputs).unwrap();
            assert_eq!(String::from_utf8_lossy(&converted.bytes), expected);
            assert_restored(entry, original.as_bytes(), &inputs);
        }
        let converted = convert_file(
            entry,
            Direction::XmlToYaml,
            xml(&[platform]).as_bytes(),
            &inputs,
        )
        .unwrap();
        assert_eq!(converted.bytes.is_empty(), name.ends_with("-default"));
        for original in [
            "<Root/>".to_owned(),
            xml(&[]),
            xml(&[""]),
            xml(&["Future"]).replace(" xsi:type=\"app:ApplicationUsePurpose\"", ""),
        ] {
            assert_restored(entry, original.as_bytes(), &inputs);
        }
        for invalid in [
            "НазначенияИспользования: [Future]",
            "НазначенияИспользования: !xml/invalid [PlatformApplication]",
        ] {
            assert!(!validate_file(entry, invalid.as_bytes(), &inputs).is_empty());
        }
    }
}

fn assert_restored(entry: nkdk_compiled_rules::EntryId, original: &[u8], inputs: &PreparedInputs) {
    let result = convert_file(entry, Direction::XmlToYaml, original, inputs)
        .unwrap_or_else(|error| panic!("{}: {error:?}", String::from_utf8_lossy(original)));
    assert!(validate_file(entry, &result.bytes, inputs).is_empty());
    verify_candidate(entry, original, &result.bytes, inputs).unwrap();
}

#[test]
fn external_manifest_pages_use_declared_defaults_and_preserve_xml() {
    let entry = entry_id("migration.help-manifest").expect("compiled manifest declaration");
    let inputs = nkdk_compiled_rules::prepare_inputs(
        entry,
        vec![(
            "pages".into(),
            nkdk_compiled_rules::InputValue::Sequence(vec![nkdk_compiled_rules::InputValue::Text(
                "ru".into(),
            )]),
        )],
    )
    .unwrap();
    let original = include_bytes!(
        "../../../../e2e/fixtures/xml/cf/DocumentJournals/ЖурналДокументовВсеСвойства/Ext/Help.xml"
    );
    let converted = convert_file(entry, Direction::XmlToYaml, original, &inputs).unwrap();
    assert!(
        converted.bytes.is_empty(),
        "{}",
        String::from_utf8_lossy(&converted.bytes)
    );
    assert_restored(entry, original, &inputs);
    assert_restored(entry, b"", &inputs);
    let original = std::str::from_utf8(original).unwrap();
    for pages in [
        "",
        "<Page/>",
        "<Page>en</Page>",
        "<Page>en</Page><Page>ru</Page>",
        "<Page>ru</Page><Page>ru</Page>",
        "<Page extra=\"1\">ru</Page>",
        "<Future/>",
    ] {
        let source = original.replace("<Page>ru</Page>", pages);
        assert_restored(entry, source.as_bytes(), &inputs);
    }
    assert_restored(
        entry,
        original
            .replace("version=\"2.20\"", "version=\"future\"")
            .as_bytes(),
        &inputs,
    );
}

#[test]
fn external_documents_join_owner_yaml_and_restore_without_xml_reference() {
    let entry = entry_id("migration.external-document").unwrap();
    let prepare = || {
        nkdk_compiled_rules::prepare_inputs(
            entry,
            vec![(
                "pages".into(),
                nkdk_compiled_rules::InputValue::Sequence(vec![
                    nkdk_compiled_rules::InputValue::Text("ru".into()),
                ]),
            )],
        )
        .unwrap()
    };
    let primary = b"<Root><Name>x</Name></Root>";
    let original = include_bytes!(
        "../../../../e2e/fixtures/xml/cf/DocumentJournals/ЖурналДокументовВсеСвойства/Ext/Help.xml"
    );
    for external in [
        original.to_vec(),
        vec![],
        String::from_utf8_lossy(original)
            .replace(
                "<Page>ru</Page>",
                "<Page extra=\"1\">en</Page><Page>ru</Page>",
            )
            .into_bytes(),
    ] {
        let path =
            nkdk_conversion_core::resources::RelativePath::new(["Ext", "Help.xml"], 4096).unwrap();
        let inputs = prepare()
            .with_documents(vec![(path, external.clone())])
            .unwrap();
        let yaml = convert_file(entry, Direction::XmlToYaml, primary, &inputs).unwrap();
        verify_candidate(entry, primary, &yaml.bytes, &inputs).unwrap();
        let restored = convert_file(entry, Direction::YamlToXml, &yaml.bytes, &prepare()).unwrap();
        assert_eq!(restored.documents.is_empty(), external.is_empty());
        let restored_inputs = prepare().with_documents(restored.documents).unwrap();
        let again = convert_file(
            entry,
            Direction::XmlToYaml,
            &restored.bytes,
            &restored_inputs,
        )
        .unwrap();
        assert_eq!(yaml.bytes, again.bytes);
    }
}

#[test]
fn additional_indexes_use_prepared_identities_and_existing_e2e_files() {
    use nkdk_compiled_rules::{
        InputValue, contribute_file, fact_builder, fact_id, prepare_fact_inputs,
    };
    use nkdk_conversion_core::facts::{
        FactState, Generation, prepared::FactBudget, text::TextBudget,
    };
    use std::sync::Arc;
    let root = std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join("../../..");
    let cases: serde_json::Value = serde_json::from_slice(include_bytes!(
        "../../../../tests/migration/additional-indexes-e2e.json"
    ))
    .unwrap();
    let cases = cases.as_array().unwrap();
    let entry = entry_id("migration.additional-indexes").unwrap();
    let generation = Generation(7);
    let budget = || FactBudget {
        text: TextBudget {
            entries: 1000,
            bytes: 100000,
        },
        rows: 1000,
    };
    let empty = Arc::new(fact_builder(generation, budget()).finish());
    let prepare = |facts, owner: &str| {
        prepare_fact_inputs(
            entry,
            facts,
            generation,
            vec![("owner".into(), InputValue::Text(owner.into()))],
        )
        .unwrap()
    };
    let mut builder = fact_builder(generation, budget());
    for case in cases {
        let xml = std::fs::read(root.join(case["source"].as_str().unwrap())).unwrap();
        let issues = contribute_file(
            entry,
            Direction::XmlToYaml,
            &xml,
            &prepare(empty.clone(), case["owner"].as_str().unwrap()),
            &mut builder,
        );
        assert!(issues.is_empty(), "{}: {issues:?}", case["source"]);
    }
    let snapshot = Arc::new(builder.finish());
    let index = fact_id("metadata.additional-index-ids").unwrap();
    let mut rows = 0;
    let mut nonzero = 0;
    for case in cases {
        let owner = case["owner"].as_str().unwrap();
        let xml = std::fs::read(root.join(case["source"].as_str().unwrap())).unwrap();
        let inputs = prepare(snapshot.clone(), owner);
        for item in case["identities"].as_array().unwrap() {
            let id = item["id"].as_str().unwrap();
            assert_eq!(
                snapshot.lookup_parts(generation, index, &[item["name"].as_str().unwrap(), owner]),
                FactState::Ready(id)
            );
            rows += 1;
            nonzero += usize::from(id != "00000000-0000-0000-0000-000000000000");
        }
        let yaml = convert_file(entry, Direction::XmlToYaml, &xml, &inputs)
            .unwrap_or_else(|error| panic!("{}: {error:?}", case["source"]));
        assert_eq!(
            String::from_utf8_lossy(&yaml.bytes),
            case["yaml"].as_str().unwrap(),
            "{}",
            case["source"]
        );
        assert!(validate_file(entry, &yaml.bytes, &inputs).is_empty());
        verify_candidate(entry, &xml, &yaml.bytes, &inputs).unwrap();
        let exported = convert_file(entry, Direction::YamlToXml, &yaml.bytes, &inputs).unwrap();
        nkdk_conversion_core::proof::verify(&xml, &exported.bytes, |_| false).unwrap();
        // The identity follows the name even after the YAML rows are reordered.
        let text = std::str::from_utf8(&yaml.bytes).unwrap();
        let mut reordered = text
            .strip_prefix("-\n")
            .unwrap()
            .split("\n-\n")
            .collect::<Vec<_>>();
        reordered.reverse();
        let reordered = format!("-\n{}", reordered.join("\n-\n"));
        let exported_reordered =
            convert_file(entry, Direction::YamlToXml, reordered.as_bytes(), &inputs).unwrap();
        let mut restored = fact_builder(generation, budget());
        assert!(
            contribute_file(
                entry,
                Direction::YamlToXml,
                reordered.as_bytes(),
                &inputs,
                &mut restored
            )
            .is_empty()
        );
        let mut from_reordered_xml = fact_builder(generation, budget());
        assert!(
            contribute_file(
                entry,
                Direction::XmlToYaml,
                &exported_reordered.bytes,
                &inputs,
                &mut from_reordered_xml
            )
            .is_empty()
        );
        let from_reordered_xml = from_reordered_xml.finish();
        let restored = restored.finish();
        for item in case["identities"].as_array().unwrap() {
            assert_eq!(
                from_reordered_xml.lookup_parts(
                    generation,
                    index,
                    &[item["name"].as_str().unwrap(), owner]
                ),
                FactState::Ready(item["id"].as_str().unwrap())
            );
            assert_eq!(
                restored.lookup_parts(generation, index, &[item["name"].as_str().unwrap(), owner]),
                FactState::Ready(item["id"].as_str().unwrap())
            );
        }
    }
    assert_eq!((cases.len(), rows, nonzero), (29, 35, 6));
}
