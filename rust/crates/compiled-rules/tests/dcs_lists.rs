use nkdk_compiled_rules::{Direction, convert_file, entry_id, verify_candidate};
use nkdk_compiled_rules_probes as nkdk_compiled_rules;
#[path = "support/metadata_value_inputs.rs"]
mod metadata_value_inputs_support;
use metadata_value_inputs_support::metadata_value_inputs;

fn rooted_values_fixture(source: &str) -> String {
    source
        .replace(
            "<root>",
            "<Root xmlns:dcssch=\"http://v8.1c.ru/8.1/data-composition-system/schema\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:xs=\"http://www.w3.org/2001/XMLSchema\" xmlns:v8=\"http://v8.1c.ru/8.1/data/core\">",
        )
        .replace("</root>", "</Root>")
}

#[test]
fn available_values_preserve_missing_value_and_presentation() {
    let entry = entry_id("migration.dcs-available-values").unwrap();
    let inputs = metadata_value_inputs(entry);
    for (source, expected) in [
        (
            include_str!(
                "../../../../packages/rules/metadata/commonObjects/dataCompositionSystem/availableValues/__fixtures__/strings.xml"
            ),
            ["Значение: Выставлен", "Представление: Выставлен"],
        ),
        (
            include_str!(
                "../../../../packages/rules/metadata/commonObjects/dataCompositionSystem/availableValues/__fixtures__/nilAndBoolean.xml"
            ),
            ["    {}", "Значение: Истина"],
        ),
    ] {
        let xml = rooted_values_fixture(source);
        let _yaml = expected_round_trip(entry, &xml, &inputs, &expected);
    }

    let fresh = "ДоступныеЗначения:\n  - {}\n  - Значение: Истина";
    let exported = convert_file(entry, Direction::YamlToXml, fresh.as_bytes(), &inputs).unwrap();
    let xml = String::from_utf8(exported.bytes).unwrap();
    assert!(xml.contains(":nil=\"true\""), "{xml}");
    assert!(xml.contains(">true</"), "{xml}");

    let invalid = rooted_values_fixture(include_str!("../../../../packages/rules/metadata/commonObjects/dataCompositionSystem/availableValues/__fixtures__/strings.xml"))
        .replace("xsi:type=\"xs:string\">Аннулирован</dcssch:value>", "xsi:type=\"xs:boolean\">oops</dcssch:value>");
    let imported = convert_file(entry, Direction::XmlToYaml, invalid.as_bytes(), &inputs).unwrap();
    let yaml = String::from_utf8(imported.bytes).unwrap();
    assert!(
        yaml.contains("Значение: Выставлен") && yaml.contains("!xml/raw"),
        "{yaml}"
    );
    assert_eq!(yaml.matches("!xml/raw").count(), 1, "{yaml}");
    verify_candidate(entry, invalid.as_bytes(), yaml.as_bytes(), &inputs).unwrap();
    let empty = b"<Root/>";
    let converted = convert_file(entry, Direction::XmlToYaml, empty, &inputs).unwrap();
    verify_candidate(entry, empty, &converted.bytes, &inputs).unwrap();
}

