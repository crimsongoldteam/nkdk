use nkdk_compiled_rules::{Direction, PreparedInputs, convert_file, entry_id, validate_file};
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
