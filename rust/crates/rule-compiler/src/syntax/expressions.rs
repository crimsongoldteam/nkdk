use super::*;
use nkdk_rule_model::StatePredicate;

pub(super) fn expression(path: &str, value: &Node) -> Result<Expression, Diagnostic> {
    if let Shape::Mapping(entries) = &value.shape
        && entries
            .iter()
            .any(|(key, _)| matches!(&key.shape, Shape::Scalar(name, _) if name == "if"))
    {
        let fields = value.mapping(path, &["if", "then", "else"])?;
        return Ok(Expression {
            kind: ExpressionKind::Conditional {
                condition: Box::new(expression(path, value.field(path, fields, "if")?)?),
                then_value: Box::new(expression(path, value.field(path, fields, "then")?)?),
                else_value: Box::new(expression(path, value.field(path, fields, "else")?)?),
            },
            source: location(path, value),
        });
    }
    let fields = value.mapping(
        path,
        &[
            "input",
            "lookup",
            "matches",
            "isVariant",
            "variantValue",
            "variantText",
            "textSegmentPrefix",
            "textLengthAtMost",
            "textLengthEquals",
            "calendarFits",
            "decimalFits",
            "match",
            "present",
            "isNull",
            "isReady",
            "transform",
            "take",
            "firstBy",
            "ordered",
            "parameter",
            "capture",
            "sequence",
            "concat",
            "require",
            "sequence-pattern",
            "record",
            "literal",
            "not",
            "absent",
            "self",
            "var",
            "get",
            "fold",
            "each",
            "exists",
            "one",
            "select",
            "find",
            "filter",
            "map",
            "or",
            "and",
            "eq",
            "lt",
            "lte",
            "field",
        ],
    )?;
    if fields.len() != 1 {
        return Err(error(
            path,
            value.mark,
            "invalid_expression",
            "Expected one expression operator",
        ));
    }
    let (operator, operand) = &fields[0];
    let kind = match operator.text(path)? {
        "isVariant" | "variantValue" | "variantText" => {
            let fields = operand.mapping(path, &["value", "variant"])?;
            let value = Box::new(expression(path, operand.field(path, fields, "value")?)?);
            let variant = operand.field(path, fields, "variant")?.text(path)?.into();
            match operator.text(path)? {
                "isVariant" => ExpressionKind::IsVariant { value, variant },
                "variantText" => ExpressionKind::VariantText { value, variant },
                _ => ExpressionKind::VariantValue { value, variant },
            }
        }
        "textSegmentPrefix" => {
            let fields = operand.mapping(path, &["value", "prefix", "separator"])?;
            let separator = operand
                .field(path, fields, "separator")?
                .text(path)?
                .to_owned();
            if separator.is_empty() {
                return Err(error(
                    path,
                    operand.mark,
                    "invalid_expression",
                    "Segment separator must not be empty",
                ));
            }
            ExpressionKind::TextSegmentPrefix {
                value: Box::new(expression(path, operand.field(path, fields, "value")?)?),
                prefix: Box::new(expression(path, operand.field(path, fields, "prefix")?)?),
                separator,
            }
        }
        "textLengthAtMost" | "textLengthEquals" => {
            let fields = operand.mapping(path, &["value", "limit"])?;
            let value = Box::new(expression(path, operand.field(path, fields, "value")?)?);
            let limit = Box::new(expression(path, operand.field(path, fields, "limit")?)?);
            if operator.text(path)? == "textLengthAtMost" {
                ExpressionKind::TextLengthAtMost { value, limit }
            } else {
                ExpressionKind::TextLengthEquals { value, limit }
            }
        }
        "calendarFits" => {
            let fields = operand.mapping(path, &["value", "fraction"])?;
            ExpressionKind::CalendarFits {
                value: Box::new(expression(path, operand.field(path, fields, "value")?)?),
                fraction: Box::new(expression(path, operand.field(path, fields, "fraction")?)?),
            }
        }
        "decimalFits" => {
            let fields = operand.mapping(path, &["value", "digits", "fraction", "sign"])?;
            ExpressionKind::DecimalFits {
                value: Box::new(expression(path, operand.field(path, fields, "value")?)?),
                digits: Box::new(expression(path, operand.field(path, fields, "digits")?)?),
                fraction: Box::new(expression(path, operand.field(path, fields, "fraction")?)?),
                sign: Box::new(expression(path, operand.field(path, fields, "sign")?)?),
            }
        }
        "require" => ExpressionKind::Require(Box::new(expression(path, operand)?)),
        "lookup" => {
            let fields = operand.mapping(path, &["in", "key"])?;
            ExpressionKind::Lookup {
                input: Box::new(expression(path, operand.field(path, fields, "in")?)?),
                key: Box::new(expression(path, operand.field(path, fields, "key")?)?),
            }
        }
        "matches" => {
            let fields = operand.mapping(path, &["value", "pattern"])?;
            ExpressionKind::Matches {
                value: Box::new(expression(path, operand.field(path, fields, "value")?)?),
                pattern: operand.field(path, fields, "pattern")?.text(path)?.into(),
            }
        }
        "present" | "isNull" | "isReady" => ExpressionKind::StateTest {
            predicate: match operator.text(path)? {
                "present" => StatePredicate::Present,
                "isNull" => StatePredicate::IsNull,
                "isReady" => StatePredicate::IsReady,
                _ => unreachable!("state predicate checked"),
            },
            value: Box::new(expression(path, operand)?),
        },
        "take" => {
            let fields = operand.mapping(path, &["in", "count"])?;
            let count_node = operand.field(path, fields, "count")?;
            let ScalarLiteral::Number(count) = scalar_literal(path, count_node)? else {
                return Err(error(
                    path,
                    count_node.mark,
                    "invalid_take_count",
                    "Expected nonnegative integer count",
                ));
            };
            let count = count.parse::<u64>().map_err(|_| {
                error(
                    path,
                    count_node.mark,
                    "invalid_take_count",
                    "Expected nonnegative integer count",
                )
            })?;
            ExpressionKind::Take {
                input: Box::new(expression(path, operand.field(path, fields, "in")?)?),
                count,
            }
        }
        "firstBy" | "ordered" => {
            let ordered = operator.text(path)? == "ordered";
            let fields = operand.mapping(
                path,
                if ordered {
                    &["in", "as", "key", "unique", "first", "comparison"]
                } else {
                    &["in", "as", "key"]
                },
            )?;
            let input = Box::new(expression(path, operand.field(path, fields, "in")?)?);
            let binding = operand.field(path, fields, "as")?.text(path)?.into();
            let key = Box::new(expression(path, operand.field(path, fields, "key")?)?);
            if ordered {
                operand.field(path, fields, "comparison")?.literal(
                    path,
                    "utf16",
                    "unsupported_comparison",
                )?;
                let unique_node = operand.field(path, fields, "unique")?;
                let ScalarLiteral::Boolean(unique) = scalar_literal(path, unique_node)? else {
                    return Err(error(
                        path,
                        unique_node.mark,
                        "expected_boolean",
                        "Expected unique boolean",
                    ));
                };
                let first = operand.field(path, fields, "first")?;
                let Shape::Sequence(first) = &first.shape else {
                    return Err(error(
                        path,
                        first.mark,
                        "expected_sequence",
                        "Expected preferred keys",
                    ));
                };
                let first = first
                    .iter()
                    .map(|node| expression(path, node))
                    .collect::<Result<Vec<_>, _>>()?;
                ExpressionKind::Ordered {
                    input,
                    binding,
                    key,
                    unique,
                    first,
                }
            } else {
                ExpressionKind::FirstBy {
                    input,
                    binding,
                    key,
                }
            }
        }
        "match" => {
            let fields = operand.mapping(path, &["value", "present", "absent"])?;
            let present = operand.field(path, fields, "present")?;
            let present_fields = present.mapping(path, &["as", "then"])?;
            ExpressionKind::MatchOptional {
                value: Box::new(expression(path, operand.field(path, fields, "value")?)?),
                binding: present
                    .field(path, present_fields, "as")?
                    .text(path)?
                    .into(),
                present: Box::new(expression(
                    path,
                    present.field(path, present_fields, "then")?,
                )?),
                absent: Box::new(expression(path, operand.field(path, fields, "absent")?)?),
            }
        }
        "transform" => {
            let fields = operand.mapping(path, &["local", "value"])?;
            ExpressionKind::Transform {
                local: operand.field(path, fields, "local")?.text(path)?.into(),
                value: Box::new(expression(path, operand.field(path, fields, "value")?)?),
            }
        }
        "not" => ExpressionKind::Not(Box::new(expression(path, operand)?)),
        "absent" => {
            if scalar_literal(path, operand)? != ScalarLiteral::Boolean(true) {
                return Err(error(
                    path,
                    operand.mark,
                    "invalid_absent",
                    "Expected absent: true",
                ));
            }
            ExpressionKind::Absent
        }
        "self" => {
            if scalar_literal(path, operand)? != ScalarLiteral::Boolean(true) {
                return Err(error(
                    path,
                    operand.mark,
                    "invalid_self",
                    "Expected self: true",
                ));
            }
            ExpressionKind::SelfValue
        }
        "var" => ExpressionKind::Variable(operand.text(path)?.into()),
        "field" => ExpressionKind::Field(operand.text(path)?.into()),
        "get" => {
            let fields = operand.mapping(path, &["of", "field"])?;
            ExpressionKind::Get {
                value: Box::new(expression(path, operand.field(path, fields, "of")?)?),
                field: operand.field(path, fields, "field")?.text(path)?.into(),
            }
        }
        "fold" => {
            let fields = operand.mapping(path, &["in", "initial", "as", "state", "next"])?;
            ExpressionKind::Fold {
                input: Box::new(expression(path, operand.field(path, fields, "in")?)?),
                initial: Box::new(expression(path, operand.field(path, fields, "initial")?)?),
                binding: operand.field(path, fields, "as")?.text(path)?.into(),
                state: operand.field(path, fields, "state")?.text(path)?.into(),
                next: Box::new(expression(path, operand.field(path, fields, "next")?)?),
            }
        }
        "map" => {
            let fields = operand.mapping(path, &["in", "as", "value"])?;
            ExpressionKind::Map {
                input: Box::new(expression(path, operand.field(path, fields, "in")?)?),
                binding: operand.field(path, fields, "as")?.text(path)?.into(),
                value: Box::new(expression(path, operand.field(path, fields, "value")?)?),
            }
        }
        "each" | "exists" | "one" | "select" | "find" | "filter" => {
            let fields = operand.mapping(path, &["in", "as", "where"])?;
            let input = Box::new(expression(path, operand.field(path, fields, "in")?)?);
            let binding = operand.field(path, fields, "as")?.text(path)?.into();
            let predicate = Box::new(expression(path, operand.field(path, fields, "where")?)?);
            if operator.text(path)? == "each" {
                ExpressionKind::Each {
                    input,
                    binding,
                    predicate,
                }
            } else if operator.text(path)? == "select" {
                ExpressionKind::Select {
                    input,
                    binding,
                    predicate,
                }
            } else if operator.text(path)? == "find" {
                ExpressionKind::Find {
                    input,
                    binding,
                    predicate,
                }
            } else if operator.text(path)? == "filter" {
                ExpressionKind::Filter {
                    input,
                    binding,
                    predicate,
                }
            } else if operator.text(path)? == "one" {
                ExpressionKind::One {
                    input,
                    binding,
                    predicate,
                }
            } else {
                ExpressionKind::Exists {
                    input,
                    binding,
                    predicate,
                }
            }
        }

        "and" | "or" | "eq" | "lt" | "lte" => {
            let Shape::Sequence(items) = &operand.shape else {
                return Err(error(
                    path,
                    operand.mark,
                    "expected_sequence",
                    "Expected operands",
                ));
            };
            let equal = matches!(operator.text(path)?, "eq" | "lt" | "lte");
            if (equal && items.len() != 2) || (!equal && items.is_empty()) {
                return Err(error(
                    path,
                    operand.mark,
                    "invalid_arity",
                    "Comparisons require two operands; logical lists require at least one",
                ));
            }
            let mut expressions = items
                .iter()
                .map(|item| expression(path, item))
                .collect::<Result<Vec<_>, _>>()?;
            if equal {
                let right = expressions.pop().expect("two operands checked");
                let left = expressions.pop().expect("two operands checked");
                ExpressionKind::Compare {
                    operator: match operator.text(path)? {
                        "eq" => ComparisonOperator::Equal,
                        "lt" => ComparisonOperator::LessThan,
                        "lte" => ComparisonOperator::LessOrEqual,
                        _ => unreachable!("comparison operator checked"),
                    },
                    left: Box::new(left),
                    right: Box::new(right),
                }
            } else if operator.text(path)? == "or" {
                ExpressionKind::Or(expressions)
            } else {
                ExpressionKind::And(expressions)
            }
        }
        "literal" => ExpressionKind::Literal(scalar_literal(path, operand)?),
        "input" => ExpressionKind::Input(operand.text(path)?.into()),
        "parameter" => ExpressionKind::Parameter(operand.text(path)?.into()),
        "capture" => ExpressionKind::Capture(operand.text(path)?.into()),
        "sequence-pattern" => {
            let fields = operand.mapping(path, &["prefix", "rest", "suffix"])?;
            let rest = expression(path, operand.field(path, fields, "rest")?)?;
            let ExpressionKind::Capture(rest) = rest.kind else {
                return Err(error(
                    path,
                    operand.mark,
                    "invalid_pattern_rest",
                    "Pattern rest must be a single capture",
                ));
            };
            ExpressionKind::SequencePattern {
                prefix: super::shorthands::expression_list(path, fields, "prefix")?,
                rest,
                suffix: super::shorthands::expression_list(path, fields, "suffix")?,
            }
        }
        "sequence" | "concat" => {
            let Shape::Sequence(items) = &operand.shape else {
                return Err(error(
                    path,
                    operand.mark,
                    "expected_sequence",
                    "Expected expression list",
                ));
            };
            let items = items
                .iter()
                .map(|item| expression(path, item))
                .collect::<Result<Vec<_>, _>>()?;
            if operator.text(path)? == "concat" {
                ExpressionKind::Concat(items)
            } else {
                ExpressionKind::Sequence(items)
            }
        }
        "record" => {
            let Shape::Mapping(items) = &operand.shape else {
                return Err(error(
                    path,
                    operand.mark,
                    "expected_mapping",
                    "Expected record constructor",
                ));
            };
            ExpressionKind::Record(
                items
                    .iter()
                    .map(|(key, item)| {
                        Ok(ExpressionField {
                            name: key.text(path)?.into(),
                            value: expression(path, item)?,
                        })
                    })
                    .collect::<Result<Vec<_>, Diagnostic>>()?,
            )
        }
        _ => unreachable!("closed expression operators"),
    };
    Ok(Expression {
        kind,
        source: location(path, value),
    })
}

