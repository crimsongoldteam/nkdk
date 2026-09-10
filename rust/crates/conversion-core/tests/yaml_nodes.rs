use nkdk_conversion_core::yaml::{Node, visit_nodes};
#[test]
fn nested_mapping_keeps_occurrence_order_tags_and_positions() {
    let mut observed = Vec::new();
    visit_nodes(
        b"Title: !invalid\n  ru: one\n  en: !invalid two\n  ru: three",
        |node, position| {
            match node {
                Node::MappingStart(tag) => observed.push(format!("map:{tag:?}")),
                Node::MappingEnd => observed.push("end".into()),
                Node::Scalar(value, tag) => {
                    let text = value.into_text()?;
                    if text == "two" {
                        let error = position.apply(
                            &[],
                            nkdk_conversion_core::RuntimeDiagnostic::new("test", "test"),
                        );
                        assert_eq!((error.line, error.column), (3, 16));
                    }
                    observed.push(format!("{text}:{tag:?}"));
                }
                _ => panic!("Unexpected sequence"),
            }
            Ok(())
        },
    )
    .unwrap();
    assert_eq!(
        observed,
        [
            "map:None",
            "Title:None",
            "map:Some(\"!invalid\")",
            "ru:None",
            "one:None",
            "en:None",
            "two:Some(\"!invalid\")",
            "ru:None",
            "three:None",
            "end",
            "end"
        ]
    );
    for input in ["a: &name text\nb: *name", "{}\n---\n{}"] {
        assert!(visit_nodes(input.as_bytes(), |_, _| Ok(())).is_err());
    }
}
