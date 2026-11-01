#[path = "support/yaml_comparison.rs"]
mod yaml_comparison;
use yaml_comparison::{canonical_state_nulls, equivalent_yaml, expected_missing_changed_resource};
#[path = "../../../../tools/rules-migration/runtime/src/equality.rs"]
mod migration_equality;
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

fn project_budget() -> FactBudget {
    FactBudget {
        text: TextBudget {
            entries: 10000,
            bytes: 1000000,
        },
        rows: 10000,
    }
}

fn operation_limits() -> Limits {
    Limits {
        groups: 16,
        routes: 16,
        path_bytes: 4096,
    }
}

fn project_request<'a>(
    source_root: &'a std::path::Path,
    target_root: &'a std::path::Path,
    base_component_root: Option<&'a std::path::Path>,
    temporary_parent: &'a std::path::Path,
    context: nkdk::route::Context<'a>,
    direction: Direction,
) -> nkdk::project::Request<'a> {
    nkdk::project::Request {
        source_root,
        target_root,
        base_component_root,
        temporary_parent,
        context,
        direction,
        generation: Generation(1),
        fact_budget: project_budget(),
        edge_budget: 10000,
        limits: operation_limits(),
        xml_bytes: 10000,
    }
}

#[path = "support/component_fixture.rs"]
mod component_fixture;
use component_fixture::convert_component as convert_fixture_component;

#[path = "support/xml_comparison.rs"]
mod xml_comparison;
use xml_comparison::normalized_xml;

