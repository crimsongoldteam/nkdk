use super::*;
use nkdk_rule_model::{EnumLexeme, EnumVariant};

pub(super) fn variants(path: &str, node: &Node) -> Result<TypeDefinition, Diagnostic> {
    let fields = node.mapping(path, &["kind", "variants"])?;
    let values = node.field(path, fields, "variants")?;
    let Shape::Sequence(items) = &values.shape else {
        return Err(error(
            path,
            values.mark,
            "expected_sequence",
            "Expected enum variants",
        ));
    };
    Ok(TypeDefinition::Enum(
        items
            .iter()
            .map(|item| {
                let fields = item.mapping(path, &["name", "value"])?;
                let name = item.field(path, fields, "name")?;
                Ok(EnumVariant {
                    name: name.text(path)?.into(),
                    value: item.field(path, fields, "value")?.text(path)?.into(),
                    source: location(path, name),
                })
            })
            .collect::<Result<_, Diagnostic>>()?,
    ))
}

pub(super) fn table(
    path: &str,
    node: &Node,
    kind: &str,
    spelling: &str,
) -> Result<Vec<EnumLexeme>, Diagnostic> {
    let fields = node.mapping(path, &["kind", "values"])?;
    node.field(path, fields, "kind")?
        .literal(path, kind, "unsupported_representation")?;
    let values = node.field(path, fields, "values")?;
    let Shape::Sequence(items) = &values.shape else {
        return Err(error(
            path,
            values.mark,
            "expected_sequence",
            "Expected enum table",
        ));
    };
    items
        .iter()
        .map(|item| {
            let fields = item.mapping(
                path,
                if spelling == "text" {
                    &["value", "text", "accept"]
                } else {
                    &["value", "literal"]
                },
            )?;
            let value = item.field(path, fields, "value")?;
            Ok(EnumLexeme {
                value: value.text(path)?.into(),
                text: item.field(path, fields, spelling)?.text(path)?.into(),
                accepted: if let Some(accepted) = optional_field(fields, "accept") {
                    let Shape::Sequence(values) = &accepted.shape else {
                        return Err(error(
                            path,
                            accepted.mark,
                            "expected_sequence",
                            "Expected accepted XML spellings",
                        ));
                    };
                    values
                        .iter()
                        .map(|value| value.text(path).map(String::from))
                        .collect::<Result<_, _>>()?
                } else {
                    vec![]
                },
                source: location(path, value),
            })
        })
        .collect()
}
