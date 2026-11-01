use nkdk_rule_compiler::{SourceFile, generate, link, parse};
mod support;

const OWNER: &str = r#"format: nkdk-declarations/1
kind: object
id: test.contextual-null
inputs:
  mode: {type: {kind: scalar, scalar: text}}
value:
  kind: record
  fields:
  - {name: caption, type: {kind: scalar, scalar: text}}
representations:
  xml: {kind: record, fields: [{field: caption, path: [Root, Caption]}]}
  yaml: {kind: mapping, fields: [{field: caption, key: Подпись}]}
presence:
- target: {field: caption}
  xml:
    missing: {denotes: {absent: true}}
    empty: [{form: empty-element, denotes: {absent: true}}]
    canonical: [{when: {not: {present: {field: caption}}}, form: empty-element}]
  yaml:
    missing: {denotes: {absent: true}}
    empty: [{form: 'null', denotes: {absent: true}}]
    nullWhen: {and: [{eq: [{input: mode}, {literal: own}]}, {not: {present: {field: caption}}}]}
"#;

#[test]
fn null_form_can_be_selected_from_context_for_an_unrelated_record() {
    let module = parse(SourceFile {
        path: "contextual-null.yaml",
        bytes: OWNER.as_bytes(),
    })
    .unwrap();
    let program = link(&[module]).unwrap();
    let sources = generate(&program).unwrap();
    let rust = std::str::from_utf8(&sources.files[0].contents).unwrap();
    assert!(rust.contains(": null\\n"));
}

#[test]
fn null_output_requires_an_inverse_null_input() {
    let source = OWNER.replace("    empty: [{form: 'null', denotes: {absent: true}}]\n", "");
    let module = parse(SourceFile {
        path: "contextual-null.yaml",
        bytes: source.as_bytes(),
    })
    .unwrap();
    let program = link(&[module]).unwrap();
    assert!(
        generate(&program)
            .unwrap_err()
            .iter()
            .any(|diagnostic| diagnostic.message.contains("Scalar field presence"))
    );
}

#[test]
fn conditional_decimal_default_can_restore_absence_from_context() {
    let source = r#"format: nkdk-declarations/1
kind: object
id: test.conditional-capacity
imports: {boolean: common.boolean}
inputs:
  suppress: {type: {kind: scalar, scalar: boolean}}
value:
  kind: record
  fields:
  - {name: capacity, type: {kind: scalar, scalar: number, profile: decimal}}
representations:
  xml: {kind: record, fields: [{field: capacity, path: [Root, Capacity]}]}
  yaml: {kind: mapping, fields: [{field: capacity, key: Capacity}]}
presence:
- target: {field: capacity}
  xml: {missing: {denotes: {absent: true}}}
  yaml:
    default: {if: {input: suppress}, then: {absent: true}, else: {literal: 9007199254740993}}
"#;
    for source in [
        source.to_owned(),
        source
            .replace("scalar: number, profile: decimal", "scalar: text")
            .replace("literal: 9007199254740993", "literal: ready"),
        source
            .replace(
                "kind: scalar, scalar: number, profile: decimal",
                "use: boolean",
            )
            .replace("literal: 9007199254740993", "literal: true"),
        source.replace(
            "then: {absent: true}, else: {literal: 9007199254740993}",
            "then: {literal: 9007199254740993}, else: {absent: true}",
        ),
    ] {
        let module = parse(SourceFile {
            path: "conditional-capacity.yaml",
            bytes: source.as_bytes(),
        })
        .unwrap();
        let boolean = parse(SourceFile {
            path: "boolean.yaml",
            bytes: include_bytes!("../../../declarations/common/boolean.yaml"),
        })
        .unwrap();
        let program = link(&[module, boolean]).unwrap();
        generate(&program).unwrap();
    }
}

