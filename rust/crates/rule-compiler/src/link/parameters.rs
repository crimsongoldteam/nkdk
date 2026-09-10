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
    target: &Module,
    usage: &TypeUse,
    modules: &BTreeMap<&str, &Module>,
    ids: &BTreeMap<&str, u32>,
) -> Result<Vec<ScalarLiteral>, Diagnostic> {
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
            let value = argument
                .map(|argument| &argument.value)
                .or(parameter.default.as_ref())
                .ok_or_else(|| {
                    diagnostic(
                        "missing_parameter_argument",
                        &usage.source,
                        "Static parameter has neither argument nor default",
                    )
                })?;
            let source = argument.map_or(&parameter.source, |argument| &argument.source);
            check_literal(value, &parameter.value_type, source)?;
            Ok(value.clone())
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
