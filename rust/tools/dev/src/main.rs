mod corpus;
mod declarations;
use std::{collections::BTreeMap, path::PathBuf};
fn main() {
    if let Err(error) = run() {
        eprintln!("{error}");
        std::process::exit(1);
    }
}
fn run() -> Result<(), String> {
    let mut args = std::env::args().skip(1);
    let family = args.next().ok_or("Expected corpus or declarations")?;
    let action = args.next().ok_or("Expected action")?;
    let allowed: &[&str] = match (family.as_str(), action.as_str()) {
        ("corpus", "run") => &["--manifest", "--group", "--root"],
        ("declarations", "check") => &["--dir"],
        ("declarations", "schema") => &["--dir", "--entry"],
        ("declarations", "language-schema") => &[],
        _ => return Err("Expected corpus run or declarations check/schema/language-schema".into()),
    };
    let mut options = BTreeMap::new();
    while let Some(key) = args.next() {
        if !allowed.contains(&key.as_str()) {
            return Err(format!("Unknown option: {key}"));
        }
        let value = args.next().ok_or_else(|| format!("Missing value: {key}"))?;
        if options.insert(key.clone(), value).is_some() {
            return Err(format!("Duplicate option: {key}"));
        }
    }
    let required = |key: &str| options.get(key).ok_or_else(|| format!("Required: {key}"));
    if family == "declarations" {
        use std::io::Write;
        if action == "language-schema" {
            return std::io::stdout()
                .write_all(nkdk_rule_compiler::declaration_schema())
                .map_err(|error| error.to_string());
        }
        let program = declarations::load(&PathBuf::from(required("--dir")?))?;
        if action == "schema" {
            let bytes = nkdk_rule_compiler::schema(&program, required("--entry")?)
                .map_err(|errors| format!("{errors:#?}"))?;
            std::io::stdout()
                .write_all(&bytes)
                .map_err(|error| error.to_string())?;
        } else {
            println!(
                "Checked {} declarations: syntax and links",
                program.entries.len()
            );
        }
        return Ok(());
    }
    let root = options
        .get("--root")
        .map(PathBuf::from)
        .unwrap_or(std::env::current_dir().map_err(|e| e.to_string())?);
    let count = corpus::run(
        &root,
        &PathBuf::from(required("--manifest")?),
        required("--group")?,
    )?;
    println!("Verified {count} cases with conversion and validation expectations");
    Ok(())
}
