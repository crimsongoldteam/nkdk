use nkdk_conversion_core::decimal::Decimal;
#[test]
fn decimals_keep_precision_and_compare_without_binary_rounding() {
    let source = String::from("+00012.3400e2");
    let allocation = source.as_ptr();
    let owned = Decimal::parse_owned(source).unwrap();
    assert_eq!(owned.to_string(), "1234");
    assert_eq!(owned.parts().1.as_ptr(), allocation);
    for (input, canonical) in [
        ("9007199254740993", "9007199254740993"),
        (
            "12345678901234567890123456789012345678",
            "1.2345678901234567890123456789012345678e+37",
        ),
        ("1.2300", "1.23"),
        ("+000.00120", "0.0012"),
        ("12e-7", "0.0000012"),
        ("1e-7", "1e-7"),
        ("-0.000", "0"),
        ("1e1000000", "1e+1000000"),
        ("1.0e-9223372036854775808", "1e-9223372036854775808"),
        ("1e9223372036854775807", "1e+9223372036854775807"),
    ] {
        let value = Decimal::parse(input).unwrap();
        assert_eq!(value.to_string(), canonical);
        assert_eq!(Decimal::parse(canonical).unwrap(), value);
    }
    for (a, b) in [
        ("9007199254740992", "9007199254740993"),
        ("-1.001", "-1"),
        ("0", "0.00000000000000000000001"),
        ("0.09999999999999999999999", "0.1"),
        ("1e-1000000", "1e1000000"),
    ] {
        assert!(Decimal::parse(a).unwrap() < Decimal::parse(b).unwrap());
    }
    for bad in [
        "",
        " ",
        "NaN",
        "Infinity",
        "0x10",
        ".",
        "1e",
        "1e+",
        "1.2.3",
        "1e1e1",
        "1e9223372036854775808",
        "99e9223372036854775807",
    ] {
        assert!(Decimal::parse(bad).is_err(), "{bad}");
    }
}
