use std::{
    fs,
    path::{Path, PathBuf},
};
fn collect(dir: &Path, files: &mut Vec<PathBuf>) {
    for entry in fs::read_dir(dir).expect("declaration directory") {
        let path = entry.expect("declaration entry").path();
        if path.is_dir() {
            collect(&path, files);
        } else if path
            .extension()
            .is_some_and(|extension| extension == "yaml")
        {
            files.push(path);
        }
    }
}
fn main() {
    let workspace = PathBuf::from(std::env::var_os("CARGO_MANIFEST_DIR").unwrap())
        .join("../..")
        .canonicalize()
        .unwrap();
    let directory = workspace.join("declarations");
    println!("cargo::rerun-if-changed={}", directory.display());
    let mut files = vec![];
    collect(&directory, &mut files);
    files.sort();
    let sources: Vec<_> = files
        .iter()
        .map(|path| {
            (
                path.strip_prefix(&workspace)
                    .unwrap()
                    .to_string_lossy()
                    .into_owned(),
                fs::read(path).expect("read declaration"),
            )
        })
        .collect();
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
