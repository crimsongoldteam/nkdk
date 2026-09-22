//! Specialize scalar profiles and input contracts once at build time.
use super::*;

pub(super) fn specialize(entries: &mut Vec<LinkedEntry>) -> Result<(), Diagnostic> {
    let originals = entries.clone();
    let mut instances: Vec<(u32, Vec<LinkedExpression>, u32)> = Vec::new();
    let mut next_id = originals.iter().map(|entry| entry.id).max().unwrap_or(0) + 1;
    let mut cursor = 0;
    while cursor < entries.len() {
        let owner_index = cursor;
        cursor += 1;
        let owner = entries[owner_index].clone();
        // Generic definitions are specialized through their concrete callers first.
        if !owner.parameters.is_empty() {
            continue;
        }

        let fields = match &owner.value {
            LinkedType::Record(fields) | LinkedType::Choice(fields) => fields.clone(),
            LinkedType::Sequence(item) if super::scalar_inputs::typed_collection(&owner) => {
                vec![LinkedField {
                    name: "item".into(),
                    value: *item.clone(),
                    source: owner.source.clone(),
                }]
            }
            _ => continue,
        };
        for (field_index, field) in fields.iter().enumerate() {
            let LinkedType::BoundReference {
                entry,
                bindings,
                arguments,
            } = &field.value
            else {
                continue;
            };
            let common = originals
                .iter()
                .find(|value| value.id == *entry)
                .expect("linked scalar target");
            let static_record = matches!(common.value, LinkedType::Record(_))
                && !common.parameters.is_empty()
                && common.inputs.is_empty()
                && crate::plan::xml_fields(&common.xml).is_some();
            if !static_record
                && !matches!(
                    common.value,
                    LinkedType::Scalar(_)
                        | LinkedType::Enum(_)
                        | LinkedType::ScalarChoice(_)
                        | LinkedType::Choice(_)
                )
                && !matches!(common.xml, LinkedXml::TextPattern(_))
                && !super::scalar_inputs::typed_collection(common)
            {
                continue;
            }
            // Declared records keep their bindings in the caller's lexical
            // scope; replacing the use with an instantiated reference would
            // confuse owner fields with the element's own fields.
            if let LinkedType::Sequence(item) = &common.value
                && let Some((target, _, _)) = item.as_reference()
                && originals.iter().any(|entry| {
                    entry.id == target
                        && matches!(entry.value, LinkedType::Record(_))
                        && matches!(entry.xml, LinkedXml::Record(_))
                })
            {
                continue;
            }
            if common.inputs.is_empty()
                && arguments
                    .iter()
                    .any(|argument| !matches!(argument.kind, LinkedExpressionKind::Literal(_)))
            {
                return Err(diagnostic(
                    "unsupported_scalar_specialization",
                    &field.source,
                    "Scalar profiles require resolved static arguments",
                ));
            }
            let id = if let Some((_, _, id)) = instances.iter().find(|(target, args, _)| {
                bindings.is_empty()
                    && common.inputs.is_empty()
                    && target == entry
                    && args
                        .iter()
                        .map(|arg| &arg.kind)
                        .eq(arguments.iter().map(|arg| &arg.kind))
            }) {
                *id
            } else {
                let mut instance = if common.inputs.is_empty() {
                    let mut instance = common.clone();
                    bind(&mut instance, arguments)?;
                    instance
                } else {
                    let Some(instance) =
                        super::scalar_inputs::specialize(common, bindings, arguments)?
                    else {
                        continue;
                    };
                    instance
                };
                instance.id = next_id;
                if !common.inputs.is_empty() {
                    instance.input_scope = Some(owner.id);
                }
                next_id += 1;
                instance.name = format!("{}@scalar-{}", common.name, instance.id);
                while entries.iter().any(|entry| entry.name == instance.name) {
                    instance.name.push('@');
                }
                let id = instance.id;
                entries.push(instance);
                if bindings.is_empty() {
                    instances.push((*entry, arguments.clone(), id));
                }
                id
            };
            let target = match &mut entries[owner_index].value {
                LinkedType::Record(fields) | LinkedType::Choice(fields) => {
                    &mut fields[field_index].value
                }
                LinkedType::Sequence(item) => item.as_mut(),
                _ => unreachable!(),
            };
            *target = LinkedType::Reference(id);
        }
    }
    Ok(())
}
fn bind(entry: &mut LinkedEntry, arguments: &[LinkedExpression]) -> Result<(), Diagnostic> {
    if entry.parameters.len() != arguments.len() {
        return Err(diagnostic(
            "scalar_argument_count",
            &entry.source,
            "Static argument count differs from parameters",
        ));
    }
    let inputs = super::identity_bindings(entry);
    super::composition::instantiate_value(entry, &inputs, arguments)?;
    for rule in &mut entry.presence {
        for value in [
            &mut rule.xml_missing,
            &mut rule.yaml_missing,
            &mut rule.yaml_omit_when,
        ]
        .into_iter()
        .flatten()
        {
            substitute(value, arguments)?;
        }
        for empty in rule.xml_empty.iter_mut().chain(&mut rule.yaml_empty) {
            substitute(&mut empty.denotes, arguments)?;
        }
        for canonical in &mut rule.canonical {
            if let Some(value) = &mut canonical.when {
                substitute(value, arguments)?;
            }
        }
    }
    for constraint in &mut entry.constraints {
        substitute(&mut constraint.assertion, arguments)?;
        if let Some(value) = &mut constraint.when {
            substitute(value, arguments)?;
        }
        if let Some(iteration) = &mut constraint.for_each {
            substitute(&mut iteration.input, arguments)?;
        }
        for part in &mut constraint.diagnostic.message {
            if let LinkedMessagePart::Expression(value) = part {
                substitute(value, arguments)?;
            }
        }
    }
    attributes(&mut entry.xml, arguments)?;
    entry.parameters.clear();
    Ok(())
}

