//! One native Cargo graph protects cross-package generated-value contracts.
use nkdk_rule_compiler::{GeneratedSharedCatalog, GeneratedSources};
use std::{fs, path::Path, process::Command};

/// Execute the same independent program through shared AOT instead of an inline catalogue.
pub fn run_source_program(label: &str, path: &str, source: &str, entry: &str, program: &str) {
    let catalog = nkdk_rule_compiler::compile_shared_catalog(
        &[nkdk_rule_compiler::SourceFile {
            path,
            bytes: source.as_bytes(),
        }],
        |module| module.id == entry,
        nkdk_rule_compiler::SharedCatalogOptions {
            max_rust_bytes: 16 * 1024 * 1024,
        },
    )
    .unwrap();
    let body = program
        .split("fn main() {")
        .nth(1)
        .unwrap()
        .trim_end()
        .strip_suffix('}')
        .unwrap()
        .replace(
            "let entry=EntryId(OWNER);",
            &format!("let entry=rules::entry_id({entry:?}).unwrap();"),
        )
        .replace("convert_file(", "rules::convert_file(")
        .replace("Direction::", "rules::Direction::")
        .replace("PreparedInputs::", "rules::PreparedInputs::");
    run(
        label,
        catalog,
        &format!("use nkdk_conversion_core as core;{body}"),
    );
}

pub fn run(label: &str, catalog: GeneratedSharedCatalog, main: &str) {
    run_with_signature(label, catalog, main, false);
}
pub fn reject_mixed(label: &str, catalog: GeneratedSharedCatalog) {
    run_with_signature(label, catalog, "", true);
}
fn run_with_signature(label: &str, catalog: GeneratedSharedCatalog, main: &str, mixed: bool) {
    let root = super::generated_crate_root(label);
    let core = super::conversion_core_path();
    let write = |directory: &Path, generated: GeneratedSources| {
        fs::create_dir_all(directory.join("src")).unwrap();
        for file in generated.files {
            fs::write(directory.join("src").join(file.path), file.contents).unwrap();
        }
    };
    let deps = |names: &[String], prefix: &str| {
        names
            .iter()
            .map(|name| format!("{name}={{path={:?}}}\n", format!("{prefix}{name}")))
            .collect::<String>()
    };
    let manifest: serde_json::Value = serde_json::from_slice(&catalog.layout_manifest).unwrap();
    let facade_dependencies = manifest["facadeDependencies"]
        .as_array()
        .unwrap()
        .iter()
        .map(|name| name.as_str().unwrap().to_owned())
        .collect::<Vec<_>>();
    let mut members = Vec::new();
    for (index, package) in catalog.packages.into_iter().enumerate() {
        members.push(package.name.clone());
        let directory = root.join("packages").join(&package.name);
        fs::create_dir_all(&directory).unwrap();
        fs::write(directory.join("Cargo.toml"),format!(
            "[package]\nname={:?}\nversion=\"0.0.0\"\nedition=\"2024\"\n[dependencies]\nnkdk-conversion-core={{path={core:?}}}\n{}",
            package.name,deps(&package.package_dependencies,"../"))).unwrap();
        write(&directory, package.generated);
        if mixed && index == 0 {
            let path = directory.join("src/generated.rs");
            let source = fs::read_to_string(&path).unwrap();
            let start = source.find("pub const CATALOG_SIGNATURE: &str = ").unwrap();
            let end = start + source[start..].find(';').unwrap() + 1;
            let mut source = source;
            source.replace_range(
                start..end,
                "pub const CATALOG_SIGNATURE: &str = \"foreign\";",
            );
            fs::write(path, source).unwrap();
        }
        fs::write(
            directory.join("src/lib.rs"),
            "include!(\"generated.rs\");\n",
        )
        .unwrap();
    }
    let members = members
        .iter()
        .map(|name| format!("\"packages/{name}\""))
        .collect::<Vec<_>>()
        .join(",");
    fs::write(root.join("Cargo.toml"),format!(
        "[package]\nname={label:?}\nversion=\"0.0.0\"\nedition=\"2024\"\n[dependencies]\nnkdk-conversion-core={{path={core:?}}}\n{}[workspace]\nmembers=[{members}]\n",
        deps(&facade_dependencies,"packages/"))).unwrap();
    write(&root, catalog.facade);
    fs::write(
        root.join("src/main.rs"),
        format!("include!(\"generated.rs\");\nuse crate as rules;\nfn main(){{{main}}}\n"),
    )
    .unwrap();
    let lock = Command::new("cargo")
        .args(["+1.98.1", "generate-lockfile", "--offline"])
        .current_dir(&root)
        .output()
        .unwrap();
    assert!(
        lock.status.success(),
        "{}",
        String::from_utf8_lossy(&lock.stderr)
    );
    let result = Command::new("cargo")
        .args(["+1.98.1", "run", "--offline", "--locked", "-j1", "--quiet"])
        .env("CARGO_INCREMENTAL", "0")
        .current_dir(&root)
        .output()
        .unwrap();
    let passed = if mixed {
        !result.status.success() && String::from_utf8_lossy(&result.stderr).contains("error[E0080]")
    } else {
        result.status.success()
    };
    if passed {
        fs::remove_dir_all(&root).unwrap();
    }
    assert!(
        passed,
        "native catalog retained at {}\n{}",
        root.display(),
        String::from_utf8_lossy(&result.stderr)
    );
}
