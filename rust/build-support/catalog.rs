#[path = "compile.rs"]
mod compile;
#[path = "declarations.rs"]
mod declarations;
use std::path::PathBuf;

pub fn build(include: impl Fn(&str) -> bool) {
    let workspace = PathBuf::from(std::env::var_os("CARGO_MANIFEST_DIR").unwrap())
        .join("../..")
        .canonicalize()
        .unwrap();
    let directory = workspace.join("declarations");
    println!("cargo::rerun-if-changed={}", directory.display());
    let sources = declarations::load(&workspace, &directory)
        .expect("read declaration sources")
        .into_iter()
        .filter(|(path, _)| include(path))
        .collect::<Vec<_>>();
    compile::declarations(&workspace, &sources, 32 * 1024 * 1024);
}
