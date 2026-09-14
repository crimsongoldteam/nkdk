use nkdk::facts::{Source, prepare};
use nkdk_compiled_rules::{Direction, convert_file, entry_id, read_inputs};
use nkdk_conversion_core::facts::{Generation, prepared::FactBudget, text::TextBudget};

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
    let prepare_context = || {
        let sources = facts
            .iter()
            .map(|source| {
                let entry = entry_id(source["entry"].as_str().unwrap()).unwrap();
                Source {
                    entry,
                    direction: Direction::XmlToYaml,
                    bytes: source["xml"].as_str().unwrap().as_bytes(),
                    inputs: read_inputs(entry, &serde_json::to_vec(&source["inputs"]).unwrap())
                        .unwrap(),
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
    let memberships = prepare_context();
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
        let source = facts
            .iter()
            .position(|source| {
                source["entry"] == case["entry"] && source["inputs"] == case["inputs"]
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
            prepare_context()
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
        for retained in case["retainedYAML"].as_array().into_iter().flatten() {
            assert!(
                yaml.lines().any(|line| Some(line) == retained.as_str()),
                "{yaml}"
            );
        }
        let reverse = case["yaml"].as_str().unwrap_or(yaml);
        let exported = run(
            Direction::YamlToXml,
            reverse.as_bytes(),
            prepare_context()
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
