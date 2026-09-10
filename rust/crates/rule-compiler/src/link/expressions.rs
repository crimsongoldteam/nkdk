use super::*;

#[derive(Clone, Default)]
pub(super) struct Scope {
    pub variables: Vec<(String, LinkedType)>,
    pub captures: Vec<(String, LinkedType)>,
}

pub(super) fn resolve_expression(
    module: &Module,
    expression: &Expression,
    modules: &BTreeMap<&str, &Module>,
    ids: &BTreeMap<&str, u32>,
) -> Result<LinkedExpression, Diagnostic> {
    resolve_expression_in(module, expression, modules, ids, &Scope::default())
}

pub(super) fn resolve_expression_in(
    module: &Module,
    expression: &Expression,
    modules: &BTreeMap<&str, &Module>,
    ids: &BTreeMap<&str, u32>,
    scope: &Scope,
) -> Result<LinkedExpression, Diagnostic> {
    let (kind, value_type) = match &expression.kind {
        ExpressionKind::Transform { local, value } => {
            let transforms = text::transforms(module);
            let index = transforms
                .iter()
                .position(|item| &item.name == local)
                .ok_or_else(|| {
                    diagnostic(
                        "unknown_text_transform",
                        &expression.source,
                        "Local text transform is not declared",
                    )
                })?;
            let value = resolve_expression_in(module, value, modules, ids, scope)?;
            if value.value_type != LinkedType::Scalar(ScalarType::Text) {
                return Err(diagnostic(
                    "expression_type_mismatch",
                    &value.source,
                    "Text transform requires text",
                ));
            }
            (
                LinkedExpressionKind::Operation {
                    operator: LinkedOperator::Transform {
                        entry: ids[module.id.as_str()],
                        index: index as u32,
                    },
                    arguments: vec![value],
                },
                LinkedType::Optional(Box::new(LinkedType::Scalar(ScalarType::Text))),
            )
        }

        ExpressionKind::Take { .. }
        | ExpressionKind::FirstBy { .. }
        | ExpressionKind::Ordered { .. }
        | ExpressionKind::StateTest { .. } => {
            return collections::resolve(module, expression, modules, ids, scope);
        }
        ExpressionKind::Capture(name) => {
            let (slot, (_, value_type)) = scope
                .captures
                .iter()
                .enumerate()
                .find(|(_, (capture, _))| capture == name)
                .ok_or_else(|| {
                    diagnostic(
                        "unknown_capture",
                        &expression.source,
                        "Capture is outside shorthand scope",
                    )
                })?;
            (
                LinkedExpressionKind::Capture(slot as u32),
                value_type.clone(),
            )
        }
        ExpressionKind::Record(fields) => {
            let arguments = fields
                .iter()
                .map(|field| resolve_expression_in(module, &field.value, modules, ids, scope))
                .collect::<Result<Vec<_>, Diagnostic>>()?;
            let value_type = LinkedType::Record(
                fields
                    .iter()
                    .zip(&arguments)
                    .map(|(field, value)| LinkedField {
                        name: field.name.clone(),
                        value: value.value_type.clone(),
                        source: value.source.clone(),
                    })
                    .collect(),
            );
            (
                LinkedExpressionKind::Operation {
                    operator: LinkedOperator::Record(
                        fields.iter().map(|field| field.name.clone()).collect(),
                    ),
                    arguments,
                },
                value_type,
            )
        }
        ExpressionKind::Sequence(items) => {
            let arguments = items
                .iter()
                .map(|value| resolve_expression_in(module, value, modules, ids, scope))
                .collect::<Result<Vec<_>, Diagnostic>>()?;
            let first = arguments.first().ok_or_else(|| {
                diagnostic(
                    "unsupported_link_feature",
                    &expression.source,
                    "Empty sequence requires contextual typing",
                )
            })?;
            for value in &arguments[1..] {
                require_same(first, value)?;
            }
            let value_type = LinkedType::Sequence(Box::new(first.value_type.clone()));
            (
                LinkedExpressionKind::Operation {
                    operator: LinkedOperator::Sequence,
                    arguments,
                },
                value_type,
            )
        }
        ExpressionKind::Variable(name) => {
            let (slot, (_, value_type)) = scope
                .variables
                .iter()
                .enumerate()
                .rev()
                .find(|(_, (variable, _))| variable == name)
                .ok_or_else(|| {
                    diagnostic(
                        "unknown_variable",
                        &expression.source,
                        "Variable is outside its lexical scope",
                    )
                })?;
            (
                LinkedExpressionKind::Variable(slot as u32),
                value_type.clone(),
            )
        }
        ExpressionKind::Each {
            input,
            binding,
            predicate,
        }
        | ExpressionKind::Exists {
            input,
            binding,
            predicate,
        } => {
            let input = resolve_expression_in(module, input, modules, ids, scope)?;
            let LinkedType::Sequence(item) = &input.value_type else {
                return Err(diagnostic(
                    "expression_type_mismatch",
                    &input.source,
                    "Collection operator requires a sequence",
                ));
            };
            let mut nested = scope.clone();
            nested.variables.push((binding.clone(), *item.clone()));
            let predicate = resolve_expression_in(module, predicate, modules, ids, &nested)?;
            require_boolean(&predicate)?;
            let slot = scope.variables.len() as u32;
            let operator = if matches!(expression.kind, ExpressionKind::Each { .. }) {
                LinkedOperator::Each(slot)
            } else {
                LinkedOperator::Exists(slot)
            };
            (
                LinkedExpressionKind::Operation {
                    operator,
                    arguments: vec![input, predicate],
                },
                LinkedType::Scalar(ScalarType::Boolean),
            )
        }
        ExpressionKind::SelfValue => (
            LinkedExpressionKind::SelfValue,
            module_shape(module, modules, ids, &mut BTreeSet::new())?,
        ),
        ExpressionKind::Get { value, field } => {
            let value = resolve_expression_in(module, value, modules, ids, scope)?;
            let LinkedType::Record(fields) = &value.value_type else {
                return Err(diagnostic(
                    "expression_type_mismatch",
                    &expression.source,
                    "Member access requires a record",
                ));
            };
            let (index, selected) = fields
                .iter()
                .enumerate()
                .find(|(_, item)| &item.name == field)
                .ok_or_else(|| {
                    diagnostic(
                        "unknown_field",
                        &expression.source,
                        "Record member does not exist",
                    )
                })?;
            let value_type = selected.value.clone();
            let kind = if matches!(value.kind, LinkedExpressionKind::SelfValue) {
                LinkedExpressionKind::Field(index as u32)
            } else {
                LinkedExpressionKind::Operation {
                    operator: LinkedOperator::Get(index as u32),
                    arguments: vec![value],
                }
            };
            (kind, value_type)
        }
        ExpressionKind::Parameter(name) => {
            let (slot, parameter) = module
                .parameters
                .iter()
                .enumerate()
                .find(|(_, parameter)| &parameter.name == name)
                .ok_or_else(|| {
                    diagnostic(
                        "unknown_parameter",
                        &expression.source,
                        "Static parameter is not declared",
                    )
                })?;
            (
                LinkedExpressionKind::Parameter(slot as u32),
                resolve_type(
                    module,
                    &parameter.definition,
                    &parameter.source,
                    modules,
                    ids,
                    &mut BTreeSet::new(),
                )?,
            )
        }
        ExpressionKind::Not(value) => {
            let value = resolve_expression_in(module, value, modules, ids, scope)?;
            require_boolean(&value)?;
            (
                LinkedExpressionKind::Operation {
                    operator: LinkedOperator::Not,
                    arguments: vec![value],
                },
                LinkedType::Scalar(ScalarType::Boolean),
            )
        }
        ExpressionKind::And(values) | ExpressionKind::Or(values) => {
            let arguments = values
                .iter()
                .map(|value| {
                    let value = resolve_expression_in(module, value, modules, ids, scope)?;
                    require_boolean(&value)?;
                    Ok(value)
                })
                .collect::<Result<Vec<_>, Diagnostic>>()?;
            let operator = if matches!(expression.kind, ExpressionKind::And(_)) {
                LinkedOperator::And
            } else {
                LinkedOperator::Or
            };
            (
                LinkedExpressionKind::Operation {
                    operator,
                    arguments,
                },
                LinkedType::Scalar(ScalarType::Boolean),
            )
        }
        ExpressionKind::Compare {
            operator: ComparisonOperator::Equal,
            left,
            right,
        } => {
            let left = resolve_expression_in(module, left, modules, ids, scope)?;
            let right = resolve_expression_in(module, right, modules, ids, scope)?;
            require_same(&left, &right)?;
            (
                LinkedExpressionKind::Operation {
                    operator: LinkedOperator::Equal,
                    arguments: vec![left, right],
                },
                LinkedType::Scalar(ScalarType::Boolean),
            )
        }
        ExpressionKind::Conditional {
            condition,
            then_value,
            else_value,
        } => {
            let condition = resolve_expression_in(module, condition, modules, ids, scope)?;
            let then_value = resolve_expression_in(module, then_value, modules, ids, scope)?;
            let else_value = resolve_expression_in(module, else_value, modules, ids, scope)?;
            require_boolean(&condition)?;
            require_same(&then_value, &else_value)?;
            let value_type = then_value.value_type.clone();
            (
                LinkedExpressionKind::Operation {
                    operator: LinkedOperator::Conditional,
                    arguments: vec![condition, then_value, else_value],
                },
                value_type,
            )
        }
        ExpressionKind::Field(name) => {
            let LinkedType::Record(fields) =
                module_shape(module, modules, ids, &mut BTreeSet::new())?
            else {
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
                field.value.clone(),
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

pub(super) fn same_type(left: &LinkedType, right: &LinkedType) -> bool {
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

pub(super) fn field_shape(
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
            let result = module_shape(target, modules, ids, visiting);
            visiting.remove(&target.id);
            result
        }
        TypeDefinition::Record(fields) => Ok(LinkedType::Record(
            fields
                .iter()
                .map(|field| {
                    Ok(LinkedField {
                        name: field.name.clone(),
                        value: field_shape(
                            module,
                            &field.definition,
                            &field.source,
                            modules,
                            ids,
                            visiting,
                        )?,
                        source: field.source.clone(),
                    })
                })
                .collect::<Result<_, Diagnostic>>()?,
        )),
        TypeDefinition::Sequence(item) => Ok(LinkedType::Sequence(Box::new(field_shape(
            module, item, source, modules, ids, visiting,
        )?))),
        TypeDefinition::Local(name) => {
            let key = format!("{}:{name}", module.id);
            if !visiting.insert(key.clone()) {
                return Err(diagnostic(
                    "local_type_cycle",
                    source,
                    "Local type is recursive",
                ));
            }
            let target = module
                .types
                .iter()
                .find(|item| &item.name == name)
                .ok_or_else(|| {
                    diagnostic("missing_local_type", source, "Local type is not declared")
                })?;
            let result = field_shape(module, &target.definition, source, modules, ids, visiting);
            visiting.remove(&key);
            result
        }
        _ => resolve_type(module, value, source, modules, ids, &mut BTreeSet::new()),
    }
}

pub(super) fn require_boolean(value: &LinkedExpression) -> Result<(), Diagnostic> {
    if value.value_type == LinkedType::Scalar(ScalarType::Boolean) {
        Ok(())
    } else {
        Err(diagnostic(
            "expression_type_mismatch",
            &value.source,
            "Boolean operand is required",
        ))
    }
}
fn require_same(left: &LinkedExpression, right: &LinkedExpression) -> Result<(), Diagnostic> {
    if same_type(&left.value_type, &right.value_type) {
        Ok(())
    } else {
        Err(diagnostic(
            "expression_type_mismatch",
            &right.source,
            "Expression operands have incompatible types",
        ))
    }
}

pub(super) fn module_shape(
    module: &Module,
    modules: &BTreeMap<&str, &Module>,
    ids: &BTreeMap<&str, u32>,
    visiting: &mut BTreeSet<String>,
) -> Result<LinkedType, Diagnostic> {
    let key = format!("module:{}", module.id);
    if !visiting.insert(key.clone()) {
        return Err(diagnostic(
            "composition_cycle",
            &module.source,
            "Composed shape is cyclic",
        ));
    }
    let own = field_shape(
        module,
        &module.value,
        &module.source,
        modules,
        ids,
        visiting,
    )?;
    if module.compose.is_empty() {
        visiting.remove(&key);
        return Ok(own);
    }
    let LinkedType::Record(mut own_fields) = own else {
        return Err(diagnostic(
            "invalid_composition_role",
            &module.source,
            "Composition requires record fields",
        ));
    };
    let mut fields = vec![];
    for usage in &module.compose {
        let import = module
            .imports
            .iter()
            .find(|import| import.name == usage.name)
            .ok_or_else(|| {
                diagnostic(
                    "missing_import_alias",
                    &usage.source,
                    "Fragment alias is not declared",
                )
            })?;
        let target = modules[import.value.as_str()];
        if target.kind != ModuleKind::Fragment {
            return Err(diagnostic(
                "expected_fragment",
                &usage.source,
                "Composition target must be a fragment",
            ));
        }
        let LinkedType::Record(fragment) = module_shape(target, modules, ids, visiting)? else {
            return Err(diagnostic(
                "invalid_composition_role",
                &usage.source,
                "Fragment must contain record fields",
            ));
        };
        fields.extend(fragment);
    }
    fields.append(&mut own_fields);
    let mut seen = BTreeMap::new();
    for field in &fields {
        if let Some(first) = seen.insert(&field.name, &field.source) {
            let mut error = diagnostic("duplicate_field", &field.source, "Composed fields collide");
            error.related.push(first.clone());
            return Err(error);
        }
    }
    visiting.remove(&key);
    Ok(LinkedType::Record(fields))
}
