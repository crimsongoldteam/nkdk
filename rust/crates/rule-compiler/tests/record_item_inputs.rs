use nkdk_rule_compiler::{SourceFile, compile, link, parse};
use nkdk_rule_model::{
    LinkedExpressionKind, LinkedType, RecordItemInputSource, YamlRepresentation,
};
mod support;

fn compile_rows(
    row: &str,
    list: &str,
) -> Result<nkdk_rule_compiler::GeneratedSources, Vec<nkdk_rule_compiler::Diagnostic>> {
    compile(&[
        SourceFile {
            path: "row.yaml",
            bytes: row.as_bytes(),
        },
        SourceFile {
            path: "list.yaml",
            bytes: list.as_bytes(),
        },
        SourceFile {
            path: "owner.yaml",
            bytes: include_bytes!("fixtures/declared-empty-owner.yaml"),
        },
    ])
}

fn parsed_sources(sources: &[(&str, &[u8])]) -> Vec<nkdk_rule_model::Module> {
    sources
        .iter()
        .flat_map(|(path, bytes)| {
            nkdk_rule_compiler::parse_many(SourceFile { path, bytes }).unwrap()
        })
        .collect()
}

fn linked_sources(sources: &[(&str, &[u8])]) -> nkdk_rule_model::Program {
    link(&parsed_sources(sources)).unwrap()
}

fn empty_rows_owner_id(row: &str, list: &str) -> u32 {
    linked_sources(&[
        ("row.yaml", row.as_bytes()),
        ("list.yaml", list.as_bytes()),
        (
            "owner.yaml",
            include_bytes!("fixtures/declared-empty-owner.yaml"),
        ),
    ])
    .entries
    .iter()
    .find(|entry| entry.name == "test.declared-empty-rows")
    .unwrap()
    .id
}

use support::run_generated;

#[test]
fn record_mapping_parses_per_row_key_and_lookup_inputs() {
    let source = b"format: nkdk-declarations/1\nkind: value\nid: test.rows\nvalue: {kind: sequence, item: {kind: scalar, scalar: text}}\nrepresentations:\n  xml: {kind: element-sequence, path: [Item], item: {kind: text}}\n  yaml:\n    kind: record-mapping\n    key: parameter\n    itemInputs:\n      parameterName: {rowKey: true}\n      valueProfile:\n        lookup:\n          in: {input: profiles}\n          key: {rowKey: true}\n          default: {input: defaultProfile}\n";
    let module = parse(SourceFile {
        path: "rows.yaml",
        bytes: source,
    })
    .unwrap();
    let YamlRepresentation::RecordMapping { item_inputs, .. } = module.representations.yaml else {
        panic!("expected record mapping");
    };
    assert_eq!(item_inputs.len(), 2);
    assert_eq!(item_inputs[0].target, "parameterName");
    assert!(matches!(
        item_inputs[0].source,
        RecordItemInputSource::RowKey
    ));
    assert_eq!(item_inputs[1].target, "valueProfile");
    assert!(matches!(
        &item_inputs[1].source,
        RecordItemInputSource::Lookup { input, default_input }
        if input == "profiles" && default_input == "defaultProfile"
    ));
}

#[test]
fn record_mapping_parses_static_profile_table() {
    let source = b"format: nkdk-declarations/1\nkind: value\nid: test.rows\nvalue: {kind: sequence, item: {kind: scalar, scalar: text}}\nrepresentations:\n  xml: {kind: element-sequence, path: [Item], item: {kind: text}}\n  yaml:\n    kind: record-mapping\n    key: parameter\n    itemInputs:\n      valueProfile:\n        table:\n          key: {rowKey: true}\n          values: {Special: TypeLink, Ordinary: Field}\n          default: Primitive\n";
    let module = parse(SourceFile {
        path: "rows.yaml",
        bytes: source,
    })
    .unwrap();
    let YamlRepresentation::RecordMapping { item_inputs, .. } = module.representations.yaml else {
        panic!("expected record mapping")
    };
    assert!(
        matches!(&item_inputs[0].source, RecordItemInputSource::Table { values, default } if values == &vec![("Special".into(), "TypeLink".into()), ("Ordinary".into(), "Field".into())] && default == "Primitive")
    );
}

