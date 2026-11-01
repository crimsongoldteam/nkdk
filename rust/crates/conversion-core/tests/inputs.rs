use nkdk_conversion_core::{
    EntryId, InputType, InputValue, PreparedInputs,
    inputs::{InputRef, read},
};
#[test]
fn preparation_preserves_exact_values_and_checks_the_declared_slots() {
    let declarations = [
        ("number", InputType::Decimal),
        ("languages", InputType::Sequence(&InputType::Text)),
        ("ready", InputType::Boolean),
    ];
    let values =
        read(br#"{"number":9007199254740993,"languages":["ru","en"],"ready":true}"#).unwrap();
    let prepared = PreparedInputs::prepare(EntryId(3), &declarations, values)
        .unwrap()
        .with_documents(vec![(
            nkdk_conversion_core::resources::RelativePath::new(["Child.xml"], 100).unwrap(),
            b"<Root/>".to_vec(),
        )])
        .unwrap();
    assert_eq!(prepared.decimal(0).unwrap().to_string(), "9007199254740993");
    assert_eq!(
        prepared.sequence(1).unwrap(),
        [InputValue::Text("ru".into()), InputValue::Text("en".into())]
    );
    assert!(prepared.boolean(2).unwrap());
    assert!(prepared.check_entry(EntryId(4)).is_err());
    let view = prepared.view();
    let slots = [
        Some(InputRef::Sequence(view.sequence(1).unwrap())),
        Some(InputRef::Decimal(view.decimal(0).unwrap())),
        Some(InputRef::Text("child")),
        None,
    ];
    let child = view.rebind(&slots);
    assert!(std::ptr::eq(
        child.sequence(0).unwrap(),
        prepared.sequence(1).unwrap()
    ));
    assert!(std::ptr::eq(
        child.decimal(1).unwrap(),
        prepared.decimal(0).unwrap()
    ));
    assert_eq!(child.text(2).unwrap(), "child");
    assert!(std::ptr::eq(
        child.document(&["Child.xml"]),
        prepared.document(&["Child.xml"])
    ));
    assert_eq!(child.document(&["Child.xml"]), b"<Root/>");
    assert_eq!(
        child.boolean(2).unwrap_err().code.as_deref(),
        Some("input.type")
    );
    struct BorrowedNumber<'a>(&'a nkdk_conversion_core::decimal::Decimal);
    impl nkdk_conversion_core::inputs::RecordInput for BorrowedNumber<'_> {
        fn field(&self, index: usize) -> Option<InputRef<'_>> {
            (index == 0).then_some(InputRef::Decimal(self.0))
        }
    }
    let payload = BorrowedNumber(prepared.decimal(0).unwrap());
    let choices = [
        Some(InputRef::Choice {
            variant: 2,
            fields: &payload,
        }),
        Some(InputRef::ChoiceVariant(2)),
    ];
    let record = nkdk_conversion_core::inputs::RecordView::new(&choices);
    let records = [record];
    let row = nkdk_conversion_core::inputs::Records::from_array(&records)
        .iter()
        .next()
        .unwrap();
    assert_eq!(row.value(0).unwrap().choice_variant().unwrap(), 2);
    assert!(std::ptr::eq(
        row.value(0)
            .unwrap()
            .choice_record(2)
            .unwrap()
            .decimal(0)
            .unwrap(),
        prepared.decimal(0).unwrap()
    ));
    assert!(row.value(2).is_err());
    let choice_view = view.rebind(&choices);
    assert_eq!(choice_view.choice_variant(0).unwrap(), 2);
    assert_eq!(choice_view.choice_variant(1).unwrap(), 2);
    assert!(std::ptr::eq(
        choice_view.choice_record(0, 2).unwrap().decimal(0).unwrap(),
        prepared.decimal(0).unwrap()
    ));
    for (slot, variant) in [(0, 1), (1, 2)] {
        assert_eq!(
            choice_view
                .choice_record(slot, variant)
                .err()
                .unwrap()
                .code
                .as_deref(),
            Some("input.type")
        );
    }
    assert!(!child.is_ready(3));
    let absent_slots = [Some(InputRef::MissingValue)];
    let absent = view.rebind(&absent_slots);
    assert!(!absent.is_ready(0));
    assert!(!absent.is_present(0).unwrap());
    let null_slots = [Some(InputRef::NullValue)];
    let null = view.rebind(&null_slots);
    assert!(null.is_ready(0));
    assert!(null.is_null(0).unwrap());
    assert!(!null.is_present(0).unwrap());
    assert!(!absent.is_null(0).unwrap());
    assert_eq!(
        child.is_null(3).unwrap_err().code.as_deref(),
        Some("input.not-ready")
    );
    assert_eq!(
        null.text(0).unwrap_err().code.as_deref(),
        Some("value.missing")
    );
    assert!(child.is_present(2).unwrap());
    assert_eq!(
        child.is_present(3).unwrap_err().code.as_deref(),
        Some("input.not-ready")
    );
    assert_eq!(
        absent.text(0).unwrap_err().code.as_deref(),
        Some("value.missing")
    );
    let inherited = [absent.slot(0)];
    assert_eq!(
        absent
            .rebind(&inherited)
            .text(0)
            .unwrap_err()
            .code
            .as_deref(),
        Some("value.missing")
    );
    assert_eq!(
        child.rebind(&[]).decimal(0).unwrap_err().code.as_deref(),
        Some("input.not-ready")
    );
    for input in [
        "number: 1\nnumber: 2",
        "languages: [ru, 1]",
        "unknown: x",
        "number: '2'",
        "ready: null",
        "ready: &a true\nnumber: *a",
        "{}\n---\n{}",
    ] {
        let result = read(input.as_bytes())
            .and_then(|values| PreparedInputs::prepare(EntryId(3), &declarations, values));
        assert!(result.is_err(), "{input}");
    }
    let prepared =
        PreparedInputs::prepare(EntryId(3), &declarations, read(b"{}").unwrap()).unwrap();
    assert!(!prepared.is_ready(0));
    assert_eq!(
        prepared.decimal(0).unwrap_err().code.as_deref(),
        Some("input.not-ready")
    );
}

