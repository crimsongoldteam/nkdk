use super::{Node, Shape, error, location, named_nodes, optional_field, scalar_literal};
use nkdk_rule_model::{
    CaseShift, CharacterClass, Diagnostic, EmptyTextResult, ScalarLiteral, TextCase, TextCondition,
    TextEmit, TextFlag, TextPredicate, TextResult, TextTransform, TextTransition,
};

pub(super) fn decode(path: &str, node: &Node) -> Result<TextTransform, Diagnostic> {
    let fields = node.mapping(
        path,
        &["kind", "units", "classes", "state", "transitions", "result"],
    )?;
    node.field(path, fields, "units")?
        .literal(path, "utf16", "unsupported_text_units")?;
    let classes_node = node.field(path, fields, "classes")?;
    let classes = named_nodes(path, Some(classes_node))?
        .iter()
        .map(|(key, value)| {
            let ranges = sequence(path, value)?
                .iter()
                .map(|range| utf16_range(path, range))
                .collect::<Result<Vec<_>, _>>()?;
            Ok(CharacterClass {
                name: key.text(path)?.into(),
                ranges,
                source: location(path, key),
            })
        })
        .collect::<Result<Vec<_>, Diagnostic>>()?;
    let transitions_node = node.field(path, fields, "transitions")?;
    let transitions = sequence(path, transitions_node)?
        .iter()
        .map(|entry| {
            let fields = entry.mapping(path, &["when", "emit", "set"])?;
            let emit = entry.field(path, fields, "emit")?;
            let emit = match emit.text(path)? {
                "append" => TextEmit::Append,
                "start-token" => TextEmit::StartToken,
                "discard" => TextEmit::Discard,
                _ => {
                    return Err(error(
                        path,
                        emit.mark,
                        "invalid_text_emit",
                        "Unknown text action",
                    ));
                }
            };
            Ok(TextTransition {
                when: optional_field(fields, "when")
                    .map(|node| condition(path, node))
                    .transpose()?,
                emit,
                set: flags(path, entry.field(path, fields, "set")?)?,
                source: location(path, entry),
            })
        })
        .collect::<Result<Vec<_>, Diagnostic>>()?;
    Ok(TextTransform {
        classes,
        state: flags(path, node.field(path, fields, "state")?)?,
        transitions,
        result: result(path, node.field(path, fields, "result")?)?,
    })
}

fn sequence<'a>(path: &str, node: &'a Node) -> Result<&'a [Node], Diagnostic> {
    let Shape::Sequence(items) = &node.shape else {
        return Err(error(
            path,
            node.mark,
            "expected_sequence",
            "Expected sequence",
        ));
    };
    Ok(items)
}

fn integer(path: &str, node: &Node) -> Result<i32, Diagnostic> {
    let ScalarLiteral::Number(value) = scalar_literal(path, node)? else {
        return Err(error(
            path,
            node.mark,
            "expected_integer",
            "Expected exact integer",
        ));
    };
    value.parse().map_err(|_| {
        error(
            path,
            node.mark,
            "expected_integer",
            "Expected integer in supported range",
        )
    })
}

fn utf16_range(path: &str, node: &Node) -> Result<(u16, u16), Diagnostic> {
    let items = sequence(path, node)?;
    if items.len() != 2 {
        return Err(error(
            path,
            node.mark,
            "invalid_character_range",
            "Expected two range endpoints",
        ));
    }
    let start = integer(path, &items[0])?;
    let end = integer(path, &items[1])?;
    if !(0..=65535).contains(&start) || !(start..=65535).contains(&end) {
        return Err(error(
            path,
            node.mark,
            "invalid_character_range",
            "Expected increasing UTF-16 endpoints",
        ));
    }
    Ok((start as u16, end as u16))
}

fn boolean(path: &str, node: &Node) -> Result<bool, Diagnostic> {
    match scalar_literal(path, node)? {
        ScalarLiteral::Boolean(value) => Ok(value),
        _ => Err(error(
            path,
            node.mark,
            "expected_boolean",
            "Expected boolean literal",
        )),
    }
}

fn flags(path: &str, node: &Node) -> Result<Vec<TextFlag>, Diagnostic> {
    named_nodes(path, Some(node))?
        .iter()
        .map(|(key, value)| {
            Ok(TextFlag {
                name: key.text(path)?.into(),
                value: boolean(path, value)?,
                source: location(path, key),
            })
        })
        .collect()
}

