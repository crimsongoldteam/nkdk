#[path = "../../compiled-rules/tests/support/command_identity.rs"]
mod command_identity;

use nkdk_compiled_rules_probes::{
    Direction, convert_file, entry_id, prepare_fact_inputs, verify_candidate,
};

#[test]
fn full_commands_use_the_same_declaration_inside_named_collections() {
    let mut cases: serde_json::Value = serde_json::from_slice(include_bytes!(
        "../../../../tests/migration/internal-generated-types-inventory.json"
    ))
    .unwrap();
    let fixture_root = std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join("../../..");
    for (kind, xml_path, yaml_path) in [
        (
            "Document",
            "e2e/fixtures/xml/cfe/all-extension/Documents/ДокументВсеСвойстваExt.xml",
            "e2e/fixtures/nkdk/cfe/Расширение_All/Документ/ДокументВсеСвойстваExt/Свойства.yaml",
        ),
        (
            "DocumentJournal",
            "e2e/fixtures/xml/cfe/all-extension/DocumentJournals/ЖурналДокументовВсеСвойстваExt.xml",
            "e2e/fixtures/nkdk/cfe/Расширение_All/ЖурналДокументов/ЖурналДокументовВсеСвойстваExt/Свойства.yaml",
        ),
        (
            "DocumentJournal",
            "e2e/fixtures/xml/cfe/all-extension/DocumentJournals/ЖурналДокументовВсеСвойства.xml",
            "e2e/fixtures/nkdk/cfe/Расширение_All/ЖурналДокументов/ЖурналДокументовВсеСвойства/Свойства.yaml",
        ),
    ] {
        let xml = std::fs::read_to_string(fixture_root.join(xml_path)).unwrap();
        let yaml = std::fs::read_to_string(fixture_root.join(yaml_path)).unwrap();
        let attribute = |element: &str| {
            xml.split_once(&format!("<{element} uuid=\""))
                .unwrap()
                .1
                .split_once('"')
                .unwrap()
                .0
                .to_owned()
        };
        let command = xml.split_once("<Command uuid=\"").unwrap().1;
        let command = format!(
            "<Command uuid=\"{}",
            command.split_once("</Command>").unwrap().0
        );
        let command = format!("{command}</Command>").replacen(
            "<Command ",
            "<Command xmlns=\"http://v8.1c.ru/8.3/MDClasses\" xmlns:xr=\"http://v8.1c.ru/8.3/xcf/readable\" ",
            1,
        );
        let adopted = command.contains("<ObjectBelonging>Adopted</ObjectBelonging>");
        let base = adopted.then(|| {
            command
                .split_once("<ExtendedConfigurationObject>")
                .unwrap()
                .1
                .split_once("</ExtendedConfigurationObject>")
                .unwrap()
                .0
                .to_owned()
        });
        let name = command
            .split_once("<Name>")
            .unwrap()
            .1
            .split_once("</Name>")
            .unwrap()
            .0;
        let group = yaml
            .split_once("Команды:\n")
            .unwrap()
            .1
            .lines()
            .find(|line| line.trim_start().starts_with("Группа: "))
            .unwrap()
            .trim();
        cases.as_array_mut().unwrap().push(serde_json::json!({
            "kind": kind,
            "component": "cfe",
            "owner": attribute(kind),
            "defaultLanguage": "ru",
            "registeredLanguages": ["ru"],
            "base": base,
            "commands": [{"name": name, "identity": attribute("Command"), "xml": command,
                "yaml": format!("Синоним: \"\"\n{group}")}],
        }));
    }
    let generation = nkdk_conversion_core::facts::Generation(1);
    let mut checked = 0;
    for case in cases.as_array().unwrap() {
        for command in case["commands"].as_array().unwrap() {
            let mut facts = command_identity::command_fact_builder(generation);
            command_identity::seed(
                &mut facts,
                case["component"].as_str().unwrap_or("cf"),
                case["owner"].as_str().unwrap(),
                command["name"].as_str().unwrap(),
                command["identity"].as_str().unwrap(),
            );
            if let Some(base) = case["base"].as_str() {
                command_identity::seed_base(
                    &mut facts,
                    case["component"].as_str().unwrap(),
                    command["identity"].as_str().unwrap(),
                    base,
                    command["name"].as_str().unwrap(),
                );
            }
            command_identity::seed_command_groups(&mut facts);
            let entry = entry_id("migration.command-collection").unwrap();
            let languages = case["registeredLanguages"]
                .as_array()
                .unwrap()
                .iter()
                .map(|value| value.as_str().unwrap())
                .collect::<Vec<_>>();
            let values = command_identity::owner_values(
                case["defaultLanguage"].as_str().unwrap(),
                &languages,
                case["component"].as_str().unwrap_or("cf"),
                case["owner"].as_str().unwrap(),
            );
            let facts = std::sync::Arc::new(facts.finish());
            let prepared =
                prepare_fact_inputs(entry, facts.clone(), generation, values.clone()).unwrap();
            let command_xml = command["xml"]
                .as_str()
                .unwrap()
                .replace(
                    "<ns0:ParameterUseMode",
                    "<ns0:CommandParameterType /><ns0:ParameterUseMode",
                )
                .replace("<ns0:Shortcut", "<ns0:Picture /><ns0:Shortcut");
            let xml = format!("<Root><ChildObjects>{command_xml}</ChildObjects></Root>");
            let converted =
                convert_file(entry, Direction::XmlToYaml, xml.as_bytes(), &prepared).unwrap();
            let yaml = String::from_utf8_lossy(&converted.bytes);
            assert!(yaml.contains("Команды:"), "{yaml}");
            assert!(yaml.contains(command["name"].as_str().unwrap()), "{yaml}");
            assert!(yaml.contains("Синоним: \"\""), "{yaml}");
            let group = command["yaml"]
                .as_str()
                .unwrap()
                .lines()
                .find(|line| line.starts_with("Группа: "))
                .unwrap();
            assert!(yaml.contains(group), "{yaml}");
            if case["base"].is_string() {
                assert!(yaml.contains("МодульКоманды"), "{yaml}");
                assert!(!yaml.contains("Команды: !xml/"), "{yaml}");
            } else {
                assert!(!yaml.contains("!xml/"), "{yaml}");
            }
            verify_candidate(entry, xml.as_bytes(), &converted.bytes, &prepared).unwrap();
            if case["base"].is_string() {
                let invalid = xml.replace(
                    "<xr:State>Extended</xr:State>",
                    "<xr:State>Unknown</xr:State>",
                );
                assert_ne!(invalid, xml);
                let anomalous =
                    convert_file(entry, Direction::XmlToYaml, invalid.as_bytes(), &prepared)
                        .unwrap();
                assert!(String::from_utf8_lossy(&anomalous.bytes).contains("!xml/"));
                verify_candidate(entry, invalid.as_bytes(), &anomalous.bytes, &prepared).unwrap();
                checked += 1;
                continue;
            }
            let tag = if xml.contains("<ns0:ModifiesData>") {
                "ns0:ModifiesData"
            } else {
                "ModifiesData"
            };
            let invalid = xml.replace(
                &format!("<{tag}>false</{tag}>"),
                &format!("<{tag}>oops</{tag}>"),
            );
            assert_ne!(invalid, xml);
            let anomalous =
                convert_file(entry, Direction::XmlToYaml, invalid.as_bytes(), &prepared).unwrap();
            let anomalous_yaml = String::from_utf8_lossy(&anomalous.bytes);
            assert!(anomalous_yaml.contains("!xml/raw"), "{anomalous_yaml}");
            assert!(anomalous_yaml.contains(group), "{anomalous_yaml}");
            verify_candidate(entry, invalid.as_bytes(), &anomalous.bytes, &prepared).unwrap();
            if case["kind"] == "Document" {
                let document = entry_id("migration.document-commands").unwrap();
                let inputs =
                    prepare_fact_inputs(document, facts, generation, values.clone()).unwrap();
                let full_xml = format!(
                    "<md:MetaDataObject xmlns:md=\"http://v8.1c.ru/8.3/MDClasses\"><md:Document><md:ChildObjects>{command_xml}</md:ChildObjects></md:Document></md:MetaDataObject>"
                );
                let imported =
                    convert_file(document, Direction::XmlToYaml, full_xml.as_bytes(), &inputs)
                        .unwrap();
                assert!(String::from_utf8_lossy(&imported.bytes).contains("Команды:"));
                verify_candidate(document, full_xml.as_bytes(), &imported.bytes, &inputs).unwrap();
                let budget = || nkdk_conversion_core::facts::prepared::FactBudget {
                    text: nkdk_conversion_core::facts::text::TextBudget {
                        entries: 100,
                        bytes: 10000,
                    },
                    rows: 100,
                };
                let empty = std::sync::Arc::new(
                    nkdk_compiled_rules_probes::fact_builder(generation, budget()).finish(),
                );
                let source_inputs =
                    prepare_fact_inputs(document, empty, generation, values.clone()).unwrap();
                let mut discovered = nkdk_compiled_rules_probes::fact_builder(generation, budget());
                assert!(
                    nkdk_compiled_rules_probes::contribute_file(
                        document,
                        Direction::XmlToYaml,
                        full_xml.as_bytes(),
                        &source_inputs,
                        &mut discovered,
                    )
                    .is_empty()
                );
                let discovered = std::sync::Arc::new(discovered.finish());
                assert_eq!(
                    discovered.lookup_parts(
                        generation,
                        nkdk_compiled_rules_probes::fact_id("metadata.own-identities").unwrap(),
                        &[
                            case["component"].as_str().unwrap_or("cf"),
                            "Command",
                            command["name"].as_str().unwrap(),
                            case["owner"].as_str().unwrap(),
                        ],
                    ),
                    nkdk_conversion_core::facts::FactState::Ready(
                        command["identity"].as_str().unwrap()
                    ),
                );
                let restored =
                    prepare_fact_inputs(document, discovered, generation, values).unwrap();
                verify_candidate(document, full_xml.as_bytes(), &imported.bytes, &restored)
                    .unwrap();
            }
            checked += 1;
        }
    }
    assert_eq!(checked, 5);
}
