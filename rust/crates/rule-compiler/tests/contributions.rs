use nkdk_rule_compiler::{GeneratedSources, SourceFile, compile, link, parse};

const CODE: &str = include_str!("fixtures/fact-code.yaml");
const OWNER: &str = include_str!("fixtures/fact-owner.yaml");
const NESTED_OWNER: &str = r#"format: nkdk-declarations/1
kind: object
id: test.nested-fact-owner
imports: {nested: test.nested-fact-rows}
value: {kind: record, fields: [{name: name, type: {kind: scalar, scalar: text}}, {name: type, type: {use: nested}}]}
representations:
  xml: {kind: record, fields: [{field: name, path: [Root, Name]}, {field: type, path: [Root, Type]}]}
  yaml: {kind: mapping, fields: [{field: name, key: Name}, {field: type, key: Type}]}
contributions:
- index: test.nested-names
  forEach: {in: {get: {of: {field: type}, field: items}}, as: item}
  key: {field: name}
  value: {get: {of: {var: item}, field: code}}
"#;

const NESTED_ROW: &str = r#"format: nkdk-declarations/1
kind: value
id: test.nested-fact-row
value: {kind: record, fields: [{name: code, type: {kind: scalar, scalar: text}}, {name: title, type: {kind: scalar, scalar: text}}]}
representations:
  xml: {kind: record, fields: [{field: code, path: [Code]}, {field: title, path: [Title]}]}
  yaml: {kind: mapping, fields: [{field: code, key: Code}, {field: title, key: Title}]}
"#;
const NESTED_ROWS: &str = r#"format: nkdk-declarations/1
kind: value
id: common.project-rows
imports: {row: test.nested-fact-row}
value: {kind: sequence, item: {use: row}}
representations:
  xml: {kind: element-sequence, path: [Item], item: {kind: declared}}
  yaml: {kind: sequence, item: {kind: declared}}
"#;
const NESTED_RECORD: &str = r#"format: nkdk-declarations/1
kind: value
id: test.nested-fact-rows
imports: {rows: common.project-rows}
value: {kind: record, fields: [{name: items, type: {use: rows}}]}
representations:
  xml: {kind: record, fields: [{field: items, path: [Items]}]}
  yaml: {kind: mapping, fields: [{field: items, key: Items}]}
"#;

const TYPE_DESCRIPTION_FILES: &[&str] = &[
    "string",
    "i8n-text",
    "type-description-name",
    "type-description-item",
    "type-description-items",
    "type-description-qname-item",
    "type-description-types",
    "type-description-type-sets",
    "type-description-identifier-item",
    "type-description-identifiers",
    "type-description",
];

const FACT_MAIN: &str = r#"include!("generated.rs");
fn main() {
    let entry=entry_id(@ENTRY@).unwrap();
    for (direction,source) in [(Direction::XmlToYaml,@XML@),(Direction::YamlToXml,@YAML@)] {
        let generation=core::facts::Generation(1);
        let mut builder=fact_builder(generation,core::facts::prepared::FactBudget{text:core::facts::text::TextBudget{entries:10,bytes:1000},rows:10});
        let errors=contribute_file(entry,direction,source.as_bytes(),&PreparedInputs::default(),&mut builder);
        assert!(errors.is_empty(),"{errors:?}");
        let facts=builder.finish();
        assert_eq!(facts.lookup(generation,fact_id(@INDEX@).unwrap(),"A"),core::facts::FactState::Ready(@EXPECTED@));
    }
    let generation=core::facts::Generation(2);
    let mut builder=fact_builder(generation,core::facts::prepared::FactBudget{text:core::facts::text::TextBudget{entries:10,bytes:1000},rows:10});
    let errors=contribute_file(entry,Direction::XmlToYaml,b"<Root><Name>A</Name></Root>",&PreparedInputs::default(),&mut builder);
    assert!(!errors.is_empty(),"Missing nested value must not become a known empty index");
    assert_eq!(builder.finish().lookup(generation,fact_id(@INDEX@).unwrap(),"A"),core::facts::FactState::Unready);
}
"#;

