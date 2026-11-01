#[path = "support/fact_budget.rs"]
mod fact_budget;

use nkdk_compiled_rules::{
    Direction, convert_file, entry_id, fact_id, prepare_fact_inputs, verify_candidate,
};

fn semantic_yaml(value: &yaml_rust2::Yaml) -> serde_json::Value {
    match value {
        yaml_rust2::Yaml::Hash(fields) => serde_json::Value::Object(
            fields
                .iter()
                .map(|(name, value)| (name.as_str().unwrap().to_owned(), semantic_yaml(value)))
                .collect(),
        ),
        yaml_rust2::Yaml::Array(items) => {
            serde_json::Value::Array(items.iter().map(semantic_yaml).collect())
        }
        yaml_rust2::Yaml::String(text) => serde_json::Value::String(text.clone()),
        yaml_rust2::Yaml::Boolean(value) => serde_json::Value::Bool(*value),
        yaml_rust2::Yaml::Integer(value) => serde_json::Value::Number((*value).into()),
        yaml_rust2::Yaml::Null => serde_json::Value::Null,
        other => panic!("Unexpected fixture YAML value: {other:?}"),
    }
}

#[test]
fn child_name_snapshot_keeps_the_xml_order_omitted_from_owner_yaml() {
    let entry = entry_id("migration.enumeration-child-names").unwrap();
    let inputs = nkdk_compiled_rules::prepare_inputs(
        entry,
        vec![
            (
                "forms".into(),
                nkdk_compiled_rules::InputValue::Sequence(vec![]),
            ),
            (
                "templates".into(),
                nkdk_compiled_rules::InputValue::Sequence(vec![]),
            ),
        ],
    )
    .unwrap();
    let xml = include_bytes!("../../../../e2e/fixtures/xml/cf/Enums/ПеречислениеВсеСвойства.xml");
    let result = convert_file(entry, Direction::XmlToYaml, xml, &inputs).unwrap();
    let meaning = nkdk_conversion_core::raw::Document::decode(&result.bytes)
        .unwrap()
        .map_or(result.bytes, |document| document.meaning);
    let rendered = String::from_utf8(meaning).unwrap();
    let documents = yaml_rust2::YamlLoader::load_from_str(&rendered).unwrap();
    let names = &documents[0];
    assert_eq!(names["Формы"][0].as_str(), Some("ФормаСписка"));
    assert_eq!(names["Формы"][1].as_str(), Some("ФормаВыбора"));
    assert_eq!(names["Шаблоны"][0].as_str(), Some("Макет"));
}

#[test]
fn owner_contributes_child_facts_before_resolving_its_own_child_indexes() {
    let owner = entry_id("metadata.enumeration").unwrap();
    let child_ids = fact_id("metadata.own-identities").unwrap();
    assert!(nkdk_compiled_rules::contribution_indexes(owner).contains(&child_ids));
    assert!(
        !nkdk_compiled_rules::fact_source_input_bindings(owner, Direction::XmlToYaml)
            .iter()
            .any(|(_, index)| *index == child_ids)
    );
    for index in ["metadata.internal-type-ids", "metadata.internal-value-ids"] {
        let index = fact_id(index).unwrap();
        assert!(
            !nkdk_compiled_rules::fact_source_input_bindings(owner, Direction::XmlToYaml)
                .iter()
                .any(|(_, required)| *required == index)
        );
    }
    for source in [
        include_bytes!("../../../../tests/migration/enumeration-properties.json").as_slice(),
        include_bytes!("../../../../tests/migration/enumeration-properties-extension.json")
            .as_slice(),
    ] {
        let fixture: serde_json::Value = serde_json::from_slice(source).unwrap();
        let entry = entry_id("metadata.enumeration").unwrap();
        let values =
            nkdk_conversion_core::inputs::read(&serde_json::to_vec(&fixture["inputs"]).unwrap())
                .unwrap();
        let inputs = nkdk_compiled_rules::prepare_inputs(entry, values).unwrap();
        let mut builder = nkdk_compiled_rules::fact_builder(
            nkdk_conversion_core::facts::Generation(1),
            fact_budget::fact_budget(100, 10000, 100),
        );
        let diagnostics = nkdk_compiled_rules::contribute_file(
            entry,
            Direction::XmlToYaml,
            fixture["xml"].as_str().unwrap().as_bytes(),
            &inputs,
            &mut builder,
        );
        assert!(diagnostics.is_empty(), "{diagnostics:?}");
    }
}

#[test]
fn real_enumeration_properties_convert_together_without_xml_reference() {
    run_fixture(include_bytes!(
        "../../../../tests/migration/enumeration-properties.json"
    ));
}

#[test]
fn adopted_enumeration_properties_convert_together_without_xml_reference() {
    run_fixture(include_bytes!(
        "../../../../tests/migration/enumeration-properties-extension.json"
    ));
}

#[test]
fn default_enumeration_properties_convert_together_without_xml_reference() {
    run_fixture(include_bytes!(
        "../../../../tests/migration/enumeration-properties-default.json"
    ));
}

