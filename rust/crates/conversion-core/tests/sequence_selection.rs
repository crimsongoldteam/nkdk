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
