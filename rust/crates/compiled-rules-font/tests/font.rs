use nkdk_compiled_rules::{
    Direction, PreparedInputs, convert_file, entry_id, validate_file, verify_candidate,
};
use nkdk_compiled_rules_font as nkdk_compiled_rules;

#[path = "../../../test-support/ui_fragment.rs"]
mod ui_fragment;
use ui_fragment::document as font_document;

fn assert_font_round_trip(
    entry: nkdk_compiled_rules::EntryId,
    xml: &str,
    yaml: &str,
    inputs: &PreparedInputs,
) -> String {
    let xml = font_document(xml);
    let exported = convert_file(entry, Direction::YamlToXml, yaml.as_bytes(), inputs).unwrap();
    let xml_output = String::from_utf8(exported.bytes).unwrap();
    let imported = convert_file(entry, Direction::XmlToYaml, xml.as_bytes(), inputs).unwrap();
    assert_eq!(
        String::from_utf8(imported.bytes).unwrap(),
        yaml,
        "{xml_output}"
    );
    verify_candidate(entry, xml.as_bytes(), yaml.as_bytes(), inputs).unwrap();
    xml_output
}

#[test]
fn font_reference_uses_existing_style_and_windows_names() {
    let entry = entry_id("probe.font-reference-owner").unwrap();
    for (xml, expected) in [
        ("style:LargeTextFont", "КрупныйШрифтТекста"),
        ("sys:ANSIFixedFont", "ANSIШрифтМоноширинный"),
    ] {
        let source = format!("<Root><Font>{xml}</Font></Root>");
        let yaml = format!("Шрифт: {expected}");
        let exported = assert_font_round_trip(entry, &source, &yaml, &PreparedInputs::default());
        assert!(exported.contains(xml.split(':').nth(1).unwrap()));
    }
    let style =
        include_str!("../../../../e2e/fixtures/xml/cf/StyleItems/ЭлементСтиляШрифтВсеСвойства.xml");
    let (_, inputs) = color_inputs_from_xml("probe.font-reference-owner", &[style]);
    let source = "<Root><Font>style:ЭлементСтиляШрифтВсеСвойства</Font></Root>";
    assert_font_round_trip(
        entry,
        source,
        "Шрифт: ЭлементСтиля.ЭлементСтиляШрифтВсеСвойства",
        &inputs,
    );
}

#[test]
fn font_record_infers_xml_kind_from_its_reference() {
    let entry = entry_id("probe.font-record-owner").unwrap();
    for (kind, reference, expected) in [
        ("StyleItem", "style:LargeTextFont", "КрупныйШрифтТекста"),
        ("WindowsFont", "sys:ANSIFixedFont", "ANSIШрифтМоноширинный"),
    ] {
        let xml = format!("<Root><Font ref=\"{reference}\" kind=\"{kind}\"/></Root>");
        let yaml = format!("Вид: {expected}");
        let exported = assert_font_round_trip(entry, &xml, &yaml, &PreparedInputs::default());
        assert!(
            exported.contains(reference.split(':').nth(1).unwrap()),
            "{exported}"
        );
        assert!(exported.contains(&format!("kind=\"{kind}\"")), "{exported}");
    }
    let style =
        include_str!("../../../../e2e/fixtures/xml/cf/StyleItems/ЭлементСтиляШрифтВсеСвойства.xml");
    let (entry, inputs) = color_inputs_from_xml("probe.font-record-owner", &[style]);
    let yaml = "Вид: ЭлементСтиля.ЭлементСтиляШрифтВсеСвойства";
    let exported = convert_file(entry, Direction::YamlToXml, yaml.as_bytes(), &inputs).unwrap();
    let exported = String::from_utf8(exported.bytes).unwrap();
    assert!(
        exported.contains("ЭлементСтиляШрифтВсеСвойства"),
        "{exported}"
    );
    assert!(exported.contains("kind=\"StyleItem\""), "{exported}");
    verify_candidate(
        entry,
        font_document(
            "<Root><Font ref=\"style:ЭлементСтиляШрифтВсеСвойства\" kind=\"StyleItem\"/></Root>",
        )
        .as_bytes(),
        yaml.as_bytes(),
        &inputs,
    )
    .unwrap();
}

#[test]
fn font_owner_preserves_all_attributes_and_explicit_false() {
    let entry = entry_id("probe.font-owner").unwrap();
    let xml = "<Root><Font faceName=\"\" height=\"0\" bold=\"false\" italic=\"true\" underline=\"false\" strikeout=\"true\" kind=\"Absolute\" scale=\"100\"/></Root>";
    let yaml = "Шрифт:\n  ВидXML: Absolute\n  Имя: \"\"\n  Размер: 0\n  Масштаб: 100\n  Полужирный: Ложь\n  Наклонный: Истина\n  Подчеркивание: Ложь\n  Зачеркивание: Истина";
    let exported = assert_font_round_trip(entry, xml, yaml, &PreparedInputs::default());
    for attribute in [
        "faceName=\"\"",
        "height=\"0\"",
        "scale=\"100\"",
        "bold=\"false\"",
        "italic=\"true\"",
        "underline=\"false\"",
        "strikeout=\"true\"",
        "kind=\"Absolute\"",
    ] {
        assert!(exported.contains(attribute), "{attribute}: {exported}");
    }
}

