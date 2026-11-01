use super::*;
use nkdk_rule_model::ShorthandRepresentation;

pub(super) fn shorthands(path: &str, value: &Node) -> Result<Vec<Shorthand>, Diagnostic> {
    let Shape::Sequence(items) = &value.shape else {
        return Err(error(
            path,
            value.mark,
            "expected_sequence",
            "Expected shorthand list",
        ));
    };
    items
        .iter()
        .map(|item| {
            let fields = item.mapping(
                path,
                &["id", "representation", "denotes", "when", "canonical"],
            )?;
            let node = item.field(path, fields, "representation")?;
            let rep_fields = node.mapping(
                path,
                &[
                    "kind",
                    "scalar",
                    "capture",
                    "prefix",
                    "suffix",
                    "absentKeys",
                    "literal",
                    "field",
                ],
            )?;
            let kind = node.field(path, rep_fields, "kind")?;
            let representation = match kind.text(path)? {
                "scalar" => {
                    if let Some(field) = optional_field(rep_fields, "field") {
                        node.mapping(path, &["kind", "scalar", "field"])?;
                        if let Some(scalar) = optional_field(rep_fields, "scalar") {
                            scalar.literal(path, "text", "unsupported_scalar")?;
                        }
                        ShorthandRepresentation::ScalarField(field.text(path)?.to_owned())
                    } else if let Some(literal) = optional_field(rep_fields, "literal") {
                        node.mapping(path, &["kind", "literal"])?;
                        ShorthandRepresentation::ScalarLiteral(literal.text(path)?.to_owned())
                    } else {
                        node.mapping(path, &["kind", "scalar", "capture", "prefix", "suffix"])?;
                        node.field(path, rep_fields, "scalar")?.literal(
                            path,
                            "text",
                            "unsupported_scalar",
                        )?;
                        ShorthandRepresentation::ScalarText {
                            prefix: optional_field(rep_fields, "prefix")
                                .map(|value| value.text(path).map(str::to_owned))
                                .transpose()?
                                .unwrap_or_default(),
                            suffix: optional_field(rep_fields, "suffix")
                                .map(|value| value.text(path).map(str::to_owned))
                                .transpose()?
                                .unwrap_or_default(),
                        }
                    }
                }
                "mapping" => {
                    node.mapping(path, &["kind", "field"])?;
                    ShorthandRepresentation::MappingField(
                        node.field(path, rep_fields, "field")?
                            .text(path)?
                            .to_owned(),
                    )
                }
                "keyed-mapping" => {
                    node.mapping(path, &["kind", "capture", "prefix", "suffix", "absentKeys"])?;
                    ShorthandRepresentation::KeyedMapping {
                        prefix: expression_list(path, rep_fields, "prefix")?,
                        suffix: expression_list(path, rep_fields, "suffix")?,
                        absent_keys: expression_list(path, rep_fields, "absentKeys")?,
                    }
                }
                _ => {
                    return Err(error(
                        path,
                        kind.mark,
                        "unsupported_representation",
                        "Unknown shorthand representation",
                    ));
                }
            };
            let id = item.field(path, fields, "id")?;
            Ok(Shorthand {
                canonical: optional_field(fields, "canonical")
                    .map(|value| match scalar_literal(path, value)? {
                        ScalarLiteral::Boolean(value) => Ok(value),
                        _ => Err(error(
                            path,
                            value.mark,
                            "expected_boolean",
                            "Expected boolean literal",
                        )),
                    })
                    .transpose()?
                    .unwrap_or(true),
                id: id.text(path)?.into(),
                capture: if matches!(
                    representation,
                    ShorthandRepresentation::ScalarLiteral(_)
                        | ShorthandRepresentation::MappingField(_)
                        | ShorthandRepresentation::ScalarField(_)
                ) {
                    String::new()
                } else {
                    node.field(path, rep_fields, "capture")?.text(path)?.into()
                },
                denotes: if matches!(
                    representation,
                    ShorthandRepresentation::MappingField(_)
                        | ShorthandRepresentation::ScalarField(_)
                ) {
                    if optional_field(fields, "denotes").is_some() {
                        return Err(error(
                            path,
                            item.mark,
                            "implicit_projection",
                            "A field projection derives its meaning from the ordinary mapping",
                        ));
                    }
                    Expression {
                        kind: ExpressionKind::Absent,
                        source: location(path, id),
                    }
                } else {
                    expression(path, item.field(path, fields, "denotes")?)?
                },
                representation,
                when: optional_field(fields, "when")
                    .map(|node| expression(path, node))
                    .transpose()?,
                source: location(path, id),
            })
        })
        .collect()
}

pub(super) fn expression_list(
    path: &str,
    fields: &[(Node, Node)],
    name: &str,
) -> Result<Vec<Expression>, Diagnostic> {
    let Some(node) = optional_field(fields, name) else {
        return Ok(vec![]);
    };
    let Shape::Sequence(items) = &node.shape else {
        return Err(error(
            path,
            node.mark,
            "expected_sequence",
            "Expected a list of pattern expressions",
        ));
    };
    items.iter().map(|node| expression(path, node)).collect()
}
