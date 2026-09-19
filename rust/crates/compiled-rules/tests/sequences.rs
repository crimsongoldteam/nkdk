use nkdk_compiled_rules::{
    Direction, PreparedInputs, convert_file, entry_id, validate_file, verify_candidate,
};

#[test]
fn metadata_value_derives_the_empty_xml_form_from_the_sibling_type() {
    let entry = entry_id("migration.metadata-value").unwrap();
    let inputs = PreparedInputs::default();
    let string_xml = b"<Root xmlns:v8=\"http://v8.1c.ru/8.1/data/core\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:xs=\"http://www.w3.org/2001/XMLSchema\"><Type><v8:Type>xs:string</v8:Type></Type><FillValue xsi:type=\"xs:string\"/></Root>";
    let number_xml = b"<Root xmlns:v8=\"http://v8.1c.ru/8.1/data/core\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:xs=\"http://www.w3.org/2001/XMLSchema\"><Type><v8:Type>xs:decimal</v8:Type></Type><FillValue xsi:nil=\"true\"/></Root>";
    for xml in [string_xml.as_slice(), number_xml.as_slice()] {
        let converted = convert_file(entry, Direction::XmlToYaml, xml, &inputs).unwrap();
        verify_candidate(entry, xml, &converted.bytes, &inputs).unwrap();
        assert!(!String::from_utf8_lossy(&converted.bytes).contains("Значение:"));
    }
}

#[test]
fn choice_parameters_use_a_keyed_yaml_mapping_for_declared_values() {
    let entry = entry_id("migration.choice-parameters").unwrap();
    let inputs = PreparedInputs::default();
    let xml = b"<Root xmlns:app=\"http://v8.1c.ru/8.2/managed-application/core\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:xs=\"http://www.w3.org/2001/XMLSchema\"><ChoiceParameters><app:item name=\"Text\"><app:value xsi:type=\"xs:string\">value</app:value></app:item></ChoiceParameters></Root>";
    let converted = convert_file(entry, Direction::XmlToYaml, xml, &inputs).unwrap();
    assert_eq!(
        String::from_utf8_lossy(&converted.bytes),
        "Параметры:\n  Text: value"
    );
    verify_candidate(entry, xml, &converted.bytes, &inputs).unwrap();

    let empty = b"<Root xmlns:app=\"http://v8.1c.ru/8.2/managed-application/core\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\"><ChoiceParameters><app:item name=\"Missing\"><app:value xsi:nil=\"true\"/></app:item></ChoiceParameters></Root>";
    let converted = convert_file(entry, Direction::XmlToYaml, empty, &inputs).unwrap();
    assert_eq!(
        String::from_utf8_lossy(&converted.bytes),
        "Параметры:\n  Missing:\n    {}"
    );
    verify_candidate(entry, empty, &converted.bytes, &inputs).unwrap();
}

#[test]
fn choice_parameter_links_are_structural_and_reversible() {
    let entry = entry_id("migration.choice-parameter-links").unwrap();
    let inputs = PreparedInputs::default();
    let xml = b"<Root xmlns:xr=\"http://v8.1c.ru/8.3/xcf/readable\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:xs=\"http://www.w3.org/2001/XMLSchema\"><ChoiceParameterLinks><xr:Link><xr:Name>Filter.Owner</xr:Name><xr:DataPath xsi:type=\"xs:string\">Catalog.Goods.Attribute.Owner</xr:DataPath><xr:ValueChange>DontChange</xr:ValueChange></xr:Link></ChoiceParameterLinks></Root>";
    let yaml = "Связи:\n  - Имя: Filter.Owner\n    ПутьКДанным: Справочник.Goods.Реквизит.Owner\n    РежимИзменения: НеИзменять";
    let converted = convert_file(entry, Direction::XmlToYaml, xml, &inputs).unwrap();
    assert_eq!(String::from_utf8_lossy(&converted.bytes), yaml);
    verify_candidate(entry, xml, &converted.bytes, &inputs).unwrap();
    for original in [
        b"<Root><ChoiceParameterLinks/></Root>".as_slice(),
        b"<Root/>".as_slice(),
    ] {
        let converted = convert_file(entry, Direction::XmlToYaml, original, &inputs).unwrap();
        verify_candidate(entry, original, &converted.bytes, &inputs).unwrap();
    }
}

