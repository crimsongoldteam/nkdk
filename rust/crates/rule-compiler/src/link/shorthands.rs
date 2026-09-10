use super::*;

pub(super) fn resolve(
    module: &Module,
    modules: &BTreeMap<&str, &Module>,
    ids: &BTreeMap<&str, u32>,
) -> Result<Vec<LinkedShorthand>, Diagnostic> {
    let YamlRepresentation::KeyedMapping { shorthand, .. } = &module.representations.yaml else {
        return Ok(vec![]);
    };
    if shorthand.len() > 1 {
        return Err(diagnostic(
            "unsupported_link_feature",
            &module.source,
            "Multiple scalar shorthands require an overlap proof",
        ));
    }
    shorthand
        .iter()
        .map(|short| {
            let scope = expressions::Scope {
                variables: vec![],
                captures: vec![(short.capture.clone(), LinkedType::Scalar(ScalarType::Text))],
            };
            let denotes =
                expressions::resolve_expression_in(module, &short.denotes, modules, ids, &scope)?;
            let expected = expressions::field_shape(
                module,
                &module.value,
                &module.source,
                modules,
                ids,
                &mut BTreeSet::new(),
            )?;
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
                    let value = expressions::resolve_expression_in(
                        module, expression, modules, ids, &scope,
                    )?;
                    expressions::require_boolean(&value)?;
                    Ok(value)
                })
                .transpose()?;
            Ok(LinkedShorthand {
                id: short.id.clone(),
                denotes,
                when,
                source: short.source.clone(),
            })
        })
        .collect()
}
