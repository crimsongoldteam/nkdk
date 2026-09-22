use nkdk::facts::{Source, prepare};
use nkdk_compiled_rules::{Direction, convert_file, entry_id, read_inputs};
use nkdk_conversion_core::{
    facts::{Generation, prepared::FactBudget, text::TextBudget},
    resources::Limits,
};

fn operation_budget(bytes: usize) -> FactBudget {
    FactBudget {
        text: TextBudget {
            entries: 100,
            bytes,
        },
        rows: 100,
    }
}

fn operation_limits() -> Limits {
    Limits {
        groups: 16,
        routes: 16,
        path_bytes: 4096,
    }
}

fn expanded_xml_name(namespace: quick_xml::name::ResolveResult<'_>, local: &str) -> String {
    match namespace {
        quick_xml::name::ResolveResult::Bound(namespace) => {
            format!("{{{}}}{local}", namespace.as_ref())
        }
        quick_xml::name::ResolveResult::Unbound => local.into(),
        quick_xml::name::ResolveResult::Unknown(prefix) => {
            panic!("Unbound XML prefix: {prefix}")
        }
    }
}

fn normalized_xml(source: &str) -> Vec<String> {
    use quick_xml::{events::Event, name::QName, reader::NsReader};
    let mut reader = NsReader::from_str(source);
    let mut result = Vec::new();
    loop {
        let event = reader.read_event().unwrap();
        let empty = matches!(&event, Event::Empty(_));
        match event {
            Event::Start(element) | Event::Empty(element) => {
                let (namespace, local) = reader.resolver().resolve_element(element.name());
                let name = expanded_xml_name(namespace, local.as_ref());
                let mut attributes = Vec::new();
                for attribute in element.attributes() {
                    let attribute = attribute.unwrap();
                    let key = attribute.key.as_ref();
                    if key == "xmlns" || key.starts_with("xmlns:") {
                        continue;
                    }
                    let (namespace, local) = reader.resolver().resolve_attribute(attribute.key);
                    let name = expanded_xml_name(namespace, local.as_ref());
                    let value = attribute
                        .normalized_value(quick_xml::XmlVersion::Implicit1_0)
                        .unwrap();
                    let value = if value.contains(':') && !value.contains(char::is_whitespace) {
                        let (namespace, local) =
                            reader.resolver().resolve_element(QName(value.as_ref()));
                        if matches!(namespace, quick_xml::name::ResolveResult::Bound(_)) {
                            expanded_xml_name(namespace, local.as_ref())
                        } else {
                            value.into_owned()
                        }
                    } else {
                        value.into_owned()
                    };
                    attributes.push(format!("{name}={value}"));
                }
                attributes.sort();
                result.push(format!("start {name} {attributes:?}"));
                if empty {
                    result.push(format!("end {name}"));
                }
            }
            Event::End(element) => {
                let (namespace, local) = reader.resolver().resolve_element(element.name());
                result.push(format!(
                    "end {}",
                    expanded_xml_name(namespace, local.as_ref())
                ));
            }
            Event::Text(content) => {
                let value = quick_xml::escape::unescape(content.xml10_content().as_ref())
                    .unwrap()
                    .into_owned();
                if value.trim().is_empty() {
                    continue;
                }
                let value = if value.contains(':') && !value.contains(char::is_whitespace) {
                    let (namespace, local) = reader.resolver().resolve_element(QName(&value));
                    if matches!(namespace, quick_xml::name::ResolveResult::Bound(_)) {
                        expanded_xml_name(namespace, local.as_ref())
                    } else {
                        value
                    }
                } else {
                    value
                };
                result.push(format!("text {value}"));
            }
            Event::Eof => break,
            _ => {}
        }
    }
    result
}