#[test]
fn authoring_schema_accepts_static_profile_table() {
    let schema: serde_json::Value =
        serde_json::from_slice(nkdk_rule_compiler::declaration_schema()).unwrap();
    let validator = jsonschema::validator_for(&schema).unwrap();
    let module = serde_json::json!({
        "format": "nkdk-declarations/1", "kind": "value", "id": "test.rows",
        "value": {"kind": "sequence", "item": {"kind": "scalar", "scalar": "text"}},
        "representations": {
            "xml": {"kind": "element-sequence", "path": ["Item"], "item": {"kind": "text"}},
            "yaml": {"kind": "record-mapping", "key": "parameter", "itemInputs": {
                "valueProfile": {"table": {"key": {"rowKey": true}, "values": {"Special": "TypeLink"}, "default": "Primitive"}}
            }}
        }
    });
    assert!(
        validator.is_valid(&module),
        "{}",
        validator
            .iter_errors(&module)
            .map(|error| error.to_string())
            .collect::<Vec<_>>()
            .join("; ")
    );
}

#[test]
fn per_row_inputs_cannot_silently_ignore_an_unknown_target() {
    let row = include_str!("fixtures/declared-row.yaml");
    let list = include_str!("fixtures/declared-rows.yaml").replace(
        "yaml: {kind: sequence}",
        "yaml: {kind: record-mapping, key: name, itemInputs: {unknown: {rowKey: true}}}",
    );
    let result = compile_rows(row, &list);
    assert!(result.is_err(), "unknown row input was ignored");
}

#[test]
fn per_row_lookup_is_emitted_from_a_bound_owner_input() {
    let mut row = include_str!("fixtures/declared-row.yaml").replace(
        "id: common.row",
        "id: common.row\ninputs: {valueProfile: {type: {kind: scalar, scalar: text}}}",
    );
    row.push_str("- id: selected-profile\n  appliesTo: [xml-import, yaml-validation]\n  assert: {eq: [{input: valueProfile}, {literal: Special}]}\n  diagnostic: {code: row.profile, severity: error, at: {field: name}, message: Wrong profile}\n");
    let list = include_str!("fixtures/declared-rows.yaml")
        .replace("id: common.rows", "id: common.rows\ninputs: {profiles: {type: {kind: index, key: {kind: scalar, scalar: text}, value: {kind: scalar, scalar: text}}}, defaultProfile: {type: {kind: scalar, scalar: text}}}")
        .replace("yaml: {kind: sequence}", "yaml: {kind: record-mapping, key: name, itemInputs: {valueProfile: {lookup: {in: {input: profiles}, key: {rowKey: true}, default: {input: defaultProfile}}}}}");
    let owner = "format: nkdk-declarations/1\nkind: object\nid: test.lookup-owner\nimports: {rows: common.rows}\ninputs: {profiles: {type: {kind: index, key: {kind: scalar, scalar: text}, value: {kind: scalar, scalar: text}}}, defaultProfile: {type: {kind: scalar, scalar: text}}}\nvalue: {kind: record, fields: [{name: rows, type: {use: rows, bind: {profiles: {input: profiles}, defaultProfile: {input: defaultProfile}}}}]}\nrepresentations:\n  xml: {kind: record, fields: [{field: rows, path: [Root, Rows]}]}\n  yaml: {kind: mapping, fields: [{field: rows, key: Rows}]}\n";
    let generated = compile(&[
        SourceFile {
            path: "row.yaml",
            bytes: row.as_bytes(),
        },
        SourceFile {
            path: "list.yaml",
            bytes: list.as_bytes(),
        },
        SourceFile {
            path: "owner.yaml",
            bytes: owner.as_bytes(),
        },
    ])
    .unwrap();
    let owner_id = linked_sources(&[
        ("row.yaml", row.as_bytes()),
        ("list.yaml", list.as_bytes()),
        ("owner.yaml", owner.as_bytes()),
    ])
    .entries
    .iter()
    .find(|entry| entry.name == "test.lookup-owner")
    .unwrap()
    .id;
    let code = String::from_utf8(generated.files[0].contents.clone()).unwrap();
    assert!(code.contains(".lookup(key)?"));
    let main = r##"include!("generated.rs");
fn main() {
    let index=text_index(&[("one","Special")]);
    let inputs=prepare_inputs(EntryId(OWNER),vec![("profiles".into(),InputValue::TextIndex(index.clone())),("defaultProfile".into(),InputValue::Text("Primitive".into()))]).unwrap();
    let xml=br#"<Root xmlns:r="urn:row"><Rows><Item><r:Name>one</r:Name><r:Mode>normal</r:Mode></Item></Rows></Root>"#;
    let yaml=convert_file(EntryId(OWNER),Direction::XmlToYaml,xml,&inputs).unwrap().bytes;
    assert!(std::str::from_utf8(&yaml).unwrap().contains("one"));
    let restored=convert_file(EntryId(OWNER),Direction::YamlToXml,&yaml,&inputs).unwrap().bytes;
    assert!(std::str::from_utf8(&restored).unwrap().contains("one"));
    let fallback=prepare_inputs(EntryId(OWNER),vec![("profiles".into(),InputValue::TextIndex(index)),("defaultProfile".into(),InputValue::Text("Special".into()))]).unwrap();
    let xml=br#"<Root xmlns:r="urn:row"><Rows><Item><r:Name>two</r:Name><r:Mode>normal</r:Mode></Item></Rows></Root>"#;
    let yaml=convert_file(EntryId(OWNER),Direction::XmlToYaml,xml,&fallback).unwrap().bytes;
    assert!(std::str::from_utf8(&yaml).unwrap().contains("two"));
}"##;
    let main = format!("{}\n{main}", include_str!("support/text_index.rs"));
    run_generated("row-input-lookup", generated, owner_id, &main);
}

