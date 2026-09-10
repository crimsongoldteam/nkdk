use nkdk_rule_compiler::{SourceFile, link, parse};

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
        source[1] = parse(SourceFile {
            path: "owner.yaml",
            bytes: text.as_bytes(),
        })
        .unwrap();
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
    source[1] = parse(SourceFile {
        path: "owner.yaml",
        bytes: owner.as_bytes(),
    })
    .unwrap();
    let errors = link(&source).unwrap_err();
    assert_eq!(errors[0].code, "unknown_representation_field");
}

#[test]
fn boolean_tables_must_have_an_unambiguous_reverse() {
    let text = include_str!("fixtures/common.yaml").replace("text: \"false\"", "text: \"true\"");
    let module = parse(SourceFile {
        path: "boolean.yaml",
        bytes: text.as_bytes(),
    })
    .unwrap();
    let errors = link(&[module]).unwrap_err();
    assert_eq!(errors[0].code, "ambiguous_boolean_table");
}

#[test]
fn common_cannot_import_an_applied_owner() {
    let mut source = modules();
    let text = format!(
        "{}\nimports:\n  forbidden: applied.common-module\n",
        include_str!("fixtures/common.yaml")
    );
    source[0] = parse(SourceFile {
        path: "common.yaml",
        bytes: text.as_bytes(),
    })
    .unwrap();
    let errors = link(&source).unwrap_err();
    assert!(
        errors
            .iter()
            .any(|error| error.code == "forbidden_dependency")
    );
}

#[test]
fn composed_field_collision_reports_both_declarations() {
    let mut source = modules();
    let fragment = include_str!("fixtures/owner.yaml")
        .replace("kind: object", "kind: fragment")
        .replace("applied.common-module", "common.fragment");
    let owner = include_str!("fixtures/owner.yaml").replace(
        "  boolean: common.boolean",
        "  boolean: common.boolean\n  fragment: common.fragment",
    ) + "\ncompose:\n  - use: fragment\n";
    source[1] = parse(SourceFile {
        path: "owner.yaml",
        bytes: owner.as_bytes(),
    })
    .unwrap();
    source.push(
        parse(SourceFile {
            path: "fragment.yaml",
            bytes: fragment.as_bytes(),
        })
        .unwrap(),
    );
    let errors = link(&source).unwrap_err();
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
    let first_text = include_str!("fixtures/owner.yaml")
        .replace("kind: object", "kind: fragment")
        .replace("applied.common-module", "common.first");
    let second_text = first_text
        .replace("common.first", "common.second")
        .replace("server", "client")
        .replace("Server", "Client")
        .replace("Сервер", "Клиент");
    let owner_text = "format: nkdk-declarations/1\nkind: object\nid: applied.owner\nimports: {a: common.first, b: common.second}\nvalue: {kind: record, fields: []}\nrepresentations:\n  xml: {kind: record, fields: []}\n  yaml: {kind: mapping, fields: []}\ncompose: [{use: b}, {use: a}]\n";
    let source = vec![
        common,
        parse(SourceFile {
            path: "a.yaml",
            bytes: first_text.as_bytes(),
        })
        .unwrap(),
        parse(SourceFile {
            path: "b.yaml",
            bytes: second_text.as_bytes(),
        })
        .unwrap(),
        parse(SourceFile {
            path: "owner.yaml",
            bytes: owner_text.as_bytes(),
        })
        .unwrap(),
    ];
    let program = link(&source).unwrap();
    let nkdk_rule_model::LinkedType::Record(fields) = &program.entries[0].value else {
        panic!("record expected")
    };
    assert_eq!(
        fields
            .iter()
            .map(|field| field.name.as_str())
            .collect::<Vec<_>>(),
        ["client", "server"]
    );
}

#[test]
fn fragment_composition_cycles_are_rejected() {
    let common = modules().remove(0);
    let a = include_str!("fixtures/owner.yaml")
        .replace("kind: object", "kind: fragment")
        .replace("applied.common-module", "common.a")
        .replace(
            "  boolean: common.boolean",
            "  boolean: common.boolean\n  next: common.b",
        )
        + "\ncompose: [{use: next}]\n";
    let b = a
        .replace("id: common.a", "id: common.b")
        .replace("next: common.b", "next: common.a");
    let errors = link(&[
        common,
        parse(SourceFile {
            path: "a.yaml",
            bytes: a.as_bytes(),
        })
        .unwrap(),
        parse(SourceFile {
            path: "b.yaml",
            bytes: b.as_bytes(),
        })
        .unwrap(),
    ])
    .unwrap_err();
    assert!(errors.iter().any(|error| error.code == "composition_cycle"));
}

