use super::*;

pub(super) fn resolve(
    module: &Module,
    mut resolve_entry: impl FnMut(&str) -> Result<LinkedEntry, Diagnostic>,
) -> Result<YamlRepresentation, Diagnostic> {
    let YamlRepresentation::TextTable(TextTable::Import { name, source }) =
        &module.representations.yaml
    else {
        return Ok(module.representations.yaml.clone());
    };
    let import = module
        .imports
        .iter()
        .find(|import| import.name == *name)
        .ok_or_else(|| {
            diagnostic(
                "missing_import_alias",
                source,
                "Text table import is not declared",
            )
        })?;
    let target = resolve_entry(&import.value)?;
    let (LinkedType::Enum(_), LinkedXml::EnumTable(xml), YamlRepresentation::EnumTable(yaml)) =
        (&target.value, &target.xml, &target.yaml)
    else {
        return Err(diagnostic(
            "text_table_source",
            source,
            "Text table requires a plain enum vocabulary",
        ));
    };
    if target.kind != ModuleKind::Value
        || !target.inputs.is_empty()
        || !target.parameters.is_empty()
        || !target.constraints.is_empty()
        || !target.presence.is_empty()
        || xml.iter().any(|item| !item.accepted.is_empty())
    {
        return Err(diagnostic(
            "text_table_source",
            source,
            "Text table requires unconditional canonical spellings",
        ));
    }
    let values = xml
        .iter()
        .map(|item| {
            let spelling = yaml
                .iter()
                .find(|value| value.value == item.value)
                .expect("complete linked vocabulary");
            EnumLexeme {
                value: item.text.clone(),
                text: spelling.text.clone(),
                accepted: vec![],
                source: item.source.clone(),
            }
        })
        .collect();
    Ok(YamlRepresentation::TextTable(TextTable::Resolved(values)))
}
