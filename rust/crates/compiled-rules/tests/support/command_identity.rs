use nkdk_compiled_rules_probes::{
    Direction, InputValue, contribute_file, entry_id, prepare_inputs,
};
use nkdk_conversion_core::facts::prepared::TextFactsBuilder;

pub fn command_fact_builder(
    generation: nkdk_conversion_core::facts::Generation,
) -> TextFactsBuilder {
    nkdk_compiled_rules_probes::fact_builder(
        generation,
        nkdk_conversion_core::facts::prepared::FactBudget {
            text: nkdk_conversion_core::facts::text::TextBudget {
                entries: 100,
                bytes: 10000,
            },
            rows: 100,
        },
    )
}

pub fn seed_command_groups(builder: &mut TextFactsBuilder) {
    let roots: serde_json::Value = serde_json::from_slice(include_bytes!(concat!(
        env!("CARGO_MANIFEST_DIR"),
        "/../../../tests/migration/metadata-root-index-inventory.json"
    )))
    .unwrap();
    let root = entry_id("migration.metadata-root-index").unwrap();
    let inputs = prepare_inputs(root, vec![]).unwrap();
    for group in roots["roots"]
        .as_array()
        .unwrap()
        .iter()
        .filter(|row| row["kind"] == "CommandGroup")
    {
        let xml = format!(
            "<Root><Kind>CommandGroup</Kind><Name>{}</Name><Identity>{}</Identity></Root>",
            group["name"].as_str().unwrap(),
            group["identity"].as_str().unwrap()
        );
        assert!(
            contribute_file(root, Direction::XmlToYaml, xml.as_bytes(), &inputs, builder)
                .is_empty()
        );
    }
}

pub fn owner_values(
    language: &str,
    registered: &[&str],
    component: &str,
    owner: &str,
) -> Vec<(String, InputValue)> {
    vec![
        ("defaultLanguage".into(), InputValue::Text(language.into())),
        (
            "registeredLanguages".into(),
            InputValue::Sequence(
                registered
                    .iter()
                    .map(|value| InputValue::Text((*value).into()))
                    .collect(),
            ),
        ),
        ("component".into(), InputValue::Text(component.into())),
        ("owner".into(), InputValue::Text(owner.into())),
    ]
}

pub fn seed(
    builder: &mut TextFactsBuilder,
    component: &str,
    owner: &str,
    name: &str,
    identity: &str,
) {
    seed_kind(builder, component, owner, "Command", name, identity);
}

pub fn seed_kind(
    builder: &mut TextFactsBuilder,
    component: &str,
    owner: &str,
    kind: &str,
    name: &str,
    identity: &str,
) {
    let producer = entry_id("migration.metadata-own-identity").unwrap();
    let inputs = prepare_inputs(
        producer,
        [
            ("component", component),
            ("owner", owner),
            ("kind", kind),
            ("name", name),
            ("identity", identity),
        ]
        .into_iter()
        .map(|(name, value)| (name.into(), InputValue::Text(value.into())))
        .collect(),
    )
    .unwrap();
    let yaml = format!("Имя: {name}");
    assert!(
        contribute_file(
            producer,
            Direction::YamlToXml,
            yaml.as_bytes(),
            &inputs,
            builder,
        )
        .is_empty()
    );
}

#[allow(dead_code)] // Shared test support is compiled by probes with different subsets of cases.
pub fn seed_base(
    builder: &mut TextFactsBuilder,
    component: &str,
    identity: &str,
    base_identity: &str,
    name: &str,
) {
    let entry = entry_id("migration.metadata-base-identity").unwrap();
    let inputs = prepare_inputs(
        entry,
        [
            ("component", component),
            ("identity", identity),
            ("baseIdentity", base_identity),
        ]
        .into_iter()
        .map(|(key, value)| (key.into(), InputValue::Text(value.into())))
        .collect(),
    )
    .unwrap();
    let errors = contribute_file(
        entry,
        Direction::YamlToXml,
        format!("Имя: {name}").as_bytes(),
        &inputs,
        builder,
    );
    assert!(errors.is_empty(), "{errors:?}");
}
