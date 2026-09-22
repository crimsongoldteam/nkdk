//! Convert every file selected by the declared operation routes in one component.
use crate::{operation, publication, route};
use nkdk_compiled_rules::{Direction, RuntimeDiagnostic};
use nkdk_conversion_core::{
    facts::{Generation, prepared::FactBudget, text::TextBudget},
    resources::Limits,
};
use std::{
    fs,
    path::{Path, PathBuf},
};

pub struct Request<'a> {
    pub source_root: &'a Path,
    pub target_root: &'a Path,
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
    converted: crate::conversion::PreparedConversion,
    snapshots: Vec<route::OwnedSnapshot>,
}

fn failure(code: &str, message: impl Into<String>) -> Vec<RuntimeDiagnostic> {
    vec![RuntimeDiagnostic::new(code, message)]
}

pub fn convert_component(request: Request<'_>) -> Result<Report, Vec<RuntimeDiagnostic>> {
    if !request.source_root.is_dir() {
        return Err(failure(
            "project.source",
            "Component source directory is missing",
        ));
    }
    let catalog = route::catalog();
    let paths = catalog
        .paths(
            request.source_root,
            request.context.component,
            request.direction,
        )
        .map_err(|error| failure("project.scan", error))?;
    let mut prepared = Vec::with_capacity(paths.len());
    for relative_path in paths {
        let source = fs::read(request.source_root.join(&relative_path))
            .map_err(|error| failure("project.read", error.to_string()))?;
        let snapshots = if matches!(request.direction, Direction::XmlToYaml) {
            catalog
                .capture(&relative_path, &source, &request.context)
                .map_err(|error| vec![error])?
                .ok_or_else(|| failure("project.route", "Selected file has no declared route"))?
        } else {
            catalog
                .load_snapshots(
                    request.source_root,
                    &relative_path,
                    request.context.component,
                )
                .map_err(|error| failure("project.snapshot", error))?
        };
        let borrowed: Vec<_> = snapshots.iter().map(route::OwnedSnapshot::borrow).collect();
        let material = if matches!(request.direction, Direction::XmlToYaml) {
            route::Material::Xml(&source)
        } else {
            route::Material::Yaml {
                owner: &source,
                snapshots: &borrowed,
            }
        };
        let resolved = catalog
            .resolve(
                &relative_path,
                request.direction,
                material,
                &request.context,
            )
            .map_err(|error| vec![error])?
            .ok_or_else(|| failure("project.route", "Selected file has no declared route"))?;
        let output = operation::prepare(operation::Request {
            sources: resolved.sources,
            conversions: vec![operation::Conversion {
                consumer_source_index: resolved.owner_source_index,
                direction: request.direction,
                primary: &source,
            }],
            generation: request.generation,
            fact_budget: FactBudget {
                text: TextBudget {
                    entries: request.fact_budget.text.entries,
                    bytes: request.fact_budget.text.bytes,
                },
                rows: request.fact_budget.rows,
            },
            edge_budget: request.edge_budget,
            source_root: request.source_root,
            temporary_parent: request.temporary_parent,
            limits: request.limits,
            xml_bytes: request.xml_bytes,
        })?
        .into_iter()
        .next()
        .expect("one selected conversion");
        prepared.push(PreparedItem {
            target: resolved.target_path,
            converted: output,
            snapshots: if matches!(request.direction, Direction::XmlToYaml) {
                snapshots
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
        publication::publish(&output, &item.converted.primary)
            .map_err(|error| failure("project.publish", error))?;
        for file in item.converted.resources.files() {
            let target = request
                .target_root
                .join(file.target().segments().iter().collect::<PathBuf>());
            fs::create_dir_all(target.parent().expect("resource target directory"))
                .map_err(|error| failure("project.publish", error.to_string()))?;
            publication::publish_file(&target, file.path())
                .map_err(|error| failure("project.publish", error))?;
        }
        report.diagnostics.extend(item.converted.diagnostics);
        report.outputs.push(item.target);
    }
    Ok(report)
}
