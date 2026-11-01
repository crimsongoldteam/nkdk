use nkdk_rule_compiler::{SourceFile, generate, link, parse, parse_many};

#[test]
fn allocation_phase_is_optional_bounded_and_emitted_as_a_number_request() {
    let source = include_str!("fixtures/numbered-facts.yaml");
    for (phase, expected) in [
        ("0", "request_number("),
        ("7", "request_number_in_phase("),
        ("4294967295", "request_number_in_phase("),
    ] {
        let changed = source.replace("first: 1}", &format!("first: 1, phase: {phase}}}"));
        let linked = link(&[parse_source("phased.yaml", &changed)]).unwrap();
        let generated = generate(&linked).unwrap();
        let rust = std::str::from_utf8(
            &generated
                .files
                .iter()
                .find(|file| file.path == "generated.rs")
                .unwrap()
                .contents,
        )
        .unwrap();
        assert!(rust.contains(expected));
    }
    for phase in ["-1", "1.5", "4294967296", "true", "later"] {
        let changed = source.replace("first: 1}", &format!("first: 1, phase: {phase}}}"));
        assert!(
            parse(SourceFile {
                path: "invalid-phase.yaml",
                bytes: changed.as_bytes()
            })
            .is_err(),
            "accepted phase {phase}"
        );
    }
}

#[test]
fn number_requests_require_declared_scope_and_exclude_values_and_unions() {
    let source = include_str!("fixtures/numbered-facts.yaml");
    let module = parse_source("numbered.yaml", source);
    let linked = link(&[module]).unwrap();
    let generated = generate(&linked).unwrap();
    let rust = std::str::from_utf8(
        &generated
            .files
            .iter()
            .find(|f| f.path == "generated.rs")
            .unwrap()
            .contents,
    )
    .unwrap();
    assert!(rust.contains("request_number("));
    assert!(rust.contains("text_number_index("));
    for (from, to) in [
        ("scope: [owner]", "scope: [unknown]"),
        ("scope: [owner]", "scope: [owner, owner]"),
        ("first: 1", "first: 0"),
        (
            "    allocate:",
            "    value: {literal: conflicting}\n    allocate:",
        ),
        (
            "    allocate:",
            "    union: {referencePrefix: 'x:'}\n    allocate:",
        ),
    ] {
        let changed = source.replace(from, to);
        let result = parse(SourceFile {
            path: "bad.yaml",
            bytes: changed.as_bytes(),
        })
        .map_err(|e| format!("{e:?}"))
        .and_then(|module| link(&[module]).map_err(|e| format!("{e:?}")));
        assert!(result.is_err(), "accepted invalid numbering: {changed}");
    }
}

#[test]
fn number_reservations_use_only_allocator_scope_and_do_not_define_identity_shape() {
    let allocator = include_str!("fixtures/numbered-facts.yaml");
    let reservation = allocator
        .split("contributions:")
        .next()
        .unwrap()
        .replace("test.numbering", "test.number-reservations")
        + "contributions:\n  - index: test.numbers\n    key: {record: {owner: {input: owner}}}\n    reserve: {field: id}\n";
    let modules =
        parse_named_sources([("request.yaml", allocator), ("reserved.yaml", &reservation)]);
    let linked = link(&modules).unwrap();
    let generated = generate(&linked).unwrap();
    let file = generated
        .files
        .iter()
        .find(|file| file.path == "generated.rs")
        .unwrap();
    assert!(
        std::str::from_utf8(&file.contents)
            .unwrap()
            .contains("reserve_number(")
    );
    let global_allocator = allocator.replace("scope: [owner]", "scope: []");
    let global_reservation = reservation.replace("record: {owner: {input: owner}}", "record: {}");
    let modules = parse_named_sources([
        ("request.yaml", &global_allocator),
        ("reserved.yaml", &global_reservation),
    ]);
    generate(&link(&modules).unwrap()).unwrap();
    for invalid in [
        reservation.replace(
            "record: {owner: {input: owner}}",
            "record: {name: {input: owner}}",
        ),
        reservation.replace("index: test.numbers", "index: test.unknown"),
        reservation.replace("record: {owner: {input: owner}}", "input: owner"),
    ] {
        let modules =
            parse_named_sources([("request.yaml", allocator), ("reserved.yaml", &invalid)]);
        assert!(
            link(&modules).is_err(),
            "accepted invalid reserve: {invalid}"
        );
    }
    let retained_only = allocator
        .split("  - index: test.numbers")
        .take(2)
        .collect::<Vec<_>>()
        .join("  - index: test.numbers");
    let modules = parse_named_sources([
        ("request.yaml", &retained_only),
        ("reserved.yaml", &reservation),
    ]);
    assert!(
        link(&modules).is_err(),
        "reservation without a number allocator"
    );
}

fn parse_source(path: &str, source: &str) -> nkdk_rule_model::Module {
    parse(SourceFile {
        path,
        bytes: source.as_bytes(),
    })
    .unwrap()
}

fn parse_catalog(source: &str) -> Vec<nkdk_rule_model::Module> {
    parse_many(SourceFile {
        path: "choice.yaml",
        bytes: source.as_bytes(),
    })
    .unwrap()
}

#[test]
fn enum_projection_can_use_its_yaml_spellings_in_xml() {
    let modules = parse_catalog(
        "format: nkdk-declarations/1\nkind: catalog\ndeclarations:\n- kind: value\n  id: test.root\n  enum: {Catalog: Справочник, Document: Документ}\n  projections:\n  - id: test.root-russian-xml\n    xml: {kind: yaml-text}\n    yaml: {overrides: {Catalog: Каталог}}\n",
    );
    link(&modules).unwrap();
    let projected = modules
        .iter()
        .find(|module| module.id == "test.root-russian-xml")
        .unwrap();
    let nkdk_rule_model::XmlRepresentation::EnumTable(rows) = &projected.representations.xml else {
        panic!("expected an XML enum table");
    };
    assert_eq!(rows[0].value, "Catalog");
    assert_eq!(rows[0].text, "Каталог");
    assert_eq!(rows[1].text, "Документ");
}

fn assert_catalog_error(source: &str, code: &str) {
    let modules = parse_catalog(source);
    let errors = link(&modules).unwrap_err();
    assert!(errors.iter().any(|error| error.code == code), "{errors:?}");
}

#[test]
fn linear_sequence_requires_distinct_item_wrapper_and_next_node() {
    let source = "format: nkdk-declarations/1\nkind: value\nid: test.chain\nnamespaces: {x: urn:test}\nvalue: {kind: sequence, item: {kind: scalar, scalar: text}}\nrepresentations:\n  xml: {kind: element-sequence, path: [x:items, x:item], next: [x:next], item: {kind: text}}\n  yaml: {kind: sequence, item: {kind: scalar, scalar: text}}\n";
    let valid = parse_source("chain.yaml", source);
    link(&[valid]).unwrap();
    let ambiguous = source.replace("next: [x:next]", "next: [x:items]");
    let errors = link(&[parse_source("ambiguous.yaml", &ambiguous)]).unwrap_err();
    assert!(
        errors
            .iter()
            .any(|error| error.code == "ambiguous_sequence_chain"),
        "{errors:?}"
    );
}

fn assert_link_outcome(
    result: Result<nkdk_rule_model::Program, Vec<nkdk_rule_model::Diagnostic>>,
    expected_error: Option<&str>,
    context: &str,
) {
    match expected_error {
        Some(code) => {
            let errors = result.unwrap_err();
            assert!(
                errors.iter().any(|error| error.code == code),
                "{context}: {errors:?}"
            );
        }
        None => assert!(result.is_ok(), "{context}: {result:?}"),
    }
}

#[test]
fn text_choice_fallback_names_an_existing_variant() {
    let source = r#"format: nkdk-declarations/1
kind: catalog
declarations:
- kind: value
  id: test.standard
  value: {kind: scalar, scalar: text}
  representations: {xml: {kind: text}, yaml: {kind: scalar, scalar: text}}
- kind: value
  id: test.item
  value: {kind: scalar, scalar: text}
  representations: {xml: {kind: text}, yaml: {kind: scalar, scalar: text}}
- kind: value
  id: test.choice
  imports: {standard: test.standard, item: test.item}
  value: {kind: choice, variants: [{name: standard, type: {use: standard}}, {name: item, type: {use: item}}]}
  representations: {xml: {kind: choice, fallback: item}, yaml: {kind: choice}}
"#;
    let modules = parse_catalog(source);
    link(&modules).expect("existing fallback variant");
    for invalid in ["missing", ""] {
        let changed = source.replace("fallback: item", &format!("fallback: '{invalid}'"));
        assert_catalog_error(&changed, "unknown_choice_variant");
    }
}

#[test]
fn tagged_scalar_choice_is_a_declarative_selector() {
    let source = r#"format: nkdk-declarations/1
kind: catalog
declarations:
- kind: value
  id: test.plain
  value: {kind: scalar, scalar: text}
  representations: {xml: {kind: text}, yaml: {kind: scalar, scalar: text}}
- kind: value
  id: test.tagged
  value: {kind: scalar, scalar: text}
  representations: {xml: {kind: text}, yaml: {kind: scalar, scalar: text}}
- kind: value
  id: test.choice
  imports: {plain: test.plain, tagged: test.tagged}
  value: {kind: choice, variants: [{name: plain, type: {use: plain}}, {name: tagged, type: {use: tagged}}]}
  representations:
    xml: {kind: choice, fallback: plain}
    yaml: {kind: choice, variants: [{variant: tagged, form: scalar, tag: xml/string}]}
- kind: object
  id: test.owner
  imports: {value: test.choice}
  value: {kind: record, fields: [{name: value, type: {use: value}}]}
  representations: {xml: {kind: record, fields: [{field: value, path: [Root, Value]}]}, yaml: {kind: mapping, fields: [{field: value, key: Значение}]}}
"#;
    let modules = parse_catalog(source);
    let program = link(&modules).expect("a tagged scalar disambiguates text variants");
    generate(&program).expect("tagged choice generates without special object code");

    let duplicate = source.replace("variants: [{variant: tagged, form: scalar, tag: xml/string}]", "variants: [{variant: tagged, form: scalar, tag: xml/string}, {variant: plain, form: scalar, tag: xml/string}]");
    assert_catalog_error(&duplicate, "choice_selector_collision");
    let invalid = source.replace("tag: xml/string", "tag: 'xml/ string'");
    assert_catalog_error(&invalid, "invalid_choice_selector");
}

#[test]
fn scalar_choice_input_has_one_text_source_and_distinct_values() {
    let source = r#"format: nkdk-declarations/1
kind: catalog
declarations:
- kind: value
  id: test.first
  value: {kind: scalar, scalar: text}
  representations: {xml: {kind: text}, yaml: {kind: scalar, scalar: text}}
- kind: value
  id: test.second
  value: {kind: scalar, scalar: text}
  representations: {xml: {kind: text}, yaml: {kind: scalar, scalar: text}}
- kind: value
  id: test.choice
  imports: {first: test.first, second: test.second}
  inputs: {profile: {type: {kind: scalar, scalar: text}}}
  value: {kind: choice, variants: [{name: first, type: {use: first}}, {name: second, type: {use: second}}]}
  representations:
    xml: {kind: choice, fallback: first}
    yaml: {kind: choice, variants: [{variant: first, form: scalar-input, input: profile, equals: First}, {variant: second, form: scalar-input, input: profile, equals: Second}]}
"#;
    link(&parse_catalog(source)).expect("input-selected scalar variants are distinct");
    assert_catalog_error(
        &source.replace("equals: Second", "equals: First"),
        "choice_selector_collision",
    );
    assert_catalog_error(
        &source.replace("input: profile", "input: absent"),
        "invalid_choice_selector",
    );
}

fn modules() -> Vec<nkdk_rule_model::Module> {
    [
        (
            "common.yaml",
            include_bytes!("fixtures/common.yaml").as_slice(),
        ),
        (
            "owner.yaml",
            include_bytes!("fixtures/owner.yaml").as_slice(),
        ),
    ]
    .into_iter()
    .map(|(path, bytes)| parse(SourceFile { path, bytes }).unwrap())
    .collect()
}

fn fragment_source(id: &str) -> String {
    include_str!("fixtures/owner.yaml")
        .replace("kind: object", "kind: fragment")
        .replace("applied.common-module", id)
}

fn client_fragment() -> String {
    fragment_source("common.fragment")
        .replace("server", "client")
        .replace("Server", "Client")
        .replace("Сервер", "Клиент")
}

fn owner_with_fragment() -> String {
    include_str!("fixtures/owner.yaml").replace(
        "  boolean: common.boolean",
        "  boolean: common.boolean\n  fragment: common.fragment",
    ) + "\ncompose: [{use: fragment}]\n"
}

fn composition_modules(fragment: &str, owner: &str) -> Vec<nkdk_rule_model::Module> {
    let mut source = modules();
    source[1] = parse_source("owner.yaml", owner);
    source.push(parse_source("fragment.yaml", fragment));
    source
}

fn modules_with_common(common: &str) -> Vec<nkdk_rule_model::Module> {
    let mut source = modules();
    source[0] = parse_source("common.yaml", common);
    source
}

fn parse_named_sources<const N: usize>(sources: [(&str, &str); N]) -> Vec<nkdk_rule_model::Module> {
    sources
        .into_iter()
        .map(|(path, text)| parse_source(path, text))
        .collect()
}

fn record_names(entry: &nkdk_rule_model::LinkedEntry) -> Vec<&str> {
    let nkdk_rule_model::LinkedType::Record(fields) = &entry.value else {
        panic!("record expected")
    };
    fields.iter().map(|field| field.name.as_str()).collect()
}

#[test]
fn reversed_input_order_preserves_linked_program() {
    let mut source = modules();
    let forward = link(&source).expect("linked common and owner");
    source.reverse();
    let reversed = link(&source).expect("reversed source order");
    assert_eq!(forward, reversed);
    assert_eq!(forward.entries.len(), 2);
    assert_eq!(forward.entries[0].name, "applied.common-module");
    assert_eq!(forward.entries[1].name, "common.boolean");
}

#[test]
fn imports_and_namespaces_are_resolved_before_generation() {
    let original = include_str!("fixtures/owner.yaml");
    for (from, to, code) in [
        ("common.boolean", "common.missing", "missing_import"),
        ("{use: boolean}", "{use: absent}", "missing_import_alias"),
        ("md:Properties", "unknown:Properties", "missing_namespace"),
    ] {
        let mut source = modules();
        let text = original.replace(from, to);
        source[1] = parse_source("owner.yaml", &text);
        let errors = link(&source).unwrap_err();
        assert!(errors.iter().any(|error| error.code == code), "{errors:?}");
    }
    let program = link(&modules()).unwrap();
    let nkdk_rule_model::LinkedXml::Record(fields) = &program.entries[0].xml else {
        panic!("record expected")
    };
    assert_eq!(fields[0].path[0].namespace, "http://v8.1c.ru/8.3/MDClasses");
    assert_eq!(fields[0].path[0].local, "Properties");
}

#[test]
fn duplicate_ids_report_both_source_locations() {
    let mut source = modules();
    source.push(
        parse(SourceFile {
            path: "duplicate.yaml",
            bytes: include_bytes!("fixtures/common.yaml"),
        })
        .unwrap(),
    );
    let errors = link(&source).unwrap_err();
    assert_eq!(errors[0].code, "duplicate_id");
    assert_eq!(errors[0].file, "duplicate.yaml");
    assert_eq!(errors[0].related[0].file, "common.yaml");
}

#[test]
fn representation_cannot_reference_an_unknown_field() {
    let mut source = modules();
    let owner = include_str!("fixtures/owner.yaml").replace("field: server", "field: missing");
    source[1] = parse_source("owner.yaml", &owner);
    let errors = link(&source).unwrap_err();
    assert_eq!(errors[0].code, "unknown_representation_field");
}

#[test]
fn boolean_tables_must_have_an_unambiguous_reverse() {
    let text = include_str!("fixtures/common.yaml").replace("text: \"false\"", "text: \"true\"");
    let module = parse_source("boolean.yaml", &text);
    let errors = link(&[module]).unwrap_err();
    assert_eq!(errors[0].code, "ambiguous_boolean_table");
}

