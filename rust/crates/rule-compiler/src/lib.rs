mod automata;
mod expressions;
mod fact_shape;
mod link;
mod linked_graph;
mod presence;
mod qname_attributes;
pub use link::link;
mod parse;
mod plan;
mod syntax;
mod yaml_shape;

pub use nkdk_rule_model::{Diagnostic, Module, ModuleKind, Program, SourceFile};
pub use parse::{parse, parse_many};
mod generate;
mod partition;
mod shared_catalog;
mod shared_identity;
use generate::generate_partition;
pub use generate::{GeneratedFile, GeneratedSources, GenerationSize, generate, generate_selected};
pub use shared_catalog::{
    GeneratedPackage, GeneratedSharedCatalog, SharedCatalogOptions, compile_shared_catalog,
};

pub fn compile(sources: &[SourceFile<'_>]) -> Result<GeneratedSources, Vec<Diagnostic>> {
    generate(&link(&parse_sources(sources)?)?)
}

pub fn compile_exporting(
    sources: &[SourceFile<'_>],
    export: impl Fn(&Module) -> bool,
) -> Result<GeneratedSources, Vec<Diagnostic>> {
    compile_selected(sources, export, generate_selected)
}

/// Compile a package that shares entry identities and index layouts with other
/// packages compiled from the same source catalog.
pub fn compile_partition(
    sources: &[SourceFile<'_>],
    export: impl Fn(&Module) -> bool,
) -> Result<GeneratedSources, Vec<Diagnostic>> {
    let mut generated = compile_selected(sources, export, generate_partition)?;
    partition::add_signature(&mut generated, sources);
    Ok(generated)
}

fn compile_selected(
    sources: &[SourceFile<'_>],
    export: impl Fn(&Module) -> bool,
    generate: fn(
        &nkdk_rule_model::Program,
        &std::collections::BTreeSet<String>,
    ) -> Result<GeneratedSources, Vec<Diagnostic>>,
) -> Result<GeneratedSources, Vec<Diagnostic>> {
    let modules = parse_sources(sources)?;
    let exports = modules
        .iter()
        .filter(|module| export(module))
        .map(|module| module.id.clone())
        .collect();
    generate(&link(&modules)?, &exports)
}

fn parse_sources(sources: &[SourceFile<'_>]) -> Result<Vec<Module>, Vec<Diagnostic>> {
    Ok(sources
        .iter()
        .map(|source| {
            parse_many(SourceFile {
                path: source.path,
                bytes: source.bytes,
            })
        })
        .collect::<Result<Vec<_>, _>>()?
        .into_iter()
        .flatten()
        .collect())
}

mod schema;
pub use schema::schema;

/// Structural authoring schema; name resolution and YAML source checks remain in parse/link.
pub fn declaration_schema() -> &'static [u8] {
    include_bytes!("../../../../schemas/nkdk-declarations.schema.json")
}

pub(crate) fn diagnostic(
    code: &str,
    source: &nkdk_rule_model::SourceLocation,
    message: &str,
) -> Diagnostic {
    Diagnostic {
        code: code.into(),
        file: source.file.clone(),
        line: source.line,
        column: source.column,
        message: message.into(),
        related: vec![],
    }
}
