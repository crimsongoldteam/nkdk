use super::*;

pub(super) fn field_dependencies(
    value: &LinkedType,
    presence: &[LinkedPresence],
) -> Result<Vec<Vec<u32>>, Diagnostic> {
    let dependencies = crate::plan::scopes::dependencies(value, presence)?;
    for side in [RepresentationSide::Xml, RepresentationSide::Yaml] {
        crate::plan::scopes::read_schedule(value, presence, side)?;
    }
    Ok(dependencies)
}