#[test]
fn common_cannot_import_an_applied_owner() {
    let text = format!(
        "{}\nimports:\n  forbidden: applied.common-module\n",
        include_str!("fixtures/common.yaml")
    );
    let errors = link(&modules_with_common(&text)).unwrap_err();
    assert!(
        errors
            .iter()
            .any(|error| error.code == "forbidden_dependency")
    );
}

#[test]
fn composed_field_collision_reports_both_declarations() {
    let fragment = fragment_source("common.fragment");
    let owner = include_str!("fixtures/owner.yaml").replace(
        "  boolean: common.boolean",
        "  boolean: common.boolean\n  fragment: common.fragment",
    ) + "\ncompose:\n  - use: fragment\n";
    let errors = link(&composition_modules(&fragment, &owner)).unwrap_err();
    let error = errors
        .iter()
        .find(|error| error.code == "duplicate_field")
        .expect("composed collision");
    assert_eq!(error.related.len(), 1);
    assert_ne!(error.file, error.related[0].file);
}

#[test]
fn fragment_only_composition_preserves_the_declared_sequence() {
    let common = modules().remove(0);
    let first_text = fragment_source("common.first");
    let second_text = first_text
        .replace("common.first", "common.second")
        .replace("server", "client")
        .replace("Server", "Client")
        .replace("Сервер", "Клиент");
    let owner_text = "format: nkdk-declarations/1\nkind: object\nid: applied.owner\nimports: {a: common.first, b: common.second}\nvalue: {kind: record, fields: []}\nrepresentations:\n  xml: {kind: record, fields: []}\n  yaml: {kind: mapping, fields: []}\ncompose: [{use: b}, {use: a}]\n";
    let source = vec![
        common,
        parse_source("a.yaml", &first_text),
        parse_source("b.yaml", &second_text),
        parse_source("owner.yaml", owner_text),
    ];
    let program = link(&source).unwrap();
    assert_eq!(record_names(&program.entries[0]), ["client", "server"]);
}

#[test]
fn fragment_composition_cycles_are_rejected() {
    let common = modules().remove(0);
    let a = fragment_source("common.a").replace(
        "  boolean: common.boolean",
        "  boolean: common.boolean\n  next: common.b",
    ) + "\ncompose: [{use: next}]\n";
    let b = a
        .replace("id: common.a", "id: common.b")
        .replace("next: common.b", "next: common.a");
    let errors = link(&[
        common,
        parse_source("a.yaml", &a),
        parse_source("b.yaml", &b),
    ])
    .unwrap_err();
    assert!(errors.iter().any(|error| error.code == "composition_cycle"));
}

#[test]
fn unsupported_behavior_is_not_silently_erased() {
    let text = format!(
        "{}\nconstraints:\n  - id: numeric\n    appliesTo: [yaml-validation]\n    assert: {{eq: [{{literal: null}}, {{literal: null}}]}}\n    diagnostic:\n      severity: error\n      at: {{self: true}}\n      message: Invalid\n",
        include_str!("fixtures/common.yaml")
    );
    let source = vec![parse_source("common.yaml", &text)];
    let errors = link(&source).unwrap_err();
    assert!(
        errors
            .iter()
            .any(|error| error.code == "unsupported_link_feature")
    );
}

#[test]
fn mixed_composition_places_fragments_before_own_fields() {
    let fragment = client_fragment();
    let owner = owner_with_fragment();
    let program = link(&composition_modules(&fragment, &owner)).unwrap();
    let entry = &program.entries[0];
    assert_eq!(record_names(entry), ["client", "server"]);
    let nkdk_rule_model::LinkedXml::Record(fields) = &entry.xml else {
        panic!("XML record expected")
    };
    assert_eq!(
        fields
            .iter()
            .map(|field| field.field.as_str())
            .collect::<Vec<_>>(),
        ["client", "server"]
    );
    let nkdk_rule_model::YamlRepresentation::Mapping(fields) = &entry.yaml else {
        panic!("YAML mapping expected")
    };
    assert_eq!(
        fields
            .iter()
            .map(|field| field.field.as_str())
            .collect::<Vec<_>>(),
        ["client", "server"]
    );
}

#[test]
fn composed_xml_routes_cannot_own_an_ancestor_of_another_field() {
    let fragment = client_fragment().replace("[md:Properties, md:Client]", "[md:Properties]");
    let owner = owner_with_fragment();
    let errors = link(&composition_modules(&fragment, &owner)).unwrap_err();
    let error = errors
        .iter()
        .find(|error| error.code == "xml_path_collision")
        .unwrap();
    assert_eq!(error.related.len(), 1);
    assert_ne!(error.file, error.related[0].file);
}

#[test]
fn declared_inputs_are_typed_slots_without_runtime_values() {
    let text = format!(
        "{}\ninputs:\n  language: {{type: {{kind: scalar, scalar: text}}}}\n  enabled: {{type: {{kind: scalar, scalar: boolean}}}}\n",
        include_str!("fixtures/common.yaml")
    );
    let module = parse_source("inputs.yaml", &text);
    let result = link(&[module]);
    let program = result.expect("runtime input values are not needed during compilation");
    let inputs = &program.entries[0].inputs;
    assert_eq!(inputs.len(), 2);
    assert_eq!(inputs[0].name, "language");
    assert_eq!(
        inputs[0].value,
        nkdk_rule_model::LinkedType::Scalar(nkdk_rule_model::ScalarType::Text)
    );
    assert_eq!(
        inputs[1].value,
        nkdk_rule_model::LinkedType::Scalar(nkdk_rule_model::ScalarType::Boolean)
    );
}

#[test]
fn using_a_declaration_requires_all_its_input_bindings() {
    let text = format!(
        "{}\ninputs:\n  enabled: {{type: {{kind: scalar, scalar: boolean}}}}\n",
        include_str!("fixtures/common.yaml")
    );
    let errors = link(&modules_with_common(&text)).unwrap_err();
    assert!(
        errors
            .iter()
            .any(|error| error.code == "missing_input_binding"),
        "{errors:?}"
    );
}

#[test]
fn input_bindings_are_checked_for_names_and_types() {
    let common = format!(
        "{}\ninputs:\n  enabled: {{type: {{kind: scalar, scalar: boolean}}}}\n",
        include_str!("fixtures/common.yaml")
    );
    for (binding, expected) in [
        ("enabled: {input: active}", None),
        ("enabled: {literal: true}", None),
        ("enabled: {input: missing}", Some("unknown_input")),
        ("enabled: {literal: text}", Some("binding_type_mismatch")),
        ("absent: {literal: true}", Some("unknown_input_binding")),
    ] {
        let owner = include_str!("fixtures/owner.yaml").replace(
            "{use: boolean}",
            &format!("{{use: boolean, bind: {{{binding}}}}}"),
        ) + "\ninputs:\n  active: {type: {kind: scalar, scalar: boolean}}\n";
        let source = [
            parse_source("common.yaml", &common),
            parse_source("owner.yaml", &owner),
        ];
        let result = link(&source);
        assert_link_outcome(result, expected, binding);
    }
}

#[test]
fn enum_sequence_bindings_type_each_literal_against_the_declared_input() {
    let roots = parse_source(
        "roots.yaml",
        "format: nkdk-declarations/1\nkind: value\nid: test.roots\nenum: {Catalog: Справочник, Document: Документ}\n",
    );
    let common = parse_source(
        "common.yaml",
        &format!(
            "{}\nimports: {{root: test.roots}}\ninputs:\n  allowedRoots: {{type: {{kind: sequence, item: {{use: root}}}}}}\n",
            include_str!("fixtures/common.yaml")
        ),
    );
    for (binding, accepted) in [
        ("[{literal: Catalog}, {literal: Document}]", true),
        ("[{literal: Unknown}]", false),
        ("[{literal: true}]", false),
    ] {
        let owner = include_str!("fixtures/owner.yaml").replace(
            "{use: boolean}",
            &format!("{{use: boolean, bind: {{allowedRoots: {{sequence: {binding}}}}}}}"),
        );
        let result = link(&[
            roots.clone(),
            common.clone(),
            parse_source("owner.yaml", &owner),
        ]);
        assert_eq!(result.is_ok(), accepted, "{result:?}");
    }
}

#[test]
fn binding_record_types_ignore_source_positions_but_preserve_structure() {
    let common = format!(
        "{}\ninputs:\n  settings:\n    type: {{kind: record, fields: [{{name: flag, type: {{kind: scalar, scalar: boolean}}}}]}}\n",
        include_str!("fixtures/common.yaml")
    );
    for (scalar, accepted) in [("boolean", true), ("text", false)] {
        let owner = include_str!("fixtures/owner.yaml").replace(
            "{use: boolean}",
            "{use: boolean, bind: {settings: {input: options}}}",
        ) + &format!(
            "\ninputs:\n  options:\n    type: {{kind: record, fields: [{{name: flag, type: {{kind: scalar, scalar: {scalar}}}}}]}}\n"
        );
        let result = link(&[
            parse_source("common.yaml", &common),
            parse_source("owner.yaml", &owner),
        ]);
        assert_eq!(result.is_ok(), accepted, "{result:?}");
    }
}

#[test]
fn field_bindings_reject_cycles_independently_of_field_order() {
    let directional = include_str!("fixtures/directional-fields.yaml");
    let parse_directional = |source: &str| parse_source("directional.yaml", source);
    assert!(link(&[parse_directional(directional)]).is_ok());
    let cycle = directional.replace(
        "xml: {missing: {denotes: {absent: true}}}",
        "xml: {missing: {denotes: {field: left}}}",
    );
    assert!(
        link(&[parse_directional(&cycle)])
            .unwrap_err()
            .iter()
            .any(|error| error.code == "field_dependency_cycle")
    );
    let common = format!(
        "{}\ninputs:\n  enabled: {{type: {{kind: scalar, scalar: boolean}}}}\npresence:\n- target: self\n  xml: {{missing: {{denotes: {{input: enabled}}}}}}\n  yaml: {{missing: {{denotes: {{input: enabled}}}}}}\n",
        include_str!("fixtures/common.yaml")
    );
    for (a, b, accepted) in [("true", "a", true), ("b", "a", false)] {
        for reverse in [false, true] {
            let binding_a = if a == "true" {
                "literal: true".to_owned()
            } else {
                format!("get: {{of: {{self: true}}, field: {a}}}")
            };
            let mut fields = [
                format!(
                    "    - name: a\n      type: {{use: boolean, bind: {{enabled: {{{binding_a}}}}}}}\n"
                ),
                format!(
                    "    - name: b\n      type: {{use: boolean, bind: {{enabled: {{not: {{field: {b}}}}}}}}}\n"
                ),
            ];
            if reverse {
                fields.reverse();
            }
            let owner = format!(
                "format: nkdk-declarations/1\nkind: object\nid: applied.owner\nimports: {{boolean: common.boolean}}\nvalue:\n  kind: record\n  fields:\n{}representations:\n  xml:\n    kind: record\n    fields: [{{field: a, path: [A]}}, {{field: b, path: [B]}}]\n  yaml:\n    kind: mapping\n    fields: [{{field: a, key: A}}, {{field: b, key: B}}]\n",
                fields.concat()
            );
            let result = link(&[
                parse_source("common.yaml", &common),
                parse_source("owner.yaml", &owner),
            ]);
            if accepted {
                assert!(result.is_ok(), "{result:?}");
            } else {
                assert!(
                    result
                        .unwrap_err()
                        .iter()
                        .any(|error| error.code == "field_dependency_cycle")
                );
            }
        }
    }
}

#[test]
fn fragment_field_dependencies_follow_fields_after_composition() {
    let common = format!(
        "{}\ninputs:\n  enabled: {{type: {{kind: scalar, scalar: boolean}}}}\n",
        include_str!("fixtures/common.yaml")
    );
    let fragment = fragment_source("common.fragment")
        .replace(
            "{use: boolean}",
            "{use: boolean, bind: {enabled: {not: {field: flag}}}}",
        )
        .replace(
            "  fields:\n    - name:",
            "  fields:\n    - name: flag\n      type: {kind: scalar, scalar: boolean}\n    - name:",
        )
        .replace(
            "      - field: server\n        path:",
            "      - field: flag\n        path: [Flag]\n      - field: server\n        path:",
        )
        .replace(
            "      - field: server\n        key:",
            "      - field: flag\n        key: Flag\n      - field: server\n        key:",
        );
    let prefix = fragment_source("common.prefix")
        .replace("{use: boolean}", "{kind: scalar, scalar: boolean}")
        .replace("server", "prefix")
        .replace("Server", "Prefix")
        .replace("Сервер", "Prefix");
    let owner = "format: nkdk-declarations/1\nkind: object\nid: applied.owner\nimports: {prefix: common.prefix, body: common.fragment}\ncompose: [{use: prefix}, {use: body}]\nvalue: {kind: record, fields: []}\nrepresentations:\n  xml: {kind: record, fields: []}\n  yaml: {kind: mapping, fields: []}\n";
    let source = parse_named_sources([
        ("common.yaml", common.as_str()),
        ("fragment.yaml", fragment.as_str()),
        ("prefix.yaml", prefix.as_str()),
        ("owner.yaml", owner),
    ]);
    let program = link(&source).unwrap();
    assert_eq!(
        program.entries[0].field_dependencies,
        vec![vec![], vec![], vec![1]]
    );
}

#[test]
fn static_parameters_require_matching_arguments_or_defaults() {
    for (literal, accepted) in [
        ("9007199254740993", true),
        ("38.000000000000000000001", true),
        ("1e1000000", true),
        ("1e9223372036854775808", false),
        ("\"42\"", false),
        ("true", false),
    ] {
        let common = format!(
            "{}\nparameters:\n  maximum:\n    type: {{kind: scalar, scalar: number, profile: decimal}}\n    default: {literal}\n",
            include_str!("fixtures/common.yaml")
        );
        let source = parse_source("common.yaml", &common);
        let result = link(&[source]);
        assert_eq!(result.is_ok(), accepted, "{literal}: {result:?}");
        if accepted {
            assert_eq!(
                result.unwrap().entries[0].parameters[0].default,
                Some(nkdk_rule_model::ScalarLiteral::Number(literal.into()))
            );
        }
    }
    for (default, arguments, expected) in [
        ("\n    default: true", "", None),
        ("", ", with: {flag: false}", None),
        ("", "", Some("missing_parameter_argument")),
        ("", ", with: {flag: text}", Some("parameter_type_mismatch")),
        ("\n    default: text", "", Some("parameter_type_mismatch")),
        (
            "\n    default: true",
            ", with: {other: true}",
            Some("unknown_parameter_argument"),
        ),
    ] {
        let common = format!(
            "{}\nparameters:\n  flag:\n    type: {{kind: scalar, scalar: boolean}}{default}\n",
            include_str!("fixtures/common.yaml")
        );
        let owner = include_str!("fixtures/owner.yaml")
            .replace("{use: boolean}", &format!("{{use: boolean{arguments}}}"));
        let result = link(&[
            parse_source("common.yaml", &common),
            parse_source("owner.yaml", &owner),
        ]);
        assert_link_outcome(result, expected, &format!("{default} {arguments}"));
    }
}

#[test]
fn field_types_cannot_reference_fragments_or_implicit_recursive_values() {
    let fragment = fragment_source("common.fragment");
    let owner = include_str!("fixtures/owner.yaml").replace("common.boolean", "common.fragment");
    let mut source = modules();
    source[1] = parse_source("owner.yaml", &owner);
    source.push(parse_source("fragment.yaml", &fragment));
    let errors = link(&source).unwrap_err();
    assert!(errors.iter().any(|error| error.code == "expected_value"));

    let recursive = include_str!("fixtures/owner.yaml")
        .replace("kind: object", "kind: value")
        .replace("applied.common-module", "common.recursive")
        .replace("common.boolean", "common.recursive");
    let module = parse_source("recursive.yaml", &recursive);
    let errors = link(&[module]).unwrap_err();
    assert!(
        errors
            .iter()
            .any(|error| error.code == "recursive_value_type")
    );
}

