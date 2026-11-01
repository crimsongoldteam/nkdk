mod support;
use nkdk_rule_compiler::{SourceFile, generate, link, parse};

#[test]
fn document_routes_own_roots_and_empty_sequences_get_comparison_context() {
    let source = r#"format: nkdk-declarations/1
kind: object
id: owner
value: {kind: record, fields: [{name: name, type: {kind: scalar, scalar: text}}, {name: extra, type: {kind: scalar, scalar: text}}]}
representations:
  xml: {kind: record, fields: [{field: name, path: [Root, Name]}, {field: extra, path: [Extra], file: [Ext, Extra.xml]}]}
  yaml: {kind: mapping, fields: [{field: name, key: Name}, {field: extra, key: Extra}]}
"#;
    let module = parse(SourceFile {
        path: "owner.yaml",
        bytes: source.as_bytes(),
    })
    .unwrap();
    let program = link(&[module]).unwrap();
    generate(&program).unwrap();
    for route in ["[]", "[.., Extra.xml]", "[/tmp, Extra.xml]", "[Ext, 'a/b']"] {
        let text = source.replace("[Ext, Extra.xml]", route);
        assert!(
            parse(SourceFile {
                path: "owner.yaml",
                bytes: text.as_bytes()
            })
            .is_err()
        );
    }
    let text = source.replace("path: [Extra]", "path: [Extra, Value]");
    let module = parse(SourceFile {
        path: "owner.yaml",
        bytes: text.as_bytes(),
    })
    .unwrap();
    assert_eq!(
        link(&[module]).unwrap_err()[0].code,
        "invalid_file_boundary"
    );
    let common = include_str!("../../../declarations/common/help-pages.yaml");
    for comparison in [
        "{eq: [{self: true}, {sequence: []}]}",
        "{eq: [{sequence: []}, {self: true}]}",
    ] {
        let text = common.replace("{eq: [{self: true}, {sequence: []}]}", comparison);
        let module = parse(SourceFile {
            path: "common.yaml",
            bytes: text.as_bytes(),
        })
        .unwrap();
        link(&[module]).unwrap();
    }
    let text = common.replace(
        "{eq: [{self: true}, {sequence: []}]}",
        "{eq: [{literal: true}, {sequence: []}]}",
    );
    let module = parse(SourceFile {
        path: "common.yaml",
        bytes: text.as_bytes(),
    })
    .unwrap();
    assert_eq!(
        link(&[module]).unwrap_err()[0].code,
        "expression_type_mismatch"
    );
}

#[test]
fn yaml_text_files_bind_prepared_paths_without_becoming_mapping_keys() {
    let source = r#"format: nkdk-declarations/1
kind: object
id: owner
inputs: {parentName: {type: {kind: scalar, scalar: text}}}
value: {kind: record, fields: [{name: name, type: {kind: scalar, scalar: text}}, {name: extra, type: {kind: scalar, scalar: text}}]}
representations:
  xml: {kind: record, fields: [{field: name, path: [Root, Name]}, {field: extra, path: [Root, Extra]}]}
  yaml: {kind: mapping, fields: [{field: name, key: Name}, {field: extra, file: {sequence: [{literal: Тексты}, {concat: [{input: parentName}, {literal: '.txt'}]}]}}]}
"#;
    let parsed = parse(SourceFile {
        path: "files.yaml",
        bytes: source.as_bytes(),
    })
    .unwrap();
    let program = link(&[parsed]).unwrap();
    let entry = program
        .entries
        .iter()
        .find(|entry| entry.name == "owner")
        .unwrap();
    assert_eq!(entry.yaml_files.len(), 1);
    assert_eq!(entry.yaml_files[0].field, 1);

    let schema: serde_json::Value =
        serde_json::from_slice(&nkdk_rule_compiler::schema(&program, "owner").unwrap()).unwrap();
    assert!(schema["properties"].get("Name").is_some());
    assert!(schema["properties"].get("").is_none());
    assert!(schema["properties"].get("extra").is_none());
    for target in [
        "key: Extra, file: {sequence: [{literal: Тексты}]}",
        "file: {literal: Тексты}",
        "file: {sequence: [{field: name}]}",
    ] {
        let changed = source.replace("file: {sequence: [{literal: Тексты}, {concat: [{input: parentName}, {literal: '.txt'}]}]}", target);
        assert!(
            parse(SourceFile {
                path: "invalid.yaml",
                bytes: changed.as_bytes()
            })
            .and_then(|module| link(&[module]).map(|_| ()))
            .is_err()
        );
    }
    let fragment = source
        .replace("kind: object", "kind: fragment")
        .replace("id: owner", "id: files");
    let wrapper = r#"format: nkdk-declarations/1
kind: object
id: composed
imports: {files: files}
compose: [{use: files, bind: {parentName: {literal: Parent}}}]
value: {kind: record, fields: [{name: own, type: {kind: scalar, scalar: text}}]}
representations:
  xml: {kind: record, fields: [{field: own, path: [Root, Own]}]}
  yaml: {kind: mapping, fields: [{field: own, file: {sequence: [{literal: Own.txt}]}}]}
"#;
    let modules = [
        parse(SourceFile {
            path: "fragment.yaml",
            bytes: fragment.as_bytes(),
        })
        .unwrap(),
        parse(SourceFile {
            path: "wrapper.yaml",
            bytes: wrapper.as_bytes(),
        })
        .unwrap(),
    ];
    let composed = link(&modules).unwrap();
    let entry = composed
        .entries
        .iter()
        .find(|entry| entry.name == "composed")
        .unwrap();
    assert_eq!(
        entry
            .yaml_files
            .iter()
            .map(|file| file.field)
            .collect::<Vec<_>>(),
        [1, 2]
    );
    for scalar in ["boolean", "number, profile: decimal"] {
        let changed = source.replace(
            "name: extra, type: {kind: scalar, scalar: text}",
            &format!("name: extra, type: {{kind: scalar, scalar: {scalar}}}"),
        );
        let module = parse(SourceFile {
            path: "typed.yaml",
            bytes: changed.as_bytes(),
        })
        .unwrap();
        assert!(link(&[module]).is_err(), "Nontext file accepted: {scalar}");
    }
}

