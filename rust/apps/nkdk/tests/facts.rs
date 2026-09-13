use nkdk::facts::{Source, prepare};
use nkdk_compiled_rules::{Direction, convert_file, entry_id, read_inputs};
use nkdk_conversion_core::facts::{Generation, prepared::FactBudget, text::TextBudget};

#[test]
fn operation_prepares_identity_once_and_returns_context_ready_for_reverse_conversion() {
    let entry = entry_id("migration.metadata-uuid").unwrap();
    let inputs = read_inputs(
        entry,
        br#"{"component":"cf","owner":"parent","kind":"EnumValue"}"#,
    )
    .unwrap();
    let xml = "<Root uuid=\"retained-id\"><Name>Первый</Name></Root>";
    let prepared = prepare(
        vec![Source {
            entry,
            direction: Direction::XmlToYaml,
            bytes: xml.as_bytes(),
            inputs,
        }],
        &[entry],
        Generation(1),
        FactBudget {
            text: TextBudget {
                entries: 100,
                bytes: 1000,
            },
            rows: 100,
        },
        10000,
    )
    .unwrap_or_else(|errors| panic!("{errors:?}"));
    let source = &prepared.sources[0];
    assert!(std::ptr::eq(source.bytes, xml.as_bytes()));
    let restored = convert_file(
        entry,
        Direction::YamlToXml,
        "Имя: Первый".as_bytes(),
        &source.inputs,
    )
    .unwrap();
    let actual = String::from_utf8(restored.bytes).unwrap();
    assert!(actual.contains("uuid=\"retained-id\""), "{actual}");
    assert!(actual.contains("<Name>Первый</Name>"), "{actual}");
}