pub(super) fn scalar_literal(path: &str, value: &Node) -> Result<ScalarLiteral, Diagnostic> {
    let Shape::Scalar(text, is_string) = &value.shape else {
        return Err(error(
            path,
            value.mark,
            "expected_scalar",
            "Expected scalar literal",
        ));
    };
    if *is_string {
        return Ok(ScalarLiteral::Text(text.clone()));
    }
    match text.as_str() {
        "true" | "True" | "TRUE" => Ok(ScalarLiteral::Boolean(true)),
        "false" | "False" | "FALSE" => Ok(ScalarLiteral::Boolean(false)),
        "" | "~" | "null" | "Null" | "NULL" => Ok(ScalarLiteral::Null),
        _ if decimal_literal(text) => Ok(ScalarLiteral::Number(text.clone())),
        _ => Err(error(
            path,
            value.mark,
            "invalid_number",
            "Expected finite decimal literal",
        )),
    }
}

pub(super) fn decimal_literal(text: &str) -> bool {
    let mut bytes = text.bytes().peekable();
    if matches!(bytes.peek(), Some(b'+' | b'-')) {
        bytes.next();
    }
    let mut digits = 0;
    while bytes.peek().is_some_and(u8::is_ascii_digit) {
        bytes.next();
        digits += 1;
    }
    if bytes.peek() == Some(&b'.') {
        bytes.next();
        while bytes.peek().is_some_and(u8::is_ascii_digit) {
            bytes.next();
            digits += 1;
        }
    }
    if digits == 0 {
        return false;
    }
    if matches!(bytes.peek(), Some(b'e' | b'E')) {
        bytes.next();
        if matches!(bytes.peek(), Some(b'+' | b'-')) {
            bytes.next();
        }
        let mut exponent_digits = 0;
        while bytes.peek().is_some_and(u8::is_ascii_digit) {
            bytes.next();
            exponent_digits += 1;
        }
        if exponent_digits == 0 {
            return false;
        }
    }
    bytes.next().is_none()
}