#[test]
fn operation_prepares_identity_once_and_returns_context_ready_for_reverse_conversion() {
    let entry = entry_id("migration.metadata-uuid").unwrap();
    let inputs = read_inputs(
        entry,
        br#"{"component":"cf","owner":"parent","kind":"EnumValue"}"#,
    )
    .unwrap();
    let xml = "<Root uuid=\"retained-id\"><Name>Первый</Name></Root>";
    let prepared = prepare(
        vec![Source {
            entry,
            direction: Direction::XmlToYaml,
            bytes: xml.as_bytes(),
            inputs,
        }],
        &[entry],
        Generation(1),
        FactBudget {
            text: TextBudget {
                entries: 100,
                bytes: 1000,
            },
            rows: 100,
        },
        10000,
    )
    .unwrap_or_else(|errors| panic!("{errors:?}"));
    let source = &prepared.sources[0];
    assert!(std::ptr::eq(source.bytes, xml.as_bytes()));
    let restored = convert_file(
        entry,
        Direction::YamlToXml,
        "Имя: Первый".as_bytes(),
        &source.inputs,
    )
    .unwrap();
    let actual = String::from_utf8(restored.bytes).unwrap();
    assert!(actual.contains("uuid=\"retained-id\""), "{actual}");
    assert!(actual.contains("<Name>Первый</Name>"), "{actual}");
}

#[test]
fn operation_prepares_shared_facts_once_for_two_conversions() {
    use nkdk::operation::{Conversion, Request, prepare as convert};
    let entry = entry_id("migration.metadata-uuid").unwrap();
    let root = std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join("../../..");
    let context = br#"{"component":"cf","owner":"parent","kind":"EnumValue"}"#;
    let xml = [
        "<Root uuid=\"first-id\"><Name>Первый</Name></Root>",
        "<Root uuid=\"second-id\"><Name>Второй</Name></Root>",
    ];
    let yaml = ["Имя: Первый", "Имя: Второй"];
    let sources = xml
        .iter()
        .map(|source| Source {
            entry,
            direction: Direction::XmlToYaml,
            bytes: source.as_bytes(),
            inputs: read_inputs(entry, context).unwrap(),
        })
        .collect();
    let conversions = yaml
        .iter()
        .enumerate()
        .map(|(consumer_source_index, source)| Conversion {
            consumer_source_index,
            direction: Direction::YamlToXml,
            primary: source.as_bytes(),
        })
        .collect();
    let outputs = convert(Request {
        sources,
        conversions,
        generation: Generation(1),
        fact_budget: operation_budget(1000),
        edge_budget: 10000,
        source_root: &root,
        temporary_parent: &std::env::temp_dir(),
        limits: operation_limits(),
        xml_bytes: 1000000,
    })
    .unwrap_or_else(|errors| panic!("{errors:?}"));
    assert_eq!(outputs.len(), 2);
    for (output, expected) in outputs.iter().zip(["first-id", "second-id"]) {
        assert!(output.diagnostics.is_empty());
        assert!(
            std::str::from_utf8(&output.primary)
                .unwrap()
                .contains(expected)
        );
    }
}

