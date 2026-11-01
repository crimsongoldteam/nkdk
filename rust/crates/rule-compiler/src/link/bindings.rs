use super::expressions::contextual_literals;
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
        let expected = resolve_data_type(
            target,
            &input.definition,
            &input.source,
            modules,
            ids,
            &mut BTreeSet::new(),
        )?;
        let binding = usage
            .bindings
            .iter()
            .find(|binding| binding.name == input.name);
        let row_use = match &module.value {
            TypeDefinition::Sequence(item) => match item.as_ref() {
                TypeDefinition::Use(row) => Some(row),
                _ => None,
            },
            _ => None,
        };
        let row_input = match &module.representations.yaml {
            YamlRepresentation::RecordMapping { item_inputs, .. }
                if row_use.is_some_and(|row| row.source == usage.source) =>
            {
                item_inputs
                    .iter()
                    .position(|item| item.target == input.name)
            }
            _ => None,
        };
        let mut value = match binding {
            Some(binding) => resolve_expression(module, &binding.value, modules, ids)?,
            None if row_input.is_some() && expected == LinkedType::Scalar(ScalarType::Text) => {
                LinkedExpression {
                    kind: LinkedExpressionKind::RowInput(row_input.expect("checked") as u32),
                    value_type: expected.clone(),
                    source: usage.source.clone(),
                }
            }
            None if row_input.is_some() => {
                return Err(diagnostic(
                    "expression_type_mismatch",
                    &input.source,
                    "Record mapping item input must be text",
                ));
            }
            None => {
                return Err(diagnostic(
                    "missing_input_binding",
                    &usage.source,
                    "Required input has no binding",
                ));
            }
        };
        contextual_literals(&expected, &mut value)?;
        if !same_type(&value.value_type, &expected) {
            let mut error = diagnostic(
                "binding_type_mismatch",
                &value.source,
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