#[test]
fn record_sequences_keep_typed_wrappers_and_infer_their_differences() {
    let entry = entry_id("migration.web-socket-client-headers").unwrap();
    let inputs = PreparedInputs::default();
    let row = "<xr:Item><xr:Presentation/><xr:CheckState>0</xr:CheckState><xr:Value xsi:type=\"v8:KeyAndValue\"><v8:Key xsi:type=\"xs:string\">a</v8:Key><v8:Value xsi:type=\"xs:string\">b</v8:Value></xr:Value></xr:Item>";
    let xml = format!(
        "<Root xmlns:xr=\"http://v8.1c.ru/8.3/xcf/readable\" xmlns:v8=\"http://v8.1c.ru/8.1/data/core\" xmlns:xs=\"http://www.w3.org/2001/XMLSchema\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\"><Value xsi:type=\"xr:ValueList\">{row}{row}</Value></Root>"
    );
    let result = convert_file(entry, Direction::XmlToYaml, xml.as_bytes(), &inputs).unwrap();
    assert_eq!(
        String::from_utf8_lossy(&result.bytes),
        "Headers:\n  - Ключ: a\n    Значение: b\n  - Ключ: a\n    Значение: b"
    );
    for original in [
        xml.clone(),
        xml.replace("<xr:Presentation/>", ""),
        xml.replace(">0</xr:CheckState>", ">1</xr:CheckState>"),
        xml.replace(" xsi:type=\"xs:string\"", ""),
        xml.replace("<v8:Key xsi:type=\"xs:string\">a</v8:Key>", ""),
        xml.replace("v8:KeyAndValue", "v8:Other"),
        xml.replace(row, ""),
        "<Root/>".into(),
    ] {
        assert_restored(entry, original.as_bytes(), &inputs);
    }
}

#[test]
fn text_sequences_preserve_order_duplicates_empty_items_and_unknown_content() {
    let inputs = PreparedInputs::default();
    for (name, element) in [
        ("fields-list", "f:Field"),
        ("fields-list-readable", "xr:Field"),
        ("index-field", "x:Field"),
    ] {
        let entry = entry_id(&format!("migration.{name}")).unwrap();
        let root = "<Root xmlns:xr=\"http://v8.1c.ru/8.3/xcf/readable\" xmlns:f=\"http://v8.1c.ru/8.3/xcf/logform\" xmlns:x=\"http://v8.1c.ru/8.3/xcf/extrnprops\">";
        let normal = format!(
            "{root}<Value><{element}>b</{element}><{element}>a</{element}><{element}>b</{element}><{element}/></Value></Root>"
        );
        let value = convert_file(entry, Direction::XmlToYaml, normal.as_bytes(), &inputs).unwrap();
        assert_eq!(
            String::from_utf8_lossy(&value.bytes),
            "List:\n  - b\n  - a\n  - b\n  - \"\""
        );
        verify_candidate(entry, normal.as_bytes(), &value.bytes, &inputs).unwrap();
        let singleton = format!("{root}<Value><{element}/></Value></Root>");
        let preserved =
            convert_file(entry, Direction::XmlToYaml, singleton.as_bytes(), &inputs).unwrap();
        let yaml = String::from_utf8_lossy(&preserved.bytes);
        assert!(yaml.contains("!xml/raw"));
        assert_eq!(yaml.contains("$значение: []"), name == "index-field");
        verify_candidate(entry, singleton.as_bytes(), &preserved.bytes, &inputs).unwrap();
        verify_candidate(entry, b"<Root/>", b"List: []", &inputs).unwrap();
        if name != "index-field" {
            verify_candidate(entry, b"<Root><Value/></Root>", b"List: {}", &inputs).unwrap();
            assert!(validate_file(entry, b"List: {}", &inputs).is_empty());
        } else {
            assert!(!validate_file(entry, b"List: {}", &inputs).is_empty());
        }
        for original in [
            "<Root/>".to_owned(),
            "<Root><Value/></Root>".to_owned(),
            normal.replace("</Value>", "<Unknown>keep</Unknown></Value>"),
            normal.replace("<Value>", "<Value flag=\"x\">"),
            normal.replace(
                "</Value>",
                "<other:Unknown xmlns:other=\"urn:test:unknown\">keep</other:Unknown></Value>",
            ),
        ] {
            let value = convert_file(entry, Direction::XmlToYaml, original.as_bytes(), &inputs)
                .unwrap_or_else(|error| panic!("{name}: {original}: {error:?}"));
            assert!(validate_file(entry, &value.bytes, &inputs).is_empty());
            verify_candidate(entry, original.as_bytes(), &value.bytes, &inputs).unwrap();
        }
        for invalid in ["List: [1]", "List: [a, null]", "List: [a]\nList: [b]"] {
            assert!(
                !validate_file(entry, invalid.as_bytes(), &inputs).is_empty(),
                "{invalid}"
            );
        }
    }
}

