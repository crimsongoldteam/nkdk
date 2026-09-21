use nkdk_rule_compiler::{SourceFile, parse};

#[test]
fn duplicate_keys_report_the_second_occurrence() {
    let errors = parse(SourceFile {
        path: "common/boolean.yaml",
        bytes: b"format: nkdk-declarations/1\nkind: value\nid: first\nid: second\n",
    })
    .expect_err("duplicate must fail");
    assert!(
        errors
            .iter()
            .any(|d| d.code == "duplicate_key" && d.line == 4)
    );
}

#[test]
fn prohibited_yaml_constructs_report_their_source() {
    for (text, code, line) in [
        ("id: &name value\n", "yaml_anchor", 1),
        ("id: !custom value\n", "yaml_tag", 1),
        ("id: &name value\nother: *name\n", "yaml_alias", 2),
        ("value:\n  <<: {}\n", "yaml_merge_key", 2),
        ("id: first\n---\nid: second\n", "multiple_documents", 2),
    ] {
        let errors = parse(SourceFile {
            path: "case.yaml",
            bytes: text.as_bytes(),
        })
        .unwrap_err();
        assert!(
            errors.iter().any(|e| e.code == code && e.line == line),
            "{code}: {errors:?}"
        );
    }
}

#[test]
fn duplicate_audit_keeps_nested_mapping_scopes_and_first_location() {
    let errors = parse(SourceFile {
        path: "nested.yaml",
        bytes: b"entries:\n  - id: one\n    id: two\n  - id: three\n",
    })
    .unwrap_err();
    let duplicates: Vec<_> = errors
        .iter()
        .filter(|e| e.code == "duplicate_key")
        .collect();
    assert_eq!(duplicates.len(), 1);
    assert_eq!((duplicates[0].line, duplicates[0].column), (3, 5));
    assert_eq!(
        (
            duplicates[0].related[0].line,
            duplicates[0].related[0].column
        ),
        (2, 5)
    );
}

#[test]
fn mapping_keys_must_be_strings() {
    for text in [
        "42: value\n",
        "true: value\n",
        "null: value\n",
        "? [a, b]\n: value\n",
    ] {
        let errors = parse(SourceFile {
            path: "keys.yaml",
            bytes: text.as_bytes(),
        })
        .unwrap_err();
        assert!(
            errors
                .iter()
                .any(|e| e.code == "non_string_key" && e.line == 1),
            "{errors:?}"
        );
    }
    let errors = parse(SourceFile {
        path: "quoted.yaml",
        bytes: b"\"42\": value\n",
    })
    .unwrap_err();
    assert!(!errors.iter().any(|e| e.code == "non_string_key"));
}

const TEXT_MODULE: &str = "format: nkdk-declarations/1\nkind: value\nid: common.text\nvalue: {kind: scalar, scalar: text}\nrepresentations:\n  xml: {kind: text}\n  yaml: {kind: scalar, scalar: text}\n";

#[test]
fn parses_a_closed_scalar_declaration() {
    let module = parse(SourceFile {
        path: "text.yaml",
        bytes: TEXT_MODULE.as_bytes(),
    })
    .expect("valid scalar declaration");
    assert_eq!(module.id, "common.text");
}

#[test]
fn unknown_version_and_keys_have_source_diagnostics() {
    for (text, code, line) in [
        (
            TEXT_MODULE.replace("nkdk-declarations/1", "nkdk-declarations/2"),
            "unsupported_format",
            1,
        ),
        (format!("{TEXT_MODULE}unexpected: true\n"), "unknown_key", 8),
        (
            TEXT_MODULE.replace("xml: {kind: text}", "xml: {kind: text, unexpected: true}"),
            "unknown_key",
            6,
        ),
    ] {
        let errors = parse(SourceFile {
            path: "text.yaml",
            bytes: text.as_bytes(),
        })
        .unwrap_err();
        assert!(
            errors.iter().any(|e| e.code == code && e.line == line),
            "{errors:?}"
        );
    }
}

#[test]
fn declarations_reject_native_conversion_escape_hatches() {
    for (name, declaration) in [
        (
            "native",
            TEXT_MODULE.replace(
                "kind: scalar, scalar: text",
                "kind: scalar, scalar: text, native: true",
            ),
        ),
        (
            "operation",
            TEXT_MODULE.replace("xml: {kind: text}", "xml: {kind: text, operation: custom}"),
        ),
        (
            "rust-path",
            format!("{TEXT_MODULE}function: crate::fill_value::convert\n"),
        ),
    ] {
        let errors = parse(SourceFile {
            path: "forbidden.yaml",
            bytes: declaration.as_bytes(),
        })
        .expect_err(name);
        assert!(
            errors.iter().any(|error| error.code == "unknown_key"),
            "{name}: {errors:?}"
        );
    }
}

#[test]
fn declaration_identity_does_not_coerce_a_boolean_to_text() {
    let text = TEXT_MODULE.replace("id: common.text", "id: true");
    let errors = parse(SourceFile {
        path: "text.yaml",
        bytes: text.as_bytes(),
    })
    .unwrap_err();
    assert!(
        errors
            .iter()
            .any(|e| e.code == "expected_string" && e.line == 3)
    );
}

#[test]
fn malformed_and_non_mapping_documents_return_diagnostics() {
    for (bytes, code) in [
        (b"".as_slice(), "empty_document"),
        (b"\xff".as_slice(), "invalid_utf8"),
        (b"[unclosed".as_slice(), "yaml_syntax"),
        (b"[one, two]".as_slice(), "expected_mapping"),
    ] {
        let errors = parse(SourceFile {
            path: "invalid.yaml",
            bytes,
        })
        .unwrap_err();
        assert!(errors.iter().any(|e| e.code == code), "{errors:?}");
    }
}

