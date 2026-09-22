#[path = "../../build-support/compile.rs"]
mod compile;
#[path = "../../build-support/declarations.rs"]
mod declarations;
use std::path::PathBuf;
fn main() {
    let workspace = PathBuf::from(std::env::var_os("CARGO_MANIFEST_DIR").unwrap())
        .join("../..")
        .canonicalize()
        .unwrap();
    let directory = workspace.join("declarations");
    println!("cargo::rerun-if-changed={}", directory.display());
    // The complete system-enumeration matrix is tested in bounded shards.
    // Candidate declarations are exercised by migration contracts until their
    // owners are accepted, so neither belongs in the production catalog.
    let sources = declarations::load(&workspace, &directory)
        .expect("read declaration sources")
        .into_iter()
        .filter(|(path, _)| {
            path != "declarations/probes/system-enumerations.yaml"
                && !path.starts_with("declarations/candidates/")
        })
        .collect::<Vec<_>>();
    compile::declarations(&workspace, &sources, 32 * 1024 * 1024);
}