#[test]
fn external_text_round_trips_as_documents_with_readable_neighbours() {
    let declarations = [
        include_str!("../../../declarations/common/boolean.yaml"),
        include_str!("fixtures/yaml-text-files.yaml"),
    ]
    .iter()
    .map(|source| {
        let body = source
            .strip_prefix("format: nkdk-declarations/1\n")
            .unwrap();
        format!("- {}\n", body.lines().collect::<Vec<_>>().join("\n  "))
    })
    .collect::<String>();
    let source =
        format!("format: nkdk-declarations/1\nkind: catalog\ndeclarations:\n{declarations}");
    let program = r#"
include!("generated.rs");
fn main() {
    let entry=EntryId(OWNER);
    let inputs = prepare_inputs(entry, vec![("parentName".into(), InputValue::Text("Родитель".into()))]).unwrap();
    let paths=yaml_file_requests(entry,&inputs,nkdk_conversion_core::resources::Limits{groups:8,routes:8,path_bytes:4096}).unwrap();
    assert_eq!(paths[0].segments(), &["Тексты","Родитель.txt"]);
    let bad=prepare_inputs(entry,vec![("parentName".into(),InputValue::Text("Родитель".into()))]).unwrap().with_documents(vec![(paths[0].clone(),vec![255])]).unwrap();
    let errors=convert_file(entry,Direction::YamlToXml,b"",&bad).unwrap_err();
    assert!(errors.iter().any(|error|error.code.as_deref()==Some("resource.encoding")));
    for (element, text) in [("<Payload>Первый\nA &amp; B</Payload>", Some("Первый\nA & B")), ("<Payload/>", Some("")), ("", None)] {
        let xml = format!("<Root>{element}<Flag>true</Flag><Title>Сосед</Title></Root>");
        let result = convert_file(entry, Direction::XmlToYaml, xml.as_bytes(), &inputs).unwrap();
        assert_eq!(std::str::from_utf8(&result.bytes).unwrap().trim(), "Флаг: Истина\nИмя: Сосед");
        assert!(result.diagnostics.is_empty());
        assert_eq!(result.documents.len(), usize::from(text.is_some()));
        if let Some(text) = text {
            assert_eq!(result.documents[0].0.segments(), &["Тексты", "Родитель.txt"]);
            assert_eq!(std::str::from_utf8(&result.documents[0].1).unwrap(), text);
        }
        let fresh = prepare_inputs(entry, vec![("parentName".into(), InputValue::Text("Родитель".into()))]).unwrap().with_documents(result.documents).unwrap();
        let restored = convert_file(entry, Direction::YamlToXml, &result.bytes, &fresh).unwrap();
        nkdk_conversion_core::proof::verify(xml.as_bytes(), &restored.bytes, |_| false).unwrap();
        assert!(validate_file(entry, &result.bytes, &fresh).is_empty());
        if text.is_some() {
            let edited=prepare_inputs(entry,vec![("parentName".into(),InputValue::Text("Родитель".into()))]).unwrap().with_documents(vec![(nkdk_conversion_core::resources::RelativePath::new(["Тексты","Родитель.txt"],4096).unwrap(),"Изменено".as_bytes().to_vec())]).unwrap();
            let edited_xml=convert_file(entry,Direction::YamlToXml,&result.bytes,&edited).unwrap();
            assert!(std::str::from_utf8(&edited_xml.bytes).unwrap().contains("<Payload>Изменено</Payload>"));
        }

    }
    for element in ["<Payload extra=\"keep\">Текст</Payload>", "<Payload>Первый</Payload><Payload>Второй</Payload>"] {
        let xml=format!("<Root>{element}<Flag>true</Flag><Title>Сосед</Title></Root>");
        let result=convert_file(entry,Direction::XmlToYaml,xml.as_bytes(),&inputs).unwrap();
        let yaml=std::str::from_utf8(&result.bytes).unwrap();
        assert!(yaml.contains("!xml/raw"), "{yaml}");
        assert!(yaml.contains("Флаг: Истина") && yaml.contains("Имя: Сосед"), "{yaml}");
        let fresh=prepare_inputs(entry,vec![("parentName".into(),InputValue::Text("Родитель".into()))]).unwrap().with_documents(result.documents.clone()).unwrap();
        let restored=convert_file(entry,Direction::YamlToXml,&result.bytes,&fresh).unwrap();
        nkdk_conversion_core::proof::verify(xml.as_bytes(),&restored.bytes,|_|false).unwrap();
        if element.contains("extra") {
            let mut documents=result.documents;
            documents[0].1="Изменено".as_bytes().to_vec();
            let fresh=fresh.with_documents(documents).unwrap();
            let edited=convert_file(entry,Direction::YamlToXml,&result.bytes,&fresh).unwrap();
            let expected=xml.replace("Текст","Изменено");
            nkdk_conversion_core::proof::verify(expected.as_bytes(),&edited.bytes,|_|false).unwrap();
        }

    }
}
"#;
    let mut renamed_source = source.clone();
    let mut renamed_program = program.to_owned();
    for (old, new) in [
        ("payload", "content"),
        ("Payload", "Content"),
        ("Root", "Envelope"),
        ("parentName", "container"),
        ("Тексты", "Запросы"),
        (".txt", ".query"),
    ] {
        renamed_source = renamed_source.replace(old, new);
        renamed_program = renamed_program.replace(old, new);
    }
    let two_files_source = source.replace(
        "{field: title, key: Имя}",
        "{field: title, file: {sequence: [{literal: Header.txt}]}}",
    );
    let two_files_program=program.replace("Флаг: Истина\\nИмя: Сосед","Флаг: Истина")
        .replace("usize::from(text.is_some())", "usize::from(text.is_some())+1")
        .replace("let edited_xml=convert_file", "let edited=edited.with_documents(vec![(nkdk_conversion_core::resources::RelativePath::new([\"Тексты\",\"Родитель.txt\"],4096).unwrap(),\"Изменено\".as_bytes().to_vec()),(nkdk_conversion_core::resources::RelativePath::new([\"Header.txt\"],4096).unwrap(),\"Сосед\".as_bytes().to_vec())]).unwrap();let edited_xml=convert_file")
        .replace(" && yaml.contains(\"Имя: Сосед\")", "")
        .replace("assert!(result.diagnostics.is_empty());", "assert!(result.diagnostics.is_empty());assert_eq!(std::str::from_utf8(&result.documents.last().unwrap().1).unwrap(),\"Сосед\");");
    let details = r#"- kind: value
  id: common.details
  value: {kind: record, fields: [{name: note, type: {kind: scalar, scalar: text}}]}
  representations:
    xml: {kind: record, fields: [{field: note, path: [Note]}]}
    yaml: {kind: mapping, fields: [{field: note, key: Примечание}]}
"#;
    let nested_source = source
        .replace("declarations:\n", &format!("declarations:\n{details}"))
        .replace(
            "imports: {boolean: common.boolean}",
            "imports: {boolean: common.boolean, details: common.details}",
        )
        .replace(
            "{name: title, type: {kind: scalar, scalar: text}}",
            "{name: title, type: {use: details}}",
        );
    let nested_program = program
        .replace("<Title>Сосед</Title>", "<Title><Note>Сосед</Note></Title>")
        .replace("Имя: Сосед", "Имя:\\n  Примечание: Сосед")
        .replace(
            "yaml.contains(\"Имя:\\n  Примечание: Сосед\")",
            "yaml.contains(\"Примечание: Сосед\")",
        );
    for (label, source, program) in [
        ("plain", source, program.to_owned()),
        ("renamed", renamed_source, renamed_program),
        ("two-files", two_files_source, two_files_program),
        ("nested", nested_source, nested_program),
    ] {
        let (generated, owner) = support::compile_catalog("files.yaml", &source, "owner");
        support::run_generated(
            &format!("external-text-{label}"),
            generated,
            owner,
            &program,
        );
        support::shared_catalog::run_source_program(
            &format!("shared-external-text-{label}"),
            "files.yaml",
            &source,
            "owner",
            &program,
        );
    }
}

