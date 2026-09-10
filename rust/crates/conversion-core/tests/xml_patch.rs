use nkdk_conversion_core::xml::{Name, Patch, Tree, Writer};
#[test]
fn patches_preserve_ordinary_content_and_delete_only_requested_attributes() {
    let ns = [("x", "urn:x"), ("v", "urn:v")];
    let qnames = [("urn:x", "type")];
    let root = Name {
        namespace: String::new(),
        local: "Title".into(),
    };
    let source=b"<Root xmlns:x=\"urn:x\" xmlns:v=\"urn:v\"><Title x:type=\"v:Text\"><Item>keep</Item></Title></Root>";
    let ordinary = Tree::capture(source, &[("", "Root"), ("", "Title")])
        .unwrap()
        .unwrap();
    let patch = Patch::read(b"_x:type: null", &ns, &qnames).unwrap();
    let restored = patch
        .apply(Some(ordinary), root.clone(), &ns, &qnames)
        .unwrap();
    let mut writer = Writer::new(&["urn:x", "urn:v"]);
    restored
        .write_at(&mut writer, &[("", "Root")], &qnames)
        .unwrap();
    let bytes = writer.finish();
    let xml = String::from_utf8(bytes).unwrap();
    assert!(xml.contains("<Item>keep</Item>"));
    assert!(!xml.contains(":type="));
    let original = Tree::capture(source, &[("", "Root"), ("", "Title")])
        .unwrap()
        .unwrap();
    let actual = Tree::capture(xml.as_bytes(), &[("", "Root"), ("", "Title")])
        .unwrap()
        .unwrap();
    assert_eq!(
        original.patch_yaml(Some(&actual), &ns, &qnames).unwrap(),
        "_x:type: v:Text"
    );
    let patch = Patch::read(b"_x:type: v:Text", &ns, &qnames).unwrap();
    let restored = patch.apply(Some(actual), root, &ns, &qnames).unwrap();
    assert_eq!(
        restored.payload_yaml(&ns, &qnames).unwrap(),
        original.payload_yaml(&ns, &qnames).unwrap()
    );
    for invalid in [
        b"_x:type: bad:Type".as_slice(),
        b"_x:type: [x]",
        b"_xmlns: x",
        b"Item: !xml/raw {}",
    ] {
        assert!(Patch::read(invalid, &ns, &qnames).is_err());
    }
}
