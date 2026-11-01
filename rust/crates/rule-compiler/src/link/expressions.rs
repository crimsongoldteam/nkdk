use super::*;

#[derive(Clone, Default)]
pub(super) struct Scope {
    pub variables: Vec<(String, LinkedType)>,
    pub captures: Vec<(String, LinkedType)>,
    pub ordinals: BTreeSet<u32>,
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

fn resolve_choice_variant(
    module: &Module,
    value: &Expression,
    variant: &str,
    expression: &Expression,
    modules: &BTreeMap<&str, &Module>,
    ids: &BTreeMap<&str, u32>,
    scope: &Scope,
) -> Result<(LinkedExpression, u32, LinkedType), Diagnostic> {
    let value = resolve_expression_in(module, value, modules, ids, scope)?;
    let shape = resolve_reference_shape(value.value_type.clone(), expression, modules, ids)?;
    let LinkedType::Choice(variants) = shape else {
        return Err(diagnostic(
            "expression_type_mismatch",
            &expression.source,
            "Variant expression requires a choice value",
        ));
    };
    let index = variants
        .iter()
        .position(|item| item.name == variant)
        .ok_or_else(|| {
            diagnostic(
                "unknown_choice_variant",
                &expression.source,
                "Choice variant is not declared",
            )
        })?;
    Ok((value, index as u32, variants[index].value.clone()))
}

pub(super) fn resolve_reference_shape(
    mut shape: LinkedType,
    expression: &Expression,
    modules: &BTreeMap<&str, &Module>,
    ids: &BTreeMap<&str, u32>,
) -> Result<LinkedType, Diagnostic> {
    let mut visited = BTreeSet::new();
    while let Some((id, _, _)) = shape.as_reference() {
        if !visited.insert(id) {
            return Err(diagnostic(
                "expression_type_mismatch",
                &expression.source,
                "Choice reference is cyclic",
            ));
        }
        let referenced = modules
            .iter()
            .find(|(name, _)| ids.get(**name) == Some(&id))
            .map(|(_, module)| *module)
            .expect("linked choice reference");
        shape = module_shape(referenced, modules, ids, &mut BTreeSet::new())?;
    }
    Ok(shape)
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
        ExpressionKind::LogicalAddress { parent, parts } => {
            let mut arguments = parent
                .iter()
                .map(|parent| resolve_expression_in(module, parent, modules, ids, scope))
                .collect::<Result<Vec<_>, _>>()?;
            for part in parts {
                if let ExpressionKind::YamlField(field) = &part.kind {
                    for segment in yaml_addresses::segments(module, field, modules, &part.source)? {
                        arguments.push(LinkedExpression {
                            kind: LinkedExpressionKind::Literal(ScalarLiteral::Text(segment)),
                            value_type: LinkedType::Scalar(ScalarType::Text),
                            source: part.source.clone(),
                        });
                    }
                } else {
                    arguments.push(resolve_expression_in(module, part, modules, ids, scope)?);
                }
            }
            let has_parent = parent.is_some();
            if arguments.is_empty()
                || arguments[0].value_type != LinkedType::Scalar(ScalarType::Text)
                || arguments.iter().any(|part| {
                    !matches!(
                        part.value_type,
                        LinkedType::Scalar(ScalarType::Text | ScalarType::Decimal)
                    )
                })
            {
                return Err(diagnostic(
                    "expression_type_mismatch",
                    &expression.source,
                    "Address needs a text parent or first segment, followed by text names or exact numeric positions",
                ));
            }
            (
                LinkedExpressionKind::Operation {
                    operator: LinkedOperator::LogicalAddress { parent: has_parent },
                    arguments,
                },
                LinkedType::Scalar(ScalarType::Text),
            )
        }
        ExpressionKind::YamlField(_) => {
            return Err(diagnostic(
                "yaml_address_scope",
                &expression.source,
                "YAML field selectors require logicalAddress parts",
            ));
        }
        ExpressionKind::Identity {
            seed,
            domain,
            format,
            address,
        } => {
            if domain.is_empty() || !matches!(format.as_str(), "uuid" | "hex128" | "hex160") {
                return Err(diagnostic(
                    "invalid_identity",
                    &expression.source,
                    "Identity needs a nonempty domain and a supported format",
                ));
            }
            let arguments = std::iter::once(seed.as_ref())
                .chain(address.iter())
                .map(|part| resolve_expression_in(module, part, modules, ids, scope))
                .collect::<Result<Vec<_>, _>>()?;
            if arguments
                .iter()
                .any(|part| part.value_type != LinkedType::Scalar(ScalarType::Text))
            {
                return Err(diagnostic(
                    "expression_type_mismatch",
                    &expression.source,
                    "Identity seed and address segments must be text",
                ));
            }
            (
                LinkedExpressionKind::Operation {
                    operator: LinkedOperator::Identity {
                        domain: domain.clone(),
                        format: format.clone(),
                    },
                    arguments,
                },
                LinkedType::Scalar(ScalarType::Text),
            )
        }
        ExpressionKind::ConstructVariant { .. } => {
            return Err(diagnostic(
                "expression_type_mismatch",
                &expression.source,
                "Variant construction requires a declared choice target",
            ));
        }
        ExpressionKind::IsVariant { value, variant } => {
            let (value, index, _) =
                resolve_choice_variant(module, value, variant, expression, modules, ids, scope)?;
            (
                LinkedExpressionKind::Operation {
                    operator: LinkedOperator::IsVariant(index),
                    arguments: vec![value],
                },
                LinkedType::Scalar(ScalarType::Boolean),
            )
        }
        ExpressionKind::VariantValue { value, variant }
        | ExpressionKind::VariantText { value, variant } => {
            let (value, index, selected) =
                resolve_choice_variant(module, value, variant, expression, modules, ids, scope)?;
            let selected = resolve_reference_shape(selected, expression, modules, ids)?;
            let text_choice = matches!(expression.kind, ExpressionKind::VariantText { .. });
            let supported = if text_choice {
                matches!(selected, LinkedType::Choice(_))
            } else {
                matches!(
                    selected,
                    LinkedType::Scalar(
                        ScalarType::Text | ScalarType::Decimal | ScalarType::Boolean
                    ) | LinkedType::Record(_)
                        | LinkedType::Choice(_)
                ) || matches!(&selected, LinkedType::Sequence(item) if matches!(item.as_ref(), LinkedType::Record(_)))
            };
            if !supported {
                return Err(diagnostic(
                    "expression_type_mismatch",
                    &expression.source,
                    if text_choice {
                        "Variant text requires a text choice"
                    } else {
                        "Variant projection requires a record, choice, record sequence or a borrowable scalar"
                    },
                ));
            }
            (
                LinkedExpressionKind::Operation {
                    operator: if text_choice {
                        LinkedOperator::VariantText(index)
                    } else {
                        LinkedOperator::VariantValue(index)
                    },
                    arguments: vec![value],
                },
                if text_choice {
                    LinkedType::Scalar(ScalarType::Text)
                } else {
                    selected
                },
            )
        }
        ExpressionKind::ParseYaml(_) => {
            return Err(diagnostic(
                "expression_type_mismatch",
                &expression.source,
                "YAML parsing is only allowed in a typed denotation",
            ));
        }
        ExpressionKind::TextSegmentPrefix {
            value,
            prefix,
            separator,
        } => {
            let value = resolve_expression_in(module, value, modules, ids, scope)?;
            let prefix = resolve_expression_in(module, prefix, modules, ids, scope)?;
            if value.value_type != LinkedType::Scalar(ScalarType::Text)
                || prefix.value_type != LinkedType::Scalar(ScalarType::Text)
            {
                return Err(diagnostic(
                    "expression_type_mismatch",
                    &expression.source,
                    "Segment prefix requires text operands",
                ));
            }
            (
                LinkedExpressionKind::Operation {
                    operator: LinkedOperator::TextSegmentPrefix(separator.clone()),
                    arguments: vec![value, prefix],
                },
                LinkedType::Scalar(ScalarType::Boolean),
            )
        }
        ExpressionKind::TextLengthAtMost { value, limit }
        | ExpressionKind::TextLengthEquals { value, limit } => {
            let value = resolve_expression_in(module, value, modules, ids, scope)?;
            let limit = resolve_expression_in(module, limit, modules, ids, scope)?;
            if value.value_type != LinkedType::Scalar(ScalarType::Text)
                || limit.value_type != LinkedType::Scalar(ScalarType::Text)
            {
                return Err(diagnostic(
                    "expression_type_mismatch",
                    &expression.source,
                    "Text length and its limit must be text",
                ));
            }
            let operator = if matches!(expression.kind, ExpressionKind::TextLengthAtMost { .. }) {
                LinkedOperator::TextLengthAtMost
            } else {
                LinkedOperator::TextLengthEquals
            };
            (
                LinkedExpressionKind::Operation {
                    operator,
                    arguments: vec![value, limit],
                },
                LinkedType::Scalar(ScalarType::Boolean),
            )
        }
        ExpressionKind::CalendarFits { value, fraction } => {
            let value = resolve_expression_in(module, value, modules, ids, scope)?;
            let fraction = resolve_expression_in(module, fraction, modules, ids, scope)?;
            if value.value_type != LinkedType::Scalar(ScalarType::Text)
                || fraction.value_type != LinkedType::Scalar(ScalarType::Text)
            {
                return Err(diagnostic(
                    "expression_type_mismatch",
                    &expression.source,
                    "Calendar value and fraction must be text",
                ));
            }
            (
                LinkedExpressionKind::Operation {
                    operator: LinkedOperator::CalendarFits,
                    arguments: vec![value, fraction],
                },
                LinkedType::Scalar(ScalarType::Boolean),
            )
        }
        ExpressionKind::DecimalText(value) => {
            let value = resolve_expression_in(module, value, modules, ids, scope)?;
            if value.value_type != LinkedType::Scalar(ScalarType::Decimal) {
                return Err(diagnostic(
                    "expression_type_mismatch",
                    &expression.source,
                    "Canonical decimal text requires an exact decimal",
                ));
            }
            (
                LinkedExpressionKind::Operation {
                    operator: LinkedOperator::DecimalText,
                    arguments: vec![value],
                },
                LinkedType::Scalar(ScalarType::Text),
            )
        }
        ExpressionKind::EnumText(value) => {
            let value = resolve_expression_in(module, value, modules, ids, scope)?;
            if !matches!(value.value_type, LinkedType::Enum(_)) {
                return Err(diagnostic(
                    "expression_type_mismatch",
                    &expression.source,
                    "Canonical enum text requires a declared enumeration",
                ));
            }
            (
                LinkedExpressionKind::Operation {
                    operator: LinkedOperator::EnumText,
                    arguments: vec![value],
                },
                LinkedType::Scalar(ScalarType::Text),
            )
        }
        ExpressionKind::DecimalFits {
            value,
            digits,
            fraction,
            sign,
        } => {
            let value = resolve_expression_in(module, value, modules, ids, scope)?;
            let digits = resolve_expression_in(module, digits, modules, ids, scope)?;
            let fraction = resolve_expression_in(module, fraction, modules, ids, scope)?;
            let sign = resolve_expression_in(module, sign, modules, ids, scope)?;
            if value.value_type != LinkedType::Scalar(ScalarType::Decimal)
                || [&digits, &fraction, &sign]
                    .into_iter()
                    .any(|part| part.value_type != LinkedType::Scalar(ScalarType::Text))
            {
                return Err(diagnostic(
                    "expression_type_mismatch",
                    &expression.source,
                    "Decimal value requires text qualifiers",
                ));
            }
            (
                LinkedExpressionKind::Operation {
                    operator: LinkedOperator::DecimalFits,
                    arguments: vec![value, digits, fraction, sign],
                },
                LinkedType::Scalar(ScalarType::Boolean),
            )
        }
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
            if !projected_key_matches(&key.value_type, key_type) {
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
            let (operator, value_type) = if matches!(expression.kind, ExpressionKind::Concat(_))
                && arguments
                    .first()
                    .is_some_and(|value| matches!(value.value_type, LinkedType::Sequence(_)))
            {
                let first = &arguments[0];
                for argument in &arguments[1..] {
                    require_same(first, argument)?;
                    if !same_ordered_type(&first.value_type, &argument.value_type) {
                        return Err(diagnostic(
                            "expression_type_mismatch",
                            &argument.source,
                            "Concatenated records require the same field order",
                        ));
                    }
                }
                (LinkedOperator::SequenceConcat, first.value_type.clone())
            } else if matches!(expression.kind, ExpressionKind::Concat(_)) {
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
                if scope.ordinals.contains(&(slot as u32)) {
                    LinkedExpressionKind::Ordinal(slot as u32)
                } else {
                    LinkedExpressionKind::Variable(slot as u32)
                },
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
        ExpressionKind::CollectionPosition => (
            LinkedExpressionKind::CollectionPosition(0),
            LinkedType::Scalar(ScalarType::Decimal),
        ),
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
            let kind = if let LinkedExpressionKind::Operation {
                operator: LinkedOperator::VariantValue(variant),
                arguments,
            } = &value.kind
            {
                LinkedExpressionKind::Operation {
                    operator: LinkedOperator::VariantField {
                        variant: *variant,
                        field: index as u32,
                    },
                    arguments: arguments.clone(),
                }
            } else if matches!(value.kind, LinkedExpressionKind::SelfValue) {
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
            let empty = |value: &Expression| matches!(&value.kind, ExpressionKind::Sequence(items) if items.is_empty());
            let typed_empty = |value: &Expression,
                               expected: &LinkedExpression|
             -> Result<LinkedExpression, Diagnostic> {
                if !matches!(expected.value_type, LinkedType::Sequence(_)) {
                    return Err(diagnostic(
                        "expression_type_mismatch",
                        &value.source,
                        "Empty branch requires a sequence counterpart",
                    ));
                }
                Ok(LinkedExpression {
                    kind: LinkedExpressionKind::Operation {
                        operator: LinkedOperator::Sequence,
                        arguments: vec![],
                    },
                    value_type: expected.value_type.clone(),
                    source: value.source.clone(),
                })
            };
            let (then_value, else_value) = if empty(then_value) && !empty(else_value) {
                let other = resolve_expression_in(module, else_value, modules, ids, scope)?;
                (typed_empty(then_value, &other)?, other)
            } else {
                let first = resolve_expression_in(module, then_value, modules, ids, scope)?;
                let second = if empty(else_value) {
                    typed_empty(else_value, &first)?
                } else {
                    resolve_expression_in(module, else_value, modules, ids, scope)?
                };
                (first, second)
            };
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
            let shape = module_shape(module, modules, ids, &mut BTreeSet::new())?;
            let (index, field) = record_field(
                &shape,
                name,
                &expression.source,
                "Field reference requires a record",
                "Field is not declared",
            )?;
            (LinkedExpressionKind::Field(index), field.value.clone())
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

/// A canonical textual index accepts enum meanings; declared enum domains stay strict.
fn projected_key_matches(actual: &LinkedType, expected: &LinkedType) -> bool {
    match (actual, expected) {
        (actual, LinkedType::Scalar(ScalarType::Text)) => crate::fact_shape::text_cell(actual),
        (LinkedType::Record(actual), LinkedType::Record(expected)) => {
            record_fields_match(actual, expected, projected_key_matches)
        }
        _ => same_type(actual, expected),
    }
}

pub(super) fn record_fields_match(
    actual: &[LinkedField],
    expected: &[LinkedField],
    compare: impl Fn(&LinkedType, &LinkedType) -> bool,
) -> bool {
    actual.len() == expected.len()
        && expected.iter().all(|field| {
            actual
                .iter()
                .find(|other| other.name == field.name)
                .is_some_and(|other| compare(&other.value, &field.value))
        })
}

fn same_ordered_type(left: &LinkedType, right: &LinkedType) -> bool {
    match (left, right) {
        (LinkedType::Record(a), LinkedType::Record(b))
        | (LinkedType::Choice(a), LinkedType::Choice(b)) => {
            a.len() == b.len()
                && a.iter()
                    .zip(b)
                    .all(|(a, b)| a.name == b.name && same_ordered_type(&a.value, &b.value))
        }
        (LinkedType::Sequence(a), LinkedType::Sequence(b))
        | (LinkedType::Optional(a), LinkedType::Optional(b)) => same_ordered_type(a, b),
        _ => same_type(left, right),
    }
}

pub(super) fn same_type(left: &LinkedType, right: &LinkedType) -> bool {
    match (left, right) {
        (LinkedType::Index { key: a, value: b }, LinkedType::Index { key: c, value: d }) => {
            // Prepared keys use canonical text cells, including enum values.
            // Their ABI is defined by the named columns, not enum ordinals.
            let keys_match = match (crate::fact_shape::columns(a), crate::fact_shape::columns(c)) {
                (Some(left), Some(right)) => left == right,
                _ => same_type(a, c),
            };
            keys_match && same_type(b, d)
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
        (LinkedType::Record(a), LinkedType::Record(b)) => record_fields_match(a, b, same_type),
        (LinkedType::Choice(a), LinkedType::Choice(b)) => {
            a.len() == b.len()
                && a.iter()
                    .zip(b)
                    .all(|(a, b)| a.name == b.name && same_type(&a.value, &b.value))
        }
        _ => false,
    }
}

pub(super) fn field_shape(
    module: &Module,
    value: &TypeDefinition,
    source: &SourceLocation,
    registry: (&BTreeMap<&str, &Module>, &BTreeMap<&str, u32>),
    visiting: &mut BTreeSet<String>,
) -> Result<LinkedType, Diagnostic> {
    let (modules, ids) = registry;
    match value {
        TypeDefinition::Index { key, value } => Ok(LinkedType::Index {
            key: Box::new(field_shape(module, key, source, registry, visiting)?),
            value: Box::new(field_shape(module, value, source, registry, visiting)?),
        }),
        TypeDefinition::Use(usage) => {
            let target = imported_module(module, usage, modules, "Import alias is not declared")?;
            let key = format!("module:{}", target.id);
            if visiting.contains(&key)
                || composition_reaches_visiting(target, modules, visiting, &mut BTreeSet::new())?
            {
                return Ok(LinkedType::Reference(ids[target.id.as_str()]));
            }
            module_shape(target, modules, ids, visiting)
        }
        TypeDefinition::Record(fields) | TypeDefinition::Choice(fields) => {
            let fields = fields
                .iter()
                .map(|field| {
                    Ok(LinkedField {
                        name: field.name.clone(),
                        value: field_shape(
                            module,
                            &field.definition,
                            &field.source,
                            registry,
                            visiting,
                        )?,
                        source: field.source.clone(),
                    })
                })
                .collect::<Result<_, Diagnostic>>()?;
            Ok(if matches!(value, TypeDefinition::Choice(_)) {
                LinkedType::Choice(fields)
            } else {
                LinkedType::Record(fields)
            })
        }
        TypeDefinition::Sequence(item) => Ok(LinkedType::Sequence(Box::new(field_shape(
            module, item, source, registry, visiting,
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
            let result = field_shape(module, &target.definition, source, registry, visiting);
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

// A value reference may return through an already expanded fragment even
// when the composition graph itself is acyclic. Keep that value reference
// lazy; direct cycles of compose edges are still rejected by module_shape.
fn composition_reaches_visiting(
    module: &Module,
    modules: &BTreeMap<&str, &Module>,
    visiting: &BTreeSet<String>,
    checked: &mut BTreeSet<String>,
) -> Result<bool, Diagnostic> {
    if !checked.insert(module.id.clone()) {
        return Ok(false);
    }
    for usage in &module.compose {
        let fragment = composed_fragment(module, usage, modules)?;
        if visiting.contains(&format!("module:{}", fragment.id))
            || composition_reaches_visiting(fragment, modules, visiting, checked)?
        {
            return Ok(true);
        }
    }
    Ok(false)
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
        (modules, ids),
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
        let target = composed_fragment(module, usage, modules)?;
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
    unique_linked_fields(&fields)?;
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
    if let (
        LinkedType::Sequence(expected_item),
        LinkedExpressionKind::Operation {
            operator: LinkedOperator::Sequence,
            arguments,
        },
    ) = (expected, &mut literal.kind)
    {
        for argument in arguments {
            contextual_literals(expected_item, argument)?;
            if !same_type(&argument.value_type, expected_item) {
                return Err(diagnostic(
                    "binding_type_mismatch",
                    &argument.source,
                    "Sequence binding item does not match the declared input type",
                ));
            }
        }
        literal.value_type = expected.clone();
    }
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
    let mut scope = Scope::default().bind(&iteration.binding, *item.clone(), &iteration.source)?;
    let index = if let Some(name) = &iteration.index {
        scope = scope.bind(
            name,
            LinkedType::Scalar(ScalarType::Decimal),
            &iteration.source,
        )?;
        scope.ordinals.insert(1);
        Some(1)
    } else {
        None
    };
    Ok((
        Some(LinkedIteration {
            input,
            slot: 0,
            index,
        }),
        scope,
    ))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn choice_bindings_preserve_variant_ordinals_names_and_payload_types() {
        let field = |name: &str, target| LinkedField {
            name: name.into(),
            value: LinkedType::Reference(target),
            source: SourceLocation {
                file: "choice.yaml".into(),
                line: 1,
                column: 1,
            },
        };
        let expected = LinkedType::Choice(vec![field("active", 1), field("inactive", 2)]);
        assert!(same_type(&expected, &expected.clone()));
        for actual in [
            vec![field("inactive", 2), field("active", 1)],
            vec![field("renamed", 1), field("inactive", 2)],
            vec![field("active", 2), field("inactive", 2)],
            vec![field("active", 1)],
        ] {
            assert!(!same_type(&LinkedType::Choice(actual), &expected));
        }
    }
}