#[test]
fn unsupported_behavior_is_not_silently_erased() {
    let source = parse(SourceFile {
        path: "i8n.yaml",
        bytes: include_bytes!(
            "../../../../tests/declaration-corpus/valid/i8n-skip-empty-profile.yaml"
        ),
    })
    .unwrap();
    let errors = link(&[source]).unwrap_err();
    assert!(
        errors
            .iter()
            .any(|error| error.code == "unsupported_link_feature")
    );
}

#[test]
fn mixed_composition_places_fragments_before_own_fields() {
    let mut source = modules();
    let fragment = include_str!("fixtures/owner.yaml")
        .replace("kind: object", "kind: fragment")
        .replace("applied.common-module", "common.fragment")
        .replace("server", "client")
        .replace("Server", "Client")
        .replace("Сервер", "Клиент");
    let owner = include_str!("fixtures/owner.yaml").replace(
        "  boolean: common.boolean",
        "  boolean: common.boolean\n  fragment: common.fragment",
    ) + "\ncompose: [{use: fragment}]\n";
    source[1] = parse(SourceFile {
        path: "owner.yaml",
        bytes: owner.as_bytes(),
    })
    .unwrap();
    source.push(
        parse(SourceFile {
            path: "fragment.yaml",
            bytes: fragment.as_bytes(),
        })
        .unwrap(),
    );
    let program = link(&source).unwrap();
    let entry = &program.entries[0];
    let nkdk_rule_model::LinkedType::Record(fields) = &entry.value else {
        panic!("record expected")
    };
    assert_eq!(
        fields
            .iter()
            .map(|field| field.name.as_str())
            .collect::<Vec<_>>(),
        ["client", "server"]
    );
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
    let mut source = modules();
    let fragment = include_str!("fixtures/owner.yaml")
        .replace("kind: object", "kind: fragment")
        .replace("applied.common-module", "common.fragment")
        .replace("server", "client")
        .replace("Server", "Client")
        .replace("Сервер", "Клиент")
        .replace("[md:Properties, md:Client]", "[md:Properties]");
    let owner = include_str!("fixtures/owner.yaml").replace(
        "  boolean: common.boolean",
        "  boolean: common.boolean\n  fragment: common.fragment",
    ) + "\ncompose: [{use: fragment}]\n";
    source[1] = parse(SourceFile {
        path: "owner.yaml",
        bytes: owner.as_bytes(),
    })
    .unwrap();
    source.push(
        parse(SourceFile {
            path: "fragment.yaml",
            bytes: fragment.as_bytes(),
        })
        .unwrap(),
    );
    let errors = link(&source).unwrap_err();
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
    let module = parse(SourceFile {
        path: "inputs.yaml",
        bytes: text.as_bytes(),
    })
    .unwrap();
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
    let mut source = modules();
    let text = format!(
        "{}\ninputs:\n  enabled: {{type: {{kind: scalar, scalar: boolean}}}}\n",
        include_str!("fixtures/common.yaml")
    );
    source[0] = parse(SourceFile {
        path: "common.yaml",
        bytes: text.as_bytes(),
    })
    .unwrap();
    let errors = link(&source).unwrap_err();
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
            parse(SourceFile {
                path: "common.yaml",
                bytes: common.as_bytes(),
            })
            .unwrap(),
            parse(SourceFile {
                path: "owner.yaml",
                bytes: owner.as_bytes(),
            })
            .unwrap(),
        ];
        let result = link(&source);
        if let Some(code) = expected {
            let errors = result.unwrap_err();
            assert!(
                errors.iter().any(|error| error.code == code),
                "{binding}: {errors:?}"
            );
        } else {
            assert!(result.is_ok(), "{binding}: {result:?}");
        }
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
            parse(SourceFile {
                path: "common.yaml",
                bytes: common.as_bytes(),
            })
            .unwrap(),
            parse(SourceFile {
                path: "owner.yaml",
                bytes: owner.as_bytes(),
            })
            .unwrap(),
        ]);
        assert_eq!(result.is_ok(), accepted, "{result:?}");
    }
}

