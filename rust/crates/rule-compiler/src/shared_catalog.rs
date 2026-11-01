//! Bounded packages of statically compiled value bodies.
use crate::{Diagnostic, GeneratedSources, Module, SourceFile};

pub struct SharedCatalogOptions {
    pub max_rust_bytes: usize,
}
#[derive(Debug)]
pub struct GeneratedPackage {
    pub name: String,
    pub generated: GeneratedSources,
    pub package_dependencies: Vec<String>,
    pub rust_bytes: usize,
}
#[derive(Debug)]
pub struct GeneratedSharedCatalog {
    pub packages: Vec<GeneratedPackage>,
    pub facade: GeneratedSources,
    pub catalog_signature: String,
    pub layout_manifest: Vec<u8>,
}
pub fn compile_shared_catalog(
    sources: &[SourceFile<'_>],
    export: impl Fn(&Module) -> bool,
    options: SharedCatalogOptions,
) -> Result<GeneratedSharedCatalog, Vec<Diagnostic>> {
    let modules = crate::parse_sources(sources)?;
    let exports = modules
        .iter()
        .filter(|module| export(module))
        .map(|module| module.id.clone())
        .collect();
    let mut linked = crate::link(&modules)?;
    crate::shared_identity::stabilize(&mut linked).map_err(|message| {
        vec![Diagnostic {
            code: "shared_identity".into(),
            file: String::new(),
            line: 0,
            column: 0,
            message,
            related: vec![],
        }]
    })?;
    let plan = crate::plan::build(&linked)?;
    let (generated, graph) = crate::generate::from_plan_shared(&plan, &exports)?;
    crate::generate::shared_emit::emit(
        graph,
        generated,
        &crate::partition::catalog_signature(sources),
        options.max_rust_bytes,
    )
    .map_err(|message| {
        vec![Diagnostic {
            code: "shared_catalog_generation".into(),
            file: String::new(),
            line: 0,
            column: 0,
            message,
            related: vec![],
        }]
    })
}
