use nkdk_conversion_core::yaml::{
    GroupedRecordMappingReader, GroupedRecordMappingWriter, Node, RecordMappingFields, visit_nodes,
};

fn rows(source: &str) -> nkdk_conversion_core::Result<Vec<Vec<String>>> {
    let mut reader = GroupedRecordMappingReader::default();
    let mut rows = Vec::new();
    visit_nodes(source.as_bytes(), |node, position| {
        reader.consume(
            node,
            position,
            RecordMappingFields::new("ключ", Some("значение")),
            "режим",
            |key, _| Ok(key),
            |node, _| {
                match node {
                    Node::MappingStart(_) => rows.push(Vec::new()),
                    Node::Scalar(value, _) => rows.last_mut().unwrap().push(value.into_text()?),
                    _ => {}
                }
                Ok(())
            },
        )
    })?;
    reader.finish()?;
    Ok(rows)
}

#[test]
fn grouping_streams_scalar_and_secondary_mapping_values_as_declared_rows() {
    assert_eq!(rows("Нажатие: Процедура\nИзменение:\n  Перед: ПередИзменением\n  После: ПослеИзменения\nДругое: Сосед").unwrap(),[
        vec!["ключ","Нажатие","значение","Процедура"],
        vec!["ключ","Изменение","режим","Перед","значение","ПередИзменением"],
        vec!["ключ","Изменение","режим","После","значение","ПослеИзменения"],
        vec!["ключ","Другое","значение","Сосед"],
    ]);
    assert!(rows("{Нажатие: a, Нажатие: b}").is_err());
    assert!(rows("{Изменение: {Перед: a, Перед: b}}").is_err());
    assert!(rows("Изменение: {}").is_err());
}

#[test]
fn grouping_keeps_first_key_order_and_reports_unrepresentable_xml_rows() {
    let mut writer = GroupedRecordMappingWriter::default();
    assert!(writer.push("Первое", Some("Перед"), "a".into()));
    assert!(writer.push("Сосед", None, "b".into()));
    assert!(writer.push("Первое", Some("После"), "c".into()));
    assert!(!writer.push("Первое", Some("Перед"), "duplicate".into()));
    assert!(!writer.push("Первое", None, "conflict".into()));
    assert!(!writer.push("Сосед", Some("После"), "conflict".into()));
    let mut yaml = String::new();
    writer.write(&mut yaml, "").unwrap();
    assert_eq!(yaml, "Первое:\n  Перед: a\n  После: c\nСосед: b");
    assert_eq!(rows(&yaml).unwrap().len(), 3);
}

#[test]
fn grouping_preserves_nested_values_positions_and_quoted_keys() {
    let mut reader = GroupedRecordMappingReader::default();
    let mut nodes = Vec::new();
    visit_nodes(b"{'a: b': {mode: [one, two]}}", |node, position| {
        reader.consume(
            node,
            position,
            RecordMappingFields::new("k", Some("v")),
            "g",
            |key, _| Ok(key),
            |node, position| {
                nodes.push((node, position));
                Ok(())
            },
        )
    })
    .unwrap();
    reader.finish().unwrap();
    assert_eq!(
        nodes
            .iter()
            .filter(|(node, _)| matches!(node, Node::SequenceStart(_)))
            .count(),
        2
    );
    let mut writer = GroupedRecordMappingWriter::default();
    writer.push("a: b", Some("mode"), "- one\n- two".into());
    let mut yaml = String::new();
    writer.write(&mut yaml, "").unwrap();
    assert!(yaml.contains("\"a: b\""));
    let mut reopened = GroupedRecordMappingReader::default();
    visit_nodes(yaml.as_bytes(), |node, position| {
        reopened.consume(
            node,
            position,
            RecordMappingFields::new("k", Some("v")),
            "g",
            |key, _| Ok(key),
            |_, _| Ok(()),
        )
    })
    .unwrap();
    reopened.finish().unwrap();
}

#[test]
fn grouped_projection_handles_scalar_and_structured_payloads_and_raw_only_rows() {
    let mut writer = GroupedRecordMappingWriter::default();
    assert!(
        writer
            .push_record(
                "Первое",
                "Режим: Перед\nЗначение: 'a: b'".as_bytes(),
                "Режим",
                "Значение"
            )
            .unwrap()
    );
    assert!(
        writer
            .push_record(
                "Второе",
                "Значение: [one, two]".as_bytes(),
                "Режим",
                "Значение"
            )
            .unwrap()
    );
    assert!(
        !writer
            .push_record(
                "Повреждено",
                "callType: !xml/raw\n  $xml: During\nЗначение: a".as_bytes(),
                "Режим",
                "Значение"
            )
            .unwrap()
    );
    assert!(
        writer
            .push_record(
                "Ошибка",
                "Служебное: значение".as_bytes(),
                "Режим",
                "Значение"
            )
            .is_err()
    );
    let mut yaml = String::new();
    writer.write(&mut yaml, "").unwrap();
    assert!(yaml.contains("Перед: \"a: b\""));
    assert!(yaml.contains("- one"));
    assert!(!yaml.contains("Повреждено"));
}
