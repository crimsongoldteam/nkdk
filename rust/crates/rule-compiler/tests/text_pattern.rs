use nkdk_rule_compiler::{SourceFile, link, parse, schema};

#[test]
fn exact_style_words_are_disjoint_from_the_declared_open_variant() {
    let source = include_str!("../../../declarations/probes/disjoint-style-choice.yaml");
    let modules = nkdk_rule_compiler::parse_many(SourceFile {
        path: "style.yaml",
        bytes: source.as_bytes(),
    })
    .unwrap();
    let program = link(&modules).unwrap();
    nkdk_rule_compiler::generate(&program)
        .expect("finite style names are subtracted from the open variant");
    let reversed = source.replace(
        "    - {name: СтандартныйЦветСтиля, type: {use: standard}}\n    - {name: ЭлементСтиля, type: {use: custom}}",
        "    - {name: ЭлементСтиля, type: {use: custom}}\n    - {name: СтандартныйЦветСтиля, type: {use: standard}}",
    );
    let modules = nkdk_rule_compiler::parse_many(SourceFile {
        path: "style.yaml",
        bytes: reversed.as_bytes(),
    })
    .unwrap();
    nkdk_rule_compiler::generate(&link(&modules).unwrap())
        .expect("declaration order must not change the selection");
}

