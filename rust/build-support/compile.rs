use std::{fs, io::Write, path::Path, time::Instant};

#[allow(dead_code)]
pub fn declarations(root: &Path, sources: &[(String, Vec<u8>)], max_rust_bytes: usize) {
    declarations_exporting(root, sources, max_rust_bytes, |_| true);
}

pub fn declarations_exporting(
    root: &Path,
    sources: &[(String, Vec<u8>)],
    max_rust_bytes: usize,
    export: impl Fn(&nkdk_rule_compiler::Module) -> bool,
) {
    declarations_selected(root, sources, max_rust_bytes, export, CatalogMode::Selected);
}

#[allow(dead_code)]
pub enum CatalogMode {
    Selected,
    Shared,
}

pub fn declarations_selected(
    root: &Path,
    sources: &[(String, Vec<u8>)],
    max_rust_bytes: usize,
    export: impl Fn(&nkdk_rule_compiler::Module) -> bool,
    mode: CatalogMode,
) {
    let started = Instant::now();
    let files: Vec<_> = sources
        .iter()
        .map(|(path, bytes)| nkdk_rule_compiler::SourceFile { path, bytes })
        .collect();
    let generated = match mode {
        CatalogMode::Selected => nkdk_rule_compiler::compile_exporting(&files, export),
        CatalogMode::Shared => nkdk_rule_compiler::compile_partition(&files, export),
    }
    .unwrap_or_else(|errors| panic!("Declaration compilation failed: {errors:#?}"));
    if let Some(path) = std::env::var_os("NKDK_GENERATION_PROFILE_LOG") {
        let mut log = fs::OpenOptions::new()
            .create(true)
            .append(true)
            .open(path)
            .expect("open generation profile");
        let bytes: usize = generated.files.iter().map(|file| file.contents.len()).sum();
        writeln!(
            log,
            "{{\"stage\":\"generate\",\"wall_ms\":{},\"source_files\":{},\"generated_bytes\":{bytes}}}",
            started.elapsed().as_millis(),
            sources.len()
        )
        .expect("write generation profile");
    }
    let rust_bytes = generated
        .files
        .iter()
        .find(|file| file.path == "generated.rs")
        .unwrap()
        .contents
        .len();
    let output = std::path::PathBuf::from(std::env::var_os("OUT_DIR").unwrap());
    let mut sizes = generated.sizes.iter().collect::<Vec<_>>();
    sizes.sort_by_key(|size| std::cmp::Reverse(size.bytes));
    let report = sizes
        .iter()
        .map(|size| {
            format!(
                "{}\t{}\t{}\t{}\n",
                size.bytes, size.entry, size.mechanism, size.source
            )
        })
        .collect::<String>();
    fs::write(output.join("generation-sizes.tsv"), report).expect("write generation sizes");
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
    for file in generated.files {
        fs::write(output.join(file.path), file.contents).expect("write generated sources");
    }
}
