use nkdk_compiled_rules::{Direction, PreparedInputs, convert_file, entry_id, validate_file};
use nkdk_compiled_rules_probes as nkdk_compiled_rules;

#[test]
fn border_resolves_a_real_style_item_and_checks_its_type() {
    let source = include_str!("../../../../e2e/fixtures/xml/cf/StyleItems/ЭлементСтиляРамка.xml");
    assert!(source.contains("<Name>ЭлементСтиляРамка</Name>"));
    assert!(source.contains("<Type>Border</Type>"));
    let (entry, inputs) = color_inputs_from_xml("probe.border-owner", &[source]);
    let xml = "<Root><Border ref=\"style:ЭлементСтиляРамка\"/></Root>";
    let imported = convert_file(entry, Direction::XmlToYaml, xml.as_bytes(), &inputs).unwrap();
    assert_eq!(
        String::from_utf8(imported.bytes).unwrap(),
        "Рамка:\n  Имя: ЭлементСтиля.ЭлементСтиляРамка"
    );
    let exported = convert_file(
        entry,
        Direction::YamlToXml,
        "Рамка:\n  Имя: ЭлементСтиля.ЭлементСтиляРамка".as_bytes(),
        &inputs,
    )
    .unwrap();
    assert!(
        String::from_utf8(exported.bytes)
            .unwrap()
            .contains("ref=\"style:ЭлементСтиляРамка\"")
    );
    for yaml in [
        "Рамка:\n  Имя: ЭлементСтиля.Нет",
        "Рамка:\n  Имя: ЭлементСтиля.НеверныйТип",
    ] {
        let (_, inputs) = color_inputs("probe.border-owner", &[("НеверныйТип", "Color")]);
        assert!(
            validate_file(entry, yaml.as_bytes(), &inputs)
                .iter()
                .any(|issue| issue.code.as_deref() == Some("border.style-item"))
        );
    }
    let (_, wrong_inputs) = color_inputs("probe.border-owner", &[("НеверныйТип", "Color")]);
    let wrong_xml = "<Root><Border ref=\"style:НеверныйТип\"/></Root>";
    let imported = convert_file(
        entry,
        Direction::XmlToYaml,
        wrong_xml.as_bytes(),
        &wrong_inputs,
    )
    .unwrap();
    let yaml = String::from_utf8(imported.bytes).unwrap();
    assert!(yaml.contains("!xml/invalid"), "{yaml}");
    let exported =
        convert_file(entry, Direction::YamlToXml, yaml.as_bytes(), &wrong_inputs).unwrap();
    assert!(
        String::from_utf8(exported.bytes)
            .unwrap()
            .contains("ref=\"style:НеверныйТип\"")
    );
}

#[test]
fn border_matches_existing_e2e_xml_and_yaml_examples() {
    let entry = entry_id("probe.border-owner").unwrap();
    for (xml_source, yaml_source, width, style, yaml_style) in [
        (
            include_str!("../../../../e2e/fixtures/xml/cf/CommonForms/CalendarField/Ext/Form.xml"),
            include_str!("../../../../e2e/fixtures/nkdk/cf/ОбщаяФорма/CalendarField/Свойства.yaml"),
            "1",
            "DoubleUnderline",
            "ДвойноеПодчеркивание",
        ),
        (
            include_str!("../../../../e2e/fixtures/xml/cf/CommonForms/LabelField/Ext/Form.xml"),
            include_str!("../../../../e2e/fixtures/nkdk/cf/ОбщаяФорма/LabelField/Свойства.yaml"),
            "0",
            "Single",
            "Одинарная",
        ),
        (
            include_str!(
                "../../../../e2e/fixtures/xml/cf/CommonForms/ExtendedTooltip/Ext/Form.xml"
            ),
            include_str!(
                "../../../../e2e/fixtures/nkdk/cf/ОбщаяФорма/ExtendedTooltip/Свойства.yaml"
            ),
            "2",
            "Overline",
            "ЧертаСверху",
        ),
    ] {
        assert!(xml_source.contains(&format!("<Border width=\"{width}\">")));
        assert!(xml_source.contains(&format!(">{style}</v8ui:style>")));
        assert!(yaml_source.contains(&format!("Ширина: {width}\n")));
        assert!(yaml_source.contains(&format!("ТипРамки: {yaml_style}")));
        let xml = format!(
            "<Root xmlns:v8ui=\"http://v8.1c.ru/8.1/data/ui\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\"><Border width=\"{width}\"><v8ui:style xsi:type=\"v8ui:ControlBorderType\">{style}</v8ui:style></Border></Root>"
        );
        let expected = format!("Рамка:\n  Ширина: {width}\n  ТипРамки: {yaml_style}");
        let imported = convert_file(
            entry,
            Direction::XmlToYaml,
            xml.as_bytes(),
            &PreparedInputs::default(),
        )
        .unwrap();
        assert_eq!(String::from_utf8(imported.bytes).unwrap(), expected);
        let exported = convert_file(
            entry,
            Direction::YamlToXml,
            expected.as_bytes(),
            &PreparedInputs::default(),
        )
        .unwrap();
        let exported = String::from_utf8(exported.bytes).unwrap();
        assert!(
            exported.contains(&format!("width=\"{width}\"")),
            "{exported}"
        );
        assert!(exported.contains(&format!(">{style}</")), "{exported}");
        assert!(exported.contains("ControlBorderType"), "{exported}");
    }
}

#[test]
fn border_validation_reports_invalid_width_and_style() {
    let entry = entry_id("probe.border-owner").unwrap();
    for yaml in [
        "Рамка:\n  Ширина: не-число",
        "Рамка:\n  ТипРамки: Неизвестная",
    ] {
        let issues = validate_file(entry, yaml.as_bytes(), &PreparedInputs::default());
        assert!(!issues.is_empty(), "{yaml}");
    }
}

#[test]
fn border_accepts_a_null_reference_as_absent() {
    let entry = entry_id("probe.border-owner").unwrap();
    let yaml = "Рамка:\n  Имя: null\n  Ширина: 1";
    assert!(validate_file(entry, yaml.as_bytes(), &PreparedInputs::default()).is_empty());
    let exported = convert_file(
        entry,
        Direction::YamlToXml,
        yaml.as_bytes(),
        &PreparedInputs::default(),
    )
    .unwrap();
    let xml = String::from_utf8(exported.bytes).unwrap();
    assert!(xml.contains("width=\"1\""), "{xml}");
    assert!(!xml.contains(" ref="), "{xml}");
}

