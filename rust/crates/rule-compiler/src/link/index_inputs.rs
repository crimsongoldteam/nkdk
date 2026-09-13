use super::*;

/// Infer owner-bound inputs from checked producers before linking consumers.
pub(super) fn infer(
    modules: &BTreeMap<&str, &Module>,
    ids: &BTreeMap<&str, u32>,
) -> Result<Option<Vec<Module>>, Diagnostic> {
    if !modules.values().any(|module| {
        module
            .inputs
            .iter()
            .any(|input| matches!(input.definition, TypeDefinition::IndexFromBinding(_)))
    }) {
        return Ok(None);
    }
    let mut shapes = BTreeMap::new();
    for module in modules
        .values()
        .filter(|module| !module.contributions.is_empty())
    {
        for contribution in contributions::resolve(module, modules, ids)? {
            shapes
                .entry(contribution.index)
                .or_insert(contribution.key.value_type);
        }
    }
    let mut expanded = Vec::with_capacity(modules.len());
    for module in modules.values() {
        let mut module = (*module).clone();
        for input in &mut module.inputs {
            if let TypeDefinition::IndexFromBinding(name) = &input.definition {
                let shape = shapes.get(name).ok_or_else(|| {
                    diagnostic(
                        "index_missing",
                        &input.source,
                        "No declaration contributes to the bound index",
                    )
                })?;
                input.definition = TypeDefinition::Index {
                    key: Box::new(key_type(shape)),
                    value: Box::new(TypeDefinition::Scalar(ScalarType::Text)),
                };
            }
        }
        expanded.push(module);
    }
    Ok(Some(expanded))
}

fn key_type(shape: &LinkedType) -> TypeDefinition {
    match shape {
        LinkedType::Scalar(ScalarType::Text) => TypeDefinition::Scalar(ScalarType::Text),
        LinkedType::Enum(variants) => TypeDefinition::Enum(variants.clone()),
        LinkedType::Record(fields) => TypeDefinition::Record(
            fields
                .iter()
                .map(|field| TypeField {
                    name: field.name.clone(),
                    definition: key_type(&field.value),
                    source: field.source.clone(),
                })
                .collect(),
        ),
        _ => unreachable!("validated index key shape"),
    }
}
