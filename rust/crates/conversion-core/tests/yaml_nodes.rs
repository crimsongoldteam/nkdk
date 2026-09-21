use nkdk_conversion_core::yaml::{Node, visit_nodes};

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
