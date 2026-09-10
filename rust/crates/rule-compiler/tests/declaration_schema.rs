use nkdk_rule_compiler::{SourceFile, declaration_schema, parse};
use serde_json::{Value, json};

fn json_value(value: yaml_rust2::Yaml) -> Value {
    use yaml_rust2::Yaml;
    match value {
        Yaml::String(text) => json!(text),
        Yaml::Boolean(value) => json!(value),
        Yaml::Integer(value) => json!(value),
        Yaml::Real(value) => Value::Number(value.parse().expect("finite exact JSON number")),
        Yaml::Null => Value::Null,
        Yaml::Array(values) => Value::Array(values.into_iter().map(json_value).collect()),
        Yaml::Hash(values) => Value::Object(
            values
                .into_iter()
                .map(|(key, value)| (key.into_string().expect("textual key"), json_value(value)))
                .collect(),
        ),
        _ => panic!("Not a JSON-compatible declaration"),
    }
}

#[test]
fn authoring_schema_accepts_the_corpus_and_rejects_structural_mistakes() {
    let schema: Value = serde_json::from_slice(declaration_schema()).unwrap();
    jsonschema::meta::validate(&schema).unwrap();
    let validator = jsonschema::validator_for(&schema).unwrap();
    let directory = std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
        .join("../../../tests/declaration-corpus/valid");
    let mut count = 0;
    let production =
        std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join("../../../rust/declarations");
    let paths = [
        directory,
        production.join("common"),
        production.join("probes"),
    ];
    for entry in paths
        .into_iter()
        .flat_map(|path| std::fs::read_dir(path).unwrap())
    {
        let path = entry.unwrap().path();
        let bytes = std::fs::read(&path).unwrap();
        parse(SourceFile {
            path: path.to_str().unwrap(),
            bytes: &bytes,
        })
        .unwrap();
        let yaml =
            yaml_rust2::YamlLoader::load_from_str(std::str::from_utf8(&bytes).unwrap()).unwrap();
        let value = json_value(yaml.into_iter().next().unwrap());
        let errors: Vec<_> = validator
            .iter_errors(&value)
            .map(|error| error.to_string())
            .collect();
        assert!(errors.is_empty(), "{}: {errors:?}", path.display());
        count += 1;
    }
    assert!(count > 0);
    let base = json!({
        "format":"nkdk-declarations/1", "kind":"value", "id":"test.number",
        "value":{"kind":"scalar","scalar":"number","profile":"decimal"},
        "representations":{"xml":{"kind":"text"},"yaml":{"kind":"scalar","scalar":"number"}}
    });
    for (pointer, replacement) in [
        ("/format", json!("future")),
        ("/value/profile", json!("binary64")),
        ("/value", json!({"kind":"scalar","scalar":"number"})),
        (
            "/value",
            json!({"kind":"scalar","scalar":"text","profile":"decimal"}),
        ),
        ("/representations/yaml/scalar", json!("text")),
        ("/kind", json!("object")),
        ("/id", json!("")),
    ] {
        let mut invalid = base.clone();
        *invalid.pointer_mut(pointer).unwrap() = replacement;
        assert!(!validator.is_valid(&invalid), "{invalid}");
        let bytes = serde_json::to_vec(&invalid).unwrap();
        assert!(
            parse(SourceFile {
                path: "invalid.json",
                bytes: &bytes
            })
            .is_err()
        );
    }
    let mut invalid = base.clone();
    invalid["unknown"] = json!(true);
    assert!(!validator.is_valid(&invalid));
    assert!(validator.is_valid(&base));
    for expression in [
        json!({"eq":[{"literal":1}]}),
        json!({"and":[]}),
        json!({"literal":1,"field":"a"}),
        json!({"if":{"literal":true},"then":{"literal":true}}),
        json!({"take":{"in":{"sequence":[]},"count":-1}}),
        json!({"callback":"validate"}),
    ] {
        let mut invalid = base.clone();
        invalid["constraints"] = json!([{"id":"bad","appliesTo":["yaml-validation"],"assert":expression,"diagnostic":{"severity":"error","at":{"self":true},"message":"bad"}}]);
        assert!(!validator.is_valid(&invalid), "{invalid}");
        let bytes = serde_json::to_vec(&invalid).unwrap();
        assert!(
            parse(SourceFile {
                path: "invalid.json",
                bytes: &bytes
            })
            .is_err()
        );
    }
}
