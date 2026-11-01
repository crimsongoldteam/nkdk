use nkdk_conversion_core::facts::identity::LogicalAddress;

#[test]
fn identity_addresses_preserve_ts_segments_without_collisions() {
    for (parts, expected) in [
        (
            vec!["Перечисление", "А.Б", "Значение", "В"],
            "Перечисление.А%2EБ.Значение.В",
        ),
        (vec!["Kind", "a%2Eb[c]"], "Kind.a%252Eb%5Bc%5D"),
        (vec!["Kind", "a", "b"], "Kind.a.b"),
    ] {
        let address = LogicalAddress::from_segments(parts).unwrap();
        assert_eq!(address.as_str(), expected);
        assert_eq!(
            LogicalAddress::from_encoded(address.as_str()).unwrap(),
            address
        );
    }
    for (parent, expected) in [
        ("Форма.Атрибут.Таблица", "Форма.Атрибут.Таблица.Колонка[0]"),
        (
            "Форма.Атрибут.Таблица.ДополнительныеКолонки[2]",
            "Форма.Атрибут.Таблица.ДополнительныеКолонки[2].Колонка[0]",
        ),
        ("Kind.a%252Eb%5Bc%5D", "Kind.a%252Eb%5Bc%5D.Колонка[0]"),
    ] {
        let mut address = LogicalAddress::from_encoded(parent).unwrap();
        address.push_segment("Колонка").unwrap();
        address
            .push_decimal_index(&nkdk_conversion_core::decimal::Decimal::parse("0.0").unwrap())
            .unwrap();
        assert_eq!(address.into_string(), expected);
    }
    for parent in [
        "",
        ".Owner",
        "Owner.",
        "Owner..Child",
        "Owner[01]",
        "Owner[-1]",
        "Owner[]",
        "Owner[1]Name",
        "Owner%2eName",
        "Owner%oops",
        "Owner[9007199254740992]",
        "[0]",
        "Owner]",
    ] {
        assert!(LogicalAddress::from_encoded(parent).is_err(), "{parent}");
    }
    for index in ["-1", "0.5", "9007199254740992", "1e1000000"] {
        let mut address = LogicalAddress::from_segments(["Owner"]).unwrap();
        assert!(
            address
                .push_decimal_index(&nkdk_conversion_core::decimal::Decimal::parse(index).unwrap())
                .is_err(),
            "{index}"
        );
        assert_eq!(address.as_str(), "Owner");
    }
    assert_eq!(
        nkdk_conversion_core::decimal::from_position(2).to_string(),
        "2"
    );
    assert_eq!(
        nkdk_conversion_core::decimal::from_position(usize::MAX),
        nkdk_conversion_core::decimal::Decimal::parse(&usize::MAX.to_string()).unwrap()
    );
    let mut maximum = LogicalAddress::from_segments(["Owner"]).unwrap();
    maximum
        .push_decimal_index(
            &nkdk_conversion_core::decimal::Decimal::parse("9.007199254740991e15").unwrap(),
        )
        .unwrap();
    assert_eq!(maximum.as_str(), "Owner[9007199254740991]");
    assert_eq!(
        LogicalAddress::from_encoded(maximum.as_str()).unwrap(),
        maximum
    );
    let mut numeric = LogicalAddress::from_segments(["Owner"]).unwrap();
    numeric
        .push_decimal_index(&nkdk_conversion_core::decimal::Decimal::parse("2e1").unwrap())
        .unwrap();
    assert_eq!(numeric.as_str(), "Owner[20]");
    let mut address = LogicalAddress::from_segments(["Owner", "Child"]).unwrap();
    address.push_index(2).unwrap();
    address.push_segment("Имя").unwrap();
    assert_eq!(address.as_str(), "Owner.Child[2].Имя");
    assert!(address.push_segment("").is_err());
    assert_eq!(address.as_str(), "Owner.Child[2].Имя");
    assert!(address.push_index(9_007_199_254_740_992).is_err());
    assert_eq!(address.as_str(), "Owner.Child[2].Имя");
    assert!(LogicalAddress::from_segments([""]).is_err());
    assert!(LogicalAddress::from_segments([]).is_err());
}