#[test]
fn whole_form_reservations_keep_number_spaces_separate_before_allocating() {
    use nkdk::facts::{LoadedSource, MaterialSourceHeader, SourceHeader, SourceKind};
    use nkdk_compiled_rules::{InputValue, prepare_inputs};
    use nkdk_conversion_core::facts::FactState;
    let root =
        std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join("../../../e2e/fixtures/xml/cf");
    // Independent expectations from these unchanged XML fixtures, not a second
    // implementation of the profile's traversal.
    let mut cases = [
        ("CommonForms/ExtendedTooltip/Ext/Form.xml", ["3", "1", "1", "1"]),
        ("CommonForms/CommandBar/Ext/Form.xml", ["1", "3", "2", "1"]),
        ("../cfe/all-extension/ExternalDataSources/ВнешнийИсточникДанныхВсеСвойства/Tables/ТаблицаВсеСвойства/Forms/ФормаВыбора/Ext/Form.xml", ["19", "1", "1", "1"]),
        ("AccountingRegisters/РегистрБухгалтерииВсеСвойстваОбороты/Forms/ФормаСписка/Ext/Form.xml", ["39", "3", "2", "1"]),
    ].into_iter().map(|(path, expected)| (path.to_owned(), std::fs::read(root.join(path)).unwrap(), expected)).collect::<Vec<_>>();
    // The e2e corpus has no parameter ids. Also protect inherited scopes for
    // opaque XML and namespace-sensitive boundaries, including BaseForm.
    cases.push(("opaque and parameters".into(), br#"<Form xmlns="http://v8.1c.ru/8.3/xcf/logform" xmlns:other="urn:other">
      <ChildItems><Opaque id="1"/></ChildItems>
      <Attributes><Attribute id="1"><Columns><Column id="2"/></Columns></Attribute><Opaque id="3"/></Attributes>
      <Commands><Command id="1"/></Commands><Parameters><Parameter id="1"/><Opaque id="2"/></Parameters>
      <BaseForm><Opaque id="2"/></BaseForm><Opaque id="3"/><other:Attributes id="4"/>
    </Form>"#.to_vec(), ["5", "4", "2", "3"]));
    let requests = [
        (
            "working.element.ExtendedTooltip.facts",
            "metadata.element-identities",
            "НоваяРасширеннаяПодсказка",
        ),
        (
            "metadata.form-attribute-numbering",
            "metadata.form-attribute-identities",
            "Новый",
        ),
        (
            "metadata.form-command-numbering",
            "metadata.form-command-identities",
            "Новый",
        ),
        (
            "metadata.form-parameter-numbering",
            "metadata.form-parameter-identities",
            "Новый",
        ),
    ];
    for (label, xml, expected) in cases {
        let component = if label.starts_with("../cfe/") {
            "cfe"
        } else {
            "cf"
        };
        let values = || {
            vec![
                ("component".into(), InputValue::Text(component.into())),
                ("owner".into(), InputValue::Text("one".into())),
            ]
        };
        let mut headers = Vec::new();
        let mut materials = Vec::new();
        for (slot, (name, _, key)) in requests.iter().enumerate() {
            let entry = entry_id(name).unwrap();
            let mut inputs = values();
            if slot == 0 {
                inputs.push(("ownerName".into(), InputValue::Text("Новая".into())));
            }
            headers.push(MaterialSourceHeader {
                source: SourceHeader {
                    entry,
                    direction: Direction::YamlToXml,
                    inputs: prepare_inputs(entry, inputs).unwrap(),
                },
                kind: SourceKind::Ordinary,
            });
            materials.push(format!("Имя: {key}\n").into_bytes());
        }
        let entry = entry_id("metadata.form-id-reservations").unwrap();
        headers.push(MaterialSourceHeader {
            source: SourceHeader {
                entry,
                direction: Direction::XmlToYaml,
                inputs: prepare_inputs(entry, values()).unwrap(),
            },
            kind: SourceKind::AttributeReservations { max_depth: 128 },
        });
        materials.push(xml);
        // Another form containing every next id must not occupy this form's numbers.
        let other = format!(
            "<Form xmlns='http://v8.1c.ru/8.3/xcf/logform' id='{}'><Attributes id='{}'/><Commands id='{}'/><Parameters id='{}'/></Form>",
            expected[0], expected[1], expected[2], expected[3]
        );
        let mut other_inputs = values();
        other_inputs[1].1 = InputValue::Text("other".into());
        headers.push(MaterialSourceHeader {
            source: SourceHeader {
                entry,
                direction: Direction::XmlToYaml,
                inputs: prepare_inputs(entry, other_inputs).unwrap(),
            },
            kind: SourceKind::AttributeReservations { max_depth: 128 },
        });
        materials.push(other.into_bytes());
        let prepared = nkdk::facts::prepare_streaming_materials::<nkdk::facts::FactCatalog>(
            headers,
            &[],
            Generation(1),
            project_budget(),
            1000,
            |index, _| {
                Ok(LoadedSource {
                    bytes: std::mem::take(&mut materials[index]),
                    documents: vec![],
                })
            },
        )
        .unwrap_or_else(|errors| panic!("{label}: {errors:?}"));
        for ((_, index, name), expected) in requests.iter().zip(expected) {
            let index = nkdk_compiled_rules::fact_id(index).unwrap();
            assert_eq!(
                prepared
                    .facts
                    .lookup_parts(Generation(1), index, &[component, name, "one"]),
                FactState::Ready(expected),
                "{label}"
            );
        }
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
fn fact_preparation_loads_each_source_and_keeps_only_prepared_inputs() {
    use nkdk::facts::{SourceHeader, prepare_streaming};
    let entry = entry_id("migration.metadata-uuid").unwrap();
    let context = br#"{"component":"cf","owner":"parent","kind":"EnumValue"}"#;
    let xml = [
        "<Root uuid=\"first-id\"><Name>Первый</Name></Root>",
        "<Root uuid=\"second-id\"><Name>Второй</Name></Root>",
    ];
    let sources = xml
        .iter()
        .map(|_| SourceHeader {
            entry,
            direction: Direction::XmlToYaml,
            inputs: read_inputs(entry, context).unwrap(),
        })
        .collect();
    let mut loaded = Vec::new();
    let prepared = prepare_streaming(
        sources,
        &[entry, entry],
        Generation(1),
        operation_budget(1000),
        10000,
        |index| {
            loaded.push(index);
            Ok(xml[index].as_bytes().to_vec())
        },
    )
    .unwrap_or_else(|errors| panic!("{errors:?}"));
    assert_eq!(loaded, [0, 1]);
    for (source, (name, identity)) in prepared
        .sources
        .iter()
        .zip([("Первый", "first-id"), ("Второй", "second-id")])
    {
        let restored = convert_file(
            entry,
            Direction::YamlToXml,
            format!("Имя: {name}").as_bytes(),
            &source.inputs,
        )
        .unwrap();
        assert!(String::from_utf8_lossy(&restored.bytes).contains(identity));
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
            compatibility_mode: "Version8_3_27",
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
            import_route.source_materials.len(),
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
                    new_owner: false,
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
        compatibility_mode: "Version8_3_27",
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
        compatibility_mode: "Version8_3_27",
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
    assert_eq!(
        result.source_resources,
        std::path::Path::new("Other/Example")
    );
    assert_eq!(
        result.target_resources,
        std::path::Path::new("Иное/Example")
    );
    assert!(Catalog::parse("format: nkdk-operation-routes/1\nroutes:\n- xmlDir: Other\n  yamlDir: ..\n  owners: {cf: migration.metadata-uuid}\n  inputs: {}\n  sources: []\n").is_err());
    assert!(Catalog::parse("format: nkdk-operation-routes/1\nroutes:\n- xmlDir: Other\n  yamlDir: Иное\n  owners: {cf: migration.metadata-uuid}\n  inputs: {}\n  sources:\n  - entry: migration.metadata-uuid\n    inputs: {}\n    newOwner: {template: {uuid: {externalSnapshot: {component: cf, entry: migration.metadata-uuid}}}}\n").is_err());
    let directional = "format: nkdk-operation-routes/1\nroutes:\n- xmlDir: Other\n  yamlDir: Иное\n  owners: {cf: migration.metadata-uuid}\n  inputs: {component: component, owner: parent, kind: name}\n  sources:\n  - entry: migration.enumeration-own-identity\n    factDirections: [yaml-to-xml]\n    inputs: {component: component, parent: parent, ownerName: name}\n";
    assert!(Catalog::parse(directional).is_ok());
    assert!(Catalog::parse(&directional.replace("[yaml-to-xml]", "[backwards]")).is_err());
    assert!(
        Catalog::parse(&directional.replace("[yaml-to-xml]", "[yaml-to-xml, yaml-to-xml]"))
            .is_err()
    );
}

#[test]
fn operation_route_binds_owner_input_from_a_declared_snapshot() {
    use nkdk::route::{Catalog, Context, Material, OwnedSnapshot};
    let catalog = Catalog::parse(
        "format: nkdk-operation-routes/1\nroutes:\n- xmlDir: Other\n  yamlDir: Иное\n  owners: {cf: migration.metadata-uuid}\n  inputs: {component: component, owner: parent, kind: {snapshot: {entry: migration.enumeration-own-identity, field: uuid}}}\n  sources: []\n",
    )
    .unwrap();
    let context = Context {
        component: "cf",
        parent: "configuration",
        default_language: "ru",
        registered_languages: &["ru"],
        compatibility_mode: "Version8_3_27",
    };
    let snapshot = OwnedSnapshot {
        name: "migration.enumeration-own-identity".into(),
        entry: entry_id("migration.enumeration-own-identity").unwrap(),
        bytes: b"uuid: retained-id\n".to_vec(),
    };
    let snapshots = [snapshot.borrow()];
    let result = catalog.resolve_with_snapshots(
        std::path::Path::new("Other/Example.xml"),
        Direction::XmlToYaml,
        Material::Xml(b"<Root/>"),
        &context,
        &snapshots,
    );
    assert!(result.is_ok(), "{:?}", result.err());
    assert!(
        catalog
            .resolve_with_snapshots(
                std::path::Path::new("Other/Example.xml"),
                Direction::XmlToYaml,
                Material::Xml(b"<Root/>"),
                &context,
                &[],
            )
            .is_err()
    );
    let with_default = Catalog::parse(
        "format: nkdk-operation-routes/1\nroutes:\n- xmlDir: Other\n  yamlDir: Иное\n  owners: {cf: migration.metadata-uuid}\n  inputs: {component: component, owner: parent, kind: {snapshot: {entry: migration.enumeration-own-identity, field: absent, default: fallback}}}\n  sources: []\n",
    )
    .unwrap();
    assert!(
        with_default
            .resolve_with_snapshots(
                std::path::Path::new("Other/Example.xml"),
                Direction::XmlToYaml,
                Material::Xml(b"<Root/>"),
                &context,
                &snapshots,
            )
            .is_ok()
    );
}

#[test]
fn operation_route_captures_a_source_before_binding_its_owner() {
    use nkdk::route::{Catalog, Context, Material};
    let catalog = Catalog::parse(
        "format: nkdk-operation-routes/1\nroutes:\n- xmlDir: Enums\n  yamlDir: Перечисление\n  owners: {cf: migration.metadata-uuid}\n  inputs: {component: component, owner: parent, kind: {snapshot: {entry: migration.enumeration-own-identity, field: uuid}}}\n  sources:\n  - entry: migration.enumeration-own-identity\n    inputs: {component: component, parent: parent, ownerName: name}\n",
    )
    .unwrap();
    let xml = include_bytes!("../../../../e2e/fixtures/xml/cf/Enums/ПеречислениеВсеСвойства.xml");
    let path = std::path::Path::new("Enums/ПеречислениеВсеСвойства.xml");
    let context = Context {
        component: "cf",
        parent: "configuration",
        default_language: "ru",
        registered_languages: &["ru"],
        compatibility_mode: "Version8_3_27",
    };
    let captured = catalog.capture(path, xml, &context).unwrap().unwrap();
    assert_eq!(captured.len(), 1);
    assert!(
        std::str::from_utf8(&captured[0].bytes)
            .unwrap()
            .contains("ec93e916-ecd7-45c4-8e73-ea76f186183c")
    );
    let borrowed = captured
        .iter()
        .map(nkdk::route::OwnedSnapshot::borrow)
        .collect::<Vec<_>>();
    assert!(
        catalog
            .resolve_with_snapshots(
                path,
                Direction::XmlToYaml,
                Material::Xml(xml),
                &context,
                &borrowed,
            )
            .is_ok()
    );
}

#[test]
fn operation_route_binds_a_sequence_from_a_snapshot() {
    use nkdk::route::{Catalog, Context, Material, OwnedSnapshot};
    let catalog = Catalog::parse(
        "format: nkdk-operation-routes/1\nroutes:\n- xmlDir: Other\n  yamlDir: Иное\n  owners: {cf: migration.enumeration-child-names}\n  inputs: {forms: {snapshot: {entry: migration.enumeration-child-names, field: Формы}}, templates: {literal: []}}\n  sources: []\n",
    )
    .unwrap();
    let snapshot = OwnedSnapshot {
        name: "migration.enumeration-child-names".into(),
        entry: entry_id("migration.enumeration-child-names").unwrap(),
        bytes: "Формы:\n  - ФормаСписка\n  - ФормаВыбора\n"
            .as_bytes()
            .to_vec(),
    };
    let borrowed = [snapshot.borrow()];
    let context = Context {
        component: "cf",
        parent: "configuration",
        default_language: "ru",
        registered_languages: &["ru"],
        compatibility_mode: "Version8_3_27",
    };
    assert!(
        catalog
            .resolve_with_snapshots(
                std::path::Path::new("Other/Example.xml"),
                Direction::XmlToYaml,
                Material::Xml(b"<Root/>"),
                &context,
                &borrowed,
            )
            .is_ok()
    );
    let projected = Catalog::parse(
        "format: nkdk-operation-routes/1\nroutes:\n- xmlDir: Other\n  yamlDir: Иное\n  owners: {cf: migration.enumeration-child-names}\n  inputs: {forms: {snapshot: {entry: migration.enumeration-commands-identity-source, field: commands, each: name}}, templates: {literal: []}}\n  sources: []\n",
    )
    .unwrap();
    let rows = OwnedSnapshot {
        name: "migration.enumeration-commands-identity-source".into(),
        entry: entry_id("migration.enumeration-commands-identity-source").unwrap(),
        bytes: b"commands:\n  - {name: First, uuid: one}\n  - {name: Second, uuid: two}\n".to_vec(),
    };
    let sources = [rows.borrow()];
    let resolved = projected
        .resolve_with_snapshots(
            std::path::Path::new("Other/Example.xml"),
            Direction::XmlToYaml,
            Material::Xml(b"<Root/>"),
            &context,
            &sources,
        )
        .unwrap()
        .unwrap();
    let owner = &resolved.sources[resolved.owner_source_index];
    let slot = nkdk_compiled_rules::input_names(owner.entry)
        .iter()
        .position(|name| *name == "forms")
        .unwrap();
    let names = owner.inputs.view().sequence(slot).unwrap();
    assert!(
        matches!(names, [nkdk_compiled_rules::InputValue::Text(first), nkdk_compiled_rules::InputValue::Text(second)] if first == "First" && second == "Second")
    );
}

#[test]
fn operation_route_derives_text_inputs_without_owner_specific_code() {
    use nkdk::route::{Catalog, Context, Material};
    let catalog = Catalog::parse(
        "format: nkdk-operation-routes/1\nroutes:\n- xmlDir: Other\n  yamlDir: Иное\n  owners: {cf: migration.metadata-uuid}\n  inputs:\n    component: {byComponent: {cf: {literal: cf}}}\n    owner: {concat: [{literal: 'Enum.'}, name]}\n    kind: compatibilityMode\n  sources: []\n",
    )
    .unwrap();
    let context = Context {
        component: "cf",
        parent: "configuration",
        default_language: "ru",
        registered_languages: &["ru"],
        compatibility_mode: "Version8_3_27",
    };
    assert!(
        catalog
            .resolve(
                std::path::Path::new("Other/Example.xml"),
                Direction::XmlToYaml,
                Material::Xml(b"<Root/>"),
                &context,
            )
            .is_ok()
    );
}

#[test]
fn operation_route_catalog_accepts_separate_declarative_files_without_collisions() {
    use nkdk::route::Catalog;
    let first = "format: nkdk-operation-routes/1\nroutes:\n- xmlDir: Other\n  yamlDir: Иное\n  owners: {cf: migration.metadata-uuid}\n  inputs: {component: component, owner: parent, kind: name}\n  sources: []\n";
    let second = "format: nkdk-operation-routes/1\nroutes:\n- xmlDir: More\n  yamlDir: Еще\n  owners: {cf: migration.metadata-uuid}\n  inputs: {component: component, owner: parent, kind: name}\n  sources: []\n";
    assert!(Catalog::parse_sources(&[first, second]).is_ok());
    assert!(Catalog::parse_sources(&[first, first]).is_err());
}

#[test]
fn production_enumeration_route_binds_its_declared_sources() {
    use nkdk::route::{Context, Material, catalog};
    let xml = include_bytes!(
        "../../../../e2e/fixtures/xml/cfe/all-extension/Enums/ПеречислениеВсеСвойства.xml"
    );
    let path = std::path::Path::new("Enums/ПеречислениеВсеСвойства.xml");
    let context = Context {
        component: "cfe",
        parent: "configuration",
        default_language: "ru",
        registered_languages: &["ru", "en"],
        compatibility_mode: "Version8_3_27",
    };
    let snapshots = catalog().capture(path, xml, &context).unwrap().unwrap();
    let borrowed = snapshots
        .iter()
        .map(nkdk::route::OwnedSnapshot::borrow)
        .collect::<Vec<_>>();
    let resolved = catalog()
        .resolve_with_snapshots(
            path,
            Direction::XmlToYaml,
            Material::Xml(xml),
            &context,
            &borrowed,
        )
        .unwrap()
        .unwrap();
    assert_eq!(resolved.source_materials.len(), 6);
    assert_eq!(
        resolved.target_path,
        std::path::Path::new("Перечисление/ПеречислениеВсеСвойства/Свойства.yaml")
    );
    assert_eq!(
        resolved.source_resources,
        std::path::Path::new("Enums/ПеречислениеВсеСвойства")
    );
    assert_eq!(
        resolved.target_resources,
        std::path::Path::new("Перечисление/ПеречислениеВсеСвойства")
    );
}

#[test]
fn operation_route_accepts_a_declared_owner_properties_file() {
    use nkdk::route::{Catalog, Context, Material};
    let catalog = Catalog::parse(
        "format: nkdk-operation-routes/1\nroutes:\n- xmlDir: Other\n  yamlDir: Иное\n  yamlFile: Свойства.yaml\n  owners: {cf: migration.metadata-uuid}\n  inputs: {component: component, owner: parent, kind: name}\n  sources: []\n",
    )
    .unwrap();
    let context = Context {
        component: "cf",
        parent: "configuration",
        default_language: "ru",
        registered_languages: &["ru"],
        compatibility_mode: "Version8_3_27",
    };
    let xml = catalog
        .resolve(
            std::path::Path::new("Other/Example.xml"),
            Direction::XmlToYaml,
            Material::Xml(b"<Root/>"),
            &context,
        )
        .unwrap()
        .unwrap();
    assert_eq!(
        xml.target_path,
        std::path::Path::new("Иное/Example/Свойства.yaml")
    );
    let yaml = catalog
        .resolve(
            std::path::Path::new("Иное/Example/Свойства.yaml"),
            Direction::YamlToXml,
            Material::Yaml {
                owner: b"{}",
                snapshots: &[],
                new_owner: false,
            },
            &context,
        )
        .unwrap()
        .unwrap();
    assert_eq!(yaml.target_path, std::path::Path::new("Other/Example.xml"));
    assert!(
        catalog
            .sidecar_path(std::path::Path::new("Иное/Example/Свойства.yaml"), "cf")
            .unwrap()
            .is_some()
    );
    assert!(
        catalog
            .sidecar_path(std::path::Path::new("Иное/Example/Other.yaml"), "cf")
            .unwrap()
            .is_none()
    );
    let root = std::env::temp_dir().join(format!("nkdk-owner-route-{}", std::process::id()));
    std::fs::create_dir_all(root.join("Иное/Example")).unwrap();
    std::fs::write(root.join("Иное/Example/Свойства.yaml"), b"{}").unwrap();
    std::fs::write(root.join("Иное/Example/Other.yaml"), b"{}").unwrap();
    assert_eq!(
        catalog.paths(&root, "cf", Direction::YamlToXml).unwrap(),
        [std::path::PathBuf::from("Иное/Example/Свойства.yaml")]
    );
    std::fs::remove_dir_all(root).unwrap();
}

#[test]
fn operation_route_captures_a_composed_fact_source() {
    use nkdk::route::{Catalog, Context};
    let catalog = Catalog::parse(
        "format: nkdk-operation-routes/1\nroutes:\n- xmlDir: Other\n  yamlDir: Иное\n  owners: {cf: pilot.boolean}\n  inputs: {}\n  sources:\n  - entry: migration.journal-internal-types\n    inputs: {owner: name}\n",
    )
    .unwrap();
    let context = Context {
        component: "cf",
        parent: "configuration",
        default_language: "ru",
        registered_languages: &["ru"],
        compatibility_mode: "Version8_3_27",
    };
    let source = include_bytes!(
        "../../../../e2e/fixtures/xml/cfe/all-extension/DocumentJournals/ЖурналДокументовВсеСвойства.xml"
    );
    let snapshots = catalog
        .capture(
            std::path::Path::new("Other/ЖурналДокументовВсеСвойства.xml"),
            source,
            &context,
        )
        .unwrap()
        .unwrap();
    assert_eq!(snapshots.len(), 1);
    let yaml = std::str::from_utf8(&snapshots[0].bytes).unwrap();
    assert!(yaml.contains("ВнутренниеТипы:"), "{yaml}");
    assert!(yaml.contains("СостоянияСвойств:"), "{yaml}");
    assert!(!yaml.contains("!xml"), "{yaml}");
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
fn fact_source_can_be_materialized_from_yaml_without_xml() {
    let entry = entry_id("migration.defined-type-own-identity").unwrap();
    let inputs = read_inputs(
        entry,
        r#"{"component":"cf","parent":"configuration","ownerName":"Новый"}"#.as_bytes(),
    )
    .unwrap();
    let source = "uuid: 426da0c0-ee05-4af5-a132-c7874136d3bf\n".as_bytes();
    let prepared = nkdk_compiled_rules::materialize_fact_source(entry, source, &inputs).unwrap();
    let expected = yaml_rust2::YamlLoader::load_from_str(
        "name: Новый\nuuid: 426da0c0-ee05-4af5-a132-c7874136d3bf\n",
    )
    .unwrap();
    let actual =
        yaml_rust2::YamlLoader::load_from_str(std::str::from_utf8(&prepared).unwrap()).unwrap();
    assert_eq!(actual, expected);
    let converted = convert_file(entry, Direction::YamlToXml, &prepared, &inputs).unwrap();
    assert!(
        String::from_utf8_lossy(&converted.bytes)
            .contains("uuid=\"426da0c0-ee05-4af5-a132-c7874136d3bf\"")
    );
}

#[test]
fn fact_source_derives_a_new_uuid_from_its_declaration() {
    let seed = "01".repeat(32);
    let document = materialized_new_owner_source("migration.defined-type-own-identity", &seed);
    let expected = nkdk_conversion_core::facts::identity::derive(
        &seed,
        "uuid",
        nkdk_conversion_core::facts::identity::IdentityFormat::Uuid,
        &["ОпределяемыйТип", "Новый"],
    )
    .unwrap();
    assert_eq!(document["name"].as_str(), Some("Новый"));
    assert_eq!(document["uuid"].as_str(), Some(expected.as_str()));
}

fn materialized_new_owner_source(declaration: &str, seed: &str) -> yaml_rust2::Yaml {
    let entry = entry_id(declaration).unwrap();
    let context = format!(
        "{{\"component\":\"cf\",\"parent\":\"configuration\",\"ownerName\":\"Новый\",\"identitySeed\":\"{seed}\"}}"
    );
    let inputs = read_inputs(entry, context.as_bytes()).unwrap();
    let prepared = nkdk_compiled_rules::materialize_fact_source(entry, b"{}", &inputs).unwrap();
    yaml_rust2::YamlLoader::load_from_str(std::str::from_utf8(&prepared).unwrap())
        .unwrap()
        .remove(0)
}

#[test]
fn internal_type_ids_are_materialized_from_the_same_identity_seed() {
    let seed = "01".repeat(32);
    let document = materialized_new_owner_source("migration.defined-type-internal-types", &seed);
    let rows = document["ВнутренниеТипы"].as_vec().unwrap();
    assert_eq!(rows.len(), 1);
    assert_eq!(rows[0]["Имя"].as_str(), Some("DefinedType.Новый"));
    for (key, suffix) in [("Тип", "TypeId"), ("Значение", "ValueId")] {
        let expected = nkdk_conversion_core::facts::identity::derive(
            &seed,
            "uuid",
            nkdk_conversion_core::facts::identity::IdentityFormat::Uuid,
            &[
                "ОпределяемыйТип",
                "Новый",
                "InternalInfo",
                "GeneratedType",
                "DefinedType.Новый",
                suffix,
            ],
        )
        .unwrap();
        assert_eq!(rows[0][key].as_str(), Some(expected.as_str()));
    }
}

#[test]
fn journal_identity_sources_are_available_to_project_routes() {
    assert!(entry_id("metadata.journal").is_some());
    for source in [
        "migration.journal-own-identity",
        "migration.journal-generated-types",
        "migration.journal-base-identity",
        "migration.journal-columns-identity-source",
        "migration.journal-commands-identity-source",
    ] {
        assert!(entry_id(source).is_some(), "{source}");
    }
}

#[test]
fn declared_external_fact_route_survives_xml_import_and_yaml_export() {
    use nkdk::route::{Catalog, Context};
    let routes = "format: nkdk-operation-routes/1\nroutes: []\nfactRoutes:\n- xmlDir: Documents\n  entry: migration.document-root-source\n  only: [cf]\n";
    let catalog = Catalog::parse(routes).unwrap();
    let temp_root =
        std::env::temp_dir().join(format!("nkdk-external-fact-route-{}", std::process::id()));
    let xml_root = temp_root.join("xml");
    let yaml_root = temp_root.join("yaml");
    std::fs::create_dir_all(xml_root.join("Documents")).unwrap();
    std::fs::copy(
        std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
            .join("../../../e2e/fixtures/xml/cf/Documents/ДокументВсеСвойства.xml"),
        xml_root.join("Documents/ДокументВсеСвойства.xml"),
    )
    .unwrap();
    let context = Context {
        component: "cf",
        parent: "configuration",
        default_language: "ru",
        registered_languages: &["ru"],
        compatibility_mode: "Version8_3_27",
    };
    let imported = catalog
        .external_sources(&xml_root, &context, Direction::XmlToYaml)
        .unwrap();
    assert_eq!(imported.len(), 1);
    assert!(String::from_utf8_lossy(&imported[0].bytes).contains("ДокументВсеСвойства"));
    catalog
        .save_external_sources(&yaml_root, &context, &imported)
        .unwrap();
    let exported = catalog
        .external_sources(&yaml_root, &context, Direction::YamlToXml)
        .unwrap();
    assert_eq!(exported.len(), 1);
    assert_eq!(exported[0].bytes, imported[0].bytes);
    std::fs::remove_dir_all(temp_root).unwrap();
}

#[test]
fn file_route_persists_occupied_attributes_without_the_original_resource() {
    use nkdk::facts::{LoadedSource, MaterialSourceHeader, SourceHeader, SourceKind};
    use nkdk::route::{Catalog, Material};
    use nkdk_conversion_core::facts::FactState;
    for with_tree in [false, true] {
        let root = std::env::temp_dir().join(format!("nkdk-occupied-route-{}", std::process::id()));
        std::fs::create_dir_all(root.join("input/Ext")).unwrap();
        let xml =
            include_bytes!("../../../../e2e/fixtures/xml/cf/CommonForms/CommandBar/Ext/Form.xml");
        std::fs::write(root.join("input/Ext/Form.xml"), xml).unwrap();
        let mut spec = String::from(
            "format: nkdk-operation-routes/1\nroutes:\n- xmlDir: Inputs\n  yamlDir: Outputs\n  yamlFile: Свойства.yaml\n  owners: {cf: pilot.boolean}\n  inputs: {}\n  sources:\n  - entry: metadata.form-id-reservations\n    observe: attributes\n    resourceFile: [Ext, Form.xml]\n    inputs: {component: component, owner: name}\n",
        );
        if with_tree {
            for entry in [
                "metadata.current-form-attribute-mode-source",
                "metadata.base-form-attribute-mode-source",
                "metadata.current-form-additional-group-mode-source",
                "metadata.base-form-additional-group-mode-source",
                "metadata.current-form-attribute-tree-source",
                "metadata.base-form-attribute-tree-source",
            ] {
                spec.push_str(&format!("  - entry: {entry}\n    resourceFile: [Ext, Form.xml]\n    newOwner: {{template: {{}}}}\n    inputs: {{component: component, owner: name}}\n"));
            }
        }
        let catalog = Catalog::parse(&spec).unwrap();
        let context = selection_context();
        let snapshots = catalog
            .capture_with_resources(
                std::path::Path::new("Inputs/Example.xml"),
                b"<Boolean>false</Boolean>",
                &context,
                Some(&root.join("input")),
            )
            .unwrap()
            .unwrap();
        assert_eq!(snapshots.len(), if with_tree { 7 } else { 1 });
        assert!(
            std::str::from_utf8(&snapshots[0].bytes)
                .unwrap()
                .contains("nkdk-attribute-reservations/1")
        );
        assert!(snapshots[0].bytes.len() < xml.len());
        catalog
            .save_snapshots(
                &root,
                std::path::Path::new("Outputs/Example/Свойства.yaml"),
                "cf",
                &snapshots,
            )
            .unwrap();
        std::fs::remove_dir_all(root.join("input")).unwrap();
        let restored = catalog
            .load_snapshots(
                &root,
                std::path::Path::new("Outputs/Example/Свойства.yaml"),
                "cf",
            )
            .unwrap();
        let borrowed = restored
            .iter()
            .map(nkdk::route::OwnedSnapshot::borrow)
            .collect::<Vec<_>>();
        let mut resolved = catalog
            .resolve_with_snapshots(
                std::path::Path::new("Outputs/Renamed/Свойства.yaml"),
                Direction::YamlToXml,
                Material::Yaml {
                    owner: "Ложь".as_bytes(),
                    snapshots: &borrowed,
                    new_owner: false,
                },
                &context,
                &borrowed,
            )
            .unwrap()
            .unwrap();
        assert!(matches!(
            resolved.source_materials[0].kind(),
            SourceKind::AttributeReservationSnapshot { .. }
        ));
        let source = resolved.sources.remove(0);
        let mut headers = vec![MaterialSourceHeader {
            source: SourceHeader {
                entry: source.entry,
                direction: Direction::YamlToXml,
                inputs: source.inputs,
            },
            kind: SourceKind::AttributeReservationSnapshot {
                max_depth: 128,
                budget: Default::default(),
            },
        }];
        if with_tree {
            headers.extend(
                resolved
                    .sources
                    .into_iter()
                    .take(6)
                    .zip(resolved.source_materials.into_iter().skip(1))
                    .map(|(source, material)| MaterialSourceHeader {
                        source: SourceHeader {
                            entry: source.entry,
                            direction: source.direction,
                            inputs: source.inputs,
                        },
                        kind: material.kind(),
                    }),
            );
        }
        let prepared = nkdk::facts::prepare_streaming_materials::<nkdk::facts::FactCatalog>(
            headers,
            &[],
            Generation(1),
            operation_budget(10000),
            1000,
            |slot, _| {
                Ok(LoadedSource {
                    bytes: restored[slot].bytes.clone(),
                    documents: vec![],
                })
            },
        )
        .unwrap();
        // Replaying the route snapshot reserves numbers in the new owner context.
        let index = nkdk_compiled_rules::fact_id("metadata.form-attribute-identities").unwrap();
        let mut builder = nkdk_compiled_rules::fact_builder(Generation(2), operation_budget(10000));
        assert!(
            nkdk_compiled_rules::contribute_attribute_snapshot_file(
                source.entry,
                &restored[0].bytes,
                &prepared.sources[0].inputs,
                &mut builder,
                128,
                Default::default()
            )
            .is_empty()
        );
        builder
            .request_number(index, &["cf", "new", "Renamed"], 1)
            .unwrap();
        builder
            .request_number(index, &["cf", "new", "Example"], 1)
            .unwrap();
        let facts = builder.finish();
        assert_eq!(
            facts.lookup_parts(Generation(2), index, &["cf", "new", "Renamed"]),
            FactState::Ready("3")
        );
        assert_eq!(
            facts.lookup_parts(Generation(2), index, &["cf", "new", "Example"]),
            FactState::Ready("1")
        );
        assert_eq!(prepared.sources.len(), if with_tree { 7 } else { 1 });
        if with_tree {
            for (address, id) in [
                ("Атрибут.Реквизит1", "1"),
                ("Атрибут.Реквизит2", "2"),
                ("Атрибут.Реквизит2.Колонка.Реквизит1", "1"),
            ] {
                assert_eq!(
                    prepared
                        .facts
                        .lookup_parts(Generation(1), index, &["cf", address, "Renamed"]),
                    FactState::Ready(id),
                    "{address}"
                );
                assert_eq!(
                    prepared
                        .facts
                        .lookup_parts(Generation(1), index, &["cf", address, "Example"]),
                    FactState::Missing
                );
            }
        }
        // The project operation must preserve the source kind, not treat occupation as semantic YAML.
        let origin = root.join("origin");
        let yaml_project = root.join("yaml");
        let exported = root.join("exported");
        std::fs::create_dir_all(origin.join("Inputs/Example/Ext")).unwrap();
        std::fs::write(
            origin.join("Inputs/Example.xml"),
            b"<Root><Value>false</Value></Root>",
        )
        .unwrap();
        std::fs::write(origin.join("Inputs/Example/Ext/Form.xml"), xml).unwrap();
        let imported = nkdk::project::convert_component_with_catalog(
            &catalog,
            project_request(
                &origin,
                &yaml_project,
                None,
                &root,
                selection_context(),
                Direction::XmlToYaml,
            ),
        )
        .unwrap();
        assert_eq!(imported.outputs.len(), 1);
        assert_eq!(
            std::fs::read_to_string(yaml_project.join("Outputs/Example/Свойства.yaml"))
                .unwrap()
                .trim(),
            "Значение: Ложь"
        );
        std::fs::remove_dir_all(&origin).unwrap();
        let reopened = nkdk::project::convert_component_with_catalog(
            &catalog,
            project_request(
                &yaml_project,
                &exported,
                None,
                &root,
                selection_context(),
                Direction::YamlToXml,
            ),
        )
        .unwrap();
        assert_eq!(reopened.outputs.len(), 1);
        nkdk_conversion_core::proof::verify(
            b"<Root><Value>false</Value></Root>",
            &std::fs::read(exported.join("Inputs/Example.xml")).unwrap(),
            |path| path.last().is_some_and(|name| name.local == "Value"),
        )
        .unwrap();
        let fresh = catalog
            .materialize_sources(
                std::path::Path::new("Outputs/New/Свойства.yaml"),
                &context,
                "seed",
                None,
            )
            .unwrap();
        assert!(
            std::str::from_utf8(&fresh[0].bytes)
                .unwrap()
                .contains("nkdk-attribute-reservations/1")
        );
        for (key, value) in [
            ("observe: attributes", "observe: unknown"),
            (
                "observe: attributes",
                "observe: attributes\n    yamlSource: primary",
            ),
            (
                "observe: attributes",
                "observe: attributes\n    newOwner: {template: {id: 1}}",
            ),
        ] {
            assert!(Catalog::parse(&spec.replace(key, value)).is_err());
        }
        std::fs::remove_dir_all(root).unwrap();
    }
}

#[test]
fn local_fact_source_can_use_current_owner_yaml_without_a_snapshot() {
    use nkdk::route::{Catalog, Material, Snapshot};
    let specification = "format: nkdk-operation-routes/1\nroutes:\n- xmlDir: Other\n  yamlDir: Иное\n  owners: {cf: pilot.boolean}\n  inputs: {}\n  sources:\n  - entry: migration.document-root-source\n    yamlSource: primary\n    inputs: {}\n";
    let catalog = Catalog::parse(specification).unwrap();
    let old = "Вид: Документ\nИмя: Устаревшее\nИдентификатор: old\n".as_bytes();
    let current = "Имя: Current\nИдентификатор: actual\n".as_bytes();
    let snapshot = Snapshot {
        entry: entry_id("migration.document-root-source").unwrap(),
        bytes: old,
    };
    for snapshots in [&[][..], std::slice::from_ref(&snapshot)] {
        let resolved = catalog
            .resolve_with_snapshots(
                std::path::Path::new("Иное/Example.yaml"),
                Direction::YamlToXml,
                Material::Yaml {
                    owner: current,
                    snapshots,
                    new_owner: snapshots.is_empty(),
                },
                &selection_context(),
                snapshots,
            )
            .unwrap()
            .unwrap();
        assert_eq!(resolved.sources[0].bytes, current);
        assert!(matches!(
            resolved.source_materials[0],
            nkdk::route::SourceMaterial::Primary
        ));
        assert!(matches!(
            resolved.sources[0].direction,
            Direction::YamlToXml
        ));
    }
    assert!(
        Catalog::parse(&specification.replace("yamlSource: primary", "yamlSource: automatic"))
            .is_err()
    );
}

#[test]
fn external_facts_read_current_yaml_instead_of_imported_values() {
    use nkdk::route::{Catalog, Context};
    for nested in [false, true] {
        let specification = "format: nkdk-operation-routes/1\nroutes: []\nfactRoutes:\n- xmlDir: Documents\n  yamlDir: Документы\n  entry: migration.document-root-source\n  only: [cf]\n";
        let specification = if nested {
            specification.replace(
                "  yamlDir: Документы\n",
                "  yamlDir: Документы\n  yamlFile: Свойства.yaml\n",
            )
        } else {
            specification.to_owned()
        };
        let catalog = Catalog::parse(&specification).unwrap();
        let root =
            std::env::temp_dir().join(format!("nkdk-current-yaml-facts-{}", std::process::id()));
        let context = Context {
            component: "cf",
            parent: "configuration",
            default_language: "ru",
            registered_languages: &["ru"],
            compatibility_mode: "Version8_3_27",
        };
        let primary = root.join(if nested {
            "Документы/Пример/Свойства.yaml"
        } else {
            "Документы/Пример.yaml"
        });
        let sidecar = root
            .join(".nkdk/facts/cf/external/Documents/migration.document-root-source/Пример.yaml");
        std::fs::create_dir_all(primary.parent().unwrap()).unwrap();
        std::fs::create_dir_all(sidecar.parent().unwrap()).unwrap();
        std::fs::write(
            &sidecar,
            "Вид: Документ\nИмя: Устаревшее\nИдентификатор: old\n",
        )
        .unwrap();
        for name in ["Исходное", "Изменённое"] {
            std::fs::write(&primary, format!("Имя: {name}\nИдентификатор: actual\n")).unwrap();
            let sources = catalog
                .external_sources(&root, &context, Direction::YamlToXml)
                .unwrap();
            assert_eq!(sources.len(), 1);
            let snapshot = yaml_rust2::YamlLoader::load_from_str(
                std::str::from_utf8(&sources[0].bytes).unwrap(),
            )
            .unwrap();
            assert_eq!(snapshot[0]["Имя"].as_str(), Some(name));
            assert_eq!(snapshot[0]["Идентификатор"].as_str(), Some("actual"));
            let snapshot_bytes = sources[0].bytes.clone();
            let prepared = prepare(
                sources
                    .into_iter()
                    .map(|source| Source {
                        entry: source.entry,
                        direction: Direction::YamlToXml,
                        bytes: &snapshot_bytes,
                        inputs: source.inputs,
                    })
                    .collect(),
                &[],
                Generation(1),
                project_budget(),
                100,
            )
            .unwrap();
            let index = nkdk_compiled_rules::fact_id("metadata.roots").unwrap();
            assert_eq!(
                prepared
                    .facts
                    .lookup_parts(Generation(1), index, &["Document", name]),
                nkdk_conversion_core::facts::FactState::Ready("actual")
            );
            assert_eq!(
                prepared
                    .facts
                    .lookup_parts(Generation(1), index, &["Document", "Устаревшее"]),
                nkdk_conversion_core::facts::FactState::Missing
            );
        }
        std::fs::remove_file(&primary).unwrap();
        assert!(
            catalog
                .external_sources(&root, &context, Direction::YamlToXml)
                .unwrap()
                .is_empty()
        );
        std::fs::remove_dir_all(primary.parent().unwrap()).unwrap();
        assert!(
            catalog
                .external_sources(&root, &context, Direction::YamlToXml)
                .unwrap()
                .is_empty()
        );
        for invalid_directory in [
            "../Документы",
            "Документы/Вложенные",
            "",
            ".nkdk",
            "/Документы",
        ] {
            let invalid = specification.replace(
                "yamlDir: Документы",
                &format!("yamlDir: '{invalid_directory}'"),
            );
            assert!(Catalog::parse(&invalid).is_err(), "{invalid_directory}");
        }
        if nested {
            for file in [
                "../Свойства.yaml",
                "Папка/Свойства.yaml",
                "Свойства.xml",
                "",
                "/Свойства.yaml",
            ] {
                let invalid = specification.replace(
                    "  yamlFile: Свойства.yaml\n",
                    &format!("  yamlFile: '{file}'\n"),
                );
                assert!(Catalog::parse(&invalid).is_err(), "{file}");
            }
        }
        std::fs::remove_dir_all(root).unwrap();
    }
}

#[test]
fn enumeration_identity_sources_materialize_all_source_declared_generated_types() {
    let seed = "01".repeat(32);
    let owner = materialized_new_owner_source("migration.enumeration-own-identity", &seed);
    let expected_owner = nkdk_conversion_core::facts::identity::derive(
        &seed,
        "uuid",
        nkdk_conversion_core::facts::identity::IdentityFormat::Uuid,
        &["Перечисление", "Новый"],
    )
    .unwrap();
    assert_eq!(owner["uuid"].as_str(), Some(expected_owner.as_str()));
    let types = materialized_new_owner_source("migration.enumeration-internal-types", &seed);
    let rows = types["ВнутренниеТипы"].as_vec().unwrap();
    for (row, prefix, category) in [
        (0, "EnumRef", "Ref"),
        (1, "EnumManager", "Manager"),
        (2, "EnumList", "List"),
    ] {
        assert_eq!(
            rows[row]["Имя"].as_str(),
            Some(format!("{prefix}.Новый").as_str())
        );
        assert_eq!(rows[row]["Категория"].as_str(), Some(category));
        for (key, suffix) in [("Тип", "TypeId"), ("Значение", "ValueId")] {
            let name = format!("{prefix}.Новый");
            let expected = nkdk_conversion_core::facts::identity::derive(
                &seed,
                "uuid",
                nkdk_conversion_core::facts::identity::IdentityFormat::Uuid,
                &[
                    "Перечисление",
                    "Новый",
                    "InternalInfo",
                    "GeneratedType",
                    &name,
                    suffix,
                ],
            )
            .unwrap();
            assert_eq!(rows[row][key].as_str(), Some(expected.as_str()));
        }
    }
}

#[test]
fn enumeration_identity_sources_prepare_facts_from_real_xml() {
    let xml = include_bytes!("../../../../e2e/fixtures/xml/cf/Enums/ПеречислениеВсеСвойства.xml");
    let owner_entry = entry_id("migration.enumeration-own-identity").unwrap();
    let types_entry = entry_id("migration.enumeration-internal-types").unwrap();
    let owner_inputs = read_inputs(
        owner_entry,
        br#"{"component":"cf","parent":"configuration"}"#,
    )
    .unwrap();
    let types_inputs = read_inputs(
        types_entry,
        r#"{"component":"cf","parent":"configuration","ownerName":"ПеречислениеВсеСвойства"}"#
            .as_bytes(),
    )
    .unwrap();
    let owner_yaml =
        nkdk_compiled_rules::snapshot_fact_source(owner_entry, xml, &owner_inputs).unwrap();
    let types_yaml =
        nkdk_compiled_rules::snapshot_fact_source(types_entry, xml, &types_inputs).unwrap();
    let prepared = prepare(
        vec![
            Source {
                entry: owner_entry,
                direction: Direction::YamlToXml,
                bytes: &owner_yaml,
                inputs: owner_inputs,
            },
            Source {
                entry: types_entry,
                direction: Direction::YamlToXml,
                bytes: &types_yaml,
                inputs: types_inputs,
            },
        ],
        &[owner_entry, types_entry],
        Generation(1),
        operation_budget(10000),
        10000,
    )
    .unwrap_or_else(|errors| panic!("{errors:?}"));
    let identities = nkdk_compiled_rules::fact_id("metadata.own-identities").unwrap();
    let type_ids = nkdk_compiled_rules::fact_id("metadata.internal-type-ids").unwrap();
    assert_eq!(
        prepared.facts.lookup_parts(
            Generation(1),
            identities,
            &["cf", "Enum", "ПеречислениеВсеСвойства", "configuration"]
        ),
        nkdk_conversion_core::facts::FactState::Ready("ec93e916-ecd7-45c4-8e73-ea76f186183c")
    );
    assert_eq!(
        prepared.facts.lookup_parts(
            Generation(1),
            type_ids,
            &["EnumRef", "ec93e916-ecd7-45c4-8e73-ea76f186183c"]
        ),
        nkdk_conversion_core::facts::FactState::Ready("97de3824-d734-4183-b984-98c48ae0a7ab")
    );
}

#[test]
fn enumeration_base_identity_source_reads_the_adopted_xml_owner() {
    let entry = entry_id("migration.enumeration-base-identity").unwrap();
    let inputs = read_inputs(
        entry,
        r#"{"component":"cfe","parent":"configuration","ownerName":"ПеречислениеВсеСвойства"}"#
            .as_bytes(),
    )
    .unwrap();
    let xml = include_bytes!(
        "../../../../e2e/fixtures/xml/cfe/all-extension/Enums/ПеречислениеВсеСвойства.xml"
    );
    let snapshot = nkdk_compiled_rules::snapshot_fact_source(entry, xml, &inputs).unwrap();
    let rendered = String::from_utf8(snapshot).unwrap();
    assert!(
        rendered.contains("ec93e916-ecd7-45c4-8e73-ea76f186183c"),
        "{rendered}"
    );
}

#[test]
fn enumeration_identity_snapshot_contributes_its_uuid_on_yaml_export() {
    let entry = entry_id("migration.enumeration-own-identity").unwrap();
    let inputs = nkdk_compiled_rules::prepare_inputs(
        entry,
        vec![
            (
                "component".into(),
                nkdk_compiled_rules::InputValue::Text("cf".into()),
            ),
            (
                "parent".into(),
                nkdk_compiled_rules::InputValue::Text("configuration".into()),
            ),
            (
                "ownerName".into(),
                nkdk_compiled_rules::InputValue::Text("Перечисление1".into()),
            ),
        ],
    )
    .unwrap();
    let mut loads = 0;
    let prepared = nkdk::facts::prepare_streaming_materials::<nkdk::facts::FactCatalog>(
        vec![nkdk::facts::MaterialSourceHeader {
            source: nkdk::facts::SourceHeader {
                entry,
                direction: Direction::YamlToXml,
                inputs,
            },
            kind: nkdk::facts::SourceKind::Snapshot,
        }],
        &[entry],
        Generation(1),
        operation_budget(100),
        256,
        |_, _| {
            loads += 1;
            Ok(nkdk::facts::LoadedSource {
                bytes: "name: Перечисление1\nuuid: 9c860460-72d9-491d-b622-4916f7ff3323"
                    .as_bytes()
                    .to_vec(),
                documents: vec![],
            })
        },
    )
    .unwrap();
    assert_eq!(loads, 1);
    let ids = nkdk_compiled_rules::fact_id("metadata.own-identities").unwrap();
    assert_eq!(
        prepared.facts.lookup_parts(
            Generation(1),
            ids,
            &["cf", "Enum", "Перечисление1", "configuration"]
        ),
        nkdk_conversion_core::facts::FactState::Ready("9c860460-72d9-491d-b622-4916f7ff3323")
    );
}

#[test]
fn declared_project_route_converts_a_component_after_reopening_its_yaml() {
    assert!(entry_id("metadata.websocket-client").is_some());
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
            compatibility_mode: "Version8_3_27",
        };
        let base_yaml = temp_root.join("base-yaml");
        let attempt_context = |run_component,
                               base_component_root: Option<&std::path::Path>,
                               direction,
                               source_root: &std::path::Path,
                               target_root: &std::path::Path| {
            project::convert_component(project::Request {
                source_root,
                target_root,
                base_component_root,
                temporary_parent: &temp_root,
                context: Context {
                    component: run_component,
                    ..context()
                },
                direction,
                generation: Generation(1),
                fact_budget: project_budget(),
                edge_budget: 10000,
                limits: operation_limits(),
                xml_bytes: 1000000,
            })
        };
        if component == "cfe" {
            attempt_context(
                "cf",
                None,
                Direction::XmlToYaml,
                &repository.join("e2e/fixtures/xml/cf"),
                &base_yaml,
            )
            .unwrap();
        }
        let attempt = |direction, source: &std::path::Path, target: &std::path::Path| {
            attempt_context(
                component,
                (component == "cfe").then_some(base_yaml.as_path()),
                direction,
                source,
                target,
            )
        };
        let convert = |direction, source_root: &std::path::Path, target_root: &std::path::Path| {
            attempt(direction, source_root, target_root)
                .unwrap_or_else(|errors| panic!("{component} {direction:?}: {errors:?}"))
        };
        let imported = convert(Direction::XmlToYaml, &repository.join(xml_root), &yaml_root);
        let existing_owners = if component == "cf" { 47 } else { 70 };
        assert_eq!(imported.outputs.len(), existing_owners);
        for path in &imported.outputs {
            let expected =
                std::fs::read_to_string(repository.join(fixture_yaml_root).join(path)).unwrap();
            let actual = std::fs::read_to_string(yaml_root.join(path)).unwrap();
            let mut expected = expected;
            if path.starts_with("Нумератор") && expected.trim().is_empty() {
                // The immutable XML has an explicitly empty history. The old
                // YAML loses it; absent numeric defaults need no preservation.
                let name = path.file_stem().unwrap().to_str().unwrap();
                let source = std::fs::read_to_string(
                    repository
                        .join(xml_root)
                        .join("DocumentNumerators")
                        .join(format!("{name}.xml")),
                )
                .unwrap();
                if source.contains("<InternalInfo/>") {
                    expected = "InternalInfo: !xml/raw\n  $xml: \"\"\n".into();
                }
            }
            if component == "cfe" {
                for (yaml_path, xml_path, resource, property, base_resource) in [
                    (
                        "WebSocketКлиент/WebSocketКлиентВсеСвойства/Свойства.yaml",
                        "WebSocketClients/WebSocketКлиентВсеСвойства.xml",
                        "Ext/Module.bsl",
                        "Module",
                        "WebSocketКлиент/WebSocketКлиентВсеСвойства/Модуль.bsl",
                    ),
                    (
                        "ПакетXDTO/ПакетXDTOВсеСвойства/Свойства.yaml",
                        "XDTOPackages/ПакетXDTOВсеСвойства.xml",
                        "Ext/Package.bin",
                        "Package",
                        "ПакетXDTO/ПакетXDTOВсеСвойства/Package.bin",
                    ),
                    (
                        "Бот/БотВсеСвойства/Свойства.yaml",
                        "Bots/БотВсеСвойства.xml",
                        "Ext/Module.bsl",
                        "Module",
                        "Бот/БотВсеСвойства/Модуль.bsl",
                    ),
                    (
                        "Роль/РольВсеСвойства/Свойства.yaml",
                        "Roles/РольВсеСвойства.xml",
                        "Ext/Rights.xml",
                        "Rights",
                        "Роль/РольВсеСвойства/Rights.xml",
                    ),
                    (
                        "Роль/РольПоУмолчанию/Свойства.yaml",
                        "Roles/РольПоУмолчанию.xml",
                        "Ext/Rights.xml",
                        "Rights",
                        "Роль/РольПоУмолчанию/Rights.xml",
                    ),
                    (
                        "ОбщийМакет/ТабличныйДокументВсеСвойства/Свойства.yaml",
                        "CommonTemplates/ТабличныйДокументВсеСвойства.xml",
                        "Ext/Template.xml",
                        "Template",
                        "ОбщийМакет/ТабличныйДокументВсеСвойства/Template.xml",
                    ),
                ] {
                    if path == std::path::Path::new(yaml_path) {
                        expected = expected_missing_changed_resource(
                            &expected,
                            &repository.join(xml_root).join(xml_path),
                            resource,
                            property,
                            &base_yaml.join(base_resource),
                        );
                    }
                }
            }
            let raw = nkdk_conversion_core::raw::Document::decode(actual.as_bytes()).unwrap();
            let actual_meaning = raw.as_ref().map_or(actual.as_str(), |raw| {
                std::str::from_utf8(&raw.meaning).unwrap()
            });
            let expected_documents =
                yaml_rust2::YamlLoader::load_from_str(&canonical_state_nulls(&expected)).unwrap();
            let actual_documents =
                yaml_rust2::YamlLoader::load_from_str(&canonical_state_nulls(actual_meaning))
                    .unwrap();
            assert!(
                expected_documents.len() == actual_documents.len()
                    && expected_documents
                        .iter()
                        .zip(&actual_documents)
                        .all(|(left, right)| equivalent_yaml(left, right)),
                "{component}: {}\nexpected: {expected}\nactual: {actual}",
                path.display()
            );
        }
        let exported = convert(Direction::YamlToXml, &yaml_root, &rebuilt_xml_root);
        assert_eq!(exported.outputs.len(), existing_owners);
        for path in &exported.outputs {
            let original = std::fs::read_to_string(repository.join(xml_root).join(path)).unwrap();
            let rebuilt = std::fs::read_to_string(rebuilt_xml_root.join(path)).unwrap();
            assert_eq!(
                normalized_xml(&original),
                normalized_xml(&rebuilt),
                "{component}: {}",
                path.display()
            );
            for (directory, yaml_directory, source_file, target_file) in [
                (
                    "XDTOPackages",
                    "ПакетXDTO",
                    "Ext/Package.bin",
                    "Package.bin",
                ),
                (
                    "WebSocketClients",
                    "WebSocketКлиент",
                    "Ext/Module.bsl",
                    "Модуль.bsl",
                ),
                ("Styles", "Стиль", "Ext/Style.xml", "Style.xml"),
            ] {
                if !path.starts_with(directory) {
                    continue;
                }
                let name = path.file_stem().unwrap();
                let source = repository
                    .join(xml_root)
                    .join(directory)
                    .join(name)
                    .join(source_file);
                let imported = yaml_root.join(yaml_directory).join(name).join(target_file);
                let exported = rebuilt_xml_root
                    .join(directory)
                    .join(name)
                    .join(source_file);
                if source.is_file() {
                    let expected = std::fs::read(source).unwrap();
                    assert_eq!(std::fs::read(imported).unwrap(), expected);
                    assert_eq!(std::fs::read(exported).unwrap(), expected);
                } else {
                    assert!(!imported.exists(), "{imported:?}");
                    assert!(!exported.exists(), "{exported:?}");
                }
            }
        }
        {
            let journal_name = if component == "cf" {
                "ЖурналДокументовВсеСвойства"
            } else {
                "ЖурналДокументовВсеСвойстваExt"
            };
            let relative = format!("DocumentJournals/{journal_name}.xml");
            let source_path = rebuilt_xml_root.join(&relative);
            let original = std::fs::read_to_string(&source_path).unwrap();
            for (index, altered) in [
                original.replacen("MetaDataObject ", "MetaDataObject audit=\"kept\" ", 1),
                original.replacen(
                    "MetaDataObject ",
                    "MetaDataObject xmlns:audit=\"urn:audit\" audit:note=\"kept\" ",
                    1,
                ),
                original.replacen("version=\"2.20\"", "version=\"3.00\"", 1),
                original.replacen(" version=\"2.20\"", "", 1),
            ]
            .into_iter()
            .enumerate()
            {
                assert_ne!(original, altered);
                std::fs::write(&source_path, &altered).unwrap();
                let annotations = temp_root.join(format!("root-annotations-{index}"));
                let restored_root = temp_root.join(format!("root-restored-{index}"));
                convert(Direction::XmlToYaml, &rebuilt_xml_root, &annotations);
                let yaml = std::fs::read_to_string(
                    annotations.join(format!("ЖурналДокументов/{journal_name}/Свойства.yaml")),
                )
                .unwrap();
                assert!(yaml.contains("!xml/raw"), "{yaml}");
                convert(Direction::YamlToXml, &annotations, &restored_root);
                let restored = std::fs::read_to_string(restored_root.join(&relative)).unwrap();
                assert_eq!(normalized_xml(&altered), normalized_xml(&restored));
            }
            std::fs::write(source_path, original).unwrap();
        }
        if component == "cf" {
            let journal = std::path::Path::new("DocumentJournals/ЖурналДокументовВсеСвойства.xml");
            let original = std::fs::read_to_string(rebuilt_xml_root.join(journal)).unwrap();
            let anomalous = original.replace(
                "UseStandardCommands>false</",
                "UseStandardCommands>invalid</",
            );
            assert_ne!(
                anomalous, original,
                "expected UseStandardCommands in journal XML"
            );
            std::fs::write(rebuilt_xml_root.join(journal), &anomalous).unwrap();
            let anomalous_yaml_root = temp_root.join("journal-anomalous-yaml");
            convert(
                Direction::XmlToYaml,
                &rebuilt_xml_root,
                &anomalous_yaml_root,
            );
            let journal_yaml = std::fs::read_to_string(
                anomalous_yaml_root
                    .join("ЖурналДокументов/ЖурналДокументовВсеСвойства/Свойства.yaml"),
            )
            .unwrap();
            assert!(journal_yaml.contains("!xml/invalid"), "{journal_yaml}");
            assert!(
                journal_yaml.contains("РегистрируемыеДокументы"),
                "{journal_yaml}"
            );
            let anomalous_xml_root = temp_root.join("journal-anomalous-xml");
            convert(
                Direction::YamlToXml,
                &anomalous_yaml_root,
                &anomalous_xml_root,
            );
            let restored = std::fs::read_to_string(anomalous_xml_root.join(journal)).unwrap();
            assert_eq!(normalized_xml(&anomalous), normalized_xml(&restored));
        }
        for owner in ["ПеречислениеВсеСвойства", "ПеречислениеВсеСвойстваExt"]
        {
            for resource in [
                "Ext/ManagerModule.bsl",
                "Commands/Команда1/Ext/CommandModule.bsl",
                "Forms/ФормаСписка/Ext/Form/Module.bsl",
            ] {
                let relative = format!("Enums/{owner}/{resource}");
                if repository.join(xml_root).join(&relative).exists() {
                    assert_eq!(
                        std::fs::read(repository.join(xml_root).join(&relative)).unwrap(),
                        std::fs::read(rebuilt_xml_root.join(&relative)).unwrap(),
                        "{component}: {relative}"
                    );
                }
            }
        }
        let result = std::fs::read_to_string(
            rebuilt_xml_root.join("DefinedTypes/ОпределяемыйТипВсеСвойства.xml"),
        )
        .unwrap();
        assert!(result.contains(expected_uuid), "{result}");
        assert!(result.contains("InternalInfo>"), "{result}");
        let owner_path = std::path::Path::new("ОпределяемыйТип/ОпределяемыйТипВсеСвойства.yaml");
        let catalog = nkdk::route::catalog();
        let imported = catalog
            .load_imported_owners(&yaml_root, component)
            .unwrap()
            .unwrap();
        assert!(imported.contains(owner_path.to_str().unwrap()));
        assert!(!imported.contains("ОпределяемыйТип/Новый.yaml"));
        if component == "cfe" {
            let snapshots = catalog
                .load_snapshots(&yaml_root, owner_path, component)
                .unwrap();
            let incomplete: Vec<_> = snapshots
                .into_iter()
                .filter(|snapshot| snapshot.name != "migration.defined-type-base-identity")
                .collect();
            catalog
                .save_snapshots(&yaml_root, owner_path, component, &incomplete)
                .unwrap();
            let errors = attempt(
                Direction::YamlToXml,
                &yaml_root,
                &temp_root.join("missing-base"),
            )
            .err()
            .expect("imported base identity is mandatory");
            assert!(
                errors
                    .iter()
                    .any(|error| error.code.as_deref() == Some("operation.route"))
            );
            let restored = catalog
                .capture(
                    std::path::Path::new("DefinedTypes/ОпределяемыйТипВсеСвойства.xml"),
                    &std::fs::read(
                        repository
                            .join(xml_root)
                            .join("DefinedTypes/ОпределяемыйТипВсеСвойства.xml"),
                    )
                    .unwrap(),
                    &context(),
                )
                .unwrap()
                .unwrap();
            catalog
                .save_snapshots(&yaml_root, owner_path, component, &restored)
                .unwrap();
        }
        let new_owner = yaml_root.join("ОпределяемыйТип/Новый.yaml");
        std::fs::write(&new_owner, "Тип: [Строка]\n").unwrap();
        if component == "cf" {
            let first_root = temp_root.join("new-first");
            let second_root = temp_root.join("new-second");
            let first = convert(Direction::YamlToXml, &yaml_root, &first_root);
            assert_eq!(first.outputs.len(), existing_owners + 1);
            let snapshots = catalog
                .load_snapshots(
                    &yaml_root,
                    std::path::Path::new("ОпределяемыйТип/Новый.yaml"),
                    component,
                )
                .unwrap();
            assert_eq!(snapshots.len(), 2);
            let first_xml = std::fs::read(first_root.join("DefinedTypes/Новый.xml")).unwrap();
            let second = convert(Direction::YamlToXml, &yaml_root, &second_root);
            assert_eq!(second.outputs.len(), existing_owners + 1);
            let second_xml = std::fs::read(second_root.join("DefinedTypes/Новый.xml")).unwrap();
            assert_eq!(
                normalized_xml(std::str::from_utf8(&first_xml).unwrap()),
                normalized_xml(std::str::from_utf8(&second_xml).unwrap())
            );
            let reimport_root = temp_root.join("new-reimport");
            let reimported = convert(Direction::XmlToYaml, &first_root, &reimport_root);
            assert_eq!(reimported.outputs.len(), existing_owners + 1);
            let reimported_yaml =
                std::fs::read_to_string(reimport_root.join("ОпределяемыйТип/Новый.yaml")).unwrap();
            assert_eq!(
                yaml_rust2::YamlLoader::load_from_str(&reimported_yaml).unwrap()[0]["Тип"].as_str(),
                Some("Строка")
            );
            let third_root = temp_root.join("new-third");
            let third = convert(Direction::YamlToXml, &reimport_root, &third_root);
            assert_eq!(third.outputs.len(), existing_owners + 1);
            let third_xml =
                std::fs::read_to_string(third_root.join("DefinedTypes/Новый.xml")).unwrap();
            assert_eq!(
                normalized_xml(std::str::from_utf8(&first_xml).unwrap()),
                normalized_xml(&third_xml)
            );
        } else {
            let first_root = temp_root.join("new-first");
            let second_root = temp_root.join("new-second");
            assert_eq!(
                convert(Direction::YamlToXml, &yaml_root, &first_root)
                    .outputs
                    .len(),
                existing_owners + 1
            );
            assert_eq!(
                convert(Direction::YamlToXml, &yaml_root, &second_root)
                    .outputs
                    .len(),
                existing_owners + 1
            );
            let first_xml =
                std::fs::read_to_string(first_root.join("DefinedTypes/Новый.xml")).unwrap();
            let second_xml =
                std::fs::read_to_string(second_root.join("DefinedTypes/Новый.xml")).unwrap();
            assert_eq!(normalized_xml(&first_xml), normalized_xml(&second_xml));
            assert!(
                !first_xml.contains("ExtendedConfigurationObject"),
                "{first_xml}"
            );
            assert!(
                !first_xml.contains("<ObjectBelonging>Adopted</ObjectBelonging>"),
                "{first_xml}"
            );
            let reimport_root = temp_root.join("new-reimport");
            assert_eq!(
                convert(Direction::XmlToYaml, &first_root, &reimport_root)
                    .outputs
                    .len(),
                existing_owners + 1
            );
            let third_root = temp_root.join("new-third");
            assert_eq!(
                convert(Direction::YamlToXml, &reimport_root, &third_root)
                    .outputs
                    .len(),
                existing_owners + 1
            );
            let third_xml =
                std::fs::read_to_string(third_root.join("DefinedTypes/Новый.xml")).unwrap();
            assert_eq!(normalized_xml(&first_xml), normalized_xml(&third_xml));
            let sidecar = catalog
                .sidecar_path(
                    std::path::Path::new("ОпределяемыйТип/Новый.yaml"),
                    component,
                )
                .unwrap()
                .unwrap();
            assert!(yaml_root.join(sidecar).exists());
        }
        std::fs::remove_file(new_owner).unwrap();
        let new_enum = yaml_root.join("Перечисление/Новое/Свойства.yaml");
        std::fs::create_dir_all(new_enum.parent().unwrap()).unwrap();
        std::fs::write(&new_enum, "").unwrap();
        let enum_first_root = temp_root.join("new-enum-first");
        let enum_second_root = temp_root.join("new-enum-second");
        assert_eq!(
            convert(Direction::YamlToXml, &yaml_root, &enum_first_root)
                .outputs
                .len(),
            existing_owners + 1
        );
        assert_eq!(
            convert(Direction::YamlToXml, &yaml_root, &enum_second_root)
                .outputs
                .len(),
            existing_owners + 1
        );
        let enum_xml = std::fs::read_to_string(enum_first_root.join("Enums/Новое.xml")).unwrap();
        let enum_xml_again =
            std::fs::read_to_string(enum_second_root.join("Enums/Новое.xml")).unwrap();
        assert_eq!(normalized_xml(&enum_xml), normalized_xml(&enum_xml_again));
        assert!(enum_xml.contains("InternalInfo"), "{enum_xml}");
        if component == "cfe" {
            assert!(
                !enum_xml.contains("ExtendedConfigurationObject"),
                "{enum_xml}"
            );
        }
        std::fs::remove_file(new_enum).unwrap();
        let new_journal = yaml_root.join("ЖурналДокументов/НовыйЖурнал/Свойства.yaml");
        std::fs::create_dir_all(new_journal.parent().unwrap()).unwrap();
        std::fs::write(&new_journal, "").unwrap();
        let journal_first_root = temp_root.join("new-journal-first");
        let journal_second_root = temp_root.join("new-journal-second");
        assert_eq!(
            convert(Direction::YamlToXml, &yaml_root, &journal_first_root)
                .outputs
                .len(),
            existing_owners + 1
        );
        assert_eq!(
            convert(Direction::YamlToXml, &yaml_root, &journal_second_root)
                .outputs
                .len(),
            existing_owners + 1
        );
        let journal_xml =
            std::fs::read_to_string(journal_first_root.join("DocumentJournals/НовыйЖурнал.xml"))
                .unwrap();
        let journal_xml_again =
            std::fs::read_to_string(journal_second_root.join("DocumentJournals/НовыйЖурнал.xml"))
                .unwrap();
        assert_eq!(
            normalized_xml(&journal_xml),
            normalized_xml(&journal_xml_again)
        );
        assert!(journal_xml.contains("InternalInfo"), "{journal_xml}");
        let journal_reimport_root = temp_root.join("new-journal-reimport");
        assert_eq!(
            convert(
                Direction::XmlToYaml,
                &journal_first_root,
                &journal_reimport_root
            )
            .outputs
            .len(),
            existing_owners + 1
        );
        std::fs::remove_file(new_journal).unwrap();
        let sidecar = catalog
            .sidecar_path(owner_path, component)
            .unwrap()
            .unwrap();
        std::fs::remove_file(yaml_root.join(sidecar)).unwrap();
        assert!(imported.contains(owner_path.to_str().unwrap()));
        let incomplete = attempt(
            Direction::YamlToXml,
            &yaml_root,
            &temp_root.join("incomplete"),
        )
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
fn new_adopted_extension_uses_prepared_base_component_identity() {
    let repository = std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join("../../..");
    let temp_root =
        std::env::temp_dir().join(format!("nkdk-project-adopted-{}", std::process::id()));
    std::fs::create_dir_all(&temp_root).unwrap();
    let attempt = |component: &str,
                   direction: Direction,
                   source_root: &std::path::Path,
                   target_root: &std::path::Path,
                   base_component_root: Option<&std::path::Path>| {
        convert_fixture_component(
            nkdk::route::catalog(),
            component,
            direction,
            source_root,
            target_root,
            base_component_root,
            &temp_root,
        )
    };
    let run = |component: &str,
               direction: Direction,
               source_root: &std::path::Path,
               target_root: &std::path::Path,
               base_component_root: Option<&std::path::Path>| {
        attempt(
            component,
            direction,
            source_root,
            target_root,
            base_component_root,
        )
        .unwrap_or_else(|errors| panic!("{component} {direction:?}: {errors:?}"))
    };
    let base_yaml = temp_root.join("base-yaml");
    run(
        "cf",
        Direction::XmlToYaml,
        &repository.join("e2e/fixtures/xml/cf"),
        &base_yaml,
        None,
    );
    std::fs::write(
        base_yaml.join("ОпределяемыйТип/Новый.yaml"),
        "Тип: Строка\n",
    )
    .unwrap();
    let base_xml = temp_root.join("base-xml");
    run("cf", Direction::YamlToXml, &base_yaml, &base_xml, None);
    let base = std::fs::read_to_string(base_xml.join("DefinedTypes/Новый.xml")).unwrap();
    let base_uuid = base
        .split("uuid=\"")
        .nth(1)
        .unwrap()
        .split('"')
        .next()
        .unwrap();

    let extension_yaml = temp_root.join("extension-yaml");
    run(
        "cfe",
        Direction::XmlToYaml,
        &repository.join("e2e/fixtures/xml/cfe/all-extension"),
        &extension_yaml,
        None,
    );
    std::fs::write(
        extension_yaml.join("ОпределяемыйТип/Новый.yaml"),
        "Тип: Строка\n",
    )
    .unwrap();
    let missing_root = temp_root.join("missing-project");
    let errors = attempt(
        "cfe",
        Direction::YamlToXml,
        &extension_yaml,
        &temp_root.join("missing-project-output"),
        Some(&missing_root),
    )
    .err()
    .expect("missing base project must be reported");
    assert!(
        errors
            .iter()
            .any(|error| error.code.as_deref() == Some("project.base"))
    );
    let own_path = std::path::Path::new("ОпределяемыйТип/Новый.yaml");
    let base_sidecar = nkdk::route::catalog()
        .sidecar_path(own_path, "cf")
        .unwrap()
        .unwrap();
    let prepared = std::fs::read(base_yaml.join(&base_sidecar)).unwrap();
    std::fs::remove_file(base_yaml.join(&base_sidecar)).unwrap();
    let errors = attempt(
        "cfe",
        Direction::YamlToXml,
        &extension_yaml,
        &temp_root.join("missing-base"),
        Some(&base_yaml),
    )
    .err()
    .expect("missing base snapshot must be reported");
    assert!(
        errors
            .iter()
            .any(|error| error.code.as_deref() == Some("operation.route"))
    );
    assert!(
        !extension_yaml
            .join(
                nkdk::route::catalog()
                    .sidecar_path(own_path, "cfe")
                    .unwrap()
                    .unwrap()
            )
            .exists()
    );
    std::fs::write(base_yaml.join(base_sidecar), prepared).unwrap();
    let extension_xml = temp_root.join("extension-xml");
    run(
        "cfe",
        Direction::YamlToXml,
        &extension_yaml,
        &extension_xml,
        Some(&base_yaml),
    );
    let adopted = std::fs::read_to_string(extension_xml.join("DefinedTypes/Новый.xml")).unwrap();
    let elements = normalized_xml(&adopted);
    assert!(
        elements.iter().any(|item| item == "text Adopted"),
        "{adopted}"
    );
    assert!(
        elements
            .iter()
            .any(|item| item == &format!("text {base_uuid}")),
        "{adopted}"
    );
    let repeated_root = temp_root.join("extension-repeated");
    run(
        "cfe",
        Direction::YamlToXml,
        &extension_yaml,
        &repeated_root,
        None,
    );
    let repeated = std::fs::read_to_string(repeated_root.join("DefinedTypes/Новый.xml")).unwrap();
    assert_eq!(normalized_xml(&adopted), normalized_xml(&repeated));
    std::fs::remove_dir_all(temp_root).unwrap();
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
        base_component_root: None,
        temporary_parent: &temp_root,
        context: Context {
            component: "cf",
            parent: "configuration",
            default_language: "ru",
            registered_languages: &["ru", "en"],
            compatibility_mode: "Version8_3_27",
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
        base_component_root: None,
        temporary_parent: &temp_root,
        context: Context {
            component: "cf",
            parent: "configuration",
            default_language: "ru",
            registered_languages: &["ru", "en"],
            compatibility_mode: "Version8_3_27",
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

fn selection_resolve(
    catalog: &nkdk::route::Catalog,
    snapshots: &[nkdk::route::Snapshot<'_>],
) -> Result<Option<nkdk::route::Resolved<'static>>, nkdk_conversion_core::RuntimeDiagnostic> {
    catalog.resolve_with_snapshots(
        std::path::Path::new("Other/Example.xml"),
        Direction::XmlToYaml,
        nkdk::route::Material::Xml(b"<Root/>"),
        &selection_context(),
        snapshots,
    )
}

fn selection_context() -> nkdk::route::Context<'static> {
    nkdk::route::Context {
        component: "cf",
        parent: "",
        default_language: "ru",
        registered_languages: &["ru"],
        compatibility_mode: "Version8_3_27",
    }
}

fn selection_snapshot(profile: &str) -> nkdk::route::OwnedSnapshot {
    let name = "migration.enumeration-own-identity";
    nkdk::route::OwnedSnapshot {
        name: name.into(),
        entry: entry_id(name).unwrap(),
        bytes: format!("profile: {profile}\n").into_bytes(),
    }
}

#[test]
fn operation_route_selects_owner_from_snapshot_cases() {
    use nkdk::route::{Catalog, Material};
    let specification = "format: nkdk-operation-routes/1\nroutes:\n- xmlDir: Other\n  yamlDir: Иное\n  owners:\n    cf:\n      select:\n        on: {snapshot: {entry: migration.enumeration-own-identity, field: profile}}\n        cases:\n          first: {literal: migration.metadata-uuid}\n          second: {literal: pilot.boolean}\n  inputs: {}\n  sources: []\n";
    let catalog = Catalog::parse(specification).unwrap();
    let context = selection_context();
    for (profile, selected) in [
        ("first", "migration.metadata-uuid"),
        ("second", "pilot.boolean"),
    ] {
        let snapshot = selection_snapshot(profile);
        let snapshots = [snapshot.borrow()];
        let resolved = catalog
            .resolve_with_snapshots(
                std::path::Path::new("Other/Example.xml"),
                Direction::XmlToYaml,
                Material::Xml(b"<Root/>"),
                &context,
                &snapshots,
            )
            .unwrap()
            .unwrap();
        assert_eq!(
            resolved.sources[resolved.owner_source_index].entry.0,
            entry_id(selected).unwrap().0
        );
        let exported = catalog
            .resolve(
                std::path::Path::new("Иное/Example.yaml"),
                Direction::YamlToXml,
                Material::Yaml {
                    owner: b"",
                    snapshots: &snapshots,
                    new_owner: false,
                },
                &context,
            )
            .unwrap()
            .unwrap();
        assert_eq!(
            exported.sources[exported.owner_source_index].entry.0,
            entry_id(selected).unwrap().0
        );
    }
    assert!(
        catalog
            .resolve_with_snapshots(
                std::path::Path::new("Other/Example.xml"),
                Direction::XmlToYaml,
                Material::Xml(b"<Root/>"),
                &context,
                &[]
            )
            .is_err()
    );
    assert!(Catalog::parse(&specification.replace("pilot.boolean", "unregistered.owner")).is_err());
    for invalid in [
        specification.replace("{literal: pilot.boolean}", "{literal: true}"),
        specification.replace("{literal: pilot.boolean}", "name"),
        specification.replace("select:", "unsupported:"),
    ] {
        assert!(Catalog::parse(&invalid).is_err());
    }
}

#[test]
fn operation_route_maps_snapshot_cases_to_typed_inputs() {
    use nkdk::route::Catalog;
    let catalog=Catalog::parse("format: nkdk-operation-routes/1\nroutes:\n- xmlDir: Other\n  yamlDir: Иное\n  owners: {cf: migration.metadata-uuid}\n  inputs:\n    component:\n      select:\n        on: {snapshot: {entry: migration.enumeration-own-identity, field: profile}}\n        cases:\n          first: {literal: first-component}\n          second: {literal: second-component}\n  sources: []\n").unwrap();
    for (profile, expected) in [
        ("first", Some("first-component")),
        ("second", Some("second-component")),
        ("unknown", None),
    ] {
        let snapshot = selection_snapshot(profile);
        let snapshots = [snapshot.borrow()];
        let result = selection_resolve(&catalog, &snapshots);
        if let Some(expected) = expected {
            let result = result.unwrap().unwrap();
            let source = &result.sources[result.owner_source_index];
            let slot = nkdk_compiled_rules::input_names(source.entry)
                .iter()
                .position(|name| *name == "component")
                .unwrap();
            assert_eq!(source.inputs.view().text(slot).unwrap(), expected);
        } else {
            assert!(result.is_err());
        }
    }
}

#[test]
fn optional_creation_field_keeps_the_source_without_a_base_component() {
    use nkdk::route::Catalog;
    let specification = "format: nkdk-operation-routes/1\nroutes:\n- xmlDir: Other\n  yamlDir: Иное\n  owners: {cf: pilot.boolean}\n  inputs: {}\n  sources:\n  - entry: migration.enumeration-base-identity\n    inputs: {component: component, parent: parent, ownerName: name}\n    newOwner:\n      template:\n        base:\n          optional:\n          - base: {externalSnapshot: {component: cf, entry: migration.enumeration-own-identity, field: uuid}}\n";
    let catalog = Catalog::parse(specification).unwrap();
    let snapshots = catalog
        .materialize_sources(
            std::path::Path::new("Иное/Example.yaml"),
            &selection_context(),
            "seed",
            None,
        )
        .unwrap();
    assert_eq!(snapshots.len(), 1);
    assert_eq!(snapshots[0].name, "migration.enumeration-base-identity");
    let root = std::env::temp_dir().join(format!("nkdk-optional-base-{}", std::process::id()));
    let path = std::path::Path::new("Иное/Example.yaml");
    std::fs::create_dir_all(root.join("Иное")).unwrap();
    std::fs::write(root.join(path), "").unwrap();
    for (bytes, valid) in [
        (b"uuid: retained-base-id\n".as_slice(), true),
        (b"another: value\n".as_slice(), false),
    ] {
        let name = "migration.enumeration-own-identity";
        catalog
            .save_snapshots(
                &root,
                path,
                "cf",
                &[nkdk::route::OwnedSnapshot {
                    name: name.into(),
                    entry: entry_id(name).unwrap(),
                    bytes: bytes.to_vec(),
                }],
            )
            .unwrap();
        let result = catalog.materialize_sources(path, &selection_context(), "seed", Some(&root));
        if valid {
            let snapshots = result.unwrap();
            assert!(
                std::str::from_utf8(&snapshots[0].bytes)
                    .unwrap()
                    .contains("retained-base-id")
            );
        } else {
            assert!(
                result.is_err(),
                "optional must not hide an invalid snapshot"
            );
        }
    }
    std::fs::remove_dir_all(root).unwrap();
    let without_optional =
        specification.replace("          optional:\n          - base:", "        - base:");
    let legacy = Catalog::parse(&without_optional).unwrap();
    assert!(
        legacy
            .materialize_sources(
                std::path::Path::new("Иное/Example.yaml"),
                &selection_context(),
                "seed",
                None
            )
            .unwrap()
            .is_empty()
    );
}

#[test]
fn external_primary_facts_bind_immutable_identity_from_the_owner_snapshot() {
    use nkdk::route::{Catalog, OwnedSnapshot};
    let specification = "format: nkdk-operation-routes/1\nroutes:\n- xmlDir: Other\n  yamlDir: Иное\n  owners: {cf: pilot.boolean}\n  inputs: {}\n  sources:\n  - entry: migration.document-root-source\n    inputs: {}\nfactRoutes:\n- xmlDir: Other\n  yamlDir: Иное\n  entry: migration.enumeration-own-identity\n  factDirections: [yaml-to-xml]\n  inputs:\n    component: component\n    parent: {snapshot: {entry: migration.document-root-source, field: Идентификатор}}\n    ownerName: name\n    identitySeed: {literal: fixture}\n";
    let specification = specification.replace(
        "  yamlDir: Иное\n",
        "  yamlDir: Иное\n  yamlFile: Свойства.yaml\n",
    );
    let catalog = Catalog::parse(&specification).unwrap();
    let root =
        std::env::temp_dir().join(format!("nkdk-bound-external-facts-{}", std::process::id()));
    let path = std::path::Path::new("Иное/Example/Свойства.yaml");
    let context = selection_context();
    catalog
        .save_snapshots(
            &root,
            path,
            "cf",
            &[OwnedSnapshot {
                name: "migration.document-root-source".into(),
                entry: entry_id("migration.document-root-source").unwrap(),
                bytes: "Вид: Документ\nИмя: Example\nИдентификатор: retained\n"
                    .as_bytes()
                    .to_vec(),
            }],
        )
        .unwrap();
    std::fs::create_dir_all(root.join(path).parent().unwrap()).unwrap();
    // Fact-only owners need their retained identity before a complete converter
    // is available. Publishing the same bundle must not require a fake owner.
    let (_, fact_routes) = specification.split_once("factRoutes:").unwrap();
    let catalog = Catalog::parse(&format!(
        "format: nkdk-operation-routes/1\nroutes: []\nfactRoutes:{fact_routes}"
    ))
    .unwrap();
    assert_eq!(
        catalog.sidecar_path(path, "cf").unwrap().unwrap(),
        std::path::PathBuf::from(".nkdk/facts/cf").join(path)
    );
    assert!(
        catalog
            .sidecar_path(std::path::Path::new("Unknown/Example.yaml"), "cf")
            .unwrap()
            .is_none()
    );
    assert!(catalog.sidecar_path(path, "../outside").is_err());
    assert!(
        catalog
            .sidecar_path(std::path::Path::new("Иное/Example/Other.yaml"), "cf")
            .unwrap()
            .is_none()
    );
    let snapshots = catalog.load_snapshots(&root, path, "cf").unwrap();
    catalog
        .save_snapshots(&root, path, "cf", &snapshots)
        .unwrap();
    let restricted = Catalog::parse(&format!(
        "format: nkdk-operation-routes/1\nroutes: []\nfactRoutes:{}",
        fact_routes.replace("- xmlDir: Other", "- only: [cf]\n  xmlDir: Other")
    ))
    .unwrap();
    assert!(restricted.sidecar_path(path, "cfe").unwrap().is_none());
    for identity in ["current-a", "current-b"] {
        std::fs::write(
            root.join(path),
            format!("name: Example\nuuid: {identity}\n"),
        )
        .unwrap();
        let mut sources = catalog
            .external_sources(&root, &context, Direction::YamlToXml)
            .unwrap();
        assert_eq!(sources.len(), 1);
        let source = sources.pop().unwrap();
        let facts = prepare(
            vec![Source {
                entry: source.entry,
                direction: Direction::YamlToXml,
                bytes: &source.bytes,
                inputs: source.inputs,
            }],
            &[],
            Generation(1),
            project_budget(),
            100,
        )
        .unwrap();
        let index = nkdk_compiled_rules::fact_id("metadata.own-identities").unwrap();
        let key: Vec<_> = facts
            .facts
            .key_fields(index)
            .unwrap()
            .unwrap()
            .iter()
            .map(|field| match *field {
                "component" => "cf",
                "owner" => "retained",
                "kind" => "Enum",
                "name" => "Example",
                _ => panic!("Unexpected key"),
            })
            .collect();
        assert_eq!(
            facts.facts.lookup_parts(Generation(1), index, &key),
            nkdk_conversion_core::facts::FactState::Ready(identity)
        );
    }
    std::fs::create_dir_all(root.join("Other")).unwrap();
    std::fs::write(root.join("Other/Example.xml"), "<broken>").unwrap();
    assert!(
        catalog
            .external_sources(&root, &context, Direction::XmlToYaml)
            .unwrap()
            .is_empty()
    );
    let sidecar = root.join(catalog.sidecar_path(path, "cf").unwrap().unwrap());
    std::fs::write(&sidecar, "not a snapshot").unwrap();
    assert!(
        catalog
            .external_sources(&root, &context, Direction::YamlToXml)
            .is_err()
    );
    std::fs::remove_file(&sidecar).unwrap();
    assert!(
        catalog
            .external_sources(&root, &context, Direction::YamlToXml)
            .is_err()
    );
    for invalid in ["[]", "[unknown]", "yaml-to-xml", "[true]"] {
        assert!(Catalog::parse(&specification.replace("[yaml-to-xml]", invalid)).is_err());
    }
    // Independently imported fact sources retain identity even when the owner
    // itself has no conversion route or owner snapshot bundle.
    let external_specification = format!(
        "format: nkdk-operation-routes/1\nroutes: []\nfactRoutes:{}\n- xmlDir: Other\n  entry: migration.document-root-source\n  factDirections: [xml-to-yaml]\n  inputs: {{}}\n",
        fact_routes.replace(
            "entry: migration.document-root-source, field: Идентификатор",
            "entry: migration.document-root-source, field: Идентификатор, storage: external"
        )
    );
    let external_catalog = Catalog::parse(&external_specification).unwrap();
    std::fs::write(
        root.join("Other/Example.xml"),
        "<MetaDataObject xmlns=\"http://v8.1c.ru/8.3/MDClasses\"><Document uuid=\"retained\"><Properties><Name>Example</Name></Properties></Document></MetaDataObject>",
    )
    .unwrap();
    let imported = external_catalog
        .external_sources(&root, &context, Direction::XmlToYaml)
        .unwrap();
    assert_eq!(imported.len(), 1);
    external_catalog
        .save_external_sources(&root, &context, &imported)
        .unwrap();
    // Neither the old XML nor a bundle is available to fill in missing data.
    std::fs::remove_dir_all(root.join("Other")).unwrap();
    let sources = external_catalog
        .external_sources(&root, &context, Direction::YamlToXml)
        .unwrap();
    assert_eq!(sources.len(), 1);
    assert_eq!(
        sources[0]
            .inputs
            .text(
                nkdk_compiled_rules::input_names(sources[0].entry)
                    .iter()
                    .position(|name| *name == "parent")
                    .unwrap()
            )
            .unwrap(),
        "retained"
    );
    assert!(
        Catalog::parse(&external_specification.replace("storage: external", "storage: unknown"))
            .is_err()
    );
    let reference = "{snapshot: {entry: migration.document-root-source, field: Идентификатор, storage: external}}";
    let selected = Catalog::parse(&external_specification.replace(reference, &format!(
        "{{select: {{on: {{literal: chosen}}, cases: {{chosen: {reference}, unused: {{snapshot: {{entry: migration.enumeration-base-identity, field: uuid, storage: external}}}}}}}}}}"
    ))).unwrap();
    assert_eq!(
        selected
            .external_sources(&root, &context, Direction::YamlToXml)
            .unwrap()
            .len(),
        1
    );
    let retained =
        root.join(".nkdk/facts/cf/external/Other/migration.document-root-source/Example.yaml");
    std::fs::write(&retained, "not a snapshot").unwrap();
    assert!(
        external_catalog
            .external_sources(&root, &context, Direction::YamlToXml)
            .is_err()
    );
    std::fs::remove_file(&retained).unwrap();
    assert!(
        external_catalog
            .external_sources(&root, &context, Direction::YamlToXml)
            .is_err()
    );
    std::fs::remove_dir_all(root).unwrap();
}

#[test]
fn project_operation_refreshes_external_base_facts_without_xml_reimport() {
    use nkdk::{
        project,
        route::{Catalog, Context},
    };
    let specification = "format: nkdk-operation-routes/1\nroutes:\n- xmlDir: Other\n  yamlDir: Иное\n  owners: {cfe: migration.metadata-uuid}\n  ownerFacts: false\n  inputs: {component: {literal: cf}, owner: {literal: configuration}, kind: {literal: Enum}}\n  sources: []\nfactRoutes:\n- xmlDir: Base\n  yamlDir: Данные\n  entry: migration.enumeration-own-identity\n  only: [cf]\n  fromBase: true\n  factDirections: [yaml-to-xml]\n  inputs: {component: component, parent: parent, ownerName: name, identitySeed: {literal: fixture}}\n";
    let specification = specification.replace(
        "  yamlDir: Данные\n",
        "  yamlDir: Данные\n  yamlFile: Свойства.yaml\n",
    );
    assert!(Catalog::parse(&specification.replace("fromBase: true", "fromBase: yes")).is_err());
    let catalog = Catalog::parse(&specification).unwrap();
    let root = std::env::temp_dir().join(format!("nkdk-base-current-facts-{}", std::process::id()));
    let source = root.join("extension");
    let base = root.join("base");
    let target = root.join("output");
    std::fs::create_dir_all(source.join("Иное")).unwrap();
    std::fs::create_dir_all(base.join("Данные/Example")).unwrap();
    let path = std::path::Path::new("Иное/Example.yaml");
    std::fs::write(source.join(path), "Имя: Example").unwrap();
    catalog.save_snapshots(&source, path, "cfe", &[]).unwrap();
    let convert = |source_root, target_root, direction| {
        project::convert_component_with_catalog(
            &catalog,
            project::Request {
                source_root,
                target_root,
                base_component_root: Some(&base),
                temporary_parent: &root,
                context: Context {
                    component: "cfe",
                    parent: "configuration",
                    ..selection_context()
                },
                direction,
                generation: Generation(1),
                fact_budget: project_budget(),
                edge_budget: 10000,
                limits: operation_limits(),
                xml_bytes: 10000,
            },
        )
        .unwrap()
    };
    for identity in ["cf-a", "cf-b"] {
        std::fs::write(
            base.join("Данные/Example/Свойства.yaml"),
            format!("name: Example\nuuid: {identity}"),
        )
        .unwrap();
        let result = convert(&source, &target, Direction::YamlToXml);
        assert_eq!(result.outputs.len(), 1);
        let xml = std::fs::read_to_string(target.join("Other/Example.xml")).unwrap();
        assert!(xml.contains(&format!("uuid=\"{identity}\"")), "{xml}");
    }
    let imported = root.join("imported");
    let result = convert(&target, &imported, Direction::XmlToYaml);
    assert_eq!(result.outputs.len(), 1);
    assert!(!imported.join(".nkdk/facts/cf").exists());
    assert_eq!(
        std::fs::read_to_string(base.join("Данные/Example/Свойства.yaml")).unwrap(),
        "name: Example\nuuid: cf-b"
    );
    std::fs::remove_dir_all(root).unwrap();
}

#[test]
fn joined_primary_base_source_keeps_target_identity_and_reads_current_base_yaml() {
    use nkdk::route::{Catalog, Context};
    let specification = "format: nkdk-operation-routes/1\nroutes: []\nfactRoutes:\n- xmlDir: Other\n  entry: migration.command-group-root-source\n  factDirections: [xml-to-yaml]\n  inputs: {}\n- xmlDir: Other\n  entry: migration.adopted-command-group-root-source\n  only: [cfe]\n  factDirections: [xml-to-yaml]\n  inputs: {}\n- xmlDir: Other\n  yamlDir: Иное\n  yamlFile: Свойства.yaml\n  entry: migration.enumeration-own-identity\n  only: [cfe]\n  factDirections: [yaml-to-xml]\n  baseSource:\n    component: cf\n    entry: migration.command-group-root-source\n    field: Идентификатор\n    key: {snapshot: {entry: migration.adopted-command-group-root-source, field: Идентификатор, storage: external, default: ''}}\n  inputs:\n    component: component\n    parent: {snapshot: {entry: migration.command-group-root-source, field: Идентификатор, storage: external}}\n    ownerName: name\n    identitySeed: {literal: fixture}\n";
    let catalog = Catalog::parse(specification).unwrap();
    let root = std::env::temp_dir().join(format!("nkdk-joined-source-{}", std::process::id()));
    let base = root.join("base");
    let target = root.join("extension");
    for (directory, name, identity, component) in [
        (&base, "DifferentBaseFile", "BaseIdentity", "cf"),
        (&target, "ExtensionAlias", "ExtensionIdentity", "cfe"),
    ] {
        std::fs::create_dir_all(directory.join("Other")).unwrap();
        let relation = if component == "cfe" {
            "<ExtendedConfigurationObject>BaseIdentity</ExtendedConfigurationObject>"
        } else {
            ""
        };
        std::fs::write(directory.join(format!("Other/{name}.xml")), format!(
            "<MetaDataObject xmlns=\"http://v8.1c.ru/8.3/MDClasses\"><CommandGroup uuid=\"{identity}\"><Properties><Name>{name}</Name>{relation}</Properties></CommandGroup></MetaDataObject>"
        )).unwrap();
        let context = Context {
            component,
            ..selection_context()
        };
        let imported = catalog
            .external_sources(directory, &context, Direction::XmlToYaml)
            .unwrap();
        catalog
            .save_external_sources(directory, &context, &imported)
            .unwrap();
        std::fs::remove_dir_all(directory.join("Other")).unwrap();
        std::fs::create_dir_all(directory.join(format!("Иное/{name}"))).unwrap();
        std::fs::write(
            directory.join(format!("Иное/{name}/Свойства.yaml")),
            "name: Example\nuuid: target-stale\n",
        )
        .unwrap();
    }
    let context = Context {
        component: "cfe",
        ..selection_context()
    };
    let project_specification = specification.replace("routes: []", "routes:\n- xmlDir: Consumer\n  yamlDir: Потребитель\n  owners: {cfe: migration.metadata-uuid}\n  ownerFacts: false\n  inputs: {component: component, owner: {literal: ExtensionIdentity}, kind: {literal: Enum}}\n  sources: []");
    let project_catalog = Catalog::parse(&project_specification).unwrap();
    std::fs::create_dir_all(target.join("Потребитель")).unwrap();
    std::fs::write(
        target.join("Потребитель/ExtensionAlias.yaml"),
        "Имя: ExtensionAlias\n",
    )
    .unwrap();
    project_catalog
        .save_snapshots(
            &target,
            std::path::Path::new("Потребитель/ExtensionAlias.yaml"),
            "cfe",
            &[],
        )
        .unwrap();
    for identity in ["base-current-a", "base-current-b"] {
        std::fs::write(
            base.join("Иное/DifferentBaseFile/Свойства.yaml"),
            format!("uuid: {identity}\n"),
        )
        .unwrap();
        let sources = catalog
            .external_sources_with_base(&target, Some(&base), &context, Direction::YamlToXml)
            .unwrap();
        assert_eq!(sources.len(), 1);
        let source = &sources[0];
        let input = |name| {
            let slot = nkdk_compiled_rules::input_names(source.entry)
                .iter()
                .position(|field| *field == name)
                .unwrap();
            source.inputs.text(slot).unwrap()
        };
        assert_eq!(input("component"), "cfe");
        assert_eq!(input("parent"), "ExtensionIdentity");
        assert_eq!(input("ownerName"), "ExtensionAlias");
        assert!(
            std::str::from_utf8(&source.bytes)
                .unwrap()
                .contains(identity)
        );
        assert!(
            !std::str::from_utf8(&source.bytes)
                .unwrap()
                .contains("target-stale")
        );
        let output = root.join("output");
        let report = nkdk::project::convert_component_with_catalog(
            &project_catalog,
            project_request(
                &target,
                &output,
                Some(&base),
                &root,
                Context {
                    component: "cfe",
                    ..selection_context()
                },
                Direction::YamlToXml,
            ),
        )
        .unwrap();
        assert_eq!(report.outputs.len(), 1);
        let xml = std::fs::read_to_string(output.join("Consumer/ExtensionAlias.xml")).unwrap();
        assert!(xml.contains(&format!("uuid=\"{identity}\"")), "{xml}");
    }
    assert!(
        catalog
            .external_sources_with_base(&target, None, &context, Direction::YamlToXml)
            .is_err()
    );
    for invalid in [
        specification.replace("component: cf", "component: ../outside"),
        specification.replace("baseSource:", "fromBase: true\n  baseSource:"),
        specification.replace("key: {snapshot:", "unexpected: true\n    key: {snapshot:"),
    ] {
        assert!(Catalog::parse(&invalid).is_err());
    }
    let retained = base.join(
        ".nkdk/facts/cf/external/Other/migration.command-group-root-source/DifferentBaseFile.yaml",
    );
    let duplicate = retained.with_file_name("Duplicate.yaml");
    std::fs::copy(&retained, &duplicate).unwrap();
    assert!(
        catalog
            .external_sources_with_base(&target, Some(&base), &context, Direction::YamlToXml)
            .is_err()
    );
    std::fs::remove_file(duplicate).unwrap();
    #[cfg(unix)]
    {
        let primary = base.join("Иное/DifferentBaseFile/Свойства.yaml");
        let content = std::fs::read(&primary).unwrap();
        let outside = root.join("outside.yaml");
        std::fs::write(&outside, &content).unwrap();
        std::fs::remove_file(&primary).unwrap();
        std::os::unix::fs::symlink(&outside, &primary).unwrap();
        assert!(
            catalog
                .external_sources_with_base(&target, Some(&base), &context, Direction::YamlToXml)
                .is_err()
        );
        std::fs::remove_file(&primary).unwrap();
        std::fs::write(&primary, &content).unwrap();
    }
    std::fs::create_dir_all(target.join("Other")).unwrap();
    std::fs::write(target.join("Other/NativeAlias.xml"), "<MetaDataObject xmlns=\"http://v8.1c.ru/8.3/MDClasses\"><CommandGroup uuid=\"NativeIdentity\"><Properties><Name>NativeAlias</Name></Properties></CommandGroup></MetaDataObject>").unwrap();
    let imported = catalog
        .external_sources(&target, &context, Direction::XmlToYaml)
        .unwrap();
    catalog
        .save_external_sources(&target, &context, &imported)
        .unwrap();
    std::fs::remove_dir_all(target.join("Other")).unwrap();
    std::fs::create_dir_all(target.join("Иное/NativeAlias")).unwrap();
    std::fs::write(
        target.join("Иное/NativeAlias/Свойства.yaml"),
        "uuid: NativeIdentity\n",
    )
    .unwrap();
    assert_eq!(
        catalog
            .external_sources_with_base(&target, Some(&base), &context, Direction::YamlToXml)
            .unwrap()
            .len(),
        1
    );
    std::fs::remove_dir_all(target.join("Иное/ExtensionAlias")).unwrap();
    assert!(
        catalog
            .external_sources_with_base(&target, None, &context, Direction::YamlToXml)
            .unwrap()
            .is_empty()
    );
    std::fs::remove_dir_all(root).unwrap();
}

#[test]
fn project_validation_is_separate_from_reversible_conversion() {
    use nkdk::{project, route::Catalog};
    let specification = "format: nkdk-operation-routes/1\nroutes:\n- xmlDir: Other\n  yamlDir: Иное\n  owners: {cf: pilot.boolean}\n  validators: {cf: migration.document-root-source}\n  validationInputs: {}\n  ownerFacts: false\n  inputs: {}\n  sources: []\n";
    let catalog = Catalog::parse(specification).unwrap();
    let root =
        std::env::temp_dir().join(format!("nkdk-separate-validation-{}", std::process::id()));
    let xml = root.join("xml");
    let yaml = root.join("yaml");
    let rebuilt = root.join("rebuilt");
    std::fs::create_dir_all(xml.join("Other")).unwrap();
    let original = "<Root><Value>true</Value></Root>";
    std::fs::write(xml.join("Other/Example.xml"), original).unwrap();
    for (direction, source, target) in [
        (Direction::XmlToYaml, &xml, &yaml),
        (Direction::YamlToXml, &yaml, &rebuilt),
    ] {
        let report = project::convert_component_with_catalog(
            &catalog,
            project_request(source, target, None, &root, selection_context(), direction),
        )
        .unwrap();
        assert_eq!(report.outputs.len(), 1);
        assert!(
            report
                .diagnostics
                .iter()
                .any(|issue| issue.code.as_deref() == Some("yaml.unknown-field"))
        );
        assert!(
            report
                .diagnostics
                .iter()
                .all(|issue| issue.code.as_deref() != Some("input.entry"))
        );
    }
    assert_eq!(
        normalized_xml(original),
        normalized_xml(&std::fs::read_to_string(rebuilt.join("Other/Example.xml")).unwrap())
    );
    assert!(
        !std::fs::read_to_string(yaml.join("Иное/Example.yaml"))
            .unwrap()
            .contains("!xml")
    );
    for invalid in [
        "validators: {missing: migration.document-root-source}",
        "validators: {cf: does-not-exist}",
        "validators: []",
    ] {
        assert!(
            Catalog::parse(
                &specification.replace("validators: {cf: migration.document-root-source}", invalid)
            )
            .is_err()
        );
    }
    std::fs::remove_dir_all(root).unwrap();
}

#[test]
fn new_owner_identity_snapshot_precedes_external_primary_fact_loading() {
    use nkdk::{project, route::Catalog};
    let specification = r#"format: nkdk-operation-routes/1
routes:
- xmlDir: Other
  yamlDir: Иное
  owners: {cf: migration.enumeration-own-identity}
  ownerFacts: false
  inputs:
    component: component
    parent: {snapshot: {entry: migration.document-root-source, field: Идентификатор}}
    ownerName: name
    identitySeed: {literal: fixture}
  sources:
  - entry: migration.document-root-source
    factDirections: [xml-to-yaml]
    inputs: {}
    newOwner:
      template: {Имя: Example, Идентификатор: retained}
factRoutes:
- xmlDir: Other
  yamlDir: Иное
  entry: migration.enumeration-own-identity
  factDirections: [yaml-to-xml]
  inputs:
    component: component
    parent: {snapshot: {entry: migration.document-root-source, field: Идентификатор}}
    ownerName: name
    identitySeed: {literal: fixture}
"#;
    let catalog = Catalog::parse(specification).unwrap();
    let root = std::env::temp_dir().join(format!("nkdk-new-external-owner-{}", std::process::id()));
    let source = root.join("source");
    std::fs::create_dir_all(source.join("Иное")).unwrap();
    std::fs::write(
        source.join("Иное/Example.yaml"),
        "name: Example\nuuid: stable-id\n",
    )
    .unwrap();
    catalog.save_imported_owners(&source, "cf", &[]).unwrap();
    for target_name in ["first", "second"] {
        let target = root.join(target_name);
        let report = project::convert_component_with_catalog(
            &catalog,
            project::Request {
                source_root: &source,
                target_root: &target,
                base_component_root: None,
                temporary_parent: &root,
                context: selection_context(),
                direction: Direction::YamlToXml,
                generation: Generation(1),
                fact_budget: project_budget(),
                edge_budget: 10000,
                limits: operation_limits(),
                xml_bytes: 10000,
            },
        )
        .unwrap_or_else(|errors| panic!("{errors:?}"));
        assert_eq!(report.outputs.len(), 1);
        let xml = std::fs::read_to_string(target.join("Other/Example.xml")).unwrap();
        assert!(xml.contains("stable-id"), "{xml}");
    }
    assert_eq!(
        std::fs::read(root.join("first/Other/Example.xml")).unwrap(),
        std::fs::read(root.join("second/Other/Example.xml")).unwrap()
    );
    std::fs::remove_dir_all(root).unwrap();
}

#[test]
fn production_numerators_round_trip_real_cf_and_cfe_and_create_new_owners() {
    nkdk_compiled_rules::check_catalog().unwrap();
    let registration = "candidate.complete-scalar-owner.documentnumerator";
    let entry = entry_id(registration).unwrap();
    assert!(
        nkdk_compiled_rules::exported_entries()
            .iter()
            .any(|(name, id)| *name == registration && id.0 == entry.0)
    );
    use nkdk::project;
    let repository = std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join("../../..");
    let temp =
        std::env::temp_dir().join(format!("nkdk-production-numerators-{}", std::process::id()));
    let _ = std::fs::remove_dir_all(&temp);
    std::fs::create_dir_all(&temp).unwrap();
    let base_yaml = temp.join("cf-yaml");
    for (component, fixture, count) in [
        ("cf", "e2e/fixtures/xml/cf", 5),
        ("cfe", "e2e/fixtures/xml/cfe/all-extension", 4),
    ] {
        let input = temp.join(format!("{component}-input"));
        let directory = input.join("DocumentNumerators");
        std::fs::create_dir_all(&directory).unwrap();
        for file in std::fs::read_dir(repository.join(fixture).join("DocumentNumerators")).unwrap()
        {
            let file = file.unwrap();
            std::fs::copy(file.path(), directory.join(file.file_name())).unwrap();
        }
        let yaml = temp.join(format!("{component}-yaml"));
        let run = |direction, source_root: &std::path::Path, target_root: &std::path::Path| {
            convert_fixture_component(
                nkdk::route::catalog(),
                component,
                direction,
                source_root,
                target_root,
                (component == "cfe").then_some(base_yaml.as_path()),
                &temp,
            )
            .unwrap_or_else(|errors| panic!("{component} {direction:?}: {errors:?}"))
        };
        assert_eq!(
            run(Direction::XmlToYaml, &input, &yaml).outputs.len(),
            count
        );
        let rebuilt = temp.join(format!("{component}-rebuilt"));
        assert_eq!(
            run(Direction::YamlToXml, &yaml, &rebuilt).outputs.len(),
            count
        );
        for file in std::fs::read_dir(&directory).unwrap() {
            let file = file.unwrap();
            let expected = std::fs::read_to_string(file.path()).unwrap();
            let actual =
                std::fs::read_to_string(rebuilt.join("DocumentNumerators").join(file.file_name()))
                    .unwrap();
            assert_eq!(
                normalized_xml(&expected),
                normalized_xml(&actual),
                "{component} {:?}",
                file.file_name()
            );
        }
        std::fs::write(yaml.join("Нумератор/НовыйНумератор.yaml"), "{}\n").unwrap();
        let first = temp.join(format!("{component}-new-first"));
        let second = temp.join(format!("{component}-new-second"));
        assert_eq!(
            run(Direction::YamlToXml, &yaml, &first).outputs.len(),
            count + 1
        );
        assert_eq!(
            run(Direction::YamlToXml, &yaml, &second).outputs.len(),
            count + 1
        );
        let first_xml =
            std::fs::read_to_string(first.join("DocumentNumerators/НовыйНумератор.xml")).unwrap();
        let second_xml =
            std::fs::read_to_string(second.join("DocumentNumerators/НовыйНумератор.xml")).unwrap();
        assert_eq!(normalized_xml(&first_xml), normalized_xml(&second_xml));
        assert!(first_xml.contains(">НовыйНумератор</"));
        if component == "cfe" {
            let cf_new = std::fs::read_to_string(
                temp.join("cf-new-first/DocumentNumerators/НовыйНумератор.xml"),
            )
            .unwrap();
            let cf_uuid = cf_new
                .split("uuid=\"")
                .nth(1)
                .unwrap()
                .split('"')
                .next()
                .unwrap();
            assert!(first_xml.contains(&format!(">{cf_uuid}</")), "{first_xml}");
            std::fs::write(yaml.join("Нумератор/СобственныйНумератор.yaml"), "{}\n").unwrap();
            let own_first = temp.join("cfe-own-first");
            let own_second = temp.join("cfe-own-second");
            assert_eq!(
                run(Direction::YamlToXml, &yaml, &own_first).outputs.len(),
                count + 2
            );
            run(Direction::YamlToXml, &yaml, &own_second);
            let path = "DocumentNumerators/СобственныйНумератор.xml";
            let own_xml = std::fs::read_to_string(own_first.join(path)).unwrap();
            assert!(
                !own_xml.contains("ExtendedConfigurationObject"),
                "{own_xml}"
            );
            assert_eq!(
                normalized_xml(&own_xml),
                normalized_xml(&std::fs::read_to_string(own_second.join(path)).unwrap())
            );
            // The base snapshot remains unchanged. Only its current primary
            // YAML is edited, so stale captured values cannot satisfy this.
            let before = run(Direction::YamlToXml, &yaml, &temp.join("before-base-edit"));
            let base_path = base_yaml.join("Нумератор/НумераторДокументовВсеСвойства.yaml");
            let previous = std::fs::read_to_string(&base_path).unwrap();
            assert!(previous.contains("КонтрольУникальности: Ложь"));
            std::fs::write(
                &base_path,
                previous.replace("КонтрольУникальности: Ложь", "КонтрольУникальности: Истина"),
            )
            .unwrap();
            let after = run(Direction::YamlToXml, &yaml, &temp.join("after-base-edit"));
            let changed_count = |report: &project::Report| {
                report
                    .diagnostics
                    .iter()
                    .filter(|issue| issue.code.as_deref() == Some("base.value.changed"))
                    .count()
            };
            assert_eq!(
                changed_count(&before),
                changed_count(&after) + 1,
                "before: {:?} after: {:?}",
                before.diagnostics,
                after.diagnostics
            );
            assert_eq!(before.outputs, after.outputs);
        }
    }
    std::fs::remove_dir_all(temp).unwrap();
}

#[path = "support/record_file_owners.rs"]
mod record_file_owners;

#[test]
fn compiled_current_member_sources_share_catalog_and_publish_current_eligibility() {
    nkdk_compiled_rules::check_catalog().unwrap();
    let sources = [
        include_str!("../../../declarations/objects/input-by-string-members-0.generated.yaml"),
        include_str!("../../../declarations/objects/input-by-string-members-1.generated.yaml"),
    ];
    let mut registered = std::collections::BTreeSet::new();
    for source in sources {
        let documents = yaml_rust2::YamlLoader::load_from_str(source).unwrap();
        for declaration in documents[0]["declarations"].as_vec().unwrap() {
            let name = declaration["id"].as_str().unwrap();
            let id = entry_id(name).unwrap();
            assert!(nkdk_compiled_rules::contains_entry(id), "{name}");
            assert!(registered.insert(id.0), "{name}");
        }
    }
    assert_eq!(registered.len(), 48);
    for name in [
        "businessprocess",
        "catalog",
        "chartofaccounts",
        "chartofcalculationtypes",
        "chartofcharacteristictypes",
        "document",
        "exchangeplan",
        "task",
    ] {
        let id = entry_id(&format!("candidate.input-by-string.{name}"))
            .expect("Working consumer registration");
        assert!(nkdk_compiled_rules::contains_entry(id));
    }

    let manifest: serde_json::Value = serde_json::from_str(include_str!(
        "../../../../tests/migration/input-by-string-operation.json"
    ))
    .unwrap();
    let case = manifest["cases"]
        .as_array()
        .unwrap()
        .iter()
        .find(|case| case["id"] == "e2e-input-by-string-catalog-cf-current-yaml-members")
        .unwrap();
    let source_id = case["factSourceEntries"][0].as_str().unwrap();
    let source = manifest["factSources"]
        .as_array()
        .unwrap()
        .iter()
        .find(|source| source["id"] == source_id)
        .unwrap();
    let original = source["yaml"].as_str().unwrap();
    assert!(original.contains("Тип: Строка(10)"));
    let changed = original.replace("Тип: Строка(10)", "Тип: ЛюбаяСсылка");
    let assert_member =
        |providers: &[(&serde_json::Value, &str)], component: &str, owner: &str, expected: &str| {
            let sources = providers
                .iter()
                .map(|(provider, bytes)| {
                    let entry = entry_id(provider["entry"].as_str().unwrap()).unwrap();
                    Source {
                        entry,
                        direction: Direction::YamlToXml,
                        bytes: bytes.as_bytes(),
                        inputs: read_inputs(entry, provider["inputs"].to_string().as_bytes())
                            .unwrap(),
                    }
                })
                .collect();
            let prepared = prepare(sources, &[], Generation(1), project_budget(), 1000).unwrap();
            let index = nkdk_compiled_rules::fact_id("metadata.input-by-string-members").unwrap();
            let key: Vec<_> = prepared
                .facts
                .key_fields(index)
                .unwrap()
                .unwrap()
                .iter()
                .map(|field| match *field {
                    "component" => component,
                    "owner" => owner,
                    "role" => "attributes",
                    "name" => "СтроковыйРеквизитСИндексом",
                    _ => panic!("Unexpected membership field"),
                })
                .collect();
            assert_eq!(
                prepared.facts.lookup_parts(Generation(1), index, &key),
                nkdk_conversion_core::facts::FactState::Ready(expected)
            );
        };
    let owner = source["inputs"]["owner"].as_str().unwrap();
    assert_member(
        &[(source, original)],
        "cf",
        owner,
        "СтроковыйРеквизитСИндексом",
    );
    assert_member(&[(source, changed.as_str())], "cf", owner, "");
    for (suffix, expected) in [
        ("reference-shadow", ""),
        ("removed-local", "СтроковыйРеквизитСИндексом"),
        ("notified-types", "СтроковыйРеквизитСИндексом"),
    ] {
        let id = format!("e2e-input-by-string-catalog-adopted-scalar-types-current-yaml-{suffix}");
        let case = manifest["cases"]
            .as_array()
            .unwrap()
            .iter()
            .find(|case| case["id"] == id)
            .unwrap();
        let providers: Vec<_> = case["factSourceEntries"]
            .as_array()
            .unwrap()
            .iter()
            .take(2)
            .map(|id| {
                let provider = manifest["factSources"]
                    .as_array()
                    .unwrap()
                    .iter()
                    .find(|provider| provider["id"] == *id)
                    .unwrap();
                (provider, provider["yaml"].as_str().unwrap())
            })
            .collect();
        assert_member(
            &providers,
            case["inputs"]["component"].as_str().unwrap(),
            case["inputs"]["owner"].as_str().unwrap(),
            expected,
        );
    }
}

fn external_facts(
    sources: &mut [nkdk::route::ExternalFact],
) -> std::sync::Arc<nkdk_conversion_core::facts::prepared::PreparedTextFacts> {
    prepare(
        sources
            .iter_mut()
            .map(|source| Source {
                entry: source.entry,
                direction: Direction::YamlToXml,
                bytes: &source.bytes,
                inputs: std::mem::take(&mut source.inputs),
            })
            .collect(),
        &[],
        Generation(1),
        project_budget(),
        10000,
    )
    .unwrap()
    .facts
}

fn project_fact_inputs(
    entry: nkdk_compiled_rules::EntryId,
    values: &serde_json::Value,
    facts: std::sync::Arc<nkdk_conversion_core::facts::prepared::PreparedTextFacts>,
) -> nkdk_compiled_rules::PreparedInputs {
    let indexes =
        nkdk_compiled_rules::prepare_fact_inputs(entry, facts, Generation(1), vec![]).unwrap();
    read_inputs(entry, values.to_string().as_bytes())
        .unwrap()
        .with_indexes(indexes)
        .unwrap()
}

fn primary_fixture(case: &serde_json::Value) -> &str {
    case["source"]
        .as_array()
        .unwrap()
        .iter()
        .find_map(|source| {
            source["path"]
                .as_str()
                .filter(|path| path.ends_with("/Свойства.yaml"))
        })
        .unwrap()
}

#[test]
fn generated_member_routes_import_real_identities_and_read_both_current_components() {
    use nkdk::route::{Catalog, Context};
    let catalog = Catalog::parse(include_str!(
        "../../../operations/input-by-string-members.routes.generated.yaml"
    ))
    .unwrap();
    let manifest: serde_json::Value = serde_json::from_str(include_str!(
        "../../../../tests/migration/input-by-string-operation.json"
    ))
    .unwrap();
    let providers_for = |case: &serde_json::Value, prefix: &str| {
        case["factSourceEntries"]
            .as_array()
            .unwrap()
            .iter()
            .filter_map(|id| {
                manifest["factSources"]
                    .as_array()
                    .unwrap()
                    .iter()
                    .find(|source| {
                        source["id"] == *id && source["entry"].as_str().unwrap().starts_with(prefix)
                    })
            })
            .collect::<Vec<_>>()
    };
    let cases: Vec<_> = manifest["cases"]
        .as_array()
        .unwrap()
        .iter()
        .filter(|case| {
            case["id"]
                .as_str()
                .unwrap()
                .ends_with("-current-yaml-members")
        })
        .collect();
    assert_eq!(cases.len(), 24);
    let root =
        std::env::temp_dir().join(format!("nkdk-member-project-routes-{}", std::process::id()));
    let repository = std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join("../../..");
    let primary = root.join("primary");
    for component in ["cf", "cfe"] {
        let xml = root.join(component);
        let target = primary.join(component);
        let selected: Vec<_> = cases
            .iter()
            .filter(|case| {
                case["inputs"]["component"]
                    .as_str()
                    .unwrap()
                    .split('/')
                    .next()
                    == Some(component)
            })
            .collect();
        for case in &selected {
            let source = case["source"][0]["path"].as_str().unwrap();
            let relative: std::path::PathBuf = std::path::Path::new(source)
                .components()
                .rev()
                .take(2)
                .collect::<Vec<_>>()
                .into_iter()
                .rev()
                .collect();
            let output = xml.join(relative);
            std::fs::create_dir_all(output.parent().unwrap()).unwrap();
            std::fs::copy(repository.join(source), output).unwrap();
        }
        let context = Context {
            component,
            ..selection_context()
        };
        let report = nkdk::project::convert_component_with_catalog(
            &catalog,
            project_request(&xml, &target, None, &root, context, Direction::XmlToYaml),
        )
        .unwrap();
        assert!(
            report.outputs.is_empty(),
            "Identity import does not pretend to convert a complete owner"
        );
        std::fs::remove_dir_all(&xml).unwrap();
        for case in &selected {
            let source = primary_fixture(case);
            let relative: std::path::PathBuf = std::path::Path::new(source)
                .components()
                .rev()
                .take(3)
                .collect::<Vec<_>>()
                .into_iter()
                .rev()
                .collect();
            let output = target.join(relative);
            std::fs::create_dir_all(output.parent().unwrap()).unwrap();
            std::fs::copy(repository.join(source), output).unwrap();
        }
    }
    for component in ["cf", "cfe"] {
        let target = primary.join(component);
        let base = primary.join("cf");
        let context = Context {
            component,
            ..selection_context()
        };
        let mut external = catalog
            .external_sources_with_base(
                &target,
                (component == "cfe").then_some(base.as_path()),
                &context,
                Direction::YamlToXml,
            )
            .unwrap();
        assert_eq!(external.len(), if component == "cf" { 24 } else { 48 });
        let find_source = |entry: nkdk_compiled_rules::EntryId, owner: &str| {
            external
                .iter()
                .find(|source| source.entry.0 == entry.0 && source.inputs.text(0).unwrap() == owner)
                .unwrap()
        };
        for case in &cases {
            if case["inputs"]["component"]
                .as_str()
                .unwrap()
                .split('/')
                .next()
                != Some(component)
            {
                continue;
            }
            let owner = case["inputs"]["owner"].as_str().unwrap();
            let expected = providers_for(case, "candidate.input-by-string-states.")[0];
            let entry = entry_id(expected["entry"].as_str().unwrap()).unwrap();
            let actual = find_source(entry, owner);
            let inputs = read_inputs(entry, expected["inputs"].to_string().as_bytes()).unwrap();
            assert_eq!(
                actual.bytes,
                nkdk_compiled_rules::snapshot_fact_source(
                    entry,
                    expected["xml"].as_str().unwrap().as_bytes(),
                    &inputs,
                )
                .unwrap(),
                "{}: retained states survive removal of original XML",
                case["id"]
            );
        }
        for case in &cases {
            if case["inputs"]["component"]
                .as_str()
                .unwrap()
                .split('/')
                .next()
                != Some(component)
                || (component == "cfe" && !case["inputs"]["adopted"].as_bool().unwrap())
            {
                continue;
            }
            let owner = case["inputs"]["owner"].as_str().unwrap();
            // Locate by source entry contract, never infer identity from a name.
            let original = providers_for(case, "candidate.input-by-string-base-numbers.")[0];
            let entry = entry_id(&format!(
                "{}.current-yaml",
                original["entry"].as_str().unwrap()
            ))
            .unwrap();
            let actual = find_source(entry, owner);
            let base_case =
                cases
                    .iter()
                    .find(|candidate| {
                        candidate["inputs"]["component"]
                            .as_str()
                            .unwrap()
                            .split('/')
                            .next()
                            == Some("cf")
                            && providers_for(candidate, "candidate.input-by-string-base-numbers.")
                                [0]["entry"]
                                == original["entry"]
                    })
                    .unwrap();
            let file = primary_fixture(base_case);
            let expected = std::fs::read(repository.join(file)).unwrap();
            let inputs = read_inputs(
                entry,
                serde_json::json!({"owner":owner}).to_string().as_bytes(),
            )
            .unwrap();
            assert_eq!(
                actual.bytes,
                nkdk_compiled_rules::materialize_fact_source(entry, &expected, &inputs,).unwrap(),
                "{}: all base scalar values belong to the joined current primary",
                case["id"]
            );
        }
        let mut owners = std::collections::BTreeMap::new();
        for source in &external {
            let names = nkdk_compiled_rules::input_names(source.entry);
            let owner = names.iter().position(|name| *name == "owner").unwrap();
            let Some(scope) = names.iter().position(|name| *name == "component") else {
                continue; // State sources have owner scope only; checked above.
            };
            assert_eq!(source.inputs.text(scope).unwrap(), component);
            *owners
                .entry(source.inputs.text(owner).unwrap().to_owned())
                .or_insert(0usize) += 1;
        }
        let expected_owners: std::collections::BTreeMap<_, _> = cases
            .iter()
            .filter(|case| {
                case["inputs"]["component"]
                    .as_str()
                    .unwrap()
                    .split('/')
                    .next()
                    == Some(component)
            })
            .map(|case| {
                (
                    case["inputs"]["owner"].as_str().unwrap().to_owned(),
                    if component == "cfe" && case["inputs"]["adopted"].as_bool().unwrap() {
                        2usize
                    } else {
                        1usize
                    },
                )
            })
            .collect();
        assert_eq!(owners, expected_owners);

        let prepared = external_facts(&mut external);
        let index = nkdk_compiled_rules::fact_id("metadata.input-by-string-members").unwrap();
        for case in cases.iter().filter(|case| {
            case["inputs"]["component"]
                .as_str()
                .unwrap()
                .split('/')
                .next()
                == Some(component)
        }) {
            let owner = case["inputs"]["owner"].as_str().unwrap();
            // The already accepted corpus supplies independent owner UUIDs and
            // direct sources; compare routing, not a second implementation of types.
            let providers = providers_for(case, "candidate.member-source.");
            let expected = prepare(
                providers
                    .iter()
                    .map(|provider| {
                        let entry = entry_id(provider["entry"].as_str().unwrap()).unwrap();
                        Source {
                            entry,
                            direction: Direction::YamlToXml,
                            bytes: provider["yaml"].as_str().unwrap().as_bytes(),
                            inputs: read_inputs(
                                entry,
                                serde_json::json!({"component":component,"owner":owner})
                                    .to_string()
                                    .as_bytes(),
                            )
                            .unwrap(),
                        }
                    })
                    .collect(),
                &[],
                Generation(1),
                project_budget(),
                10000,
            )
            .unwrap();
            let mut names = std::collections::BTreeSet::new();
            for provider in providers {
                let documents =
                    yaml_rust2::YamlLoader::load_from_str(provider["yaml"].as_str().unwrap())
                        .unwrap();
                if let Some(fields) = documents[0]["Реквизиты"].as_hash() {
                    names.extend(fields.keys().map(|name| name.as_str().unwrap().to_owned()));
                }
            }
            names.insert("НесуществующийРеквизит".to_owned());
            for name in names {
                let key = [component, owner, "attributes", name.as_str()];
                assert_eq!(
                    prepared.lookup_parts(Generation(1), index, &key),
                    expected.facts.lookup_parts(Generation(1), index, &key),
                    "{}: {name}",
                    case["id"]
                );
            }
            let consumer = entry_id(case["entry"].as_str().unwrap()).unwrap();
            let mut values = case["inputs"].clone();
            values["component"] = serde_json::json!(component);
            let inputs = project_fact_inputs(consumer, &values, prepared.clone());
            let imported = nkdk_compiled_rules::convert_file(
                consumer,
                Direction::XmlToYaml,
                case["xml"].as_str().unwrap().as_bytes(),
                &inputs,
            )
            .unwrap();
            migration_equality::compare(
                case["yaml"].as_str().unwrap(),
                std::str::from_utf8(&imported.bytes).unwrap(),
            );
            let restored = nkdk_compiled_rules::convert_file(
                consumer,
                Direction::YamlToXml,
                &imported.bytes,
                &inputs,
            )
            .unwrap();
            assert_eq!(
                normalized_xml(std::str::from_utf8(&restored.bytes).unwrap()),
                normalized_xml(case["xml"].as_str().unwrap()),
                "{}: working consumer restore",
                case["id"]
            );
            assert!(
                nkdk_compiled_rules::validate_file(consumer, &imported.bytes, &inputs)
                    .iter()
                    .all(|issue| issue.severity != nkdk_conversion_core::Severity::Error)
            );
        }
    }
    let edited = primary.join("cf/Справочник/СправочникПолный/Свойства.yaml");
    let yaml = std::fs::read_to_string(&edited).unwrap();
    assert!(yaml.contains("ДлинаКода: 11"));
    std::fs::write(&edited, yaml.replace("ДлинаКода: 11", "ДлинаКода: 12")).unwrap();
    let context = Context {
        component: "cfe",
        ..selection_context()
    };
    let sources = catalog
        .external_sources_with_base(
            &primary.join("cfe"),
            Some(&primary.join("cf")),
            &context,
            Direction::YamlToXml,
        )
        .unwrap();
    let entry = entry_id("candidate.input-by-string-base-numbers.catalog.current-yaml").unwrap();
    let updated = sources
        .iter()
        .filter(|source| source.entry.0 == entry.0)
        .collect::<Vec<_>>();
    assert_eq!(
        updated.len(),
        1,
        "Only adopted catalog joins the base source"
    );
    assert!(
        std::str::from_utf8(&updated[0].bytes)
            .unwrap()
            .contains("ДлинаКода: 12")
    );
    let case = cases
        .iter()
        .find(|case| case["id"] == "e2e-input-by-string-catalog-cf-current-yaml-members")
        .unwrap();
    let consumer = entry_id(case["entry"].as_str().unwrap()).unwrap();
    let original = std::fs::read_to_string(&edited).unwrap();
    let context = Context {
        component: "cf",
        ..selection_context()
    };
    for replacement in [None, Some("ЛюбаяСсылка"), Some("Строка(10)")] {
        let mut document = yaml_rust2::YamlLoader::load_from_str(&original)
            .unwrap()
            .remove(0);
        match replacement {
            Some(kind) => {
                document["Реквизиты"]["СтроковыйРеквизитСИндексом"]["Тип"] =
                    yaml_rust2::Yaml::String(kind.into())
            }
            None => {
                document["Реквизиты"]
                    .as_mut_hash()
                    .unwrap()
                    .remove(&yaml_rust2::Yaml::String(
                        "СтроковыйРеквизитСИндексом".into(),
                    ));
            }
        }
        let mut yaml = String::new();
        yaml_rust2::YamlEmitter::new(&mut yaml)
            .dump(&document)
            .unwrap();
        std::fs::write(&edited, yaml).unwrap();
        let mut sources = catalog
            .external_sources(&primary.join("cf"), &context, Direction::YamlToXml)
            .unwrap();
        let inputs = project_fact_inputs(consumer, &case["inputs"], external_facts(&mut sources));
        let xml = case["xml"].as_str().unwrap();
        let imported =
            convert_file(consumer, Direction::XmlToYaml, xml.as_bytes(), &inputs).unwrap();
        let invalid = replacement != Some("Строка(10)");
        assert_eq!(
            std::str::from_utf8(&imported.bytes)
                .unwrap()
                .contains("ВводПоСтроке: !xml/invalid"),
            invalid,
            "Current primary member mutation: {replacement:?}"
        );
        let restored =
            convert_file(consumer, Direction::YamlToXml, &imported.bytes, &inputs).unwrap();
        assert_eq!(
            normalized_xml(std::str::from_utf8(&restored.bytes).unwrap()),
            normalized_xml(xml)
        );
    }
    std::fs::remove_dir_all(root).unwrap();
}

#[test]
fn external_import_dependencies_use_current_xml_before_publication() {
    use nkdk::route::Catalog;
    let root = std::env::temp_dir().join(format!("nkdk-import-dependency-{}", std::process::id()));
    std::fs::create_dir_all(root.join("Other")).unwrap();
    let specification = "format: nkdk-operation-routes/1\nroutes: []\nfactRoutes:\n- xmlDir: Other\n  entry: migration.enumeration-own-identity\n  factDirections: [xml-to-yaml]\n  inputs:\n    component: component\n    parent: {snapshot: {entry: migration.document-root-source, field: Идентификатор, storage: external}}\n    ownerName: name\n    identitySeed: {literal: fixture}\n- xmlDir: Other\n  entry: migration.document-root-source\n  factDirections: [xml-to-yaml]\n  inputs: {}\n";
    let catalog = Catalog::parse(specification).unwrap();
    let context = selection_context();
    for identity in ["first", "changed"] {
        std::fs::write(root.join("Other/Example.xml"), format!(
            "<MetaDataObject xmlns=\"http://v8.1c.ru/8.3/MDClasses\" version=\"2.20\"><Document uuid=\"{identity}\"><Properties><Name>Example</Name></Properties></Document><Enum uuid=\"enum-id\"><Properties><Name>Example</Name></Properties></Enum></MetaDataObject>"
        )).unwrap();
        let sources = catalog
            .external_sources(&root, &context, Direction::XmlToYaml)
            .unwrap();
        let consumer = sources
            .iter()
            .find(|source| {
                source.entry.0 == entry_id("migration.enumeration-own-identity").unwrap().0
            })
            .unwrap();
        let parent = nkdk_compiled_rules::input_names(consumer.entry)
            .iter()
            .position(|name| *name == "parent")
            .unwrap();
        assert_eq!(consumer.inputs.text(parent).unwrap(), identity);
        assert_eq!(sources.len(), 2);
        catalog
            .save_external_sources(&root, &context, &sources)
            .unwrap();
    }
    // An unselected branch may name a missing provider; dependency discovery
    // follows the resolved binding rather than eagerly traversing every case.
    let reference = "{snapshot: {entry: migration.document-root-source, field: Идентификатор, storage: external}}";
    let lazy = specification.replace(reference,
        "{select: {on: {literal: chosen}, cases: {chosen: {literal: direct}, unused: {snapshot: {entry: migration.enumeration-base-identity, field: uuid, storage: external}}}}}");
    assert_eq!(
        Catalog::parse(&lazy)
            .unwrap()
            .external_sources(&root, &context, Direction::XmlToYaml)
            .unwrap()
            .len(),
        2
    );
    let missing = specification.replace(
        "entry: migration.document-root-source, field: Идентификатор",
        "entry: migration.enumeration-base-identity, field: uuid",
    );
    assert!(
        Catalog::parse(&missing)
            .unwrap()
            .external_sources(&root, &context, Direction::XmlToYaml)
            .is_err()
    );
    let cycle = specification.replace(
        "entry: migration.document-root-source, field: Идентификатор",
        "entry: migration.enumeration-own-identity, field: uuid",
    );
    let error = Catalog::parse(&cycle)
        .unwrap()
        .external_sources(&root, &context, Direction::XmlToYaml)
        .err()
        .unwrap();
    assert!(format!("{error:?}").contains("cycle"));
    std::fs::remove_dir_all(root).unwrap();
}

#[test]
fn external_source_registration_accepts_only_disjoint_component_scopes() {
    use nkdk::route::Catalog;
    let header = "format: nkdk-operation-routes/1\nroutes: []\nfactRoutes:\n";
    let route = |scope| {
        format!(
            "- xmlDir: Other\n  entry: migration.document-root-source\n  only: {scope}\n  inputs: {{}}\n"
        )
    };
    let first = route("[cf]");
    let second = route("[cfe]");
    assert!(Catalog::parse(&format!("{header}{first}{second}")).is_ok());
    assert!(
        Catalog::parse_sources(&[&format!("{header}{first}"), &format!("{header}{second}")])
            .is_ok()
    );
    for overlap in ["[cf]", "[cf, cfe]", "[]"] {
        let conflict = route(overlap);
        assert!(Catalog::parse(&format!("{header}{first}{conflict}")).is_err());
        assert!(
            Catalog::parse_sources(&[&format!("{header}{first}"), &format!("{header}{conflict}")])
                .is_err()
        );
    }
}
