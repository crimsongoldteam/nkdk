use nkdk_conversion_core::yaml::{Node, visit_nodes};

#[test]
fn scalar_or_mapping_reader_rejects_extra_values_and_keeps_forms_separate() {
    use nkdk_conversion_core::yaml::{
        DocumentSource, ScalarOrMappingEntry, visit_scalar_or_mapping_events,
    };
    for (source, expected) in [
        ("Наименование", "scalar:Наименование"),
        ("Поле: Наименование", "field:Поле=Наименование"),
    ] {
        let mut found = Vec::new();
        visit_scalar_or_mapping_events(DocumentSource(source.as_bytes()), |entry| {
            found.push(match entry {
                ScalarOrMappingEntry::Scalar(value, _) => format!("scalar:{}", value.into_text()?),
                ScalarOrMappingEntry::Field(entry) => {
                    format!("field:{}={}", entry.key, entry.value.into_text()?)
                }
            });
            Ok(())
        })
        .unwrap();
        assert_eq!(found, [expected]);
    }
    assert!(visit_scalar_or_mapping_events(DocumentSource(b"- one\n- two"), |_| Ok(())).is_err());
    assert!(
        visit_scalar_or_mapping_events(DocumentSource("{Поле: a, Поле: b}".as_bytes()), |_| Ok(()))
            .is_err()
    );
}

#[test]
fn empty_sequence_item_is_reported_as_yaml_null() {
    let mut forms = Vec::new();
    visit_nodes(b"- one\n-\n- two", |node, _| {
        forms.push(match node {
            Node::SequenceStart(_) => "start",
            Node::SequenceEnd => "end",
            Node::Scalar(value, _) if value.is_null() => "null",
            Node::Scalar(..) => "scalar",
            Node::MappingStart(_) => "mapping-start",
            Node::MappingEnd => "mapping-end",
        });
        Ok(())
    })
    .unwrap();
    assert_eq!(forms, ["start", "scalar", "null", "scalar", "end"]);
}

