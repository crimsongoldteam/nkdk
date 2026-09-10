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
    let text = format!(
        "{}\nconstraints:\n  - id: numeric\n    appliesTo: [yaml-validation]\n    assert: {{lt: [{{literal: 1}}, {{literal: 2}}]}}\n    diagnostic:\n      severity: error\n      at: {{self: true}}\n      message: Invalid\n",
        include_str!("fixtures/common.yaml")
    );
    let source = vec![
        parse(SourceFile {
            path: "common.yaml",
            bytes: text.as_bytes(),
        })
        .unwrap(),
    ];
    let errors = link(&source).unwrap_err();
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
                "{expression}"
            );
        } else {
            assert!(result.is_ok(), "{expression}: {result:?}");
        }
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
        source[1] = parse(SourceFile {
            path: "owner.yaml",
            bytes: text.as_bytes(),
        })
        .unwrap();
        let result = link(&source);
        if let Some(code) = expected {
            assert!(
                result.unwrap_err().iter().any(|error| error.code == code),
                "{assertion} {target}"
            );
        } else {
            assert!(result.is_ok(), "{result:?}");
        }
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
        source[1] = parse(SourceFile {
            path: "owner.yaml",
            bytes: owner.as_bytes(),
        })
        .unwrap();
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
            "{and: [{each: {in: {input: flags}, as: flag, where: {var: flag}}}, {var: flag}]}",
            Some("unknown_variable"),
        ),
    ] {
        let owner = include_str!("fixtures/owner.yaml").replace(
            "{use: boolean}",
            &format!("{{use: boolean, bind: {{enabled: {expression}}}}}"),
        ) + "\ninputs:\n  flags: {type: {kind: sequence, item: {kind: scalar, scalar: boolean}}}\n";
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
                "{expression}"
            );
        } else {
            assert!(result.is_ok(), "{expression}: {result:?}");
        }
    }
}

#[test]
fn occurrence_constraints_preserve_scope_and_message_parts() {
    let mut source = modules();
    let owner = format!(
        "{}\ninputs:\n  translations:\n    type:\n      kind: sequence\n      item:\n        kind: record\n        fields:\n          - name: language\n            type: {{kind: scalar, scalar: text}}\nconstraints:\n  - id: language-check\n    appliesTo: [yaml-validation]\n    forEach: {{in: {{input: translations}}, as: translation}}\n    assert: {{eq: [{{get: {{of: {{var: translation}}, field: language}}}}, {{literal: ru}}]}}\n    diagnostic:\n      severity: error\n      at: {{occurrence: translation, field: language}}\n      message:\n        parts: [Invalid, {{get: {{of: {{var: translation}}, field: language}}}}]\n",
        include_str!("fixtures/owner.yaml")
    );
    source[1] = parse(SourceFile {
        path: "owner.yaml",
        bytes: owner.as_bytes(),
    })
    .unwrap();
    let result = link(&source);
    assert!(result.is_ok(), "{result:?}");
}

#[test]
fn localized_text_declaration_links_collection_constraints_and_shorthand() {
    let text = include_str!("../../../../tests/declaration-corpus/valid/i8n-validation-core.yaml");
    let module = parse(SourceFile {
        path: "i8n.yaml",
        bytes: text.as_bytes(),
    })
    .unwrap();
    let result = link(&[module]);
    assert!(result.is_ok(), "{result:?}");
    let invalid = text.replace("{capture: text}", "{capture: absent}");
    let module = parse(SourceFile {
        path: "i8n.yaml",
        bytes: invalid.as_bytes(),
    })
    .unwrap();
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
    let module = parse(SourceFile {
        path: "i8n.yaml",
        bytes: text.as_bytes(),
    })
    .unwrap();
    let result = link(&[module]);
    assert!(result.is_ok(), "{result:?}");
    let invalid = text.replace("then: {sequence: []}", "then: {literal: false}");
    let module = parse(SourceFile {
        path: "invalid.yaml",
        bytes: invalid.as_bytes(),
    })
    .unwrap();
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
        let module = parse(SourceFile {
            path: "i8n.yaml",
            bytes: text.as_bytes(),
        })
        .unwrap();
        let result = link(&[module]);
        if let Some(code) = expected {
            assert!(result.unwrap_err().iter().any(|error| error.code == code));
        } else {
            assert!(result.is_ok(), "{result:?}");
        }
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
        let module = parse(SourceFile {
            path: "text.yaml",
            bytes: text.as_bytes(),
        })
        .unwrap();
        let errors = link(&[module]).unwrap_err();
        assert!(errors.iter().any(|error| error.code == code), "{errors:?}");
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
        let module = parse(SourceFile {
            path: "text.yaml",
            bytes: text.as_bytes(),
        })
        .unwrap();
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
        let module = parse(SourceFile {
            path: "i8n.yaml",
            bytes: text.as_bytes(),
        })
        .unwrap();
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
    let fragment = include_str!("fixtures/owner.yaml")
        .replace("kind: object", "kind: fragment")
        .replace("applied.common-module", "common.fragment")
        .replace(
            "{use: boolean}",
            "{use: boolean, bind: {enabled: {and: [{parameter: permit}, {input: ready}]}}}",
        )
        + "\ninputs:\n  ready: {type: {kind: scalar, scalar: boolean}}\nparameters:\n  permit: {type: {kind: scalar, scalar: boolean}, default: true}\nconstraints:\n  - id: enabled\n    appliesTo: [yaml-validation]\n    assert: {field: server}\n    diagnostic:\n      severity: error\n      at: {field: server}\n      message: Disabled\npresence:\n  - target: {field: server}\n    xml:\n      missing: {denotes: {parameter: permit}}\n";
    let prefix = include_str!("fixtures/owner.yaml")
        .replace("kind: object", "kind: fragment")
        .replace("applied.common-module", "common.prefix")
        .replace("{use: boolean}", "{kind: scalar, scalar: boolean}")
        .replace("server", "prefix")
        .replace("Server", "Prefix")
        .replace("Сервер", "Prefix");
    let owner = "format: nkdk-declarations/1\nkind: object\nid: applied.owner\nimports: {prefix: common.prefix, body: common.fragment}\ninputs:\n  active: {type: {kind: scalar, scalar: boolean}}\ncompose: [{use: prefix}, {use: body, with: {permit: false}, bind: {ready: {input: active}}}]\nvalue: {kind: record, fields: []}\nrepresentations:\n  xml: {kind: record, fields: []}\n  yaml: {kind: mapping, fields: []}\n";
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
    let entry = &program.entries[0];
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
    let nkdk_rule_model::LinkedExpressionKind::Operation { arguments, .. } =
        &bindings[0].value.kind
    else {
        panic!("conjunction expected")
    };
    assert_eq!(
        arguments[0].kind,
        nkdk_rule_model::LinkedExpressionKind::Literal(nkdk_rule_model::ScalarLiteral::Boolean(
            false
        ))
    );
    assert_eq!(
        arguments[1].kind,
        nkdk_rule_model::LinkedExpressionKind::Input(0)
    );
}

