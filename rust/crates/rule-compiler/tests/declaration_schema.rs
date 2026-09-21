use nkdk_rule_compiler::{SourceFile, declaration_schema, parse_many};
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
        std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join("tests/fixtures"),
        production.join("common"),
        production.join("probes"),
        production.join("resources"),
    ];
    for entry in paths
        .into_iter()
        .flat_map(|path| std::fs::read_dir(path).unwrap())
    {
        let path = entry.unwrap().path();
        let bytes = std::fs::read(&path).unwrap();
        parse_many(SourceFile {
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
    let reject_change = |base: &Value, pointer: &str, replacement: Value| {
        let mut invalid = base.clone();
        *invalid.pointer_mut(pointer).unwrap() = replacement;
        assert!(!validator.is_valid(&invalid), "{invalid}");
        let bytes = serde_json::to_vec(&invalid).unwrap();
        assert!(
            parse_many(SourceFile {
                path: "invalid.json",
                bytes: &bytes
            })
            .is_err()
        );
    };
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
        reject_change(&base, pointer, replacement);
    }
    let mut invalid = base.clone();
    invalid["unknown"] = json!(true);
    assert!(!validator.is_valid(&invalid));
    assert!(validator.is_valid(&base));
    let structured_choice = json!({
        "format":"nkdk-declarations/1", "kind":"value", "id":"test.choice",
        "imports":{"period":"common.standard-period","array":"common.fixed-array"},
        "value":{"kind":"choice","variants":[
            {"name":"period","type":{"use":"period"}},
            {"name":"array","type":{"use":"array"}}
        ]},
        "representations":{
            "xml":{"kind":"choice"},
            "yaml":{"kind":"choice","variants":[
                {"variant":"period","form":"mapping","key":"Вариант"},
                {"variant":"array","form":"sequence"}
            ]}
        }
    });
    assert!(validator.is_valid(&structured_choice));
    let union_owner = json!({
        "format":"nkdk-declarations/1", "kind":"object", "id":"test.union-owner",
        "value":{"kind":"record","fields":[
            {"name":"name","type":{"kind":"scalar","scalar":"text"}},
            {"name":"items","type":{"kind":"sequence","item":{"kind":"scalar","scalar":"text"}}}
        ]},
        "representations":{
            "xml":{"kind":"record","fields":[
                {"field":"name","path":["Name"]},
                {"field":"items","path":["Items"]}
            ]},
            "yaml":{"kind":"mapping","fields":[
                {"field":"name","key":"Name"},
                {"field":"items","key":"Items"}
            ]}
        },
        "contributions":[{
            "index":"test.types", "key":{"field":"name"},
            "forEach":{"in":{"field":"items"},"as":"item"},
            "value":{"var":"item"}, "union":{"referencePrefix":"ОпределяемыйТип."}
        }]
    });
    assert!(validator.is_valid(&union_owner));
    let mut invalid_union = union_owner.clone();
    invalid_union["contributions"][0]["union"]["referencePrefix"] = json!("");
    assert!(!validator.is_valid(&invalid_union));
    let mut invalid_union = union_owner.clone();
    invalid_union["contributions"][0]["union"]["unexpected"] = json!(true);
    assert!(!validator.is_valid(&invalid_union));
    let single_source =
        include_str!("fixtures/borrowed-record-rows.yaml").replace("exists:", "one:");
    let single = json_value(
        yaml_rust2::YamlLoader::load_from_str(&single_source)
            .unwrap()
            .remove(0),
    );
    assert!(validator.is_valid(&single));
    parse_many(SourceFile {
        path: "one.yaml",
        bytes: single_source.as_bytes(),
    })
    .unwrap();
    reject_change(
        &single,
        "/presence/0/xml/missing/denotes/if/one",
        json!({"in":{"field":"rows"},"where":{"literal":true}}),
    );
    let relation = json_value(
        yaml_rust2::YamlLoader::load_from_str(include_str!("fixtures/state-projections.yaml"))
            .unwrap()
            .remove(0),
    );
    assert!(validator.is_valid(&relation));
    for (pointer, replacement) in [
        ("/state-relations/0/sources", json!({})),
        (
            "/state-relations/0/sources/base",
            json!({"present":{"input":"baseId"},"equals":{"input":"baseId"}}),
        ),
        (
            "/state-relations/0/states/text",
            json!(["notice", "notice"]),
        ),
        ("/state-relations/0/states", json!({})),
        ("/state-relations/0/field", json!(true)),
    ] {
        reject_change(&relation, pointer, replacement);
    }

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
            parse_many(SourceFile {
                path: "invalid.json",
                bytes: &bytes
            })
            .is_err()
        );
    }
}
