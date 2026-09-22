use nkdk_compiled_rules_probes as nkdk_compiled_rules;
use nkdk_compiled_rules::{Direction, PreparedInputs, convert_file, entry_id, verify_candidate};

fn convert(direction: Direction, source: &str) -> Vec<u8> {
    convert_file(
        entry_id("migration.type-description").unwrap(),
        direction,
        source.as_bytes(),
        &PreparedInputs::default(),
    )
    .unwrap()
    .bytes
}

#[test]
fn type_description_routes_names_sets_and_identifiers_declaratively() {
    let entry = entry_id("migration.type-description").unwrap();
    let inputs = PreparedInputs::default();
    let xml = r#"<Root xmlns:v8="http://v8.1c.ru/8.1/data/core" xmlns:cfg="http://v8.1c.ru/8.1/data/enterprise/current-config" xmlns:xs="http://www.w3.org/2001/XMLSchema"><Type><v8:Type>cfg:CatalogRef.Товары</v8:Type><v8:Type>xs:boolean</v8:Type><v8:TypeSet>cfg:CatalogRef</v8:TypeSet><v8:TypeId>8c1e3694-da12-44d5-8b1f-d134b89a1282</v8:TypeId></Type></Root>"#;
    let yaml = convert_file(entry, Direction::XmlToYaml, xml.as_bytes(), &inputs).unwrap();
    assert_eq!(
        yaml.bytes,
        "Тип:\n  -\n    Справочник.Товары\n  -\n    Булево\n  -\n    Справочник\n  -\n    8c1e3694-da12-44d5-8b1f-d134b89a1282"
            .as_bytes()
    );
    verify_candidate(entry, xml.as_bytes(), &yaml.bytes, &inputs).unwrap();

    let rebuilt = convert_file(entry, Direction::YamlToXml, &yaml.bytes, &inputs).unwrap();
    let rebuilt = String::from_utf8(rebuilt.bytes).unwrap();
    let elements = |local: &str| {
        rebuilt
            .lines()
            .filter(|line| {
                let line = line.trim_start();
                line.starts_with('<')
                    && !line.starts_with("</")
                    && line
                        .split_once('>')
                        .is_some_and(|(tag, _)| tag.ends_with(&format!(":{local}")))
            })
            .count()
    };
    assert_eq!(elements("Type"), 2, "{rebuilt}");
    assert_eq!(elements("TypeSet"), 1, "{rebuilt}");
    assert_eq!(elements("TypeId"), 1, "{rebuilt}");
}

#[test]
fn type_description_shortens_one_qualified_type_to_a_scalar() {
    let xml = r#"<Root xmlns:v8="http://v8.1c.ru/8.1/data/core" xmlns:xs="http://www.w3.org/2001/XMLSchema"><Type><v8:Type>xs:string</v8:Type><v8:StringQualifiers><v8:Length>100</v8:Length><v8:AllowedLength>Fixed</v8:AllowedLength></v8:StringQualifiers></Type></Root>"#;

    let yaml = convert(Direction::XmlToYaml, xml);

    assert_eq!(yaml, "Тип: ФиксированнаяСтрока(100)".as_bytes());
    verify_candidate(
        entry_id("migration.type-description").unwrap(),
        xml.as_bytes(),
        &yaml,
        &PreparedInputs::default(),
    )
    .unwrap();
}

#[test]
fn type_description_restores_default_and_explicit_qualifiers_from_yaml() {
    let cases = [
        (
            "Тип: Строка",
            "<v8:Type>xs:string</v8:Type><v8:StringQualifiers><v8:Length>0</v8:Length><v8:AllowedLength>Variable</v8:AllowedLength></v8:StringQualifiers>",
        ),
        (
            "Тип: Строка(10)",
            "<v8:Type>xs:string</v8:Type><v8:StringQualifiers><v8:Length>10</v8:Length><v8:AllowedLength>Variable</v8:AllowedLength></v8:StringQualifiers>",
        ),
        (
            "Тип: ПоложительноеЧисло(10, 2)",
            "<v8:Type>xs:decimal</v8:Type><v8:NumberQualifiers><v8:Digits>10</v8:Digits><v8:FractionDigits>2</v8:FractionDigits><v8:AllowedSign>Nonnegative</v8:AllowedSign></v8:NumberQualifiers>",
        ),
        (
            "Тип: Время",
            "<v8:Type>xs:dateTime</v8:Type><v8:DateQualifiers><v8:DateFractions>Time</v8:DateFractions></v8:DateQualifiers>",
        ),
        (
            "Тип: ДвоичныеДанные",
            "<v8:Type>xs:base64Binary</v8:Type><v8:BinaryDataQualifiers><v8:Length>0</v8:Length><v8:AllowedLength>Variable</v8:AllowedLength></v8:BinaryDataQualifiers>",
        ),
        (
            "Тип: ОпределяемыйТип.ОпределяемыйТипВсеСвойства",
            "<v8:TypeSet>cfg:DefinedType.ОпределяемыйТипВсеСвойства</v8:TypeSet>",
        ),
    ];

    for (yaml, body) in cases {
        convert(Direction::YamlToXml, yaml);
        let xml = format!(
            r#"<Root xmlns:v8="http://v8.1c.ru/8.1/data/core" xmlns:cfg="http://v8.1c.ru/8.1/data/enterprise/current-config" xmlns:xs="http://www.w3.org/2001/XMLSchema"><Type>{body}</Type></Root>"#
        );
        verify_candidate(
            entry_id("migration.type-description").unwrap(),
            xml.as_bytes(),
            yaml.as_bytes(),
            &PreparedInputs::default(),
        )
        .unwrap();
    }
}

