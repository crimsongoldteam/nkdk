#[path = "../../../build-support/declarations.rs"]
mod declarations;
#[path = "../../../build-support/family.rs"]
mod family;

use nkdk_rule_compiler::{SourceFile, generate, link, parse_many};
use std::{path::PathBuf, time::Instant};

fn main() {
    let root = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("../..")
        .canonicalize()
        .expect("Rust workspace");
    let roots_only = std::env::args().any(|arg| arg == "--roots-only");
    let catalog = std::env::args()
        .nth(1)
        .unwrap_or_else(|| "probes".to_owned());
    assert!(
        matches!(catalog.as_str(), "probes" | "production") || catalog.starts_with("family:"),
        "usage: cargo run --example profile -- probes|production|family:<roots-file>"
    );
    let accepted_probes =
        declarations::manifest_paths(&root.join("declarations/production-probes.txt"))
            .expect("production probe manifest");
    let started = Instant::now();
    let sources = declarations::load(&root, &root.join("declarations"))
        .expect("declaration files")
        .into_iter()
        .filter(|(path, _)| match catalog.as_str() {
            "probes" => {
                path != "declarations/probes/system-enumerations.yaml"
                    && path != "declarations/probes/document-identity-and-children.yaml"
                    && !path.starts_with("declarations/candidates/")
            }
            "production" => {
                if path.starts_with("declarations/probes/") {
                    accepted_probes.contains(path)
                } else if path.starts_with("declarations/candidates/") {
                    std::env::var_os("NKDK_FULL_PRODUCTION").is_some()
                        && matches!(
                            path.as_str(),
                            "declarations/candidates/standard-attributes.generated.yaml"
                                | "declarations/candidates/document-attributes.generated.yaml"
                        )
                } else {
                    true
                }
            }
            _ => true,
        })
        .collect::<Vec<_>>();
    let exported_roots = catalog.strip_prefix("family:").map(|roots_file| {
        std::fs::read_to_string(roots_file)
            .expect("family roots")
            .lines()
            .map(str::to_owned)
            .collect::<std::collections::BTreeSet<_>>()
    });
    let sources = if let Some(roots_file) = catalog.strip_prefix("family:") {
        let roots = std::fs::read_to_string(roots_file).expect("family roots");
        let roots = roots
            .lines()
            .filter(|root| !root.is_empty())
            .collect::<Vec<_>>();
        family::select(&sources, &roots)
    } else {
        sources
    };
    let loaded = started.elapsed();
    let modules = sources
        .iter()
        .flat_map(|(path, bytes)| {
            parse_many(SourceFile { path, bytes })
                .unwrap_or_else(|errors| panic!("{path}: {errors:#?}"))
        })
        .collect::<Vec<_>>();
    let parsed = started.elapsed();
    let program = link(&modules).unwrap_or_else(|errors| panic!("{errors:#?}"));
    let linked = started.elapsed();
    let generated = if let Some(roots) = &exported_roots {
        let exports = program
            .entries
            .iter()
            .filter(|entry| {
                roots.contains(&entry.name)
                    || (!roots_only && !entry.source.file.starts_with("declarations/common/"))
            })
            .map(|entry| entry.name.clone())
            .collect();
        nkdk_rule_compiler::generate_selected(&program, &exports)
    } else if catalog == "production" {
        let exports = program
            .entries
            .iter()
            .filter(|entry| !entry.source.file.starts_with("declarations/common/"))
            .map(|entry| entry.name.clone())
            .collect();
        nkdk_rule_compiler::generate_selected(&program, &exports)
    } else {
        generate(&program)
    }
    .unwrap_or_else(|errors| panic!("{errors:#?}"));
    let finished = started.elapsed();
    // Optional diagnostic dump; generation timings exclude disk writes.
    if let Some(directory) = std::env::var_os("NKDK_PROFILE_OUTPUT") {
        let directory = PathBuf::from(directory);
        for file in &generated.files {
            let path = directory.join(&file.path);
            std::fs::create_dir_all(path.parent().expect("generated file parent"))
                .expect("profile output directory");
            std::fs::write(path, &file.contents).expect("profile output file");
        }
    }
    let files = generated
        .files
        .iter()
        .map(|file| {
            let checksum = file.contents.iter().fold(0xcbf29ce484222325_u64, |hash, byte| {
                (hash ^ u64::from(*byte)).wrapping_mul(0x100000001b3)
            });
            serde_json::json!({"name":file.path,"bytes":file.contents.len(),"fnv64":format!("{checksum:016x}")})
        })
        .collect::<Vec<_>>();
    let sizes = generated
        .sizes
        .iter()
        .map(|item| {
            serde_json::json!({
                "entry":item.entry,
                "source":item.source,
                "mechanism":item.mechanism,
                "bytes":item.bytes
            })
        })
        .collect::<Vec<_>>();
    println!(
        "{}",
        serde_json::json!({
            "catalog":catalog,
            "roots_only":roots_only,
            "sources":sources.len(),
            "declarations":program.entries.len(),
            "definitions":generated.definition_count,
            "connections":generated.connection_count,
            "load_ms":loaded.as_millis(),
            "parse_ms":(parsed-loaded).as_millis(),
            "link_ms":(linked-parsed).as_millis(),
            "generate_ms":(finished-linked).as_millis(),
            "total_ms":finished.as_millis(),
            "files":files,
            "sizes":sizes
        })
    );
}
