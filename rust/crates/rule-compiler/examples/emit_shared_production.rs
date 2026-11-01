//! The existing production selection owns sources and public entry identities.
#[path = "../../../build-support/production.rs"]
#[allow(dead_code)]
mod production;
#[path = "support/shared_bundle.rs"]
mod shared_bundle;
use nkdk_rule_compiler::{SharedCatalogOptions, SourceFile, compile_shared_catalog};
use std::path::{Path, PathBuf};

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let args = std::env::args().skip(1).collect::<Vec<_>>();
    if args.len() != 2 || args[0] != "bodies-5" {
        return Err("usage: emit_shared_production bodies-5 <new-staging-directory>".into());
    }
    let root = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("../..")
        .canonicalize()?;
    let full =
        std::env::var_os("NKDK_FULL_PRODUCTION").as_deref() == Some(std::ffi::OsStr::new("1"));
    let selected = production::select(&root, full, production::Group::Bodies5);
    let sources = selected
        .sources
        .iter()
        .map(|(path, bytes)| SourceFile { path, bytes })
        .collect::<Vec<_>>();
    let generated = compile_shared_catalog(
        &sources,
        |module| selected.exports.contains(&module.id),
        SharedCatalogOptions {
            max_rust_bytes: selected.max_rust_bytes,
        },
    )
    .map_err(|errors| format!("{errors:#?}"))?;
    shared_bundle::write(generated, Path::new(&args[1]))
}