#[test]
fn parses_the_boolean_declaration_from_the_specification() {
    let bytes = include_bytes!("../../../../tests/declaration-corpus/valid/boolean.yaml");
    let module = parse(SourceFile {
        path: "boolean.yaml",
        bytes,
    })
    .expect("boolean declaration");
    assert_eq!(module.id, "common.boolean");
    let nkdk_rule_model::YamlRepresentation::BooleanTable(values) = module.representations.yaml
    else {
        panic!("expected boolean table")
    };
    assert_eq!(
        values
            .iter()
            .map(|v| (v.value, v.text.as_str()))
            .collect::<Vec<_>>(),
        vec![(true, "Истина"), (false, "Ложь")]
    );
}

#[test]
fn boolean_tables_reject_coercion_and_unknown_fields() {
    let source = include_str!("../../../../tests/declaration-corpus/valid/boolean.yaml");
    for (text, code) in [
        (
            source.replace("value: true", "value: \"true\""),
            "expected_boolean",
        ),
        (
            source.replace("value: false", "value: 0"),
            "expected_boolean",
        ),
        (
            source.replace("literal: Истина", "literal: Истина, unexpected: true"),
            "unknown_key",
        ),
    ] {
        let errors = parse(SourceFile {
            path: "boolean.yaml",
            bytes: text.as_bytes(),
        })
        .unwrap_err();
        assert!(errors.iter().any(|e| e.code == code), "{errors:?}");
    }
}

#[test]
fn declarations_retain_named_imports_and_namespaces() {
    let source = format!(
        "{TEXT_MODULE}imports:\n  shared: common.shared\nnamespaces:\n  v8: https://example.test/core\n"
    );
    let module = parse(SourceFile {
        path: "text.yaml",
        bytes: source.as_bytes(),
    })
    .expect("named bindings");
    assert_eq!(module.imports[0].name, "shared");
    assert_eq!(module.imports[0].value, "common.shared");
    assert_eq!(module.imports[0].source.line, 9);
    assert_eq!(module.namespaces[0].name, "v8");
    assert_eq!(module.namespaces[0].value, "https://example.test/core");
}

#[test]
fn local_types_preserve_record_fields_and_sequence_references() {
    let source = format!(
        "{TEXT_MODULE}types:\n  pair:\n    kind: record\n    fields:\n      - name: content\n        type: {{kind: scalar, scalar: text}}\n  pairs:\n    kind: sequence\n    item: {{local: pair}}\n"
    );
    let module = parse(SourceFile {
        path: "types.yaml",
        bytes: source.as_bytes(),
    })
    .expect("local types");
    assert_eq!(module.types.len(), 2);
    assert_eq!(module.types[0].name, "pair");
    assert_eq!(module.types[1].name, "pairs");
    let nkdk_rule_model::TypeDefinition::Record(fields) = &module.types[0].definition else {
        panic!("record expected")
    };
    assert_eq!(fields[0].name, "content");
    let nkdk_rule_model::TypeDefinition::Sequence(item) = &module.types[1].definition else {
        panic!("sequence expected")
    };
    assert!(
        matches!(item.as_ref(), nkdk_rule_model::TypeDefinition::Local(name) if name == "pair")
    );
}

#[test]
fn parses_record_representations_without_implicit_field_names() {
    let source = "format: nkdk-declarations/1\nkind: value\nid: common.record\nvalue:\n  kind: record\n  fields:\n    - name: content\n      type: {kind: scalar, scalar: text}\nrepresentations:\n  xml:\n    kind: record\n    fields:\n      - field: content\n        path: [Content]\n  yaml:\n    kind: mapping\n    fields:\n      - field: content\n        key: Текст\n";
    let module = parse(SourceFile {
        path: "record.yaml",
        bytes: source.as_bytes(),
    })
    .expect("record declaration");
    assert_eq!(module.id, "common.record");
    let nkdk_rule_model::XmlRepresentation::Record(xml) = module.representations.xml else {
        panic!("XML record expected")
    };
    let nkdk_rule_model::YamlRepresentation::Mapping(yaml) = module.representations.yaml else {
        panic!("YAML mapping expected")
    };
    assert_eq!(xml[0].path, ["Content"]);
    assert_eq!(yaml[0].key, "Текст");
    assert_eq!(xml[0].field, yaml[0].field);
}

#[test]
fn parses_named_collection_representations() {
    let source = "format: nkdk-declarations/1\nkind: value\nid: common.translations\nvalue:\n  kind: sequence\n  item:\n    kind: record\n    fields:\n      - {name: language, type: {kind: scalar, scalar: text}}\n      - {name: content, type: {kind: scalar, scalar: text}}\nrepresentations:\n  xml:\n    kind: element-sequence\n    path: [v8:item]\n    item:\n      kind: record\n      fields:\n        - {field: language, path: [v8:lang]}\n        - {field: content, path: [v8:content]}\n  yaml: {kind: keyed-mapping, key: language, value: content}\n";
    let module = parse(SourceFile {
        path: "collection.yaml",
        bytes: source.as_bytes(),
    })
    .expect("collection declaration");
    assert_eq!(module.id, "common.translations");
    let nkdk_rule_model::XmlRepresentation::ElementSequence { path, item } =
        module.representations.xml
    else {
        panic!("XML collection expected")
    };
    assert_eq!(path, ["v8:item"]);
    assert!(
        matches!(item.as_ref(), nkdk_rule_model::XmlRepresentation::Record(fields) if fields.len() == 2)
    );
    let nkdk_rule_model::YamlRepresentation::KeyedMapping { key, value, .. } =
        module.representations.yaml
    else {
        panic!("keyed mapping expected")
    };
    assert_eq!((key.as_str(), value.as_str()), ("language", "content"));
}