#[test]
fn structured_choice_selects_one_branch_from_streamed_yaml() {
    use nkdk_conversion_core::yaml::{ChoiceReader, ChoiceSelection, ChoiceSelector};
    static SELECTORS: &[ChoiceSelector] = &[
        ChoiceSelector::Sequence { variant: 0 },
        ChoiceSelector::Mapping {
            variant: 1,
            key: "Тип",
            value: Some("Явный"),
        },
        ChoiceSelector::Mapping {
            variant: 2,
            key: "Вариант",
            value: None,
        },
    ];
    for (source, expected) in [
        ("[one, two]", 0),
        ("Значение: x\nТип: Явный", 1),
        ("Дата: 2026-09-10\nВариант: Произвольный", 2),
    ] {
        let mut reader = ChoiceReader::new(SELECTORS);
        let mut selected = None;
        visit_nodes(source.as_bytes(), |node, position| {
            if selected.is_some() {
                return Ok(());
            }
            if let ChoiceSelection::Selected { variant, events } = reader.consume(node, position)? {
                selected = Some((variant, events.len()));
            }
            Ok(())
        })
        .unwrap();
        assert_eq!(selected.map(|value| value.0), Some(expected));
    }

    let mut reader = ChoiceReader::new(SELECTORS);
    visit_nodes(b"Unknown: value", |node, position| {
        assert!(matches!(
            reader.consume(node, position)?,
            ChoiceSelection::Pending
        ));
        Ok(())
    })
    .unwrap();
    assert_eq!(
        reader.finish().unwrap_err().code.as_deref(),
        Some("yaml.choice-form")
    );
}
#[test]
fn nested_mapping_keeps_occurrence_order_tags_and_positions() {
    for (semantic, expected) in [
        ("!opaque", None),
        ("!opaque \"\"", Some("")),
        ("!opaque text", Some("text")),
    ] {
        let mut encoded = String::from("Value: ");
        nkdk_conversion_core::yaml::append_marked_scalar(
            &mut encoded,
            semantic,
            Some("!xml/invalid"),
            "",
            false,
        );
        let mut count = 0;
        nkdk_conversion_core::yaml::visit_tagged_scalars(encoded.as_bytes(), |key, value, tag| {
            count += 1;
            assert_eq!(key, "Value");
            assert_eq!(tag.as_deref(), Some("!opaque"));
            assert_eq!(value.annotation(), Some("!xml/invalid"));
            assert_eq!(value.into_nullable_text()?.as_deref(), expected);
            Ok(())
        })
        .unwrap();
        assert_eq!(count, 1);
        assert!(
            nkdk_conversion_core::yaml::visit_scalars(encoded.as_bytes(), |_, _| Ok(())).is_err()
        );
    }
    for invalid in [
        "Value: !xml/invalid {$значение: !opaque x, extra: y}",
        "Value: !xml/invalid {$значение: []}",
        "Value: !xml/invalid {}",
    ] {
        assert!(
            nkdk_conversion_core::yaml::visit_tagged_scalars(invalid.as_bytes(), |_, _, _| Ok(()))
                .is_err()
        );
    }
    let mut states = [
        nkdk_conversion_core::yaml::ScalarMapping::default(),
        nkdk_conversion_core::yaml::ScalarMapping::default(),
    ];
    let mut values = Vec::new();
    let [first, second] = ["Name: first", "Name: !xml/invalid second"].map(|source| {
        let mut nodes = Vec::new();
        visit_nodes(source.as_bytes(), |node, position| {
            nodes.push((node, position));
            Ok(())
        })
        .unwrap();
        nodes
    });
    for (first, second) in first.into_iter().zip(second) {
        for (state, (node, position)) in states.iter_mut().zip([first, second]) {
            if let Some(entry) = state.consume(node, position).unwrap() {
                values.push((entry.key, entry.value.into_text().unwrap(), entry.tag));
            }
        }
    }
    for state in states.into_iter().rev() {
        state.finish().unwrap();
    }
    assert_eq!(
        values,
        [
            ("Name".into(), "first".into(), None),
            ("Name".into(), "second".into(), Some("!xml/invalid".into()))
        ]
    );
    for (source, expected) in [
        ("Value: !проверять text", "!проверять"),
        ("Value: !изменять {}", "!изменять"),
        ("Value: !état []", "!état"),
    ] {
        let mut tags = Vec::new();
        visit_nodes(source.as_bytes(), |node, _| {
            match node {
                Node::Scalar(_, Some(tag))
                | Node::MappingStart(Some(tag))
                | Node::SequenceStart(Some(tag)) => tags.push(tag),
                _ => (),
            }
            Ok(())
        })
        .unwrap();
        assert_eq!(tags, [expected]);
    }
    let mut duplicate = nkdk_conversion_core::yaml::ScalarMapping::default();
    assert!(
        visit_nodes(b"Name: first\nName: second", |node, position| duplicate
            .consume(node, position)
            .map(|_| ()))
        .is_err()
    );
    let split = nkdk_conversion_core::yaml::split_properties(
        b"Number: 9007199254740993\nRows: !xml/raw\n  $xml: {_missing: null}",
        &[&["Number"], &["Rows"]],
    )
    .unwrap();
    assert_eq!(split[0], b"Number: 9007199254740993");
    assert!(String::from_utf8_lossy(&split[1]).contains("!xml/raw"));
    for bad in [b"Unknown: x".as_slice(), b"Number: 1\nNumber: 2"] {
        assert!(nkdk_conversion_core::yaml::split_properties(bad, &[&["Number"]]).is_err());
    }
    for (source, present) in [
        ("{}", false),
        ("Record: {}", true),
        ("Record: {Rows: []}", true),
    ] {
        let split = nkdk_conversion_core::yaml::split_record_properties(
            source.as_bytes(),
            "Record",
            &[&["Rows"]],
        )
        .unwrap();
        assert_eq!(split.present[0], source.contains("Rows"));
        let mut seen = nkdk_conversion_core::yaml::RecordState::default();
        let mut boundaries = 0;
        nkdk_conversion_core::yaml::Source::visit(
            nkdk_conversion_core::yaml::MappingPropertySource {
                source: nkdk_conversion_core::yaml::DocumentSource(source.as_bytes()),
                property: "Record",
                seen: &mut seen,
            },
            |node, _| {
                if matches!(node, Node::MappingStart(_) | Node::MappingEnd) {
                    boundaries += 1;
                }
                Ok(())
            },
        )
        .unwrap();
        assert_eq!(seen.present, present);
        assert_eq!(boundaries, 2);
    }
    for source in [
        "Other: {}",
        "Record: {}\nRecord: {}",
        "Record: !xml/raw {}",
        "Record: []",
    ] {
        let mut seen = nkdk_conversion_core::yaml::RecordState::default();
        assert!(
            nkdk_conversion_core::yaml::Source::visit(
                nkdk_conversion_core::yaml::MappingPropertySource {
                    source: nkdk_conversion_core::yaml::DocumentSource(source.as_bytes()),
                    property: "Record",
                    seen: &mut seen,
                },
                |_, _| Ok(())
            )
            .is_err(),
            "{source}"
        );
        assert!(
            nkdk_conversion_core::yaml::split_record_properties(
                source.as_bytes(),
                "Record",
                &[&["Rows"]]
            )
            .is_err(),
            "{source}"
        );
    }
    let mut routed = Vec::new();
    let mut roots = 0;
    nkdk_conversion_core::yaml::visit_partitions(
        nkdk_conversion_core::yaml::DocumentSource(b"First: [one, two]\nLast: {nested: three}"),
        |key| match key {
            "First" => Some(0),
            "Last" => Some(1),
            _ => None,
        },
        |slot, node, _| {
            if let Some(slot) = slot {
                if let Node::Scalar(value, _) = node {
                    routed.push((slot, value.into_text()?));
                }
            } else {
                roots += 1;
            }
            Ok(())
        },
    )
    .unwrap();
    assert_eq!(roots, 2);
    assert_eq!(
        routed,
        vec![
            (0, "First".into()),
            (0, "one".into()),
            (0, "two".into()),
            (1, "Last".into()),
            (1, "nested".into()),
            (1, "three".into())
        ]
    );
    let mut observed = Vec::new();
    visit_nodes(
        b"Title: !invalid\n  ru: one\n  en: !invalid two\n  ru: three",
        |node, position| {
            match node {
                Node::MappingStart(tag) => observed.push(format!("map:{tag:?}")),
                Node::MappingEnd => observed.push("end".into()),
                Node::Scalar(value, tag) => {
                    let text = value.into_text()?;
                    if text == "two" {
                        let error = position.apply(
                            &[],
                            nkdk_conversion_core::RuntimeDiagnostic::new("test", "test"),
                        );
                        assert_eq!((error.line, error.column), (3, 16));
                    }
                    observed.push(format!("{text}:{tag:?}"));
                }
                _ => panic!("Unexpected sequence"),
            }
            Ok(())
        },
    )
    .unwrap();
    assert_eq!(
        observed,
        [
            "map:None",
            "Title:None",
            "map:Some(\"!invalid\")",
            "ru:None",
            "one:None",
            "en:None",
            "two:Some(\"!invalid\")",
            "ru:None",
            "three:None",
            "end",
            "end"
        ]
    );
    for input in ["a: &name text\nb: *name", "{}\n---\n{}"] {
        assert!(visit_nodes(input.as_bytes(), |_, _| Ok(())).is_err());
    }
    let rows = nkdk_conversion_core::yaml::text_sequence_with::<1, usize>(
        b"Values: [aa, bbb, aa]",
        "Values",
        None,
        &[],
        false,
        |[value], _| Ok(value.len()),
    )
    .unwrap()
    .unwrap();
    assert_eq!(rows.rows, [2, 3, 2]);
    let mut routing = nkdk_conversion_core::yaml::PartitionRouter::default();
    let mut property = nkdk_conversion_core::yaml::PropertyReader::default();
    let mut values = nkdk_conversion_core::yaml::SequenceReader::<1, usize>::new(None, &[], false);
    visit_nodes(b"Values: [aa, bbb]", |node, at| {
        let slot = routing.route(&node, |key| (key == "Values").then_some(0))?;
        assert!(slot.is_none() || slot == Some(0));
        if let Some(node) = property.consume(node, "Values", "yaml.collection-form")? {
            values.consume(node, at, |[text], _| Ok(text.len()))?;
        }
        Ok(())
    })
    .unwrap();
    routing.finish().unwrap();
    assert!(property.finish("yaml.collection-form").unwrap());
    assert_eq!(values.finish().unwrap().rows, [2, 3]);

    let mut left = nkdk_conversion_core::yaml::SequenceReader::<1, usize>::new(None, &[], false);
    let mut right = nkdk_conversion_core::yaml::SequenceReader::<1, usize>::new(None, &[], false);
    let mut left_nodes = Vec::new();
    let mut right_nodes = Vec::new();
    visit_nodes(b"[aa, bbb]", |node, at| {
        left_nodes.push((node, at));
        Ok(())
    })
    .unwrap();
    visit_nodes(b"[c, dddd]", |node, at| {
        right_nodes.push((node, at));
        Ok(())
    })
    .unwrap();
    for ((a, at), (b, bt)) in left_nodes.into_iter().zip(right_nodes) {
        left.consume(a, at, |[text], _| Ok(text.len())).unwrap();
        right.consume(b, bt, |[text], _| Ok(text.len())).unwrap();
    }
    assert_eq!(right.finish().unwrap().rows, [1, 4]);
    assert_eq!(left.finish().unwrap().rows, [2, 3]);

    use nkdk_conversion_core::yaml::{self, Source};
    let mut output = String::from("Before: preserved");
    yaml::append_properties(&mut output, |_| Ok(())).unwrap();
    assert_eq!(output, "Before: preserved");
    let error = yaml::append_properties(&mut output, |output| {
        output.push_str("Partial: value");
        Err(nkdk_conversion_core::RuntimeDiagnostic::new(
            "test.failed-write",
            "Cannot write property",
        ))
    });
    assert!(error.is_err());
    assert_eq!(output, "Before: preserved");
    assert!(yaml::append_encoded_properties(&mut output, &[255]).is_err());
    assert_eq!(output, "Before: preserved");
    yaml::append_encoded_properties(&mut output, b"After: value").unwrap();
    assert_eq!(output, "Before: preserved\nAfter: value");
    let mut row = String::from("  -\n");
    yaml::append_encoded_properties(&mut row, b"    Name: value").unwrap();
    assert_eq!(row, "  -\n    Name: value");
    let mut nested = String::from("Owner:\n");
    {
        let mut writer = yaml::Indented::new(&mut nested, "  ");
        writer.push_str("");
        writer.push_str("Имя:");
        writer.push(' ');
        writer.push_str("значение\n\nТекст");
        writer.push_str(":\n  en: Hello");
    }
    assert_eq!(nested, "Owner:\n  Имя: значение\n\n  Текст:\n    en: Hello");
    let partition = |source: &str| -> nkdk_conversion_core::Result<_> {
        let mut rows = None;
        let mut fields = Vec::new();
        yaml::visit_scalar_events(
            yaml::Events(|consume: &mut yaml::Consumer<'_>| {
                rows = yaml::text_sequence_events::<1, usize>(
                    yaml::PartitionSource {
                        source: yaml::DocumentSource(source.as_bytes()),
                        select: |key: &str| key == "Values",
                        sibling: consume,
                    },
                    "Values",
                    None,
                    &[],
                    false,
                    |[value], _| Ok(value.len()),
                )?;
                Ok(())
            }),
            |key, value, tag| {
                assert!(tag.is_none());
                fields.push((key, value.into_text()?));
                Ok(())
            },
        )?;
        Ok((rows.unwrap_or_default().rows, fields))
    };
    for source in [
        "Title: first\nValues: [aa, bbb, aa]\nEnd: last",
        "Values: [aa, bbb, aa]\nEnd: last\nTitle: first",
        "End: last\nTitle: first\nValues: [aa, bbb, aa]",
    ] {
        let (rows, mut fields) = partition(source).unwrap();
        assert_eq!(rows, [2, 3, 2]);
        fields.sort();
        assert_eq!(
            fields,
            [
                ("End".into(), "last".into()),
                ("Title".into(), "first".into())
            ]
        );
    }
    for source in [
        "Title: first\nTitle: repeated",
        "Values: [first]\nValues: [repeated]",
        "!invalid {}",
        "[one, two]",
        "1: value",
    ] {
        let error = partition(source);
        assert!(error.is_err(), "{source}");
    }
    // Even a routed empty mapping is a real mapping, not a missing event stream.
    let mut nodes = 0;
    yaml::PartitionSource {
        source: yaml::DocumentSource(b"{}"),
        select: |_: &str| false,
        sibling: |_, _| Ok(()),
    }
    .visit(|_, _| {
        nodes += 1;
        Ok(())
    })
    .unwrap();
    assert_eq!(nodes, 2);
    let mut consumed = 0;
    let result = nkdk_conversion_core::yaml::text_sequence_with::<1, ()>(
        b"Values: [first, stop, unreachable]",
        "Values",
        None,
        &[],
        false,
        |[value], _| {
            consumed += 1;
            if value == "stop" {
                return Err(nkdk_conversion_core::RuntimeDiagnostic::new(
                    "test.stop",
                    "Stop reading",
                ));
            }
            Ok(())
        },
    );
    assert_eq!(result.err().unwrap().code.as_deref(), Some("test.stop"));
    assert_eq!(consumed, 2);
}

