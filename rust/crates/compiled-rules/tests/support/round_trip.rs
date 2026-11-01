use nkdk_compiled_rules_probes::{
    Direction, EntryId, PreparedInputs, convert_file, verify_candidate,
};

pub fn yaml_and_verify(entry: EntryId, xml: &str, inputs: &PreparedInputs) -> String {
    let converted = convert_file(entry, Direction::XmlToYaml, xml.as_bytes(), inputs).unwrap();
    verify_candidate(entry, xml.as_bytes(), &converted.bytes, inputs).unwrap();
    String::from_utf8(converted.bytes).unwrap()
}
