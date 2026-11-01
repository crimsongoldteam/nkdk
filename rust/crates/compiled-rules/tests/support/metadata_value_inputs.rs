use nkdk_compiled_rules_probes as nkdk_compiled_rules;

pub fn dcs_language_inputs(
    entry: nkdk_compiled_rules::EntryId,
    languages: &[&str],
) -> nkdk_compiled_rules::PreparedInputs {
    nkdk_compiled_rules::prepare_inputs(entry, language_values(languages)).unwrap()
}

pub fn language_values(languages: &[&str]) -> Vec<(String, nkdk_compiled_rules::InputValue)> {
    vec![
        (
            "defaultLanguage".into(),
            nkdk_compiled_rules::InputValue::Text("ru".into()),
        ),
        (
            "registeredLanguages".into(),
            nkdk_compiled_rules::InputValue::Sequence(
                languages
                    .iter()
                    .map(|language| nkdk_compiled_rules::InputValue::Text((*language).into()))
                    .collect(),
            ),
        ),
    ]
}

pub fn metadata_value_inputs(
    entry: nkdk_compiled_rules::EntryId,
) -> nkdk_compiled_rules::PreparedInputs {
    dcs_language_inputs(entry, &["ru", "en"])
}
