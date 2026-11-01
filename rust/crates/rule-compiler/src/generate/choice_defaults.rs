use super::*;

/// A projected literal record retains its complete meaning in the comparison.
/// Reading its declared YAML representation must reconstruct the hidden fields too.
pub(super) fn projected_record(
    owner: &LinkedEntry,
    target: &LinkedEntry,
    expression: &LinkedExpression,
    program: &Program,
) -> Result<Option<(String, String)>, Diagnostic> {
    if let (
        YamlRepresentation::TextPattern(parts),
        LinkedType::Record(fields),
        LinkedExpressionKind::Operation {
            operator: LinkedOperator::Record(names),
            arguments,
        },
    ) = (&target.yaml, &target.value, &expression.kind)
        && fields.is_empty()
        && names.is_empty()
        && arguments.is_empty()
        && parts.len() <= 1
    {
        let lexical = parts
            .iter()
            .map(|part| match &part.value {
                nkdk_rule_model::TextPatternValue::Literal(value) => Some(value.as_str()),
                _ => None,
            })
            .collect::<Option<Vec<_>>>();
        if let Some(lexical) = lexical {
            return Ok(Some((
                serde_json::to_string(&lexical.concat()).expect("literal pattern"),
                "true".into(),
            )));
        }
    }
    let (
        YamlRepresentation::Projection(projection),
        LinkedType::Record(fields),
        LinkedExpressionKind::Operation {
            operator: LinkedOperator::Record(names),
            arguments,
        },
    ) = (&target.yaml, &target.value, &expression.kind)
    else {
        return Ok(None);
    };
    let mut checks = Vec::new();
    let mut lexical = None;
    for (index, field) in fields.iter().enumerate() {
        let slot = names
            .iter()
            .position(|name| *name == field.name)
            .ok_or_else(|| {
                unsupported(owner, "A record default must define every semantic field")
            })?;
        let value = &arguments[slot];
        let (yaml, check) = match &value.kind {
            LinkedExpressionKind::Literal(ScalarLiteral::Number(value)) => {
                let number = nkdk_decimal::Decimal::parse(value)
                    .map_err(|_| unsupported(owner, "Invalid record default decimal"))?;
                let (negative, digits, exponent) = number.parts();
                (
                    value.clone(),
                    format!(
                        "matches!(core::inputs::RecordInput::field(selected,{index}),Some(core::inputs::InputRef::Decimal(actual)) if actual==&core::decimal::Decimal::constant({negative},{digits:?},{exponent}))"
                    ),
                )
            }
            LinkedExpressionKind::Literal(ScalarLiteral::Text(value)) => (
                serde_json::to_string(value).expect("text literal"),
                format!(
                    "matches!(core::inputs::RecordInput::field(selected,{index}),Some(core::inputs::InputRef::Text(actual)) if actual=={value:?})"
                ),
            ),
            LinkedExpressionKind::Literal(ScalarLiteral::Boolean(value)) => (
                value.to_string(),
                format!(
                    "matches!(core::inputs::RecordInput::field(selected,{index}),Some(core::inputs::InputRef::Boolean({value})))"
                ),
            ),
            _ => {
                return Err(unsupported(
                    owner,
                    "Projected record defaults require literal scalar fields",
                ));
            }
        };
        if field.name == *projection {
            if let (
                scalar::Codec::Enumeration(_, _, rows),
                LinkedExpressionKind::Literal(ScalarLiteral::Text(meaning)),
            ) = (
                scalar::Codec::resolve(&field.value, target, program)?,
                &value.kind,
            ) {
                let row = rows
                    .iter()
                    .find(|row| row.value == *meaning)
                    .ok_or_else(|| {
                        unsupported(
                            owner,
                            "Projected enum default has no declared YAML spelling",
                        )
                    })?;
                lexical = Some(serde_json::to_string(&row.text).expect("enum literal"));
            } else if let (
                scalar::Codec::Boolean(_, rows),
                LinkedExpressionKind::Literal(ScalarLiteral::Boolean(meaning)),
            ) = (
                scalar::Codec::resolve(&field.value, target, program)?,
                &value.kind,
            ) {
                let spelling = rows
                    .iter()
                    .find(|row| row.value == *meaning)
                    .ok_or_else(|| {
                        unsupported(
                            owner,
                            "Projected boolean default has no declared YAML spelling",
                        )
                    })?;
                lexical = Some(serde_json::to_string(&spelling.text).expect("boolean literal"));
            } else if matches!(
                field.value,
                LinkedType::Scalar(ScalarType::Text | ScalarType::Decimal)
            ) {
                lexical = Some(yaml);
            } else {
                return Err(unsupported(
                    owner,
                    "Projected record default needs a native text or decimal representation",
                ));
            }
        }
        checks.push(check);
    }
    let lexical = lexical.ok_or_else(|| unsupported(owner, "Missing default projection field"))?;
    Ok(Some((lexical, checks.join("&&"))))
}