#[test]
fn border_distinguishes_absence_from_zero_width() {
    let entry = entry_id("probe.border-owner").unwrap();
    let inputs = PreparedInputs::default();
    let imported = convert_file(entry, Direction::XmlToYaml, b"<Root/>", &inputs).unwrap();
    assert!(imported.bytes.is_empty());
    let imported = convert_file(
        entry,
        Direction::XmlToYaml,
        b"<Root><Border width=\"0\"/></Root>",
        &inputs,
    )
    .unwrap();
    assert_eq!(
        String::from_utf8(imported.bytes).unwrap(),
        "Рамка:\n  Ширина: 0"
    );
}

#[test]
fn empty_border_preserves_its_element_and_sibling() {
    let entry = entry_id("probe.border-owner").unwrap();
    let inputs = PreparedInputs::default();
    let xml = "<Root><Border/><Note>Сосед</Note></Root>";
    let imported = convert_file(entry, Direction::XmlToYaml, xml.as_bytes(), &inputs).unwrap();
    let yaml = std::str::from_utf8(&imported.bytes).unwrap();
    assert!(yaml.contains("Border: !xml/raw"), "{yaml}");
    assert!(yaml.contains("$xml: \"\""), "{yaml}");
    assert!(yaml.contains("Примечание: Сосед"), "{yaml}");
    let exported = convert_file(entry, Direction::YamlToXml, &imported.bytes, &inputs).unwrap();
    let exported = String::from_utf8(exported.bytes).unwrap();
    assert!(
        exported.contains("<Border></Border>") || exported.contains("<Border/>"),
        "{exported}"
    );
    assert!(exported.contains("<Note>Сосед</Note>"), "{exported}");
}

#[test]
fn malformed_border_preserves_original_xml_and_sibling() {
    let entry = entry_id("probe.border-owner").unwrap();
    let xml = "<Root><Border width=\"oops\"/><Note>Сосед</Note></Root>";
    let imported = convert_file(
        entry,
        Direction::XmlToYaml,
        xml.as_bytes(),
        &PreparedInputs::default(),
    )
    .unwrap();
    let yaml = String::from_utf8(imported.bytes).unwrap();
    assert!(yaml.contains("width: !xml/raw"), "{yaml}");
    assert!(yaml.contains("Примечание: Сосед"), "{yaml}");
    let exported = convert_file(
        entry,
        Direction::YamlToXml,
        yaml.as_bytes(),
        &PreparedInputs::default(),
    )
    .unwrap();
    let exported = String::from_utf8(exported.bytes).unwrap();
    assert!(exported.contains("width=\"oops\""), "{exported}");
    assert!(exported.contains("<Note>Сосед</Note>"), "{exported}");
}

fn color_inputs(
    owner: &str,
    styles: &[(&str, &str)],
) -> (nkdk_compiled_rules::EntryId, PreparedInputs) {
    let sources = styles
        .iter()
        .map(|(name, kind)| {
            format!(
                "<MetaDataObject xmlns=\"http://v8.1c.ru/8.3/MDClasses\"><StyleItem><Properties><Name>{name}</Name><Type>{kind}</Type></Properties></StyleItem></MetaDataObject>"
            )
        })
        .collect::<Vec<_>>();
    color_inputs_from_xml(
        owner,
        &sources.iter().map(String::as_str).collect::<Vec<_>>(),
    )
}

fn color_inputs_from_xml(
    owner: &str,
    sources: &[&str],
) -> (nkdk_compiled_rules::EntryId, PreparedInputs) {
    let producer = entry_id("probe.style-item-type-facts").unwrap();
    let entry = entry_id(owner).unwrap();
    let generation = nkdk_conversion_core::facts::Generation(1);
    let budget = nkdk_conversion_core::facts::prepared::FactBudget {
        text: nkdk_conversion_core::facts::text::TextBudget {
            entries: 20,
            bytes: 4096,
        },
        rows: 20,
    };
    let mut builder = nkdk_compiled_rules::fact_builder(generation, budget);
    for source in sources {
        let issues = nkdk_compiled_rules::contribute_file(
            producer,
            Direction::XmlToYaml,
            source.as_bytes(),
            &PreparedInputs::default(),
            &mut builder,
        );
        assert!(issues.is_empty(), "{issues:?}");
    }
    let facts = std::sync::Arc::new(builder.finish());
    (
        entry,
        nkdk_compiled_rules::prepare_fact_inputs(entry, facts, generation, vec![]).unwrap(),
    )
}

fn assert_color_value(
    entry: nkdk_compiled_rules::EntryId,
    inputs: &PreparedInputs,
    xml_value: &str,
    yaml: &str,
) {
    let xml = format!("<Root><Color>{xml_value}</Color></Root>");
    let imported = convert_file(entry, Direction::XmlToYaml, xml.as_bytes(), inputs).unwrap();
    assert_eq!(String::from_utf8(imported.bytes).unwrap(), yaml);
    let exported = convert_file(entry, Direction::YamlToXml, yaml.as_bytes(), inputs).unwrap();
    assert!(
        String::from_utf8(exported.bytes)
            .unwrap()
            .contains(&format!("<Color>{xml_value}</Color>"))
    );
}

#[test]
fn color_uses_the_five_existing_xml_forms_in_both_directions() {
    let (entry, inputs) = color_inputs("probe.color-owner", &[("ПоясняющийТекст", "Color")]);
    for (xml, yaml) in [
        (
            include_str!(
                "../../../../packages/rules/metadata/commonObjects/color/__fixtures__/absolute.xml"
            ),
            "Цвет: \"#C3C0C3\"",
        ),
        (
            include_str!(
                "../../../../packages/rules/metadata/commonObjects/color/__fixtures__/win.xml"
            ),
            "Цвет: ТеньКнопкиСветлая",
        ),
        (
            include_str!(
                "../../../../packages/rules/metadata/commonObjects/color/__fixtures__/web.xml"
            ),
            "Цвет: АкварельноСиний",
        ),
        (
            include_str!(
                "../../../../packages/rules/metadata/commonObjects/color/__fixtures__/style.xml"
            ),
            "Цвет: ЦветОсобогоТекста",
        ),
        (
            include_str!(
                "../../../../packages/rules/metadata/commonObjects/color/__fixtures__/customStyle.xml"
            ),
            "Цвет: ЭлементСтиля.ПоясняющийТекст",
        ),
    ] {
        let input_xml = format!("<Root>{xml}</Root>");
        let imported =
            convert_file(entry, Direction::XmlToYaml, input_xml.as_bytes(), &inputs).unwrap();
        assert_eq!(String::from_utf8(imported.bytes).unwrap(), yaml);
        let exported = convert_file(entry, Direction::YamlToXml, yaml.as_bytes(), &inputs).unwrap();
        let exported = String::from_utf8(exported.bytes).unwrap();
        assert!(exported.contains(xml), "{exported}");
    }
}

