#[path = "../../../build-support/production.rs"]
#[allow(dead_code)]
mod production;
mod support;
use nkdk_rule_compiler::{SharedCatalogOptions, SourceFile, compile_shared_catalog};

#[test]
fn production_selection_keeps_one_source_universe_for_shared_entry_ids() {
    std::thread::Builder::new()
        .stack_size(16 * 1024 * 1024)
        .spawn(|| {
            let workspace = std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join("../..");
            let selected = production::select(&workspace, false, production::Group::Bodies5);
            let primary = production::select(&workspace, false, production::Group::Primary);
            let facts = production::select(&workspace, false, production::Group::Secondary2);
            assert_eq!(selected.sources, primary.sources);
            assert_eq!(selected.max_rust_bytes, 16 * 1024 * 1024);
            assert!(
                selected
                    .exports
                    .contains("working.settings-parameters-field")
            );
            assert!(
                !primary
                    .exports
                    .contains("working.settings-parameters-field")
            );
            assert!(!selected.exports.contains("metadata.style-item-type-facts"));
            assert!(facts.exports.contains("metadata.style-item-type-facts"));
            assert_eq!(selected.sources, facts.sources);
            assert!(selected.exports.is_disjoint(&primary.exports));
        })
        .unwrap()
        .join()
        .unwrap();
}

#[test]
fn shared_catalog_runs_recursive_values_through_static_packages() {
    let base = recursive_sources();
    let other = std::str::from_utf8(base[2].bytes)
        .unwrap()
        .replace("applied.tree", "applied.other")
        .replace("path: [Root]", "path: [Other]");
    let mut sources = base.into_iter().collect::<Vec<_>>();
    sources.push(SourceFile {
        path: "other.yaml",
        bytes: other.as_bytes(),
    });
    let generated = compile_shared_catalog(
        &sources,
        |module| matches!(module.id.as_str(), "applied.tree" | "applied.other"),
        SharedCatalogOptions {
            max_rust_bytes: 16 * 1024 * 1024,
        },
    )
    .unwrap();
    assert!(!generated.packages.is_empty());
    assert!(
        generated
            .packages
            .iter()
            .all(|p| p.rust_bytes <= 16 * 1024 * 1024)
    );
    support::shared_catalog::run(
        "shared-recursive",
        generated,
        r#"
        for name in ["applied.tree", "applied.other"] {
        let entry = rules::entry_id(name).unwrap();
        let inputs = rules::PreparedInputs::default();
        let root = if name == "applied.tree" { "Root" } else { "Other" };
        let xml = format!("<{root}><Name>parent</Name><Item><Name>child</Name></Item></{root}>").into_bytes();
        let yaml = "Корень:\n  Имя: parent\n  Дети:\n    -\n      Имя: child\n      Дети: []".as_bytes();
        let forward = rules::convert_file(entry, rules::Direction::XmlToYaml, &xml, &inputs).unwrap();
        assert_eq!(forward.bytes, yaml);
        let reverse = rules::convert_file(entry, rules::Direction::YamlToXml, yaml, &inputs).unwrap();
        rules::verify_candidate(entry, &xml, yaml, &inputs).unwrap();
        assert!(reverse.diagnostics.is_empty());
        let invalid = format!("<{root}><Name>parent</Name><Item><Name>child</Name><Unknown>keep</Unknown></Item></{root}>").into_bytes();
        let preserved = rules::convert_file(entry, rules::Direction::XmlToYaml, &invalid, &inputs).unwrap();
        assert!(String::from_utf8_lossy(&preserved.bytes).contains("!xml"));
        rules::verify_candidate(entry, &invalid, &preserved.bytes, &inputs).unwrap();
        }
    "#,
    );
}

fn recursive_sources() -> [SourceFile<'static>; 3] {
    [
        SourceFile {
            path: "node.yaml",
            bytes: include_bytes!("fixtures/recursive-node.yaml"),
        },
        SourceFile {
            path: "nodes.yaml",
            bytes: include_bytes!("fixtures/recursive-nodes.yaml"),
        },
        SourceFile {
            path: "owner.yaml",
            bytes: include_bytes!("fixtures/recursive-owner.yaml"),
        },
    ]
}