#[test]
fn scalar_tree_attributes_follow_the_current_item_and_preserve_other_forms() {
    let entry = entry_id("migration.xdto-packages").unwrap();
    let inputs = PreparedInputs::default();
    let xml = "<Root xmlns:xr=\"http://v8.1c.ru/8.3/xcf/readable\" xmlns:xs=\"http://www.w3.org/2001/XMLSchema\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\"><Value><xr:Item><xr:Presentation/><xr:CheckState>0</xr:CheckState><xr:Value xsi:type=\"xr:MDObjectRef\">XDTOPackage.Example</xr:Value></xr:Item><xr:Item><xr:Presentation/><xr:CheckState>0</xr:CheckState><xr:Value xsi:type=\"xs:string\">other</xr:Value></xr:Item></Value></Root>";
    let result = convert_file(entry, Direction::XmlToYaml, xml.as_bytes(), &inputs).unwrap();
    assert_eq!(
        String::from_utf8_lossy(&result.bytes),
        "List:\n  - XDTOPackage.Example\n  - other"
    );
    for original in [
        xml.to_owned(),
        xml.replace("xr:MDObjectRef", "xs:string"),
        xml.replace(" xsi:type=\"xs:string\"", ""),
        xml.replace("<xr:Presentation/>", ""),
        "<Root><Value/></Root>".into(),
        "<Root/>".into(),
    ] {
        assert_restored(entry, original.as_bytes(), &inputs);
    }
}

#[test]
fn collection_owner_defaults_restore_empty_wrappers_and_preserve_absence() {
    let inputs = PreparedInputs::default();
    for name in [
        "web-socket-client-headers",
        "xdto-packages",
        "index-field",
        "fields-list-readable",
    ] {
        let entry = entry_id(&format!("migration.{name}-default")).unwrap();
        let empty = convert_file(entry, Direction::YamlToXml, b"", &inputs).unwrap();
        assert!(String::from_utf8_lossy(&empty.bytes).contains("<Value"));
        let yaml = convert_file(entry, Direction::XmlToYaml, &empty.bytes, &inputs).unwrap();
        assert!(yaml.bytes.is_empty());
        verify_candidate(entry, &empty.bytes, &yaml.bytes, &inputs).unwrap();
        for original in [b"<Root/>".as_slice(), b"<Root><Value/></Root>"] {
            let yaml = convert_file(entry, Direction::XmlToYaml, original, &inputs).unwrap_or_else(
                |error| panic!("{name}: {}: {error:?}", String::from_utf8_lossy(original)),
            );
            assert!(validate_file(entry, &yaml.bytes, &inputs).is_empty());
            verify_candidate(entry, original, &yaml.bytes, &inputs).unwrap();
        }
    }
}