#[test]
fn font_owner_preserves_unusual_reference_without_raw_xml() {
    let entry = entry_id("probe.font-owner").unwrap();
    let xml = "<Root><Font ref=\"0\" height=\"10\" kind=\"StyleItem\"/></Root>";
    let yaml = "Шрифт:\n  Вид: ЭлементСтиля\n  Значение: \"0\"\n  Размер: 10";
    let exported = assert_font_round_trip(entry, xml, yaml, &PreparedInputs::default());
    assert!(exported.contains("ref=\"0\""), "{exported}");
    assert!(exported.contains("kind=\"StyleItem\""), "{exported}");
}

#[test]
fn font_covers_existing_yaml_forms() {
    let entry = entry_id("probe.font-owner").unwrap();
    for (xml, yaml) in [
        (
            "<Root><Font faceName=\"Academy Engraved LET\" kind=\"Absolute\"/></Root>",
            "Шрифт:\n  ВидXML: Absolute\n  Имя: Academy Engraved LET",
        ),
        (
            "<Root><Font faceName=\"style:TooltipTitleFont\" kind=\"Absolute\"/></Root>",
            "Шрифт:\n  ВидXML: Absolute\n  Имя: style:TooltipTitleFont",
        ),
        (
            "<Root><Font ref=\"sys:DefaultGUIFont\" bold=\"true\" italic=\"false\" underline=\"false\" strikeout=\"false\" kind=\"WindowsFont\"/></Root>",
            "Шрифт:\n  Вид: ШрифтДиалоговИМеню\n  Полужирный: Истина\n  Наклонный: Ложь\n  Подчеркивание: Ложь\n  Зачеркивание: Ложь",
        ),
        (
            "<Root><Font ref=\"style:LargeTextFont\" faceName=\"Times New Roman\" height=\"20\" bold=\"true\" italic=\"true\" underline=\"true\" strikeout=\"true\" kind=\"StyleItem\" scale=\"200\"/></Root>",
            "Шрифт:\n  Вид: КрупныйШрифтТекста\n  Имя: Times New Roman\n  Размер: 20\n  Масштаб: 200\n  Полужирный: Истина\n  Наклонный: Истина\n  Подчеркивание: Истина\n  Зачеркивание: Истина",
        ),
        (
            "<Root><Font bold=\"true\" kind=\"AutoFont\"/></Root>",
            "Шрифт:\n  ВидXML: AutoFont\n  Полужирный: Истина",
        ),
    ] {
        assert_font_round_trip(entry, xml, yaml, &PreparedInputs::default());
    }
}

#[test]
fn font_reads_a_real_form_and_rejects_wrong_style_item_type() {
    let form = include_str!("../../../../e2e/fixtures/xml/cf/CommonForms/InputField/Ext/Form.xml");
    let start = form.find("<Font ").unwrap();
    let end = form[start..].find("/>").unwrap() + start + 2;
    let xml = format!("<Root>{}</Root>", &form[start..end]);
    let yaml = "Шрифт:\n  Вид: ОбычныйШрифтТекста";
    assert_font_round_trip(
        entry_id("probe.font-owner").unwrap(),
        &xml,
        yaml,
        &PreparedInputs::default(),
    );

    let style =
        include_str!("../../../../e2e/fixtures/xml/cf/StyleItems/ЭлементСтиляШрифтВсеСвойства.xml");
    let (entry, inputs) = color_inputs_from_xml("probe.font-owner", &[style]);
    let xml = "<Root><Font ref=\"style:ЭлементСтиляШрифтВсеСвойства\" kind=\"StyleItem\"/></Root>";
    assert_font_round_trip(
        entry,
        xml,
        "Шрифт:\n  Вид: ЭлементСтиля.ЭлементСтиляШрифтВсеСвойства",
        &inputs,
    );

    let wrong = "Шрифт:\n  Вид: ЭлементСтиля.Отсутствует";
    let issues = validate_file(entry, wrong.as_bytes(), &inputs);
    assert_eq!(
        issues
            .iter()
            .filter(|issue| issue.code.as_deref() == Some("font.style-item"))
            .count(),
        1,
        "{issues:?}"
    );
}

#[test]
fn font_validation_uses_its_declared_scalar_and_reference_rules() {
    let entry = entry_id("probe.font-owner").unwrap();
    for yaml in [
        "Шрифт:\n  ВидXML: Absolute\n  Размер: нет",
        "Шрифт:\n  ВидXML: Absolute\n  Полужирный: Да",
        "Шрифт:\n  Вид: НеизвестныйШрифт",
    ] {
        assert!(
            !validate_file(entry, yaml.as_bytes(), &PreparedInputs::default()).is_empty(),
            "{yaml}"
        );
    }
}

