use nkdk_compiled_rules_probes::{
    Direction, InputValue, convert_file, entry_id, prepare_fact_inputs, prepare_inputs,
    verify_candidate,
};
#[path = "../../compiled-rules/tests/support/command_identity.rs"]
#[allow(dead_code)]
mod command_identity;
#[path = "../../compiled-rules/tests/support/journal_columns.rs"]
mod journal_columns;

fn fact_budget() -> nkdk_conversion_core::facts::prepared::FactBudget {
    nkdk_conversion_core::facts::prepared::FactBudget {
        text: nkdk_conversion_core::facts::text::TextBudget {
            entries: 100,
            bytes: 10000,
        },
        rows: 100,
    }
}

#[test]
fn journal_child_identities_are_collected_from_the_original_owner() {
    let source = include_bytes!(
        "../../../../e2e/fixtures/xml/cfe/all-extension/DocumentJournals/ЖурналДокументовВсеСвойства.xml"
    );
    let owner = "fb4abe02-f000-40aa-af03-80cb661508e5";
    let generation = nkdk_conversion_core::facts::Generation(1);
    let mut builder = nkdk_compiled_rules_probes::fact_builder(generation, fact_budget());
    for kind in ["columns", "commands"] {
        let entry = entry_id(&format!("migration.journal-{kind}-identity-source")).unwrap();
        let inputs = prepare_inputs(
            entry,
            vec![
                ("component".into(), InputValue::Text("cfe".into())),
                ("ownerIdentity".into(), InputValue::Text(owner.into())),
            ],
        )
        .unwrap();
        let snapshot =
            nkdk_compiled_rules_probes::snapshot_fact_source(entry, source, &inputs).unwrap();
        assert!(String::from_utf8_lossy(&snapshot).contains("name:"));
        let issues = nkdk_compiled_rules_probes::contribute_file(
            entry,
            Direction::YamlToXml,
            &snapshot,
            &inputs,
            &mut builder,
        );
        assert!(issues.is_empty(), "{issues:?}");
    }
    let identities = nkdk_compiled_rules_probes::fact_id("metadata.own-identities").unwrap();
    let bases = nkdk_compiled_rules_probes::fact_id("metadata.base-identities").unwrap();
    builder.publish(identities).unwrap();
    builder.publish(bases).unwrap();
    let prepared = builder.finish();
    let columns = journal_columns::extract(&String::from_utf8_lossy(source));
    let first = &columns[0];
    assert_eq!(
        prepared.lookup_parts(
            generation,
            identities,
            &["cfe", "Column", &first.name, owner]
        ),
        nkdk_conversion_core::facts::FactState::Ready(first.uuid.as_str()),
    );
    assert_eq!(
        prepared.lookup_parts(
            generation,
            identities,
            &["cfe", "Command", "Команда1", owner]
        ),
        nkdk_conversion_core::facts::FactState::Ready("3c563475-adf5-4d72-a172-f708f45595d1"),
    );
}

