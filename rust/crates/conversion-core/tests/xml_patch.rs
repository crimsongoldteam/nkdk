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
    for (source, expected) in [
        ("null", None),
        ("'true'", Some("true")),
        ("''", Some("")),
        ("'001.20'", Some("001.20")),
    ] {
        assert_eq!(
            Patch::read(source.as_bytes(), &[], &[])
                .unwrap()
                .attribute_text()
                .unwrap(),
            expected
        );
    }
    assert!(
        Patch::read(b"_extra: value", &[], &[])
            .unwrap()
            .attribute_text()
            .is_err()
    );
    let patch = Patch::read(b"_x:type: null", &ns, &qnames).unwrap();
    assert_eq!(patch.to_yaml(), "_x:type: null");
    let patch = Patch::read(patch.to_yaml().as_bytes(), &ns, &qnames).unwrap();
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
    for (expected, actual) in [
        ("<Root><B/><A/></Root>", "<Root><A/><B/></Root>"),
        ("<Root><Added/><A/><B/></Root>", "<Root><A/><B/></Root>"),
    ] {
        let target = &[("", "Root")];
        let desired = Tree::capture(expected.as_bytes(), target).unwrap().unwrap();
        let ordinary = Tree::capture(actual.as_bytes(), target).unwrap().unwrap();
        let difference = desired.patch_yaml(Some(&ordinary), &[], &[]).unwrap();
        assert!(difference.contains("#order"));
        let restored = Patch::read(difference.as_bytes(), &[], &[])
            .unwrap()
            .apply(
                Some(ordinary),
                Name {
                    namespace: String::new(),
                    local: "Root".into(),
                },
                &[],
                &[],
            )
            .unwrap();
        let mut writer = Writer::new(&[]);
        restored.write_at(&mut writer, &[], &[]).unwrap();
        nkdk_conversion_core::proof::verify(expected.as_bytes(), &writer.finish(), |_| false)
            .unwrap();
    }
    for payload in [
        "null",
        "{}",
        "Item: {}",
        "Item: []",
        "Item: null",
        "'#order': []",
    ] {
        let encoded = Patch::read(payload.as_bytes(), &ns, &qnames)
            .unwrap()
            .to_yaml();
        assert_eq!(
            Patch::read(encoded.as_bytes(), &ns, &qnames)
                .unwrap()
                .to_yaml(),
            encoded
        );
        assert!(!encoded.is_empty());
    }
    for invalid in [
        b"_x:type: bad:Type".as_slice(),
        b"_x:type: [x]",
        b"_xmlns: x",
        b"Item: !xml/raw {}",
    ] {
        assert!(Patch::read(invalid, &ns, &qnames).is_err());
    }
}

#[test]
fn patches_restore_attribute_order_without_copying_child_content() {
    let ns = [("x", "urn:x")];
    let original=Tree::capture(b"<Root xmlns:x=\"urn:x\"><Title x:type=\"kind\" formatted=\"true\"><Item>keep</Item></Title></Root>",&[("","Root"),("","Title")]).unwrap().unwrap();
    let ordinary=Tree::capture(b"<Root xmlns:x=\"urn:x\"><Title formatted=\"true\" x:type=\"kind\"><Item>keep</Item></Title></Root>",&[("","Root"),("","Title")]).unwrap().unwrap();
    assert_eq!(
        ordinary.patch_yaml(Some(&ordinary), &ns, &[]).unwrap(),
        "{}"
    );
    let payload = original.patch_yaml(Some(&ordinary), &ns, &[]).unwrap();
    assert!(!payload.contains("Item"));
    let patch = Patch::read(payload.as_bytes(), &ns, &[]).unwrap();
    let actual = patch
        .apply(
            Some(ordinary),
            Name {
                namespace: String::new(),
                local: "Title".into(),
            },
            &ns,
            &[],
        )
        .unwrap();
    assert_eq!(
        actual.payload_yaml(&ns, &[]).unwrap(),
        original.payload_yaml(&ns, &[]).unwrap()
    );
}

#[test]
fn unregistered_namespaces_survive_self_contained_preservation() {
    let xml = b"<Root xmlns:custom=\"urn:custom\"><Value custom:flag=\"x\">text</Value></Root>";
    let tree = Tree::capture(xml, &[("", "Root"), ("", "Value")])
        .unwrap()
        .unwrap();
    let payload = tree.payload_yaml(&[], &[]).unwrap();
    assert!(payload.contains("_{urn:custom}flag"));
    let restored = Tree::from_payload_yaml(
        payload.as_bytes(),
        Name {
            namespace: String::new(),
            local: "Value".into(),
        },
        &[],
        &[],
    )
    .unwrap();
    let mut namespaces = Vec::new();
    restored.collect_namespaces(&mut namespaces);
    let mut writer = Writer::new(&namespaces);
    restored
        .write_at(&mut writer, &[("", "Root")], &[])
        .unwrap();
    nkdk_conversion_core::proof::verify(xml, &writer.finish(), |path| {
        path.last().is_some_and(|name| name.local == "Value")
    })
    .unwrap();
}

#[test]
fn patches_add_empty_children_without_treating_them_as_deletions() {
    let path = [("", "Root"), ("", "Value")];
    for expected in [
        "<Root><Value><Empty/><Nested><Empty/></Nested></Value></Root>",
        "<Root><Value/></Root>",
    ] {
        for base in [
            "<Root/>",
            "<Root><Value mode=\"normal\"/></Root>",
            "<Root><Value/></Root>",
            "<Root><Value><Other/></Value></Root>",
        ] {
            let original = Tree::capture(expected.as_bytes(), &path).unwrap().unwrap();
            let ordinary = Tree::capture(base.as_bytes(), &path).unwrap();
            let payload = original.patch_yaml(ordinary.as_ref(), &[], &[]).unwrap();
            let patch = Patch::read(payload.as_bytes(), &[], &[]).unwrap();
            assert!(
                !patch.is_null(),
                "A present element cannot be a removal: {payload}"
            );
            let restored = patch
                .apply(
                    ordinary,
                    Name {
                        namespace: String::new(),
                        local: "Value".into(),
                    },
                    &[],
                    &[],
                )
                .unwrap();
            assert_eq!(
                restored.payload_yaml(&[], &[]).unwrap(),
                original.payload_yaml(&[], &[]).unwrap(),
                "{base}: {payload}"
            );
        }
    }
}