#[test]
fn text_patterns_cover_typed_fields_without_ambiguous_capture() {
    let source = include_str!("fixtures/text-pattern.yaml");
    let read = |source: &str| {
        parse(SourceFile {
            path: "pattern.yaml",
            bytes: source.as_bytes(),
        })
    };
    link(&[read(source).unwrap()]).unwrap();
    let nested = include_str!("fixtures/text-nested-pattern.yaml");
    let nested_owner = include_str!("fixtures/text-nested-pattern-owner.yaml");
    let decimal = include_str!("fixtures/text-pattern-decimal.yaml");
    let constrained = format!(
        "{decimal}\nconstraints:\n- id: nested-check\n  appliesTo: [xml-import, yaml-validation]\n  assert: {{literal: false}}\n  diagnostic: {{code: nested.check, severity: error, at: {{self: true}}, message: Nested check}}\n"
    );
    let program = link(&[
        read(nested).unwrap(),
        read(nested_owner).unwrap(),
        read(&constrained).unwrap(),
    ])
    .unwrap();
    let errors = nkdk_rule_compiler::generate(&program).unwrap_err();
    assert!(
        errors
            .iter()
            .any(|error| error.message.contains("Nested text checks"))
    );

    let conditional_source = format!(
        "{}\npresence:\n- target: {{field: index}}\n  yaml:\n    missing: {{denotes: {{literal: 0}}}}\n    omitWhen: {{eq: [{{field: index}}, {{literal: 0}}]}}\n",
        include_str!("fixtures/record-text.yaml")
    );
    let conditional_record = link(&[read(&conditional_source).unwrap()]).unwrap();
    assert!(
        nkdk_rule_compiler::generate(&conditional_record)
            .unwrap_err()
            .iter()
            .any(|error| error.message.contains("explicit optional group"))
    );

    let optional = conditional_source.replace(
        "{literal: '('}, {field: index}, {literal: ')'}",
        "{optional: index, parts: [{literal: '('}, {field: index}, {literal: ')'}]}",
    );
    nkdk_rule_compiler::generate(&link(&[read(&optional).unwrap()]).unwrap()).unwrap();
    for (source, message) in [
        (
            optional.replace("    omitWhen: {eq: [{field: index}, {literal: 0}]}\n", ""),
            "controlling field",
        ),
        (
            optional.replace("    missing: {denotes: {literal: 0}}\n", ""),
            "missing value",
        ),
    ] {
        assert!(
            nkdk_rule_compiler::generate(&link(&[read(&source).unwrap()]).unwrap())
                .unwrap_err()
                .iter()
                .any(|error| error.message.contains(message))
        );
    }
    assert!(
        link(&[read(&optional.replace("optional: index", "optional: unknown")).unwrap()]).is_err()
    );

    let sequence = include_str!("fixtures/text-sequence.yaml");
    read(sequence).unwrap();
    let row = source
        .replace("{literal: '['}, ", "")
        .replace("{literal: '] '}", "{literal: '/'}");
    link(&[read(sequence).unwrap(), read(&row).unwrap()]).unwrap();
    let owner = include_str!("fixtures/text-pattern-owner.yaml")
        .replace("common.text-pair", "common.text-sequence");
    let staged = link(&[
        read(sequence).unwrap(),
        read(&row).unwrap(),
        read(&owner).unwrap(),
    ])
    .unwrap();
    nkdk_rule_compiler::generate(&staged).unwrap();
    let framed = row
        .replace(
            "id: common.text-pair",
            "id: common.text-frame\nimports: {tail: common.text-sequence}",
        )
        .replace(
            "representations:",
            "  - {name: tail, type: {use: tail}}\nrepresentations:",
        )
        .replace(
            "{field: name}]}",
            "{field: name}, {literal: '::'}, {field: tail}]}",
        )
        .replace(
            "{field: domain}]}",
            "{field: domain}, {literal: '/'}, {field: tail}]}",
        );
    let frame_owner = owner.replace("common.text-sequence", "common.text-frame");
    let frame_program = link(&[
        read(&framed).unwrap(),
        read(sequence).unwrap(),
        read(&row).unwrap(),
        read(&frame_owner).unwrap(),
    ])
    .unwrap();
    nkdk_rule_compiler::generate(&frame_program).unwrap();
    let shape: serde_json::Value =
        serde_json::from_slice(&schema(&frame_program, "test.text-pattern").unwrap()).unwrap();
    assert_eq!(shape["properties"]["Pair"]["type"], "string");
    let whole_tail = format!(
        "{framed}\nconstraints:\n- id: tail-check\n  appliesTo: [xml-import, yaml-validation]\n  forms: [text, scalar]\n  assert: {{each: {{in: {{get: {{of: {{self: true}}, field: tail}}}}, as: row, where: {{literal: true}}}}}}\n  diagnostic: {{code: tail.check, severity: error, at: {{self: true}}, message: Tail check}}\n"
    );
    let unsupported = link(&[
        read(&whole_tail).unwrap(),
        read(sequence).unwrap(),
        read(&row).unwrap(),
        read(&frame_owner).unwrap(),
    ])
    .unwrap();
    assert!(nkdk_rule_compiler::generate(&unsupported).is_err());
    for invalid in [
        framed.replace(
            "{literal: '::'}, {field: tail}",
            "{literal: ':'}, {field: tail}",
        ),
        framed.replace(
            "{field: name}, {literal: '::'}, {field: tail}",
            "{field: tail}, {literal: '::'}, {field: name}",
        ),
        framed.replace(
            "{literal: '/'}, {field: tail}",
            "{literal: '!'}, {field: tail}",
        ),
    ] {
        assert!(
            link(&[
                read(&invalid).unwrap(),
                read(sequence).unwrap(),
                read(&row).unwrap()
            ])
            .is_err()
        );
    }
    for invalid in [
        row.replace("{literal: '/'}", "{literal: ':'}"),
        row.replace(
            "{field: name}, {literal: '/'}",
            "{literal: '/'}, {field: name}",
        ),
        source.to_string(),
    ] {
        assert!(link(&[read(sequence).unwrap(), read(&invalid).unwrap()]).is_err());
    }
    for separator in ["''", "true", "123"] {
        assert!(read(&sequence.replace("'::'", separator)).is_err());
    }
    let program = link(&[
        read(source).unwrap(),
        read(include_str!("fixtures/text-pattern-owner.yaml")).unwrap(),
    ])
    .unwrap();
    let shape: serde_json::Value =
        serde_json::from_slice(&schema(&program, "test.text-pattern").unwrap()).unwrap();
    assert_eq!(shape["properties"]["Pair"]["type"], "string");
    assert_eq!(
        shape["properties"]["Pair"]["x-nkdk-runtime-validation"],
        true
    );
    // Literal concatenation is normalization, not an extra field or an ambiguity.
    link(&[read(&source.replace("{literal: '::'}", "{literal: ':'}, {literal: ':'}")).unwrap()])
        .unwrap();
    for invalid in [
        source.replace("{field: domain}", "{field: missing}"),
        source.replace("{field: name}", "{field: domain}"),
        source.replace("{literal: '::'}, ", ""),
        source.replace("{literal: '::'}", "{literal: ''}"),
        source.replace(
            "{kind: scalar, scalar: text}",
            "{kind: sequence, item: {kind: scalar, scalar: text}}",
        ),
        source.replace(", {field: name}]}", "]}"),
    ] {
        assert!(link(&[read(&invalid).unwrap()]).is_err(), "{invalid}");
    }
    let referenced = source
        .replace(
            "id: common.text-pair",
            "id: common.text-pair\nimports: {rows: common.project-rows}",
        )
        .replace("{kind: scalar, scalar: text}", "{use: rows}");
    let errors = link(&[
        read(&referenced).unwrap(),
        read(include_str!("fixtures/fact-rows.yaml")).unwrap(),
    ])
    .unwrap_err();
    assert!(errors.iter().any(|error| error.code == "text_pattern_type"));
    for replacement in [
        "{literal: '::', field: name}",
        "{literal: true}",
        "{literal: 123}",
    ] {
        assert!(read(&source.replace("{literal: '::'}", replacement)).is_err());
    }
    let table = include_str!("fixtures/text-pattern-name.yaml");
    let vocabulary = read(include_str!("fixtures/text-pattern-kind.yaml")).unwrap();
    let code = read(include_str!("fixtures/fact-code.yaml")).unwrap();
    link(&[read(table).unwrap(), vocabulary.clone(), code.clone()]).unwrap();
    let invalid_projection = table.replace("use: code", "use: words");
    let errors = link(&[
        read(&invalid_projection).unwrap(),
        vocabulary.clone(),
        code.clone(),
    ])
    .unwrap_err();
    assert!(
        errors
            .iter()
            .any(|error| error.code == "text_projection_source")
    );
    let recursive_projection = table.replace("common.project-code", "common.pattern-name");
    assert!(link(&[read(&recursive_projection).unwrap(), vocabulary.clone()]).is_err());
    for invalid in [
        table.replace("use: words", "use: missing"),
        table.replace("common.pattern-kind", "common.pattern-name"),
    ] {
        assert!(link(&[read(&invalid).unwrap(), vocabulary.clone(), code.clone()]).is_err());
    }
    let wrong = include_str!("fixtures/text-pattern.yaml")
        .replace("common.text-pair", "common.pattern-kind");
    assert!(link(&[read(table).unwrap(), read(&wrong).unwrap(), code.clone()]).is_err());
}

