pub fn style_item_inputs(
    owner: &str,
    styles: &[(&str, &str)],
) -> (nkdk_compiled_rules::EntryId, PreparedInputs) {
    let sources = styles
        .iter()
        .map(|(name, kind)| {
            format!(
                "<MetaDataObject xmlns=\"http://v8.1c.ru/8.3/MDClasses\"><StyleItem><Properties><Name>{name}</Name><Type>{kind}</Type></Properties></StyleItem></MetaDataObject>"
            )
        })
        .collect::<Vec<_>>();
    color_inputs_from_xml(
        owner,
        &sources.iter().map(String::as_str).collect::<Vec<_>>(),
    )
}

fn color_inputs_from_xml(
    owner: &str,
    sources: &[&str],
) -> (nkdk_compiled_rules::EntryId, PreparedInputs) {
    let producer = entry_id("probe.style-item-type-facts").unwrap();
    let entry = entry_id(owner).unwrap();
    let generation = nkdk_conversion_core::facts::Generation(1);
    let budget = nkdk_conversion_core::facts::prepared::FactBudget {
        text: nkdk_conversion_core::facts::text::TextBudget {
            entries: 20,
            bytes: 4096,
        },
        rows: 20,
    };
    let mut builder = nkdk_compiled_rules::fact_builder(generation, budget);
    for source in sources {
        let issues = nkdk_compiled_rules::contribute_file(
            producer,
            Direction::XmlToYaml,
            source.as_bytes(),
            &PreparedInputs::default(),
            &mut builder,
        );
        assert!(issues.is_empty(), "{issues:?}");
    }
    let facts = std::sync::Arc::new(builder.finish());
    let languages = if nkdk_compiled_rules::input_names(entry).contains(&"defaultLanguage") {
        vec![
            (
                "defaultLanguage".into(),
                nkdk_compiled_rules::InputValue::Text("ru".into()),
            ),
            (
                "registeredLanguages".into(),
                nkdk_compiled_rules::InputValue::Sequence(vec![
                    nkdk_compiled_rules::InputValue::Text("ru".into()),
                    nkdk_compiled_rules::InputValue::Text("en".into()),
                ]),
            ),
        ]
    } else {
        vec![]
    };
    (
        entry,
        nkdk_compiled_rules::prepare_fact_inputs(entry, facts, generation, languages).unwrap(),
    )
}
