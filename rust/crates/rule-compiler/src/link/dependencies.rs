use super::*;

pub(super) fn field_dependencies(
    value: &LinkedType,
    presence: &[LinkedPresence],
) -> Result<Vec<Vec<u32>>, Diagnostic> {
    crate::plan::scopes::dependencies(value, presence)
}
