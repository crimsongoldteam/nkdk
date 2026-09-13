use super::*;

pub(super) fn parts(
    expression: &LinkedExpression,
    owner: &LinkedEntry,
    mut lower: impl FnMut(&LinkedExpression) -> Result<String, Diagnostic>,
) -> Result<Vec<String>, Diagnostic> {
    if crate::fact_shape::text_cell(&expression.value_type) {
        return Ok(vec![lower(expression)?]);
    }
    let LinkedExpressionKind::Operation {
        operator: LinkedOperator::Record(names),
        arguments,
    } = &expression.kind
    else {
        return Err(unsupported(
            owner,
            "Record index key requires a record constructor",
        ));
    };
    let mut columns: Vec<_> = names.iter().zip(arguments).collect();
    columns.sort_unstable_by(|left, right| left.0.cmp(right.0));
    columns.into_iter().map(|(_, value)| lower(value)).collect()
}