#[test]
fn type_description_preserves_order_repetitions_and_unknown_xml_as_anomalies() {
    let cases = [
        r#"<Root xmlns:v8="http://v8.1c.ru/8.1/data/core" xmlns:cfg="http://v8.1c.ru/8.1/data/enterprise/current-config" xmlns:xs="http://www.w3.org/2001/XMLSchema"><Type><v8:TypeSet>cfg:AnyIBRef</v8:TypeSet><v8:Type>xs:string</v8:Type><v8:Type>xs:string</v8:Type><v8:TypeId>8c1e3694-da12-44d5-8b1f-d134b89a1282</v8:TypeId><v8:StringQualifiers><v8:Length>12</v8:Length><v8:AllowedLength>Variable</v8:AllowedLength></v8:StringQualifiers></Type></Root>"#,
        r#"<Root xmlns:v8="http://v8.1c.ru/8.1/data/core" xmlns:u="urn:unknown"><Type><v8:Type>u:Unexpected</v8:Type></Type></Root>"#,
        r#"<Root xmlns:v8="http://v8.1c.ru/8.1/data/core"><Type><v8:TypeId>not-a-uuid</v8:TypeId><v8:TypeId>not-a-uuid</v8:TypeId></Type></Root>"#,
    ];

    for (index, xml) in cases.into_iter().enumerate() {
        let yaml = convert_file(
            entry_id("migration.type-description").unwrap(),
            Direction::XmlToYaml,
            xml.as_bytes(),
            &PreparedInputs::default(),
        )
        .unwrap_or_else(|errors| panic!("case {index}: {errors:?}"))
        .bytes;
        verify_candidate(
            entry_id("migration.type-description").unwrap(),
            xml.as_bytes(),
            &yaml,
            &PreparedInputs::default(),
        )
        .unwrap();
    }
}

#[test]
fn type_description_does_not_abort_on_conflicting_yaml_qualifiers() {
    let yaml = "Тип:\n  -\n    Строка(10)\n  -\n    ФиксированнаяСтрока(20)";

    convert(Direction::YamlToXml, yaml);
}

#[test]
fn type_description_adds_declared_type_attribute() {
    let result = convert_file(
        entry_id("migration.type-description-typed").unwrap(),
        Direction::YamlToXml,
        "Тип: Строка".as_bytes(),
        &PreparedInputs::default(),
    )
    .unwrap();
    let xml = String::from_utf8(result.bytes).unwrap();
    assert!(
        xml.lines()
            .any(|line| line.contains(":type=\"") && line.contains(":TypeDescription\"")),
        "{xml}"
    );
    assert!(
        xml.lines()
            .any(|line| line.contains(":Type>") && line.contains(":string</")),
        "{xml}"
    );
}

#[test]
fn type_description_declares_metadata_attribute_restrictions() {
    let result = convert_file(
        entry_id("migration.type-description-restricted").unwrap(),
        Direction::YamlToXml,
        "Тип: ТаблицаЗначений".as_bytes(),
        &PreparedInputs::default(),
    )
    .unwrap();
    assert!(
        result
            .diagnostics
            .iter()
            .any(|diagnostic| diagnostic.code.as_deref() == Some("type-description.allowed")),
        "{:?}",
        result.diagnostics
    );
}

#[test]
fn type_description_reports_missing_required_value_without_aborting() {
    let result = convert_file(
        entry_id("migration.type-description-required").unwrap(),
        Direction::XmlToYaml,
        b"<Root/>",
        &PreparedInputs::default(),
    )
    .unwrap();
    assert!(
        result
            .diagnostics
            .iter()
            .any(|diagnostic| diagnostic.code.as_deref() == Some("value.required")),
        "{:?}",
        result.diagnostics
    );
}

