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
            let value = expressions::resolve_expression_in(
                module,
                &contribution.value,
                modules,
                ids,
                &scope,
            )?;
            if crate::fact_shape::columns(&key.value_type).is_none() {
                return Err(diagnostic(
                    "contribution_type",
                    &key.source,
                    "Index key requires text, enumeration, or a nonempty record of these fields",
                ));
            }
            if value.value_type != LinkedType::Scalar(ScalarType::Text) {
                return Err(diagnostic(
                    "contribution_type",
                    &value.source,
                    "Index projection requires a text value",
                ));
            }
            Ok(LinkedContribution {
                for_each,
                index: contribution.index.clone(),
                key,
                value,
                source: contribution.source.clone(),
            })
        })
        .collect()
}

pub(super) fn validate_inputs(entries: &[LinkedEntry]) -> Result<(), Diagnostic> {
    let mut shapes = BTreeMap::<&str, &LinkedContribution>::new();
    for contribution in entries.iter().flat_map(|entry| &entry.contributions) {
        if let Some(first) = shapes.insert(&contribution.index, contribution)
            && !expressions::same_type(&first.key.value_type, &contribution.key.value_type)
        {
            let mut error = diagnostic(
                "index_shape_mismatch",
                &contribution.source,
                "Contributions to an index must have the same key shape",
            );
            error.related.push(first.source.clone());
            return Err(error);
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
            if !matches!(&input.value, LinkedType::Index {key,value} if expressions::same_type(key,&shape.key.value_type) && **value==LinkedType::Scalar(ScalarType::Text))
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
