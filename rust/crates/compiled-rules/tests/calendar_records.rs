use nkdk_compiled_rules::{
    Direction, PreparedInputs, convert_file, entry_id, validate_file, verify_candidate,
};

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
