use nkdk_conversion_core::xml::{Name, Patch, Tree, Writer};

#[test]
fn legacy_one_c_raw_patch_resolves_standard_prefixes_without_local_bindings() {
    let qnames = [("http://www.w3.org/2001/XMLSchema-instance", "type")];
    let patch = Patch::read(b"_xsi:type: v8:Null\n_xsi:nil: null", &[], &qnames).unwrap();
    assert_eq!(patch.to_yaml(), "_xsi:type: v8:Null\n_xsi:nil: null");
    assert!(Patch::read(b"_xsi:type: v8:Null", &[("xsi", "urn:custom")], &qnames).is_ok());
    assert!(Patch::read(b"_unknown:type: v8:Null", &[], &qnames).is_err());
}

#[test]
fn legacy_null_type_patch_removes_canonical_xsi_nil() {
    let qnames = [("http://www.w3.org/2001/XMLSchema-instance", "type")];
    let source =
        br#"<FillValue xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xs="http://www.w3.org/2001/XMLSchema" xsi:nil="true" xsi:type="xs:string"/>"#;
    let apply = |raw: &[u8]| {
        let ordinary = Tree::capture(source, &[("", "FillValue")])
            .unwrap()
            .unwrap();
        Patch::read(raw, &[], &qnames)
            .unwrap()
            .apply(
                Some(ordinary),
                Name {
                    namespace: String::new(),
                    local: "FillValue".into(),
                },
                &[],
                &qnames,
            )
            .unwrap()
            .payload_yaml(&[], &qnames)
            .unwrap()
    };
    let payload = apply(b"_xsi:type: v8:Null");
    assert!(payload.contains("Null"), "{payload}");
    assert!(!payload.contains("nil"), "{payload}");
    for raw in [
        b"_xsi:type: xs:string".as_slice(),
        b"_xsi:type: v8:Null\n_xsi:nil: \"true\"".as_slice(),
    ] {
        assert!(apply(raw).contains("nil"));
    }
}

fn apply_to_value(patch: &Patch, ordinary: Option<Tree>) -> Tree {
    patch
        .apply(
            ordinary,
            Name {
                namespace: String::new(),
                local: "Value".into(),
            },
            &[],
            &[],
        )
        .unwrap()
}

#[test]
fn full_raw_patch_does_not_inherit_a_canonical_nil_attribute() {
    let source = b"<Root xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\"><Value xsi:nil=\"true\"/></Root>";
    let base = Tree::capture(source, &[("", "Root"), ("", "Value")])
        .unwrap()
        .unwrap();
    let patch = Patch::read(b"\"#replace\": 'true'\n\"#text\": oops", &[], &[]).unwrap();
    assert!(patch.is_replacement());
    let attribute = ("http://www.w3.org/2001/XMLSchema-instance", "type");
    for (payload, inherits) in [
        ("_extra: kept", true),
        (
            "_{http://www.w3.org/2001/XMLSchema-instance}type: null",
            false,
        ),
        ("_xsi:type: '{urn:test}Other'", false),
        ("'#replace': 'true'\n_extra: kept", false),
        ("null", false),
    ] {
        assert_eq!(
            Patch::read(payload.as_bytes(), &[], &[])
                .unwrap()
                .inherits_attribute(attribute, &[])
                .unwrap(),
            inherits,
            "{payload}"
        );
    }

    assert!(
        !Patch::read(b"_format: null", &[], &[])
            .unwrap()
            .is_replacement()
    );
    let restored = patch
        .apply(
            Some(base),
            Name {
                namespace: String::new(),
                local: "Value".into(),
            },
            &[],
            &[],
        )
        .unwrap();
    let mut writer = Writer::new(&[]);
    restored
        .write_at(&mut writer, &[("", "Root")], &[])
        .unwrap();
    let xml = String::from_utf8(writer.finish()).unwrap();
    assert!(xml.contains("<Value>oops</Value>"), "{xml}");
    assert!(!xml.contains("nil="), "{xml}");
    assert!(patch.to_yaml().contains("#replace"), "{}", patch.to_yaml());
}

#[test]
fn captured_full_patch_replaces_content_instead_of_merging_it() {
    let capture = |xml: &str| {
        Tree::capture(xml.as_bytes(), &[("", "Root"), ("", "Value")])
            .unwrap()
            .unwrap()
    };
    let original = capture("<Root><Value><OnlyOriginal/></Value></Root>");
    let payload = original.full_patch_yaml(&[], &[]).unwrap();
    let patch = Patch::read(payload.as_bytes(), &[], &[]).unwrap();
    let restored = apply_to_value(
        &patch,
        Some(capture("<Root><Value><OnlyCanonical/></Value></Root>")),
    );
    assert_eq!(
        restored.payload_yaml(&[], &[]).unwrap(),
        original.payload_yaml(&[], &[]).unwrap()
    );
}

