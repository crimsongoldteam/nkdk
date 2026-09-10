use super::*;

pub(super) fn resolve(
    module: &Module,
    short: &Shorthand,
    expected: &LinkedType,
    key: &str,
    modules: &BTreeMap<&str, &Module>,
    ids: &BTreeMap<&str, u32>,
    scope: &expressions::Scope,
) -> Result<(LinkedShorthandRepresentation, LinkedExpression), Diagnostic> {
    let LinkedType::Sequence(item) = expected else {
        return Err(type_error(&short.source));
    };
    let LinkedType::Record(fields) = item.as_ref() else {
        return Err(type_error(&short.source));
    };
    let key_field = fields
        .iter()
        .position(|field| field.name == key)
        .ok_or_else(|| type_error(&short.source))?;
    let fixed = |values: &[Expression],
                 expected: &LinkedType|
     -> Result<Vec<LinkedExpression>, Diagnostic> {
        values
            .iter()
            .map(|value| {
                let linked =
                    expressions::resolve_expression_in(module, value, modules, ids, scope)?;
                if !context_only(&linked) {
                    return Err(diagnostic(
                        "invalid_pattern_dependency",
                        &value.source,
                        "Fixed pattern parts may only depend on prepared context",
                    ));
                }
                if !compatible_fixed_type(&linked.value_type, expected) {
                    return Err(type_error(&value.source));
                }
                Ok(linked)
            })
            .collect()
    };
    let ShorthandRepresentation::KeyedMapping {
        prefix,
        suffix,
        absent_keys,
    } = &short.representation
    else {
        unreachable!()
    };
    let representation = LinkedShorthandRepresentation::KeyedMapping {
        prefix: fixed(prefix, item)?,
        suffix: fixed(suffix, item)?,
        absent_keys: fixed(absent_keys, &fields[key_field].value)?,
        key_field: key_field as u32,
    };
    let (prefix, rest, suffix) = match &short.denotes.kind {
        ExpressionKind::Capture(rest) => (vec![], rest, vec![]),
        ExpressionKind::SequencePattern {
            prefix,
            rest,
            suffix,
        } => (fixed(prefix, item)?, rest, fixed(suffix, item)?),
        _ => {
            return Err(diagnostic(
                "noninvertible_shorthand",
                &short.denotes.source,
                "Collection denotation must contain a single unchanged rest",
            ));
        }
    };
    if rest != &short.capture {
        return Err(diagnostic(
            "unknown_capture",
            &short.denotes.source,
            "Pattern rest does not name this shorthand capture",
        ));
    }
    let operator = LinkedOperator::SequencePattern {
        prefix_len: prefix.len() as u32,
        suffix_len: suffix.len() as u32,
    };
    let mut arguments = prefix;
    arguments.push(LinkedExpression {
        kind: LinkedExpressionKind::Capture(0),
        value_type: expected.clone(),
        source: short.denotes.source.clone(),
    });
    arguments.extend(suffix);
    Ok((
        representation,
        LinkedExpression {
            kind: LinkedExpressionKind::Operation {
                operator,
                arguments,
            },
            value_type: expected.clone(),
            source: short.denotes.source.clone(),
        },
    ))
}

fn context_only(value: &LinkedExpression) -> bool {
    fn visit(value: &LinkedExpression, locals: &BTreeSet<u32>) -> bool {
        match &value.kind {
            LinkedExpressionKind::Absent
            | LinkedExpressionKind::Input(_)
            | LinkedExpressionKind::Parameter(_)
            | LinkedExpressionKind::Literal(_) => true,
            LinkedExpressionKind::Variable(slot) => locals.contains(slot),
            LinkedExpressionKind::Operation {
                operator: LinkedOperator::MatchOptional(slot),
                arguments,
            } => {
                let mut nested = locals.clone();
                nested.insert(*slot);
                visit(&arguments[0], locals)
                    && visit(&arguments[1], &nested)
                    && visit(&arguments[2], locals)
            }
            LinkedExpressionKind::Operation { arguments, .. } => {
                arguments.iter().all(|value| visit(value, locals))
            }
            _ => false,
        }
    }
    visit(value, &BTreeSet::new())
}