#[test]
fn preparation_reads_typed_record_sequences_in_declared_field_order() {
    use nkdk_conversion_core::{InputType, inputs};
    let values = inputs::read(
        br#"{"profiles":[{"name":"Ref","policy":"forbidden"},{"name":"Date","policy":"byEffectiveType"}]}"#,
    )
    .unwrap();
    static RECORD: InputType =
        InputType::Record(&[("name", InputType::Text), ("policy", InputType::Text)]);
    let prepared = nkdk_conversion_core::PreparedInputs::prepare(
        nkdk_conversion_core::EntryId(1),
        &[("profiles", InputType::Sequence(&RECORD))],
        values,
    )
    .unwrap();
    let rows: Vec<_> = prepared.view().records(0).unwrap().into_iter().collect();
    assert_eq!(rows.len(), 2);
    assert_eq!(rows[0].text(0).unwrap(), "Ref");
    assert_eq!(rows[0].text(1).unwrap(), "forbidden");
    assert_eq!(rows[1].text(0).unwrap(), "Date");
}

#[test]
fn input_records_reject_aliases_anchors_and_tags_even_when_types_match() {
    use nkdk_conversion_core::inputs;
    for source in [
        b"profiles: &profiles [{name: Ref, policy: forbidden}]\ncopy: *profiles".as_slice(),
        b"profiles: [{name: !kind Ref, policy: forbidden}]".as_slice(),
        b"profiles: [{name: Ref, policy: !!str forbidden}]".as_slice(),
    ] {
        assert_eq!(
            inputs::read(source).unwrap_err().code.as_deref(),
            Some("input.form")
        );
    }
}

