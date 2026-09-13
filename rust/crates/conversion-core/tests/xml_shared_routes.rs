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
}
