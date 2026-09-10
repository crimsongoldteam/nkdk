use nkdk_compiled_rules::{
    Direction, EntryId, PreparedInputs, convert_file, entry_id, validate_file, verify_candidate,
};

fn check(entry: EntryId, xml: &str, expected: Option<&str>, inputs: &PreparedInputs) -> Vec<u8> {
    let imported = convert_file(entry, Direction::XmlToYaml, xml.as_bytes(), inputs)
        .unwrap_or_else(|error| panic!("{xml}: {error:?}"));
    if let Some(expected) = expected {
        assert_eq!(imported.bytes, expected.as_bytes(), "{xml}");
    } else {
        assert!(
            String::from_utf8_lossy(&imported.bytes).contains("!xml/raw"),
            "{xml}"
        );
    }
    assert!(
        validate_file(entry, &imported.bytes, inputs).is_empty(),
        "{xml}"
    );
    verify_candidate(entry, xml.as_bytes(), &imported.bytes, inputs).unwrap();
    imported.bytes
}

#[test]
fn complete_catalog_obeys_every_original_pair_and_preserves_unknown_xml() {
    let reference: serde_json::Value = serde_json::from_slice(include_bytes!(
        "../../../../tests/migration/system-enumeration-tables.json"
    ))
    .unwrap();
    let records = reference["entries"].as_array().unwrap();
    assert_eq!(
        records.len(),
        reference["enumerations"].as_u64().unwrap() as usize
    );
    let inputs = PreparedInputs::default();
    let mut count = 0;
    for enumeration in records {
        let name = enumeration["name"].as_str().unwrap();
        let entry = entry_id(&format!("migration.system.{name}")).unwrap();
        let dcs = entry_id(&format!("migration.system.{name}.dcs")).unwrap();
        let namespace = enumeration["dcsNamespace"].as_str().unwrap();
        for value in enumeration["values"].as_array().unwrap() {
            let xml_text = value["xml"].as_str().unwrap();
            let meaning = value["meaning"].as_str().unwrap();
            let label = value["yaml"].as_str().unwrap();
            let yaml = format!("Значение: {}", nkdk_conversion_core::yaml::scalar(label));
            for spelling in
                std::iter::once(xml_text).chain((xml_text != meaning).then_some(meaning))
            {
                let xml = format!(
                    "<Root><Value>{}</Value></Root>",
                    spelling
                        .replace('&', "&amp;")
                        .replace('<', "&lt;")
                        .replace('>', "&gt;")
                );
                check(
                    entry,
                    &xml,
                    (spelling == xml_text).then_some(yaml.as_str()),
                    &inputs,
                );
            }
            let xml = format!(
                "<Root xmlns:dcscor=\"http://v8.1c.ru/8.1/data-composition-system/core\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:t=\"{namespace}\"><dcscor:value xsi:type=\"t:{name}\">{meaning}</dcscor:value></Root>"
            );
            check(dcs, &xml, Some(&yaml), &inputs);
            if xml_text != meaning {
                let alternate = xml.replace(&format!(">{meaning}</"), &format!(">{xml_text}</"));
                let bytes = check(dcs, &alternate, None, &inputs);
                assert!(
                    String::from_utf8_lossy(&bytes).contains("$значение:"),
                    "{name}: recognized XML alias must keep its meaning"
                );
            }
            count += 1;
        }
        check(
            entry,
            "<Root><Value>__unknown_enum_literal__</Value></Root>",
            None,
            &inputs,
        );
        assert!(
            !validate_file(
                entry,
                "Значение: __unknown_enum_literal__".as_bytes(),
                &inputs
            )
            .is_empty()
        );
        for body in ["", "<Value/>"] {
            check(entry, &format!("<Root>{body}</Root>"), None, &inputs);
        }
        let first = enumeration["values"][0]["meaning"].as_str().unwrap();
        for attribute in [String::new(), " xsi:type=\"t:UnexpectedType\"".into()] {
            check(
                dcs,
                &format!(
                    "<Root xmlns:dcscor=\"http://v8.1c.ru/8.1/data-composition-system/core\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:t=\"{namespace}\"><dcscor:value{attribute}>{first}</dcscor:value></Root>"
                ),
                None,
                &inputs,
            );
        }
    }
    assert_eq!(count, reference["pairs"].as_u64().unwrap() as usize);
}