#[test]
fn discriminated_choice_generates_from_reused_text_variants() {
    let sources = [
        (
            "pattern.yaml",
            r#"format: nkdk-declarations/1
kind: value
id: test.tagged-pattern
value: {kind: record, fields: [{name: value, type: {kind: scalar, scalar: text}}]}
representations:
  xml: {kind: text-pattern, parts: [{literal: 'Ref.'}, {field: value}]}
  yaml: {kind: text-pattern, parts: [{literal: 'Ссылка.'}, {field: value}]}
"#,
        ),
        (
            "text.yaml",
            r#"format: nkdk-declarations/1
kind: value
id: test.tagged-text
value: {kind: scalar, scalar: text}
representations: {xml: {kind: text}, yaml: {kind: scalar, scalar: text}}
"#,
        ),
        (
            "object.yaml",
            r#"format: nkdk-declarations/1
kind: value
id: test.tagged-object
value: {kind: record, fields: [{name: value, type: {kind: scalar, scalar: text}}]}
representations:
  xml: {kind: text-pattern, parts: [{literal: 'Obj.'}, {field: value}]}
  yaml: {kind: text-pattern, parts: [{literal: 'Объект.'}, {field: value}]}
"#,
        ),
        (
            "nested.yaml",
            r#"format: nkdk-declarations/1
kind: value
id: test.tagged-nested
imports: {reference: test.tagged-pattern, object: test.tagged-object}
value: {kind: choice, variants: [{name: reference, type: {use: reference}}, {name: object, type: {use: object}}]}
representations: {xml: {kind: choice}, yaml: {kind: choice}}
"#,
        ),
        (
            "choice.yaml",
            r#"format: nkdk-declarations/1
kind: value
id: test.tagged-choice
namespaces: {xsi: 'http://www.w3.org/2001/XMLSchema-instance', xs: 'http://www.w3.org/2001/XMLSchema', xr: 'http://v8.1c.ru/8.3/xcf/readable'}
imports: {structured: test.tagged-nested, text: test.tagged-text}
value: {kind: choice, variants: [{name: structured, type: {use: structured}}, {name: text, type: {use: text}}]}
representations:
  xml:
    kind: choice
    attribute: xsi:type
    variants:
    - {variant: structured, in: [xr:DesignTimeRef], emit: xr:DesignTimeRef}
    - {variant: text, in: [xs:string], emit: xs:string}
    otherwise: text
  yaml: {kind: choice}
"#,
        ),
        (
            "owner.yaml",
            r#"format: nkdk-declarations/1
kind: object
id: test.tagged-owner
imports: {value: test.tagged-choice}
value: {kind: record, fields: [{name: value, type: {use: value}}]}
representations:
  xml: {kind: record, fields: [{field: value, path: [Root, Value]}]}
  yaml: {kind: mapping, fields: [{field: value, key: Значение}]}
"#,
        ),
    ];
    let modules = sources.map(|(path, source)| {
        nkdk_rule_compiler::parse(nkdk_rule_compiler::SourceFile {
            path,
            bytes: source.as_bytes(),
        })
        .unwrap()
    });
    let program = nkdk_rule_compiler::link(&modules).unwrap();
    nkdk_rule_compiler::generate(&program).unwrap();
}