#[test]
fn tagged_scalar_uses_the_rendered_property_name() {
    let mut yaml = String::from("  ПредставлениеПользовательскойНастройки: Текст");
    nkdk_conversion_core::yaml::tag_written_scalar(
        &mut yaml,
        0,
        Some("Представление: "),
        "!xml/string ",
    )
    .unwrap();
    assert_eq!(
        yaml,
        "  ПредставлениеПользовательскойНастройки: !xml/string Текст"
    );
    let mut quoted = String::from("  \"Представление: настройки\": Текст");
    nkdk_conversion_core::yaml::tag_written_scalar(
        &mut quoted,
        0,
        Some("Представление: "),
        "!xml/string ",
    )
    .unwrap();
    assert_eq!(quoted, "  \"Представление: настройки\": !xml/string Текст");
    let mut nested = String::from("Порядок:\n  ПредставлениеПользовательскойНастройки: Текст");
    nkdk_conversion_core::yaml::tag_written_scalar(
        &mut nested,
        0,
        Some("Представление: "),
        "!xml/string ",
    )
    .unwrap();
    assert_eq!(
        nested,
        "Порядок:\n  ПредставлениеПользовательскойНастройки: !xml/string Текст"
    );
}

#[test]
fn nested_scalar_readers_are_independent_and_preserve_presence() {
    use nkdk_conversion_core::yaml::ScalarRecordReader;
    let mut readers = [ScalarRecordReader::default(), ScalarRecordReader::default()];
    let events = [
        "Record: {Name: first}",
        "Record: {Name: !xml/invalid second}",
    ]
    .map(|text| {
        let mut events = Vec::new();
        visit_nodes(text.as_bytes(), |node, _| {
            events.push(node);
            Ok(())
        })
        .unwrap();
        events
    });
    let mut values = [Vec::new(), Vec::new()];
    let [a, b] = events;
    for (a, b) in a.into_iter().zip(b) {
        for ((reader, values), node) in readers.iter_mut().zip(&mut values).zip([a, b]) {
            if let Some(entry) = reader.consume(node, "Record").unwrap() {
                values.push((entry.key, entry.value.into_text().unwrap(), entry.tag));
            }
        }
    }
    for reader in readers.into_iter().rev() {
        assert!(reader.finish().unwrap());
    }
    assert_eq!(values[0], vec![("Name".into(), "first".into(), None)]);
    assert_eq!(
        values[1],
        vec![("Name".into(), "second".into(), Some("!xml/invalid".into()))]
    );
    for (source, present) in [("{}", false), ("Record: {}", true)] {
        let mut reader = ScalarRecordReader::default();
        visit_nodes(source.as_bytes(), |node, _| {
            reader.consume(node, "Record").map(|_| ())
        })
        .unwrap();
        assert_eq!(reader.finish().unwrap(), present);
    }
    for source in [
        "Record: {Name: a, Name: b}",
        "Record: []",
        "Record: {Name: {}}",
        "Record: !xml/invalid {}",
    ] {
        let mut reader = ScalarRecordReader::default();
        assert!(
            visit_nodes(source.as_bytes(), |node, _| reader
                .consume(node, "Record")
                .map(|_| ()))
            .is_err(),
            "{source}"
        );
    }
}
#[test]
fn preserved_annotated_sequence_member_can_be_read() {
    let source = "Значение:\n  - Истина\n  - !xml/raw\n    $значение: {}\n    $xml:\n      _{http://www.w3.org/2001/XMLSchema-instance}type: \"{http://www.w3.org/2001/XMLSchema}boolean\"\n      \"#text\": oops".as_bytes();
    let row =
        nkdk_conversion_core::yaml::preserved_sequence_item(source, Some("Значение"), 1).unwrap();
    assert!(String::from_utf8_lossy(&row).starts_with("!xml/raw"));
    let marked =
        "Rows: [!изменять {Name: first, Detail: !xml/raw {$xml: null}}, !xml/raw {$xml: null}]"
            .as_bytes();
    let normal = nkdk_conversion_core::yaml::preserved_marked_sequence_item(
        marked,
        Some("Rows"),
        0,
        Some("!изменять"),
    )
    .unwrap();
    let normal = String::from_utf8(normal).unwrap();
    assert!(!normal.contains("!изменять"));
    assert!(normal.contains("Detail: !xml/raw"));
    let raw = nkdk_conversion_core::yaml::preserved_marked_sequence_item(
        marked,
        Some("Rows"),
        1,
        Some("!изменять"),
    )
    .unwrap();
    assert!(String::from_utf8_lossy(&raw).starts_with("!xml/raw"));
    assert!(
        nkdk_conversion_core::yaml::preserved_marked_sequence_item(
            marked,
            Some("Rows"),
            0,
            Some("!проверять")
        )
        .is_err()
    );

    visit_nodes(source, |_, _| Ok(())).unwrap();
    nkdk_conversion_core::raw::Document::decode(&row)
        .unwrap()
        .unwrap();
}

