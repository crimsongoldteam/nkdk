use nkdk_conversion_core::calendar::Value;

#[test]
fn written_clock_calendar_preserves_components_without_timezone_conversion() {
    for (xml, minutes, seconds) in [
        ("0001-01-01T00:00:00", "01.01.0001", "01.01.0001 00:00:00"),
        (
            "2000-02-29T12:34:56+03:00",
            "29.02.2000 12:34",
            "29.02.2000 12:34:56",
        ),
        (
            "2026-09-10T12:13:00-14:00",
            "10.09.2026 12:13",
            "10.09.2026 12:13:00",
        ),
        (
            "2026-09-10T00:00:14.125Z",
            "10.09.2026 00:00",
            "10.09.2026 00:00:14",
        ),
    ] {
        let value = Value::from_xml(xml).unwrap();
        assert_eq!(value.yaml(false, true), minutes);
        assert_eq!(value.yaml(true, false), seconds);
        assert_eq!(
            Value::from_yaml(seconds, true, false).unwrap().xml(),
            &xml[..19]
        );
    }
}

#[test]
fn malformed_calendar_values_return_diagnostics_without_index_panics() {
    for source in [
        "",
        "1",
        "Дата",
        "2026-02-30T00:00:00",
        "1900-02-29T00:00:00",
        "2026-01-01T25:00:00",
        "2026-01-01T00:00:60",
        "2026-01-01T00:00:00+14:01",
        "2026-01-01T00:00:00.",
    ] {
        assert!(Value::from_xml(source).is_err(), "{source}");
    }
    for source in [
        "",
        "1",
        "Дата",
        "30.02.2026",
        "10.09.2026 24:00",
        "10.09.2026 12:99",
        "10.09.2026 12:13:14",
    ] {
        assert!(Value::from_yaml(source, false, true).is_err(), "{source}");
    }
}
