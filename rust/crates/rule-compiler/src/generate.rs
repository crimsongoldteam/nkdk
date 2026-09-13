mod attributes;
mod collection_presence;
mod collection_values;
mod collections;
pub(crate) mod composite;
mod composite_scalars;
mod constraints;
mod declared_items;
mod dispatch;
mod expressions;
mod fact_inputs;
mod fact_keys;
mod facts;
mod inputs;
pub(crate) mod nested_record;
mod owner;
mod owner_contracts;
mod owner_layout;
mod patterns;
mod presence;
mod proof;
mod qname;
mod record;
mod resources;
mod row_expression;
pub(crate) mod scalar;
mod scalar_choice;
pub(crate) mod scalar_presence;
mod sequence_yaml;
pub(crate) mod shorthand;
mod source_map;
mod text;
mod text_choice;
mod text_item_checks;
mod text_pattern;
mod text_sequence;
mod text_table;
mod xml_tree;
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
        .filter(|entry| matches!(entry.kind, ModuleKind::Object | ModuleKind::Resources))
        .collect();
    if entries.is_empty() {
        return Err(vec![Diagnostic {
            code: "no_generated_entry".into(),
            file: String::new(),
            line: 0,
            column: 0,
            message: "No executable entry was supplied".into(),
            related: vec![],
        }]);
    }
    for entry in &entries {
        if entry.kind == ModuleKind::Resources {
            resources::validate_entry(entry).map_err(|error| vec![error])?;
            continue;
        }
        source.push_str(&record::generate(entry, program).map_err(|error| vec![error])?);
        source.push_str(&constraints::generate(entry, program).map_err(|error| vec![error])?);
    }
    source.push_str(&inputs::generate(&entries, program).map_err(|error| vec![error])?);
    source.push_str(&dispatch::generate(&entries));
    source.push_str(&facts::generate(&entries, program).map_err(|error| vec![error])?);
    source.push_str(&resources::generate(&entries).map_err(|error| vec![error])?);
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
