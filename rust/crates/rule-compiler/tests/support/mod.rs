#![allow(dead_code)] // Integration tests compile separately and use different helpers.

use std::{fs, path::PathBuf};
pub mod shared_catalog;

#[path = "../../../../test-support/temp.rs"]
mod temp;

pub fn generated_crate_root(label: &str) -> PathBuf {
    let root = temp::unique_directory(label);
    fs::create_dir_all(root.join("src")).unwrap();
    // These temporary crates prove conversion contracts and are discarded.
    // Debug symbols and incremental caches only inflate their build footprint.
    fs::create_dir_all(root.join(".cargo")).unwrap();
    fs::write(
        root.join(".cargo/config.toml"),
        "[profile.dev]\ndebug=0\nincremental=false\n[profile.test]\ndebug=0\nincremental=false\n",
    )
    .unwrap();
    root
}

pub fn conversion_core_path() -> PathBuf {
    std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
        .parent()
        .unwrap()
        .join("conversion-core")
}

pub fn recursive_modules() -> Vec<nkdk_rule_model::Module> {
    [
        (
            "node.yaml",
            include_bytes!("../fixtures/recursive-node.yaml").as_slice(),
        ),
        (
            "nodes.yaml",
            include_bytes!("../fixtures/recursive-nodes.yaml").as_slice(),
        ),
        (
            "owner.yaml",
            include_bytes!("../fixtures/recursive-owner.yaml").as_slice(),
        ),
    ]
    .into_iter()
    .map(|(path, bytes)| {
        nkdk_rule_compiler::parse(nkdk_rule_compiler::SourceFile { path, bytes }).unwrap()
    })
    .collect()
}

/// Shared owner wiring for declared-row collection contracts.
pub fn named_sequence_owner(xml_path: &str, yaml: &str) -> String {
    include_str!("named-sequence-owner.yaml.in")
        .replace("@PATH@", xml_path)
        .replace("@YAML@", yaml)
}

/// Shared value wrapper for a record supplied by a fragment.
pub fn composed_record(id: &str, fragment: &str) -> String {
    include_str!("composed-record.yaml.in")
        .replace("@ID@", id)
        .replace("@FRAGMENT@", fragment)
}

/// Borrow loaded declaration files without copying their contents.
pub fn source_files(files: &[(String, Vec<u8>)]) -> Vec<nkdk_rule_compiler::SourceFile<'_>> {
    files
        .iter()
        .map(|(path, bytes)| nkdk_rule_compiler::SourceFile { path, bytes })
        .collect()
}

/// Shared declaration for a choice's attribute-preserving fallback.
pub fn raw_attribute_record(id: &str, attribute: &str, key: &str) -> String {
    include_str!("raw-attribute-record.yaml.in")
        .replace("@ID@", id)
        .replace("@ATTRIBUTE@", attribute)
        .replace("@KEY@", key)
}

pub fn run_generated(
    label: &str,
    generated: nkdk_rule_compiler::GeneratedSources,
    owner_id: u32,
    main: &str,
) {
    let root = generated_crate_root(label);
    let core = conversion_core_path();
    fs::write(root.join("Cargo.toml"), format!("[package]\nname={label:?}\nversion=\"0.0.0\"\nedition=\"2024\"\n[dependencies]\nnkdk-conversion-core={{path={core:?}}}\n[workspace]\n")).unwrap();
    for file in generated.files {
        fs::write(root.join("src").join(file.path), file.contents).unwrap();
    }
    fs::write(
        root.join("src/main.rs"),
        main.replace("OWNER", &owner_id.to_string()),
    )
    .unwrap();
    let result = std::process::Command::new("cargo")
        .args(["+1.98.1", "run", "--offline", "--quiet"])
        .env("CARGO_INCREMENTAL", "0")
        .current_dir(&root)
        .output()
        .unwrap();
    fs::remove_dir_all(&root).unwrap();
    assert!(
        result.status.success(),
        "{}",
        String::from_utf8_lossy(&result.stderr)
    );
}

/// Compile a small catalog and locate the entry used by its native proof.
pub fn compile_catalog(
    path: &str,
    source: &str,
    entry: &str,
) -> (nkdk_rule_compiler::GeneratedSources, u32) {
    let modules = nkdk_rule_compiler::parse_many(nkdk_rule_compiler::SourceFile {
        path,
        bytes: source.as_bytes(),
    })
    .unwrap();
    let program = nkdk_rule_compiler::link(&modules).unwrap();
    let id = program
        .entries
        .iter()
        .find(|item| item.name == entry)
        .unwrap()
        .id;
    (nkdk_rule_compiler::generate(&program).unwrap(), id)
}
