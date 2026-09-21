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
    let root = std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join("../../..");
    let cases = [
        (
            "ОпределяемыйТипВсеСвойства",
            "cf",
            "426da0c0-ee05-4af5-a132-c7874136d3bf",
            None,
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
            None,
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
            Some("426da0c0-ee05-4af5-a132-c7874136d3bf"),
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
            Some("61ac73bb-6f4a-4cde-8559-f04443dbc1cc"),
            include_bytes!(
                "../../../../e2e/fixtures/xml/cfe/all-extension/DefinedTypes/ОпределяемыйТипПоУмолчанию.xml"
            ),
            include_bytes!(
                "../../../../e2e/fixtures/nkdk/cfe/Расширение_All/ОпределяемыйТип/ОпределяемыйТипПоУмолчанию.yaml"
            ),
        ),
    ];
    for (name, component, own_id, base_id, xml, yaml) in cases {
        let owner = entry_id(if base_id.is_some() {
            "metadata.defined-type-extension"
        } else {
            "metadata.defined-type"
        })
        .unwrap();
        let internal = entry_id("migration.defined-type-internal-types").unwrap();
        let identity = entry_id("migration.defined-type-own-identity").unwrap();
        let context = serde_json::json!({
            "ownerName": name,
            "component": component,
            "parent": "configuration",
            "defaultLanguage": "ru",
            "registeredLanguages": ["ru", "en"]
        });
        let sources = || {
            let mut sources = vec![
                Source {
                    entry: internal,
                    direction: Direction::XmlToYaml,
                    bytes: xml,
                    inputs: read_inputs(internal, &serde_json::to_vec(&serde_json::json!({"ownerName": name, "component": component, "parent": "configuration"})).unwrap()).unwrap(),
                },
                Source {
                    entry: identity,
                    direction: Direction::XmlToYaml,
                    bytes: xml,
                    inputs: read_inputs(identity, &serde_json::to_vec(&serde_json::json!({"component": component, "parent": "configuration"})).unwrap()).unwrap(),
                },
            ];
            if base_id.is_some() {
                let entry = entry_id("migration.defined-type-base-identity").unwrap();
                sources.push(Source {
                    entry,
                    direction: Direction::XmlToYaml,
                    bytes: xml,
                    inputs: read_inputs(
                        entry,
                        &serde_json::to_vec(&serde_json::json!({"component": component})).unwrap(),
                    )
                    .unwrap(),
                });
            }
            sources.push(Source {
                entry: owner,
                direction: Direction::XmlToYaml,
                bytes: xml,
                inputs: read_inputs(owner, &serde_json::to_vec(&context).unwrap()).unwrap(),
            });
            sources
        };
        for (direction, source) in [(Direction::XmlToYaml, xml), (Direction::YamlToXml, yaml)] {
            let result = convert(Request {
                sources: sources(),
                conversions: vec![Conversion {
                    consumer_source_index: if base_id.is_some() { 3 } else { 2 },
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
