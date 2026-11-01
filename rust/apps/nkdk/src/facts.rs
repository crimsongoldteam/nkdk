//! Project operation composition uses the same preparation as migration checks.
pub use nkdk_compiled_rules::FactCatalog;
pub use nkdk_conversion_core::facts::preparation::{
    LoadedSource, MaterialSourceHeader, PreparedFacts, Source, SourceHeader, SourceKind,
    prepare_streaming_materials,
};
use nkdk_conversion_core::{
    EntryId, RuntimeDiagnostic,
    facts::{Generation, prepared::FactBudget},
};

pub fn prepare<'a>(
    sources: Vec<Source<'a>>,
    consumers: &[EntryId],
    generation: Generation,
    budget: FactBudget,
    edge_budget: usize,
) -> Result<PreparedFacts<'a>, Vec<RuntimeDiagnostic>> {
    nkdk_conversion_core::facts::preparation::prepare::<nkdk_compiled_rules::FactCatalog>(
        sources,
        consumers,
        generation,
        budget,
        edge_budget,
    )
}

pub fn prepare_streaming(
    sources: Vec<SourceHeader>,
    consumers: &[EntryId],
    generation: Generation,
    budget: FactBudget,
    edge_budget: usize,
    load: impl FnMut(usize) -> Result<Vec<u8>, Vec<RuntimeDiagnostic>>,
) -> Result<nkdk_conversion_core::facts::preparation::PreparedHeaders, Vec<RuntimeDiagnostic>> {
    nkdk_conversion_core::facts::preparation::prepare_streaming::<nkdk_compiled_rules::FactCatalog>(
        sources,
        consumers,
        generation,
        budget,
        edge_budget,
        load,
    )
}

/// Load declared XML documents for one fact source, using the same resource guards as conversion.
pub fn load_source(
    entry: EntryId,
    direction: nkdk_conversion_core::Direction,
    bytes: Vec<u8>,
    source_root: &std::path::Path,
    limits: nkdk_conversion_core::resources::Limits,
    max_bytes: usize,
) -> Result<LoadedSource, Vec<RuntimeDiagnostic>> {
    let documents = if matches!(direction, nkdk_conversion_core::Direction::XmlToYaml) {
        let paths = nkdk_compiled_rules::document_paths(entry).map_err(|error| vec![error])?;
        if paths.is_empty() {
            vec![]
        } else {
            crate::resource_files::load_documents(paths, source_root, limits, max_bytes)
                .map_err(|error| vec![error])?
        }
    } else {
        vec![]
    };
    Ok(LoadedSource { bytes, documents })
}
