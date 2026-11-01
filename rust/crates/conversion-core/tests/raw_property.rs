use nkdk_conversion_core::raw::Property;

#[test]
fn nested_raw_value_can_be_decoded() {
    let mut written = String::from("Значение:");
    nkdk_conversion_core::yaml::append_nested_value(
        &mut written,
        "!xml/raw\n$значение: {}\n$xml:\n  _type: boolean",
        "  ",
    );
    assert!(written.starts_with("Значение: !xml/raw\n  $значение: {}"));
    let mut direct = String::from("Значение:\n  !xml/raw\n  $значение: {}");
    nkdk_conversion_core::yaml::lift_nested_tag(&mut direct, "Значение".len(), "Значение:\n".len());
    assert_eq!(direct, "Значение: !xml/raw\n  $значение: {}");
    let mut ordinary = String::from("Значение:\n  Вариант: ПроизвольныйПериод");
    nkdk_conversion_core::yaml::lift_nested_tag(
        &mut ordinary,
        "Значение".len(),
        "Значение:\n".len(),
    );
    assert_eq!(ordinary, "Значение:\n  Вариант: ПроизвольныйПериод");
    let yaml =
        "Значение: !xml/raw\n  $значение: {}\n  $xml:\n    _type: boolean\n    \"#text\": maybe\n";
    let envelope = Property::decode(yaml.as_bytes(), "Значение", "Value")
        .unwrap()
        .unwrap();
    assert_eq!(envelope.meaning, "Значение: {}".as_bytes());
    assert_eq!(
        nkdk_conversion_core::raw::record_contents(&envelope.meaning, "Значение").unwrap(),
        Some(Vec::new())
    );
}

