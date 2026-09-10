use nkdk_rule_compiler::{SourceFile, generate, link, parse};
use std::{fs, process::Command};

#[test]
fn generated_rust_executes_both_directions_and_uses_the_imported_table() {
    let common = include_str!("fixtures/common.yaml");
    let owner = "format: nkdk-declarations/1\nkind: object\nid: test.scalar-owner\nimports: {boolean: common.boolean}\nvalue:\n  kind: record\n  fields:\n    - name: server\n      type: {use: boolean}\n    - name: description\n      type: {kind: scalar, scalar: text}\nrepresentations:\n  xml:\n    kind: record\n    fields:\n      - {field: server, path: [Root, Server]}\n      - {field: description, path: [Root, Description]}\n  yaml:\n    kind: mapping\n    fields:\n      - {field: server, key: Сервер}\n      - {field: description, key: Описание}\n";
    let numeric_bound =
        include_str!("../../../../tests/declaration-corpus/valid/numeric-bound.yaml");
    let warning_bound = numeric_bound
        .replace("id: test.numeric-bound", "id: test.warning-bound")
        .replace("severity: error", "severity: warning");
    let decimal = include_str!("../../../../tests/declaration-corpus/valid/exact-decimal.yaml");
    let decimal_owner = "format: nkdk-declarations/1\nkind: object\nid: test.decimal-owner\nimports: {number: common.exact-decimal}\nvalue:\n  kind: record\n  fields:\n    - {name: amount, type: {use: number}}\nrepresentations:\n  xml:\n    kind: record\n    fields:\n      - {field: amount, path: [Root, Amount]}\n  yaml:\n    kind: mapping\n    fields:\n      - {field: amount, key: Сумма}\n";
    let typed_decimal = decimal.replace("common.exact-decimal", "common.typed-decimal").replace("representations:", "namespaces:\n  xsi: http://www.w3.org/2001/XMLSchema-instance\n  xs: http://www.w3.org/2001/XMLSchema\nrepresentations:").replace("xml: {kind: text}", "xml:\n    kind: with-attributes\n    attributes:\n      - {name: xsi:type, value: {qname: xs:decimal}}\n    content: {kind: text}");
    let typed_owner = decimal_owner
        .replace("test.decimal-owner", "test.typed-owner")
        .replace("common.exact-decimal", "common.typed-decimal");
    let default_number_owner = decimal_owner.replace("test.decimal-owner", "test.default-number")
        + "\npresence:\n  - target: {field: amount}\n    xml: {missing: {denotes: {literal: 0}}}\n    yaml:\n      missing: {denotes: {literal: 0}}\n      omitWhen: {eq: [{field: amount}, {literal: 0}]}\n";
    let calendar = "format: nkdk-declarations/1\nkind: value\nid: common.date-time\nvalue: {kind: scalar, scalar: text}\nrepresentations:\n  xml: {kind: calendar, format: iso, zone: written}\n  yaml: {kind: calendar, format: day-month-year, precision: minutes, zeroTime: omit}\n";
    let calendar_owner = decimal_owner
        .replace("test.decimal-owner", "test.calendar-owner")
        .replace("common.exact-decimal", "common.date-time");
    let name_common = "format: nkdk-declarations/1\nkind: value\nid: common.metadata-name\nvalue: {kind: scalar, scalar: text}\nrepresentations:\n  xml: {kind: text}\n  yaml: {kind: scalar, scalar: text}\nconstraints:\n  - id: name\n    appliesTo: [xml-import, yaml-validation]\n    assert: {matches: {value: {self: true}, pattern: '[A-Za-zА-Яа-яЁё_][A-Za-zА-Яа-яЁё0-9_]*'}}\n    diagnostic: {code: metadata-name.invalid, severity: error, at: {self: true}, message: Invalid name}\n";
    let short_name_common = name_common.split("constraints:").next().unwrap().replacen(
        "scalar: text}",
        "scalar: text, pattern: '[A-Za-zА-Яа-яЁё_][A-Za-zА-Яа-яЁё0-9_]*'}",
        1,
    );
    let name_owner = decimal_owner
        .replace("test.decimal-owner", "test.name-owner")
        .replace("common.exact-decimal", "common.metadata-name");
    let enumeration =
        include_str!("../../../../tests/declaration-corpus/valid/code-type-enum.yaml");
    let enum_owner = "format: nkdk-declarations/1\nkind: object\nid: test.enum-owner\nimports: {code: common.code-type}\nvalue:\n  kind: record\n  fields:\n    - {name: codeType, type: {use: code}}\nrepresentations:\n  xml:\n    kind: record\n    fields:\n      - {field: codeType, path: [Root, CodeType]}\n  yaml:\n    kind: mapping\n    fields:\n      - {field: codeType, key: ТипКода}\n";
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
    fs::write(root.join("Cargo.toml"), format!("[package]\nname = \"generated-contract\"\nversion = \"0.0.0\"\nedition = \"2024\"\n[dependencies]\nnkdk-conversion-core = {{ path = {:?}, features = [\"test-probes\"] }}\n[workspace]\n", core)).unwrap();
    for literal in ["Истина", "Да"] {
        let common = common.replace("Истина", literal);
        let optional = common.replace("common.boolean", "common.optional-boolean")
            + "\npresence:\n  - target: self\n    xml: {missing: {denotes: {absent: true}}}\n    yaml: {missing: {denotes: {absent: true}}}\n";
        let defaulted = common
            .replace("common.boolean", "common.default-boolean")
            .replace("      - {value: false, literal: Ложь}\n", "")
            + "\npresence:\n  - target: self\n    xml: {missing: {denotes: {literal: false}}}\n    yaml:\n      missing: {denotes: {literal: false}}\n      omitWhen: {not: {self: true}}\n";
        let default_owner = owner
            .replace("test.scalar-owner", "test.default-owner")
            .replace("common.boolean", "common.default-boolean");
        let optional_owner = owner
            .replace("test.scalar-owner", "test.optional-owner")
            .replace("common.boolean", "common.optional-boolean");
        let mut modules = [
            ("common.yaml", common.as_str()),
            (
                "name.yaml",
                if literal == "Истина" {
                    name_common
                } else {
                    short_name_common.as_str()
                },
            ),
            ("name-owner.yaml", name_owner.as_str()),
            ("calendar.yaml", calendar),
            ("calendar-owner.yaml", calendar_owner.as_str()),
            ("optional.yaml", optional.as_str()),
            ("default.yaml", defaulted.as_str()),
            ("default-owner.yaml", default_owner.as_str()),
            ("optional-owner.yaml", optional_owner.as_str()),
            ("owner.yaml", owner),
            ("enum.yaml", enumeration),
            ("enum-owner.yaml", enum_owner),
            ("decimal.yaml", decimal),
            ("default-number.yaml", default_number_owner.as_str()),
            ("typed-decimal.yaml", typed_decimal.as_str()),
            ("typed-owner.yaml", typed_owner.as_str()),
            ("decimal-owner.yaml", decimal_owner),
            ("numeric-bound.yaml", numeric_bound),
            ("warning-bound.yaml", warning_bound.as_str()),
        ]
        .map(|(path, source)| {
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
        assert_eq!(
            generated.dependencies,
            [
                "calendar-owner.yaml",
                "calendar.yaml",
                "common.yaml",
                "decimal-owner.yaml",
                "decimal.yaml",
                "default-number.yaml",
                "default-owner.yaml",
                "default.yaml",
                "enum-owner.yaml",
                "enum.yaml",
                "name-owner.yaml",
                "name.yaml",
                "numeric-bound.yaml",
                "optional-owner.yaml",
                "optional.yaml",
                "owner.yaml",
                "typed-decimal.yaml",
                "typed-owner.yaml",
                "warning-bound.yaml"
            ]
        );
        for file in generated.files {
            fs::write(root.join("src").join(file.path), file.contents).unwrap();
        }
        let main = r###"
include!("generated.rs");
fn main() {
    let typed = entry_id("test.typed-owner").unwrap();
    let input = br#"<Root xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xs="http://www.w3.org/2001/XMLSchema"><Amount xsi:type="xs:decimal">9007199254740993</Amount></Root>"#;
    let converted = convert_file(typed, Direction::XmlToYaml, input, &PreparedInputs::default()).unwrap();
    assert_eq!(converted.bytes, "Сумма: 9007199254740993".as_bytes());
    verify_candidate(typed,input,&converted.bytes,&PreparedInputs::default()).unwrap();
    for original in [
        String::from_utf8(input.to_vec()).unwrap().replace("9007199254740993", "1e3"),
        String::from_utf8(input.to_vec()).unwrap().replace("xsi:type=\"xs:decimal\"", "xsi:type=\"xs:integer\""),
        String::from_utf8(input.to_vec()).unwrap().replace(" xsi:type=\"xs:decimal\"", ""),
    ] {
        let converted=convert_file(typed,Direction::XmlToYaml,original.as_bytes(),&PreparedInputs::default()).unwrap();
        assert!(String::from_utf8_lossy(&converted.bytes).contains("!xml/raw"));
        verify_candidate(typed,original.as_bytes(),&converted.bytes,&PreparedInputs::default()).unwrap();
    }

    let named=entry_id("test.name-owner").unwrap();
    for (name,invalid) in [("ИмяЁ_123",false),("_A1",false),("1Имя",true),("Имя-с-дефисом",true),("Name\n",true),("",true)] {
        let original=format!("<Root><Amount>{name}</Amount></Root>");
        let converted=convert_file(named,Direction::XmlToYaml,original.as_bytes(),&PreparedInputs::default()).unwrap();
        assert_eq!(String::from_utf8_lossy(&converted.bytes).contains("!xml/invalid"),invalid);
        assert!(validate_file(named,&converted.bytes,&PreparedInputs::default()).is_empty());
        verify_candidate(named,original.as_bytes(),&converted.bytes,&PreparedInputs::default()).unwrap();
    }
    let calendar=entry_id("test.calendar-owner").unwrap();
    for (text,yaml) in [("2026-09-10T00:00:00","Сумма: 10.09.2026"),("2026-09-10T12:13:00","Сумма: 10.09.2026 12:13")] {
        let original=format!("<Root><Amount>{text}</Amount></Root>");
        let converted=convert_file(calendar,Direction::XmlToYaml,original.as_bytes(),&PreparedInputs::default()).unwrap();
        assert_eq!(converted.bytes,yaml.as_bytes());
        verify_candidate(calendar,original.as_bytes(),&converted.bytes,&PreparedInputs::default()).unwrap();
    }
    for text in ["2026-09-10T12:13:14+03:00","2026-09-10T12:13:00Z","2026-02-30T00:00:00"] {
        let original=format!("<Root><Amount>{text}</Amount></Root>");
        let converted=convert_file(calendar,Direction::XmlToYaml,original.as_bytes(),&PreparedInputs::default()).unwrap();
        let yaml=String::from_utf8_lossy(&converted.bytes);
        assert!(yaml.contains("!xml/raw"));
        if text.contains("12:13") {assert!(yaml.contains("10.09.2026 12:13"),"{yaml}");}
        verify_candidate(calendar,original.as_bytes(),&converted.bytes,&PreparedInputs::default()).unwrap();
    }
    let number_default=entry_id("test.default-number").unwrap();
    let zero=b"<Root><Amount>0</Amount></Root>";
    assert!(convert_file(number_default,Direction::XmlToYaml,zero,&PreparedInputs::default()).unwrap().bytes.is_empty());
    verify_candidate(number_default,zero,b"",&PreparedInputs::default()).unwrap();
    assert!(!validate_file(number_default,"Сумма: 0".as_bytes(),&PreparedInputs::default()).is_empty());
    let defaulted=entry_id("test.default-owner").unwrap();
    let normal=b"<Root><Server>false</Server><Description>text</Description></Root>";
    let converted=convert_file(defaulted,Direction::XmlToYaml,normal,&PreparedInputs::default()).unwrap();
    assert_eq!(converted.bytes,"Описание: text".as_bytes());
    verify_candidate(defaulted,normal,&converted.bytes,&PreparedInputs::default()).unwrap();
    for original in ["<Root><Description>text</Description></Root>","<Root><Server/><Description>text</Description></Root>","<Root><Server>wrong</Server><Description>text</Description></Root>"] {
        let converted=convert_file(defaulted,Direction::XmlToYaml,original.as_bytes(),&PreparedInputs::default()).unwrap();
        assert!(String::from_utf8_lossy(&converted.bytes).contains("!xml/raw"));
        verify_candidate(defaulted,original.as_bytes(),&converted.bytes,&PreparedInputs::default()).unwrap();
    }
    let warning = entry_id("test.warning-bound").unwrap();
    let warning_yaml = "ТипКода: Число\nДлинаКода: 51";
    let warnings = validate_file(warning, warning_yaml.as_bytes(), &PreparedInputs::default());
    assert_eq!(warnings.len(), 2);
    assert!(warnings.iter().all(|warning| warning.severity == core::Severity::Warning));
    assert_eq!(convert_file(warning, Direction::YamlToXml, warning_yaml.as_bytes(), &PreparedInputs::default()).unwrap().diagnostics, warnings);
    let bounded = entry_id("test.numeric-bound").unwrap();
    for (kind, xml_kind, length, errors) in [("Число", "Number", "38", 0), ("Число", "Number", "39", 1), ("Строка", "String", "50", 0), ("Строка", "String", "51", 1), ("Строка", "String", "-1", 1), ("Число", "Number", "0", 0), ("Число", "Number", "51", 2), ("Число", "Number", "38.000000000000000000000001", 1)] {
        let yaml = format!("ТипКода: {kind}\nДлинаКода: {length}");
        let xml = format!("\u{feff}<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<Root>\n\t<CodeType>{xml_kind}</CodeType>\n\t<CodeLength>{length}</CodeLength>\n</Root>");
        let inputs = PreparedInputs::default();
        let writes = core::xml::writer_count();
        let diagnostics = validate_file(bounded, yaml.as_bytes(), &inputs);
        assert_eq!(core::xml::writer_count(), writes, "validation must not write XML");
        assert_eq!(diagnostics.len(), errors, "{yaml}");
        if errors == 0 {
            assert_eq!(convert_file(bounded, Direction::YamlToXml, yaml.as_bytes(), &inputs).unwrap().bytes, xml.as_bytes());
            assert_eq!(convert_file(bounded, Direction::XmlToYaml, xml.as_bytes(), &inputs).unwrap().bytes, yaml.as_bytes());
        } else {
            assert!(diagnostics.iter().all(|error| error.path == ["ДлинаКода"]));
            assert_eq!(convert_file(bounded, Direction::YamlToXml, yaml.as_bytes(), &inputs).unwrap_err(), diagnostics);
            assert!(diagnostics.iter().all(|error| (error.line, error.column) == (2, 12)));
            let annotated = convert_file(bounded, Direction::XmlToYaml, xml.as_bytes(), &inputs).unwrap();
            let expected = format!("ТипКода: {kind}\nДлинаКода: !xml/invalid {length}");
            assert_eq!(annotated.bytes,expected.as_bytes());
            assert!(validate_file(bounded,&annotated.bytes,&inputs).is_empty());
            verify_candidate(bounded,xml.as_bytes(),&annotated.bytes,&inputs).unwrap();
        }
    }
    assert_eq!(validate_file(bounded, "ДлинаКода: 38".as_bytes(), &PreparedInputs::default())[0].code.as_deref(), Some("value.missing"));
    let decimal_entry = entry_id("test.decimal-owner").unwrap();
    for literal in ["9007199254740993", "0.12345678901234567890123456789012345678", "1e+1000000"] {
        let xml = format!("\u{feff}<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<Root>\n\t<Amount>{literal}</Amount>\n</Root>");
        let yaml = format!("Сумма: {literal}");
        let inputs = PreparedInputs::default();
        assert_eq!(convert_file(decimal_entry, Direction::XmlToYaml, xml.as_bytes(), &inputs).unwrap().bytes, yaml.as_bytes());
        assert_eq!(convert_file(decimal_entry, Direction::YamlToXml, yaml.as_bytes(), &inputs).unwrap().bytes, xml.as_bytes());
        assert!(validate_file(decimal_entry, yaml.as_bytes(), &inputs).is_empty());
    }
    for yaml in ["Сумма: \"42\"", "Сумма: .nan", "Сумма: 0x10", "Сумма: null"] {
        assert!(!validate_file(decimal_entry, yaml.as_bytes(), &PreparedInputs::default()).is_empty());
    }
    let enumeration = entry_id("test.enum-owner").unwrap();
    for (xml_value, yaml_value) in [("Number", "Число"), ("String", "Строка"), ("Auto", "Авто")] {
        let xml = format!("\u{feff}<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<Root>\n\t<CodeType>{xml_value}</CodeType>\n</Root>");
        let yaml = format!("ТипКода: {yaml_value}");
        let inputs = PreparedInputs::default();
        assert_eq!(convert_file(enumeration, Direction::XmlToYaml, xml.as_bytes(), &inputs).unwrap().bytes, yaml.as_bytes());
        assert_eq!(convert_file(enumeration, Direction::YamlToXml, yaml.as_bytes(), &inputs).unwrap().bytes, xml.as_bytes());
        assert!(validate_file(enumeration, yaml.as_bytes(), &inputs).is_empty());
    }
    let errors = validate_file(enumeration, "ТипКода: Неизвестно".as_bytes(), &PreparedInputs::default());
    assert_eq!(errors[0].path, ["ТипКода"]);
    let optional = entry_id("test.optional-owner").unwrap();
    for (xml, yaml) in [
        ("<Root><Description>x</Description></Root>", "Описание: x"),
        ("<Root><Server>false</Server><Description>x</Description></Root>", "Сервер: Ложь\nОписание: x"),
    ] {
        let result = convert_file(optional, Direction::XmlToYaml, xml.as_bytes(), &PreparedInputs::default()).unwrap();
        assert_eq!(result.bytes, yaml.as_bytes());
        assert!(validate_file(optional, yaml.as_bytes(), &PreparedInputs::default()).is_empty());
        verify_candidate(optional, xml.as_bytes(), yaml.as_bytes(), &PreparedInputs::default()).unwrap();
    }
    let empty = b"<Root><Server/><Description>x</Description></Root>";
    let annotated = convert_file(optional, Direction::XmlToYaml, empty, &PreparedInputs::default()).unwrap();
    verify_candidate(optional, empty, &annotated.bytes, &PreparedInputs::default()).unwrap();
    let entry = entry_id("test.scalar-owner").unwrap();
    let field_source = DECLARATION_FIELDS.iter().find(|field| field.entry == entry.0 && field.name == "server").unwrap();
    assert_eq!((field_source.value.file, field_source.value.line), ("owner.yaml", 8));
    assert_eq!((field_source.xml.file, field_source.xml.line), ("owner.yaml", 16));
    assert_eq!((field_source.yaml.file, field_source.yaml.line), ("owner.yaml", 21));
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
    assert_eq!((errors[0].line, errors[0].column), (1, 9));
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
    for bad in ["<Root><Server>true</Server><Unknown/></Root>", "<Root><Server>true</Server><Server>false</Server><Description>x</Description></Root>"] {
        assert!(convert_file(entry, Direction::XmlToYaml, bad.as_bytes(), &inputs).is_err(), "{bad}");
    }
    for bad in ["Сервер: LITERAL\nСервер: Ложь\nОписание: x", "Сервер: wrong\nОписание: x", "Сервер: LITERAL\nЛишнее: x", "Сервер: LITERAL\nОписание: !xml/raw x"] {
        assert!(!validate_file(entry, bad.as_bytes(), &inputs).is_empty(), "{bad}");
    }
}
"###.replace("LITERAL", literal);
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
