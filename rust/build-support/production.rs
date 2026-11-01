//! Shared source universe and data-driven package ownership.
#[path = "catalog.rs"]
mod catalog;

#[allow(dead_code)]
#[derive(PartialEq, Eq)]
pub enum Group {
    Primary,
    Elements,
    Elements2,
    Bodies,
    Bodies2,
    Bodies3,
    Bodies4,
    Bodies5,
    Secondary,
    Secondary2,
    Secondary3,
    Members,
    Members2,
    Inputs,
    Inputs2,
}

pub fn build(group: Group) {
    println!("cargo::rerun-if-env-changed=NKDK_FULL_PRODUCTION");
    let full =
        std::env::var_os("NKDK_FULL_PRODUCTION").as_deref() == Some(std::ffi::OsStr::new("1"));
    for directory in ["common", "fragments", "objects", "resources"] {
        catalog::watch_directory(directory);
    }
    let workspace =
        std::path::PathBuf::from(std::env::var_os("CARGO_MANIFEST_DIR").unwrap()).join("../..");
    with_selection(&workspace, full, group, |include, export, budget| {
        catalog::build_partition(include, export, budget);
    });
}

pub struct SelectedCatalog {
    pub sources: Vec<(String, Vec<u8>)>,
    pub exports: std::collections::BTreeSet<String>,
    pub max_rust_bytes: usize,
}

/// Select before Cargo builds the generated packages; preserve production IDs.
pub fn select(workspace: &std::path::Path, full: bool, group: Group) -> SelectedCatalog {
    with_selection(workspace, full, group, |include, export, max_rust_bytes| {
        let sources = catalog::selected_sources(workspace, include, true);
        let exports = sources
            .iter()
            .flat_map(|(path, bytes)| {
                nkdk_rule_compiler::parse_many(nkdk_rule_compiler::SourceFile { path, bytes })
                    .unwrap_or_else(|errors| {
                        panic!("Production declaration parsing failed: {errors:#?}")
                    })
            })
            .filter(export)
            .map(|module| module.id)
            .collect();
        SelectedCatalog {
            sources,
            exports,
            max_rust_bytes,
        }
    })
}

