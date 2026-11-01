//! Static imports preserve the generated paths while each body has one owner.
use super::{GeneratedFile, GeneratedSources, shared_graph, shared_layout, shared_units::*};
use crate::{GeneratedPackage, GeneratedSharedCatalog};
use sha2::{Digest, Sha256};
use std::collections::{BTreeMap, BTreeSet};

const PRELUDE: &str = "pub use nkdk_conversion_core::{Direction, EntryId, PreparedInputs, InputValue, FileResult, RuntimeDiagnostic, Severity};\nuse nkdk_conversion_core as core;\n#[allow(unused_imports)] use core::inputs::InputView;\n";

pub(crate) fn emit(
    graph: UnitGraph,
    original: GeneratedSources,
    signature: &str,
    budget: usize,
) -> Result<GeneratedSharedCatalog, String> {
    let groups = shared_graph::components(&graph, &[SymbolId("facade".into())])?;
    let layout = shared_layout::place(&graph, &groups, budget)?;
    // Keep the facade's entire recursive component together, just like every
    // other SCC. Splitting it would create an invalid Cargo dependency cycle.
    let facade_package = layout.owners[&UnitId("facade".into())];
    let mut contracts = vec![String::new(); layout.packages.len()];
    let mut order = (0..layout.packages.len()).collect::<Vec<_>>();
    order.sort_by_key(|index| layout.packages[*index].level);
    for index in order {
        let package = &layout.packages[index];
        let mut hash = Sha256::new();
        hash.update(b"nkdk-aot-render/5-inline-tokens160");
        let mut dependencies = BTreeSet::new();
        let mut frame = |bytes: &[u8]| {
            hash.update((bytes.len() as u64).to_le_bytes());
            hash.update(bytes);
        };
        for id in &package.units {
            let unit = &graph.units[id];
            frame(unit.source.as_bytes());
            for namespace in &unit.namespace {
                frame(namespace.as_bytes());
            }
            for (path, bytes) in &unit.files {
                frame(path.as_bytes());
                frame(bytes);
            }
            for reference in &unit.references {
                let dependency = layout.owners[&graph.owners[reference]];
                if dependency != index {
                    dependencies.insert(dependency);
                }
            }
        }
        for dependency in dependencies {
            frame(contracts[dependency].as_bytes());
        }
        contracts[index] = format!("{:x}", hash.finalize());
    }
    let names = contracts
        .iter()
        .map(|hash| format!("nkdk-aot-{}", &hash[..16]))
        .collect::<Vec<_>>();
    if names.iter().collect::<BTreeSet<_>>().len() != names.len() {
        return Err("Generated package name collision".into());
    }
    let mut packages = Vec::new();
    let mut facade = None;
    let mut facade_dependencies = Vec::new();
    let mut manifest = Vec::new();
    for (index, package) in layout.packages.iter().enumerate() {
        let mut namespaces = BTreeMap::<Vec<String>, String>::new();
        let mut dependencies = BTreeSet::new();
        let mut files = Vec::new();
        let mut imported = BTreeSet::new();
        for id in &package.units {
            let unit = &graph.units[id];
            for reference in &unit.references {
                let owner = &graph.owners[reference];
                let target = layout.owners[owner];
                if target == index || !imported.insert(reference.clone()) {
                    continue;
                }
                dependencies.insert(names[target].clone());
                let parts = reference.0.split("::").collect::<Vec<_>>();
                let namespace = parts[..parts.len() - 1]
                    .iter()
                    .map(|s| (*s).to_owned())
                    .collect::<Vec<_>>();
                let dependency = names[target].replace('-', "_");
                namespaces.entry(namespace).or_default().push_str(&format!(
                    "#[allow(unused_imports)] pub use {dependency}::{};\n",
                    reference.0
                ));
            }
            namespaces
                .entry(unit.namespace.clone())
                .or_default()
                .push_str(&export_visibility(unit.source.clone())?);
            files.extend(unit.files.iter().map(|(path, contents)| GeneratedFile {
                path: path.clone(),
                contents: contents.clone(),
            }));
        }
        let mut code = if index == facade_package {
            String::new()
        } else {
            PRELUDE.into()
        };
        for (namespace, body) in namespaces {
            for name in &namespace {
                code.push_str(&format!(
                    "#[allow(dead_code,unused_imports)] pub mod {name} {{ use super::*;\n"
                ));
            }
            code.push_str(&body);
            for _ in &namespace {
                code.push_str("}\n");
            }
        }
        let own_signature = if index == facade_package {
            signature
        } else {
            &contracts[index]
        };
        code.push_str(&format!(
            "pub const CATALOG_SIGNATURE: &str = {own_signature:?};\n"
        ));
        for dependency in &dependencies {
            let dependency_index = names.iter().position(|name| name == dependency).unwrap();
            let expected = &contracts[dependency_index];
            let dependency = dependency.replace('-', "_");
            code.push_str(&format!("const _: () = {{ let a={expected:?}.as_bytes(); let b={dependency}::CATALOG_SIGNATURE.as_bytes(); assert!(a.len()==b.len()); let mut i=0; while i<a.len() {{ assert!(a[i]==b[i]); i+=1; }} }};\n"));
        }
        if index == facade_package {
            code.push_str("pub fn catalog_signature()-> &'static str { CATALOG_SIGNATURE }\n");
        }
        let rust_bytes = code.len()
            + files
                .iter()
                .filter(|file| file.path.ends_with(".rs"))
                .map(|file| file.contents.len())
                .sum::<usize>();
        if rust_bytes > budget {
            return Err(format!(
                "shared_unit_budget_exceeded: emitted {} has {rust_bytes} Rust bytes > {budget}",
                names[index]
            ));
        }
        files.insert(
            0,
            GeneratedFile {
                path: "generated.rs".into(),
                contents: code.into_bytes(),
            },
        );
        let generated = GeneratedSources {
            files,
            dependencies: original.dependencies.clone(),
            sizes: vec![],
            definition_count: original.definition_count,
            connection_count: original.connection_count,
        };
        let dependencies: Vec<_> = dependencies.into_iter().collect();
        manifest.push(serde_json::json!({"package":names[index],"units":package.units.iter().map(|id| &id.0).collect::<Vec<_>>(),
            "sourceKinds":package.units.iter().flat_map(|id| graph.units[id].source_kinds.iter()).collect::<BTreeSet<_>>(), "dependencies":dependencies,"rustBytes":rust_bytes,"facade":index==facade_package,"contractSignature":contracts[index],"catalogSignature":signature}));
        if index == facade_package {
            facade = Some(generated);
            facade_dependencies = dependencies;
        } else {
            packages.push(GeneratedPackage {
                name: names[index].clone(),
                generated,
                package_dependencies: dependencies,
                rust_bytes,
            });
        }
    }
    let layout_manifest = serde_json::to_vec_pretty(
        &serde_json::json!({"format":"nkdk-aot-layout/1", "catalogSignature":signature,
        "packages":manifest,"facadeDependencies":facade_dependencies}),
    )
    .map_err(|error| error.to_string())?;
    Ok(GeneratedSharedCatalog {
        packages,
        facade: facade.unwrap(),
        catalog_signature: signature.into(),
        layout_manifest,
    })
}

