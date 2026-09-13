use nkdk_conversion_core::facts::{
    FactState,
    identity::{IdentityFormat, LogicalAddress, OperationIdentity},
};
use std::borrow::Cow;

#[test]
fn operation_identity_matches_legacy_vectors_and_only_creates_missing_values() {
    // Produced by configurationIndex/exportRuntime.ts using explicit operationSeed.
    for (seed, address, uuid, xml_id, version) in [
        (
            1,
            vec!["Объект"],
            "f8a59a9f-0a3d-4f80-bd43-9f1c85dc0ef6",
            "be563fb6f7acd57ee8a2ec46c88db635",
            "d474016c3f06eec434a17258abc2c3b6752a438c",
        ),
        (
            1,
            vec!["Перечисление", "А.Б", "Значение", "В"],
            "1a1b9642-4bdf-4717-a456-d78c682862b1",
            "cc84d6d6a675fd95b1e1d17f8d46cde9",
            "eb37340a4ee45ebd40902416d27930dc07b9ca1c",
        ),
        (
            2,
            vec!["Объект"],
            "6a3bf6e0-6fe1-427e-9ef7-cbc409decde3",
            "9c2c3b2f95a57b8dfb5a9da1ae914a33",
            "6474a18ce8c8b53ab739acca41f997f545bc7404",
        ),
    ] {
        let address = LogicalAddress::from_segments(address).unwrap();
        let generator = OperationIdentity::new([seed; 32]);
        for (domain, format, expected) in [
            ("uuid", IdentityFormat::Uuid, uuid),
            ("xmlId", IdentityFormat::Hex128, xml_id),
            ("configVersion", IdentityFormat::Hex160, version),
        ] {
            for _ in 0..2 {
                assert_eq!(
                    generator.resolve(FactState::Missing, domain, format, &address),
                    FactState::Ready(Cow::Owned(expected.to_owned()))
                );
            }
            for original in ["", "opaque-original"] {
                assert!(
                    matches!(generator.resolve(FactState::Ready(original),domain,format,&address),FactState::Ready(Cow::Borrowed(value)) if std::ptr::eq(original,value))
                );
            }
            for (unavailable, expected) in [
                (FactState::Unready, FactState::Unready),
                (FactState::Ambiguous, FactState::Ambiguous),
                (FactState::Cycle, FactState::Cycle),
            ] {
                assert_eq!(
                    generator.resolve(unavailable, domain, format, &address),
                    expected
                );
            }
        }
    }
}
