#[path = "support/dcs_enumeration_inputs.rs"]
#[allow(dead_code)]
mod dcs_enumeration_inputs;
#[path = "support/metadata_value_inputs.rs"]
#[allow(dead_code)]
mod metadata_value_inputs_support;
use nkdk_compiled_rules_probes as rules;
use nkdk_conversion_core::facts::Generation;
use rules::{Direction, entry_id};

#[test]
fn dcs_enumerations_use_one_bidirectional_dictionary() {
    let corpus: serde_json::Value = serde_json::from_slice(include_bytes!(
        "../../../../tests/migration/system-enumeration-tables.json"
    ))
    .unwrap();
    let generation = Generation(1);
    let entries = corpus["entries"].as_array().unwrap();
    let facts = dcs_enumeration_inputs::facts(entries, generation);
    for (name, primitive) in [
        ("migration.dcs-field-value", false),
        ("migration.dcs-primitive-complete", true),
    ] {
        let entry = entry_id(name).unwrap();
        let values = if primitive {
            metadata_value_inputs_support::language_values(&["ru"])
        } else {
            Vec::new()
        };
        let inputs = rules::prepare_fact_inputs(entry, facts.clone(), generation, values).unwrap();
        // Missing infrastructure must stay an error, never become a data anomaly.
        let missing_inputs = rules::convert_file(
        entry,
        Direction::XmlToYaml,
        br#"<Root xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:e="http://v8.1c.ru/8.1/data/enterprise"><Value xsi:type="e:DynamicListSearchStringViewMode">Auto</Value></Root>"#,
        &rules::PreparedInputs::default(),
    ).unwrap_err();
        assert!(
            missing_inputs.iter().any(|issue| issue
                .code
                .as_deref()
                .is_some_and(|code| code.starts_with("input.") || code.starts_with("fact."))),
            "{missing_inputs:?}"
        );
        let unknown_label = rules::validate_file(entry, "Значение:\n  Тип: СистемноеПеречисление\n  Имя: DynamicListSearchStringViewMode\n  Значение: Неизвестное\n".as_bytes(), &inputs);
        assert!(
            unknown_label
                .iter()
                .any(|issue| issue.code.as_deref() == Some("dcs.enum-value")),
            "{unknown_label:?}"
        );
        for (kind, value, yaml) in [
            ("xs:boolean", "true", "Истина"),
            ("xs:decimal", "9007199254740993", "9007199254740993"),
            ("dcscor:Field", "Ссылка", ".Ссылка"),
            (
                "xs:string",
                ".Ссылка",
                "\n  Тип: Строка\n  Значение: .Ссылка",
            ),
        ] {
            if primitive && kind == "dcscor:Field" {
                continue;
            }
            let yaml = if primitive && kind == "xs:string" {
                ".Ссылка"
            } else {
                yaml
            };
            let xml = format!(
                r#"<Root xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:dcscor="http://v8.1c.ru/8.1/data-composition-system/core"><Value xsi:type="{kind}">{value}</Value><Other>Сосед</Other></Root>"#
            );
            let expected = if yaml.starts_with('\n') {
                format!("Значение:{yaml}\nСосед: Сосед")
            } else {
                format!("Значение: {yaml}\nСосед: Сосед")
            };
            let imported =
                rules::convert_file(entry, Direction::XmlToYaml, xml.as_bytes(), &inputs).unwrap();
            assert_eq!(
                String::from_utf8_lossy(&imported.bytes).trim(),
                expected,
                "{kind}"
            );
            rules::verify_candidate(entry, xml.as_bytes(), expected.as_bytes(), &inputs).unwrap();
        }
        if primitive {
            for (body, expected) in [
                (r#"<Value xsi:nil="true"/>"#, "Значение: null\nСосед: Сосед"),
                (
                    r#"<Value xsi:type="xs:string">123</Value>"#,
                    "Значение: \"123\"\nСосед: Сосед",
                ),
                (
                    r#"<Value xsi:type="v8:StandardPeriod"><v8:variant xsi:type="v8:StandardPeriodVariant">Custom</v8:variant></Value>"#,
                    "",
                ),
            ] {
                let xml = format!(
                    r#"<Root xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:v8="http://v8.1c.ru/8.1/data/core">{body}<Other>Сосед</Other></Root>"#
                );
                let imported =
                    rules::convert_file(entry, Direction::XmlToYaml, xml.as_bytes(), &inputs)
                        .unwrap_or_else(|errors| panic!("{body}: {errors:?}"));
                let yaml = String::from_utf8_lossy(&imported.bytes);
                if !expected.is_empty() {
                    assert_eq!(yaml.trim(), expected);
                } else {
                    assert!(yaml.contains("Вариант: ПроизвольныйПериод"), "{yaml}");
                }
                rules::verify_candidate(entry, xml.as_bytes(), &imported.bytes, &inputs).unwrap();
            }
        } else {
            let nil = r#"<Root xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><Value xsi:nil="true"/><Other>Сосед</Other></Root>"#;
            let imported =
                rules::convert_file(entry, Direction::XmlToYaml, nil.as_bytes(), &inputs).unwrap();
            assert_eq!(
                String::from_utf8_lossy(&imported.bytes).trim(),
                "Значение: null\nСосед: Сосед"
            );
            rules::verify_candidate(entry, nil.as_bytes(), &imported.bytes, &inputs).unwrap();
            let absent = "<Root><Other>Сосед</Other></Root>";
            let imported =
                rules::convert_file(entry, Direction::XmlToYaml, absent.as_bytes(), &inputs)
                    .unwrap();
            assert_eq!(
                String::from_utf8_lossy(&imported.bytes).trim(),
                "Сосед: Сосед"
            );
            rules::verify_candidate(entry, absent.as_bytes(), &imported.bytes, &inputs).unwrap();
        }
        let mut count = 0;
        for row in entries {
            let name = row["name"].as_str().unwrap();
            let uri = row["dcsNamespace"].as_str().unwrap();
            for value in row["values"].as_array().unwrap() {
                let code = value["xml"].as_str().unwrap();
                let label = value["yaml"].as_str().unwrap();
                let xml = format!(
                    "<Root xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:t=\"{uri}\"><Value xsi:type=\"t:{name}\">{code}</Value></Root>"
                );
                let expected = format!(
                    "Значение:\n  Тип: СистемноеПеречисление\n  Имя: {name}\n  Значение: {label}\n"
                );
                let special = match name {
                    "ComparisonType" => Some("ВидСравнения"),
                    "AccountType" => Some("ВидСчета"),
                    "DataCompositionComparisonType" => Some("ВидСравненияКомпоновкиДанных"),
                    _ => None,
                };
                let expected = if primitive {
                    special.map_or(expected.clone(), |kind| {
                        format!("Значение:\n  Тип: {kind}\n  Значение: {label}\n")
                    })
                } else {
                    expected
                };
                let imported =
                    rules::convert_file(entry, Direction::XmlToYaml, xml.as_bytes(), &inputs)
                        .unwrap_or_else(|errors| panic!("{xml}: {errors:?}"));
                assert_eq!(
                    String::from_utf8_lossy(&imported.bytes).trim(),
                    expected.trim(),
                    "{name}/{code}"
                );
                let exported =
                    rules::convert_file(entry, Direction::YamlToXml, expected.as_bytes(), &inputs)
                        .unwrap();
                nkdk_conversion_core::proof::verify(xml.as_bytes(), &exported.bytes, |_| false)
                    .unwrap();
                count += 1;
            }
        }
        for (uri, name, code) in [
            (
                "http://v8.1c.ru/8.1/data/enterprise",
                "DynamicListSearchStringViewMode",
                "Unknown",
            ),
            ("urn:unknown", "DynamicListSearchStringViewMode", "Auto"),
            ("http://v8.1c.ru/8.1/data/enterprise", "Unknown", "Auto"),
        ] {
            let xml = format!(
                "<Root xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:t=\"{uri}\"><Value xsi:type=\"t:{name}\">{code}</Value><Other>Сосед</Other></Root>"
            );
            let imported =
                rules::convert_file(entry, Direction::XmlToYaml, xml.as_bytes(), &inputs)
                    .unwrap_or_else(|errors| panic!("{xml}: {errors:?}"));
            assert!(String::from_utf8_lossy(&imported.bytes).contains("!xml/"));
            assert!(String::from_utf8_lossy(&imported.bytes).contains("Сосед: Сосед"));
            let exported =
                rules::convert_file(entry, Direction::YamlToXml, &imported.bytes, &inputs).unwrap();
            nkdk_conversion_core::proof::verify(xml.as_bytes(), &exported.bytes, |_| false)
                .unwrap();
        }
        assert_eq!(count, 3501);
    }
}

#[test]
fn qname_attributes_keep_namespaces_for_multiple_renamed_attributes() {
    let entry = entry_id("probe.qname-attributes").unwrap();
    let inputs = rules::PreparedInputs::default();
    let authored = rules::convert_file(
        entry,
        Direction::YamlToXml,
        "Первый: Первый\nВторой: Второй\nСосед: Сосед".as_bytes(),
        &inputs,
    )
    .unwrap();
    assert!(String::from_utf8_lossy(&authored.bytes).contains("urn:first"));
    for (uri, ordinary) in [("urn:first", true), ("urn:unknown", false)] {
        let xml = format!(
            r#"<Root xmlns:p="{uri}" xmlns:q="urn:second" kind="p:Item" alternate="q:Item"><Other>Сосед</Other></Root>"#
        );
        let imported = rules::convert_file(entry, Direction::XmlToYaml, xml.as_bytes(), &inputs)
            .unwrap_or_else(|errors| panic!("{uri}: {errors:?}"));
        let yaml = String::from_utf8_lossy(&imported.bytes);
        if ordinary {
            assert_eq!(yaml.trim(), "Первый: Первый\nВторой: Второй\nСосед: Сосед");
        } else {
            assert!(yaml.contains("!xml/"), "{yaml}");
        }
        assert!(yaml.contains("Сосед: Сосед"), "{yaml}");
        let exported =
            rules::convert_file(entry, Direction::YamlToXml, &imported.bytes, &inputs).unwrap();
        nkdk_conversion_core::proof::verify_with_attributes(
            xml.as_bytes(),
            &exported.bytes,
            |_| false,
            |_, name| ["kind", "alternate"].contains(&name.local.as_str()),
        )
        .unwrap();
    }
}
