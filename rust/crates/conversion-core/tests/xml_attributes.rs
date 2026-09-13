use nkdk_conversion_core::{proof, xml};
#[test]
fn attribute_proof_uses_expanded_names_and_only_declared_qname_values() {
    let source=br#"<Root xmlns:a="urn:value" xmlns:t="urn:attribute" plain="one&#10;line" t:type="a:Kind"><Text>body</Text></Root>"#;
    let reordered=br#"<Root xmlns:b="urn:value" xmlns:u="urn:attribute" u:type="b:Kind" plain="one&#10;line"><Text>body</Text></Root>"#;
    let equivalent=br#"<Root xmlns:b="urn:value" xmlns:u="urn:attribute" plain="one&#10;line" u:type="b:Kind"><Text>body</Text></Root>"#;
    let scalar = |path: &[xml::Name]| path.last().is_some_and(|name| name.local == "Text");
    let qname = |_: &[xml::Name], name: &xml::Name| {
        name.namespace == "urn:attribute" && name.local == "type"
    };
    proof::verify_with_attributes(source, equivalent, scalar, qname).unwrap();
    assert!(proof::verify_with_attributes(source, reordered, scalar, qname).is_err());
    assert!(proof::verify(source, equivalent, scalar).is_err());
    assert!(
        proof::verify_with_attributes(
            source,
            &String::from_utf8(equivalent.to_vec())
                .unwrap()
                .replace("urn:value", "urn:changed")
                .into_bytes(),
            scalar,
            qname
        )
        .is_err()
    );
    assert!(proof::verify(b"<Root> </Root>", b"<Root/>", |_| false).is_err());
    proof::verify(b"<Root> a</Root>", b"<Root><![CDATA[ ]]>a</Root>", |_| {
        false
    })
    .unwrap();
    use xml::Source;
    let mut document_reads = 0;
    let mut scalar_text = String::new();
    let mut attributes = 0;
    xml::Events(|consume: &mut xml::Consumer<'_>| {
        document_reads += 1;
        xml::DocumentSource(source).visit(|path, token| {
            if matches!(token, xml::Token::Attribute(_)) {
                attributes += 1;
                return Ok(());
            }
            consume(path, token)
        })
    })
    .visit(|path, token| {
        if scalar(path)
            && let xml::Token::Text(text) = token
        {
            scalar_text.push_str(text);
        }
        Ok(())
    })
    .unwrap();
    assert_eq!((document_reads, attributes), (1, 2));
    assert_eq!(scalar_text, "body");
    let attribute_namespace = String::from("urn:attribute");
    let value_namespace = String::from("urn:value");
    let root_name = String::from("Root");
    let text_name = String::from("Text");
    let namespaces = [attribute_namespace.as_str(), value_namespace.as_str()];
    let mut writer = xml::Writer::new(&namespaces);
    writer.container_with_attributes(
        &[("", root_name.as_str())],
        &[
            xml::WriteAttribute {
                name: ("", "plain"),
                value: xml::AttributeValue::Text("one\nline"),
            },
            xml::WriteAttribute {
                name: ("urn:attribute", "type"),
                value: xml::AttributeValue::QName(("urn:value", "Kind")),
            },
        ],
    );
    writer.field(
        &[("", root_name.as_str()), ("", text_name.as_str())],
        "body",
    );
    proof::verify_with_attributes(
        source,
        &writer.finish_with_root(("", root_name.as_str())),
        scalar,
        qname,
    )
    .unwrap();
    proof::verify(
        b"<Root/>",
        &xml::Writer::new(&[]).finish_with_root(("", "Root")),
        |_| false,
    )
    .unwrap();
    let mut writer = xml::Writer::new(&[]);
    writer.field(&[("", "Root"), ("", "Properties"), ("", "First")], "one");
    writer.ensure_container(&[("", "Root")]);
    writer.ensure_container(&[("", "Root"), ("", "Properties")]);
    writer.field(&[("", "Root"), ("", "Properties"), ("", "Second")], "two");
    writer.ensure_container(&[("", "Root"), ("", "Children")]);
    proof::verify(
        b"<Root><Properties><First>one</First><Second>two</Second></Properties><Children/></Root>",
        &writer.finish(),
        |path| {
            path.last()
                .is_some_and(|name| matches!(name.local.as_str(), "First" | "Second"))
        },
    )
    .unwrap();
    for invalid in [
        br#"<Root xmlns:a="urn:x" xmlns:b="urn:x" a:x="1" b:x="2"/>"#.as_slice(),
        br#"<Root a:x="1"/>"#.as_slice(),
    ] {
        assert!(xml::visit(invalid, |_, _| Ok(())).is_err());
    }
}
