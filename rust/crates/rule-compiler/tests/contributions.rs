use nkdk_rule_compiler::{SourceFile, compile, link, parse};

const CODE: &str = include_str!("fixtures/fact-code.yaml");
const OWNER: &str = include_str!("fixtures/fact-owner.yaml");

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
