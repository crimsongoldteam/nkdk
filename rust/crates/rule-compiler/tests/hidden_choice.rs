use nkdk_rule_compiler::{SourceFile, compile};
mod support;
fn run_generated(
    label: &str,
    generated: nkdk_rule_compiler::GeneratedSources,
    entry: u32,
    harness: &str,
) {
    support::run_generated(
        label,
        generated,
        entry,
        &harness.replace("@PAIR_HELPER@", include_str!("support/semantic-pair.rs.in")),
    );
}
const DECLARATION: &str = include_str!("fixtures/hidden-choice.yaml");
#[test]
fn hidden_structured_choice_generates_from_its_visible_projection() {
    for (declaration, visible_choice) in [
        (DECLARATION, false),
        (include_str!("fixtures/nested-hidden-choice.yaml"), false),
        (
            include_str!("fixtures/nested-hidden-choice-conditional.yaml"),
            false,
        ),
        (include_str!("fixtures/nested-choice-view.yaml"), true),
    ] {
        let generated = compile(&[SourceFile {
            path: "hidden-choice.yaml",
            bytes: declaration.as_bytes(),
        }])
        .unwrap();
        run_generated(
        "hidden-choice-generated",
        generated,
        0,
        r#"
include!("generated.rs");
@PAIR_HELPER@
fn main() {
 let entry=entry_id("test.hidden-owner").unwrap();
 for (kind,prefix) in @VARIANTS@ {
 for label in ["hello", "another value"] {
  let xml=format!("<Root xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance' xmlns:t='urn:test' ><Source xsi:type='t:{kind}'><Label>{label}</Label></Source></Root>");
  let expected=format!("{prefix}: {label}");
  let reverse=assert_pair(entry,xml.as_bytes(),expected.as_bytes());
  assert!(reverse.diagnostics.is_empty(),"{:?}",reverse.diagnostics);
  let again=convert_file(entry,Direction::XmlToYaml,&reverse.bytes,&PreparedInputs::default()).unwrap();
  assert_eq!(again.bytes,expected.as_bytes());
 }
 }
 for attributes in ["xsi:type='t:Row' extra='preserved'", "xsi:type='t:Unknown'"] {
  let xml=format!("<Root xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance' xmlns:t='urn:test' ><Source {attributes}><Label>retained</Label></Source></Root>");
  let yaml=convert_file(entry,Direction::XmlToYaml,xml.as_bytes(),&PreparedInputs::default()).unwrap();
  let readable=String::from_utf8_lossy(&yaml.bytes);
  assert!(readable.contains("retained"),"{readable}");
  assert!(readable.contains("!xml"),"{readable}");
  verify_candidate(entry,xml.as_bytes(),&yaml.bytes,&PreparedInputs::default()).unwrap();
 }
}
"#.replace("@VARIANTS@", if visible_choice { r#"[("Row","Visible:\n  Label"),("Other","Visible:\n  Alternative")]"# } else { r#"[("Row","Label")]"# }).as_str(),
    );
    }
    let nested_text = include_str!("fixtures/nested-hidden-choice.yaml").replace(
        "  value: {kind: scalar, scalar: text}\n  representations: {xml: {kind: text}, yaml: {kind: scalar, scalar: text}}",
        r#"  imports: {inner: test.text-inner}
  value: {kind: choice, variants: [{name: nested, type: {use: inner}}]}
  representations: {xml: {kind: choice}, yaml: {kind: choice}}
- kind: value
  id: test.text-inner
  imports: {word: test.text-word}
  value: {kind: choice, variants: [{name: word, type: {use: word}}]}
  representations: {xml: {kind: choice}, yaml: {kind: choice}}
- kind: value
  id: test.text-word
  value: {kind: enum, variants: [{name: First, value: first}, {name: Second, value: second}]}
  representations:
    xml: {kind: text, values: [{value: first, text: alpha}, {value: second, text: beta}]}
    yaml: {kind: scalar, values: [{value: first, literal: first}, {value: second, literal: second}]}"#,
    );
    let nested_pattern = nested_text
        .replace(
            "imports: {word: test.text-word}",
            "imports: {word: test.text-word, name: test.text-name}",
        )
        .replace(
            "variants: [{name: word, type: {use: word}}]",
            "variants: [{name: word, type: {use: word}}, {name: name, type: {use: name}}]",
        )
        .replace(
            "- kind: value\n  id: test.hidden-row",
            r#"- kind: value
  id: test.text-identifier
  value: {kind: scalar, scalar: text, pattern: '[A-Za-z]+'}
  representations: {xml: {kind: text}, yaml: {kind: scalar, scalar: text}}
- kind: value
  id: test.text-name
  imports: {identifier: test.text-identifier}
  value: {kind: record, fields: [{name: label, type: {use: identifier}}]}
  representations:
    xml: {kind: text-pattern, parts: [{literal: 'Name.'}, {field: label}]}
    yaml: {kind: text-pattern, parts: [{literal: 'Имя.'}, {field: label}]}
- kind: value
  id: test.hidden-row"#,
        );
    for (declaration, pairs) in [
        (
            nested_text.as_str(),
            r#"[("alpha","first"),("beta","second")]"#,
        ),
        (
            nested_pattern.as_str(),
            r#"[("alpha","first"),("Name.SomeName","Имя.SomeName")]"#,
        ),
    ] {
        let generated = compile(&[SourceFile {
            path: "nested-text-construction.yaml",
            bytes: declaration.as_bytes(),
        }])
        .unwrap();
        run_generated("nested-text-construction", generated, 0, &r#"
include!("generated.rs");
@PAIR_HELPER@
fn main() {
 let entry=entry_id("test.hidden-owner").unwrap();
 for (xml_word,yaml_word) in @PAIRS@ {
  let xml=format!("<Root xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance' xmlns:t='urn:test'><Source xsi:type='t:Row'><Label>{xml_word}</Label></Source></Root>");
  let expected=format!("Label: {yaml_word}");
  assert_pair(entry,xml.as_bytes(),expected.as_bytes());
 }
 for word in ["unknown", "2026-02-29T12:34:56"] {
  let xml=format!("<Root xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance' xmlns:t='urn:test'><Source xsi:type='t:Row'><Label>{word}</Label></Source></Root>");
  assert_preserved_pair(entry,xml.as_bytes());
 }
}
"#.replace("@PAIRS@", pairs));
    }
    let row_start = "- kind: value\n  id: test.hidden-row";
    let direct_nested_text = format!(
        "{}{}",
        &nested_text[..nested_text.find(row_start).unwrap()],
        &DECLARATION[DECLARATION.find(row_start).unwrap()..]
    )
    .replace(
        "imports: {row: test.hidden-row}",
        "imports: {row: test.hidden-text}",
    )
    .replace(
        "yaml: {kind: choice, variants: [{variant: row, form: mapping, key: Label}]}",
        "yaml: {kind: choice}",
    )
    .replace(
        "value: {record: {label: {field: label}}}",
        "value: {field: label}",
    )
    .replace(
        "{get: {of: {variantValue: {value: {field: source}, variant: row}}, field: label}}",
        "{variantValue: {value: {field: source}, variant: row}}",
    );
    let generated = compile(&[SourceFile {
        path: "direct-text-choice-construction.yaml",
        bytes: direct_nested_text.as_bytes(),
    }])
    .unwrap();
    let lexical_harness = r#"
include!("generated.rs");
@PAIR_HELPER@
fn main(){
 let entry=entry_id("test.hidden-owner").unwrap();
 for (word,yaml) in [("alpha","Label: first"),("beta","Label: second")] {
  let xml=format!("<Root xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance' xmlns:t='urn:test'><Source xsi:type='t:Row'>{word}</Source></Root>");
  assert_pair(entry,xml.as_bytes(),yaml.as_bytes());
 }
 let xml=b"<Root xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance' xmlns:t='urn:test'><Source xsi:type='t:Row'>unknown</Source></Root>";
 let preserved=assert_preserved_pair(entry,xml);
 assert!(String::from_utf8_lossy(&preserved.bytes).contains("Label: !xml/"));
 @EXTRA@
}
"#;
    run_generated("direct-text-choice-construction", generated, 0, &lexical_harness.replace("@EXTRA@", r#" let yaml="Label: !xml/raw\n  $значение: first\n  $xml:\n    _extra: kept".as_bytes();
 let restored=convert_file(entry,Direction::YamlToXml,yaml,&PreparedInputs::default()).unwrap();
 let text=String::from_utf8_lossy(&restored.bytes);
 assert!(text.contains("alpha")&&text.contains("kept"),"{text}");
 let expected=b"<Root xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance' xmlns:t='urn:test'><Source xsi:type='t:Row' extra='kept'>alpha</Source></Root>";
 verify_candidate(entry,expected,yaml,&PreparedInputs::default()).unwrap();"#));
    let mixed_text = direct_nested_text
        .replace("imports: {row: test.hidden-text}", "imports: {row: test.hidden-text, record: test.hidden-row}")
        .replace("variants: [{name: row, type: {use: row}}]", "variants: [{name: row, type: {use: row}}, {name: record, type: {use: record}}]")
        .replace("variants: [{variant: row, in: [t:Row], emit: t:Row}]", "variants: [{variant: row, in: [t:Row], emit: t:Row}, {variant: record, in: [t:Record], emit: t:Record}]")
        .replace("otherwise: row}\n    yaml: {kind: choice}", "otherwise: row}\n    yaml: {kind: choice, variants: [{variant: record, form: mapping, key: Label}], fallback: row}");
    let generated = compile(&[SourceFile {
        path: "mixed-text-choice-construction.yaml",
        bytes: mixed_text.as_bytes(),
    }])
    .unwrap();
    run_generated(
        "mixed-text-choice-construction",
        generated,
        0,
        &lexical_harness.replace("@EXTRA@", ""),
    );
    let opaque_projection = mixed_text
        .replace("- kind: object", r#"- kind: value
  id: test.projected-text
  imports: {text: test.hidden-text}
  value: {kind: record, fields: [{name: value, type: {use: text}}]}
  representations:
    xml: {kind: record, fields: [{field: value, path: []}]}
    yaml: {kind: projection, field: value}
- kind: object"#)
        .replace("imports: {row: test.hidden-text, record: test.hidden-row}", "imports: {row: test.projected-text, record: test.hidden-row}")
        .replace("{name: row, value: {field: label}}", "{name: row, value: {record: {value: {field: label}}}}")
        .replace("denotes: {variantValue: {value: {field: source}, variant: row}}", "denotes: {get: {of: {variantValue: {value: {field: source}, variant: row}}, field: value}}");
    let generated = compile(&[SourceFile {
        path: "opaque-record-projection.yaml",
        bytes: opaque_projection.as_bytes(),
    }])
    .unwrap();
    run_generated(
        "opaque-record-projection",
        generated,
        0,
        r#"
include!("generated.rs");
@PAIR_HELPER@
fn main(){
 let entry=entry_id("test.hidden-owner").unwrap();
 let valid=b"<Root xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance' xmlns:t='urn:test'><Source xsi:type='t:Row'>alpha</Source></Root>";
 assert_pair(entry,valid,b"Label: first");
 let invalid=b"<Root xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance' xmlns:t='urn:test'><Source xsi:type='t:Row'>unknown</Source></Root>";
 let preserved=assert_preserved_pair(entry,invalid);
 assert!(String::from_utf8_lossy(&preserved.bytes).contains("Label: !xml/"));
 let opaque="Label: !xml/raw\n  $значение: {}\n  $xml:\n    '#replace': 'true'\n    _{http://www.w3.org/2001/XMLSchema-instance}type: '{urn:test}Row'\n    '#text': unknown".as_bytes();
 verify_candidate(entry,invalid,opaque,&PreparedInputs::default()).unwrap();
 let restored=convert_file(entry,Direction::YamlToXml,opaque,&PreparedInputs::default()).unwrap();
 assert!(String::from_utf8_lossy(&restored.bytes).contains("unknown"));
 let annotated="Label: !xml/raw\n  $значение: first\n  $xml:\n    _extra: kept".as_bytes();
 let expected=b"<Root xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance' xmlns:t='urn:test'><Source xsi:type='t:Row' extra='kept'>alpha</Source></Root>";
 let restored=convert_file(entry,Direction::YamlToXml,annotated,&PreparedInputs::default()).unwrap();
 let text=String::from_utf8_lossy(&restored.bytes);
 assert!(text.contains("alpha")&&text.contains("kept"),"{text}");
 verify_candidate(entry,expected,annotated,&PreparedInputs::default()).unwrap_or_else(|errors|panic!("{errors:?} restored={text}"));
 for (patch, expected) in [
  ("_{http://www.w3.org/2001/XMLSchema-instance}type: '{urn:test}Row'\n    _extra: kept", expected.as_slice()),
  ("_{http://www.w3.org/2001/XMLSchema-instance}type: null\n    _extra: kept", b"<Root><Source extra='kept'>alpha</Source></Root>".as_slice()),
 ] {
  let annotated=format!("Label: !xml/raw\n  $значение: first\n  $xml:\n    {patch}");
  verify_candidate(entry,expected,annotated.as_bytes(),&PreparedInputs::default()).unwrap();
 }

}
"#,
    );
    // A reversible scalar shorthand may capture a leaf through a structural choice.
    let short = DECLARATION.replace(
        "yaml: {kind: mapping, fields: [{field: label, key: Label}]}\n  presence:",
        "yaml: {kind: mapping, fields: [{field: label, key: Label}], shorthand: [{id: plain, representation: {kind: scalar, scalar: text, capture: text}, denotes: {record: {source: {variant: {name: row, value: {record: {label: {capture: text}}}}}, label: {capture: text}}}}]}\n  presence:",
    );
    let service = short
        .replace("- kind: object", "- kind: value\n  id: test.hidden-flag\n  value: {kind: scalar, scalar: boolean}\n  representations: {xml: {kind: text, values: [{value: false, text: 'false'}, {value: true, text: 'true'}]}, yaml: {kind: scalar, values: [{value: false, literal: disabled}, {value: true, literal: enabled}]}}\n- kind: object")
        .replace("imports: {source: test.hidden-choice, text: test.hidden-text}", "imports: {source: test.hidden-choice, text: test.hidden-text, flag: test.hidden-flag}")
        .replace("fields: [{name: source, type: {use: source}}, {name: label, type: {use: text}}]", "fields: [{name: source, type: {use: source}}, {name: label, type: {use: text}}, {name: active, type: {use: flag}}]")
        .replace("fields: [{field: source, path: [Root, Source]}]", "fields: [{field: source, path: [Root, Source]}, {field: active, path: [Root, Active]}]")
        .replace("fields: [{field: label, key: Label}], shorthand:", "fields: [{field: label, key: Label}, {field: active, key: Active}], shorthand:")
        .replace("label: {capture: text}}}}]", "label: {capture: text}, active: {literal: true}}}}]");
    let service = format!(
        "{service}\n  - target: {{field: active}}\n    xml: {{missing: {{denotes: {{literal: true}}}}, canonical: [{{when: {{field: active}}, form: missing}}, {{form: ordinary}}]}}\n    yaml: {{missing: {{denotes: {{literal: true}}}}, omitWhen: {{field: active}}}}\n"
    );
    let numeric = short
        .replace("- kind: object", "- kind: value\n  id: test.hidden-number\n  value: {kind: scalar, scalar: number, profile: decimal}\n  representations: {xml: {kind: text}, yaml: {kind: scalar, scalar: number}}\n- kind: object")
        .replace("imports: {source: test.hidden-choice, text: test.hidden-text}", "imports: {source: test.hidden-choice, text: test.hidden-text, number: test.hidden-number}")
        .replace("fields: [{name: source, type: {use: source}}, {name: label, type: {use: text}}]", "fields: [{name: source, type: {use: source}}, {name: label, type: {use: text}}, {name: count, type: {use: number}}]")
        .replace("fields: [{field: source, path: [Root, Source]}]", "fields: [{field: source, path: [Root, Source]}, {field: count, path: [Root, Count]}]")
        .replace("fields: [{field: label, key: Label}], shorthand:", "fields: [{field: label, key: Label}, {field: count, key: Count}], shorthand:")
        .replace("label: {capture: text}}}}]", "label: {capture: text}, count: {literal: 42}}}}]");
    let numeric = format!(
        "{numeric}\n  - target: {{field: count}}\n    xml: {{missing: {{denotes: {{literal: 42}}}}, canonical: [{{when: {{eq: [{{field: count}}, {{literal: 42}}]}}, form: missing}}, {{form: ordinary}}]}}\n    yaml: {{missing: {{denotes: {{literal: 42}}}}, omitWhen: {{eq: [{{field: count}}, {{literal: 42}}]}}}}\n"
    );
    let numeric_extra = r#"let xml=b"<Root xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance' xmlns:t='urn:test'><Source xsi:type='t:Row'><Label>hello</Label></Source><Count>43</Count></Root>"; assert_pair(entry,xml,b"Label: hello\nCount: 43");"#;
    let multiple_numbers = numeric
        .replace(
            "{name: count, type: {use: number}}]",
            "{name: count, type: {use: number}}, {name: total, type: {use: number}}]",
        )
        .replace(
            "{field: count, path: [Root, Count]}]",
            "{field: count, path: [Root, Count]}, {field: total, path: [Root, Total]}]",
        )
        .replace(
            "{field: count, key: Count}]",
            "{field: count, key: Count}, {field: total, key: Total}]",
        )
        .replace(
            "count: {literal: 42}}}}]",
            "count: {literal: 42}, total: {literal: 99}}}}]",
        );
    let multiple_numbers = format!(
        "{multiple_numbers}\n  - target: {{field: total}}\n    xml: {{missing: {{denotes: {{literal: 99}}}}, canonical: [{{when: {{eq: [{{field: total}}, {{literal: 99}}]}}, form: missing}}, {{form: ordinary}}]}}\n    yaml: {{missing: {{denotes: {{literal: 99}}}}, omitWhen: {{eq: [{{field: total}}, {{literal: 99}}]}}}}\n"
    );
    let extra = r#"let xml=b"<Root xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance' xmlns:t='urn:test'><Source xsi:type='t:Row'><Label>hello</Label></Source><Active>false</Active></Root>"; assert_pair(entry,xml,b"Label: hello\nActive: disabled");"#;
    let harness = r#"
include!("generated.rs");
@PAIR_HELPER@
fn main(){
 let entry=entry_id("test.hidden-owner").unwrap();
 for text in ["hello", ""] {
  let xml=format!("<Root xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance' xmlns:t='urn:test'><Source xsi:type='t:Row'><Label>{text}</Label></Source></Root>");
  let yaml=core::yaml::scalar(text);
  assert_pair(entry,xml.as_bytes(),yaml.as_bytes());
  if text=="hello"{verify_candidate(entry,xml.as_bytes(),b"Label: hello",&PreparedInputs::default()).unwrap();}
 }
 let xml=b"<Root xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance' xmlns:t='urn:test'><Source xsi:type='t:Row' extra='kept'><Label>hello</Label></Source></Root>";
 assert_preserved_pair(entry,xml);
 @EXTRA@
}
"#;
    for (declaration, extra) in [
        (short, ""),
        (numeric, numeric_extra),
        (multiple_numbers, numeric_extra),
        (service.clone(), extra),
        (
            service
                .replace("source", "origin")
                .replace("label", "caption"),
            extra,
        ),
    ] {
        let generated = compile(&[SourceFile {
            path: "native-record-short.yaml",
            bytes: declaration.as_bytes(),
        }])
        .unwrap();
        run_generated(
            "native-record-short",
            generated,
            0,
            &harness.replace("@EXTRA@", extra),
        );
    }
    // A calendar payload must survive hidden record construction as native components.
    let calendar = include_str!("fixtures/nested-hidden-choice.yaml")
        .replace("representations: {xml: {kind: text}, yaml: {kind: scalar, scalar: text}}",
                 "representations: {xml: {kind: calendar, format: iso, zone: written}, yaml: {kind: calendar, format: day-month-year, precision: seconds, zeroTime: keep}}");
    let boolean = include_str!("fixtures/nested-hidden-choice.yaml")
        .replace("value: {kind: scalar, scalar: text}", "value: {kind: scalar, scalar: boolean}")
        .replace("representations: {xml: {kind: text}, yaml: {kind: scalar, scalar: text}}", "representations: {xml: {kind: text, values: [{value: false, text: 'false'}, {value: true, text: 'true'}]}, yaml: {kind: scalar, values: [{value: false, literal: disabled}, {value: true, literal: enabled}]}}");
    for (declaration, values) in [
        (
            calendar.as_str(),
            r#"[("2026-09-10T12:34:56", "Label: 10.09.2026 12:34:56"), ("2024-02-29T00:00:00", "Label: 29.02.2024 00:00:00")]"#,
        ),
        (
            boolean.as_str(),
            r#"[("false", "Label: disabled"), ("true", "Label: enabled")]"#,
        ),
    ] {
        let generated = compile(&[SourceFile {
            path: "calendar-choice.yaml",
            bytes: declaration.as_bytes(),
        }])
        .unwrap();
        run_generated(
        "calendar-choice-construction",
        generated,
        0,
        r#"
include!("generated.rs");
@PAIR_HELPER@
fn main(){
 let entry=entry_id("test.hidden-owner").unwrap();
 for (written,expected) in @VALUES@ {
  let xml=format!("<Root xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance' xmlns:t='urn:test'><Source xsi:type='t:Row'><Label>{written}</Label></Source></Root>");
  let reverse=assert_pair(entry,xml.as_bytes(),expected.as_bytes());
  assert!(reverse.diagnostics.is_empty(),"{:?}",reverse.diagnostics);
  assert!(String::from_utf8_lossy(&reverse.bytes).contains(written));
 }
 for date in ["2026-02-29T12:34:56", "not-a-date", "2026-09-10T12:34:56+03:00", "2026-09-10T12:34:56.000"] {
  let xml=format!("<Root xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance' xmlns:t='urn:test'><Source xsi:type='t:Row'><Label>{date}</Label></Source></Root>");
  assert_preserved_pair(entry,xml.as_bytes());
 }
}
"#.replace("@VALUES@",values).as_str(),
    );
    }
    let generated = compile(&[SourceFile {
        path: "nested-choice-context-error.yaml",
        bytes: include_bytes!("fixtures/nested-choice-context-error.yaml"),
    }])
    .unwrap();
    run_generated(
        "nested-choice-context-error",
        generated,
        0,
        r#"
include!("generated.rs");
@PAIR_HELPER@
fn main(){
 let entry=entry_id("test.hidden-owner").unwrap();
 // Deliberately misprepared integration context: data anomalies must not hide it.
 let inputs=PreparedInputs::prepare(entry,&[("fallback",core::inputs::InputType::Boolean)],vec![("fallback".into(),core::inputs::InputValue::Boolean(false))]).unwrap();
 let xml=b"<Root xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance' xmlns:t='urn:test'><Source xsi:type='t:Row' extra='preserved'/></Root>";
 let errors=convert_file(entry,Direction::XmlToYaml,xml,&inputs).unwrap_err();
 assert!(errors.iter().any(|error|error.code.as_deref()==Some("input.type")),"{errors:?}");
 let errors=convert_file(entry,Direction::XmlToYaml,xml,&PreparedInputs::default()).unwrap_err();
 assert!(errors.iter().any(|error|error.code.as_deref()==Some("input.not-ready")),"{errors:?}");
}
"#,
    );
}

#[test]
fn structured_choice_can_be_computed_from_xml_and_visible_in_yaml() {
    let declaration=DECLARATION
        .replace("xml: {kind: record, fields: [{field: source, path: [Root, Source]}]}\n    yaml: {kind: mapping, fields: [{field: label, key: Label}]}","xml: {kind: record, fields: [{field: label, path: [Root, Label]}]}\n    yaml: {kind: mapping, fields: [{field: source, key: Source}]}")
        .replace("yaml: {missing: {denotes: {variant:","xml: {missing: {denotes: {variant:")
        .replace("xml: {missing: {denotes: {get:","yaml: {missing: {denotes: {get:");
    let generated = compile(&[SourceFile {
        path: "computed-choice.yaml",
        bytes: declaration.as_bytes(),
    }])
    .unwrap();
    run_generated(
        "xml-computed-choice-generated",
        generated,
        0,
        r#"
include!("generated.rs");
@PAIR_HELPER@
fn main(){
 let entry=entry_id("test.hidden-owner").unwrap();
 let xml=b"<Root><Label>hello</Label></Root>";
 let expected=b"Source:\n  Label: hello";
 let yaml=convert_file(entry,Direction::XmlToYaml,xml,&PreparedInputs::default()).unwrap();
 assert_eq!(yaml.bytes,expected);
 assert!(yaml.diagnostics.is_empty(),"{:?}",yaml.diagnostics);
 verify_candidate(entry,xml,expected,&PreparedInputs::default()).unwrap();
 let xml=convert_file(entry,Direction::YamlToXml,expected,&PreparedInputs::default()).unwrap();
 assert!(xml.diagnostics.is_empty(),"{:?}",xml.diagnostics);
 assert!(!String::from_utf8_lossy(&xml.bytes).contains("__declarative_virtual__"));
 let again=convert_file(entry,Direction::XmlToYaml,&xml.bytes,&PreparedInputs::default()).unwrap();
 assert_eq!(again.bytes,expected);
}
"#,
    );
}

#[test]
fn computed_choice_collection_preserves_rows_and_repetitions() {
    let source = include_str!("fixtures/hidden-choice-collection.yaml");
    for (nested, literal) in [(false, false), (true, false), (true, true)] {
        let declaration = if nested {
            let wrapper = "- kind: value\n  id: test.hidden-wrapper\n  imports: {rows: test.hidden-row}\n  value: {kind: record, fields: [{name: rows, type: {use: rows}}]}\n  representations:\n    xml: {kind: record, fields: [{field: rows, path: [Rows]}]}\n    yaml: {kind: mapping, fields: [{field: rows, key: Rows}]}\n";
            source
                .replace(
                    "- kind: value\n  id: test.hidden-choice",
                    &format!("{wrapper}- kind: value\n  id: test.hidden-choice"),
                )
                .replace(
                    "imports: {row: test.hidden-row}",
                    "imports: {row: test.hidden-wrapper}",
                )
                .replace(
                    "value: {input: rows}",
                    "value: {record: {rows: {input: rows}}}",
                )
        } else {
            source.to_owned()
        };
        let declaration = if literal {
            declaration.replace("{input: rows}","{sequence: [{record: {key: {literal: b}, text: {literal: same}}}, {record: {key: {literal: a}, text: {literal: same}}}]}")
        } else {
            declaration
        };
        let generated = compile(&[SourceFile {
            path: "computed-rows.yaml",
            bytes: declaration.as_bytes(),
        }])
        .unwrap();
        run_generated("computed-choice-rows",generated,0,r#"
include!("generated.rs");
@PAIR_HELPER@
fn main(){
 let entry=entry_id("test.hidden-owner").unwrap();
 for rows in [vec![("b","same"),("a","same")],vec![("b","one"),("b","two"),("a","last")]] {
  let input_rows=rows.iter().map(|(key,text)|core::inputs::InputValue::Record(vec![("key".into(),core::inputs::InputValue::Text((*key).into())),("text".into(),core::inputs::InputValue::Text((*text).into()))])).collect();
  let inputs=PreparedInputs::prepare(entry,&[("rows",core::inputs::InputType::Sequence(&core::inputs::InputType::Record(&[("key",core::inputs::InputType::Text),("text",core::inputs::InputType::Text)])))],vec![("rows".into(),core::inputs::InputValue::Sequence(input_rows))]).unwrap();
  let constructed=convert_file(entry,Direction::YamlToXml,b"{}",&inputs).unwrap();
  assert!(constructed.diagnostics.is_empty(),"{:?}",constructed.diagnostics);
  let constructed_xml=String::from_utf8_lossy(&constructed.bytes);
  let mut offset=0;
  for (key,text) in &rows {for fragment in [format!("<Key>{key}</Key>"),format!("<Text>{text}</Text>")] {let index=constructed_xml[offset..].find(&fragment).expect(&constructed_xml);offset+=index+fragment.len();}}
  let body=rows.iter().map(|(key,text)|format!("<Item><Key>{key}</Key><Text>{text}</Text></Item>")).collect::<String>();
  let xml=format!("<Root xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance' xmlns:t='urn:test'><Source xsi:type='t:Row'>{body}</Source></Root>");
  let yaml=convert_file(entry,Direction::XmlToYaml,xml.as_bytes(),&PreparedInputs::default()).unwrap();
  let readable=String::from_utf8_lossy(&yaml.bytes);
  assert!(readable.contains("same")||readable.contains("one"),"{readable}");
  verify_candidate(entry,xml.as_bytes(),&yaml.bytes,&PreparedInputs::default()).unwrap();
  let reverse=convert_file(entry,Direction::YamlToXml,&yaml.bytes,&PreparedInputs::default()).unwrap();
  assert!(reverse.diagnostics.is_empty(),"{:?}",reverse.diagnostics);
 }
 let expected=b"@EXPECTED@";
 assert!(validate_file(entry,expected,&PreparedInputs::default()).is_empty());
 let xml=convert_file(entry,Direction::YamlToXml,expected,&PreparedInputs::default()).unwrap();
 let yaml=convert_file(entry,Direction::XmlToYaml,&xml.bytes,&PreparedInputs::default()).unwrap();
 assert_eq!(yaml.bytes,expected);
}
"#.replace("@EXPECTED@",if nested {"Source:\\n  Rows:\\n    a: first\\n    b: second"} else {"Source:\\n  a: first\\n  b: second"}).replace("{body}</Source>",if nested {"<Rows>{body}</Rows></Source>"} else {"{body}</Source>"}).replace("for rows in [vec![(\"b\",\"same\"),(\"a\",\"same\")],vec![(\"b\",\"one\"),(\"b\",\"two\"),(\"a\",\"last\")]]",if literal {"for rows in [vec![(\"b\",\"same\"),(\"a\",\"same\")]]"} else {"for rows in [vec![(\"b\",\"same\"),(\"a\",\"same\")],vec![(\"b\",\"one\"),(\"b\",\"two\"),(\"a\",\"last\")]]"}).as_str());
    }
}

#[test]
fn mapping_variant_does_not_collide_with_a_text_fallback() {
    let generated = compile(&[SourceFile {
        path: "mapping-any-text.yaml",
        bytes: include_bytes!("fixtures/mapping-any-text.yaml"),
    }])
    .unwrap();
    run_generated(
        "mapping-any-text",
        generated,
        0,
        r#"
include!("generated.rs");
@PAIR_HELPER@
fn main(){
 let entry=entry_id("test.hidden-owner").unwrap();
 for (kind,body,expected) in [("Row","<Item><Key>a</Key><Text>hello</Text></Item>","Source:\n  a: hello"),("Text","hello","Source: hello")] {
  let xml=format!("<Root xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance' xmlns:t='urn:test'><Source xsi:type='t:{kind}'>{body}</Source></Root>");
  let reverse=assert_pair(entry,xml.as_bytes(),expected.as_bytes());
  let again=convert_file(entry,Direction::XmlToYaml,&reverse.bytes,&PreparedInputs::default()).unwrap();
  assert_eq!(again.bytes,expected.as_bytes());
 }
 for body in ["<Item><Key>a</Key><Text>hello</Text></Item>","<Item><Key>a</Key><Text>first</Text></Item><Item><Key>a</Key><Text>second</Text></Item>"] {
  let xml=format!("<Root xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance' xmlns:t='urn:test'><Source xsi:type='t:Row' extra='preserved'>{body}</Source></Root>");
  assert_preserved_pair(entry,xml.as_bytes());
 }
}
"#,
    );
}

#[test]
fn nested_choice_projection_keeps_its_discriminator() {
    let wrapper = r#"- kind: value
  id: test.wrapper
  imports: {inner: test.hidden-choice}
  value: {kind: record, fields: [{name: inner, type: {use: inner}}]}
  representations:
    xml: {kind: record, fields: [{field: inner, path: [Inner]}]}
    yaml: {kind: mapping, fields: [{field: inner, key: Inner}]}
- kind: value
  id: test.outer-choice
  namespaces: {xsi: 'http://www.w3.org/2001/XMLSchema-instance', t: 'urn:test'}
  imports: {row: test.wrapper}
  value: {kind: choice, variants: [{name: wrapper, type: {use: row}}]}
  representations:
    xml: {kind: choice, attribute: xsi:type, variants: [{variant: wrapper, in: [t:Wrapped], emit: t:Wrapped}], otherwise: wrapper}
    yaml: {kind: choice, variants: [{variant: wrapper, form: mapping, key: Inner}]}
"#;
    let declaration=DECLARATION.replace("- kind: object",&format!("{wrapper}- kind: object"))
 .replace("imports: {source: test.hidden-choice, text: test.hidden-text}","imports: {source: test.outer-choice, text: test.hidden-text}")
 .replace("{variant: {name: row, value: {record: {label: {field: label}}}}}","{variant: {name: wrapper, value: {record: {inner: {variant: {name: row, value: {record: {label: {field: label}}}}}}}}}")
 .replace("{variantValue: {value: {field: source}, variant: row}}","{variantValue: {value: {get: {of: {variantValue: {value: {field: source}, variant: wrapper}}, field: inner}}, variant: row}}");
    let generated = compile(&[SourceFile {
        path: "nested-choice.yaml",
        bytes: declaration.as_bytes(),
    }])
    .unwrap();
    run_generated(
        "nested-choice-projection",
        generated,
        0,
        r#"
include!("generated.rs");
@PAIR_HELPER@
fn main(){
 let entry=entry_id("test.hidden-owner").unwrap();
 let xml=b"<Root xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance' xmlns:t='urn:test'><Source xsi:type='t:Wrapped'><Inner xsi:type='t:Row'><Label>hello</Label></Inner></Source></Root>";
 let yaml=convert_file(entry,Direction::XmlToYaml,xml,&PreparedInputs::default()).unwrap();
 assert_eq!(yaml.bytes,b"Label: hello");
 verify_candidate(entry,xml,&yaml.bytes,&PreparedInputs::default()).unwrap();
 let restored=convert_file(entry,Direction::YamlToXml,&yaml.bytes,&PreparedInputs::default()).unwrap();
 let again=convert_file(entry,Direction::XmlToYaml,&restored.bytes,&PreparedInputs::default()).unwrap();
 assert_eq!(again.bytes,yaml.bytes);
}
"#,
    );
}

#[test]
fn mapping_record_and_attributed_text_share_a_choice_without_private_codecs() {
    let base = include_str!("fixtures/mapping-record-text.yaml");
    let scalar = base[base
        .find("- kind: object\n  id: test.null-projection")
        .unwrap()..]
        .replace("test.null-projection", "test.scalar-null-projection")
        .replace("{use: choice}", "{kind: scalar, scalar: text}");
    let declaration = format!("{base}{scalar}");
    let generated = compile(&[SourceFile {
        path: "mapping-record-text.yaml",
        bytes: declaration.as_bytes(),
    }])
    .unwrap();
    run_generated(
        "mapping-record-text",
        generated,
        0,
        r#"
include!("generated.rs");
@PAIR_HELPER@
fn main(){
 let entry=entry_id("test.owner").unwrap();
 for name in ["test.null-projection","test.scalar-null-projection"] {
 let projection=entry_id(name).unwrap();
 for (body,expected) in [("", ""),("<Source xsi:nil='true'/>","Value: null")] {
  let xml=format!("<Root xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance'>{body}</Root>");
  let inputs=PreparedInputs::default();
  let yaml=convert_file(projection,Direction::XmlToYaml,xml.as_bytes(),&inputs).unwrap();
  assert_eq!(yaml.bytes,expected.as_bytes());
  verify_candidate(projection,xml.as_bytes(),expected.as_bytes(),&inputs).unwrap();
  assert!(validate_file(projection,expected.as_bytes(),&inputs).is_empty());
 }
 }
 let computed=entry_id("test.computed-optional-owner").unwrap();
 for (xml,expected) in [("<Root><Label/></Root>",""),("<Root><Label>hello</Label></Root>","Value: hello")] {
  let inputs=PreparedInputs::default();
  let forward=convert_file(computed,Direction::XmlToYaml,xml.as_bytes(),&inputs).unwrap();
  assert_eq!(forward.bytes,expected.as_bytes());
  verify_candidate(computed,xml.as_bytes(),expected.as_bytes(),&inputs).unwrap();
 }
 let optional=entry_id("test.optional-owner").unwrap();
 for (body,expected) in [("", ""), ("<Value xsi:nil='true'/>","Value: null")] {
  let xml=format!("<Root xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance'>{body}</Root>");
  let inputs=PreparedInputs::default();
  let forward=convert_file(optional,Direction::XmlToYaml,xml.as_bytes(),&inputs).unwrap();
  assert_eq!(forward.bytes,expected.as_bytes());
  assert!(forward.diagnostics.is_empty());
  verify_candidate(optional,xml.as_bytes(),expected.as_bytes(),&inputs).unwrap();
  assert!(validate_file(optional,expected.as_bytes(),&inputs).is_empty());
 }
 for (body,expected) in [("xsi:type='t:Text'>hello","Value: hello"),("xsi:type='t:Text'>","Value: \"\""),("><Label>hello</Label>","Value:\n  Label: hello")] {
  let xml=format!("<Root xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance' xmlns:t='urn:test'><Value {body}</Value></Root>");
  let inputs=PreparedInputs::default();
  let yaml=convert_file(entry,Direction::XmlToYaml,xml.as_bytes(),&inputs).unwrap();
  assert_eq!(yaml.bytes,expected.as_bytes());
  assert!(yaml.diagnostics.is_empty(),"{:?}",yaml.diagnostics);
  assert!(validate_file(entry,expected.as_bytes(),&inputs).is_empty());
  verify_candidate(entry,xml.as_bytes(),expected.as_bytes(),&inputs).unwrap();
  let reverse=convert_file(entry,Direction::YamlToXml,expected.as_bytes(),&inputs).unwrap();
  let again=convert_file(entry,Direction::XmlToYaml,&reverse.bytes,&inputs).unwrap();
  assert_eq!(again.bytes,expected.as_bytes());
 }
}
"#,
    );
}