#[test]
fn projected_null_can_denote_an_exact_value_instead_of_absence() {
    let source = r#"format: nkdk-declarations/1
kind: object
id: test.projected-capacity
value:
  kind: record
  fields: [{name: capacity, type: {kind: scalar, scalar: number, profile: decimal}}]
representations:
  xml: {kind: record, fields: [{field: capacity, path: [Root, Capacity]}]}
  yaml: {kind: projection, field: capacity}
presence:
- target: {field: capacity}
  xml: {missing: {denotes: {absent: true}}}
  yaml:
    missing: {denotes: {absent: true}}
    empty: [{form: 'null', denotes: {literal: 9007199254740993}}]
    nullWhen: {eq: [{field: capacity}, {literal: 9007199254740993}]}
"#;
    let module = parse(SourceFile {
        path: "projected-capacity.yaml",
        bytes: source.as_bytes(),
    })
    .unwrap();
    let text = source
        .replace("test.projected-capacity", "test.projected-text")
        .replace("scalar: number, profile: decimal", "scalar: text")
        .replace("literal: 9007199254740993", "literal: ready");
    let mapping = source
        .replace("test.projected-capacity", "test.mapped-capacity")
        .replace(
            "{kind: projection, field: capacity}",
            "{kind: mapping, fields: [{field: capacity, key: Capacity}]}",
        );
    let mut modules = vec![
        module,
        parse(SourceFile {
            path: "text.yaml",
            bytes: text.as_bytes(),
        })
        .unwrap(),
        parse(SourceFile {
            path: "mapping.yaml",
            bytes: mapping.as_bytes(),
        })
        .unwrap(),
    ];
    modules.extend(
        nkdk_rule_compiler::parse_many(SourceFile {
            path: "tagged-default-state.yaml",
            bytes: include_bytes!("../../../declarations/probes/tagged-default-state.yaml"),
        })
        .unwrap(),
    );
    modules.extend(
        nkdk_rule_compiler::parse_many(SourceFile {
            path: "tagged-inferred-state.yaml",
            bytes: include_bytes!("../../../declarations/probes/tagged-inferred-state.yaml"),
        })
        .unwrap(),
    );
    modules.extend(
        nkdk_rule_compiler::parse_many(SourceFile {
            path: "journal-property-states.yaml",
            bytes: include_bytes!("../../../declarations/objects/journal-property-states.yaml"),
        })
        .unwrap(),
    );
    let state_source = include_str!("../../../declarations/probes/tagged-inferred-state.yaml")
        .split("- kind: object\n  id: migration.property-state-source")
        .nth(1)
        .unwrap();
    let state_source = state_source
        .lines()
        .map(|line| line.strip_prefix("  ").unwrap_or(line))
        .collect::<Vec<_>>()
        .join("\n");
    let enum_source = format!(
        "format: nkdk-declarations/1\nkind: object\nid: migration.enum-state-source{}",
        state_source
    )
    .replace("common.property-states", "journal.property-states");
    modules.push(
        parse(SourceFile {
            path: "enum-state-source.yaml",
            bytes: enum_source.as_bytes(),
        })
        .unwrap(),
    );
    modules.extend(
        nkdk_rule_compiler::parse_many(SourceFile {
            path: "stateful-number.yaml",
            bytes: include_bytes!("../../../declarations/common/stateful-number.yaml"),
        })
        .unwrap(),
    );
    let numeric_owner = include_str!("../../../declarations/probes/tagged-inferred-state.yaml")
        .split("- kind: object\n  id: migration.tagged-inferred-state")
        .nth(1)
        .unwrap()
        .split("- kind: object")
        .next()
        .unwrap();
    let numeric_owner = numeric_owner
        .lines()
        .map(|line| line.strip_prefix("  ").unwrap_or(line))
        .collect::<Vec<_>>()
        .join("\n");
    let numeric_owner = format!(
        "format: nkdk-declarations/1\nkind: object\nid: test.stateful-number{}",
        numeric_owner
    )
    .replace("probe.inferred-stateful-capacity", "common.stateful-number")
    .replace("bind: {states:", "bind: {implicit: {literal: 9}, states:")
    .replace(
        "path: [Root, Properties]",
        "path: [Root, Properties, Value]",
    );
    let notify_constraint = numeric_owner
        .split("- id: state-agrees-with-tag")
        .nth(1)
        .unwrap()
        .replace("variant: changed", "variant: notified")
        .replace("literal: Extended", "literal: Notify");
    let numeric_owner = numeric_owner.replace("else: {sequence: []}",
        "else: {if: {isVariant: {value: {field: capacity}, variant: notified}}, then: {sequence: [{record: {name: {literal: Capacity}, mode: {literal: Notify}}}]}, else: {sequence: []}}");
    let numeric_owner =
        format!("{numeric_owner}\n- id: notify-state-agrees-with-tag{notify_constraint}");
    let numeric_owner = format!(
        "{numeric_owner}\n- id: projected-range\n  appliesTo: [yaml-validation]\n  assert: {{lte: [{{if: {{isVariant: {{value: {{field: capacity}}, variant: changed}}}}, then: {{get: {{of: {{variantValue: {{value: {{field: capacity}}, variant: changed}}}}, field: capacity}}}}, else: {{if: {{isVariant: {{value: {{field: capacity}}, variant: notified}}}}, then: {{get: {{of: {{variantValue: {{value: {{field: capacity}}, variant: notified}}}}, field: capacity}}}}, else: {{get: {{of: {{variantValue: {{value: {{field: capacity}}, variant: plain}}}}, field: capacity}}}}}}}}, {{literal: 42}}]}}\n  diagnostic: {{code: capacity.maximum, severity: error, at: {{field: capacity}}, message: Too large}}\n"
    );
    modules.push(
        parse(SourceFile {
            path: "numeric-owner.yaml",
            bytes: numeric_owner.as_bytes(),
        })
        .unwrap(),
    );
    modules.push(
        parse(SourceFile {
            path: "boolean.yaml",
            bytes: include_bytes!("../../../declarations/common/boolean.yaml"),
        })
        .unwrap(),
    );
    for (path, bytes) in [
        (
            "rows.yaml",
            include_bytes!("../../../declarations/common/property-states.yaml").as_slice(),
        ),
        (
            "row.yaml",
            include_bytes!("../../../declarations/common/property-state-row.yaml").as_slice(),
        ),
    ] {
        modules.push(parse(SourceFile { path, bytes }).unwrap());
    }
    let mixed = r#"format: nkdk-declarations/1
kind: catalog
declarations:
- kind: value
  id: test.mixed-row
  imports: {boolean: common.boolean}
  value:
    kind: record
    fields:
    - {name: caption, type: {kind: scalar, scalar: text}}
    - {name: enabled, type: {use: boolean}}
    - {name: amount, type: {kind: scalar, scalar: number, profile: decimal}}
  representations:
    xml: {kind: record, fields: [{field: caption, path: [Caption]}, {field: enabled, path: [Enabled]}, {field: amount, path: [Amount]}]}
    yaml: {kind: mapping, fields: [{field: caption, key: Caption}, {field: enabled, key: Enabled}, {field: amount, key: Amount}]}
- kind: value
  id: test.mixed-rows
  imports: {row: test.mixed-row}
  value: {kind: sequence, item: {use: row}}
  representations:
    xml: {kind: element-sequence, path: [Row]}
    yaml: {kind: sequence}
- kind: object
  id: test.mixed-default
  imports: {rows: test.mixed-rows}
  inputs: {restore: {type: {kind: scalar, scalar: boolean}}, extra: {type: {kind: scalar, scalar: boolean}}}
  value:
    kind: record
    fields:
    - {name: history, type: {use: rows}}
    - {name: title, type: {kind: scalar, scalar: text}}
  representations:
    xml: {kind: record, fields: [{field: history, path: [Root, Rows]}, {field: title, path: [Root, Title]}]}
    yaml: {kind: mapping, fields: [{field: history, key: History}, {field: title, key: Title}]}
  presence:
  - target: {field: history}
    yaml:
      default:
        concat:
        - if: {input: restore}
          then: {sequence: [{record: {caption: {literal: ready}, enabled: {literal: true}, amount: {literal: 9007199254740993}}}]}
          else: {sequence: []}
        - if: {input: extra}
          then: {sequence: [{record: {caption: {literal: following}, enabled: {literal: false}, amount: {literal: 42}}}]}
          else: {sequence: []}
"#;
    modules.extend(
        nkdk_rule_compiler::parse_many(SourceFile {
            path: "mixed-default.yaml",
            bytes: mixed.as_bytes(),
        })
        .unwrap(),
    );
    let program = link(&modules).unwrap();
    let shape: serde_json::Value = serde_json::from_slice(
        &nkdk_rule_compiler::schema(&program, "test.projected-capacity").unwrap(),
    )
    .unwrap();
    let validator = jsonschema::validator_for(&shape).unwrap();
    assert!(
        validator.is_valid(&serde_json::Value::Null),
        "projected schema must describe its null form"
    );
    assert!(!validator.is_valid(&serde_json::json!("not-a-number")));
    let checked_projection: serde_json::Value = serde_json::from_slice(
        &nkdk_rule_compiler::schema(&program, "probe.changed-capacity").unwrap(),
    )
    .unwrap();
    assert_eq!(checked_projection["x-nkdk-runtime-validation"], true);
    let generated = generate(&program).expect("declared null restores its semantic value");
    let root = support::generated_crate_root("projected-null");
    std::fs::write(root.join("Cargo.toml"), format!("[package]\nname=\"projected-null-contract\"\nversion=\"0.0.0\"\nedition=\"2024\"\n[dependencies]\nnkdk-conversion-core={{path={:?},features=[\"test-probes\"]}}\n[workspace]\n",support::conversion_core_path())).unwrap();
    for file in generated.files {
        std::fs::write(root.join("src").join(file.path), file.contents).unwrap();
    }
    std::fs::write(
        root.join("src/lib.rs"),
        r#"include!("generated.rs");
fn state_facts(sources:&[(&str,&str)]) -> std::sync::Arc<core::facts::prepared::PreparedTextFacts> {
    let generation=core::facts::Generation(7);
    let source=entry_id("migration.property-state-source").unwrap();
    let mut builder=fact_builder(generation,core::facts::prepared::FactBudget{text:core::facts::text::TextBudget{entries:100,bytes:4000},rows:100});
    for (source_owner,xml) in sources {
        let inputs=prepare_inputs(source,vec![("owner".into(),InputValue::Text((*source_owner).into()))]).unwrap();
        let errors=contribute_file(source,Direction::XmlToYaml,xml.as_bytes(),&inputs,&mut builder);
        assert!(errors.is_empty(),"{errors:?}");
    }
    std::sync::Arc::new(builder.finish())
}
fn state_inputs(entry:EntryId, owner:&str, sources:&[(&str,&str)]) -> PreparedInputs {
    prepare_fact_inputs(entry,state_facts(sources),core::facts::Generation(7),vec![("owner".into(),InputValue::Text(owner.into()))]).unwrap()
}
#[test]
fn round_trip() {
    let inputs=PreparedInputs::default();
    for (id,value,other,expected) in [
        ("test.projected-capacity","9007199254740993","9007199254740992","null"),
        ("test.projected-text","ready","different","null"),
        ("test.mapped-capacity","9007199254740993","9007199254740992","Capacity: null"),
    ] {
        let entry=entry_id(id).unwrap();
        let original=format!("<Root><Capacity>{value}</Capacity></Root>");
        let yaml=convert_file(entry,Direction::XmlToYaml,original.as_bytes(),&inputs).unwrap();
        assert_eq!(String::from_utf8_lossy(&yaml.bytes).trim(),expected);
        verify_candidate(entry,original.as_bytes(),&yaml.bytes,&inputs).unwrap();
        let restored=convert_file(entry,Direction::YamlToXml,expected.as_bytes(),&inputs).unwrap();
        core::proof::verify(original.as_bytes(),&restored.bytes,|_|false).unwrap();
        let other=format!("<Root><Capacity>{other}</Capacity></Root>");
        let yaml=convert_file(entry,Direction::XmlToYaml,other.as_bytes(),&inputs).unwrap();
        assert_ne!(String::from_utf8_lossy(&yaml.bytes).trim(),expected);
        verify_candidate(entry,other.as_bytes(),&yaml.bytes,&inputs).unwrap();
    }
    let tagged=entry_id("migration.tagged-default-state").unwrap();
    for (changed,value,expected) in [
        (true,"9","Длина: !изменять null"),
        (true,"11","Длина: !изменять 11"),
        (true,"9007199254740993","Длина: !изменять 9007199254740993"),
        (false,"9","Длина: 9"),
        (false,"11","Длина: 11"),
    ] {
        let inputs=prepare_inputs(tagged,vec![("changed".into(),InputValue::Boolean(changed))]).unwrap();
        let original=format!("<Root><Properties><Value>{value}</Value></Properties></Root>");
        let yaml=convert_file(tagged,Direction::XmlToYaml,original.as_bytes(),&inputs).unwrap();
        assert_eq!(String::from_utf8_lossy(&yaml.bytes).trim(),expected);
        verify_candidate(tagged,original.as_bytes(),&yaml.bytes,&inputs).unwrap();
        let restored=convert_file(tagged,Direction::YamlToXml,expected.as_bytes(),&inputs).unwrap();
        core::proof::verify(original.as_bytes(),&restored.bytes,|_|false).unwrap();
        assert!(convert_file(tagged,Direction::YamlToXml,"Длина: !изменять oops".as_bytes(),&inputs).is_err());
        assert!(convert_file(tagged,Direction::YamlToXml,"Длина: !другой 11".as_bytes(),&inputs).is_err());
        let contradictory=if changed {"Длина: 11"} else {"Длина: !изменять 11"};
        assert!(convert_file(tagged,Direction::YamlToXml,contradictory.as_bytes(),&inputs).is_err());
        if changed && value=="9" {
            let bare=convert_file(tagged,Direction::YamlToXml,"Длина: !изменять".as_bytes(),&inputs).unwrap();
            core::proof::verify(original.as_bytes(),&bare.bytes,|_|false).unwrap();
        }
    }
    let collected=entry_id("migration.tagged-collected-state").unwrap();
    for (rows,tag) in [
        ("",false),
        ("<s:PropertyState><s:Property>Capacity</s:Property><s:State>Extended</s:State></s:PropertyState>",true),
        ("<s:PropertyState><s:Property>Adjacent</s:Property><s:State>Notify</s:State></s:PropertyState><s:PropertyState><s:Property>Capacity</s:Property><s:State>Extended</s:State></s:PropertyState><s:PropertyState><s:Property>Capacity</s:Property><s:State>Extended</s:State></s:PropertyState>",true),
    ] {
        let original=format!("<Root xmlns:s='http://v8.1c.ru/8.3/xcf/readable'><InternalInfo>{rows}</InternalInfo><Properties><Value>11</Value></Properties></Root>");
        let yaml=convert_file(collected,Direction::XmlToYaml,original.as_bytes(),&inputs).unwrap();
        assert_eq!(String::from_utf8_lossy(&yaml.bytes).contains("Длина: !изменять 11"),tag);
        assert!(!String::from_utf8_lossy(&yaml.bytes).contains("!xml/"),"{}",String::from_utf8_lossy(&yaml.bytes));
        verify_candidate(collected,original.as_bytes(),&yaml.bytes,&inputs).unwrap();
        let restored=convert_file(collected,Direction::YamlToXml,&yaml.bytes,&inputs).unwrap();
        core::proof::verify(original.as_bytes(),&restored.bytes,|_|false).unwrap();
        if tag {
            let without_states=core::yaml::without_property(&yaml.bytes,"Состояния").unwrap();
            assert!(convert_file(collected,Direction::YamlToXml,&without_states,&inputs).is_err());
        }
    }
    for profile in ["migration.tagged-inferred-state", "test.stateful-number"] {
    let inferred=entry_id(profile).unwrap();
    let mut state_cases=vec![
        ("",false,false),
        ("<s:PropertyState><s:Property>Capacity</s:Property><s:State>Notify</s:State></s:PropertyState>",false,true),
        ("<s:PropertyState><s:Property>Capacity</s:Property><s:State>Extended</s:State></s:PropertyState>",true,false),
        ("<s:PropertyState><s:Property>Adjacent</s:Property><s:State>Notify</s:State></s:PropertyState><s:PropertyState><s:Property>Capacity</s:Property><s:State>Extended</s:State></s:PropertyState><s:PropertyState><s:Property>Capacity</s:Property><s:State>Extended</s:State></s:PropertyState>",true,true),
    ];
    if profile == "test.stateful-number" {
        state_cases.extend([
            ("<s:PropertyState><s:Property>Capacity</s:Property><s:State>Notify</s:State></s:PropertyState><s:PropertyState><s:Property>Capacity</s:Property><s:State>Notify</s:State></s:PropertyState>",false,true),
            ("<s:PropertyState><s:Property>Capacity</s:Property><s:State>Extended</s:State></s:PropertyState><s:PropertyState><s:Property>Capacity</s:Property><s:State>Notify</s:State></s:PropertyState>",false,true),
        ]);
    }
    for (rows,tag,explicit) in state_cases {
        let original=format!("<Root xmlns:s='http://v8.1c.ru/8.3/xcf/readable'><InternalInfo>{rows}</InternalInfo><Properties><Value>11</Value></Properties></Root>");
        let inputs=state_inputs(inferred,"owner-a",&[("owner-a",&original)]);
        let yaml=convert_file(inferred,Direction::XmlToYaml,original.as_bytes(),&inputs).unwrap();
        let text=String::from_utf8_lossy(&yaml.bytes);
        let notify=rows.contains("Capacity</s:Property><s:State>Notify");
        let invalid=profile == "test.stateful-number" && notify && rows.contains("Capacity</s:Property><s:State>Extended");
        let single_notify=rows=="<s:PropertyState><s:Property>Capacity</s:Property><s:State>Notify</s:State></s:PropertyState>";
        assert_eq!(text.contains("Длина: !изменять 11"),tag);
        if profile == "test.stateful-number" {
            assert_eq!(text.contains("Длина: !проверять 11"), notify && !invalid, "{text}");
        }
        assert_eq!(text.contains("Состояния:"),explicit && !(profile == "test.stateful-number" && single_notify),"{text}");
        assert_eq!(text.contains("!xml/"),invalid,"{text}");
        verify_candidate(inferred,original.as_bytes(),&yaml.bytes,&inputs).unwrap();
        let restored=convert_file(inferred,Direction::YamlToXml,&yaml.bytes,&inputs).unwrap();
        core::proof::verify(original.as_bytes(),&restored.bytes,|_|false).unwrap();
    }
    if profile == "test.stateful-number" {
        for rows in ["", "<s:PropertyState><s:Property>Capacity</s:Property><s:State>Extended</s:State></s:PropertyState>"] {
            let original=format!("<Root xmlns:s='http://v8.1c.ru/8.3/xcf/readable'><InternalInfo>{rows}</InternalInfo><Properties><Value>oops</Value></Properties></Root>");
            let inputs=state_inputs(inferred,"owner-a",&[("owner-a",&original)]);
            let yaml=convert_file(inferred,Direction::XmlToYaml,original.as_bytes(),&inputs).unwrap();
            assert!(String::from_utf8_lossy(&yaml.bytes).contains("!xml/"));
            verify_candidate(inferred,original.as_bytes(),&yaml.bytes,&inputs).unwrap();
        }
    }
    let inferred_inputs=state_inputs(inferred,"owner-a",&[("owner-a","<Root/>")]);
    if profile=="test.stateful-number" {
        assert!(convert_file(inferred,Direction::YamlToXml,"Длина: 43".as_bytes(),&inferred_inputs).is_err());
        assert!(convert_file(inferred,Direction::YamlToXml,"Длина: !изменять 43".as_bytes(),&inferred_inputs).is_err());
        assert!(convert_file(inferred,Direction::YamlToXml,"Длина: !проверять 43".as_bytes(),&inferred_inputs).is_err());
        assert!(convert_file(inferred,Direction::YamlToXml,"Длина: !проверять 11\nСостояния: []".as_bytes(),&inferred_inputs).is_err());
        let controlled=convert_file(inferred,Direction::YamlToXml,"Длина:".as_bytes(),&inferred_inputs).unwrap();
        core::proof::verify(b"<Root xmlns:s='http://v8.1c.ru/8.3/xcf/readable'><InternalInfo/><Properties><Value>9</Value></Properties></Root>",&controlled.bytes,|_|false).unwrap();
        let notify=convert_file(inferred,Direction::YamlToXml,"Длина: !проверять".as_bytes(),&inferred_inputs).unwrap();
        core::proof::verify(b"<Root xmlns:s='http://v8.1c.ru/8.3/xcf/readable'><InternalInfo><s:PropertyState><s:Property>Capacity</s:Property><s:State>Notify</s:State></s:PropertyState></InternalInfo><Properties><Value>9</Value></Properties></Root>",&notify.bytes,|_|false).unwrap();
    }
    let bare=convert_file(inferred,Direction::YamlToXml,"Длина: !изменять".as_bytes(),&inferred_inputs).unwrap();
    core::proof::verify(b"<Root xmlns:s='http://v8.1c.ru/8.3/xcf/readable'><InternalInfo><s:PropertyState><s:Property>Capacity</s:Property><s:State>Extended</s:State></s:PropertyState></InternalInfo><Properties><Value>9</Value></Properties></Root>",&bare.bytes,|_|false).unwrap();
    assert!(convert_file(inferred,Direction::YamlToXml,"Длина: !изменять 11\nСостояния: []".as_bytes(),&inferred_inputs).is_err());
    }
    let inferred=entry_id("migration.tagged-inferred-state").unwrap();
    let multiple=entry_id("migration.tagged-multiple-states").unwrap();
    let first="<s:PropertyState><s:Property>Capacity</s:Property><s:State>Extended</s:State></s:PropertyState>";
    let second="<s:PropertyState><s:Property>Counter</s:Property><s:State>Extended</s:State></s:PropertyState>";
    for (rows,first_tag,second_tag,explicit) in [
        (String::new(),false,false,false),
        (first.to_owned(),true,false,false),
        (second.to_owned(),false,true,false),
        (format!("{first}{second}"),true,true,false),
        (format!("{second}{first}"),true,true,true),
        (format!("{first}{first}{second}"),true,true,true),
    ] {
        let original=format!("<Root xmlns:s='http://v8.1c.ru/8.3/xcf/readable'><InternalInfo>{rows}</InternalInfo><FirstProperties><Value>11</Value></FirstProperties><SecondProperties><Value>12</Value></SecondProperties><Title>untouched</Title></Root>");
        let inputs=state_inputs(multiple,"owner-a",&[("owner-a",&original)]);
        let yaml=convert_file(multiple,Direction::XmlToYaml,original.as_bytes(),&inputs).unwrap();
        let text=String::from_utf8_lossy(&yaml.bytes);
        assert_eq!(text.contains("Первое: !изменять 11"),first_tag,"{text}");
        assert_eq!(text.contains("Второе: !изменять 12"),second_tag,"{text}");
        assert_eq!(text.contains("История:"),explicit,"{text}");
        assert!(text.contains("Подпись: untouched"),"{text}");
        assert!(!text.contains("!xml/"),"{text}");
        verify_candidate(multiple,original.as_bytes(),&yaml.bytes,&inputs).unwrap();
        let restored=convert_file(multiple,Direction::YamlToXml,&yaml.bytes,&inputs).unwrap();
        core::proof::verify(original.as_bytes(),&restored.bytes,|_|false).unwrap();
    }
    for (tag,value,title) in [(false,"0","zero-or-negative"),(true,"0","zero-or-negative"),(false,"-1","zero-or-negative"),(true,"9007199254740993","positive")] {
        let inputs=prepare_inputs(multiple,vec![("owner".into(),InputValue::Text("owner-a".into()))]).unwrap();
        let yaml=format!("Первое: {}{value}\nВторое: 12",if tag{"!изменять "}else{""});
        let restored=convert_file(multiple,Direction::YamlToXml,yaml.as_bytes(),&inputs).unwrap();
        assert!(String::from_utf8_lossy(&restored.bytes).contains(&format!("<Title>{title}</Title>")),"{}",String::from_utf8_lossy(&restored.bytes));
    }
    let a="<Root xmlns:s='http://v8.1c.ru/8.3/xcf/readable'><InternalInfo><s:PropertyState><s:Property>Capacity</s:Property><s:State>Extended</s:State></s:PropertyState><s:PropertyState><s:Property>Capacity</s:Property><s:State>Extended</s:State></s:PropertyState></InternalInfo><Properties><Value>11</Value></Properties></Root>";
    let b="<Root xmlns:s='http://v8.1c.ru/8.3/xcf/readable'><InternalInfo><s:PropertyState><s:Property>Capacity</s:Property><s:State>Notify</s:State></s:PropertyState></InternalInfo><Properties><Value>11</Value></Properties></Root>";
    let facts=state_facts(&[("owner-a",a),("owner-b",b)]);
    for (owner,xml,tag) in [("owner-a",a,true),("owner-b",b,false),("owner-c","<Root><InternalInfo/><Properties><Value>11</Value></Properties></Root>",false)] {
        let inputs=prepare_fact_inputs(inferred,facts.clone(),core::facts::Generation(7),vec![("owner".into(),InputValue::Text(owner.into()))]).unwrap();
        let yaml=convert_file(inferred,Direction::XmlToYaml,xml.as_bytes(),&inputs).unwrap();
        assert_eq!(String::from_utf8_lossy(&yaml.bytes).contains("Длина: !изменять 11"),tag);
        verify_candidate(inferred,xml.as_bytes(),&yaml.bytes,&inputs).unwrap();
    }
    let stale=prepare_fact_inputs(inferred,facts,core::facts::Generation(8),vec![("owner".into(),InputValue::Text("owner-a".into()))]).unwrap();
    assert!(convert_file(inferred,Direction::XmlToYaml,a.as_bytes(),&stale).is_err());
    let enum_source=entry_id("migration.enum-state-source").unwrap();
    for (direction,source) in [
        (Direction::XmlToYaml,"<Root xmlns:s='http://v8.1c.ru/8.3/xcf/readable'><InternalInfo><s:PropertyState><s:Property>Synonym</s:Property><s:State>Extended</s:State></s:PropertyState></InternalInfo></Root>"),
        (Direction::YamlToXml,"Состояния: [Синоним]"),
    ] {
        let generation=core::facts::Generation(7);
        let mut builder=fact_builder(generation,core::facts::prepared::FactBudget{text:core::facts::text::TextBudget{entries:30,bytes:2000},rows:30});
        let inputs=prepare_inputs(enum_source,vec![("owner".into(),InputValue::Text("owner-d".into()))]).unwrap();
        let errors=contribute_file(enum_source,direction,source.as_bytes(),&inputs,&mut builder);
        assert!(errors.is_empty(),"{errors:?}");
        let facts=builder.finish();
        assert_eq!(facts.lookup_parts(generation,fact_id("metadata.property-state-membership").unwrap(),&["Extended","owner-d","Synonym"]),core::facts::FactState::Ready("present"));
    }
    // Reading a YAML tag reconstructs states without asking an XML-source index.
    assert!(fact_source_input_bindings(inferred,Direction::YamlToXml).is_empty());
    let yaml_inputs=prepare_inputs(inferred,vec![("owner".into(),InputValue::Text("owner-a".into()))]).unwrap();
    let restored=convert_file(inferred,Direction::YamlToXml,"Длина: !изменять 11".as_bytes(),&yaml_inputs).unwrap();
    assert!(String::from_utf8_lossy(&restored.bytes).contains("Extended"));
    let mixed=entry_id("test.mixed-default").unwrap();
    for (restore,extra,rows,explicit,anomaly) in [
        (false,false,"",false,false),
        (true,false,"<Row><Caption>ready</Caption><Enabled>true</Enabled><Amount>9007199254740993</Amount></Row>",false,false),
        (true,false,"<Row><Caption>ready</Caption><Enabled>false</Enabled><Amount>9007199254740993</Amount></Row>",true,false),
        (true,false,"<Row><Caption>ready</Caption><Enabled>true</Enabled><Amount>9007199254740992</Amount></Row>",true,false),
        (true,false,"<Row extra=\"yes\"><Caption>ready</Caption><Enabled>true</Enabled><Amount>9007199254740993</Amount></Row>",true,true),
        (false,true,"<Row><Caption>following</Caption><Enabled>false</Enabled><Amount>42</Amount></Row>",false,false),
        (true,true,"<Row><Caption>ready</Caption><Enabled>true</Enabled><Amount>9007199254740993</Amount></Row><Row><Caption>following</Caption><Enabled>false</Enabled><Amount>42</Amount></Row>",false,false),
        (true,true,"<Row><Caption>following</Caption><Enabled>false</Enabled><Amount>42</Amount></Row><Row><Caption>ready</Caption><Enabled>true</Enabled><Amount>9007199254740993</Amount></Row>",true,false),
    ] {
        let inputs=prepare_inputs(mixed,vec![("restore".into(),InputValue::Boolean(restore)),("extra".into(),InputValue::Boolean(extra))]).unwrap();
        let original=format!("<Root><Rows>{rows}</Rows><Title>untouched</Title></Root>");
        let yaml=convert_file(mixed,Direction::XmlToYaml,original.as_bytes(),&inputs).unwrap();
        let text=String::from_utf8_lossy(&yaml.bytes);
        assert_eq!(text.contains("History:"),explicit,"{text}");
        assert!(text.contains("Title: untouched"),"{text}");
        assert_eq!(text.contains("!xml/"),anomaly,"{text}");
        verify_candidate(mixed,original.as_bytes(),&yaml.bytes,&inputs).unwrap();
        let restored=convert_file(mixed,Direction::YamlToXml,&yaml.bytes,&inputs).unwrap();
        core::proof::verify(original.as_bytes(),&restored.bytes,|_|false).unwrap();
    }
    let entry=entry_id("test.mapped-capacity").unwrap();
    let absent=convert_file(entry,Direction::YamlToXml,b"{}",&inputs).unwrap();
    core::proof::verify(b"<Root/>",&absent.bytes,|_|false).unwrap();
}
"#,
    )
    .unwrap();
    let output = std::process::Command::new(env!("CARGO"))
        .args(["test", "--offline", "--quiet"])
        .current_dir(&root)
        .env("CARGO_TARGET_DIR", root.join("target"))
        .output()
        .unwrap();
    assert!(
        output.status.success(),
        "generated null contract failed in {}: {}\n{}",
        root.display(),
        String::from_utf8_lossy(&output.stdout),
        String::from_utf8_lossy(&output.stderr)
    );
    std::fs::remove_dir_all(root).unwrap();
}

