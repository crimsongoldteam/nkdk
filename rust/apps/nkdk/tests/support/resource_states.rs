use super::resource_names::snapshot_document;
use super::*;
#[path = "../../../../crates/compiled-rules/tests/support/fact_budget.rs"]
mod fact_budget;
use fact_budget::fact_budget;
fn file_fact_source<'a>(
    snapshot: &'a nkdk::route::OwnedSnapshot,
    component: &str,
    owner: &str,
) -> nkdk::facts::Source<'a> {
    let inputs = serde_json::json!({"component":component,"owner":owner});
    nkdk::facts::Source {
        entry: snapshot.entry,
        direction: nkdk_conversion_core::Direction::YamlToXml,
        bytes: &snapshot.bytes,
        inputs: nkdk_compiled_rules::read_inputs(snapshot.entry, inputs.to_string().as_bytes())
            .unwrap(),
    }
}
fn prepare_file_facts<'a>(
    sources: Vec<nkdk::facts::Source<'a>>,
    consumers: &[nkdk_conversion_core::EntryId],
) -> nkdk::facts::PreparedFacts<'a> {
    nkdk::facts::prepare(
        sources,
        consumers,
        nkdk_conversion_core::facts::Generation(1),
        fact_budget(100, 10000, 100),
        1000,
    )
    .unwrap_or_else(|errors| panic!("{errors:?}"))
}
fn xml_meaning(bytes: &[u8]) -> Vec<String> {
    let mut events = Vec::new();
    nkdk_conversion_core::xml::visit(bytes, |path, token| {
        let route = path
            .iter()
            .map(|name| format!("{{{}}}{}", name.namespace, name.local))
            .collect::<Vec<_>>()
            .join("/");
        match token {
            nkdk_conversion_core::xml::Token::Start(_) => events.push(format!("start:{route}")),
            nkdk_conversion_core::xml::Token::End => events.push(format!("end:{route}")),
            nkdk_conversion_core::xml::Token::Attribute(attribute) => events.push(format!(
                "attribute:{route}:{{{}}}{}={}",
                attribute.name.namespace, attribute.name.local, attribute.text
            )),
            nkdk_conversion_core::xml::Token::Text(text)
                if !nkdk_conversion_core::xml::is_whitespace(text) =>
            {
                events.push(format!("text:{route}:{text}"))
            }
            _ => {}
        }
        Ok(())
    })
    .unwrap();
    events
}
#[test]
fn resource_presence_facts_use_paired_paths_and_fresh_empty_file_presence() {
    let root = Temp(std::env::temp_dir().join(format!("nkdk-presence-{}", std::process::id())));
    fs::create_dir_all(root.0.join("Ext")).unwrap();
    // Paths come from the same reviewed source-registration generator as owners.
    let profiles: serde_json::Value = serde_json::from_str(include_str!(
        "../../../../../tests/migration/resource-facts-profiles.json"
    ))
    .unwrap();
    let source = &profiles["owners"]
        .as_array()
        .unwrap()
        .iter()
        .find(|row| row["symbol"] == "MetadataXDTOPackageRules")
        .unwrap()["sources"][0];
    let specification = |source: &serde_json::Value| {
        let source =
            yaml_rust2::YamlLoader::load_from_str(&serde_json::to_string_pretty(source).unwrap())
                .unwrap()
                .remove(0);
        let mut text = String::new();
        yaml_rust2::YamlEmitter::new(&mut text)
            .dump(&source)
            .unwrap();
        let text = text
            .trim_start_matches("---\n")
            .lines()
            .enumerate()
            .map(|(index, line)| format!("{}{line}\n", if index == 0 { "  - " } else { "    " }))
            .collect::<String>();
        format!(
            "format: nkdk-operation-routes/1\nroutes:\n- xmlDir: Inputs\n  yamlDir: Outputs\n  yamlFile: Свойства.yaml\n  owners: {{cf: migration.resource-presence-source}}\n  inputs: {{}}\n  sources:\n{text}"
        )
    };
    let catalog = nkdk::route::Catalog::parse(&specification(source)).unwrap();
    let context = nkdk::route::Context {
        component: "cf",
        parent: "",
        default_language: "ru",
        registered_languages: &["ru"],
        compatibility_mode: "DontUse",
    };
    let capture = || {
        catalog
            .capture_with_resources(
                std::path::Path::new("Inputs/example.xml"),
                b"",
                &context,
                Some(&root.0),
            )
            .unwrap()
            .unwrap()
    };
    let present = |snapshots: &[nkdk::route::OwnedSnapshot]| {
        let bytes = &snapshots[0].bytes;
        let document = snapshot_document(snapshots);
        assert_eq!(document["files"][0]["name"].as_str(), Some("package"));
        // The adapter produces ordinary values accepted by the AOT declaration.
        let inputs = nkdk_compiled_rules::prepare_inputs(snapshots[0].entry, vec![]).unwrap();
        nkdk_compiled_rules::convert_file(
            snapshots[0].entry,
            nkdk_conversion_core::Direction::YamlToXml,
            bytes,
            &inputs,
        )
        .unwrap();
        document["files"][0]["present"].as_str().unwrap() == "true"
    };
    let mut fresh = catalog
        .materialize_sources(
            std::path::Path::new("Outputs/example/Свойства.yaml"),
            &context,
            "seed",
            None,
        )
        .unwrap();
    catalog
        .refresh_resource_facts(
            std::path::Path::new("Outputs/example/Свойства.yaml"),
            &context,
            &root.0,
            &mut fresh,
        )
        .unwrap();
    assert!(
        !present(&fresh),
        "New owners use the same resource discovery"
    );
    assert!(!present(&capture()));
    fs::write(root.0.join("Ext/Package.bin"), b"").unwrap();
    let mut snapshots = capture();
    assert!(present(&snapshots));
    let mut fingerprint_source = source.clone();
    fingerprint_source["entry"] = serde_json::json!("migration.resource-fingerprint-source");
    fingerprint_source["inputs"] =
        serde_json::json!({"component":"component","owner":{"literal":"owner-id"}});
    fingerprint_source["factDirections"] = serde_json::json!(["yaml-to-xml"]);
    fingerprint_source["resourcePresence"]["fingerprint"] = serde_json::json!({"maxBytes": 131072});
    let fingerprint_catalog =
        nkdk::route::Catalog::parse(&specification(&fingerprint_source)).unwrap();
    let fingerprint = || {
        fingerprint_catalog
            .capture_with_resources(
                std::path::Path::new("Inputs/example.xml"),
                b"",
                &context,
                Some(&root.0),
            )
            .unwrap()
            .unwrap()
    };
    let empty_fingerprint = fingerprint();
    assert_eq!(
        snapshot_document(&empty_fingerprint)["files"][0]["present"].as_str(),
        Some("true")
    );
    assert_eq!(
        snapshot_document(&empty_fingerprint)["files"][0]["fingerprint"].as_str(),
        Some("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855")
    );
    let prepared = prepare_file_facts(
        vec![file_fact_source(&empty_fingerprint[0], "cf", "owner-id")],
        &[],
    );
    let index = nkdk_compiled_rules::fact_id("metadata.resource-fingerprints").unwrap();
    let columns = prepared.facts.key_fields(index).unwrap().unwrap();
    let key = columns
        .iter()
        .map(|column| match *column {
            "component" => "cf",
            "owner" => "owner-id",
            "property" => "package",
            _ => panic!("Unexpected key"),
        })
        .collect::<Vec<_>>();
    assert_eq!(
        prepared
            .facts
            .lookup_parts(nkdk_conversion_core::facts::Generation(1), index, &key),
        nkdk_conversion_core::facts::FactState::Ready(
            "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
        )
    );
    fs::write(root.0.join("Ext/Package.bin"), b"abc").unwrap();
    assert_eq!(
        snapshot_document(&fingerprint())["files"][0]["fingerprint"].as_str(),
        Some("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad")
    );
    let identity_routes = nkdk::route::Catalog::parse(include_str!(
        "../../../../../rust/target/resource-boundary-check/fingerprint-route.json"
    ))
    .unwrap();
    let actual_owner_xml = include_bytes!(
        "../../../../../e2e/fixtures/xml/cfe/all-extension/XDTOPackages/ПакетXDTOВсеСвойства.xml"
    );
    let captured_identity = identity_routes
        .capture_with_resources(
            std::path::Path::new("Inputs/original.xml"),
            actual_owner_xml,
            &context,
            Some(&root.0),
        )
        .unwrap()
        .unwrap();
    let identity_entry = captured_identity[0].entry;
    let mut generated_ids = Vec::new();
    let identity_seed = "01".repeat(32);
    for (component, parent) in [
        ("cf", "parent-a"),
        ("cf", "parent-b"),
        ("cfe/demo", "parent-a"),
        ("cf", ""),
    ] {
        let values = serde_json::json!({"component":component,"owner":parent,"ownerName":"Новый","identitySeed":identity_seed});
        let inputs =
            nkdk_compiled_rules::read_inputs(identity_entry, values.to_string().as_bytes())
                .unwrap();
        let materialized =
            nkdk_compiled_rules::materialize_fact_source(identity_entry, b"{}", &inputs).unwrap();
        let document =
            yaml_rust2::YamlLoader::load_from_str(std::str::from_utf8(&materialized).unwrap())
                .unwrap()
                .remove(0);
        assert_eq!(document["name"].as_str(), Some("Новый"));
        let expected = nkdk_conversion_core::facts::identity::derive(
            &identity_seed,
            "uuid",
            nkdk_conversion_core::facts::identity::IdentityFormat::Uuid,
            &[
                component,
                &format!("owner:{parent}"),
                "XDTOPackage",
                "Новый",
            ],
        )
        .unwrap();
        assert_eq!(document["uuid"].as_str(), Some(expected.as_str()));
        assert_eq!(
            nkdk_compiled_rules::materialize_fact_source(identity_entry, b"{}", &inputs).unwrap(),
            materialized
        );
        // A supplied YAML name, rather than its directory fallback, owns the identity.
        let named = nkdk_compiled_rules::materialize_fact_source(
            identity_entry,
            b"name: Actual\n",
            &inputs,
        )
        .unwrap();
        let named = yaml_rust2::YamlLoader::load_from_str(std::str::from_utf8(&named).unwrap())
            .unwrap()
            .remove(0);
        let actual = nkdk_conversion_core::facts::identity::derive(
            &identity_seed,
            "uuid",
            nkdk_conversion_core::facts::identity::IdentityFormat::Uuid,
            &[
                component,
                &format!("owner:{parent}"),
                "XDTOPackage",
                "Actual",
            ],
        )
        .unwrap();
        assert_eq!(named["uuid"].as_str(), Some(actual.as_str()));
        assert_ne!(actual, expected);
        generated_ids.push(expected);
    }
    assert_eq!(
        generated_ids
            .iter()
            .collect::<std::collections::BTreeSet<_>>()
            .len(),
        4
    );
    let borrowed_identity = captured_identity
        .iter()
        .map(nkdk::route::OwnedSnapshot::borrow)
        .collect::<Vec<_>>();
    for name in ["original", "renamed"] {
        let path = std::path::PathBuf::from(format!("Outputs/{name}/Свойства.yaml"));
        let resolved = identity_routes
            .resolve_with_snapshots(
                &path,
                nkdk_conversion_core::Direction::YamlToXml,
                nkdk::route::Material::Yaml {
                    owner: b"{}",
                    snapshots: &borrowed_identity,
                    new_owner: false,
                },
                &context,
                &borrowed_identity,
            )
            .unwrap()
            .unwrap();
        let facts = prepare_file_facts(resolved.sources, &[]);
        assert_eq!(
            facts.facts.lookup_parts(
                nkdk_conversion_core::facts::Generation(1),
                index,
                &["cf", "545625c6-9220-4723-984b-4a5f36fac84f", "package"]
            ),
            nkdk_conversion_core::facts::FactState::Ready(
                "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"
            ),
            "Resource identity must come from the real UUID snapshot, independently of {name}"
        );
    }
    fs::create_dir_all(root.0.join("Outputs/original")).unwrap();
    fs::write(root.0.join("Outputs/original/Свойства.yaml"), b"{}").unwrap();
    identity_routes
        .save_snapshots(
            &root.0,
            std::path::Path::new("Outputs/original/Свойства.yaml"),
            "cf",
            &captured_identity,
        )
        .unwrap();
    for snapshot_binding in [true, false] {
        let mut specification: serde_json::Value = serde_json::from_str(include_str!(
            "../../../../../rust/target/resource-boundary-check/fingerprint-route.json"
        ))
        .unwrap();
        if !snapshot_binding {
            // Discovery is still required when no input asks to load an owner snapshot.
            specification["factRoutes"][0]["inputs"]["owner"] = serde_json::json!({
                "literal":"545625c6-9220-4723-984b-4a5f36fac84f"
            });
        }
        let external_routes = nkdk::route::Catalog::parse(&specification.to_string()).unwrap();
        for (contents, expected) in [
            (
                Some(&b""[..]),
                nkdk_conversion_core::facts::FactState::Ready(
                    "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
                ),
            ),
            (
                Some(&b"abc"[..]),
                nkdk_conversion_core::facts::FactState::Ready(
                    "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
                ),
            ),
            (None, nkdk_conversion_core::facts::FactState::Missing),
        ] {
            let file = root.0.join("Outputs/original/Package.bin");
            match contents {
                Some(bytes) => fs::write(&file, bytes).unwrap(),
                None => fs::remove_file(&file).unwrap(),
            };
            let mut external = external_routes
                .external_base_sources(&root.0, &context)
                .unwrap();
            assert_eq!(external.len(), 1);
            let source = &mut external[0];
            let facts = prepare_file_facts(
                vec![nkdk::facts::Source {
                    entry: source.entry,
                    direction: nkdk_conversion_core::Direction::YamlToXml,
                    bytes: &source.bytes,
                    inputs: std::mem::take(&mut source.inputs),
                }],
                &[],
            );
            assert_eq!(
                facts.facts.lookup_parts(
                    nkdk_conversion_core::facts::Generation(1),
                    index,
                    &["cf", "545625c6-9220-4723-984b-4a5f36fac84f", "package"]
                ),
                expected,
                "Base file facts must use current resources, not primary YAML or an old fingerprint"
            );
        }
    }
    let file_routes = nkdk::route::Catalog::parse(include_str!(
        "../../../../../rust/target/resource-boundary-check/file-operation-route.json"
    ))
    .unwrap();
    let operation = root.0.join("operation");
    let xml_root = operation.join("xml");
    let yaml_root = operation.join("yaml");
    fs::create_dir_all(xml_root.join("Inputs/Original/Ext")).unwrap();
    let original_xml =
        include_str!("../../../../../e2e/fixtures/xml/cf/XDTOPackages/ПакетXDTOВсеСвойства.xml")
            .replace("ПакетXDTOВсеСвойства", "Original")
            .replace(
                "70d80fbc-fade-411f-b1bd-5058df6b4362",
                "545625c6-9220-4723-984b-4a5f36fac84f",
            );
    fs::write(xml_root.join("Inputs/Original.xml"), &original_xml).unwrap();
    fs::write(xml_root.join("Inputs/Original/Ext/Package.bin"), b"abc").unwrap();
    let run = |source: &std::path::Path,
               target: &std::path::Path,
               direction,
               component: &str,
               base: Option<&std::path::Path>| {
        nkdk::project::convert_component_with_catalog(
            &file_routes,
            nkdk::project::Request {
                source_root: source,
                target_root: target,
                base_component_root: base,
                temporary_parent: &operation,
                context: nkdk::route::Context {
                    component,
                    compatibility_mode: "Version8_3_27",
                    ..context
                },
                generation: nkdk_conversion_core::facts::Generation(1),
                direction,
                fact_budget: fact_budget(1000, 1000000, 1000),
                edge_budget: 10000,
                limits: FILE_LIMITS,
                xml_bytes: 100000,
            },
        )
        .unwrap_or_else(|errors| panic!("{errors:?}"))
    };
    assert_eq!(
        run(
            &xml_root,
            &yaml_root,
            nkdk_conversion_core::Direction::XmlToYaml,
            "cf",
            None
        )
        .outputs
        .len(),
        1
    );
    assert_eq!(
        fs::read(yaml_root.join("Outputs/Original/Package.bin")).unwrap(),
        b"abc"
    );
    fs::write(yaml_root.join("Outputs/Original/Package.bin"), b"").unwrap();
    fs::create_dir_all(yaml_root.join("Outputs/New")).unwrap();
    fs::write(
        yaml_root.join("Outputs/New/Свойства.yaml"),
        "ПространствоИмен: urn://new\n",
    )
    .unwrap();
    fs::write(yaml_root.join("Outputs/New/Package.bin"), b"new").unwrap();
    let mut new_uuid = None;
    for target_name in ["first", "second"] {
        let existing_bytes: &[u8] = if target_name == "first" {
            b""
        } else {
            b"changed"
        };
        let new_bytes: &[u8] = if target_name == "first" {
            b"new"
        } else {
            b"updated"
        };
        fs::write(
            yaml_root.join("Outputs/Original/Package.bin"),
            existing_bytes,
        )
        .unwrap();
        fs::write(yaml_root.join("Outputs/New/Package.bin"), new_bytes).unwrap();
        let target = operation.join(target_name);
        assert_eq!(
            run(
                &yaml_root,
                &target,
                nkdk_conversion_core::Direction::YamlToXml,
                "cf",
                None
            )
            .outputs
            .len(),
            2
        );
        assert_eq!(
            fs::read(target.join("Inputs/Original/Ext/Package.bin")).unwrap(),
            existing_bytes
        );
        assert_eq!(
            fs::read(target.join("Inputs/New/Ext/Package.bin")).unwrap(),
            new_bytes
        );
        assert!(
            fs::read_to_string(target.join("Inputs/Original.xml"))
                .unwrap()
                .contains("545625c6-9220-4723-984b-4a5f36fac84f")
        );
        assert_eq!(
            xml_meaning(&fs::read(target.join("Inputs/Original.xml")).unwrap()),
            xml_meaning(original_xml.as_bytes()),
            "Full file export must preserve every ordinary property"
        );
        let snapshots = file_routes
            .load_snapshots(
                &yaml_root,
                std::path::Path::new("Outputs/New/Свойства.yaml"),
                "cf",
            )
            .unwrap();
        let document = snapshot_document(&snapshots);
        let uuid = document["uuid"].as_str().unwrap();
        assert_eq!(uuid.len(), 36);
        let xml = fs::read_to_string(target.join("Inputs/New.xml")).unwrap();
        assert!(
            xml.contains(uuid),
            "The owner must reuse its newly prepared identity snapshot"
        );
        if let Some(previous) = &new_uuid {
            assert_eq!(uuid, previous);
        } else {
            new_uuid = Some(uuid.to_owned());
        }
    }
    // Exercise the same generated route with an unmodified adopted e2e fixture.
    let base_xml = operation.join("base-xml");
    let base_yaml = operation.join("base-yaml");
    let extension_xml = operation.join("extension-xml");
    let extension_yaml = operation.join("extension-yaml");
    let extension_output = operation.join("extension-output");
    let object_name = "ПакетXDTOВсеСвойства";
    let fixture = include_bytes!(
        "../../../../../e2e/fixtures/xml/cfe/all-extension/XDTOPackages/ПакетXDTOВсеСвойства.xml"
    );
    let base_cases: [(&str, &[u8]); 2] = [
        (
            object_name,
            include_bytes!(
                "../../../../../e2e/fixtures/xml/cf/XDTOPackages/ПакетXDTOВсеСвойства.xml"
            ),
        ),
        (
            "ПакетXDTOПоУмолчанию",
            include_bytes!(
                "../../../../../e2e/fixtures/xml/cf/XDTOPackages/ПакетXDTOПоУмолчанию.xml"
            ),
        ),
    ];
    let extension_cases: [(&str, &[u8]); 4] = [
        (object_name, fixture),
        (
            "ПакетXDTOПоУмолчанию",
            include_bytes!(
                "../../../../../e2e/fixtures/xml/cfe/all-extension/XDTOPackages/ПакетXDTOПоУмолчанию.xml"
            ),
        ),
        (
            "ПакетXDTOВсеСвойстваExt",
            include_bytes!(
                "../../../../../e2e/fixtures/xml/cfe/all-extension/XDTOPackages/ПакетXDTOВсеСвойстваExt.xml"
            ),
        ),
        (
            "ПакетXDTOПоУмолчаниюExt",
            include_bytes!(
                "../../../../../e2e/fixtures/xml/cfe/all-extension/XDTOPackages/ПакетXDTOПоУмолчаниюExt.xml"
            ),
        ),
    ];
    for (directory, cases) in [
        (&base_xml, base_cases.as_slice()),
        (&extension_xml, extension_cases.as_slice()),
    ] {
        for (name, bytes) in cases {
            fs::create_dir_all(directory.join("Inputs").join(name).join("Ext")).unwrap();
            fs::write(directory.join("Inputs").join(format!("{name}.xml")), bytes).unwrap();
            fs::write(
                directory.join("Inputs").join(name).join("Ext/Package.bin"),
                b"same",
            )
            .unwrap();
        }
    }
    run(
        &base_xml,
        &base_yaml,
        nkdk_conversion_core::Direction::XmlToYaml,
        "cf",
        None,
    );
    run(
        &extension_xml,
        &extension_yaml,
        nkdk_conversion_core::Direction::XmlToYaml,
        "cfe",
        Some(&base_yaml),
    );
    let extension_text = fs::read_to_string(
        extension_yaml
            .join("Outputs")
            .join(object_name)
            .join("Свойства.yaml"),
    )
    .unwrap();
    assert!(
        extension_text.contains("ПространствоИмен: !изменять urn://test"),
        "{extension_text}"
    );
    run(
        &extension_yaml,
        &extension_output,
        nkdk_conversion_core::Direction::YamlToXml,
        "cfe",
        Some(&base_yaml),
    );
    let base_output = operation.join("base-output");
    run(
        &base_yaml,
        &base_output,
        nkdk_conversion_core::Direction::YamlToXml,
        "cf",
        None,
    );
    for (directory, cases) in [
        (&base_output, base_cases.as_slice()),
        (&extension_output, extension_cases.as_slice()),
    ] {
        for (name, bytes) in cases {
            assert_eq!(
                xml_meaning(
                    &fs::read(directory.join("Inputs").join(format!("{name}.xml"))).unwrap()
                ),
                xml_meaning(bytes),
                "Full file round-trip must retain all fields and states: {name}"
            );
            assert_eq!(
                fs::read(directory.join("Inputs").join(name).join("Ext/Package.bin")).unwrap(),
                b"same"
            );
        }
    }
    let changed_fingerprint = fingerprint();
    let comparison_entry =
        nkdk_compiled_rules::entry_id("migration.resource-state-comparison").unwrap();
    let context_inputs = nkdk_compiled_rules::read_inputs(
        comparison_entry,
        br#"{
        "component":"cfe/demo","owner":"extension-id","baseComponent":"cf","baseOwner":"base-id",
        "active":true,"basePropertyExists":true
    }"#,
    )
    .unwrap();
    let mut prepared = prepare_file_facts(
        [
            (&empty_fingerprint[0], "cf", "base-id"),
            (&changed_fingerprint[0], "cfe/demo", "extension-id"),
        ]
        .into_iter()
        .map(|(snapshot, component, owner)| file_fact_source(snapshot, component, owner))
        .chain(std::iter::once(nkdk::facts::Source {
            entry: comparison_entry,
            direction: nkdk_conversion_core::Direction::YamlToXml,
            bytes: b"property: package\nmode: extend\n",
            inputs: context_inputs,
        }))
        .collect(),
        &[comparison_entry],
    );
    let comparison_inputs = prepared.sources.pop().unwrap().inputs;
    for (mode, expected) in [
        ("extend", None),
        ("xml", None),
        (
            "control",
            Some((
                "state.resource.changed",
                nkdk_conversion_core::Severity::Error,
            )),
        ),
        (
            "notify",
            Some((
                "state.resource.changed",
                nkdk_conversion_core::Severity::Warning,
            )),
        ),
    ] {
        let issues = nkdk_compiled_rules::validate_file(
            comparison_entry,
            format!("property: package\nmode: {mode}\n").as_bytes(),
            &comparison_inputs,
        );
        let actual = issues
            .iter()
            .map(|issue| (issue.code.as_deref().unwrap(), issue.severity))
            .collect::<Vec<_>>();
        assert_eq!(
            actual,
            expected.into_iter().collect::<Vec<_>>(),
            "{mode}: {issues:?}"
        );
    }
    for (owner, base_owner, active, base_exists, expected) in [
        ("base-id", "base-id", true, true, None),
        (
            "absent",
            "base-id",
            true,
            true,
            Some("state.resource.missing"),
        ),
        (
            "extension-id",
            "absent",
            true,
            true,
            Some("state.resource.absent-base"),
        ),
        (
            "extension-id",
            "absent",
            true,
            false,
            Some("state.property.absent-base"),
        ),
        ("absent", "absent", false, false, None),
    ] {
        let component = if owner == "base-id" { "cf" } else { "cfe/demo" };
        let values = serde_json::json!({"component": component, "owner":owner,
            "baseComponent":"cf", "baseOwner":base_owner,"active":active,"basePropertyExists":base_exists});
        let inputs =
            nkdk_compiled_rules::read_inputs(comparison_entry, values.to_string().as_bytes())
                .unwrap()
                .with_indexes(
                    nkdk_compiled_rules::prepare_fact_inputs(
                        comparison_entry,
                        prepared.facts.clone(),
                        nkdk_conversion_core::facts::Generation(1),
                        vec![],
                    )
                    .unwrap(),
                )
                .unwrap();
        let issues = nkdk_compiled_rules::validate_file(
            comparison_entry,
            b"property: package\nmode: control\n",
            &inputs,
        );
        assert_eq!(
            issues
                .iter()
                .map(|issue| issue.code.as_deref().unwrap())
                .collect::<Vec<_>>(),
            expected.into_iter().collect::<Vec<_>>(),
            "{owner}/{base_owner}: {issues:?}"
        );
    }
    let resource_owner = nkdk_compiled_rules::entry_id("migration.resource-state-owner-probe")
        .expect(
            "The real source state assembly must execute its automatically mounted resource policy",
        );
    assert_ne!(resource_owner.0, comparison_entry.0);
    let base_source =
        nkdk_compiled_rules::entry_id("migration.resource-state-owner-probe.base-source").unwrap();
    let states_source =
        nkdk_compiled_rules::entry_id("migration.resource-state-owner-probe.states-source")
            .unwrap();
    let fixture = include_bytes!(
        "../../../../../e2e/fixtures/xml/cfe/all-extension/XDTOPackages/ПакетXDTOВсеСвойства.xml"
    );
    let full_owner = nkdk_compiled_rules::entry_id("metadata.xdto-package").unwrap();
    let real_uuid = "545625c6-9220-4723-984b-4a5f36fac84f";
    let context_bytes = serde_json::json!({"component":"cfe/demo","owner":real_uuid}).to_string();
    let parent_bytes = serde_json::json!({"component":"cfe/demo","owner":""}).to_string();
    let facts = prepare_file_facts(
        vec![
            file_fact_source(
                &empty_fingerprint[0],
                "cf",
                "70d80fbc-fade-411f-b1bd-5058df6b4362",
            ),
            file_fact_source(&changed_fingerprint[0], "cfe/demo", real_uuid),
            nkdk::facts::Source {
                entry: base_source,
                direction: nkdk_conversion_core::Direction::XmlToYaml,
                bytes: fixture,
                inputs: nkdk_compiled_rules::read_inputs(base_source, context_bytes.as_bytes())
                    .unwrap(),
            },
            nkdk::facts::Source {
                entry: states_source,
                direction: nkdk_conversion_core::Direction::XmlToYaml,
                bytes: fixture,
                inputs: nkdk_compiled_rules::read_inputs(
                    states_source,
                    serde_json::json!({"owner":real_uuid})
                        .to_string()
                        .as_bytes(),
                )
                .unwrap(),
            },
            nkdk::facts::Source {
                entry: identity_entry,
                direction: nkdk_conversion_core::Direction::XmlToYaml,
                bytes: fixture,
                inputs: nkdk_compiled_rules::read_inputs(identity_entry, parent_bytes.as_bytes())
                    .unwrap(),
            },
        ],
        &[full_owner],
    );
    let values = serde_json::json!({"state_adopted":true,"state_component":"cfe/demo","state_owner":real_uuid,
        "state_compatibilityMode":"Version8_3_27","resource_baseComponent":"cf",
        "ordinary0_ownerName":"ПакетXDTOВсеСвойства","ordinary0_defaultLanguage":"ru","ordinary0_registeredLanguages":["ru","en"],
        "ordinary1_owner":"","ordinary1_kind":"XDTOPackage","ordinary1_name":"ПакетXDTOВсеСвойства"});
    let inputs = nkdk_compiled_rules::read_inputs(full_owner, values.to_string().as_bytes())
        .unwrap()
        .with_indexes(
            nkdk_compiled_rules::prepare_fact_inputs(
                full_owner,
                facts.facts.clone(),
                nkdk_conversion_core::facts::Generation(1),
                vec![],
            )
            .unwrap(),
        )
        .unwrap();
    let imported = nkdk_compiled_rules::convert_file(
        full_owner,
        nkdk_conversion_core::Direction::XmlToYaml,
        fixture,
        &inputs,
    )
    .unwrap();
    let yaml = String::from_utf8(imported.bytes).unwrap();
    assert!(
        yaml.contains("ПространствоИмен: !изменять urn://test"),
        "{yaml}"
    );
    // This fixture's physical property order differs from the declared canonical order.
    // The preservation patch may contain that order, but no lost ordinary values.
    let document = yaml_rust2::YamlLoader::load_from_str(&yaml)
        .unwrap()
        .remove(0);
    let patch = &document["$xml"]["{http://v8.1c.ru/8.3/MDClasses}XDTOPackage"]["{http://v8.1c.ru/8.3/MDClasses}Properties"];
    assert_eq!(patch.as_hash().unwrap().len(), 1, "{yaml}");
    assert!(patch["#order"].as_vec().is_some(), "{yaml}");
    let exported = nkdk_compiled_rules::convert_file(
        full_owner,
        nkdk_conversion_core::Direction::YamlToXml,
        yaml.as_bytes(),
        &inputs,
    )
    .unwrap();
    assert_eq!(
        xml_meaning(&exported.bytes),
        xml_meaning(fixture),
        "The complete fixture must retain values, UUID, state rows and physical order"
    );
    let source_context = br#"{"component":"cfe/demo","owner":"extension-id"}"#;
    for (own_snapshot, yaml, adopted, expected) in [
        (&changed_fingerprint[0], "Изменять: [Пакет]\n", true, None),
        (
            &changed_fingerprint[0],
            "Проверять: [Пакет]\n",
            true,
            Some((
                "state.resource.changed",
                nkdk_conversion_core::Severity::Warning,
            )),
        ),
        (
            &changed_fingerprint[0],
            "{}\n",
            true,
            Some((
                "state.resource.changed",
                nkdk_conversion_core::Severity::Error,
            )),
        ),
        (&changed_fingerprint[0], "{}\n", false, None),
        (&empty_fingerprint[0], "{}\n", true, None),
    ] {
        let bound_files = prepare_file_facts(
            vec![
                file_fact_source(
                    &empty_fingerprint[0],
                    "cf",
                    "70d80fbc-fade-411f-b1bd-5058df6b4362",
                ),
                file_fact_source(own_snapshot, "cfe/demo", "extension-id"),
                nkdk::facts::Source {
                    entry: base_source,
                    direction: nkdk_conversion_core::Direction::XmlToYaml,
                    bytes: fixture,
                    inputs: nkdk_compiled_rules::read_inputs(base_source, source_context).unwrap(),
                },
                nkdk::facts::Source {
                    entry: states_source,
                    direction: nkdk_conversion_core::Direction::XmlToYaml,
                    bytes: fixture,
                    inputs: nkdk_compiled_rules::read_inputs(
                        states_source,
                        br#"{"owner":"extension-id"}"#,
                    )
                    .unwrap(),
                },
            ],
            &[resource_owner],
        );
        let values = serde_json::json!({"state_adopted":adopted,"state_component":"cfe/demo",
            "state_owner":"extension-id","state_compatibilityMode":"Version8_3_27","resource_baseComponent":"cf"});
        let inputs =
            nkdk_compiled_rules::read_inputs(resource_owner, values.to_string().as_bytes())
                .unwrap()
                .with_indexes(
                    nkdk_compiled_rules::prepare_fact_inputs(
                        resource_owner,
                        bound_files.facts.clone(),
                        nkdk_conversion_core::facts::Generation(1),
                        vec![],
                    )
                    .unwrap(),
                )
                .unwrap();
        if adopted && expected.is_none() && yaml.contains("Изменять") {
            let imported = nkdk_compiled_rules::convert_file(
                resource_owner,
                nkdk_conversion_core::Direction::XmlToYaml,
                fixture,
                &inputs,
            )
            .unwrap();
            let projected = String::from_utf8(imported.bytes).unwrap();
            assert!(
                projected.contains("ПространствоИмен: !изменять urn://test"),
                "{projected}"
            );
            assert!(projected.contains("urn://test"), "{projected}");
            for (tag, mode) in [
                ("!изменять", "Extended"),
                ("!проверять", "Notify"),
                ("", ""),
            ] {
                let value = format!("ПространствоИмен: {tag} urn://test\nИзменять: [Пакет]\n");
                let exported = nkdk_compiled_rules::convert_file(
                    resource_owner,
                    nkdk_conversion_core::Direction::YamlToXml,
                    value.as_bytes(),
                    &inputs,
                )
                .unwrap();
                let mut namespace = String::new();
                let mut property = String::new();
                let mut states = Vec::new();
                nkdk_conversion_core::xml::visit(&exported.bytes, |path, token| {
                    if let nkdk_conversion_core::xml::Token::Text(text) = token {
                        let Some(name) = path.last() else {
                            return Ok(());
                        };
                        match (name.namespace.as_str(), name.local.as_str()) {
                            ("http://v8.1c.ru/8.3/MDClasses", "Namespace") => {
                                namespace.push_str(text)
                            }
                            ("http://v8.1c.ru/8.3/xcf/readable", "Property") => {
                                property = text.to_owned()
                            }
                            ("http://v8.1c.ru/8.3/xcf/readable", "State")
                                if property == "Namespace" =>
                            {
                                states.push(text.to_owned())
                            }
                            _ => {}
                        }
                    }
                    Ok(())
                })
                .unwrap();
                assert_eq!(namespace, "urn://test");
                assert_eq!(
                    states,
                    if mode.is_empty() {
                        vec![]
                    } else {
                        vec![mode.to_owned()]
                    }
                );
            }
        }
        let issues = nkdk_compiled_rules::validate_file(resource_owner, yaml.as_bytes(), &inputs);
        assert_eq!(
            issues
                .iter()
                .map(|issue| (issue.code.as_deref().unwrap(), issue.severity))
                .collect::<Vec<_>>(),
            expected.into_iter().collect::<Vec<_>>(),
            "Automatic binding {yaml:?}/{adopted}: {issues:?}"
        );
        let result = nkdk_compiled_rules::convert_file(
            resource_owner,
            nkdk_conversion_core::Direction::YamlToXml,
            yaml.as_bytes(),
            &inputs,
        );
        if expected.is_some_and(|(_, severity)| severity == nkdk_conversion_core::Severity::Error) {
            assert!(
                result.is_err(),
                "An invalid controlled file must report its validation failure"
            );
        } else {
            let xml = String::from_utf8(result.unwrap().bytes).unwrap();
            assert!(
                !xml.contains(">Control<"),
                "Implicit file checks must not synthesize an XML state"
            );
        }
    }

    fs::write(root.0.join("Ext/Package.bin"), vec![b'a'; 131072]).unwrap();
    assert_eq!(
        snapshot_document(&fingerprint())["files"][0]["fingerprint"].as_str(),
        Some("b44ffb72fcc259676bd80495fef1b44b808ca8f1ffe1b1706a4d7911b0e31f11")
    );
    fs::write(root.0.join("Ext/Package.bin"), vec![b'a'; 131073]).unwrap();
    let assert_limit = |catalog: &nkdk::route::Catalog| {
        let error = catalog
            .capture_with_resources(
                std::path::Path::new("Inputs/example.xml"),
                b"",
                &context,
                Some(&root.0),
            )
            .err()
            .expect("Expected a bounded read failure");
        assert_eq!(error.code.as_deref(), Some("resource.limit"));
    };
    assert_limit(&fingerprint_catalog);
    // Presence-only discovery must not read or reject a large opaque file.
    assert!(present(&capture()));
    fs::write(root.0.join("Ext/Package.bin"), b"abc").unwrap();
    fs::write(root.0.join("Ext/Other.bin"), b"abc").unwrap();
    let mut shared_budget_source = fingerprint_source.clone();
    shared_budget_source["resourcePresence"]["fingerprint"]["maxBytes"] = serde_json::json!(5);
    shared_budget_source["resourcePresence"]["paths"]
        .as_array_mut()
        .unwrap()
        .push(serde_json::json!({
            "name":"other", "xml":["Ext","Other.bin"], "yaml":["Other.bin"]
        }));
    let shared_budget_catalog =
        nkdk::route::Catalog::parse(&specification(&shared_budget_source)).unwrap();
    // A shared budget limits the sum, even if each individual file fits.
    assert_limit(&shared_budget_catalog);
    fs::remove_file(root.0.join("Ext/Package.bin")).unwrap();
    let absent_fingerprint = fingerprint();
    assert_eq!(
        snapshot_document(&absent_fingerprint)["files"][0]["present"].as_str(),
        Some("false")
    );
    assert_eq!(
        snapshot_document(&absent_fingerprint)["files"][0]["fingerprint"].as_str(),
        Some("")
    );
    let missing = prepare_file_facts(
        vec![file_fact_source(&absent_fingerprint[0], "cf", "owner-id")],
        &[],
    );
    assert_eq!(
        missing
            .facts
            .lookup_parts(nkdk_conversion_core::facts::Generation(1), index, &key),
        nkdk_conversion_core::facts::FactState::Missing,
        "An absent file must not become an empty fingerprint in the prepared index"
    );
    let registrations = nkdk_compiled_rules::fact_id("metadata.resource-registrations").unwrap();
    assert_eq!(
        missing.facts.lookup_parts(
            nkdk_conversion_core::facts::Generation(1),
            registrations,
            &key
        ),
        nkdk_conversion_core::facts::FactState::Ready("present"),
        "A declared property remains registered even when its file is absent"
    );
    fs::write(root.0.join("Ext/Package.bin"), b"").unwrap();

    let refresh = |snapshots: &mut [nkdk::route::OwnedSnapshot]| {
        catalog.refresh_resource_facts(
            std::path::Path::new("Outputs/example/Свойства.yaml"),
            &context,
            &root.0,
            snapshots,
        )
    };
    // No YAML file exists, even though the retained XML copy still exists.
    refresh(&mut snapshots).unwrap();
    assert!(!present(&snapshots));
    fs::create_dir_all(root.0.join("Outputs/example")).unwrap();
    fs::write(root.0.join("Outputs/example/Package.bin"), b"").unwrap();
    refresh(&mut snapshots).unwrap();
    assert!(present(&snapshots));
    fs::remove_file(root.0.join("Outputs/example/Package.bin")).unwrap();
    refresh(&mut snapshots).unwrap();
    assert!(!present(&snapshots));
    fs::create_dir(root.0.join("Outputs/example/Package.bin")).unwrap();
    refresh(&mut snapshots).unwrap();
    assert!(!present(&snapshots), "A directory is not a file");
    for (field, value) in [
        ("yaml", serde_json::json!(["..", "Package.bin"])),
        ("xml", serde_json::json!([])),
        ("name", serde_json::json!("")),
    ] {
        let mut invalid = source.clone();
        invalid["resourcePresence"]["paths"][0][field] = value;
        assert!(nkdk::route::Catalog::parse(&specification(&invalid)).is_err());
    }
    for maximum in [
        serde_json::json!(-1),
        serde_json::json!("unbounded"),
        serde_json::Value::Null,
    ] {
        let mut invalid = fingerprint_source.clone();
        invalid["resourcePresence"]["fingerprint"]["maxBytes"] = maximum;
        assert!(nkdk::route::Catalog::parse(&specification(&invalid)).is_err());
    }
    let mut ambiguous = source.clone();
    ambiguous["resourceFile"] = serde_json::json!(["Package.bin"]);
    assert!(nkdk::route::Catalog::parse(&specification(&ambiguous)).is_err());
    #[cfg(unix)]
    {
        fs::remove_dir(root.0.join("Outputs/example/Package.bin")).unwrap();
        std::os::unix::fs::symlink(
            std::env::temp_dir(),
            root.0.join("Outputs/example/Package.bin"),
        )
        .unwrap();
        let before = snapshots[0].bytes.clone();
        assert_eq!(
            refresh(&mut snapshots).unwrap_err().code.as_deref(),
            Some("resource.escape")
        );
        assert_eq!(
            snapshots[0].bytes, before,
            "Discovery failure must keep the retained facts intact"
        );
    }
}