#[test]
fn structure_item_group_flattens_linear_xml_chain() {
    let entry = entry_id("migration.structure-item-group").unwrap();
    let inputs = nkdk_compiled_rules::prepare_inputs(entry, Vec::new()).unwrap();
    let source = include_str!(
        "../../../../packages/rules/metadata/commonObjects/dataCompositionSystem/structureItemGroup/__fixtures__/dynamicList.xml"
    );
    let xml = source.replace(
        "<dcsset:item ",
        "<dcsset:item xmlns:dcsset=\"http://v8.1c.ru/8.1/data-composition-system/settings\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:xs=\"http://www.w3.org/2001/XMLSchema\" ",
    );
    let imported = convert_file(entry, Direction::XmlToYaml, xml.as_bytes(), &inputs).unwrap();
    let yaml = String::from_utf8(imported.bytes).unwrap();
    for expected in ["Наименование", "[Авто]", "ПометкаУдаления"] {
        assert!(yaml.contains(expected), "{yaml}");
    }
    assert!(!yaml.contains("!xml/"), "{yaml}");
    verify_candidate(entry, xml.as_bytes(), yaml.as_bytes(), &inputs).unwrap();
    let authored = "Группировка:\n  - Наименование\n  - '[Авто]'\n  - Поле: ПометкаУдаления\n    Использование: Ложь";
    let exported = convert_file(entry, Direction::YamlToXml, authored.as_bytes(), &inputs).unwrap();
    let exported = String::from_utf8(exported.bytes).unwrap();
    assert_eq!(
        exported.matches("StructureItemGroup\"").count(),
        3,
        "{exported}"
    );
    assert_eq!(exported.matches("groupItems>").count(), 6, "{exported}");
    let again = convert_file(entry, Direction::XmlToYaml, exported.as_bytes(), &inputs).unwrap();
    assert!(!String::from_utf8_lossy(&again.bytes).contains("!xml/"));
    let empty = convert_file(
        entry,
        Direction::YamlToXml,
        "Группировка: []".as_bytes(),
        &inputs,
    )
    .unwrap();
    assert!(empty.bytes.is_empty());
    let branched = xml.replacen(
        "\n</dcsset:item>",
        "\n<dcsset:item xsi:type=\"dcsset:StructureItemGroup\"><dcsset:groupItems><dcsset:item xsi:type=\"dcsset:GroupItemAuto\"/></dcsset:groupItems></dcsset:item>\n</dcsset:item>",
        1,
    );
    assert_ne!(branched, xml);
    let exceptional =
        convert_file(entry, Direction::XmlToYaml, branched.as_bytes(), &inputs).unwrap();
    let exceptional = String::from_utf8(exceptional.bytes).unwrap();
    assert!(exceptional.contains("!xml/"), "{exceptional}");
    verify_candidate(entry, branched.as_bytes(), exceptional.as_bytes(), &inputs).unwrap();
    for unusual in [
        xml.replacen(
            "<dcsset:groupItems>",
            "<dcsset:groupItems><dcsset:item xsi:type=\"dcsset:GroupItemAuto\"/>",
            1,
        ),
        xml.replacen(
            "xsi:type=\"dcsset:StructureItemGroup\"",
            "xsi:type=\"dcsset:StructureItemGroup\" unexpected=\"kept\"",
            1,
        ),
        "<dcsset:item xmlns:dcsset=\"http://v8.1c.ru/8.1/data-composition-system/settings\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xsi:type=\"dcsset:StructureItemGroup\"/>".to_owned(),
    ] {
        let converted = convert_file(entry, Direction::XmlToYaml, unusual.as_bytes(), &inputs).unwrap();
        let yaml = String::from_utf8(converted.bytes).unwrap();
        assert!(yaml.contains("!xml/"), "{yaml}");
        verify_candidate(entry, unusual.as_bytes(), yaml.as_bytes(), &inputs).unwrap();
    }
    let form =
        include_str!("../../../../e2e/fixtures/xml/cf/CommonForms/ДинамическийСписок/Ext/Form.xml");
    let mut last_end = 0;
    let mut roots = 0;
    for (start, _) in form.match_indices("<dcsset:item xsi:type=\"dcsset:StructureItemGroup\">") {
        if start < last_end {
            continue;
        }
        last_end = group_item_end(form, start);
        let fragment = form[start..last_end].replacen(
            "<dcsset:item ",
            "<dcsset:item xmlns:dcsset=\"http://v8.1c.ru/8.1/data-composition-system/settings\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:xs=\"http://www.w3.org/2001/XMLSchema\" ",
            1,
        );
        expected_round_trip(entry, &fragment, &inputs, &[]);
        roots += 1;
    }
    assert_eq!(roots, 3);
}

