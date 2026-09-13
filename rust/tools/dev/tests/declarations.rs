use std::{fs, process::Command};
#[test]
fn declaration_commands_check_sources_and_export_the_same_schema() {
    let root = std::env::temp_dir().join(format!(
        "nkdk-declaration-cli-{}-{}",
        std::process::id(),
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_nanos()
    ));
    fs::create_dir(&root).unwrap();
    let binary = env!("CARGO_BIN_EXE_nkdk-dev");
    let language = Command::new(binary)
        .args(["declarations", "language-schema"])
        .output()
        .unwrap();
    assert!(
        language.status.success(),
        "{}",
        String::from_utf8_lossy(&language.stderr)
    );
    assert_eq!(language.stdout, nkdk_rule_compiler::declaration_schema());
    assert!(
        !Command::new(binary)
            .args(["declarations", "check", "--dir"])
            .arg(&root)
            .output()
            .unwrap()
            .status
            .success()
    );
    for (name, bytes) in [
        (
            "enum.yaml",
            include_bytes!("../../../../tests/declaration-corpus/valid/code-type-enum.yaml")
                .as_slice(),
        ),
        (
            "decimal.yaml",
            include_bytes!("../../../../tests/declaration-corpus/valid/exact-decimal.yaml")
                .as_slice(),
        ),
        (
            "owner.yaml",
            include_bytes!("../../../../tests/declaration-corpus/valid/numeric-bound.yaml")
                .as_slice(),
        ),
    ] {
        fs::write(root.join(name), bytes).unwrap();
    }
    let output = Command::new(binary)
        .args(["declarations", "check", "--dir"])
        .arg(&root)
        .output()
        .unwrap();
    assert!(
        output.status.success(),
        "{}",
        String::from_utf8_lossy(&output.stderr)
    );
    let output = Command::new(binary)
        .args(["declarations", "schema", "--dir"])
        .arg(&root)
        .args(["--entry", "test.numeric-bound"])
        .output()
        .unwrap();
    assert!(
        output.status.success(),
        "{}",
        String::from_utf8_lossy(&output.stderr)
    );
    let actual: serde_json::Value = serde_json::from_slice(&output.stdout).unwrap();
    let compiled = Command::new(binary)
        .args(["declarations", "compile", "--dir"])
        .arg(&root)
        .output()
        .unwrap();
    assert!(
        compiled.status.success(),
        "{}",
        String::from_utf8_lossy(&compiled.stderr)
    );
    assert!(String::from_utf8_lossy(&compiled.stdout).contains("Generated"));
    let expected: serde_json::Value = serde_json::from_slice(include_bytes!(
        "../../../../tests/declaration-corpus/schemas/numeric-bound.schema.json"
    ))
    .unwrap();
    assert_eq!(actual, expected);
    fs::remove_dir_all(root).unwrap();
}