#[test]
fn purposes_use_declared_shortcuts_defaults_and_inferred_violations() {
    let inputs = PreparedInputs::default();
    let root = "<Root xmlns:v8=\"http://v8.1c.ru/8.1/data/core\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:app=\"http://v8.1c.ru/8.2/managed-application/core\">";
    let xml = |values: &[&str]| {
        format!(
            "{root}<Value>{}</Value></Root>",
            values
                .iter()
                .map(|value| format!(
                    "<v8:Value xsi:type=\"app:ApplicationUsePurpose\">{value}</v8:Value>"
                ))
                .collect::<String>()
        )
    };
    let platform = "PlatformApplication";
    let mobile = "MobilePlatformApplication";
    for name in ["migration.use-purposes", "migration.use-purposes-default"] {
        let entry = entry_id(name).unwrap();
        for (values, expected) in [
            (vec![mobile], "НазначенияИспользования: МобильноеПриложение"),
            (
                vec![platform, mobile],
                "НазначенияИспользования: ПлатформаИМобильноеПриложение",
            ),
            (
                vec![mobile, platform],
                "НазначенияИспользования:\n  - MobilePlatformApplication\n  - PlatformApplication",
            ),
            (
                vec![platform, platform],
                "НазначенияИспользования:\n  - PlatformApplication\n  - PlatformApplication",
            ),
            (
                vec!["Future"],
                "НазначенияИспользования: !xml/invalid\n  - Future",
            ),
        ] {
            let original = xml(&values);
            let converted =
                convert_file(entry, Direction::XmlToYaml, original.as_bytes(), &inputs).unwrap();
            assert_eq!(String::from_utf8_lossy(&converted.bytes), expected);
            assert_restored(entry, original.as_bytes(), &inputs);
        }
        let converted = convert_file(
            entry,
            Direction::XmlToYaml,
            xml(&[platform]).as_bytes(),
            &inputs,
        )
        .unwrap();
        assert_eq!(converted.bytes.is_empty(), name.ends_with("-default"));
        for original in [
            "<Root/>".to_owned(),
            xml(&[]),
            xml(&[""]),
            xml(&["Future"]).replace(" xsi:type=\"app:ApplicationUsePurpose\"", ""),
        ] {
            assert_restored(entry, original.as_bytes(), &inputs);
        }
        for invalid in [
            "НазначенияИспользования: [Future]",
            "НазначенияИспользования: !xml/invalid [PlatformApplication]",
        ] {
            assert!(!validate_file(entry, invalid.as_bytes(), &inputs).is_empty());
        }
    }
}

fn assert_restored(entry: nkdk_compiled_rules::EntryId, original: &[u8], inputs: &PreparedInputs) {
    let result = convert_file(entry, Direction::XmlToYaml, original, inputs)
        .unwrap_or_else(|error| panic!("{}: {error:?}", String::from_utf8_lossy(original)));
    assert!(validate_file(entry, &result.bytes, inputs).is_empty());
    verify_candidate(entry, original, &result.bytes, inputs).unwrap();
}

