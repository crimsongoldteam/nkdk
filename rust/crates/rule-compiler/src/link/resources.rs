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
    if value.value_type != LinkedType::Sequence(Box::new(LinkedType::Scalar(ScalarType::Text)))
        || !prepared_path(value)
    {
        return Err(diagnostic(
            "resource_path",
            &value.source,
            "Resource paths require prepared text sequences, optionally selected by text equality",
        ));
    }
    Ok(())
}
fn prepared_path(value: &LinkedExpression) -> bool {
    match &value.kind {
        LinkedExpressionKind::Input(_) => true,
        LinkedExpressionKind::Operation {
            operator: LinkedOperator::Sequence,
            arguments,
        } => arguments.iter().all(prepared),
        LinkedExpressionKind::Operation {
            operator: LinkedOperator::Conditional,
            arguments,
        } if arguments.len() == 3 => {
            prepared_condition(&arguments[0]) && arguments[1..].iter().all(prepared_path)
        }
        _ => false,
    }
}
fn prepared_condition(value: &LinkedExpression) -> bool {
    matches!(&value.kind, LinkedExpressionKind::Operation { operator: LinkedOperator::Equal, arguments }
        if arguments.len() == 2 && arguments.iter().all(|part| part.value_type == LinkedType::Scalar(ScalarType::Text) && prepared(part)))
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

pub(super) fn yaml_files(
    module: &Module,
    modules: &BTreeMap<&str, &Module>,
    ids: &BTreeMap<&str, u32>,
) -> Result<Vec<LinkedYamlFile>, Diagnostic> {
    let YamlRepresentation::Mapping(mappings) = &module.representations.yaml else {
        return Ok(Vec::new());
    };
    mappings
        .iter()
        .filter_map(|mapping| mapping.file.as_ref().map(|path| (mapping, path)))
        .map(|(mapping, path)| {
            let reference = Expression {
                kind: ExpressionKind::Field(mapping.field.clone()),
                source: mapping.source.clone(),
            };
            let resolved = expressions::resolve_expression(module, &reference, modules, ids)?;
            let LinkedExpressionKind::Field(field) = resolved.kind else {
                return Err(diagnostic(
                    "yaml_file_type",
                    &mapping.source,
                    "File storage requires a record field",
                ));
            };
            if !mapping.key.is_empty() {
                return Err(diagnostic(
                    "yaml_field_storage",
                    &mapping.source,
                    "File storage must not also have a key",
                ));
            }
            let path = expressions::resolve_expression(module, path, modules, ids)?;
            validate(&path)?;
            Ok(LinkedYamlFile { field, path })
        })
        .collect()
}

pub(super) fn validate_yaml_files(
    entry: &LinkedEntry,
    program: &Program,
) -> Result<(), Diagnostic> {
    if entry.yaml_files.is_empty() {
        return Ok(());
    }
    let LinkedType::Record(fields) = &entry.value else {
        return Err(diagnostic(
            "yaml_file_type",
            &entry.source,
            "File storage requires a record",
        ));
    };
    for file in &entry.yaml_files {
        let mut value = &fields[file.field as usize].value;
        loop {
            match value {
                LinkedType::Scalar(ScalarType::Text) => break,
                LinkedType::Reference(id) | LinkedType::BoundReference { entry: id, .. } => {
                    value = &program
                        .entries
                        .iter()
                        .find(|candidate| candidate.id == *id)
                        .expect("linked file value")
                        .value;
                }
                _ => {
                    return Err(diagnostic(
                        "yaml_file_type",
                        &file.path.source,
                        "External text storage requires a text scalar",
                    ));
                }
            }
        }
    }
    Ok(())
}
