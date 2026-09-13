use nkdk_compiled_rules::{Direction, InputValue, contribute_file, entry_id, prepare_inputs};
use nkdk_conversion_core::facts::{FactState, Generation, prepared::FactBudget, text::TextBudget};

#[test]
fn identity_fragments_keep_components_owners_and_base_links_separate() {
    let corpus: serde_json::Value = serde_json::from_slice(include_bytes!(
        "../../../../tests/migration/nested-identity-inventory.json"
    ))
    .unwrap();
    let rows = corpus["rows"].as_array().unwrap();
    let generation = Generation(1);
    let mut builder = nkdk_compiled_rules::fact_builder(
        generation,
        FactBudget {
            text: TextBudget {
                entries: 10000,
                bytes: 1000000,
            },
            rows: 2000,
        },
    );
    let own = entry_id("migration.metadata-own-identity").unwrap();
    let base = entry_id("migration.metadata-base-identity").unwrap();
    let text = |row: &serde_json::Value, key: &str| row[key].as_str().unwrap().to_owned();
    let mut base_count = 0;
    for row in rows {
        let source = format!("Имя: {}\n", row["name"]);
        let mut pairs = vec![
            ("component", text(row, "component")),
            ("owner", text(row, "ownerUuid")),
            ("kind", text(row, "kind")),
            ("name", text(row, "name")),
            ("identity", text(row, "uuid")),
        ];
        let inputs = prepare_inputs(
            own,
            pairs
                .drain(..)
                .map(|(key, value)| (key.into(), InputValue::Text(value)))
                .collect(),
        )
        .unwrap();
        // Only the prepared facts are contributed: UUIDs never become YAML fields.
        assert!(
            contribute_file(
                own,
                Direction::YamlToXml,
                source.as_bytes(),
                &inputs,
                &mut builder
            )
            .is_empty()
        );
        if let Some(base_id) = row["baseUuid"].as_str() {
            let inputs = prepare_inputs(
                base,
                vec![
                    ("component".into(), InputValue::Text(text(row, "component"))),
                    ("identity".into(), InputValue::Text(text(row, "uuid"))),
                    ("baseIdentity".into(), InputValue::Text(base_id.into())),
                ],
            )
            .unwrap();
            assert!(
                contribute_file(
                    base,
                    Direction::YamlToXml,
                    source.as_bytes(),
                    &inputs,
                    &mut builder
                )
                .is_empty()
            );
            base_count += 1;
        }
    }
    let facts = builder.finish();
    let own_id = nkdk_compiled_rules::fact_id("metadata.own-identities").unwrap();
    let base_id = nkdk_compiled_rules::fact_id("metadata.base-identities").unwrap();
    for row in rows {
        let part = |key: &str| row[key].as_str().unwrap();
        assert_eq!(
            facts.lookup_parts(
                generation,
                own_id,
                &[
                    part("component"),
                    part("kind"),
                    part("name"),
                    part("ownerUuid")
                ]
            ),
            FactState::Ready(part("uuid"))
        );
        let expected = row["baseUuid"]
            .as_str()
            .map(FactState::Ready)
            .unwrap_or(FactState::Missing);
        assert_eq!(
            facts.lookup_parts(generation, base_id, &[part("component"), part("uuid")]),
            expected
        );
        assert_eq!(
            facts.lookup_parts(
                generation,
                own_id,
                &[
                    "unknown-component",
                    part("kind"),
                    part("name"),
                    part("ownerUuid")
                ]
            ),
            FactState::Missing
        );
    }
    assert_eq!(rows.len(), 572);
    assert_eq!(base_count, 179);
}
