use nkdk_rule_compiler::{SourceFile, compile, link, parse, schema};
use std::{fs, process::Command};

const COMMON: &str = include_str!("fixtures/qname-common.yaml");
const OWNER: &str = include_str!("fixtures/qname-owner.yaml");

#[test]
fn qname_representation_binds_two_distinct_text_fields() {
    let modules = [COMMON, OWNER].map(|value| {
        parse(SourceFile {
            path: "qname.yaml",
            bytes: value.as_bytes(),
        })
        .unwrap()
    });
    let program = link(&modules).unwrap();
    let document: serde_json::Value =
        serde_json::from_slice(&schema(&program, "test.qualified").unwrap()).unwrap();
    assert_eq!(
        document["properties"]["Qualified"]["properties"]["Name"]["type"],
        "string"
    );
    compile(&[
        SourceFile {
            path: "common.yaml",
            bytes: COMMON.as_bytes(),
        },
        SourceFile {
            path: "owner.yaml",
            bytes: OWNER.as_bytes(),
        },
    ])
    .unwrap();
    for invalid in [
        COMMON.replace("local: part", "local: uri"),
        COMMON.replace("namespace: uri", "namespace: absent"),
        COMMON.replace(
            "name: part, type: {kind: scalar, scalar: text}",
            "name: part, type: {kind: scalar, scalar: boolean}",
        ),
    ] {
        let module = parse(SourceFile {
            path: "invalid.yaml",
            bytes: invalid.as_bytes(),
        })
        .unwrap();
        assert!(link(&[module]).is_err());
    }
}

