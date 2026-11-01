mod asset_session;
mod attributes;
mod canonical;
mod choice_defaults;
mod choice_items;
mod choice_value;
mod collection_constraints;
mod collection_presence;
mod collection_values;
mod collections;
pub(crate) mod composite;
mod composite_scalars;
mod constraints;
mod data_path;
mod declared_construction;
mod declared_items;
mod dispatch;
mod expressions;
mod external_text;
mod fact_inputs;
mod fact_keys;
mod facts;
mod grouped;
mod inputs;
mod native_shorthand;
pub(crate) mod nested_record;
mod optional_parts;
mod owner;
mod paths;
mod patterns;
mod presence;
mod proof;
mod qname;
mod record;
mod record_bodies;
mod record_construction;
mod record_reference;
mod resources;
mod row_expression;
pub(crate) mod scalar;
mod scalar_choice;
mod scalar_construction;
pub(crate) mod scalar_presence;
mod scoped_inputs;
mod sequence_yaml;
pub(crate) mod shared_capture;
pub(crate) mod shared_emit;
pub(crate) mod shared_graph;
pub(crate) mod shared_layout;
mod shared_references;
pub(crate) mod shared_units;
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
mod visibility;
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
    pub sizes: Vec<GenerationSize>,
    pub definition_count: usize,
    pub connection_count: usize,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct GenerationSize {
    pub entry: String,
    pub source: String,
    pub mechanism: &'static str,
    pub bytes: usize,
}

pub fn generate(program: &nkdk_rule_model::Program) -> Result<GeneratedSources, Vec<Diagnostic>> {
    from_plan(&crate::plan::build(program)?)
}

pub fn generate_selected(
    program: &nkdk_rule_model::Program,
    exports: &BTreeSet<String>,
) -> Result<GeneratedSources, Vec<Diagnostic>> {
    from_plan_with_exports(&crate::plan::build(program)?, Some(exports), false)
}

/// Generate selected conversions with the fact layout of the whole linked catalog.
/// All partitions must receive the same source catalog and export disjoint entries.
pub(crate) fn generate_partition(
    program: &nkdk_rule_model::Program,
    exports: &BTreeSet<String>,
) -> Result<GeneratedSources, Vec<Diagnostic>> {
    from_plan_with_exports(&crate::plan::build(program)?, Some(exports), true)
}

pub(crate) fn from_plan(program: &Program<'_>) -> Result<GeneratedSources, Vec<Diagnostic>> {
    from_plan_with_exports(program, None, false)
}

pub(crate) fn from_plan_shared(
    program: &Program<'_>,
    exports: &BTreeSet<String>,
) -> Result<(GeneratedSources, shared_units::UnitGraph), Vec<Diagnostic>> {
    let capture = asset_session::Session::enter(&shared_capture::CURRENT);
    let generated = from_plan_with_exports(program, Some(exports), true)?;
    let source = std::str::from_utf8(
        &generated
            .files
            .iter()
            .find(|file| file.path == "generated.rs")
            .unwrap()
            .contents,
    )
    .unwrap();
    let files = generated
        .files
        .iter()
        .filter(|file| file.path == "source_map.rs")
        .map(|file| (file.path.clone(), file.contents.clone()))
        .collect();
    let graph = shared_capture::finish(capture, source, files).map_err(|message| {
        vec![Diagnostic {
            code: "shared_unit_graph".into(),
            file: String::new(),
            line: 0,
            column: 0,
            message,
            related: vec![],
        }]
    })?;
    Ok((generated, graph))
}

