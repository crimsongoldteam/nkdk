use nkdk_compiled_rules_probes as nkdk_compiled_rules;
use nkdk_compiled_rules::{
    Direction, InputValue, contribute_file, convert_file, entry_id, fact_id, prepare_fact_inputs,
    verify_candidate,
};
use nkdk_conversion_core::facts::{Generation, prepared::FactBudget, text::TextBudget};
use std::sync::Arc;

#[test]
fn defined_type_import_matches_existing_e2e_yaml() {
    let cases = [
        (
            "ОпределяемыйТипВсеСвойства",
            "426da0c0-ee05-4af5-a132-c7874136d3bf",
            "7d4376c6-b8b9-4df6-ada4-368fa6bac7a8",
            "065165d6-dc56-4036-ae10-c9464b0e9462",
            "cf",
            include_bytes!(
                "../../../../e2e/fixtures/xml/cf/DefinedTypes/ОпределяемыйТипВсеСвойства.xml"
            ) as &[u8],
            include_bytes!(
                "../../../../e2e/fixtures/nkdk/cf/ОпределяемыйТип/ОпределяемыйТипВсеСвойства.yaml"
            ) as &[u8],
        ),
        (
            "ОпределяемыйТипПоУмолчанию",
            "61ac73bb-6f4a-4cde-8559-f04443dbc1cc",
            "6ada62e5-9bd3-4f48-b0aa-6d1bb0a8c399",
            "2f4f0005-5eaa-4d47-b7e1-cd3e3c40eb04",
            "cf",
            include_bytes!(
                "../../../../e2e/fixtures/xml/cf/DefinedTypes/ОпределяемыйТипПоУмолчанию.xml"
            ),
            include_bytes!(
                "../../../../e2e/fixtures/nkdk/cf/ОпределяемыйТип/ОпределяемыйТипПоУмолчанию.yaml"
            ),
        ),
        (
            "ОпределяемыйТипВсеСвойства",
            "4ca2ea3b-664b-4f27-b272-21d4943b0e30",
            "ad336050-d6f9-4a99-b63f-7ff8c91f59ef",
            "db25ce02-faf3-4d51-ac0e-4395b44f072e",
            "cfe",
            include_bytes!(
                "../../../../e2e/fixtures/xml/cfe/all-extension/DefinedTypes/ОпределяемыйТипВсеСвойства.xml"
            ),
            include_bytes!(
                "../../../../e2e/fixtures/nkdk/cfe/Расширение_All/ОпределяемыйТип/ОпределяемыйТипВсеСвойства.yaml"
            ),
        ),
        (
            "ОпределяемыйТипПоУмолчанию",
            "56b53617-eb69-452b-873e-35aa362c7001",
            "4fcdae24-5b00-42cb-a9ee-1f3cd9f39a94",
            "41b91638-1aa9-4078-83ab-6c758cfe0417",
            "cfe",
            include_bytes!(
                "../../../../e2e/fixtures/xml/cfe/all-extension/DefinedTypes/ОпределяемыйТипПоУмолчанию.xml"
            ),
            include_bytes!(
                "../../../../e2e/fixtures/nkdk/cfe/Расширение_All/ОпределяемыйТип/ОпределяемыйТипПоУмолчанию.yaml"
            ),
        ),
    ];
    for (name, identity, type_id, value_id, component, xml, expected) in cases {
        let entry = entry_id(if component == "cfe" {
            "metadata.defined-type-extension"
        } else {
            "metadata.defined-type"
        })
        .expect("declared owner profile");
        let generation = Generation(1);
        let mut builder = nkdk_compiled_rules::fact_builder(
            generation,
            FactBudget {
                text: TextBudget {
                    entries: 100,
                    bytes: 10000,
                },
                rows: 100,
            },
        );
        builder
            .push_parts(
                fact_id("metadata.own-identities").unwrap(),
                &[component, "DefinedType", name, "configuration"],
                identity,
            )
            .unwrap();
        builder
            .push_parts(
                fact_id("metadata.internal-type-ids").unwrap(),
                &["DefinedType", identity],
                type_id,
            )
            .unwrap();
        builder
            .push_parts(
                fact_id("metadata.internal-value-ids").unwrap(),
                &["DefinedType", identity],
                value_id,
            )
            .unwrap();
        if component == "cfe" {
            let base = if name == "ОпределяемыйТипВсеСвойства" {
                "426da0c0-ee05-4af5-a132-c7874136d3bf"
            } else {
                "61ac73bb-6f4a-4cde-8559-f04443dbc1cc"
            };
            builder
                .push_parts(
                    fact_id("metadata.base-identities").unwrap(),
                    &[component, identity],
                    base,
                )
                .unwrap();
        }
        let facts = Arc::new(builder.finish());
        let inputs = prepare_fact_inputs(
            entry,
            facts,
            generation,
            vec![
                ("ownerName".into(), InputValue::Text(name.into())),
                ("component".into(), InputValue::Text(component.into())),
                ("parent".into(), InputValue::Text("configuration".into())),
                ("defaultLanguage".into(), InputValue::Text("ru".into())),
                (
                    "registeredLanguages".into(),
                    InputValue::Sequence(
                        ["ru", "en"]
                            .map(|language| InputValue::Text(language.into()))
                            .into(),
                    ),
                ),
            ],
        )
        .expect("prepared inputs");
        let result = convert_file(entry, Direction::XmlToYaml, xml, &inputs)
            .unwrap_or_else(|errors| panic!("XML import {component}/{name}: {errors:?}"));
        let rebuilt =
            convert_file(entry, Direction::YamlToXml, expected, &inputs).expect("XML export");
        assert!(
            rebuilt.diagnostics.is_empty(),
            "{name}: {:#?}",
            rebuilt.diagnostics
        );
        let canonical_yaml = String::from_utf8_lossy(expected)
            .replace("  - Строка(10)", "  -\n    Строка(10)")
            .replace("  - Число(10, 0)", "  -\n    Число(10, 0)");
        assert_eq!(
            String::from_utf8_lossy(&result.bytes).trim(),
            canonical_yaml.trim(),
            "{name}"
        );
        assert!(
            result.diagnostics.is_empty(),
            "{name}: {:#?}",
            result.diagnostics
        );
        verify_candidate(entry, xml, expected, &inputs).expect("XML round-trip without reference");
        if component == "cf" && name == "ОпределяемыйТипВсеСвойства" {
            for (direction, source) in [
                (Direction::XmlToYaml, xml),
                (Direction::YamlToXml, expected),
            ] {
                let mut graph = nkdk_compiled_rules::fact_builder(
                    generation,
                    FactBudget {
                        text: TextBudget {
                            entries: 20,
                            bytes: 1000,
                        },
                        rows: 10,
                    },
                );
                let issues = contribute_file(entry, direction, source, &inputs, &mut graph);
                assert!(issues.is_empty(), "{direction:?}: {issues:?}");
                let graph = graph.finish();
                let nkdk_conversion_core::facts::FactState::Ready(values) = graph.lookup_union(
                    generation,
                    fact_id("metadata.defined-type-alternatives").unwrap(),
                    "ОпределяемыйТип.ОпределяемыйТипВсеСвойства",
                ) else {
                    panic!("defined type alternatives missing")
                };
                assert_eq!(values.collect::<Vec<_>>(), vec!["Строка", "Число"]);
            }
        }
    }
}
