use super::*;

/// Reuse the expression compiler with the current occurrence as its storage.
pub(super) fn generate(
    owner: &LinkedEntry,
    program: &Program,
    fields: &[LinkedField],
    value: &LinkedExpression,
    bindings: &[LinkedBinding],
    arguments: &[LinkedExpression],
) -> Result<(String, String), Diagnostic> {
    let mut value = shorthand::specialize(value, bindings, arguments, owner)?;
    bind_self(&mut value, owner)?;
    let storage = fields
        .iter()
        .enumerate()
        .map(|(index, _)| (format!("row.fields[{index}].as_str()"), "true".into()))
        .collect::<Vec<_>>();
    let mut context = owner.clone();
    context.value = LinkedType::Record(fields.to_vec());
    let mut expressions = expressions::Expressions::new(&context, program, fields, Some(&storage));
    let code = expressions.lower(&value)?;
    Ok((expressions.constants, code))
}

fn bind_self(value: &mut LinkedExpression, owner: &LinkedEntry) -> Result<(), Diagnostic> {
    match &mut value.kind {
        LinkedExpressionKind::SelfValue
            if value.value_type == LinkedType::Scalar(ScalarType::Text) =>
        {
            value.kind = LinkedExpressionKind::Field(0)
        }
        LinkedExpressionKind::SelfValue => {
            return Err(unsupported(
                owner,
                "Record item conditions must refer to named fields",
            ));
        }
        LinkedExpressionKind::Operation { arguments, .. } => {
            for value in arguments {
                bind_self(value, owner)?;
            }
        }
        _ => (),
    }
    Ok(())
}
