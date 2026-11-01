use std::{
    io::Write,
    process::{Command, Stdio},
};

pub fn fixtures(repository: &std::path::Path) -> Vec<serde_json::Value> {
    let mut child = Command::new("python3")
        .arg("tools/rules-migration/src/project-fixtures.py")
        .current_dir(repository)
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .spawn()
        .unwrap();
    let whole_request = |name: &str, extension: bool| {
        let (xml, yaml) = if extension {
            (
                "e2e/fixtures/xml/cfe/all-extension/Catalogs/СправочникПолный.xml",
                "e2e/fixtures/nkdk/cfe/Расширение_All/Справочник/СправочникПолный/Свойства.yaml",
            )
        } else {
            (
                "e2e/fixtures/xml/cf/Catalogs/СправочникПолный.xml",
                "e2e/fixtures/nkdk/cf/Справочник/СправочникПолный/Свойства.yaml",
            )
        };
        serde_json::json!({"xml":xml,"yaml":yaml,"xmlItems":[{"type":"Attribute","name":name}],
            "yamlPath":["Реквизиты",name],"wholeItem":true,"ownerContext":true})
    };
    let mut requests: Vec<_> = [
        "СтроковыйРеквизитСИндексом",
        "РеквизитСправочника",
        "Реквизит1",
        "Реквизит2",
    ]
    .into_iter()
    .map(|name| whole_request(name, false))
    .collect();
    for name in ["СтроковыйРеквизитСИндексом", "РеквизитСправочника"]
    {
        let whole = whole_request(name, true);
        let mut selected = whole.clone();
        selected.as_object_mut().unwrap().remove("wholeItem");
        selected.as_object_mut().unwrap().remove("ownerContext");
        selected["ownerFields"] = serde_json::json!({
            "propertyStates":["Type","ExtendedConfigurationObject"],
            "properties":[{"xml":"Type","yaml":"Тип"},{"xml":"ExtendedConfigurationObject"}],
        });
        requests.extend([whole, selected]);
    }
    for name in ["Реквизит1", "Реквизит2"] {
        requests.push(whole_request(name, true));
    }
    child
        .stdin
        .take()
        .unwrap()
        .write_all(&serde_json::to_vec(&requests).unwrap())
        .unwrap();
    let output = child.wait_with_output().unwrap();
    assert!(output.status.success());
    let raw: Vec<serde_json::Value> = serde_json::from_slice(&output.stdout).unwrap();
    let mut fixtures = raw[..4].to_vec();
    let (pairs, remainder) = raw[4..8].as_chunks::<2>();
    assert!(remainder.is_empty());
    for (pair_index, pair) in pairs.iter().enumerate() {
        let mut whole = pair[0].clone();
        whole["component"] = "cfe".into();
        if pair_index == 0 {
            fixtures.extend(plain_property_cases(&whole));
        }
        fixtures.push(whole);
        let mut case = pair[0].clone();
        case["xml"] = pair[1]["xml"].clone();
        case["yaml"] = pair[1]["yaml"].clone();
        case["entry"] = "test.borrowed-record-context".into();
        case["component"] = "cfe".into();
        fixtures.push(case.clone());
        if fixtures
            .iter()
            .filter(|row| row["generatedInput"] == true)
            .count()
            == 0
        {
            for (tag, mode) in [("!изменять", "Extended"), ("!проверять", "Notify")]
            {
                for value in ["Text", "\n  ru: Текст\n  en: Text", "\"\""] {
                    let mut generated = case.clone();
                    generated["generatedInput"] = true.into();
                    generated["expectedFormatState"] = mode.into();
                    generated["xml"] = "".into();
                    generated["yaml"] = format!(
                        "{}\nФормат: {tag} {value}",
                        generated["yaml"].as_str().unwrap()
                    )
                    .into();
                    generated["ownerContext"]["history"]
                        .as_array_mut()
                        .unwrap()
                        .push(serde_json::json!({"Property":"Format","State":mode}));
                    fixtures.push(generated);
                }
            }
        }
    }
    for whole in &raw[8..] {
        let mut case = whole.clone();
        case["component"] = "cfe".into();
        fixtures.push(case);
    }
    fixtures
}

// Derived inputs retain the real borrowed record and its Type state. Expectations
// follow the old plain-property contract: missing differs from explicit empty;
// neither spelling adds a PropertyState. Never rewrite the fixture on disk.
fn plain_property_cases(base: &serde_json::Value) -> Vec<serde_json::Value> {
    let mut result = Vec::new();
    for (xml_name, yaml_name, before) in [
        ("Synonym", "Синоним", "<ns0:Comment"),
        ("EditFormat", "ФорматРедактирования", "<ns0:ToolTip"),
        ("ToolTip", "Подсказка", "</ns0:Properties>"),
        ("ChoiceForm", "ФормаВыбора", "</ns0:Properties>"),
    ] {
        let xml = base["xml"].as_str().unwrap();
        let yaml = base["yaml"].as_str().unwrap();
        let empty_element = format!("<ns0:{xml_name} />");
        let absent_xml = xml.replace(&empty_element, "");
        let absent_yaml = yaml
            .lines()
            .filter(|line| !line.starts_with(&format!("{yaml_name}:")))
            .collect::<Vec<_>>()
            .join("\n");
        for present in [false, true] {
            let mut case = base.clone();
            case["expectedNoState"] = xml_name.into();
            case["xml"] = if present {
                assert!(absent_xml.contains(before));
                absent_xml.replacen(before, &format!("{empty_element}{before}"), 1)
            } else {
                absent_xml.clone()
            }
            .into();
            case["yaml"] = if present {
                format!("{absent_yaml}\n{yaml_name}: \"\"")
            } else {
                absent_yaml.clone()
            }
            .into();
            result.push(case);
        }
    }
    result
}
