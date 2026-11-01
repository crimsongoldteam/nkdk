use nkdk_rule_compiler::{SourceFile, compile, link, parse, schema};
use std::{fs, process::Command};
mod support;

const COMMON: &str = include_str!("fixtures/qname-common.yaml");
const OWNER: &str = include_str!("fixtures/qname-owner.yaml");

#[test]
fn qname_representation_binds_two_distinct_text_fields() {
    let modules = [COMMON, OWNER].map(|value| {
        parse(SourceFile {
            path: "qname.yaml",
            bytes: value.as_bytes(),
        })
        .unwrap()
    });
    let program = link(&modules).unwrap();
    let document: serde_json::Value =
        serde_json::from_slice(&schema(&program, "test.qualified").unwrap()).unwrap();
    assert_eq!(
        document["properties"]["Qualified"]["properties"]["Name"]["type"],
        "string"
    );
    compile(&[
        SourceFile {
            path: "common.yaml",
            bytes: COMMON.as_bytes(),
        },
        SourceFile {
            path: "owner.yaml",
            bytes: OWNER.as_bytes(),
        },
    ])
    .unwrap();
    for invalid in [
        COMMON.replace("local: part", "local: uri"),
        COMMON.replace("namespace: uri", "namespace: absent"),
        COMMON.replace(
            "name: part, type: {kind: scalar, scalar: text}",
            "name: part, type: {kind: scalar, scalar: boolean}",
        ),
    ] {
        let module = parse(SourceFile {
            path: "invalid.yaml",
            bytes: invalid.as_bytes(),
        })
        .unwrap();
        assert!(link(&[module]).is_err());
    }
}