const UNION_PREPARE_MAIN: &str = r#"include!("generated.rs");
fn prepared_pair(entry: EntryId, direction: Direction, sources: [&str;2]) -> core::facts::prepared::PreparedTextFacts {
    let generation=core::facts::Generation(1);
    let mut builder=fact_builder(generation,core::facts::prepared::FactBudget{text:core::facts::text::TextBudget{entries:30,bytes:1000},rows:20});
    for source in sources {
        let errors=contribute_file(entry,direction,source.as_bytes(),&PreparedInputs::default(),&mut builder);
        assert!(errors.is_empty(),"{errors:?}");
    }
    builder.finish()
}
"#;

fn fact_main(entry: &str, index: &str, xml: &str, yaml: &str, expected: &str) -> String {
    FACT_MAIN
        .replace("@ENTRY@", &format!("{entry:?}"))
        .replace("@INDEX@", &format!("{index:?}"))
        .replace("@XML@", &format!("{xml:?}"))
        .replace("@YAML@", &format!("{yaml:?}"))
        .replace("@EXPECTED@", &format!("{expected:?}"))
}

fn nested_sources<'a>(
    row: &'a str,
    rows: &'a str,
    nested: &'a str,
    owner: &'a str,
    consumer: Option<&'a str>,
) -> Vec<SourceFile<'a>> {
    let mut sources = [
        ("row.yaml", row),
        ("rows.yaml", rows),
        ("nested.yaml", nested),
        ("owner.yaml", owner),
    ]
    .into_iter()
    .map(|(path, bytes)| SourceFile {
        path,
        bytes: bytes.as_bytes(),
    })
    .collect::<Vec<_>>();
    if let Some(consumer) = consumer {
        sources.push(SourceFile {
            path: "consumer.yaml",
            bytes: consumer.as_bytes(),
        });
    }
    sources
}

fn type_sources<'a>(
    names: &'a [&'a str],
    contents: &'a [Vec<u8>],
    owner: &'a str,
) -> Vec<SourceFile<'a>> {
    names
        .iter()
        .zip(contents)
        .map(|(name, bytes)| SourceFile { path: name, bytes })
        .chain(std::iter::once(SourceFile {
            path: "owner.yaml",
            bytes: owner.as_bytes(),
        }))
        .collect()
}

fn run_generated(generated: GeneratedSources, name: &str, main: &str) {
    let root = std::env::temp_dir().join(format!("nkdk-{name}-{}", std::process::id()));
    let sources = root.join("src");
    std::fs::create_dir_all(&sources).unwrap();
    let core = std::path::PathBuf::from(concat!(env!("CARGO_MANIFEST_DIR"), "/../conversion-core"));
    std::fs::write(root.join("Cargo.toml"), format!("[package]\nname='{name}'\nversion='0.0.0'\nedition='2024'\n[dependencies]\nnkdk-conversion-core={{path={core:?}}}\n[workspace]\n")).unwrap();
    for file in generated.files {
        std::fs::write(sources.join(file.path), file.contents).unwrap();
    }
    std::fs::write(sources.join("main.rs"), main).unwrap();
    let output = std::process::Command::new(env!("CARGO"))
        .args(["run", "--offline", "--quiet"])
        .current_dir(&root)
        .env(
            "CARGO_TARGET_DIR",
            std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join("../../target"),
        )
        .env("CARGO_BUILD_JOBS", "1")
        .output()
        .unwrap();
    assert!(
        output.status.success(),
        "{}",
        String::from_utf8_lossy(&output.stderr)
    );
    std::fs::remove_dir_all(root).unwrap();
}

#[test]
fn owner_can_contribute_rows_from_nested_declared_record() {
    let row = NESTED_ROW;
    let rows = NESTED_ROWS;
    let nested = NESTED_RECORD;
    let owner = NESTED_OWNER;
    let generated = compile(&nested_sources(row, rows, nested, owner, None))
        .expect("nested declared rows must be usable as an index contribution");
    run_generated(
        generated,
        "nested-facts-contract",
        &fact_main(
            "test.nested-fact-owner",
            "test.nested-names",
            "<Root><Name>A</Name><Type><Items><Item><Code>one</Code><Title>First</Title></Item></Items></Type></Root>",
            "Name: A\nType:\n  Items:\n    - Code: one\n      Title: First",
            "one",
        ),
    );
}