#[test]
fn color_matches_independent_e2e_style_values() {
    let evidence: serde_json::Value =
        serde_json::from_str(include_str!("../../../../tests/migration/color-e2e.json")).unwrap();
    let source =
        include_str!("../../../../e2e/fixtures/xml/cf/Styles/СтильВсеСвойства/Ext/Style.xml");
    let (entry, inputs) = color_inputs("probe.color-owner", &[]);
    for case in evidence["cases"].as_array().unwrap() {
        let xml_value = case["xml"].as_str().unwrap();
        let yaml_value = case["yaml"].as_str().unwrap();
        assert!(source.contains(&format!("<Color>{xml_value}</Color>")));
        let yaml = format!("Цвет: {yaml_value}");
        assert_color_value(entry, &inputs, xml_value, &yaml);
    }
}

#[test]
fn color_preserves_raw_forms_and_omits_auto() {
    let (entry, inputs) = color_inputs("probe.color-owner", &[("ПоясняющийТекст", "Color")]);
    for (xml_value, yaml) in [
        ("0", "Цвет: \"0\""),
        (
            "0:615512b6-4378-4fce-86f1-a56725f945da",
            "Цвет: 0:615512b6-4378-4fce-86f1-a56725f945da",
        ),
    ] {
        assert_color_value(entry, &inputs, xml_value, yaml);
    }
    for xml in ["<Root><Color>auto</Color></Root>", "<Root></Root>"] {
        let imported = convert_file(entry, Direction::XmlToYaml, xml.as_bytes(), &inputs).unwrap();
        assert!(
            imported.bytes.is_empty(),
            "{}",
            String::from_utf8_lossy(&imported.bytes)
        );
    }
    let exported = convert_file(entry, Direction::YamlToXml, b"", &inputs).unwrap();
    let exported = String::from_utf8(exported.bytes).unwrap();
    assert!(!exported.contains("<Color>"), "{exported}");
    assert!(!validate_file(entry, "Цвет: auto".as_bytes(), &inputs).is_empty());
}

#[test]
fn color_style_item_checks_the_prepared_name_and_type_index() {
    let (owner, inputs) = color_inputs_from_xml(
        "probe.color-owner",
        &[
            include_str!("../../../../e2e/fixtures/xml/cf/StyleItems/ЭлементСтиляЦвет.xml"),
            include_str!(
                "../../../../e2e/fixtures/xml/cf/StyleItems/ЭлементСтиляШрифтВсеСвойства.xml"
            ),
        ],
    );
    let xml = "<Root><Color>style:ЭлементСтиляЦвет</Color></Root>";
    let imported = convert_file(owner, Direction::XmlToYaml, xml.as_bytes(), &inputs).unwrap();
    assert_eq!(
        String::from_utf8(imported.bytes).unwrap(),
        "Цвет: ЭлементСтиля.ЭлементСтиляЦвет"
    );
    assert!(
        validate_file(owner, "Цвет: ЭлементСтиля.Неизвестный".as_bytes(), &inputs)
            .iter()
            .any(|issue| issue.code.as_deref() == Some("color.style-item"))
    );
    assert!(
        validate_file(
            owner,
            "Цвет: ЭлементСтиля.ЭлементСтиляШрифтВсеСвойства".as_bytes(),
            &inputs
        )
        .iter()
        .any(|issue| issue.code.as_deref() == Some("color.style-item"))
    );
    assert!(
        validate_file(
            owner,
            "Цвет: ЭлементСтиля.SpecialTextColor".as_bytes(),
            &inputs
        )
        .iter()
        .any(|issue| issue.code.as_deref() == Some("color.style-item"))
    );
}

#[test]
fn malformed_color_preserves_its_xml_without_losing_a_sibling() {
    let (entry, inputs) = color_inputs("probe.color-with-sibling", &[]);
    for (value, annotation) in [
        ("#oops", "!xml/invalid"),
        ("0:wrong-uuid", "!xml/invalid"),
        ("other:Color", "!xml/raw"),
    ] {
        let xml = format!("<Root><Color>{value}</Color><Note>Сосед</Note></Root>");
        let imported = convert_file(entry, Direction::XmlToYaml, xml.as_bytes(), &inputs).unwrap();
        let yaml = String::from_utf8(imported.bytes).unwrap();
        assert!(yaml.contains(annotation), "{yaml}");
        assert!(yaml.contains("Примечание: Сосед"), "{yaml}");
        let exported = convert_file(entry, Direction::YamlToXml, yaml.as_bytes(), &inputs).unwrap();
        let exported = String::from_utf8(exported.bytes).unwrap();
        assert!(
            exported.contains(&format!("<Color>{value}</Color>")),
            "{exported}"
        );
        assert!(exported.contains("<Note>Сосед</Note>"), "{exported}");
    }
}
#[test]
fn disjoint_style_choice_prefers_exact_name_and_rejects_open_collision() {
    let inputs = PreparedInputs::default();
    for entry_name in [
        "probe.disjoint-style-owner",
        "probe.disjoint-style-owner-reversed",
    ] {
        let entry = entry_id(entry_name).unwrap();
        for (xml, yaml) in [
            (
                "<Root><Color>style:SpecialTextColor</Color></Root>",
                "Цвет: ЦветОсобогоТекста",
            ),
            (
                "<Root><Color>style:ПоясняющийТекст</Color></Root>",
                "Цвет: ЭлементСтиля.ПоясняющийТекст",
            ),
        ] {
            let imported =
                convert_file(entry, Direction::XmlToYaml, xml.as_bytes(), &inputs).unwrap();
            assert_eq!(String::from_utf8(imported.bytes).unwrap(), yaml);
            let exported =
                convert_file(entry, Direction::YamlToXml, yaml.as_bytes(), &inputs).unwrap();
            let value = xml
                .split("<Color>")
                .nth(1)
                .unwrap()
                .split("</Color>")
                .next()
                .unwrap();
            assert!(
                String::from_utf8(exported.bytes)
                    .unwrap()
                    .contains(&format!("<Color>{value}</Color>"))
            );
        }
        let invalid = convert_file(
            entry,
            Direction::YamlToXml,
            "Цвет: ЭлементСтиля.SpecialTextColor".as_bytes(),
            &inputs,
        )
        .unwrap_err();
        assert!(
            invalid
                .iter()
                .any(|issue| issue.code.as_deref() == Some("value.choice-collision"))
        );
    }
}