fn from_plan_with_exports(
    program: &Program<'_>,
    exports: Option<&BTreeSet<String>>,
    shared_facts: bool,
) -> Result<GeneratedSources, Vec<Diagnostic>> {
    let automaton_assets = crate::automata::Assets::enter();
    let path_assets = asset_session::Session::enter(&paths::CURRENT);
    let record_assets = asset_session::Session::enter(&record_bodies::CURRENT);
    let mut sizes = Vec::new();
    let mut source = String::from(
        "pub use nkdk_conversion_core::{Direction, EntryId, PreparedInputs, InputValue, FileResult, RuntimeDiagnostic, Severity};\nuse nkdk_conversion_core as core;\nuse core::inputs::InputView;\n",
    );
    let entries: Vec<_> = program
        .entries
        .iter()
        .filter(|entry| matches!(entry.kind, ModuleKind::Object | ModuleKind::Resources))
        .filter(|entry| exports.is_none_or(|exports| exports.contains(&entry.name)))
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
    let fact_entries: Vec<_> = if shared_facts {
        program
            .entries
            .iter()
            .filter(|entry| matches!(entry.kind, ModuleKind::Object | ModuleKind::Resources))
            .collect()
    } else {
        entries.clone()
    };
    let recursive = recursive_records(program, &entries);
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
        let before = source.len();
        writeln!(
            source,
            "#[allow(dead_code)] pub(crate) mod recursive_value_{}{{{}}}",
            entry.id, reusable
        )
        .unwrap();
        shared_capture::unit(|| shared_units::GeneratedUnit {
            id: shared_units::UnitId(format!("recursive_value_{}", entry.id)),
            namespace: vec![],
            definitions: [shared_units::SymbolId(format!(
                "recursive_value_{}",
                entry.id
            ))]
            .into(),
            references: BTreeSet::new(),
            source: source[before..].to_owned(),
            source_kinds: [format!("{:?}", entry.kind)].into(),
            files: vec![],
        });
        shared_capture::exclude(before, source.len());
        sizes.push(GenerationSize {
            entry: entry.name.clone(),
            source: entry.source.file.clone(),
            mechanism: "recursive-record",
            bytes: source.len() - before,
        });
    }
    for entry in &entries {
        if entry.kind == ModuleKind::Resources {
            resources::validate_entry(entry).map_err(|error| vec![error])?;
            continue;
        }
        let (code, mechanism, parts) = if owner::applies(entry, program) {
            let owner = owner::generate_profiled(entry, program).map_err(|error| vec![error])?;
            (owner.source, "owner", owner.parts)
        } else {
            let (code, mechanism) =
                record::generate_profiled(entry, program).map_err(|error| vec![error])?;
            (code, mechanism, Vec::new())
        };
        let checks = constraints::generate(entry, program).map_err(|error| vec![error])?;
        let part_bytes: usize = parts.iter().map(|(_, _, bytes)| bytes).sum();
        for (variant, mechanism, bytes) in parts {
            sizes.push(GenerationSize {
                entry: if variant.is_empty() {
                    entry.name.clone()
                } else {
                    format!("{}#{variant}", entry.name)
                },
                source: entry.source.file.clone(),
                mechanism,
                bytes,
            });
        }
        sizes.push(GenerationSize {
            entry: entry.name.clone(),
            source: entry.source.file.clone(),
            mechanism,
            bytes: code.len() + checks.len() - part_bytes,
        });
        source.push_str(&code);
        source.push_str(&checks);
    }
    for (mechanism, code) in [
        (
            "inputs",
            inputs::generate(&fact_entries, program).map_err(|error| vec![error])?,
        ),
        ("dispatch", dispatch::generate(&entries, program)),
        ("data-path", data_path::generate(program)),
        (
            "facts",
            facts::generate(&entries, &fact_entries, program).map_err(|error| vec![error])?,
        ),
        (
            "resources",
            resources::generate(&fact_entries, program).map_err(|error| vec![error])?,
        ),
    ] {
        if mechanism == "facts" {
            facts::capture_support(&code, source.len());
        }
        sizes.push(GenerationSize {
            entry: "<shared>".into(),
            source: String::new(),
            mechanism,
            bytes: code.len(),
        });
        source.push_str(&code);
    }
    let (record_source, record_sizes) = record_bodies::finish(record_assets);
    let record_bytes: usize = record_sizes.iter().map(|(_, bytes)| *bytes).sum();
    sizes.extend(record_sizes.into_iter().map(|(entry, bytes)| {
        let declaration = entry
            .rsplit(":item_")
            .next()
            .and_then(|id| id.parse::<u32>().ok())
            .and_then(|id| program.entries.iter().find(|row| row.id == id));
        GenerationSize {
            entry: declaration.map_or(entry.clone(), |row| format!("{}:{entry}", row.name)),
            source: declaration.map_or_else(String::new, |row| row.source.file.clone()),
            mechanism: "record-body",
            bytes,
        }
    }));
    sizes.push(GenerationSize {
        entry: "<shared>".into(),
        source: String::new(),
        mechanism: "record-body-store",
        bytes: record_source.len() - record_bytes,
    });
    shared_capture::exclude(source.len(), source.len() + record_source.len());
    source.push_str(&record_source);
    let (automata_source, automata_files) = automaton_assets.finish();
    sizes.push(GenerationSize {
        entry: "<shared>".into(),
        source: String::new(),
        mechanism: "automata",
        bytes: automata_source.len()
            + automata_files
                .iter()
                .map(|file| file.contents.len())
                .sum::<usize>(),
    });
    shared_capture::exclude(source.len(), source.len() + automata_source.len());
    source.push_str(&automata_source);
    let path_source = paths::finish(path_assets);
    sizes.push(GenerationSize {
        entry: "<shared>".into(),
        source: String::new(),
        mechanism: "xml-paths",
        bytes: path_source.len(),
    });
    shared_capture::exclude(source.len(), source.len() + path_source.len());
    source.push_str(&path_source);
    let map = source_map::generate(program);
    sizes.push(GenerationSize {
        entry: "<shared>".into(),
        source: String::new(),
        mechanism: "source-map",
        bytes: map.len(),
    });
    source.push_str("include!(\"source_map.rs\");\n");
    let mut files = vec![
        GeneratedFile {
            path: "generated.rs".into(),
            contents: source.into_bytes(),
        },
        GeneratedFile {
            path: "source_map.rs".into(),
            contents: map.into_bytes(),
        },
    ];
    files.extend(automata_files);
    let total_bytes: usize = files.iter().map(|file| file.contents.len()).sum();
    let measured_bytes: usize = sizes.iter().map(|size| size.bytes).sum();
    sizes.push(GenerationSize {
        entry: "<shared>".into(),
        source: String::new(),
        mechanism: "boilerplate",
        bytes: total_bytes - measured_bytes,
    });
    Ok(GeneratedSources {
        files,
        sizes,
        definition_count: program.definitions().counts().0,
        connection_count: program.definitions().counts().1,
        dependencies: program
            .entries
            .iter()
            .map(|entry| entry.source.file.clone())
            .collect::<BTreeSet<_>>()
            .into_iter()
            .collect(),
    })
}