#[test]
fn value_recursion_requires_a_collection_boundary() {
    let node = parse(SourceFile {
        path: "node.yaml",
        bytes: include_bytes!("fixtures/recursive-node.yaml"),
    })
    .unwrap();
    let nodes = parse(SourceFile {
        path: "nodes.yaml",
        bytes: include_bytes!("fixtures/recursive-nodes.yaml"),
    })
    .unwrap();

    let program = link(&[node.clone(), nodes]).expect("collection-bounded recursion");
    let linked_node = program
        .entries
        .iter()
        .find(|entry| entry.name == "common.node")
        .unwrap();
    let nkdk_rule_model::LinkedType::Record(fields) = &linked_node.value else {
        panic!("record expected")
    };
    assert!(matches!(
        fields[1].value,
        nkdk_rule_model::LinkedType::Reference(_)
    ));

    let direct = include_str!("fixtures/owner.yaml")
        .replace("kind: object", "kind: value")
        .replace("applied.common-module", "common.direct")
        .replace("common.boolean", "common.direct");
    let direct = parse_source("direct.yaml", &direct);
    let errors = link(&[direct]).unwrap_err();
    assert!(
        errors
            .iter()
            .any(|error| error.code == "recursive_value_type")
    );
}

#[test]
fn value_recursion_accepts_a_declared_optional_record_field() {
    let source = r#"format: nkdk-declarations/1
kind: value
id: common.optional-node
imports: {node: common.optional-node}
value:
  kind: record
  fields: [{name: value, type: {use: node}}]
representations:
  xml: {kind: record, fields: [{field: value, path: [Value]}]}
  yaml: {kind: mapping, fields: [{field: value, key: Значение}]}
presence:
- target: {field: value}
  xml: {missing: {denotes: {absent: true}}}
  yaml: {missing: {denotes: {absent: true}}}
"#;
    let module = parse_source("optional-node.yaml", source);

    link(&[module]).expect("presence-bounded recursion");
}

#[test]
fn boolean_binding_expressions_are_typed_before_generation() {
    let common = format!(
        "{}\ninputs:\n  enabled: {{type: {{kind: scalar, scalar: boolean}}}}\n",
        include_str!("fixtures/common.yaml")
    );
    for (expression, expected) in [
        ("{not: {input: active}}", None),
        ("{and: [{input: active}, {parameter: flag}]}", None),
        ("{or: [{literal: true}, {literal: false}]}", None),
        ("{eq: [{input: active}, {literal: true}]}", None),
        (
            "{if: {input: active}, then: {literal: true}, else: {literal: false}}",
            None,
        ),
        ("{not: {literal: text}}", Some("expression_type_mismatch")),
        (
            "{eq: [{input: active}, {literal: text}]}",
            Some("expression_type_mismatch"),
        ),
        ("{parameter: missing}", Some("unknown_parameter")),
        (
            "{if: {input: active}, then: {literal: true}, else: {literal: text}}",
            Some("expression_type_mismatch"),
        ),
    ] {
        let owner = include_str!("fixtures/owner.yaml").replace(
            "{use: boolean}",
            &format!("{{use: boolean, bind: {{enabled: {expression}}}}}"),
        ) + "\ninputs:\n  active: {type: {kind: scalar, scalar: boolean}}\nparameters:\n  flag: {type: {kind: scalar, scalar: boolean}, default: true}\n";
        let result = link(&[
            parse_source("common.yaml", &common),
            parse_source("owner.yaml", &owner),
        ]);
        assert_link_outcome(result, expected, expression);
    }
}

#[test]
fn constraints_are_linked_with_typed_conditions_and_diagnostic_targets() {
    for (assertion, target, expected) in [
        ("{field: server}", "{field: server}", None),
        (
            "{literal: text}",
            "{self: true}",
            Some("expression_type_mismatch"),
        ),
        ("{literal: true}", "{field: absent}", Some("unknown_field")),
        ("{input: absent}", "{self: true}", Some("unknown_input")),
    ] {
        let mut source = modules();
        let text = format!(
            "{}\nconstraints:\n  - id: enabled\n    appliesTo: [yaml-validation]\n    assert: {assertion}\n    diagnostic:\n      severity: error\n      at: {target}\n      message: Invalid value\n",
            include_str!("fixtures/owner.yaml")
        );
        source[1] = parse_source("owner.yaml", &text);
        let result = link(&source);
        assert_link_outcome(result, expected, &format!("{assertion} {target}"));
    }
}

#[test]
fn constraints_can_read_self_and_record_members() {
    for (expression, accepted) in [
        ("{get: {of: {self: true}, field: server}}", true),
        ("{get: {of: {self: true}, field: absent}}", false),
    ] {
        let mut source = modules();
        let owner = format!(
            "{}\nconstraints:\n  - id: self-check\n    appliesTo: [yaml-validation]\n    assert: {expression}\n    diagnostic:\n      severity: error\n      at: {{self: true}}\n      message: Invalid value\n",
            include_str!("fixtures/owner.yaml")
        );
        source[1] = parse_source("owner.yaml", &owner);
        let result = link(&source);
        assert_eq!(result.is_ok(), accepted, "{result:?}");
    }
}

#[test]
fn collection_variables_are_typed_and_lexically_scoped() {
    let common = format!(
        "{}\ninputs:\n  enabled: {{type: {{kind: scalar, scalar: boolean}}}}\n",
        include_str!("fixtures/common.yaml")
    );
    for (expression, expected) in [
        (
            "{each: {in: {input: flags}, as: flag, where: {var: flag}}}",
            None,
        ),
        (
            "{exists: {in: {input: flags}, as: flag, where: {var: flag}}}",
            None,
        ),
        (
            "{present: {filter: {in: {input: flags}, as: flag, where: {var: flag}}}}",
            None,
        ),
        ("{var: flag}", Some("unknown_variable")),
        (
            "{each: {in: {literal: true}, as: flag, where: {var: flag}}}",
            Some("expression_type_mismatch"),
        ),
        (
            "{each: {in: {input: flags}, as: flag, where: {literal: text}}}",
            Some("expression_type_mismatch"),
        ),
        (
            "{filter: {in: {input: flags}, as: flag, where: {literal: text}}}",
            Some("expression_type_mismatch"),
        ),
        (
            "{and: [{each: {in: {input: flags}, as: flag, where: {var: flag}}}, {var: flag}]}",
            Some("unknown_variable"),
        ),
    ] {
        let owner = include_str!("fixtures/owner.yaml").replace(
            "{use: boolean}",
            &format!("{{use: boolean, bind: {{enabled: {expression}}}}}"),
        ) + "\ninputs:\n  flags: {type: {kind: sequence, item: {kind: scalar, scalar: boolean}}}\n";
        let result = link(&[
            parse_source("common.yaml", &common),
            parse_source("owner.yaml", &owner),
        ]);
        assert_link_outcome(result, expected, expression);
    }
}

#[test]
fn occurrence_constraints_preserve_scope_and_message_parts() {
    let mut source = modules();
    let owner = format!(
        "{}\ninputs:\n  translations:\n    type:\n      kind: sequence\n      item:\n        kind: record\n        fields:\n          - name: language\n            type: {{kind: scalar, scalar: text}}\nconstraints:\n  - id: language-check\n    appliesTo: [yaml-validation]\n    forEach: {{in: {{input: translations}}, as: translation}}\n    assert: {{eq: [{{get: {{of: {{var: translation}}, field: language}}}}, {{literal: ru}}]}}\n    diagnostic:\n      severity: error\n      at: {{occurrence: translation, field: language}}\n      message:\n        parts: [Invalid, {{get: {{of: {{var: translation}}, field: language}}}}]\n",
        include_str!("fixtures/owner.yaml")
    );
    source[1] = parse_source("owner.yaml", &owner);
    let result = link(&source);
    assert!(result.is_ok(), "{result:?}");
}

#[test]
fn localized_text_declaration_links_collection_constraints_and_shorthand() {
    let text = include_str!("../../../../tests/declaration-corpus/valid/i8n-validation-core.yaml");
    let module = parse_source("i8n.yaml", text);
    let result = link(&[module]);
    assert!(result.is_ok(), "{result:?}");
    let invalid = text.replace("{capture: text}", "{capture: absent}");
    let module = parse_source("i8n.yaml", &invalid);
    assert!(
        link(&[module])
            .unwrap_err()
            .iter()
            .any(|error| error.code == "unknown_capture")
    );
}

#[test]
fn corrected_skip_empty_condition_links_without_a_domain_callback() {
    let module = parse(SourceFile {
        path: "i8n.yaml",
        bytes: include_bytes!(
            "../../../../tests/declaration-corpus/valid/i8n-skip-empty-profile.yaml"
        ),
    })
    .unwrap();
    let result = link(&[module]);
    assert!(result.is_ok(), "{result:?}");
}

#[test]
fn presence_denotations_use_the_target_type_for_empty_sequences() {
    let text = format!(
        "{}\nparameters:\n  exclude: {{type: {{kind: scalar, scalar: boolean}}, default: false}}\npresence:\n  - target: self\n    xml:\n      missing: {{denotes: {{absent: true}}}}\n    yaml:\n      missing: {{denotes: {{sequence: []}}}}\n      empty:\n        - form: empty-string\n          denotes:\n            if: {{parameter: exclude}}\n            then: {{sequence: []}}\n            else:\n              sequence:\n                - record:\n                    language: {{input: defaultLanguage}}\n                    content: {{literal: \"\"}}\n      omitWhen: {{parameter: exclude}}\n",
        include_str!("../../../../tests/declaration-corpus/valid/i8n-text-core.yaml")
    );
    let module = parse_source("i8n.yaml", &text);
    let result = link(&[module]);
    assert!(result.is_ok(), "{result:?}");
    let invalid = text.replace("then: {sequence: []}", "then: {literal: false}");
    let module = parse_source("invalid.yaml", &invalid);
    assert!(
        link(&[module])
            .unwrap_err()
            .iter()
            .any(|error| error.code == "expression_type_mismatch")
    );
}

#[test]
fn normalization_requires_static_selection_and_a_nonempty_result() {
    let original = include_str!("../../../../tests/declaration-corpus/valid/i8n-text-core.yaml");
    for (condition, value, expected) in [
        (
            "{parameter: normalize}",
            "{sequence: [{record: {language: {input: defaultLanguage}, content: {literal: text}}}]}",
            None,
        ),
        (
            "{input: dynamicFlag}",
            "{sequence: [{record: {language: {input: defaultLanguage}, content: {literal: text}}}]}",
            Some("dynamic_normalization_condition"),
        ),
        (
            "{parameter: normalize}",
            "{sequence: []}",
            Some("non_progressing_normalization"),
        ),
    ] {
        let original = original.replace(
            "inputs:\n",
            "inputs:\n  dynamicFlag: {type: {kind: scalar, scalar: boolean}}\n",
        );
        let text = format!(
            "{original}\nparameters:\n  normalize: {{type: {{kind: scalar, scalar: boolean}}, default: true}}\nnormalization:\n  when: {condition}\n  from: empty-sequence\n  denotes: {value}\n"
        );
        let module = parse_source("i8n.yaml", &text);
        let result = link(&[module]);
        assert_link_outcome(result, expected, condition);
    }
}

#[test]
fn collection_selection_order_and_state_operators_preserve_types() {
    let common = format!(
        "{}\ninputs:\n  enabled: {{type: {{kind: scalar, scalar: boolean}}}}\n",
        include_str!("fixtures/common.yaml")
    );
    for (expression, accepted) in [
        (
            "{each: {in: {take: {in: {input: languages}, count: 1}}, as: language, where: {eq: [{var: language}, {literal: ru}]}}}",
            true,
        ),
        (
            "{each: {in: {firstBy: {in: {input: languages}, as: code, key: {var: code}}}, as: language, where: {eq: [{var: language}, {literal: ru}]}}}",
            true,
        ),
        (
            "{ordered: {in: {input: languages}, as: code, key: {var: code}, unique: true, first: [{literal: ru}], comparison: utf16}}",
            true,
        ),
        (
            "{ordered: {in: {input: languages}, as: code, key: {literal: true}, unique: true, first: [], comparison: utf16}}",
            false,
        ),
        ("{present: {input: languages}}", true),
        ("{isReady: {input: languages}}", true),
        ("{isNull: {input: languages}}", true),
    ] {
        let owner = include_str!("fixtures/owner.yaml").replace(
            "{use: boolean}",
            &format!("{{use: boolean, bind: {{enabled: {expression}}}}}"),
        ) + "\ninputs:\n  languages: {type: {kind: sequence, item: {kind: scalar, scalar: text}}}\n";
        let result = link(&[
            parse_source("common.yaml", &common),
            parse_source("owner.yaml", &owner),
        ]);
        assert_eq!(result.is_ok(), accepted, "{expression}: {result:?}");
    }
}

#[test]
fn text_transform_tables_reject_unknown_symbols_and_ambiguous_case_shifts() {
    let original =
        include_str!("../../../../tests/declaration-corpus/valid/name-text-transform.yaml");
    for (from, to, code) in [
        ("{class: upper}", "{class: missing}", "unknown_text_class"),
        (
            "{flag: abbreviation}",
            "{flag: missing}",
            "unknown_text_flag",
        ),
        (
            "set: {abbreviation: false}",
            "set: {missing: false}",
            "unknown_text_flag",
        ),
        ("offset: 32", "offset: 65535", "invalid_case_shift"),
        (
            "- when: {and: [{class: upper}, {tokenEmpty: true}]}",
            "-",
            "unreachable_text_transition",
        ),
        (
            "- emit: discard",
            "- when: {class: lower}\n        emit: discard",
            "incomplete_text_transform",
        ),
        (
            "from: [1040, 1071]",
            "from: [65, 90]",
            "ambiguous_case_shift",
        ),
    ] {
        let text = original.replace(from, to);
        assert_link_error("text.yaml", &text, code);
    }
}

#[test]
fn empty_text_class_table_reports_an_error_without_panicking() {
    let mut module = parse(SourceFile {
        path: "text.yaml",
        bytes: include_bytes!(
            "../../../../tests/declaration-corpus/valid/name-text-transform.yaml"
        ),
    })
    .unwrap();
    let nkdk_rule_model::TypeDefinition::TextTransform(transform) = &mut module.types[0].definition
    else {
        panic!("text transform expected")
    };
    transform.classes.clear();
    transform.transitions.clear();
    let errors = link(&[module]).unwrap_err();
    assert!(
        errors
            .iter()
            .any(|error| error.code == "unknown_text_class")
    );
}

#[test]
fn text_transform_calls_resolve_local_tables_and_keep_optional_results() {
    let original =
        include_str!("../../../../tests/declaration-corpus/valid/name-text-transform.yaml");
    for (name, value, accepted) in [
        ("name-words", "Name", true),
        ("missing", "Name", false),
        ("translation", "Name", false),
        ("name-words", "true", false),
    ] {
        let text = format!(
            "{original}\nconstraints:\n  - id: name-check\n    appliesTo: [yaml-validation]\n    assert: {{present: {{transform: {{local: {name}, value: {{literal: {value}}}}}}}}}\n    diagnostic:\n      severity: error\n      at: {{self: true}}\n      message: Invalid name\n"
        );
        let module = parse_source("text.yaml", &text);
        let result = link(&[module]);
        assert_eq!(result.is_ok(), accepted, "{result:?}");
    }
}

#[test]
fn constraint_forms_must_exist_in_the_selected_representation_phase() {
    let original =
        include_str!("../../../../tests/declaration-corpus/valid/i8n-validation-core.yaml");
    for (phase, form, accepted) in [
        ("yaml-validation", "keyed-mapping", true),
        ("yaml-validation", "scalar", true),
        ("xml-import", "keyed-mapping", false),
        ("yaml-validation", "record", false),
    ] {
        let text = original.replace(
            "appliesTo: [xml-import]",
            &format!("appliesTo: [{phase}]\n    forms: [{form}]"),
        );
        let module = parse_source("i8n.yaml", &text);
        let result = link(&[module]);
        assert_eq!(result.is_ok(), accepted, "{phase} {form}: {result:?}");
    }
}

