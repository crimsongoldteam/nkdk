use nkdk_conversion_core::xml::Tree;

#[test]
fn captured_subtree_can_be_rebased_to_a_declaration_root() {
    let source = b"<Owner><Items><Item code='x'><Name>leaf</Name></Item></Items></Owner>";
    let offset = source
        .windows(b"<Item code".len())
        .position(|part| part == b"<Item code")
        .unwrap();
    let mut tree = Tree::capture_at(
        source,
        &[("", "Owner"), ("", "Items"), ("", "Item")],
        offset,
    )
    .unwrap()
    .unwrap();
    tree.rename_root(nkdk_conversion_core::xml::Name {
        namespace: String::new(),
        local: "Node".into(),
    });
    nkdk_conversion_core::proof::verify(
        b"<Node code=\"x\"><Name>leaf</Name></Node>",
        &tree.document(&[]).unwrap(),
        |_| false,
    )
    .unwrap();
    let nested = tree
        .document_at(&[("urn:owner", "Owner"), ("urn:schema", "Items")], &[])
        .unwrap();
    nkdk_conversion_core::proof::verify(
        b"<o:Owner xmlns:o='urn:owner' xmlns:s='urn:schema'><s:Items><Node code='x'><Name>leaf</Name></Node></s:Items></o:Owner>",
        &nested,
        |_| false,
    )
    .unwrap();
}

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
    let source = Tree::capture(b"<Root extra='keep'>old</Root>", &[("", "Root")])
        .unwrap()
        .unwrap();
    let ordinary = Tree::capture(b"<Root>old</Root>", &[("", "Root")])
        .unwrap()
        .unwrap();
    let delta = source.patch_yaml(Some(&ordinary), &[], &[]).unwrap();
    assert_eq!(delta, "_extra: keep");
    assert_eq!(
        source
            .patch_at(Some(&ordinary), &[], false, &[], &[])
            .unwrap(),
        Some(delta.clone())
    );
    let repeated = Tree::capture(b"<Root><X>a</X><X>b</X></Root>", &[("", "Root")])
        .unwrap()
        .unwrap();
    assert_eq!(
        repeated
            .patch_at(None, &[("", "X")], false, &[], &[])
            .unwrap(),
        None
    );

    assert_eq!(source.text_patch_yaml("old", &[], &[]).unwrap(), delta);
    let edited = Tree::capture(b"<Root>new</Root>", &[("", "Root")]).unwrap();
    let restored = nkdk_conversion_core::xml::Patch::read(delta.as_bytes(), &[], &[])
        .unwrap()
        .apply(
            edited,
            nkdk_conversion_core::xml::Name {
                namespace: String::new(),
                local: "Root".into(),
            },
            &[],
            &[],
        )
        .unwrap();
    nkdk_conversion_core::proof::verify(
        b"<Root extra='keep'>new</Root>",
        &restored.document(&[]).unwrap(),
        |_| false,
    )
    .unwrap();
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
    let repeated = b"<Root><Value>first</Value><Value code='x'>second</Value></Root>";
    let path = &[("", "Root"), ("", "Value")];
    assert!(Tree::capture(repeated, path).is_err());
    let offset = repeated
        .windows(b"<Value code".len())
        .position(|part| part == b"<Value code")
        .unwrap();
    let selected = Tree::capture_at(repeated, path, offset).unwrap().unwrap();
    let owner = Tree::capture(repeated, &[("", "Root")]).unwrap().unwrap();
    assert_eq!(owner.count_at(&path[1..]), 2);
    assert_eq!(owner.count_at(&[("", "Unknown")]), 0);

    let mut writer = nkdk_conversion_core::xml::Writer::new(&[]);
    selected
        .write_at(&mut writer, &[("", "Root")], &[])
        .unwrap();
    nkdk_conversion_core::proof::verify(
        b"<Root><Value code='x'>second</Value></Root>",
        &writer.finish(),
        |_| false,
    )
    .unwrap();
    assert!(
        Tree::capture_at(repeated, path, offset + 1)
            .unwrap()
            .is_none()
    );
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

#[test]
fn repeated_fields_have_occurrence_specific_meaning() {
    use nkdk_conversion_core::proof::verify_with_occurrences;
    let original =
        b"<Root><Item><Value> </Value></Item><Item><Value><Child/></Value></Item></Root>";
    let restored =
        b"<Root>\n<Item><Value> </Value></Item>\n<Item><Value>\n<Child/>\n</Value></Item>\n</Root>";
    let scalar = |path: &[nkdk_conversion_core::xml::Name], positions: &[usize]| {
        path.last().is_some_and(|name| name.local == "Value") && positions[1] == 1
    };
    verify_with_occurrences(original, restored, scalar, |_, _| false, |_| false).unwrap();
    let changed = b"<Root><Item><Value/></Item><Item><Value><Child/></Value></Item></Root>";
    assert!(verify_with_occurrences(original, changed, scalar, |_, _| false, |_| false).is_err());
}

#[test]
fn selected_occurrence_keeps_its_own_qname_namespace() {
    let source = b"<Root xmlns:t='urn:first'><Value>t:First</Value><Value xmlns:t='urn:second'>t:Second</Value></Root>";
    let offset = source
        .windows(b"<Value xmlns".len())
        .position(|part| part == b"<Value xmlns")
        .unwrap();
    let tree =
        Tree::capture_at_with_qnames(source, &[("", "Root"), ("", "Value")], offset, |path| {
            path.last().is_some_and(|name| name.local == "Value")
        })
        .unwrap()
        .unwrap();
    let restored = tree.document(&[]).unwrap();
    nkdk_conversion_core::proof::verify_with_qnames(
        b"<Value xmlns:q='urn:second'>q:Second</Value>",
        &restored,
        |_| false,
        |_, _| false,
        |path| path.last().is_some_and(|name| name.local == "Value"),
    )
    .unwrap();
}
