use nkdk_conversion_core::xml::{self, ScopedSource, Token, Writer};

fn names(source: &[u8]) -> nkdk_conversion_core::Result<Vec<(String, String)>> {
    let mut buffered = Vec::new();
    let mut result = Vec::new();
    let mut text = String::new();
    xml::ScopedEvents(|consume: &mut xml::ScopedConsumer<'_>| {
        xml::DocumentSource(source).visit_scoped(|path, token, scope| consume(path, token, scope))
    })
    .visit_scoped(|path, token, scope| {
        buffered.push((
            path.to_vec(),
            xml::BufferedToken::from_token(token),
            scope.to_owned(),
        ));
        Ok(())
    })?;
    for (path, event, scope) in buffered {
        event.visit(|token| {
            let scope = scope.as_scope();
            if path.last().is_some_and(|name| name.local == "Value") {
                match token {
                    Token::Start(_) => text.clear(),
                    Token::Text(part) => text.push_str(part),
                    Token::End => {
                        let (namespace, local) = scope.resolve_qname(&text)?;
                        result.push((namespace.to_owned(), local.to_owned()));
                    }
                    _ => (),
                }
            }
            Ok::<(), nkdk_conversion_core::RuntimeDiagnostic>(())
        })?;
    }
    Ok(result)
}

#[test]
fn qname_text_uses_the_current_scope_across_text_events() {
    let xml = br#"<Root xmlns:p="urn:outer" xmlns="urn:default"><Value>p:Thing</Value><Wrap xmlns:p="urn:inner"><Value><![CDATA[p:]]>Other</Value></Wrap><Value>Plain</Value><Value xmlns="">Plain</Value><Value>p&#58;Thing</Value></Root>"#;
    assert_eq!(
        names(xml).unwrap(),
        [
            ("urn:outer", "Thing"),
            ("urn:inner", "Other"),
            ("urn:default", "Plain"),
            ("", "Plain"),
            ("urn:outer", "Thing")
        ]
        .map(|(namespace, local)| (namespace.to_owned(), local.to_owned()))
    );
    for value in [
        "",
        "p:",
        ":Name",
        "p:1",
        "p:Name:Other",
        "p:Name Other",
        "missing:Name",
    ] {
        let xml = format!("<Root xmlns:p=\"urn:outer\"><Value>{value}</Value></Root>");
        assert!(names(xml.as_bytes()).is_err(), "{value}");
    }
}

#[test]
fn qname_writer_requires_valid_names_and_registered_uris() {
    let mut writer = Writer::new(&["urn:example"]);
    writer
        .qname_field(&[("", "Root"), ("", "Value")], ("urn:example", "Thing"))
        .unwrap();
    assert_eq!(
        names(&writer.finish()).unwrap(),
        [("urn:example".into(), "Thing".into())]
    );
    for name in [
        ("urn:missing", "Thing"),
        ("urn:example", "1Thing"),
        ("urn:example", "other:Thing"),
    ] {
        assert!(
            Writer::new(&["urn:example"])
                .qname_field(&[("", "Value")], name)
                .is_err()
        );
    }
    let mut writer = Writer::new(&[]);
    writer
        .qname_field(
            &[("", "Value")],
            ("http://www.w3.org/XML/1998/namespace", "lang"),
        )
        .unwrap();
    assert_eq!(
        names(&writer.finish()).unwrap(),
        [("http://www.w3.org/XML/1998/namespace".into(), "lang".into())]
    );
}

