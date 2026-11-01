mod support;

#[test]
fn projected_mapping_preserves_anomalies_without_its_private_field_name() {
    let row = include_str!("fixtures/declared-row.yaml")
        .lines()
        .filter(|line| !line.starts_with("format:"))
        .enumerate()
        .map(|(index, line)| format!("{}{line}\n", if index == 0 { "- " } else { "  " }))
        .collect::<String>();
    let owner = "- kind: value\n  id: test.wrapper\n  imports: {row: common.row}\n  value: {kind: record, fields: [{name: hidden, type: {use: row}}]}\n  representations:\n    xml: {kind: record, fields: [{field: hidden, path: []}]}\n    yaml: {kind: projection, field: hidden}\n- kind: object\n  id: test.projected-row\n  imports: {wrapper: test.wrapper}\n  value: {kind: record, fields: [{name: row, type: {use: wrapper}}]}\n  representations:\n    xml: {kind: record, fields: [{field: row, path: [Root, Row]}]}\n    yaml: {kind: mapping, fields: [{field: row, key: Row}]}\n";
    let source = format!("format: nkdk-declarations/1\nkind: catalog\ndeclarations:\n{row}{owner}");
    let (generated, id) =
        support::compile_catalog("projected-row.yaml", &source, "test.projected-row");
    support::run_generated(
        "projected-mapping-anomaly",
        generated,
        id,
        r#"
mod generated;
use generated::*;
use nkdk_conversion_core as core;
fn main() {
    let original=b"<Root><Row xmlns:r=\"urn:row\" extra=\"x\"><r:Name>kept</r:Name><r:Mode>normal</r:Mode></Row></Root>";
    let entry=EntryId(OWNER);
    let converted=convert_file(entry,Direction::XmlToYaml,original,&PreparedInputs::default()).unwrap();
    let yaml=String::from_utf8(converted.bytes).unwrap();
    assert!(yaml.contains("!xml/raw"),"{yaml}");
    assert!(!yaml.contains("hidden:"),"{yaml}");
    let restored=convert_file(entry,Direction::YamlToXml,yaml.as_bytes(),&PreparedInputs::default()).unwrap();
    core::proof::verify(original,&restored.bytes,|_|false).unwrap();
}
"#,
    );
}
