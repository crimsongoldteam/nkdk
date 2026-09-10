mod corpus;
use std::{collections::BTreeMap, path::PathBuf};
fn main() {
    if let Err(error) = run() {
        eprintln!("{error}");
        std::process::exit(1);
    }
}
fn run() -> Result<(), String> {
    let mut args = std::env::args().skip(1);
    if args.next().as_deref() != Some("corpus") || args.next().as_deref() != Some("run") {
        return Err("Expected: corpus run --manifest PATH --group NAME [--root PATH]".into());
    }
    let mut options = BTreeMap::new();
    while let Some(key) = args.next() {
        if !["--manifest", "--group", "--root"].contains(&key.as_str()) {
            return Err(format!("Unknown option: {key}"));
        }
        let value = args.next().ok_or_else(|| format!("Missing value: {key}"))?;
        if options.insert(key.clone(), value).is_some() {
            return Err(format!("Duplicate option: {key}"));
        }
    }
    let required = |key: &str| options.get(key).ok_or_else(|| format!("Required: {key}"));
    let root = options
        .get("--root")
        .map(PathBuf::from)
        .unwrap_or(std::env::current_dir().map_err(|e| e.to_string())?);
    let count = corpus::run(
        &root,
        &PathBuf::from(required("--manifest")?),
        required("--group")?,
    )?;
    println!("Verified {count} cases: XML→YAML, YAML→XML, round-trip and validation");
    Ok(())
}