#[test]
fn shared_catalog_keeps_common_files_when_a_consumer_is_renamed() {
    for parameterized in [false, true] {
        let node = format!(
            "{}{}",
            include_str!("fixtures/recursive-node.yaml"),
            if parameterized {
                "\nparameters:\n  flag: {type: {kind: scalar, scalar: boolean}, default: false}\n"
            } else {
                ""
            }
        );
        let mut sources = recursive_sources();
        sources[0].bytes = node.as_bytes();
        let options = || SharedCatalogOptions {
            max_rust_bytes: 16 * 1024 * 1024,
        };
        let before =
            compile_shared_catalog(&sources, |module| module.id == "applied.tree", options())
                .unwrap();
        let reordered = sources
            .iter()
            .rev()
            .map(|source| SourceFile {
                path: source.path,
                bytes: source.bytes,
            })
            .collect::<Vec<_>>();
        let repeated =
            compile_shared_catalog(&reordered, |module| module.id == "applied.tree", options())
                .unwrap();
        assert_eq!(before.layout_manifest, repeated.layout_manifest);
        assert!(before.facade.files == repeated.facade.files);
        for (left, right) in before.packages.iter().zip(&repeated.packages) {
            assert!(left.generated.files == right.generated.files);
        }
        let revised_node = node.replace("key: Имя", "key: Название");
        let mut revised_sources = recursive_sources();
        revised_sources[0].bytes = revised_node.as_bytes();
        let revised = compile_shared_catalog(
            &revised_sources,
            |module| module.id == "applied.tree",
            options(),
        )
        .unwrap();
        assert_ne!(before.catalog_signature, revised.catalog_signature);
        assert_ne!(before.layout_manifest, revised.layout_manifest);
        assert!(before.facade.files != revised.facade.files);
        assert!(before.packages.iter().any(|package| {
            !revised
                .packages
                .iter()
                .any(|other| other.name == package.name)
        }));
        let owner = std::str::from_utf8(sources[2].bytes)
            .unwrap()
            .replace("applied.tree", "applied.renamed");
        let mut changed = sources;
        changed[2].bytes = owner.as_bytes();
        let after =
            compile_shared_catalog(&changed, |module| module.id == "applied.renamed", options())
                .unwrap();
        let mut added = recursive_sources().into_iter().collect::<Vec<_>>();
        added[0].bytes = node.as_bytes();
        let added_owner = owner.replace("path: [Root]", "path: [Other]");
        added.push(SourceFile {
            path: "new-consumer.yaml",
            bytes: added_owner.as_bytes(),
        });
        let extended = compile_shared_catalog(
            &added,
            |module| module.id.starts_with("applied."),
            options(),
        )
        .unwrap();
        assert_common_packages_unchanged(&before, &extended);
        assert_ne!(before.catalog_signature, after.catalog_signature);
        assert_eq!(before.packages.len(), after.packages.len());
        for (left, right) in before.packages.iter().zip(&after.packages) {
            assert_eq!(left.name, right.name);
            assert!(
                left.generated.files == right.generated.files,
                "common package changed: {}",
                left.name
            );
        }
    }
    let pair = include_bytes!("fixtures/text-pattern.yaml");
    let owner = include_bytes!("fixtures/text-pattern-owner.yaml");
    let sources = [
        SourceFile {
            path: "pair.yaml",
            bytes: pair,
        },
        SourceFile {
            path: "pair-owner.yaml",
            bytes: owner,
        },
    ];
    let options = || SharedCatalogOptions {
        max_rust_bytes: 16 * 1024 * 1024,
    };
    let before = compile_shared_catalog(
        &sources,
        |module| module.id == "test.text-pattern",
        options(),
    )
    .unwrap();
    let new_pair = std::str::from_utf8(pair)
        .unwrap()
        .replace("common.text-pair", "common.new-pair")
        .replace("'::'", "'~'");
    let new_owner = std::str::from_utf8(owner)
        .unwrap()
        .replace("test.text-pattern", "test.new-pattern")
        .replace("common.text-pair", "common.new-pair")
        .replace("[Root, Pair]", "[Other, Pair]");
    let added = [
        SourceFile {
            path: "pair.yaml",
            bytes: pair,
        },
        SourceFile {
            path: "pair-owner.yaml",
            bytes: owner,
        },
        SourceFile {
            path: "new-pair.yaml",
            bytes: new_pair.as_bytes(),
        },
        SourceFile {
            path: "new-pair-owner.yaml",
            bytes: new_owner.as_bytes(),
        },
    ];
    let after =
        compile_shared_catalog(&added, |module| module.id.starts_with("test."), options()).unwrap();
    assert_common_packages_unchanged(&before, &after);
}

fn assert_common_packages_unchanged(
    before: &nkdk_rule_compiler::GeneratedSharedCatalog,
    after: &nkdk_rule_compiler::GeneratedSharedCatalog,
) {
    let manifest: serde_json::Value = serde_json::from_slice(&before.layout_manifest).unwrap();
    for package in &before.packages {
        let row = manifest["packages"]
            .as_array()
            .unwrap()
            .iter()
            .find(|row| row["package"] == package.name)
            .unwrap();
        // Owner bodies are consumers, not common modules. Public object IDs
        // may shift when another object is inserted into the same universe.
        if row["sourceKinds"] == serde_json::json!(["Object"]) {
            continue;
        }
        let counterpart = after
            .packages
            .iter()
            .find(|other| other.name == package.name)
            .expect("shared package survives another consumer");
        assert!(
            package.generated.files == counterpart.generated.files,
            "shared module changed when a consumer was added"
        );
    }
}

#[test]
fn shared_catalog_rejects_foreign_package_signature_at_compilation() {
    let generated = compile_shared_catalog(
        &recursive_sources(),
        |module| module.id == "applied.tree",
        SharedCatalogOptions {
            max_rust_bytes: 16 * 1024 * 1024,
        },
    )
    .unwrap();
    support::shared_catalog::reject_mixed("shared-signature", generated);
}
