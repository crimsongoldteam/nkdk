//! Convert every file selected by the declared operation routes in one component.
use crate::{conversion, facts, publication, route};
use nkdk_compiled_rules::{Direction, EntryId, PreparedInputs, RuntimeDiagnostic};
use nkdk_conversion_core::{
    facts::{Generation, prepared::FactBudget, text::TextBudget},
    resources::Limits,
};
use std::{
    fs::{self, OpenOptions},
    io::Write,
    path::{Path, PathBuf},
};

pub struct Request<'a> {
    pub source_root: &'a Path,
    pub target_root: &'a Path,
    pub base_component_root: Option<&'a Path>,
    pub temporary_parent: &'a Path,
    pub context: route::Context<'a>,
    pub direction: Direction,
    pub generation: Generation,
    pub fact_budget: FactBudget,
    pub edge_budget: usize,
    pub limits: Limits,
    pub xml_bytes: usize,
}

pub struct Report {
    pub outputs: Vec<PathBuf>,
    pub diagnostics: Vec<RuntimeDiagnostic>,
}

struct PreparedItem {
    target: PathBuf,
    target_resources: PathBuf,
    primary: PathBuf,
    converted: crate::conversion::PreparedConversion,
    snapshots: Vec<route::OwnedSnapshot>,
}

struct SelectedItem {
    validation: Option<route::Validation>,
    target: PathBuf,
    source: PathBuf,
    source_resources: PathBuf,
    target_resources: PathBuf,
    snapshots: Vec<route::OwnedSnapshot>,
    owner_source_index: Option<usize>,
    owner_entry: EntryId,
    owner_inputs: PreparedInputs,
}

enum FactMaterial {
    File { path: PathBuf, resources: PathBuf },
    Snapshot { item: usize, snapshot: usize },
    External(usize),
}

fn failure(code: &str, message: impl Into<String>) -> Vec<RuntimeDiagnostic> {
    vec![RuntimeDiagnostic::new(code, message)]
}

fn stage_primary(root: &Path, bytes: &[u8]) -> Result<PathBuf, Vec<RuntimeDiagnostic>> {
    for index in 0..usize::MAX {
        let path = root.join(format!(".nkdk-primary-{index}"));
        match OpenOptions::new().write(true).create_new(true).open(&path) {
            Ok(mut file) => {
                file.write_all(bytes)
                    .map_err(|error| failure("project.stage", error.to_string()))?;
                return Ok(path);
            }
            Err(error) if error.kind() == std::io::ErrorKind::AlreadyExists => continue,
            Err(error) => return Err(failure("project.stage", error.to_string())),
        }
    }
    Err(failure("project.stage", "Cannot allocate a staging file"))
}

fn new_identity_seed() -> Result<String, Vec<RuntimeDiagnostic>> {
    let mut bytes = [0_u8; 32];
    getrandom::fill(&mut bytes)
        .map_err(|error| failure("project.identity-seed", error.to_string()))?;
    const HEX: &[u8; 16] = b"0123456789abcdef";
    let mut encoded = String::with_capacity(64);
    for byte in bytes {
        encoded.push(HEX[(byte >> 4) as usize] as char);
        encoded.push(HEX[(byte & 0x0f) as usize] as char);
    }
    Ok(encoded)
}

pub fn convert_component(request: Request<'_>) -> Result<Report, Vec<RuntimeDiagnostic>> {
    convert_component_with_catalog(route::catalog(), request)
}