#[test]
fn qname_table_uses_namespace_uri_in_scalar_collections() {
    const TYPES: &str = r#"format: nkdk-declarations/1
kind: value
id: common.type-kind
namespaces: {xs: 'http://www.w3.org/2001/XMLSchema'}
value:
  kind: enum
  variants: [{name: string, value: string}, {name: boolean, value: boolean}]
representations:
  xml:
    kind: qname-table
    values:
    - {value: string, name: xs:string}
    - {value: boolean, name: xs:boolean}
  yaml:
    kind: scalar
    values:
    - {value: string, literal: Строка}
    - {value: boolean, literal: Булево}
"#;
    const LIST: &str = r#"format: nkdk-declarations/1
kind: value
id: common.type-kinds
namespaces: {v8: 'http://v8.1c.ru/8.1/data/core'}
imports: {kind: common.type-kind}
value: {kind: sequence, item: {use: kind}}
representations:
  xml: {kind: element-sequence, path: [v8:Type]}
  yaml: {kind: sequence, singleton: scalar}
"#;
    const OWNER: &str = r#"format: nkdk-declarations/1
kind: object
id: test.type-kinds
imports: {types: common.type-kinds}
value: {kind: record, fields: [{name: types, type: {use: types}}]}
representations:
  xml: {kind: record, fields: [{field: types, path: [Root]}]}
  yaml: {kind: mapping, fields: [{field: types, key: Types}]}
"#;
    const NAME: &str = r#"format: nkdk-declarations/1
kind: value
id: common.type-name
namespaces:
  xs: http://www.w3.org/2001/XMLSchema
  cfg: http://v8.1c.ru/8.1/data/enterprise/current-config
value: {kind: scalar, scalar: text}
representations:
  xml:
    kind: qname-lexicon
    values:
    - {name: xs:string, literal: Строка}
    - {name: cfg:CatalogRef, literal: Справочник, separator: '.'}
    - {name: cfg:ExternalTableRef, literal: ExternalTable, separator: '.', tailSegments: [Source, Table]}
  yaml: {kind: scalar, scalar: text}
"#;
    const NAMES: &str = r#"format: nkdk-declarations/1
kind: value
id: common.type-names
namespaces: {v8: 'http://v8.1c.ru/8.1/data/core'}
imports: {name: common.type-name}
value: {kind: sequence, item: {use: name}}
representations:
  xml: {kind: element-sequence, path: [v8:Type]}
  yaml: {kind: sequence, singleton: scalar}
"#;
    const NAMES_OWNER: &str = r#"format: nkdk-declarations/1
kind: object
id: test.type-names
imports: {names: common.type-names}
value: {kind: record, fields: [{name: names, type: {use: names}}]}
representations:
  xml: {kind: record, fields: [{field: names, path: [Root]}]}
  yaml: {kind: mapping, fields: [{field: names, key: Names}]}
"#;
    // The file-root binder emits this neutral QName envelope after source
    // specialization. The body's conversion remains an independent contract.
    let typed_list = LIST.replace("common.type-kinds", "common.typed-kinds")
        .replace("namespaces: {v8:", "namespaces: {xsi: 'http://www.w3.org/2001/XMLSchema-instance', xs: 'http://www.w3.org/2001/XMLSchema', v8:")
        .replace("  xml: {kind: element-sequence, path: [v8:Type]}",
            "  xml: {kind: with-attributes, attributes: [{name: xsi:type, value: {qname: xs:Kinds}}, {name: version, value: {text: '2.20'}}], content: {kind: element-sequence, path: [v8:Type]}}");
    let typed_owner = OWNER
        .replace("common.type-kinds", "common.typed-kinds")
        .replace("test.type-kinds", "test.typed-kinds");
    let buffered_choice = r#"format: nkdk-declarations/1
kind: catalog
declarations:
@RAW_ATTRIBUTE_RECORD@
- kind: value
  id: test.qname-choice
  imports: {normal: common.qualified, raw: test.qname-fallback}
  value: {kind: choice, variants: [{name: normal, type: {use: normal}}, {name: raw, type: {use: raw}}]}
  representations:
    xml: {kind: choice, fallback: raw}
    yaml: {kind: choice, variants: [{variant: normal, form: mapping, key: Name}, {variant: raw, form: mapping, key: Raw}]}
- kind: object
  id: test.qname-choice-owner
  imports: {name: test.qname-choice}
  value: {kind: record, fields: [{name: name, type: {use: name}}]}
  representations:
    xml: {kind: record, fields: [{field: name, path: [Root, Value]}]}
    yaml: {kind: mapping, fields: [{field: name, key: QualifiedChoice}]}
"#.replace("@RAW_ATTRIBUTE_RECORD@", &support::raw_attribute_record("test.qname-fallback", "flag", "Raw"));
    let nullable_owner = OWNER
        .replace("test.type-kinds", "test.nullable-qname")
        .replace("common.type-kinds", "common.type-kind")
        .replace("path: [Root]", "path: [Root, Value]")
        + "\npresence:\n- target: {field: types}\n  xml:\n    missing: {denotes: {absent: true}}\n    empty: [{form: nil, denotes: {absent: true}}]\n  yaml:\n    missing: {denotes: {absent: true}}\n    empty: [{form: null, denotes: {absent: true}}]\n";
    let generated = compile(&[
        SourceFile {
            path: "nullable-qname.yaml",
            bytes: nullable_owner.as_bytes(),
        },
        SourceFile {
            path: "buffered-choice.yaml",
            bytes: buffered_choice.as_bytes(),
        },
        SourceFile {
            path: "qname.yaml",
            bytes: COMMON.as_bytes(),
        },
        SourceFile {
            path: "typed-list.yaml",
            bytes: typed_list.as_bytes(),
        },
        SourceFile {
            path: "typed-owner.yaml",
            bytes: typed_owner.as_bytes(),
        },
        SourceFile {
            path: "types.yaml",
            bytes: TYPES.as_bytes(),
        },
        SourceFile {
            path: "list.yaml",
            bytes: LIST.as_bytes(),
        },
        SourceFile {
            path: "owner.yaml",
            bytes: OWNER.as_bytes(),
        },
        SourceFile {
            path: "name.yaml",
            bytes: NAME.as_bytes(),
        },
        SourceFile {
            path: "names.yaml",
            bytes: NAMES.as_bytes(),
        },
        SourceFile {
            path: "names-owner.yaml",
            bytes: NAMES_OWNER.as_bytes(),
        },
    ])
    .unwrap();
    let root = support::generated_crate_root("qname-table");
    let core = support::conversion_core_path();
    let manifest = format!(
        "[package]\nname=\"qname-table-generated\"\nversion=\"0.0.0\"\nedition=\"2024\"\n[dependencies]\nnkdk-conversion-core={{path={core:?}}}\n[workspace]\n"
    );
    fs::write(root.join("Cargo.toml"), manifest).unwrap();
    generated
        .files
        .into_iter()
        .for_each(|file| fs::write(root.join("src").join(file.path), file.contents).unwrap());
    let main = r#"include!("generated.rs");
fn main(){
 let nullable=entry_id("test.nullable-qname").unwrap();
 for (body,expected) in [("", ""), ("<Value xsi:nil='true'/>", "Types: null"), ("<Value>xs:string</Value>", "Types: Строка")] {
  let xml=format!("<Root xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance' xmlns:xs='http://www.w3.org/2001/XMLSchema'>{body}</Root>");
  let inputs=PreparedInputs::default();
  let yaml=convert_file(nullable,Direction::XmlToYaml,xml.as_bytes(),&inputs).unwrap();
  assert_eq!(std::str::from_utf8(&yaml.bytes).unwrap(),expected);
  verify_candidate(nullable,xml.as_bytes(),expected.as_bytes(),&inputs).unwrap();
 }
 let choice=entry_id("test.qname-choice-owner").unwrap();
 for (xml,namespace,local) in [
  ("<Root xmlns:p='urn:outer'><Value>p:Thing</Value></Root>","urn:outer","Thing"),
  ("<Root xmlns:p='urn:outer'><Value xmlns:p='urn:inner'><![CDATA[p:]]>Other</Value></Root>","urn:inner","Other"),
 ] {
  let inputs=PreparedInputs::default();
  let expected=format!("QualifiedChoice:\n  Namespace: {namespace}\n  Name: {local}");
  let converted=convert_file(choice,Direction::XmlToYaml,xml.as_bytes(),&inputs).unwrap();
  assert_eq!(converted.bytes,expected.as_bytes());
  assert!(validate_file(choice,expected.as_bytes(),&inputs).is_empty());
  verify_candidate(choice,xml.as_bytes(),expected.as_bytes(),&inputs).unwrap();
 }
 let entry=entry_id("test.type-kinds").unwrap();let inputs=PreparedInputs::default();
 let xml=b"<Root xmlns:v8='http://v8.1c.ru/8.1/data/core' xmlns:alias='http://www.w3.org/2001/XMLSchema'><v8:Type>alias:string</v8:Type><v8:Type>alias:boolean</v8:Type></Root>";
 let yaml=convert_file(entry,Direction::XmlToYaml,xml,&inputs).unwrap();assert_eq!(yaml.bytes,"Types:\n  - Строка\n  - Булево".as_bytes());verify_candidate(entry,xml,&yaml.bytes,&inputs).unwrap();
 let singleton=convert_file(entry,Direction::YamlToXml,"Types: Строка".as_bytes(),&inputs).unwrap();let back=convert_file(entry,Direction::XmlToYaml,&singleton.bytes,&inputs).unwrap();assert_eq!(back.bytes,"Types: Строка".as_bytes());
 let typed=entry_id("test.typed-kinds").unwrap();
 let root="<Root xmlns:v8='http://v8.1c.ru/8.1/data/core' xmlns:alias='http://www.w3.org/2001/XMLSchema' xmlns:instance='http://www.w3.org/2001/XMLSchema-instance' instance:type='alias:Kinds' version='2.20'>";
 let body="<v8:Type>alias:string</v8:Type><v8:Type>alias:boolean</v8:Type></Root>";
 let original=format!("{root}{body}");
 let yaml=convert_file(typed,Direction::XmlToYaml,original.as_bytes(),&inputs).unwrap();
 assert_eq!(yaml.bytes,"Types:\n  - Строка\n  - Булево".as_bytes());
 verify_candidate(typed,original.as_bytes(),&yaml.bytes,&inputs).unwrap();
 for changed in [root.replace("alias:Kinds","alias:Other"),root.replace(" instance:type='alias:Kinds'",""),root.replace("version='2.20'","version='3.00'"),root.replace(" version='2.20'",""),root.replace("version='2.20'","version='2.20' extra='retained'")] {
  let xml=format!("{changed}{body}");
  let yaml=convert_file(typed,Direction::XmlToYaml,xml.as_bytes(),&inputs).unwrap_or_else(|error|panic!("{xml}: {error:?}"));
  assert!(String::from_utf8_lossy(&yaml.bytes).contains("!xml"));
  let text=String::from_utf8_lossy(&yaml.bytes);
  assert!(text.contains("Строка") && text.contains("Булево"),"{text}");
  verify_candidate(typed,xml.as_bytes(),&yaml.bytes,&inputs).unwrap();
 }
 let exported=convert_file(typed,Direction::YamlToXml,"Types: Строка".as_bytes(),&inputs).unwrap();
 let back=convert_file(typed,Direction::XmlToYaml,&exported.bytes,&inputs).unwrap();
 assert_eq!(back.bytes,"Types: Строка".as_bytes());
 let names=entry_id("test.type-names").unwrap();let complex="<Root xmlns:v8='http://v8.1c.ru/8.1/data/core' xmlns:any='http://v8.1c.ru/8.1/data/enterprise/current-config'><v8:Type>any:CatalogRef.Товары</v8:Type></Root>".as_bytes();let yaml=convert_file(names,Direction::XmlToYaml,complex,&inputs).unwrap();assert_eq!(yaml.bytes,"Names: Справочник.Товары".as_bytes());verify_candidate(names,complex,&yaml.bytes,&inputs).unwrap();
 let shortened="<Root xmlns:v8='http://v8.1c.ru/8.1/data/core' xmlns:any='http://v8.1c.ru/8.1/data/enterprise/current-config'><v8:Type>any:ExternalTableRef.SourceMain.TableRows</v8:Type></Root>".as_bytes();let yaml=convert_file(names,Direction::XmlToYaml,shortened,&inputs).unwrap();assert_eq!(yaml.bytes,"Names: SourceMain.TableRows".as_bytes());verify_candidate(names,shortened,&yaml.bytes,&inputs).unwrap();
}"#;
    fs::write(root.join("src/main.rs"), main).unwrap();
    let status = Command::new("cargo")
        .arg("run")
        .arg("--quiet")
        .env("CARGO_NET_OFFLINE", "true")
        .current_dir(&root)
        .status()
        .unwrap();
    assert!(status.success());
    let _ = fs::remove_dir_all(root);
}