#[test]
fn parses_i8n_core_with_a_declarative_shorthand() {
    let bytes = include_bytes!("../../../../tests/declaration-corpus/valid/i8n-text-core.yaml");
    let module = parse(SourceFile {
        path: "i8n.yaml",
        bytes,
    })
    .expect("I8n core declaration");
    assert_eq!(module.id, "common.i8n-text");
    assert_eq!(module.inputs[0].name, "defaultLanguage");
    let nkdk_rule_model::YamlRepresentation::KeyedMapping { shorthand, .. } =
        module.representations.yaml
    else {
        panic!("keyed mapping expected")
    };
    assert_eq!(shorthand[0].capture, "text");
    let nkdk_rule_model::ExpressionKind::Sequence(items) = &shorthand[0].denotes.kind else {
        panic!("sequence constructor expected")
    };
    assert_eq!(items.len(), 1);
    let nkdk_rule_model::ExpressionKind::Record(fields) = &items[0].kind else {
        panic!("record constructor expected")
    };
    assert!(
        matches!(&fields[0].value.kind, nkdk_rule_model::ExpressionKind::Input(name) if name == "defaultLanguage")
    );
    assert!(
        matches!(&fields[1].value.kind, nkdk_rule_model::ExpressionKind::Capture(name) if name == "text")
    );
}

#[test]
fn shorthand_expressions_reject_ambiguous_or_malformed_syntax() {
    let original = include_str!("../../../../tests/declaration-corpus/valid/i8n-text-core.yaml");
    for (replacement, code) in [
        (
            "{input: defaultLanguage, capture: text}",
            "invalid_expression",
        ),
        ("{}", "invalid_expression"),
        ("{callback: convertLanguage}", "unknown_key"),
        ("{input: true}", "expected_string"),
        ("{sequence: text}", "expected_sequence"),
        ("{record: []}", "expected_mapping"),
    ] {
        let source = original.replace("{input: defaultLanguage}", replacement);
        let errors = parse(SourceFile {
            path: "malformed-shorthand.yaml",
            bytes: source.as_bytes(),
        })
        .expect_err(replacement);
        assert_eq!(errors.len(), 1, "{replacement}: {errors:?}");
        assert_eq!(errors[0].code, code, "{replacement}");
        assert_eq!(errors[0].file, "malformed-shorthand.yaml");
        assert_eq!(errors[0].line, 49, "{replacement}");
        assert!(errors[0].column > 16, "{replacement}");
    }
}

#[test]
fn scalar_literals_preserve_lexical_values() {
    use nkdk_rule_model::{ExpressionKind, ScalarLiteral, YamlRepresentation};
    let original = include_str!("../../../../tests/declaration-corpus/valid/i8n-text-core.yaml");
    for (literal, expected) in [
        ("\"\"", ScalarLiteral::Text(String::new())),
        ("null", ScalarLiteral::Null),
        ("true", ScalarLiteral::Boolean(true)),
        ("false", ScalarLiteral::Boolean(false)),
        (
            "12345678901234567890123456789012345678.90",
            ScalarLiteral::Number("12345678901234567890123456789012345678.90".into()),
        ),
        ("1e400", ScalarLiteral::Number("1e400".into())),
        ("-0.00", ScalarLiteral::Number("-0.00".into())),
        ("\"123\"", ScalarLiteral::Text("123".into())),
        ("\"null\"", ScalarLiteral::Text("null".into())),
    ] {
        let source = original.replace("{capture: text}", &format!("{{literal: {literal}}}"));
        let module = parse(SourceFile {
            path: "literal.yaml",
            bytes: source.as_bytes(),
        })
        .unwrap_or_else(|errors| panic!("{literal}: {errors:?}"));
        let YamlRepresentation::KeyedMapping { shorthand, .. } = module.representations.yaml else {
            panic!("mapping expected")
        };
        let ExpressionKind::Sequence(items) = &shorthand[0].denotes.kind else {
            panic!("sequence expected")
        };
        let ExpressionKind::Record(fields) = &items[0].kind else {
            panic!("record expected")
        };
        assert_eq!(
            fields[1].value.kind,
            ExpressionKind::Literal(expected),
            "{literal}"
        );
    }
}

#[test]
fn literal_rejects_non_decimal_numbers_and_containers() {
    let original = include_str!("../../../../tests/declaration-corpus/valid/i8n-text-core.yaml");
    for (literal, code) in [
        (".nan", "invalid_number"),
        (".inf", "invalid_number"),
        ("-.inf", "invalid_number"),
        ("0xFF", "invalid_number"),
        ("0o77", "invalid_number"),
        ("[]", "expected_scalar"),
        ("{}", "expected_scalar"),
    ] {
        let source = original.replace("{capture: text}", &format!("{{literal: {literal}}}"));
        let errors = parse(SourceFile {
            path: "literal.yaml",
            bytes: source.as_bytes(),
        })
        .expect_err(literal);
        assert_eq!(errors[0].code, code, "{literal}");
        assert_eq!(errors[0].line, 50);
    }
}

