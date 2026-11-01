#[path = "../../../rust/build-support/declarations.rs"]
mod declarations;
use std::{collections::HashSet, fs, path::PathBuf};
fn main() {
    if std::env::var_os("CARGO_FEATURE_WORKING_CATALOG").is_some() {
        return;
    }
    let root = PathBuf::from(std::env::var_os("CARGO_MANIFEST_DIR").unwrap())
        .join("../../..")
        .canonicalize()
        .unwrap();
    println!("cargo::rerun-if-env-changed=NKDK_MIGRATION_CATALOG");
    println!("cargo::rerun-if-env-changed=NKDK_MIGRATION_EXPORTS");
    let directory = std::env::var_os("NKDK_MIGRATION_CATALOG")
        .map(PathBuf::from)
        .unwrap_or_else(|| root.join("tests/migration/rules-contract-catalog"));
    println!("cargo::rerun-if-changed={}", directory.display());
    let sources = declarations::load(&root, &directory).expect("read candidates");
    let sources: Vec<_> = sources
        .iter()
        .map(|(path, bytes)| nkdk_rule_compiler::SourceFile { path, bytes })
        .collect();
    let exports: HashSet<_> = std::env::var("NKDK_MIGRATION_EXPORTS")
        .expect("selected migration exports")
        .split(',')
        .filter(|name| !name.is_empty())
        .map(str::to_owned)
        .collect();
    assert!(!exports.is_empty(), "migration exports must not be empty");
    let generated =
        nkdk_rule_compiler::compile_exporting(&sources, |module| exports.contains(&module.id))
            .expect("compile selected candidates");
    let output = PathBuf::from(std::env::var_os("OUT_DIR").unwrap());
    // Boundary tests supply explicit routes; do not load the entire project catalog.
    fs::write(
        output.join("operation_routes.rs"),
        "const OPERATION_ROUTES: &[&str] = &[];\n",
    )
    .unwrap();
    let rust_bytes = generated
        .files
        .iter()
        .find(|file| file.path == "generated.rs")
        .expect("generated Rust source")
        .contents
        .len();
    let mut sizes = generated.sizes.iter().collect::<Vec<_>>();
    sizes.sort_by_key(|size| std::cmp::Reverse(size.bytes));
    let report = sizes
        .iter()
        .map(|size| format!("{}\t{}\t{}\n", size.bytes, size.entry, size.mechanism))
        .collect::<String>();
    fs::write(output.join("generation-sizes.tsv"), report).unwrap();
    assert!(
        rust_bytes <= 40 * 1024 * 1024,
        "migration generated.rs is {rust_bytes} bytes; check scenarios separately before invoking rustc"
    );
    for file in generated.files {
        fs::write(output.join(file.path), file.contents).unwrap();
    }
}
