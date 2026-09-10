use nkdk_conversion_core::raw::Property;
#[test]
fn raw_property_keeps_semantic_annotations_and_requires_an_exact_boundary() {
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
