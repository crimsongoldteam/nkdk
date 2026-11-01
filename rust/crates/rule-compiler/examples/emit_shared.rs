//! Preparation runs before Cargo selects the generated package graph.
#[path = "../../../build-support/declarations.rs"]
mod declarations;
#[path = "support/shared_bundle.rs"]
mod shared_bundle;
use nkdk_rule_compiler::{SharedCatalogOptions, SourceFile, compile_shared_catalog};
use std::{
    fs,
    path::{Path, PathBuf},
};

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let args = std::env::args().skip(1).collect::<Vec<_>>();
    if args.len() != 3 {
        return Err("usage: emit_shared <catalog> <exports-file> <new-staging-directory>".into());
    }
    let root = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("../../..")
        .canonicalize()?;
    let catalog = Path::new(&args[0]).canonicalize()?;
    let loaded = declarations::load(&root, &catalog)?;
    let sources = loaded
        .iter()
        .map(|(path, bytes)| SourceFile { path, bytes })
        .collect::<Vec<_>>();
    let exports = fs::read_to_string(&args[1])?;
    let exports = exports
        .lines()
        .map(str::trim)
        .filter(|line| !line.is_empty() && !line.starts_with('#'))
        .collect::<std::collections::BTreeSet<_>>();
    if exports.is_empty() {
        return Err("Empty shared catalog exports".into());
    }
    let generated = compile_shared_catalog(
        &sources,
        |module| exports.contains(module.id.as_str()),
        SharedCatalogOptions {
            max_rust_bytes: 16 * 1024 * 1024,
        },
    )
    .map_err(|errors| format!("{errors:#?}"))?;
    shared_bundle::write(generated, Path::new(&args[2]))
}