#[test]
fn choice_may_delegate_only_a_complete_finite_attribute_domain() {
    let source = r#"format: nkdk-declarations/1
kind: catalog
declarations:
- kind: value
  id: test.names
  namespaces: {a: 'urn:types'}
  value: {kind: scalar, scalar: text}
  representations:
    xml: {kind: qname-lexicon, values: [{name: 'a:One', literal: Первый}, {name: 'a:Two', literal: Второй}]}
    yaml: {kind: scalar, scalar: text}
- kind: value
  id: test.record
  namespaces: {xsi: 'http://www.w3.org/2001/XMLSchema-instance'}
  imports: {name: test.names}
  value: {kind: record, fields: [{name: name, type: {use: name}}]}
  representations:
    xml: {kind: record, fields: [{field: name, path: [], attribute: 'xsi:type'}]}
    yaml: {kind: mapping, fields: [{field: name, key: Тип}]}
- kind: value
  id: test.choice
  namespaces: {a: 'urn:types', xsi: 'http://www.w3.org/2001/XMLSchema-instance'}
  imports: {record: test.record}
  value: {kind: choice, variants: [{name: record, type: {use: record}}]}
  representations:
    xml: {kind: choice, attribute: 'xsi:type', variants: [{variant: record, in: ['a:One', 'a:Two']}], otherwise: record}
    yaml: {kind: choice, variants: [{variant: record, form: mapping, key: Тип}]}
"#;
    let check = |source: &str| {
        let modules = nkdk_rule_compiler::parse_many(SourceFile {
            path: "attribute-choice.yaml",
            bytes: source.as_bytes(),
        })
        .unwrap();
        link(&modules)
    };
    check(source).unwrap();
    for invalid in [
        source.replace("in: ['a:One', 'a:Two']", "in: ['a:One']"),
        source.replace(
            "in: ['a:One', 'a:Two']",
            "in: ['a:One', 'a:Two', 'a:Other']",
        ),
        source.replace("attribute: 'xsi:type'}]", "attribute: 'kind'}]"),
    ] {
        assert!(
            check(&invalid)
                .unwrap_err()
                .iter()
                .any(|error| error.code == "invalid_choice_emit")
        );
    }
}