#[test]
fn static_profile_table_is_compiled_without_runtime_index() {
    let mut row = include_str!("fixtures/declared-row.yaml").replace(
        "id: common.row",
        "id: common.row\ninputs: {valueProfile: {type: {kind: scalar, scalar: text}}}",
    );
    row.push_str("- id: selected-profile\n  appliesTo: [xml-import, yaml-validation]\n  assert: {eq: [{input: valueProfile}, {literal: Special}]}\n  diagnostic: {code: row.profile, severity: error, at: {field: name}, message: Wrong profile}\n");
    let list = include_str!("fixtures/declared-rows.yaml").replace(
        "yaml: {kind: sequence}",
        "yaml: {kind: record-mapping, key: name, itemInputs: {valueProfile: {table: {key: {rowKey: true}, values: {one: Special}, default: Primitive}}}}",
    );
    let generated = compile_rows(&row, &list).unwrap();
    let owner_id = empty_rows_owner_id(&row, &list);
    let code = String::from_utf8(generated.files[0].contents.clone()).unwrap();
    assert!(code.contains("\"one\"=>\"Special\""));
    let main = r##"include!("generated.rs");
fn main() {
    let inputs=prepare_inputs(EntryId(OWNER),vec![]).unwrap();
    let xml=br#"<Root xmlns:r="urn:row"><Rows><Item><r:Name>one</r:Name><r:Mode>normal</r:Mode></Item></Rows></Root>"#;
    let yaml=convert_file(EntryId(OWNER),Direction::XmlToYaml,xml,&inputs).unwrap().bytes;
    assert!(!String::from_utf8_lossy(&yaml).contains("!xml"));
    let restored=convert_file(EntryId(OWNER),Direction::YamlToXml,&yaml,&inputs).unwrap().bytes;
    assert!(String::from_utf8_lossy(&restored).contains("one"));
    let other=br#"<Root xmlns:r="urn:row"><Rows><Item><r:Name>two</r:Name><r:Mode>normal</r:Mode></Item></Rows></Root>"#;
    let yaml=convert_file(EntryId(OWNER),Direction::XmlToYaml,other,&inputs).unwrap().bytes;
    assert!(String::from_utf8_lossy(&yaml).contains("!xml"));
}"##;
    run_generated("row-static-table", generated, owner_id, main);
}

#[test]
fn row_key_binding_remains_dynamic_until_the_collection_is_generated() {
    let row = include_str!("fixtures/declared-row.yaml").replace(
        "id: common.row",
        "id: common.row\ninputs: {parameterName: {type: {kind: scalar, scalar: text}}}",
    );
    let list = include_str!("fixtures/declared-rows.yaml").replace(
        "yaml: {kind: sequence}",
        "yaml: {kind: record-mapping, key: name, itemInputs: {parameterName: {rowKey: true}}}",
    );
    let program = linked_sources(&[("row.yaml", row.as_bytes()), ("list.yaml", list.as_bytes())]);
    let collection = program
        .entries
        .iter()
        .find(|entry| entry.name == "common.rows")
        .unwrap();
    let LinkedType::Sequence(item) = &collection.value else {
        panic!("expected sequence")
    };
    let LinkedType::BoundReference { bindings, .. } = item.as_ref() else {
        panic!("expected bound row")
    };
    assert!(matches!(
        bindings[0].value.kind,
        LinkedExpressionKind::RowInput(0)
    ));
}