#[test]
fn type_description_items_can_be_declared_as_an_owner_fact_source() {
    let root = std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join("../../declarations/common");
    let names = TYPE_DESCRIPTION_FILES;
    let contents: Vec<_> = names
        .iter()
        .map(|name| std::fs::read(root.join(format!("{name}.yaml"))).unwrap())
        .collect();
    let owner = NESTED_OWNER
        .replace("test.nested-fact-owner", "test.real-nested-fact-owner")
        .replace("test.nested-fact-rows", "common.type-description")
        .replace("test.nested-names", "test.real-nested-type-items")
        .replace("field: code", "field: value");
    let sources = type_sources(names, &contents, &owner);
    let generated = compile(&sources)
        .expect("actual TypeDescription item collection must support declared contribution");
    run_generated(
        generated,
        "type-facts-contract",
        &fact_main(
            "test.real-nested-fact-owner",
            "test.real-nested-type-items",
            "<Root xmlns:v8='http://v8.1c.ru/8.1/data/core' xmlns:xs='http://www.w3.org/2001/XMLSchema'><Name>A</Name><Type><v8:Type>xs:string</v8:Type></Type></Root>",
            "Name: A\nType:\n  - Строка",
            "Строка",
        ),
    );
    let union_owner = owner
        .replace("test.real-nested-type-items", "test.real-type-union")
        .replace("key: {field: name}", "key: {concat: [{literal: 'ОпределяемыйТип.'}, {field: name}]}")
        .replace("  value: {get: {of: {var: item}, field: value}}", "  value: {get: {of: {var: item}, field: value}}\n  union: {referencePrefix: 'ОпределяемыйТип.'}");
    let union_sources = type_sources(names, &contents, &union_owner);
    let generated = compile(&union_sources).expect("real TypeDescription can feed a named union");
    let main = r#"fn main() {
    let entry=entry_id("test.real-nested-fact-owner").unwrap();
    for (direction, sources) in [
        (Direction::XmlToYaml, ["<Root xmlns:v8='http://v8.1c.ru/8.1/data/core' xmlns:cfg='http://v8.1c.ru/8.1/data/enterprise/current-config'><Name>A</Name><Type><v8:TypeSet>cfg:DefinedType.Б</v8:TypeSet></Type></Root>","<Root xmlns:v8='http://v8.1c.ru/8.1/data/core' xmlns:xs='http://www.w3.org/2001/XMLSchema'><Name>Б</Name><Type><v8:Type>xs:string</v8:Type></Type></Root>"]),
        (Direction::YamlToXml, ["Name: A\nType: ОпределяемыйТип.Б","Name: Б\nType: Строка"]),
    ] {
        let generation=core::facts::Generation(1);
        let facts=prepared_pair(entry,direction,sources);
        let core::facts::FactState::Ready(values)=facts.lookup_union(generation,fact_id("test.real-type-union").unwrap(),"ОпределяемыйТип.A") else {panic!("defined type expansion unavailable")};
        assert_eq!(values.collect::<Vec<_>>(),vec!["Строка"]);
    }
}
"#;
    run_generated(
        generated,
        "real-type-union-contract",
        &format!("{UNION_PREPARE_MAIN}{main}"),
    );
}