#[test]
fn journal_columns_restore_references_and_identities_from_declarative_rows() {
    for (source, component, adopted) in [
        (
            include_str!(
                "../../../../e2e/fixtures/xml/cf/DocumentJournals/ЖурналДокументовВсеСвойства.xml"
            ),
            "cf",
            false,
        ),
        (
            include_str!(
                "../../../../e2e/fixtures/xml/cfe/all-extension/DocumentJournals/ЖурналДокументовВсеСвойстваExt.xml"
            ),
            "cfe",
            false,
        ),
        (
            include_str!(
                "../../../../e2e/fixtures/xml/cfe/all-extension/DocumentJournals/ЖурналДокументовВсеСвойства.xml"
            ),
            "cfe",
            true,
        ),
    ] {
        let columns = journal_columns::extract(source);
        assert_eq!(columns.len(), 2);
        let owner = source
            .split_once("<DocumentJournal uuid=\"")
            .unwrap()
            .1
            .split_once('"')
            .unwrap()
            .0;
        let generation = nkdk_conversion_core::facts::Generation(1);
        let mut builder = nkdk_compiled_rules_probes::fact_builder(generation, fact_budget());
        let identity_entry = entry_id("migration.metadata-own-identity").unwrap();
        for column in &columns {
            let inputs = prepare_inputs(
                identity_entry,
                [
                    ("component", component),
                    ("owner", owner),
                    ("kind", "Column"),
                    ("name", column.name.as_str()),
                    ("identity", column.uuid.as_str()),
                ]
                .into_iter()
                .map(|(key, value)| (key.into(), InputValue::Text(value.into())))
                .collect(),
            )
            .unwrap();
            let yaml = format!("Имя: {}", column.name);
            assert!(
                nkdk_compiled_rules_probes::contribute_file(
                    identity_entry,
                    Direction::YamlToXml,
                    yaml.as_bytes(),
                    &inputs,
                    &mut builder,
                )
                .is_empty()
            );
            if adopted {
                let base = column
                    .xml
                    .split_once("<ExtendedConfigurationObject>")
                    .unwrap()
                    .1
                    .split_once("</ExtendedConfigurationObject>")
                    .unwrap()
                    .0;
                command_identity::seed_base(
                    &mut builder,
                    component,
                    &column.uuid,
                    base,
                    &column.name,
                );
            }
        }
        let entry = entry_id("migration.journal-columns").unwrap();
        let values = vec![
            ("defaultLanguage".into(), InputValue::Text("ru".into())),
            (
                "registeredLanguages".into(),
                InputValue::Sequence(vec![InputValue::Text("ru".into())]),
            ),
            ("component".into(), InputValue::Text(component.into())),
            ("owner".into(), InputValue::Text(owner.into())),
        ];
        let inputs = prepare_fact_inputs(
            entry,
            std::sync::Arc::new(builder.finish()),
            generation,
            values,
        )
        .unwrap();
        let columns_xml = columns
            .iter()
            .map(|column| column.xml.as_str())
            .collect::<String>();
        let xml = format!(
            "<MetaDataObject xmlns=\"http://v8.1c.ru/8.3/MDClasses\" xmlns:v8=\"http://v8.1c.ru/8.1/data/core\" xmlns:xr=\"http://v8.1c.ru/8.3/xcf/readable\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\"><DocumentJournal><ChildObjects>{columns_xml}</ChildObjects></DocumentJournal></MetaDataObject>"
        );
        let imported = convert_file(entry, Direction::XmlToYaml, xml.as_bytes(), &inputs).unwrap();
        let yaml = String::from_utf8_lossy(&imported.bytes);
        assert!(yaml.contains("Графы:"), "{yaml}");
        if !adopted {
            assert!(
                yaml.contains("Документ.ДокументВсеСвойства.Реквизит.РеквизитБулево"),
                "{yaml}"
            );
            assert!(yaml.contains("ИндексироватьСДопУпорядочиванием"), "{yaml}");
        }
        if adopted {
            assert!(yaml.contains("Ссылки: []"), "{yaml}");
            let second = format!(
                "<MetaDataObject xmlns=\"http://v8.1c.ru/8.3/MDClasses\"><DocumentJournal><ChildObjects>{}</ChildObjects></DocumentJournal></MetaDataObject>",
                columns[1].xml,
            );
            let simple =
                convert_file(entry, Direction::XmlToYaml, second.as_bytes(), &inputs).unwrap();
            assert!(!String::from_utf8_lossy(&simple.bytes).contains("!xml/"));
            verify_candidate(entry, second.as_bytes(), &simple.bytes, &inputs).unwrap();
        }
        assert!(!yaml.contains("!xml/"), "{yaml}");
        verify_candidate(entry, xml.as_bytes(), &imported.bytes, &inputs).unwrap();
        if !adopted {
            let anomalous = xml.replace(
                "<Indexing>IndexWithAdditionalOrder</Indexing>",
                "<Indexing>UnexpectedIndexing</Indexing>",
            );
            assert_ne!(anomalous, xml);
            let preserved =
                convert_file(entry, Direction::XmlToYaml, anomalous.as_bytes(), &inputs).unwrap();
            let preserved_yaml = String::from_utf8_lossy(&preserved.bytes);
            assert!(preserved_yaml.contains("!xml/raw"), "{preserved_yaml}");
            assert!(
                preserved_yaml.contains("Документ.ДокументВсеСвойства.Реквизит.РеквизитБулево"),
                "{preserved_yaml}"
            );
            verify_candidate(entry, anomalous.as_bytes(), &preserved.bytes, &inputs).unwrap();
        }
        let mut discovered = nkdk_compiled_rules_probes::fact_builder(generation, fact_budget());
        assert!(
            nkdk_compiled_rules_probes::contribute_file(
                entry,
                Direction::XmlToYaml,
                xml.as_bytes(),
                &inputs,
                &mut discovered,
            )
            .is_empty()
        );
        let discovered = discovered.finish();
        for column in &columns {
            assert_eq!(
                discovered.lookup_parts(
                    generation,
                    nkdk_compiled_rules_probes::fact_id("metadata.own-identities").unwrap(),
                    &[component, "Column", &column.name, owner],
                ),
                nkdk_conversion_core::facts::FactState::Ready(column.uuid.as_str()),
            );
        }
    }
}
