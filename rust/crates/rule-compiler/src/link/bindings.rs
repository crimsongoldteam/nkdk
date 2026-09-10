use super::*;

pub(super) fn resolve_bindings(
    module: &Module,
    target: &Module,
    usage: &TypeUse,
    modules: &BTreeMap<&str, &Module>,
    ids: &BTreeMap<&str, u32>,
) -> Result<Vec<LinkedBinding>, Diagnostic> {
    for binding in &usage.bindings {
        if !target.inputs.iter().any(|input| input.name == binding.name) {
            return Err(diagnostic(
                "unknown_input_binding",
                &binding.value.source,
                "Binding target input is not declared",
            ));
        }
    }
    let mut result = vec![];
    for (slot, input) in target.inputs.iter().enumerate() {
        let binding = usage
            .bindings
            .iter()
            .find(|binding| binding.name == input.name)
            .ok_or_else(|| {
                diagnostic(
                    "missing_input_binding",
                    &usage.source,
                    "Required input has no binding",
                )
            })?;
        let value = resolve_expression(module, &binding.value, modules, ids)?;
        let expected = resolve_type(
            target,
            &input.definition,
            &input.source,
            modules,
            ids,
            &mut BTreeSet::new(),
        )?;
        if !same_type(&value.value_type, &expected) {
            let mut error = diagnostic(
                "binding_type_mismatch",
                &binding.value.source,
                "Binding does not match the declared input type",
            );
            error.related.push(input.source.clone());
            return Err(error);
        }
        result.push(LinkedBinding {
            slot: slot as u32,
            value,
        });
    }
    Ok(result)
}

fn resolve_expression(
    module: &Module,
    expression: &Expression,
    modules: &BTreeMap<&str, &Module>,
    ids: &BTreeMap<&str, u32>,
) -> Result<LinkedExpression, Diagnostic> {
    let (kind, value_type) = match &expression.kind {
        ExpressionKind::Field(name) => {
            if !module.compose.is_empty() {
                return Err(diagnostic(
                    "unsupported_link_feature",
                    &expression.source,
                    "Field binding across composition is not linked yet",
                ));
            }
            let TypeDefinition::Record(fields) = &module.value else {
                return Err(diagnostic(
                    "unknown_field",
                    &expression.source,
                    "Field reference requires a record",
                ));
            };
            let (index, field) = fields
                .iter()
                .enumerate()
                .find(|(_, field)| &field.name == name)
                .ok_or_else(|| {
                    diagnostic("unknown_field", &expression.source, "Field is not declared")
                })?;
            (
                LinkedExpressionKind::Field(index as u32),
                field_shape(
                    module,
                    &field.definition,
                    &expression.source,
                    modules,
                    ids,
                    &mut BTreeSet::new(),
                )?,
            )
        }
        ExpressionKind::Input(name) => {
            let (slot, input) = module
                .inputs
                .iter()
                .enumerate()
                .find(|(_, input)| &input.name == name)
                .ok_or_else(|| {
                    diagnostic(
                        "unknown_input",
                        &expression.source,
                        "Expression input is not declared",
                    )
                })?;
            (
                LinkedExpressionKind::Input(slot as u32),
                resolve_type(
                    module,
                    &input.definition,
                    &input.source,
                    modules,
                    ids,
                    &mut BTreeSet::new(),
                )?,
            )
        }
        ExpressionKind::Literal(literal) => {
            let scalar = match literal {
                ScalarLiteral::Text(_) => ScalarType::Text,
                ScalarLiteral::Boolean(_) => ScalarType::Boolean,
                _ => {
                    return Err(diagnostic(
                        "unsupported_link_feature",
                        &expression.source,
                        "Literal type is not linked yet",
                    ));
                }
            };
            (
                LinkedExpressionKind::Literal(literal.clone()),
                LinkedType::Scalar(scalar),
            )
        }
        _ => {
            return Err(diagnostic(
                "unsupported_link_feature",
                &expression.source,
                "Binding expression is not linked yet",
            ));
        }
    };
    Ok(LinkedExpression {
        kind,
        value_type,
        source: expression.source.clone(),
    })
}

fn same_type(left: &LinkedType, right: &LinkedType) -> bool {
    match (left, right) {
        (LinkedType::Scalar(a), LinkedType::Scalar(b)) => a == b,
        (LinkedType::Reference(a), LinkedType::Reference(b)) => a == b,
        (LinkedType::Sequence(a), LinkedType::Sequence(b)) => same_type(a, b),
        (LinkedType::Record(a), LinkedType::Record(b)) => {
            a.len() == b.len()
                && a.iter().all(|field| {
                    b.iter()
                        .find(|other| other.name == field.name)
                        .is_some_and(|other| same_type(&field.value, &other.value))
                })
        }
        _ => false,
    }
}

fn field_shape(
    module: &Module,
    value: &TypeDefinition,
    source: &SourceLocation,
    modules: &BTreeMap<&str, &Module>,
    ids: &BTreeMap<&str, u32>,
    visiting: &mut BTreeSet<String>,
) -> Result<LinkedType, Diagnostic> {
    match value {
        TypeDefinition::Use(usage) => {
            let import = module
                .imports
                .iter()
                .find(|import| import.name == usage.name)
                .ok_or_else(|| {
                    diagnostic(
                        "missing_import_alias",
                        &usage.source,
                        "Import alias is not declared",
                    )
                })?;
            let target = modules[import.value.as_str()];
            if !visiting.insert(target.id.clone()) {
                return Err(diagnostic(
                    "recursive_value_type",
                    source,
                    "Recursive value shape needs an explicit recursion contract",
                ));
            }
            let result = field_shape(target, &target.value, source, modules, ids, visiting);
            visiting.remove(&target.id);
            result
        }
        _ => resolve_type(module, value, source, modules, ids, &mut BTreeSet::new()),
    }
}
