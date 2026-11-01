mod support;

#[test]
fn nested_record_rebases_child_document_preservation_to_its_owner() {
    let source = r#"format: nkdk-declarations/1
kind: catalog
declarations:
- kind: value
  id: common.detail
  value: {kind: record, fields: [{name: note, type: {kind: scalar, scalar: text}}]}
  representations:
    xml: {kind: record, fields: [{field: note, path: [Note]}]}
    yaml: {kind: mapping, fields: [{field: note, key: Примечание}]}
- kind: value
  id: common.body
  imports: {detail: common.detail}
  value: {kind: record, fields: [{name: first, type: {kind: scalar, scalar: text}}, {name: detail, type: {use: detail}}, {name: absent, type: {kind: scalar, scalar: text}}]}
  representations:
    xml: {kind: record, fields: [{field: first, path: [First]}, {field: detail, path: [Detail]}, {field: absent, path: [Nested, Absent]}]}
    yaml: {kind: mapping, fields: [{field: first, key: Первое}, {field: detail, key: Детали}, {field: absent, key: Отсутствует}]}
  presence:
  - target: {field: absent}
    xml: {missing: {denotes: {absent: true}}}
    yaml: {missing: {denotes: {absent: true}}}
"#;
    let source = with_owner(source, "[Root, Body]", "Тело");
    let main = r#"
include!("generated.rs");
fn main() {
 let entry=EntryId(OWNER);
 let inputs=prepare_inputs(entry,vec![]).unwrap();
 for suffix in ["", "<Nested/>"] {
  let xml=format!("<Root><Body><First>one</First><Detail><Note>two</Note></Detail>{suffix}</Body></Root>");
  let forward=convert_file(entry,Direction::XmlToYaml,xml.as_bytes(),&inputs).unwrap();
  let yaml=std::str::from_utf8(&forward.bytes).unwrap();
  assert!(yaml.contains("Первое: one"));
  assert!(yaml.contains("Примечание: two"));
  let reverse=convert_file(entry,Direction::YamlToXml,&forward.bytes,&inputs).unwrap();
  nkdk_conversion_core::proof::verify(xml.as_bytes(),&reverse.bytes, |_| false).unwrap();
 }
}
"#;
    let (generated, id) = support::compile_catalog("nested-preservation.yaml", &source, "owner");
    support::run_generated("nested-owner-preservation", generated, id, main);
    support::shared_catalog::run_source_program(
        "shared-nested-owner-preservation",
        "nested-preservation.yaml",
        &source,
        "owner",
        main,
    );
}

#[test]
fn nested_linear_sequence_keeps_all_successor_values_readable() {
    let source = r#"format: nkdk-declarations/1
kind: catalog
declarations:
- kind: value
  id: common.row
  value: {kind: record, fields: [{name: note, type: {kind: scalar, scalar: text}}]}
  representations: {xml: {kind: record, fields: [{field: note, path: [Note]}]}, yaml: {kind: mapping, fields: [{field: note, key: Примечание}]}}
- kind: value
  id: common.chain
  imports: {row: common.row}
  value: {kind: sequence, item: {use: row}}
  representations:
    xml: {kind: element-sequence, path: [Items, Item], next: [Next], item: {kind: declared}}
    yaml: {kind: sequence, item: {kind: declared}}
- kind: value
  id: common.body
  imports: {chain: common.chain}
  value: {kind: record, fields: [{name: title, type: {kind: scalar, scalar: text}}, {name: chain, type: {use: chain}}]}
  representations: {xml: {kind: record, fields: [{field: title, path: [Title]}, {field: chain, path: [Chain]}]}, yaml: {kind: mapping, fields: [{field: title, key: Заголовок}, {field: chain, key: Цепочка}]}}
"#;
    let source = with_owner(source, "[Envelope, Content]", "Содержимое");
    let main = r#"
include!("generated.rs");
fn main() {
 let entry=EntryId(OWNER);
 let inputs=prepare_inputs(entry,vec![]).unwrap();
 let xml=b"<Envelope><Content><Title>neighbour</Title><Chain><Items><Item><Note>first</Note></Item></Items><Next><Items><Item><Note>second</Note></Item></Items><Next><Items><Item><Note>third</Note></Item></Items></Next></Next></Chain></Content></Envelope>";
 let result=convert_file(entry,Direction::XmlToYaml,xml,&inputs).unwrap();
 let yaml=std::str::from_utf8(&result.bytes).unwrap();
 for value in ["first","second","third"] {assert!(yaml.contains(&format!("Примечание: {value}")),"Missing readable successor: {yaml}");}
 assert!(!yaml.contains("!xml/raw"),"Declared chain is ordinary data: {yaml}");
 let restored=convert_file(entry,Direction::YamlToXml,&result.bytes,&inputs).unwrap();
 nkdk_conversion_core::proof::verify(xml,&restored.bytes, |_| false).unwrap();
}
"#;
    let (generated, id) = support::compile_catalog("nested-chain.yaml", &source, "owner");
    support::run_generated("nested-linear-sequence", generated, id, main);
    support::shared_catalog::run_source_program(
        "shared-nested-linear-sequence",
        "nested-chain.yaml",
        &source,
        "owner",
        main,
    );
}

fn with_owner(declarations: &str, path: &str, key: &str) -> String {
    format!(
        "{declarations}- kind: object\n  id: owner\n  imports: {{body: common.body}}\n  value: {{kind: record, fields: [{{name: body, type: {{use: body}}}}]}}\n  representations: {{xml: {{kind: record, fields: [{{field: body, path: {path}}}]}}, yaml: {{kind: mapping, fields: [{{field: body, key: {key}}}]}}}}\n"
    )
}