#[test]
fn row_key_only_declaration_compiles_one_shared_row() {
    let mut row = include_str!("fixtures/declared-row.yaml").replace(
        "id: common.row",
        "id: common.row\ninputs: {parameterName: {type: {kind: scalar, scalar: text}}}",
    );
    row.push_str("- id: matches-row-key\n  appliesTo: [xml-import, yaml-validation]\n  assert: {eq: [{field: name}, {input: parameterName}]}\n  diagnostic: {code: row.key, severity: error, at: {field: name}, message: Key mismatch}\n");
    row.push_str("contributions:\n- index: test.row-key-names\n  key: {input: parameterName}\n  value: {field: name}\n");
    let fragment = row.replacen("kind: value", "kind: fragment", 1).replacen(
        "id: common.row",
        "id: fragment.row-key",
        1,
    );
    let fragment = fragment
        .lines()
        .skip(1)
        .enumerate()
        .map(|(index, line)| format!("{}{line}", if index == 0 { "- " } else { "  " }))
        .collect::<Vec<_>>()
        .join("\n");
    let wrapper = support::composed_record("common.row", "fragment.row-key").replace(
        "  compose: [{use: fields}]",
        "  inputs: {parameterName: {type: {kind: scalar, scalar: text}}}\n  compose: [{use: fields, bind: {parameterName: {input: parameterName}}}]",
    );
    row =
        format!("format: nkdk-declarations/1\nkind: catalog\ndeclarations:\n{fragment}\n{wrapper}");
    let list = include_str!("fixtures/declared-rows.yaml").replace(
        "yaml: {kind: sequence}",
        "yaml: {kind: record-mapping, key: name, itemInputs: {parameterName: {rowKey: true}}}",
    );
    let generated = compile_rows(&row, &list).unwrap();
    assert!(!generated.files.is_empty());
    let owner_id = empty_rows_owner_id(&row, &list);
    let main = r##"include!("generated.rs");
fn main() {
    let inputs=prepare_inputs(EntryId(OWNER),vec![]).unwrap();
    let xml=br#"<Root xmlns:r="urn:row"><Rows><Item><r:Mode>normal</r:Mode><r:Name>one</r:Name></Item><Item><r:Name>two</r:Name><r:Mode>normal</r:Mode></Item></Rows></Root>"#;
    let yaml=convert_file(EntryId(OWNER),Direction::XmlToYaml,xml,&inputs).unwrap().bytes;
    assert!(std::str::from_utf8(&yaml).unwrap().contains("one"));
    assert!(std::str::from_utf8(&yaml).unwrap().contains("two"));
    assert!(std::str::from_utf8(&yaml).unwrap().contains("!xml/raw"),"{}",String::from_utf8_lossy(&yaml));
    let restored=convert_file(EntryId(OWNER),Direction::YamlToXml,&yaml,&inputs).unwrap().bytes;
    assert!(std::str::from_utf8(&restored).unwrap().contains("one"));
    assert!(std::str::from_utf8(&restored).unwrap().contains("two"));
    for (direction,source) in [
      (Direction::XmlToYaml, "<Root xmlns:r=\"urn:row\"><Rows><Item><r:Name>one</r:Name><r:Mode>normal</r:Mode></Item><Item><r:Name>two</r:Name><r:Mode>normal</r:Mode></Item></Rows></Root>"),
      (Direction::YamlToXml, "Rows:\n  one:\n    Mode: normal\n  two:\n    Mode: normal"),
    ] {
      let generation=core::facts::Generation(1);
      let mut builder=fact_builder(generation,core::facts::prepared::FactBudget{text:core::facts::text::TextBudget{entries:2,bytes:100},rows:2});
      let errors=contribute_file(EntryId(OWNER),direction,source.as_bytes(),&inputs,&mut builder);
      assert!(errors.is_empty(),"{errors:?}");
      let facts=builder.finish();let index=fact_id("test.row-key-names").unwrap();
      for name in ["one","two"] {assert_eq!(facts.lookup(generation,index,name),core::facts::FactState::Ready(name));}
    }
}"##;
    run_generated("row-input-key", generated, owner_id, main);
}

