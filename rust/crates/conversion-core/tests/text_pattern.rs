use nkdk_conversion_core::text_pattern::{Part, Pattern, PatternError, Sequence};

#[test]
fn text_sequences_keep_complete_borrowed_rows_and_reject_ambiguous_printing() {
    let plan = Sequence::<2>::new(".").unwrap();
    let mut stream = plan.rows("kind.name.extra", 10, 1024).unwrap();
    assert_eq!(stream.next(), Some(Ok(["kind", "name"])));
    assert!(matches!(
        stream.next(),
        Some(Err(PatternError::Input { .. }))
    ));
    assert_eq!(stream.next(), None);
    let mut limited = plan.rows("a.b.c.d", 1, 1024).unwrap();
    assert_eq!(limited.next(), Some(Ok(["a", "b"])));
    assert_eq!(limited.next(), Some(Err(PatternError::Budget)));
    assert_eq!(limited.next(), None);
    for source in [
        "",
        "kind.name",
        "kind.name.kind.other",
        ".",
        "kind..kind.name",
    ] {
        let rows = plan.parse(source, 10, 1024).unwrap();
        for value in rows.iter().flatten() {
            let offset = value.as_ptr() as usize - source.as_ptr() as usize;
            assert!(offset <= source.len() && offset + value.len() <= source.len());
        }
        let mut output = String::from("prefix:");
        plan.write(&rows, &mut output, 10, 1024).unwrap();
        assert_eq!(&output[7..], source);
    }
    for (separator, source, expected) in [
        (".", "kind..other.name", vec!["kind.", "other.name"]),
        ("::", "вид::имя::другой::", vec!["вид::имя", "другой::"]),
        (".", "", vec![]),
    ] {
        let sequence = Sequence::<2>::new(separator).unwrap();
        let rows = sequence
            .rows_with_text(source, 10, 1024)
            .unwrap()
            .collect::<Result<Vec<_>, _>>()
            .unwrap();
        assert_eq!(
            rows.iter().map(|row| row.text).collect::<Vec<_>>(),
            expected
        );
        for row in rows {
            let offset = row.text.as_ptr() as usize - source.as_ptr() as usize;
            assert_eq!(source.get(offset..offset + row.text.len()), Some(row.text));
            assert_eq!(row.cells[0].as_ptr(), row.text.as_ptr());
        }
    }
    let mut ranged = plan.rows_with_text("kind.name.extra", 10, 1024).unwrap();
    assert_eq!(ranged.next().unwrap().unwrap().text, "kind.name");
    assert!(matches!(
        ranged.next(),
        Some(Err(PatternError::Input { .. }))
    ));
    assert!(ranged.next().is_none());
    assert!(plan.parse("kind.name.extra", 10, 1024).is_err());
    assert_eq!(plan.parse("kind.name", 0, 1024), Err(PatternError::Budget));
    assert_eq!(plan.parse("kind.name", 10, 2), Err(PatternError::Budget));
    assert!(Sequence::<0>::new(".").is_err());
    assert!(Sequence::<2>::new("").is_err());
    let mut output = String::from("keep");
    for (separator, rows) in [
        (".", vec![["kind", "a.b"]]),
        ("aba", vec![["ab", "tail"]]),
        ("яя", vec![["я", "tail"]]),
    ] {
        assert_eq!(
            Sequence::<2>::new(separator)
                .unwrap()
                .write(&rows, &mut output, 10, 1024),
            Err(PatternError::AmbiguousValue)
        );
        assert_eq!(output, "keep");
    }
    assert_eq!(
        Sequence::<1>::new(".")
            .unwrap()
            .write(&[[""]], &mut output, 10, 1024),
        Err(PatternError::AmbiguousValue)
    );
    assert_eq!(
        plan.write(&[["kind", "name"]], &mut output, 0, 1024),
        Err(PatternError::Budget)
    );
    assert_eq!(
        plan.write(&[["kind", "name"]], &mut output, 10, 2),
        Err(PatternError::Budget)
    );
    assert_eq!(output, "keep");
    for source in [
        "root.owner",
        "root.owner.kind.name",
        "root.owner..",
        "...x",
        ".",
    ] {
        let (head, rows) = plan.rows_with_head::<2>(source, 10, 1024).unwrap();
        let rows = rows.collect::<Result<Vec<_>, _>>().unwrap();
        let mut restored = String::new();
        plan.write_with_head(&head, &rows, &mut restored, 10, 1024)
            .unwrap();
        assert_eq!(restored, source);
    }
    for (source, expected) in [
        ("root.owner", vec![]),
        ("root.owner.kind.name", vec!["kind.name"]),
        ("root.owner..", vec!["."]),
    ] {
        let (head, rows) = plan.rows_with_head_text::<2>(source, 10, 1024).unwrap();
        assert_eq!(head, ["root", "owner"]);
        assert_eq!(
            rows.map(|row| row.unwrap().text).collect::<Vec<_>>(),
            expected
        );
    }
    assert!(plan.rows_with_head::<2>("root", 10, 1024).is_err());
    let (_, rows) = plan.rows_with_head::<2>("root.owner.", 10, 1024).unwrap();
    assert!(rows.collect::<Result<Vec<_>, _>>().is_err());
    let single = Sequence::<1>::new(".").unwrap();
    for (source, expected) in [("root", vec![]), ("root.", vec![[""]])] {
        let (head, rows) = single.rows_with_head::<1>(source, 10, 1024).unwrap();
        let rows = rows.collect::<Result<Vec<_>, _>>().unwrap();
        assert_eq!(rows, expected);
        let mut restored = String::new();
        single
            .write_with_head(&head, &rows, &mut restored, 10, 1024)
            .unwrap();
        assert_eq!(restored, source);
    }
    assert_eq!(
        plan.write_with_head(
            &["root", "owner"],
            &[["kind", "a.b"]],
            &mut output,
            10,
            1024
        ),
        Err(PatternError::AmbiguousValue)
    );
    assert_eq!(output, "keep");
    assert!(plan.rows_with_head::<0>("", 10, 1024).is_err());
    assert!(plan.rows_with_head::<2>("root.owner", 10, 2).is_err());
    let (_, rows) = plan.rows_with_head::<2>("root.owner.a.b", 0, 1024).unwrap();
    assert_eq!(
        rows.collect::<Result<Vec<_>, _>>(),
        Err(PatternError::Budget)
    );
    assert_eq!(
        plan.write_with_head(&["root", "owner"], &[], &mut output, 10, 2),
        Err(PatternError::Budget)
    );
    assert_eq!(output, "keep");
    for separator in ["a", "aa", "aba", "яя"] {
        let plan = Sequence::<2>::new(separator).unwrap();
        for length in 0..=6 {
            for mut encoded in 0..3usize.pow(length) {
                let source: String = (0..length)
                    .map(|_| {
                        let value = ['a', 'b', 'я'][encoded % 3];
                        encoded /= 3;
                        value
                    })
                    .collect();
                if let Ok(rows) = plan.parse(&source, 32, 1024) {
                    let mut restored = String::new();
                    plan.write(&rows, &mut restored, 32, 1024).unwrap();
                    assert_eq!(restored, source, "separator {separator}");
                }
                if let Ok((head, rows)) = plan.rows_with_head::<2>(&source, 32, 1024)
                    && let Ok(rows) = rows.collect::<Result<Vec<_>, _>>()
                {
                    let mut restored = String::new();
                    plan.write_with_head(&head, &rows, &mut restored, 32, 1024)
                        .unwrap();
                    assert_eq!(restored, source, "head separator {separator}");
                }
            }
        }
    }
}