#[test]
fn real_defined_type_fixture_contributes_declared_alternatives() {
    let common = std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join("../../declarations/common");
    let contents = TYPE_DESCRIPTION_FILES
        .iter()
        .map(|name| std::fs::read(common.join(format!("{name}.yaml"))).unwrap())
        .collect::<Vec<_>>();
    let owner = include_str!("../../../declarations/probes/defined-type-facts.yaml");
    let sources = type_sources(TYPE_DESCRIPTION_FILES, &contents, owner);
    let generated = compile(&sources).expect("real defined type paths must compile");
    let fixture = std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
        .join("../../../e2e/fixtures/xml/cf/DefinedTypes/ОпределяемыйТипВсеСвойства.xml");
    let yaml_fixture = std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
        .join("../../../e2e/fixtures/nkdk/cf/ОпределяемыйТип/ОпределяемыйТипВсеСвойства.yaml");
    let main = format!(
        r#"include!("generated.rs");
fn main() {{
    let entry=entry_id("migration.defined-type-facts").unwrap();
    for (direction,path) in [(Direction::XmlToYaml,{fixture:?}),(Direction::YamlToXml,{yaml_fixture:?})] {{
        let source=std::fs::read(path).unwrap();
        let generation=core::facts::Generation(1);
        let mut builder=fact_builder(generation,core::facts::prepared::FactBudget{{text:core::facts::text::TextBudget{{entries:20,bytes:1000}},rows:10}});
        let inputs=prepare_inputs(entry,vec![
            ("ownerName".into(),InputValue::Text("ОпределяемыйТипВсеСвойства".into())),
            ("defaultLanguage".into(),InputValue::Text("ru".into())),
            ("registeredLanguages".into(),InputValue::Sequence(vec![InputValue::Text("ru".into())])),
        ]).unwrap();
        let issues=contribute_file(entry,direction,&source,&inputs,&mut builder);
        assert!(issues.is_empty(),"{{direction:?}} {{issues:?}}");
        let facts=builder.finish();
        let core::facts::FactState::Ready(values)=facts.lookup_union(generation,fact_id("metadata.defined-type-alternatives").unwrap(),"ОпределяемыйТип.ОпределяемыйТипВсеСвойства") else {{panic!("real defined type unavailable")}};
        assert_eq!(values.collect::<Vec<_>>(),vec!["Строка","Число"]);
    }}
}}
"#
    );
    run_generated(generated, "real-defined-type-facts", &main);
}

