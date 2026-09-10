mod attributes;
mod collections;
pub(crate) mod composite;
mod constraints;
mod expressions;
mod inputs;
mod patterns;
mod presence;
mod record;
pub(crate) mod scalar;
pub(crate) mod scalar_presence;
pub(crate) mod shorthand;
mod source_map;
mod text;
use nkdk_rule_model::*;
use std::collections::BTreeSet;

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct GeneratedFile {
    pub path: String,
    pub contents: Vec<u8>,
}
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct GeneratedSources {
    pub files: Vec<GeneratedFile>,
    pub dependencies: Vec<String>,
}

pub fn generate(program: &Program) -> Result<GeneratedSources, Vec<Diagnostic>> {
    let mut source = String::from(
        "pub use nkdk_conversion_core::{Direction, EntryId, PreparedInputs, InputValue, FileResult, RuntimeDiagnostic, Severity};\nuse nkdk_conversion_core as core;\n",
    );
    let entries: Vec<_> = program
        .entries
        .iter()
        .filter(|entry| entry.kind == ModuleKind::Object)
        .collect();
    if entries.is_empty() {
        return Err(vec![Diagnostic {
            code: "no_generated_entry".into(),
            file: String::new(),
            line: 0,
            column: 0,
            message: "No object entry was supplied".into(),
            related: vec![],
        }]);
    }
    for entry in &entries {
        source.push_str(&record::generate(entry, program).map_err(|error| vec![error])?);
        source.push_str(&constraints::generate(entry, program).map_err(|error| vec![error])?);
    }
    source.push_str(&inputs::generate(&entries, program).map_err(|error| vec![error])?);
    source.push_str("pub fn entry_id(name: &str) -> Option<EntryId> { match name {\n");
    for entry in &entries {
        source.push_str(&format!(
            "{:?} => Some(EntryId({})),\n",
            entry.name, entry.id
        ));
    }
    source.push_str("_ => None } }\n");
    source.push_str("pub fn convert_file(entry: EntryId, direction: Direction, source: &[u8], _inputs: &PreparedInputs) -> std::result::Result<FileResult, Vec<RuntimeDiagnostic>> { _inputs.check_entry(entry).map_err(|error| vec![error])?; match (entry.0, direction) {\n");
    for entry in &entries {
        let id = entry.id;
        for (direction, read, write) in [("XmlToYaml", "xml", "yaml"), ("YamlToXml", "yaml", "xml")]
        {
            source.push_str(&format!("({id}, Direction::{direction}) => {{ let value = read_{read}_{id}(source, _inputs).map_err(|error| vec![error])?; let diagnostics = check_{read}_{id}(&value, source, _inputs); if diagnostics.iter().any(|error| error.severity == core::Severity::Error) {{ return Err(diagnostics); }} let bytes = write_{write}_{id}(&value, _inputs).map_err(|error| vec![error])?;"));
            if read == "xml" {
                source.push_str(&format!(
                    "let bytes = finalize_yaml_{id}(source, bytes, &value, _inputs).map_err(|error| vec![error])?;"
                ));
            }
            source.push_str("Ok(FileResult { bytes, diagnostics }) },\n");
        }
    }
    source.push_str("_ => Err(vec![RuntimeDiagnostic::new(\"entry.unknown\", \"Unknown generated entry\")]) } }\n");
    source.push_str("pub fn validate_file(entry: EntryId, source: &[u8], _inputs: &PreparedInputs) -> Vec<RuntimeDiagnostic> { if let Err(error) = _inputs.check_entry(entry) { return vec![error]; } match entry.0 {\n");
    for entry in &entries {
        source.push_str(&format!("{} => match read_yaml_{}(source, _inputs) {{ Ok(value) => check_yaml_{}(&value, source, _inputs), Err(error) => vec![error] }},\n", entry.id, entry.id, entry.id));
    }
    source.push_str(
        "_ => vec![RuntimeDiagnostic::new(\"entry.unknown\", \"Unknown generated entry\")] } }\n",
    );
    source.push_str("pub fn verify_candidate(entry: EntryId, original: &[u8], candidate: &[u8], _inputs: &PreparedInputs) -> std::result::Result<(), Vec<RuntimeDiagnostic>> { _inputs.check_entry(entry).map_err(|error| vec![error])?; let result = match entry.0 {\n");
    for entry in &entries {
        source.push_str(&format!(
            "{} => verify_{}(original, candidate, _inputs),\n",
            entry.id, entry.id
        ));
    }
    source.push_str("_ => Err(RuntimeDiagnostic::new(\"entry.unknown\", \"Unknown generated entry\")) }; result.map_err(|error| vec![error]) }\n");
    let map = source_map::generate(program);
    source.push_str("include!(\"source_map.rs\");\n");
    Ok(GeneratedSources {
        files: vec![
            GeneratedFile {
                path: "generated.rs".into(),
                contents: source.into_bytes(),
            },
            GeneratedFile {
                path: "source_map.rs".into(),
                contents: map.into_bytes(),
            },
        ],
        dependencies: program
            .entries
            .iter()
            .map(|entry| entry.source.file.clone())
            .collect::<BTreeSet<_>>()
            .into_iter()
            .collect(),
    })
}
fn unsupported(entry: &LinkedEntry, message: &str) -> Diagnostic {
    Diagnostic {
        code: "unsupported_generation_feature".into(),
        file: entry.source.file.clone(),
        line: entry.source.line,
        column: entry.source.column,
        message: message.into(),
        related: vec![],
    }
}
fn plain(entry: &LinkedEntry) -> Result<(), Diagnostic> {
    plain_shape(entry)?;
    if !entry.inputs.is_empty() {
        return Err(unsupported(
            entry,
            "Referenced scalar inputs require specialization",
        ));
    }
    Ok(())
}
fn plain_shape(entry: &LinkedEntry) -> Result<(), Diagnostic> {
    if !entry.parameters.is_empty()
        || !entry.presence.is_empty()
        || !entry.shorthands.is_empty()
        || entry.normalization.is_some()
    {
        return Err(unsupported(
            entry,
            "Generation of inputs, constraints, presence or collection behavior is not supported by the scalar stage",
        ));
    }
    Ok(())
}
