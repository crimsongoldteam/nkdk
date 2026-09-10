use super::*;

pub(super) fn resolve_parameters(
    module: &Module,
    modules: &BTreeMap<&str, &Module>,
    ids: &BTreeMap<&str, u32>,
) -> Result<Vec<LinkedParameter>, Diagnostic> {
    module
        .parameters
        .iter()
        .map(|parameter| {
            let value_type = resolve_type(
                module,
                &parameter.definition,
                &parameter.source,
                modules,
                ids,
                &mut BTreeSet::new(),
            )?;
            if let Some(default) = &parameter.default {
                check_literal(default, &value_type, &parameter.source)?;
            }
            Ok(LinkedParameter {
                name: parameter.name.clone(),
                value_type,
                default: parameter.default.clone(),
                source: parameter.source.clone(),
            })
        })
        .collect()
}

pub(super) fn resolve_arguments(
    owner: &Module,
    target: &Module,
    usage: &TypeUse,
    modules: &BTreeMap<&str, &Module>,
    ids: &BTreeMap<&str, u32>,
) -> Result<Vec<LinkedExpression>, Diagnostic> {
    let parameters = resolve_parameters(target, modules, ids)?;
    for argument in &usage.arguments {
        if !parameters
            .iter()
            .any(|parameter| parameter.name == argument.name)
        {
            return Err(diagnostic(
                "unknown_parameter_argument",
                &argument.source,
                "Static parameter is not declared",
            ));
        }
    }
    parameters
        .iter()
        .map(|parameter| {
            let argument = usage
                .arguments
                .iter()
                .find(|argument| argument.name == parameter.name);
            let source = argument.map_or(&parameter.source, |argument| &argument.source);
            let kind = match argument.map(|a| &a.value) {
                Some(StaticValue::Parameter(name)) => {
                    let owner_parameters = resolve_parameters(owner, modules, ids)?;
                    let (index, owner_parameter) = owner_parameters
                        .iter()
                        .enumerate()
                        .find(|(_, p)| p.name == *name)
                        .ok_or_else(|| {
                            diagnostic(
                                "unknown_parameter",
                                source,
                                "Forwarded parameter is not declared",
                            )
                        })?;
                    if owner_parameter.value_type != parameter.value_type {
                        return Err(diagnostic(
                            "parameter_type_mismatch",
                            source,
                            "Forwarded parameter has a different type",
                        ));
                    }
                    LinkedExpressionKind::Parameter(index as u32)
                }
                value => {
                    let value = match value {
                        Some(StaticValue::Literal(value)) => Some(value),
                        None => parameter.default.as_ref(),
                        _ => unreachable!(),
                    }
                    .ok_or_else(|| {
                        diagnostic(
                            "missing_parameter_argument",
                            &usage.source,
                            "Static parameter has neither argument nor default",
                        )
                    })?;
                    check_literal(value, &parameter.value_type, source)?;
                    LinkedExpressionKind::Literal(value.clone())
                }
            };
            Ok(LinkedExpression {
                kind,
                value_type: parameter.value_type.clone(),
                source: source.clone(),
            })
        })
        .collect()
}

fn check_literal(
    value: &ScalarLiteral,
    expected: &LinkedType,
    source: &SourceLocation,
) -> Result<(), Diagnostic> {
    if let (ScalarLiteral::Number(text), LinkedType::Scalar(ScalarType::Decimal)) =
        (value, expected)
    {
        return nkdk_decimal::Decimal::parse(text)
            .map(|_| ())
            .map_err(|error| diagnostic("invalid_decimal_literal", source, &error.to_string()));
    }
    if matches!(
        (value, expected),
        (
            ScalarLiteral::Boolean(_),
            LinkedType::Scalar(ScalarType::Boolean)
        ) | (ScalarLiteral::Text(_), LinkedType::Scalar(ScalarType::Text))
    ) {
        Ok(())
    } else {
        Err(diagnostic(
            "parameter_type_mismatch",
            source,
            "Static literal does not match parameter type",
        ))
    }
}
