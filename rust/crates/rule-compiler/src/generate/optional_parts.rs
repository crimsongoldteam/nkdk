use super::*;

pub(super) fn compile(
    parts: &[TextPatternPart],
    names: &[LinkedField],
    entry: &LinkedEntry,
) -> Result<String, Diagnostic> {
    parts
        .iter()
        .map(|part| {
            if part.separator.is_some() {
                return Err(unsupported(
                    entry,
                    "Optional text groups use explicit delimiters",
                ));
            }
            let index = |name: &str| {
                names
                    .iter()
                    .position(|field| field.name == name)
                    .expect("linked slot")
            };
            Ok(match &part.value {
                TextPatternValue::Literal(text) => {
                    format!("core::text_pattern::OptionalPart::Literal({text:?})")
                }
                TextPatternValue::Field(name) => {
                    format!("core::text_pattern::OptionalPart::Slot({})", index(name))
                }
                TextPatternValue::Optional { field, parts } => format!(
                    "core::text_pattern::OptionalPart::Optional({},&[{}])",
                    index(field),
                    compile(parts, names, entry)?
                ),
            })
        })
        .collect::<Result<Vec<_>, Diagnostic>>()
        .map(|parts| parts.join(","))
}