fn group_item_end(source: &str, start: usize) -> usize {
    let mut cursor = start;
    let mut depth = 0;
    loop {
        let next_open = source[cursor..].find("<dcsset:item").map(|at| cursor + at);
        let next_close = source[cursor..]
            .find("</dcsset:item>")
            .map(|at| cursor + at);
        match (next_open, next_close) {
            (Some(open), Some(close)) if open < close => {
                let tag_end = open + source[open..].find('>').unwrap() + 1;
                if !source[open..tag_end].ends_with("/>") {
                    depth += 1;
                }
                cursor = tag_end;
            }
            (_, Some(close)) => {
                depth -= 1;
                cursor = close + "</dcsset:item>".len();
                if depth == 0 {
                    return cursor;
                }
            }
            _ => panic!("unclosed group item"),
        }
    }
}

fn rooted_fields_fixture(source: &str) -> String {
    format!(
        "<Root xmlns:dcsset=\"http://v8.1c.ru/8.1/data-composition-system/settings\" xmlns:v8=\"http://v8.1c.ru/8.1/data/core\">{source}</Root>"
    )
}

#[test]
fn group_item_field_shortens_defaults_and_keeps_nondefault_fields() {
    let entry = entry_id("migration.group-item-field").unwrap();
    let inputs = nkdk_compiled_rules::prepare_inputs(entry, Vec::new()).unwrap();
    let authored = "Значение: Наименование";
    let exported_short =
        convert_file(entry, Direction::YamlToXml, authored.as_bytes(), &inputs).unwrap();
    let imported =
        convert_file(entry, Direction::XmlToYaml, &exported_short.bytes, &inputs).unwrap();
    assert!(String::from_utf8_lossy(&imported.bytes).contains("Наименование"));
    for (fixture, expected) in [
        (
            include_str!(
                "../../../../packages/rules/metadata/commonObjects/dataCompositionSystem/structureItemGroup/items/groupItemField/__fixtures__/dynamicListDefault.xml"
            ),
            "  Наименование",
        ),
        (
            include_str!(
                "../../../../packages/rules/metadata/commonObjects/dataCompositionSystem/structureItemGroup/items/groupItemField/__fixtures__/dynamicList.xml"
            ),
            "Использование: Ложь",
        ),
    ] {
        let xml = fixture.replace("<dcsset:item ", "<dcsset:item xmlns:dcsset=\"http://v8.1c.ru/8.1/data-composition-system/settings\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:xs=\"http://www.w3.org/2001/XMLSchema\" ");
        expected_round_trip(entry, &xml, &inputs, &[expected]);
    }
    let configured = "Значение:\n  Поле: СсылкаВидЦен\n  ТипГруппировки: Иерархия\n  ТипДополнения: Год\n  НачалоПериода: 10.09.2026 12:00\n  КонецПериода: 11.09.2026 12:00";
    let exported =
        convert_file(entry, Direction::YamlToXml, configured.as_bytes(), &inputs).unwrap();
    let imported = convert_file(entry, Direction::XmlToYaml, &exported.bytes, &inputs).unwrap();
    let yaml = String::from_utf8(imported.bytes).unwrap();
    for value in ["Иерархия", "Год", "10.09.2026 12:00", "11.09.2026 12:00"] {
        assert!(yaml.contains(value), "{yaml}");
    }
    verify_candidate(entry, &exported.bytes, yaml.as_bytes(), &inputs).unwrap();
    let legacy = convert_file(
        entry,
        Direction::YamlToXml,
        "Значение: (Наименование)".as_bytes(),
        &inputs,
    )
    .unwrap();
    assert!(String::from_utf8_lossy(&legacy.bytes).contains(":use>false</"));
    let canonical = convert_file(entry, Direction::XmlToYaml, &legacy.bytes, &inputs).unwrap();
    let canonical = String::from_utf8(canonical.bytes).unwrap();
    assert!(
        canonical.contains("Использование: Ложь") && !canonical.contains("(Наименование)"),
        "{canonical}"
    );
    let literal_name = "Значение:\n  Поле: '(Наименование)'";
    let exported_name = convert_file(
        entry,
        Direction::YamlToXml,
        literal_name.as_bytes(),
        &inputs,
    )
    .unwrap();
    let imported_name =
        convert_file(entry, Direction::XmlToYaml, &exported_name.bytes, &inputs).unwrap();
    let imported_name = String::from_utf8(imported_name.bytes).unwrap();
    assert!(
        imported_name.contains("Поле: (Наименование)")
            && !imported_name.contains("Использование: Ложь"),
        "{imported_name}"
    );
    let fixture = include_str!(
        "../../../../packages/rules/metadata/commonObjects/dataCompositionSystem/structureItemGroup/items/groupItemField/__fixtures__/dynamicListDefault.xml"
    );
    let invalid = fixture.replace("<dcsset:item ", "<dcsset:item xmlns:dcsset=\"http://v8.1c.ru/8.1/data-composition-system/settings\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:xs=\"http://www.w3.org/2001/XMLSchema\" ").replace("<dcsset:groupType>Items</dcsset:groupType>", "<dcsset:groupType>Oops</dcsset:groupType>");
    let preserved = convert_file(entry, Direction::XmlToYaml, invalid.as_bytes(), &inputs).unwrap();
    let preserved = String::from_utf8(preserved.bytes).unwrap();
    assert!(preserved.contains("!xml/"), "{preserved}");
    verify_candidate(entry, invalid.as_bytes(), preserved.as_bytes(), &inputs).unwrap();
    let real_form =
        include_str!("../../../../e2e/fixtures/xml/cf/CommonForms/ДинамическийСписок/Ext/Form.xml");
    let mut found = 0;
    for (start, _) in real_form.match_indices("<dcsset:item xsi:type=\"dcsset:GroupItemField\">") {
        let end =
            start + real_form[start..].find("</dcsset:item>").unwrap() + "</dcsset:item>".len();
        let fragment = &real_form[start..end];
        let xml = fragment.replace("<dcsset:item ", "<dcsset:item xmlns:dcsset=\"http://v8.1c.ru/8.1/data-composition-system/settings\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:xs=\"http://www.w3.org/2001/XMLSchema\" ");
        expected_round_trip(entry, &xml, &inputs, &[]);
        found += 1;
    }
    assert!(found > 0);
    assert!(String::from_utf8_lossy(&exported_short.bytes).contains(":field>Наименование</"));
}

