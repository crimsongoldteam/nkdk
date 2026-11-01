//! Select the source closure of a generated family before registering Cargo inputs.
use std::collections::{BTreeMap, BTreeSet};

const SYSTEM_ENUMS: &str = "declarations/common/system-enumerations.yaml";

/// Keep the included catalog universe; fragments follow imports and index dependencies.
/// Missing imports and invalid included sources remain compiler diagnostics.
#[allow(dead_code)]
pub fn without_unreferenced_fragments(sources: &[(String, Vec<u8>)]) -> Vec<(String, Vec<u8>)> {
    let mut declarations = BTreeMap::new();
    let mut paths_by_id: BTreeMap<&str, Vec<&str>> = BTreeMap::new();
    let mut paths_by_index: BTreeMap<&str, Vec<&str>> = BTreeMap::new();
    let mut pending = Vec::new();
    for (path, bytes) in sources {
        let modules =
            nkdk_rule_compiler::parse_many(nkdk_rule_compiler::SourceFile { path, bytes });
        if !modules.as_ref().is_ok_and(|modules| {
            modules
                .iter()
                .all(|module| module.kind == nkdk_rule_compiler::ModuleKind::Fragment)
        }) {
            pending.push(path.as_str());
        }
        declarations.insert(path.as_str(), modules.unwrap_or_default());
    }
    for (path, modules) in &declarations {
        for module in modules {
            paths_by_id.entry(&module.id).or_default().push(path);
            for contribution in &module.contributions {
                paths_by_index
                    .entry(&contribution.index)
                    .or_default()
                    .push(path);
            }
        }
    }
    let mut selected = BTreeSet::new();
    while let Some(path) = pending.pop() {
        if !selected.insert(path) {
            continue;
        }
        for module in &declarations[path] {
            for index in &module.input_indexes {
                if let Some(paths) = paths_by_index.get(index.value.as_str()) {
                    pending.extend(paths.iter().copied());
                }
            }
            for import in &module.imports {
                if let Some(paths) = paths_by_id.get(import.value.as_str()) {
                    pending.extend(paths.iter().copied());
                }
            }
        }
    }
    sources
        .iter()
        .filter(|(path, _)| selected.contains(path.as_str()))
        .cloned()
        .collect()
}

pub fn select(sources: &[(String, Vec<u8>)], roots: &[&str]) -> Vec<(String, Vec<u8>)> {
    let mut by_id: BTreeMap<String, Vec<&str>> = BTreeMap::new();
    let mut enum_roots = BTreeSet::new();
    let mut modules_by_id = BTreeMap::new();
    let mut source_sizes = BTreeMap::new();
    for (path, bytes) in sources {
        if path == "declarations/probes/system-enumerations.yaml" {
            continue;
        }
        source_sizes.insert(path.as_str(), bytes.len());
        let parsed = nkdk_rule_compiler::parse_many(nkdk_rule_compiler::SourceFile { path, bytes });
        if let Ok(modules) = &parsed {
            for module in modules {
                modules_by_id.insert(module.id.clone(), (path.as_str(), module.clone()));
            }
        }
        if path == SYSTEM_ENUMS {
            enum_roots.extend(
                String::from_utf8_lossy(bytes)
                    .lines()
                    .filter_map(|line| line.strip_prefix("  id: "))
                    .map(str::to_owned),
            );
        }
        let ids = if path.starts_with("declarations/candidates/") {
            parsed
                .unwrap_or_else(|errors| panic!("{path}: {errors:#?}"))
                .into_iter()
                .map(|module| module.id)
                .collect()
        } else {
            provisional_ids(bytes)
        };
        for id in ids {
            by_id.entry(id).or_default().push(path);
        }
    }
    let mut contributors: BTreeMap<String, Vec<(usize, String)>> = BTreeMap::new();
    for (id, (path, module)) in &modules_by_id {
        if !matches!(
            module.kind,
            nkdk_rule_compiler::ModuleKind::Object | nkdk_rule_compiler::ModuleKind::Resources
        ) {
            continue;
        }
        let mut indexes = BTreeSet::new();
        inherited_contributions(id, &modules_by_id, &mut BTreeSet::new(), &mut indexes);
        for index in indexes {
            contributors
                .entry(index)
                .or_default()
                .push((source_sizes[path], id.clone()));
        }
    }
    let mut pending = roots.iter().map(|id| (*id).to_owned()).collect::<Vec<_>>();
    let mut seen = BTreeSet::new();
    let mut selected: BTreeMap<&str, BTreeSet<String>> = BTreeMap::new();
    let mut selected_enums = BTreeSet::new();
    while let Some(id) = pending.pop() {
        if !seen.insert(id.clone()) {
            continue;
        }
        let paths = by_id
            .get(&id)
            .unwrap_or_else(|| panic!("family declaration is absent: {id}"));
        assert_eq!(paths.len(), 1, "ambiguous family declaration: {id}");
        let path = paths[0];
        if path == SYSTEM_ENUMS {
            let root = enum_roots
                .iter()
                .filter(|root| id == **root || id.starts_with(&format!("{root}.")))
                .max_by_key(|root| root.len())
                .expect("system enumeration variant has a root");
            selected_enums.insert(root.clone());
        } else if selected.entry(path).or_default().insert(id.clone()) {
            let (_, module) = modules_by_id.get(&id).unwrap_or_else(|| {
                let bytes = &sources
                    .iter()
                    .find(|(source, _)| source == path)
                    .expect("indexed source exists")
                    .1;
                let errors =
                    nkdk_rule_compiler::parse_many(nkdk_rule_compiler::SourceFile { path, bytes })
                        .err();
                panic!("indexed declaration {id} was not parsed in {path}: {errors:#?}")
            });
            let modules = if path.starts_with("declarations/candidates/") {
                vec![module]
            } else {
                modules_by_id
                    .values()
                    .filter(|(source, _)| *source == path)
                    .map(|(_, module)| module)
                    .collect::<Vec<_>>()
            };
            for module in modules {
                for index in &module.input_indexes {
                    let producer = contributors
                        .get(&index.value)
                        .and_then(|options| options.iter().min())
                        .unwrap_or_else(|| {
                            panic!("family index has no contributor: {}", index.value)
                        });
                    pending.push(producer.1.clone());
                }
                pending.extend(module.imports.iter().map(|binding| binding.value.clone()));
            }
        }
    }
    sources
        .iter()
        .filter_map(|(path, bytes)| {
            if path == SYSTEM_ENUMS && !selected_enums.is_empty() {
                Some((path.clone(), subset_system_enums(bytes, &selected_enums)))
            } else {
                selected.get(path.as_str()).map(|ids| {
                    (
                        path.clone(),
                        if path.starts_with("declarations/candidates/") {
                            subset_catalog(path, bytes, ids)
                        } else {
                            bytes.clone()
                        },
                    )
                })
            }
        })
        .collect()
}