#[test]
fn conditional_expression_reads_parameter_and_both_branches() {
    let original = include_str!("../../../../tests/declaration-corpus/valid/i8n-text-core.yaml");
    let source = original.replace(
        "{capture: text}",
        "{if: {parameter: preserveEmpty}, then: {literal: \"\"}, else: {capture: text}}",
    );
    use nkdk_rule_model::{ExpressionKind, ScalarLiteral, YamlRepresentation};
    let module = parse(SourceFile {
        path: "conditional.yaml",
        bytes: source.as_bytes(),
    })
    .expect("conditional expression");
    let YamlRepresentation::KeyedMapping { shorthand, .. } = module.representations.yaml else {
        panic!("mapping expected")
    };
    let ExpressionKind::Sequence(items) = &shorthand[0].denotes.kind else {
        panic!("sequence expected")
    };
    let ExpressionKind::Record(fields) = &items[0].kind else {
        panic!("record expected")
    };
    let ExpressionKind::Conditional {
        condition,
        then_value,
        else_value,
    } = &fields[1].value.kind
    else {
        panic!("conditional expected")
    };
    assert_eq!(
        condition.kind,
        ExpressionKind::Parameter("preserveEmpty".into())
    );
    assert_eq!(
        then_value.kind,
        ExpressionKind::Literal(ScalarLiteral::Text(String::new()))
    );
    assert_eq!(else_value.kind, ExpressionKind::Capture("text".into()));
}

#[test]
fn conditional_requires_explicit_branches_and_closed_shape() {
    let original = include_str!("../../../../tests/declaration-corpus/valid/i8n-text-core.yaml");
    for (expression, code) in [
        ("{if: {literal: true}, then: {literal: 1}}", "missing_key"),
        ("{if: {literal: true}, else: {literal: 1}}", "missing_key"),
        (
            "{if: {literal: true}, then: {literal: 1}, else: {literal: 2}, input: name}",
            "unknown_key",
        ),
        ("{then: {literal: 1}, else: {literal: 2}}", "unknown_key"),
        (
            "{if: true, then: {literal: 1}, else: {literal: 2}}",
            "expected_mapping",
        ),
        ("{parameter: false}", "expected_string"),
    ] {
        let source = original.replace("{capture: text}", expression);
        let errors = parse(SourceFile {
            path: "conditional.yaml",
            bytes: source.as_bytes(),
        })
        .expect_err(expression);
        assert_eq!(errors[0].code, code, "{expression}");
        assert_eq!(errors[0].line, 50);
    }
}

#[test]
fn parses_static_parameter_declarations() {
    let source = format!(
        "{TEXT_MODULE}\nparameters:\n  enabled: {{type: {{kind: scalar, scalar: boolean}}, default: false}}\n  title: {{type: {{kind: scalar, scalar: text}}}}\n"
    );
    let module = parse(SourceFile {
        path: "parameters.yaml",
        bytes: source.as_bytes(),
    })
    .expect("static parameters");
    assert_eq!(module.parameters[0].name, "enabled");
    assert_eq!(
        module.parameters[0].default,
        Some(nkdk_rule_model::ScalarLiteral::Boolean(false))
    );
    assert_eq!(module.parameters[1].default, None);
    assert_eq!(module.parameters[0].source.line, 10);
}

#[test]
fn parameter_defaults_are_static_and_missing_is_distinct_from_null() {
    for (default, code) in [
        ("{input: language}", "expected_scalar"),
        ("[]", "expected_scalar"),
    ] {
        let source = format!(
            "{TEXT_MODULE}\nparameters:\n  title: {{type: {{kind: scalar, scalar: text}}, default: {default}}}\n"
        );
        let errors = parse(SourceFile {
            path: "parameters.yaml",
            bytes: source.as_bytes(),
        })
        .expect_err(default);
        assert_eq!(errors[0].code, code);
    }
    let source = format!(
        "{TEXT_MODULE}\nparameters:\n  title: {{type: {{kind: scalar, scalar: text}}, default: null}}\n"
    );
    let module = parse(SourceFile {
        path: "parameters.yaml",
        bytes: source.as_bytes(),
    })
    .expect("parse precedes type checking");
    assert_eq!(
        module.parameters[0].default,
        Some(nkdk_rule_model::ScalarLiteral::Null)
    );
}

#[test]
fn object_and_fragment_roles_use_the_shared_record_grammar() {
    let original =
        include_str!("../../../../tests/declaration-corpus/valid/common-module-core.yaml");
    for kind in ["object", "fragment"] {
        let source = original.replace("kind: object", &format!("kind: {kind}"));
        let module = parse(SourceFile {
            path: "owner.yaml",
            bytes: source.as_bytes(),
        })
        .expect(kind);
        assert_eq!(
            module.kind,
            if kind == "object" {
                nkdk_rule_model::ModuleKind::Object
            } else {
                nkdk_rule_model::ModuleKind::Fragment
            }
        );
        let nkdk_rule_model::TypeDefinition::Record(fields) = module.value else {
            panic!("record expected")
        };
        assert_eq!(fields[0].name, "server");
        assert!(
            matches!(&fields[0].definition, nkdk_rule_model::TypeDefinition::Use(usage) if usage.name == "boolean")
        );
    }
}

#[test]
fn non_value_roles_require_record_values() {
    for kind in ["object", "fragment", "function"] {
        let source = TEXT_MODULE.replace("kind: value", &format!("kind: {kind}"));
        let errors = parse(SourceFile {
            path: "role.yaml",
            bytes: source.as_bytes(),
        })
        .expect_err(kind);
        assert_eq!(
            errors[0].code,
            if kind == "function" {
                "unsupported_kind"
            } else {
                "expected_record"
            }
        );
    }
}