#[test]
fn a_tagged_scalar_selector_cannot_hide_a_projected_collection() {
    let modules = nkdk_rule_compiler::parse_many(SourceFile {
        path: "tagged-collection.yaml",
        bytes: br#"format: nkdk-declarations/1
kind: catalog
declarations:
- kind: value
  id: test.projected-collection
  value: {kind: record, fields: [{name: rows, type: {kind: sequence, item: {kind: scalar, scalar: text}}}]}
  representations:
    xml: {kind: record, fields: [{field: rows, path: [Rows]}]}
    yaml: {kind: projection, field: rows}
- kind: value
  id: test.invalid-scalar-choice
  imports: {collection: test.projected-collection}
  value: {kind: choice, variants: [{name: collection, type: {use: collection}}]}
  representations:
    xml: {kind: choice, fallback: collection}
    yaml: {kind: choice, variants: [{variant: collection, form: scalar, tag: state}]}
"#,
    }).unwrap();
    let errors = link(&modules).unwrap_err();
    assert!(
        errors
            .iter()
            .any(|error| error.code == "choice_selector_shape"),
        "{errors:?}"
    );
}

#[test]
fn attribute_canonical_forms_reject_element_only_states() {
    let source = r#"format: nkdk-declarations/1
kind: object
id: test.attribute-form
value: {kind: record, fields: [{name: label, type: {kind: scalar, scalar: text}}]}
representations:
  xml: {kind: record, fields: [{field: label, path: [Envelope], attribute: label}]}
  yaml: {kind: mapping, fields: [{field: label, key: Подпись}]}
presence:
- target: {field: label}
  xml:
    missing: {denotes: {literal: default}}
    canonical: [{when: {eq: [{field: label}, {literal: default}]}, form: FORM}]
  yaml: {missing: {denotes: {literal: default}}}
"#;
    for form in ["missing", "ordinary", "empty-element", "nil"] {
        let source = source.replace("FORM", form);
        let module = parse(SourceFile {
            path: "attribute-form.yaml",
            bytes: source.as_bytes(),
        })
        .unwrap();
        let program = link(&[module]).unwrap();
        let result = generate(&program);
        if matches!(form, "missing" | "ordinary") {
            assert!(result.is_ok(), "{form}: {result:?}");
        } else {
            assert!(
                result
                    .unwrap_err()
                    .iter()
                    .any(|diagnostic| diagnostic.message.contains("Attribute fields")),
                "{form}"
            );
        }
    }
}
