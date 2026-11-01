use nkdk_rule_compiler::{SourceFile, compile};
mod support;

#[test]
fn a_record_wrapper_specializes_its_presence_conditions_before_placing_them() {
    let value = "format: nkdk-declarations/1\nkind: value\nid: phrase\ninputs: {context: {type: {kind: scalar, scalar: text}}}\nparameters:\n  omit: {type: {kind: scalar, scalar: boolean}, default: false}\nvalue: {kind: record, fields: [{name: text, type: {kind: scalar, scalar: text}}]}\nrepresentations:\n  xml: {kind: record, fields: [{field: text, path: [Text]}]}\n  yaml: {kind: mapping, fields: [{field: text, key: Текст}]}\npresence:\n- target: self\n  yaml: {missing: {denotes: {absent: true}}}\n  xml:\n    missing: {denotes: {absent: true}}\n    canonical: [{when: {parameter: omit}, form: missing}, {form: ordinary}]\n";
    for condition in [
        "{parameter: omit}",
        "{eq: [{field: text}, {input: context}]}",
        "{not: {present: {field: text}}}",
    ] {
        let value = value.replace("{parameter: omit}", condition);
        for flag in ["false", "true"] {
            let owner = format!(
                "format: nkdk-declarations/1\nkind: object\nid: owner\nimports: {{phrase: phrase}}\ninputs: {{context: {{type: {{kind: scalar, scalar: text}}}}}}\nvalue: {{kind: record, fields: [{{name: phrase, type: {{use: phrase, with: {{omit: {flag}}}, bind: {{context: {{input: context}}}}}}}}]}}\nrepresentations:\n  xml: {{kind: record, fields: [{{field: phrase, path: [Root,Value]}}]}}\n  yaml: {{kind: mapping, fields: [{{field: phrase, key: Значение}}]}}\n"
            );
            let generated = compile(&[
                SourceFile {
                    path: "phrase.yaml",
                    bytes: value.as_bytes(),
                },
                SourceFile {
                    path: "owner.yaml",
                    bytes: owner.as_bytes(),
                },
            ])
            .unwrap();
            if condition.starts_with("{eq:") && flag == "false" {
                support::run_generated(
                    "record-condition-scope",
                    generated,
                    0,
                    r#"include!("generated.rs");
fn main() {
    let id=entry_id("owner").unwrap();
    let inputs=prepare_inputs(id,vec![("context".into(),InputValue::Text("hide".into()))]).unwrap();
    let absent=convert_file(id,Direction::YamlToXml,b"{}",&inputs).unwrap().bytes;
    assert!(!std::str::from_utf8(&absent).unwrap().contains("Value"));
    let absent=convert_file(id,Direction::XmlToYaml,b"<Root/>",&inputs).unwrap().bytes;
    assert!(absent.is_empty());
    for (text,visible) in [("hide",false),("show",true)] {
        let yaml=format!("Значение:\n  Текст: {text}\n");
        let xml=convert_file(id,Direction::YamlToXml,yaml.as_bytes(),&inputs).unwrap().bytes;
        assert_eq!(std::str::from_utf8(&xml).unwrap().contains("<Value>"),visible);
    }
}"#,
                );
            }
        }
    }
}

#[test]
fn scalar_owner_retains_child_order_without_changing_readable_fields() {
    let source = r#"format: nkdk-declarations/1
kind: object
id: owner
value:
  kind: record
  fields:
  - {name: first, type: {kind: scalar, scalar: text}}
  - {name: second, type: {kind: scalar, scalar: text}}
representations:
  xml: {kind: record, fields: [{field: first, path: [Root, First]}, {field: second, path: [Root, Second]}]}
  yaml: {kind: mapping, fields: [{field: first, key: Первый}, {field: second, key: Второй}]}
"#;
    let (generated, owner) = support::compile_catalog("scalar-order.yaml", source, "owner");
    support::run_generated(
        "scalar-owner-order",
        generated,
        owner,
        r#"
include!("generated.rs");
fn main() {
    let entry=EntryId(OWNER);
    for (xml, marked) in [("<Root><First>one</First><Second>two</Second></Root>",false),
                          ("<Root><Second>two</Second><First>one</First></Root>",true)] {
        let converted=convert_file(entry,Direction::XmlToYaml,xml.as_bytes(),&PreparedInputs::default()).unwrap();
        let yaml=std::str::from_utf8(&converted.bytes).unwrap();
        assert_eq!(yaml.starts_with("!xml/raw"),marked,"{yaml}");
        assert!(yaml.contains("Первый: one")&&yaml.contains("Второй: two"),"{yaml}");
        let restored=convert_file(entry,Direction::YamlToXml,&converted.bytes,&PreparedInputs::default()).unwrap();
        nkdk_conversion_core::proof::verify(xml.as_bytes(),&restored.bytes,|_|false).unwrap();
    }
}
"#,
    );
}