fn subset_catalog(path: &str, bytes: &[u8], ids: &BTreeSet<String>) -> Vec<u8> {
    let source = std::str::from_utf8(bytes).expect("candidate catalog is UTF-8");
    let start = source
        .find("\n  - format:")
        .expect("candidate declarations");
    let mut selected = String::from(&source[..start + 1]);
    for block in source[start + 1..].split("  - format:") {
        if block.is_empty() {
            continue;
        }
        let candidate = format!(
            "format: nkdk-declarations/1\nkind: catalog\ndeclarations:\n  - format:{block}"
        );
        let modules = nkdk_rule_compiler::parse_many(nkdk_rule_compiler::SourceFile {
            path,
            bytes: candidate.as_bytes(),
        })
        .unwrap_or_else(|errors| panic!("{path}: {errors:#?}"));
        assert_eq!(
            modules.len(),
            1,
            "candidate block must contain one declaration"
        );
        if ids.contains(&modules[0].id) {
            selected.push_str("  - format:");
            selected.push_str(block);
        }
    }
    selected.into_bytes()
}

fn inherited_contributions(
    id: &str,
    modules: &BTreeMap<String, (&str, nkdk_rule_compiler::Module)>,
    visited: &mut BTreeSet<String>,
    indexes: &mut BTreeSet<String>,
) {
    if !visited.insert(id.to_owned()) {
        return;
    }
    let Some((_, module)) = modules.get(id) else {
        return;
    };
    indexes.extend(module.contributions.iter().map(|item| item.index.clone()));
    for import in &module.imports {
        inherited_contributions(&import.value, modules, visited, indexes);
    }
}

fn provisional_ids(source: &[u8]) -> Vec<String> {
    String::from_utf8_lossy(source)
        .lines()
        .filter_map(|line| {
            line.strip_prefix("id: ")
                .or_else(|| line.strip_prefix("  id: "))
                .or_else(|| line.strip_prefix("    id: "))
                .or_else(|| line.strip_prefix("  - id: "))
                .map(str::trim)
                .filter(|id| !id.is_empty())
                .map(str::to_owned)
        })
        .collect()
}

fn subset_system_enums(source: &[u8], ids: &BTreeSet<String>) -> Vec<u8> {
    let source = std::str::from_utf8(source).expect("system enumerations are UTF-8");
    let mut selected = String::from("format: nkdk-declarations/1\nkind: catalog\ndeclarations:\n");
    let mut found = BTreeSet::new();
    for block in source.split("\n- kind: value\n").skip(1) {
        let id = block
            .lines()
            .find_map(|line| line.strip_prefix("  id: "))
            .expect("system enumeration ID");
        if ids.contains(id) {
            selected.push_str("- kind: value\n");
            selected.push_str(block);
            selected.push('\n');
            found.insert(id);
        }
    }
    assert_eq!(
        found.len(),
        ids.len(),
        "selected system enumeration is absent from its source"
    );
    selected.into_bytes()
}