#[test]
fn choice_can_inherit_xml_names_from_an_imported_choice() {
    let source = r#"format: nkdk-declarations/1
kind: catalog
declarations:
- kind: value
  id: test.text
  description: Text payload for the inherited XML selector
  value: {kind: scalar, scalar: text}
  representations: {xml: {kind: text}, yaml: {kind: scalar, scalar: text}}
- kind: value
  id: test.inner
  namespaces: {xsi: 'http://www.w3.org/2001/XMLSchema-instance', xs: 'http://www.w3.org/2001/XMLSchema'}
  imports: {text: test.text}
  value: {kind: choice, variants: [{name: text, type: {use: text}}]}
  representations:
    xml: {kind: choice, attribute: 'xsi:type', variants: [{variant: text, in: ['xs:string'], emit: 'xs:string'}], otherwise: text}
    yaml: {kind: choice, variants: [{variant: text, form: scalar, tag: text}]}
- kind: value
  id: test.wrapper
  imports: {value: test.inner}
  value: {kind: record, fields: [{name: value, type: {use: value}}]}
  representations:
    xml: {kind: record, fields: [{field: value, path: []}]}
    yaml: {kind: projection, field: value}
- kind: value
  id: test.outer
  namespaces: {xsi: 'http://www.w3.org/2001/XMLSchema-instance'}
  imports: {nested: test.wrapper, selector: test.inner}
  inputs: {profile: {type: {kind: scalar, scalar: text}}}
  value: {kind: choice, variants: [{name: nested, type: {use: nested}}]}
  representations:
    xml: {kind: choice, attribute: 'xsi:type', variants: [{variant: nested, from: selector}], otherwise: nested}
    yaml: {kind: choice, variants: [{variant: nested, form: input-profile, input: profile, equals: Nested}]}
"#;
    let modules = nkdk_rule_compiler::parse_many(SourceFile {
        path: "inherited-choice.yaml",
        bytes: source.as_bytes(),
    })
    .unwrap();
    let linked = link(&modules).unwrap();
    let outer = linked
        .entries
        .iter()
        .find(|entry| entry.name == "test.outer")
        .unwrap();
    let nkdk_rule_model::LinkedXml::DiscriminatedChoice(choice) = &outer.xml else {
        panic!("linked choice")
    };
    assert_eq!(choice.variants[0].values[0].local, "string");
    assert_eq!(
        choice.variants[0].values[0].namespace,
        "http://www.w3.org/2001/XMLSchema"
    );
}

