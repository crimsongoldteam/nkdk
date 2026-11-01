pub(super) fn equivalent_yaml(left: &yaml_rust2::Yaml, right: &yaml_rust2::Yaml) -> bool {
    match (left, right) {
        (yaml_rust2::Yaml::Hash(left), yaml_rust2::Yaml::Hash(right)) => {
            // Legacy YAML spells some absent references as empty strings.
            // Canonical omission is accepted only for that spelling; the
            // independent full XML comparison below still protects absence.
            right.keys().all(|key| left.contains_key(key))
                && left.iter().all(|(key, value)| {
                    right.get(key).map_or_else(
                        || value.as_str() == Some(""),
                        |other| equivalent_yaml(value, other),
                    )
                })
        }
        (yaml_rust2::Yaml::Array(left), yaml_rust2::Yaml::Array(right)) => {
            left.len() == right.len()
                && left
                    .iter()
                    .zip(right)
                    .all(|(left, right)| equivalent_yaml(left, right))
        }
        _ => left == right,
    }
}
// The legacy fixtures omit the scalar after a state tag. Both spellings
// denote the same missing value; YamlLoader otherwise reads the bare tag
// as an empty string and an explicit tagged null as the text "null".
pub(super) fn canonical_state_nulls(source: &str) -> String {
    source
        .lines()
        .map(|line| {
            if ["!изменять", "!контролировать", "!уведомлять"]
                .iter()
                .any(|tag| line.trim_end().ends_with(tag))
            {
                format!("{} null\n", line.trim_end())
            } else {
                format!("{line}\n")
            }
        })
        .collect::<String>()
}

// Independently prove the missing resource in the immutable project before
// adding the anomaly expected from the shared resource-state declaration.
pub(super) fn expected_missing_changed_resource(
    expected: &str,
    original: &std::path::Path,
    resource: &str,
    property: &str,
    base_resource: &std::path::Path,
) -> String {
    let source = std::fs::read_to_string(original).unwrap();
    assert!(source.contains(&format!("<xr:Property>{property}</xr:Property>")));
    assert!(source.contains("<xr:State>Extended</xr:State>"));
    assert!(!original.with_extension("").join(resource).exists());
    assert!(base_resource.is_file());
    let mut reader = quick_xml::Reader::from_str(&source);
    let mut history = String::new();
    let mut name = None;
    loop {
        match reader.read_event().unwrap() {
            quick_xml::events::Event::Start(element)
                if element.name().as_ref() == "xr:Property" =>
            {
                name = Some(
                    reader
                        .read_text(element.name())
                        .unwrap()
                        .xml10_content()
                        .into_owned(),
                );
            }
            quick_xml::events::Event::Start(element) if element.name().as_ref() == "xr:State" => {
                let mode = reader
                    .read_text(element.name())
                    .unwrap()
                    .xml10_content()
                    .into_owned();
                let name = name.take().expect("Each state has its source property");
                history.push_str(&format!("  - Property: {name}\n    State: {mode}\n"));
            }
            quick_xml::events::Event::Eof => break,
            _ => {}
        }
    }
    assert!(!history.is_empty());
    format!("{expected}\nСостояния: !xml/invalid\n{history}")
}
