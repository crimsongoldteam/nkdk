mod support;

#[test]
fn projected_number_preserves_its_anomaly_inside_named_rows() {
    let source = r#"format: nkdk-declarations/1
kind: catalog
declarations:
- kind: value
  id: test.number
  namespaces: {xsi: http://www.w3.org/2001/XMLSchema-instance, xs: http://www.w3.org/2001/XMLSchema}
  value: {kind: scalar, scalar: number, profile: decimal}
  representations:
    xml: {kind: text}
    yaml: {kind: scalar, scalar: number}
- kind: value
  id: test.text
  namespaces: {xsi: http://www.w3.org/2001/XMLSchema-instance, xs: http://www.w3.org/2001/XMLSchema}
  value: {kind: scalar, scalar: text}
  representations:
    xml: {kind: text}
    yaml: {kind: scalar, scalar: text}
- kind: value
  id: test.flag
  value: {kind: scalar, scalar: boolean}
  representations:
    xml: {kind: text, values: [{value: true, text: 'true'}, {value: false, text: 'false'}]}
    yaml: {kind: scalar, values: [{value: true, literal: Истина}, {value: false, literal: Ложь}]}
- kind: value
  id: test.choice
  namespaces: {xsi: http://www.w3.org/2001/XMLSchema-instance, xs: http://www.w3.org/2001/XMLSchema}
  imports: {number: test.number, text: test.text, flag: test.flag}
  value:
    kind: choice
    variants:
    - {name: number, type: {use: number}}
    - {name: text, type: {use: text}}
    - {name: flag, type: {use: flag}}
  representations:
    xml:
      kind: choice
      attribute: xsi:type
      otherwise: text
      variants:
      - {variant: number, in: [xs:decimal], emit: xs:decimal}
      - {variant: text, in: [xs:string], emit: xs:string}
      - {variant: flag, in: [xs:boolean], emit: xs:boolean}
    yaml: {kind: choice}
- kind: value
  id: test.projected
  imports: {number: test.choice}
  value: {kind: record, fields: [{name: value, type: {use: number}}]}
@projected-representation@
@optional-mapping@
- kind: value
  id: test.row
  imports: {value: test.projected}
  value:
    kind: record
    fields:
    - {name: name, type: {kind: scalar, scalar: text}}
    - {name: value, type: {use: value}}
  representations:
    xml: {kind: record, fields: [{field: name, path: [Name]}, {field: value, path: [Value]}]}
    yaml: {kind: mapping, fields: [{field: name, key: Name}, {field: value, key: Value}]}
- kind: value
  id: test.rows
  namespaces: {xsi: http://www.w3.org/2001/XMLSchema-instance, t: urn:test}
  imports: {item: test.row}
  value: {kind: sequence, item: {use: item}}
  representations:
    xml:
      kind: with-attributes
      attributes: [{name: xsi:type, value: {qname: t:Rows}}]
      content: {kind: element-sequence, path: [Item], item: {kind: declared}}
    yaml: {kind: record-mapping, key: name, value: value, maxItems: 1}
- kind: value
  id: test.outer-choice
  namespaces: {xsi: http://www.w3.org/2001/XMLSchema-instance, xs: http://www.w3.org/2001/XMLSchema, t: urn:test}
  imports: {rows: test.rows, flag: test.flag}
  inputs: {profile: {type: {kind: scalar, scalar: text}}}
  value:
    kind: choice
    variants: [{name: rows, type: {use: rows}}, {name: flag, type: {use: flag}}]
  representations:
    xml:
      kind: choice
      attribute: xsi:type
      variants: [{variant: rows, in: [t:Rows], emit: t:Rows}, {variant: flag, in: [xs:boolean], emit: xs:boolean}]
      otherwise: flag
    yaml:
      kind: choice
      variants: [{variant: rows, form: mapping-input, input: profile, equals: Rows}, {variant: flag, form: input-profile, input: profile, equals: Flag}]
- kind: value
  id: test.atom
  imports: {value: test.outer-choice}
  inputs: {profile: {type: {kind: scalar, scalar: text}}}
  value: {kind: record, fields: [{name: value, type: {use: value, bind: {profile: {input: profile}}}}]}
@projected-representation@
@optional-null@
- kind: value
  id: test.atoms
  imports: {item: test.atom}
  inputs: {profile: {type: {kind: scalar, scalar: text}}}
  value: {kind: sequence, item: {use: item, bind: {profile: {input: profile}}}}
  representations:
    xml: {kind: element-sequence, path: [Value]}
    yaml: {kind: sequence, item: {kind: declared}, singleton: value}
  presence:
  - target: self
    xml: {missing: {denotes: {absent: true}}, empty: [{form: empty-element, denotes: {absent: true}}]}
    yaml: {missing: {denotes: {absent: true}}, empty: [{form: empty-sequence, denotes: {absent: true}}]}
- kind: value
  id: test.optional-text
  namespaces: {xsi: http://www.w3.org/2001/XMLSchema-instance, xs: http://www.w3.org/2001/XMLSchema}
  imports: {text: test.text}
  value: {kind: record, fields: [{name: content, type: {use: text}}]}
  representations:
    xml:
      kind: with-attributes
      attributes: [{name: xsi:type, value: {qname: xs:string}}]
      content: {kind: record, fields: [{field: content, path: []}]}
    yaml: {kind: projection, field: content}
  presence:
  - target: {field: content}
    xml: {missing: {denotes: {absent: true}}}
    yaml: {missing: {denotes: {absent: true}}}
- kind: value
  id: test.optional-choice
  namespaces: {xsi: http://www.w3.org/2001/XMLSchema-instance, xs: http://www.w3.org/2001/XMLSchema}
  imports: {text: test.optional-text, flag: test.flag}
  value: {kind: choice, variants: [{name: text, type: {use: text}}, {name: flag, type: {use: flag}}]}
  representations:
    xml:
      kind: choice
      attribute: xsi:type
      otherwise: text
      variants: [{variant: text, in: [xs:string], emit: xs:string}, {variant: flag, in: [xs:boolean], emit: xs:boolean}]
    yaml:
      kind: choice
      variants: [{variant: text, form: scalar, tag: xml/string}, {variant: flag, form: scalar, tag: xml/boolean}]
- kind: value
  id: test.outer-row
  namespaces: {xsi: http://www.w3.org/2001/XMLSchema-instance, t: urn:test}
  imports: {value: test.atoms, presentation: test.optional-choice}
  inputs: {profile: {type: {kind: scalar, scalar: text}}}
  value:
    kind: record
    fields:
    - {name: name, type: {kind: scalar, scalar: text}}
    - {name: value, type: {use: value, bind: {profile: {input: profile}}}}
    - {name: presentation, type: {use: presentation}}
  representations:
    xml:
      kind: with-attributes
      attributes: [{name: xsi:type, value: {qname: t:Row}, when: {present: {field: presentation}}}]
      content: {kind: record, fields: [{field: name, path: [Name]}, {field: value, path: []}, {field: presentation, path: [Presentation]}]}
    yaml: {kind: mapping, fields: [{field: name, key: Name}, {field: value, key: Value}, {field: presentation, key: Presentation}]}
  presence:
  - target: {field: presentation}
    xml: {missing: {denotes: {absent: true}}}
    yaml: {missing: {denotes: {absent: true}}}
  constraints:
  - id: row-profile
    appliesTo: [xml-import, yaml-validation]
    assert: {each: {in: {field: value}, as: item, where: {or: [{not: {present: {get: {of: {var: item}, field: value}}}}, {and: [{eq: [{input: profile}, {literal: Rows}]}, {isVariant: {value: {get: {of: {var: item}, field: value}}, variant: rows}}]}, {and: [{eq: [{input: profile}, {literal: Flag}]}, {isVariant: {value: {get: {of: {var: item}, field: value}}, variant: flag}}]}]}}}
    diagnostic: {code: test.profile, severity: error, at: {field: value}, message: Profile mismatch}
- kind: value
  id: test.outer-rows
  imports: {item: test.outer-row}
  value: {kind: sequence, item: {use: item}}
  representations:
    xml: {kind: element-sequence, path: [Item], item: {kind: declared}}
    yaml:
      kind: record-mapping
      key: name
      itemInputs:
        profile: {table: {key: {rowKey: true}, values: {First: Rows, Second: Rows}, default: Flag}}
"#;
    let owner = support::named_sequence_owner(
        "[Root, Rows]",
        "{kind: mapping, fields: [{field: rows, key: Rows}]}",
    )
    .replace("test.rows", "test.outer-rows");
    const PROJECTED_REPRESENTATION: &str = r#"  representations:
    xml: {kind: record, fields: [{field: value, path: []}]}
    yaml: {kind: projection, field: value}"#;
    const OPTIONAL_PRESENCE: &str = r#"  presence:
  - target: {field: value}
    xml: {missing: {denotes: {absent: true}}, empty: [{form: nil, denotes: {absent: true}}]}
    yaml: {missing: {denotes: {absent: true}}, empty: [{form: @empty@, denotes: {absent: true}}]}"#;
    let source = format!("{source}{owner}")
        .replace("@projected-representation@", PROJECTED_REPRESENTATION)
        .replace(
            "@optional-mapping@",
            &OPTIONAL_PRESENCE.replace("@empty@", "empty-mapping"),
        )
        .replace(
            "@optional-null@",
            &OPTIONAL_PRESENCE.replace("@empty@", "null"),
        );
    let (generated, owner) = support::compile_catalog("nested.yaml", &source, "test.owner");
    let program = r#"
mod generated;
use nkdk_conversion_core as core;
use generated::automata_store;
use generated::*;
fn main() {
    let xml=b"<Root xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:xs=\"http://www.w3.org/2001/XMLSchema\" xmlns:t=\"urn:test\"><Rows><Item><Name>First</Name><Value xsi:type=\"t:Rows\"><Item><Name>A</Name><Value xsi:type=\"xs:decimal\">oops</Value></Item></Value></Item><Item><Name>Second</Name><Value xsi:type=\"t:Rows\"><Item><Name>B</Name><Value xsi:type=\"xs:decimal\">2</Value></Item></Value></Item></Rows></Root>";
    let entry=EntryId(OWNER);
    let original=std::str::from_utf8(xml).unwrap();
    let repeated=original.replace("</Value></Item><Item><Name>Second", "</Value><Value xsi:type=\"t:Rows\"><Item><Name>C</Name><Value xsi:type=\"xs:decimal\">3</Value></Item></Value></Item><Item><Name>Second");
    let extra=original.replace(">oops<",">1<").replace("</Item></Value></Item><Item><Name>Second", "</Item><Item><Name>C</Name><Value xsi:type=\"xs:decimal\">3</Value></Item></Value></Item><Item><Name>Second");
    let present = extra.replace("<Rows><Item>","<Rows><Item xsi:type=\"t:Row\">").replace("</Value></Item><Item><Name>Second", "</Value><Presentation xsi:type=\"xs:string\">kept</Presentation></Item><Item><Name>Second");
    let nil = original.replace("<Value xsi:type=\"xs:decimal\">oops</Value>", "<Value xsi:nil=\"true\"/>");
    for (xml,mark) in [(original,"A: !xml/raw"),(repeated.as_str(),"A: !xml/raw"),(extra.as_str(),"- !xml/raw"),(present.as_str(),"- !xml/raw"),(nil.as_str(),"A: !xml/raw")] {
        let imported=convert_file(entry,Direction::XmlToYaml,xml.as_bytes(),&PreparedInputs::default()).unwrap();
        let yaml=String::from_utf8(imported.bytes).unwrap();
        assert!(yaml.lines().any(|line|line.trim()==mark),"{yaml}");
        assert!(yaml.lines().any(|line|line=="      B: 2"),"{yaml}");
        assert!(!yaml.starts_with("Rows: !xml/raw"),"{yaml}");
        let restored=convert_file(entry,Direction::YamlToXml,yaml.as_bytes(),&PreparedInputs::default()).unwrap();
        nkdk_conversion_core::proof::verify_with_attributes(xml.as_bytes(),&restored.bytes,|_|false,|_,name|name.namespace=="http://www.w3.org/2001/XMLSchema-instance"&&name.local=="type").unwrap();
    }
}
"#;
    support::run_generated("nested-projected-anomaly", generated, owner, program);
    support::shared_catalog::run_source_program(
        "shared-nested-anomaly",
        "nested.yaml",
        &source,
        "test.owner",
        program,
    );
}
