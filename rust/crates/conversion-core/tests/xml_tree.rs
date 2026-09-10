use nkdk_conversion_core::xml::Tree;
#[test]
fn exceptional_xml_tree_keeps_empty_leaves_attributes_and_occurrences() {
    let source = br#"<Root xmlns:v="urn:values" xmlns:x="urn:attributes"><Title><v:item><v:lang>ru</v:lang><v:content/></v:item><v:item><v:lang>en</v:lang><v:content> </v:content></v:item></Title></Root>"#;
    let tree = Tree::capture(source, &[("", "Root"), ("", "Title")])
        .unwrap()
        .unwrap();
    let mut writer = nkdk_conversion_core::xml::Writer::new(&["urn:values", "urn:attributes"]);
    tree.write_at(&mut writer, &[("", "Root")], &[]).unwrap();
    nkdk_conversion_core::proof::verify(source, &writer.finish(), |_| false).unwrap();
    let yaml = tree
        .payload_yaml(&[("v8", "urn:values"), ("x", "urn:attributes")], &[])
        .unwrap();
    assert_eq!(
        yaml,
        "v8:item:\n  - v8:lang: ru\n    v8:content:\n  - v8:lang: en\n    v8:content: \" \""
    );
    let restored = Tree::from_payload_yaml(
        yaml.as_bytes(),
        nkdk_conversion_core::xml::Name {
            namespace: String::new(),
            local: "Title".into(),
        },
        &[("v8", "urn:values"), ("x", "urn:attributes")],
        &[],
    )
    .unwrap();
    let mut writer = nkdk_conversion_core::xml::Writer::new(&["urn:values", "urn:attributes"]);
    restored
        .write_at(&mut writer, &[("", "Root")], &[])
        .unwrap();
    nkdk_conversion_core::proof::verify(source, &writer.finish(), |_| false).unwrap();
    for invalid in [
        "bad/name: x",
        "a: x\na: y",
        "a: &name text",
        "_xmlns: bad",
        "x:node: x",
        "a: true",
    ] {
        assert!(
            Tree::from_payload_yaml(
                invalid.as_bytes(),
                nkdk_conversion_core::xml::Name {
                    namespace: String::new(),
                    local: "Title".into()
                },
                &[],
                &[]
            )
            .is_err(),
            "{invalid}"
        );
    }
    let interleaved = b"<Root><Title><A>one</A><B>two</B><A>three</A></Title></Root>";
    let tree = Tree::capture(interleaved, &[("", "Root"), ("", "Title")])
        .unwrap()
        .unwrap();
    let yaml = tree.payload_yaml(&[], &[]).unwrap();
    assert!(yaml.contains("#order"));
    let tree = Tree::from_payload_yaml(
        yaml.as_bytes(),
        nkdk_conversion_core::xml::Name {
            namespace: String::new(),
            local: "Title".into(),
        },
        &[],
        &[],
    )
    .unwrap();
    let mut writer = nkdk_conversion_core::xml::Writer::new(&[]);
    tree.write_at(&mut writer, &[("", "Root")], &[]).unwrap();
    nkdk_conversion_core::proof::verify(interleaved, &writer.finish(), |_| false).unwrap();
    let nil = Tree::capture(
        br#"<Root xmlns:x="urn:attributes"><Title x:nil="true"/></Root>"#,
        &[("", "Root"), ("", "Title")],
    )
    .unwrap()
    .unwrap();
    assert_eq!(
        nil.payload_yaml(&[("x", "urn:attributes")], &[]).unwrap(),
        "_x:nil: \"true\""
    );
    let empty = Tree::capture(b"<Root><Title/></Root>", &[("", "Root"), ("", "Title")])
        .unwrap()
        .unwrap();
    assert_eq!(empty.payload_yaml(&[], &[]).unwrap(), "");
    assert!(
        Tree::capture(b"<Root/>", &[("", "Root"), ("", "Title")])
            .unwrap()
            .is_none()
    );
    assert!(
        Tree::capture(
            b"<Root><Title/><Title/></Root>",
            &[("", "Root"), ("", "Title")]
        )
        .is_err()
    );
    let typed = Tree::capture(
        br#"<Root xmlns:a="urn:attributes" xmlns:v="urn:values"><Title a:type="v:Kind"/></Root>"#,
        &[("", "Root"), ("", "Title")],
    )
    .unwrap()
    .unwrap();
    assert_eq!(
        typed
            .payload_yaml(
                &[("x", "urn:attributes"), ("v8", "urn:values")],
                &[("urn:attributes", "type")]
            )
            .unwrap(),
        "_x:type: v8:Kind"
    );
}