#[test]
fn parses_whole_collection_guard() {
    let original = include_str!("../../../../tests/declaration-corpus/valid/i8n-text-core.yaml");
    let guard = "{if: {each: {in: {self: true}, as: item, where: {and: [{eq: [{get: {of: {var: item}, field: language}}, {input: defaultLanguage}]}, {eq: [{get: {of: {var: item}, field: content}}, {literal: \"\"}]}]}}}, then: {literal: true}, else: {literal: false}}";
    let source = original.replace("{capture: text}", guard);
    parse(SourceFile {
        path: "guard.yaml",
        bytes: source.as_bytes(),
    })
    .expect("whole collection guard");
}

#[test]
fn xml_presence_can_guard_omission_with_the_complete_collection() {
    let original = include_str!("../../../../tests/declaration-corpus/valid/i8n-text-core.yaml");
    let source = format!(
        "{original}\npresence:\n  - target: self\n    xml:\n      canonical:\n        - when: {{each: {{in: {{self: true}}, as: item, where: {{eq: [{{get: {{of: {{var: item}}, field: content}}}}, {{literal: \"\"}}]}}}}}}\n          form: missing\n        - form: ordinary\n"
    );
    let module = parse(SourceFile {
        path: "presence.yaml",
        bytes: source.as_bytes(),
    })
    .expect("guarded omission");
    assert_eq!(
        module.presence[0].target,
        nkdk_rule_model::PresenceTarget::SelfValue
    );
    assert_eq!(
        module.presence[0].xml_canonical[0].form,
        nkdk_rule_model::XmlForm::Missing
    );
    assert_eq!(
        module.presence[0].xml_canonical[1].form,
        nkdk_rule_model::XmlForm::Ordinary
    );
    assert!(module.presence[0].xml_canonical[1].when.is_none());
}

#[test]
fn corrected_skip_empty_profile_retains_full_sequence_predicate() {
    use nkdk_rule_model::ExpressionKind;
    let module = parse(SourceFile {
        path: "skip-empty.yaml",
        bytes: include_bytes!(
            "../../../../tests/declaration-corpus/valid/i8n-skip-empty-profile.yaml"
        ),
    })
    .expect("corrected profile syntax");
    let condition = module.presence[0].xml_canonical[0].when.as_ref().unwrap();
    let ExpressionKind::And(conditions) = &condition.kind else {
        panic!("and expected")
    };
    let ExpressionKind::Each {
        input, predicate, ..
    } = &conditions[1].kind
    else {
        panic!("each expected")
    };
    assert_eq!(input.kind, ExpressionKind::SelfValue);
    let ExpressionKind::And(checks) = &predicate.kind else {
        panic!("language and content checks expected")
    };
    assert_eq!(checks.len(), 2);
}

#[test]
fn collection_conditions_reject_invalid_arity_and_shapes() {
    let original = include_str!("../../../../tests/declaration-corpus/valid/i8n-text-core.yaml");
    for (expression, code) in [
        ("{and: []}", "invalid_arity"),
        ("{eq: [{literal: 1}]}", "invalid_arity"),
        (
            "{eq: [{literal: 1}, {literal: 2}, {literal: 3}]}",
            "invalid_arity",
        ),
        ("{each: {in: {self: true}, as: item}}", "missing_key"),
        ("{get: {of: {var: item}, field: true}}", "expected_string"),
        ("{self: false}", "invalid_self"),
    ] {
        let source = original.replace("{capture: text}", expression);
        let errors = parse(SourceFile {
            path: "guard.yaml",
            bytes: source.as_bytes(),
        })
        .expect_err(expression);
        assert_eq!(errors[0].code, code, "{expression}");
    }
}

#[test]
fn presence_distinguishes_absent_empty_text_and_null() {
    let source = format!(
        "{TEXT_MODULE}\npresence:\n  - target: self\n    xml:\n      missing: {{denotes: {{absent: true}}}}\n      empty:\n        - {{form: empty-text, denotes: {{literal: \"\"}}}}\n    yaml:\n      missing: {{denotes: {{absent: true}}}}\n      empty:\n        - {{form: null, denotes: {{literal: null}}}}\n      omitWhen: {{literal: false}}\n"
    );
    let module = parse(SourceFile {
        path: "presence.yaml",
        bytes: source.as_bytes(),
    })
    .expect("presence states");
    let presence = &module.presence[0];
    assert_eq!(
        presence.xml_missing.as_ref().unwrap().kind,
        nkdk_rule_model::ExpressionKind::Absent
    );
    assert_eq!(
        presence.xml_empty[0].denotes.kind,
        nkdk_rule_model::ExpressionKind::Literal(nkdk_rule_model::ScalarLiteral::Text(
            String::new()
        ))
    );
    assert_eq!(
        presence.yaml_empty[0].denotes.kind,
        nkdk_rule_model::ExpressionKind::Literal(nkdk_rule_model::ScalarLiteral::Null)
    );
}

#[test]
fn presence_rejects_cross_format_and_unknown_forms() {
    for (side, form) in [
        ("xml", "empty-string"),
        ("yaml", "nil"),
        ("xml", "null"),
        ("yaml", "empty-element"),
    ] {
        let source = format!(
            "{TEXT_MODULE}\npresence:\n  - target: self\n    {side}:\n      empty:\n        - {{form: {form}, denotes: {{literal: null}}}}\n"
        );
        let errors = parse(SourceFile {
            path: "presence.yaml",
            bytes: source.as_bytes(),
        })
        .expect_err(form);
        assert_eq!(errors[0].code, "invalid_empty_form");
    }
}