#[test]
fn default_adopted_enumeration_properties_convert_without_xml_reference() {
    run_fixture(include_bytes!(
        "../../../../tests/migration/enumeration-properties-default-extension.json"
    ));
}

#[test]
fn own_extension_enumeration_properties_convert_without_xml_reference() {
    run_fixture(include_bytes!(
        "../../../../tests/migration/enumeration-properties-own-extension.json"
    ));
}

#[test]
fn simple_enumeration_properties_convert_without_xml_reference() {
    run_fixture(include_bytes!(
        "../../../../tests/migration/enumeration-properties-simple.json"
    ));
}

#[test]
fn full_own_extension_enumeration_properties_convert_without_xml_reference() {
    run_fixture(include_bytes!(
        "../../../../tests/migration/enumeration-properties-full-own-extension.json"
    ));
}

fn run_fixture(source: &[u8]) {
    let fixture: serde_json::Value = serde_json::from_slice(source).unwrap();
    assert_eq!(fixture["coverage"]["pending"].as_array().unwrap().len(), 0);
    let generation = nkdk_conversion_core::facts::Generation(1);
    let mut builder =
        nkdk_compiled_rules::fact_builder(generation, fact_budget::fact_budget(100, 10000, 100));
    let identity = fixture["ownerIdentity"].as_str().unwrap();
    for item in fixture["ownerInternalTypes"].as_array().unwrap() {
        let short_name = item["name"].as_str().unwrap().split('.').next().unwrap();
        for (index, value) in [
            ("metadata.internal-type-ids", "typeId"),
            ("metadata.internal-value-ids", "valueId"),
        ] {
            builder
                .push_parts(
                    fact_id(index).unwrap(),
                    &[short_name, identity],
                    item[value].as_str().unwrap(),
                )
                .unwrap();
        }
    }
    if let Some(base) = fixture["baseIdentity"].as_str() {
        builder
            .push_parts(
                fact_id("metadata.base-identities").unwrap(),
                &["cfe", identity],
                base,
            )
            .unwrap();
    }
    let component = fixture["inputs"]["component"].as_str().unwrap();
    for child in fixture["ownerChildIdentities"].as_array().unwrap() {
        let child_id = child["identity"].as_str().unwrap();
        builder
            .push_parts(
                fact_id("metadata.own-identities").unwrap(),
                &[
                    component,
                    child["kind"].as_str().unwrap(),
                    child["name"].as_str().unwrap(),
                    identity,
                ],
                child_id,
            )
            .unwrap();
        if let Some(base) = child["baseIdentity"].as_str() {
            builder
                .push_parts(
                    fact_id("metadata.base-identities").unwrap(),
                    &[component, child_id],
                    base,
                )
                .unwrap();
        }
    }
    let inventory: serde_json::Value = serde_json::from_slice(include_bytes!(
        "../../../../tests/migration/metadata-root-index-inventory.json"
    ))
    .unwrap();
    for group in inventory["roots"]
        .as_array()
        .unwrap()
        .iter()
        .filter(|row| row["kind"] == "CommandGroup")
    {
        builder
            .push_parts(
                fact_id("metadata.roots").unwrap(),
                &["CommandGroup", group["name"].as_str().unwrap()],
                group["identity"].as_str().unwrap(),
            )
            .unwrap();
    }
    let facts = std::sync::Arc::new(builder.finish());
    let entry = entry_id(fixture["entry"].as_str().unwrap()).unwrap();
    let values =
        nkdk_conversion_core::inputs::read(&serde_json::to_vec(&fixture["inputs"]).unwrap())
            .unwrap();
    let inputs = prepare_fact_inputs(entry, facts, generation, values).unwrap();
    let resources = nkdk_compiled_rules::resource_requests(
        entry,
        &inputs,
        nkdk_conversion_core::resources::Limits {
            groups: 8,
            routes: 8,
            path_bytes: 4096,
        },
    )
    .unwrap();
    assert!(resources.groups().iter().flatten().any(|route| {
        let (xml, yaml) = route.paths(Direction::XmlToYaml);
        xml.segments() == ["Ext", "ManagerModule.bsl"] && yaml.segments() == ["МодульМенеджера.bsl"]
    }));
    let fixtures = std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join("../../../e2e/fixtures");
    assert!(
        fixtures
            .join("xml/cf/Enums/ПеречислениеВсеСвойства/Ext/ManagerModule.bsl")
            .is_file()
    );
    assert!(
        fixtures
            .join("nkdk/cf/Перечисление/ПеречислениеВсеСвойства/МодульМенеджера.bsl")
            .is_file()
    );
    assert_eq!(
        std::fs::read(fixtures.join("xml/cf/Enums/ПеречислениеВсеСвойства/Ext/ManagerModule.bsl"))
            .unwrap(),
        std::fs::read(
            fixtures.join("nkdk/cf/Перечисление/ПеречислениеВсеСвойства/МодульМенеджера.bsl")
        )
        .unwrap(),
    );
    let xml = fixture["xml"].as_str().unwrap();
    let converted = convert_file(entry, Direction::XmlToYaml, xml.as_bytes(), &inputs).unwrap();
    let yaml = String::from_utf8_lossy(&converted.bytes);
    if fixture["baseIdentity"].is_null()
        && fixture["inputs"]["ownerName"] == "ПеречислениеВсеСвойства"
    {
        assert!(yaml.contains("Характеристики:"), "{yaml}");
        assert!(yaml.contains("ОсновнаяФормаСписка: ФормаСписка"), "{yaml}");
    }
    assert!(!yaml.contains("Формы:"), "{yaml}");
    assert!(!yaml.contains("Шаблоны:"), "{yaml}");
    let actual = yaml_rust2::YamlLoader::load_from_str(&yaml).unwrap();
    let expected =
        yaml_rust2::YamlLoader::load_from_str(fixture["yaml"].as_str().unwrap()).unwrap();
    verify_candidate(entry, xml.as_bytes(), &converted.bytes, &inputs).unwrap();
    assert!(!yaml.contains("$xml:"), "{yaml}");
    assert_eq!(
        actual.iter().map(semantic_yaml).collect::<Vec<_>>(),
        expected.iter().map(semantic_yaml).collect::<Vec<_>>()
    );
    let exported = convert_file(
        entry,
        Direction::YamlToXml,
        fixture["yaml"].as_str().unwrap().as_bytes(),
        &inputs,
    )
    .unwrap();
    nkdk_conversion_core::proof::verify(xml.as_bytes(), &exported.bytes, |_| false).unwrap();
    if fixture["inputs"]["component"] == "cf"
        && fixture["inputs"]["ownerName"] == "ПеречислениеВсеСвойства"
    {
        for (original, invalid) in [
            (
                "<ns0:UseStandardCommands>true</ns0:UseStandardCommands>",
                "<ns0:UseStandardCommands>maybe</ns0:UseStandardCommands>",
            ),
            (
                "<ns0:ChoiceMode>BothWays</ns0:ChoiceMode>",
                "<ns0:ChoiceMode>UnknownWay</ns0:ChoiceMode>",
            ),
        ] {
            let broken = xml.replacen(original, invalid, 1);
            assert_ne!(broken, xml);
            let imported = convert_file(entry, Direction::XmlToYaml, broken.as_bytes(), &inputs)
                .expect("an invalid declared scalar should be preserved as a data anomaly");
            let yaml = String::from_utf8(imported.bytes).unwrap();
            assert_eq!(yaml.matches("!xml/").count(), 1, "{yaml}");
            assert!(yaml.contains("БыстрыйВыбор: Ложь"), "{yaml}");
            let exported =
                convert_file(entry, Direction::YamlToXml, yaml.as_bytes(), &inputs).unwrap();
            nkdk_conversion_core::proof::verify(broken.as_bytes(), &exported.bytes, |_| false)
                .unwrap();
        }
        let duplicated = xml.replacen(
            "<v8:content>Синоним</v8:content>\n\t\t\t\t</v8:item>\n\t\t\t</ns0:Synonym>",
            "<v8:content>Синоним</v8:content>\n\t\t\t\t</v8:item>\n\t\t\t\t<v8:item><v8:lang>ru</v8:lang><v8:content>Другой</v8:content></v8:item>\n\t\t\t</ns0:Synonym>",
            1,
        );
        assert_ne!(duplicated, xml);
        let imported = convert_file(entry, Direction::XmlToYaml, duplicated.as_bytes(), &inputs)
            .expect("repeated translations should not interrupt conversion");
        let yaml = String::from_utf8(imported.bytes).unwrap();
        assert!(yaml.contains("БыстрыйВыбор: Ложь"), "{yaml}");
        let exported = convert_file(entry, Direction::YamlToXml, yaml.as_bytes(), &inputs).unwrap();
        nkdk_conversion_core::proof::verify(duplicated.as_bytes(), &exported.bytes, |_| false)
            .unwrap();
        let start = xml.find("<xr:StandardAttribute name=\"Order\">").unwrap();
        let end = start
            + xml[start..].find("</xr:StandardAttribute>").unwrap()
            + "</xr:StandardAttribute>".len();
        let row = &xml[start..end];
        let duplicated = xml.replacen(row, &format!("{row}{row}"), 1);
        let imported = convert_file(entry, Direction::XmlToYaml, duplicated.as_bytes(), &inputs)
            .expect("repeated standard attributes should not interrupt conversion");
        let yaml = String::from_utf8(imported.bytes).unwrap();
        assert!(yaml.contains("Значения:"), "{yaml}");
        let exported = convert_file(entry, Direction::YamlToXml, yaml.as_bytes(), &inputs).unwrap();
        nkdk_conversion_core::proof::verify(duplicated.as_bytes(), &exported.bytes, |_| false)
            .unwrap();
    }
}