#[test]
fn nested_sibling_record_selects_empty_xml_form_without_reference() {
    let inputs = PreparedInputs::default();
    for (name, yaml, expected_type) in [
        (
            "migration.conditional-nested-empty-scalar",
            "Тип:\n  Вид: Строка",
            true,
        ),
        ("migration.conditional-nested-empty-scalar", "", false),
        ("migration.conditional-composed-record", "Тип: Строка", true),
        ("migration.conditional-composed-record", "Тип: Число", false),
        (
            "migration.conditional-composed-record",
            "Тип:\n  -\n    Строка\n  -\n    Число",
            false,
        ),
        ("migration.conditional-composed-record", "", false),
    ] {
        let entry = entry_id(name).unwrap();
        let exported = convert_file(entry, Direction::YamlToXml, yaml.as_bytes(), &inputs).unwrap();
        let xml = String::from_utf8_lossy(&exported.bytes);
        assert!(xml.contains("<Value"), "{xml}");
        if expected_type {
            assert!(xml.contains("string"), "{xml}");
            assert!(!xml.contains("nil=\"true\""), "{xml}");
        } else {
            assert!(xml.contains("nil=\"true\""), "{xml}");
        }
        let imported = convert_file(entry, Direction::XmlToYaml, &exported.bytes, &inputs).unwrap();
        assert_eq!(imported.bytes, yaml.as_bytes(), "{xml}");
    }
}
#[test]
fn absent_scalar_uses_the_declared_contextual_xml_form_without_reference() {
    let entry = entry_id("migration.conditional-empty-scalar").unwrap();
    for (yaml, use_nil, expected_nil) in [
        ("", true, true),
        ("", false, false),
        ("Вид: Строка", true, false),
    ] {
        let inputs = nkdk_compiled_rules::prepare_inputs(
            entry,
            vec![(
                "useNil".into(),
                nkdk_compiled_rules::InputValue::Boolean(use_nil),
            )],
        )
        .unwrap();
        let exported = convert_file(entry, Direction::YamlToXml, yaml.as_bytes(), &inputs).unwrap();
        let mut has_nil = false;
        let mut has_value = false;
        let mut has_string_type = false;
        nkdk_conversion_core::xml::visit(&exported.bytes, |path, token| {
            if path.last().is_some_and(|name| name.local == "Value") {
                has_value = true;
                if let nkdk_conversion_core::xml::Token::Attribute(attribute) = token {
                    has_nil |= attribute.name.namespace
                        == "http://www.w3.org/2001/XMLSchema-instance"
                        && attribute.name.local == "nil"
                        && attribute.text == "true";
                    has_string_type |= attribute.name.namespace
                        == "http://www.w3.org/2001/XMLSchema-instance"
                        && attribute.name.local == "type"
                        && attribute.qname.as_ref().is_some_and(|name| {
                            name.namespace == "http://www.w3.org/2001/XMLSchema"
                                && name.local == "string"
                        });
                }
            }
            Ok(())
        })
        .unwrap();
        assert!(has_value);
        assert_eq!(
            has_nil,
            expected_nil,
            "{}",
            String::from_utf8_lossy(&exported.bytes)
        );
        assert_eq!(has_string_type, !expected_nil);
        let imported = convert_file(entry, Direction::XmlToYaml, &exported.bytes, &inputs).unwrap();
        assert_eq!(imported.bytes, yaml.as_bytes());
    }
}

#[test]
fn existing_boolean_corpus_matches_exact_bytes_in_both_directions() {
    let inputs = PreparedInputs::default();
    let entry = entry_id("pilot.boolean").unwrap();
    for (xml, yaml) in [
        (
            include_bytes!("../../../../tests/conversion-corpus/cases/boolean-true/input.xml")
                .as_slice(),
            include_bytes!("../../../../tests/conversion-corpus/cases/boolean-true/expected.yaml")
                .as_slice(),
        ),
        (
            include_bytes!("../../../../tests/conversion-corpus/cases/boolean-false/input.xml")
                .as_slice(),
            include_bytes!("../../../../tests/conversion-corpus/cases/boolean-false/expected.yaml")
                .as_slice(),
        ),
    ] {
        assert_eq!(
            convert_file(entry, Direction::XmlToYaml, xml, &inputs)
                .unwrap()
                .bytes,
            yaml
        );
        assert_eq!(
            convert_file(entry, Direction::YamlToXml, yaml, &inputs)
                .unwrap()
                .bytes,
            xml
        );
        assert!(validate_file(entry, yaml, &inputs).is_empty());
    }
}

#[test]
fn boolean_absence_is_distinct_from_false_and_invalid_tokens() {
    let entry = entry_id("pilot.boolean").unwrap();
    let inputs = PreparedInputs::default();
    let absent = convert_file(entry, Direction::XmlToYaml, b"<Root/>", &inputs).unwrap();
    assert!(absent.bytes.is_empty());
    for yaml in [b"".as_slice(), b"{}"] {
        assert!(validate_file(entry, yaml, &inputs).is_empty());
        nkdk_compiled_rules::verify_candidate(entry, b"<Root/>", yaml, &inputs).unwrap();
    }
    for yaml in [
        "Значение: true",
        "Значение: false",
        "Значение: null",
        "Значение: 0",
        "Значение: неизвестно",
    ] {
        assert!(!validate_file(entry, yaml.as_bytes(), &inputs).is_empty());
    }
    nkdk_compiled_rules::verify_candidate(
        entry,
        b"<Root><Value/></Root>",
        "Value: !xml/raw\n  $xml: null".as_bytes(),
        &inputs,
    )
    .unwrap();
    for xml in [
        "<Root><Value/></Root>",
        "<Root><Value>0</Value></Root>",
        "<Root><Value> true </Value></Root>",
    ] {
        let result = convert_file(entry, Direction::XmlToYaml, xml.as_bytes(), &inputs).unwrap();
        assert!(String::from_utf8_lossy(&result.bytes).contains("!xml/raw"));
        assert!(validate_file(entry, &result.bytes, &inputs).is_empty());
        nkdk_compiled_rules::verify_candidate(entry, xml.as_bytes(), &result.bytes, &inputs)
            .unwrap();
    }
}

#[test]
fn scalar_anomalies_preserve_lexemes_and_neighbouring_values() {
    let inputs = PreparedInputs::default();
    for (entry, xml) in [
        (
            "test.scalar-owner",
            "<Root><Server><Unexpected flag=\"x\">one</Unexpected><Unexpected>two</Unexpected></Server><Description>unchanged</Description></Root>",
        ),
        (
            "migration.metadata-name",
            "<Root><Name><Unexpected>text</Unexpected></Name></Root>",
        ),
        ("test.decimal-owner", "<Root><Amount>NaN</Amount></Root>"),
        (
            "test.decimal-owner",
            "<Root xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:xs=\"http://www.w3.org/2001/XMLSchema\"><Amount xsi:type=\"xs:unknown\">NaN</Amount></Root>",
        ),
        (
            "test.scalar-owner",
            "<Root xmlns:c=\"urn:custom\"><Server>false</Server><Description c:extra=\"x\">unchanged</Description></Root>",
        ),
        ("test.decimal-owner", "<Root><Amount>1e3</Amount></Root>"),
        ("test.decimal-owner", "<Root><Amount>-0.00</Amount></Root>"),
        (
            "test.scalar-owner",
            "<Root><Server>1</Server><Description>unchanged</Description></Root>",
        ),
        (
            "test.scalar-owner",
            "<Root><Server>false</Server><Description extra=\"x\">unchanged</Description></Root>",
        ),
    ] {
        let entry = entry_id(entry).unwrap();
        let result = convert_file(entry, Direction::XmlToYaml, xml.as_bytes(), &inputs).unwrap();
        let yaml = String::from_utf8_lossy(&result.bytes);
        assert!(yaml.contains("!xml/raw"));
        if xml.contains("<Unexpected") {
            assert!(!yaml.contains("$значение:"), "{yaml}");
        }
        if xml.contains("extra=") {
            assert!(yaml.contains("$значение: unchanged"), "{yaml}");
        }
        assert!(validate_file(entry, &result.bytes, &inputs).is_empty());
        nkdk_compiled_rules::verify_candidate(entry, xml.as_bytes(), &result.bytes, &inputs)
            .unwrap();
    }
}

