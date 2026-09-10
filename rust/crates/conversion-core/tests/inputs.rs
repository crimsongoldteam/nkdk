use nkdk_conversion_core::{EntryId, InputType, InputValue, PreparedInputs, inputs::read};
#[test]
fn preparation_preserves_exact_values_and_checks_the_declared_slots() {
    let declarations = [
        ("number", InputType::Decimal),
        ("languages", InputType::Sequence(&InputType::Text)),
        ("ready", InputType::Boolean),
    ];
    let values =
        read(br#"{"number":9007199254740993,"languages":["ru","en"],"ready":true}"#).unwrap();
    let prepared = PreparedInputs::prepare(EntryId(3), &declarations, values).unwrap();
    assert_eq!(prepared.decimal(0).unwrap().to_string(), "9007199254740993");
    assert_eq!(
        prepared.sequence(1).unwrap(),
        [InputValue::Text("ru".into()), InputValue::Text("en".into())]
    );
    assert!(prepared.boolean(2).unwrap());
    assert!(prepared.check_entry(EntryId(4)).is_err());
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