#[test]
fn parses_empty_sequence_normalization() {
    let original = include_str!("../../../../tests/declaration-corpus/valid/i8n-text-core.yaml");
    let source = format!(
        "{original}\nnormalization:\n  when: {{not: {{parameter: excludeIfEqualNameYAML}}}}\n  from: empty-sequence\n  denotes: {{sequence: [{{record: {{language: {{input: defaultLanguage}}, content: {{literal: \"\"}}}}}}]}}\n"
    );
    parse(SourceFile {
        path: "normalization.yaml",
        bytes: source.as_bytes(),
    })
    .expect("empty normalization");
}

#[test]
fn imported_type_accepts_static_arguments_and_dynamic_bindings() {
    let original =
        include_str!("../../../../tests/declaration-corpus/valid/common-module-core.yaml");
    let source = original.replace("{use: boolean}", "{use: boolean, with: {limit: 12345678901234567890.0123}, bind: {language: {input: defaultLanguage}}}");
    let module = parse(SourceFile {
        path: "binding.yaml",
        bytes: source.as_bytes(),
    })
    .expect("bound import");
    let nkdk_rule_model::TypeDefinition::Record(fields) = module.value else {
        panic!("record expected")
    };
    let nkdk_rule_model::TypeDefinition::Use(usage) = &fields[0].definition else {
        panic!("import expected")
    };
    assert_eq!(
        usage.arguments[0].value,
        nkdk_rule_model::StaticValue::Literal(nkdk_rule_model::ScalarLiteral::Number(
            "12345678901234567890.0123".into()
        ))
    );
    assert_eq!(
        usage.bindings[0].value.kind,
        nkdk_rule_model::ExpressionKind::Input("defaultLanguage".into())
    );
}

#[test]
fn with_rejects_runtime_expressions_and_bind_requires_expression_tree() {
    let original =
        include_str!("../../../../tests/declaration-corpus/valid/common-module-core.yaml");
    for (usage, code) in [
        (
            "{use: boolean, with: {enabled: {input: value}}}",
            "unknown_key",
        ),
        ("{use: boolean, bind: {value: true}}", "expected_mapping"),
        ("{local: boolean, with: {value: true}}", "unknown_key"),
        ("{use: boolean, with: []}", "expected_mapping"),
    ] {
        let source = original.replace("{use: boolean}", usage);
        let errors = parse(SourceFile {
            path: "binding.yaml",
            bytes: source.as_bytes(),
        })
        .expect_err(usage);
        assert_eq!(errors[0].code, code, "{usage}");
    }
}

#[test]
fn constraints_keep_public_diagnostics_separate_from_internal_id() {
    let source = format!(
        "{TEXT_MODULE}\nconstraints:\n  - id: internal-check\n    appliesTo: [yaml-validation]\n    assert: {{literal: false}}\n    diagnostic:\n      severity: error\n      source: structure\n      at: {{self: true}}\n      message: Invalid value\n"
    );
    let module = parse(SourceFile {
        path: "constraints.yaml",
        bytes: source.as_bytes(),
    })
    .expect("constraint declaration");
    assert_eq!(module.constraints[0].id, "internal-check");
    assert!(module.constraints[0].diagnostic.code.is_none());
    assert_eq!(
        module.constraints[0].diagnostic.source.as_deref(),
        Some("structure")
    );
}

#[test]
fn localized_validation_uses_declared_iteration_and_message_parts() {
    let module = parse(SourceFile {
        path: "validation.yaml",
        bytes: include_bytes!(
            "../../../../tests/declaration-corpus/valid/i8n-validation-core.yaml"
        ),
    })
    .expect("localized validation syntax");
    let constraint = &module.constraints[0];
    assert_eq!(constraint.for_each.as_ref().unwrap().binding, "translation");
    assert_eq!(
        constraint.diagnostic.at,
        nkdk_rule_model::DiagnosticTarget::Occurrence {
            name: "translation".into(),
            field: "language".into()
        }
    );
    let nkdk_rule_model::MessageDefinition::Parts(parts) = &constraint.diagnostic.message else {
        panic!("parts expected")
    };
    assert_eq!(parts.len(), 2);
    assert!(constraint.diagnostic.code.is_none());
}

#[test]
fn constraint_diagnostics_reject_unknown_phases_and_ambiguous_addresses() {
    let original =
        include_str!("../../../../tests/declaration-corpus/valid/i8n-validation-core.yaml");
    for (old, new, code) in [
        ("[xml-import]", "[xml-export]", "invalid_validation_phase"),
        ("severity: error", "severity: fatal", "invalid_severity"),
        (
            "{occurrence: translation, field: language}",
            "{self: true, field: language}",
            "unknown_key",
        ),
        ("source: structure", "source: true", "expected_string"),
        (
            "message:\n        parts:",
            "message:\n        callback:",
            "unknown_key",
        ),
    ] {
        let source = original.replace(old, new);
        assert_ne!(source, original);
        let errors = parse(SourceFile {
            path: "diagnostic.yaml",
            bytes: source.as_bytes(),
        })
        .expect_err(new);
        assert_eq!(errors[0].code, code, "{new}");
    }
}

#[test]
fn composition_preserves_explicit_fragment_arguments() {
    let original =
        include_str!("../../../../tests/declaration-corpus/valid/common-module-core.yaml");
    let source = format!(
        "{original}\ncompose:\n  - use: identity\n    with: {{required: true}}\n    bind: {{owner: {{input: ownerName}}}}\n"
    );
    let module = parse(SourceFile {
        path: "composition.yaml",
        bytes: source.as_bytes(),
    })
    .expect("fragment composition");
    assert_eq!(module.compose[0].name, "identity");
    assert_eq!(
        module.compose[0].arguments[0].value,
        nkdk_rule_model::StaticValue::Literal(nkdk_rule_model::ScalarLiteral::Boolean(true))
    );
    assert_eq!(module.compose[0].bindings[0].name, "owner");
}