#[test]
fn per_row_key_cannot_bind_a_boolean_input() {
    let row = include_str!("fixtures/declared-row.yaml").replace(
        "id: common.row",
        "id: common.row\ninputs: {parameterName: {type: {kind: scalar, scalar: boolean}}}",
    );
    let list = include_str!("fixtures/declared-rows.yaml").replace(
        "yaml: {kind: sequence}",
        "yaml: {kind: record-mapping, key: name, itemInputs: {parameterName: {rowKey: true}}}",
    );
    let errors = compile_rows(&row, &list).err().unwrap();
    assert!(
        errors
            .iter()
            .any(|error| error.code == "expression_type_mismatch"),
        "{errors:?}"
    );
}

#[test]
fn per_row_lookup_requires_a_text_index_and_text_default() {
    let row = include_str!("fixtures/declared-row.yaml").replace(
        "id: common.row",
        "id: common.row\ninputs: {valueProfile: {type: {kind: scalar, scalar: text}}}",
    );
    let list = include_str!("fixtures/declared-rows.yaml")
        .replace(
            "id: common.rows",
            "id: common.rows\ninputs: {profiles: {type: {kind: scalar, scalar: text}}, defaultProfile: {type: {kind: scalar, scalar: text}}}",
        )
        .replace(
            "yaml: {kind: sequence}",
            "yaml: {kind: record-mapping, key: name, itemInputs: {valueProfile: {lookup: {in: {input: profiles}, key: {rowKey: true}, default: {input: defaultProfile}}}}}",
        );
    let errors = link(&parsed_sources(&[
        ("row.yaml", row.as_bytes()),
        ("list.yaml", list.as_bytes()),
    ]))
    .err()
    .unwrap();
    assert!(
        errors
            .iter()
            .any(|error| error.code == "expression_type_mismatch"),
        "{errors:?}"
    );
}

#[test]
fn different_width_text_rows_are_selected_by_disjoint_leading_cells() {
    let source = r#"format: nkdk-declarations/1
kind: catalog
declarations:
- kind: value
  id: pair-kind
  enum: {Pair: Пара}
- kind: value
  id: stop-kind
  enum: {Stop: Конец}
- kind: value
  id: name
  value: {kind: scalar, scalar: text, pattern: '[A-Za-zА-Яа-я]+'}
  representations: {xml: {kind: text}, yaml: {kind: scalar, scalar: text}}
- kind: value
  id: pair
  imports: {kind: pair-kind, name: name}
  value: {kind: record, fields: [{name: kind, type: {use: kind}}, {name: name, type: {use: name}}]}
  representations:
    xml: {kind: text-pattern, separator: '.', parts: [{field: kind}, {field: name}]}
    yaml: {kind: text-pattern, separator: '.', parts: [{field: kind}, {field: name}]}
- kind: value
  id: stop-prefix
  imports: {kind: stop-kind}
  value: {kind: record, fields: [{name: kind, type: {use: kind}}]}
  representations:
    xml: {kind: text-pattern, parts: [{literal: End}, {field: kind}]}
    yaml: {kind: text-pattern, parts: [{literal: Закрыть}, {field: kind}]}
- kind: value
  id: stop
  imports: {kind: stop-prefix}
  value: {kind: record, fields: [{name: kind, type: {use: kind}}]}
  representations:
    xml: {kind: text-pattern, parts: [{field: kind}]}
    yaml: {kind: text-pattern, parts: [{field: kind}]}
- kind: value
  id: item
  imports: {pair: pair, stop: stop}
  value: {kind: choice, variants: [{name: pair, type: {use: pair}}, {name: stop, type: {use: stop}}]}
  representations: {xml: {kind: choice}, yaml: {kind: choice}}
- kind: value
  id: rows
  imports: {item: item}
  value: {kind: sequence, item: {use: item}}
  representations: {xml: {kind: text-sequence, separator: '.'}, yaml: {kind: text-sequence, separator: '.'}}
- kind: object
  id: owner
  imports: {rows: rows}
  value: {kind: record, fields: [{name: rows, type: {use: rows}}]}
  representations:
    xml: {kind: record, fields: [{field: rows, path: [Root, Rows]}]}
    yaml: {kind: mapping, fields: [{field: rows, key: Строки}]}
"#;
    let (generated, owner) = support::compile_catalog("variable-rows.yaml", source, "owner");
    support::run_generated(
        "variable-text-rows",
        generated,
        owner,
        r#"
include!("generated.rs");
fn main() {
 let entry=EntryId(OWNER);
 let xml=b"<Root><Rows>Pair.Name.EndStop.Pair.Stop</Rows></Root>";
 let result=convert_file(entry,Direction::XmlToYaml,xml,&PreparedInputs::default()).unwrap();
 assert_eq!(std::str::from_utf8(&result.bytes).unwrap().trim(),"Строки: Пара.Name.ЗакрытьКонец.Пара.Stop");
 let restored=convert_file(entry,Direction::YamlToXml,&result.bytes,&PreparedInputs::default()).unwrap();
 nkdk_conversion_core::proof::verify(xml,&restored.bytes,|_|false).unwrap();
}
"#,
    );
    let collision = source.replace("enum: {Pair: Пара}", "enum: {EndStop: ЗакрытьКонец}");
    let errors = nkdk_rule_compiler::compile(&[nkdk_rule_compiler::SourceFile {
        path: "collision.yaml",
        bytes: collision.as_bytes(),
    }])
    .unwrap_err();
    assert!(
        errors
            .iter()
            .any(|error| error.message.contains("first cells must be disjoint")),
        "{errors:?}"
    );
}

