use super::*;

#[derive(Clone, Default)]
pub(super) struct Scope {
    pub variables: Vec<(String, LinkedType)>,
    pub captures: Vec<(String, LinkedType)>,
}

impl Scope {
    pub(super) fn bind(
        &self,
        name: &str,
        value_type: LinkedType,
        source: &SourceLocation,
    ) -> Result<Self, Diagnostic> {
        if self.variables.iter().any(|(existing, _)| existing == name) {
            return Err(diagnostic(
                "duplicate_variable",
                source,
                "Nested binding cannot shadow an outer variable",
            ));
        }
        let mut nested = self.clone();
        nested.variables.push((name.into(), value_type));
        Ok(nested)
    }
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
        ExpressionKind::Lookup { input, key } => {
            let input = resolve_expression_in(module, input, modules, ids, scope)?;
            let mut key = resolve_expression_in(module, key, modules, ids, scope)?;
            let LinkedType::Index {
                key: key_type,
                value: value_type,
            } = &input.value_type
            else {
                return Err(diagnostic(
                    "expression_type_mismatch",
                    &input.source,
                    "Lookup requires a declared index input",
                ));
            };
            contextual_literals(key_type, &mut key)?;
            if !same_type(&key.value_type, key_type) {
                return Err(diagnostic(
                    "expression_type_mismatch",
                    &key.source,
                    "Lookup key does not match the index key type",
                ));
            }
            let result_type = LinkedType::Optional(value_type.clone());
            (
                LinkedExpressionKind::Operation {
                    operator: LinkedOperator::Lookup,
                    arguments: vec![input, key],
                },
                result_type,
            )
        }
        ExpressionKind::Matches { value, pattern } => {
            let value = resolve_expression_in(module, value, modules, ids, scope)?;
            if value.value_type != LinkedType::Scalar(ScalarType::Text) {
                return Err(diagnostic(
                    "expression_type_mismatch",
                    &value.source,
                    "Text pattern requires text",
                ));
            }
            regex_automata::dfa::dense::DFA::new(&format!(r"\A(?:{pattern})\z")).map_err(
                |error| {
                    diagnostic(
                        "invalid_text_pattern",
                        &expression.source,
                        &error.to_string(),
                    )
                },
            )?;
            (
                LinkedExpressionKind::Operation {
                    operator: LinkedOperator::Matches(pattern.clone()),
                    arguments: vec![value],
                },
                LinkedType::Scalar(ScalarType::Boolean),
            )
        }
        ExpressionKind::MatchOptional {
            value,
            binding,
            present,
            absent,
        } => {
            let value = resolve_expression_in(module, value, modules, ids, scope)?;
            let LinkedType::Optional(inner) = &value.value_type else {
                return Err(diagnostic(
                    "expression_type_mismatch",
                    &value.source,
                    "Optional match requires an optional value",
                ));
            };
            let nested = scope.bind(binding, *inner.clone(), &expression.source)?;
            let present = resolve_expression_in(module, present, modules, ids, &nested)?;
            let absent = resolve_expression_in(module, absent, modules, ids, scope)?;
            let value_type =
                conditional_type(&present.value_type, &absent.value_type).ok_or_else(|| {
                    diagnostic(
                        "expression_type_mismatch",
                        &expression.source,
                        "Match branches have incompatible value types",
                    )
                })?;
            (
                LinkedExpressionKind::Operation {
                    operator: LinkedOperator::MatchOptional(scope.variables.len() as u32),
                    arguments: vec![value, present, absent],
                },
                value_type,
            )
        }
        ExpressionKind::Absent => (LinkedExpressionKind::Absent, LinkedType::Absent),
        ExpressionKind::SequencePattern { .. } => {
            return Err(diagnostic(
                "invalid_pattern_context",
                &expression.source,
                "Sequence patterns are only allowed as shorthand denotations",
            ));
        }
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
        ExpressionKind::Require(value) => {
            let value = resolve_expression_in(module, value, modules, ids, scope)?;
            let LinkedType::Optional(inner) = &value.value_type else {
                return Err(diagnostic(
                    "expression_type_mismatch",
                    &value.source,
                    "Required value must be optional",
                ));
            };
            let result = *inner.clone();
            (
                LinkedExpressionKind::Operation {
                    operator: LinkedOperator::Require,
                    arguments: vec![value],
                },
                result,
            )
        }
        ExpressionKind::Concat(items) | ExpressionKind::Sequence(items) => {
            let arguments = items
                .iter()
                .map(|value| resolve_expression_in(module, value, modules, ids, scope))
                .collect::<Result<Vec<_>, Diagnostic>>()?;
            let (operator, value_type) = if matches!(expression.kind, ExpressionKind::Concat(_)) {
                for value in &arguments {
                    if value.value_type != LinkedType::Scalar(ScalarType::Text) {
                        return Err(diagnostic(
                            "expression_type_mismatch",
                            &value.source,
                            "Text concatenation requires text operands",
                        ));
                    }
                }
                (LinkedOperator::Concat, LinkedType::Scalar(ScalarType::Text))
            } else {
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
                (
                    LinkedOperator::Sequence,
                    LinkedType::Sequence(Box::new(first.value_type.clone())),
                )
            };
            (
                LinkedExpressionKind::Operation {
                    operator,
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
        ExpressionKind::Fold {
            input,
            initial,
            binding,
            state,
            next,
        } => {
            let input = resolve_expression_in(module, input, modules, ids, scope)?;
            let initial = resolve_expression_in(module, initial, modules, ids, scope)?;
            let LinkedType::Sequence(item) = &input.value_type else {
                return Err(diagnostic(
                    "expression_type_mismatch",
                    &input.source,
                    "Fold requires a sequence",
                ));
            };
            let expected = LinkedType::Optional(Box::new(LinkedType::Scalar(ScalarType::Text)));
            if initial.value_type != expected {
                return Err(diagnostic(
                    "expression_type_mismatch",
                    &initial.source,
                    "Fold state requires an optional text value",
                ));
            }
            let nested = scope
                .bind(binding, *item.clone(), &expression.source)?
                .bind(
                    state,
                    LinkedType::Scalar(ScalarType::Text),
                    &expression.source,
                )?;
            let next = resolve_expression_in(module, next, modules, ids, &nested)?;
            require_same(&initial, &next)?;
            (
                LinkedExpressionKind::Operation {
                    operator: LinkedOperator::Fold {
                        item: scope.variables.len() as u32,
                        state: scope.variables.len() as u32 + 1,
                    },
                    arguments: vec![input, initial, next],
                },
                expected,
            )
        }
        ExpressionKind::Map {
            input,
            binding,
            value,
        } => {
            let input = resolve_expression_in(module, input, modules, ids, scope)?;
            let LinkedType::Sequence(item) = &input.value_type else {
                return Err(diagnostic(
                    "expression_type_mismatch",
                    &input.source,
                    "Map requires a sequence",
                ));
            };
            let slot = scope.variables.len() as u32;
            let nested = scope.bind(binding, *item.clone(), &expression.source)?;
            let value = resolve_expression_in(module, value, modules, ids, &nested)?;
            let value_type = LinkedType::Sequence(Box::new(value.value_type.clone()));
            (
                LinkedExpressionKind::Operation {
                    operator: LinkedOperator::Map(slot),
                    arguments: vec![input, value],
                },
                value_type,
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
        }
        | ExpressionKind::One {
            input,
            binding,
            predicate,
        }
        | ExpressionKind::Select {
            input,
            binding,
            predicate,
        }
        | ExpressionKind::Find {
            input,
            binding,
            predicate,
        }
        | ExpressionKind::Filter {
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
            let nested = scope.bind(binding, *item.clone(), &expression.source)?;
            let predicate = resolve_expression_in(module, predicate, modules, ids, &nested)?;
            require_boolean(&predicate)?;
            let slot = scope.variables.len() as u32;
            let operator = if matches!(expression.kind, ExpressionKind::Each { .. }) {
                LinkedOperator::Each(slot)
            } else if matches!(expression.kind, ExpressionKind::One { .. }) {
                LinkedOperator::One(slot)
            } else if matches!(expression.kind, ExpressionKind::Select { .. }) {
                LinkedOperator::Select(slot)
            } else if matches!(expression.kind, ExpressionKind::Find { .. }) {
                LinkedOperator::Find(slot)
            } else if matches!(expression.kind, ExpressionKind::Filter { .. }) {
                LinkedOperator::Filter(slot)
            } else {
                LinkedOperator::Exists(slot)
            };
            let result_type = if matches!(
                operator,
                LinkedOperator::Select(_) | LinkedOperator::Find(_)
            ) {
                LinkedType::Optional(item.clone())
            } else if matches!(operator, LinkedOperator::Filter(_)) {
                input.value_type.clone()
            } else {
                LinkedType::Scalar(ScalarType::Boolean)
            };
            (
                LinkedExpressionKind::Operation {
                    operator,
                    arguments: vec![input, predicate],
                },
                result_type,
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
            operator,
            left,
            right,
        } => {
            let empty = |value: &Expression| matches!(&value.kind, ExpressionKind::Sequence(items) if items.is_empty());
            let (mut left, mut right) =
                if *operator == ComparisonOperator::Equal && empty(left) != empty(right) {
                    let empty_left = empty(left);
                    let (literal, other) = if empty_left {
                        (left, right)
                    } else {
                        (right, left)
                    };
                    let other = resolve_expression_in(module, other, modules, ids, scope)?;
                    if !matches!(other.value_type, LinkedType::Sequence(_)) {
                        return Err(diagnostic(
                            "expression_type_mismatch",
                            &literal.source,
                            "An empty sequence must be compared with a sequence",
                        ));
                    }
                    let literal = LinkedExpression {
                        kind: LinkedExpressionKind::Operation {
                            operator: LinkedOperator::Sequence,
                            arguments: vec![],
                        },
                        value_type: other.value_type.clone(),
                        source: literal.source.clone(),
                    };
                    if empty_left {
                        (literal, other)
                    } else {
                        (other, literal)
                    }
                } else {
                    (
                        resolve_expression_in(module, left, modules, ids, scope)?,
                        resolve_expression_in(module, right, modules, ids, scope)?,
                    )
                };
            if *operator == ComparisonOperator::Equal {
                contextual_literals(&left.value_type, &mut right)?;
                contextual_literals(&right.value_type, &mut left)?;
            }
            if contains_index(&left.value_type) || contains_index(&right.value_type) {
                return Err(diagnostic(
                    "opaque_index_comparison",
                    &expression.source,
                    "Compare lookup values, not prepared indexes",
                ));
            }
            require_same(&left, &right)?;
            if *operator != ComparisonOperator::Equal
                && left.value_type != LinkedType::Scalar(ScalarType::Decimal)
            {
                return Err(diagnostic(
                    "expression_type_mismatch",
                    &expression.source,
                    "Ordered comparison requires decimal operands",
                ));
            }
            (
                LinkedExpressionKind::Operation {
                    operator: match operator {
                        ComparisonOperator::Equal => LinkedOperator::Equal,
                        ComparisonOperator::LessThan => LinkedOperator::Less,
                        ComparisonOperator::LessOrEqual => LinkedOperator::LessEqual,
                    },
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
            let value_type = conditional_type(&then_value.value_type, &else_value.value_type)
                .ok_or_else(|| {
                    diagnostic(
                        "expression_type_mismatch",
                        &expression.source,
                        "Conditional branches have incompatible value types",
                    )
                })?;
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
                resolve_data_type(
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
                ScalarLiteral::Number(text) => {
                    nkdk_decimal::Decimal::parse(text).map_err(|error| {
                        diagnostic(
                            "invalid_decimal_literal",
                            &expression.source,
                            &error.to_string(),
                        )
                    })?;
                    ScalarType::Decimal
                }
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
    };
    Ok(LinkedExpression {
        kind,
        value_type,
        source: expression.source.clone(),
    })
}

pub(super) fn same_type(left: &LinkedType, right: &LinkedType) -> bool {
    match (left, right) {
        (LinkedType::Index { key: a, value: b }, LinkedType::Index { key: c, value: d }) => {
            same_type(a, c) && same_type(b, d)
        }
        (LinkedType::Scalar(a), LinkedType::Scalar(b)) => a == b,
        (LinkedType::Enum(a), LinkedType::Enum(b)) => {
            a.len() == b.len()
                && a.iter().all(|variant| {
                    b.iter()
                        .any(|other| variant.name == other.name && variant.value == other.value)
                })
        }
        (LinkedType::Reference(a), LinkedType::Reference(b)) => a == b,
        (LinkedType::Sequence(a), LinkedType::Sequence(b))
        | (LinkedType::Optional(a), LinkedType::Optional(b)) => same_type(a, b),
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
        TypeDefinition::Index { key, value } => Ok(LinkedType::Index {
            key: Box::new(field_shape(module, key, source, modules, ids, visiting)?),
            value: Box::new(field_shape(module, value, source, modules, ids, visiting)?),
        }),
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

fn conditional_type(a: &LinkedType, b: &LinkedType) -> Option<LinkedType> {
    if same_type(a, b) || matches!((a, b), (LinkedType::Absent, LinkedType::Absent)) {
        return Some(a.clone());
    }
    match (a, b) {
        (LinkedType::Absent, LinkedType::Optional(_)) => Some(b.clone()),
        (LinkedType::Optional(_), LinkedType::Absent) => Some(a.clone()),
        (LinkedType::Absent, other) | (other, LinkedType::Absent) => {
            Some(LinkedType::Optional(Box::new(other.clone())))
        }
        (LinkedType::Optional(inner), other) | (other, LinkedType::Optional(inner))
            if same_type(inner, other) =>
        {
            Some(LinkedType::Optional(inner.clone()))
        }
        _ => None,
    }
}

pub(super) fn contextual_literals(
    expected: &LinkedType,
    literal: &mut LinkedExpression,
) -> Result<(), Diagnostic> {
    if let (LinkedType::Enum(variants), LinkedExpressionKind::Literal(ScalarLiteral::Text(value))) =
        (expected, &literal.kind)
    {
        if !variants.iter().any(|variant| variant.value == *value) {
            return Err(diagnostic(
                "unknown_enum_literal",
                &literal.source,
                "Literal is not a declared enum meaning",
            ));
        }
        literal.value_type = expected.clone();
    }
    if let (
        LinkedType::Record(expected_fields),
        LinkedExpressionKind::Operation {
            operator: LinkedOperator::Record(names),
            arguments,
        },
        LinkedType::Record(fields),
    ) = (expected, &mut literal.kind, &mut literal.value_type)
    {
        for (name, argument) in names.iter().zip(arguments) {
            if let Some(expected) = expected_fields.iter().find(|field| field.name == *name) {
                contextual_literals(&expected.value, argument)?;
                if let Some(field) = fields.iter_mut().find(|field| field.name == *name) {
                    field.value = argument.value_type.clone();
                }
            }
        }
    }
    Ok(())
}

fn contains_index(value: &LinkedType) -> bool {
    match value {
        LinkedType::Index { .. } => true,
        LinkedType::Sequence(item) | LinkedType::Optional(item) => contains_index(item),
        LinkedType::Record(fields) => fields.iter().any(|field| contains_index(&field.value)),
        _ => false,
    }
}

pub(super) fn iteration_scope(
    module: &Module,
    iteration: Option<&Iteration>,
    modules: &BTreeMap<&str, &Module>,
    ids: &BTreeMap<&str, u32>,
) -> Result<(Option<LinkedIteration>, Scope), Diagnostic> {
    let Some(iteration) = iteration else {
        return Ok((None, Scope::default()));
    };
    let input = resolve_expression(module, &iteration.input, modules, ids)?;
    let LinkedType::Sequence(item) = &input.value_type else {
        return Err(diagnostic(
            "expression_type_mismatch",
            &iteration.source,
            "forEach requires a sequence",
        ));
    };
    let scope = Scope::default().bind(&iteration.binding, *item.clone(), &iteration.source)?;
    Ok((Some(LinkedIteration { input, slot: 0 }), scope))
}
