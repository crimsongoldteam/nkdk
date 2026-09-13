use super::*;

/// Lower a single property's owner contract into the collection's value scope.
pub(super) fn override_for(
    common: &LinkedEntry,
    owner: &LinkedEntry,
    bindings: &[LinkedBinding],
    arguments: &[LinkedExpression],
) -> Result<Option<LinkedEntry>, Diagnostic> {
    if owner.presence.is_empty() {
        return Ok(None);
    }
    if owner.presence.len() != 1 || owner.presence[0].target != LinkedPresenceTarget::Field(0) {
        return Err(unsupported(
            owner,
            "Collection presence needs its property target",
        ));
    }
    let mut result = common.clone();
    result.inputs = owner.inputs.clone();
    let mut rule = owner.presence[0].clone();
    rule.target = LinkedPresenceTarget::SelfValue;
    for value in rule.expressions_mut() {
        rebind(value, common, owner)?;
    }
    for inherited in &mut result.presence {
        for value in inherited.expressions_mut() {
            *value = super::shorthand::specialize(value, bindings, arguments, owner)?;
        }
    }
    if let Some(normalization) = &mut result.normalization {
        normalization.when =
            super::shorthand::specialize(&normalization.when, bindings, arguments, owner)?;
        normalization.denotes =
            super::shorthand::specialize(&normalization.denotes, bindings, arguments, owner)?;
    }
    if let Some(inherited) = result
        .presence
        .iter_mut()
        .find(|item| item.target == LinkedPresenceTarget::SelfValue)
    {
        if rule.xml_missing.is_some() {
            inherited.xml_missing = rule.xml_missing;
        }
        if rule.yaml_missing.is_some() {
            inherited.yaml_missing = rule.yaml_missing;
        }
        if rule.yaml_omit_when.is_some() {
            inherited.yaml_omit_when = rule.yaml_omit_when;
        }
        for (target, overrides) in [
            (&mut inherited.xml_empty, rule.xml_empty),
            (&mut inherited.yaml_empty, rule.yaml_empty),
        ] {
            for form in overrides {
                target.retain(|item| item.form != form.form);
                target.push(form);
            }
        }
        // Specific owner cases precede the common fallback.
        inherited.canonical.splice(0..0, rule.canonical);
    } else {
        result.presence.push(rule);
    }
    Ok(Some(result))
}

fn rebind(
    value: &mut LinkedExpression,
    common: &LinkedEntry,
    owner: &LinkedEntry,
) -> Result<(), Diagnostic> {
    match &mut value.kind {
        LinkedExpressionKind::Field(0) => {
            value.kind = LinkedExpressionKind::SelfValue;
            value.value_type = common.value.clone();
        }
        LinkedExpressionKind::Field(_) | LinkedExpressionKind::SelfValue => {
            return Err(unsupported(
                owner,
                "Collection presence can read only its own property",
            ));
        }
        LinkedExpressionKind::Operation { arguments, .. } => {
            for argument in arguments {
                rebind(argument, common, owner)?;
            }
        }
        _ => {}
    }
    Ok(())
}
