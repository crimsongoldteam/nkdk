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
            let fields = item.mapping(path, &["id", "representation", "denotes", "when"])?;
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
                ],
            )?;
            let kind = node.field(path, rep_fields, "kind")?;
            let representation = match kind.text(path)? {
                "scalar" => {
                    node.mapping(path, &["kind", "scalar", "capture"])?;
                    node.field(path, rep_fields, "scalar")?.literal(
                        path,
                        "text",
                        "unsupported_scalar",
                    )?;
                    ShorthandRepresentation::ScalarText
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
                id: id.text(path)?.into(),
                representation,
                capture: node.field(path, rep_fields, "capture")?.text(path)?.into(),
                denotes: expression(path, item.field(path, fields, "denotes")?)?,
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
