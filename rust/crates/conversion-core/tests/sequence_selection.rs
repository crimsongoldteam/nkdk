use nkdk_conversion_core::sequence_pattern::{Selection, select_matching, select_unique};

#[test]
fn selection_preserves_occurrences_order_and_borrowed_values() {
    type Row = (&'static str, &'static str);
    struct Case {
        rows: Vec<Row>,
        selection: Selection,
        remaining: Vec<Row>,
        selected: Option<Row>,
    }
    let left = ("neighbor", "first");
    let right = ("neighbor", "last");
    let selected = ("selected", "Notify");
    let duplicate = ("selected", "Control");
    for case in [
        Case {
            rows: vec![],
            selection: Selection::Missing,
            remaining: vec![],
            selected: None,
        },
        Case {
            rows: vec![left, right],
            selection: Selection::Missing,
            remaining: vec![left, right],
            selected: None,
        },
        Case {
            rows: vec![selected, left, right],
            selection: Selection::Unique(0),
            remaining: vec![left, right],
            selected: Some(selected),
        },
        Case {
            rows: vec![left, selected, right],
            selection: Selection::Unique(1),
            remaining: vec![left, right],
            selected: Some(selected),
        },
        Case {
            rows: vec![left, right, selected],
            selection: Selection::Unique(2),
            remaining: vec![left, right],
            selected: Some(selected),
        },
        Case {
            rows: vec![left, selected, duplicate, right],
            selection: Selection::Ambiguous,
            remaining: vec![left, selected, duplicate, right],
            selected: None,
        },
        Case {
            rows: vec![selected, left, selected, right],
            selection: Selection::Ambiguous,
            remaining: vec![selected, left, selected, right],
            selected: None,
        },
    ] {
        let rows: Vec<_> = case
            .rows
            .iter()
            .map(|(key, value)| (key.to_string(), value.to_string()))
            .collect();
        let view = select_unique(&rows, |row| row.0 == "selected");
        let meaning = |row: &(String, String)| (row.0.clone(), row.1.clone());
        let expected = |items: &[Row]| {
            items
                .iter()
                .map(|(key, value)| (key.to_string(), value.to_string()))
                .collect::<Vec<_>>()
        };
        assert_eq!(view.selection(), case.selection);
        assert_eq!(
            view.remaining().map(meaning).collect::<Vec<_>>(),
            expected(&case.remaining)
        );
        assert_eq!(
            view.original().map(meaning).collect::<Vec<_>>(),
            expected(&case.rows)
        );
        assert_eq!(
            view.selected().map(meaning),
            case.selected
                .map(|(key, value)| (key.to_string(), value.to_string()))
        );
        for row in view.remaining().chain(view.selected()) {
            assert!(rows.iter().any(|original| std::ptr::eq(row, original)));
        }
        let allocation = rows.as_ptr();
        let text_addresses: Vec<_> = rows
            .iter()
            .map(|row| (row.0.as_ptr(), row.1.as_ptr()))
            .collect();
        let restored = match case.selection.extract(rows) {
            Ok(extracted) => {
                assert_ne!(case.selection, Selection::Ambiguous);
                assert_eq!(extracted.remaining(), expected(&case.remaining));
                assert_eq!(
                    extracted.selected().map(meaning),
                    case.selected.map(|(a, b)| (a.to_string(), b.to_string()))
                );
                extracted.restore()
            }
            Err(original) => {
                assert_eq!(case.selection, Selection::Ambiguous);
                original
            }
        };
        assert_eq!(restored, expected(&case.rows));
        assert_eq!(restored.as_ptr(), allocation);
        assert_eq!(
            restored
                .iter()
                .map(|row| (row.0.as_ptr(), row.1.as_ptr()))
                .collect::<Vec<_>>(),
            text_addresses
        );
    }
}

#[test]
fn matching_propagates_errors_and_stops_when_uniqueness_is_impossible() {
    assert_eq!(select_matching([Ok(false), Err("bad")]), Err("bad"));
    let mut visited = 0;
    let result = select_matching(
        [Ok(true), Ok(true), Err("unneeded")]
            .into_iter()
            .inspect(|_| visited += 1),
    );
    assert_eq!(result, Ok(Selection::Ambiguous));
    assert_eq!(visited, 2);
    for (input, expected) in [
        (vec![], Selection::Missing),
        (vec![false, false], Selection::Missing),
        (vec![false, true, false], Selection::Unique(1)),
    ] {
        assert_eq!(
            select_matching(input.into_iter().map(Ok::<_, ()>)),
            Ok(expected)
        );
    }
}

#[test]
fn extraction_moves_nonclone_values_and_rejects_invalid_positions_losslessly() {
    #[derive(Debug, PartialEq)]
    struct Item(u32);
    for selection in [
        Selection::Unique(2),
        Selection::Unique(usize::MAX),
        Selection::Ambiguous,
    ] {
        let rows = vec![Item(1), Item(2)];
        let pointer = rows.as_ptr();
        let Err(original) = selection.extract(rows) else {
            panic!("Invalid selection was consumed")
        };
        assert_eq!(original, vec![Item(1), Item(2)]);
        assert_eq!(original.as_ptr(), pointer);
    }
    let mut extracted = Selection::Unique(1)
        .extract(vec![Item(1), Item(2), Item(3)])
        .unwrap();
    extracted.selected_mut().unwrap().0 = 20;
    extracted.remaining_mut()[1].0 = 30;
    assert_eq!(extracted.restore(), vec![Item(1), Item(20), Item(30)]);
}
