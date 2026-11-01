use nkdk_compiled_rules::{Direction, PreparedInputs, convert_file, validate_file};
use nkdk_compiled_rules_probes as nkdk_compiled_rules;

pub fn assert_valid_candidate(
    entry: nkdk_compiled_rules::EntryId,
    xml: &[u8],
    yaml: &[u8],
    inputs: &PreparedInputs,
) {
    assert!(validate_file(entry, yaml, inputs).is_empty());
    nkdk_compiled_rules::verify_candidate(entry, xml, yaml, inputs).unwrap();
}

pub fn assert_plain_round_trip(
    entry: nkdk_compiled_rules::EntryId,
    xml: &str,
    yaml: &str,
    inputs: &PreparedInputs,
) {
    assert!(!yaml.contains("!xml/"), "{yaml}");
    assert_valid_candidate(entry, xml.as_bytes(), yaml.as_bytes(), inputs);
    let exported = convert_file(entry, Direction::YamlToXml, yaml.as_bytes(), inputs).unwrap();
    nkdk_conversion_core::proof::verify(xml.as_bytes(), &exported.bytes, |_| false).unwrap();
}

pub fn dcs_parameter_fragment(source: &str, value_marker: &str) -> String {
    let value = source.find(value_marker).expect("e2e parameter value");
    let start = [
        "<dcscor:item xsi:type=\"dcsset:SettingsParameterValue\">",
        "<dcscor:item>",
    ]
    .iter()
    .filter_map(|wrapper| source[..value].rfind(wrapper))
    .max()
    .expect("e2e parameter wrapper");
    let mut depth = 0;
    let mut cursor = start;
    let end = loop {
        let open = source[cursor..]
            .find("<dcscor:item")
            .map(|offset| cursor + offset);
        let close = source[cursor..]
            .find("</dcscor:item>")
            .map(|offset| cursor + offset);
        if open.is_some_and(|open| close.is_none_or(|close| open < close)) {
            let open = open.unwrap();
            let tag_end = source[open..]
                .find('>')
                .map(|offset| open + offset + 1)
                .expect("e2e item start");
            if source.as_bytes()[tag_end - 2] != b'/' {
                depth += 1;
            }
            cursor = tag_end;
        } else {
            let close = close.expect("e2e parameter end");
            depth -= 1;
            cursor = close + "</dcscor:item>".len();
            if depth == 0 {
                break cursor;
            }
        }
    };
    let mut fragment = source[start..end].to_owned();
    fragment.replace_range(fragment.len() - "</dcscor:item>".len().., "</Item>");
    fragment.replacen("<dcscor:item", "<Item", 1)
}

pub fn preserved_raw_yaml(
    entry: nkdk_compiled_rules::EntryId,
    xml: &str,
    inputs: &PreparedInputs,
) -> String {
    let result = convert_file(entry, Direction::XmlToYaml, xml.as_bytes(), inputs).unwrap();
    let yaml = String::from_utf8(result.bytes).unwrap();
    assert!(yaml.contains("!xml/raw"), "{yaml}");
    assert!(validate_file(entry, yaml.as_bytes(), inputs).is_empty());
    nkdk_compiled_rules::verify_candidate(entry, xml.as_bytes(), yaml.as_bytes(), inputs).unwrap();
    yaml
}
