use nkdk_rule_compiler::{SourceFile, compile};
use std::{fs, process::Command};
#[test]
fn generated_keyed_mapping_preserves_duplicate_occurrences_and_proves_the_candidate() {
    let common = b"format: nkdk-declarations/1\nkind: value\nid: common.dictionary\nvalue:\n  kind: sequence\n  item:\n    kind: record\n    fields:\n      - {name: key, type: {kind: scalar, scalar: text}}\n      - {name: text, type: {kind: scalar, scalar: text}}\nrepresentations:\n  xml:\n    kind: element-sequence\n    path: [item]\n    item:\n      kind: record\n      fields:\n        - {field: key, path: [key]}\n        - {field: text, path: [text]}\n  yaml: {kind: keyed-mapping, key: key, value: text}\n";
    let owner=b"format: nkdk-declarations/1\nkind: object\nid: test.dictionary\nimports: {dictionary: common.dictionary}\nvalue:\n  kind: record\n  fields:\n    - {name: entries, type: {use: dictionary}}\nrepresentations:\n  xml:\n    kind: record\n    fields:\n      - {field: entries, path: [Root, Entries]}\n  yaml:\n    kind: mapping\n    fields:\n      - {field: entries, key: Entries}\n";
    let common=std::str::from_utf8(common).unwrap().replace("value:\n", "inputs:\n  primary: {type: {kind: scalar, scalar: text}}\nvalue:\n").replace("  yaml: {kind: keyed-mapping, key: key, value: text}", "  yaml:\n    kind: keyed-mapping\n    key: key\n    value: text\n    shorthand:\n      - id: primary\n        representation: {kind: scalar, scalar: text, capture: text}\n        denotes:\n          sequence:\n            - record:\n                key: {input: primary}\n                text: {capture: text}");
    let common = common
        + "constraints:\n  - id: forbidden-text\n    appliesTo: [xml-import, yaml-validation]\n    forEach: {in: {self: true}, as: row}\n    assert: {not: {eq: [{get: {of: {var: row}, field: text}}, {literal: bad}]}}\n    diagnostic:\n      code: text.forbidden\n      severity: error\n      at: {occurrence: row, field: key}\n      message: {parts: [\"Forbidden: \", {get: {of: {var: row}, field: text}}]}\n";
    let common = common
        + "  - id: mapping-only\n    appliesTo: [yaml-validation]\n    forms: [keyed-mapping]\n    assert:\n      each:\n        in: {self: true}\n        as: row\n        where: {not: {eq: [{get: {of: {var: row}, field: text}}, {literal: mapping-only}]}}\n    diagnostic:\n      code: collection.mapping-only\n      severity: error\n      at: {self: true}\n      message: Mapping only\n";
    let common = common
        + "presence:\n  - target: self\n    xml:\n      missing: {denotes: {absent: true}}\n      empty: [{form: empty-element, denotes: {sequence: []}}]\n    yaml:\n      missing: {denotes: {absent: true}}\n      empty: [{form: empty-mapping, denotes: {sequence: []}}]\n";
    let owner = std::str::from_utf8(owner).unwrap().replace(
        "{use: dictionary}",
        "{use: dictionary, bind: {primary: {literal: ru}}}",
    );
    let sorted_rule = "  - id: language-order\n    appliesTo: [yaml-validation]\n    assert:\n      ordered:\n        in: {self: true}\n        as: row\n        key: {get: {of: {var: row}, field: key}}\n        unique: true\n        first: [{input: primary}]\n        comparison: utf16\n    diagnostic:\n      code: collection.order\n      severity: error\n      at: {self: true}\n      message: Invalid order\n";
    let sorted_common = common
        .replace("common.dictionary", "common.sorted-dictionary")
        .replace("presence:\n", &format!("{sorted_rule}presence:\n"));
    let sorted_owner = owner
        .replace("test.dictionary", "test.sorted-dictionary")
        .replace("common.dictionary", "common.sorted-dictionary");
    let derived_common = common
        .split_once("presence:\n")
        .unwrap()
        .0
        .replace("common.dictionary", "common.derived-dictionary")
        + "presence:\n  - target: self\n    xml:\n      missing: {denotes: {absent: true}}\n      empty: [{form: empty-element, denotes: {sequence: []}}]\n    yaml:\n      missing:\n        denotes:\n          sequence:\n            - record: {key: {input: primary}, text: {literal: Default}}\n      empty:\n        - {form: empty-mapping, denotes: {absent: true}}\n        - {form: empty-string, denotes: {sequence: []}}\n      omitWhen:\n        eq:\n          - {self: true}\n          - sequence:\n              - record: {key: {input: primary}, text: {literal: Default}}\n";
    let derived_owner = owner
        .replace("test.dictionary", "test.derived-dictionary")
        .replace("common.dictionary", "common.derived-dictionary");
    let normalized_common = common.replace("common.dictionary", "common.normalized-dictionary")
        + "normalization:\n  when: {literal: true}\n  from: empty-sequence\n  denotes:\n    sequence:\n      - record: {key: {input: primary}, text: {literal: \"\"}}\n";
    let normalized_owner = owner
        .replace("test.dictionary", "test.normalized-dictionary")
        .replace("common.dictionary", "common.normalized-dictionary");
    let canonical_common=common.replace("common.dictionary", "common.canonical-dictionary").replace("    yaml:\n", "      canonical:\n        - when:\n            each:\n              in: {self: true}\n              as: row\n              where: {eq: [{get: {of: {var: row}, field: text}}, {literal: \"\"}]}\n          form: missing\n        - form: ordinary\n    yaml:\n");
    let canonical_owner = owner
        .replace("test.dictionary", "test.canonical-dictionary")
        .replace("common.dictionary", "common.canonical-dictionary");
    let patterned_common=common.replace("common.dictionary", "common.patterned-dictionary").replace("    shorthand:\n", "    shorthand:\n      - id: default-and-rest\n        representation: {kind: keyed-mapping, capture: rest, absentKeys: [{input: primary}]}\n        denotes:\n          sequence-pattern:\n            prefix: [{record: {key: {input: primary}, text: {literal: Default}}}]\n            rest: {capture: rest}\n      - id: absent-primary\n        representation:\n          kind: keyed-mapping\n          capture: rest\n          prefix: [{record: {key: {input: primary}, text: {literal: \"\"}}}]\n          absentKeys: [{input: primary}]\n        denotes: {capture: rest}\n        when: {exists: {in: {capture: rest}, as: row, where: {literal: true}}}\n");
    let patterned_owner = owner
        .replace("test.dictionary", "test.patterned-dictionary")
        .replace("common.dictionary", "common.patterned-dictionary");
    let words = include_str!("../../../../tests/declaration-corpus/valid/name-text-transform.yaml");
    let words = words
        .split_once("types:\n")
        .unwrap()
        .1
        .split_once("\nvalue:\n")
        .unwrap()
        .0;
    let named_common=patterned_common.replace("common.patterned-dictionary", "common.named-dictionary").replace("value:\n  kind: sequence", &format!("  ownerName: {{type: {{kind: scalar, scalar: text}}}}\ntypes:\n{words}\nvalue:\n  kind: sequence")).replace("text: {literal: Default}", "text: {if: {isReady: {input: ownerName}}, then: {transform: {local: name-words, value: {input: ownerName}}}, else: {absent: true}}");
    let named_owner = patterned_owner
        .replace("test.patterned-dictionary", "test.named-dictionary")
        .replace("common.patterned-dictionary", "common.named-dictionary")
        .replace(
            "value:\n",
            "inputs:\n  ownerName: {type: {kind: scalar, scalar: text}}\nvalue:\n",
        )
        .replace(
            "bind: {primary: {literal: ru}}",
            "bind: {primary: {literal: ru}, ownerName: {input: ownerName}}",
        );
    let (head, rest) = common.split_once("  xml:\n").unwrap();
    let (xml, tail) = rest.split_once("  yaml:").unwrap();
    let xml = xml
        .lines()
        .map(|line| format!("  {line}\n"))
        .collect::<String>();
    let typed_common=format!("{head}  xml:\n    kind: with-attributes\n    attributes:\n      - {{name: x:type, value: {{qname: v:Kind}}, when: {{parameter: typed}}}}\n    content:\n{xml}  yaml:{tail}").replace("common.dictionary", "common.typed-dictionary").replace("inputs:\n", "namespaces: {x: 'urn:attr', v: 'urn:value'}\nparameters:\n  typed: {type: {kind: scalar, scalar: boolean}, default: true}\ninputs:\n");
    let typed_owner = owner
        .replace("test.dictionary", "test.typed-dictionary")
        .replace("common.dictionary", "common.typed-dictionary");
    let untyped_owner = typed_owner
        .replace("test.typed-dictionary", "test.untyped-dictionary")
        .replace(
            "{use: dictionary, bind:",
            "{use: dictionary, with: {typed: false}, bind:",
        );
    let nil_common=common.replace("common.dictionary", "common.nil-dictionary").replace("empty: [{form: empty-element, denotes: {sequence: []}}]", "empty:\n        - {form: empty-element, denotes: {sequence: []}}\n        - {form: nil, denotes: {absent: true}}\n      canonical:\n        - {when: {not: {present: {self: true}}}, form: nil}\n        - {form: ordinary}");
    let nil_owner = owner
        .replace("test.dictionary", "test.nil-dictionary")
        .replace("common.dictionary", "common.nil-dictionary");
    let integrated =
        include_bytes!("../../../../tests/declaration-corpus/valid/i8n-integrated-profile.yaml");
    let integrated_owner = owner
        .replace("test.dictionary", "test.integrated-i8n")
        .replace("common.dictionary", "common.i8n-text")
        .replace("bind: {primary: {literal: ru}}", "bind: {defaultLanguage: {literal: ru}, registeredLanguages: {input: languages}, ownerName: {input: name}}")
        .replace("value:\n", "inputs:\n  languages: {type: {kind: sequence, item: {kind: scalar, scalar: text}}}\n  name: {type: {kind: scalar, scalar: text}}\nvalue:\n");
    let profiles: Vec<_> = (0..16).map(|profile| integrated_owner
        .replace("test.integrated-i8n", &format!("test.profile-{profile}"))
        .replace("{use: dictionary, bind:", &format!("{{use: dictionary, with: {{preserveEmptyXML: {}, excludeIfEqualNameYAML: {}, skipEmptyToXML: {}, typedXML: {}}}, bind:", profile & 1 != 0, profile & 2 != 0, profile & 4 != 0, profile & 8 != 0))).collect();
    let corpus_profiles: Vec<_> = profiles
        .iter()
        .map(|source| {
            source
                .replace("test.profile-", "test.corpus-")
                .replace("path: [Root, Entries]", "path: [Root, Title]")
                .replace("key: Entries", "key: Заголовок")
        })
        .collect();
    let mut sources = vec![
        SourceFile {
            path: "integrated.yaml",
            bytes: integrated,
        },
        SourceFile {
            path: "integrated-owner.yaml",
            bytes: integrated_owner.as_bytes(),
        },
        SourceFile {
            path: "nil-common.yaml",
            bytes: nil_common.as_bytes(),
        },
        SourceFile {
            path: "nil-owner.yaml",
            bytes: nil_owner.as_bytes(),
        },
        SourceFile {
            path: "typed-common.yaml",
            bytes: typed_common.as_bytes(),
        },
        SourceFile {
            path: "typed-owner.yaml",
            bytes: typed_owner.as_bytes(),
        },
        SourceFile {
            path: "untyped-owner.yaml",
            bytes: untyped_owner.as_bytes(),
        },
        SourceFile {
            path: "named-common.yaml",
            bytes: named_common.as_bytes(),
        },
        SourceFile {
            path: "named-owner.yaml",
            bytes: named_owner.as_bytes(),
        },
        SourceFile {
            path: "patterned-common.yaml",
            bytes: patterned_common.as_bytes(),
        },
        SourceFile {
            path: "patterned-owner.yaml",
            bytes: patterned_owner.as_bytes(),
        },
        SourceFile {
            path: "normalized-common.yaml",
            bytes: normalized_common.as_bytes(),
        },
        SourceFile {
            path: "normalized-owner.yaml",
            bytes: normalized_owner.as_bytes(),
        },
        SourceFile {
            path: "canonical-common.yaml",
            bytes: canonical_common.as_bytes(),
        },
        SourceFile {
            path: "canonical-owner.yaml",
            bytes: canonical_owner.as_bytes(),
        },
        SourceFile {
            path: "derived-common.yaml",
            bytes: derived_common.as_bytes(),
        },
        SourceFile {
            path: "derived-owner.yaml",
            bytes: derived_owner.as_bytes(),
        },
        SourceFile {
            path: "sorted-common.yaml",
            bytes: sorted_common.as_bytes(),
        },
        SourceFile {
            path: "sorted-owner.yaml",
            bytes: sorted_owner.as_bytes(),
        },
        SourceFile {
            path: "common.yaml",
            bytes: common.as_bytes(),
        },
        SourceFile {
            path: "owner.yaml",
            bytes: owner.as_bytes(),
        },
    ];
    sources.extend(profiles.iter().map(|source| SourceFile {
        path: "profile.yaml",
        bytes: source.as_bytes(),
    }));
    sources.extend(corpus_profiles.iter().map(|source| SourceFile {
        path: "corpus-profile.yaml",
        bytes: source.as_bytes(),
    }));
    let generated = compile(&sources).unwrap();
    let root = std::env::temp_dir().join(format!(
        "nkdk-generated-collection-{}-{}",
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
    fs::write(root.join("Cargo.toml"), format!("[package]\nname=\"generated-collection\"\nversion=\"0.0.0\"\nedition=\"2024\"\n[dependencies]\nnkdk-conversion-core={{path={core:?}}}\n[workspace]\n")).unwrap();
    for file in generated.files {
        fs::write(root.join("src").join(file.path), file.contents).unwrap();
    }
    fs::write(root.join("src/main.rs"), r#"include!("generated.rs");
fn main() {
    let integrated=entry_id("test.integrated-i8n").unwrap();
    let integrated_inputs=read_inputs(integrated, b"languages: [ru, en]\nname: TestTest").unwrap();
    let integrated_xml=b"<Root xmlns:v8=\"http://v8.1c.ru/8.1/data/core\"><Entries><v8:item><v8:lang>ru</v8:lang><v8:content>Hello</v8:content></v8:item></Entries></Root>";
    assert_eq!(convert_file(integrated, Direction::XmlToYaml, integrated_xml, &integrated_inputs).unwrap().bytes, b"Entries: Hello");
    assert!(validate_file(integrated, b"Entries: {ru: Hello, en: Other}", &integrated_inputs).is_empty());
    assert!(!validate_file(integrated, b"Entries: {en: Other, ru: Hello}", &integrated_inputs).is_empty());
    for profile in 0..16 {
        let entry=entry_id(&format!("test.profile-{profile}")).unwrap();
        let inputs=read_inputs(entry, b"languages: [ru, en]\nname: TestTest").unwrap();
        let normal=convert_file(entry, Direction::YamlToXml, b"Entries: Hello", &inputs).unwrap();
        let normal=String::from_utf8(normal.bytes).unwrap();
        assert_eq!(normal.contains(":type="), profile & 8 != 0, "profile {profile}");
        let empty=convert_file(entry, Direction::YamlToXml, b"Entries: \"\"", &inputs).unwrap();
        let empty=String::from_utf8(empty.bytes).unwrap();
        assert_eq!(empty.contains("<Entries"), profile & 4 == 0, "profile {profile}: {empty}");
        assert_eq!(empty.contains(":type="), profile & 8 != 0 && profile & 7 == 0, "profile {profile}: {empty}");
        assert_eq!(empty.contains(":item>"), profile & 7 == 0, "profile {profile}: {empty}");
        for content in ["", "<Entries/>", "<Entries xsi:nil=\"true\"/>", "<Entries><v8:item><v8:lang>ru</v8:lang><v8:content/></v8:item></Entries>", "<Entries xsi:type=\"v8:LocalStringType\"><v8:item><v8:lang>ru</v8:lang><v8:content>Hello</v8:content></v8:item></Entries>"] {
            let xml=format!("<Root xmlns:v8=\"http://v8.1c.ru/8.1/data/core\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\">{content}</Root>");
            let yaml=convert_file(entry, Direction::XmlToYaml, xml.as_bytes(), &inputs).unwrap_or_else(|error| panic!("profile {profile}, {content}: {error:?}"));
            verify_candidate(entry, xml.as_bytes(), &yaml.bytes, &inputs).unwrap();
        }

    }
    let foldable=entry_id("test.profile-2").unwrap();
    let foldable_inputs=read_inputs(foldable, b"languages: [ru, en]\nname: TestTest").unwrap();
    let physical_empty=b"<Root xmlns:v8=\"http://v8.1c.ru/8.1/data/core\"><Entries><v8:item><v8:lang>ru</v8:lang><v8:content/></v8:item></Entries></Root>";
    let preserved=convert_file(foldable, Direction::XmlToYaml, physical_empty, &foldable_inputs).unwrap();
    assert_eq!(preserved.bytes, "Entries: !xml/raw\n  $значение: \"\"\n  $xml:\n    v8:item:\n      v8:lang: ru\n      v8:content:".as_bytes());
    assert!(validate_file(foldable, &preserved.bytes, &foldable_inputs).is_empty());
    verify_candidate(foldable, physical_empty, &preserved.bytes, &foldable_inputs).unwrap();
    let changed=String::from_utf8(preserved.bytes.clone()).unwrap().replace("v8:lang: ru", "v8:lang: en");
    assert!(verify_candidate(foldable, physical_empty, changed.as_bytes(), &foldable_inputs).is_err());
    let broken=String::from_utf8(preserved.bytes).unwrap().replace("$xml:", "$unknown:");
    assert!(!validate_file(foldable, broken.as_bytes(), &foldable_inputs).is_empty());

    let folded_tag=b"Entries:\n  !xml/invalid de: Andere";
    assert!(validate_file(foldable, folded_tag, &foldable_inputs).is_empty());
    let restored=convert_file(foldable, Direction::YamlToXml, folded_tag, &foldable_inputs).unwrap();
    let restored=String::from_utf8(restored.bytes).unwrap();
    assert!(restored.contains("Test test") && restored.contains("Andere"));
    for (entry, inputs, body, expected) in [
        (integrated, &integrated_inputs, "<v8:item><v8:lang/><v8:content>Service</v8:content></v8:item><v8:item><v8:lang>ru</v8:lang><v8:content>Hello</v8:content></v8:item>", "Entries:\n  : Service\n  ru: Hello"),
        (integrated, &integrated_inputs, "<v8:item><v8:lang>de</v8:lang><v8:content>Eins</v8:content></v8:item><v8:item><v8:lang>de</v8:lang><v8:content>Zwei</v8:content></v8:item>", "Entries:\n  !xml/invalid de: Eins\n  !xml/invalid/2 de: Zwei"),
        (integrated, &integrated_inputs, "<v8:item><v8:lang>en</v8:lang><v8:content>Other</v8:content></v8:item><v8:item><v8:lang>ru</v8:lang><v8:content>Hello</v8:content></v8:item>", "Entries: !xml/invalid\n  en: Other\n  ru: Hello"),
        (foldable, &foldable_inputs, "<v8:item><v8:lang>ru</v8:lang><v8:content>Test test</v8:content></v8:item><v8:item><v8:lang>en</v8:lang><v8:content>Other</v8:content></v8:item>", "Entries:\n  en: Other"),
    ] {
        let xml=format!("<Root xmlns:v8=\"http://v8.1c.ru/8.1/data/core\"><Entries>{body}</Entries></Root>");
        let result=convert_file(entry, Direction::XmlToYaml, xml.as_bytes(), inputs).unwrap();
        assert_eq!(result.bytes, expected.as_bytes());
        assert!(validate_file(entry, expected.as_bytes(), inputs).is_empty());
        assert!(verify_candidate(entry, xml.as_bytes(), expected.as_bytes(), inputs).is_ok());
    }
    let entry=entry_id("test.dictionary").unwrap();
    let inputs=PreparedInputs::default();
    let xml=b"<Root><Entries><item><key>ru</key><text>one</text></item><item><key>en</key><text>two</text></item><item><key>ru</key><text>three</text></item></Entries></Root>";
    let expected=b"Entries:\n  ru: one\n  en: two\n  !xml/invalid ru: three";
    let yaml=convert_file(entry, Direction::XmlToYaml, xml, &inputs).unwrap();
    assert_eq!(yaml.bytes, expected);
    let restored=convert_file(entry, Direction::YamlToXml, expected, &inputs).unwrap();
    assert_eq!(convert_file(entry, Direction::XmlToYaml, &restored.bytes, &inputs).unwrap().bytes, expected);
    assert!(validate_file(entry, expected, &inputs).is_empty());
    assert!(verify_candidate(entry, xml, b"Entries:\n  ru: CHANGED\n  en: two\n  ru: three", &inputs).is_err());
    assert!(convert_file(entry, Direction::XmlToYaml, b"<Root><Entries><item><key>ru</key><text>one</text><text>two</text></item></Entries></Root>", &inputs).is_err());
    assert!(validate_file(entry, b"Entries: {ru: {nested: x}}", &inputs).iter().any(|error| error.severity == Severity::Error));
    let single=convert_file(entry, Direction::XmlToYaml, b"<Root><Entries><item><key>ru</key><text>Hello</text></item></Entries></Root>", &inputs).unwrap();
    assert_eq!(single.bytes, b"Entries: Hello");
    let decoded=convert_file(entry, Direction::YamlToXml, b"Entries: Hello", &inputs).unwrap();
    assert_eq!(convert_file(entry, Direction::XmlToYaml, &decoded.bytes, &inputs).unwrap().bytes, b"Entries: Hello");
    let errors=validate_file(entry, b"Entries:\n  ru: bad", &inputs);
    assert_eq!(errors[0].code.as_deref(), Some("text.forbidden"));
    assert_eq!(errors[0].path, ["Entries", "ru"]);
    assert_eq!(errors[0].message, "Forbidden: bad");
    assert_eq!((errors[0].line, errors[0].column), (2, 3));
    assert_eq!(convert_file(entry, Direction::XmlToYaml, b"<Root><Entries><item><key>ru</key><text>bad</text></item></Entries></Root>", &inputs).unwrap().bytes, b"Entries:\n  !xml/invalid ru: bad");
    assert!(validate_file(entry, b"Entries:\n  !xml/invalid ru: bad", &inputs).is_empty());
    assert!(validate_file(entry, b"Entries:\n  !xml/invalid ru: good", &inputs).iter().any(|error| error.code.as_deref()==Some("xml/anomaly-tag-unnecessary")));
    assert!(validate_file(entry, b"Entries: !xml/invalid\n  ru: bad", &inputs).iter().any(|error| error.code.as_deref()==Some("text.forbidden")));
    let errors=validate_file(entry, b"Entries:\n  ru: good\n  en: good\n  ru: bad\n  ru: bad", &inputs);
    assert_eq!(errors.iter().filter(|error| error.code.as_deref()==Some("text.forbidden")).map(|error| error.occurrence.unwrap().get()).collect::<Vec<_>>(), [2, 3]);
    let sorted=entry_id("test.sorted-dictionary").unwrap();
    for (yaml, valid) in [("Entries: {ru: first, en: second}", true), ("Entries: {en: first, ru: second}", false), ("Entries: {ru: first, !xml/invalid ru: second}", true), ("Entries: {ru: first, en: second, !xml/invalid ru: third}", true), ("Entries: {en: first, ru: second, !xml/invalid en: third}", false), ("Entries: {𐀀: first, : second}", true), ("Entries: {: first, 𐀀: second}", false)] {
        let diagnostics=validate_file(sorted, yaml.as_bytes(), &inputs);
        assert_eq!(diagnostics.is_empty(), valid, "{yaml}: {diagnostics:?}");
        if !valid { assert_eq!(diagnostics[0].path, ["Entries"]); }
    }
    assert!(validate_file(entry, b"Entries: mapping-only", &inputs).is_empty());
    assert_eq!(validate_file(entry, b"Entries: {ru: mapping-only}", &inputs)[0].code.as_deref(), Some("collection.mapping-only"));
    let absent=convert_file(entry, Direction::XmlToYaml, b"<Root/>", &inputs).unwrap();
    assert_eq!(absent.bytes, b"");
    assert!(validate_file(entry, b"", &inputs).is_empty());
    assert!(validate_file(entry, b"{}", &inputs).is_empty());
    assert!(verify_candidate(entry, b"<Root/>", b"Entries: {}", &inputs).is_err());
    let derived=entry_id("test.derived-dictionary").unwrap();
    for (xml, yaml) in [("<Root/>", "Entries: {}"), ("<Root><Entries/></Root>", "Entries: \"\""), ("<Root><Entries><item><key>ru</key><text>Default</text></item></Entries></Root>", "") ] {
        assert_eq!(convert_file(derived, Direction::XmlToYaml, xml.as_bytes(), &inputs).unwrap().bytes, yaml.as_bytes());
        assert!(verify_candidate(derived, xml.as_bytes(), yaml.as_bytes(), &inputs).is_ok());
    }
    assert_eq!(convert_file(derived, Direction::XmlToYaml, b"<Root><Entries><item><key>ru</key><text/></item></Entries></Root>", &inputs).unwrap().bytes, b"Entries:\n  ru: \"\"");
    let normalized=entry_id("test.normalized-dictionary").unwrap();
    let preserved=convert_file(normalized, Direction::XmlToYaml, b"<Root><Entries/></Root>", &inputs).unwrap();
    verify_candidate(normalized, b"<Root><Entries/></Root>", &preserved.bytes, &inputs).unwrap();
    assert_eq!(convert_file(normalized, Direction::XmlToYaml, b"<Root><Entries><item><key>ru</key><text/></item></Entries></Root>", &inputs).unwrap().bytes, b"Entries: \"\"");
    let canonical=entry_id("test.canonical-dictionary").unwrap();
    assert_eq!(convert_file(canonical, Direction::YamlToXml, b"Entries: \"\"", &inputs).unwrap().bytes, "\u{feff}<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<Root></Root>".as_bytes());
    let both=convert_file(canonical, Direction::YamlToXml, b"Entries:\n  ru: \"\"\n  !xml/invalid ru: second", &inputs).unwrap();
    let both=String::from_utf8(both.bytes).unwrap();
    assert_eq!(both.matches("<item>").count(), 2);
    assert!(both.contains("second"));
    let patterned=entry_id("test.patterned-dictionary").unwrap();
    for (xml, expected) in [("<Root><Entries><item><key>ru</key><text>Default</text></item><item><key>en</key><text>Other</text></item></Entries></Root>", "Entries:\n  en: Other"), ("<Root><Entries><item><key>en</key><text>Other</text></item></Entries></Root>", "Entries:\n  ru: \"\"\n  en: Other")] {
        let result=convert_file(patterned, Direction::XmlToYaml, xml.as_bytes(), &inputs).unwrap();
        assert_eq!(result.bytes, expected.as_bytes());
        assert!(verify_candidate(patterned, xml.as_bytes(), expected.as_bytes(), &inputs).is_ok());
    }
    let duplicate=b"Entries:\n  ru: Default\n  en: Other\n  !xml/invalid ru: Second";
    let xml=convert_file(patterned, Direction::YamlToXml, duplicate, &inputs).unwrap();
    assert_eq!(convert_file(patterned, Direction::XmlToYaml, &xml.bytes, &inputs).unwrap().bytes, duplicate);
    let named=entry_id("test.named-dictionary").unwrap();
    let named_inputs=read_inputs(named, b"ownerName: TestTest").unwrap();
    let xml=b"<Root><Entries><item><key>ru</key><text>Test test</text></item><item><key>en</key><text>Other</text></item></Entries></Root>";
    assert_eq!(convert_file(named, Direction::XmlToYaml, xml, &named_inputs).unwrap().bytes, b"Entries:\n  en: Other");
    for source in ["{}", "ownerName: '!!!'"] {
        let inputs=read_inputs(named, source.as_bytes()).unwrap();
        let foreign=b"<Root><Entries><item><key>en</key><text>Other</text></item></Entries></Root>";
        assert_eq!(convert_file(named, Direction::XmlToYaml, foreign, &inputs).unwrap().bytes, b"Entries:\n  ru: \"\"\n  en: Other");
    }
    let typed=entry_id("test.typed-dictionary").unwrap();
    let typed_xml=b"<Root xmlns:a=\"urn:attr\" xmlns:b=\"urn:value\"><Entries a:type=\"b:Kind\"><item><key>ru</key><text>Hello</text></item></Entries></Root>";
    assert_eq!(convert_file(typed, Direction::XmlToYaml, typed_xml, &inputs).unwrap().bytes, b"Entries: Hello");
    assert!(verify_candidate(typed, typed_xml, b"Entries: Hello", &inputs).is_ok());
    let untyped_xml=b"<Root><Entries><item><key>ru</key><text>Hello</text></item></Entries></Root>";
    let preserved=convert_file(typed, Direction::XmlToYaml, untyped_xml, &inputs).unwrap();
    verify_candidate(typed, untyped_xml, &preserved.bytes, &inputs).unwrap();
    let untyped=entry_id("test.untyped-dictionary").unwrap();
    assert_eq!(convert_file(untyped, Direction::XmlToYaml, untyped_xml, &inputs).unwrap().bytes, b"Entries: Hello");
    let nil=entry_id("test.nil-dictionary").unwrap();
    let nil_xml=b"<Root xmlns:s=\"http://www.w3.org/2001/XMLSchema-instance\"><Entries s:nil=\"true\"/></Root>";
    assert_eq!(convert_file(nil, Direction::XmlToYaml, nil_xml, &inputs).unwrap().bytes, b"");
    assert!(verify_candidate(nil, nil_xml, b"{}", &inputs).is_ok());
    let invalid_nil=b"<Root xmlns:s=\"http://www.w3.org/2001/XMLSchema-instance\"><Entries s:nil=\"true\"><item><key>ru</key><text>text</text></item></Entries></Root>";
    assert_eq!(convert_file(nil, Direction::XmlToYaml, invalid_nil, &inputs).unwrap_err()[0].code.as_deref(), Some("xml.nil-content"));
    let empty=convert_file(entry, Direction::XmlToYaml, b"<Root><Entries/></Root>", &inputs).unwrap();
    assert_eq!(empty.bytes, b"Entries: {}");
}"#).unwrap();
    let main = fs::read_to_string(root.join("src/main.rs")).unwrap();
    let main = main.replacen("fn main() {", "fn main() { independent_corpus();", 1);
    fs::write(root.join("src/main.rs"), main + &corpus_checks()).unwrap();
    for args in [
        vec!["+1.98.1", "run", "--offline", "--quiet"],
        vec![
            "+1.98.1",
            "clippy",
            "--offline",
            "--quiet",
            "--",
            "-D",
            "warnings",
        ],
    ] {
        let output = Command::new("cargo")
            .args(args)
            .current_dir(&root)
            .output()
            .unwrap();
        assert!(
            output.status.success(),
            "{}: {}",
            root.display(),
            String::from_utf8_lossy(&output.stderr)
        );
    }
    fs::remove_dir_all(root).unwrap();
}

fn corpus_checks() -> String {
    use serde_json::Value;
    let repository = std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join("../../..");
    let manifest: Value = serde_json::from_slice(
        &fs::read(repository.join("tests/conversion-corpus/manifest.json")).unwrap(),
    )
    .unwrap();
    let mut code = String::from("\nfn independent_corpus() {\n");
    let mut count = 0;
    for case in manifest["cases"].as_array().unwrap() {
        if case["group"] != "i8n-text" {
            continue;
        }
        let context: Value = serde_json::from_slice(
            &fs::read(repository.join(case["context"].as_str().unwrap())).unwrap(),
        )
        .unwrap();
        if context["entry"] != "migration.i8n-text-probe" {
            continue;
        }
        assert_eq!(context["defaultLanguage"], "ru");
        assert_eq!(
            context["registeredLanguages"],
            serde_json::json!(["ru", "en"])
        );
        assert_eq!(
            context["xmlFragmentNamespaces"],
            serde_json::json!({"v8":"http://v8.1c.ru/8.1/data/core"})
        );
        let parameters = [
            "preserveEmptyXML",
            "excludeIfEqualNameYAML",
            "skipEmptyToXML",
            "typedXML",
        ];
        let profile = parameters
            .iter()
            .enumerate()
            .fold(0, |profile, (bit, key)| {
                profile
                    | (usize::from(context["parameters"][key].as_bool().unwrap_or(false)) << bit)
            });
        let mut xml =
            fs::read_to_string(repository.join(case["inputs"]["xml"]["path"].as_str().unwrap()))
                .unwrap();
        if xml.starts_with("<Title") {
            xml = format!("<Root>{xml}</Root>");
        }
        assert!(xml.starts_with("<Root>"));
        xml = xml.replacen(
            "<Root>",
            "<Root xmlns:v8=\"http://v8.1c.ru/8.1/data/core\">",
            1,
        );
        let yaml =
            fs::read_to_string(repository.join(case["expectations"]["yaml"].as_str().unwrap()))
                .unwrap();
        let name = context["name"].as_str().unwrap_or("");
        let input = format!(
            "languages: [ru, en]\nname: {}",
            serde_json::to_string(name).unwrap()
        );
        let id = case["id"].as_str().unwrap();
        code.push_str(&format!(r#"{{
            let entry=entry_id("test.corpus-{profile}").unwrap();
            let inputs=read_inputs(entry, {input:?}.as_bytes()).unwrap();
            let xml={xml:?}.as_bytes(); let expected={yaml:?}.as_bytes();
            let result=convert_file(entry, Direction::XmlToYaml, xml, &inputs).unwrap_or_else(|error| panic!("{{}}: {{error:?}}", {id:?}));
            assert_eq!(String::from_utf8(result.bytes.clone()).unwrap(), std::str::from_utf8(expected).unwrap(), "{{}}", {id:?});
            assert!(validate_file(entry, expected, &inputs).is_empty(), "{{}}", {id:?});
            verify_candidate(entry, xml, expected, &inputs).unwrap();
            verify_candidate(entry, xml, &result.bytes, &inputs).unwrap();
        }}
"#));
        count += 1;
    }
    assert_eq!(
        count, 12,
        "Independent I8nText coverage changed; review the cases"
    );
    code.push_str("}\n");
    code
}