#[test]
fn owner_fields_can_depend_on_composed_fields() {
    let common = format!(
        "{}\ninputs:\n  enabled: {{type: {{kind: scalar, scalar: boolean}}}}\n",
        include_str!("fixtures/common.yaml")
    );
    let fragment = include_str!("fixtures/owner.yaml")
        .replace("kind: object", "kind: fragment")
        .replace("applied.common-module", "common.fragment")
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
    let source = [
        ("common.yaml", common.as_str()),
        ("fragment.yaml", fragment.as_str()),
        ("owner.yaml", owner.as_str()),
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
    let entry = &program.entries[0];
    assert_eq!(entry.field_dependencies, vec![vec![], vec![0]]);
    assert_eq!(
        entry.constraints[0].diagnostic.at,
        nkdk_rule_model::LinkedDiagnosticTarget::Field(1)
    );
}

#[test]
fn composed_constraints_cannot_silently_override_each_other() {
    let first = include_str!("fixtures/owner.yaml")
        .replace("kind: object", "kind: fragment")
        .replace("applied.common-module", "common.first")
        + "\nconstraints:\n  - id: shared\n    appliesTo: [yaml-validation]\n    assert: {literal: true}\n    diagnostic:\n      severity: error\n      at: {self: true}\n      message: Invalid\n";
    let second = first
        .replace("common.first", "common.second")
        .replace("server", "client")
        .replace("Server", "Client")
        .replace("Сервер", "Client");
    let owner = "format: nkdk-declarations/1\nkind: object\nid: applied.owner\nimports: {a: common.first, b: common.second}\ncompose: [{use: a}, {use: b}]\nvalue: {kind: record, fields: []}\nrepresentations:\n  xml: {kind: record, fields: []}\n  yaml: {kind: mapping, fields: []}\n";
    let source = [
        ("common.yaml", include_str!("fixtures/common.yaml")),
        ("a.yaml", first.as_str()),
        ("b.yaml", second.as_str()),
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
        source[1] = parse(SourceFile {
            path: "owner.yaml",
            bytes: text.as_bytes(),
        })
        .unwrap();
        let result = link(&source);
        if let Some(code) = expected {
            assert!(result.unwrap_err().iter().any(|error| error.code == code));
        } else {
            assert!(result.is_ok(), "{result:?}");
        }
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
        source[1] = parse(SourceFile {
            path: "owner.yaml",
            bytes: owner.as_bytes(),
        })
        .unwrap();
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
    let module = parse(SourceFile {
        path: "attributes.yaml",
        bytes: source.as_bytes(),
    })
    .unwrap();
    assert!(link(&[module]).is_ok());
    let default_namespace = source
        .replace(
            "namespaces: {a: urn:test, b: urn:test}",
            "namespaces: {a: urn:test, b: urn:test, \"\": urn:default}",
        )
        .replace("attribute: a:flag", "attribute: flag");
    let module = parse(SourceFile {
        path: "attributes.yaml",
        bytes: default_namespace.as_bytes(),
    })
    .unwrap();
    let program = link(&[module]).unwrap();
    let nkdk_rule_model::LinkedXml::Record(fields) = &program.entries[0].xml else {
        panic!("record")
    };
    assert_eq!(fields[0].attribute.as_ref().unwrap().namespace, "");
    let collision = source.replace("path: [a:flag]", "path: [], attribute: b:flag");
    let module = parse(SourceFile {
        path: "attributes.yaml",
        bytes: collision.as_bytes(),
    })
    .unwrap();
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
        let module = parse(SourceFile {
            path: "unused.yaml",
            bytes: source.as_bytes(),
        })
        .unwrap();
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