#[test]
fn selected_text_does_not_inherit_qname_semantics_from_another_variant() {
    let source = r#"format: nkdk-declarations/1
kind: catalog
declarations:
@TEXT_VALUE@
- kind: value
  id: test.mixed
  namespaces: {xsi: 'http://www.w3.org/2001/XMLSchema-instance', xs: 'http://www.w3.org/2001/XMLSchema'}
  imports: {text: test.text, name: common.qualified}
  value: {kind: choice, variants: [{name: text, type: {use: text}}, {name: name, type: {use: name}}]}
  representations:
    xml: {kind: choice, attribute: xsi:type, variants: [{variant: text, in: [xs:string], emit: xs:string}, {variant: name, in: [xs:QName], emit: xs:QName}], otherwise: text}
    yaml: {kind: choice, fallback: text, variants: [{variant: name, form: mapping, key: Name}]}
- kind: object
  id: test.mixed-owner
  namespaces: {f: 'urn:form'}
  imports: {mixed: test.mixed}
  value: {kind: record, fields: [{name: value, type: {use: mixed}}]}
  representations:
    xml: {kind: record, fields: [{field: value, path: [f:Root, f:Value]}]}
    yaml: {kind: mapping, fields: [{field: value, key: Value}]}
- kind: value
  id: test.mixed-row
  namespaces: {f: 'urn:form'}
  imports: {mixed: test.mixed}
  value: {kind: record, fields: [{name: value, type: {use: mixed}}]}
  representations:
    xml: {kind: record, fields: [{field: value, path: [f:Value]}]}
    yaml: {kind: mapping, fields: [{field: value, key: Value}]}
- kind: value
  id: test.mixed-list
  namespaces: {f: 'urn:form'}
  imports: {row: test.mixed-row}
  value: {kind: sequence, item: {use: row}}
  representations:
    xml: {kind: element-sequence, path: [f:Item]}
    yaml: {kind: sequence}
- kind: object
  id: test.mixed-list-owner
  namespaces: {f: 'urn:form'}
  imports: {items: test.mixed-list}
  value: {kind: record, fields: [{name: values, type: {use: items}}]}
  representations:
    xml: {kind: record, fields: [{field: values, path: [f:Root]}]}
    yaml: {kind: mapping, fields: [{field: values, key: Values}]}

"#.replace("@TEXT_VALUE@", include_str!("support/plain-text-declaration.yaml.in"));
    let generated = compile(&[
        SourceFile {
            path: "mixed.yaml",
            bytes: source.as_bytes(),
        },
        SourceFile {
            path: "qname.yaml",
            bytes: COMMON.as_bytes(),
        },
    ])
    .unwrap();
    support::run_generated(
        "mixed-qname",
        generated,
        0,
        r#"include!("generated.rs");
fn main() {
    let id=entry_id("test.mixed-owner").unwrap();
    let inputs=PreparedInputs::default();
    for (kind,text,expected) in [
        ("string","Plain","Value: Plain"),
        ("QName","p:Thing","Value:\n  Namespace: urn:other\n  Name: Thing"),
    ] {
        let xml=format!("<Root xmlns='urn:form' xmlns:p='urn:other' xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance' xmlns:xs='http://www.w3.org/2001/XMLSchema'><Value xsi:type='xs:{kind}'>{text}</Value></Root>");
        let yaml=convert_file(id,Direction::XmlToYaml,xml.as_bytes(),&inputs).unwrap();
        assert_eq!(std::str::from_utf8(&yaml.bytes).unwrap(),expected);
        verify_candidate(id,xml.as_bytes(),expected.as_bytes(),&inputs).unwrap();
        let exceptional=xml.replace("<Value xsi:type=", "<Value extra='kept' xsi:type=");
        let yaml=convert_file(id,Direction::XmlToYaml,exceptional.as_bytes(),&inputs).unwrap();
        assert!(std::str::from_utf8(&yaml.bytes).unwrap().contains("!xml/raw"));
        verify_candidate(id,exceptional.as_bytes(),&yaml.bytes,&inputs).unwrap();

    }
    let id=entry_id("test.mixed-list-owner").unwrap();
    for (body,expected) in [
        ("<Item><Value xsi:type='xs:string'>Plain</Value></Item><Item><Value xsi:type='xs:QName'>p:Thing</Value></Item>", "Values:\n  -\n    Value: Plain\n  -\n    Value:\n      Namespace: urn:other\n      Name: Thing"),
        ("<Item><Value xsi:type='xs:QName'>p:Thing</Value></Item><Item><Value xsi:type='xs:string'>Plain</Value></Item>", "Values:\n  -\n    Value:\n      Namespace: urn:other\n      Name: Thing\n  -\n    Value: Plain"),
    ] {
        let xml=format!("<Root xmlns='urn:form' xmlns:p='urn:other' xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance' xmlns:xs='http://www.w3.org/2001/XMLSchema'>{body}</Root>");
        let yaml=convert_file(id,Direction::XmlToYaml,xml.as_bytes(),&inputs).unwrap();
        assert_eq!(std::str::from_utf8(&yaml.bytes).unwrap(),expected);
        verify_candidate(id,xml.as_bytes(),expected.as_bytes(),&inputs).unwrap();
    }

}"#,
    );
}