fn recursive_records<'a>(
    program: &'a Program<'a>,
    exported: &[&LinkedEntry],
) -> Vec<&'a LinkedEntry> {
    let graph = crate::linked_graph::ReferenceGraph::new(&program.entries);
    let reachable = graph.reachable(exported.iter().map(|entry| entry.id));
    program
        .entries
        .iter()
        .filter(|entry| {
            reachable.contains(&entry.id)
                && matches!(entry.value, LinkedType::Record(_))
                && graph.recursive(entry.id)
        })
        .collect()
}
use crate::plan::unsupported;

fn plain(entry: &LinkedEntry) -> Result<(), Diagnostic> {
    plain_shape(entry)?;
    if !entry.inputs.is_empty()
        && !matches!(entry.yaml, YamlRepresentation::InputTextTable(_))
        && !matches!(
            (&entry.xml, &entry.yaml),
            (
                LinkedXml::TextPattern(_),
                YamlRepresentation::TextPattern(_)
            )
        )
    {
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
                "Generation of parameters, presence, shorthands or normalization is not supported by the scalar stage for {} (parameters={}, presence={}, shorthands={}, normalization={})",
                entry.name,
                entry.parameters.len(),
                entry.presence.len(),
                entry.shorthands.len(),
                entry.normalization.is_some()
            ),
        ));
    }
    Ok(())
}

#[cfg(test)]
mod shared_unit_tests {
    use super::*;
    #[test]
    fn captured_units_preserve_legacy_source_and_resolve_recursive_dependencies() {
        let modules = [
            (
                "node.yaml",
                include_bytes!("../tests/fixtures/recursive-node.yaml").as_slice(),
            ),
            (
                "nodes.yaml",
                include_bytes!("../tests/fixtures/recursive-nodes.yaml").as_slice(),
            ),
            (
                "owner.yaml",
                include_bytes!("../tests/fixtures/recursive-owner.yaml").as_slice(),
            ),
        ]
        .into_iter()
        .flat_map(|(path, bytes)| crate::parse_many(crate::SourceFile { path, bytes }).unwrap())
        .collect::<Vec<_>>();
        let linked = crate::link(&modules).unwrap();
        let plan = crate::plan::build(&linked).unwrap();
        let exports = ["applied.tree".to_owned()].into();
        let old = from_plan_with_exports(&plan, Some(&exports), true).unwrap();
        let (generated, graph) = from_plan_shared(&plan, &exports).unwrap();
        assert_eq!(
            old,
            from_plan_with_exports(&plan, Some(&exports), true).unwrap()
        );
        assert!(!generated.files.is_empty());
        assert!(graph.units.len() > 3);
        let groups =
            shared_graph::components(&graph, &[shared_units::SymbolId("facade".into())]).unwrap();
        let reachable: BTreeSet<_> = groups
            .iter()
            .flat_map(|group| group.members.iter().cloned())
            .collect();
        assert_eq!(reachable.len(), graph.units.len());
        assert!(!reachable.contains(&shared_units::UnitId("automata_store".into())));
        assert!(groups.iter().any(|group| group.members.len() > 1));
    }
}