#[test]
fn external_manifest_pages_use_declared_defaults_and_preserve_xml() {
    let entry = entry_id("migration.help-manifest").expect("compiled manifest declaration");
    let inputs = nkdk_compiled_rules::prepare_inputs(
        entry,
        vec![(
            "pages".into(),
            nkdk_compiled_rules::InputValue::Sequence(vec![nkdk_compiled_rules::InputValue::Text(
                "ru".into(),
            )]),
        )],
    )
    .unwrap();
    let original = include_bytes!(
        "../../../../e2e/fixtures/xml/cf/DocumentJournals/ЖурналДокументовВсеСвойства/Ext/Help.xml"
    );
    let converted = convert_file(entry, Direction::XmlToYaml, original, &inputs).unwrap();
    assert!(
        converted.bytes.is_empty(),
        "{}",
        String::from_utf8_lossy(&converted.bytes)
    );
    assert_restored(entry, original, &inputs);
    assert_restored(entry, b"", &inputs);
    let original = std::str::from_utf8(original).unwrap();
    for pages in [
        "",
        "<Page/>",
        "<Page>en</Page>",
        "<Page>en</Page><Page>ru</Page>",
        "<Page>ru</Page><Page>ru</Page>",
        "<Page extra=\"1\">ru</Page>",
        "<Future/>",
    ] {
        let source = original.replace("<Page>ru</Page>", pages);
        assert_restored(entry, source.as_bytes(), &inputs);
    }
    assert_restored(
        entry,
        original
            .replace("version=\"2.20\"", "version=\"future\"")
            .as_bytes(),
        &inputs,
    );
}

#[test]
fn external_documents_join_owner_yaml_and_restore_without_xml_reference() {
    let entry = entry_id("migration.external-document").unwrap();
    let prepare = || {
        nkdk_compiled_rules::prepare_inputs(
            entry,
            vec![(
                "pages".into(),
                nkdk_compiled_rules::InputValue::Sequence(vec![
                    nkdk_compiled_rules::InputValue::Text("ru".into()),
                ]),
            )],
        )
        .unwrap()
    };
    let primary = b"<Root><Name>x</Name></Root>";
    let original = include_bytes!(
        "../../../../e2e/fixtures/xml/cf/DocumentJournals/ЖурналДокументовВсеСвойства/Ext/Help.xml"
    );
    for external in [
        original.to_vec(),
        vec![],
        String::from_utf8_lossy(original)
            .replace(
                "<Page>ru</Page>",
                "<Page extra=\"1\">en</Page><Page>ru</Page>",
            )
            .into_bytes(),
    ] {
        let path =
            nkdk_conversion_core::resources::RelativePath::new(["Ext", "Help.xml"], 4096).unwrap();
        let inputs = prepare()
            .with_documents(vec![(path, external.clone())])
            .unwrap();
        let yaml = convert_file(entry, Direction::XmlToYaml, primary, &inputs).unwrap();
        verify_candidate(entry, primary, &yaml.bytes, &inputs).unwrap();
        let restored = convert_file(entry, Direction::YamlToXml, &yaml.bytes, &prepare()).unwrap();
        assert_eq!(restored.documents.is_empty(), external.is_empty());
        let restored_inputs = prepare().with_documents(restored.documents).unwrap();
        let again = convert_file(
            entry,
            Direction::XmlToYaml,
            &restored.bytes,
            &restored_inputs,
        )
        .unwrap();
        assert_eq!(yaml.bytes, again.bytes);
    }
}