#[test]
fn composition_substitutes_inputs_parameters_and_constraint_addresses() {
    let common = format!(
        "{}\ninputs:\n  enabled: {{type: {{kind: scalar, scalar: boolean}}}}\n",
        include_str!("fixtures/common.yaml")
    );
    let fragment = fragment_source("common.fragment").replace(
        "{use: boolean}",
        "{use: boolean, bind: {enabled: {and: [{parameter: permit}, {input: ready}]}}}",
    ) + "\ninputs:\n  ready: {type: {kind: scalar, scalar: boolean}}\nparameters:\n  permit: {type: {kind: scalar, scalar: boolean}, default: true}\nconstraints:\n  - id: enabled\n    appliesTo: [yaml-validation]\n    assert: {field: server}\n    diagnostic:\n      severity: error\n      at: {field: server}\n      message: Disabled\npresence:\n  - target: {field: server}\n    xml:\n      missing: {denotes: {parameter: permit}}\n";
    let fragment = fragment
        .replace(
            "inputs:\n",
            "inputs:\n  label: {type: {kind: scalar, scalar: text}}\n",
        )
        .replace(
            "parameters:\n",
            "parameters:\n  bucket: {type: {kind: scalar, scalar: text}, default: original}\n",
        )
        + "contributions:\n- index: test.bound-fragment\n  key: {parameter: bucket}\n  value: {input: label}\n  when: {and: [{input: ready}, {field: server}]}\n";
    let prefix = fragment_source("common.prefix")
        .replace("{use: boolean}", "{kind: scalar, scalar: boolean}")
        .replace("server", "prefix")
        .replace("Server", "Prefix")
        .replace("Сервер", "Prefix");
    let owner = "format: nkdk-declarations/1\nkind: object\nid: applied.owner\nimports: {prefix: common.prefix, body: common.fragment}\ninputs:\n  active: {type: {kind: scalar, scalar: boolean}}\ncompose: [{use: prefix}, {use: body, with: {permit: false}, bind: {ready: {input: active}}}]\nvalue: {kind: record, fields: []}\nrepresentations:\n  xml: {kind: record, fields: []}\n  yaml: {kind: mapping, fields: []}\n";
    let owner = owner
        .replace(
            "with: {permit: false}",
            "with: {permit: false, bucket: substituted}",
        )
        .replace(
            "bind: {ready: {input: active}}",
            "bind: {ready: {input: active}, label: {literal: bound}}",
        );
    let source = parse_named_sources([
        ("common.yaml", common.as_str()),
        ("fragment.yaml", fragment.as_str()),
        ("prefix.yaml", prefix.as_str()),
        ("owner.yaml", owner.as_str()),
    ]);
    let program = link(&source).unwrap();
    let entry = &program.entries[0];
    assert_eq!(entry.contributions.len(), 1);
    let nkdk_rule_model::LinkedExpressionKind::Operation { arguments, .. } =
        &entry.contributions[0].when.as_ref().unwrap().kind
    else {
        panic!("expected a bound condition");
    };
    assert_eq!(
        arguments[0].kind,
        nkdk_rule_model::LinkedExpressionKind::Input(0)
    );
    assert_eq!(
        arguments[1].kind,
        nkdk_rule_model::LinkedExpressionKind::Field(1)
    );
    for (expression, expected) in [
        (&entry.contributions[0].key, "substituted"),
        (entry.contributions[0].write.value().unwrap(), "bound"),
    ] {
        assert_eq!(
            expression.kind,
            nkdk_rule_model::LinkedExpressionKind::Literal(nkdk_rule_model::ScalarLiteral::Text(
                expected.into()
            ))
        );
    }
    assert_eq!(entry.constraints.len(), 1);
    assert_eq!(
        entry.presence[0].target,
        nkdk_rule_model::LinkedPresenceTarget::Field(1)
    );
    assert_eq!(
        entry.presence[0].xml_missing.as_ref().unwrap().kind,
        nkdk_rule_model::LinkedExpressionKind::Literal(nkdk_rule_model::ScalarLiteral::Boolean(
            false
        ))
    );
    assert_eq!(
        entry.constraints[0].diagnostic.at,
        nkdk_rule_model::LinkedDiagnosticTarget::Field(1)
    );
    let nkdk_rule_model::LinkedType::Record(fields) = &entry.value else {
        panic!("record expected")
    };
    let nkdk_rule_model::LinkedType::BoundReference { bindings, .. } = &fields[1].value else {
        panic!("bound field expected")
    };
    assert_eq!(
        bindings[0].value.kind,
        nkdk_rule_model::LinkedExpressionKind::Literal(nkdk_rule_model::ScalarLiteral::Boolean(
            false
        ))
    );
}

#[test]
fn owner_fields_can_depend_on_composed_fields() {
    let common = format!(
        "{}\ninputs:\n  enabled: {{type: {{kind: scalar, scalar: boolean}}}}\n",
        include_str!("fixtures/common.yaml")
    );
    let fragment = fragment_source("common.fragment")
        .replace("{use: boolean}", "{kind: scalar, scalar: boolean}")
        .replace("server", "flag")
        .replace("Server", "Flag")
        .replace("Сервер", "Flag");
    let owner = include_str!("fixtures/owner.yaml")
        .replace(
            "  boolean: common.boolean",
            "  boolean: common.boolean\n  body: common.fragment",
        )
        .replace(
            "{use: boolean}",
            "{use: boolean, bind: {enabled: {field: flag}}}",
        )
        + "\ncompose: [{use: body}]\nconstraints:\n  - id: field-check\n    appliesTo: [yaml-validation]\n    assert: {get: {of: {self: true}, field: flag}}\n    diagnostic:\n      severity: error\n      at: {field: server}\n      message: Disabled\n";
    let source = parse_named_sources([
        ("common.yaml", common.as_str()),
        ("fragment.yaml", fragment.as_str()),
        ("owner.yaml", owner.as_str()),
    ]);
    let program = link(&source).unwrap();
    let entry = &program.entries[0];
    assert_eq!(entry.field_dependencies, vec![vec![], vec![0]]);
    assert_eq!(
        entry.constraints[0].diagnostic.at,
        nkdk_rule_model::LinkedDiagnosticTarget::Field(1)
    );
}

#[test]
fn composed_constraints_cannot_silently_override_each_other() {
    let first = fragment_source("common.first")
        + "\nconstraints:\n  - id: shared\n    appliesTo: [yaml-validation]\n    assert: {literal: true}\n    diagnostic:\n      severity: error\n      at: {self: true}\n      message: Invalid\n";
    let second = first
        .replace("common.first", "common.second")
        .replace("server", "client")
        .replace("Server", "Client")
        .replace("Сервер", "Client");
    let owner = "format: nkdk-declarations/1\nkind: object\nid: applied.owner\nimports: {a: common.first, b: common.second}\ncompose: [{use: a}, {use: b}]\nvalue: {kind: record, fields: []}\nrepresentations:\n  xml: {kind: record, fields: []}\n  yaml: {kind: mapping, fields: []}\n";
    let source = parse_named_sources([
        ("common.yaml", include_str!("fixtures/common.yaml")),
        ("a.yaml", first.as_str()),
        ("b.yaml", second.as_str()),
        ("owner.yaml", owner),
    ]);
    let errors = link(&source).unwrap_err();
    let error = errors
        .iter()
        .find(|error| error.code == "duplicate_constraint")
        .unwrap();
    assert_eq!(error.file, "b.yaml");
    assert_eq!(error.related[0].file, "a.yaml");
}

#[test]
fn field_presence_defaults_are_typed_and_participate_in_dependency_checks() {
    for (denotes, expected) in [
        ("{literal: false}", None),
        ("{literal: text}", Some("expression_type_mismatch")),
        ("{field: server}", Some("field_dependency_cycle")),
    ] {
        let mut source = modules();
        let text = format!(
            "{}\npresence:\n  - target: {{field: server}}\n    xml:\n      missing: {{denotes: {denotes}}}\n    yaml:\n      missing: {{denotes: {denotes}}}\n",
            include_str!("fixtures/owner.yaml")
        );
        source[1] = parse_source("owner.yaml", &text);
        let result = link(&source);
        assert_link_outcome(result, expected, denotes);
    }
}

#[test]
fn omitted_representation_requires_an_explicit_restoration() {
    for (restore, accepted) in [(true, true), (false, false)] {
        let mut source = modules();
        let owner = include_str!("fixtures/owner.yaml").replace(
            "    fields:\n      - field: server\n        path: [md:Properties, md:Server]",
            "    fields: []",
        );
        let owner = if restore {
            owner
                + "\npresence:\n  - target: {field: server}\n    xml:\n      missing: {denotes: {literal: false}}\n"
        } else {
            owner
        };
        source[1] = parse_source("owner.yaml", &owner);
        let result = link(&source);
        assert_eq!(result.is_ok(), accepted, "{result:?}");
    }
}

#[test]
fn xml_attributes_have_separate_ownership_from_child_elements() {
    let source = r#"
format: nkdk-declarations/1
kind: value
id: common.attributes
namespaces: {a: urn:test, b: urn:test}
value:
  kind: record
  fields:
    - {name: flag, type: {kind: scalar, scalar: text}}
    - {name: child, type: {kind: scalar, scalar: text}}
representations:
  xml:
    kind: record
    fields:
      - {field: flag, path: [], attribute: a:flag}
      - {field: child, path: [a:flag]}
  yaml:
    kind: mapping
    fields:
      - {field: flag, key: Flag}
      - {field: child, key: Child}
"#;
    let module = parse_source("attributes.yaml", source);
    assert!(link(&[module]).is_ok());
    let default_namespace = source
        .replace(
            "namespaces: {a: urn:test, b: urn:test}",
            "namespaces: {a: urn:test, b: urn:test, \"\": urn:default}",
        )
        .replace("attribute: a:flag", "attribute: flag");
    let module = parse_source("attributes.yaml", &default_namespace);
    let program = link(&[module]).unwrap();
    let nkdk_rule_model::LinkedXml::Record(fields) = &program.entries[0].xml else {
        panic!("record")
    };
    assert_eq!(fields[0].attribute.as_ref().unwrap().namespace, "");
    let namespace_attribute = source.replace("attribute: a:flag", "attribute: xmlns");
    let module = parse_source("attributes.yaml", &namespace_attribute);
    assert_eq!(
        link(&[module]).unwrap_err()[0].code,
        "invalid_attribute_name"
    );
    let collision = source.replace("path: [a:flag]", "path: [], attribute: b:flag");
    let module = parse_source("attributes.yaml", &collision);
    let errors = link(&[module]).unwrap_err();
    assert_eq!(errors[0].code, "xml_path_collision");
    assert_eq!(errors[0].related.len(), 1);
}

#[test]
fn unused_local_types_are_still_checked() {
    for (definition, code) in [
        ("{local: missing}", "missing_local_type"),
        ("{local: unused}", "local_type_cycle"),
        (
            "{kind: record, fields: [{name: x, type: {kind: scalar, scalar: text}}, {name: x, type: {kind: scalar, scalar: text}}]}",
            "duplicate_field",
        ),
    ] {
        let source = format!(
            "{}\ntypes:\n  unused: {}\n",
            include_str!("fixtures/common.yaml"),
            definition
        );
        let module = parse_source("unused.yaml", &source);
        let errors = link(&[module]).expect_err("unused declarations must not bypass validation");
        assert_eq!(errors[0].code, code);
    }
}

#[test]
fn input_bindings_compare_semantic_types_across_import_aliases() {
    let flag = include_str!("fixtures/common.yaml").replace("common.boolean", "common.flag");
    for (caller_type, callee_type) in [
        ("{use: flag}", "{kind: scalar, scalar: boolean}"),
        ("{kind: scalar, scalar: boolean}", "{use: flag}"),
    ] {
        let common = format!(
            "{}\nimports: {{flag: common.flag}}\ninputs:\n  enabled: {{type: {callee_type}}}\n",
            include_str!("fixtures/common.yaml")
        );
        let owner = include_str!("fixtures/owner.yaml")
            .replace(
                "boolean: common.boolean",
                "boolean: common.boolean\n  flag: common.flag",
            )
            .replace(
                "{use: boolean}",
                "{use: boolean, bind: {enabled: {input: active}}}",
            )
            + &format!("\ninputs:\n  active: {{type: {caller_type}}}\n");
        let modules = [
            ("flag.yaml", &flag),
            ("common.yaml", &common),
            ("owner.yaml", &owner),
        ]
        .map(|(path, source)| {
            parse(SourceFile {
                path,
                bytes: source.as_bytes(),
            })
            .unwrap()
        });
        assert!(
            link(&modules).is_ok(),
            "{caller_type} -> {callee_type}: {:?}",
            link(&modules)
        );
    }
}

#[test]
fn xml_qualified_names_follow_ncname_character_rules() {
    for (name, accepted) in [
        ("md:Имя", true),
        ("md:_a-1.2", true),
        ("md:a\u{301}", true),
        ("md:𐀀", true),
        ("md:1Name", false),
        ("md:two words", false),
        ("md:\u{301}a", false),
        ("md:a/b", false),
        ("1md:Name", false),
    ] {
        let source = include_str!("fixtures/owner.yaml").replace("md:Properties", name);
        let mut loaded = modules();
        loaded[1] = parse_source("owner.yaml", &source);
        let result = link(&loaded);
        if accepted {
            assert!(result.is_ok(), "{name}: {result:?}");
        } else {
            assert_eq!(result.unwrap_err()[0].code, "invalid_qname", "{name}");
        }
    }
}

#[test]
fn namespace_bindings_respect_reserved_names_even_when_unused() {
    for (prefix, uri, accepted) in [
        ("xml", "http://www.w3.org/XML/1998/namespace", true),
        ("xml", "urn:other", false),
        ("alias", "http://www.w3.org/XML/1998/namespace", false),
        ("xmlns", "urn:other", false),
        ("alias", "http://www.w3.org/2000/xmlns/", false),
        ("alias", "", false),
        ("1alias", "urn:other", false),
        ("xmlOther", "urn:other", true),
        ("", "", true),
    ] {
        let source = format!(
            "{}\nnamespaces: {{\"{prefix}\": \"{uri}\"}}\n",
            include_str!("fixtures/common.yaml")
        );
        let module = parse_source("namespace.yaml", &source);
        let result = link(&[module]);
        assert_eq!(result.is_ok(), accepted, "{prefix}={uri}: {result:?}");
        if !accepted {
            assert_eq!(result.unwrap_err()[0].code, "invalid_namespace_binding");
        }
    }
}

#[test]
fn collection_patterns_link_only_with_unique_rest_and_disjoint_forms() {
    let source =
        include_str!("../../../../tests/declaration-corpus/valid/i8n-collection-patterns.yaml");
    let module = parse_source("patterns.yaml", source);
    let program = link(&[module]).expect("disjoint name and marker forms");
    let overlapping = source.replace(
        "language: {input: defaultLanguage}\n                content: {literal: \"\"}",
        "content: {input: defaultLanguage}\n                language: {literal: en}",
    );
    let module = parse_source("reordered.yaml", &overlapping);
    assert_eq!(link(&[module]).unwrap_err()[0].code, "ambiguous_shorthand");

    assert_eq!(program.entries[0].shorthands.len(), 2);
    for (from, to, code) in [
        (
            "id: absent-primary-marker",
            "id: name-and-rest",
            "duplicate_shorthand",
        ),
        (
            "rest: {capture: otherTranslations}",
            "rest: {capture: missing}",
            "unknown_capture",
        ),
        (
            "content: {input: nameText}",
            "content: {capture: otherTranslations}",
            "invalid_pattern_dependency",
        ),
        (
            "absentKeys: [{input: defaultLanguage}]",
            "absentKeys: [{literal: true}]",
            "expression_type_mismatch",
        ),
        (
            "absentKeys: [{input: defaultLanguage}]",
            "absentKeys: []",
            "ambiguous_shorthand",
        ),
    ] {
        let text = source.replace(from, to);
        let module = parse_source("patterns.yaml", &text);
        assert_eq!(link(&[module]).unwrap_err()[0].code, code, "{to}");
    }
}

