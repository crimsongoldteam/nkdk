use super::*;

pub(super) fn resolve(
    module: &Module,
    modules: &BTreeMap<&str, &Module>,
    ids: &BTreeMap<&str, u32>,
) -> Result<Vec<LinkedContribution>, Diagnostic> {
    if !module.contributions.is_empty() && module.kind == ModuleKind::Value {
        return Err(diagnostic(
            "contribution_scope",
            &module.source,
            "Index contributions require an object or fragment owner",
        ));
    }
    module
        .contributions
        .iter()
        .map(|contribution| {
            let (for_each, scope) =
                expressions::iteration_scope(module, contribution.for_each.as_ref(), modules, ids)?;
            let key = expressions::resolve_expression_in(
                module,
                &contribution.key,
                modules,
                ids,
                &scope,
            )?;
            let value = contribution
                .write
                .value()
                .map(|value| {
                    expressions::resolve_expression_in(module, value, modules, ids, &scope)
                })
                .transpose()?;
            let when = contribution
                .when
                .as_ref()
                .map(|expression| {
                    expressions::resolve_expression_in(module, expression, modules, ids, &scope)
                })
                .transpose()?;
            if when.as_ref().is_some_and(|expression| {
                expression.value_type != LinkedType::Scalar(ScalarType::Boolean)
            }) {
                return Err(diagnostic(
                    "contribution_type",
                    &contribution.source,
                    "Contribution condition must be boolean",
                ));
            }
            let reservation = contribution.write.is_reservation();
            let columns = if reservation {
                crate::fact_shape::record_columns(&key.value_type)
            } else {
                crate::fact_shape::columns(&key.value_type)
            };
            if columns.is_none() {
                return Err(diagnostic(
                    "contribution_type",
                    &key.source,
                    "Index key requires text, enumeration, or a nonempty record of these fields",
                ));
            }
            if value
                .as_ref()
                .is_some_and(|value| value.value_type != LinkedType::Scalar(ScalarType::Text))
            {
                return Err(diagnostic(
                    "contribution_type",
                    &contribution.source,
                    "Index projection requires a text value",
                ));
            }
            if let Some(allocation) = contribution.write.allocation() {
                let columns = crate::fact_shape::columns(&key.value_type).unwrap();
                let mut unique = BTreeSet::new();
                if columns.is_empty()
                    || allocation
                        .scope
                        .iter()
                        .any(|name| !columns.contains(&name.as_str()) || !unique.insert(name))
                {
                    return Err(diagnostic(
                        "allocation_scope",
                        &contribution.source,
                        "Allocation scope must select distinct columns of a record key",
                    ));
                }
            }
            if contribution.union_reference_prefix.is_some()
                && (for_each.is_none()
                    || key.value_type != LinkedType::Scalar(ScalarType::Text)
                    || contains_variable(&key))
            {
                return Err(diagnostic(
                    "union_contribution_type",
                    &key.source,
                    "Named union requires a text owner key independent of its alternative rows",
                ));
            }
            if contribution.coalesce_equal && contribution.union_reference_prefix.is_some() {
                return Err(diagnostic(
                    "contribution_type",
                    &contribution.source,
                    "Duplicate policy is for lookup indexes, not named unions",
                ));
            }
            Ok(LinkedContribution {
                coalesce_equal: contribution.coalesce_equal,
                for_each,
                when,
                index: contribution.index.clone(),
                union_reference_prefix: contribution.union_reference_prefix.clone(),
                key,
                write: match &contribution.write {
                    nkdk_rule_model::IndexWrite::Value(_) => {
                        nkdk_rule_model::IndexWrite::Value(value.unwrap())
                    }
                    nkdk_rule_model::IndexWrite::Reserve(_) => {
                        nkdk_rule_model::IndexWrite::Reserve(value.unwrap())
                    }
                    nkdk_rule_model::IndexWrite::Allocate(allocation) => {
                        let mut allocation = allocation.clone();
                        allocation.scope.sort_unstable();
                        nkdk_rule_model::IndexWrite::Allocate(allocation)
                    }
                },
                source: contribution.source.clone(),
            })
        })
        .collect()
}

fn contains_variable(expression: &LinkedExpression) -> bool {
    match &expression.kind {
        LinkedExpressionKind::Variable(_) | LinkedExpressionKind::Ordinal(_) => true,
        LinkedExpressionKind::Operation { arguments, .. } => {
            arguments.iter().any(contains_variable)
        }
        _ => false,
    }
}

pub(super) fn validate_inputs(entries: &[LinkedEntry]) -> Result<(), Diagnostic> {
    let mut shapes = BTreeMap::<&str, &LinkedContribution>::new();
    let mut allocations = BTreeMap::<&str, (&[String], &SourceLocation)>::new();
    for contribution in entries.iter().flat_map(|entry| &entry.contributions) {
        if contribution.write.is_reservation() {
            continue;
        }
        if let Some(allocation) = contribution.write.allocation()
            && let Some((scope, source)) = allocations.insert(
                &contribution.index,
                (&allocation.scope, &contribution.source),
            )
            && scope != allocation.scope
        {
            let mut error = diagnostic(
                "allocation_scope",
                &contribution.source,
                "Requests for an index must agree on scope columns",
            );
            error.related.push(source.clone());
            return Err(error);
        }
        if let Some(first) = shapes.insert(&contribution.index, contribution)
            && (crate::fact_shape::columns(&first.key.value_type)
                != crate::fact_shape::columns(&contribution.key.value_type)
                || first.union_reference_prefix != contribution.union_reference_prefix
                || first.coalesce_equal != contribution.coalesce_equal)
        {
            let mut error = diagnostic(
                "index_shape_mismatch",
                &contribution.source,
                "Contributions to an index must have the same key shape and union profile",
            );
            error.related.push(first.source.clone());
            return Err(error);
        }
    }
    for contribution in entries
        .iter()
        .flat_map(|entry| &entry.contributions)
        .filter(|contribution| contribution.write.is_reservation())
    {
        let columns = crate::fact_shape::record_columns(&contribution.key.value_type)
            .expect("checked reservation key");
        if !allocations
            .get(contribution.index.as_str())
            .is_some_and(|(scope, _)| scope.iter().map(String::as_str).eq(columns))
        {
            return Err(diagnostic(
                "reservation_scope",
                &contribution.source,
                "A reservation must select exactly the scope columns of a declared allocator",
            ));
        }
    }
    for entry in entries {
        if !entry.input_indexes.is_empty() && entry.kind != ModuleKind::Object {
            return Err(diagnostic(
                "index_binding_scope",
                &entry.source,
                "Prepared index bindings belong to object owners",
            ));
        }
        for binding in &entry.input_indexes {
            let input = entry
                .inputs
                .iter()
                .find(|input| input.name == binding.name)
                .expect("declared input binding");
            let Some(shape) = shapes.get(binding.value.as_str()) else {
                return Err(diagnostic(
                    "index_missing",
                    &binding.source,
                    "No declaration contributes to the bound index",
                ));
            };
            let expected = if shape.union_reference_prefix.is_some() {
                LinkedType::Sequence(Box::new(LinkedType::Scalar(ScalarType::Text)))
            } else {
                LinkedType::Scalar(ScalarType::Text)
            };
            if !matches!(&input.value, LinkedType::Index {key,value} if crate::fact_shape::columns(key)==crate::fact_shape::columns(&shape.key.value_type) && **value==expected)
            {
                return Err(diagnostic(
                    "index_binding_type",
                    &binding.source,
                    "Index binding does not match the declared input key and value types",
                ));
            }
        }
    }
    Ok(())
}