#[test]
fn raw_collection_item_is_distinct_from_an_owner_envelope() {
    use nkdk_conversion_core::raw::Item;

    let payload = b"_type: boolean\n\"#text\": oops";
    let encoded = Item::encode(payload).unwrap();
    assert_eq!(Item::decode(&encoded).unwrap().unwrap().payload, payload);
    assert!(
        Item::decode("!xml/raw\n$значение: {}\n$xml:\n  _type: boolean".as_bytes())
            .unwrap()
            .is_none()
    );
}

#[test]
fn fact_projection_keeps_selected_fields_and_preserves_selected_duplicates() {
    use nkdk_conversion_core::yaml::{DocumentSource, Node, ProjectionSource, Source};
    fn scalar_texts(events: impl Source) -> Vec<String> {
        let mut texts = Vec::new();
        events
            .visit(|node, _| {
                if let Node::Scalar(value, _) = node {
                    texts.push(value.into_text()?);
                }
                Ok(())
            })
            .unwrap();
        texts
    }
    let keys: &[(usize, &[&str])] = &[(1, &["Rows"]), (3, &["Type"])];
    let source = b"Unrelated: {broken: [a, b]}\nCommands:\n  Full:\n    Synonym: \"\"\n    Items: [a,b]\n  Default: {Group: regular}\nRows:\n  Name:\n    Comment: {arbitrary: true}\n    Type: String\n    Type: Number\n";
    let texts = scalar_texts(ProjectionSource {
        source: DocumentSource(source),
        keys,
    });
    assert_eq!(texts, ["Rows", "Name", "Type", "String", "Type", "Number"]);

    use nkdk_conversion_core::yaml::{ProjectionShape, ShapedProjectionSource};
    for (rows, source) in [
        (
            ProjectionShape::Mapping(3),
            "Other: ignored\nRows:\n  A:\n    Type: String\n    Details: {Type: unrelated}\n    Children:\n      B:\n        Details: {Type: unrelated}\n        Type: Number\n        Type: Boolean\n",
        ),
        (
            ProjectionShape::Sequence(3),
            "Other: ignored\nRows:\n  - Type: String\n    Details: {Type: unrelated}\n    Children:\n      - Details: {Type: unrelated}\n        Type: Number\n        Type: Boolean\n",
        ),
    ] {
        let shapes = [
            ProjectionShape::Pass,
            ProjectionShape::Record(&[("Rows", 2)]),
            rows,
            ProjectionShape::Record(&[("Type", 0), ("Children", 2)]),
        ];
        let texts = scalar_texts(ShapedProjectionSource {
            source: DocumentSource(source.as_bytes()),
            shapes: &shapes,
            root: 1,
        });
        let expected = if matches!(rows, ProjectionShape::Mapping(_)) {
            vec![
                "Rows", "A", "Type", "String", "Children", "B", "Type", "Number", "Type", "Boolean",
            ]
        } else {
            vec![
                "Rows", "Type", "String", "Children", "Type", "Number", "Type", "Boolean",
            ]
        };
        assert_eq!(texts, expected);
    }
    let shapes = [
        ProjectionShape::Pass,
        ProjectionShape::Record(&[("Rows", 2)]),
        ProjectionShape::Mapping(3),
        ProjectionShape::Record(&[("Type", 0)]),
    ];
    let texts = scalar_texts(ShapedProjectionSource {
        source: DocumentSource(b"Rows:\n  A: !xml/raw\n    $value: {Type: Number, Extra: keep}\n    $xml: {opaque: keep}\n"),
        shapes: &shapes,
        root: 1,
    });
    assert_eq!(
        texts,
        [
            "Rows", "A", "$value", "Type", "Number", "Extra", "keep", "$xml", "opaque", "keep"
        ]
    );
    let texts = scalar_texts(ShapedProjectionSource {
        source: DocumentSource("Rows: !xml/raw\n  $значение:\n    A: {Type: Number, Extra: discard}\n  $xml: {opaque: keep, Extra: keep}\n".as_bytes()),
        shapes: &shapes,
        root: 1,
    });
    assert_eq!(
        texts,
        [
            "Rows",
            "$значение",
            "A",
            "Type",
            "Number",
            "$xml",
            "opaque",
            "keep",
            "Extra",
            "keep"
        ]
    );
    assert!(
        ShapedProjectionSource {
            source: DocumentSource(b"{}"),
            shapes: &shapes,
            root: 99,
        }
        .visit(|_, _| Ok(()))
        .is_err()
    );
}