#[test]
fn pattern_fixed_parts_retain_optional_text_results() {
    let source =
        include_str!("../../../../tests/declaration-corpus/valid/i8n-collection-patterns.yaml");
    let text_source =
        include_str!("../../../../tests/declaration-corpus/valid/name-text-transform.yaml");
    let transform = text_source
        .split("types:\n")
        .nth(1)
        .unwrap()
        .split("  translation:")
        .next()
        .unwrap();
    let source = source
        .replace("types:\n", &format!("types:\n{transform}"))
        .replace(
            "content: {input: nameText}",
            "content: {transform: {local: name-words, value: {input: nameText}}}",
        );
    let module = parse_source("optional-pattern.yaml", &source);
    let program = link(&[module]).expect("an unavailable fixed text disables the pattern");
    let matched = source.replace("{transform: {local: name-words, value: {input: nameText}}}", "{match: {value: {transform: {local: name-words, value: {input: nameText}}}, present: {as: found, then: {var: found}}, absent: {absent: true}}}");
    let module = parse(SourceFile {
        path: "matched.yaml",
        bytes: matched.as_bytes(),
    })
    .expect("optional match syntax");
    assert!(
        link(&[module]).is_ok(),
        "present branch unwraps its local value"
    );
    let escaped = matched.replace("absent: {absent: true}", "absent: {var: found}");
    let module = parse_source("escaped.yaml", &escaped);
    assert_eq!(link(&[module]).unwrap_err()[0].code, "unknown_variable");

    let guarded = source.replace("{transform: {local: name-words, value: {input: nameText}}}", "{if: {isReady: {input: nameText}}, then: {transform: {local: name-words, value: {input: nameText}}}, else: {absent: true}}");
    let module = parse_source("guarded.yaml", &guarded);
    assert!(
        link(&[module]).is_ok(),
        "explicit readiness guard must retain absence"
    );

    let both_optional = guarded.replace(
        "else: {absent: true}",
        "else: {transform: {local: name-words, value: {literal: fallback}}}",
    );
    let module = parse_source("both-optional.yaml", &both_optional);
    assert!(
        link(&[module]).is_ok(),
        "both optional branches have the same semantic type"
    );
    let nkdk_rule_model::LinkedExpressionKind::Operation { arguments, .. } =
        &program.entries[0].shorthands[0].denotes.kind
    else {
        panic!("pattern")
    };
    let nkdk_rule_model::LinkedType::Record(fields) = &arguments[0].value_type else {
        panic!("record")
    };
    assert!(matches!(
        fields
            .iter()
            .find(|field| field.name == "content")
            .unwrap()
            .value,
        nkdk_rule_model::LinkedType::Optional(_)
    ));
}

#[test]
fn canonical_xml_attributes_preserve_value_shape_and_expand_qnames() {
    let source = include_str!("../../../../tests/declaration-corpus/valid/i8n-text-core.yaml");
    let source = source.replace("namespaces:\n", "namespaces:\n  xsi: http://www.w3.org/2001/XMLSchema-instance\n")
        .replace("  xml:\n", "  xml:\n    kind: with-attributes\n    attributes:\n      - name: xsi:type\n        value: {qname: v8:LocalStringType}\n        when: {parameter: typedXML}\n    content:\n");
    let start = source.find("    content:\n").unwrap() + "    content:\n".len();
    let end = source.find("  yaml:\n").unwrap();
    let source = format!(
        "{}{}{}\nparameters:\n  typedXML: {{type: {{kind: scalar, scalar: boolean}}, default: false}}\n",
        &source[..start],
        source[start..end]
            .lines()
            .map(|line| format!("  {line}\n"))
            .collect::<String>(),
        &source[end..]
    );
    let module = parse(SourceFile {
        path: "typed.yaml",
        bytes: source.as_bytes(),
    })
    .expect("canonical wrapper syntax");
    let program = link(&[module]).expect("canonical wrapper");
    assert!(matches!(
        program.entries[0].value,
        nkdk_rule_model::LinkedType::Sequence(_)
    ));
    let nkdk_rule_model::LinkedXml::WithAttributes { attributes, .. } = &program.entries[0].xml
    else {
        panic!("attribute wrapper")
    };
    assert_eq!(
        attributes[0].name.namespace,
        "http://www.w3.org/2001/XMLSchema-instance"
    );
    let nkdk_rule_model::LinkedXmlAttributeValue::QName(value) = &attributes[0].value else {
        panic!("QName value")
    };
    assert_eq!(value.namespace, "http://v8.1c.ru/8.1/data/core");
    assert_eq!(value.local, "LocalStringType");
    assert!(program.entries[0].namespaces.iter().any(|binding| binding.name == "v8" && binding.value == "http://v8.1c.ru/8.1/data/core"));
    let dynamic = source.replace(
        "{parameter: typedXML}",
        "{eq: [{input: defaultLanguage}, {literal: ru}]}",
    );
    let dynamic = parse_source("dynamic.yaml", &dynamic);
    assert!(link(&[dynamic]).is_ok());

    for (from, to, code) in [
        (
            "{parameter: typedXML}",
            "{input: defaultLanguage}",
            "expression_type_mismatch",
        ),
        (
            "v8:LocalStringType",
            "missing:LocalStringType",
            "missing_namespace",
        ),
        (
            "    content:\n",
            "      - name: xsi:type\n        value: {text: other}\n    content:\n",
            "xml_path_collision",
        ),
    ] {
        let changed = source.replace(from, to);
        let module = parse_source("typed.yaml", &changed);
        assert_eq!(link(&[module]).unwrap_err()[0].code, code);
    }
}

#[test]
fn optional_match_can_restore_a_missing_collection_without_losing_absence() {
    let source =
        include_str!("../../../../tests/declaration-corpus/valid/name-text-transform.yaml")
            .to_owned()
            + r#"
inputs:
  defaultLanguage: {type: {kind: scalar, scalar: text}}
  ownerName: {type: {kind: scalar, scalar: text}}
presence:
  - target: self
    yaml:
      missing:
        denotes:
          match:
            value: {transform: {local: name-words, value: {input: ownerName}}}
            present:
              as: words
              then:
                sequence:
                  - record:
                      language: {input: defaultLanguage}
                      content: {var: words}
            absent: {absent: true}
"#;
    let start = source.find("inputs:\n").unwrap();
    let end = source.find("types:\n").unwrap();
    let source = format!("{}{}", &source[..start], &source[end..]);
    let module = parse_source("missing-name.yaml", &source);
    let program = link(&[module]).expect("known absence remains an optional collection");
    assert!(matches!(
        program.entries[0].presence[0]
            .yaml_missing
            .as_ref()
            .unwrap()
            .value_type,
        nkdk_rule_model::LinkedType::Optional(_)
    ));
}

#[test]
fn nested_expression_bindings_cannot_shadow_outer_names() {
    let source = include_str!("../../../../tests/declaration-corpus/valid/i8n-text-core.yaml")
        .to_owned()
        + r#"
constraints:
  - id: scope
    appliesTo: [yaml-validation]
    assert:
      each:
        in: {self: true}
        as: translation
        where:
          exists:
            in: {self: true}
            as: translation
            where: {literal: true}
    diagnostic:
      severity: error
      at: {self: true}
      message: scope
"#;
    let module = parse_source("shadow.yaml", &source);
    assert_eq!(link(&[module]).unwrap_err()[0].code, "duplicate_variable");
}

#[test]
fn integrated_i8n_profile_links_presence_names_patterns_and_typed_xml() {
    let source = include_bytes!("../../../declarations/common/i8n-text.yaml");
    let module = parse(SourceFile {
        path: "integrated.yaml",
        bytes: source,
    })
    .unwrap();
    let program = link(&[module]).expect("integrated declarative profile");
    let entry = &program.entries[0];
    assert_eq!(entry.parameters.len(), 4);
    assert_eq!(entry.shorthands.len(), 3);
    assert_eq!(entry.text_transforms.len(), 1);
    assert_eq!(
        entry
            .constraints
            .iter()
            .filter(|constraint| constraint
                .applies_to
                .contains(&nkdk_rule_model::ValidationPhase::YamlValidation))
            .map(|constraint| constraint.id.as_str())
            .collect::<Vec<_>>(),
        ["yaml-language-order", "yaml-language-value"]
    );

    assert!(entry.presence[0].yaml_missing.is_some());
    assert!(entry.presence[0].yaml_omit_when.is_some());
    assert!(matches!(
        entry.xml,
        nkdk_rule_model::LinkedXml::WithAttributes { .. }
    ));
}

#[test]
fn scalar_shorthand_requires_a_recoverable_structural_capture() {
    let source = include_str!("../../../../tests/declaration-corpus/valid/i8n-text-core.yaml");
    for replacement in [
        "{literal: constant}",
        "{if: {literal: true}, then: {capture: text}, else: {literal: fallback}}",
    ] {
        let changed = source.replace("{capture: text}", replacement);
        let module = parse_source("reverse.yaml", &changed);
        assert_eq!(
            link(&[module]).unwrap_err()[0].code,
            "noninvertible_shorthand"
        );
    }
    let literal = r#"format: nkdk-declarations/1
kind: value
id: test.literal-alias
inputs: {mode: {type: {kind: scalar, scalar: text}}}
value: {kind: record, fields: [{name: text, type: {kind: scalar, scalar: text}}]}
representations:
  xml: {kind: record, fields: [{field: text, path: [Text]}]}
  yaml:
    kind: mapping
    fields: [{field: text, key: Text}]
    shorthand:
    - id: alias
      representation: {kind: scalar, literal: Alias}
      canonical: false
      when: {eq: [{input: mode}, {literal: enabled}]}
      denotes: {record: {text: {literal: complete}}}
"#;
    let linked = link(&[parse_source("alias.yaml", literal)]).unwrap();
    assert!(!linked.entries[0].shorthands[0].canonical);
    assert!(
        matches!(&linked.entries[0].shorthands[0].representation, nkdk_rule_model::LinkedShorthandRepresentation::ScalarLiteral(text) if text=="Alias")
    );
    let projection = literal
        .replace(
            "{kind: scalar, literal: Alias}",
            "{kind: scalar, scalar: text, field: text}",
        )
        .replace("      denotes: {record: {text: {literal: complete}}}\n", "");
    let projected = link(&[parse_source("projection.yaml", &projection)]).unwrap();
    assert!(matches!(
        &projected.entries[0].shorthands[0].representation,
        nkdk_rule_model::LinkedShorthandRepresentation::ScalarField(0)
    ));
    assert_catalog_error(
        &projection.replace("field: text}", "field: missing}"),
        "unknown_field",
    );
    let mapping = projection.replace(
        "{kind: scalar, scalar: text, field: text}",
        "{kind: mapping, field: text}",
    );
    let projected = link(&[parse_source("mapping-projection.yaml", &mapping)]).unwrap();
    assert!(matches!(
        &projected.entries[0].shorthands[0].representation,
        nkdk_rule_model::LinkedShorthandRepresentation::MappingField(0)
    ));
    assert_catalog_error(
        &literal.replace("{literal: complete}", "{capture: unused}"),
        "unknown_capture",
    );
    let invalid = literal.replace("canonical: false", "canonical: later");
    assert!(
        parse(SourceFile {
            path: "invalid.yaml",
            bytes: invalid.as_bytes()
        })
        .is_err()
    );
}

#[test]
fn composition_preserves_canonical_attributes_and_substitutes_conditions() {
    use nkdk_rule_model::{LinkedExpressionKind, LinkedXml, ScalarLiteral};
    let fragment = r#"format: nkdk-declarations/1
kind: fragment
id: common.decorated
parameters:
  enabled: {type: {kind: scalar, scalar: boolean}, default: true}
value: {kind: record, fields: []}
representations:
  xml:
    kind: with-attributes
    attributes: [{name: fragment, value: {text: yes}, when: {parameter: enabled}}]
    content: {kind: record, fields: []}
  yaml: {kind: mapping, fields: []}
"#;
    let owner = r#"format: nkdk-declarations/1
kind: object
id: applied.decorated
imports: {body: common.decorated}
compose: [{use: body, with: {enabled: false}}]
value: {kind: record, fields: []}
representations:
  xml:
    kind: with-attributes
    attributes: [{name: owner, value: {text: yes}}]
    content: {kind: record, fields: []}
  yaml: {kind: mapping, fields: []}
"#;
    let parse_pair = |owner: &str| {
        [("fragment.yaml", fragment), ("owner.yaml", owner)].map(|(path, text)| {
            parse(SourceFile {
                path,
                bytes: text.as_bytes(),
            })
            .unwrap()
        })
    };
    let result = link(&parse_pair(owner)).expect("decorated fragments compose");
    let entry = result
        .entries
        .iter()
        .find(|entry| entry.name == "applied.decorated")
        .unwrap();
    let mut xml = &entry.xml;
    let mut attributes = vec![];
    while let LinkedXml::WithAttributes {
        attributes: current,
        content,
    } = xml
    {
        attributes.extend(current);
        xml = content;
    }
    assert_eq!(
        attributes
            .iter()
            .map(|attribute| attribute.name.local.as_str())
            .collect::<Vec<_>>(),
        ["fragment", "owner"]
    );
    assert_eq!(
        attributes[0].when.as_ref().unwrap().kind,
        LinkedExpressionKind::Literal(ScalarLiteral::Boolean(false))
    );
    assert!(matches!(xml, LinkedXml::Record(fields) if fields.is_empty()));
    let errors = link(&parse_pair(&owner.replace("name: owner", "name: fragment"))).unwrap_err();
    assert!(
        errors
            .iter()
            .any(|error| error.code == "xml_path_collision" && !error.related.is_empty())
    );
}

#[test]
fn imported_collection_and_sibling_attribute_share_xml_wrapper_without_overlapping_ownership() {
    // Public mappings may be siblings even when their XML collections share
    // a wrapper. Ownership belongs to the distinct repeated child routes.
    let shared = r#"
format: nkdk-declarations/1
kind: catalog
declarations:
- kind: value
  id: test.shared-row
  value: {kind: record, fields: [{name: name, type: {kind: scalar, scalar: text}}]}
  representations:
    xml: {kind: record, fields: [{field: name, path: [], attribute: name}]}
    yaml: {kind: mapping, fields: [{field: name, key: Имя}]}
- kind: value
  id: test.shared-first
  imports: {row: test.shared-row}
  value: {kind: sequence, item: {use: row}}
  representations:
    xml: {kind: element-sequence, path: [First], item: {kind: declared}}
    yaml: {kind: record-mapping, key: name}
- kind: value
  id: test.shared-second
  imports: {row: test.shared-row}
  value: {kind: sequence, item: {use: row}}
  representations:
    xml: {kind: element-sequence, path: [Second], item: {kind: declared}}
    yaml: {kind: record-mapping, key: name}
- kind: object
  id: test.shared-owner
  imports: {first: test.shared-first, second: test.shared-second}
  value: {kind: record, fields: [{name: first, type: {use: first}}, {name: second, type: {use: second}}]}
  representations:
    xml: {kind: record, fields: [{field: first, path: [Entries]}, {field: second, path: [Entries]}]}
    yaml: {kind: mapping, fields: [{field: first, key: Первые}, {field: second, key: Вторые}]}
"#;
    let modules = parse_many(SourceFile {
        path: "shared-wrapper.yaml",
        bytes: shared.as_bytes(),
    })
    .unwrap();
    let program = link(&modules).expect("distinct repeated children share only the wrapper");
    generate(&program).expect("shared wrapper is supported by the AOT backend");
    let collision = shared.replace("path: [Second]", "path: [First]");
    let modules = parse_many(SourceFile {
        path: "shared-collision.yaml",
        bytes: collision.as_bytes(),
    })
    .unwrap();
    assert!(
        link(&modules)
            .expect_err("the same repeated child cannot have two owners")
            .iter()
            .any(|error| error.code == "xml_path_collision")
    );
    let formatted =
        include_str!("../../../../tests/declaration-corpus/valid/formatted-i8n-text-core.yaml");
    let text = include_str!("../../../../tests/declaration-corpus/valid/i8n-text-core.yaml");
    let boolean = include_str!("../../../declarations/common/boolean-flag.yaml");
    let check = |formatted: &str, text: &str| {
        let source = [
            ("formatted.yaml", formatted),
            ("text.yaml", text),
            ("boolean.yaml", boolean),
        ]
        .map(|(path, text)| {
            parse(SourceFile {
                path,
                bytes: text.as_bytes(),
            })
            .unwrap()
        });
        link(&source)
    };
    assert!(
        check(formatted, text).is_ok(),
        "imported children and parent attribute have distinct ownership: {:?}",
        check(formatted, text)
    );
    let invalid_attribute = formatted.replace(
        "type: {use: boolean}",
        "type: {use: text, bind: {defaultLanguage: {input: defaultLanguage}}}",
    );
    assert!(
        check(&invalid_attribute, text)
            .expect_err("collection cannot be an attribute")
            .iter()
            .any(|error| error.code == "invalid_attribute_type")
    );
    for replacement in [
        "        path: [v8:item]",
        "        path: [v8:item]\n        attribute: formatted",
    ] {
        let conflicting = formatted
            .replace(
                "imports:\n",
                "namespaces:\n  v8: http://v8.1c.ru/8.1/data/core\nimports:\n",
            )
            .replace(
                "        path: []\n        attribute: formatted",
                replacement,
            );
        let errors = check(&conflicting, text)
            .expect_err("repeated element and its attributes have one owner");
        assert!(
            errors
                .iter()
                .any(|error| error.code == "xml_path_collision" && !error.related.is_empty())
        );
    }
}