#[test]
fn group_item_collection_preserves_mixed_order_and_anomalies() {
    let entry = entry_id("migration.group-item-collection").unwrap();
    let inputs = nkdk_compiled_rules::prepare_inputs(entry, Vec::new()).unwrap();
    let source = include_str!(
        "../../../../packages/rules/metadata/commonObjects/dataCompositionSystem/structureItemGroup/__fixtures__/dynamicList.xml"
    );
    let first = source
        .find("<dcsset:item xsi:type=\"dcsset:GroupItemField\">")
        .unwrap();
    let first_end =
        first + source[first..].find("</dcsset:item>").unwrap() + "</dcsset:item>".len();
    let auto = "<dcsset:item xsi:type=\"dcsset:GroupItemAuto\"/>";
    let last = source
        .rfind("<dcsset:item xsi:type=\"dcsset:GroupItemField\">")
        .unwrap();
    let last_end = last + source[last..].find("</dcsset:item>").unwrap() + "</dcsset:item>".len();
    let xml = format!(
        "<dcsset:groupItems xmlns:dcsset=\"http://v8.1c.ru/8.1/data-composition-system/settings\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:xs=\"http://www.w3.org/2001/XMLSchema\">{}{auto}{}</dcsset:groupItems>",
        &source[first..first_end],
        &source[last..last_end]
    );
    let yaml = expected_round_trip(
        entry,
        &xml,
        &inputs,
        &["Наименование", "[Авто]", "Использование: Ложь"],
    );
    let first = yaml.find("Наименование").unwrap();
    let second = yaml.find("[Авто]").unwrap();
    let third = yaml.find("ПометкаУдаления").unwrap();
    assert!(first < second && second < third, "{yaml}");
    let authored = "ПоляГруппировки:\n  - Наименование\n  - '[Авто]'\n  - Поле: ПометкаУдаления\n    Использование: Ложь";
    let authored_xml =
        convert_file(entry, Direction::YamlToXml, authored.as_bytes(), &inputs).unwrap();
    expected_round_trip(
        entry,
        &String::from_utf8(authored_xml.bytes).unwrap(),
        &inputs,
        &[],
    );
    let reserved_name = "ПоляГруппировки:\n  - Поле: '[Авто]'";
    let reserved_xml = convert_file(
        entry,
        Direction::YamlToXml,
        reserved_name.as_bytes(),
        &inputs,
    )
    .unwrap();
    let reserved_yaml =
        convert_file(entry, Direction::XmlToYaml, &reserved_xml.bytes, &inputs).unwrap();
    let reserved_yaml = String::from_utf8(reserved_yaml.bytes).unwrap();
    assert!(
        reserved_yaml.contains("Поле: '[Авто]'") || reserved_yaml.contains("Поле: \"[Авто]\""),
        "{reserved_yaml}"
    );
    verify_candidate(
        entry,
        &reserved_xml.bytes,
        reserved_yaml.as_bytes(),
        &inputs,
    )
    .unwrap();
    let invalid = xml.replacen(
        "<dcsset:groupType>Items</dcsset:groupType>",
        "<dcsset:groupType>Oops</dcsset:groupType>",
        1,
    );
    let preserved = convert_file(entry, Direction::XmlToYaml, invalid.as_bytes(), &inputs).unwrap();
    let preserved = String::from_utf8(preserved.bytes).unwrap();
    assert_eq!(preserved.matches("!xml/").count(), 1, "{preserved}");
    assert!(
        preserved.contains("[Авто]") && preserved.contains("ПометкаУдаления"),
        "{preserved}"
    );
    verify_candidate(entry, invalid.as_bytes(), preserved.as_bytes(), &inputs).unwrap();
    let real_form =
        include_str!("../../../../e2e/fixtures/xml/cf/CommonForms/ДинамическийСписок/Ext/Form.xml");
    let mut checked = 0;
    for (start, _) in real_form.match_indices("<dcsset:groupItems>") {
        let end = start
            + real_form[start..].find("</dcsset:groupItems>").unwrap()
            + "</dcsset:groupItems>".len();
        let fragment = &real_form[start..end];
        if fragment.matches("<dcsset:groupItems>").count() != 1 {
            continue;
        }
        let source = fragment.replacen(
            "<dcsset:groupItems>",
            "<dcsset:groupItems xmlns:dcsset=\"http://v8.1c.ru/8.1/data-composition-system/settings\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:xs=\"http://www.w3.org/2001/XMLSchema\">",
            1,
        );
        expected_round_trip(entry, &source, &inputs, &[]);
        checked += 1;
    }
    assert!(checked > 0);
}