#[test]
fn value_role_cannot_compose_even_an_empty_fragment_list() {
    let source = format!("{TEXT_MODULE}\ncompose: []\n");
    let errors = parse(SourceFile {
        path: "composition.yaml",
        bytes: source.as_bytes(),
    })
    .expect_err("value composition");
    assert_eq!(errors[0].code, "invalid_composition_role");
}

#[test]
fn comparison_operators_use_explicit_field_references() {
    let original = include_str!("../../../../tests/declaration-corpus/valid/i8n-text-core.yaml");
    for operator in ["lt", "lte"] {
        let source = original.replace(
            "{capture: text}",
            &format!("{{{operator}: [{{field: codeLength}}, {{literal: 38}}]}}"),
        );
        parse(SourceFile {
            path: "comparison.yaml",
            bytes: source.as_bytes(),
        })
        .expect(operator);
    }
}

#[test]
fn presence_rejects_duplicate_targets_forms_and_early_fallback() {
    for (section, code) in [
        (
            "  - target: self\n    xml: {}\n  - target: self\n    xml: {}\n",
            "duplicate_presence_target",
        ),
        (
            "  - target: self\n    yaml:\n      empty:\n        - {form: empty-string, denotes: {literal: \"\"}}\n        - {form: empty-string, denotes: {literal: \"\"}}\n",
            "duplicate_empty_form",
        ),
        (
            "  - target: self\n    xml:\n      canonical:\n        - {form: ordinary}\n        - {when: {literal: true}, form: missing}\n",
            "early_canonical_fallback",
        ),
    ] {
        let source = format!("{TEXT_MODULE}\npresence:\n{section}");
        let errors = parse(SourceFile {
            path: "presence.yaml",
            bytes: source.as_bytes(),
        })
        .expect_err(code);
        assert_eq!(errors[0].code, code);
    }
}

#[test]
fn shorthand_condition_limits_export_without_changing_denotes() {
    let original = include_str!("../../../../tests/declaration-corpus/valid/i8n-text-core.yaml");
    let source = original.replace(
        "      - id: primary-language-string",
        "      - id: primary-language-string\n        when: {literal: true}",
    );
    let module = parse(SourceFile {
        path: "shorthand.yaml",
        bytes: source.as_bytes(),
    })
    .expect("conditional shorthand");
    let nkdk_rule_model::YamlRepresentation::KeyedMapping { shorthand, .. } =
        module.representations.yaml
    else {
        panic!("mapping expected")
    };
    assert_eq!(
        shorthand[0].when.as_ref().unwrap().kind,
        nkdk_rule_model::ExpressionKind::Literal(nkdk_rule_model::ScalarLiteral::Boolean(true))
    );
}

#[test]
fn parses_declarative_name_transform_from_the_specification() {
    let module = parse(SourceFile {
        path: "name-transform.yaml",
        bytes: include_bytes!(
            "../../../../tests/declaration-corpus/valid/name-text-transform.yaml"
        ),
    })
    .expect("declarative text transform");
    let nkdk_rule_model::TypeDefinition::TextTransform(transform) = &module.types[0].definition
    else {
        panic!("text transform expected")
    };
    assert_eq!(
        transform.classes[0].ranges,
        [(65, 90), (1040, 1071), (1025, 1025)]
    );
    assert_eq!(transform.transitions.len(), 7);
    assert_eq!(
        transform.result.no_tokens,
        nkdk_rule_model::EmptyTextResult::Absent
    );
    assert_eq!(
        transform.result.empty_input,
        nkdk_rule_model::EmptyTextResult::EmptyText
    );
}

#[test]
fn text_transform_rejects_invalid_ranges_and_external_context() {
    let original =
        include_str!("../../../../tests/declaration-corpus/valid/name-text-transform.yaml");
    for (old, new, code) in [
        ("[65, 90]", "[90, 65]", "invalid_character_range"),
        ("[65, 90]", "[65, 65536]", "invalid_character_range"),
        ("[65, 90]", "[65.5, 90]", "expected_integer"),
        ("{class: upper}", "{input: ownerName}", "unknown_key"),
        ("units: utf16", "units: unicode", "unsupported_text_units"),
        ("emit: append", "emit: callback", "invalid_text_emit"),
    ] {
        let source = original.replace(old, new);
        assert_ne!(source, original);
        let errors = parse(SourceFile {
            path: "text.yaml",
            bytes: source.as_bytes(),
        })
        .expect_err(new);
        assert_eq!(errors[0].code, code, "{new}");
    }
}

#[test]
fn transform_expression_references_local_data() {
    let original =
        include_str!("../../../../tests/declaration-corpus/valid/name-text-transform.yaml");
    let source = original.replace(
        "{capture: text}",
        "{transform: {local: name-words, value: {input: ownerName}}}",
    );
    parse(SourceFile {
        path: "text.yaml",
        bytes: source.as_bytes(),
    })
    .expect("transform expression");
}

#[test]
fn collection_views_and_order_have_explicit_inputs_and_keys() {
    let original = include_str!("../../../../tests/declaration-corpus/valid/i8n-text-core.yaml");
    for expression in [
        "{take: {in: {self: true}, count: 1}}",
        "{firstBy: {in: {self: true}, as: item, key: {get: {of: {var: item}, field: language}}}}",
        "{ordered: {in: {self: true}, as: item, key: {get: {of: {var: item}, field: language}}, unique: true, first: [{input: defaultLanguage}], comparison: utf16}}",
    ] {
        let source = original.replace("{capture: text}", expression);
        parse(SourceFile {
            path: "collection-view.yaml",
            bytes: source.as_bytes(),
        })
        .expect(expression);
    }
}