pub fn convert_component_with_catalog(
    catalog: &route::Catalog,
    request: Request<'_>,
) -> Result<Report, Vec<RuntimeDiagnostic>> {
    if !request.source_root.is_dir() {
        return Err(failure(
            "project.source",
            "Component source directory is missing",
        ));
    }
    if request
        .base_component_root
        .is_some_and(|root| !root.is_dir())
    {
        return Err(failure(
            "project.base",
            "Base component directory is missing",
        ));
    }
    let imported_owners = if matches!(request.direction, Direction::YamlToXml) {
        catalog
            .load_imported_owners(request.source_root, request.context.component)
            .map_err(|error| failure("project.snapshot", error))?
    } else {
        None
    };
    let paths = catalog
        .paths(
            request.source_root,
            request.context.component,
            request.direction,
        )
        .map_err(|error| failure("project.scan", error))?;
    let mut selected = Vec::with_capacity(paths.len());
    let mut headers = Vec::new();
    let mut material_sources = Vec::new();
    let mut consumers = Vec::with_capacity(paths.len());
    let mut identity_seed = None;
    for relative_path in paths {
        let new_owner = imported_owners.as_ref().is_some_and(|owners| {
            relative_path
                .to_str()
                .is_some_and(|path| !owners.contains(path))
        });
        let source_path = request.source_root.join(&relative_path);
        let source =
            fs::read(&source_path).map_err(|error| failure("project.read", error.to_string()))?;
        let mut snapshots = if matches!(request.direction, Direction::XmlToYaml) {
            catalog
                .capture_with_resources(
                    &relative_path,
                    &source,
                    &request.context,
                    Some(&source_path.with_extension("")),
                )
                .map_err(|error| vec![error])?
                .ok_or_else(|| failure("project.route", "Selected file has no declared route"))?
        } else {
            match catalog.load_snapshots(
                request.source_root,
                &relative_path,
                request.context.component,
            ) {
                Ok(snapshots) => snapshots,
                Err(error) => {
                    let sidecar = catalog
                        .sidecar_path(&relative_path, request.context.component)
                        .map_err(|error| failure("project.snapshot", format!("{error:?}")))?
                        .ok_or_else(|| failure("project.snapshot", "No route for owner"))?;
                    if !new_owner || request.source_root.join(sidecar).exists() {
                        return Err(failure("project.snapshot", error));
                    }
                    if identity_seed.is_none() {
                        identity_seed = Some(new_identity_seed()?);
                    }
                    let snapshots = catalog
                        .materialize_sources(
                            &relative_path,
                            &request.context,
                            identity_seed.as_deref().expect("seed created above"),
                            request.base_component_root,
                        )
                        .map_err(|error| vec![error])?;
                    catalog
                        .save_snapshots(
                            request.source_root,
                            &relative_path,
                            request.context.component,
                            &snapshots,
                        )
                        .map_err(|error| failure("project.snapshot", error))?;
                    snapshots
                }
            }
        };
        if matches!(request.direction, Direction::YamlToXml) {
            catalog
                .refresh_resource_facts(
                    &relative_path,
                    &request.context,
                    request.source_root,
                    &mut snapshots,
                )
                .map_err(|error| vec![error])?;
        }
        let borrowed: Vec<_> = snapshots.iter().map(route::OwnedSnapshot::borrow).collect();
        let material = if matches!(request.direction, Direction::XmlToYaml) {
            route::Material::Xml(&source)
        } else {
            route::Material::Yaml {
                owner: &source,
                snapshots: &borrowed,
                new_owner,
            }
        };
        let resolved = catalog
            .resolve_with_snapshots(
                &relative_path,
                request.direction,
                material,
                &request.context,
                &borrowed,
            )
            .map_err(|error| vec![error])?
            .ok_or_else(|| failure("project.route", "Selected file has no declared route"))?;
        let mut sources = resolved.sources;
        let mut owner = sources.pop().expect("route includes an owner");
        let owner_entry = owner.entry;
        let owner_source_index = (resolved.owner_facts
            && matches!(request.direction, Direction::XmlToYaml))
        .then_some(headers.len() + sources.len());
        let owner_inputs = if owner_source_index.is_some() {
            PreparedInputs::default()
        } else {
            std::mem::take(&mut owner.inputs)
        };
        let item_index = selected.len();
        if owner_source_index.is_some() {
            sources.push(owner);
        }
        for (index, source_header) in sources.into_iter().enumerate() {
            let snapshot_index = match resolved.source_materials.get(index) {
                Some(
                    route::SourceMaterial::Snapshot(name)
                    | route::SourceMaterial::AttributeSnapshot(name),
                ) => Some(
                    snapshots
                        .iter()
                        .position(|snapshot| &snapshot.name == name)
                        .ok_or_else(|| {
                            failure("project.snapshot", "Declared fact snapshot is missing")
                        })?,
                ),
                Some(route::SourceMaterial::Primary) | None => None,
            };
            material_sources.push(snapshot_index.map_or_else(
                || FactMaterial::File {
                    path: source_path.clone(),
                    resources: request.source_root.join(&resolved.source_resources),
                },
                |snapshot| FactMaterial::Snapshot {
                    item: item_index,
                    snapshot,
                },
            ));
            let kind = resolved
                .source_materials
                .get(index)
                .map_or(facts::SourceKind::Ordinary, route::SourceMaterial::kind);
            headers.push(facts::MaterialSourceHeader {
                kind,
                source: facts::SourceHeader {
                    entry: source_header.entry,
                    direction: if snapshot_index.is_some() {
                        Direction::YamlToXml
                    } else {
                        source_header.direction
                    },
                    inputs: source_header.inputs,
                },
            });
        }
        consumers.push(owner_entry);
        if let Some(validation) = &resolved.validation {
            consumers.push(validation.entry);
        }
        selected.push(SelectedItem {
            validation: resolved.validation,
            target: resolved.target_path,
            source: source_path,
            source_resources: resolved.source_resources,
            target_resources: resolved.target_resources,
            snapshots,
            owner_source_index,
            owner_entry,
            owner_inputs,
        });
    }

    // New owner snapshots are persisted before external bindings read them.
    // Each external source is still read and compacted independently.
    let mut external = catalog
        .external_sources_with_base(
            request.source_root,
            request.base_component_root,
            &request.context,
            request.direction,
        )
        .map_err(|error| vec![error])?;
    let own_external_count = external.len();
    if let Some(base_root) = request.base_component_root {
        let base_context = route::Context {
            component: "cf",
            ..request.context
        };
        external.extend(
            catalog
                .external_base_sources(base_root, &base_context)
                .map_err(|error| vec![error])?,
        );
    }
    for (index, source) in external.iter_mut().enumerate() {
        headers.push(facts::MaterialSourceHeader {
            kind: facts::SourceKind::Snapshot,
            source: facts::SourceHeader {
                entry: source.entry,
                direction: Direction::YamlToXml,
                inputs: std::mem::take(&mut source.inputs),
            },
        });
        material_sources.push(FactMaterial::External(index));
    }

    let mut prepared_facts = facts::prepare_streaming_materials::<facts::FactCatalog>(
        headers,
        &consumers,
        request.generation,
        FactBudget {
            text: TextBudget {
                entries: request.fact_budget.text.entries,
                bytes: request.fact_budget.text.bytes,
            },
            rows: request.fact_budget.rows,
        },
        request.edge_budget,
        |index, header| match &material_sources[index] {
            FactMaterial::File { path, resources } => {
                let bytes =
                    fs::read(path).map_err(|error| failure("project.read", error.to_string()))?;
                facts::load_source(
                    header.entry,
                    header.direction,
                    bytes,
                    resources,
                    request.limits,
                    request.xml_bytes,
                )
            }
            FactMaterial::Snapshot { item, snapshot } => Ok(facts::LoadedSource {
                bytes: selected[*item].snapshots[*snapshot].bytes.clone(),
                documents: vec![],
            }),
            FactMaterial::External(index) => Ok(facts::LoadedSource {
                bytes: external[*index].bytes.clone(),
                documents: vec![],
            }),
        },
    )?;
    let mut prepared = Vec::with_capacity(selected.len());
    for item in selected {
        let source =
            fs::read(&item.source).map_err(|error| failure("project.read", error.to_string()))?;
        let source_resources = request.source_root.join(&item.source_resources);
        let inputs = if let Some(index) = item.owner_source_index {
            std::mem::take(&mut prepared_facts.sources[index].inputs)
        } else {
            let indexes = nkdk_compiled_rules::prepare_fact_inputs(
                item.owner_entry,
                prepared_facts.facts.clone(),
                request.generation,
                vec![],
            )
            .map_err(|error| vec![error])?;
            item.owner_inputs
                .with_indexes(indexes)
                .map_err(|error| vec![error])?
        };
        let mut converted = conversion::prepare(conversion::Request {
            entry: item.owner_entry,
            direction: request.direction,
            primary: &source,
            inputs,
            source_root: &source_resources,
            temporary_parent: request.temporary_parent,
            limits: request.limits,
            xml_bytes: request.xml_bytes,
        })?;
        if let Some(validation) = item.validation {
            let indexes = nkdk_compiled_rules::prepare_fact_inputs(
                validation.entry,
                prepared_facts.facts.clone(),
                request.generation,
                vec![],
            )
            .map_err(|error| vec![error])?;
            let mut inputs = validation
                .inputs
                .with_indexes(indexes)
                .map_err(|error| vec![error])?;
            let (yaml, file) = match request.direction {
                Direction::XmlToYaml => (converted.primary.as_slice(), &item.target),
                Direction::YamlToXml => (source.as_slice(), &item.source),
            };
            inputs = inputs
                .with_document_limits(request.limits, request.xml_bytes)
                .map_err(|error| vec![error])?;
            // Transfer the operation's documents without rereading files or
            // cloning their contents and prepared metadata context.
            inputs = inputs
                .with_documents(std::mem::take(&mut converted.validation_documents))
                .map_err(|error| vec![error])?;
            let mut issues = nkdk_compiled_rules::validate_file(validation.entry, yaml, &inputs);
            for issue in &mut issues {
                if issue.file.is_empty() {
                    issue.file = file.to_string_lossy().into_owned().into_boxed_str();
                }
            }
            converted.diagnostics.extend(issues);
        }
        let primary = stage_primary(converted.resources.root(), &converted.primary)?;
        converted.primary = Vec::new();
        prepared.push(PreparedItem {
            target: item.target,
            target_resources: item.target_resources,
            primary,
            converted,
            snapshots: if matches!(request.direction, Direction::XmlToYaml) {
                item.snapshots
            } else {
                Vec::new()
            },
        });
    }

    let mut report = Report {
        outputs: Vec::with_capacity(prepared.len()),
        diagnostics: Vec::new(),
    };
    for item in prepared {
        let output = request.target_root.join(&item.target);
        let resource_directory = request.target_root.join(&item.target_resources);
        fs::create_dir_all(output.parent().expect("declared target directory"))
            .map_err(|error| failure("project.publish", error.to_string()))?;
        if matches!(request.direction, Direction::XmlToYaml) {
            catalog
                .save_snapshots(
                    request.target_root,
                    &item.target,
                    request.context.component,
                    &item.snapshots,
                )
                .map_err(|error| failure("project.publish", error))?;
        }
        publication::publish_file(&output, &item.primary)
            .map_err(|error| failure("project.publish", error))?;
        for file in item.converted.resources.files() {
            let target =
                resource_directory.join(file.target().segments().iter().collect::<PathBuf>());
            fs::create_dir_all(target.parent().expect("resource target directory"))
                .map_err(|error| failure("project.publish", error.to_string()))?;
            publication::publish_file(&target, file.path())
                .map_err(|error| failure("project.publish", error))?;
        }
        report.diagnostics.extend(item.converted.diagnostics);
        report.outputs.push(item.target);
    }
    if matches!(request.direction, Direction::XmlToYaml) {
        catalog
            .save_external_sources(
                request.target_root,
                &request.context,
                &external[..own_external_count],
            )
            .map_err(|error| failure("project.publish", error))?;
        catalog
            .save_imported_owners(
                request.target_root,
                request.context.component,
                &report.outputs,
            )
            .map_err(|error| failure("project.publish", error))?;
    }
    Ok(report)
}
