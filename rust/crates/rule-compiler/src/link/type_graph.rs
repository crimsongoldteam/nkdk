use super::*;

pub(super) fn validate(modules: &BTreeMap<&str, &Module>) -> Result<(), Vec<Diagnostic>> {
    let mut graph = BTreeMap::new();
    for (&name, module) in modules {
        let mut usages = vec![];
        collect(&module.value, false, &mut usages);
        for item in module.types.iter().chain(&module.inputs) {
            collect(&item.definition, false, &mut usages);
        }
        for parameter in &module.parameters {
            collect(&parameter.definition, false, &mut usages);
        }
        let mut edges = vec![];
        for (usage, collection_bounded) in usages {
            let import = module
                .imports
                .iter()
                .find(|import| import.name == usage.name)
                .ok_or_else(|| {
                    vec![diagnostic(
                        "missing_import_alias",
                        &usage.source,
                        "Type import alias is not declared",
                    )]
                })?;
            let target = modules[import.value.as_str()];
            if target.kind != ModuleKind::Value {
                return Err(vec![diagnostic(
                    "expected_value",
                    &usage.source,
                    "Serialized type must reference a value declaration",
                )]);
            }
            if !collection_bounded {
                edges.push((target.id.as_str(), &usage.source));
            }
        }
        graph.insert(name, edges);
    }
    let mut states = BTreeMap::new();
    for &name in graph.keys() {
        visit(name, &graph, &mut states).map_err(|error| vec![error])?;
    }
    Ok(())
}

fn collect<'a>(
    value: &'a TypeDefinition,
    collection_bounded: bool,
    usages: &mut Vec<(&'a TypeUse, bool)>,
) {
    match value {
        TypeDefinition::Use(usage) => usages.push((usage, collection_bounded)),
        TypeDefinition::Sequence(item) => collect(item, true, usages),
        TypeDefinition::Index { key, value } => {
            collect(key, collection_bounded, usages);
            collect(value, collection_bounded, usages);
        }
        TypeDefinition::Record(fields) | TypeDefinition::Choice(fields) => {
            for field in fields {
                collect(&field.definition, collection_bounded, usages);
            }
        }
        _ => {}
    }
}

type Graph<'a> = BTreeMap<&'a str, Vec<(&'a str, &'a SourceLocation)>>;
fn visit<'a>(
    name: &'a str,
    graph: &Graph<'a>,
    states: &mut BTreeMap<&'a str, u8>,
) -> Result<(), Diagnostic> {
    if states.get(name) == Some(&2) {
        return Ok(());
    }
    states.insert(name, 1);
    for &(target, source) in &graph[name] {
        if states.get(target) == Some(&1) {
            return Err(diagnostic(
                "recursive_value_type",
                source,
                "Recursive value shape needs an explicit recursion contract",
            ));
        }
        visit(target, graph, states)?;
    }
    states.insert(name, 2);
    Ok(())
}