#[test]
fn semantic_tag_wraps_each_root_shape_without_rewriting_nested_contents() {
    use nkdk_conversion_core::yaml::{Node, tag_written_value};
    for (prefix, source, property, expected) in [
        (
            "Before: x",
            "\nField: x",
            Some("Field: "),
            "Before: x\nField: !проверять x",
        ),
        (
            "Parent:",
            "\n  Other:\n    - x\n    - y",
            Some("Field: "),
            "Parent:\n  Other: !проверять\n    - x\n    - y",
        ),
        ("", "\n  - x\n  - y", None, "\n  !проверять\n  - x\n  - y"),
    ] {
        let mut output = prefix.to_owned();
        let start = output.len();
        output.push_str(source);
        tag_written_value(&mut output, start, property, "!проверять").unwrap();
        assert_eq!(output, expected);
        visit_nodes(output.as_bytes(), |_, _| Ok(())).unwrap();
    }
    for (source, expected) in [
        ("!проверять\nValue: x", Some(("!проверять", "Value: x"))),
        ("!xml/raw\n$value: x", Some(("!xml/raw", "$value: x"))),
        ("!tag text\nValue: x", None),
        ("Value: x", None),
    ] {
        assert_eq!(nkdk_conversion_core::yaml::tagged_block(source), expected);
    }
    for source in [
        "Name: x\nNested: !inner [one, two]\n",
        "- x\n- y\n",
        "\"x:y\"",
        "{}",
        "[]",
    ] {
        let mut output = source.to_owned();
        tag_written_value(&mut output, 0, None, "!проверять").unwrap();
        let mut first = true;
        visit_nodes(output.as_bytes(), |node, _| {
            if first {
                let tag = match node {
                    Node::Scalar(_, tag) | Node::MappingStart(tag) | Node::SequenceStart(tag) => {
                        tag
                    }
                    _ => panic!("value starts with its node"),
                };
                assert_eq!(tag.as_deref(), Some("!проверять"));
                first = false;
            }
            Ok(())
        })
        .unwrap();
        assert!(!first);
        assert!(output.ends_with(source));
    }
}