#[test]
fn choice_resolves_named_variants_and_rejects_missing_or_recursive_types() {
    let read = |source: &str| {
        parse(SourceFile {
            path: "choice.yaml",
            bytes: source.as_bytes(),
        })
    };
    let choice = include_str!("fixtures/text-choice.yaml");
    let first = read(include_str!("fixtures/text-choice-first.yaml")).unwrap();
    let second = read(include_str!("fixtures/text-choice-second.yaml")).unwrap();
    let owner = read(include_str!("fixtures/text-choice-owner.yaml")).unwrap();
    let program = link(&[
        read(choice).unwrap(),
        first.clone(),
        second.clone(),
        owner.clone(),
    ])
    .unwrap();
    nkdk_rule_compiler::generate(&program).unwrap();
    let open = choice.replace("common.choice-second", "common.unstructured-text");
    let text = read("format: nkdk-declarations/1\nkind: value\nid: common.unstructured-text\nvalue: {kind: scalar, scalar: text}\nrepresentations: {xml: {kind: text}, yaml: {kind: scalar, scalar: text}}\n").unwrap();
    let open_program = link(&[
        read(&open).unwrap(),
        first.clone(),
        text.clone(),
        owner.clone(),
    ])
    .unwrap();
    nkdk_rule_compiler::generate(&open_program).unwrap();
    let duplicate = open.replace("common.choice-first", "common.unstructured-text");
    let duplicate_program = link(&[read(&duplicate).unwrap(), text, owner.clone()]).unwrap();
    assert!(
        nkdk_rule_compiler::generate(&duplicate_program)
            .unwrap_err()
            .iter()
            .any(|issue| issue.message.contains("one unstructured text"))
    );
    for (from, to) in [("b:", "a:"), ("Второе: ", "Первое: ")] {
        let overlap =
            read(&include_str!("fixtures/text-choice-second.yaml").replace(from, to)).unwrap();
        let program =
            link(&[read(choice).unwrap(), first.clone(), overlap, owner.clone()]).unwrap();
        let issues = nkdk_rule_compiler::generate(&program).unwrap_err();
        assert!(issues.iter().any(|issue| issue.code == "choice_overlap"
            && issue.related.len() == 2
            && issue.message.contains("first")
            && issue.message.contains("second")));
    }
    assert!(program.entries.iter().any(|entry| matches!(&entry.value, nkdk_rule_model::LinkedType::Choice(variants) if variants.len() == 2)));
    for invalid in [
        choice.replace("name: second", "name: first"),
        choice.replace("use: second", "use: absent"),
        choice.replace("common.choice-first", "common.text-choice"),
        choice.replace("{use: first}", "{kind: scalar, scalar: text}"),
        choice.replace("name: first", "name: ''"),
    ] {
        assert!(link(&[read(&invalid).unwrap(), first.clone(), second.clone()]).is_err());
    }
}