pub(super) fn disjoint(a: &LinkedShorthand, b: &LinkedShorthand) -> bool {
    use LinkedShorthandRepresentation::*;
    match (&a.representation, &b.representation) {
        (ScalarText, KeyedMapping { .. }) | (KeyedMapping { .. }, ScalarText) => true,
        (KeyedMapping { .. }, KeyedMapping { .. }) => {
            excludes_fixed_key(a, b) || excludes_fixed_key(b, a)
        }
        _ => false,
    }
}

fn excludes_fixed_key(a: &LinkedShorthand, b: &LinkedShorthand) -> bool {
    let LinkedShorthandRepresentation::KeyedMapping {
        prefix: a_prefix,
        suffix: a_suffix,
        absent_keys,
        ..
    } = &a.representation
    else {
        return false;
    };
    let LinkedShorthandRepresentation::KeyedMapping {
        prefix,
        suffix,
        key_field,
        ..
    } = &b.representation
    else {
        return false;
    };
    if !a_prefix.is_empty() || !a_suffix.is_empty() {
        return false;
    }
    let LinkedType::Sequence(item_type) = &b.denotes.value_type else {
        return false;
    };
    let LinkedType::Record(fields) = item_type.as_ref() else {
        return false;
    };
    let Some(field) = fields.get(*key_field as usize) else {
        return false;
    };
    prefix.iter().chain(suffix).any(|item| {
        let LinkedExpressionKind::Operation {
            operator: LinkedOperator::Record(names),
            arguments,
        } = &item.kind
        else {
            return false;
        };
        names
            .iter()
            .position(|name| name == &field.name)
            .and_then(|index| arguments.get(index))
            .is_some_and(|key| {
                absent_keys
                    .iter()
                    .any(|absent| same_expression(key, absent))
            })
    })
}

fn same_expression(a: &LinkedExpression, b: &LinkedExpression) -> bool {
    match (&a.kind, &b.kind) {
        (
            LinkedExpressionKind::Operation {
                operator: ao,
                arguments: aa,
            },
            LinkedExpressionKind::Operation {
                operator: bo,
                arguments: ba,
            },
        ) => {
            ao == bo
                && aa.len() == ba.len()
                && aa.iter().zip(ba).all(|(a, b)| same_expression(a, b))
        }
        (a, b) => a == b,
    }
}
fn type_error(source: &SourceLocation) -> Diagnostic {
    diagnostic(
        "expression_type_mismatch",
        source,
        "Pattern part does not match collection or key type",
    )
}

fn compatible_fixed_type(actual: &LinkedType, expected: &LinkedType) -> bool {
    match (actual, expected) {
        (LinkedType::Optional(inner), expected) => compatible_fixed_type(inner, expected),
        (LinkedType::Record(actual), LinkedType::Record(expected)) => {
            actual.len() == expected.len()
                && expected.iter().all(|field| {
                    actual
                        .iter()
                        .find(|actual| actual.name == field.name)
                        .is_some_and(|actual| compatible_fixed_type(&actual.value, &field.value))
                })
        }
        (LinkedType::Sequence(actual), LinkedType::Sequence(expected)) => {
            compatible_fixed_type(actual, expected)
        }
        _ => expressions::same_type(actual, expected),
    }
}

pub(super) fn scalar_inverse(value: &LinkedExpression) -> bool {
    fn count(value: &LinkedExpression) -> Option<usize> {
        match &value.kind {
            LinkedExpressionKind::Capture(0) => Some(1),
            LinkedExpressionKind::Operation {
                operator: LinkedOperator::Sequence | LinkedOperator::Record(_),
                arguments,
            } => arguments.iter().try_fold(0usize, |total, value| {
                Some(total.saturating_add(count(value)?))
            }),
            _ if context_only(value) => Some(0),
            _ => None,
        }
    }
    count(value) == Some(1)
}