include!("../../compiled-rules/tests/support/style_item_inputs.rs");

#[test]
fn font_round_trips_every_real_e2e_occurrence() {
    let entry = entry_id("probe.font-owner").unwrap();
    let files = [
        "Styles/СтильВсеСвойства/Ext/Style.xml",
        "BusinessProcesses/БизнесПроцессВсеСвойства/Ext/Flowchart.xml",
        "CommonForms/CalendarField/Ext/Form.xml",
        "CommonForms/ExtendedTooltip/Ext/Form.xml",
        "CommonForms/PeriodField/Ext/Form.xml",
        "CommonForms/PictureField/Ext/Form.xml",
        "CommonForms/LabelField/Ext/Form.xml",
        "CommonForms/Button/Ext/Form.xml",
        "CommonForms/TextDocumentField/Ext/Form.xml",
        "CommonForms/FormDecoraction/Ext/Form.xml",
        "CommonForms/InputField/Ext/Form.xml",
        "CommonForms/RadioButtonField/Ext/Form.xml",
        "CommonForms/PDFDocumentField/Ext/Form.xml",
        "CommonForms/FormattedDocumentField/Ext/Form.xml",
        "CommonForms/Table/Ext/Form.xml",
    ];
    let mut seen = 0;
    for file in files {
        let path = format!(
            "{}/../../../e2e/fixtures/xml/cf/{file}",
            env!("CARGO_MANIFEST_DIR")
        );
        let source = std::fs::read_to_string(path).unwrap();
        let mut remaining = source.as_str();
        while let Some(start) = remaining.find("<Font ") {
            remaining = &remaining[start..];
            let end = remaining
                .find("/>")
                .expect("Font fixture is a standalone element")
                + 2;
            let original = font_document(&format!("<Root>{}</Root>", &remaining[..end]));
            remaining = &remaining[end..];
            let yaml = convert_file(
                entry,
                Direction::XmlToYaml,
                original.as_bytes(),
                &PreparedInputs::default(),
            )
            .unwrap_or_else(|errors| panic!("{file}: {errors:?}"));
            verify_candidate(
                entry,
                original.as_bytes(),
                &yaml.bytes,
                &PreparedInputs::default(),
            )
            .unwrap_or_else(|errors| panic!("{file}: {errors:?}"));
            seen += 1;
        }
    }
    assert_eq!(seen, 28);
}

#[test]
fn invalid_font_attribute_is_an_anomaly_and_keeps_its_sibling() {
    let entry = entry_id("probe.font-owner").unwrap();
    for (attributes, invalid) in [
        ("kind=\"Absolute\" bold=\"oops\"", "bold=\"oops\""),
        ("kind=\"Absolute\" height=\"NaN\"", "height=\"NaN\""),
        ("kind=\"Alien\"", "kind=\"Alien\""),
        (
            "ref=\"unknown:Thing\" kind=\"StyleItem\"",
            "ref=\"unknown:Thing\"",
        ),
    ] {
        let xml = format!("<Root><Font {attributes} italic=\"true\"/></Root>");
        let imported = convert_file(
            entry,
            Direction::XmlToYaml,
            xml.as_bytes(),
            &PreparedInputs::default(),
        )
        .expect("invalid source value must be preserved as an anomaly");
        let yaml = String::from_utf8(imported.bytes.clone()).unwrap();
        assert!(
            yaml.contains("!xml/raw") || yaml.contains("!xml/invalid"),
            "{yaml}"
        );
        assert!(yaml.contains("Наклонный: Истина"), "{yaml}");
        verify_candidate(
            entry,
            xml.as_bytes(),
            &imported.bytes,
            &PreparedInputs::default(),
        )
        .unwrap();
        let restored = convert_file(
            entry,
            Direction::YamlToXml,
            &imported.bytes,
            &PreparedInputs::default(),
        )
        .unwrap();
        let restored = String::from_utf8(restored.bytes).unwrap();
        assert!(restored.contains(invalid), "{restored}");
        assert!(restored.contains("italic=\"true\""), "{restored}");
    }
}

#[test]
fn empty_font_is_distinct_from_missing_font() {
    let entry = entry_id("probe.font-owner").unwrap();
    let inputs = PreparedInputs::default();
    let missing = convert_file(entry, Direction::XmlToYaml, b"<Root/>", &inputs).unwrap();
    assert!(missing.bytes.is_empty());
    let empty = b"<Root><Font/></Root>";
    let imported = convert_file(entry, Direction::XmlToYaml, empty, &inputs).unwrap();
    let yaml = String::from_utf8_lossy(&imported.bytes);
    assert!(yaml.contains("!xml/raw"), "{yaml}");
    verify_candidate(entry, empty, &imported.bytes, &inputs).unwrap();
}
