use super::*;

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
            "parameter",
            "capture",
            "sequence",
            "record",
            "literal",
            "not",
            "absent",
            "self",
            "var",
            "get",
            "each",
            "exists",
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
        "each" | "exists" => {
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
        "sequence" => {
            let Shape::Sequence(items) = &operand.shape else {
                return Err(error(
                    path,
                    operand.mark,
                    "expected_sequence",
                    "Expected sequence constructor",
                ));
            };
            ExpressionKind::Sequence(
                items
                    .iter()
                    .map(|item| expression(path, item))
                    .collect::<Result<Vec<_>, _>>()?,
            )
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