#[test]
fn sequence_item_marks_keep_nested_tags_positions_and_xml_envelopes() {
    use nkdk_conversion_core::yaml::ItemTags;
    for source in [
        "- !mode {key: !inner value}\n- !mode tail",
        "!mode single",
        "- !xml/invalid {value: saved}",
        "!xml/invalid [!mode x]",
        "[]",
    ] {
        let mut marks = ItemTags::new("!mode");
        visit_nodes(source.as_bytes(), |node, position| {
            let nested = matches!(&node,Node::Scalar(_,Some(tag)) if tag=="!inner");
            let raw = matches!(&node,Node::MappingStart(Some(tag)) if tag=="!xml/invalid");
            let node = marks.consume(node)?;
            if let Node::Scalar(value, tag) = &node {
                let expected = position.apply(
                    &[],
                    nkdk_conversion_core::RuntimeDiagnostic::new("test", "position"),
                );
                let observed = value.position().apply(
                    &[],
                    nkdk_conversion_core::RuntimeDiagnostic::new("test", "position"),
                );
                assert_eq!(
                    (observed.line, observed.column),
                    (expected.line, expected.column)
                );
                assert!(value.annotation().is_none());
                assert_eq!(tag.as_deref(), nested.then_some("!inner"));
            }
            if raw {
                assert!(matches!(node,Node::MappingStart(Some(tag)) if tag=="!xml/invalid"));
            }
            Ok(())
        })
        .unwrap();
    }
    for source in ["- ordinary", "- !wrong value"] {
        let mut marks = ItemTags::new("!mode");
        let error =
            visit_nodes(source.as_bytes(), |node, _| marks.consume(node).map(|_| ())).unwrap_err();
        assert_eq!(error.code.as_deref(), Some("yaml.item-tag"));
    }
}