#[test]
fn order_keeps_items_and_optional_settings() {
    let entry = entry_id("migration.dcs-order").unwrap();
    let inputs = metadata_value_inputs(entry);
    for source in [
        include_str!(
            "../../../../packages/rules/metadata/commonObjects/dataCompositionSystem/order/__fixtures__/full.xml"
        ),
        include_str!(
            "../../../../packages/rules/metadata/commonObjects/dataCompositionSystem/order/__fixtures__/auto.xml"
        ),
    ] {
        let xml = format!(
            "<Root xmlns:dcsset=\"http://v8.1c.ru/8.1/data-composition-system/settings\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:v8=\"http://v8.1c.ru/8.1/data/core\">{source}</Root>"
        );
        expected_round_trip(entry, &xml, &inputs, &["Элементы:"]);
    }
    let real_form =
        include_str!("../../../../e2e/fixtures/xml/cf/CommonForms/ДинамическийСписок/Ext/Form.xml");
    let mut found = 0;
    for (start, _) in real_form.match_indices("<dcsset:order>") {
        let end =
            start + real_form[start..].find("</dcsset:order>").unwrap() + "</dcsset:order>".len();
        let xml = format!(
            "<Root xmlns:dcsset=\"http://v8.1c.ru/8.1/data-composition-system/settings\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:xs=\"http://www.w3.org/2001/XMLSchema\" xmlns:v8=\"http://v8.1c.ru/8.1/data/core\">{}</Root>",
            &real_form[start..end]
        );
        expected_round_trip(entry, &xml, &inputs, &[]);
        found += 1;
    }
    assert_eq!(found, 8, "found {found} real orders");
    let fresh = "Порядок:\n  Элементы:\n    - '[Авто]'\n    - Поле: Код\n      ТипУпорядочивания: Убыв\n  РежимОтображения: Обычный\n  ИспользоватьПользовательскуюНастройку: Ложь\n";
    let result = convert_file(entry, Direction::YamlToXml, fresh.as_bytes(), &inputs).unwrap();
    let xml = String::from_utf8(result.bytes).unwrap();
    assert!(
        xml.contains("OrderItemAuto")
            && xml.contains("OrderItemField")
            && xml.contains(">Normal</")
            && xml.contains(">false</"),
        "{xml}"
    );
    expected_round_trip(
        entry,
        &xml,
        &inputs,
        &[
            "РежимОтображения: Обычный",
            "ИспользоватьПользовательскуюНастройку: Ложь",
        ],
    );
    let missing = b"<Root/>";
    let imported = convert_file(entry, Direction::XmlToYaml, missing, &inputs).unwrap();
    verify_candidate(entry, missing, &imported.bytes, &inputs).unwrap();
    let invalid = include_str!("../../../../packages/rules/metadata/commonObjects/dataCompositionSystem/order/__fixtures__/full.xml")
        .replace(">Desc</dcsset:orderType>", ">Oops</dcsset:orderType>");
    let xml = format!(
        "<Root xmlns:dcsset=\"http://v8.1c.ru/8.1/data-composition-system/settings\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:v8=\"http://v8.1c.ru/8.1/data/core\">{invalid}</Root>"
    );
    let imported = convert_file(entry, Direction::XmlToYaml, xml.as_bytes(), &inputs).unwrap();
    let yaml = String::from_utf8(imported.bytes).unwrap();
    assert!(yaml.contains("!xml/"), "{yaml}");
    verify_candidate(entry, xml.as_bytes(), yaml.as_bytes(), &inputs).unwrap();
}

