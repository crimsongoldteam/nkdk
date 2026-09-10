#[path = "../../build-support/declarations.rs"]
mod declarations;
use std::{fs, path::PathBuf};
fn main() {
    let workspace = PathBuf::from(std::env::var_os("CARGO_MANIFEST_DIR").unwrap())
        .join("../..")
        .canonicalize()
        .unwrap();
    let directory = workspace.join("declarations");
    println!("cargo::rerun-if-changed={}", directory.display());
    let sources = declarations::load(&workspace, &directory).expect("read declaration sources");
    let sources: Vec<_> = sources
        .iter()
        .map(|(path, bytes)| nkdk_rule_compiler::SourceFile { path, bytes })
        .collect();
    let generated = nkdk_rule_compiler::compile(&sources)
        .unwrap_or_else(|errors| panic!("Declaration compilation failed: {errors:#?}"));
    for dependency in generated.dependencies {
        println!(
            "cargo::rerun-if-changed={}",
            workspace.join(dependency).display()
        );
    }
    let output = PathBuf::from(std::env::var_os("OUT_DIR").unwrap());
    for file in generated.files {
        fs::write(output.join(file.path), file.contents).expect("write generated sources");
    }
}