#[test]
fn scalar_constraints_infer_annotations_without_duplicate_rules() {
    let entry = entry_id("test.numeric-bound").unwrap();
    let inputs = PreparedInputs::default();
    let xml = b"<Root><CodeType>Number</CodeType><CodeLength>39</CodeLength></Root>";
    let result = convert_file(entry, Direction::XmlToYaml, xml, &inputs).unwrap();
    let yaml = String::from_utf8_lossy(&result.bytes);
    assert!(yaml.contains("!xml/invalid"), "{yaml}");
    assert!(validate_file(entry, &result.bytes, &inputs).is_empty());
    nkdk_compiled_rules::verify_candidate(entry, xml, &result.bytes, &inputs).unwrap();
    let noncanonical = b"<Root><CodeType>Number</CodeType><CodeLength>39.0</CodeLength></Root>";
    let result = convert_file(entry, Direction::XmlToYaml, noncanonical, &inputs).unwrap();
    let yaml = String::from_utf8_lossy(&result.bytes);
    assert!(yaml.contains("!xml/raw") && yaml.contains("!xml/invalid"));
    nkdk_compiled_rules::verify_candidate(entry, noncanonical, &result.bytes, &inputs).unwrap();
    assert!(
        !validate_file(
            entry,
            "ТипКода: Число\nДлинаКода: !xml/invalid 38".as_bytes(),
            &inputs
        )
        .is_empty()
    );
}

#[test]
fn declared_scalar_xml_types_keep_text_and_exact_numbers() {
    let inputs = PreparedInputs::default();
    for (entry, kind, value, expected) in [
        (
            "migration.typed-number",
            "decimal",
            "9007199254740993",
            "Сумма: 9007199254740993",
        ),
        ("migration.typed-string", "string", "001", "Сумма: \"001\""),
        (
            "migration.number-as-text",
            "string",
            "9007199254740993.125",
            "Сумма: 9007199254740993.125",
        ),
    ] {
        let entry = entry_id(entry).unwrap();
        let xml = format!(
            "<Root xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:xs=\"http://www.w3.org/2001/XMLSchema\"><Amount xsi:type=\"xs:{kind}\">{value}</Amount></Root>"
        );
        let converted = convert_file(entry, Direction::XmlToYaml, xml.as_bytes(), &inputs).unwrap();
        assert_eq!(String::from_utf8_lossy(&converted.bytes), expected);
        assert!(validate_file(entry, &converted.bytes, &inputs).is_empty());
        nkdk_compiled_rules::verify_candidate(entry, xml.as_bytes(), &converted.bytes, &inputs)
            .unwrap();
    }
}

#[test]
fn omitted_scalar_defaults_do_not_erase_absence_or_empty_xml() {
    let inputs = PreparedInputs::default();
    let entry = entry_id("migration.scalar-defaults").unwrap();
    let normal = b"<Root><Enabled>false</Enabled><Text/><Amount>0</Amount></Root>";
    let converted = convert_file(entry, Direction::XmlToYaml, normal, &inputs).unwrap();
    assert!(converted.bytes.is_empty());
    nkdk_compiled_rules::verify_candidate(entry, normal, &converted.bytes, &inputs).unwrap();
    for original in [
        "<Root/>",
        "<Root><Enabled/><Text/><Amount/></Root>",
        "<Root><Enabled>wrong</Enabled><Text/><Amount>NaN</Amount></Root>",
        "<Root><Enabled>false</Enabled><Text/><Amount>-0.00</Amount></Root>",
    ] {
        let converted =
            convert_file(entry, Direction::XmlToYaml, original.as_bytes(), &inputs).unwrap();
        assert!(String::from_utf8_lossy(&converted.bytes).contains("!xml/raw"));
        if original.contains("-0.00") {
            assert!(String::from_utf8_lossy(&converted.bytes).contains("$значение: 0"));
        }

        assert!(validate_file(entry, &converted.bytes, &inputs).is_empty());
        nkdk_compiled_rules::verify_candidate(
            entry,
            original.as_bytes(),
            &converted.bytes,
            &inputs,
        )
        .unwrap();
    }
    let typed = entry_id("migration.scalar-typed-defaults").unwrap();
    let result = convert_file(typed, Direction::XmlToYaml, normal, &inputs).unwrap();
    nkdk_compiled_rules::verify_candidate(typed, normal, &result.bytes, &inputs).unwrap();
    for yaml in ["Enabled: Ложь", "Text: \"\"", "Amount: 0"] {
        assert!(!validate_file(entry, yaml.as_bytes(), &inputs).is_empty());
    }
    let preserved = entry_id("migration.boolean-preserved-default").unwrap();
    for (xml, yaml) in [
        ("<Root><Enabled>true</Enabled></Root>", "Enabled: Истина"),
        ("<Root><Enabled>false</Enabled></Root>", "Enabled: Ложь"),
    ] {
        let result =
            convert_file(preserved, Direction::XmlToYaml, xml.as_bytes(), &inputs).unwrap();
        assert_eq!(result.bytes, yaml.as_bytes());
        assert!(validate_file(preserved, yaml.as_bytes(), &inputs).is_empty());
        nkdk_compiled_rules::verify_candidate(preserved, xml.as_bytes(), &result.bytes, &inputs)
            .unwrap();
    }
    let default = convert_file(preserved, Direction::YamlToXml, b"", &inputs).unwrap();
    assert!(String::from_utf8_lossy(&default.bytes).contains(">true</Enabled>"));
    let date = entry_id("migration.date-time-default").unwrap();
    let default = convert_file(date, Direction::YamlToXml, b"", &inputs).unwrap();
    assert!(String::from_utf8_lossy(&default.bytes).contains("0001-01-01T00:00:00"));
    let imported = convert_file(date, Direction::XmlToYaml, &default.bytes, &inputs).unwrap();
    assert!(imported.bytes.is_empty());
    for original in ["<Root/>", "<Root><Amount/></Root>"] {
        let result =
            convert_file(date, Direction::XmlToYaml, original.as_bytes(), &inputs).unwrap();
        assert!(String::from_utf8_lossy(&result.bytes).contains("!xml/raw"));
        nkdk_compiled_rules::verify_candidate(date, original.as_bytes(), &result.bytes, &inputs)
            .unwrap();
    }
}