#[test]
fn qname_table_uses_namespace_uri_in_scalar_collections() {
    const TYPES: &str = r#"format: nkdk-declarations/1
kind: value
id: common.type-kind
namespaces: {xs: 'http://www.w3.org/2001/XMLSchema'}
value:
  kind: enum
  variants: [{name: string, value: string}, {name: boolean, value: boolean}]
representations:
  xml:
    kind: qname-table
    values:
    - {value: string, name: xs:string}
    - {value: boolean, name: xs:boolean}
  yaml:
    kind: scalar
    values:
    - {value: string, literal: Строка}
    - {value: boolean, literal: Булево}
"#;
    const LIST: &str = r#"format: nkdk-declarations/1
kind: value
id: common.type-kinds
namespaces: {v8: 'http://v8.1c.ru/8.1/data/core'}
imports: {kind: common.type-kind}
value: {kind: sequence, item: {use: kind}}
representations:
  xml: {kind: element-sequence, path: [v8:Type]}
  yaml: {kind: sequence, singleton: scalar}
"#;
    const OWNER: &str = r#"format: nkdk-declarations/1
kind: object
id: test.type-kinds
imports: {types: common.type-kinds}
value: {kind: record, fields: [{name: types, type: {use: types}}]}
representations:
  xml: {kind: record, fields: [{field: types, path: [Root]}]}
  yaml: {kind: mapping, fields: [{field: types, key: Types}]}
"#;
    const NAME: &str = r#"format: nkdk-declarations/1
kind: value
id: common.type-name
namespaces:
  xs: http://www.w3.org/2001/XMLSchema
  cfg: http://v8.1c.ru/8.1/data/enterprise/current-config
value: {kind: scalar, scalar: text}
representations:
  xml:
    kind: qname-lexicon
    values:
    - {name: xs:string, literal: Строка}
    - {name: cfg:CatalogRef, literal: Справочник, separator: '.'}
  yaml: {kind: scalar, scalar: text}
"#;
    const NAMES: &str = r#"format: nkdk-declarations/1
kind: value
id: common.type-names
namespaces: {v8: 'http://v8.1c.ru/8.1/data/core'}
imports: {name: common.type-name}
value: {kind: sequence, item: {use: name}}
representations:
  xml: {kind: element-sequence, path: [v8:Type]}
  yaml: {kind: sequence, singleton: scalar}
"#;
    const NAMES_OWNER: &str = r#"format: nkdk-declarations/1
kind: object
id: test.type-names
imports: {names: common.type-names}
value: {kind: record, fields: [{name: names, type: {use: names}}]}
representations:
  xml: {kind: record, fields: [{field: names, path: [Root]}]}
  yaml: {kind: mapping, fields: [{field: names, key: Names}]}
"#;
    let generated = compile(&[
        SourceFile {
            path: "types.yaml",
            bytes: TYPES.as_bytes(),
        },
        SourceFile {
            path: "list.yaml",
            bytes: LIST.as_bytes(),
        },
        SourceFile {
            path: "owner.yaml",
            bytes: OWNER.as_bytes(),
        },
        SourceFile {
            path: "name.yaml",
            bytes: NAME.as_bytes(),
        },
        SourceFile {
            path: "names.yaml",
            bytes: NAMES.as_bytes(),
        },
        SourceFile {
            path: "names-owner.yaml",
            bytes: NAMES_OWNER.as_bytes(),
        },
    ])
    .unwrap();
    let root = std::env::temp_dir().join(format!(
        "nkdk-qname-table-{}-{}",
        std::process::id(),
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_nanos()
    ));
    fs::create_dir_all(&root).unwrap();
    fs::create_dir(root.join("src")).unwrap();
    let core =
        std::path::PathBuf::from(env!("CARGO_MANIFEST_DIR")).with_file_name("conversion-core");
    let manifest = format!(
        "[package]\nname=\"qname-table-generated\"\nversion=\"0.0.0\"\nedition=\"2024\"\n[dependencies]\nnkdk-conversion-core={{path={core:?}}}\n[workspace]\n"
    );
    fs::write(root.join("Cargo.toml"), manifest).unwrap();
    generated
        .files
        .into_iter()
        .for_each(|file| fs::write(root.join("src").join(file.path), file.contents).unwrap());
    let main = r#"include!("generated.rs");
fn main(){
 let entry=entry_id("test.type-kinds").unwrap();let inputs=PreparedInputs::default();
 let xml=b"<Root xmlns:v8='http://v8.1c.ru/8.1/data/core' xmlns:alias='http://www.w3.org/2001/XMLSchema'><v8:Type>alias:string</v8:Type><v8:Type>alias:boolean</v8:Type></Root>";
 let yaml=convert_file(entry,Direction::XmlToYaml,xml,&inputs).unwrap();assert_eq!(yaml.bytes,"Types:\n  - Строка\n  - Булево".as_bytes());verify_candidate(entry,xml,&yaml.bytes,&inputs).unwrap();
 let singleton=convert_file(entry,Direction::YamlToXml,"Types: Строка".as_bytes(),&inputs).unwrap();let back=convert_file(entry,Direction::XmlToYaml,&singleton.bytes,&inputs).unwrap();assert_eq!(back.bytes,"Types: Строка".as_bytes());
 let names=entry_id("test.type-names").unwrap();let complex="<Root xmlns:v8='http://v8.1c.ru/8.1/data/core' xmlns:any='http://v8.1c.ru/8.1/data/enterprise/current-config'><v8:Type>any:CatalogRef.Товары</v8:Type></Root>".as_bytes();let yaml=convert_file(names,Direction::XmlToYaml,complex,&inputs).unwrap();assert_eq!(yaml.bytes,"Names: Справочник.Товары".as_bytes());verify_candidate(names,complex,&yaml.bytes,&inputs).unwrap();
}"#;
    fs::write(root.join("src/main.rs"), main).unwrap();
    let status = Command::new("cargo")
        .arg("run")
        .arg("--quiet")
        .env("CARGO_NET_OFFLINE", "true")
        .current_dir(&root)
        .status()
        .unwrap();
    assert!(status.success());
    let _ = fs::remove_dir_all(root);
}