#[test]
fn collection_views_reject_dynamic_counts_and_implicit_sorting_modes() {
    let original = include_str!("../../../../tests/declaration-corpus/valid/i8n-text-core.yaml");
    for (expression, code) in [
        (
            "{take: {in: {self: true}, count: -1}}",
            "invalid_take_count",
        ),
        (
            "{take: {in: {self: true}, count: 1.5}}",
            "invalid_take_count",
        ),
        (
            "{take: {in: {self: true}, count: {input: limit}}}",
            "expected_scalar",
        ),
        (
            "{firstBy: {in: {self: true}, as: item, key: {var: item}, sort: true}}",
            "unknown_key",
        ),
        (
            "{ordered: {in: {self: true}, as: item, key: {var: item}, unique: true, first: [], comparison: locale}}",
            "unsupported_comparison",
        ),
    ] {
        let source = original.replace("{capture: text}", expression);
        let errors = parse(SourceFile {
            path: "collection-view.yaml",
            bytes: source.as_bytes(),
        })
        .expect_err(expression);
        assert_eq!(errors[0].code, code, "{expression}");
    }
}

#[test]
fn state_predicates_remain_distinct_expression_nodes() {
    let original = include_str!("../../../../tests/declaration-corpus/valid/i8n-text-core.yaml");
    for operator in ["present", "isNull", "isReady"] {
        let source = original.replace(
            "{capture: text}",
            &format!("{{{operator}: {{input: optionalValue}}}}"),
        );
        parse(SourceFile {
            path: "state.yaml",
            bytes: source.as_bytes(),
        })
        .expect(operator);
    }
}

#[test]
fn collection_shorthand_patterns_parse_with_strict_structure() {
    let source =
        include_str!("../../../../tests/declaration-corpus/valid/i8n-collection-patterns.yaml");
    assert!(
        parse(SourceFile {
            path: "patterns.yaml",
            bytes: source.as_bytes()
        })
        .is_ok()
    );
    for (from, to) in [
        ("absentKeys:", "absentKey:"),
        (
            "rest: {capture: otherTranslations}",
            "rest: {literal: text}",
        ),
    ] {
        let invalid = source.replace(from, to);
        assert!(
            parse(SourceFile {
                path: "patterns.yaml",
                bytes: invalid.as_bytes()
            })
            .is_err()
        );
    }
}

#[test]
fn decimal_separator_contract_rejects_ambiguous_or_unreadable_output() {
    let source = include_str!("../../../declarations/common/min-max-value.yaml");
    for (before, after, code) in [
        (
            "decimalSeparator: \".\"",
            "decimalSeparator: \";\"",
            "invalid_decimal_separator",
        ),
        (
            "acceptDecimalSeparators: [\".\", \",\"]",
            "acceptDecimalSeparators: [\".\", \".\"]",
            "invalid_decimal_separators",
        ),
        (
            "acceptDecimalSeparators: [\".\", \",\"]",
            "acceptDecimalSeparators: [\",\"]",
            "invalid_decimal_separators",
        ),
    ] {
        let text = source.replace(before, after);
        assert_ne!(source, text);
        let errors = parse(SourceFile {
            path: "decimal.yaml",
            bytes: text.as_bytes(),
        })
        .unwrap_err();
        assert!(errors.iter().any(|error| error.code == code), "{errors:?}");
    }
}

#[test]
fn compact_catalog_compiles_through_the_same_linker_and_generator() {
    let incomplete = b"format: nkdk-declarations/1\nkind: value\nid: incomplete\nvalue: {kind: enum, variants: [{name: One, value: One}]}\nrepresentations:\n  xml: {kind: text, values: []}\n  yaml: {kind: scalar, values: [{value: One, literal: One}]}\nprojections: [{id: incomplete.typed, xml: {kind: text}}]\n";
    assert!(
        nkdk_rule_compiler::parse_many(SourceFile {
            path: "incomplete.yaml",
            bytes: incomplete
        })
        .is_err()
    );
    let source = include_bytes!("../../../../tests/declaration-corpus/valid/enum-catalog.yaml");
    nkdk_rule_compiler::compile(&[SourceFile {
        path: "catalog.yaml",
        bytes: source,
    }])
    .unwrap();
    let modules = nkdk_rule_compiler::parse_many(SourceFile {
        path: "catalog.yaml",
        bytes: source,
    })
    .unwrap();
    assert_eq!(modules.len(), 4);
    assert!(
        parse(SourceFile {
            path: "catalog.yaml",
            bytes: source
        })
        .is_err()
    );
    let text = std::str::from_utf8(source).unwrap();
    for (before, after) in [
        ("accept: [Switch]", "accept: [Auto]"),
        ("accept: [Switch]", "accept: Switch"),
        ("id: test.switch.typed", "id: test.switch"),
        ("Auto: Авто", "Auto: false"),
        ("kind: catalog", "kind: catalog\nignored: true"),
        (
            "kind: value",
            "kind: value\n    value: {kind: scalar, scalar: text}",
        ),
    ] {
        let invalid = text.replace(before, after);
        assert_ne!(invalid, text);
        assert!(
            nkdk_rule_compiler::compile(&[SourceFile {
                path: "catalog.yaml",
                bytes: invalid.as_bytes()
            }])
            .is_err(),
            "{before}"
        );
    }
}
