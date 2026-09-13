use super::*;

/// The XML spelling is the semantic text. Only declared pairs change in YAML.
pub(super) fn read(table: &[EnumLexeme], text: &str, xml: bool) -> String {
    let cases = if xml {
        table.iter().filter(|item| !table.iter().any(|other| other.value == item.text))
            .map(|item| format!("{:?}=>return Err(RuntimeDiagnostic::new(\"value.text-table-collision\",\"Unmapped XML text collides with a translated spelling\")),", item.text))
            .collect::<String>()
    } else {
        table
            .iter()
            .map(|item| format!("{:?}=>{:?},", item.text, item.value))
            .collect()
    };
    if cases.is_empty() {
        text.into()
    } else {
        format!("match {text} {{{cases} value=>value}}")
    }
}

pub(super) fn write(table: &[EnumLexeme], reference: &str, xml: bool) -> String {
    let text = format!(
        "({}).as_str()",
        reference.strip_prefix('&').unwrap_or(reference)
    );
    if xml {
        return text;
    }
    let cases = table
        .iter()
        .map(|item| format!("{:?}=>{:?},", item.value, item.text))
        .collect::<String>();
    format!("match {text} {{{cases} value=>value}}")
}
