use super::*;
use nkdk_rule_model::{ScalarChoiceCase, ScalarChoiceXml};
fn scalar(path: &str, node: &Node) -> Result<ScalarType, Diagnostic> {
    match node.text(path)? {
        "text" => Ok(ScalarType::Text),
        "number" => Ok(ScalarType::Decimal),
        _ => Err(error(
            path,
            node.mark,
            "unsupported_scalar_choice",
            "Scalar choice currently supports text and exact number",
        )),
    }
}
pub(super) fn value(path: &str, node: &Node) -> Result<TypeDefinition, Diagnostic> {
    let fields = node.mapping(path, &["kind", "variants", "profile"])?;
    node.field(path, fields, "profile")?
        .literal(path, "decimal", "unsupported_numeric_profile")?;
    let variants = sequence(path, node.field(path, fields, "variants")?)?
        .iter()
        .map(|n| scalar(path, n))
        .collect::<Result<Vec<_>, _>>()?;
    if variants.len() != 2
        || !variants.contains(&ScalarType::Text)
        || !variants.contains(&ScalarType::Decimal)
    {
        return Err(error(
            path,
            node.mark,
            "invalid_scalar_choice",
            "Each scalar alternative must occur exactly once",
        ));
    }
    Ok(TypeDefinition::ScalarChoice(variants))
}
pub(super) fn representations(
    path: &str,
    xml: &Node,
    yaml: &Node,
) -> Result<(XmlRepresentation, YamlRepresentation), Diagnostic> {
    let fields = xml.mapping(path, &["kind", "attribute", "empty", "cases", "otherwise"])?;
    xml.field(path, fields, "kind")?
        .literal(path, "scalar-choice", "expected_scalar_choice")?;
    xml.field(path, fields, "empty")?
        .literal(path, "absent", "unsupported_empty_choice")?;
    let otherwise = scalar(path, xml.field(path, fields, "otherwise")?)?;
    let mut cases = Vec::new();
    for case in sequence(path, xml.field(path, fields, "cases")?)? {
        let fields = case.mapping(path, &["scalar", "in", "emit"])?;
        cases.push(ScalarChoiceCase {
            scalar: scalar(path, case.field(path, fields, "scalar")?)?,
            values: sequence(path, case.field(path, fields, "in")?)?
                .iter()
                .map(|n| n.text(path).map(str::to_owned))
                .collect::<Result<_, _>>()?,
            emit: optional_field(fields, "emit")
                .map(|n| n.text(path).map(str::to_owned))
                .transpose()?,
        });
    }
    let fields_yaml = yaml.mapping(path, &["kind"])?;
    yaml.field(path, fields_yaml, "kind")?.literal(
        path,
        "scalar-choice",
        "expected_scalar_choice",
    )?;
    Ok((
        XmlRepresentation::ScalarChoice(ScalarChoiceXml {
            attribute: xml.field(path, fields, "attribute")?.text(path)?.into(),
            cases,
            otherwise,
        }),
        YamlRepresentation::ScalarChoice,
    ))
}

fn sequence<'a>(path: &str, node: &'a Node) -> Result<&'a [Node], Diagnostic> {
    if let Shape::Sequence(items) = &node.shape {
        Ok(items)
    } else {
        Err(error(
            path,
            node.mark,
            "expected_sequence",
            "Expected alternatives",
        ))
    }
}
