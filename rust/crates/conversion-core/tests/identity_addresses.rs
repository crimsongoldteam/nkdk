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
    }
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
