use super::*;

#[test]
fn definition_identity_separates_static_values_from_caller_slots() {
    let source = r#"format: nkdk-declarations/1
kind: catalog
declarations:
- kind: value
  id: test.child
  inputs: {prefix: {type: {kind: scalar, scalar: text}}}
  value: {kind: record, fields: [{name: text, type: {kind: scalar, scalar: text}}]}
  representations:
    xml: {kind: record, fields: [{field: text, path: [Text]}]}
    yaml: {kind: mapping, fields: [{field: text, key: Текст}]}
- kind: object
  id: test.owner
  imports: {child: test.child}
  inputs:
    firstName: {type: {kind: scalar, scalar: text}}
    secondName: {type: {kind: scalar, scalar: text}}
  value:
    kind: record
    fields:
    - {name: first, type: {use: child, bind: {prefix: {literal: same}}}}
    - {name: second, type: {use: child, bind: {prefix: {literal: same}}}}
    - {name: third, type: {use: child, bind: {prefix: {literal: other}}}}
    - {name: fourth, type: {use: child, bind: {prefix: {input: firstName}}}}
    - {name: fifth, type: {use: child, bind: {prefix: {input: secondName}}}}
  representations:
    xml: {kind: record, fields: [{field: first, path: [Root, First]}, {field: second, path: [Root, Second]}, {field: third, path: [Root, Third]}, {field: fourth, path: [Root, Fourth]}, {field: fifth, path: [Root, Fifth]}]}
    yaml: {kind: mapping, fields: [{field: first, key: Первое}, {field: second, key: Второе}, {field: third, key: Третье}, {field: fourth, key: Четвёртое}, {field: fifth, key: Пятое}]}
"#;
    let modules = crate::parse_many(SourceFile {
        path: "definitions.yaml",
        bytes: source.as_bytes(),
    })
    .unwrap();
    let program = crate::link(&modules).unwrap();
    let plan = build(&program).unwrap();
    let owner = program
        .entries
        .iter()
        .find(|entry| entry.name == "test.owner")
        .unwrap();
    let LinkedType::Record(fields) = &owner.value else {
        panic!("record")
    };
    let ids: Vec<_> = fields
        .iter()
        .map(|field| {
            let (target, bindings, arguments) = field.value.as_reference().unwrap();
            plan.definitions().id(target, bindings, arguments).unwrap()
        })
        .collect();
    assert_eq!(ids[0], ids[1]);
    assert_ne!(ids[0], ids[2]);
    assert_eq!(ids[3], ids[4]);
    assert_ne!(ids[2], ids[3]);
    assert_eq!(plan.definitions().counts(), (3, 5));
}

#[test]
fn fact_source_dependencies_follow_the_read_direction() {
    let modules = crate::parse_many(SourceFile {
        path: "identity.yaml",
        bytes: include_bytes!("../../tests/fixtures/fact-identity-source.yaml"),
    })
    .unwrap();
    let program = crate::link(&modules).unwrap();
    let entry = &program.entries[0];
    assert!(input_dependencies::read(entry, &program, ValidationPhase::XmlImport).is_empty());
    assert_eq!(
        input_dependencies::read(entry, &program, ValidationPhase::YamlValidation),
        BTreeSet::from([0])
    );
    let mut needs_xml = entry.clone();
    needs_xml.presence[0].xml_missing = needs_xml.presence[0].yaml_missing.clone();
    assert_eq!(
        input_dependencies::read(&needs_xml, &program, ValidationPhase::XmlImport),
        BTreeSet::from([0])
    );
}