#[test]
fn metadata_name_uses_the_common_pattern_for_validation_and_anomalies() {
    let entry = entry_id("migration.metadata-name").unwrap();
    let inputs = PreparedInputs::default();
    for (name, valid) in [
        ("ИмяЁ_1", true),
        ("_name", true),
        ("1Имя", false),
        ("Имя-с-дефисом", false),
        ("Name\n", false),
        ("", false),
    ] {
        let original = format!("<Root><Name>{name}</Name></Root>");
        let result =
            convert_file(entry, Direction::XmlToYaml, original.as_bytes(), &inputs).unwrap();
        assert_eq!(
            String::from_utf8_lossy(&result.bytes).contains("!xml/invalid"),
            !valid
        );
        assert!(validate_file(entry, &result.bytes, &inputs).is_empty());
        nkdk_compiled_rules::verify_candidate(entry, original.as_bytes(), &result.bytes, &inputs)
            .unwrap();
    }
}

#[test]
fn scalar_choice_preserves_type_and_the_two_export_profiles() {
    let inputs = PreparedInputs::default();
    for name in ["migration.string-or-number", "migration.predefined-code"] {
        let entry = entry_id(name).unwrap();
        for (attributes, text, expected) in [
            ("", "001", "\"001\""),
            ("", "true", "\"true\""),
            ("xsi:type=\"xs:unknown\"", "001", "\"001\""),
            (
                "xsi:type=\"xs:double\"",
                "0.1234567890123456789",
                "0.1234567890123456789",
            ),
            ("xsi:type=\"xs:string\"", "001", "\"001\""),
            (
                "xsi:type=\"xs:decimal\"",
                "9007199254740993",
                "9007199254740993",
            ),
            ("xsi:type=\"xs:integer\"", "42", "42"),
            ("xsi:type=\"xs:float\"", "1e3", "1000"),
        ] {
            let xml = format!(
                "<Root xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:xs=\"http://www.w3.org/2001/XMLSchema\"><Value {attributes}>{text}</Value></Root>"
            );
            let result =
                convert_file(entry, Direction::XmlToYaml, xml.as_bytes(), &inputs).unwrap();
            let yaml = String::from_utf8_lossy(&result.bytes);
            assert!(yaml.contains(&format!(": {expected}")), "{yaml}");
            let ordinary = attributes.is_empty()
                || (name == "migration.predefined-code" && attributes == "xsi:type=\"xs:decimal\"");
            assert_eq!(yaml.contains("!xml/raw"), !ordinary, "{yaml}");
            assert!(validate_file(entry, &result.bytes, &inputs).is_empty());
            nkdk_compiled_rules::verify_candidate(entry, xml.as_bytes(), &result.bytes, &inputs)
                .unwrap();
        }
        let absent = convert_file(entry, Direction::XmlToYaml, b"<Root/>", &inputs).unwrap();
        assert!(absent.bytes.is_empty());
        nkdk_compiled_rules::verify_candidate(entry, b"<Root/>", &absent.bytes, &inputs).unwrap();
        let empty = convert_file(
            entry,
            Direction::XmlToYaml,
            b"<Root><Value/></Root>",
            &inputs,
        )
        .unwrap();
        assert!(!String::from_utf8_lossy(&empty.bytes).contains("$значение"));
        nkdk_compiled_rules::verify_candidate(
            entry,
            b"<Root><Value/></Root>",
            &empty.bytes,
            &inputs,
        )
        .unwrap();
        for text in ["", "NaN", "wrong"] {
            let xml = format!(
                "<Root xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:xs=\"http://www.w3.org/2001/XMLSchema\"><Value xsi:type=\"xs:decimal\">{text}</Value></Root>"
            );
            let result =
                convert_file(entry, Direction::XmlToYaml, xml.as_bytes(), &inputs).unwrap();
            let yaml = String::from_utf8_lossy(&result.bytes);
            assert!(
                yaml.contains("!xml/raw") && !yaml.contains("$значение"),
                "{yaml}"
            );
            nkdk_compiled_rules::verify_candidate(entry, xml.as_bytes(), &result.bytes, &inputs)
                .unwrap();
        }
        let result = convert_file(
            entry,
            Direction::YamlToXml,
            "Значение: 42".as_bytes(),
            &inputs,
        )
        .unwrap();
        assert_eq!(
            String::from_utf8_lossy(&result.bytes).contains("decimal"),
            name == "migration.predefined-code"
        );
        for yaml in ["Значение: true", "Значение: null", "Значение: []"] {
            assert!(!validate_file(entry, yaml.as_bytes(), &inputs).is_empty());
        }
    }
}

