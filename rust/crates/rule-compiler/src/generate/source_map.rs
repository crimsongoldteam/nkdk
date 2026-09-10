use super::*;
use std::fmt::Write;
fn location(source: &SourceLocation) -> String {
    format!(
        "DeclarationLocation {{ file: {:?}, line: {}, column: {} }}",
        source.file, source.line, source.column
    )
}
pub(super) fn generate(program: &Program) -> String {
    let mut out =
        String::from("pub const DECLARATION_SOURCES: &[(u32, &str, usize, usize)] = &[\n");
    for entry in &program.entries {
        writeln!(
            out,
            "({}, {:?}, {}, {}),",
            entry.id, entry.source.file, entry.source.line, entry.source.column
        )
        .unwrap();
    }
    out.push_str("];\npub struct DeclarationLocation { pub file: &'static str, pub line: usize, pub column: usize }\npub struct DeclarationField { pub entry: u32, pub name: &'static str, pub value: DeclarationLocation, pub xml: DeclarationLocation, pub yaml: DeclarationLocation }\npub const DECLARATION_FIELDS: &[DeclarationField] = &[\n");
    for entry in &program.entries {
        if let (
            LinkedType::Record(fields),
            LinkedXml::Record(xml),
            YamlRepresentation::Mapping(yaml),
        ) = (&entry.value, &entry.xml, &entry.yaml)
        {
            for field in fields {
                let (Some(xml), Some(yaml)) = (
                    xml.iter().find(|item| item.field == field.name),
                    yaml.iter().find(|item| item.field == field.name),
                ) else {
                    continue;
                };
                writeln!(
                    out,
                    "DeclarationField {{ entry: {}, name: {:?}, value: {}, xml: {}, yaml: {} }},",
                    entry.id,
                    field.name,
                    location(&field.source),
                    location(&xml.source),
                    location(&yaml.source)
                )
                .unwrap();
            }
        }
    }
    out.push_str("];\n");
    out
}
