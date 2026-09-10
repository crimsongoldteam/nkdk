use super::*;

pub(super) fn resolve(
    module: &Module,
    modules: &BTreeMap<&str, &Module>,
    ids: &BTreeMap<&str, u32>,
) -> Result<Option<LinkedNormalization>, Diagnostic> {
    let Some(normalization) = &module.normalization else {
        return Ok(None);
    };
    let when = expressions::resolve_expression(module, &normalization.when, modules, ids)?;
    expressions::require_boolean(&when)?;
    if !is_static(&when) {
        return Err(diagnostic(
            "dynamic_normalization_condition",
            &when.source,
            "Normalization selection must use static parameters and literals",
        ));
    }
    let expected = expressions::field_shape(
        module,
        &module.value,
        &module.source,
        modules,
        ids,
        &mut BTreeSet::new(),
    )?;
    if !matches!(expected, LinkedType::Sequence(_)) {
        return Err(diagnostic(
            "expression_type_mismatch",
            &normalization.source,
            "Empty-sequence normalization requires a sequence value",
        ));
    }
    let denotes = denotations::resolve(module, &normalization.denotes, &expected, modules, ids)?;
    if !nonempty(&denotes) {
        return Err(diagnostic(
            "non_progressing_normalization",
            &denotes.source,
            "Normalization must provably produce a nonempty sequence",
        ));
    }
    Ok(Some(LinkedNormalization {
        when,
        denotes,
        source: normalization.source.clone(),
    }))
}

fn is_static(value: &LinkedExpression) -> bool {
    match &value.kind {
        LinkedExpressionKind::Parameter(_) | LinkedExpressionKind::Literal(_) => true,
        LinkedExpressionKind::Operation { arguments, .. } => arguments.iter().all(is_static),
        _ => false,
    }
}
fn nonempty(value: &LinkedExpression) -> bool {
    match &value.kind {
        LinkedExpressionKind::Operation {
            operator: LinkedOperator::Sequence,
            arguments,
        } => !arguments.is_empty(),
        LinkedExpressionKind::Operation {
            operator: LinkedOperator::Conditional,
            arguments,
        } => arguments[1..].iter().all(nonempty),
        _ => false,
    }
}
