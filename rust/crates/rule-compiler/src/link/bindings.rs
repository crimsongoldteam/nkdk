use super::*;

pub(super) fn resolve_bindings(
    module: &Module,
    target: &Module,
    usage: &TypeUse,
    modules: &BTreeMap<&str, &Module>,
    ids: &BTreeMap<&str, u32>,
) -> Result<Vec<LinkedBinding>, Diagnostic> {
    for binding in &usage.bindings {
        if !target.inputs.iter().any(|input| input.name == binding.name) {
            return Err(diagnostic(
                "unknown_input_binding",
                &binding.value.source,
                "Binding target input is not declared",
            ));
        }
    }
    let mut result = vec![];
    for (slot, input) in target.inputs.iter().enumerate() {
        let binding = usage
            .bindings
            .iter()
            .find(|binding| binding.name == input.name)
            .ok_or_else(|| {
                diagnostic(
                    "missing_input_binding",
                    &usage.source,
                    "Required input has no binding",
                )
            })?;
        let value = resolve_expression(module, &binding.value, modules, ids)?;
        let expected = resolve_data_type(
            target,
            &input.definition,
            &input.source,
            modules,
            ids,
            &mut BTreeSet::new(),
        )?;
        if !same_type(&value.value_type, &expected) {
            let mut error = diagnostic(
                "binding_type_mismatch",
                &binding.value.source,
                "Binding does not match the declared input type",
            );
            error.related.push(input.source.clone());
            return Err(error);
        }
        result.push(LinkedBinding {
            slot: slot as u32,
            value,
        });
    }
    Ok(result)
}

use super::expressions::resolve_expression;
use super::expressions::same_type;
