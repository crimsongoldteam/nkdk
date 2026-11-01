use super::*;
use nkdk_rule_model::{TextPatternPart, TextPatternValue};

pub(super) fn sequence_separator(path: &str, node: &Node) -> Result<Option<String>, Diagnostic> {
    if !matches!(&node.shape, Shape::Mapping(fields) if optional_field(fields, "kind").is_some_and(|kind| kind.text(path).is_ok_and(|kind| kind == "text-sequence")))
    {
        return Ok(None);
    }
    let fields = node.mapping(path, &["kind", "separator"])?;
    let separator = node.field(path, fields, "separator")?;
    let text = separator.text(path)?;
    if text.is_empty() {
        return Err(error(
            path,
            separator.mark,
            "text_sequence_separator",
            "Separator must be nonempty",
        ));
    }
    Ok(Some(text.into()))
}

pub(super) fn applies(path: &str, node: &Node) -> bool {
    matches!(&node.shape, Shape::Mapping(fields) if optional_field(fields,"kind").is_some_and(|kind|kind.text(path).is_ok_and(|text|text=="text-pattern")))
}
pub(super) fn yaml_record(path: &str, node: &Node) -> Result<YamlRepresentation, Diagnostic> {
    if matches!(&node.shape, Shape::Mapping(fields) if optional_field(fields,"kind").is_some_and(|kind|kind.text(path).is_ok_and(|text|text=="projection")))
    {
        let fields = node.mapping(path, &["kind", "field"])?;
        return Ok(YamlRepresentation::Projection(
            node.field(path, fields, "field")?.text(path)?.into(),
        ));
    }
    if matches!(&node.shape, Shape::Mapping(fields) if optional_field(fields,"kind").is_some_and(|kind|kind.text(path).is_ok_and(|text|text=="grouped-sequence")))
    {
        let fields = node.mapping(path, &["kind", "groups"])?;
        let groups = node.field(path, fields, "groups")?;
        let Shape::Sequence(rows) = &groups.shape else {
            return Err(error(
                path,
                groups.mark,
                "expected_sequence",
                "Expected groups",
            ));
        };
        let mut result = Vec::new();
        for row in rows {
            let fields = row.mapping(path, &["field", "itemTag"])?;
            result.push(nkdk_rule_model::YamlGroup {
                field: row.field(path, fields, "field")?.text(path)?.into(),
                item_tag: optional_field(fields, "itemTag")
                    .map(|value| super::semantic_item_tag(path, value))
                    .transpose()?,
                source: location(path, row),
            });
        }
        if result.is_empty() {
            return Err(error(
                path,
                groups.mark,
                "empty_yaml_groups",
                "Expected at least one group",
            ));
        }
        return Ok(YamlRepresentation::GroupedSequence(result));
    }
    if applies(path, node) {
        Ok(YamlRepresentation::TextPattern(parse(path, node)?))
    } else {
        Ok(YamlRepresentation::Mapping(yaml_fields(path, node)?))
    }
}
pub(super) fn parse(path: &str, node: &Node) -> Result<Vec<TextPatternPart>, Diagnostic> {
    let fields = node.mapping(path, &["kind", "parts", "separator"])?;
    let separator = optional_field(fields, "separator")
        .map(|value| value.text(path))
        .transpose()?;
    if separator == Some("") {
        return Err(error(
            path,
            node.mark,
            "text_pattern_separator",
            "Separator must be nonempty",
        ));
    }
    let parts = node.field(path, fields, "parts")?;
    let Shape::Sequence(items) = &parts.shape else {
        return Err(error(
            path,
            parts.mark,
            "expected_sequence",
            "Expected text pattern parts",
        ));
    };
    parse_items(path, items, separator)
}
fn parse_items(
    path: &str,
    items: &[Node],
    separator: Option<&str>,
) -> Result<Vec<TextPatternPart>, Diagnostic> {
    let mut result: Vec<TextPatternPart> = Vec::new();
    for (index, item) in items.iter().enumerate() {
        let fields = item.mapping(path, &["field", "literal", "optional", "parts"])?;
        if let Some(controller) = optional_field(fields, "optional") {
            item.mapping(path, &["optional", "parts"])?;
            if separator.is_some() {
                return Err(error(
                    path,
                    item.mark,
                    "text_pattern_group",
                    "Optional groups use explicit delimiters",
                ));
            }
            let parts = item.field(path, fields, "parts")?;
            let Shape::Sequence(children) = &parts.shape else {
                return Err(error(
                    path,
                    parts.mark,
                    "expected_sequence",
                    "Expected optional group parts",
                ));
            };
            result.push(TextPatternPart {
                value: TextPatternValue::Optional {
                    field: controller.text(path)?.into(),
                    parts: parse_items(path, children, None)?,
                },
                separator: None,
                source: location(path, controller),
            });
            continue;
        }
        let pair = item.mapping(path, &["field", "literal"])?;
        if pair.len() != 1 {
            return Err(error(
                path,
                item.mark,
                "text_pattern_part",
                "Expected exactly one field or literal",
            ));
        }
        let text = pair[0].1.text(path)?.to_owned();
        let source = location(path, &pair[0].1);
        if let Some(separator) = separator {
            if pair[0].0.text(path)? == "literal" {
                let layout = [
                    nkdk_conversion_core::text_pattern::Part::Slot(0),
                    nkdk_conversion_core::text_pattern::Part::Literal(separator),
                ];
                let invalid = text.contains(separator)
                    || (index + 1 < items.len()
                        && nkdk_conversion_core::text_pattern::Pattern::<1>::new(&layout)
                            .expect("nonempty separator")
                            .check_values(&[&text])
                            .is_err());
                if invalid {
                    return Err(error(
                        path,
                        item.mark,
                        "text_pattern_literal",
                        "Literal must fit one delimited cell",
                    ));
                }
            }
            if index != 0 {
                append_literal(&mut result, separator, source.clone());
            }
        }
        if pair[0].0.text(path)? == "field" {
            result.push(TextPatternPart {
                value: TextPatternValue::Field(text),
                separator: separator.map(str::to_owned),
                source,
            });
        } else {
            append_literal(&mut result, &text, source);
        }
    }
    Ok(result)
}

fn append_literal(
    parts: &mut Vec<TextPatternPart>,
    text: &str,
    source: nkdk_rule_model::SourceLocation,
) {
    if text.is_empty() {
        return;
    }
    if let Some(TextPatternPart {
        value: TextPatternValue::Literal(previous),
        ..
    }) = parts.last_mut()
    {
        previous.push_str(text);
    } else {
        parts.push(TextPatternPart {
            value: TextPatternValue::Literal(text.into()),
            separator: None,
            source,
        });
    }
}