#[test]
fn nested_records_forward_external_text_documents() {
    let library = include_str!("fixtures/yaml-text-files.yaml")
        .replace(
            "kind: object\nid: owner",
            "kind: value\nid: common.text-record",
        )
        .replace("[Root, ", "[");
    let owner = r#"format: nkdk-declarations/1
kind: object
id: nested.text-owner
imports: {body: common.text-record}
inputs: {parentName: {type: {kind: scalar, scalar: text}}}
value: {kind: record, fields: [{name: body, type: {use: body, bind: {parentName: {input: parentName}}}}]}
representations:
  xml: {kind: record, fields: [{field: body, path: [Root, Body]}]}
  yaml: {kind: mapping, fields: [{field: body, key: Тело}]}
"#;
    let sources = [
        include_str!("../../../declarations/common/boolean.yaml"),
        &library,
        owner,
    ];
    let modules = sources
        .iter()
        .map(|source| {
            parse(SourceFile {
                path: "nested-text.yaml",
                bytes: source.as_bytes(),
            })
            .unwrap()
        })
        .collect::<Vec<_>>();
    let program = link(&modules).unwrap();
    let id = program
        .entries
        .iter()
        .find(|entry| entry.name == "nested.text-owner")
        .unwrap()
        .id;
    let generated = generate(&program).unwrap();
    assert!(
        generated
            .files
            .iter()
            .any(
                |file| String::from_utf8_lossy(&file.contents).contains(&format!(
                    "let documents=write_yaml_documents_{id}(&value,_inputs)"
                ))
            ),
        "Outer conversion must publish nested text documents before its round-trip proof"
    );
    let main = r#"
include!("generated.rs");
fn main() {
 let entry=EntryId(OWNER);
 for (element,text) in [("<Payload>A &amp; B\nsecond</Payload>",Some("A & B\nsecond")),("<Payload/>",Some("")),("",None)] {
  let inputs=prepare_inputs(entry,vec![("parentName".into(),InputValue::Text("Parent".into()))]).unwrap();
  let paths=yaml_file_requests(entry,&inputs,nkdk_conversion_core::resources::Limits{groups:8,routes:8,path_bytes:4096}).unwrap();
  assert_eq!(paths.len(),1);
  assert_eq!(paths[0].segments(), &["Тексты","Parent.txt"]);
  let xml=format!("<Root><Body>{element}<Flag>true</Flag><Title>Neighbour</Title></Body></Root>");
  let result=convert_file(entry,Direction::XmlToYaml,xml.as_bytes(),&inputs).unwrap();
  assert_eq!(result.documents.len(),usize::from(text.is_some()));
  if let Some(text)=text {assert_eq!(result.documents[0].1,text.as_bytes());}
  assert_eq!(std::str::from_utf8(&result.bytes).unwrap().trim(),"Тело:\n  Флаг: Истина\n  Имя: Neighbour");
  let inputs=inputs.with_documents(result.documents).unwrap();
  let restored=convert_file(entry,Direction::YamlToXml,&result.bytes,&inputs).unwrap();
  nkdk_conversion_core::proof::verify(xml.as_bytes(),&restored.bytes, |_|false).unwrap();
 }
}
"#;
    support::run_generated("nested-external-text-documents", generated, id, main);
    let declarations = sources
        .iter()
        .map(|source| {
            format!(
                "- {}\n",
                source
                    .strip_prefix("format: nkdk-declarations/1\n")
                    .unwrap()
                    .lines()
                    .collect::<Vec<_>>()
                    .join("\n  ")
            )
        })
        .collect::<String>();
    let catalog =
        format!("format: nkdk-declarations/1\nkind: catalog\ndeclarations:\n{declarations}");
    support::shared_catalog::run_source_program(
        "shared-nested-external-text-documents",
        "nested-text.yaml",
        &catalog,
        "nested.text-owner",
        main,
    );
}
