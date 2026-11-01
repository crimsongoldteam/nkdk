use super::*;

pub(super) fn resolve(
    module: &Module,
    modules: &BTreeMap<&str, &Module>,
    ids: &BTreeMap<&str, u32>,
) -> Result<Vec<LinkedPresence>, Diagnostic> {
    module
        .presence
        .iter()
        .map(|presence| {
            let shape = expressions::module_shape(module, modules, ids, &mut BTreeSet::new())?;
            let (target, expected) = match &presence.target {
                PresenceTarget::SelfValue => (LinkedPresenceTarget::SelfValue, shape),
                PresenceTarget::Field(name) => {
                    let (index, field) = record_field(
                        &shape,
                        name,
                        &presence.source,
                        "Field presence requires record",
                        "Presence target does not exist",
                    )?;
                    (LinkedPresenceTarget::Field(index), field.value.clone())
                }
            };
            let denotes = |expression: &Expression| {
                denotations::resolve(module, expression, &expected, modules, ids)
            };
            let predicate = |expression: &Expression| {
                let value = expressions::resolve_expression(module, expression, modules, ids)?;
                expressions::require_boolean(&value)?;
                Ok(value)
            };
            let record_boundary = matches!(target, LinkedPresenceTarget::SelfValue) && matches!(expected, LinkedType::Record(_));
            let empties = |forms: &[EmptyForm]| {
                forms
                    .iter()
                    .map(|form| {
                        if form.when.is_some() && !(form.form == EmptyKind::Null && record_boundary && matches!(form.denotes.kind, ExpressionKind::Absent)) {
                            return Err(diagnostic("unsupported_empty_condition", &form.source, "Conditional empty forms currently require an absent null record boundary"));
                        }
                        let when = form.when.as_ref().map(predicate).transpose()?;
                        if when.as_ref().is_some_and(|condition| !patterns::context_only(condition)) { return Err(diagnostic("unsupported_empty_condition", &form.source, "Empty-form selection requires context-only conditions")); }
                        Ok(LinkedEmpty {
                            when,
                            form: form.form.clone(),
                            denotes: denotes(&form.denotes)?,
                            source: form.source.clone(),
                        })
                    })
                    .collect::<Result<Vec<_>, Diagnostic>>()
            };
            let canonical = presence
                .xml_canonical
                .iter()
                .map(|form| {
                    Ok(LinkedCanonical {
                        when: form.when.as_ref().map(predicate).transpose()?,
                        form: form.form.clone(),
                        xml_type: form
                            .xml_type
                            .as_ref()
                            .map(|name| {
                                expand_path(module, std::slice::from_ref(name), &form.source)
                                    .map(|mut path| path.remove(0))
                            })
                            .transpose()?,
                        source: form.source.clone(),
                    })
                })
                .collect::<Result<_, Diagnostic>>()?;
            let yaml_missing = presence.yaml_missing.as_ref().map(denotes).transpose()?;
            let yaml_omit_when = presence
                .yaml_omit_when
                .as_ref()
                .map(|expression| {
                    let target_expression = match &presence.target {
                        PresenceTarget::SelfValue => ExpressionKind::SelfValue,
                        PresenceTarget::Field(name) => ExpressionKind::Field(name.clone()),
                    };
                    if let (Some(default), Some(linked_default)) =
                        (&presence.yaml_missing, &yaml_missing)
                        && let ExpressionKind::Compare {
                            operator: ComparisonOperator::Equal,
                            left,
                            right,
                        } = &expression.kind
                        && left.kind == target_expression
                        && right.kind == default.kind
                    {
                        let selected = expressions::resolve_expression(module, left, modules, ids)?;
                        return Ok(default_equality(selected, linked_default));
                    }
                    predicate(expression)
                })
                .transpose()?;
            Ok(LinkedPresence {
                target,
                canonical,
                xml_missing: presence.xml_missing.as_ref().map(denotes).transpose()?,
                yaml_missing,
                xml_empty: empties(&presence.xml_empty)?,
                yaml_empty: empties(&presence.yaml_empty)?,
                yaml_omit_when,
                yaml_null_when: presence
                    .yaml_null_when
                    .as_ref()
                    .map(predicate)
                    .transpose()?,
                source: presence.source.clone(),
            })
        })
        .collect()
}

// Distribute the default comparison over its conditional branches. An absent
// default compares presence instead of inventing an optional scalar value.
fn default_equality(selected: LinkedExpression, default: &LinkedExpression) -> LinkedExpression {
    let boolean = |operator, arguments| LinkedExpression {
        kind: LinkedExpressionKind::Operation {
            operator,
            arguments,
        },
        value_type: LinkedType::Scalar(ScalarType::Boolean),
        source: default.source.clone(),
    };
    match &default.kind {
        LinkedExpressionKind::Absent if matches!(selected.value_type, LinkedType::Scalar(_)) => {
            return boolean(
                LinkedOperator::Not,
                vec![boolean(
                    LinkedOperator::State(StatePredicate::Present),
                    vec![selected],
                )],
            );
        }
        LinkedExpressionKind::Operation {
            operator: LinkedOperator::Conditional,
            arguments,
        } if matches!(selected.value_type, LinkedType::Scalar(_)) || choice_default(default) => {
            return boolean(
                LinkedOperator::Conditional,
                vec![
                    arguments[0].clone(),
                    default_equality(selected.clone(), &arguments[1]),
                    default_equality(selected, &arguments[2]),
                ],
            );
        }
        _ => {}
    }
    boolean(LinkedOperator::Equal, vec![selected, default.clone()])
}

fn choice_default(value: &LinkedExpression) -> bool {
    match &value.kind {
        LinkedExpressionKind::Operation {
            operator: LinkedOperator::ConstructVariant(_),
            ..
        } => true,
        LinkedExpressionKind::Operation {
            operator: LinkedOperator::Conditional,
            arguments,
        } => arguments[1..].iter().any(choice_default),
        _ => false,
    }
}