#[test]
fn complete_enumeration_values_use_the_working_operation_in_both_directions() {
    use nkdk::conversion::{Request, prepare as convert};
    use nkdk_conversion_core::{proof, resources::Limits};
    use serde_json::Value;
    let root = std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join("../../..");
    let manifest: Value = serde_json::from_slice(
        &std::fs::read(root.join("tests/migration/enum-values-operation.json")).unwrap(),
    )
    .unwrap();
    let facts = manifest["factSources"].as_array().unwrap();
    let cases = manifest["cases"].as_array().unwrap();
    let prepare_context = |mode: Option<&str>| {
        let sources = facts
            .iter()
            .map(|source| {
                let entry = entry_id(source["entry"].as_str().unwrap()).unwrap();
                let mut inputs = source["inputs"].clone();
                if let Some(mode) = mode
                    && inputs.get("compatibilityMode").is_some()
                {
                    inputs["compatibilityMode"] = mode.into();
                }
                Source {
                    entry,
                    direction: Direction::XmlToYaml,
                    bytes: source["xml"].as_str().unwrap().as_bytes(),
                    inputs: read_inputs(entry, &serde_json::to_vec(&inputs).unwrap()).unwrap(),
                }
            })
            .collect();
        prepare(
            sources,
            &[entry_id("metadata.enumeration-values").unwrap()],
            Generation(1),
            FactBudget {
                text: TextBudget {
                    entries: 1000,
                    bytes: 100000,
                },
                rows: 1000,
            },
            10000,
        )
        .unwrap_or_else(|errors| panic!("{errors:?}"))
    };
    let memberships = prepare_context(None);
    for row in manifest["ownerMembers"].as_array().unwrap() {
        for (index, field, label, expected) in [
            (
                "metadata.owner-members",
                "role",
                "enumValues",
                row["name"].as_str().unwrap(),
            ),
            (
                "metadata.owner-member-identities",
                "segment",
                "Значение",
                row["identity"].as_str().unwrap(),
            ),
        ] {
            let id = nkdk_compiled_rules::fact_id(index).unwrap();
            let columns = memberships.facts.key_fields(id).unwrap().unwrap();
            let key: Vec<_> = columns
                .iter()
                .map(|column| {
                    if *column == field {
                        label
                    } else {
                        row[*column].as_str().unwrap()
                    }
                })
                .collect();
            assert_eq!(
                memberships.facts.lookup_parts(Generation(1), id, &key),
                nkdk_conversion_core::facts::FactState::Ready(expected),
                "{index}: {row}"
            );
        }
    }
    let temporary = std::env::temp_dir();
    for case in cases {
        let entry = entry_id(case["entry"].as_str().unwrap()).unwrap();
        let mode = case["inputs"]["compatibilityMode"].as_str();
        let source = facts
            .iter()
            .position(|source| {
                source["entry"] == case["entry"]
                    && source["inputs"]["component"] == case["inputs"]["component"]
                    && source["inputs"]["owner"] == case["inputs"]["owner"]
            })
            .unwrap();
        let run = |direction, primary, inputs| {
            convert(Request {
                entry,
                direction,
                primary,
                inputs,
                source_root: &root,
                temporary_parent: &temporary,
                limits: Limits {
                    groups: 16,
                    routes: 16,
                    path_bytes: 4096,
                },
                xml_bytes: 1000000,
            })
            .unwrap_or_else(|errors| panic!("{}: {errors:?}", case["id"]))
        };
        let xml = case["xml"].as_str().unwrap().as_bytes();
        let imported = run(
            Direction::XmlToYaml,
            xml,
            prepare_context(mode)
                .sources
                .into_iter()
                .nth(source)
                .unwrap()
                .inputs,
        );
        let yaml = std::str::from_utf8(&imported.primary).unwrap();
        if let Some(expected) = case["yaml"].as_str() {
            assert_eq!(yaml.trim_end(), expected.trim_end(), "{}", case["id"]);
            assert!(
                imported.diagnostics.is_empty(),
                "{:?}",
                imported.diagnostics
            );
        } else {
            assert!(
                yaml.lines()
                    .any(|line| Some(line) == case["annotation"].as_str()),
                "{yaml}"
            );
        }
        if case["noRaw"].as_bool() == Some(true) {
            assert!(!yaml.contains("$xml"), "{yaml}");
        }
        for retained in case["retainedYAML"].as_array().into_iter().flatten() {
            assert!(
                yaml.lines().any(|line| Some(line) == retained.as_str()),
                "{yaml}"
            );
        }
        for rejected in case["rejectedYAML"].as_array().into_iter().flatten() {
            let inputs = prepare_context(mode)
                .sources
                .into_iter()
                .nth(source)
                .unwrap()
                .inputs;
            let issues = nkdk_compiled_rules::validate_file(
                entry,
                rejected.as_str().unwrap().as_bytes(),
                &inputs,
            );
            assert!(
                issues
                    .iter()
                    .any(|issue| issue.code.as_deref() == case["rejectedCode"].as_str()),
                "{issues:?}"
            );
        }
        let reverse = case["yaml"].as_str().unwrap_or(yaml);
        let exported = run(
            Direction::YamlToXml,
            reverse.as_bytes(),
            prepare_context(mode)
                .sources
                .into_iter()
                .nth(source)
                .unwrap()
                .inputs,
        );
        proof::verify(xml, &exported.primary, |_| false)
            .unwrap_or_else(|error| panic!("{}: {error:?}", case["id"]));
        assert!(imported.resources.files().is_empty());
        assert!(exported.resources.files().is_empty());
    }
}

