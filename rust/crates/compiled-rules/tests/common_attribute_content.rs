use nkdk_compiled_rules_probes::{
    Direction, convert_file, entry_id, prepare_inputs, verify_candidate,
};

#[path = "support/round_trip.rs"]
mod round_trip;

fn inputs() -> (
    nkdk_compiled_rules_probes::EntryId,
    nkdk_compiled_rules_probes::PreparedInputs,
) {
    let entry = entry_id("migration.common-attribute-content").unwrap();
    let inputs = prepare_inputs(entry, Vec::new()).unwrap();
    (entry, inputs)
}

fn wrapped(content: &str) -> String {
    format!("<Root xmlns:xr=\"http://v8.1c.ru/8.3/xcf/readable\">{content}</Root>")
}

fn yaml_and_verify(xml: &str) -> String {
    let (entry, inputs) = inputs();
    round_trip::yaml_and_verify(entry, xml, &inputs)
}

#[test]
fn real_common_attribute_content_uses_only_two_plural_root_spellings() {
    let source = include_str!(
        "../../../../e2e/fixtures/xml/cf/CommonAttributes/ОбщийРеквизитВсеСвойства.xml"
    );
    let start = source.find("<Content>").unwrap();
    let end = source[start..].find("</Content>").unwrap() + start + "</Content>".len();
    let xml = wrapped(&source[start..end]);
    let (entry, inputs) = inputs();
    let converted = convert_file(entry, Direction::XmlToYaml, xml.as_bytes(), &inputs).unwrap();
    let yaml = String::from_utf8(converted.bytes).unwrap();
    for expected in [
        "ПланСчетов.ПланСчетовВсеСвойства",
        "Справочники.СправочникОбщиеРеквизиты",
        "ПланыВидовРасчета.ПланРасчетаВсеСвойства",
        "Использование: Использовать",
        "Использование: НеИспользовать",
    ] {
        assert!(yaml.contains(expected), "{expected}: {yaml}");
    }
    assert_eq!(yaml.matches("Объект:").count(), 3, "{yaml}");
    assert!(!yaml.contains("!xml"), "{yaml}");
    verify_candidate(entry, xml.as_bytes(), yaml.as_bytes(), &inputs).unwrap();
}

#[test]
fn authored_yaml_restores_the_declared_xml_names_without_reference() {
    let yaml = "Состав:\n  - Объект: Справочники.Товары\n    Использование: Использовать\n    УсловноеРазделение: ''\n  - Объект: ПланыВидовРасчета.План\n    Использование: НеИспользовать\n";
    let (entry, inputs) = inputs();
    let result = convert_file(entry, Direction::YamlToXml, yaml.as_bytes(), &inputs).unwrap();
    let xml = String::from_utf8(result.bytes).unwrap();
    assert!(xml.contains("Catalog.Товары"), "{xml}");
    assert!(xml.contains("ChartOfCalculationTypes.План"), "{xml}");
    assert!(xml.contains(">Use</"), "{xml}");
    assert!(xml.contains(">DontUse</"), "{xml}");
    assert!(xml.contains("ConditionalSeparation"), "{xml}");
}

#[test]
fn empty_and_invalid_items_are_preserved_at_the_collection_boundary() {
    for content in ["<Content/>", "<Content><xr:Item/></Content>"] {
        let yaml = yaml_and_verify(&wrapped(content));
        assert!(!yaml.contains("Состав:"), "{yaml}");
    }

    let invalid = wrapped(
        "<Content><xr:Item><xr:Metadata>Catalog.Товары</xr:Metadata><xr:Use>Неверно</xr:Use><xr:ConditionalSeparation/></xr:Item></Content>",
    );
    let yaml = yaml_and_verify(&invalid);
    assert!(yaml.contains("Use: !xml/raw"), "{yaml}");
}

#[test]
fn repeated_items_and_nonempty_separation_keep_order_and_xml_form() {
    let xml = wrapped(
        "<Content><xr:Item><xr:Metadata>Catalog.Первая</xr:Metadata><xr:Use>Use</xr:Use><xr:ConditionalSeparation>Catalog.Вторая</xr:ConditionalSeparation></xr:Item><xr:Item><xr:Metadata>Document.Вторая</xr:Metadata><xr:Use>DontUse</xr:Use></xr:Item></Content>",
    );
    let yaml = yaml_and_verify(&xml);
    assert!(yaml.contains("Справочники.Первая"), "{yaml}");
    assert!(
        yaml.contains("УсловноеРазделение: Справочники.Вторая"),
        "{yaml}"
    );
    assert!(yaml.contains("Документ.Вторая"), "{yaml}");
    assert_eq!(yaml.matches("Объект:").count(), 2, "{yaml}");
    assert!(!yaml.starts_with("!xml"), "{yaml}");
}

#[test]
fn unrecognized_reference_spelling_remains_plain_yaml_text() {
    let xml = wrapped(
        "<Content><xr:Item><xr:Metadata>Unexpected.Object</xr:Metadata><xr:Use>Use</xr:Use><xr:ConditionalSeparation>yes</xr:ConditionalSeparation></xr:Item></Content>",
    );
    let yaml = yaml_and_verify(&xml);
    assert!(yaml.contains("Объект: Unexpected.Object"), "{yaml}");
    assert!(yaml.contains("УсловноеРазделение: yes"), "{yaml}");
    assert!(!yaml.contains("!xml"), "{yaml}");

    let authored = "Состав:\n  - Объект: Unexpected.Object\n    Использование: Использовать\n    УсловноеРазделение: yes\n";
    let (entry, inputs) = inputs();
    let rebuilt = convert_file(entry, Direction::YamlToXml, authored.as_bytes(), &inputs).unwrap();
    let xml = String::from_utf8(rebuilt.bytes).unwrap();
    assert!(xml.contains("Unexpected.Object"), "{xml}");
    assert!(xml.contains(">yes</"), "{xml}");
}
