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

fn schema_details(error: &jsonschema::ValidationError<'_>, out: &mut Vec<String>) {
    use jsonschema::error::ValidationErrorKind;
    match error.kind() {
        ValidationErrorKind::OneOfNotValid { context } | ValidationErrorKind::AnyOf { context } => {
            for nested in context.iter().flatten() {
                schema_details(nested, out);
            }
        }
        _ => out.push(format!("{}: {error}", error.instance_path())),
    }
}

#[test]
fn authoring_schema_accepts_the_corpus_and_rejects_structural_mistakes() {
    std::thread::Builder::new()
        .stack_size(16 * 1024 * 1024)
        .spawn(authoring_schema_accepts_the_corpus_and_rejects_structural_mistakes_inner)
        .unwrap()
        .join()
        .unwrap();
}

fn authoring_schema_accepts_the_corpus_and_rejects_structural_mistakes_inner() {
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
        // Template inputs are compiled by their own matrix after substitution.
        if path.extension().is_none_or(|extension| extension != "yaml") {
            continue;
        }
        let bytes = std::fs::read(&path).unwrap();
        parse_many(SourceFile {
            path: path.to_str().unwrap(),
            bytes: &bytes,
        })
        .unwrap();
        let yaml =
            yaml_rust2::YamlLoader::load_from_str(std::str::from_utf8(&bytes).unwrap()).unwrap();
        let value = json_value(yaml.into_iter().next().unwrap());
        if !validator.is_valid(&value) {
            let error = validator
                .iter_errors(&value)
                .next()
                .expect("invalid schema instance");
            let mut details = Vec::new();
            schema_details(&error, &mut details);
            panic!(
                "{}: instance {}, schema {}\n{}",
                path.display(),
                error.instance_path(),
                error.schema_path(),
                details.join("\n")
            );
        }
        count += 1;
    }
    assert!(count > 0);
    let base = json!({
        "format":"nkdk-declarations/1", "kind":"value", "id":"test.number",
        "value":{"kind":"scalar","scalar":"number","profile":"decimal"},
        "representations":{"xml":{"kind":"text"},"yaml":{"kind":"scalar","scalar":"number"}}
    });
    let mut inherited = base.clone();
    inherited.as_object_mut().unwrap().remove("format");
    let catalog = json!({"format":"nkdk-declarations/1", "kind":"catalog", "declarations":[inherited.clone()]});
    assert!(
        validator.is_valid(&catalog),
        "catalog entries inherit their format"
    );
    let bytes = serde_json::to_vec(&catalog).unwrap();
    parse_many(SourceFile {
        path: "inherited-format.json",
        bytes: &bytes,
    })
    .unwrap();
    assert!(
        !validator.is_valid(&inherited),
        "standalone declarations still require a format"
    );
    assert!(
        parse_many(SourceFile {
            path: "missing-format.json",
            bytes: &serde_json::to_vec(&inherited).unwrap()
        })
        .is_err()
    );
    let mut incompatible = catalog.clone();
    incompatible["declarations"][0]["format"] = json!("future");
    assert!(!validator.is_valid(&incompatible));

    let reject = |invalid: &Value| {
        assert!(!validator.is_valid(invalid), "{invalid}");
        let bytes = serde_json::to_vec(&invalid).unwrap();
        assert!(
            parse_many(SourceFile {
                path: "invalid.json",
                bytes: &bytes
            })
            .is_err()
        );
    };
    let reject_change = |base: &Value, pointer: &str, replacement: Value| {
        let mut invalid = base.clone();
        *invalid.pointer_mut(pointer).unwrap() = replacement;
        reject(&invalid);
    };
    let files = json_value(
        yaml_rust2::YamlLoader::load_from_str(include_str!("fixtures/yaml-text-files.yaml"))
            .unwrap()
            .remove(0),
    );
    let mut conflicting = files.clone();
    conflicting["representations"]["yaml"]["fields"][0]["key"] = json!("Payload");
    reject(&conflicting);
    reject_change(
        &files,
        "/representations/yaml/fields/0/file",
        json!({"callback":"path"}),
    );
    let mut projected = files.clone();
    projected["representations"]["yaml"]["shorthand"] = json!([{
        "id":"payload", "representation":{"kind":"mapping","field":"title"},
        "denotes":{"literal":"duplicated"}
    }]);
    reject(&projected);
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
    let composed_value = json!({
        "format":"nkdk-declarations/1", "kind":"value", "id":"test.composed",
        "imports":{"part":"common.part"}, "compose":[{"use":"part"}],
        "yamlOrder":["name"],
        "value":{"kind":"record","fields":[]},
        "representations":{"xml":{"kind":"record","fields":[]},"yaml":{"kind":"mapping","fields":[]}}
    });
    assert!(validator.is_valid(&composed_value));
    let marked_collection = json!({
        "format":"nkdk-declarations/1", "kind":"value", "id":"test.marked",
        "imports":{"item":"common.item"},
        "value":{"kind":"sequence","item":{"use":"item"}},
        "representations":{"xml":{"kind":"element-sequence","path":["Item"]},
          "yaml":{"kind":"sequence","itemTag":"изменять"}}
    });
    assert!(validator.is_valid(&marked_collection));
    for tag in ["xml", "xml/raw", "has space", "!changed", ""] {
        let mut invalid = marked_collection.clone();
        invalid["representations"]["yaml"]["itemTag"] = json!(tag);
        reject(&invalid);
    }
    let mut inline_marked = marked_collection.clone();
    inline_marked["representations"]["yaml"]["item"] = json!({"kind":"scalar","scalar":"text"});
    reject(&inline_marked);
    let sparse_collection = json!({
        "format":"nkdk-declarations/1", "kind":"value", "id":"test.sparse",
        "imports":{"item":"common.item"},
        "value":{"kind":"sequence","item":{"use":"item"}},
        "representations":{"xml":{"kind":"element-sequence","path":["Item"]},
          "yaml":{"kind":"record-mapping","key":"name","restoreFrom":"canonicalNames",
            "omitEmptyFor":"elidableNames","emptyTag":"xml/standard-attributes"}}
    });
    assert!(validator.is_valid(&sparse_collection));
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
    let mut tagged_value = structured_choice.clone();
    tagged_value["representations"]["yaml"]["variants"][0] =
        json!({"variant":"period","form":"tagged","tag":"проверять"});
    assert!(validator.is_valid(&tagged_value));
    for extra in ["key", "value", "input", "equals"] {
        let mut invalid = tagged_value.clone();
        invalid["representations"]["yaml"]["variants"][0][extra] = json!("unexpected");
        reject(&invalid);
    }

    for selector in [
        json!({"variant":"period","form":"mapping","value":"missing-key"}),
        json!({"variant":"period","form":"scalar"}),
        json!({"variant":"period","form":"scalar","tag":"xml/string","key":"unexpected"}),
    ] {
        let mut invalid = structured_choice.clone();
        invalid["representations"]["yaml"]["variants"][0] = selector;
        reject(&invalid);
    }
    let mut choice_with_fallback = structured_choice.clone();
    choice_with_fallback["representations"]["xml"]["fallback"] = json!("period");
    choice_with_fallback["representations"]["yaml"]["fallback"] = json!("period");
    assert!(validator.is_valid(&choice_with_fallback));
    choice_with_fallback["representations"]["xml"]["fallback"] = json!("");
    assert!(!validator.is_valid(&choice_with_fallback));
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
    let mut lookup_owner = union_owner.clone();
    lookup_owner["contributions"][0]
        .as_object_mut()
        .unwrap()
        .remove("union");
    lookup_owner["contributions"][0]["duplicates"] = json!("coalesce-equal");
    assert!(validator.is_valid(&lookup_owner));
    lookup_owner["contributions"][0]["duplicates"] = json!("first");
    assert!(!validator.is_valid(&lookup_owner));

    let mut reservation = union_owner.clone();
    reservation["contributions"] = json!([{
        "index": "test.numbers", "key": {"record": {}}, "reserve": {"field": "name"}
    }]);
    assert!(validator.is_valid(&reservation));
    parse_many(SourceFile {
        path: "reserve.json",
        bytes: &serde_json::to_vec(&reservation).unwrap(),
    })
    .unwrap();
    for (key, value) in [
        ("value", json!({"field":"name"})),
        ("allocate", json!({"scope":[],"first":1})),
        ("duplicates", json!("coalesce-equal")),
        ("union", json!({"referencePrefix":"x:"})),
    ] {
        let mut invalid = reservation.clone();
        invalid["contributions"][0][key] = value;
        reject(&invalid);
    }

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

    let mut positioned = base.clone();
    positioned["constraints"] = json!([{"id":"position","appliesTo":["yaml-validation"],"assert":{"eq":[{"collectionPosition":true},{"literal":0}]},"diagnostic":{"severity":"error","at":{"self":true},"message":"position"}}]);
    assert!(
        validator.is_valid(&positioned),
        "collection position is a declared expression"
    );

    let mut addressed = base.clone();
    addressed["constraints"] = json!([{"id":"addressed","appliesTo":["yaml-validation"],"assert":{"eq":[{"logicalAddress":{"parent":{"literal":"Root"},"parts":[{"yamlField":"field"}]}},{"literal":"Root.Field"}]},"diagnostic":{"severity":"error","at":{"self":true},"message":"address"}}]);
    assert!(validator.is_valid(&addressed));
    parse_many(SourceFile {
        path: "addressed.json",
        bytes: &serde_json::to_vec(&addressed).unwrap(),
    })
    .unwrap();
    for expression in [
        json!({"logicalAddress":{"parts":[{"yamlField":""}]}}),
        json!({"logicalAddress":{"parts":[{"yamlField":false}]}}),
        json!({"logicalAddress":{"parts":[{"yamlField":"field","extra":true}]}}),
        json!({"yamlField":"field"}),
        json!({"logicalAddress":{"parts":[]}}),
        json!({"logicalAddress":{"parts":[{"literal":"root"}],"unknown":true}}),
        json!({"collectionPosition":false}),
        json!({"collectionPosition":0}),
        json!({"eq":[{"literal":1}]}),
        json!({"and":[]}),
        json!({"literal":1,"field":"a"}),
        json!({"if":{"literal":true},"then":{"literal":true}}),
        json!({"take":{"in":{"sequence":[]},"count":-1}}),
        json!({"callback":"validate"}),
    ] {
        let mut invalid = base.clone();
        invalid["constraints"] = json!([{"id":"bad","appliesTo":["yaml-validation"],"assert":expression,"diagnostic":{"severity":"error","at":{"self":true},"message":"bad"}}]);
        reject(&invalid);
    }
}