#[test]
fn defined_type_owner_receives_prepared_internal_ids_in_the_working_operation() {
    use nkdk::operation::{Conversion, Request, prepare as convert};
    use nkdk::route::{Context, Material, catalog};
    let root = std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join("../../..");
    let cases = [
        (
            "ОпределяемыйТипВсеСвойства",
            "cf",
            "426da0c0-ee05-4af5-a132-c7874136d3bf",
            include_bytes!(
                "../../../../e2e/fixtures/xml/cf/DefinedTypes/ОпределяемыйТипВсеСвойства.xml"
            ) as &[u8],
            include_bytes!(
                "../../../../e2e/fixtures/nkdk/cf/ОпределяемыйТип/ОпределяемыйТипВсеСвойства.yaml"
            ) as &[u8],
        ),
        (
            "ОпределяемыйТипПоУмолчанию",
            "cf",
            "61ac73bb-6f4a-4cde-8559-f04443dbc1cc",
            include_bytes!(
                "../../../../e2e/fixtures/xml/cf/DefinedTypes/ОпределяемыйТипПоУмолчанию.xml"
            ),
            include_bytes!(
                "../../../../e2e/fixtures/nkdk/cf/ОпределяемыйТип/ОпределяемыйТипПоУмолчанию.yaml"
            ),
        ),
        (
            "ОпределяемыйТипВсеСвойства",
            "cfe",
            "4ca2ea3b-664b-4f27-b272-21d4943b0e30",
            include_bytes!(
                "../../../../e2e/fixtures/xml/cfe/all-extension/DefinedTypes/ОпределяемыйТипВсеСвойства.xml"
            ),
            include_bytes!(
                "../../../../e2e/fixtures/nkdk/cfe/Расширение_All/ОпределяемыйТип/ОпределяемыйТипВсеСвойства.yaml"
            ),
        ),
        (
            "ОпределяемыйТипПоУмолчанию",
            "cfe",
            "56b53617-eb69-452b-873e-35aa362c7001",
            include_bytes!(
                "../../../../e2e/fixtures/xml/cfe/all-extension/DefinedTypes/ОпределяемыйТипПоУмолчанию.xml"
            ),
            include_bytes!(
                "../../../../e2e/fixtures/nkdk/cfe/Расширение_All/ОпределяемыйТип/ОпределяемыйТипПоУмолчанию.yaml"
            ),
        ),
    ];
    for (name, component, own_id, xml, yaml) in cases {
        let context = Context {
            component,
            parent: "configuration",
            default_language: "ru",
            registered_languages: &["ru", "en"],
        };
        let import_path = format!("DefinedTypes/{name}.xml");
        let import_route = catalog()
            .resolve(
                std::path::Path::new(&import_path),
                Direction::XmlToYaml,
                Material::Xml(xml),
                &context,
            )
            .unwrap()
            .expect("declared route");
        assert_eq!(
            import_route.source_names.len(),
            import_route.owner_source_index
        );
        let captured = catalog()
            .capture(std::path::Path::new(&import_path), xml, &context)
            .unwrap()
            .expect("declared source snapshots");
        let yaml_path = format!("ОпределяемыйТип/{name}.yaml");
        let temp_root = std::env::temp_dir().join(format!(
            "nkdk-facts-{}-{component}-{name}",
            std::process::id()
        ));
        catalog()
            .save_snapshots(
                &temp_root,
                std::path::Path::new(&yaml_path),
                component,
                &captured,
            )
            .unwrap();
        let loaded = catalog()
            .load_snapshots(&temp_root, std::path::Path::new(&yaml_path), component)
            .unwrap();
        std::fs::remove_dir_all(&temp_root).unwrap();
        let snapshots: Vec<_> = loaded.iter().map(|snapshot| snapshot.borrow()).collect();
        for (direction, source) in [(Direction::XmlToYaml, xml), (Direction::YamlToXml, yaml)] {
            let path = if matches!(direction, Direction::XmlToYaml) {
                format!("DefinedTypes/{name}.xml")
            } else {
                yaml_path.clone()
            };
            let material = if matches!(direction, Direction::XmlToYaml) {
                Material::Xml(xml)
            } else {
                Material::Yaml {
                    owner: yaml,
                    snapshots: &snapshots,
                }
            };
            let routed = catalog()
                .resolve(std::path::Path::new(&path), direction, material, &context)
                .unwrap()
                .expect("declared route");
            let result = convert(Request {
                sources: routed.sources,
                conversions: vec![Conversion {
                    consumer_source_index: routed.owner_source_index,
                    direction,
                    primary: source,
                }],
                generation: Generation(1),
                fact_budget: operation_budget(10000),
                edge_budget: 10000,
                source_root: &root,
                temporary_parent: &std::env::temp_dir(),
                limits: operation_limits(),
                xml_bytes: 1000000,
            })
            .unwrap_or_else(|errors| panic!("{component}/{name} {direction:?}: {errors:?}"))
            .into_iter()
            .next()
            .unwrap();
            assert!(
                result.diagnostics.is_empty(),
                "{component}/{name}: {:?}",
                result.diagnostics
            );
            let actual = std::str::from_utf8(&result.primary).unwrap();
            if matches!(direction, Direction::YamlToXml) {
                assert!(
                    actual.contains("DefinedType") && actual.contains(own_id),
                    "{actual}"
                );
            } else {
                assert_eq!(
                    actual.contains("Тип:"),
                    std::str::from_utf8(yaml).unwrap().contains("Тип:"),
                    "{component}/{name}: {actual}"
                );
            }
        }
    }
}