#[test]
fn boolean_value_can_be_represented_by_reversible_absence_instead_of_a_literal() {
    let source = include_str!("../../../declarations/common/boolean-flag.yaml");
    let check = |source: &str| {
        let module = parse_source("flag.yaml", source);
        link(&[module])
    };
    assert!(
        check(source).is_ok(),
        "false is restored from absence: {:?}",
        check(source)
    );
    for invalid in [
        source.replace(
            "missing: {denotes: {literal: false}}",
            "missing: {denotes: {literal: true}}",
        ),
        source.replace("omitWhen: {not: {self: true}}", "omitWhen: {self: true}"),
        source.replace("      omitWhen: {not: {self: true}}\n", ""),
    ] {
        let errors = check(&invalid).expect_err("unrepresented value cannot be recovered");
        assert!(
            errors
                .iter()
                .any(|error| error.code == "unrepresented_boolean_value")
        );
    }
}

#[test]
fn enum_tables_are_total_and_unambiguous() {
    let states = include_str!("fixtures/finite-states.yaml");
    let check_states = |source: &str| {
        nkdk_rule_compiler::parse(nkdk_rule_compiler::SourceFile {
            path: "states.yaml",
            bytes: source.as_bytes(),
        })
        .and_then(|module| nkdk_rule_compiler::link(&[module]).map(|_| ()))
    };
    check_states(states).unwrap();
    let owner = include_str!("fixtures/finite-state-owner.yaml");
    let conflicting_owner = format!("{owner}  yaml: {{default: {{literal: empty}}}}\n");
    let parse = |source: &str| {
        nkdk_rule_compiler::parse(nkdk_rule_compiler::SourceFile {
            path: "state-owner.yaml",
            bytes: source.as_bytes(),
        })
        .unwrap()
    };
    let projections = owner.replace(
        "{absent: true}",
        "{if: {literal: true}, then: {literal: tagged}, else: {literal: default}}",
    );
    nkdk_rule_compiler::link(&[parse(states), parse(&projections)]).unwrap();
    let fragment = projections.replace("kind: object", "kind: fragment");
    let composed = r#"format: nkdk-declarations/1
kind: object
id: test.composed-state
imports: {part: test.finite-states}
compose: [{use: part}]
value: {kind: record, fields: []}
representations:
  xml: {kind: record, fields: []}
  yaml: {kind: mapping, fields: []}
"#;
    nkdk_rule_compiler::link(&[parse(states), parse(&fragment), parse(composed)])
        .expect("state presence must survive composition without being inherited twice");
    for (from, to, code) in [
        (
            "then: {literal: tagged}",
            "then: {literal: missing}",
            "unknown_enum_literal",
        ),
        (
            "then: {literal: tagged}",
            "then: {literal: true}",
            "expression_type_mismatch",
        ),
    ] {
        let invalid = projections.replace(from, to);
        let errors = nkdk_rule_compiler::link(&[parse(states), parse(&invalid)]).unwrap_err();
        assert!(errors.iter().any(|error| error.code == code), "{errors:?}");
    }
    let errors = nkdk_rule_compiler::link(&[parse(states), parse(&conflicting_owner)]).unwrap_err();
    assert!(
        errors
            .iter()
            .any(|error| error.code == "conflicting_state_presence")
    );

    for invalid in [
        states.replace("literal: ''", "form: empty"),
        states.replace("form: absent", "form: absent, tag: проверять"),
        states.replace("    - {value: text, literal: '', tag: проверять}\n", ""),
        states.replace("tag: проверять", "tag: xml"),
    ] {
        assert!(
            check_states(&invalid).is_err(),
            "Invalid state table accepted"
        );
    }
    let source = include_str!("../../../../tests/declaration-corpus/valid/code-type-enum.yaml");
    let module = nkdk_rule_compiler::parse(nkdk_rule_compiler::SourceFile {
        path: "enum.yaml",
        bytes: source.as_bytes(),
    })
    .unwrap();
    assert!(nkdk_rule_compiler::link(&[module]).is_ok());
    for source in [
        source.replace("name: textual", "name: numeric"),
        source.replace(
            "name: textual, value: String",
            "name: textual, value: Number",
        ),
        source.replace("literal: Строка", "literal: Число"),
        source.replace("value: String, text: String", "value: Other, text: String"),
        source.replace("      - {value: Auto, literal: Авто}\n", ""),
    ] {
        let result = nkdk_rule_compiler::parse(nkdk_rule_compiler::SourceFile {
            path: "enum.yaml",
            bytes: source.as_bytes(),
        })
        .and_then(|module| nkdk_rule_compiler::link(&[module]).map(|_| ()));
        assert!(result.is_err(), "Ambiguous or incomplete enum accepted");
    }
}

#[test]
fn decimal_boundaries_and_enum_literals_are_typed_before_generation() {
    let sources = [
        (
            "enum.yaml",
            include_str!("../../../../tests/declaration-corpus/valid/code-type-enum.yaml"),
        ),
        (
            "decimal.yaml",
            include_str!("../../../../tests/declaration-corpus/valid/exact-decimal.yaml"),
        ),
        (
            "owner.yaml",
            include_str!("../../../../tests/declaration-corpus/valid/numeric-bound.yaml"),
        ),
    ];
    let modules = sources.map(|(path, source)| {
        nkdk_rule_compiler::parse(nkdk_rule_compiler::SourceFile {
            path,
            bytes: source.as_bytes(),
        })
        .unwrap()
    });
    nkdk_rule_compiler::link(&modules).expect("valid numeric contract");
    for (literal, expected) in [
        ("String", None),
        ("Unknown", Some("unknown_enum_literal")),
        ("true", Some("expression_type_mismatch")),
    ] {
        let source = format!(
            "{}\npresence:\n- target: {{field: codeType}}\n  xml: {{missing: {{denotes: {{absent: true}}}}}}\n  yaml: {{default: {{literal: {literal}}}}}\n",
            sources[2].1
        );
        let mut changed = modules.clone();
        changed[2] = nkdk_rule_compiler::parse(nkdk_rule_compiler::SourceFile {
            path: "owner.yaml",
            bytes: source.as_bytes(),
        })
        .unwrap();
        let result = nkdk_rule_compiler::link(&changed);
        if let Some(code) = expected {
            assert!(result.unwrap_err().iter().any(|error| error.code == code));
        } else {
            result.expect("enum default inherits its property type");
        }
    }

    for bad in [
        sources[2].1.replace("literal: Number", "literal: Unknown"),
        sources[2].1.replace("literal: 38", "literal: '38'"),
        sources[2].1.replace("field: codeLength", "field: missing"),
    ] {
        let mut changed = modules.clone();
        changed[2] = nkdk_rule_compiler::parse(nkdk_rule_compiler::SourceFile {
            path: "owner.yaml",
            bytes: bad.as_bytes(),
        })
        .unwrap();
        assert!(nkdk_rule_compiler::link(&changed).is_err());
    }
}

#[test]
fn forwarded_static_parameters_require_a_declared_parameter_of_the_same_type() {
    let common = include_str!("../../../declarations/common/formatted-i8n-text.yaml");
    for (source, expected) in [
        (common.to_owned(), None),
        (
            common.replace(
                "typedXML: {parameter: typedXML}",
                "typedXML: {parameter: missing}",
            ),
            Some("unknown_parameter"),
        ),
        (
            common
                .replace(
                    "parameters:\n",
                    "parameters:\n  wrong: {type: {kind: scalar, scalar: text}, default: wrong}\n",
                )
                .replace(
                    "typedXML: {parameter: typedXML}",
                    "typedXML: {parameter: wrong}",
                ),
            Some("parameter_type_mismatch"),
        ),
    ] {
        let modules = [
            ("composite", source.as_str()),
            (
                "text",
                include_str!("../../../declarations/common/i8n-text.yaml"),
            ),
            (
                "flag",
                include_str!("../../../declarations/common/boolean-flag.yaml"),
            ),
        ]
        .map(|(path, source)| {
            parse(SourceFile {
                path,
                bytes: source.as_bytes(),
            })
            .unwrap()
        });
        let result = link(&modules);
        if let Some(code) = expected {
            assert_eq!(result.unwrap_err()[0].code, code);
        } else {
            result.unwrap();
        }
    }
}

#[test]
fn scalar_choice_rejects_ambiguous_or_unreachable_selectors() {
    let source = include_str!("../../../declarations/common/predefined-code.yaml");
    for (invalid, code) in [
        (
            source.replace("xs:integer", "xs:decimal"),
            "ambiguous_choice_selector",
        ),
        (
            source.replace("emit: xs:decimal", "emit: xs:string"),
            "invalid_choice_emit",
        ),
        (
            source.replace("otherwise: text", "otherwise: number"),
            "invalid_choice_coverage",
        ),
        (
            source.replace("attribute: xsi:type", "attribute: xs:type"),
            "unsupported_choice_selector",
        ),
    ] {
        assert_link_error("choice.yaml", &invalid, code);
    }
}

#[test]
fn discriminated_choice_validates_variant_coverage_and_qnames() {
    let source = r#"format: nkdk-declarations/1
kind: catalog
declarations:
- kind: value
  id: test.left
  value: {kind: scalar, scalar: text}
  representations: {xml: {kind: text}, yaml: {kind: scalar, scalar: text}}
- kind: value
  id: test.right
  value: {kind: scalar, scalar: text}
  representations: {xml: {kind: text}, yaml: {kind: scalar, scalar: text}}
- kind: value
  id: test.choice
  namespaces: {xsi: 'http://www.w3.org/2001/XMLSchema-instance', xs: 'http://www.w3.org/2001/XMLSchema'}
  imports: {left: test.left, right: test.right}
  value: {kind: choice, variants: [{name: left, type: {use: left}}, {name: right, type: {use: right}}]}
  representations:
    xml:
      kind: choice
      attribute: xsi:type
      variants:
      - {variant: left, in: [xs:string], emit: xs:string}
      - {variant: right, in: [xs:boolean], emit: xs:boolean}
      otherwise: left
    yaml: {kind: choice}
"#;
    let modules = parse_many(SourceFile {
        path: "choice.yaml",
        bytes: source.as_bytes(),
    })
    .unwrap();
    link(&modules).unwrap();
    for (invalid, code) in [
        (
            source.replace("variant: right", "variant: missing"),
            "unknown_choice_variant",
        ),
        (
            source.replace(
                "xs:boolean], emit: xs:boolean",
                "xs:string], emit: xs:string",
            ),
            "ambiguous_choice_selector",
        ),
        (
            source.replace("otherwise: left", "otherwise: missing"),
            "unknown_choice_variant",
        ),
        (
            source.replace(", emit: xs:boolean", ""),
            "invalid_choice_emit",
        ),
    ] {
        assert_catalog_error(&invalid, code);
    }
}

#[test]
fn qname_overlap_is_allowed_only_for_distinct_declared_input_profiles() {
    let source = r#"format: nkdk-declarations/1
kind: catalog
declarations:
- kind: value
  id: test.text-a
  value: {kind: scalar, scalar: text}
  representations: {xml: {kind: text}, yaml: {kind: scalar, scalar: text}}
- kind: value
  id: test.text-b
  value: {kind: scalar, scalar: text}
  representations: {xml: {kind: text}, yaml: {kind: scalar, scalar: text}}
- kind: value
  id: test.profiled-choice
  namespaces: {xsi: 'http://www.w3.org/2001/XMLSchema-instance', xs: 'http://www.w3.org/2001/XMLSchema'}
  imports: {a: test.text-a, b: test.text-b}
  inputs: {profile: {type: {kind: scalar, scalar: text}}}
  value: {kind: choice, variants: [{name: a, type: {use: a}}, {name: b, type: {use: b}}]}
  representations:
    xml:
      kind: choice
      attribute: xsi:type
      variants:
      - {variant: a, in: [xs:string], emit: xs:string}
      - {variant: b, in: [xs:string], emit: xs:string}
      otherwise: a
    yaml:
      kind: choice
      variants:
      - {variant: a, form: scalar-input, input: profile, equals: A}
      - {variant: b, form: scalar-input, input: profile, equals: B}
"#;
    let modules = parse_many(SourceFile {
        path: "profiled-choice.yaml",
        bytes: source.as_bytes(),
    })
    .unwrap();
    link(&modules).unwrap();
    assert_catalog_error(
        &source.replace("equals: B", "equals: A"),
        "choice_selector_collision",
    );
    assert_catalog_error(
        &source.replace(
            "- {variant: b, form: scalar-input, input: profile, equals: B}",
            "",
        ),
        "ambiguous_choice_selector",
    );
}

#[test]
fn choice_variant_predicate_is_checked_against_the_declaration() {
    let source = r#"format: nkdk-declarations/1
kind: catalog
declarations:
- kind: value
  id: test.number
  value: {kind: scalar, scalar: number, profile: decimal}
  representations: {xml: {kind: text}, yaml: {kind: scalar, scalar: number}}
- kind: value
  id: test.text
  value: {kind: scalar, scalar: text, pattern: '.*'}
  representations: {xml: {kind: text}, yaml: {kind: scalar, scalar: text}}
- kind: value
  id: test.choice
  imports: {number: test.number, text: test.text}
  value: {kind: choice, variants: [{name: number, type: {use: number}}, {name: text, type: {use: text}}]}
  representations: {xml: {kind: choice}, yaml: {kind: choice}}
- kind: object
  id: test.owner
  imports: {choice: test.choice}
  value: {kind: record, fields: [{name: value, type: {use: choice}}]}
  representations:
    xml: {kind: record, fields: [{field: value, path: [Value]}]}
    yaml: {kind: mapping, fields: [{field: value, key: Значение}]}
  constraints:
  - id: allowed
    appliesTo: [yaml-validation]
    assert: {isVariant: {value: {field: value}, variant: number}}
    diagnostic: {code: test.choice, severity: error, at: {field: value}, message: Unexpected variant}
  - id: text-limit
    appliesTo: [yaml-validation]
    when: {isVariant: {value: {field: value}, variant: text}}
    assert: {textLengthAtMost: {value: {variantValue: {value: {field: value}, variant: text}}, limit: {literal: '10'}}}
    diagnostic: {code: test.length, severity: warning, at: {field: value}, message: Text is too long}
"#;
    let modules = parse_catalog(source);
    let program = link(&modules).expect("declared variant can be tested");
    let owner = program
        .entries
        .iter()
        .find(|entry| entry.name == "test.owner")
        .unwrap();
    assert!(matches!(
        owner.constraints[0].assertion.kind,
        nkdk_rule_model::LinkedExpressionKind::Operation {
            operator: nkdk_rule_model::LinkedOperator::IsVariant(0),
            ..
        }
    ));
    assert!(matches!(
        owner.constraints[1].assertion.kind,
        nkdk_rule_model::LinkedExpressionKind::Operation {
            operator: nkdk_rule_model::LinkedOperator::TextLengthAtMost,
            ..
        }
    ));
    assert_catalog_error(
        &source.replace("variant: number}}", "variant: missing}}"),
        "unknown_choice_variant",
    );
    assert_catalog_error(
        &source.replace(
            "value: {field: value}, variant: number",
            "value: {literal: abc}, variant: number",
        ),
        "expression_type_mismatch",
    );
    assert_catalog_error(
        &source.replace("variant: text}}, limit:", "variant: missing}}, limit:"),
        "unknown_choice_variant",
    );
    assert_catalog_error(
        &source.replace("limit: {literal: '10'}", "limit: {literal: true}"),
        "expression_type_mismatch",
    );
}