#[test]
fn grouped_stream_keeps_first_group_order_empty_states_and_nested_marks() {
    use nkdk_conversion_core::yaml::GroupRouter;
    let mut router = GroupRouter::new([None, Some("!check"), Some("!change")]);
    let mut values = Vec::new();
    visit_nodes(
        b"[!change one, normal, !change two, !check three]",
        |node, position| {
            router.consume(node, position, |group, node, _| {
                match node {
                    Node::Scalar(value, tag) => {
                        assert!(tag.is_none());
                        values.push((group, value.into_text()?));
                    }
                    Node::SequenceStart(tag) => {
                        assert!(tag.is_none());
                        values.push((group, "start".into()));
                    }
                    Node::SequenceEnd => values.push((group, "end".into())),
                    _ => panic!("Unexpected scalar group payload"),
                }
                Ok(())
            })
        },
    )
    .unwrap();
    assert_eq!(router.finish().unwrap(), [2, 0, 1]);
    assert_eq!(
        values,
        [
            (2, "start".into()),
            (2, "one".into()),
            (0, "start".into()),
            (0, "normal".into()),
            (2, "two".into()),
            (1, "start".into()),
            (1, "three".into()),
            (2, "end".into()),
            (0, "end".into()),
            (1, "end".into())
        ]
    );
    for (source, order) in [("[]", vec![]), ("[[]]", vec![0]), ("[!change []]", vec![2])] {
        let mut router = GroupRouter::new([None, Some("!check"), Some("!change")]);
        let mut boundaries = 0;
        visit_nodes(source.as_bytes(), |node, position| {
            router.consume(node, position, |_, node, _| {
                assert!(matches!(
                    node,
                    Node::SequenceStart(None) | Node::SequenceEnd
                ));
                boundaries += 1;
                Ok(())
            })
        })
        .unwrap();
        assert_eq!(router.finish().unwrap(), order);
        assert_eq!(boundaries, 2 * order.len());
    }
    let mut router = GroupRouter::new([None, Some("!change")]);
    let mut nested = Vec::new();
    visit_nodes(b"- !change\n  key: !inner value", |node, position| {
        router.consume(node, position, |_, node, _| {
            if let Node::Scalar(value, tag) = node {
                nested.push((value.into_text()?, tag));
            }
            Ok(())
        })
    })
    .unwrap();
    assert_eq!(router.finish().unwrap(), [1]);
    assert_eq!(
        nested,
        [
            ("key".into(), None),
            ("value".into(), Some("!inner".into()))
        ]
    );
    for source in [
        "plain",
        "[!unknown value]",
        "[[not-empty]]",
        "[[], text]",
        "[text, []]",
        "[[], []]",
        "[!xml/raw {a: b}]",
    ] {
        let mut router = GroupRouter::new([None, Some("!change")]);
        let error = visit_nodes(source.as_bytes(), |node, position| {
            router.consume(node, position, |_, _, _| Ok(()))
        })
        .unwrap_err();
        assert_eq!(error.code.as_deref(), Some("yaml.group-sequence"));
    }
    let mut incomplete = GroupRouter::new([None]);
    incomplete
        .consume(Node::SequenceStart(None), Default::default(), |_, _, _| {
            Ok(())
        })
        .unwrap();
    assert_eq!(
        incomplete.finish().unwrap_err().code.as_deref(),
        Some("yaml.group-sequence")
    );
}

