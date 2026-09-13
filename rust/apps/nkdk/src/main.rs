mod publication;
use nkdk_compiled_rules::{
    Direction, PreparedInputs, RuntimeDiagnostic, Severity, convert_file, entry_id, read_inputs,
    validate_file,
};
use std::{collections::BTreeMap, fs, path::Path};
fn main() {
    if let Err(error) = run() {
        eprintln!("{error}");
        std::process::exit(1);
    }
}
fn run() -> Result<(), String> {
    let mut args = std::env::args().skip(1);
    let command = args
        .next()
        .ok_or("Expected convert-file or validate-file")?;
    if !matches!(command.as_str(), "convert-file" | "validate-file") {
        return Err("Unknown command".into());
    }
    let mut options = BTreeMap::new();
    while let Some(key) = args.next() {
        if !["--entry", "--direction", "--input", "--output", "--inputs"].contains(&key.as_str()) {
            return Err(format!("Unknown option: {key}"));
        }
        let value = args
            .next()
            .ok_or_else(|| format!("Missing value for {key}"))?;
        if options.insert(key.clone(), value).is_some() {
            return Err(format!("Duplicate option: {key}"));
        }
    }
    let required = |key: &str| {
        options
            .get(key)
            .ok_or_else(|| format!("Required option: {key}"))
    };
    let entry =
        entry_id(required("--entry")?).ok_or("Entry is not supported by this generated catalog")?;
    let input_path = required("--input")?;
    let source = fs::read(input_path).map_err(|e| e.to_string())?;
    let inputs = match options.get("--inputs") {
        Some(path) => read_inputs(entry, &fs::read(path).map_err(|error| error.to_string())?)
            .map_err(|error| format!("{path}: {error:?}"))?,
        None => PreparedInputs::default(),
    };
    if command == "validate-file" {
        if options.contains_key("--direction") || options.contains_key("--output") {
            return Err("validate-file does not accept --direction or --output".into());
        }
        let diagnostics = validate_file(entry, &source, &inputs);
        return report(input_path, &diagnostics);
    }
    let direction = match required("--direction")?.as_str() {
        "xml-to-yaml" => Direction::XmlToYaml,
        "yaml-to-xml" => Direction::YamlToXml,
        _ => return Err("Unknown conversion direction".into()),
    };
    if !nkdk_compiled_rules::document_paths(entry)
        .map_err(|error| format!("{error:?}"))?
        .is_empty()
    {
        return Err(
            "convert-file cannot publish a document group; use the group conversion API".into(),
        );
    }
    let output = required("--output")?;
    if Path::new(input_path) == Path::new(output) {
        return Err("Input and output must differ".into());
    }
    let result = convert_file(entry, direction, &source, &inputs)
        .map_err(|errors| format!("{input_path}: {errors:#?}"))?;
    report(input_path, &result.diagnostics)?;
    publication::publish(Path::new(output), &result.bytes)?;
    Ok(())
}

fn report(path: &str, diagnostics: &[RuntimeDiagnostic]) -> Result<(), String> {
    if diagnostics
        .iter()
        .any(|error| error.severity == Severity::Error)
    {
        return Err(format!("{path}: {diagnostics:#?}"));
    }
    if !diagnostics.is_empty() {
        eprintln!("{path}: {diagnostics:#?}");
    }
    Ok(())
}
