use nkdk_compiled_rules::{
    Direction, PreparedInputs, convert_file, data_path_member, data_path_member_available,
    data_path_name_pairs, data_path_type, entry_id, validate_file, verify_candidate,
};
use nkdk_compiled_rules_probes as nkdk_compiled_rules;

#[test]
fn calendar_records_publish_typed_data_paths_from_their_declarations() {
    assert!(data_path_name_pairs().contains(&("StartDate", "ДатаНачала")));
    assert!(data_path_name_pairs().contains(&("Date", "Дата")));
    for (alias, canonical, members) in [
        (
            "СтандартнаяДатаНачала",
            "StandardBeginningDate",
            vec![
                ("Variant", "Вариант", "StandardBeginningDateVariant", false),
                ("Date", "Дата", "dateTime", true),
            ],
        ),
        (
            "СтандартныйПериод",
            "StandardPeriod",
            vec![
                ("Variant", "Вариант", "StandardPeriodVariant", false),
                ("StartDate", "ДатаНачала", "dateTime", true),
                ("EndDate", "ДатаОкончания", "dateTime", true),
            ],
        ),
    ] {
        assert_eq!(data_path_type(alias), Some(canonical));
        assert_eq!(data_path_type(canonical), Some(canonical));
        for (internal, yaml, terminal, conditional) in members {
            let member = data_path_member(alias, yaml).unwrap();
            assert_eq!(member.internal, internal);
            assert_eq!(member.yaml, yaml);
            assert_eq!(member.terminal_types, &[terminal]);
            assert_eq!(data_path_member(canonical, internal), Some(member));
            assert_eq!(
                data_path_member_available(alias, yaml, "formConditionalFilter"),
                conditional
            );
        }
        assert!(data_path_member(alias, "НеизвестноеПоле").is_none());
    }
}

#[test]
fn nested_calendar_records_preserve_seconds_and_infer_anomalies() {
    let inputs = PreparedInputs::default();
    for (name, kind, field, key, variant, label) in [
        (
            "standard-beginning-date",
            "StandardBeginningDate",
            "date",
            "Дата",
            "Custom",
            "ПроизвольнаяДата",
        ),
        (
            "standard-period",
            "StandardPeriod",
            "startDate",
            "ДатаНачала",
            "Custom",
            "ПроизвольныйПериод",
        ),
    ] {
        let entry = entry_id(&format!("migration.{name}")).unwrap();
        let xml = format!(
            "<Root xmlns:v8=\"http://v8.1c.ru/8.1/data/core\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\"><Value xsi:type=\"v8:{kind}\"><v8:variant xsi:type=\"v8:{kind}Variant\">{variant}</v8:variant><v8:{field}>2026-03-25T12:34:56</v8:{field}></Value></Root>"
        );
        let value = convert_file(entry, Direction::XmlToYaml, xml.as_bytes(), &inputs).unwrap();
        assert_eq!(
            std::str::from_utf8(&value.bytes).unwrap(),
            format!("Значение:\n  Вариант: {label}\n  {key}: 25.03.2026 12:34:56")
        );
        assert!(validate_file(entry, &value.bytes, &inputs).is_empty());
        verify_candidate(entry, xml.as_bytes(), &value.bytes, &inputs).unwrap();
        assert!(
            !validate_file(
                entry,
                format!("Значение:\n  Вариант: {label}\n  {key}: 25.03.2026 12:34").as_bytes(),
                &inputs
            )
            .is_empty()
        );
        if name == "standard-period" {
            let reversed = xml.replace(
                "</Value>",
                "<v8:endDate>2020-01-01T00:00:00</v8:endDate></Value>",
            );
            let value =
                convert_file(entry, Direction::XmlToYaml, reversed.as_bytes(), &inputs).unwrap();
            assert!(
                String::from_utf8_lossy(&value.bytes)
                    .contains("ДатаОкончания: 01.01.2020 00:00:00")
            );
            verify_candidate(entry, reversed.as_bytes(), &value.bytes, &inputs).unwrap();
        }
        for original in [
            "<Root/>".to_owned(),
            "<Root><Value/></Root>".to_owned(),
            xml.replace(&format!(" xsi:type=\"v8:{kind}\""), ""),
            xml.replace("</Value>", "<extra>saved</extra></Value>"),
            xml.replace("12:34:56", "12:34:56+03:00"),
            xml.replace(variant, "__unknown__"),
            xml.replace("2026-03-25T12:34:56", "not-a-date"),
        ] {
            let value = convert_file(entry, Direction::XmlToYaml, original.as_bytes(), &inputs)
                .unwrap_or_else(|error| panic!("{original}: {error:?}"));
            assert!(validate_file(entry, &value.bytes, &inputs).is_empty());
            verify_candidate(entry, original.as_bytes(), &value.bytes, &inputs).unwrap();
        }
    }
}

#[test]
fn standard_beginning_date_restores_values_from_an_existing_form() {
    let source =
        include_str!("../../../../e2e/fixtures/xml/cf/CommonForms/УсловноеОформление/Ext/Form.xml");
    let entry = entry_id("migration.standard-beginning-date").unwrap();
    let inputs = PreparedInputs::default();
    let prefix = "<dcsset:right xsi:type=\"v8:StandardBeginningDate\">";
    let values: Vec<_> = source
        .split(prefix)
        .skip(1)
        .map(|tail| tail.split_once("</dcsset:right>").unwrap().0)
        .collect();
    assert_eq!(values.len(), 5);
    for content in values {
        let xml = format!(
            "<Root xmlns:v8=\"http://v8.1c.ru/8.1/data/core\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\"><Value xsi:type=\"v8:StandardBeginningDate\">{content}</Value></Root>"
        );
        let yaml = convert_file(entry, Direction::XmlToYaml, xml.as_bytes(), &inputs).unwrap();
        assert!(!String::from_utf8_lossy(&yaml.bytes).contains("!xml/"));
        verify_candidate(entry, xml.as_bytes(), &yaml.bytes, &inputs).unwrap();
    }
}

#[test]
fn standard_period_restores_untyped_values_from_existing_forms() {
    let entry = entry_id("migration.standard-period-untyped").unwrap();
    let inputs = PreparedInputs::default();
    let mut count = 0;
    for source in [
        include_str!(
            "../../../../e2e/fixtures/xml/cf/Documents/ДокументВсеСвойства/Forms/ФормаСписка/Ext/Form.xml"
        ),
        include_str!(
            "../../../../e2e/fixtures/xml/cf/BusinessProcesses/БизнесПроцессВсеСвойства/Forms/ФормаВыбора/Ext/Form.xml"
        ),
    ] {
        for content in source
            .split("<Period>")
            .skip(1)
            .filter_map(|tail| tail.split_once("</Period>").map(|(body, _)| body))
        {
            let xml = format!(
                "<Root xmlns:v8=\"http://v8.1c.ru/8.1/data/core\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\"><Period>{content}</Period></Root>"
            );
            let yaml = convert_file(entry, Direction::XmlToYaml, xml.as_bytes(), &inputs).unwrap();
            assert!(!String::from_utf8_lossy(&yaml.bytes).contains("!xml/"));
            verify_candidate(entry, xml.as_bytes(), &yaml.bytes, &inputs).unwrap();
            count += 1;
        }
    }
    assert!(count >= 3, "expected real Period values in both forms");
}