#[test]
fn preserved_mapping_rows_keep_the_prepared_key_dictionary() {
    let source = r#"format: nkdk-declarations/1
kind: catalog
declarations:
- kind: value
  id: sample.row
  value: {kind: record, fields: [{name: name, type: {kind: scalar, scalar: text}}, {name: text, type: {kind: scalar, scalar: text}}]}
  representations:
    xml: {kind: record, fields: [{field: name, path: [Name]}, {field: text, path: [Text]}]}
    yaml: {kind: mapping, fields: [{field: name, key: Name}, {field: text, key: Text}]}
- kind: value
  id: sample.rows
  imports: {row: sample.row}
  inputs:
    names:
      type:
        @DICTIONARY@
  value: {kind: sequence, item: {use: row}}
  representations:
    xml: {kind: element-sequence, path: [Item]}
    yaml: {kind: record-mapping, key: name, value: text, keyTable: {input: names, internal: internal, external: external}}
- kind: object
  id: sample.owner
  imports: {rows: sample.rows}
  inputs:
    names:
      type:
        @DICTIONARY@
  value: {kind: record, fields: [{name: rows, type: {use: rows, bind: {names: {input: names}}}}]}
  representations:
    xml: {kind: record, fields: [{field: rows, path: [Root, Entries]}]}
    yaml: {kind: mapping, fields: [{field: rows, key: Entries}]}
"#;
    let dictionary = r#"kind: sequence
        item:
          kind: record
          fields:
          - {name: internal, type: {kind: scalar, scalar: text}}
          - {name: external, type: {kind: scalar, scalar: text}}"#;
    let source = source.replace("@DICTIONARY@", dictionary);
    let (generated, id) = support::compile_catalog("dictionary.yaml", &source, "sample.owner");
    let main = r#"mod generated;use generated::*;use nkdk_conversion_core::{Direction,InputValue};
fn main(){
let entry=EntryId(OWNER);
let inputs=prepare_inputs(entry,vec![("names".into(),InputValue::Sequence(vec![InputValue::Record(vec![("internal".into(),InputValue::Text("alpha".into())),("external".into(),InputValue::Text("Первый".into()))])]))]).unwrap();
let xml=b"<Root><Entries><Item><Name>alpha</Name><Text>one</Text></Item></Entries></Root>";
let ordinary=convert_file(entry,Direction::XmlToYaml,xml,&inputs).unwrap();
assert!(std::str::from_utf8(&ordinary.bytes).unwrap().contains("Первый"));
verify_candidate(entry,xml,&ordinary.bytes,&inputs).unwrap();
let exceptional=b"<Root><Entries><Item extra='kept'><Name>alpha</Name><Text>one</Text></Item></Entries></Root>";
let preserved=convert_file(entry,Direction::XmlToYaml,exceptional,&inputs).unwrap();
verify_candidate(entry,exceptional,&preserved.bytes,&inputs).unwrap();
}"#;
    support::run_generated("nkdk-preserved-key-dictionary", generated, id, main);
}
