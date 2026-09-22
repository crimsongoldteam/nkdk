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
    assert!(!child.is_ready(3));
    let absent_slots = [Some(InputRef::MissingValue)];
    let absent = view.rebind(&absent_slots);
    assert!(!absent.is_ready(0));
    assert!(!absent.is_present(0).unwrap());
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