#[test]
fn discriminated_choice_uses_xml_type_and_reused_yaml_variants() {
    let entry = entry_id("migration.discriminated-choice").unwrap();
    let inputs = PreparedInputs::default();
    for (xml, yaml) in [
        (
            r#"<Root xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xr="http://v8.1c.ru/8.3/xcf/readable"><Value xsi:type="xr:DesignTimeRef">Ref.Item</Value></Root>"#,
            "Значение: Ссылка.Item",
        ),
        (
            r#"<Root xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xr="http://v8.1c.ru/8.3/xcf/readable"><Value xsi:type="xr:DesignTimeRef">Object.Item</Value></Root>"#,
            "Значение: Объект.Item",
        ),
        (
            r#"<Root xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xs="http://www.w3.org/2001/XMLSchema"><Value xsi:type="xs:string">ordinary</Value></Root>"#,
            "Значение: ordinary",
        ),
        (
            r#"<Root xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xs="http://www.w3.org/2001/XMLSchema"><Value xsi:type="xs:boolean">true</Value></Root>"#,
            "Значение: Истина",
        ),
        (
            r#"<Root xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xs="http://www.w3.org/2001/XMLSchema"><Value xsi:type="xs:decimal">9007199254740993.125</Value></Root>"#,
            "Значение: 9007199254740993.125",
        ),
        (
            r#"<Root xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xs="http://www.w3.org/2001/XMLSchema"><Value xsi:type="xs:string">42</Value></Root>"#,
            "Значение: \"42\"",
        ),
        (
            r#"<Root xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xs="http://www.w3.org/2001/XMLSchema"><Value xsi:type="xs:dateTime">2026-09-10T12:34:00</Value></Root>"#,
            "Значение: 10.09.2026 12:34",
        ),
        (
            r#"<Root xmlns:v8="http://v8.1c.ru/8.1/data/core" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><Value xsi:type="v8:StandardPeriod"><v8:variant xsi:type="v8:StandardPeriodVariant">Custom</v8:variant><v8:startDate>2026-03-25T12:34:56</v8:startDate></Value></Root>"#,
            "Значение:\n  Вариант: ПроизвольныйПериод\n  ДатаНачала: 25.03.2026 12:34:56",
        ),
        (
            r#"<Root xmlns:f="http://v8.1c.ru/8.3/xcf/logform" xmlns:p="urn:nkdk:probe" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><Value xsi:type="p:Fields"><f:Field>Alpha</f:Field><f:Field>Beta</f:Field></Value></Root>"#,
            "Значение:\n  - Alpha\n  - Beta",
        ),
    ] {
        let imported = convert_file(entry, Direction::XmlToYaml, xml.as_bytes(), &inputs)
            .unwrap_or_else(|error| panic!("{xml}: {error:?}"));
        assert_eq!(String::from_utf8_lossy(&imported.bytes).trim(), yaml);
        let exported = convert_file(
            entry,
            Direction::YamlToXml,
            imported.bytes.as_slice(),
            &inputs,
        )
        .unwrap();
        assert!(String::from_utf8_lossy(&exported.bytes).contains(":type="));
        nkdk_compiled_rules::verify_candidate(entry, xml.as_bytes(), &imported.bytes, &inputs)
            .unwrap();
    }
    let unknown = br#"<Root xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xs="http://www.w3.org/2001/XMLSchema"><Value xsi:type="xs:unknown">ordinary</Value></Root>"#;
    let imported = convert_file(entry, Direction::XmlToYaml, unknown, &inputs).unwrap();
    assert!(String::from_utf8_lossy(&imported.bytes).contains("!xml/raw"));
    nkdk_compiled_rules::verify_candidate(entry, unknown, &imported.bytes, &inputs).unwrap();
    let invalid_boolean = br#"<Root xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xs="http://www.w3.org/2001/XMLSchema"><Value xsi:type="xs:boolean">unknown</Value></Root>"#;
    let imported = convert_file(entry, Direction::XmlToYaml, invalid_boolean, &inputs).unwrap();
    assert!(String::from_utf8_lossy(&imported.bytes).contains("!xml/raw"));
    nkdk_compiled_rules::verify_candidate(entry, invalid_boolean, &imported.bytes, &inputs)
        .unwrap();
    let invalid_decimal = br#"<Root xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xs="http://www.w3.org/2001/XMLSchema"><Value xsi:type="xs:decimal">NaN</Value></Root>"#;
    let imported = convert_file(entry, Direction::XmlToYaml, invalid_decimal, &inputs).unwrap();
    assert!(String::from_utf8_lossy(&imported.bytes).contains("!xml/raw"));
    nkdk_compiled_rules::verify_candidate(entry, invalid_decimal, &imported.bytes, &inputs)
        .unwrap();
    let offset_calendar = br#"<Root xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xs="http://www.w3.org/2001/XMLSchema"><Value xsi:type="xs:dateTime">2026-09-10T12:34:00+03:00</Value></Root>"#;
    let imported = convert_file(entry, Direction::XmlToYaml, offset_calendar, &inputs).unwrap();
    let yaml = String::from_utf8_lossy(&imported.bytes);
    assert!(yaml.contains("$значение: 10.09.2026 12:34"), "{yaml}");
    assert!(yaml.contains("!xml/raw"), "{yaml}");
    nkdk_compiled_rules::verify_candidate(entry, offset_calendar, &imported.bytes, &inputs)
        .unwrap();
    let invalid_calendar = br#"<Root xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xs="http://www.w3.org/2001/XMLSchema"><Value xsi:type="xs:dateTime">2026-02-30T12:34:00</Value></Root>"#;
    let imported = convert_file(entry, Direction::XmlToYaml, invalid_calendar, &inputs).unwrap();
    assert!(String::from_utf8_lossy(&imported.bytes).contains("!xml/raw"));
    nkdk_compiled_rules::verify_candidate(entry, invalid_calendar, &imported.bytes, &inputs)
        .unwrap();
    let incomplete_period = br#"<Root xmlns:v8="http://v8.1c.ru/8.1/data/core" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><Value xsi:type="v8:StandardPeriod"><v8:variant>Custom</v8:variant><v8:startDate>2026-03-25T12:34:56</v8:startDate></Value></Root>"#;
    let imported = convert_file(entry, Direction::XmlToYaml, incomplete_period, &inputs).unwrap();
    assert!(String::from_utf8_lossy(&imported.bytes).contains("!xml/raw"));
    nkdk_compiled_rules::verify_candidate(entry, incomplete_period, &imported.bytes, &inputs)
        .unwrap();
}

#[test]
fn static_scalar_parameters_select_attributes_without_runtime_context() {
    let entry = entry_id("migration.scalar-parameters").unwrap();
    let inputs = PreparedInputs::default();
    let yaml = b"Amount: 7\nText: hello";
    let output = convert_file(entry, Direction::YamlToXml, yaml, &inputs).unwrap();
    let xml = String::from_utf8_lossy(&output.bytes);
    assert!(xml.contains("<Amount>7</Amount>"), "{xml}");
    assert!(
        xml.contains("string") && xml.contains(">hello</Text>"),
        "{xml}"
    );
    let imported = convert_file(entry, Direction::XmlToYaml, &output.bytes, &inputs).unwrap();
    assert_eq!(imported.bytes, yaml);
    assert!(validate_file(entry, yaml, &inputs).is_empty());
    let empty = b"Amount: 7\nText: \"\"";
    let result = convert_file(entry, Direction::YamlToXml, empty, &inputs).unwrap();
    assert!(!String::from_utf8_lossy(&result.bytes).contains("type="));
    let restored = convert_file(entry, Direction::XmlToYaml, &result.bytes, &inputs).unwrap();
    assert_eq!(restored.bytes, empty);
    let absent = b"Text: hello";
    let nil = convert_file(entry, Direction::YamlToXml, absent, &inputs).unwrap();
    assert!(String::from_utf8_lossy(&nil.bytes).contains("nil=\"true\""));
    let restored = convert_file(entry, Direction::XmlToYaml, &nil.bytes, &inputs).unwrap();
    assert_eq!(restored.bytes, absent);
    let assert_raw = |xml: String| {
        let imported = convert_file(entry, Direction::XmlToYaml, xml.as_bytes(), &inputs)
            .unwrap_or_else(|error| panic!("{xml}: {error:?}"));
        assert!(String::from_utf8_lossy(&imported.bytes).contains("!xml"));
        let exported = convert_file(entry, Direction::YamlToXml, &imported.bytes, &inputs)
            .unwrap_or_else(|error| panic!("{xml}: {error:?}"));
        nkdk_conversion_core::proof::verify_with_attributes(
            xml.as_bytes(),
            &exported.bytes,
            |path| path.len() == 2,
            |_, name| {
                name.namespace == "http://www.w3.org/2001/XMLSchema-instance"
                    && name.local == "type"
            },
        )
        .unwrap_or_else(|error| panic!("{xml}: {error:?}"));
    };
    for amount in [
        "",
        "<Amount/>",
        "<Amount xsi:nil=\"false\"/>",
        "<Amount xsi:nil=\"true\">7</Amount>",
    ] {
        let xml = format!(
            "<Root xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:xs=\"http://www.w3.org/2001/XMLSchema\">{amount}<Text xsi:type=\"xs:string\">hello</Text></Root>"
        );
        assert_raw(xml);
    }
    for text in ["", "hello"] {
        // The same inferred difference handles both an extra and a missing type.
        let attribute = if text.is_empty() {
            " xsi:type=\"xs:string\""
        } else {
            ""
        };
        let xml = format!(
            "<Root xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:xs=\"http://www.w3.org/2001/XMLSchema\"><Amount>7</Amount><Text{attribute}>{text}</Text></Root>"
        );
        assert_raw(xml);
    }
}

