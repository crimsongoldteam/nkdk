mod link;
pub use link::link;
mod parse;
mod syntax;

pub use nkdk_rule_model::{Diagnostic, Module, Program, SourceFile};
pub use parse::parse;
mod generate;
pub use generate::{GeneratedFile, GeneratedSources, generate};

pub fn compile(sources: &[SourceFile<'_>]) -> Result<GeneratedSources, Vec<Diagnostic>> {
    let modules = sources
        .iter()
        .map(|source| {
            parse(SourceFile {
                path: source.path,
                bytes: source.bytes,
            })
        })
        .collect::<Result<Vec<_>, _>>()?;
    generate(&link(&modules)?)
}

mod schema;
pub use schema::schema;
