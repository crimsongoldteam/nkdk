//! Specialize input-dependent scalar contracts using the checked owner bindings.
use super::*;

pub(super) fn specialize(
    common: &LinkedEntry,
    bindings: &[LinkedBinding],
    arguments: &[LinkedExpression],
) -> Result<Option<LinkedEntry>, Diagnostic> {
    if (matches!(common.xml, LinkedXml::TextPattern(_))
        && matches!(common.yaml, YamlRepresentation::TextPattern(_)))
        || (matches!(common.value, LinkedType::Choice(_))
            && matches!(common.yaml, YamlRepresentation::Choice))
        || typed_collection(common)
    {
        let mut instance = common.clone();
        super::composition::instantiate_value(&mut instance, bindings, arguments)?;
        instance.inputs.clear();
        instance.parameters.clear();
        return Ok(Some(instance));
    }
    if common.constraints.is_empty()
        || common.value != LinkedType::Scalar(ScalarType::Text)
        || !arguments.is_empty()
        || !common.parameters.is_empty()
        || !common.presence.is_empty()
        || !common.shorthands.is_empty()
        || common.normalization.is_some()
        || !matches!(common.xml, LinkedXml::Text)
        || !matches!(common.yaml, YamlRepresentation::Text)
    {
        return Ok(None);
    }
    let mut instance = common.clone();
    instance.inputs.clear();
    for rule in &mut instance.constraints {
        bind(&mut rule.assertion, bindings)?;
        if let Some(value) = &mut rule.when {
            bind(value, bindings)?;
        }
        for part in &mut rule.diagnostic.message {
            if let LinkedMessagePart::Expression(value) = part {
                bind(value, bindings)?;
            }
        }
    }
    Ok(Some(instance))
}

fn bind(value: &mut LinkedExpression, bindings: &[LinkedBinding]) -> Result<(), Diagnostic> {
    match &mut value.kind {
        LinkedExpressionKind::Input(slot) => {
            *value = bindings
                .iter()
                .find(|binding| binding.slot == *slot)
                .ok_or_else(|| {
                    diagnostic(
                        "missing_input_binding",
                        &value.source,
                        "Missing scalar input binding",
                    )
                })?
                .value
                .clone();
        }
        LinkedExpressionKind::Operation { arguments, .. } => {
            for argument in arguments {
                bind(argument, bindings)?;
            }
        }
        _ => (),
    }
    Ok(())
}

/// Only ordinary collections of referenced values use this specialization path.
pub(super) fn typed_collection(entry: &LinkedEntry) -> bool {
    matches!(&entry.value, LinkedType::Sequence(item) if matches!(item.as_ref(), LinkedType::Reference(_) | LinkedType::BoundReference { .. }))
        && matches!(entry.yaml, YamlRepresentation::Sequence { .. })
}