#[test]
fn qname_proof_compares_expanded_names_and_keeps_invalid_text_literal() {
    let original = br#"<Root xmlns:p="urn:type"><Value>p:Thing</Value></Root>"#;
    let renamed = br#"<Root xmlns:q="urn:type"><Value><![CDATA[q:]]>Thing</Value></Root>"#;
    let other = br#"<Root xmlns:p="urn:other"><Value>p:Thing</Value></Root>"#;
    let verify = |left: &[u8], right: &[u8]| {
        nkdk_conversion_core::proof::verify_with_qnames(
            left,
            right,
            |_| true,
            |_, _| false,
            |path| path.last().is_some_and(|name| name.local == "Value"),
        )
    };
    verify(original, renamed).unwrap();
    assert!(verify(original, other).is_err());
    assert!(nkdk_conversion_core::proof::verify(original, renamed, |_| true).is_err());
    let unknown = b"<Root><Value>p:Thing</Value></Root>";
    verify(unknown, unknown).unwrap();
    assert!(verify(unknown, original).is_err());
    let mixed = b"<Root><Value>p:<Child/>Thing</Value></Root>";
    verify(mixed, mixed).unwrap();
    nkdk_conversion_core::proof::verify_with_qnames(
        b"<Root><Value><Other/></Value></Root>",
        b"<Root>\n  <Value>\n    <Other/>\n  </Value>\n</Root>",
        |path| path.last().is_some_and(|name| name.local == "Value"),
        |_, _| false,
        |path| path.last().is_some_and(|name| name.local == "Value"),
    )
    .unwrap();
}

#[test]
fn xsi_type_is_always_compared_as_an_expanded_qname() {
    let original = br#"<Root xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:p="urn:type"><Value xsi:type="p:Thing"><Child>text</Child></Value></Root>"#;
    let renamed =
        br#"<Root xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:q="urn:type">
  <Value xsi:type="q:Thing">
    <Child>text</Child>
  </Value>
</Root>"#;
    let other = br#"<Root xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:q="urn:other"><Value xsi:type="q:Thing"/></Root>"#;

    nkdk_conversion_core::proof::verify(original, renamed, |_| true).unwrap();
    assert!(nkdk_conversion_core::proof::verify(original, other, |_| false).is_err());
}

#[test]
fn qname_anomaly_patches_keep_namespace_meaning_without_lexical_guessing() {
    use xml::{Name, Patch, Tree};
    let target = &[("", "Root"), ("", "Value")];
    let ordinary = br#"<Root xmlns:q="urn:type"><Value>q:Thing</Value></Root>"#;
    let capture = |source: &[u8]| {
        Tree::capture_with_qnames(source, target, |path| xml::matches(path, target))
            .unwrap()
            .unwrap()
    };
    for spelling in ["unknown:Thing", "bad:name:tail", ""] {
        let original = format!("<Root><Value ref=\"{spelling}\"/></Root>");
        let tree = capture(original.as_bytes());
        let payload = tree.payload_yaml(&[], &[("", "ref")]).unwrap();
        let tree = Patch::read_full(payload.as_bytes(), &[], &[("", "ref")])
            .unwrap()
            .apply(
                None,
                Name {
                    namespace: String::new(),
                    local: "Value".into(),
                },
                &[],
                &[("", "ref")],
            )
            .unwrap();
        let mut writer = Writer::new(&[]);
        tree.write_at(&mut writer, &[("", "Root")], &[("", "ref")])
            .unwrap();
        nkdk_conversion_core::proof::verify_with_attributes(
            original.as_bytes(),
            &writer.finish(),
            |_| false,
            |_, name| name.local == "ref",
        )
        .unwrap();
    }
    for original in [
        br#"<Root xmlns:p="urn:type"><Value flag="x">p:Thing</Value></Root>"#.as_slice(),
        br#"<Root xmlns:p="urn:other"><Value>p:Thing</Value></Root>"#,
        b"<Root><Value>{urn:type}Thing</Value></Root>",
        b"<Root><Value>unknown:Thing</Value></Root>",
    ] {
        let source = capture(original);
        let patch = source
            .patch_yaml(Some(&capture(ordinary)), &[], &[])
            .unwrap();
        if original.windows(4).any(|window| window == b"flag") {
            assert!(
                !patch.contains("#text") && !patch.contains("#qname"),
                "{patch}"
            );
        }
        let restored = Patch::read(patch.as_bytes(), &[], &[])
            .unwrap()
            .apply(
                Some(capture(ordinary)),
                Name {
                    namespace: String::new(),
                    local: "Value".into(),
                },
                &[],
                &[],
            )
            .unwrap();
        let restored_xml = write_tree(&restored);
        nkdk_conversion_core::proof::verify_with_qnames(
            original,
            &restored_xml,
            |path| xml::matches(path, target),
            |_, _| false,
            |path| xml::matches(path, target),
        )
        .unwrap_or_else(|error| {
            panic!(
                "{} => {patch} => {}: {error:?}",
                String::from_utf8_lossy(original),
                String::from_utf8_lossy(&restored_xml)
            )
        });
    }
    for invalid in [
        "'#qname': [uri]",
        "'#qname': [uri, 'a:b']",
        "'#qname': [uri, Name]\n'#text': ''",
        "'#qname': [uri, Name]\nChild: text",
    ] {
        assert!(
            Tree::from_payload_yaml(
                invalid.as_bytes(),
                Name {
                    namespace: String::new(),
                    local: "Value".into()
                },
                &[],
                &[]
            )
            .is_err(),
            "{invalid}"
        );
    }
}