#[test]
fn physical_raw_boundary_uses_the_declared_name_inside_a_record() {
    let mut yaml = "ЦветФона:\n  value: !xml/raw\n    $xml:\n      unexpected: data".to_owned();
    let start = "ЦветФона:".len();
    Property::rename_physical_boundary(&mut yaml, start, "Значение", "value", "  ").unwrap();
    assert_eq!(
        yaml,
        "ЦветФона:\n  Значение: !xml/raw\n    $xml:\n      unexpected: data"
    );
    let mut ordinary = "ЦветФона:\n  Значение: Красный".to_owned();
    Property::rename_physical_boundary(&mut ordinary, start, "Значение", "value", "  ").unwrap();
    assert_eq!(ordinary, "ЦветФона:\n  Значение: Красный");
}
#[test]
fn raw_property_keeps_semantic_annotations_and_requires_an_exact_boundary() {
    let owner =
        nkdk_conversion_core::raw::Document::encode(b"Number: 9007199254740993", b"_format: null")
            .unwrap();
    let decoded = nkdk_conversion_core::raw::Document::decode(&owner)
        .unwrap()
        .unwrap();
    assert_eq!(decoded.meaning, b"Number: 9007199254740993");
    assert_eq!(decoded.payload, b"_format: null");
    assert!(!decoded.meaning_is_empty().unwrap());
    for meaning in [b"".as_slice(), b"{}"] {
        let encoded = nkdk_conversion_core::raw::Document::encode(meaning, b"{}").unwrap();
        let decoded = nkdk_conversion_core::raw::Document::decode(&encoded)
            .unwrap()
            .unwrap();
        assert!(decoded.meaning_is_empty().unwrap());
    }
    for source in [
        b"!xml/raw\n$xml: {}".as_slice(),
        "!xml/raw\n$значение: {}\n$xml: {}\nextra: x".as_bytes(),
    ] {
        assert!(nkdk_conversion_core::raw::Document::decode(source).is_err());
    }
    for semantic in [
        b"alpha(2)".as_slice(),
        b"!xml/invalid bad(2)",
        b"!xml/important alpha(2)",
        b"9007199254740993",
        b"null",
        b"\"\"",
    ] {
        let encoded =
            nkdk_conversion_core::raw::Document::encode(semantic, b"_format: null").unwrap();
        let decoded = nkdk_conversion_core::raw::Document::decode(&encoded)
            .unwrap()
            .unwrap();
        assert_eq!(decoded.meaning, semantic);
        assert!(!decoded.meaning_is_empty().unwrap());
        assert_eq!(decoded.payload, b"_format: null");
    }
    for unsupported in [b"!custom alpha".as_slice(), b"!xml/raw alpha"] {
        assert!(nkdk_conversion_core::raw::Document::encode(unsupported, b"{}").is_err());
    }
    for parent in [None, Some("Row")] {
        let meaning = if parent.is_some() {
            b"Row:\n  Before: kept\n  Value: {}\n  After: retained".as_slice()
        } else {
            b"Before: kept\nValue: {}\nAfter: retained".as_slice()
        };
        let encoded = Property::encode_in(
            parent,
            "Value",
            "Value",
            meaning,
            b"'#replace': 'true'\n'#text': oops",
        )
        .unwrap();
        let envelope = Property::decode_in(&encoded, parent, "Value", "Value")
            .unwrap()
            .unwrap();
        let decoded = envelope.without_empty_scalar(parent, "Value").unwrap();
        let decoded = std::str::from_utf8(&decoded).unwrap();
        assert!(
            decoded.contains("Before: kept") && decoded.contains("After: retained"),
            "{decoded}"
        );
        assert!(!decoded.contains("Value:"), "{decoded}");
        assert!(decoded.find("Before").unwrap() < decoded.find("After").unwrap());
    }
    let mut marks = nkdk_conversion_core::raw::Fields::default();
    let violation = nkdk_conversion_core::RuntimeDiagnostic::declared(
        Some("fixture.invalid"),
        None,
        nkdk_conversion_core::Severity::Error,
        "Invalid component",
    )
    .field("component")
    .field("nested");
    marks.infer_value(2, vec![violation.clone()]).unwrap();
    assert_eq!(marks.label(2).as_deref(), Some("!xml/invalid"));
    assert!(!marks.has_patches());
    assert!(
        marks
            .validate_value(2, vec![violation.clone()], vec![violation])
            .is_empty()
    );
    assert!(!marks.validate_value(2, vec![], vec![]).is_empty());
    assert!(
        marks
            .infer_value(
                2,
                vec![nkdk_conversion_core::RuntimeDiagnostic::new(
                    "yaml.syntax",
                    "broken"
                )]
            )
            .is_err()
    );
    let mut patched = nkdk_conversion_core::raw::Fields::default();
    patched.insert(
        0,
        nkdk_conversion_core::xml::Patch::read(b"null", &[], &[]).unwrap(),
    );
    let warning = nkdk_conversion_core::RuntimeDiagnostic::declared(
        Some("value.required"),
        None,
        nkdk_conversion_core::Severity::Warning,
        "Required value is absent",
    )
    .field("Title");
    assert!(
        patched
            .validate(&["Title"], vec![warning.clone()], &[warning])
            .is_empty()
    );
    let semantic = "Заголовок: \"\"".as_bytes();
    let payload = b"v8:item:\n  v8:lang: ru\n  v8:content:";
    let encoded = Property::encode("Заголовок", "Title", semantic, payload).unwrap();
    assert_eq!(
        String::from_utf8(encoded.clone()).unwrap(),
        "Заголовок: !xml/raw\n  $значение: \"\"\n  $xml:\n    v8:item:\n      v8:lang: ru\n      v8:content:"
    );
    let decoded = Property::decode(&encoded, "Заголовок", "Title")
        .unwrap()
        .unwrap();
    assert!(decoded.has_semantic);
    assert_eq!(decoded.meaning, semantic);
    assert_eq!(decoded.payload, payload);
    let absent = Property::encode("Заголовок", "Title", b"", b"").unwrap();
    assert_eq!(absent, b"Title: !xml/raw\n  $xml:");
    let decoded = Property::decode(&absent, "Заголовок", "Title")
        .unwrap()
        .unwrap();
    assert!(!decoded.has_semantic);
    assert!(decoded.meaning.is_empty() && decoded.payload.is_empty());
    let semantic = "Заголовок:\n  !xml/invalid de: Eins\n  !xml/invalid/2 de: Zwei".as_bytes();
    let encoded = Property::encode("Заголовок", "Title", semantic, payload).unwrap();
    assert_eq!(
        Property::decode(&encoded, "Заголовок", "Title")
            .unwrap()
            .unwrap()
            .meaning,
        semantic
    );
    assert!(
        Property::decode(b"Other: !xml/raw\n  $xml:", "Title", "Title")
            .unwrap()
            .is_none()
    );
    for invalid in [
        "Title: !xml/raw {}",
        "Title: !xml/raw\n  $xml:\n  unexpected: x",
        "Title: !xml/raw\n  $xml:\n  $xml:",
        "!xml/raw\nTitle: x",
    ] {
        assert!(
            Property::decode(invalid.as_bytes(), "Title", "Title").is_err(),
            "{invalid}"
        );
    }
}