fn condition(path: &str, node: &Node) -> Result<TextPredicate, Diagnostic> {
    let fields = node.mapping(
        path,
        &[
            "class",
            "flag",
            "tokenEmpty",
            "nextAfterRun",
            "and",
            "or",
            "not",
        ],
    )?;
    if fields.len() != 1 {
        return Err(error(
            path,
            node.mark,
            "invalid_text_condition",
            "Expected one text condition",
        ));
    }
    let (operator, operand) = &fields[0];
    let kind = match operator.text(path)? {
        "class" => TextCondition::Class(operand.text(path)?.into()),
        "flag" => TextCondition::Flag(operand.text(path)?.into()),
        "tokenEmpty" => {
            if !boolean(path, operand)? {
                return Err(error(
                    path,
                    operand.mark,
                    "invalid_text_condition",
                    "Expected tokenEmpty: true",
                ));
            }
            TextCondition::TokenEmpty
        }
        "nextAfterRun" => {
            let fields = operand.mapping(path, &["class", "is", "end"])?;
            let class = operand.field(path, fields, "class")?.text(path)?.into();
            let next = match (optional_field(fields, "is"), optional_field(fields, "end")) {
                (Some(next), None) => Some(next.text(path)?.into()),
                (None, Some(end)) if boolean(path, end)? => None,
                _ => {
                    return Err(error(
                        path,
                        operand.mark,
                        "invalid_text_condition",
                        "Expected is or end: true",
                    ));
                }
            };
            TextCondition::NextAfterRun { class, next }
        }
        "and" | "or" => {
            let items = sequence(path, operand)?;
            if items.is_empty() {
                return Err(error(
                    path,
                    operand.mark,
                    "invalid_arity",
                    "Expected nonempty conditions",
                ));
            }
            let items = items
                .iter()
                .map(|node| condition(path, node))
                .collect::<Result<Vec<_>, _>>()?;
            if operator.text(path)? == "and" {
                TextCondition::And(items)
            } else {
                TextCondition::Or(items)
            }
        }
        "not" => TextCondition::Not(Box::new(condition(path, operand)?)),
        _ => unreachable!("closed text operators"),
    };
    Ok(TextPredicate {
        kind,
        source: location(path, node),
    })
}

fn result(path: &str, node: &Node) -> Result<TextResult, Diagnostic> {
    let fields = node.mapping(
        path,
        &[
            "separator",
            "first",
            "rest",
            "lowercase",
            "emptyInput",
            "noTokens",
        ],
    )?;
    let lowercase = node.field(path, fields, "lowercase")?;
    let lowercase = sequence(path, lowercase)?
        .iter()
        .map(|node| {
            let fields = node.mapping(path, &["from", "offset"])?;
            Ok(CaseShift {
                from: utf16_range(path, node.field(path, fields, "from")?)?,
                offset: integer(path, node.field(path, fields, "offset")?)?,
                source: location(path, node),
            })
        })
        .collect::<Result<Vec<_>, Diagnostic>>()?;
    Ok(TextResult {
        separator: node.field(path, fields, "separator")?.text(path)?.into(),
        first: casing(path, node.field(path, fields, "first")?)?,
        rest: casing(path, node.field(path, fields, "rest")?)?,
        lowercase,
        empty_input: empty_result(path, node.field(path, fields, "emptyInput")?)?,
        no_tokens: empty_result(path, node.field(path, fields, "noTokens")?)?,
    })
}

fn casing(path: &str, node: &Node) -> Result<TextCase, Diagnostic> {
    let fields = node.mapping(path, &["kind", "class"])?;
    let kind = node.field(path, fields, "kind")?;
    match kind.text(path)? {
        "identity" => {
            node.mapping(path, &["kind"])?;
            Ok(TextCase::Identity)
        }
        "lower-first-unless-all-in-class" => Ok(TextCase::LowerFirstUnlessAllInClass(
            node.field(path, fields, "class")?.text(path)?.into(),
        )),
        _ => Err(error(
            path,
            kind.mark,
            "invalid_text_case",
            "Unknown casing policy",
        )),
    }
}

fn empty_result(path: &str, node: &Node) -> Result<EmptyTextResult, Diagnostic> {
    match node.text(path)? {
        "absent" => Ok(EmptyTextResult::Absent),
        "empty-text" => Ok(EmptyTextResult::EmptyText),
        _ => Err(error(
            path,
            node.mark,
            "invalid_text_result",
            "Unknown empty result",
        )),
    }
}
