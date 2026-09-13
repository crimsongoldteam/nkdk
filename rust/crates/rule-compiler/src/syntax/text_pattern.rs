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
    let mut result: Vec<TextPatternPart> = Vec::new();
    for (index, item) in items.iter().enumerate() {
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
