use nkdk_conversion_core::{
    proof,
    xml::{self, PropertyProjection, Tree, Writer},
};

#[test]
fn projection_preserves_lexical_values_before_a_choice_is_selected() {
    let source = br#"<Root xmlns="urn:form" xmlns:p="urn:outer"><Value kind="text">Plain</Value><Ignored/><Value2 xmlns:p="urn:inner">p:Thing</Value2><Inherited>p:Outer</Inherited><Unprefixed>Local</Unprefixed><Escaped><![CDATA[Plain]]>&amp;More</Escaped></Root>"#;
    for (element, expected, qname) in [
        ("Value", "Plain", None),
        ("Value2", "p:Thing", Some(("urn:inner", "Thing"))),
        ("Inherited", "p:Outer", Some(("urn:outer", "Outer"))),
        ("Unprefixed", "Local", Some(("urn:form", "Local"))),
        ("Escaped", "Plain&More", None),
    ] {
        let route = [("urn:form", "Root"), ("urn:form", element)];
        for projection in [
            PropertyProjection::Element,
            PropertyProjection::WithoutAttributes(&[("", "kind")]),
        ] {
            // Before selecting a branch the compiler only knows that this path
            // may contain QName text. Projection must not act on that union.
            let document =
                xml::project_property(source, &route, projection, |_, _| false, |_| true).unwrap();
            let mut text = String::new();
            xml::visit_scoped(&document, |path, token, scope| {
                if xml::matches(path, &route) {
                    match token {
                        xml::Token::Text(value) => text.push_str(value),
                        xml::Token::End if qname.is_some() => {
                            assert_eq!(Some(scope.resolve_qname(&text).unwrap()), qname)
                        }
                        _ => {}
                    }
                }
                Ok(())
            })
            .unwrap();
            assert_eq!(text, expected);
            assert!(!std::str::from_utf8(&document).unwrap().contains("Ignored"));
        }
    }
    for invalid in [
        "<Root xmlns='urn:form'><Value/><Value/></Root>",
        "<Root xmlns='urn:form'><Value/><Ignored>&unknown;</Ignored></Root>",
        "<Root xmlns='urn:form'><Value/></Root><Other/>",
    ] {
        assert!(
            xml::project_property(
                invalid.as_bytes(),
                &[("urn:form", "Root"), ("urn:form", "Value")],
                PropertyProjection::Element,
                |_, _| false,
                |_| true
            )
            .is_err()
        );
    }
}

#[test]
fn shared_routes_preserve_siblings_and_reject_foreign_patch_content() {
    let parent = [("", "Root"), ("", "Shared")];
    let first = [("", "Deep"), ("", "Item")];
    let second = [("", "Deep"), ("", "Other")];
    let source =
        b"<Root><Shared><Deep><Item extra=\"kept\"/><Other>text</Other></Deep></Shared></Root>";
    let project = |route: &[(&str, &str)]| {
        xml::project_property(
            source,
            &parent,
            PropertyProjection::Path(route),
            |_, _| false,
            |_| false,
        )
        .unwrap()
    };
    let first_xml = project(&first);
    proof::verify(
        b"<Root><Shared><Deep><Item extra=\"kept\"/></Deep></Shared></Root>",
        &first_xml,
        |_| false,
    )
    .unwrap();
    let a = Tree::capture(&first_xml, &parent).unwrap().unwrap();
    let b = Tree::capture(&project(&second), &parent).unwrap().unwrap();
    let mut writer = Writer::new(&[]);
    a.write_owned_at(&mut writer, &parent, &first, &[]).unwrap();
    b.write_owned_at(&mut writer, &parent, &second, &[])
        .unwrap();
    proof::verify(source, &writer.finish(), |_| false).unwrap();

    for invalid in [
        "<Root><Shared><Deep changed=\"no\"><Item/></Deep></Shared></Root>",
        "<Root><Shared><Deep><Other/></Deep></Shared></Root>",
    ] {
        let tree = Tree::capture(invalid.as_bytes(), &parent).unwrap().unwrap();
        assert!(
            tree.write_owned_at(&mut Writer::new(&[]), &parent, &first, &[])
                .is_err()
        );
    }

    let source=b"<Root xmlns:p='urn:one'><Shared><Item><Type>p:X</Type></Item><Other/><Item xmlns:p='urn:two'><Type>p:Y</Type></Item></Shared></Root>";
    let is_type = |path: &[xml::Name]| path.last().is_some_and(|name| name.local == "Type");
    let tree = Tree::capture_with_qnames(source, &parent, is_type)
        .unwrap()
        .unwrap();
    let mut documents = Vec::new();
    tree.visit_child_documents(&parent, ("", "Item"), &[], |document| {
        documents.push(document.to_vec());
        Ok(())
    })
    .unwrap();
    assert_eq!(documents.len(), 2);
    let mut lexical_documents = Vec::new();
    xml::visit_property_documents(
        source,
        &[("", "Root"), ("", "Shared"), ("", "Item")],
        |document| {
            lexical_documents.push(document.to_vec());
            Ok(())
        },
    )
    .unwrap();
    assert_eq!(lexical_documents.len(), documents.len());
    for (lexical, expanded) in lexical_documents.iter().zip(&documents) {
        proof::verify_with_qnames(lexical, expanded, |_| false, |_, _| false, is_type).unwrap();
    }
    for (document, (namespace, value)) in documents.iter().zip([("urn:one", "X"), ("urn:two", "Y")])
    {
        let expected = format!(
            "<Root xmlns:q='{namespace}'><Shared><Item><Type>q:{value}</Type></Item></Shared></Root>"
        );
        proof::verify_with_qnames(
            expected.as_bytes(),
            document,
            |_| false,
            |_, _| false,
            is_type,
        )
        .unwrap();
    }
    assert!(
        tree.visit_child_documents(&[], ("", "Item"), &[], |_| Ok(()))
            .is_err()
    );
}

#[test]
fn root_child_member_projection_retains_repeats_and_nil() {
    let source=b"<Root xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\"><Other>kept</Other><Value>one</Value><Value xsi:nil=\"true\"/><Value>one</Value></Root>";
    let projected = xml::project_property(
        source,
        &[("", "Root"), ("", "Value")],
        PropertyProjection::Members,
        |_, _| false,
        |_| false,
    )
    .unwrap();
    let text = String::from_utf8(projected).unwrap();
    assert!(!text.contains("Other"), "{text}");
    assert_eq!(text.matches("<Value").count(), 3);
    assert!(text.contains("nil="), "{text}");
    assert!(
        xml::project_property(
            source,
            &[("", "Root")],
            PropertyProjection::Members,
            |_, _| false,
            |_| false
        )
        .is_err()
    );
}