#[test]
fn field_bindings_reject_cycles_independently_of_field_order() {
    let common = format!(
        "{}\ninputs:\n  enabled: {{type: {{kind: scalar, scalar: boolean}}}}\n",
        include_str!("fixtures/common.yaml")
    );
    for (a, b, accepted) in [("true", "a", true), ("b", "a", false)] {
        for reverse in [false, true] {
            let binding_a = if a == "true" {
                "literal: true".to_owned()
            } else {
                format!("field: {a}")
            };
            let mut fields = [
                format!(
                    "    - name: a\n      type: {{use: boolean, bind: {{enabled: {{{binding_a}}}}}}}\n"
                ),
                format!(
                    "    - name: b\n      type: {{use: boolean, bind: {{enabled: {{field: {b}}}}}}}\n"
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
                parse(SourceFile {
                    path: "common.yaml",
                    bytes: common.as_bytes(),
                })
                .unwrap(),
                parse(SourceFile {
                    path: "owner.yaml",
                    bytes: owner.as_bytes(),
                })
                .unwrap(),
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
    let fragment = include_str!("fixtures/owner.yaml")
        .replace("kind: object", "kind: fragment")
        .replace("applied.common-module", "common.fragment")
        .replace(
            "{use: boolean}",
            "{use: boolean, bind: {enabled: {field: flag}}}",
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
    let prefix = include_str!("fixtures/owner.yaml")
        .replace("kind: object", "kind: fragment")
        .replace("applied.common-module", "common.prefix")
        .replace("{use: boolean}", "{kind: scalar, scalar: boolean}")
        .replace("server", "prefix")
        .replace("Server", "Prefix")
        .replace("Сервер", "Prefix");
    let owner = "format: nkdk-declarations/1\nkind: object\nid: applied.owner\nimports: {prefix: common.prefix, body: common.fragment}\ncompose: [{use: prefix}, {use: body}]\nvalue: {kind: record, fields: []}\nrepresentations:\n  xml: {kind: record, fields: []}\n  yaml: {kind: mapping, fields: []}\n";
    let source = [
        ("common.yaml", common.as_str()),
        ("fragment.yaml", fragment.as_str()),
        ("prefix.yaml", prefix.as_str()),
        ("owner.yaml", owner),
    ]
    .into_iter()
    .map(|(path, text)| {
        parse(SourceFile {
            path,
            bytes: text.as_bytes(),
        })
        .unwrap()
    })
    .collect::<Vec<_>>();
    let program = link(&source).unwrap();
    assert_eq!(
        program.entries[0].field_dependencies,
        vec![vec![], vec![], vec![1]]
    );
}

#[test]
fn static_parameters_require_matching_arguments_or_defaults() {
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
            parse(SourceFile {
                path: "common.yaml",
                bytes: common.as_bytes(),
            })
            .unwrap(),
            parse(SourceFile {
                path: "owner.yaml",
                bytes: owner.as_bytes(),
            })
            .unwrap(),
        ]);
        if let Some(code) = expected {
            assert!(
                result.unwrap_err().iter().any(|error| error.code == code),
                "{default} {arguments}"
            );
        } else {
            assert!(result.is_ok(), "{result:?}");
        }
    }
}

#[test]
fn field_types_cannot_reference_fragments_or_implicit_recursive_values() {
    let fragment = include_str!("fixtures/owner.yaml")
        .replace("kind: object", "kind: fragment")
        .replace("applied.common-module", "common.fragment");
    let owner = include_str!("fixtures/owner.yaml").replace("common.boolean", "common.fragment");
    let mut source = modules();
    source[1] = parse(SourceFile {
        path: "owner.yaml",
        bytes: owner.as_bytes(),
    })
    .unwrap();
    source.push(
        parse(SourceFile {
            path: "fragment.yaml",
            bytes: fragment.as_bytes(),
        })
        .unwrap(),
    );
    let errors = link(&source).unwrap_err();
    assert!(errors.iter().any(|error| error.code == "expected_value"));

    let recursive = include_str!("fixtures/owner.yaml")
        .replace("kind: object", "kind: value")
        .replace("applied.common-module", "common.recursive")
        .replace("common.boolean", "common.recursive");
    let module = parse(SourceFile {
        path: "recursive.yaml",
        bytes: recursive.as_bytes(),
    })
    .unwrap();
    let errors = link(&[module]).unwrap_err();
    assert!(
        errors
            .iter()
            .any(|error| error.code == "recursive_value_type")
    );
}