#[test]
fn patch_restores_repeated_children_and_missing_siblings() {
    let desired = b"<Root><Properties><Name>N</Name></Properties><ChildObjects><Form>A</Form><Form>B</Form></ChildObjects></Root>";
    let ordinary = b"<Root><Properties><Name>N</Name><Comment/></Properties><ChildObjects><Form>A</Form><Form>B</Form></ChildObjects><Properties><Another/></Properties></Root>";
    let capture = |xml: &[u8]| Tree::capture(xml, &[("", "Root")]).unwrap().unwrap();
    let expected = capture(desired);
    let base = capture(ordinary);
    let payload = expected.patch_yaml(Some(&base), &[], &[]).unwrap();
    let restored = Patch::read(payload.as_bytes(), &[], &[])
        .unwrap()
        .apply(
            Some(base),
            Name {
                namespace: String::new(),
                local: "Root".into(),
            },
            &[],
            &[],
        )
        .unwrap();
    assert_eq!(
        restored.payload_yaml(&[], &[]).unwrap(),
        expected.payload_yaml(&[], &[]).unwrap()
    );
}
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
    for (source, expected) in [
        ("null", None),
        ("'{urn:other}Item'", Some(("urn:other", "Item"))),
        ("'Item'", Some(("", "Item"))),
    ] {
        assert_eq!(
            Patch::read(source.as_bytes(), &[], &[])
                .unwrap()
                .attribute_qname()
                .unwrap(),
            expected
        );
    }
    assert!(
        Patch::read(b"'{broken'", &[], &[])
            .unwrap()
            .attribute_qname()
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
        // Unresolved QName text is retained as an input anomaly.
        "_x:type: bad:Type",
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
        b"_x:type: [x]".as_slice(),
        b"_xmlns: x",
        b"Item: !xml/raw {}",
    ] {
        assert!(Patch::read(invalid, &ns, &qnames).is_err());
    }
}

#[test]
fn patch_matches_prefixed_and_expanded_names_as_the_same_attribute() {
    let actual = patched_title(
        b"<Root xmlns:x=\"urn:x\" xmlns:v=\"urn:v\"><Title x:type=\"v:Old\">text</Title></Root>",
        b"_{urn:x}type: '{urn:v}New'\n'#text': text",
    );
    assert_eq!(actual, "_{urn:x}type: \"{urn:v}New\"\n\"#text\": text");
}

#[test]
fn text_patch_replaces_children_from_another_declared_form() {
    let actual = patched_title(
        b"<Root xmlns:x=\"urn:x\" xmlns:v=\"urn:v\"><Title x:type=\"v:Local\"><v:item>old</v:item></Title></Root>",
        b"_{urn:x}type: '{urn:v}Text'\n'#text': new",
    );
    assert_eq!(actual, "_{urn:x}type: \"{urn:v}Text\"\n\"#text\": new");
}

fn patched_title(source: &[u8], patch: &[u8]) -> String {
    let ns = [("x", "urn:x"), ("v", "urn:v")];
    let qnames = [("urn:x", "type")];
    let ordinary = Tree::capture(source, &[("", "Root"), ("", "Title")])
        .unwrap()
        .unwrap();
    let restored = Patch::read(patch, &ns, &qnames)
        .unwrap()
        .apply(
            Some(ordinary),
            Name {
                namespace: String::new(),
                local: "Title".into(),
            },
            &ns,
            &qnames,
        )
        .unwrap();
    restored.payload_yaml(&[], &qnames).unwrap()
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
            let restored = apply_to_value(&patch, ordinary);
            assert_eq!(
                restored.payload_yaml(&[], &[]).unwrap(),
                original.payload_yaml(&[], &[]).unwrap(),
                "{base}: {payload}"
            );
        }
    }
}

#[test]
fn preserved_qname_classification_tracks_repeated_children_and_literal_text() {
    let patch = Patch::read(
        b"Value:\n  - '#qname': [urn:types, String]\n  - '#text': literal\nOther: untouched",
        &[],
        &[],
    )
    .unwrap();
    let name = |local: &str| nkdk_conversion_core::xml::Name {
        namespace: String::new(),
        local: local.into(),
    };
    assert_eq!(patch.text_is_qname(&[name("Value")], &[1], &[]), Some(true));
    assert_eq!(
        patch.text_is_qname(&[name("Value")], &[2], &[]),
        Some(false)
    );
    assert_eq!(patch.text_is_qname(&[name("Missing")], &[1], &[]), None);
    let full = Patch::read(b"'#replace': 'true'\nValue: literal", &[], &[]).unwrap();
    assert_eq!(
        full.text_is_qname(&[name("Missing")], &[1], &[]),
        Some(false)
    );
}
