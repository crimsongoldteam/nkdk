//! Specialize input-dependent scalar contracts using the checked owner bindings.
use super::*;

pub(super) fn specialize(
    common: &LinkedEntry,
    bindings: &[LinkedBinding],
    arguments: &[LinkedExpression],
) -> Result<Option<LinkedEntry>, Diagnostic> {
    // Profile selectors refer to declared input names. Keep their checked
    // bindings on the reference; substituting expressions and clearing inputs
    // would leave those selectors without their input contract.
    // A routed choice passes caller inputs to the selected value backend.
    // Keep sibling expressions at the caller boundary rather than embedding
    // them into the referenced choice's own field scope.
    if !common.inputs.is_empty()
        && matches!(common.value, LinkedType::Choice(_))
        && matches!(common.xml, LinkedXml::Choice { fallback: Some(_) })
    {
        return Ok(None);
    }
    if matches!(&common.yaml, YamlRepresentation::Choice { variants, .. }
        if variants.iter().any(|case| matches!(case.form,
            YamlChoiceForm::ScalarInput { .. } | YamlChoiceForm::MappingInput { .. } | YamlChoiceForm::InputProfile { .. })))
    {
        return Ok(None);
    }
    if (matches!(common.xml, LinkedXml::TextPattern(_))
        && matches!(common.yaml, YamlRepresentation::TextPattern(_)))
        || (matches!(common.value, LinkedType::Choice(_))
            && matches!(common.yaml, YamlRepresentation::Choice { .. }))
        || typed_collection(common)
    {
        let mut instance = common.clone();
        super::composition::instantiate_value(&mut instance, bindings, arguments)?;
        instance.inputs.clear();
        instance.parameters.clear();
        return Ok(Some(instance));
    }
    if (common.constraints.is_empty() && common.presence.is_empty())
        || common.value != LinkedType::Scalar(ScalarType::Text)
        || !arguments.is_empty()
        || !common.parameters.is_empty()
        || !common.shorthands.is_empty()
        || common.normalization.is_some()
        || !matches!(common.xml, LinkedXml::Text)
        || !matches!(common.yaml, YamlRepresentation::Text)
    {
        return Ok(None);
    }
    let mut instance = common.clone();
    super::composition::instantiate_value(&mut instance, bindings, arguments)?;
    instance.inputs.clear();
    Ok(Some(instance))
}

/// Only ordinary collections of referenced values use this specialization path.
pub(super) fn typed_collection(entry: &LinkedEntry) -> bool {
    matches!(&entry.value, LinkedType::Sequence(item) if matches!(item.as_ref(), LinkedType::Reference(_) | LinkedType::BoundReference { .. }))
        && matches!(
            entry.yaml,
            YamlRepresentation::Sequence { .. } | YamlRepresentation::TextSequence { .. }
        )
}
