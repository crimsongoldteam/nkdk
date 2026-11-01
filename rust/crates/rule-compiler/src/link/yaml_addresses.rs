//! Resolve semantic field selectors before code generation, without runtime names.
use super::*;

pub(super) fn segments(
    module: &Module,
    field: &str,
    modules: &BTreeMap<&str, &Module>,
    source: &SourceLocation,
) -> Result<Vec<String>, Diagnostic> {
    fn collect(
        module: &Module,
        field: &str,
        modules: &BTreeMap<&str, &Module>,
        visiting: &mut BTreeSet<String>,
        matches: &mut Vec<Vec<String>>,
    ) {
        if !visiting.insert(module.id.clone()) {
            return;
        }
        match &module.representations.yaml {
            YamlRepresentation::Mapping(fields) => {
                for mapping in fields
                    .iter()
                    .filter(|mapping| mapping.field == field && mapping.file.is_none())
                {
                    matches.push(vec![mapping.key.clone()]);
                }
            }
            YamlRepresentation::Projection(projected) if projected == field => matches.push(vec![]),
            YamlRepresentation::Choice { .. } => {
                if matches!(&module.value, TypeDefinition::Choice(fields) if fields.iter().any(|variant|variant.name == field))
                {
                    matches.push(vec![]);
                }
            }
            _ => {}
        }
        for usage in &module.compose {
            if let Some(import) = module
                .imports
                .iter()
                .find(|import| import.name == usage.name)
                && let Some(fragment) = modules.get(import.value.as_str())
            {
                collect(fragment, field, modules, visiting, matches);
            }
        }
        visiting.remove(&module.id);
    }
    let mut matches = Vec::new();
    collect(module, field, modules, &mut BTreeSet::new(), &mut matches);
    if matches.len() != 1 {
        return Err(diagnostic(
            "yaml_address_field",
            source,
            "Address field must have one semantic YAML location; external files require their own boundary",
        ));
    }
    Ok(matches.pop().expect("one declared address"))
}