#[test]
fn decimal_representations_preserve_comma_dot_and_the_xml_type() {
    let inputs = PreparedInputs::default();
    for (name, kind, canonical) in [
        ("min-max-value", "decimal", "1.5"),
        ("min-max-value-text", "string", "1,5"),
    ] {
        let entry = entry_id(&format!("migration.{name}")).unwrap();
        for text in ["1.5", "1,5", "01,500", "9007199254740993,125"] {
            let xml = format!(
                "<Root xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:xs=\"http://www.w3.org/2001/XMLSchema\"><Value xsi:type=\"xs:{kind}\">{text}</Value></Root>"
            );
            let result =
                convert_file(entry, Direction::XmlToYaml, xml.as_bytes(), &inputs).unwrap();
            let yaml = String::from_utf8_lossy(&result.bytes);
            assert!(
                yaml.contains(if text.starts_with("900") {
                    "9007199254740993.125"
                } else {
                    "1.5"
                }),
                "{yaml}"
            );
            assert_eq!(
                yaml.contains("!xml/raw"),
                text != canonical && !(kind == "string" && text == "9007199254740993,125"),
                "{yaml}"
            );
            assert!(validate_file(entry, &result.bytes, &inputs).is_empty());
            nkdk_compiled_rules::verify_candidate(entry, xml.as_bytes(), &result.bytes, &inputs)
                .unwrap();
        }
        for text in ["", "NaN", "1,2,3"] {
            let xml = format!("<Root><Value>{text}</Value></Root>");
            let result =
                convert_file(entry, Direction::XmlToYaml, xml.as_bytes(), &inputs).unwrap();
            assert!(!String::from_utf8_lossy(&result.bytes).contains("$значение"));
            nkdk_compiled_rules::verify_candidate(entry, xml.as_bytes(), &result.bytes, &inputs)
                .unwrap();
        }
        let result = convert_file(
            entry,
            Direction::YamlToXml,
            "Значение: 1.5".as_bytes(),
            &inputs,
        )
        .unwrap();
        assert!(String::from_utf8_lossy(&result.bytes).contains(&format!(">{canonical}</Value>")));
    }
}

#[test]
fn strings_preserve_the_existing_contract_and_e2e_values() {
    use nkdk_conversion_core::{proof, xml};
    let entry = entry_id("test.scalar-owner").unwrap();
    let inputs = PreparedInputs::default();
    let check = |source: &str, expected: Option<&str>| {
        let converted =
            convert_file(entry, Direction::XmlToYaml, source.as_bytes(), &inputs).unwrap();
        assert!(validate_file(entry, &converted.bytes, &inputs).is_empty());
        nkdk_compiled_rules::verify_candidate(entry, source.as_bytes(), &converted.bytes, &inputs)
            .unwrap();
        let restored =
            convert_file(entry, Direction::YamlToXml, &converted.bytes, &inputs).unwrap();
        proof::verify(source.as_bytes(), &restored.bytes, |_| false).unwrap();
        if let Some(expected) = expected {
            let yaml = format!(
                "Сервер: Ложь\nОписание: {}",
                serde_json::to_string(expected).unwrap()
            );
            assert!(validate_file(entry, yaml.as_bytes(), &inputs).is_empty());
            nkdk_compiled_rules::verify_candidate(
                entry,
                source.as_bytes(),
                yaml.as_bytes(),
                &inputs,
            )
            .unwrap();
        }
    };
    for (body, expected) in [
        ("текст", "текст"),
        ("001", "001"),
        ("true", "true"),
        ("null", "null"),
        ("42", "42"),
        ("До<![CDATA[ и после]]>", "До и после"),
        (" &amp; &lt; &gt; ", " & < > "),
    ] {
        check(
            &format!("<Root><Server>false</Server><Description>{body}</Description></Root>"),
            Some(expected),
        );
    }
    for field in [
        "",
        "<Description/>",
        "<Description><![CDATA[]]></Description>",
        "<Description><Child>Не текст родителя</Child></Description>",
        "<Description extra='saved'>текст</Description>",
    ] {
        check(&format!("<Root><Server>false</Server>{field}</Root>"), None);
    }
    for invalid in ["42", "true", "null", "[]", "{}"] {
        assert!(
            !validate_file(
                entry,
                format!("Сервер: Ложь\nОписание: {invalid}").as_bytes(),
                &inputs
            )
            .is_empty()
        );
    }
    let corpus: serde_json::Value = serde_json::from_slice(include_bytes!(
        "../../../../tests/migration/scalar-value-e2e.json"
    ))
    .unwrap();
    let root = std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join("../../..");
    let mut count = 0;
    for case in corpus["cases"]
        .as_array()
        .unwrap()
        .iter()
        .filter(|case| case["kind"] == "string")
    {
        let source = std::fs::read(root.join(case["source"].as_str().unwrap())).unwrap();
        let property = case["property"].as_str().unwrap();
        let mut value = String::new();
        xml::visit(&source, |path, token| {
            if path.len() == 4
                && path[2].local == "Properties"
                && path[3].local == property
                && let xml::Token::Text(text) = token
            {
                value.push_str(text);
            }
            Ok(())
        })
        .unwrap();
        assert_eq!(
            value,
            case["value"].as_str().unwrap(),
            "{}: {property}",
            case["source"]
        );
        check(
            &format!(
                "<Root><Server>false</Server><Description>{}</Description></Root>",
                xml::escape(&value)
            ),
            Some(&value),
        );
        count += 1;
    }
    assert_eq!(count, 51);
}