#[test]
fn additional_indexes_use_prepared_identities_and_existing_e2e_files() {
    use nkdk_compiled_rules::{
        InputValue, contribute_file, fact_builder, fact_id, prepare_fact_inputs,
    };
    use nkdk_conversion_core::facts::{
        FactState, Generation, prepared::FactBudget, text::TextBudget,
    };
    use std::sync::Arc;
    let root = std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join("../../..");
    let cases: serde_json::Value = serde_json::from_slice(include_bytes!(
        "../../../../tests/migration/additional-indexes-e2e.json"
    ))
    .unwrap();
    let cases = cases.as_array().unwrap();
    let entry = entry_id("migration.additional-indexes").unwrap();
    let generation = Generation(7);
    let budget = || FactBudget {
        text: TextBudget {
            entries: 1000,
            bytes: 100000,
        },
        rows: 1000,
    };
    let empty = Arc::new(fact_builder(generation, budget()).finish());
    let prepare = |facts, owner: &str| {
        prepare_fact_inputs(
            entry,
            facts,
            generation,
            vec![("owner".into(), InputValue::Text(owner.into()))],
        )
        .unwrap()
    };
    let mut builder = fact_builder(generation, budget());
    for case in cases {
        let xml = std::fs::read(root.join(case["source"].as_str().unwrap())).unwrap();
        let issues = contribute_file(
            entry,
            Direction::XmlToYaml,
            &xml,
            &prepare(empty.clone(), case["owner"].as_str().unwrap()),
            &mut builder,
        );
        assert!(issues.is_empty(), "{}: {issues:?}", case["source"]);
    }
    let snapshot = Arc::new(builder.finish());
    let index = fact_id("metadata.additional-index-ids").unwrap();
    let mut rows = 0;
    let mut nonzero = 0;
    for case in cases {
        let owner = case["owner"].as_str().unwrap();
        let xml = std::fs::read(root.join(case["source"].as_str().unwrap())).unwrap();
        let inputs = prepare(snapshot.clone(), owner);
        for item in case["identities"].as_array().unwrap() {
            let id = item["id"].as_str().unwrap();
            assert_eq!(
                snapshot.lookup_parts(generation, index, &[item["name"].as_str().unwrap(), owner]),
                FactState::Ready(id)
            );
            rows += 1;
            nonzero += usize::from(id != "00000000-0000-0000-0000-000000000000");
        }
        let yaml = convert_file(entry, Direction::XmlToYaml, &xml, &inputs)
            .unwrap_or_else(|error| panic!("{}: {error:?}", case["source"]));
        assert_eq!(
            String::from_utf8_lossy(&yaml.bytes),
            case["yaml"].as_str().unwrap(),
            "{}",
            case["source"]
        );
        assert!(validate_file(entry, &yaml.bytes, &inputs).is_empty());
        verify_candidate(entry, &xml, &yaml.bytes, &inputs).unwrap();
        let exported = convert_file(entry, Direction::YamlToXml, &yaml.bytes, &inputs).unwrap();
        nkdk_conversion_core::proof::verify(&xml, &exported.bytes, |_| false).unwrap();
        // The identity follows the name even after the YAML rows are reordered.
        let text = std::str::from_utf8(&yaml.bytes).unwrap();
        let mut reordered = text
            .strip_prefix("-\n")
            .unwrap()
            .split("\n-\n")
            .collect::<Vec<_>>();
        reordered.reverse();
        let reordered = format!("-\n{}", reordered.join("\n-\n"));
        let exported_reordered =
            convert_file(entry, Direction::YamlToXml, reordered.as_bytes(), &inputs).unwrap();
        let mut restored = fact_builder(generation, budget());
        assert!(
            contribute_file(
                entry,
                Direction::YamlToXml,
                reordered.as_bytes(),
                &inputs,
                &mut restored
            )
            .is_empty()
        );
        let mut from_reordered_xml = fact_builder(generation, budget());
        assert!(
            contribute_file(
                entry,
                Direction::XmlToYaml,
                &exported_reordered.bytes,
                &inputs,
                &mut from_reordered_xml
            )
            .is_empty()
        );
        let from_reordered_xml = from_reordered_xml.finish();
        let restored = restored.finish();
        for item in case["identities"].as_array().unwrap() {
            assert_eq!(
                from_reordered_xml.lookup_parts(
                    generation,
                    index,
                    &[item["name"].as_str().unwrap(), owner]
                ),
                FactState::Ready(item["id"].as_str().unwrap())
            );
            assert_eq!(
                restored.lookup_parts(generation, index, &[item["name"].as_str().unwrap(), owner]),
                FactState::Ready(item["id"].as_str().unwrap())
            );
        }
    }
    assert_eq!((cases.len(), rows, nonzero), (29, 35, 6));
}