#[test]
fn type_description_property_uses_a_declared_owner_condition() {
    let entry = entry_id("migration.type-description-conditional").unwrap();
    let yaml = "Тип: Строка".as_bytes();
    let convert = |kind: &str| {
        let inputs = nkdk_compiled_rules::prepare_inputs(
            entry,
            vec![(
                "ownerKind".into(),
                nkdk_compiled_rules::InputValue::Text(kind.into()),
            )],
        )
        .unwrap();
        String::from_utf8(
            convert_file(entry, Direction::YamlToXml, yaml, &inputs)
                .unwrap()
                .bytes,
        )
        .unwrap()
    };
    assert!(!convert("Папка").contains("<Type"));
    let emitted = convert("Поле");
    assert!(emitted.contains("<Type"), "{emitted}");
}

#[test]
fn type_description_restores_the_declared_adopted_default() {
    let entry = entry_id("migration.type-description-adopted").unwrap();
    let convert = |variant: &str| {
        let inputs = nkdk_compiled_rules::prepare_inputs(
            entry,
            vec![(
                "xmlDefaultVariant".into(),
                nkdk_compiled_rules::InputValue::Text(variant.into()),
            )],
        )
        .unwrap();
        String::from_utf8(
            convert_file(entry, Direction::YamlToXml, b"{}", &inputs)
                .unwrap()
                .bytes,
        )
        .unwrap()
    };
    assert!(!convert("full").contains("<Type"));
    let adopted = convert("adopted");
    assert!(adopted.contains("<Type"), "{adopted}");
}

#[test]
fn type_description_supports_a_yaml_only_owner_field() {
    let entry = entry_id("migration.type-description-runtime-only").unwrap();
    let inputs = PreparedInputs::default();
    let xml = b"<Root><Visible>false</Visible></Root>";
    let yaml = convert_file(entry, Direction::XmlToYaml, xml, &inputs).unwrap();
    assert_eq!(yaml.bytes, "Видимость: Ложь".as_bytes());
    let restored = convert_file(
        entry,
        Direction::YamlToXml,
        "Видимость: Ложь\nОграничениеТипа: Строка".as_bytes(),
        &inputs,
    )
    .unwrap();
    let restored = String::from_utf8(restored.bytes).unwrap();
    assert!(restored.contains("<Visible>false</Visible>"), "{restored}");
    assert!(!restored.contains("<Type"), "{restored}");
}

#[test]
fn type_description_matches_the_legacy_meaning_for_the_real_e2e_corpus() {
    let corpus: serde_json::Value = serde_json::from_slice(include_bytes!(
        "../../../../tests/migration/type-description-e2e.json"
    ))
    .unwrap();
    let cases = corpus["cases"].as_array().unwrap();
    assert_eq!(cases.len(), 202);
    let entry = entry_id("migration.type-description").unwrap();
    let inputs = PreparedInputs::default();
    let values = |source: &[u8]| {
        let source = std::str::from_utf8(source).unwrap();
        if let Some(value) = source.strip_prefix("Тип: ") {
            return vec![value.to_owned()];
        }
        source
            .lines()
            .skip(1)
            .filter_map(|line| {
                let value = line.trim();
                if value.is_empty() || value == "-" {
                    None
                } else {
                    Some(value.strip_prefix("- ").unwrap_or(value).to_owned())
                }
            })
            .collect::<Vec<_>>()
    };

    for case in cases {
        let source = std::fs::read(
            std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
                .join("../../..")
                .join(case["source"].as_str().unwrap()),
        )
        .unwrap();
        let original = case["original"].as_str().unwrap().as_bytes();
        let start = case["start"].as_u64().unwrap() as usize;
        assert_eq!(
            source.get(start..start + original.len()),
            Some(original),
            "Changed source {}",
            case["source"]
        );

        let xml = case["xml"].as_str().unwrap().as_bytes();
        let converted = convert_file(entry, Direction::XmlToYaml, xml, &inputs)
            .unwrap_or_else(|errors| panic!("{}: {errors:?}", case["source"]));
        let expected = match &case["yaml"] {
            serde_json::Value::String(value) => vec![value.to_owned()],
            serde_json::Value::Array(values) => values
                .iter()
                .map(|value| value.as_str().unwrap().to_owned())
                .collect(),
            value => panic!("Unexpected legacy value for {}: {value}", case["source"]),
        };
        let meaning = nkdk_conversion_core::raw::Property::decode(&converted.bytes, "Тип", "Type")
            .unwrap()
            .map_or_else(|| converted.bytes.clone(), |envelope| envelope.meaning);
        assert_eq!(values(&meaning), expected, "{}", case["source"]);
        verify_candidate(entry, xml, &converted.bytes, &inputs)
            .unwrap_or_else(|error| panic!("{}: {error:?}", case["source"]));
    }
}
