//! Prepare a conversion and all its resources before the enclosing operation publishes them.
use crate::resource_files::{Snapshot, load_documents, load_relative_documents, stage};
use nkdk_compiled_rules::{Direction, EntryId, PreparedInputs, RuntimeDiagnostic};
use nkdk_conversion_core::resources::Limits;
use std::path::Path;

pub struct Request<'a> {
    pub entry: EntryId,
    pub direction: Direction,
    pub primary: &'a [u8],
    pub inputs: PreparedInputs,
    pub source_root: &'a Path,
    pub temporary_parent: &'a Path,
    pub limits: Limits,
    pub xml_bytes: usize,
}
#[must_use]
pub struct PreparedConversion {
    pub primary: Vec<u8>,
    pub resources: Snapshot,
    pub diagnostics: Vec<RuntimeDiagnostic>,
    pub validation_documents: Vec<(nkdk_conversion_core::resources::RelativePath, Vec<u8>)>,
}
pub fn prepare(request: Request<'_>) -> Result<PreparedConversion, Vec<RuntimeDiagnostic>> {
    let single = |error| vec![error];
    let Request {
        entry,
        direction,
        primary,
        mut inputs,
        source_root,
        temporary_parent,
        limits,
        xml_bytes,
    } = request;
    let routes = nkdk_compiled_rules::resource_requests(entry, &inputs, limits).map_err(single)?;
    inputs = inputs
        .with_document_limits(limits, xml_bytes)
        .map_err(single)?;
    if matches!(direction, Direction::XmlToYaml) {
        let paths = nkdk_compiled_rules::document_paths(entry).map_err(single)?;
        let documents = load_documents(paths, source_root, limits, xml_bytes).map_err(single)?;
        inputs = inputs.with_documents(documents).map_err(single)?;
    } else {
        let paths =
            nkdk_compiled_rules::yaml_file_requests(entry, &inputs, limits).map_err(single)?;
        let documents =
            load_relative_documents(&paths, source_root, limits, xml_bytes).map_err(single)?;
        inputs = inputs.with_documents(documents).map_err(single)?;
    }
    let mut converted = nkdk_compiled_rules::convert_file(entry, direction, primary, &inputs)?;
    let validation_documents = match direction {
        Direction::XmlToYaml => std::mem::take(&mut converted.documents),
        Direction::YamlToXml => inputs.into_documents(),
    };
    let resources = stage(&routes, direction, source_root, temporary_parent)
        .and_then(|snapshot| match direction {
            Direction::XmlToYaml => snapshot.with_document_refs(&validation_documents),
            Direction::YamlToXml => snapshot.with_documents(converted.documents),
        })
        .map_err(single)?;
    let mut diagnostics = converted.diagnostics;
    diagnostics.extend_from_slice(resources.diagnostics());
    Ok(PreparedConversion {
        primary: converted.bytes,
        resources,
        diagnostics,
        validation_documents,
    })
}