#[test]
fn missing_choice_can_construct_a_typed_variant_from_its_declaration() {
    let source = include_str!("../../../declarations/probes/choice-default.yaml");
    let modules = parse_catalog(source);
    let linked = link(&modules).expect("number variant must be constructible");
    generate(&linked).expect("number variant must be generated");
    assert_catalog_error(
        &source.replace(
            "name: number, value: {literal: 0}",
            "name: number, value: {literal: wrong}",
        ),
        "expression_type_mismatch",
    );
    assert_catalog_error(
        &source.replace(
            "name: number, value: {literal: 0}",
            "name: missing, value: {literal: 0}",
        ),
        "unknown_choice_variant",
    );
    let unsupported_omission = source.replace(
        "      omitWhen:\n        and:\n        - {isVariant: {value: {field: value}, variant: number}}\n        - {eq: [{variantValue: {value: {field: value}, variant: number}}, {literal: 0}]}",
        "      omitWhen: {literal: true}",
    );
    assert_ne!(unsupported_omission, source);
    let linked = link(&parse_catalog(&unsupported_omission)).unwrap();
    let errors = generate(&linked).expect_err("unsupported omission must fail compilation");
    assert!(
        errors
            .iter()
            .any(|error| error.code == "unsupported_generation_feature"),
        "{errors:?}"
    );
}

#[test]
fn yaml_choice_structural_selectors_are_checked_at_link_time() {
    let source = r#"format: nkdk-declarations/1
kind: catalog
declarations:
- kind: value
  id: test.mapped
  value: {kind: record, fields: [{name: name, type: {kind: scalar, scalar: text}}]}
  representations:
    xml: {kind: record, fields: [{field: name, path: [Name]}]}
    yaml: {kind: mapping, fields: [{field: name, key: Имя}]}
- kind: value
  id: test.other-mapped
  value: {kind: record, fields: [{name: name, type: {kind: scalar, scalar: text}}]}
  representations:
    xml: {kind: record, fields: [{field: name, path: [OtherName]}]}
    yaml: {kind: mapping, fields: [{field: name, key: Имя}]}
@TEXT_VALUE@
- kind: value
  id: test.choice
  imports: {mapped: test.mapped, text: test.text}
  value:
    kind: choice
    variants:
    - {name: mapped, type: {use: mapped}}
    - {name: text, type: {use: text}}
  representations:
    xml: {kind: choice}
    yaml:
      kind: choice
      variants: [{variant: mapped, form: mapping, key: Имя}]
"#
    .replace(
        "@TEXT_VALUE@",
        include_str!("support/plain-text-declaration.yaml.in"),
    );
    let modules = parse_catalog(&source);
    link(&modules).unwrap();

    let alternative_selectors = source.replace(
        "variants: [{variant: mapped, form: mapping, key: Имя}]",
        "variants: [{variant: mapped, form: mapping, key: Имя, value: Первый}, {variant: mapped, form: mapping, key: Имя, value: Второй}]",
    );
    link(&parse_catalog(&alternative_selectors))
        .expect("one choice variant may have alternative structural selectors");

    let invalid_shape = source.replace(
        "{variant: mapped, form: mapping, key: Имя}",
        "{variant: mapped, form: sequence}",
    );
    assert_catalog_error(&invalid_shape, "choice_selector_shape");
    let projected_sequence = source
        .replace(
            "variants: [{variant: mapped, form: mapping, key: Имя}]",
            "variants: [{variant: mapped, form: sequence}]",
        )
        .replace(
            "imports: {mapped: test.mapped, text: test.text}",
            "imports: {mapped: test.projected-sequence, text: test.text}",
        );
    let projected_sequence = format!(
        "{projected_sequence}{}",
        r#"
- kind: value
  id: test.items
  imports: {item: test.text}
  value: {kind: sequence, item: {use: item}}
  representations:
    xml: {kind: element-sequence, path: [Item]}
    yaml: {kind: sequence}
- kind: value
  id: test.projected-sequence
  imports: {items: test.items}
  value: {kind: record, fields: [{name: items, type: {use: items}}]}
  representations:
    xml: {kind: record, fields: [{field: items, path: []}]}
    yaml: {kind: projection, field: items}
"#
    );
    link(&parse_catalog(&projected_sequence))
        .expect("Sequence selector follows a record projection");
    let singleton = projected_sequence
        .replace("yaml: {kind: sequence}", "yaml: {kind: sequence, singleton: scalar}")
        .replace(
            "variants: [{variant: mapped, form: sequence}]",
            "variants: [{variant: mapped, form: sequence}, {variant: mapped, form: scalar, tag: short}]",
        );
    link(&parse_catalog(&singleton))
        .expect("A projected singleton sequence also admits its scalar item form");
    let scalar_without_shorthand = singleton.replace(", singleton: scalar", "");
    assert_catalog_error(&scalar_without_shorthand, "choice_selector_shape");

    let missing = source.replace(
        "\n      variants: [{variant: mapped, form: mapping, key: Имя}]",
        "",
    );
    assert_catalog_error(&missing, "missing_choice_selector");

    let collision = source
        .replace(
            "imports: {mapped: test.mapped, text: test.text}",
            "imports: {mapped: test.mapped, other: test.other-mapped, text: test.text}",
        )
        .replace(
            "    - {name: text, type: {use: text}}",
            "    - {name: other, type: {use: other}}\n    - {name: text, type: {use: text}}",
        )
        .replace(
            "variants: [{variant: mapped, form: mapping, key: Имя}]",
            "variants: [{variant: mapped, form: mapping, key: Имя}, {variant: other, form: mapping, key: Имя}]",
        );
    assert_catalog_error(&collision, "choice_selector_collision");
}

#[test]
fn mapping_choice_uses_disjoint_enum_labels_and_rejects_collisions() {
    let header = r#"format: nkdk-declarations/1
kind: catalog
declarations:
- {kind: value, id: test.first-enum, enum: {One: Первый}}
- {kind: value, id: test.second-enum, enum: {Two: Второй}}
"#;
    let record = r#"- kind: value
  id: test.first
  imports: {variant: test.first-enum}
  value: {kind: record, fields: [{name: variant, type: {use: variant}}]}
  representations:
    xml: {kind: record, fields: [{field: variant, path: [Variant]}]}
    yaml: {kind: mapping, fields: [{field: variant, key: Вариант}]}
"#;
    let choice = r#"- kind: value
  id: test.choice
  imports: {first: test.first, second: test.second}
  value: {kind: choice, variants: [{name: first, type: {use: first}}, {name: second, type: {use: second}}]}
  representations:
    xml: {kind: choice}
    yaml:
      kind: choice
      variants: [{variant: first, form: mapping, key: Вариант}, {variant: second, form: mapping, key: Вариант}]
"#;
    let source = format!(
        "{header}{record}{}{choice}",
        record.replace("first", "second")
    );
    link(&parse_catalog(&source)).expect("distinct enum labels select distinct records");
    assert_catalog_error(
        &source.replace("Второй", "Первый"),
        "choice_selector_collision",
    );
}

#[test]
fn data_path_profile_checks_members_and_views_against_the_record() {
    let source = r#"format: nkdk-declarations/1
kind: value
id: test.structured
value: {kind: record, fields: [{name: date, type: {kind: scalar, scalar: text}}]}
representations:
  xml: {kind: record, fields: [{field: date, path: [Date]}]}
  yaml: {kind: mapping, fields: [{field: date, key: Дата}]}
dataPath:
  type: Structured
  aliases: [Структура]
  members: [{field: date, internal: Date, terminalTypes: [dateTime]}]
  views: {formConditionalFilter: [date]}
"#;
    let module = parse_source("data-path.yaml", source);
    link(&[module]).expect("mapped member and view are well-defined");
    for (before, after, code) in [
        (
            "field: date, internal",
            "field: missing, internal",
            "data_path_unknown_field",
        ),
        (
            "formConditionalFilter: [date]",
            "formConditionalFilter: [missing]",
            "data_path_view_member",
        ),
        (
            "aliases: [Структура]",
            "aliases: [Structured]",
            "data_path_type_collision",
        ),
    ] {
        let modified = source.replace(before, after);
        let errors = link(&[parse_source("data-path.yaml", &modified)]).unwrap_err();
        assert!(errors.iter().any(|error| error.code == code), "{errors:?}");
    }
}

fn assert_link_error(path: &str, text: &str, code: &str) {
    let module = parse(SourceFile {
        path,
        bytes: text.as_bytes(),
    })
    .unwrap();
    let errors = link(&[module]).unwrap_err();
    assert!(errors.iter().any(|error| error.code == code), "{errors:?}");
}

#[test]
fn identical_scalar_arguments_share_a_deterministic_specialization() {
    let common = include_str!("../../../declarations/common/typed-string.yaml");
    let owner = "format: nkdk-declarations/1\nkind: object\nid: test.scalar-profile\nimports: {text: common.typed-string}\nvalue:\n  kind: record\n  fields:\n    - {name: a, type: {use: text}}\n    - {name: b, type: {use: text, with: {typedXML: true}}}\nrepresentations:\n  xml:\n    kind: record\n    fields:\n      - {field: a, path: [Root, A]}\n      - {field: b, path: [Root, B]}\n  yaml:\n    kind: mapping\n    fields:\n      - {field: a, key: A}\n      - {field: b, key: B}\n";
    let mut modules = [("common", common), ("owner", owner)].map(|(path, text)| {
        parse(SourceFile {
            path,
            bytes: text.as_bytes(),
        })
        .unwrap()
    });
    let program = link(&modules).unwrap();
    modules.reverse();
    assert_eq!(program, link(&modules).unwrap());
    let owner = program
        .entries
        .iter()
        .find(|entry| entry.name == "test.scalar-profile")
        .unwrap();
    let nkdk_rule_model::LinkedType::Record(fields) = &owner.value else {
        panic!("record")
    };
    assert_eq!(fields[0].value, fields[1].value);
    assert_eq!(program.entries.len(), 3);
}

#[test]
fn state_relations_generate_a_total_bidirectional_contract() {
    let source = include_str!("fixtures/state-projections.yaml");
    let owner = parse_source("relation.yaml", source);
    let states = parse(SourceFile {
        path: "states.yaml",
        bytes: include_bytes!("fixtures/finite-states.yaml"),
    })
    .unwrap();
    link(&[owner, states.clone()]).expect("both directions derived from the same table");
    for (from, to, code) in [
        ("    text: [notice]\n", "", "incomplete_state_relation"),
        (
            "tagged: [base, notice]",
            "tagged: [base]",
            "ambiguous_state_relation",
        ),
        ("text: [notice]", "text: [unknown]", "unknown_state_source"),
        (
            "text: [notice]",
            "text: [notice, notice]",
            "duplicate_state_source",
        ),
        (
            "notice: {equals: {literal: Notify}}",
            "notice: {}",
            "invalid_state_source",
        ),
        (
            "    base: {present:",
            "    state: {present:",
            "state_relation_cycle",
        ),
        ("field: state", "field: missing", "unknown_field"),
        (
            "{literal: Notify}",
            "{field: notice}",
            "field_dependency_cycle",
        ),
        (
            "{field: notice, path: [Root, Notice]}",
            "",
            "conflicting_state_projection",
        ),
        (
            "{field: state, key: State}",
            "",
            "conflicting_state_projection",
        ),
        (
            "fields: [{field: base, path:",
            "fields: [{field: state, path: [Root, State]}, {field: base, path:",
            "conflicting_state_projection",
        ),
        (
            "fields: [{field: state, key:",
            "fields: [{field: base, key: Base}, {field: state, key:",
            "conflicting_state_projection",
        ),
        (
            "type: {use: state}",
            "type: {kind: scalar, scalar: text}",
            "invalid_state_relation_target",
        ),
        (
            "{literal: Notify}",
            "{literal: true}",
            "expression_type_mismatch",
        ),
        (
            "state-relations:",
            "presence:\n- target: {field: base}\n  xml: {missing: {denotes: {absent: true}}}\nstate-relations:",
            "conflicting_state_presence",
        ),
    ] {
        let changed = source.replace(from, to);
        let result = parse(SourceFile {
            path: "relation.yaml",
            bytes: changed.as_bytes(),
        })
        .and_then(|owner| link(&[owner, states.clone()]));
        let errors = result.unwrap_err();
        assert!(
            errors.iter().any(|error| error.code == code),
            "{code}: {errors:?}"
        );
    }
    let expanded = include_str!("fixtures/finite-states.yaml")
        .replace(
            "  - {name: Text, value: text}",
            "  - {name: Text, value: text}\n  - {name: Extra, value: extra}",
        )
        .replace(
            "    - {value: text, text: Text}",
            "    - {value: text, text: Text}\n    - {value: extra, text: Extra}",
        )
        .replace(
            "    - {value: text, literal: '', tag: проверять}",
            "    - {value: text, literal: '', tag: проверять}\n    - {value: extra, literal: extra}",
        );
    let states = parse_source("states.yaml", &expanded);
    let owner = parse_source("relation.yaml", source);
    let errors = link(&[owner, states]).unwrap_err();
    assert!(
        errors
            .iter()
            .any(|error| error.code == "incomplete_state_relation_domain"),
        "{errors:?}"
    );
}

#[test]
fn exactly_one_checks_its_input_binding_and_predicate() {
    let source = include_str!("fixtures/borrowed-record-rows.yaml").replace("exists:", "one:");
    for (source, expected) in [
        (source.clone(), None),
        (source.replace("in: {field: rows}", "in: {literal: true}"), Some("expression_type_mismatch")),
        (source.replace("{var: item}", "{var: missing}"), Some("unknown_variable")),
        (source.replace("where:\n              and:\n              - {present: {get: {of: {var: item}, field: name}}}\n              - {eq: [{get: {of: {var: item}, field: name}}, {literal: Second}]}", "where: {literal: invalid}"), Some("expression_type_mismatch")),
    ] {
        let modules = row_contract_modules(&source);
        match (link(&modules), expected) {
            (Ok(_), None) => {},
            (Err(errors), Some(code)) => assert!(errors.iter().any(|error|error.code==code),"{errors:?}"),
            (result, expected) => panic!("Unexpected result: {result:?}; expected {expected:?}"),
        }
    }
}

#[test]
fn selection_exposes_only_the_declared_record_fields_in_its_match_arm() {
    let source = include_str!("fixtures/selected-record-row.yaml");
    for (source, succeeds) in [
        (source.to_owned(), true),
        (
            source.replace(
                "{var: selected}, field: mode",
                "{var: selected}, field: unknown",
            ),
            false,
        ),
        (
            source.replace(
                "absent: {literal: missing}",
                "absent: {get: {of: {var: selected}, field: mode}}",
            ),
            false,
        ),
    ] {
        let modules = row_contract_modules(&source);
        let result = link(&modules);
        assert_eq!(result.is_ok(), succeeds, "{result:?}");
    }
}

fn row_contract_modules(source: &str) -> Vec<nkdk_rule_model::Module> {
    [
        ("owner.yaml", source),
        ("row.yaml", include_str!("fixtures/declared-row.yaml")),
        ("rows.yaml", include_str!("fixtures/declared-rows.yaml")),
    ]
    .into_iter()
    .map(|(path, bytes)| {
        parse(SourceFile {
            path,
            bytes: bytes.as_bytes(),
        })
        .unwrap()
    })
    .collect()
}

