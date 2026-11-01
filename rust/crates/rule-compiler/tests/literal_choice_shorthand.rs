mod support;

#[test]
fn finite_record_shorthands_select_their_choice_without_a_text_fallback() {
    let source = r#"format: nkdk-declarations/1
kind: catalog
declarations:
- kind: value
  id: test.point
  value: {kind: record, fields: [{name: x, type: {kind: scalar, scalar: number, profile: decimal}}, {name: y, type: {kind: scalar, scalar: number, profile: decimal}}]}
  representations:
    xml: {kind: record, fields: [{field: x, path: [X]}, {field: y, path: [Y]}]}
    yaml:
      kind: mapping
      fields: [{field: x, key: X}, {field: y, key: Y}]
      shorthand:
      - {id: origin, representation: {kind: scalar, literal: origin}, denotes: {record: {x: {literal: 0}, y: {literal: 0}}}}
      - {id: unit, representation: {kind: scalar, literal: unit}, denotes: {record: {x: {literal: 1}, y: {literal: 1}}}}
- kind: value
  id: test.flag-word
  enum: {Disabled: {yaml: disabled, xml: 'false', accept: [off]}, Enabled: {yaml: enabled, xml: 'true'}}
- kind: value
  id: test.flag-text
  value: {kind: scalar, scalar: text, pattern: '[A-Za-z][A-Za-z0-9_]*'}
  representations: {xml: {kind: text}, yaml: {kind: scalar, scalar: text}}
- kind: value
  id: test.flag
  imports: {word: test.flag-word, text: test.flag-text}
  value: {kind: choice, variants: [{name: word, type: {use: word}}, {name: text, type: {use: text}}]}
  representations: {xml: {kind: choice, fallback: text}, yaml: {kind: choice, fallback: text}}
- kind: value
  id: test.literal-choice
  namespaces: {xsi: http://www.w3.org/2001/XMLSchema-instance, t: urn:test}
  imports: {point: test.point, flag: test.flag}
  value: {kind: choice, variants: [{name: point, type: {use: point}}, {name: flag, type: {use: flag}}]}
  representations:
    xml:
      kind: choice
      attribute: xsi:type
      otherwise: flag
      variants: [{variant: point, in: [t:Point], emit: t:Point}, {variant: flag, in: [t:Flag], emit: t:Flag}]
    yaml: {kind: choice, variants: [{variant: point, form: mapping, key: X}]}
- kind: object
  id: test.literal-owner
  imports: {item: test.literal-choice}
  value: {kind: record, fields: [{name: item, type: {use: item}}]}
  representations:
    xml: {kind: record, fields: [{field: item, path: [Root, Value]}]}
    yaml: {kind: mapping, fields: [{field: item, key: Item}]}
"#;
    let (generated, owner) = support::compile_catalog("literal.yaml", source, "test.literal-owner");
    support::run_generated(
        "literal-choice-shorthands",
        generated,
        owner,
        r#"
mod generated;
use nkdk_conversion_core as core;
use generated::automata_store;
use generated::*;
fn main() {
    let entry=EntryId(OWNER);
    for (body,kind,short) in [("<X>0</X><Y>0</Y>","Point","origin"),("<X>1</X><Y>1</Y>","Point","unit"),("false","Flag","disabled")] {
        let xml=format!("<Root xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance' xmlns:t='urn:test'><Value xsi:type='t:{kind}'>{body}</Value></Root>");
        let yaml=format!("Item: {short}");
        let inputs=PreparedInputs::default();
        let imported=convert_file(entry,Direction::XmlToYaml,xml.as_bytes(),&inputs).unwrap().bytes;
        let block=format!("Item:\n  {short}");
        assert!(imported==yaml.as_bytes() || imported==block.as_bytes(),"{}",String::from_utf8_lossy(&imported));
        verify_candidate(entry,xml.as_bytes(),yaml.as_bytes(),&inputs).unwrap();
    }
    let xml=b"<Root xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance' xmlns:t='urn:test'><Value xsi:type='t:Flag'>off</Value></Root>";
    let inputs=PreparedInputs::default();
    let imported=convert_file(entry,Direction::XmlToYaml,xml,&inputs).unwrap().bytes;
    let yaml=String::from_utf8(imported).unwrap();
    assert!(yaml.contains("!xml/raw") && yaml.contains("$значение: disabled"),"{yaml}");
    verify_candidate(entry,xml,yaml.as_bytes(),&inputs).unwrap();
}
"#,
    );
    let source = format!(
        "{source}{}",
        r#"
- kind: value
  id: test.flag-path
  imports: {part: test.flag}
  value: {kind: record, fields: [{name: part, type: {use: part}}]}
  representations:
    xml: {kind: text-pattern, separator: '.', parts: [{literal: path}, {field: part}]}
    yaml: {kind: text-pattern, separator: '.', parts: [{literal: path}, {field: part}]}
- kind: object
  id: test.path-owner
  imports: {path: test.flag-path}
  value: {kind: record, fields: [{name: path, type: {use: path}}]}
  representations:
    xml: {kind: record, fields: [{field: path, path: [Root, Value]}]}
    yaml: {kind: mapping, fields: [{field: path, key: Item}]}
"#
    );
    let (generated, owner) = support::compile_catalog("path.yaml", &source, "test.path-owner");
    support::run_generated(
        "nested-text-choice-slots",
        generated,
        owner,
        r#"
mod generated;
use nkdk_conversion_core as core;
use generated::automata_store;
use generated::*;
fn main() {
    let entry=EntryId(OWNER);
    let inputs=PreparedInputs::default();
    for (body,word,raw) in [("false","disabled",false),("off","disabled",true),("custom","custom",false)] {
        let xml=format!("<Root><Value>path.{body}</Value></Root>");
        let imported=convert_file(entry,Direction::XmlToYaml,xml.as_bytes(),&inputs).unwrap().bytes;
        let yaml=String::from_utf8(imported).unwrap();
        assert_eq!(yaml.contains("!xml/raw"),raw,"{yaml}");
        assert!(yaml.contains(&format!("path.{word}")),"{yaml}");
        verify_candidate(entry,xml.as_bytes(),yaml.as_bytes(),&inputs).unwrap();
    }
}
"#,
    );
    let invalid_source = format!(
        "{}{}",
        source.replace(
            "imports: {part: test.flag}",
            "imports: {part: test.attribute-choice}"
        ),
        r#"
- kind: value
  id: test.attribute-choice
  namespaces: {xsi: http://www.w3.org/2001/XMLSchema-instance, t: urn:test}
  imports: {word: test.flag-word, text: test.flag-text}
  value: {kind: choice, variants: [{name: word, type: {use: word}}, {name: text, type: {use: text}}]}
  representations:
    xml: {kind: choice, attribute: xsi:type, otherwise: text, variants: [{variant: word, in: [t:Word], emit: t:Word}, {variant: text, in: [t:Text], emit: t:Text}]}
    yaml: {kind: choice, fallback: text}
"#
    );
    let errors = nkdk_rule_compiler::compile_exporting(
        &[nkdk_rule_compiler::SourceFile {
            path: "attribute-slot.yaml",
            bytes: invalid_source.as_bytes(),
        }],
        |entry| entry.id == "test.path-owner",
    )
    .unwrap_err();
    assert!(
        errors.iter().any(|error| error.code == "text_pattern_type"),
        "{errors:?}"
    );
}
