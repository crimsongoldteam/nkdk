mod attributes;
mod canonical;
mod choice_value;
mod collection_presence;
mod collection_values;
mod collections;
pub(crate) mod composite;
mod composite_scalars;
mod constraints;
mod declared_construction;
mod declared_items;
mod dispatch;
mod expressions;
mod fact_inputs;
mod fact_keys;
mod facts;
mod inputs;
pub(crate) mod nested_record;
mod owner;
mod patterns;
mod presence;
mod proof;
mod qname;
mod record;
mod record_reference;
mod resources;
mod row_expression;
pub(crate) mod scalar;
mod scalar_choice;
pub(crate) mod scalar_presence;
mod sequence_yaml;
pub(crate) mod shorthand;
mod source_map;
mod states;
mod text;
mod text_choice;
mod text_item_checks;
mod text_pattern;
mod text_sequence;
mod text_table;
mod value;
mod value_adapters;
mod value_record;
mod xml_tree;
use crate::plan::{ConversionPlan as Program, ValueId};
use nkdk_rule_model::*;
use std::{collections::BTreeMap, collections::BTreeSet, fmt::Write};

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

pub fn generate(program: &nkdk_rule_model::Program) -> Result<GeneratedSources, Vec<Diagnostic>> {
    from_plan(&crate::plan::build(program)?)
}

pub(crate) fn from_plan(program: &Program<'_>) -> Result<GeneratedSources, Vec<Diagnostic>> {
    let mut source = String::from(
        "pub use nkdk_conversion_core::{Direction, EntryId, PreparedInputs, InputValue, FileResult, RuntimeDiagnostic, Severity};\nuse nkdk_conversion_core as core;\nuse core::inputs::InputView;\n",
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
    let recursive = recursive_records(program);
    let _recursive_targets = value_record::RecursiveTargets::enter(
        recursive
            .iter()
            .map(|entry| (entry.name.clone(), entry.id))
            .collect::<BTreeMap<_, _>>(),
    );
    for entry in recursive {
        let root = value_record::recursive_root(entry.id);
        let path = vec![ExpandedName {
            namespace: String::new(),
            local: root,
        }];
        let mut placed = entry.clone();
        crate::link::scalar_parameters::bind_defaults(&mut placed).map_err(|error| vec![error])?;
        crate::plan::routes::place_record(&mut placed, &path).map_err(|error| vec![error])?;
        let body =
            value_record::generate(&placed, program, &path, None).map_err(|error| vec![error])?;
        let reusable = body
            .source
            .replacen(
                "#[allow(dead_code)] mod item_",
                "#[allow(dead_code)] pub(crate) mod item_",
                1,
            )
            .replace("pub(super)", "pub(crate)");
        writeln!(
            source,
            "#[allow(dead_code)] pub(crate) mod recursive_value_{}{{use super::*;{}}}",
            entry.id, reusable
        )
        .unwrap();
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

fn recursive_records<'a>(program: &'a Program<'a>) -> Vec<&'a LinkedEntry> {
    fn references(value: &LinkedType, out: &mut Vec<u32>) {
        match value {
            LinkedType::Reference(id) | LinkedType::BoundReference { entry: id, .. } => {
                out.push(*id)
            }
            LinkedType::Index { key, value } => {
                references(key, out);
                references(value, out);
            }
            LinkedType::Optional(value) | LinkedType::Sequence(value) => references(value, out),
            LinkedType::Choice(fields) | LinkedType::Record(fields) => {
                for field in fields {
                    references(&field.value, out);
                }
            }
            _ => {}
        }
    }
    fn reaches(
        program: &Program<'_>,
        current: u32,
        target: u32,
        visited: &mut BTreeSet<u32>,
    ) -> bool {
        if !visited.insert(current) {
            return false;
        }
        let entry = program.value(ValueId(current)).expect("linked value").entry;
        let mut next = Vec::new();
        references(&entry.value, &mut next);
        next.into_iter()
            .any(|id| id == target || reaches(program, id, target, visited))
    }
    program
        .entries
        .iter()
        .filter(|entry| {
            matches!(entry.value, LinkedType::Record(_))
                && reaches(program, entry.id, entry.id, &mut BTreeSet::new())
        })
        .collect()
}
use crate::plan::unsupported;

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
            &format!(
                "Generation of parameters, presence, shorthands or normalization is not supported by the scalar stage (parameters={}, presence={}, shorthands={}, normalization={})",
                entry.parameters.len(),
                entry.presence.len(),
                entry.shorthands.len(),
                entry.normalization.is_some()
            ),
        ));
    }
    Ok(())
}