#[test]
fn computed_state_sources_keep_directional_ownership() {
    let source = include_str!("fixtures/state-record-relation.yaml");
    let states = parse(SourceFile {
        path: "states.yaml",
        bytes: include_bytes!("fixtures/finite-states.yaml"),
    })
    .unwrap();
    let mut modules = property_state_modules(source);
    modules.push(states.clone());
    link(&modules).unwrap();
    for (replacement, valid) in [
        ("concat: [{sequence: []}, {sequence: []}]", true),
        ("concat: []", true),
        ("concat: [{absent: true}]", false),
        ("concat: [{literal: wrong}]", false),
        ("concat: [{sequence: [{literal: wrong}]}]", false),
    ] {
        let changed=source.replace("then:\n          sequence:\n          - record: {name: {literal: ExtendedConfigurationObject}, mode: {field: notice}}",&format!("then: {{{replacement}}}"));
        assert_ne!(changed, source);
        let mut modules = property_state_modules(&changed);
        modules.push(states.clone());
        let result = link(&modules);
        if valid {
            result.unwrap();
        } else {
            assert!(
                result
                    .expect_err(replacement)
                    .iter()
                    .any(|error| error.code == "expression_type_mismatch")
            );
        }
    }
    for (from, to, expected) in [
        (
            "fields: [{field: base, path:",
            "fields: [{field: notice, path: [Root, Notice]}, {field: base, path:",
            "conflicting_state_projection",
        ),
        (
            "key: State}]",
            "key: State}, {field: notice, key: Notice}]",
            "conflicting_state_projection",
        ),
        (
            "if: {present: {field: rows}}",
            "if: {present: {field: notice}}",
            "field_dependency_cycle",
        ),
        ("field: mode", "field: missing", "unknown_field"),
        (
            "then: {get: {of: {var: selected}, field: mode}}",
            "then: {literal: true}",
            "expression_type_mismatch",
        ),
    ] {
        let changed = source.replace(from, to);
        assert_ne!(changed, source);
        let mut modules = property_state_modules(&changed);
        modules.push(states.clone());
        let errors = link(&modules).unwrap_err();
        assert!(
            errors.iter().any(|error| error.code == expected),
            "{expected}: {errors:?}"
        );
    }
}

fn property_state_modules(source: &str) -> Vec<nkdk_rule_model::Module> {
    [
        ("owner.yaml", source),
        ("row.yaml", include_str!("fixtures/property-state-row.yaml")),
        ("rows.yaml", include_str!("fixtures/property-states.yaml")),
    ]
    .into_iter()
    .map(|(path, source)| {
        parse(SourceFile {
            path,
            bytes: source.as_bytes(),
        })
        .unwrap()
    })
    .collect()
}

#[test]
fn singleton_sequence_spelling_requires_an_unambiguous_scalar_item() {
    let source = include_str!("../../../../tests/declaration-corpus/valid/sequence-singleton.yaml");
    link(&[parse_source("singleton.yaml", source)]).unwrap();
    let marked = include_str!("../../../../tests/declaration-corpus/valid/sequence-item-tags.yaml");
    let outer = r#"
  - kind: value
    id: test.outer-marks
    imports: {lines: common.marked-lines}
    value: {kind: sequence, item: {use: lines}}
    representations:
      xml: {kind: element-sequence, path: [Group]}
      yaml: {kind: sequence, itemTag: outer}
"#;
    for (singleton, error) in [(false, None), (true, Some("sequence_item_tag_collision"))] {
        let inner = if singleton {
            marked.replace(
                "itemTag: изменять}",
                "itemTag: изменять, singleton: scalar, item: {kind: declared}}",
            )
        } else {
            marked.to_owned()
        };
        let catalog = format!("{inner}{outer}");
        assert_link_outcome(
            link(&parse_catalog(&catalog)),
            error,
            "nested marked sequence",
        );
    }

    let ambiguous = format!(
        "{marked}{}",
        outer.replace(
            "kind: sequence, itemTag: outer",
            "kind: sequence, singleton: value"
        )
    );
    assert_link_outcome(
        link(&parse_catalog(&ambiguous)),
        Some("ambiguous_singleton"),
        "nested singleton sequences",
    );

    let profiled = r#"format: nkdk-declarations/1
kind: catalog
declarations:
- kind: value
  id: common.single
  value: {kind: scalar, scalar: text}
  representations: {xml: {kind: text}, yaml: {kind: scalar, scalar: text}}
- kind: value
  id: common.multiple
  value: {kind: sequence, item: {kind: scalar, scalar: text}}
  representations:
    xml: {kind: element-sequence, path: [Part], item: {kind: text}}
    yaml: {kind: sequence, item: {kind: scalar, scalar: text}}
- kind: value
  id: common.selected
  namespaces: {xsi: http://www.w3.org/2001/XMLSchema-instance}
  imports: {single: common.single, multiple: common.multiple}
  inputs: {mode: {type: {kind: scalar, scalar: text}}}
  value: {kind: choice, variants: [{name: single, type: {use: single}}, {name: multiple, type: {use: multiple}}]}
  representations:
    xml: {kind: choice, attribute: xsi:type, variants: [{variant: single, in: [Single], emit: Single}, {variant: multiple, in: [Multiple], emit: Multiple}], otherwise: single}
    yaml: {kind: choice, variants: [{variant: single, form: scalar-input, input: mode, equals: Single}, {variant: multiple, form: input-profile, input: mode, equals: Multiple}]}
- kind: value
  id: common.outer
  imports: {selected: common.selected}
  inputs: {mode: {type: {kind: scalar, scalar: text}}}
  value: {kind: sequence, item: {use: selected, bind: {mode: {input: mode}}}}
  representations:
    xml: {kind: element-sequence, path: [Item]}
    yaml: {kind: sequence, singleton: value}
"#;
    assert_link_outcome(
        link(&parse_catalog(profiled)),
        None,
        "profile disambiguates an item sequence",
    );
    let unprofiled = profiled.replace(
        "form: input-profile, input: mode, equals: Multiple",
        "form: sequence",
    );
    assert_link_outcome(
        link(&parse_catalog(&unprofiled)),
        Some("ambiguous_singleton"),
        "no contextual sequence selector",
    );

    for invalid in [
        source.replace("singleton: scalar", "singleton: scalar, shorthand: [{id: pair, representation: {kind: literal, value: pair}, denotes: {sequence: [{literal: a}, {literal: b}]}}]"),
        source.replace("singleton: scalar, item: {kind: scalar, scalar: text}", "singleton: scalar, item: {kind: mapping, fields: []}"),
    ] {
        let errors = link(&[parse(SourceFile { path: "singleton.yaml", bytes: invalid.as_bytes() }).unwrap()]).unwrap_err();
        assert!(errors.iter().any(|error| error.code == "ambiguous_singleton"), "{errors:?}");
    }
}

#[test]
fn record_projection_allows_fields_restored_on_the_hidden_side() {
    let source = br#"format: nkdk-declarations/1
kind: value
id: common.projected-record
value:
  kind: record
  fields:
  - {name: visible, type: {kind: sequence, item: {kind: scalar, scalar: text}}}
  - {name: xmlValues, type: {kind: sequence, item: {kind: scalar, scalar: text}}}
representations:
  xml: {kind: record, fields: [{field: xmlValues, path: [Value]}]}
  yaml: {kind: projection, field: visible}
presence:
- target: {field: visible}
  xml: {missing: {denotes: {field: xmlValues}}}
- target: {field: xmlValues}
  yaml: {missing: {denotes: {field: visible}}}
"#;
    link(&[parse(SourceFile {
        path: "projection.yaml",
        bytes: source,
    })
    .unwrap()])
    .unwrap();

    let incomplete = std::str::from_utf8(source)
        .unwrap()
        .replace("  yaml: {missing: {denotes: {field: visible}}}\n", "");
    let errors = link(&[parse_source("projection.yaml", &incomplete)]).unwrap_err();
    assert!(
        errors
            .iter()
            .any(|error| error.code == "unrepresented_field"),
        "{errors:?}"
    );
}

#[test]
fn grouped_sequence_requires_distinct_fields_and_marks() {
    let source = "format: nkdk-declarations/1\nkind: object\nid: test.grouped\nvalue: {kind: record, fields: [{name: first, type: {kind: scalar, scalar: text}}, {name: second, type: {kind: scalar, scalar: text}}]}\nrepresentations:\n  xml: {kind: record, fields: [{field: first, path: [Root, First]}, {field: second, path: [Root, Second]}]}\n  yaml: {kind: grouped-sequence, groups: [{field: first}, {field: second, itemTag: дополнительный}]}\n";
    link(&[parse_source("grouped.yaml", source)]).unwrap();
    let selected = "format: nkdk-declarations/1\nkind: value\nid: test.grouped-choice\nimports: {groups: test.grouped}\nvalue: {kind: choice, variants: [{name: first, type: {use: groups}}, {name: second, type: {use: groups}}]}\nrepresentations:\n  xml: {kind: choice, fallback: first}\n  yaml: {kind: choice, variants: [{variant: first, form: sequence}]}\n";
    let grouped = parse_source(
        "grouped.yaml",
        &source.replace("kind: object", "kind: value"),
    );
    link(&[grouped.clone(), parse_source("selector.yaml", selected)]).unwrap();
    let collision = selected.replace(
        "{variant: first, form: sequence}",
        "{variant: first, form: sequence}, {variant: second, form: sequence}",
    );
    assert!(
        link(&[grouped, parse_source("collision.yaml", &collision)])
            .unwrap_err()
            .iter()
            .any(|error| error.code == "choice_selector_collision")
    );
    for (from, to, code) in [
        (
            "{field: second, itemTag: дополнительный}",
            "{field: second}",
            "yaml_group_tag_collision",
        ),
        (
            "{field: second, itemTag: дополнительный}",
            "{field: first, itemTag: дополнительный}",
            "duplicate_representation_field",
        ),
        (
            "{field: second, itemTag: дополнительный}",
            "{field: unknown, itemTag: дополнительный}",
            "unknown_representation_field",
        ),
    ] {
        let modules = [parse_source("grouped.yaml", &source.replace(from, to))];
        let errors = link(&modules).unwrap_err();
        assert!(errors.iter().any(|error| error.code == code), "{errors:?}");
    }
    for tag in ["xml", "xml/raw", "!extra", "bad tag"] {
        assert!(
            parse(SourceFile {
                path: "grouped.yaml",
                bytes: source.replace("дополнительный", tag).as_bytes()
            })
            .is_err()
        );
    }
}

#[test]
fn record_denotations_distinguish_absence_from_wrong_scalar_types() {
    let declaration = include_str!("fixtures/denoted-record-contract.yaml.in")
        .replace("@FLAG_TYPE@", "boolean")
        .replace("@ROW_PRESENCE@", "presence: []")
        .replace("@DENOTATION@", "{record: {label: @LABEL@, flag: @FLAG@}}");
    for (label, flag, valid) in [
        ("{absent: true}", "{literal: false}", true),
        ("{literal: 42}", "{literal: false}", false),
        ("{absent: true}", "{literal: wrong}", false),
    ] {
        let source = declaration
            .replace("@LABEL@", label)
            .replace("@FLAG@", flag);
        let modules = nkdk_rule_compiler::parse_many(SourceFile {
            path: "record-denotations.yaml",
            bytes: source.as_bytes(),
        })
        .unwrap();
        assert_eq!(link(&modules).is_ok(), valid, "label={label}, flag={flag}");
    }
}

#[test]
fn variant_projection_accepts_a_borrowed_record_sequence() {
    let source = r#"format: nkdk-declarations/1
kind: catalog
declarations:
- kind: value
  id: test.row
  value: {kind: record, fields: [{name: label, type: {kind: scalar, scalar: text}}]}
  representations:
    xml: {kind: record, fields: [{field: label, path: [Label]}]}
    yaml: {kind: mapping, fields: [{field: label, key: Label}]}
- kind: value
  id: test.rows
  imports: {row: test.row}
  value: {kind: sequence, item: {use: row}}
  representations:
    xml: {kind: element-sequence, path: [Row]}
    yaml: {kind: sequence, item: {kind: declared}}
- kind: value
  id: test.choice
  imports: {rows: test.rows}
  value: {kind: choice, variants: [{name: rows, type: {use: rows}}]}
  representations:
    xml: {kind: choice, fallback: rows}
    yaml: {kind: choice, variants: [{variant: rows, form: sequence}]}
- kind: object
  id: test.owner
  imports: {choice: test.choice}
  value: {kind: record, fields: [{name: source, type: {use: choice}}]}
  representations:
    xml: {kind: record, fields: [{field: source, path: [Rows]}]}
    yaml: {kind: mapping, fields: [{field: source, key: Rows}]}
  constraints:
  - id: rows
    appliesTo: [xml-import, yaml-validation]
    assert: {exists: {in: {variantValue: {value: {field: source}, variant: rows}}, as: row, where: {literal: true}}}
    diagnostic: {code: test.count, severity: error, at: {field: source}, message: Expected two rows}
"#;
    let modules = nkdk_rule_compiler::parse_many(SourceFile {
        path: "sequence-choice.yaml",
        bytes: source.as_bytes(),
    })
    .unwrap();
    link(&modules).unwrap();
}

#[test]
fn shorthand_profile_guards_prove_boolean_combinations_conservatively() {
    let shorthands = r#"    shorthand:
    - id: field
      canonical: false
      representation: {kind: scalar, field: pair}
      when: CONDITION
    - id: literal
      representation: {kind: scalar, literal: fixed}
      denotes: {record: {pair: {literal: fixed}}}
      when: {eq: [{input: mode}, {literal: C}]}
"#;
    let source = include_str!("fixtures/text-pattern-owner.yaml")
        .replace("id: test.text-pattern", "id: test.profile-shorthands")
        .replace("imports: {pair: common.text-pair}", "inputs:\n  mode: {type: {kind: scalar, scalar: text}}\n  other: {type: {kind: scalar, scalar: text}}")
        .replace("type: {use: pair}", "type: {kind: scalar, scalar: text}")
        .replace("  yaml: {kind: mapping, fields: [{field: pair, key: Pair}]}", &format!("  yaml:\n    kind: mapping\n    fields: [{{field: pair, key: Pair}}]\n{shorthands}"));
    for (condition, accepted) in [
        (
            "{or: [{eq: [{input: mode}, {literal: A}]}, {eq: [{input: mode}, {literal: B}]}]}",
            true,
        ),
        (
            "{or: [{eq: [{input: mode}, {literal: A}]}, {eq: [{input: mode}, {literal: C}]}]}",
            false,
        ),
        (
            "{and: [{eq: [{input: mode}, {literal: A}]}, {eq: [{input: other}, {literal: C}]}]}",
            true,
        ),
        ("{eq: [{input: other}, {literal: A}]}", false),
    ] {
        let module = parse_source("guards.yaml", &source.replace("CONDITION", condition));
        let result = link(&[module]);
        assert_eq!(result.is_ok(), accepted, "{condition}: {result:?}");
        if !accepted {
            assert_eq!(result.unwrap_err()[0].code, "ambiguous_shorthand");
        }
    }
    for (literal, accepted) in [("1.0", false), ("2", true)] {
        let numeric = source
            .replace(
                "mode: {type: {kind: scalar, scalar: text}}",
                "mode: {type: {kind: scalar, scalar: number, profile: decimal}}",
            )
            .replace("CONDITION", "{eq: [{input: mode}, {literal: 1}]}")
            .replace("{literal: C}", &format!("{{literal: {literal}}}"));
        let result = link(&[parse_source("numeric-guards.yaml", &numeric)]);
        assert_eq!(result.is_ok(), accepted, "{literal}: {result:?}");
        if !accepted {
            assert_eq!(result.unwrap_err()[0].code, "ambiguous_shorthand");
        }
    }
}

#[test]
fn composed_records_allow_value_recursion_through_collections() {
    let fields = include_str!("fixtures/recursive-node.yaml")
        .replace("kind: value", "kind: fragment")
        .replace("id: common.node", "id: common.node-fields")
        + "\nconstraints:\n- id: nonempty\n  appliesTo: [xml-import]\n  assert: {present: {field: name}}\n  diagnostic: {code: generic.name, severity: error, at: {field: name}, message: Required}\n";
    let owner = "format: nkdk-declarations/1\nkind: value\nid: common.node\nimports: {fields: common.node-fields}\ncompose: [{use: fields}]\nvalue: {kind: record, fields: []}\nrepresentations: {xml: {kind: record, fields: []}, yaml: {kind: mapping, fields: []}}\n";
    let modules = [
        parse_source("fields.yaml", &fields),
        parse_source("node.yaml", owner),
        parse_source("nodes.yaml", include_str!("fixtures/recursive-nodes.yaml")),
    ];
    link(&modules).expect("composition itself is acyclic; values recurse through a sequence");
}
