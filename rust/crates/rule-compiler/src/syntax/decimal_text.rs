use super::*;
use nkdk_rule_model::DecimalText;
pub(super) fn parse(path: &str, node: &Node) -> Result<XmlRepresentation, Diagnostic> {
    let fields = node.mapping(
        path,
        &["kind", "decimalSeparator", "acceptDecimalSeparators"],
    )?;
    node.field(path, fields, "kind")?
        .literal(path, "text", "unsupported_representation")?;
    let separator = optional_field(fields, "decimalSeparator")
        .map(|value| character(path, value))
        .transpose()?;
    let accepted = optional_field(fields, "acceptDecimalSeparators");
    if separator.is_none() && accepted.is_none() {
        return Ok(XmlRepresentation::Decimal);
    }
    let separator = separator.unwrap_or('.');
    let accepted = if let Some(node) = accepted {
        let Shape::Sequence(values) = &node.shape else {
            return Err(error(
                path,
                node.mark,
                "expected_sequence",
                "Expected decimal separators",
            ));
        };
        values
            .iter()
            .map(|value| character(path, value))
            .collect::<Result<Vec<_>, _>>()?
    } else {
        vec![separator]
    };
    if !accepted.contains(&separator)
        || accepted
            .iter()
            .enumerate()
            .any(|(i, c)| accepted[..i].contains(c))
    {
        return Err(error(
            path,
            node.mark,
            "invalid_decimal_separators",
            "Accepted separators must be unique and include the canonical separator",
        ));
    }
    Ok(XmlRepresentation::FormattedDecimal(DecimalText {
        separator,
        accepted,
    }))
}
fn character(path: &str, node: &Node) -> Result<char, Diagnostic> {
    match node.text(path)? {
        "." => Ok('.'),
        "," => Ok(','),
        _ => Err(error(
            path,
            node.mark,
            "invalid_decimal_separator",
            "Expected dot or comma",
        )),
    }
}
