#[path = "../../../build-support/declarations.rs"]
mod files;
use nkdk_rule_compiler::{Program, SourceFile, link, parse};
use std::path::Path;
pub fn load(directory: &Path) -> Result<Program, String> {
    let directory = directory
        .canonicalize()
        .map_err(|error| error.to_string())?;
    let sources = files::load(&directory, &directory).map_err(|error| error.to_string())?;
    let modules = sources
        .iter()
        .map(|(path, bytes)| parse(SourceFile { path, bytes }))
        .collect::<Result<Vec<_>, _>>()
        .map_err(|errors| format!("{errors:#?}"))?;
    link(&modules).map_err(|errors| format!("{errors:#?}"))
}
