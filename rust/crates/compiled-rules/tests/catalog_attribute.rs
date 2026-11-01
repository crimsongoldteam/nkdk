extern crate nkdk_compiled_rules as generated_source_owner;

#[path = "../../rule-compiler/tests/support/source_owner_cases.rs"]
mod cases;
mod matrix {
    include!("../../rule-compiler/tests/support/source-owner-native.rs.in");
}

#[test]
fn complete_catalog_attribute_uses_the_working_aot_package_and_declared_sources() {
    let repository = std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join("../../..");
    let fixtures: Vec<_> = cases::fixtures(&repository)
        .into_iter()
        .filter(|case| case["entry"] != "test.borrowed-record-context")
        .map(|mut case| {
            case["operation"] = "metadata.catalog-attribute".into();
            case
        })
        .collect();
    assert_eq!(fixtures.len(), 16);
    matrix::verify_cases(&serde_json::Value::Array(fixtures));
}