#[test]
fn record_plan_keeps_hidden_fields_and_shared_consumers() {
    let modules = crate::parse_many(SourceFile {path:"record.yaml",bytes:br#"
format: nkdk-declarations/1
kind: object
id: test.record-plan
value:
  kind: record
  fields:
  - {name: token, type: {kind: scalar, scalar: text}}
  - {name: label, type: {kind: scalar, scalar: text}}
representations:
  xml: {kind: record, fields: [{field: token, path: [Root], attribute: token}, {field: label, path: [Root, Label]}]}
  yaml: {kind: mapping, fields: [{field: label, key: Label}]}
presence:
- target: {field: token}
  yaml: {missing: {denotes: {field: label}}}
constraints:
- id: equal
  appliesTo: [yaml-validation]
  assert: {eq: [{field: token}, {field: label}]}
  diagnostic: {code: test.equal, severity: error, at: {field: token}, message: Equal values required}
"#}).unwrap();
    let program = crate::link(&modules).unwrap();
    let plan = build(&program).unwrap();
    let record = plan.record(&program.entries[0]).unwrap();
    assert_eq!(record.fields.len(), 2);
    assert_eq!(record.schedule(RepresentationSide::Yaml), [1, 0]);
    assert_eq!(record.schedule(RepresentationSide::Xml), [0, 1]);
    assert_eq!(record.fields[0].field.name, "token");
    assert!(record.fields[0].yaml.is_none());
    assert_eq!(record.fields[0].diagnostic_key(), "token");
    assert_eq!(record.fields[1].yaml.unwrap().key, "Label");
    let scope = scopes::capture_inputs(&program.entries[0]).unwrap();
    assert_eq!(scope.captures, [1]);
    assert_eq!(
        crate::generate::from_plan(&plan).unwrap(),
        crate::generate(&program).unwrap()
    );
    assert_eq!(
        crate::schema::from_plan(&plan, "test.record-plan").unwrap(),
        crate::schema(&program, "test.record-plan").unwrap()
    );
    let LinkedType::Record(fields) = &program.entries[0].value else {
        unreachable!()
    };
    let cycle = scopes::schedule(&[vec![1], vec![0]], fields).unwrap_err();
    assert_eq!(cycle.code, "field_dependency_cycle");
    assert_eq!(
        (&cycle.file, cycle.line, cycle.column),
        (
            &fields[0].source.file,
            fields[0].source.line,
            fields[0].source.column
        )
    );
    assert_eq!(cycle.related, [fields[1].source.clone()]);
    let mut broken = program.clone();
    broken.entries[0].presence.clear();
    broken.entries[0].constraints.clear();
    let scope = scopes::capture_inputs(&broken.entries[0]).unwrap();
    assert!(scope.captures.is_empty());
    assert!(matches!(scope.entry, Cow::Borrowed(_)));
    assert_eq!(build(&broken).unwrap_err()[0].code, "unrepresented_field");
}

#[test]
fn input_capture_keeps_owner_and_value_scopes_distinct() {
    let sources = r#"
format: nkdk-declarations/1
kind: value
id: test.child
inputs: {expected: {type: {kind: scalar, scalar: text}}}
value: {kind: scalar, scalar: text}
representations: {xml: {kind: text}, yaml: {kind: scalar, scalar: text}}
---
format: nkdk-declarations/1
kind: object
id: test.owner
imports: {child: test.child}
inputs: {prefix: {type: {kind: scalar, scalar: text}}}
value:
  kind: record
  fields:
  - name: content
    type: {use: child, bind: {expected: {concat: [{input: prefix}, {field: name}]}}}
  - {name: name, type: {kind: scalar, scalar: text}}
representations:
  xml: {kind: record, fields: [{field: content, path: [Root, Content]}, {field: name, path: [Root, Name]}]}
  yaml: {kind: mapping, fields: [{field: content, key: Content}, {field: name, key: Name}]}
"#;
    let modules: Vec<_> = sources
        .split("\n---\n")
        .flat_map(|source| {
            crate::parse_many(SourceFile {
                path: "scope.yaml",
                bytes: source.as_bytes(),
            })
            .unwrap()
        })
        .collect();
    let program = crate::link(&modules).unwrap();
    let owner = program
        .entries
        .iter()
        .find(|entry| entry.name == "test.owner")
        .unwrap();
    let scope = scopes::capture_inputs(owner).unwrap();
    assert_eq!(scope.captures, [1]);
    assert_eq!(scope.entry.inputs.len(), 2);
    assert_eq!(scope.entry.inputs[0], owner.inputs[0]);
    assert_eq!(
        scope.entry.field_dependencies,
        [Vec::<u32>::new(), Vec::new()]
    );
    let LinkedType::Record(fields) = &scope.entry.value else {
        unreachable!()
    };
    let (_, bindings, _) = fields[0].value.as_reference().unwrap();
    let LinkedExpressionKind::Operation { arguments, .. } = &bindings[0].value.kind else {
        unreachable!()
    };
    assert_eq!(arguments[0].kind, LinkedExpressionKind::Input(0));
    assert_eq!(arguments[1].kind, LinkedExpressionKind::Input(1));
    assert_eq!(owner.field_dependencies, [vec![1], vec![]]);
    let plan = build(&program).unwrap();
    let prepared = plan.composition(owner).unwrap();
    let repeated = plan.composition(&owner.clone()).unwrap();
    assert!(std::rc::Rc::ptr_eq(&prepared, &repeated));
    assert_eq!(prepared.captures, [1]);
    assert_eq!(prepared.parts.len(), 2);
    let mut placed = owner.clone();
    let LinkedXml::Record(routes) = &mut placed.xml else {
        unreachable!()
    };
    routes[0].path[0].local = "OtherRoot".into();
    let different = plan.composition(&placed).unwrap();
    assert!(!std::rc::Rc::ptr_eq(&prepared, &different));
    assert_eq!(prepared.entry().xml, owner.xml);
    assert_eq!(different.entry().xml, placed.xml);
    assert!(std::rc::Rc::ptr_eq(
        &prepared,
        &plan.composition(owner).unwrap()
    ));
    let nested = LinkedType::Record(vec![LinkedField {
        name: "nested".into(),
        value: owner.value.clone(),
        source: owner.source.clone(),
    }]);
    assert_eq!(
        scopes::dependencies(&nested, &[]).unwrap(),
        [Vec::<u32>::new()]
    );
}

#[test]
fn borrowed_field_bindings_follow_the_callees_read_direction() {
    let sources = [
        (
            "left.yaml",
            include_str!("../../tests/fixtures/directional-bound-common.yaml"),
        ),
        (
            "right.yaml",
            include_str!("../../tests/fixtures/directional-bound-reverse.yaml"),
        ),
        (
            "owner.yaml",
            include_str!("../../tests/fixtures/directional-bound-owner.yaml"),
        ),
    ];
    let modules: Vec<_> = sources
        .into_iter()
        .map(|(path, source)| {
            crate::parse(SourceFile {
                path,
                bytes: source.as_bytes(),
            })
            .unwrap()
        })
        .collect();
    let program = crate::link(&modules).unwrap();
    let entry = program
        .entries
        .iter()
        .find(|entry| entry.name == "test.directional-bindings")
        .unwrap();
    let plan = build(&program).unwrap();
    let record = plan.record(entry).unwrap();
    assert_eq!(record.schedule(RepresentationSide::Xml), [1, 0]);
    assert_eq!(record.schedule(RepresentationSide::Yaml), [0, 1]);
    crate::generate(&program).unwrap();
    let cyclic = sources[1].1.replace(
        "xml: {missing: {denotes: {absent: true}}}",
        "xml: {missing: {denotes: {input: expected}}}",
    );
    let mut broken = modules;
    broken[1] = crate::parse(SourceFile {
        path: "cycle.yaml",
        bytes: cyclic.as_bytes(),
    })
    .unwrap();
    let errors = crate::link(&broken).unwrap_err();
    assert!(
        errors
            .iter()
            .any(|error| error.code == "field_dependency_cycle"),
        "{errors:?}"
    );
}

#[test]
fn record_plan_keeps_xml_routes_for_a_text_yaml_representation() {
    let modules = crate::parse_many(SourceFile {
        path: "record-text.yaml",
        bytes: include_bytes!("../../tests/fixtures/record-text.yaml"),
    })
    .unwrap();
    let program = crate::link(&modules).unwrap();
    let plan = build(&program).unwrap();
    let record = plan.record(&program.entries[0]).unwrap();
    assert_eq!(record.fields.len(), 2);
    assert_eq!(
        record.fields[0].xml.unwrap().path.last().unwrap().local,
        "Path"
    );
    assert_eq!(
        record.fields[1].xml.unwrap().path.last().unwrap().local,
        "Index"
    );
    assert!(record.fields.iter().all(|field| field.yaml.is_none()));
    assert_eq!(record.schedule(RepresentationSide::Yaml), [0, 1]);
}

#[test]
fn a_tagged_record_choice_borrows_its_sibling_context() {
    let probe = include_str!("../../../../declarations/probes/tagged-default-state.yaml");
    let prefix = probe.split("- kind: object").next().unwrap();
    let source = format!(
        "{prefix}{}",
        r#"- kind: object
  id: test.tagged-owner
  imports: {capacity: probe.stateful-capacity}
  value:
    kind: record
    fields:
    - {name: marker, type: {kind: scalar, scalar: text}}
    - {name: capacity, type: {use: capacity, bind: {changed: {eq: [{field: marker}, {literal: changed}]}}}}
  representations:
    xml: {kind: record, fields: [{field: marker, path: [Root, Marker]}, {field: capacity, path: [Root, Properties]}]}
    yaml: {kind: mapping, fields: [{field: marker, key: Marker}, {field: capacity, key: Capacity}]}
"#
    );
    let mut modules = crate::parse_many(SourceFile {
        path: "tagged-context.yaml",
        bytes: source.as_bytes(),
    })
    .unwrap();
    modules.push(
        crate::parse(SourceFile {
            path: "boolean.yaml",
            bytes: include_bytes!("../../../../declarations/common/boolean.yaml"),
        })
        .unwrap(),
    );
    let linked = crate::link(&modules).unwrap();
    let owner = linked
        .entries
        .iter()
        .find(|entry| entry.name == "test.tagged-owner")
        .unwrap();
    let captured = scopes::capture_inputs(owner).unwrap();
    assert_eq!(captured.captures, [0]);
    let plan = build(&linked).unwrap();
    let prepared = plan.composition(owner).unwrap();
    assert_eq!(prepared.captures, [0]);
    let constraint_source = b"format: nkdk-declarations/1\nkind: object\nid: test.constraint-capture\nvalue: {kind: record, fields: [{name: payload, type: {kind: scalar, scalar: text}}, {name: state, type: {kind: scalar, scalar: boolean}}]}\nrepresentations:\n  xml: {kind: record, fields: [{field: payload, path: [Root, Value]}, {field: state, path: [Root, State]}]}\n  yaml: {kind: mapping, fields: [{field: payload, key: Value}, {field: state, key: State}]}\nconstraints:\n- id: selected-state\n  appliesTo: [xml-import, yaml-validation]\n  assert: {not: {field: state}}\n  diagnostic: {code: state.expected, severity: error, at: {self: true}, message: State must be false}\n";
    let modules = crate::parse_many(SourceFile {
        path: "constraint-capture.yaml",
        bytes: constraint_source,
    })
    .unwrap();
    let linked = crate::link(&modules).unwrap();
    let plan = build(&linked).unwrap();
    let prepared = plan.composition(&linked.entries[0]).unwrap();
    assert_eq!(prepared.captures, [1]);
    assert!(
        prepared.parts[0].constraints.is_empty(),
        "State constraint cannot move to the unrelated payload"
    );
    assert_eq!(prepared.parts[1].constraints.len(), 1);
    let LinkedExpressionKind::Operation { arguments, .. } =
        &prepared.parts[1].constraints[0].assertion.kind
    else {
        panic!("not state")
    };
    assert_eq!(arguments[0].kind, LinkedExpressionKind::Field(0));
}

#[test]
fn xml_writer_order_keeps_direct_rows_between_declared_container_groups() {
    let source = b"format: nkdk-declarations/1\nkind: object\nid: test.writer-order\nvalue: {kind: record, fields: [{name: a, type: {kind: scalar, scalar: text}}, {name: b, type: {kind: scalar, scalar: text}}, {name: c, type: {kind: scalar, scalar: text}}, {name: d, type: {kind: scalar, scalar: text}}]}\nrepresentations:\n  xml: {kind: record, fields: [{field: a, path: [First, One]}, {field: b, path: [Direct]}, {field: c, path: [Second, One]}, {field: d, path: [First, Two]}]}\n  yaml: {kind: mapping, fields: [{field: a, key: A}, {field: b, key: B}, {field: c, key: C}, {field: d, key: D}]}\n";
    let modules = crate::parse_many(SourceFile {
        path: "writer-order.yaml",
        bytes: source,
    })
    .unwrap();
    let program = crate::link(&modules).unwrap();
    let owner = &program.entries[0];
    let mut parts = records::parts(owner, &program, &[]).unwrap();
    let LinkedXml::Record(fields) = &mut parts[1].xml else {
        panic!("record writer")
    };
    fields[0].path.clear();
    assert_eq!(records::xml_slots(owner, &parts), [0, 3, 1, 2]);
    let LinkedXml::Record(fields) = &mut parts[1].xml else {
        panic!("record writer")
    };
    fields[0].path = vec![ExpandedName {
        namespace: String::new(),
        local: "First".into(),
    }];
    assert_eq!(records::xml_slots(owner, &parts), [0, 1, 3, 2]);
    let LinkedXml::Record(fields) = &mut parts[1].xml else {
        panic!("record writer")
    };
    fields[0].path.clear();
    parts.swap(0, 1);
    assert_eq!(records::xml_slots(owner, &parts), [0, 1, 3, 2]);
}

#[test]
fn choice_attributes_keep_their_own_yaml_property() {
    let source = r#"format: nkdk-declarations/1
kind: catalog
declarations:
- kind: value
  id: test.variant
  value: {kind: record, fields: [{name: text, type: {kind: scalar, scalar: text}}]}
  representations:
    xml: {kind: text-pattern, parts: [{field: text}]}
    yaml: {kind: text-pattern, parts: [{field: text}]}
- kind: value
  id: test.choice
  imports: {variant: test.variant}
  inputs: {context: {type: {kind: scalar, scalar: text}}}
  value: {kind: choice, variants: [{name: variant, type: {use: variant}}]}
  representations: {xml: {kind: choice, fallback: variant}, yaml: {kind: choice}}
- kind: object
  id: test.attributes
  imports: {choice: test.choice}
  inputs: {context: {type: {kind: scalar, scalar: text}}}
  value:
    kind: record
    fields: [{name: reference, type: {use: choice, bind: {context: {input: context}}}}, {name: label, type: {kind: scalar, scalar: text}}, {name: size, type: {kind: scalar, scalar: text}}]
  representations:
    xml: {kind: record, fields: [{field: reference, path: [Root], attribute: ref}, {field: size, path: [Root], attribute: size}, {field: label, path: [Root], attribute: label}]}
    yaml: {kind: mapping, fields: [{field: reference, key: Reference}, {field: label, key: Label}, {field: size, key: Size}]}
"#;
    let modules = crate::parse_many(SourceFile {
        path: "attributes.yaml",
        bytes: source.as_bytes(),
    })
    .unwrap();
    let program = crate::link(&modules).unwrap();
    let entry = program
        .entries
        .iter()
        .find(|entry| entry.name == "test.attributes")
        .unwrap();
    let parts = records::parts(entry, &program, &[]).unwrap();
    assert_eq!(
        parts.len(),
        2,
        "choice and scalar attribute groups have separate readers"
    );
    let LinkedType::Record(fields) = &parts[0].value else {
        panic!("record")
    };
    assert_eq!(fields.len(), 1);
    assert_eq!(fields[0].name, "reference");
    let LinkedXml::Record(mappings) = &parts[1].xml else {
        panic!("record XML")
    };
    assert_eq!(
        mappings
            .iter()
            .map(|mapping| mapping.field.as_str())
            .collect::<Vec<_>>(),
        ["size", "label"]
    );
}
