use nkdk_compiled_rules::{
    Direction, PreparedInputs, convert_file, entry_id, validate_file, verify_candidate,
};

#[test]
fn path_lexicons_preserve_the_existing_bidirectional_vocabulary() {
    let fixture_root = std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join("../../..");
    let read_fixture = |case: &serde_json::Value| {
        std::fs::read(fixture_root.join(case["source"].as_str().unwrap())).unwrap()
    };
    let reference: serde_json::Value = serde_json::from_slice(include_bytes!(
        "../../../../tests/migration/metadata-path-lexicons.json"
    ))
    .unwrap();
    assert_eq!(reference["tables"].as_array().unwrap().len(), 5);
    assert_eq!(reference["pairs"].as_u64(), Some(96));
    let inputs = PreparedInputs::default();
    let verify = |entry, xml: &[u8], yaml: &[u8]| {
        assert!(validate_file(entry, yaml, &inputs).is_empty());
        verify_candidate(entry, xml, yaml, &inputs).unwrap();
    };
    let corpus: serde_json::Value = serde_json::from_slice(include_bytes!(
        "../../../../tests/migration/metadata-root-index-inventory.json"
    ))
    .unwrap();
    let generation = nkdk_conversion_core::facts::Generation(1);
    let budget = || nkdk_conversion_core::facts::prepared::FactBudget {
        text: nkdk_conversion_core::facts::text::TextBudget {
            entries: 2000,
            bytes: 200000,
        },
        rows: 1000,
    };
    let mut builder = nkdk_compiled_rules::fact_builder(generation, budget());
    let internal: serde_json::Value = serde_json::from_slice(include_bytes!(
        "../../../../tests/migration/internal-generated-types-inventory.json"
    ))
    .unwrap();
    assert_eq!(internal.as_array().unwrap().len(), 11);
    let language_inputs = |case: &serde_json::Value| {
        vec![
            (
                "defaultLanguage".into(),
                nkdk_compiled_rules::InputValue::Text(
                    case["defaultLanguage"].as_str().unwrap().into(),
                ),
            ),
            (
                "registeredLanguages".into(),
                nkdk_compiled_rules::InputValue::Sequence(
                    case["registeredLanguages"]
                        .as_array()
                        .unwrap()
                        .iter()
                        .map(|value| {
                            nkdk_compiled_rules::InputValue::Text(value.as_str().unwrap().into())
                        })
                        .collect(),
                ),
            ),
        ]
    };
    let resource_inputs =
        |case: &serde_json::Value| -> Vec<(String, nkdk_compiled_rules::InputValue)> {
            ["forms", "templates"]
                .into_iter()
                .map(|field| {
                    (
                        field.into(),
                        nkdk_compiled_rules::InputValue::Sequence(
                            case["resources"][field]
                                .as_array()
                                .unwrap()
                                .iter()
                                .map(|name| {
                                    nkdk_compiled_rules::InputValue::Text(
                                        name.as_str().unwrap().into(),
                                    )
                                })
                                .collect(),
                        ),
                    )
                })
                .collect()
        };
    for case in internal.as_array().unwrap() {
        let profile = if case["kind"] == "Document" {
            "migration.document-child-names"
        } else {
            "migration.journal-child-names"
        };
        let entry = entry_id(profile).unwrap();
        let values = resource_inputs(case);
        let inputs = nkdk_compiled_rules::prepare_inputs(entry, values).unwrap();
        let source = case["childNamesXml"].as_str().unwrap().as_bytes();
        let yaml = convert_file(entry, Direction::XmlToYaml, source, &inputs).unwrap();
        let canonical = ["forms", "templates"]
            .iter()
            .all(|field| case["resources"][*field] == case["childNames"][*field]);
        assert_eq!(
            yaml.bytes.is_empty(),
            canonical,
            "{}: {}",
            case["source"],
            String::from_utf8_lossy(&yaml.bytes)
        );
        verify_candidate(entry, source, &yaml.bytes, &inputs).unwrap();
    }
    let producer = entry_id("migration.metadata-root-index").unwrap();
    let child_producer = entry_id("migration.metadata-child-index").unwrap();
    let seed_metadata = |builder: &mut nkdk_conversion_core::facts::prepared::TextFactsBuilder,
                         direction| {
        for item in corpus["roots"].as_array().unwrap() {
            let values = ["kind", "name", "identity"]
                .map(|key| nkdk_conversion_core::xml::escape(item[key].as_str().unwrap()));
            let xml = format!(
                "<Root><Kind>{}</Kind><Name>{}</Name><Identity>{}</Identity></Root>",
                values[0], values[1], values[2]
            );
            assert!(
                nkdk_compiled_rules::contribute_file(
                    producer,
                    Direction::XmlToYaml,
                    xml.as_bytes(),
                    &inputs,
                    builder
                )
                .is_empty()
            );
        }
        for item in corpus["children"].as_array().unwrap() {
            let values = ["kind", "name", "identity", "parent"]
                .map(|key| nkdk_conversion_core::xml::escape(item[key].as_str().unwrap()));
            let xml = format!(
                "<Root><Kind>{}</Kind><Name>{}</Name><Identity>{}</Identity><Parent>{}</Parent></Root>",
                values[0], values[1], values[2], values[3]
            );
            assert!(
                nkdk_compiled_rules::contribute_file(
                    child_producer,
                    Direction::XmlToYaml,
                    xml.as_bytes(),
                    &inputs,
                    builder
                )
                .is_empty()
            );
        }
        let form_producer = entry_id("migration.form-metadata-header").unwrap();
        for item in corpus["forms"].as_array().unwrap() {
            let mut values = language_inputs(&internal[0]);
            for name in ["parent", "name", "identity"] {
                values.push((
                    name.into(),
                    nkdk_compiled_rules::InputValue::Text(item[name].as_str().unwrap().into()),
                ));
            }
            let prepared = nkdk_compiled_rules::prepare_inputs(form_producer, values).unwrap();
            let xml = read_fixture(item);
            let source = if matches!(direction, Direction::XmlToYaml) {
                xml
            } else {
                convert_file(form_producer, Direction::XmlToYaml, &xml, &prepared)
                    .unwrap()
                    .bytes
            };
            let issues = nkdk_compiled_rules::contribute_file(
                form_producer,
                direction,
                &source,
                &prepared,
                builder,
            );
            assert!(issues.is_empty(), "{}: {issues:?}", item["source"]);
        }
    };
    for direction in [Direction::XmlToYaml, Direction::YamlToXml] {
        let mut ids = nkdk_compiled_rules::fact_builder(generation, budget());
        seed_metadata(&mut ids, direction);
        for case in internal.as_array().unwrap() {
            let profile = if case["kind"] == "Document" {
                "migration.document-internal-types"
            } else {
                "migration.journal-internal-types"
            };
            let entry = entry_id(profile).unwrap();
            let prepared = nkdk_compiled_rules::prepare_inputs(
                entry,
                vec![(
                    "owner".into(),
                    nkdk_compiled_rules::InputValue::Text(case["owner"].as_str().unwrap().into()),
                )],
            )
            .unwrap();
            let source = if matches!(direction, Direction::XmlToYaml) {
                read_fixture(case)
            } else {
                let mut yaml = String::from("ВнутренниеТипы:\n");
                for item in case["items"].as_array().unwrap() {
                    for (prefix, label, field) in [
                        ("  -", "Имя", "name"),
                        ("   ", "Категория", "category"),
                        ("   ", "Тип", "typeId"),
                        ("   ", "Значение", "valueId"),
                    ] {
                        yaml.push_str(&format!("{prefix} {label}: {}\n", item[field]));
                    }
                }
                yaml.into_bytes()
            };
            let errors = nkdk_compiled_rules::contribute_file(
                entry, direction, &source, &prepared, &mut ids,
            );
            assert!(errors.is_empty(), "{}: {errors:?}", case["source"]);
        }
        let ids = std::sync::Arc::new(ids.finish());
        let mut checked = 0;
        for case in internal.as_array().unwrap() {
            for item in case["items"].as_array().unwrap() {
                for (index, value) in [
                    ("metadata.internal-type-ids", "typeId"),
                    ("metadata.internal-value-ids", "valueId"),
                ] {
                    assert_eq!(
                        ids.lookup_parts(
                            generation,
                            nkdk_compiled_rules::fact_id(index).unwrap(),
                            &[
                                item["shortName"].as_str().unwrap(),
                                case["owner"].as_str().unwrap()
                            ]
                        ),
                        nkdk_conversion_core::facts::FactState::Ready(
                            item[value].as_str().unwrap()
                        )
                    );
                    checked += 1;
                }
            }
        }
        for case in internal.as_array().unwrap() {
            let profile = if case["kind"] == "Document" {
                "migration.document-internal-info"
            } else {
                "migration.journal-internal-info"
            };
            let entry = entry_id(profile).unwrap();
            let prepare = |name: &str| {
                nkdk_compiled_rules::prepare_fact_inputs(
                    entry,
                    ids.clone(),
                    generation,
                    vec![
                        (
                            "owner".into(),
                            nkdk_compiled_rules::InputValue::Text(
                                case["owner"].as_str().unwrap().into(),
                            ),
                        ),
                        (
                            "name".into(),
                            nkdk_compiled_rules::InputValue::Text(name.into()),
                        ),
                    ],
                )
                .unwrap()
            };
            let name = case["name"].as_str().unwrap();
            let inputs = prepare(name);
            let original = case["xml"].as_str().unwrap();
            let converted =
                convert_file(entry, Direction::XmlToYaml, original.as_bytes(), &inputs).unwrap();
            assert!(
                converted.bytes.is_empty(),
                "{}: {}",
                case["source"],
                String::from_utf8_lossy(&converted.bytes)
            );
            verify_candidate(entry, original.as_bytes(), &converted.bytes, &inputs).unwrap();
            let renamed = format!("{name}Renamed");
            let expected = original.replace(&format!(".{name}\""), &format!(".{renamed}\""));
            verify_candidate(entry, expected.as_bytes(), b"", &prepare(&renamed)).unwrap();
            let absent = format!(
                "<MetaDataObject xmlns='http://v8.1c.ru/8.3/MDClasses'><{}/></MetaDataObject>",
                case["kind"].as_str().unwrap()
            );
            let yaml =
                convert_file(entry, Direction::XmlToYaml, absent.as_bytes(), &inputs).unwrap();
            assert!(String::from_utf8_lossy(&yaml.bytes).contains("!xml/raw"));
            verify_candidate(entry, absent.as_bytes(), &yaml.bytes, &inputs).unwrap();
            // The document assembly depends on unaccepted candidate attributes;
            // its fragments and register roles have separate bounded checks.
            if case["kind"] == "Document" {
                continue;
            }
            let assembled = entry_id("migration.journal-identity-and-children").unwrap();
            let mut values = vec![
                (
                    "owner".into(),
                    nkdk_compiled_rules::InputValue::Text(case["owner"].as_str().unwrap().into()),
                ),
                (
                    "name".into(),
                    nkdk_compiled_rules::InputValue::Text(name.into()),
                ),
            ];
            values.extend(language_inputs(case));
            values.extend(resource_inputs(case));
            values.push((
                "commandNames".into(),
                nkdk_compiled_rules::InputValue::Sequence(
                    case["commands"]
                        .as_array()
                        .unwrap()
                        .iter()
                        .map(|command| {
                            nkdk_compiled_rules::InputValue::Text(
                                command["name"].as_str().unwrap().into(),
                            )
                        })
                        .collect(),
                ),
            ));
            values.push((
                "ownerPath".into(),
                nkdk_compiled_rules::InputValue::Text(case["ownerPath"].as_str().unwrap().into()),
            ));
            let help_path = std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
                .join("../../../e2e/fixtures/xml/cf")
                .join(if case["kind"] == "Document" {
                    "Documents"
                } else {
                    "DocumentJournals"
                })
                .join(name)
                .join("Ext/Help.xml");
            let additional_path = help_path.with_file_name("AdditionalIndexes.xml");
            let additional = std::fs::read(&additional_path).unwrap_or_default();
            let help = if help_path.is_file() {
                std::fs::read(help_path).unwrap()
            } else {
                Vec::new()
            };
            values.push((
                "helpPages".into(),
                nkdk_compiled_rules::InputValue::Sequence(if help.is_empty() {
                    vec![]
                } else {
                    vec![nkdk_compiled_rules::InputValue::Text("ru".into())]
                }),
            ));
            let cold = nkdk_compiled_rules::prepare_fact_inputs(
                assembled,
                ids.clone(),
                generation,
                values.clone(),
            )
            .unwrap();
            let resource_plan = nkdk_compiled_rules::resource_requests(
                assembled,
                &cold,
                nkdk_conversion_core::resources::Limits {
                    groups: 256,
                    routes: 1024,
                    path_bytes: 4096,
                },
            )
            .unwrap();
            let help_routes: Vec<_> = resource_plan
                .groups()
                .iter()
                .flatten()
                .filter(|route| route.paths(Direction::XmlToYaml).0.segments() == ["Ext", "Help"])
                .collect();
            assert_eq!(help_routes.len(), 1);
            let route = help_routes[0];
            let (xml_path, yaml_path) = route.paths(Direction::XmlToYaml);
            assert_eq!(yaml_path.segments(), ["Справка"]);
            assert!(route.is_remainder());
            assert_eq!(route.paths(Direction::YamlToXml), (yaml_path, xml_path));
            let inputs = nkdk_compiled_rules::prepare_fact_inputs(
                assembled,
                ids.clone(),
                generation,
                values,
            )
            .unwrap()
            .with_documents(vec![
                (
                    nkdk_conversion_core::resources::RelativePath::new(["Ext", "Help.xml"], 4096)
                        .unwrap(),
                    help.clone(),
                ),
                (
                    nkdk_conversion_core::resources::RelativePath::new(
                        ["Ext", "AdditionalIndexes.xml"],
                        4096,
                    )
                    .unwrap(),
                    additional.clone(),
                ),
            ])
            .unwrap();
            let original = case["assemblyXml"].as_str().unwrap();
            for xml in [
                original.to_owned(),
                original.replace(
                    &format!(" uuid=\"{}\"", case["owner"].as_str().unwrap()),
                    "",
                ),
            ]
            .into_iter()
            {
                let yaml =
                    convert_file(assembled, Direction::XmlToYaml, xml.as_bytes(), &inputs).unwrap();
                verify_candidate(assembled, xml.as_bytes(), &yaml.bytes, &inputs).unwrap();
                let exported =
                    convert_file(assembled, Direction::YamlToXml, &yaml.bytes, &cold).unwrap();
                assert_eq!(
                    exported.documents.len(),
                    usize::from(!help.is_empty()) + usize::from(!additional.is_empty())
                );
                for (name, expected) in
                    [("Help.xml", &help), ("AdditionalIndexes.xml", &additional)]
                {
                    if expected.is_empty() {
                        continue;
                    }
                    let path =
                        nkdk_conversion_core::resources::RelativePath::new(["Ext", name], 4096)
                            .unwrap();
                    let matching: Vec<_> = exported
                        .documents
                        .iter()
                        .filter(|(actual, _)| actual == &path)
                        .collect();
                    assert_eq!(
                        matching.len(),
                        1,
                        "missing or repeated external document: {name}"
                    );
                    nkdk_conversion_core::proof::verify(expected, &matching[0].1, |_| false)
                        .unwrap();
                }
                assert!(!String::from_utf8_lossy(&yaml.bytes).contains("ВнутренниеТипы:"));
            }
        }
        assert_eq!(checked, 98);
    }
    seed_metadata(&mut builder, Direction::XmlToYaml);
    let facts = std::sync::Arc::new(builder.finish());
    for case in internal.as_array().unwrap() {
        let entry = entry_id(if case["kind"] == "Document" {
            "migration.document-form-links"
        } else {
            "migration.journal-form-links"
        })
        .unwrap();
        let mut values = resource_inputs(case);
        values.retain(|(name, _)| name == "forms");
        values.push((
            "ownerPath".into(),
            nkdk_compiled_rules::InputValue::Text(case["ownerPath"].as_str().unwrap().into()),
        ));
        if case["kind"] == "Document" {
            values.push((
                "name".into(),
                nkdk_compiled_rules::InputValue::Text(case["name"].as_str().unwrap().into()),
            ));
        }
        let inputs =
            nkdk_compiled_rules::prepare_fact_inputs(entry, facts.clone(), generation, values)
                .unwrap();
        let original = case["formLinksXml"].as_str().unwrap();
        let yaml = convert_file(entry, Direction::XmlToYaml, original.as_bytes(), &inputs).unwrap();
        assert_eq!(
            String::from_utf8_lossy(&yaml.bytes),
            case["formLinksYaml"].as_str().unwrap(),
            "{}",
            case["source"]
        );
        verify_candidate(entry, original.as_bytes(), &yaml.bytes, &inputs).unwrap();
        if !yaml.bytes.is_empty() {
            let owner = case["ownerPath"].as_str().unwrap();
            let foreign = original.replace(owner, &format!("{owner}Other"));
            let changed =
                convert_file(entry, Direction::XmlToYaml, foreign.as_bytes(), &inputs).unwrap();
            verify_candidate(entry, foreign.as_bytes(), &changed.bytes, &inputs).unwrap();
            assert!(String::from_utf8_lossy(&changed.bytes).contains("!xml/raw"));
            let label = if case["kind"] == "Document" {
                "ОсновнаяФормаОбъекта"
            } else {
                "ОсновнаяФорма"
            };
            let missing = format!("{label}: Missing");
            assert!(
                validate_file(entry, missing.as_bytes(), &inputs)
                    .iter()
                    .any(|error| error.code.as_deref() == Some("metadata.target-missing"))
            );
        }
    }
    for direction in [Direction::XmlToYaml, Direction::YamlToXml] {
        let mut forms = nkdk_compiled_rules::fact_builder(generation, budget());
        seed_metadata(&mut forms, direction);
        let facts = std::sync::Arc::new(forms.finish());
        let entry = entry_id("migration.external-choice-form").unwrap();
        let prepared =
            nkdk_compiled_rules::prepare_fact_inputs(entry, facts.clone(), generation, vec![])
                .unwrap();
        let mut cases = Vec::new();
        for root in corpus["roots"].as_array().unwrap() {
            let name = root["name"].as_str().unwrap();
            if root["kind"] == "CommonForm" {
                cases.push((format!("CommonForm.{name}"), format!("ОбщаяФорма.{name}")));
            } else if root["kind"] == "DocumentJournal" {
                for form in corpus["forms"]
                    .as_array()
                    .unwrap()
                    .iter()
                    .filter(|form| form["parent"] == root["identity"])
                {
                    let form = form["name"].as_str().unwrap();
                    cases.push((
                        format!("DocumentJournal.{name}.Form.{form}"),
                        format!("ЖурналДокументов.{name}.Форма.{form}"),
                    ));
                }
            }
        }
        assert!(
            cases
                .iter()
                .any(|(path, _)| path.starts_with("DocumentJournal."))
        );
        assert!(
            cases
                .iter()
                .any(|(path, _)| path.starts_with("CommonForm."))
        );
        for (path, expected) in cases {
            let xml = format!("<Root><Form>{path}</Form></Root>");
            let yaml = format!("Форма: {expected}");
            assert_eq!(
                convert_file(entry, Direction::XmlToYaml, xml.as_bytes(), &prepared)
                    .unwrap()
                    .bytes,
                yaml.as_bytes()
            );
            assert!(validate_file(entry, yaml.as_bytes(), &prepared).is_empty());
            verify_candidate(entry, xml.as_bytes(), yaml.as_bytes(), &prepared).unwrap();
        }
        for path in [
            "CommonForm.Missing",
            "DocumentJournal.Missing.Form.ФормаСписка",
            "DocumentJournal.ЖурналДокументовПоУмолчанию.Form.ФормаСписка",
            "DocumentJournal.ЖурналДокументовВсеСвойства.Form.Missing",
        ] {
            let xml = format!("<Root><Form>{path}</Form></Root>");
            let result =
                convert_file(entry, Direction::XmlToYaml, xml.as_bytes(), &prepared).unwrap();
            assert!(String::from_utf8_lossy(&result.bytes).contains("!xml/invalid"));
            assert!(validate_file(entry, &result.bytes, &prepared).is_empty());
            verify_candidate(entry, xml.as_bytes(), &result.bytes, &prepared).unwrap();
        }
    }
    {
        let entry = entry_id("migration.metadata-command-group").unwrap();
        let prepared =
            nkdk_compiled_rules::prepare_fact_inputs(entry, facts.clone(), generation, vec![])
                .unwrap();
        let root = std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join("../../..");
        for (directory, kind, name) in [
            ("Documents", "Документ", "ДокументВсеСвойства"),
            (
                "DocumentJournals",
                "ЖурналДокументов",
                "ЖурналДокументовВсеСвойства",
            ),
        ] {
            let source = std::fs::read_to_string(
                root.join(format!("e2e/fixtures/xml/cf/{directory}/{name}.xml")),
            )
            .unwrap();
            let start = source.find("<Group>").unwrap();
            let end = start + source[start..].find("</Group>").unwrap() + "</Group>".len();
            let xml = format!("<Root>{}</Root>", &source[start..end]);
            let yaml = std::fs::read_to_string(
                root.join(format!("e2e/fixtures/nkdk/cf/{kind}/{name}/Свойства.yaml")),
            )
            .unwrap();
            let expected = yaml
                .lines()
                .map(str::trim)
                .find(|line| line.starts_with("Группа:"))
                .unwrap();
            let exported =
                convert_file(entry, Direction::YamlToXml, expected.as_bytes(), &prepared).unwrap();
            let canonical =
                convert_file(entry, Direction::XmlToYaml, &exported.bytes, &prepared).unwrap();
            assert_eq!(std::str::from_utf8(&canonical.bytes).unwrap(), expected);
            let preserved =
                convert_file(entry, Direction::XmlToYaml, xml.as_bytes(), &prepared).unwrap();
            verify_candidate(entry, xml.as_bytes(), &preserved.bytes, &prepared).unwrap();
        }
        for xml in [
            "<Root/>",
            "<Root><Group/></Root>",
            "<Root><Group>CommandGroup.Missing</Group></Root>",
            "<Root><Group>Unknown</Group></Root>",
        ] {
            let preserved =
                convert_file(entry, Direction::XmlToYaml, xml.as_bytes(), &prepared).unwrap();
            assert!(validate_file(entry, &preserved.bytes, &prepared).is_empty());
            verify_candidate(entry, xml.as_bytes(), &preserved.bytes, &prepared).unwrap();
        }
        assert!(
            validate_file(entry, "Группа: ГруппаКоманд.Missing".as_bytes(), &prepared)
                .iter()
                .any(|issue| issue.code.as_deref() == Some("metadata.target-missing"))
        );
    }

    let normalized_properties = |text: &str| {
        use nkdk_conversion_core::yaml::{self, Node};
        let next = std::cell::Cell::new(0usize);
        let mut properties = std::collections::BTreeMap::<usize, Vec<(u8, String)>>::new();
        yaml::visit_partitions(
            yaml::DocumentSource(if text.is_empty() {
                b"{}"
            } else {
                text.as_bytes()
            }),
            |_| {
                let slot = next.get();
                next.set(slot + 1);
                Some(slot)
            },
            |slot, node, _| {
                let Some(slot) = slot else {
                    return Ok(());
                };
                let token = match node {
                    Node::MappingStart(tag) => {
                        assert!(tag.is_none());
                        (0, String::new())
                    }
                    Node::MappingEnd => (1, String::new()),
                    Node::SequenceStart(tag) => {
                        assert!(tag.is_none());
                        (2, String::new())
                    }
                    Node::SequenceEnd => (3, String::new()),
                    Node::Scalar(value, tag) => {
                        assert!(tag.is_none());
                        let (text, numeric) = value.into_choice_text()?;
                        if numeric {
                            (
                                5,
                                nkdk_conversion_core::decimal::Decimal::parse(&text)
                                    .unwrap()
                                    .to_string(),
                            )
                        } else {
                            (4, text)
                        }
                    }
                };
                properties.entry(slot).or_default().push(token);
                Ok(())
            },
        )
        .unwrap();
        let mut properties = properties.into_values().collect::<Vec<_>>();
        properties.sort();
        properties
    };
    let compare_properties =
        |entry, prepared: &PreparedInputs, xml: &[u8], expected: &str, source: &str| {
            let result = convert_file(entry, Direction::XmlToYaml, xml, prepared).unwrap();
            let actual = std::str::from_utf8(&result.bytes).unwrap();
            assert_eq!(
                normalized_properties(actual),
                normalized_properties(expected),
                "{source}: {actual}"
            );
            assert!(validate_file(entry, &result.bytes, prepared).is_empty());
            verify_candidate(entry, xml, &result.bytes, prepared).unwrap();
            verify_candidate(entry, xml, expected.as_bytes(), prepared).unwrap();
        };
    let header = entry_id("migration.form-metadata-header").unwrap();
    for direction in [Direction::XmlToYaml, Direction::YamlToXml] {
        let mut registered = nkdk_compiled_rules::fact_builder(generation, budget());
        let mut count = 0;
        for case in internal.as_array().unwrap() {
            for form in case["formHeaders"].as_array().unwrap() {
                let mut values = language_inputs(case);
                for (name, value) in [
                    ("parent", &case["owner"]),
                    ("name", &form["name"]),
                    ("identity", &form["identity"]),
                ] {
                    values.push((
                        name.into(),
                        nkdk_compiled_rules::InputValue::Text(value.as_str().unwrap().into()),
                    ));
                }
                let prepared = nkdk_compiled_rules::prepare_inputs(header, values).unwrap();
                let xml = form["xml"].as_str().unwrap();
                let expected = form["yaml"].as_str().unwrap();
                compare_properties(
                    header,
                    &prepared,
                    xml.as_bytes(),
                    expected,
                    form["source"].as_str().unwrap(),
                );
                if form["name"] == "ФормаВыбора" && matches!(direction, Direction::XmlToYaml)
                {
                    let mobile = xml.find("MobilePlatformApplication").unwrap();
                    let start = xml[..mobile].rfind("<v8:Value").unwrap();
                    let end =
                        mobile + xml[mobile..].find("</v8:Value>").unwrap() + "</v8:Value>".len();
                    let platform = format!("{}{}", &xml[..start], &xml[end..]);
                    let shortened =
                        convert_file(header, Direction::XmlToYaml, platform.as_bytes(), &prepared)
                            .unwrap();
                    assert!(
                        shortened.bytes.is_empty(),
                        "{}",
                        String::from_utf8_lossy(&shortened.bytes)
                    );
                    verify_candidate(header, platform.as_bytes(), &shortened.bytes, &prepared)
                        .unwrap();
                    let unknown = xml.replace("MobilePlatformApplication", "FuturePurpose");
                    let preserved =
                        convert_file(header, Direction::XmlToYaml, unknown.as_bytes(), &prepared)
                            .unwrap();
                    assert!(String::from_utf8_lossy(&preserved.bytes).contains("!xml/invalid"));
                    verify_candidate(header, unknown.as_bytes(), &preserved.bytes, &prepared)
                        .unwrap();
                }
                let source = if matches!(direction, Direction::XmlToYaml) {
                    read_fixture(form)
                } else {
                    expected.as_bytes().to_vec()
                };
                let errors = nkdk_compiled_rules::contribute_file(
                    header,
                    direction,
                    &source,
                    &prepared,
                    &mut registered,
                );
                assert!(errors.is_empty(), "{}: {errors:?}", form["source"]);
                count += 1;
            }
        }
        assert_eq!(count, 6);
        let registered = registered.finish();
        let index = nkdk_compiled_rules::fact_id("metadata.forms").unwrap();
        for case in internal.as_array().unwrap() {
            for form in case["formHeaders"].as_array().unwrap() {
                assert_eq!(
                    registered.lookup_parts(
                        generation,
                        index,
                        &[
                            form["name"].as_str().unwrap(),
                            case["owner"].as_str().unwrap()
                        ]
                    ),
                    nkdk_conversion_core::facts::FactState::Ready(
                        form["identity"].as_str().unwrap()
                    )
                );
            }
        }
    }
    let mut command_count = 0;
    for case in internal.as_array().unwrap() {
        for command in case["commands"].as_array().unwrap() {
            let entry = entry_id("migration.command-base-properties").unwrap();
            let mut values = language_inputs(case);
            for field in ["name", "identity"] {
                values.push((
                    field.into(),
                    nkdk_compiled_rules::InputValue::Text(command[field].as_str().unwrap().into()),
                ));
            }
            let prepared =
                nkdk_compiled_rules::prepare_fact_inputs(entry, facts.clone(), generation, values)
                    .unwrap();
            let resources = nkdk_compiled_rules::resource_requests(
                entry,
                &prepared,
                nkdk_conversion_core::resources::Limits {
                    groups: 8,
                    routes: 16,
                    path_bytes: 4096,
                },
            )
            .unwrap();
            assert_eq!(resources.groups().len(), 1);
            assert_eq!(resources.groups()[0].len(), 2);
            for (route, suffix) in resources.groups()[0].iter().zip(["bsl", "bin"]) {
                let (xml_path, yaml_path) = route.paths(Direction::XmlToYaml);
                assert_eq!(
                    xml_path.segments(),
                    [
                        "Commands",
                        command["name"].as_str().unwrap(),
                        "Ext",
                        &format!("CommandModule.{suffix}")
                    ]
                );
                assert_eq!(
                    yaml_path.segments(),
                    [
                        "Команды",
                        &format!("{}.{suffix}", command["name"].as_str().unwrap())
                    ]
                );
                assert_eq!(route.paths(Direction::YamlToXml), (yaml_path, xml_path));
            }
            let xml = command["xml"].as_str().unwrap();
            // Ordinary Group has no xsi:type, as in every command fixture in the e2e corpus.
            let imported =
                convert_file(entry, Direction::XmlToYaml, xml.as_bytes(), &prepared).unwrap();
            verify_candidate(entry, xml.as_bytes(), &imported.bytes, &prepared).unwrap();
            let expected = command["yaml"].as_str().unwrap();
            let meaning =
                nkdk_conversion_core::raw::Property::decode(&imported.bytes, "Группа", "Group")
                    .unwrap()
                    .map_or_else(|| imported.bytes.clone(), |envelope| envelope.meaning);
            assert_eq!(
                normalized_properties(std::str::from_utf8(&meaning).unwrap()),
                normalized_properties(expected)
            );
            let canonical =
                convert_file(entry, Direction::YamlToXml, expected.as_bytes(), &prepared).unwrap();
            let back =
                convert_file(entry, Direction::XmlToYaml, &canonical.bytes, &prepared).unwrap();
            assert_eq!(
                normalized_properties(std::str::from_utf8(&back.bytes).unwrap()),
                normalized_properties(expected)
            );
            command_count += 1;
        }
    }
    assert_eq!(command_count, 2);
    for case in internal.as_array().unwrap() {
        let entry = entry_id(if case["kind"] == "DocumentJournal" {
            "migration.journal-base-properties"
        } else {
            "migration.document-base-properties"
        })
        .unwrap();
        let mut values = language_inputs(case);
        values.push((
            "name".into(),
            nkdk_compiled_rules::InputValue::Text(case["name"].as_str().unwrap().into()),
        ));
        let prepared =
            nkdk_compiled_rules::prepare_fact_inputs(entry, facts.clone(), generation, values)
                .unwrap();
        let xml = case["basePropertiesXml"].as_str().unwrap().as_bytes();
        let expected = case["basePropertiesYaml"].as_str().unwrap();
        compare_properties(
            entry,
            &prepared,
            xml,
            expected,
            case["source"].as_str().unwrap(),
        );
        if case["kind"] == "Document" {
            let entry = entry_id("migration.document-object-links").unwrap();
            let prepared = nkdk_compiled_rules::prepare_fact_inputs(
                entry,
                facts.clone(),
                generation,
                vec![(
                    "owner".into(),
                    nkdk_compiled_rules::InputValue::Text(case["owner"].as_str().unwrap().into()),
                )],
            )
            .unwrap();
            let xml = case["objectLinksXml"].as_str().unwrap().as_bytes();
            let expected = case["objectLinksYaml"].as_str().unwrap();
            compare_properties(
                entry,
                &prepared,
                xml,
                expected,
                case["source"].as_str().unwrap(),
            );
            assert!(
                validate_file(entry, "Нумератор: Missing".as_bytes(), &prepared)
                    .iter()
                    .any(|issue| issue.code.as_deref() == Some("metadata.target-missing"))
            );
            let original = std::str::from_utf8(xml).unwrap();
            if original.contains("DocumentNumerator.") {
                let wrong = original.replace("DocumentNumerator.", "Catalog.");
                let preserved =
                    convert_file(entry, Direction::XmlToYaml, wrong.as_bytes(), &prepared).unwrap();
                assert!(
                    std::str::from_utf8(&preserved.bytes)
                        .unwrap()
                        .contains("!xml/raw")
                );
                verify_candidate(entry, wrong.as_bytes(), &preserved.bytes, &prepared).unwrap();
            }
        }

        if let Some(cases) = case["numberLengthCases"].as_array() {
            for variant in cases {
                let xml = variant["xml"].as_str().unwrap().as_bytes();
                let result = convert_file(entry, Direction::XmlToYaml, xml, &prepared).unwrap();
                let yaml = std::str::from_utf8(&result.bytes).unwrap();
                assert_eq!(
                    yaml.contains("!xml/invalid"),
                    variant["invalid"].as_bool().unwrap(),
                    "{yaml}"
                );
                assert!(!yaml.contains("!xml/raw"), "{yaml}");
                assert!(yaml.contains(variant["length"].as_str().unwrap()), "{yaml}");
                assert!(validate_file(entry, &result.bytes, &prepared).is_empty());
                verify_candidate(entry, xml, &result.bytes, &prepared).unwrap();
            }
        }
    }

    assert!(!corpus["cases"].as_array().unwrap().is_empty());
    for (profile, physical, expected) in [
        (
            "migration.metadata-indexed-root-path",
            "Value",
            "expectedRoot",
        ),
        (
            "migration.metadata-indexed-object-path",
            "Path",
            "expectedTarget",
        ),
    ] {
        let indexed = entry_id(profile).unwrap();
        let prepared =
            nkdk_compiled_rules::prepare_fact_inputs(indexed, facts.clone(), generation, vec![])
                .unwrap();
        for case in corpus["cases"].as_array().unwrap() {
            let xml = format!(
                "<Root><{physical}>{}</{physical}></Root>",
                nkdk_conversion_core::xml::escape(case["path"].as_str().unwrap())
            );
            let result =
                convert_file(indexed, Direction::XmlToYaml, xml.as_bytes(), &prepared).unwrap();
            assert!(
                !String::from_utf8_lossy(&result.bytes).contains("!xml/raw"),
                "{}",
                case["path"]
            );
            assert_eq!(
                !String::from_utf8_lossy(&result.bytes).contains("!xml/invalid"),
                case[expected].as_bool().unwrap(),
                "{}",
                case["path"]
            );
            assert!(validate_file(indexed, &result.bytes, &prepared).is_empty());
            verify_candidate(indexed, xml.as_bytes(), &result.bytes, &prepared).unwrap();
        }
    }
    let wrap_links = |paths: &[&str]| {
        let mut xml = String::from(
            "<Root xmlns:md=\"http://v8.1c.ru/8.3/MDClasses\" xmlns:xr=\"http://v8.1c.ru/8.3/xcf/readable\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\"><md:BasedOn>",
        );
        for path in paths {
            xml.push_str(&format!(
                "<xr:Item xsi:type=\"xr:MDObjectRef\">{}</xr:Item>",
                nkdk_conversion_core::xml::escape(path)
            ));
        }
        xml.push_str("</md:BasedOn></Root>");
        xml
    };
    for (profile, section, count) in [
        (
            "migration.exchange-plan-content-metadata",
            "exchangeMetadata",
            5,
        ),
        ("migration.based-on-links", "basedOnMetadata", 25),
    ] {
        let entry = entry_id(profile).unwrap();
        let prepared =
            nkdk_compiled_rules::prepare_fact_inputs(entry, facts.clone(), generation, vec![])
                .unwrap();
        assert_eq!(corpus[section].as_array().unwrap().len(), count);
        if section == "basedOnMetadata" {
            let owners: std::collections::BTreeSet<_> = corpus[section]
                .as_array()
                .unwrap()
                .iter()
                .map(|case| case["ownerKind"].as_str().unwrap())
                .collect();
            assert_eq!(owners.len(), 9);
        }

        let verify_path = |path: &str, allowed: bool| {
            let xml = if section == "basedOnMetadata" {
                wrap_links(&[path])
            } else {
                format!(
                    "<Item><Metadata>{}</Metadata></Item>",
                    nkdk_conversion_core::xml::escape(path)
                )
            };
            let converted =
                convert_file(entry, Direction::XmlToYaml, xml.as_bytes(), &prepared).unwrap();
            let yaml = String::from_utf8_lossy(&converted.bytes);
            assert!(!yaml.contains("!xml/raw"), "{profile}: {path}: {yaml}");
            assert_eq!(
                yaml.contains("!xml/invalid"),
                !allowed,
                "{profile}: {path}: {yaml}"
            );
            assert!(validate_file(entry, &converted.bytes, &prepared).is_empty());
            verify_candidate(entry, xml.as_bytes(), &converted.bytes, &prepared).unwrap();
        };
        for case in corpus[section].as_array().unwrap() {
            verify_path(case["path"].as_str().unwrap(), true);
        }
        let allows = |path: &str| {
            let parts: Vec<_> = path.split('.').collect();
            if section == "exchangeMetadata" {
                parts.len() == 2
                    || (parts.len() == 4
                        && parts[0] == "CalculationRegister"
                        && parts[2] == "Recalculation")
            } else {
                (parts.len() == 2
                    && [
                        "ChartOfAccounts",
                        "ExchangePlan",
                        "Catalog",
                        "Document",
                        "ChartOfCharacteristicTypes",
                        "BusinessProcess",
                        "ChartOfCalculationTypes",
                        "Task",
                    ]
                    .contains(&parts[0]))
                    || (parts.len() == 4 && parts[0] == "ExternalDataSource" && parts[2] == "Table")
            }
        };
        // One real root per kind covers the whitelist, including a bare external source.
        let mut kinds = std::collections::BTreeSet::new();
        for root in corpus["roots"].as_array().unwrap() {
            let kind = root["kind"].as_str().unwrap();
            if kinds.insert(kind) {
                let path = format!("{}.{}", kind, root["name"].as_str().unwrap());
                verify_path(&path, allows(&path));
            }
        }
        // Existing nested targets exercise wrong kind and excess depth.
        for case in corpus["cases"].as_array().unwrap() {
            let path = case["path"].as_str().unwrap();
            verify_path(path, allows(path));
        }
    }
    let links = entry_id("migration.based-on-links").unwrap();
    let link_inputs =
        nkdk_compiled_rules::prepare_fact_inputs(links, facts.clone(), generation, vec![]).unwrap();
    let collections = corpus["basedOnCollections"].as_array().unwrap();
    assert!(
        collections
            .iter()
            .any(|case| case["items"].as_u64() == Some(0))
    );
    assert!(
        collections
            .iter()
            .any(|case| case["items"].as_u64().unwrap() > 1)
    );
    for case in collections {
        let xml = case["xml"].as_str().unwrap().as_bytes();
        let converted = convert_file(links, Direction::XmlToYaml, xml, &link_inputs).unwrap();
        assert!(
            !String::from_utf8_lossy(&converted.bytes).contains("!xml"),
            "{}: {}",
            case["source"],
            String::from_utf8_lossy(&converted.bytes)
        );
        assert!(validate_file(links, &converted.bytes, &link_inputs).is_empty());
        verify_candidate(links, xml, &converted.bytes, &link_inputs).unwrap();
    }
    let root_collections = corpus["rootLinkCollections"].as_array().unwrap();
    assert!(!root_collections.is_empty());
    for case in root_collections {
        let profile = format!("migration.{}", case["profile"].as_str().unwrap());
        let entry = entry_id(&profile).expect("root collection profile");
        let prepared =
            nkdk_compiled_rules::prepare_fact_inputs(entry, facts.clone(), generation, vec![])
                .unwrap();
        let xml = case["xml"].as_str().unwrap().as_bytes();
        let result = convert_file(entry, Direction::XmlToYaml, xml, &prepared).unwrap();
        assert!(
            !String::from_utf8_lossy(&result.bytes).contains("!xml"),
            "{}: {}",
            case["source"],
            String::from_utf8_lossy(&result.bytes)
        );
        assert!(validate_file(entry, &result.bytes, &prepared).is_empty());
        verify_candidate(entry, xml, &result.bytes, &prepared).unwrap();
    }
    for (profile, physical, allowed) in [
        (
            "document-register-links",
            "RegisterRecords",
            &[
                "InformationRegister",
                "AccumulationRegister",
                "AccountingRegister",
                "CalculationRegister",
            ][..],
        ),
        (
            "journal-document-links",
            "RegisteredDocuments",
            &["Document"][..],
        ),
    ] {
        let entry = entry_id(&format!("migration.{profile}")).unwrap();
        let prepared =
            nkdk_compiled_rules::prepare_fact_inputs(entry, facts.clone(), generation, vec![])
                .unwrap();
        let mut seen = std::collections::BTreeSet::new();
        for root in corpus["roots"].as_array().unwrap() {
            let kind = root["kind"].as_str().unwrap();
            if !seen.insert(kind) {
                continue;
            }
            let path = format!("{kind}.{}", root["name"].as_str().unwrap());
            let xml = wrap_links(&[&path, &path]).replace("md:BasedOn", &format!("md:{physical}"));
            let result =
                convert_file(entry, Direction::XmlToYaml, xml.as_bytes(), &prepared).unwrap();
            let yaml = String::from_utf8_lossy(&result.bytes);
            let short_document = profile == "journal-document-links";
            let unrepresentable = short_document && kind != "Document";
            assert_eq!(
                yaml.contains("!xml/raw"),
                unrepresentable,
                "{profile}: {path}: {yaml}"
            );
            if !unrepresentable {
                assert_eq!(
                    yaml.contains("!xml/invalid"),
                    !allowed.contains(&kind),
                    "{profile}: {path}: {yaml}"
                );
            }
            if short_document && kind == "Document" {
                assert!(
                    yaml.contains(&format!("- {}", root["name"].as_str().unwrap())),
                    "{yaml}"
                );
            }
            assert!(validate_file(entry, &result.bytes, &prepared).is_empty());
            verify_candidate(entry, xml.as_bytes(), &result.bytes, &prepared).unwrap();
        }
        assert!(allowed.iter().all(|kind| seen.contains(kind)));
        for case in corpus["cases"].as_array().unwrap() {
            let xml = wrap_links(&[case["path"].as_str().unwrap()])
                .replace("md:BasedOn", &format!("md:{physical}"));
            let result =
                convert_file(entry, Direction::XmlToYaml, xml.as_bytes(), &prepared).unwrap();
            let annotation = if profile == "journal-document-links"
                && !case["path"].as_str().unwrap().starts_with("Document.")
            {
                "!xml/raw"
            } else {
                "!xml/invalid"
            };
            assert!(String::from_utf8_lossy(&result.bytes).contains(annotation));
            verify_candidate(entry, xml.as_bytes(), &result.bytes, &prepared).unwrap();
        }
    }
    let identity_for = |case: &serde_json::Value| {
        corpus["roots"]
            .as_array()
            .unwrap()
            .iter()
            .find(|root| root["source"] == case["source"])
            .unwrap()["identity"]
            .as_str()
            .unwrap()
    };
    let role_entry = entry_id("migration.document-register-records").unwrap();
    let role_id = nkdk_compiled_rules::fact_id("metadata.owner-register-records").unwrap();
    for direction in [Direction::XmlToYaml, Direction::YamlToXml] {
        let mut roles = nkdk_compiled_rules::fact_builder(generation, budget());
        for case in root_collections
            .iter()
            .filter(|case| case["profile"] == "document-register-links")
        {
            let owner = identity_for(case);
            let prepared = nkdk_compiled_rules::prepare_fact_inputs(
                role_entry,
                facts.clone(),
                generation,
                vec![(
                    "owner".into(),
                    nkdk_compiled_rules::InputValue::Text(owner.into()),
                )],
            )
            .unwrap();
            let xml = case["xml"].as_str().unwrap().as_bytes();
            let conversion = entry_id("migration.document-register-links").unwrap();
            let conversion_inputs = nkdk_compiled_rules::prepare_fact_inputs(
                conversion,
                facts.clone(),
                generation,
                vec![],
            )
            .unwrap();
            let yaml =
                convert_file(conversion, Direction::XmlToYaml, xml, &conversion_inputs).unwrap();
            let original = read_fixture(case);
            let source = if matches!(direction, Direction::XmlToYaml) {
                original.as_slice()
            } else {
                &yaml.bytes
            };
            assert!(
                nkdk_compiled_rules::contribute_file(
                    role_entry, direction, source, &prepared, &mut roles
                )
                .is_empty()
            );
        }
        let roles = roles.finish();
        assert!(roles.is_ready(generation, role_id));
        // The same register may occur under different owners: owner is part of
        // the typed key, and the stored identity must remain owner-specific.
        let case = root_collections
            .iter()
            .find(|case| case["items"].as_u64().unwrap() > 4)
            .unwrap();
        let owner = identity_for(case);
        assert_eq!(
            roles.lookup_parts(
                generation,
                role_id,
                &[
                    "AccumulationRegister",
                    "РегистрНакопленияПоУмолчанию",
                    owner
                ]
            ),
            nkdk_conversion_core::facts::FactState::Ready(owner)
        );
        assert_eq!(
            roles.lookup_parts(
                generation,
                role_id,
                &[
                    "AccumulationRegister",
                    "РегистрНакопленияПоУмолчанию",
                    "other-owner"
                ]
            ),
            nkdk_conversion_core::facts::FactState::Missing
        );
    }
    let prepared = nkdk_compiled_rules::prepare_fact_inputs(
        role_entry,
        facts.clone(),
        generation,
        vec![(
            "owner".into(),
            nkdk_compiled_rules::InputValue::Text("owner".into()),
        )],
    )
    .unwrap();
    for source in [
        "<Wrong/>",
        "<md:MetaDataObject xmlns:md=\"http://v8.1c.ru/8.3/MDClasses\"><md:Document><md:Properties/><md:Properties/></md:Document></md:MetaDataObject>",
        "<md:MetaDataObject xmlns:md=\"http://v8.1c.ru/8.3/MDClasses\"><md:DocumentJournal><md:Properties/></md:DocumentJournal></md:MetaDataObject>",
        "<md:MetaDataObject xmlns:md=\"http://v8.1c.ru/8.3/MDClasses\"><md:Document><md:Properties><md:RegisterRecords><bad/></md:RegisterRecords></md:Properties></md:Document></md:MetaDataObject>",
    ] {
        let mut broken = nkdk_compiled_rules::fact_builder(generation, budget());
        assert!(
            !nkdk_compiled_rules::contribute_file(
                role_entry,
                Direction::XmlToYaml,
                source.as_bytes(),
                &prepared,
                &mut broken
            )
            .is_empty()
        );
        assert!(!broken.finish().is_ready(generation, role_id));
    }
    let plan =
        nkdk_compiled_rules::fact_plan(&[producer, child_producer, role_entry], &[], 30).unwrap();
    let dependencies = plan
        .dependencies(nkdk_conversion_core::facts::dependencies::StepId(2))
        .unwrap();
    assert_eq!(
        dependencies.len(),
        1,
        "Root-only links must wait only for the root index"
    );
    let affected = plan
        .affected(&[nkdk_conversion_core::facts::dependencies::StepId(0)])
        .unwrap();
    assert!(affected.contains(&nkdk_conversion_core::facts::dependencies::StepId(2)));
    assert!(
        affected.contains(&nkdk_conversion_core::facts::dependencies::StepId(
            3 + role_id.0
        ))
    );
    assert!(
        !plan
            .affected(&[nkdk_conversion_core::facts::dependencies::StepId(1)])
            .unwrap()
            .contains(&nkdk_conversion_core::facts::dependencies::StepId(2))
    );
    let sample = corpus["basedOnMetadata"][0]["path"].as_str().unwrap();
    for (paths, expected_tag) in [
        (vec![sample, sample], None),
        (
            vec![sample, "Catalog.НесуществующаяЦель"],
            Some("!xml/invalid"),
        ),
        (vec![sample, "Unknown.Name"], Some("!xml/raw")),
    ] {
        let xml = wrap_links(&paths);
        let converted =
            convert_file(links, Direction::XmlToYaml, xml.as_bytes(), &link_inputs).unwrap();
        let yaml = String::from_utf8_lossy(&converted.bytes);
        if let Some(tag) = expected_tag {
            assert!(yaml.contains(tag), "{yaml}");
        } else {
            assert!(!yaml.contains("!xml"), "{yaml}");
        }
        assert!(validate_file(links, &converted.bytes, &link_inputs).is_empty());
        verify_candidate(links, xml.as_bytes(), &converted.bytes, &link_inputs).unwrap();
    }
    for xml in [
        wrap_links(&[sample]).replace(" xsi:type=\"xr:MDObjectRef\"", ""),
        wrap_links(&[sample]).replace("xr:MDObjectRef", "xr:Other"),
    ] {
        let converted =
            convert_file(links, Direction::XmlToYaml, xml.as_bytes(), &link_inputs).unwrap();
        assert!(String::from_utf8_lossy(&converted.bytes).contains("!xml/raw"));
        verify_candidate(links, xml.as_bytes(), &converted.bytes, &link_inputs).unwrap();
    }
    let invalid_yaml = "ВводитсяНаОсновании:\n  - Справочник.НесуществующаяЦель";
    assert!(!validate_file(links, invalid_yaml.as_bytes(), &link_inputs).is_empty());
    assert!(
        !validate_file(links, b"", &PreparedInputs::default())
            .iter()
            .any(|issue| issue.code.as_deref() == Some("fact.unready"))
    );
    let absent = b"<Root/>";
    let converted = convert_file(links, Direction::XmlToYaml, absent, &link_inputs).unwrap();
    verify_candidate(links, absent, &converted.bytes, &link_inputs).unwrap();
    let mut pairs = 0;
    for table in reference["tables"].as_array().unwrap() {
        let entry = entry_id(&format!(
            "migration.path-{}",
            table["name"].as_str().unwrap()
        ))
        .expect("declared path lexicon");
        for pair in table["values"].as_array().unwrap() {
            let xml = format!(
                "<Root><Value>{}</Value></Root>",
                pair["xml"].as_str().unwrap()
            );
            let yaml = format!("Значение: {}", pair["yaml"].as_str().unwrap());
            let actual =
                convert_file(entry, Direction::XmlToYaml, xml.as_bytes(), &inputs).unwrap();
            assert_eq!(actual.bytes, yaml.as_bytes());
            verify(entry, xml.as_bytes(), &actual.bytes);
            pairs += 1;
        }
        assert!(
            !validate_file(
                entry,
                "Значение: __неизвестный_сегмент__".as_bytes(),
                &inputs
            )
            .is_empty()
        );
    }
    assert_eq!(pairs, reference["pairs"].as_u64().unwrap());
    let entry = entry_id("migration.metadata-root-path").expect("declared full root path");
    for pair in reference["tables"][0]["values"].as_array().unwrap() {
        // A user name equal to a vocabulary token must remain untranslated.
        let xml = format!(
            "<Root><Value>{}.Ref</Value></Root>",
            pair["xml"].as_str().unwrap()
        );
        let yaml = format!("Путь: {}.Ref", pair["yaml"].as_str().unwrap());
        let result = convert_file(entry, Direction::XmlToYaml, xml.as_bytes(), &inputs).unwrap();
        assert_eq!(result.bytes, yaml.as_bytes());
        verify(entry, xml.as_bytes(), &result.bytes);
    }
    for (path, tag) in [
        ("Catalog.", "!xml/invalid"),
        ("Catalog.1Name", "!xml/invalid"),
        ("Catalog.Object.Attribute.Name", "!xml/invalid"),
        ("Unknown.Object", "!xml/raw"),
    ] {
        let xml = format!("<Root><Value>{path}</Value></Root>");
        let result = convert_file(entry, Direction::XmlToYaml, xml.as_bytes(), &inputs).unwrap();
        assert!(String::from_utf8_lossy(&result.bytes).contains(tag));
        verify(entry, xml.as_bytes(), &result.bytes);
    }
    for yaml in [
        "Путь: Справочник.",
        "Путь: Справочник.1Name",
        "Путь: Неизвестный.Имя",
    ] {
        assert!(!validate_file(entry, yaml.as_bytes(), &inputs).is_empty());
    }
    let mut cases = Vec::new();
    for pair in reference["tables"][1]["values"].as_array().unwrap() {
        if pair["xml"] == "StandardAttribute" {
            continue;
        }
        cases.push((
            "member",
            format!("Catalog.Owner.{}.Ref", pair["xml"].as_str().unwrap()),
            format!("Справочник.Owner.{}.Ref", pair["yaml"].as_str().unwrap()),
        ));
    }
    for pair in reference["tables"][2]["values"].as_array().unwrap() {
        cases.push((
            "object",
            format!(
                "ExternalDataSource.Owner.{}.Ref",
                pair["xml"].as_str().unwrap()
            ),
            format!(
                "ВнешнийИсточникДанных.Owner.{}.Ref",
                pair["yaml"].as_str().unwrap()
            ),
        ));
    }
    for pair in reference["tables"][3]["values"].as_array().unwrap() {
        cases.push((
            "standard-attribute",
            format!(
                "Catalog.Owner.StandardAttribute.{}",
                pair["xml"].as_str().unwrap()
            ),
            format!(
                "Справочник.Owner.СтандартныйРеквизит.{}",
                pair["yaml"].as_str().unwrap()
            ),
        ));
    }
    cases.push((
        "standard-attribute",
        "Catalog.Owner.StandardAttribute.Executed".into(),
        "Справочник.Owner.СтандартныйРеквизит.Executed".into(),
    ));
    cases.push((
        "enum-value",
        "Enum.Status.EnumValue.Ref".into(),
        "Перечисление.Status.Ref".into(),
    ));
    let type_link = entry_id("migration.type-link").unwrap();
    for (path, index, expected) in [
        (
            "Catalog.КакойТоСправочник.TabularSection.КакаяТоТаблица.Attribute.КакойТоРеквизит",
            "1",
            "Справочник.КакойТоСправочник.ТабличнаяЧасть.КакаяТоТаблица.Реквизит.КакойТоРеквизит(1)",
        ),
        (
            "Catalog.СправочникВладелец.StandardAttribute.Code",
            "0",
            "Справочник.СправочникВладелец.СтандартныйРеквизит.Код",
        ),
        ("Constant.КонстантаБулево", "0", "Константа.КонстантаБулево"),
        ("РеквизитПодвала", "0", "РеквизитПодвала"),
        ("Поле1", "9007199254740993", "Поле1(9007199254740993)"),
    ] {
        let xml = format!(
            "<Root xmlns:xr='http://v8.1c.ru/8.3/xcf/readable'><TypeLink><xr:DataPath>{path}</xr:DataPath><xr:LinkItem>{index}</xr:LinkItem></TypeLink></Root>"
        );
        let result =
            convert_file(type_link, Direction::XmlToYaml, xml.as_bytes(), &inputs).unwrap();
        assert_eq!(
            String::from_utf8_lossy(&result.bytes),
            format!("СвязьТипа: {expected}")
        );
        verify(type_link, xml.as_bytes(), &result.bytes);
    }
    for (profile, path_attribute, empty_xml) in [
        ("migration.type-link", "", "<Root/>"),
        (
            "migration.type-link-typed",
            " xsi:type='xs:string'",
            "<Root/>",
        ),
        ("migration.type-link-empty", "", "<Root><TypeLink/></Root>"),
    ] {
        let entry = entry_id(profile).unwrap();
        let xml = format!(
            "<Root xmlns:xr='http://v8.1c.ru/8.3/xcf/readable' xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance' xmlns:xs='http://www.w3.org/2001/XMLSchema'><TypeLink><xr:DataPath{path_attribute}>РеквизитПодвала</xr:DataPath><xr:LinkItem>0</xr:LinkItem></TypeLink></Root>"
        );
        let imported = convert_file(entry, Direction::XmlToYaml, xml.as_bytes(), &inputs).unwrap();
        assert_eq!(
            String::from_utf8_lossy(&imported.bytes),
            "СвязьТипа: РеквизитПодвала"
        );
        verify(entry, xml.as_bytes(), &imported.bytes);
        let absent = convert_file(entry, Direction::YamlToXml, b"{}", &inputs).unwrap();
        nkdk_conversion_core::proof::verify(empty_xml.as_bytes(), &absent.bytes, |_| false)
            .unwrap();
        for source in ["<Root/>", "<Root><TypeLink/></Root>"] {
            let imported =
                convert_file(entry, Direction::XmlToYaml, source.as_bytes(), &inputs).unwrap();
            verify(entry, source.as_bytes(), &imported.bytes);
            assert_eq!(imported.bytes.is_empty(), source == empty_xml);
        }
    }
    let link_corpus: serde_json::Value = serde_json::from_slice(include_bytes!(
        "../../../../tests/migration/type-link-e2e.json"
    ))
    .unwrap();
    let link_cases = link_corpus["cases"].as_array().unwrap();
    assert_eq!(link_cases.len(), 89);
    for case in link_cases {
        let original = case["original"].as_str().unwrap();
        let start = case["start"].as_u64().unwrap() as usize;
        let source = read_fixture(case);
        assert_eq!(
            source.get(start..start + original.len()),
            Some(original.as_bytes()),
            "Changed source {}",
            case["source"]
        );
        let xml = case["xml"].as_str().unwrap().as_bytes();
        let imported = convert_file(type_link, Direction::XmlToYaml, xml, &inputs).unwrap();
        assert_eq!(
            String::from_utf8_lossy(&imported.bytes),
            case["yaml"].as_str().unwrap(),
            "{}",
            case["source"]
        );
        verify(type_link, xml, &imported.bytes);
    }
    for (path, expected) in [
        (
            "ExternalDataSource.Source.Table.Rows.Field.Code",
            "ВнешнийИсточникДанных.Source.Таблица.Rows.Поле.Code",
        ),
        (
            "ExternalDataSource.Source.Cube.Cube.DimensionTable.Rows.Field.Code",
            "ВнешнийИсточникДанных.Source.Куб.Cube.ТаблицаИзмерения.Rows.Поле.Code",
        ),
    ] {
        let xml = format!(
            "<Root xmlns:xr='http://v8.1c.ru/8.3/xcf/readable'><TypeLink><xr:DataPath>{path}</xr:DataPath><xr:LinkItem>0</xr:LinkItem></TypeLink></Root>"
        );
        let imported =
            convert_file(type_link, Direction::XmlToYaml, xml.as_bytes(), &inputs).unwrap();
        assert_eq!(
            String::from_utf8_lossy(&imported.bytes),
            format!("СвязьТипа: {expected}")
        );
        verify(type_link, xml.as_bytes(), &imported.bytes);
    }
    let dcs_link = entry_id("migration.type-link-dcs").unwrap();
    for (index, expected) in [
        ("0", "Поле1"),
        ("2", "Поле1(2)"),
        ("9007199254740993", "Поле1(9007199254740993)"),
    ] {
        let xml = format!(
            "<Root xmlns:dcscor='http://v8.1c.ru/8.1/data-composition-system/core' xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance'><dcscor:value xsi:type='dcscor:TypeLink'><dcscor:field>Поле1</dcscor:field><dcscor:linkItem>{index}</dcscor:linkItem></dcscor:value></Root>"
        );
        let imported =
            convert_file(dcs_link, Direction::XmlToYaml, xml.as_bytes(), &inputs).unwrap();
        assert_eq!(
            String::from_utf8_lossy(&imported.bytes),
            format!("СвязьТипа: {expected}")
        );
        verify(dcs_link, xml.as_bytes(), &imported.bytes);
        let untyped = xml.replace(" xsi:type='dcscor:TypeLink'", "");
        let preserved =
            convert_file(dcs_link, Direction::XmlToYaml, untyped.as_bytes(), &inputs).unwrap();
        assert!(String::from_utf8_lossy(&preserved.bytes).contains("!xml/raw"));
        verify(dcs_link, untyped.as_bytes(), &preserved.bytes);
    }
    for (body, tag) in [
        ("<xr:LinkItem>0</xr:LinkItem>", "!xml/raw"),
        ("<xr:DataPath/><xr:LinkItem>0</xr:LinkItem>", "!xml/invalid"),
        ("<xr:DataPath>Поле1</xr:DataPath>", "!xml/raw"),
        (
            "<xr:DataPath>Поле1</xr:DataPath><xr:LinkItem>bad</xr:LinkItem>",
            "!xml/raw",
        ),
        (
            "<xr:DataPath>Поле1(2)</xr:DataPath><xr:LinkItem>0</xr:LinkItem>",
            "!xml/raw",
        ),
        (
            "<xr:DataPath>Catalog.Owner.Attribute.1bad</xr:DataPath><xr:LinkItem>0</xr:LinkItem>",
            "!xml/invalid",
        ),
    ] {
        let xml = format!(
            "<Root xmlns:xr='http://v8.1c.ru/8.3/xcf/readable'><TypeLink>{body}</TypeLink></Root>"
        );
        let imported =
            convert_file(type_link, Direction::XmlToYaml, xml.as_bytes(), &inputs).unwrap();
        assert!(
            String::from_utf8_lossy(&imported.bytes).contains(tag),
            "{}",
            String::from_utf8_lossy(&imported.bytes)
        );
        verify(type_link, xml.as_bytes(), &imported.bytes);
    }
    let invalid_with_shape = "<Root xmlns:xr='http://v8.1c.ru/8.3/xcf/readable'><TypeLink extra='kept'><xr:DataPath/><xr:LinkItem>0</xr:LinkItem></TypeLink></Root>";
    let preserved = convert_file(
        type_link,
        Direction::XmlToYaml,
        invalid_with_shape.as_bytes(),
        &inputs,
    )
    .unwrap();
    let yaml = String::from_utf8_lossy(&preserved.bytes);
    assert!(
        yaml.contains("!xml/raw") && yaml.contains("!xml/invalid"),
        "{yaml}"
    );
    verify(type_link, invalid_with_shape.as_bytes(), &preserved.bytes);
    assert!(
        !validate_file(
            type_link,
            "СвязьТипа: !xml/invalid Поле1".as_bytes(),
            &inputs
        )
        .is_empty()
    );
    let combined = entry_id("migration.metadata-structural-path").unwrap();
    let chain = entry_id("migration.metadata-field-chain-path").unwrap();
    for (profile, path, expected) in cases {
        let entry =
            entry_id(&format!("migration.metadata-{profile}-path")).expect("declared path profile");
        let xml = format!("<Root><Value>{path}</Value></Root>");
        let result = convert_file(entry, Direction::XmlToYaml, xml.as_bytes(), &inputs).unwrap();
        for (applies, selected_entry) in [
            (matches!(profile, "member" | "object"), combined),
            (matches!(profile, "member" | "standard-attribute"), chain),
        ] {
            if applies {
                let selected = convert_file(
                    selected_entry,
                    Direction::XmlToYaml,
                    xml.as_bytes(),
                    &inputs,
                )
                .unwrap();
                assert_eq!(selected.bytes, result.bytes);
                verify(selected_entry, xml.as_bytes(), &selected.bytes);
            }
        }
        assert_eq!(result.bytes, format!("Путь: {expected}").as_bytes());
        verify(entry, xml.as_bytes(), &result.bytes);
    }
    for (path, tag) in [
        ("Catalog.1Owner.Attribute.Ref", "!xml/invalid"),
        ("Catalog..Attribute.Ref", "!xml/invalid"),
        ("ExternalDataSource.Owner.Table.1Name", "!xml/invalid"),
        ("Catalog.Owner.Unknown.Ref", "!xml/raw"),
        ("Unknown.Owner.Attribute.Ref", "!xml/raw"),
    ] {
        let xml = format!("<Root><Value>{path}</Value></Root>");
        let result = convert_file(combined, Direction::XmlToYaml, xml.as_bytes(), &inputs).unwrap();
        assert!(String::from_utf8_lossy(&result.bytes).contains(tag));
        verify(combined, xml.as_bytes(), &result.bytes);
    }
    let terminal = entry_id("migration.metadata-table-path").expect("declared table choice");
    for pair in reference["tables"][4]["values"].as_array().unwrap() {
        let xml = format!(
            "<Root><Value>InformationRegister.Owner.{}</Value></Root>",
            pair["xml"].as_str().unwrap()
        );
        let result = convert_file(terminal, Direction::XmlToYaml, xml.as_bytes(), &inputs).unwrap();
        let expected = format!(
            "Путь: РегистрСведений.Owner.{}",
            pair["yaml"].as_str().unwrap()
        );
        assert_eq!(result.bytes, expected.as_bytes());
        verify(terminal, xml.as_bytes(), &result.bytes);
    }
    let empty = entry_id("migration.metadata-empty-ref-path").unwrap();
    let value = entry_id("migration.metadata-value-path").unwrap();
    for (entry, path, expected, tag) in [
        (
            value,
            "Catalog.Owner.First",
            Some("Путь: Справочник.Owner.First"),
            None,
        ),
        (
            value,
            "Catalog.Owner.EmptyRef",
            Some("Путь: Справочник.Owner.ПустаяСсылка"),
            None,
        ),
        (value, "Catalog.Owner.ПустаяСсылка", None, Some("!xml/raw")),
        (value, "Catalog.Owner.1Name", None, Some("!xml/invalid")),
        (value, "Enum.Owner.First", None, Some("!xml/invalid")),
        (
            value,
            "Enum.Owner.EmptyRef",
            Some("Путь: Перечисление.Owner.ПустаяСсылка"),
            None,
        ),
        (
            empty,
            "Catalog.Owner.EmptyRef",
            Some("Путь: Справочник.Owner.ПустаяСсылка"),
            None,
        ),
        (
            terminal,
            "CalculationRegister.Owner.BaseSource",
            Some("Путь: РегистрРасчета.Owner.БазаSource"),
            None,
        ),
        (empty, "Catalog..EmptyRef", None, Some("!xml/invalid")),
        (
            empty,
            "Catalog.Owner.EmptyReference",
            None,
            Some("!xml/raw"),
        ),
        (
            terminal,
            "CalculationRegister.Owner.Base1Name",
            None,
            Some("!xml/invalid"),
        ),
        (
            terminal,
            "CalculationRegister.Owner.Base",
            None,
            Some("!xml/invalid"),
        ),
        (
            terminal,
            "InformationRegister.Owner.Unknown",
            None,
            Some("!xml/raw"),
        ),
    ] {
        let xml = format!("<Root><Value>{path}</Value></Root>");
        let result = convert_file(entry, Direction::XmlToYaml, xml.as_bytes(), &inputs).unwrap();
        if let Some(expected) = expected {
            assert_eq!(result.bytes, expected.as_bytes());
        }
        if let Some(tag) = tag {
            assert!(String::from_utf8_lossy(&result.bytes).contains(tag));
        }
        verify(entry, xml.as_bytes(), &result.bytes);
    }
    for (xml, yaml) in [
        (
            "Document.Owner.StandardAttribute.Number",
            "Документ.Owner.СтандартныйРеквизит.Номер",
        ),
        (
            "Document.Owner.Attribute.Number",
            "Документ.Owner.Реквизит.Number",
        ),
        (
            "Document.Owner.TabularSection.Rows.StandardAttribute.LineNumber",
            "Документ.Owner.ТабличнаяЧасть.Rows.СтандартныйРеквизит.НомерСтроки",
        ),
        (
            "Catalog.Owner.TabularSection.Rows.Attribute.Amount",
            "Справочник.Owner.ТабличнаяЧасть.Rows.Реквизит.Amount",
        ),
    ] {
        let xml = format!("<Root><Value>{xml}</Value></Root>");
        let yaml = format!("Путь: {yaml}");
        assert_eq!(
            convert_file(chain, Direction::XmlToYaml, xml.as_bytes(), &inputs)
                .unwrap()
                .bytes,
            yaml.as_bytes()
        );
        verify(chain, xml.as_bytes(), yaml.as_bytes());
    }
    for suffix in [
        "Attribute.",
        "Unknown.Name",
        "StandardAttribute.Ссылка",
        "TabularSection.Rows.Attribute",
    ] {
        let xml = format!("<Root><Value>Document.Owner.{suffix}</Value></Root>");
        let result = convert_file(chain, Direction::XmlToYaml, xml.as_bytes(), &inputs).unwrap();
        verify(chain, xml.as_bytes(), &result.bytes);
    }
    let ordinary = entry_id("migration.metadata-member-path").unwrap();
    let standard = "Путь: Справочник.Owner.СтандартныйРеквизит.Ref";
    assert!(!validate_file(ordinary, standard.as_bytes(), &inputs).is_empty());
    let entry = entry_id("migration.metadata-standard-attribute-path").unwrap();
    for (name, tag) in [
        ("Ссылка", "!xml/raw"),
        ("1Name", "!xml/invalid"),
        ("", "!xml/invalid"),
    ] {
        let original =
            format!("<Root><Value>Catalog.Owner.StandardAttribute.{name}</Value></Root>");
        let result =
            convert_file(entry, Direction::XmlToYaml, original.as_bytes(), &inputs).unwrap();
        assert!(String::from_utf8_lossy(&result.bytes).contains(tag));
        verify(entry, original.as_bytes(), &result.bytes);
    }
}
