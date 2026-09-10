use nkdk_rule_compiler::{SourceFile, generate, link, parse};
use std::{fs, process::Command};

#[test]
fn generated_rust_executes_both_directions_and_uses_the_imported_table() {
    let common = include_str!("fixtures/common.yaml");
    let owner = "format: nkdk-declarations/1\nkind: object\nid: test.scalar-owner\nimports: {boolean: common.boolean}\nvalue:\n  kind: record\n  fields:\n    - name: server\n      type: {use: boolean}\n    - name: description\n      type: {kind: scalar, scalar: text}\nrepresentations:\n  xml:\n    kind: record\n    fields:\n      - {field: server, path: [Root, Server]}\n      - {field: description, path: [Root, Description]}\n  yaml:\n    kind: mapping\n    fields:\n      - {field: server, key: Сервер}\n      - {field: description, key: Описание}\n";
    let root = std::env::temp_dir().join(format!(
        "nkdk-generated-{}-{}",
        std::process::id(),
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_nanos()
    ));
    fs::create_dir_all(root.join("src")).unwrap();
    let core = std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
        .parent()
        .unwrap()
        .join("conversion-core");
    fs::write(root.join("Cargo.toml"), format!("[package]\nname = \"generated-contract\"\nversion = \"0.0.0\"\nedition = \"2024\"\n[dependencies]\nnkdk-conversion-core = {{ path = {:?} }}\n[workspace]\n", core)).unwrap();
    for literal in ["Истина", "Да"] {
        let common = common.replace("Истина", literal);
        let mut modules =
            [("common.yaml", common.as_str()), ("owner.yaml", owner)].map(|(path, source)| {
                parse(SourceFile {
                    path,
                    bytes: source.as_bytes(),
                })
                .unwrap()
            });
        let program = link(&modules).unwrap();
        let generated = generate(&program).expect("generate supported record");
        modules.reverse();
        assert_eq!(generated, generate(&link(&modules).unwrap()).unwrap());
        assert_eq!(generated.dependencies, ["common.yaml", "owner.yaml"]);
        for file in generated.files {
            fs::write(root.join("src").join(file.path), file.contents).unwrap();
        }
        let main = r#"
include!("generated.rs");
fn main() {
    let entry = entry_id("test.scalar-owner").unwrap();
    let inputs = PreparedInputs::default();
    let xml = "\u{feff}<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<Root>\n\t<Server>true</Server>\n\t<Description>  A &amp; B  </Description>\n</Root>";
    let yaml = "Сервер: LITERAL\nОписание: \"  A & B  \"";
    let encoded = convert_file(entry, Direction::XmlToYaml, xml.as_bytes(), &inputs).unwrap();
    assert_eq!(encoded.bytes, yaml.as_bytes());
    assert!(encoded.diagnostics.is_empty());
    let decoded = convert_file(entry, Direction::YamlToXml, yaml.as_bytes(), &inputs).unwrap();
    assert_eq!(decoded.bytes, xml.as_bytes());
    assert!(validate_file(entry, yaml.as_bytes(), &inputs).is_empty());
    assert!(verify_candidate(entry, xml.as_bytes(), yaml.replace("A & B", "Changed").as_bytes(), &inputs).is_err());
    for text in ["\u{85}", "\u{2028}", "\u{2029}", "a\u{85}b", "a\u{2028}b", "a\u{2029}b", "\r", "true", "42", "a: b", "a # b"] {
        let escaped = text.replace('\r', "&#13;");
        let original = format!("<Root><Server>true</Server><Description>{escaped}</Description></Root>");
        let result = convert_file(entry, Direction::XmlToYaml, original.as_bytes(), &inputs).unwrap();
        assert!(verify_candidate(entry, original.as_bytes(), &result.bytes, &inputs).is_ok(), "{text:?}");
    }
    let invalid = "Сервер: wrong\nОписание: x";
    let errors = validate_file(entry, invalid.as_bytes(), &inputs);
    assert_eq!(errors[0].path, ["Сервер"]);
    assert_eq!(errors, convert_file(entry, Direction::YamlToXml, invalid.as_bytes(), &inputs).unwrap_err());
    let duplicate = validate_file(entry, "Сервер: LITERAL\nСервер: Ложь\nОписание: x".as_bytes(), &inputs);
    assert_eq!(duplicate[0].path, ["Сервер"]);
    assert_eq!(duplicate[0].line, 2);
    let reordered = "<Root><Description>  A &amp; B  </Description><Server>true</Server></Root>";
    assert!(convert_file(entry, Direction::XmlToYaml, reordered.as_bytes(), &inputs).is_err());
    let cdata = "<Root>\n <Server>true</Server>\n <Description><![CDATA[  A & B  ]]></Description>\n</Root>";
    assert_eq!(convert_file(entry, Direction::XmlToYaml, cdata.as_bytes(), &inputs).unwrap().bytes, yaml.as_bytes());
    for bad in ["<Root><Server>true</Server><Description>\0</Description></Root>", "<Root>\u{a0}<Server>true</Server><Description>x</Description></Root>", "<?xml version=\"1.1\"?><Root><Server>true</Server><Description>x</Description></Root>"] {
        assert!(convert_file(entry, Direction::XmlToYaml, bad.as_bytes(), &inputs).is_err(), "Invalid XML content was accepted");
    }
    for bad in ["<Root><Server>true</Server><Unknown/></Root>", "<Root><Server>wrong</Server><Description>x</Description></Root>", "<Root><Server>true</Server><Server>false</Server><Description>x</Description></Root>"] {
        assert!(convert_file(entry, Direction::XmlToYaml, bad.as_bytes(), &inputs).is_err(), "{bad}");
    }
    for bad in ["Сервер: LITERAL\nСервер: Ложь\nОписание: x", "Сервер: wrong\nОписание: x", "Сервер: LITERAL\nЛишнее: x", "Сервер: LITERAL\nОписание: !xml/raw x"] {
        assert!(!validate_file(entry, bad.as_bytes(), &inputs).is_empty(), "{bad}");
    }
}
"#.replace("LITERAL", literal);
        fs::write(root.join("src/main.rs"), main).unwrap();
        let output = Command::new(env!("CARGO"))
            .args(["run", "--offline", "--quiet"])
            .current_dir(&root)
            .env("CARGO_TARGET_DIR", root.join("target"))
            .output()
            .unwrap();
        assert!(
            output.status.success(),
            "compiled conversion failed in {}:\n{}",
            root.display(),
            String::from_utf8_lossy(&output.stderr)
        );
    }
    fs::remove_dir_all(root).unwrap();
}

#[test]
fn generation_rejects_records_without_a_single_xml_document_root() {
    let source = include_str!("../../../declarations/probes/scalars.yaml");
    let boolean = include_str!("../../../declarations/common/boolean.yaml");
    let text = include_str!("../../../declarations/common/string.yaml");
    for owner in [
        source.replace("Root, Description", "Other, Description"),
        source.replace("Root, Server", "Server"),
    ] {
        let modules = [
            ("owner.yaml", owner.as_str()),
            ("boolean.yaml", boolean),
            ("string.yaml", text),
        ]
        .map(|(path, source)| {
            parse(SourceFile {
                path,
                bytes: source.as_bytes(),
            })
            .unwrap()
        });
        let program = link(&modules).unwrap();
        assert!(
            generate(&program).is_err(),
            "Generation must not emit multiple XML roots"
        );
    }
}
