#[path = "../../../rust/build-support/declarations.rs"]
mod declarations;
use std::{fs, path::PathBuf};
fn main() {
    let root = PathBuf::from(std::env::var_os("CARGO_MANIFEST_DIR").unwrap())
        .join("../../..")
        .canonicalize()
        .unwrap();
    println!("cargo::rerun-if-env-changed=NKDK_MIGRATION_CATALOG");
    let directory = std::env::var_os("NKDK_MIGRATION_CATALOG")
        .map(PathBuf::from)
        .unwrap_or_else(|| root.join("tests/migration/rules-contract-catalog"));
    println!("cargo::rerun-if-changed={}", directory.display());
    let sources = declarations::load(&root, &directory).expect("read candidates");
    let sources: Vec<_> = sources
        .iter()
        .map(|(path, bytes)| nkdk_rule_compiler::SourceFile { path, bytes })
        .collect();
    let generated = nkdk_rule_compiler::compile(&sources).expect("compile candidates");
    let output = PathBuf::from(std::env::var_os("OUT_DIR").unwrap());
    for file in generated.files {
        fs::write(output.join(file.path), file.contents).unwrap();
    }
}
