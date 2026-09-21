use std::{fs, path::Path};

pub fn declarations(root: &Path, sources: &[(String, Vec<u8>)], max_rust_bytes: usize) {
    let files: Vec<_> = sources
        .iter()
        .map(|(path, bytes)| nkdk_rule_compiler::SourceFile { path, bytes })
        .collect();
    let generated = nkdk_rule_compiler::compile(&files)
        .unwrap_or_else(|errors| panic!("Declaration compilation failed: {errors:#?}"));
    let rust_bytes = generated
        .files
        .iter()
        .find(|file| file.path == "generated.rs")
        .unwrap()
        .contents
        .len();
    assert!(
        rust_bytes < max_rust_bytes,
        "Generated Rust catalog is {rust_bytes} bytes, above its {max_rust_bytes}-byte budget; split repeated probe families or share generated logic"
    );
    for dependency in generated.dependencies {
        println!(
            "cargo::rerun-if-changed={}",
            root.join(dependency).display()
        );
    }
    let output = std::path::PathBuf::from(std::env::var_os("OUT_DIR").unwrap());
    for file in generated.files {
        fs::write(output.join(file.path), file.contents).expect("write generated sources");
    }
}
