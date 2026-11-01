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
    let mut expanded: Vec<Module> = modules.values().map(|module| (*module).clone()).collect();
    let mut shapes = BTreeMap::new();
    loop {
        let indexed = expanded
            .iter()
            .map(|module| (module.id.as_str(), module))
            .collect();
        let mut deferred = None;
        for module in expanded
            .iter()
            .filter(|module| !module.contributions.is_empty())
        {
            match contributions::resolve(module, &indexed, ids) {
                Ok(contributions) => {
                    for contribution in contributions {
                        if contribution.write.is_reservation() {
                            continue;
                        }
                        shapes.entry(contribution.index).or_insert((
                            contribution.key.value_type,
                            contribution.union_reference_prefix,
                        ));
                    }
                }
                Err(error) if error.code == "unresolved_index_input" => {
                    deferred = Some(error);
                }
                Err(error) => return Err(error),
            }
        }
        let mut progress = false;
        let mut unresolved = None;
        for module in &mut expanded {
            for input in &mut module.inputs {
                if let TypeDefinition::IndexFromBinding(name) = &input.definition {
                    if let Some((shape, union)) = shapes.get(name) {
                        input.definition = TypeDefinition::Index {
                            key: Box::new(key_type(shape)),
                            value: Box::new(if union.is_some() {
                                TypeDefinition::Sequence(Box::new(TypeDefinition::Scalar(
                                    ScalarType::Text,
                                )))
                            } else {
                                TypeDefinition::Scalar(ScalarType::Text)
                            }),
                        };
                        progress = true;
                    } else {
                        unresolved = Some(input.source.clone());
                    }
                }
            }
        }
        if unresolved.is_none() {
            break;
        }
        if !progress {
            return Err(deferred.unwrap_or_else(|| {
                diagnostic(
                    "index_missing",
                    &unresolved.unwrap(),
                    "No declaration contributes a resolvable type to the bound index",
                )
            }));
        }
    }
    Ok(Some(expanded))
}

fn key_type(shape: &LinkedType) -> TypeDefinition {
    match shape {
        LinkedType::Scalar(ScalarType::Text) => TypeDefinition::Scalar(ScalarType::Text),
        // Prepared indexes contain canonical text projections, not enum ordinals.
        LinkedType::Enum(_) => TypeDefinition::Scalar(ScalarType::Text),
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