fn with_selection<T>(
    workspace: &std::path::Path,
    full: bool,
    group: Group,
    consume: impl FnOnce(
        &dyn Fn(&str) -> bool,
        &dyn Fn(&nkdk_rule_compiler::Module) -> bool,
        usize,
    ) -> T,
) -> T {
    let element_ownership = workspace.join("declarations/production-elements.txt");
    let element_ownership_2 = workspace.join("declarations/production-elements-2.txt");
    let body_ownership = workspace.join("declarations/production-bodies.txt");
    let body_ownership_2 = workspace.join("declarations/production-bodies-2.txt");
    let body_ownership_3 = workspace.join("declarations/production-bodies-3.txt");
    let body_ownership_4 = workspace.join("declarations/production-bodies-4.txt");
    let body_ownership_5 = workspace.join("declarations/production-bodies-5.txt");
    let probes = workspace.join("declarations/production-probes.txt");
    let ownership = workspace.join("declarations/production-secondary.txt");
    let ownership_2 = workspace.join("declarations/production-secondary-2.txt");
    let ownership_3 = workspace.join("declarations/production-secondary-3.txt");
    let member_ownership = workspace.join("declarations/production-members.txt");
    let member_ownership_2 = workspace.join("declarations/production-members-2.txt");
    let input_ownership = workspace.join("declarations/production-inputs.txt");
    let input_ownership_2 = workspace.join("declarations/production-inputs-2.txt");
    for path in [
        &element_ownership,
        &element_ownership_2,
        &body_ownership,
        &body_ownership_2,
        &body_ownership_3,
        &body_ownership_4,
        &body_ownership_5,
        &probes,
        &ownership,
        &ownership_2,
        &ownership_3,
        &member_ownership,
        &member_ownership_2,
        &input_ownership,
        &input_ownership_2,
    ] {
        println!("cargo::rerun-if-changed={}", path.display());
    }
    let elements = catalog::manifest_paths(&element_ownership);
    let elements2 = catalog::manifest_paths(&element_ownership_2);
    let bodies = catalog::manifest_paths(&body_ownership);
    let bodies2 = catalog::manifest_paths(&body_ownership_2);
    let bodies3 = catalog::manifest_paths(&body_ownership_3);
    let bodies4 = catalog::manifest_paths(&body_ownership_4);
    let bodies5 = catalog::manifest_paths(&body_ownership_5);
    let accepted = catalog::manifest_paths(&probes);
    // Register accepted paths even before the generated file exists. Otherwise
    // creating it during/after an earlier build can leave a cached catalog
    // without the new entry: probing the manifests alone cannot detect that.
    for path in &accepted {
        let source = workspace.join(path);
        println!("cargo::rerun-if-changed={}", source.display());
        assert!(
            source.is_file(),
            "Accepted production declaration is missing: {}",
            source.display()
        );
    }
    let secondary = catalog::manifest_paths(&ownership);
    let secondary2 = catalog::manifest_paths(&ownership_2);
    let secondary3 = catalog::manifest_paths(&ownership_3);
    let members = catalog::manifest_paths(&member_ownership);
    let members2 = catalog::manifest_paths(&member_ownership_2);
    let inputs = catalog::manifest_paths(&input_ownership);
    let inputs2 = catalog::manifest_paths(&input_ownership_2);
    let partitions = [
        &elements,
        &elements2,
        &secondary,
        &secondary2,
        &secondary3,
        &members,
        &members2,
        &inputs,
        &inputs2,
        &bodies,
        &bodies2,
        &bodies3,
        &bodies4,
        &bodies5,
    ];
    for (slot, paths) in partitions.iter().enumerate() {
        for other in &partitions[slot + 1..] {
            assert!(
                paths.is_disjoint(other),
                "Repeated production file ownership"
            );
        }
    }
    consume(
        &|path| {
            if path.starts_with("declarations/probes/") {
                accepted.contains(path)
            } else if path.starts_with("declarations/candidates/") {
                bodies3.contains(path)
                    || bodies4.contains(path)
                    || bodies5.contains(path)
                    || path == "declarations/candidates/standard-attributes.generated.yaml"
                    || (full
                        && path == "declarations/candidates/document-attributes.generated.yaml")
            } else {
                true
            }
        },
        &|module| {
            !module.source.file.starts_with("declarations/common/")
                && !module.source.file.starts_with("declarations/fragments/")
                && (full
                    || !module.source.file.starts_with("declarations/candidates/")
                    || bodies3.contains(&module.source.file)
                    || bodies4.contains(&module.source.file)
                    || bodies5.contains(&module.source.file))
                && (!bodies3.contains(&module.source.file)
                    || matches!(
                        module.kind,
                        nkdk_rule_compiler::ModuleKind::Object
                            | nkdk_rule_compiler::ModuleKind::Resources
                    ))
                && group
                    == if elements.contains(&module.source.file) {
                        Group::Elements
                    } else if elements2.contains(&module.source.file) {
                        Group::Elements2
                    } else if bodies5.contains(&module.source.file) {
                        Group::Bodies5
                    } else if bodies4.contains(&module.source.file) {
                        Group::Bodies4
                    } else if bodies3.contains(&module.source.file) {
                        Group::Bodies3
                    } else if bodies2.contains(&module.source.file) {
                        Group::Bodies2
                    } else if bodies.contains(&module.source.file) {
                        Group::Bodies
                    } else if inputs2.contains(&module.source.file) {
                        Group::Inputs2
                    } else if inputs.contains(&module.source.file) {
                        Group::Inputs
                    } else if members2.contains(&module.source.file) {
                        Group::Members2
                    } else if members.contains(&module.source.file) {
                        Group::Members
                    } else if secondary.contains(&module.source.file) {
                        Group::Secondary
                    } else if secondary2.contains(&module.source.file) {
                        Group::Secondary2
                    } else if secondary3.contains(&module.source.file) {
                        Group::Secondary3
                    } else {
                        Group::Primary
                    }
        },
        match group {
            Group::Bodies | Group::Bodies2 | Group::Bodies3 | Group::Bodies4 | Group::Bodies5 => {
                16 * 1024 * 1024
            }
            Group::Primary => (if full { 32 } else { 8 }) * 1024 * 1024,
            Group::Elements
            | Group::Elements2
            | Group::Secondary
            | Group::Secondary2
            | Group::Secondary3
            | Group::Members
            | Group::Members2
            | Group::Inputs
            | Group::Inputs2 => 8 * 1024 * 1024,
        },
    )
}