#[test]
fn fact_projection_ignores_other_owner_fields_but_rejects_repeated_declared_fields() {
    let entry = entry_id("migration.defined-type-own-identity").unwrap();
    let xml = br#"<MetaDataObject xmlns="http://v8.1c.ru/8.3/MDClasses" version="2.20"><DefinedType uuid="id"><Properties><Name>One</Name><Name>Two</Name><Comment>Unrelated</Comment></Properties></DefinedType></MetaDataObject>"#;
    let inputs = read_inputs(entry, br#"{"component":"cf","parent":"configuration"}"#).unwrap();
    let errors = prepare(
        vec![Source {
            entry,
            direction: Direction::XmlToYaml,
            bytes: xml,
            inputs,
        }],
        &[entry],
        Generation(1),
        operation_budget(1000),
        10000,
    )
    .err()
    .expect("repeated declared field must be rejected");
    assert!(
        errors
            .iter()
            .any(|error| error.code.as_deref() == Some("xml.duplicate-field")),
        "{errors:?}"
    );
}

#[test]
fn declared_route_selects_the_owner_and_fact_sources_from_a_file_path() {
    use nkdk::route::{Context, Material, catalog};
    let xml = include_bytes!(
        "../../../../e2e/fixtures/xml/cfe/all-extension/DefinedTypes/ОпределяемыйТипВсеСвойства.xml"
    );
    let context = Context {
        component: "cfe",
        parent: "configuration",
        default_language: "ru",
        registered_languages: &["ru", "en"],
    };
    let resolved = catalog()
        .resolve(
            std::path::Path::new("DefinedTypes/ОпределяемыйТипВсеСвойства.xml"),
            Direction::XmlToYaml,
            Material::Xml(xml),
            &context,
        )
        .unwrap()
        .expect("declared owner route");
    assert_eq!(
        resolved.sources[resolved.owner_source_index].entry.0,
        entry_id("metadata.defined-type-extension").unwrap().0
    );
    assert_eq!(resolved.sources.len(), 4);
    assert_eq!(
        resolved.target_path,
        std::path::Path::new("ОпределяемыйТип/ОпределяемыйТипВсеСвойства.yaml")
    );
}

#[test]
fn operation_route_grammar_works_for_an_unrelated_owner() {
    use nkdk::route::{Catalog, Context, Material};
    let catalog = Catalog::parse(
        "format: nkdk-operation-routes/1\nroutes:\n- xmlDir: Other\n  yamlDir: Иное\n  owners: {cf: migration.metadata-uuid}\n  inputs: {component: component, owner: parent, kind: name}\n  sources: []\n",
    )
    .unwrap();
    let context = Context {
        component: "cf",
        parent: "configuration",
        default_language: "ru",
        registered_languages: &["ru"],
    };
    let result = catalog
        .resolve(
            std::path::Path::new("Other/Example.xml"),
            Direction::XmlToYaml,
            Material::Xml(b"<Root/>"),
            &context,
        )
        .unwrap()
        .expect("second declarative route");
    assert_eq!(result.sources.len(), 1);
    assert_eq!(
        result.target_path,
        std::path::Path::new("Иное/Example.yaml")
    );
    assert!(Catalog::parse("format: nkdk-operation-routes/1\nroutes:\n- xmlDir: Other\n  yamlDir: ..\n  owners: {cf: migration.metadata-uuid}\n  inputs: {}\n  sources: []\n").is_err());
}

#[test]
fn fact_source_snapshot_keeps_identity_without_the_original_xml() {
    let entry = entry_id("migration.defined-type-own-identity").unwrap();
    let xml = include_bytes!(
        "../../../../e2e/fixtures/xml/cf/DefinedTypes/ОпределяемыйТипВсеСвойства.xml"
    );
    let inputs = read_inputs(entry, br#"{"component":"cf","parent":"configuration"}"#).unwrap();
    let yaml = nkdk_compiled_rules::snapshot_fact_source(entry, xml, &inputs).unwrap();
    let text = std::str::from_utf8(&yaml).unwrap();
    assert!(text.contains("426da0c0-ee05-4af5-a132-c7874136d3bf"));
    let prepared = prepare(
        vec![Source {
            entry,
            direction: Direction::YamlToXml,
            bytes: &yaml,
            inputs,
        }],
        &[entry],
        Generation(1),
        operation_budget(10000),
        10000,
    )
    .unwrap_or_else(|errors| panic!("{errors:?}"));
    let identity = nkdk_compiled_rules::fact_id("metadata.own-identities").unwrap();
    assert_eq!(
        prepared.facts.lookup_parts(
            Generation(1),
            identity,
            &[
                "cf",
                "DefinedType",
                "ОпределяемыйТипВсеСвойства",
                "configuration"
            ]
        ),
        nkdk_conversion_core::facts::FactState::Ready("426da0c0-ee05-4af5-a132-c7874136d3bf")
    );
}

#[test]
fn declared_project_route_converts_a_component_after_reopening_its_yaml() {
    use nkdk::{project, route::Context};
    let repository = std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join("../../..");
    for (component, xml_root, fixture_yaml_root, expected_uuid) in [
        (
            "cf",
            "e2e/fixtures/xml/cf",
            "e2e/fixtures/nkdk/cf",
            "426da0c0-ee05-4af5-a132-c7874136d3bf",
        ),
        (
            "cfe",
            "e2e/fixtures/xml/cfe/all-extension",
            "e2e/fixtures/nkdk/cfe/Расширение_All",
            "4ca2ea3b-664b-4f27-b272-21d4943b0e30",
        ),
    ] {
        let temp_root = std::env::temp_dir().join(format!(
            "nkdk-project-route-{}-{component}",
            std::process::id()
        ));
        std::fs::create_dir_all(&temp_root).unwrap();
        let yaml_root = temp_root.join("yaml");
        let rebuilt_xml_root = temp_root.join("xml");
        let context = || Context {
            component,
            parent: "configuration",
            default_language: "ru",
            registered_languages: &["ru", "en"],
        };
        let convert = |direction, source_root: &std::path::Path, target_root: &std::path::Path| {
            project::convert_component(project::Request {
                source_root,
                target_root,
                temporary_parent: &temp_root,
                context: context(),
                direction,
                generation: Generation(1),
                fact_budget: operation_budget(10000),
                edge_budget: 10000,
                limits: operation_limits(),
                xml_bytes: 1000000,
            })
            .unwrap_or_else(|errors| panic!("{component} {direction:?}: {errors:?}"))
        };
        let imported = convert(Direction::XmlToYaml, &repository.join(xml_root), &yaml_root);
        assert_eq!(imported.outputs.len(), 2);
        for path in &imported.outputs {
            let expected =
                std::fs::read_to_string(repository.join(fixture_yaml_root).join(path)).unwrap();
            let actual = std::fs::read_to_string(yaml_root.join(path)).unwrap();
            assert_eq!(
                yaml_rust2::YamlLoader::load_from_str(&expected).unwrap(),
                yaml_rust2::YamlLoader::load_from_str(&actual).unwrap(),
                "{component}: {}",
                path.display()
            );
        }
        let exported = convert(Direction::YamlToXml, &yaml_root, &rebuilt_xml_root);
        assert_eq!(exported.outputs.len(), 2);
        for path in &exported.outputs {
            let original = std::fs::read_to_string(repository.join(xml_root).join(path)).unwrap();
            let rebuilt = std::fs::read_to_string(rebuilt_xml_root.join(path)).unwrap();
            assert_eq!(
                normalized_xml(&original),
                normalized_xml(&rebuilt),
                "{component}: {}",
                path.display()
            );
        }
        let result = std::fs::read_to_string(
            rebuilt_xml_root.join("DefinedTypes/ОпределяемыйТипВсеСвойства.xml"),
        )
        .unwrap();
        assert!(result.contains(expected_uuid), "{result}");
        assert!(result.contains("InternalInfo>"), "{result}");
        let owner_path = std::path::Path::new("ОпределяемыйТип/ОпределяемыйТипВсеСвойства.yaml");
        let sidecar = nkdk::route::catalog()
            .sidecar_path(owner_path, component)
            .unwrap()
            .unwrap();
        std::fs::remove_file(yaml_root.join(sidecar)).unwrap();
        let incomplete = project::convert_component(project::Request {
            source_root: &yaml_root,
            target_root: &temp_root.join("incomplete"),
            temporary_parent: &temp_root,
            context: context(),
            direction: Direction::YamlToXml,
            generation: Generation(1),
            fact_budget: operation_budget(10000),
            edge_budget: 10000,
            limits: operation_limits(),
            xml_bytes: 1000000,
        })
        .err()
        .expect("missing prepared identities must be reported");
        assert!(
            incomplete
                .iter()
                .any(|error| error.code.as_deref() == Some("project.snapshot"))
        );
        assert!(!temp_root.join("incomplete").exists());
        std::fs::remove_dir_all(temp_root).unwrap();
    }
}

#[test]
fn declared_project_route_reports_invalid_language_as_an_anomaly() {
    use nkdk::{project, route::Context};
    let xml =
        include_str!("../../../../e2e/fixtures/xml/cf/DefinedTypes/ОпределяемыйТипВсеСвойства.xml")
            .replace("<v8:lang>ru</v8:lang>", "<v8:lang>zz</v8:lang>");
    let temp_root =
        std::env::temp_dir().join(format!("nkdk-project-anomaly-{}", std::process::id()));
    let source_root = temp_root.join("source");
    let target_root = temp_root.join("target");
    std::fs::create_dir_all(source_root.join("DefinedTypes")).unwrap();
    std::fs::write(
        source_root.join("DefinedTypes/ОпределяемыйТипВсеСвойства.xml"),
        &xml,
    )
    .unwrap();
    let report = project::convert_component(project::Request {
        source_root: &source_root,
        target_root: &target_root,
        temporary_parent: &temp_root,
        context: Context {
            component: "cf",
            parent: "configuration",
            default_language: "ru",
            registered_languages: &["ru", "en"],
        },
        direction: Direction::XmlToYaml,
        generation: Generation(1),
        fact_budget: operation_budget(10000),
        edge_budget: 10000,
        limits: operation_limits(),
        xml_bytes: 1000000,
    })
    .unwrap_or_else(|errors| panic!("{errors:?}"));
    assert_eq!(report.outputs.len(), 1);
    let yaml = std::fs::read_to_string(
        target_root.join("ОпределяемыйТип/ОпределяемыйТипВсеСвойства.yaml"),
    )
    .unwrap();
    assert!(yaml.contains("!xml/invalid zz"), "{yaml}");
    let rebuilt_root = temp_root.join("rebuilt");
    let exported = project::convert_component(project::Request {
        source_root: &target_root,
        target_root: &rebuilt_root,
        temporary_parent: &temp_root,
        context: Context {
            component: "cf",
            parent: "configuration",
            default_language: "ru",
            registered_languages: &["ru", "en"],
        },
        direction: Direction::YamlToXml,
        generation: Generation(1),
        fact_budget: operation_budget(10000),
        edge_budget: 10000,
        limits: operation_limits(),
        xml_bytes: 1000000,
    })
    .unwrap_or_else(|errors| panic!("{errors:?}"));
    assert_eq!(exported.outputs.len(), 1);
    let rebuilt =
        std::fs::read_to_string(rebuilt_root.join("DefinedTypes/ОпределяемыйТипВсеСвойства.xml"))
            .unwrap();
    assert_eq!(normalized_xml(&xml), normalized_xml(&rebuilt));
    std::fs::remove_dir_all(temp_root).unwrap();
}
