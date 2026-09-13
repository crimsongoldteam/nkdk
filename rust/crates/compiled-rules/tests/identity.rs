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
    let facts = std::sync::Arc::new(builder.finish());
    let restored_entry = entry_id("migration.metadata-uuid").unwrap();
    let mut restored_count = 0;
    for row in rows.iter().filter(|row| row["kind"] == "EnumValue") {
        let values = ["component", "kind"]
            .into_iter()
            .map(|key| (key.to_owned(), InputValue::Text(text(row, key))))
            .chain(std::iter::once((
                "owner".into(),
                InputValue::Text(text(row, "ownerUuid")),
            )))
            .collect();
        let inputs = nkdk_compiled_rules::prepare_fact_inputs(
            restored_entry,
            facts.clone(),
            generation,
            values,
        )
        .unwrap();
        let yaml = format!("Имя: {}", row["name"]);
        let result = nkdk_compiled_rules::convert_file(
            restored_entry,
            Direction::YamlToXml,
            yaml.as_bytes(),
            &inputs,
        )
        .unwrap();
        let expected = format!(
            "<Root uuid=\"{}\"><Name>{}</Name></Root>",
            text(row, "uuid"),
            text(row, "name")
        );
        nkdk_conversion_core::proof::verify(expected.as_bytes(), &result.bytes, |_| false).unwrap();
        let imported = nkdk_compiled_rules::convert_file(
            restored_entry,
            Direction::XmlToYaml,
            expected.as_bytes(),
            &inputs,
        )
        .unwrap();
        assert!(!String::from_utf8_lossy(&imported.bytes).contains(&text(row, "uuid")));
        restored_count += 1;
    }
    assert_eq!(restored_count, 9, "Reviewed EnumValue inventory");
    let new_object_inputs = |prepared| {
        nkdk_compiled_rules::prepare_fact_inputs(
            restored_entry,
            prepared,
            generation,
            ["component", "owner", "kind"]
                .into_iter()
                .map(|key| (key.into(), InputValue::Text("missing".into())))
                .collect(),
        )
        .unwrap()
    };
    let unprepared = new_object_inputs(facts.clone());
    assert!(
        nkdk_compiled_rules::convert_file(
            restored_entry,
            Direction::YamlToXml,
            "Имя: Новый".as_bytes(),
            &unprepared
        )
        .is_err(),
        "Missing identity preparation must not silently export XML without UUID"
    );

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
    let creator = nkdk_conversion_core::facts::identity::OperationIdentity::new([1; 32]);
    let previous = facts.lookup_parts(
        generation,
        own_id,
        &["missing", "missing", "Новый", "missing"],
    );
    let FactState::Ready(created) = creator.resolve(
        previous,
        "uuid",
        nkdk_conversion_core::facts::identity::IdentityFormat::Uuid,
        &nkdk_conversion_core::facts::identity::LogicalAddress::from_segments(["Объект"]).unwrap(),
    ) else {
        panic!("complete previous index permits creation");
    };
    let mut next = nkdk_compiled_rules::fact_builder(
        generation,
        FactBudget {
            text: TextBudget {
                entries: 20,
                bytes: 1000,
            },
            rows: 2,
        },
    );
    let creation_inputs = prepare_inputs(
        own,
        vec![
            ("component".into(), InputValue::Text("missing".into())),
            ("owner".into(), InputValue::Text("missing".into())),
            ("kind".into(), InputValue::Text("missing".into())),
            ("name".into(), InputValue::Text("Новый".into())),
            ("identity".into(), InputValue::Text(created.into_owned())),
        ],
    )
    .unwrap();
    assert!(
        contribute_file(
            own,
            Direction::YamlToXml,
            "Имя: Новый".as_bytes(),
            &creation_inputs,
            &mut next
        )
        .is_empty()
    );
    let inputs = new_object_inputs(std::sync::Arc::new(next.finish()));
    let output = nkdk_compiled_rules::convert_file(
        restored_entry,
        Direction::YamlToXml,
        "Имя: Новый".as_bytes(),
        &inputs,
    )
    .unwrap();
    nkdk_conversion_core::proof::verify(
        "<Root uuid=\"f8a59a9f-0a3d-4f80-bd43-9f1c85dc0ef6\"><Name>Новый</Name></Root>".as_bytes(),
        &output.bytes,
        |_| false,
    )
    .unwrap();
    assert_eq!(rows.len(), 572);
    assert_eq!(base_count, 179);
}
