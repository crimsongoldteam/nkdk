use nkdk_rule_compiler::{SourceFile, generate, link, parse};

#[test]
fn resource_contracts_are_composed_and_reject_unprepared_paths() {
    let fragment = "format: nkdk-declarations/1\nkind: fragment\nid: resource.files\ninputs: {name: {type: {kind: scalar, scalar: text}}}\nvalue: {kind: record, fields: []}\nrepresentations:\n  xml: {kind: record, fields: []}\n  yaml: {kind: mapping, fields: []}\nresources:\n- oneOf:\n  - xml: {sequence: [{literal: Ext}, {concat: [{input: name}, {literal: '.bsl'}]}]}\n    yaml: {sequence: [{input: name}]}\n";
    let owner = "format: nkdk-declarations/1\nkind: object\nid: resource.owner\nimports: {files: resource.files}\ninputs: {unused: {type: {kind: scalar, scalar: text}}, owner: {type: {kind: scalar, scalar: text}}}\ncompose: [{use: files, bind: {name: {input: owner}}}]\nvalue: {kind: record, fields: [{name: title, type: {kind: scalar, scalar: text}}]}\nrepresentations:\n  xml: {kind: record, fields: [{field: title, path: [Root, Title]}]}\n  yaml: {kind: mapping, fields: [{field: title, key: Title}]}\n";
    let parse_source = |path, text: &str| {
        parse(SourceFile {
            path,
            bytes: text.as_bytes(),
        })
    };
    let modules = vec![
        parse_source("fragment.yaml", fragment).unwrap(),
        parse_source("owner.yaml", owner).unwrap(),
    ];
    let program = link(&modules).unwrap();
    let generated = generate(&program).unwrap();
    let text = String::from_utf8(generated.files[0].contents.clone()).unwrap();
    assert!(text.contains("pub fn resource_requests("));
    assert!(text.contains("inputs.text(1)?"));
    let resource_owner = owner
        .replace("kind: object", "kind: resources")
        .replace(
            "fields: [{name: title, type: {kind: scalar, scalar: text}}]",
            "fields: []",
        )
        .replace(
            "fields: [{field: title, path: [Root, Title]}]",
            "fields: []",
        )
        .replace("fields: [{field: title, key: Title}]", "fields: []");
    let resource_program = link(&[
        modules[0].clone(),
        parse_source("resources.yaml", &resource_owner).unwrap(),
    ])
    .unwrap();
    let generated = generate(&resource_program).unwrap();
    let text = String::from_utf8(generated.files[0].contents.clone()).unwrap();
    assert!(text.contains("resource.owner"));
    assert!(text.contains("entry.resource-only"));
    assert!(!text.contains("fn read_xml_"));
    assert!(nkdk_rule_compiler::schema(&resource_program, "resource.owner").is_err());
    compile_resource_catalog(&generated);
    let value_fragment = owner
        .replace("kind: object", "kind: fragment")
        .replace("id: resource.owner", "id: resource.values")
        .replace(
            "compose: [{use: files, bind: {name: {input: owner}}}]",
            "compose: []",
        );
    let composed_owner = resource_owner
        .replace("imports: {files: resource.files}", "imports: {files: resource.files, values: resource.values}")
        .replace("compose: [{use: files, bind: {name: {input: owner}}}]", "compose: [{use: files, bind: {name: {input: owner}}}, {use: values, bind: {owner: {input: owner}, unused: {input: unused}}}]");
    let composed = link(&[
        modules[0].clone(),
        parse_source("values.yaml", &value_fragment).unwrap(),
        parse_source("resources.yaml", &composed_owner).unwrap(),
    ])
    .unwrap();
    assert!(
        generate(&composed).is_err(),
        "Composed fields cannot disappear from resource entries"
    );
    let invalid = link(&[
        modules[0].clone(),
        parse_source(
            "resources.yaml",
            &owner.replace("kind: object", "kind: resources"),
        )
        .unwrap(),
    ])
    .unwrap();
    assert!(
        generate(&invalid).is_err(),
        "Resource entries cannot silently discard value fields"
    );
    let repeated_fragment = fragment
        .replace(
            "name: {type: {kind: scalar, scalar: text}}",
            "name: {type: {kind: sequence, item: {kind: scalar, scalar: text}}}",
        )
        .replace(
            "- oneOf:",
            "- forEach: {in: {input: name}, as: part}\n  oneOf:",
        )
        .replace("{input: name}", "{var: part}")
        .replace("in: {var: part}", "in: {input: name}");
    let repeated_owner = owner.replace(
        "owner: {type: {kind: scalar, scalar: text}}",
        "owner: {type: {kind: sequence, item: {kind: scalar, scalar: text}}}",
    );
    let repeated = link(&[
        parse_source("repeated.yaml", &repeated_fragment).unwrap(),
        parse_source("owner.yaml", &repeated_owner).unwrap(),
    ])
    .unwrap();
    let generated = generate(&repeated).unwrap();
    let text = String::from_utf8(generated.files[0].contents.clone()).unwrap();
    assert!(text.contains("inputs.sequence(1)?"));
    let remainder = fragment.replace("- oneOf:\n  - xml:", "- remainder:\n    xml:");
    let remainder_program = link(&[
        parse_source("remainder.yaml", &remainder).unwrap(),
        parse_source("owner.yaml", owner).unwrap(),
    ])
    .unwrap();
    let generated = generate(&remainder_program).unwrap();
    assert!(
        String::from_utf8(generated.files[0].contents.clone())
            .unwrap()
            .contains(".remainder()")
    );
    for invalid in [
        fragment.replace("oneOf:", "unknown:"),
        remainder.replace("- remainder:", "- oneOf: []\n  remainder:"),
        fragment.replace("{sequence: [{input: name}]}", "{field: name}"),
        fragment.replace("{sequence: [{input: name}]}", "{literal: wrong-type}"),
    ] {
        let result =
            parse_source("invalid.yaml", &invalid).and_then(|module| link(&[module]).map(|_| ()));
        assert!(result.is_err());
    }
}

fn compile_resource_catalog(generated: &nkdk_rule_compiler::GeneratedSources) {
    use std::{fs, process::Command};
    let root = std::env::temp_dir().join(format!("nkdk-resource-catalog-{}", std::process::id()));
    fs::create_dir_all(root.join("src")).unwrap();
    let core = std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join("../conversion-core");
    fs::write(root.join("Cargo.toml"), format!("[package]\nname = \"resource-catalog\"\nversion = \"0.0.0\"\nedition = \"2024\"\n[dependencies]\nnkdk-conversion-core = {{ path = {:?} }}\n[workspace]\n", core)).unwrap();
    for file in &generated.files {
        fs::write(root.join("src").join(&file.path), &file.contents).unwrap();
    }
    fs::write(
        root.join("src/lib.rs"),
        "#![deny(warnings)]\ninclude!(\"generated.rs\");\n",
    )
    .unwrap();
    let output = Command::new(env!("CARGO"))
        .args(["check", "--offline", "--quiet"])
        .current_dir(&root)
        .env("CARGO_TARGET_DIR", root.join("target"))
        .output()
        .unwrap();
    assert!(
        output.status.success(),
        "Resource-only catalog failed: {}",
        String::from_utf8_lossy(&output.stderr)
    );
    fs::remove_dir_all(root).unwrap();
}