#[test]
fn order_item_fields_keep_field_order_and_auto_variant() {
    let entry = entry_id("migration.dcs-order-item-fields").unwrap();
    let inputs = nkdk_compiled_rules::prepare_inputs(entry, Vec::new()).unwrap();
    let fixture = include_str!(
        "../../../../packages/rules/metadata/commonObjects/dataCompositionSystem/orderItemFields/__fixtures__/full.xml"
    );
    let xml = format!(
        "<Root xmlns:dcsset=\"http://v8.1c.ru/8.1/data-composition-system/settings\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\">{fixture}</Root>"
    );
    expected_round_trip(
        entry,
        &xml,
        &inputs,
        &["Поле: ПоВозрастанию", "ТипУпорядочивания: Убыв"],
    );

    let real_form =
        include_str!("../../../../e2e/fixtures/xml/cf/CommonForms/ДинамическийСписок/Ext/Form.xml");
    let mut found = 0;
    for (start, _) in real_form.match_indices("<dcsset:item xsi:type=\"dcsset:OrderItemField\">") {
        let end =
            start + real_form[start..].find("</dcsset:item>").unwrap() + "</dcsset:item>".len();
        let xml = format!(
            "<Root xmlns:dcsset=\"http://v8.1c.ru/8.1/data-composition-system/settings\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\">{}</Root>",
            &real_form[start..end]
        );
        let converted = convert_file(entry, Direction::XmlToYaml, xml.as_bytes(), &inputs).unwrap();
        let yaml = String::from_utf8(converted.bytes).unwrap();
        assert!(yaml.contains("Поле:"), "{yaml}");
        assert!(!yaml.contains("!xml/"), "{yaml}");
        verify_candidate(entry, xml.as_bytes(), yaml.as_bytes(), &inputs).unwrap();
        found += 1;
    }
    assert_eq!(found, 3);
    let auto = "<Root xmlns:dcsset=\"http://v8.1c.ru/8.1/data-composition-system/settings\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\"><dcsset:item xsi:type=\"dcsset:OrderItemAuto\"/></Root>";
    let converted = convert_file(entry, Direction::XmlToYaml, auto.as_bytes(), &inputs).unwrap();
    let yaml = String::from_utf8(converted.bytes).unwrap();
    assert!(yaml.contains("[Авто]") && !yaml.contains("!xml/"), "{yaml}");
    verify_candidate(entry, auto.as_bytes(), yaml.as_bytes(), &inputs).unwrap();
    let authored = "Порядок:\n  - '[Авто]'\n  - Поле: ПоУбыванию\n    ТипУпорядочивания: Убыв\n  - Поле: Код\n    Использование: Ложь\n    РежимОтображения: Обычный\n";
    let exported = convert_file(entry, Direction::YamlToXml, authored.as_bytes(), &inputs).unwrap();
    let xml = String::from_utf8(exported.bytes).unwrap();
    assert!(
        xml.contains("OrderItemAuto")
            && xml.contains("OrderItemField")
            && xml.contains(">Desc</")
            && xml.contains(">false</")
            && xml.contains(">Normal</"),
        "{xml}"
    );
    let imported = convert_file(entry, Direction::XmlToYaml, xml.as_bytes(), &inputs).unwrap();
    let yaml = String::from_utf8(imported.bytes).unwrap();
    assert!(
        yaml.contains("Использование: Ложь") && yaml.contains("РежимОтображения: Обычный"),
        "{yaml}"
    );
    let empty = b"<Root/>";
    let converted = convert_file(entry, Direction::XmlToYaml, empty, &inputs).unwrap();
    verify_candidate(entry, empty, &converted.bytes, &inputs).unwrap();
    for malformed in [
        auto.replace("OrderItemAuto", "UnknownItem"),
        fixture.replace(">Desc</", ">oops</"),
    ] {
        let source = if malformed.starts_with("<Root") {
            malformed
        } else {
            format!(
                "<Root xmlns:dcsset=\"http://v8.1c.ru/8.1/data-composition-system/settings\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\">{malformed}</Root>"
            )
        };
        let converted =
            convert_file(entry, Direction::XmlToYaml, source.as_bytes(), &inputs).unwrap();
        let yaml = String::from_utf8(converted.bytes).unwrap();
        assert!(yaml.contains("!xml/"), "{yaml}");
        verify_candidate(entry, source.as_bytes(), yaml.as_bytes(), &inputs).unwrap();
    }
}

