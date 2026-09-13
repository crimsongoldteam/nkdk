mod automata;
mod expressions;
mod fact_shape;
mod link;
pub use link::link;
mod parse;
mod plan;
mod syntax;

pub use nkdk_rule_model::{Diagnostic, Module, Program, SourceFile};
pub use parse::{parse, parse_many};
mod generate;
pub use generate::{GeneratedFile, GeneratedSources, generate};

pub fn compile(sources: &[SourceFile<'_>]) -> Result<GeneratedSources, Vec<Diagnostic>> {
    let modules = sources
        .iter()
        .map(|source| {
            parse_many(SourceFile {
                path: source.path,
                bytes: source.bytes,
            })
        })
        .collect::<Result<Vec<_>, _>>()?;
    generate(&link(&modules.into_iter().flatten().collect::<Vec<_>>())?)
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
