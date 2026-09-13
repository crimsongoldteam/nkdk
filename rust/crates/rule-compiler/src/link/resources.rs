use super::*;

pub(super) fn resolve(
    module: &Module,
    modules: &BTreeMap<&str, &Module>,
    ids: &BTreeMap<&str, u32>,
) -> Result<Vec<ResourceGroup<LinkedExpression, LinkedIteration>>, Diagnostic> {
    if !module.resources.is_empty() && module.kind == ModuleKind::Value {
        return Err(diagnostic(
            "resource_scope",
            &module.source,
            "Resources belong to objects or fragments",
        ));
    }
    module
        .resources
        .iter()
        .map(|group| {
            let (for_each, scope) =
                expressions::iteration_scope(module, group.for_each.as_ref(), modules, ids)?;
            if let Some(iteration) = &for_each {
                validate_sequence(&iteration.input)?;
            }

            let path = |value: &Expression| {
                let linked =
                    expressions::resolve_expression_in(module, value, modules, ids, &scope)?;
                validate(&linked)?;
                Ok(linked)
            };
            Ok(ResourceGroup {
                remainder: group.remainder,
                for_each,
                source: group.source.clone(),
                alternatives: group
                    .alternatives
                    .iter()
                    .map(|route| {
                        Ok(ResourceRoute {
                            xml: path(&route.xml)?,
                            yaml: path(&route.yaml)?,
                        })
                    })
                    .collect::<Result<_, Diagnostic>>()?,
            })
        })
        .collect()
}

pub(crate) fn validate(value: &LinkedExpression) -> Result<(), Diagnostic> {
    if !matches!(
        value.kind,
        LinkedExpressionKind::Operation {
            operator: LinkedOperator::Sequence,
            ..
        } | LinkedExpressionKind::Input(_)
    ) || value.value_type != LinkedType::Sequence(Box::new(LinkedType::Scalar(ScalarType::Text)))
        || !prepared(value)
    {
        return Err(diagnostic(
            "resource_path",
            &value.source,
            "Resource paths require a sequence of text, built from prepared inputs, literals and concatenation",
        ));
    }
    Ok(())
}
fn prepared(value: &LinkedExpression) -> bool {
    match &value.kind {
        LinkedExpressionKind::Input(_)
        | LinkedExpressionKind::Variable(_)
        | LinkedExpressionKind::Literal(ScalarLiteral::Text(_)) => true,
        LinkedExpressionKind::Operation {
            operator: LinkedOperator::Sequence | LinkedOperator::Concat,
            arguments,
        } => arguments.iter().all(prepared),
        _ => false,
    }
}

pub(super) fn validate_sequence(value: &LinkedExpression) -> Result<(), Diagnostic> {
    if value.value_type != LinkedType::Sequence(Box::new(LinkedType::Scalar(ScalarType::Text)))
        || !prepared(value)
    {
        return Err(diagnostic(
            "resource_iteration",
            &value.source,
            "Resource iteration requires a prepared sequence of text",
        ));
    }
    Ok(())
}
