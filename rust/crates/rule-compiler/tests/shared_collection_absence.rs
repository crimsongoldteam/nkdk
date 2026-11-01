mod support;

#[test]
fn absent_unwrapped_collection_does_not_capture_reordered_neighbours() {
    let source = r#"format: nkdk-declarations/1
kind: catalog
declarations:
- kind: value
  id: test.text
  value: {kind: scalar, scalar: text}
  representations: {xml: {kind: text}, yaml: {kind: scalar, scalar: text}}
- kind: value
  id: test.kind
  namespaces: {t: urn:kind}
  value: {kind: scalar, scalar: text}
  representations:
    xml: {kind: qname-lexicon, values: [{name: t:One, literal: Первый}]}
    yaml: {kind: scalar, scalar: text}
@fixture-row@
@fixture-rows@
- kind: object
  id: test.owner
  namespaces: {xsi: http://www.w3.org/2001/XMLSchema-instance, t: urn:kind}
  imports: {text: test.text, rows: common.rows, kind: test.kind}
  value:
    kind: record
    fields:
    - {name: first, type: {use: text}}
    - {name: second, type: {use: text}}
    - {name: rows, type: {use: rows}}
    - {name: kind, type: {use: kind}}
  representations:
    xml:
      kind: record
      fields: [{field: first, path: [Root, t:Alpha]}, {field: second, path: [Root, t:Beta]}, {field: rows, path: [Root]}, {field: kind, path: [Root], attribute: xsi:type}]
    yaml:
      kind: mapping
      fields: [{field: first, key: First}, {field: second, key: Second}, {field: rows, key: Rows}, {field: kind, key: Kind}]
  presence:
  - target: {field: rows}
    xml:
      missing: {denotes: {absent: true}}
      canonical: [{when: {literal: false}, form: missing}]
    yaml: {missing: {denotes: {absent: true}}}
"#;
    let catalog_part = |module: &str| {
        module
            .lines()
            .filter(|line| !line.starts_with("format:"))
            .enumerate()
            .map(|(index, line)| format!("{}{line}\n", if index == 0 { "- " } else { "  " }))
            .collect::<String>()
    };
    let source = source
        .replace(
            "@fixture-row@",
            &catalog_part(include_str!("fixtures/declared-row.yaml")),
        )
        .replace(
            "@fixture-rows@",
            &catalog_part(include_str!("fixtures/declared-rows.yaml")),
        );
    let program = r#"
mod generated;
use generated::*;
use generated::automata_store;
use nkdk_conversion_core as core;
fn main() {
    let entry=EntryId(OWNER);
    for source in [
        "<Root><Alpha>one</Alpha><Beta>two</Beta></Root>",
        "<Root><Beta>two</Beta><Alpha>one</Alpha></Root>",
        "<Root><Beta>two</Beta><Item xmlns:r=\"urn:row\"><r:Name>kept</r:Name><r:Mode>normal</r:Mode></Item><Alpha>one</Alpha></Root>",
    ] {
        let source=source.replacen("<Root>","<Root xmlns:t=\"urn:kind\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xsi:type=\"t:One\">",1);
        let source=source.replace("<Alpha>","<t:Alpha>").replace("</Alpha>","</t:Alpha>")
            .replace("<Beta>","<t:Beta>").replace("</Beta>","</t:Beta>");
        let imported=convert_file(entry,Direction::XmlToYaml,source.as_bytes(),&PreparedInputs::default()).unwrap();
        let yaml=String::from_utf8(imported.bytes).unwrap();
        assert!(yaml.contains("First: one") && yaml.contains("Second: two"),"{yaml}");
        assert!(!yaml.lines().any(|line|line.trim()=="Root: !xml/raw"),"{yaml}");
        if source.contains("<Item ") {assert!(yaml.contains("Name: kept"),"{yaml}");}
        let restored=convert_file(entry,Direction::YamlToXml,yaml.as_bytes(),&PreparedInputs::default()).unwrap();
        core::proof::verify_with_attributes(source.as_bytes(),&restored.bytes,|_|false,|_,name|name.namespace=="http://www.w3.org/2001/XMLSchema-instance" && name.local=="type").unwrap();
    }
}
"#;
    let (generated, owner) = support::compile_catalog("shared-empty.yaml", &source, "test.owner");
    support::run_generated("shared-empty-neighbours", generated, owner, program);
    support::shared_catalog::run_source_program(
        "shared-empty-neighbours-aot",
        "shared-empty.yaml",
        &source,
        "test.owner",
        program,
    );
}