#[test]
fn named_union_contribution_expands_real_nested_rows_from_both_directions() {
    let row = NESTED_ROW
        .replace("test.nested-fact-row", "test.union-row")
        .replace(", {name: title, type: {kind: scalar, scalar: text}}", "")
        .replace(", {field: title, path: [Title]}", "")
        .replace(", {field: title, key: Title}", "");
    let rows = NESTED_ROWS
        .replace("common.project-rows", "test.union-rows")
        .replace("test.nested-fact-row", "test.union-row");
    let nested = NESTED_RECORD
        .replace("test.nested-fact-rows", "test.union-nested")
        .replace("common.project-rows", "test.union-rows");
    let owner = NESTED_OWNER
        .replace("test.nested-fact-owner", "test.union-owner")
        .replace("test.nested-fact-rows", "test.union-nested")
        .replace("test.nested-names", "test.union-types")
        .replace("key: {field: name}", "key: {concat: [{literal: 'ОпределяемыйТип.'}, {field: name}]}")
        .replace("  value: {get: {of: {var: item}, field: code}}", "  value: {get: {of: {var: item}, field: code}}\n  union: {referencePrefix: 'ОпределяемыйТип.'}");
    let consumer = r#"format: nkdk-declarations/1
kind: object
id: test.union-consumer
inputs: {types: {index: test.union-types}}
value: {kind: record, fields: [{name: name, type: {kind: scalar, scalar: text}}, {name: value, type: {kind: scalar, scalar: text}}]}
representations:
  xml: {kind: record, fields: [{field: name, path: [Root, Name]}, {field: value, path: [Root, Value]}]}
  yaml: {kind: mapping, fields: [{field: name, key: Name}, {field: value, key: Value}]}
constraints:
- id: allowed-type
  appliesTo: [xml-import, yaml-validation]
  assert:
    match:
      value: {lookup: {in: {input: types}, key: {concat: [{literal: 'ОпределяемыйТип.'}, {field: name}]}}}
      present: {as: alternatives, then: {exists: {in: {var: alternatives}, as: item, where: {eq: [{var: item}, {field: value}]}}}}
      absent: {literal: true}
  diagnostic: {code: type.mismatch, severity: warning, at: {field: value}, message: Value is not an effective type}
"#;
    let sources = nested_sources(&row, &rows, &nested, &owner, Some(consumer));
    let check_invalid = |candidate: &str, expected: &str| {
        let modules = [
            row.as_str(),
            rows.as_str(),
            nested.as_str(),
            candidate,
            consumer,
        ]
        .into_iter()
        .map(|source| {
            parse(SourceFile {
                path: "union.yaml",
                bytes: source.as_bytes(),
            })
            .unwrap()
        })
        .collect::<Vec<_>>();
        let issues = link(&modules).unwrap_err();
        assert!(
            issues.iter().any(|issue| issue.code == expected),
            "{issues:?}"
        );
    };
    check_invalid(
        &owner.replace(
            "  forEach: {in: {get: {of: {field: type}, field: items}}, as: item}\n",
            "",
        ),
        "unknown_variable",
    );
    check_invalid(
        &owner.replace(
            "key: {concat: [{literal: 'ОпределяемыйТип.'}, {field: name}]}",
            "key: {var: item}",
        ),
        "union_contribution_type",
    );
    check_invalid(
        &owner.replace(
            "key: {concat: [{literal: 'ОпределяемыйТип.'}, {field: name}]}",
            "key: {literal: true}",
        ),
        "contribution_type",
    );
    let generated = compile(&sources).expect("typed union declaration must compile");
    let main = r#"fn main() {
    let entry=entry_id("test.union-owner").unwrap();
    for (direction, sources) in [
        (Direction::XmlToYaml, ["<Root><Name>A</Name><Type><Items><Item><Code>Строка</Code></Item><Item><Code>ОпределяемыйТип.Б</Code></Item></Items></Type></Root>","<Root><Name>Б</Name><Type><Items><Item><Code>Число</Code></Item></Items></Type></Root>"]),
        (Direction::YamlToXml, ["Name: A\nType:\n  Items:\n    - Code: Строка\n    - Code: ОпределяемыйТип.Б","Name: Б\nType:\n  Items:\n    - Code: Число"]),
    ] {
        let generation=core::facts::Generation(1);
        let facts=std::sync::Arc::new(prepared_pair(entry,direction,sources));
        let core::facts::FactState::Ready(values)=facts.lookup_union(generation,fact_id("test.union-types").unwrap(),"ОпределяемыйТип.A") else {panic!("effective alternatives unavailable")};
        assert_eq!(values.collect::<Vec<_>>(),vec!["Строка","Число"]);
        let consumer=entry_id("test.union-consumer").unwrap();
        let inputs=prepare_fact_inputs(consumer,facts,generation,vec![]).unwrap();
        assert!(validate_file(consumer,"Name: A\nValue: Число".as_bytes(),&inputs).is_empty());
        assert!(validate_file(consumer,"Name: A\nValue: Булево".as_bytes(),&inputs).iter().any(|issue|issue.code.as_deref()==Some("type.mismatch")));
        let unresolved=validate_file(consumer,"Name: Нет\nValue: Булево".as_bytes(),&inputs);
        assert!(unresolved.iter().any(|issue|issue.code.as_deref()==Some("fact.missing")&&issue.severity==core::Severity::Warning));
        assert!(!unresolved.iter().any(|issue|issue.code.as_deref()==Some("type.mismatch")));
    }
}
"#;
    run_generated(
        generated,
        "named-union-contract",
        &format!("{UNION_PREPARE_MAIN}{main}"),
    );
}