#[test]
fn available_fields_choose_short_and_full_rows_without_losing_metadata() {
    let entry = entry_id("migration.dcs-available-fields").unwrap();
    let inputs = metadata_value_inputs(entry);
    for (source, expected) in [
        (
            include_str!(
                "../../../../packages/rules/metadata/commonObjects/dataCompositionSystem/availableFields/__fixtures__/full.xml"
            ),
            vec!["Реквизит2", "Реквизит2РасширеннаяПодсказка"],
        ),
        (
            include_str!(
                "../../../../packages/rules/metadata/commonObjects/dataCompositionSystem/availableFields/__fixtures__/selected-item.xml"
            ),
            vec![
                "Поле: Документ",
                "Использование: Истина",
                "Заголовок: Документ",
                "РежимОтображения: Обычный",
                "Использование: Ложь",
                "МногоязычныйЗаголовок: Многоязычный документ",
            ],
        ),
    ] {
        let xml = rooted_fields_fixture(source);
        let yaml = expected_round_trip(entry, &xml, &inputs, &expected);
        if source.contains("Реквизит2") {
            assert!(!yaml.contains("Поле:"), "{yaml}");
        }
    }
    let fresh = "Поля:\n  - Документ\n  - Поле: Документ\n    Использование: Ложь\n    Заголовок: Название\n    МногоязычныйЗаголовок: {ru: Название, en: Title}\n    РежимОтображения: Обычный";
    let exported = convert_file(entry, Direction::YamlToXml, fresh.as_bytes(), &inputs).unwrap();
    let xml = String::from_utf8(exported.bytes).unwrap();
    assert_eq!(xml.matches(">Документ</").count(), 2, "{xml}");
    for fragment in [">false</", ">Название</", ">Title</", ">Normal</"] {
        assert!(xml.contains(fragment), "{xml}");
    }

    let full = include_str!(
        "../../../../packages/rules/metadata/commonObjects/dataCompositionSystem/availableFields/__fixtures__/selected-item.xml"
    );
    for source in [
        full.replace(">true</", ">oops</"),
        full.replacen("<dcsset:item>", "<dcsset:item/><dcsset:item>", 1),
    ] {
        let xml = rooted_fields_fixture(&source);
        let converted = convert_file(entry, Direction::XmlToYaml, xml.as_bytes(), &inputs).unwrap();
        let yaml = String::from_utf8(converted.bytes).unwrap();
        assert!(
            yaml.contains("!xml/") && yaml.contains("Использование: Ложь"),
            "{yaml}"
        );
        assert!(
            yaml.contains("МногоязычныйЗаголовок: Многоязычный документ"),
            "{yaml}"
        );
        verify_candidate(entry, xml.as_bytes(), yaml.as_bytes(), &inputs).unwrap();
    }

    let e2e =
        include_str!("../../../../e2e/fixtures/xml/cf/CommonForms/УсловноеОформление/Ext/Form.xml");
    let start = e2e.find("<dcsset:selection>").unwrap();
    let end =
        start + e2e[start..].find("</dcsset:selection>").unwrap() + "</dcsset:selection>".len();
    let xml = rooted_fields_fixture(&e2e[start..end]);
    let converted = convert_file(entry, Direction::XmlToYaml, xml.as_bytes(), &inputs).unwrap();
    let yaml = String::from_utf8(converted.bytes).unwrap();
    assert_eq!(
        yaml.trim(),
        "Поля:\n  - Реквизит2\n  - Реквизит2РасширеннаяПодсказка"
    );
    verify_candidate(entry, xml.as_bytes(), yaml.as_bytes(), &inputs).unwrap();

    let expanded = "Поля:\n  - Поле: Документ";
    let xml = convert_file(entry, Direction::YamlToXml, expanded.as_bytes(), &inputs).unwrap();
    let yaml = convert_file(entry, Direction::XmlToYaml, &xml.bytes, &inputs).unwrap();
    assert_eq!(
        String::from_utf8(yaml.bytes).unwrap().trim(),
        "Поля:\n  - Документ"
    );
    let empty = rooted_fields_fixture("<dcsset:selection></dcsset:selection>");
    let empty_yaml = convert_file(entry, Direction::XmlToYaml, empty.as_bytes(), &inputs).unwrap();
    verify_candidate(entry, empty.as_bytes(), &empty_yaml.bytes, &inputs).unwrap();
}

fn expected_round_trip(
    entry: nkdk_compiled_rules::EntryId,
    xml: &str,
    inputs: &nkdk_compiled_rules::PreparedInputs,
    expected: &[&str],
) -> String {
    let converted = convert_file(entry, Direction::XmlToYaml, xml.as_bytes(), inputs).unwrap();
    let yaml = String::from_utf8(converted.bytes).unwrap();
    for fragment in expected {
        assert!(yaml.contains(fragment), "{yaml}");
    }
    assert!(
        !yaml.contains("!xml/raw") && !yaml.contains("!xml/invalid"),
        "{yaml}"
    );
    verify_candidate(entry, xml.as_bytes(), yaml.as_bytes(), inputs).unwrap();
    yaml
}