/// Instantiate a reusable declaration with its declared defaults.
///
/// Recursive records are emitted once as standalone generated modules. Their
/// caller-specific uses are still specialized independently, but the reusable
/// root needs one concrete profile so no parameter expression leaks into the
/// runtime layer.
pub(crate) fn bind_defaults(entry: &mut LinkedEntry) -> Result<(), Diagnostic> {
    if entry.parameters.is_empty() {
        return Ok(());
    }
    let arguments = entry
        .parameters
        .iter()
        .map(|parameter| {
            parameter
                .default
                .clone()
                .map(|value| LinkedExpression {
                    kind: LinkedExpressionKind::Literal(value),
                    value_type: parameter.value_type.clone(),
                    source: parameter.source.clone(),
                })
                .ok_or_else(|| {
                    diagnostic(
                        "missing_recursive_parameter_default",
                        &parameter.source,
                        "A reusable recursive declaration parameter requires a default",
                    )
                })
        })
        .collect::<Result<Vec<_>, _>>()?;
    bind(entry, &arguments)
}
fn attributes(xml: &mut LinkedXml, arguments: &[LinkedExpression]) -> Result<(), Diagnostic> {
    if let LinkedXml::WithAttributes {
        attributes: items,
        content,
    } = xml
    {
        for attribute in items.iter_mut() {
            if let Some(when) = &mut attribute.when {
                substitute(when, arguments)?;
            }
        }
        items.retain(|attribute| {
            !matches!(
                attribute.when.as_ref().map(|value| &value.kind),
                Some(LinkedExpressionKind::Literal(ScalarLiteral::Boolean(false)))
            )
        });
        for attribute in items {
            if matches!(
                attribute.when.as_ref().map(|value| &value.kind),
                Some(LinkedExpressionKind::Literal(ScalarLiteral::Boolean(true)))
            ) {
                attribute.when = None;
            }
        }
        attributes(content, arguments)?;
    }
    Ok(())
}
fn substitute(
    value: &mut LinkedExpression,
    arguments: &[LinkedExpression],
) -> Result<(), Diagnostic> {
    match &mut value.kind {
        LinkedExpressionKind::Parameter(index) => {
            *value = arguments
                .get(*index as usize)
                .ok_or_else(|| {
                    diagnostic(
                        "scalar_parameter_index",
                        &value.source,
                        "Unresolved scalar parameter",
                    )
                })?
                .clone();
        }
        LinkedExpressionKind::Operation {
            arguments: children,
            ..
        } => {
            for child in children {
                substitute(child, arguments)?;
            }
        }
        _ => (),
    }
    fold(value);
    Ok(())
}

/// Remove parameter-only decisions while retaining value-dependent expressions.
pub(crate) fn fold(value: &mut LinkedExpression) {
    use LinkedExpressionKind::{Literal, Operation};
    use LinkedOperator::{And, Conditional, Equal, Not, Or, State};
    let boolean = |v: &LinkedExpression| match v.kind {
        Literal(ScalarLiteral::Boolean(v)) => Some(v),
        _ => None,
    };
    let Operation {
        operator,
        arguments,
    } = &mut value.kind
    else {
        return;
    };
    let replacement = match operator {
        And | Or => {
            let absorbing = *operator == Or;
            if arguments.iter().any(|a| boolean(a) == Some(absorbing)) {
                Some(Literal(ScalarLiteral::Boolean(absorbing)))
            } else {
                arguments.retain(|a| boolean(a) != Some(!absorbing));
                match arguments.len() {
                    0 => Some(Literal(ScalarLiteral::Boolean(!absorbing))),
                    1 => Some(arguments[0].kind.clone()),
                    _ => None,
                }
            }
        }
        Not => boolean(&arguments[0]).map(|v| Literal(ScalarLiteral::Boolean(!v))),
        Equal => match (&arguments[0].kind, &arguments[1].kind) {
            (Literal(ScalarLiteral::Boolean(a)), Literal(ScalarLiteral::Boolean(b))) => {
                Some(Literal(ScalarLiteral::Boolean(a == b)))
            }
            (Literal(ScalarLiteral::Text(a)), Literal(ScalarLiteral::Text(b))) => {
                Some(Literal(ScalarLiteral::Boolean(a == b)))
            }
            _ => None,
        },
        Conditional => {
            boolean(&arguments[0]).map(|v| arguments[if v { 1 } else { 2 }].kind.clone())
        }
        State(StatePredicate::IsReady) => match arguments[0].kind {
            LinkedExpressionKind::Absent => Some(Literal(ScalarLiteral::Boolean(false))),
            Literal(_) => Some(Literal(ScalarLiteral::Boolean(true))),
            _ => None,
        },
        _ => None,
    };
    if let Some(kind) = replacement {
        value.kind = kind;
    }
}