#[test]
fn fixed_text_patterns_borrow_slots_and_print_reversibly_without_backtracking() {
    for separator in [".", "::", "яя", "aba"] {
        let parts = [
            Part::Cell(0, separator),
            Part::Literal(separator),
            Part::Cell(1, separator),
        ];
        let plan = Pattern::<2>::new(&parts).unwrap();
        for cells in [["first", "second"], ["", ""], ["имён", "tail"]] {
            let text = format!("{}{separator}{}", cells[0], cells[1]);
            assert_eq!(plan.parse(&text).unwrap(), cells);
            let mut output = String::new();
            plan.write(&cells, &mut output, 1024).unwrap();
            assert_eq!(output, text);
            assert!(plan.parse(&format!("{text}{separator}extra")).is_err());
        }
        let mut output = String::from("unchanged");
        assert!(
            plan.write(
                &["first", &format!("tail{separator}extra")],
                &mut output,
                1024
            )
            .is_err()
        );
        assert_eq!(output, "unchanged");
    }
    let parts = [
        Part::Cell(0, "aa"),
        Part::Literal("aa"),
        Part::Cell(1, "aa"),
    ];
    let cells = Pattern::<2>::new(&parts).unwrap();
    assert!(cells.check_values(&["a", "tail"]).is_err());
    assert_eq!(cells.parse("aaa").unwrap(), ["", "a"]);
    assert!(Pattern::<1>::new(&[Part::Cell(0, "")]).is_err());
    let xml = Pattern::<2>::new(&[Part::Slot(0), Part::Literal("/"), Part::Slot(1)]).unwrap();
    let yaml = Pattern::<2>::new(&[
        Part::Literal("["),
        Part::Slot(1),
        Part::Literal("] "),
        Part::Slot(0),
    ])
    .unwrap();
    for (source, expected) in [("urn:Tree/Лист", "[Лист] urn:Tree"), ("/", "[] ")] {
        let fields = xml.parse(source).unwrap();
        assert!(fields.iter().all(|field| {
            let offset = field.as_ptr() as usize - source.as_ptr() as usize;
            offset <= source.len() && offset + field.len() <= source.len()
        }));
        let mut output = String::from("prefix:");
        yaml.write(&fields, &mut output, expected.len()).unwrap();
        assert_eq!(&output[7..], expected);
        assert_eq!(yaml.parse(expected).unwrap(), fields);
        let mut restored = String::new();
        xml.write(&fields, &mut restored, 128).unwrap();
        assert_eq!(restored, source);
    }
    for parts in [
        vec![Part::Slot(0), Part::Slot(1)],
        vec![Part::Slot(0), Part::Literal("/"), Part::Slot(0)],
        vec![Part::Slot(2)],
        vec![Part::Slot(0)],
        vec![Part::Slot(0), Part::Literal(""), Part::Slot(1)],
    ] {
        assert!(Pattern::<2>::new(&parts).is_err());
    }
    for input in ["Tree", "[Leaf]", "[Leaf! Tree", "x[Leaf] Tree"] {
        assert!(yaml.parse(input).is_err());
    }
    let overlapping =
        Pattern::<2>::new(&[Part::Slot(0), Part::Literal("aba"), Part::Slot(1)]).unwrap();
    assert_eq!(
        overlapping.check_values(&["ab", "tail"]),
        Err(PatternError::AmbiguousValue)
    );
    assert!(overlapping.check_values(&["safe", "tail"]).is_ok());
    for (separator, value, valid) in [
        ("яя", "я", false),
        ("яя", "a", true),
        ("aba", "insideaba", false),
        ("abacaba", "abac", false),
    ] {
        let parts = [Part::Slot(0), Part::Literal(separator), Part::Slot(1)];
        let plan = Pattern::<2>::new(&parts).unwrap();
        assert_eq!(plan.check_values(&[value, "tail"]).is_ok(), valid);
    }
    let mut output = String::from("keep");
    assert!(matches!(
        overlapping.write(&["ab", "tail"], &mut output, 128),
        Err(PatternError::AmbiguousValue)
    ));
    assert_eq!(
        output, "keep",
        "Rejected output must not alter the caller's buffer"
    );
    assert_eq!(
        yaml.write(&["root", "leaf"], &mut output, 2),
        Err(PatternError::Budget)
    );
    assert_eq!(output, "keep");
}

