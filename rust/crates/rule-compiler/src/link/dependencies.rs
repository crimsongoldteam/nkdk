use super::*;

pub(super) fn field_dependencies(
    value: &LinkedType,
    presence: &[LinkedPresence],
) -> Result<Vec<Vec<u32>>, Diagnostic> {
    let dependencies = crate::plan::scopes::dependencies(value, presence)?;
    if let LinkedType::Record(fields) = value {
        crate::plan::scopes::schedule(&dependencies, fields)?;
    }
    Ok(dependencies)
}
