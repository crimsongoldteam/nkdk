use super::*;

pub(super) fn resolve(
    module: &Module,
    modules: &BTreeMap<&str, &Module>,
    ids: &BTreeMap<&str, u32>,
) -> Result<Vec<LinkedShorthand>, Diagnostic> {
    let YamlRepresentation::KeyedMapping { shorthand, key, .. } = &module.representations.yaml
    else {
        return Ok(vec![]);
    };
    let expected = expressions::field_shape(
        module,
        &module.value,
        &module.source,
        modules,
        ids,
        &mut BTreeSet::new(),
    )?;
    let mut output = vec![];
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
            ShorthandRepresentation::ScalarText => LinkedType::Scalar(ScalarType::Text),
            ShorthandRepresentation::KeyedMapping { .. } => expected.clone(),
        };
        let scope = expressions::Scope {
            variables: vec![],
            captures: vec![(short.capture.clone(), capture_type)],
        };
        let (representation, denotes) = match &short.representation {
            ShorthandRepresentation::ScalarText => {
                let denotes = expressions::resolve_expression_in(
                    module,
                    &short.denotes,
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
                (LinkedShorthandRepresentation::ScalarText, denotes)
            }
            ShorthandRepresentation::KeyedMapping { .. } => {
                patterns::resolve(module, short, &expected, key, modules, ids, &scope)?
            }
        };
        if !expressions::same_type(&denotes.value_type, &expected) {
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
        let linked = LinkedShorthand {
            id: short.id.clone(),
            representation,
            denotes,
            when,
            source: short.source.clone(),
        };
        for previous in &output {
            if !patterns::disjoint(previous, &linked) {
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
