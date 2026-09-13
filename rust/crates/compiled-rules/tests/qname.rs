use nkdk_compiled_rules::{
    Direction, PreparedInputs, convert_file, entry_id, validate_file, verify_candidate,
};

#[test]
fn qualified_names_keep_uri_local_name_and_infer_xml_differences() {
    let entry = entry_id("migration.xdto-type-name").unwrap();
    let inputs = PreparedInputs::default();
    let xml = br#"<Root xmlns:t="urn:example"><Value>t:Thing</Value></Root>"#;
    let result = convert_file(entry, Direction::XmlToYaml, xml, &inputs).unwrap();
    assert_eq!(
        String::from_utf8_lossy(&result.bytes),
        "Тип:\n  ПространствоИмен: urn:example\n  Имя: Thing"
    );
    for original in [
        xml.as_slice(),
        br#"<Root xmlns:other="urn:example"><Value><![CDATA[other:]]>Thing</Value></Root>"#,
        br#"<Root xmlns:t="urn:example"><Value flag="keep">t:Thing</Value></Root>"#,
        b"<Root><Value>unknown:Thing</Value></Root>",
        b"<Root><Value>{urn:example}Thing</Value></Root>",
        b"<Root><Value>bad:name:tail</Value></Root>",
        b"<Root><Value>Plain</Value></Root>",
        b"<Root><Value>xml:lang</Value></Root>",
        b"<Root><Value/></Root>",
        b"<Root><Value><Other/></Value></Root>",
        b"<Root/>",
    ] {
        let result = convert_file(entry, Direction::XmlToYaml, original, &inputs)
            .unwrap_or_else(|error| panic!("{}: {error:?}", String::from_utf8_lossy(original)));
        assert!(
            validate_file(entry, &result.bytes, &inputs).is_empty(),
            "{}",
            String::from_utf8_lossy(&result.bytes)
        );
        verify_candidate(entry, original, &result.bytes, &inputs).unwrap();
    }
    for invalid in [
        "Тип: {ПространствоИмен: uri}",
        "Тип: {ПространствоИмен: uri, Имя: 'a:b'}",
        "Тип: {ПространствоИмен: uri, Имя: 1}",
        "Тип: {ПространствоИмен: 'http://www.w3.org/2000/xmlns/', Имя: Name}",
        "Value: !xml/raw\n  $xml:\n    '#qname': [uri, Name]\n    '#text': text",
        "Value: !xml/raw\n  $xml:\n    '#qname': [uri, Name]\n    Child: text",
    ] {
        assert!(!validate_file(entry, invalid.as_bytes(), &inputs).is_empty());
    }
    let entry = entry_id("migration.xdto-type-name-metadata").unwrap();
    let original = br#"<md:Root xmlns:md="http://v8.1c.ru/8.3/MDClasses" xmlns="urn:parent"><md:Value xmlns="urn:child">Thing</md:Value></md:Root>"#;
    let result = convert_file(entry, Direction::XmlToYaml, original, &inputs).unwrap();
    assert_eq!(
        String::from_utf8_lossy(&result.bytes),
        "Тип:\n  ПространствоИмен: urn:child\n  Имя: Thing"
    );
    verify_candidate(entry, original, &result.bytes, &inputs).unwrap();
}
