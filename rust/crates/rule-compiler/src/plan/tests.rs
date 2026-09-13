use super::*;

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
    assert_eq!(record.schedule, [1, 0]);
    assert_eq!(record.fields[0].field.name, "token");
    assert!(record.fields[0].yaml.is_none());
    assert_eq!(record.fields[0].diagnostic_key(), "token");
    assert_eq!(record.fields[1].yaml.unwrap().key, "Label");
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
    assert_eq!(build(&broken).unwrap_err()[0].code, "unrepresented_field");
}
