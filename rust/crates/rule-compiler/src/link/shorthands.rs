use super::*;

pub(super) fn resolve(
    module: &Module,
    modules: &BTreeMap<&str, &Module>,
    ids: &BTreeMap<&str, u32>,
) -> Result<Vec<LinkedShorthand>, Diagnostic> {
    let (shorthand, key) = match &module.representations.yaml {
        YamlRepresentation::KeyedMapping { shorthand, key, .. } => (shorthand, Some(key.as_str())),
        YamlRepresentation::Mapping(_) => (&module.representations.shorthand, None),
        _ => return Ok(vec![]),
    };
    let expected = expressions::field_shape(
        module,
        &module.value,
        &module.source,
        (modules, ids),
        &mut BTreeSet::new(),
    )?;
    let mut output: Vec<LinkedShorthand> = vec![];
    let mut names = BTreeMap::new();
    for short in shorthand {
        if let Some(first) = names.insert(&short.id, &short.source) {
            let mut error = diagnostic(
                "duplicate_shorthand",
                &short.source,
                "Shorthand ids must be unique",
            );
            error.related.push(first.clone());
            return Err(error);
        }
        let capture_type = match short.representation {
            ShorthandRepresentation::MappingField(_)
            | ShorthandRepresentation::ScalarField(_)
            | ShorthandRepresentation::ScalarLiteral(_)
            | ShorthandRepresentation::ScalarText { .. } => LinkedType::Scalar(ScalarType::Text),
            ShorthandRepresentation::KeyedMapping { .. } => expected.clone(),
        };
        let scope = expressions::Scope {
            variables: vec![],
            ordinals: Default::default(),
            captures: vec![(short.capture.clone(), capture_type)],
        };
        let (representation, denotes) = match &short.representation {
            ShorthandRepresentation::MappingField(name)
            | ShorthandRepresentation::ScalarField(name) => {
                let LinkedType::Record(fields) = &expected else {
                    return Err(diagnostic(
                        "shorthand_projection",
                        &short.source,
                        "A field projection requires a record",
                    ));
                };
                let index = fields
                    .iter()
                    .position(|field| &field.name == name)
                    .ok_or_else(|| {
                        diagnostic("unknown_field", &short.source, "Unknown projection field")
                    })?;
                (
                    if matches!(
                        short.representation,
                        ShorthandRepresentation::MappingField(_)
                    ) {
                        LinkedShorthandRepresentation::MappingField(index as u32)
                    } else {
                        LinkedShorthandRepresentation::ScalarField(index as u32)
                    },
                    LinkedExpression {
                        kind: LinkedExpressionKind::Absent,
                        value_type: expected.clone(),
                        source: short.source.clone(),
                    },
                )
            }
            ShorthandRepresentation::ScalarLiteral(literal) => {
                let denotes = denotations::resolve_scoped(
                    module,
                    &short.denotes,
                    &expected,
                    modules,
                    ids,
                    &scope,
                )?;
                if !patterns::context_only(&denotes) {
                    return Err(diagnostic(
                        "noninvertible_shorthand",
                        &short.denotes.source,
                        "Literal shorthand must have a context-only meaning",
                    ));
                }
                (
                    LinkedShorthandRepresentation::ScalarLiteral(literal.clone()),
                    denotes,
                )
            }
            ShorthandRepresentation::ScalarText { prefix, suffix } => {
                let denotes = denotations::resolve_scoped(
                    module,
                    &short.denotes,
                    &expected,
                    modules,
                    ids,
                    &scope,
                )?;
                if !patterns::scalar_inverse(&denotes) {
                    return Err(diagnostic(
                        "noninvertible_shorthand",
                        &short.denotes.source,
                        "Scalar shorthand needs one recoverable structural capture",
                    ));
                }
                (
                    LinkedShorthandRepresentation::ScalarText {
                        prefix: prefix.clone(),
                        suffix: suffix.clone(),
                    },
                    denotes,
                )
            }
            ShorthandRepresentation::KeyedMapping { .. } => {
                let key = key.ok_or_else(|| {
                    diagnostic(
                        "invalid_shorthand_representation",
                        &short.source,
                        "Keyed shorthand requires a keyed YAML collection",
                    )
                })?;
                patterns::resolve(module, short, &expected, key, modules, ids, &scope)?
            }
        };
        if !expressions::same_type(
            &denotes.value_type,
            &semantic_shape(expected.clone(), &short.denotes, modules, ids)?,
        ) {
            return Err(diagnostic(
                "expression_type_mismatch",
                &short.source,
                "Shorthand produces a different value type",
            ));
        }
        let when = short
            .when
            .as_ref()
            .map(|expression| {
                let value =
                    expressions::resolve_expression_in(module, expression, modules, ids, &scope)?;
                expressions::require_boolean(&value)?;
                Ok(value)
            })
            .transpose()?;
        if !matches!(
            representation,
            LinkedShorthandRepresentation::KeyedMapping { .. }
        ) && when
            .as_ref()
            .is_some_and(|condition| !patterns::context_only(condition))
        {
            return Err(diagnostic(
                "unsupported_shorthand_condition",
                &short.source,
                "Shorthand input selection currently requires context-only conditions",
            ));
        }
        let linked = LinkedShorthand {
            canonical: short.canonical,
            id: short.id.clone(),
            representation,
            denotes,
            when,
            source: short.source.clone(),
        };
        for previous in &output {
            let record_catchall = key.is_none()
                && matches!(
                    (&previous.representation, &linked.representation),
                    (
                        LinkedShorthandRepresentation::ScalarText { prefix: a, suffix: b },
                        LinkedShorthandRepresentation::ScalarText { prefix: c, suffix: d },
                    ) if (a.is_empty() && b.is_empty() && !c.is_empty() && !d.is_empty())
                        || (c.is_empty() && d.is_empty() && !a.is_empty() && !b.is_empty())
                );
            if !record_catchall && !patterns::disjoint(previous, &linked) {
                let mut error = diagnostic(
                    "ambiguous_shorthand",
                    &short.source,
                    "Shorthand input forms are not proven disjoint",
                );
                error.related.push(previous.source.clone());
                return Err(error);
            }
        }
        output.push(linked);
    }
    Ok(output)
}

fn semantic_shape(
    value: LinkedType,
    source: &Expression,
    modules: &BTreeMap<&str, &Module>,
    ids: &BTreeMap<&str, u32>,
) -> Result<LinkedType, Diagnostic> {
    match value {
        LinkedType::Record(mut fields) => {
            for field in &mut fields {
                field.value = semantic_shape(field.value.clone(), source, modules, ids)?;
            }
            Ok(LinkedType::Record(fields))
        }
        other => expressions::resolve_reference_shape(other, source, modules, ids),
    }
}