#[test]
fn optional_text_groups_restore_absent_slots_and_preserve_boundaries() {
    use nkdk_conversion_core::text_pattern::{OptionalPart as O, OptionalPattern};
    let mut plan = OptionalPattern::<3>::new(&[
        O::Slot(0),
        O::Optional(1, &[O::Literal("("), O::Slot(1), O::Literal(")")]),
        O::Optional(2, &[O::Literal("#"), O::Slot(2)]),
    ])
    .unwrap();
    for (source, expected, active) in [
        ("alpha", [Some("alpha"), None, None], [false, false, false]),
        (
            "alpha(9007199254740993)",
            [Some("alpha"), Some("9007199254740993"), None],
            [false, true, false],
        ),
        (
            "alpha#tail",
            [Some("alpha"), None, Some("tail")],
            [false, false, true],
        ),
        (
            "alpha(2)#tail",
            [Some("alpha"), Some("2"), Some("tail")],
            [false, true, true],
        ),
        (
            "я(2)#х\nв",
            [Some("я"), Some("2"), Some("х\nв")],
            [false, true, true],
        ),
    ] {
        let slots = plan.parse(source).unwrap();
        assert_eq!(slots, expected);
        for value in slots.into_iter().flatten() {
            assert!(
                (source.as_ptr() as usize..=source.as_ptr() as usize + source.len())
                    .contains(&(value.as_ptr() as usize))
            );
        }
        let mut output = "keep:".to_owned();
        plan.write(&expected, &active, &mut output, 1024).unwrap();
        assert_eq!(&output[5..], source);
    }
    let mut output = "keep".to_owned();
    assert_eq!(
        plan.write(
            &[Some("alpha(2)"), None, None],
            &[false; 3],
            &mut output,
            1024
        ),
        Err(PatternError::AmbiguousValue)
    );
    assert_eq!(output, "keep");
    assert_eq!(
        plan.write(&[Some("alpha"), None, None], &[false; 3], &mut output, 2),
        Err(PatternError::Budget)
    );
    assert_eq!(output, "keep");
    assert!(
        OptionalPattern::<3>::new(&[
            O::Slot(0),
            O::Optional(1, &[O::Literal("("), O::Slot(1), O::Literal(")")]),
            O::Optional(2, &[O::Literal("("), O::Slot(2), O::Literal(")")])
        ])
        .is_err()
    );
    let mut nested = OptionalPattern::<3>::new(&[
        O::Slot(0),
        O::Optional(
            1,
            &[
                O::Literal("("),
                O::Slot(1),
                O::Optional(2, &[O::Literal("#"), O::Slot(2)]),
                O::Literal(")"),
            ],
        ),
    ])
    .unwrap();
    for (source, values, active) in [
        ("alpha", [Some("alpha"), None, None], [false, false, false]),
        (
            "alpha(2)",
            [Some("alpha"), Some("2"), None],
            [false, true, false],
        ),
        (
            "alpha(2#tail)",
            [Some("alpha"), Some("2"), Some("tail")],
            [false, true, true],
        ),
    ] {
        assert_eq!(nested.parse(source).unwrap(), values);
        let mut output = String::new();
        nested.write(&values, &active, &mut output, 1024).unwrap();
        assert_eq!(output, source);
    }
    assert!(OptionalPattern::<1>::new(&[O::Slot(0), O::Slot(0)]).is_err());
    assert!(OptionalPattern::<1>::new(&[O::Slot(0), O::Optional(1, &[O::Literal("x")])]).is_err());
}