#[test]
fn row_input_overrides_only_selected_slots_without_copying_the_parent() {
    let prepared = PreparedInputs::prepare(
        EntryId(4),
        &[
            ("name", InputType::Text),
            ("profile", InputType::Text),
            ("ready", InputType::Boolean),
        ],
        read(br#"{"name":"parent","profile":"Primitive","ready":true}"#).unwrap(),
    )
    .unwrap();
    let parent = prepared.view();
    let first_overrides = [
        (0, InputRef::Text("СвязьПоТипу")),
        (1, InputRef::Text("TypeLink")),
    ];
    let second_overrides = [
        (0, InputRef::Text("Обычный")),
        (1, InputRef::Text("Primitive")),
    ];
    let first = parent.with_overrides(&first_overrides);
    let second = parent.with_overrides(&second_overrides);
    assert_eq!(first.text(0).unwrap(), "СвязьПоТипу");
    assert_eq!(first.text(1).unwrap(), "TypeLink");
    assert_eq!(second.text(0).unwrap(), "Обычный");
    assert_eq!(parent.text(0).unwrap(), "parent");
    assert!(first.boolean(2).unwrap());
    let slots = [
        Some(InputRef::Text("bound")),
        Some(InputRef::Text("Field")),
        Some(InputRef::Boolean(false)),
    ];
    let bound_overrides = [(0, InputRef::Text("Ключ")), (1, InputRef::Text("TypeLink"))];
    let bound = parent.rebind(&slots).with_overrides(&bound_overrides);
    assert_eq!(bound.text(0).unwrap(), "Ключ");
    assert!(!bound.boolean(2).unwrap());
    let extended = [
        (0, InputRef::Text("Ключ")),
        (1, InputRef::Text("TypeLink")),
        (2, InputRef::Boolean(false)),
    ];
    let view = parent.with_overrides(&extended);
    assert_eq!(view.text(0).unwrap(), "Ключ");
    assert_eq!(view.text(1).unwrap(), "TypeLink");
    assert!(!view.boolean(2).unwrap());
}

#[test]
fn collection_position_is_lexical_and_survives_rebinding_without_mutating_parent() {
    let prepared = PreparedInputs::default();
    let root = prepared.view();
    assert!(root.collection_position().is_err());
    let outer = root.with_collection_position(7);
    assert_eq!(outer.rebind(&[]).collection_position().unwrap(), 7);
    assert_eq!(outer.with_overrides(&[]).collection_position().unwrap(), 7);
    assert_eq!(
        outer
            .with_collection_position(2)
            .collection_position()
            .unwrap(),
        2
    );
    let inner = outer.with_collection_position(2);
    assert_eq!(inner.collection_position_at(1).unwrap(), 7);
    assert_eq!(inner.rebind(&[]).collection_position_at(1).unwrap(), 7);
    assert_eq!(
        inner.with_overrides(&[]).collection_position_at(1).unwrap(),
        7
    );
    assert!(inner.collection_position_at(2).is_err());
    let grandchild = inner.with_collection_position(4);
    assert_eq!(grandchild.collection_position_at(0).unwrap(), 4);
    assert_eq!(grandchild.collection_position_at(1).unwrap(), 2);
    assert_eq!(grandchild.collection_position_at(2).unwrap(), 7);
    assert_eq!(outer.collection_position().unwrap(), 7);
    assert!(root.collection_position().is_err());
}

#[test]
fn document_overlay_shadows_borrowed_sources_and_preserves_missing_and_empty() {
    use nkdk_conversion_core::resources::{Limits, RelativePath};
    let path = |name: &str| RelativePath::new([name], 100).unwrap();
    let prepared = PreparedInputs::prepare(
        EntryId(1),
        &[("name", InputType::Text)],
        vec![("name".into(), InputValue::Text("Parent".into()))],
    )
    .unwrap()
    .with_documents(vec![
        (path("Old.txt"), b"old".to_vec()),
        (path("Keep.xml"), b"<Keep/>".to_vec()),
    ])
    .unwrap();
    let view = prepared.view();
    let documents = [
        (path("Old.txt"), "новый".as_bytes().to_vec()),
        (path("Empty.txt"), Vec::new()),
        (path("Bad.txt"), vec![255]),
    ];
    let limits = Limits {
        groups: 10,
        routes: 10,
        path_bytes: 100,
    };
    let overlay = view.overlay_documents(&documents, limits, 100).unwrap();
    let result = overlay.view();
    assert_eq!(result.document_text(&["Old.txt"]).unwrap(), Some("новый"));
    assert_eq!(result.document_text(&["Empty.txt"]).unwrap(), Some(""));
    assert_eq!(result.document_text(&["Absent.txt"]).unwrap(), None);
    assert!(result.document_text(&["Bad.txt"]).is_err());
    let invalid = [(path("Control.txt"), vec![0])];
    let invalid_overlay = result.overlay_documents(&invalid, limits, 100).unwrap();
    let issue = invalid_overlay
        .view()
        .document_xml_text_at(&path("Control.txt"))
        .unwrap_err();
    assert_eq!(issue.code.as_deref(), Some("xml.invalid-character"));
    assert_eq!(issue.file.as_ref(), "Control.txt");

    assert!(std::ptr::eq(
        result.document(&["Old.txt"]).as_ptr(),
        documents[0].1.as_ptr()
    ));
    assert!(std::ptr::eq(
        result.document(&["Keep.xml"]).as_ptr(),
        view.document(&["Keep.xml"]).as_ptr()
    ));
    assert_eq!(result.text(0).unwrap(), "Parent");
    assert_eq!(view.document(&["Old.txt"]), b"old");
    let bound = result.rebind(&[]);
    assert_eq!(bound.document_text(&["Empty.txt"]).unwrap(), Some(""));
    let next = [(path("Old.txt"), b"last".to_vec())];
    let nested = bound.overlay_documents(&next, limits, 100).unwrap();
    assert_eq!(nested.view().document(&["Old.txt"]), b"last");
    assert_eq!(nested.view().document(&["Empty.txt"]), b"");
    assert_eq!(
        nested.view().document_text(&["Keep.xml"]).unwrap(),
        Some("<Keep/>")
    );
    assert!(
        view.overlay_documents(
            &documents,
            Limits {
                routes: 3,
                ..limits
            },
            100
        )
        .is_err()
    );
    assert!(
        view.overlay_documents(
            &documents,
            Limits {
                path_bytes: 3,
                ..limits
            },
            100
        )
        .is_err()
    );
    assert!(view.overlay_documents(&documents, limits, 1).is_err());
    let duplicate = [(path("Old.txt"), Vec::new()), (path("Old.txt"), Vec::new())];
    assert!(view.overlay_documents(&duplicate, limits, 100).is_err());
    assert!(
        PreparedInputs::default()
            .with_document_limits(limits, 1)
            .unwrap()
            .with_documents(vec![(path("Large.txt"), b"too large".to_vec())])
            .is_err()
    );
}
