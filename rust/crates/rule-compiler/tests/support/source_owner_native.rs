#[path = "source_owner_cases.rs"]
mod cases;
use std::{collections::BTreeSet, fs, process::Command};

pub fn verify(modules: Vec<nkdk_rule_compiler::Module>) {
    verify_generated(
        modules,
        BTreeSet::from([
            "test.complete-record-state".into(),
            "test.borrowed-record-context".into(),
            "test.complete-record-state.own-identity".into(),
            "test.complete-record-state.states".into(),
            "test.complete-record-state.base-identity".into(),
        ]),
        None,
    );
}

pub fn verify_collection(
    modules: Vec<nkdk_rule_compiler::Module>,
    entry: String,
    file_sources: serde_json::Value,
    bound: Vec<String>,
) {
    let repository = std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join("../../..");
    let mut fixtures = cases::fixtures(&repository);
    fixtures.retain(|case| {
        case["entry"].is_null()
            && case["generatedInput"] != true
            && case["expectedNoState"].is_null()
    });
    assert_eq!(fixtures.len(), 8);
    for case in &mut fixtures {
        case["entry"] = entry.clone().into();
        case["operation"] = "metadata.catalog-attribute".into();
        case["boundInputs"] = serde_json::json!(bound);
        case["fileFactSources"] = file_sources.clone();
        let fixture = format!(
            "e2e/fixtures/xml/{}/Catalogs/{}.xml",
            if case["component"] == "cfe" {
                "cfe/all-extension"
            } else {
                "cf"
            },
            case["parentName"].as_str().unwrap()
        );
        case["factXml"] = fs::read_to_string(repository.join(fixture)).unwrap().into();

        let xml = case["xml"].as_str().unwrap();
        case["collectionXml"] = format!(
            "<md:ChildObjects xmlns:md=\"http://v8.1c.ru/8.3/MDClasses\">{xml}</md:ChildObjects>"
        )
        .into();
        let yaml = case["yaml"]
            .as_str()
            .unwrap()
            .lines()
            .map(|line| format!("    {line}"))
            .collect::<Vec<_>>()
            .join("\n");
        case["collectionYaml"] = format!(
            "Реквизиты:\n  {}:\n{yaml}\n",
            case["name"].as_str().unwrap()
        )
        .into();
    }
    for component in ["cf", "cfe"] {
        let rows: Vec<_> = fixtures
            .iter()
            .filter(|case| case["component"].as_str().unwrap_or("cf") == component)
            .cloned()
            .collect();
        assert_eq!(rows.len(), 4);
        for reverse in [false, true] {
            let mut rows = rows.clone();
            if reverse {
                rows.reverse();
            }
            let mut group = rows[0].clone();
            let xml = rows
                .iter()
                .map(|row| row["xml"].as_str().unwrap())
                .collect::<String>();
            group["collectionXml"]=format!("<md:ChildObjects xmlns:md=\"http://v8.1c.ru/8.3/MDClasses\">{xml}</md:ChildObjects>").into();
            let yaml = rows
                .iter()
                .map(|row| {
                    row["collectionYaml"]
                        .as_str()
                        .unwrap()
                        .strip_prefix("Реквизиты:\n")
                        .unwrap()
                })
                .collect::<String>();
            group["collectionYaml"] = format!("Реквизиты:\n{yaml}").into();
            group["rows"] = serde_json::json!(rows);
            fixtures.push(group);
        }
    }
    let mut roots = BTreeSet::from([entry]);
    for source in file_sources.as_array().unwrap() {
        roots.insert(source["entry"].as_str().unwrap().into());
    }
    verify_generated(modules, roots, Some(fixtures));
}

fn verify_generated(
    modules: Vec<nkdk_rule_compiler::Module>,
    roots: BTreeSet<String>,
    cases: Option<Vec<serde_json::Value>>,
) {
    let program = nkdk_rule_compiler::link(&modules).unwrap();
    let generated = nkdk_rule_compiler::generate_selected(&program, &roots).unwrap();
    let repository = std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join("../../..");
    let fixtures = cases.unwrap_or_else(|| self::cases::fixtures(&repository));
    let root = super::support::generated_crate_root("generated-source-owner");
    let core = super::support::conversion_core_path();
    fs::write(root.join("Cargo.toml"), format!("[package]\nname=\"generated-source-owner\"\nversion=\"0.0.0\"\nedition=\"2024\"\n[dependencies]\nnkdk-conversion-core={{path={core:?}}}\nserde_json=\"=1.0.150\"\n[workspace]\n")).unwrap();
    for file in generated.files {
        fs::write(root.join("src").join(file.path), file.contents).unwrap();
    }
    fs::write(
        root.join("case.json"),
        serde_json::to_vec(&fixtures).unwrap(),
    )
    .unwrap();
    fs::write(root.join("src/lib.rs"), "include!(\"generated.rs\");").unwrap();
    fs::write(
        root.join("src/main.rs"),
        format!("{}\nfn main() {{verify_cases(&serde_json::from_slice(include_bytes!(\"../case.json\")).unwrap());}}",include_str!("source-owner-native.rs.in")),
    )
    .unwrap();
    let output = Command::new("cargo")
        .args([
            "+1.98.1",
            "run",
            "--offline",
            "--quiet",
            "-j1",
            "--message-format=short",
        ])
        .current_dir(&root)
        .output()
        .unwrap();
    assert!(
        output.status.success(),
        "{}: {}",
        root.display(),
        String::from_utf8_lossy(&output.stderr)
    );
    fs::remove_dir_all(root).unwrap();
}