fn export_visibility(source: String) -> Result<String, String> {
    super::visibility::inline_small_public_functions(
        super::visibility::cache_static_names(super::visibility::change(
            super::visibility::change(source, "super", "")?,
            "crate",
            "",
        )?)?,
        160,
    )
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn facade_recursion_remains_one_indivisible_compilation_unit() {
        let mut graph = UnitGraph::default();
        graph
            .insert(GeneratedUnit::example(
                "facade",
                &["facade", "entry"],
                &["helper"],
                "pub fn entry()->usize { helper() }\n",
            ))
            .unwrap();
        graph
            .insert(GeneratedUnit::example(
                "helper",
                &["helper"],
                &["entry"],
                "pub fn helper()->usize { crate::entry() }\n",
            ))
            .unwrap();
        let original = GeneratedSources {
            files: vec![],
            dependencies: vec![],
            sizes: vec![],
            definition_count: 2,
            connection_count: 2,
        };
        let generated = emit(graph, original, "test-signature", 16 * 1024 * 1024).unwrap();
        assert!(
            generated.packages.is_empty(),
            "The facade's recursive component cannot be split into mutually dependent Cargo packages"
        );
        let code = std::str::from_utf8(&generated.facade.files[0].contents).unwrap();
        assert!(code.contains("pub fn entry()"));
        assert!(code.contains("pub fn helper()"));
        let layout: serde_json::Value = serde_json::from_slice(&generated.layout_manifest).unwrap();
        assert!(layout["facadeDependencies"].as_array().unwrap().is_empty());
        assert_eq!(layout["packages"][0]["units"].as_array().unwrap().len(), 2);
    }
}