#[test]
fn contributions_bind_declared_fields_and_reject_untyped_or_hidden_context() {
    let parse_one = |source: &str| {
        parse(SourceFile {
            path: "owner.yaml",
            bytes: source.as_bytes(),
        })
        .unwrap()
    };
    let module = parse_one(OWNER);
    link(&[module, parse_one(CODE)]).unwrap();
    compile(&[
        SourceFile {
            path: "code.yaml",
            bytes: CODE.as_bytes(),
        },
        SourceFile {
            path: "owner.yaml",
            bytes: OWNER.as_bytes(),
        },
    ])
    .unwrap();
    for source in [
        OWNER.replace("{field: code}", "{field: missing}"),
        OWNER.replace("{field: code}", "{literal: true}"),
    ] {
        assert!(link(&[parse_one(&source), parse_one(CODE)]).is_err());
    }
    let consumer = include_str!("fixtures/fact-consumer.yaml");
    let inferred = consumer.replace(
        "    type:\n      kind: index\n      key: {kind: scalar, scalar: text}\n      value: {kind: scalar, scalar: text}\n", "",
    );
    let dependent = inferred.replace("id: test.fact-consumer", "id: test.dependent")
        + "\ncontributions:\n- index: test.dependent-names\n  key: {field: target}\n  value:\n    match:\n      value: {lookup: {in: {input: names}, key: {field: target}}}\n      present: {as: found, then: {var: found}}\n      absent: {literal: ''}\n";
    let final_consumer = inferred.replace("test.names", "test.dependent-names");
    let mut chain = vec![
        parse_one(&final_consumer),
        parse_one(&dependent),
        parse_one(OWNER),
        parse_one(CODE),
    ];
    let linked = link(&chain).unwrap();
    chain.reverse();
    assert_eq!(linked, link(&chain).unwrap());
    let cyclic = dependent.replace("index: test.names", "index: test.dependent-names");
    assert!(link(&[parse_one(&cyclic)]).is_err());
    let enum_kind = include_str!("fixtures/text-pattern-kind.yaml");
    let enum_key = consumer
        .replace(
            "id: test.fact-consumer",
            "id: test.fact-consumer\nimports: {kind: common.pattern-kind}",
        )
        .replace("    index: test.names\n", "")
        .replace(
            "key: {kind: scalar, scalar: text}",
            "key: {kind: record, fields: [{name: kind, type: {use: kind}}]}",
        )
        .replace(
            "key: {field: target}",
            "key: {record: {kind: {literal: west}}}",
        );
    link(&[parse_one(enum_kind), parse_one(&enum_key)]).unwrap();
    for (replacement, code) in [
        ("{literal: missing}", "unknown_enum_literal"),
        ("{field: target}", "expression_type_mismatch"),
        ("{literal: true}", "expression_type_mismatch"),
    ] {
        let errors = link(&[
            parse_one(enum_kind),
            parse_one(&enum_key.replace("{literal: west}", replacement)),
        ])
        .unwrap_err();
        assert!(errors.iter().any(|error| error.code == code), "{errors:?}");
    }
    for invalid in [
        consumer.replace("index: test.names", "index: test.missing"),
        consumer.replace("key: {field: target}", "key: {literal: true}"),
        consumer.replace("in: {input: names}", "in: {field: target}"),
    ] {
        assert!(link(&[parse_one(OWNER), parse_one(CODE), parse_one(&invalid)]).is_err());
    }
    let rows = include_str!("fixtures/fact-rows.yaml");
    let row_owner = include_str!("fixtures/fact-rows-owner.yaml");
    let member = include_str!("fixtures/fact-member-consumer.yaml");
    for invalid in [
        member.replace("index: test.member-names", "index: test.missing"),
        member.replace(
            "owner: {literal: a.b}, kind: {literal: element}",
            "owner: {literal: a.b}",
        ),
        member.replace("owner: {literal: a.b}", "owner: {literal: true}"),
    ] {
        assert!(link(&[parse_one(rows), parse_one(row_owner), parse_one(&invalid)]).is_err());
    }
    let conflicting = row_owner
        .replace("id: test.fact-rows", "id: test.other-rows")
        .replace("      owner: {literal: a.b}\n", "");
    let errors = link(&[
        parse_one(rows),
        parse_one(row_owner),
        parse_one(&conflicting),
        parse_one(member),
    ])
    .unwrap_err();
    assert!(
        errors
            .iter()
            .any(|error| error.code == "index_shape_mismatch")
    );
    let opaque_comparison = consumer.split("  assert:").next().unwrap().to_owned()
        + "  assert: {eq: [{input: names}, {input: names}]}\n  diagnostic: {severity: error, at: {field: target}, message: Invalid}\n";
    let errors = link(&[
        parse_one(OWNER),
        parse_one(CODE),
        parse_one(&opaque_comparison),
    ])
    .unwrap_err();
    assert!(
        errors
            .iter()
            .any(|error| error.code == "opaque_index_comparison")
    );
    assert!(
        parse(SourceFile {
            path: "owner.yaml",
            bytes: OWNER
                .replace(
                    "index: test.names",
                    "index: test.names\n  handler: resolveNames"
                )
                .as_bytes()
        })
        .is_err()
    );
}
