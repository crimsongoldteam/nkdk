use nkdk_conversion_core::yaml::{self, MappingLiteralFilter};

#[test]
fn selected_mapping_omits_only_its_declared_discriminator() {
    let source = "Значение:\n  Вид: Рамка\n  Значение:\n    Ширина: 5\n    Имя: Вид\n";
    let mut filter = MappingLiteralFilter::new(2, "Вид", "Рамка");
    let mut seen = Vec::new();
    yaml::visit_nodes(source.as_bytes(), |node, _| {
        if let Some(node) = filter.consume(node)? {
            seen.push(node);
        }
        Ok(())
    })
    .unwrap();
    filter.finish().unwrap();
    assert_eq!(seen.len(), 12);
    assert!(
        matches!(&seen[5], yaml::Node::Scalar(value, _) if value.clone().into_text().unwrap() == "Ширина")
    );
}

#[test]
fn selected_mapping_rejects_repeated_or_changed_discriminator() {
    for source in [
        "Значение:\n  Вид: Рамка\n  Вид: Рамка\n",
        "Значение:\n  Вид: Цвет\n",
    ] {
        let mut filter = MappingLiteralFilter::new(2, "Вид", "Рамка");
        let result = yaml::visit_nodes(source.as_bytes(), |node, _| {
            filter.consume(node).map(|_| ())
        });
        assert!(result.is_err());
    }
}