#[test]
fn optional_leading_slots_use_a_closing_literal_to_distinguish_full_and_short_text() {
    use nkdk_conversion_core::text_pattern::{OptionalPart as O, OptionalPattern, PatternError};
    let mut plan = OptionalPattern::<3>::new(&[
        O::Optional(
            1,
            &[
                O::Slot(0),
                O::Literal("."),
                O::Slot(1),
                O::Literal(".Форма."),
            ],
        ),
        O::Slot(2),
    ])
    .unwrap();
    for (source, values, active) in [
        ("ФормаВыбора", [None, None, Some("ФормаВыбора")], [false; 3]),
        (
            "Справочник.Товары.Форма.ФормаВыбора",
            [Some("Справочник"), Some("Товары"), Some("ФормаВыбора")],
            [false, true, false],
        ),
    ] {
        assert_eq!(plan.parse(source).unwrap(), values);
        let mut rendered = String::new();
        plan.write(&values, &active, &mut rendered, 1024).unwrap();
        assert_eq!(rendered, source);
    }
    let mut rendered = String::new();
    assert_eq!(
        plan.write(
            &[None, None, Some("Справочник.Товары.Форма.ФормаВыбора")],
            &[false; 3],
            &mut rendered,
            1024
        ),
        Err(PatternError::AmbiguousValue)
    );
}

#[test]
fn variable_width_rows_borrow_complete_records_and_check_budgets() {
    use nkdk_conversion_core::text_pattern::{PatternError, Sequence};
    let plan = Sequence::<2>::new(".").unwrap();
    let width = |kind: &str| match kind {
        "Pair" => Ok(2),
        "Stop" => Ok(1),
        _ => Err(PatternError::Input { offset: 0 }),
    };
    let rows = plan
        .rows_variable("Pair.имя.Stop.Pair.Stop", 3, 100, width)
        .unwrap()
        .map(Result::unwrap)
        .collect::<Vec<_>>();
    assert_eq!(
        rows.iter().map(|row| row.text).collect::<Vec<_>>(),
        ["Pair.имя", "Stop", "Pair.Stop"]
    );
    assert_eq!(rows[1].cells, ["Stop", ""]);
    for source in ["Pair", "Stop.", "Unknown.name"] {
        assert!(
            plan.rows_variable(source, 3, 100, width)
                .unwrap()
                .collect::<Result<Vec<_>, _>>()
                .is_err()
        );
    }
    assert!(
        plan.rows_variable("Stop.Stop", 1, 100, width)
            .unwrap()
            .collect::<Result<Vec<_>, _>>()
            .is_err()
    );
    assert!(plan.rows_variable("Stop", 1, 1, width).is_err());
    assert_eq!(plan.rows_variable("", 0, 0, width).unwrap().count(), 0);
    let (head, rows) = plan
        .rows_with_head_variable::<2, _>("Root.Name.Pair.Stop.Stop", 2, 100, width)
        .unwrap();
    assert_eq!(head, ["Root", "Name"]);
    assert_eq!(rows.collect::<Result<Vec<_>, _>>().unwrap().len(), 2);
    let (_, rows) = plan
        .rows_with_head_variable::<2, _>("Root.Name", 0, 100, width)
        .unwrap();
    assert_eq!(rows.count(), 0);
    assert!(
        plan.rows_with_head_variable::<2, _>("Root", 2, 100, width)
            .is_err()
    );
    for invalid_width in [0, 3] {
        assert!(
            plan.rows_variable("Stop", 1, 100, |_| Ok(invalid_width))
                .unwrap()
                .next()
                .unwrap()
                .is_err()
        );
    }
}
