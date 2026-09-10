use nkdk_compiled_rules::{
    Direction, PreparedInputs, convert_file, entry_id, validate_file, verify_candidate,
};
use serde_json::Value;
use sha2::{Digest, Sha256};
use std::{fs, path::Path};
fn text<'a>(value: &'a Value, key: &str) -> Result<&'a str, String> {
    value[key]
        .as_str()
        .ok_or_else(|| format!("Missing string field: {key}"))
}
fn read(root: &Path, path: &str) -> Result<Vec<u8>, String> {
    fs::read(root.join(path)).map_err(|e| format!("{path}: {e}"))
}
fn json(root: &Path, path: &str) -> Result<Value, String> {
    serde_json::from_slice(&read(root, path)?).map_err(|e| format!("{path}: {e}"))
}
fn input(root: &Path, descriptor: &Value) -> Result<Vec<u8>, String> {
    let bytes = read(root, text(descriptor, "path")?)?;
    let actual = format!("{:x}", Sha256::digest(&bytes));
    if actual != text(descriptor, "sha256")? {
        return Err("Input hash differs from the recorded corpus".into());
    }
    Ok(bytes)
}
pub fn run(root: &Path, manifest: &Path, group: &str) -> Result<usize, String> {
    let manifest: Value = serde_json::from_slice(&fs::read(manifest).map_err(|e| e.to_string())?)
        .map_err(|e| e.to_string())?;
    if manifest["version"] != 1 {
        return Err("Unsupported corpus manifest version".into());
    }
    let cases = manifest["cases"].as_array().ok_or("Missing cases array")?;
    let selected: Vec<_> = cases
        .iter()
        .filter(|case| case["group"].as_str() == Some(group))
        .collect();
    if selected.is_empty() {
        return Err(format!("Unknown or empty group: {group}"));
    }
    for case in &selected {
        let id = text(case, "id")?;
        run_case(root, case).map_err(|e| format!("{id}: {e}"))?;
        println!("PASS {id}");
    }
    Ok(selected.len())
}
fn run_case(root: &Path, case: &Value) -> Result<(), String> {
    if case["outcome"] != "success" {
        return Err("This runner has not implemented expected-failure contracts yet".into());
    }
    if case["comparison"]["xml"] != "exact" || case["comparison"]["yaml"] != "exact" {
        return Err(
            "Only exact byte comparisons are implemented; no fallback comparison is allowed".into(),
        );
    }
    if case["comparison"]["exceptions"]
        .as_array()
        .is_some_and(|values| !values.is_empty())
    {
        return Err("Comparison exceptions are not supported".into());
    }
    let context = json(root, text(case, "context")?)?;
    let entry_name = text(&context, "entry")?;
    let entry =
        entry_id(entry_name).ok_or_else(|| format!("Unsupported generated entry: {entry_name}"))?;
    if context
        .get("parameters")
        .is_some_and(|value| !value.as_object().is_some_and(|object| object.is_empty()))
    {
        return Err("Dynamic parameters are not implemented in the scalar runner".into());
    }
    let xml = input(root, &case["inputs"]["xml"])?;
    let yaml = input(root, &case["inputs"]["yaml"])?;
    let expected_xml = read(root, text(&case["expectations"], "xml")?)?;
    let expected_yaml = read(root, text(&case["expectations"], "yaml")?)?;
    if let Some(path) = case["expectations"]["diagnostics"].as_str()
        && json(root, path)? != serde_json::json!([])
    {
        return Err("Nonempty diagnostic contracts are not implemented by this runner".into());
    }
    let inputs = PreparedInputs::default();
    let forward = convert_file(entry, Direction::XmlToYaml, &xml, &inputs)
        .map_err(|e| format!("XML→YAML: {e:?}"))?;
    if forward.bytes != expected_yaml || !forward.diagnostics.is_empty() {
        return Err("XML→YAML differs from the independent expectation".into());
    }
    let backward = convert_file(entry, Direction::YamlToXml, &yaml, &inputs)
        .map_err(|e| format!("YAML→XML: {e:?}"))?;
    if backward.bytes != expected_xml || !backward.diagnostics.is_empty() {
        return Err("YAML→XML differs from the independent expectation".into());
    }
    let round_trip = convert_file(entry, Direction::YamlToXml, &forward.bytes, &inputs)
        .map_err(|e| format!("round-trip: {e:?}"))?;
    if round_trip.bytes != expected_xml {
        return Err("Final YAML does not recover the expected XML bytes".into());
    }
    verify_candidate(entry, &xml, &forward.bytes, &inputs).map_err(|e| format!("proof: {e:?}"))?;
    let diagnostics = validate_file(entry, &yaml, &inputs);
    if !diagnostics.is_empty() {
        return Err(format!("validation: {diagnostics:?}"));
    }
    Ok(())
}