#[test]
fn empty_mapping_source_matches_parser_events_and_propagates_consumer_failure() {
    use nkdk_conversion_core::yaml::{EmptyMappingSource, Source};
    let form = |node| match node {
        Node::MappingStart(None) => "start",
        Node::MappingEnd => "end",
        _ => "unexpected",
    };
    let mut parsed = Vec::new();
    visit_nodes(b"{}", |node, _| {
        parsed.push(form(node));
        Ok(())
    })
    .unwrap();
    let mut direct = Vec::new();
    EmptyMappingSource
        .visit(|node, _| {
            direct.push(form(node));
            Ok(())
        })
        .unwrap();
    assert_eq!(direct, ["start", "end"]);
    assert_eq!(direct, parsed);
    let mut calls = 0;
    let error = EmptyMappingSource
        .visit(|_, _| {
            calls += 1;
            Err(nkdk_conversion_core::RuntimeDiagnostic::new(
                "consumer.failed",
                "stop",
            ))
        })
        .unwrap_err();
    assert_eq!(calls, 1);
    assert_eq!(error.code.as_deref(), Some("consumer.failed"));
}

#[test]
fn exceptional_singleton_item_keeps_its_envelope_and_strips_only_its_item_mark() {
    use nkdk_conversion_core::yaml::{preserved_sequence_item, preserved_singleton_item};
    let source = "Entries: !xml/raw\n  $значение: {Key: first}\n  $xml: {extra: kept}".as_bytes();
    let bytes = preserved_singleton_item(source, Some("Entries"), 0, Some("!изменять")).unwrap();
    assert!(std::str::from_utf8(&bytes).unwrap().starts_with("!xml/raw"));
    assert!(preserved_sequence_item(source, Some("Entries"), 0).is_err());
    assert!(preserved_singleton_item(source, Some("Entries"), 1, None).is_err());
    let marked = "Entries: !изменять {Key: first}".as_bytes();
    let bytes = preserved_singleton_item(marked, Some("Entries"), 0, Some("!изменять")).unwrap();
    assert!(!std::str::from_utf8(&bytes).unwrap().contains("!изменять"));
}
#[test]
fn exceptional_value_recovery_uses_its_stream_position() {
    use nkdk_conversion_core::yaml::{Node, preserved_value_at, visit_nodes};
    let source = b"Outer:\n  First:\n    Value: !xml/raw\n      $xml: {Text: kept}\n  Second:\n    Value: 2\n";
    let mut position = None;
    let mut scalar_position = None;
    visit_nodes(source, |node, at| {
        if matches!(node, Node::MappingStart(Some(ref tag)) if tag == "!xml/raw") {
            position = Some(at);
        }
        if matches!(node, Node::Scalar(ref value, _) if value.lexical_text() == "2") {
            scalar_position = Some(at);
        }
        Ok(())
    })
    .unwrap();
    let recovered = preserved_value_at(source, position.unwrap()).unwrap();
    let recovered = String::from_utf8(recovered).unwrap();
    assert!(recovered.starts_with("!xml/raw"), "{recovered}");
    assert!(recovered.contains("Text: kept"), "{recovered}");
    assert!(!recovered.contains("Second"), "{recovered}");
    assert_eq!(
        preserved_value_at(source, scalar_position.unwrap()).unwrap(),
        b"2"
    );
    assert!(preserved_value_at(source, nkdk_conversion_core::Position::yaml(999, 1)).is_err());
}

#[test]
fn mapping_fallback_waits_for_keys_and_keeps_all_events() {
    use nkdk_conversion_core::yaml::{ChoiceReader, ChoiceSelection, ChoiceSelector};
    static SELECTORS: &[ChoiceSelector] = &[ChoiceSelector::Mapping {
        variant: 0,
        key: "Вид",
        value: None,
    }];
    for (source, expected) in [
        ("{}", 1),
        ("Сосед: x\nВид: Группа", 0),
        ("Сосед: [one, two]", 1),
    ] {
        for keep_events in [true, false] {
            let mut reader = ChoiceReader::new(SELECTORS).with_mapping_fallback(1);
            if !keep_events {
                reader = reader.without_event_buffer();
            }
            let mut selected = None;
            visit_nodes(source.as_bytes(), |node, position| {
                if selected.is_none()
                    && let ChoiceSelection::Selected { variant, events } =
                        reader.consume(node, position)?
                {
                    assert_eq!(!events.is_empty(), keep_events);
                    selected = Some(variant);
                }
                Ok(())
            })
            .unwrap();
            assert_eq!(selected, Some(expected));
        }
    }
}