fn write_tree(tree: &nkdk_conversion_core::xml::Tree) -> Vec<u8> {
    let mut namespaces = Vec::new();
    tree.collect_namespaces(&mut namespaces);
    let mut writer = Writer::new(&namespaces);
    tree.write_at(&mut writer, &[("", "Root")], &[]).unwrap();
    writer.finish()
}

#[test]
fn proof_classifies_qname_per_occurrence_without_reinterpreting_text() {
    let original = br#"<Root xmlns="urn:form" xmlns:p="urn:value"><Value>Plain</Value><Value>p:Thing</Value></Root>"#;
    let restored = br#"<f:Root xmlns:f="urn:form" xmlns:q="urn:value"><f:Value>Plain</f:Value><f:Value>q:Thing</f:Value></f:Root>"#;
    let check = |restored: &[u8]| {
        nkdk_conversion_core::proof::verify_with_value_qnames(
            original,
            restored,
            &[],
            |_, _| true,
            |_, _| false,
            |path, occurrences| path.len() == 2 && occurrences[1] == 2,
        )
    };
    check(restored).unwrap();
    let tree = xml::Tree::capture_with_value_qnames(
        original,
        &[("urn:form", "Root")],
        |path, occurrences| path.len() == 2 && occurrences[1] == 2,
    )
    .unwrap()
    .unwrap();
    let preserved = tree.document(&[]).unwrap();
    check(&preserved).unwrap();
    assert!(String::from_utf8(preserved).unwrap().contains(">Plain<"));

    for changed in [
        String::from_utf8(restored.to_vec())
            .unwrap()
            .replace("urn:value", "urn:other"),
        String::from_utf8(restored.to_vec())
            .unwrap()
            .replace(">Plain<", ">f:Plain<"),
    ] {
        assert!(check(changed.as_bytes()).is_err(), "{changed}");
    }
}

#[test]
fn static_names_cache_keeps_nested_context_out_of_the_cache() {
    use nkdk_conversion_core::xml::StaticNames;
    let outer = StaticNames::new();
    let inner = StaticNames::new();
    let calls = std::cell::Cell::new(0);
    assert_eq!(
        outer.get(|| {
            inner.get(|| {
                calls.set(calls.get() + 1);
                vec![("", "nested")]
            })
        }),
        vec![("", "nested")]
    );
    assert_eq!(outer.get(|| panic!("outer rebuilt")), vec![("", "nested")]);
    // A nested result may omit an active recursive ancestor. It must never
    // initialize the inner cache used by a later independent root traversal.
    assert_eq!(
        inner.get(|| {
            calls.set(calls.get() + 1);
            vec![("", "complete")]
        }),
        vec![("", "complete")]
    );
    assert_eq!(
        inner.get(|| panic!("inner rebuilt")),
        vec![("", "complete")]
    );
    assert_eq!(calls.get(), 2);
    let recovering = StaticNames::new();
    assert!(std::panic::catch_unwind(|| recovering.get(|| panic!("failed traversal"))).is_err());
    assert_eq!(
        recovering.get(|| vec![("", "recovered")]),
        vec![("", "recovered")]
    );
}
