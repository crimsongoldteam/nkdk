use nkdk_conversion_core::{
    proof,
    xml::{self, PropertyProjection, Tree, Writer},
};

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
