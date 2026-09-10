use std::{fs, process::Command};
#[test]
fn expected_failure_requires_the_exact_diagnostic_not_just_any_error() {
    let repository = std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
        .join("../../..")
        .canonicalize()
        .unwrap();
    let root = std::env::temp_dir().join(format!(
        "nkdk-corpus-cli-{}-{}",
        std::process::id(),
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_nanos()
    ));
    fs::create_dir(&root).unwrap();
    let manifest: serde_json::Value = serde_json::from_slice(
        &fs::read(repository.join("tests/conversion-corpus/manifest.json")).unwrap(),
    )
    .unwrap();
    let mut case = manifest["cases"]
        .as_array()
        .unwrap()
        .iter()
        .find(|case| case["id"] == "numeric-bound-fraction-overflow")
        .unwrap()
        .clone();
    let bytes =
        fs::read(repository.join(case["expectations"]["diagnostics"].as_str().unwrap())).unwrap();
    let diagnostics = root.join("diagnostics.json");
    fs::write(&diagnostics, &bytes).unwrap();
    case["expectations"]["diagnostics"] = serde_json::json!(diagnostics);
    let path = root.join("manifest.json");
    fs::write(
        &path,
        serde_json::to_vec(&serde_json::json!({"version":1,"cases":[case]})).unwrap(),
    )
    .unwrap();
    let run = || {
        Command::new(env!("CARGO_BIN_EXE_nkdk-dev"))
            .args(["corpus", "run", "--manifest"])
            .arg(&path)
            .args(["--root"])
            .arg(&repository)
            .args(["--group", "numeric-bounds"])
            .output()
            .unwrap()
    };
    let output = run();
    assert!(
        output.status.success(),
        "{}",
        String::from_utf8_lossy(&output.stderr)
    );
    let mut wrong: serde_json::Value = serde_json::from_slice(&bytes).unwrap();
    wrong[0]["code"] = serde_json::json!("wrong.code");
    fs::write(&diagnostics, serde_json::to_vec(&wrong).unwrap()).unwrap();
    assert!(!run().status.success());
    fs::remove_dir_all(root).unwrap();
}

#[test]
fn structural_comparison_requires_explicit_mode_and_preserves_leaf_text() {
    let repository = std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
        .join("../../..")
        .canonicalize()
        .unwrap();
    let root = std::env::temp_dir().join(format!("nkdk-corpus-structural-{}", std::process::id()));
    fs::create_dir_all(&root).unwrap();
    let manifest: serde_json::Value = serde_json::from_slice(
        &fs::read(repository.join("tests/conversion-corpus/manifest.json")).unwrap(),
    )
    .unwrap();
    let mut case = manifest["cases"]
        .as_array()
        .unwrap()
        .iter()
        .find(|case| case["id"] == "generated-record-scalars")
        .unwrap()
        .clone();
    let expected = root.join("expected.xml");
    let original =
        fs::read_to_string(repository.join(case["expectations"]["xml"].as_str().unwrap())).unwrap();
    fs::write(&expected, original.replace("\n\t", "\n    ")).unwrap();
    case["expectations"]["xml"] = serde_json::json!(expected);
    let path = root.join("manifest.json");
    let run = |case: &serde_json::Value| {
        fs::write(
            &path,
            serde_json::to_vec(&serde_json::json!({"version":1,"cases":[case]})).unwrap(),
        )
        .unwrap();
        Command::new(env!("CARGO_BIN_EXE_nkdk-dev"))
            .args(["corpus", "run", "--manifest"])
            .arg(&path)
            .arg("--root")
            .arg(&repository)
            .args(["--group", "generated-scalars"])
            .output()
            .unwrap()
    };
    assert!(!run(&case).status.success());
    case["comparison"]["xml"] = serde_json::json!("structural");
    let output = run(&case);
    assert!(
        output.status.success(),
        "{}",
        String::from_utf8_lossy(&output.stderr)
    );
    fs::write(&expected, original.replace("  Текст", "Текст")).unwrap();
    assert!(!run(&case).status.success());
    case["comparison"]["xml"] = serde_json::json!("unknown");
    assert!(!run(&case).status.success());
    fs::remove_dir_all(root).unwrap();
}
