use nkdk_rule_compiler::{SourceFile, compile_exporting, link, parse_many};
use std::{fs, path::Path, process::Command};

mod support;

#[path = "../../../build-support/declarations.rs"]
mod declarations;
#[path = "../../../build-support/family.rs"]
mod family;

struct Cleanup(std::path::PathBuf);
impl Drop for Cleanup {
    fn drop(&mut self) {
        let _ = fs::remove_dir_all(&self.0);
    }
}

fn run_generated_crate(directory: &Path) -> std::process::Output {
    Command::new("cargo")
        .args(["+1.98.1", "run", "--offline", "--quiet"])
        .env("CARGO_PROFILE_DEV_DEBUG", "0")
        .env("CARGO_INCREMENTAL", "0")
        .env("RUST_BACKTRACE", "1")
        .current_dir(directory)
        .output()
        .unwrap()
}

#[test]
fn settings_parameter_collection_and_its_real_profiles_compile_together() {
    run_with_compiler_stack(
        settings_parameter_collection_and_its_real_profiles_compile_together_inner,
    );
}

fn run_with_compiler_stack(test: fn()) {
    std::thread::Builder::new()
        .stack_size(16 * 1024 * 1024)
        .spawn(test)
        .unwrap()
        .join()
        .unwrap();
}

fn settings_parameter_collection_and_its_real_profiles_compile_together_inner() {
    let root = Path::new(env!("CARGO_MANIFEST_DIR")).join("../..");
    let sources = declarations::load(&root, &root.join("declarations")).unwrap();
    let selected = family::select(
        &sources,
        &["migration.dcs-settings-parameter-value-collection"],
    );
    let selected = selected
        .iter()
        .map(|(path, bytes)| SourceFile { path, bytes })
        .collect::<Vec<_>>();
    let modules = selected
        .iter()
        .flat_map(|source| {
            parse_many(SourceFile {
                path: source.path,
                bytes: source.bytes,
            })
            .unwrap()
        })
        .collect::<Vec<_>>();
    let owner_id = link(&modules)
        .unwrap()
        .entries
        .iter()
        .find(|entry| entry.name == "migration.dcs-settings-parameter-value-collection")
        .unwrap()
        .id;
    let generated = compile_exporting(&selected, |module| {
        module.id == "migration.dcs-settings-parameter-value-collection"
    })
    .unwrap();
    assert!(generated.definition_count >= 1);
    assert!(!generated.files.is_empty());
    let rust = String::from_utf8(generated.files[0].contents.clone()).unwrap();
    assert!(rust.contains("with_row_key_"));
    let temp = support::generated_crate_root("dcs-parameter-collection");
    let core = support::conversion_core_path();
    fs::write(temp.join("Cargo.toml"), format!("[package]\nname=\"dcs-parameter-collection\"\nversion=\"0.0.0\"\nedition=\"2024\"\n[dependencies]\nnkdk-conversion-core={{path={core:?}}}\n[workspace]\n")).unwrap();
    for file in generated.files {
        fs::write(temp.join("src").join(file.path), file.contents).unwrap();
    }
    let main = r##"#![allow(warnings)]
include!("generated.rs");
fn main() {
    use std::sync::Arc;
    use nkdk_conversion_core::facts::{Generation,text::TextBudget,prepared::{FactBudget,FactId,TextFactsBuilder,TextIndexInput,text_scalar_index,text_record_index}};
    let generation=Generation(1);
    let mut builder=TextFactsBuilder::with_indexes(generation,vec![text_scalar_index(generation),text_scalar_index(generation),text_record_index(generation,["code","name"]),text_record_index(generation,["label","name"])],FactBudget{text:TextBudget{entries:32,bytes:1024},rows:32});
    builder.push(FactId(0),"СвязьПоТипу","TypeLink").unwrap();
    let facts=Arc::new(builder.finish());
    let index=|slot|InputValue::TextIndex(TextIndexInput::new(facts.clone(),generation,FactId(slot)));
    let inputs=prepare_inputs(EntryId(OWNER),vec![("profiles".into(),index(0)),("defaultProfile".into(),InputValue::Text("Field".into())),("styleTypes".into(),index(1)),("defaultLanguage".into(),InputValue::Text("ru".into())),("registeredLanguages".into(),InputValue::Sequence(vec![InputValue::Text("ru".into())])),("labels".into(),index(2)),("codes".into(),index(3))]).unwrap();
    let xml=r#"<dcsset:dataParameters xmlns:dcsset="http://v8.1c.ru/8.1/data-composition-system/settings" xmlns:dcscor="http://v8.1c.ru/8.1/data-composition-system/core" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dcscor:item xsi:type="dcsset:SettingsParameterValue"><dcscor:parameter>Параметр1</dcscor:parameter><dcscor:value xsi:type="dcscor:Field">ПараметрыДанных.Параметр1</dcscor:value></dcscor:item><dcscor:item xsi:type="dcsset:SettingsParameterValue"><dcscor:parameter>СвязьПоТипу</dcscor:parameter><dcscor:value xsi:type="dcscor:TypeLink"><dcscor:field>Поле1</dcscor:field><dcscor:linkItem>2</dcscor:linkItem></dcscor:value></dcscor:item></dcsset:dataParameters>"#.as_bytes();
    let yaml=convert_file(EntryId(OWNER),Direction::XmlToYaml,xml,&inputs).unwrap().bytes;
    let text=std::str::from_utf8(&yaml).unwrap();
    assert!(text.contains("Параметр1"),"{text}");
    assert!(text.contains("Значение: Поле1(2)"),"{text}");
    assert!(!text.contains("!xml"),"{text}");
    let restored=convert_file(EntryId(OWNER),Direction::YamlToXml,&yaml,&inputs).unwrap().bytes;
    assert!(std::str::from_utf8(&restored).unwrap().contains("Параметр1"));
    let malformed=std::str::from_utf8(xml).unwrap().replace("<dcscor:linkItem>2</dcscor:linkItem>","<dcscor:linkItem>oops</dcscor:linkItem>");
    let preserved=convert_file(EntryId(OWNER),Direction::XmlToYaml,malformed.as_bytes(),&inputs).unwrap().bytes;
    let preserved_text=std::str::from_utf8(&preserved).unwrap();
    assert!(preserved_text.contains("Параметр1"),"{preserved_text}");
    assert!(preserved_text.contains("!xml/"),"{preserved_text}");
    let restored=convert_file(EntryId(OWNER),Direction::YamlToXml,&preserved,&inputs).unwrap().bytes;
    assert!(std::str::from_utf8(&restored).unwrap().contains("oops"));
    let reordered=std::str::from_utf8(xml).unwrap().replace("<dcscor:parameter>Параметр1</dcscor:parameter><dcscor:value xsi:type=\"dcscor:Field\">ПараметрыДанных.Параметр1</dcscor:value>","<dcscor:value xsi:type=\"dcscor:Field\">ПараметрыДанных.Параметр1</dcscor:value><dcscor:parameter>Параметр1</dcscor:parameter>");
    let preserved=convert_file(EntryId(OWNER),Direction::XmlToYaml,reordered.as_bytes(),&inputs).unwrap().bytes;
    let restored=convert_file(EntryId(OWNER),Direction::YamlToXml,&preserved,&inputs).unwrap().bytes;
    assert!(std::str::from_utf8(&restored).unwrap().contains("ПараметрыДанных.Параметр1"));
    let unknown=std::str::from_utf8(xml).unwrap().replace("Параметр1","НеизвестныйПараметр");
    let unknown_yaml=convert_file(EntryId(OWNER),Direction::XmlToYaml,unknown.as_bytes(),&inputs).unwrap().bytes;
    let unknown_text=std::str::from_utf8(&unknown_yaml).unwrap();
    assert!(unknown_text.contains("НеизвестныйПараметр"),"{unknown_text}");
    assert!(!unknown_text.contains("!xml/"),"{unknown_text}");
    let empty=b"<dcsset:dataParameters xmlns:dcsset=\"http://v8.1c.ru/8.1/data-composition-system/settings\" xmlns:dcscor=\"http://v8.1c.ru/8.1/data-composition-system/core\"/>";
    let empty_yaml=convert_file(EntryId(OWNER),Direction::XmlToYaml,empty,&inputs).unwrap().bytes;
    let empty_text=std::str::from_utf8(&empty_yaml).unwrap();
    assert!(empty_text.contains("ПараметрыДанных: {}"),"{empty_text}");
    let empty_restored=convert_file(EntryId(OWNER),Direction::YamlToXml,&empty_yaml,&inputs).unwrap().bytes;
    assert!(std::str::from_utf8(&empty_restored).unwrap().contains("dataParameters"));
    let source=std::str::from_utf8(xml).unwrap();
    let first_start=source.find("<dcscor:item").unwrap();
    let first_end=first_start+source[first_start..].find("</dcscor:item>").unwrap()+"</dcscor:item>".len();
    let duplicate=source.replace("</dcsset:dataParameters>",&format!("{}</dcsset:dataParameters>",&source[first_start..first_end]));
    let duplicate_yaml=convert_file(EntryId(OWNER),Direction::XmlToYaml,duplicate.as_bytes(),&inputs).unwrap().bytes;
    let duplicate_text=std::str::from_utf8(&duplicate_yaml).unwrap();
    assert!(duplicate_text.contains("!xml/"),"{duplicate_text}");
    let duplicate_restored=convert_file(EntryId(OWNER),Direction::YamlToXml,&duplicate_yaml,&inputs).unwrap().bytes;
    let duplicate_restored=std::str::from_utf8(&duplicate_restored).unwrap();
    assert_eq!(duplicate_restored.matches(">Параметр1</").count(),2,"{duplicate_restored}");
}"##.replace("OWNER", &owner_id.to_string());
    fs::write(temp.join("src/main.rs"), main).unwrap();
    let result = run_generated_crate(&temp);
    fs::remove_dir_all(&temp).unwrap();
    let stderr = String::from_utf8_lossy(&result.stderr);
    let start = stderr.find("thread 'main'").unwrap_or(0);
    let errors = stderr[start..].chars().take(6000).collect::<String>();
    assert!(result.status.success(), "{errors}");
}

#[test]
fn migrated_parameter_profile_table_reads_e2e_xml() {
    run_with_compiler_stack(migrated_parameter_profile_table_reads_e2e_xml_inner);
}

fn migrated_parameter_profile_table_reads_e2e_xml_inner() {
    let temp = support::generated_crate_root("dcs-parameter-e2e");
    let _cleanup = Cleanup(temp.clone());
    let cases = [
        ProfileCase {
            marker: "СвязьПоТипу",
            xml_path: "[dcssch:inputParameters]",
            yaml_key: "ПараметрыРедактирования",
            start_tag: "<dcssch:inputParameters>",
            end_tag: "</dcssch:inputParameters>",
            yaml_values: &[
                "СвязьПоТипу",
                "ВыборГруппИЭлементов",
                "СвязиПараметровВыбора",
                "ПараметрыВыбора",
                "ПараметрВыбора",
            ],
            xml_values: &[
                "FoldersAndItemsUse",
                "TypeLink",
                "ChoiceParameterLinks",
                "ChoiceParameters",
            ],
            check_invalid_link: true,
            occurrence: 0,
            check_nil: false,
            settings_xsi: false,
        },
        ProfileCase {
            marker: "default: Field",
            xml_path: "[ListSettings, dcsset:dataParameters]",
            yaml_key: "ПараметрыДанных",
            start_tag: "<dcsset:dataParameters>",
            end_tag: "</dcsset:dataParameters>",
            yaml_values: &["Параметр1"],
            xml_values: &["SettingsParameterValue"],
            check_invalid_link: false,
            occurrence: 0,
            check_nil: true,
            settings_xsi: true,
        },
        ProfileCase {
            marker: "default: Field",
            xml_path: "[ListSettings, dcsset:dataParameters]",
            yaml_key: "ПараметрыДанных",
            start_tag: "<dcsset:dataParameters>",
            end_tag: "</dcsset:dataParameters>",
            yaml_values: &["Параметр1", "ПараметрыДанных.Параметр1"],
            xml_values: &["SettingsParameterValue", "ПараметрыДанных.Параметр1"],
            check_invalid_link: false,
            occurrence: 1,
            check_nil: false,
            settings_xsi: true,
        },
    ];
    run_migrated_profile_e2e(&temp, &cases[..1]);
    run_migrated_profile_e2e(&temp, &cases[1..]);
}

#[derive(Clone, Copy)]
struct ProfileCase<'a> {
    marker: &'a str,
    xml_path: &'a str,
    yaml_key: &'a str,
    start_tag: &'a str,
    end_tag: &'a str,
    yaml_values: &'a [&'a str],
    xml_values: &'a [&'a str],
    check_invalid_link: bool,
    occurrence: usize,
    check_nil: bool,
    settings_xsi: bool,
}

fn run_migrated_profile_e2e(temp: &Path, cases: &[ProfileCase<'_>]) {
    let case = &cases[0];
    let ProfileCase {
        marker,
        xml_path,
        yaml_key,
        ..
    } = *case;
    assert!(cases.iter().all(|case| case.marker == marker
        && case.xml_path == xml_path
        && case.yaml_key == yaml_key));
    let root = Path::new(env!("CARGO_MANIFEST_DIR")).join("../..");
    let candidate_dir = root.join("../tests/migration/rules-candidates");
    let candidate = fs::read_dir(candidate_dir)
        .unwrap()
        .filter_map(Result::ok)
        .find_map(|file| {
            let name = file.file_name().to_string_lossy().into_owned();
            if !name.starts_with("candidate.dcs-settings-parameter-value-collection.")
                || !name.ends_with(".yaml")
            {
                return None;
            }
            let bytes = fs::read(file.path()).ok()?;
            let source = String::from_utf8_lossy(&bytes);
            source.contains(marker).then_some((name, bytes))
        })
        .expect("migration must emit the DCS parameter table");
    let candidate_module = nkdk_rule_compiler::parse(SourceFile {
        path: &candidate.0,
        bytes: &candidate.1,
    })
    .unwrap();
    let owner = format!(
        "format: nkdk-declarations/1\nkind: object\nid: migration.dcs-parameter-e2e\nimports: {{parameters: {}}}\ninputs:\n  styleTypes: {{type: {{kind: index, key: {{kind: scalar, scalar: text}}, value: {{kind: scalar, scalar: text}}}}}}\n  defaultLanguage: {{type: {{kind: scalar, scalar: text}}}}\n  registeredLanguages: {{type: {{kind: sequence, item: {{kind: scalar, scalar: text}}}}}}\n  labels: {{type: {{kind: index, key: {{kind: record, fields: [{{name: name, type: {{kind: scalar, scalar: text}}}}, {{name: code, type: {{kind: scalar, scalar: text}}}}]}}, value: {{kind: scalar, scalar: text}}}}}}\n  codes: {{type: {{kind: index, key: {{kind: record, fields: [{{name: name, type: {{kind: scalar, scalar: text}}}}, {{name: label, type: {{kind: scalar, scalar: text}}}}]}}, value: {{kind: scalar, scalar: text}}}}}}\nvalue: {{kind: record, fields: [{{name: parameters, type: {{use: parameters, bind: {{styleTypes: {{input: styleTypes}}, defaultLanguage: {{input: defaultLanguage}}, registeredLanguages: {{input: registeredLanguages}}, labels: {{input: labels}}, codes: {{input: codes}}}}}}}}]}}\nrepresentations:\n  xml: {{kind: record, fields: [{{field: parameters, path: {xml_path}}}]}}\n  yaml: {{kind: mapping, fields: [{{field: parameters, key: {yaml_key}}}]}}\nnamespaces: {{dcssch: http://v8.1c.ru/8.1/data-composition-system/schema, dcsset: http://v8.1c.ru/8.1/data-composition-system/settings}}\n",
        candidate_module.id
    );
    let mut sources = declarations::load(&root, &root.join("declarations")).unwrap();
    sources.push((
        format!("declarations/probes/{}.yaml", candidate_module.id),
        candidate.1,
    ));
    sources.push((
        "declarations/probes/dcs-parameter-e2e.yaml".into(),
        owner.into_bytes(),
    ));
    let selected = family::select(&sources, &["migration.dcs-parameter-e2e"]);
    let files = selected
        .iter()
        .map(|(path, bytes)| SourceFile { path, bytes })
        .collect::<Vec<_>>();
    let owner_id = link(
        &files
            .iter()
            .flat_map(|source| {
                parse_many(SourceFile {
                    path: source.path,
                    bytes: source.bytes,
                })
                .unwrap()
            })
            .collect::<Vec<_>>(),
    )
    .unwrap()
    .entries
    .iter()
    .find(|entry| entry.name == "migration.dcs-parameter-e2e")
    .unwrap()
    .id;
    let generated =
        compile_exporting(&files, |module| module.id == "migration.dcs-parameter-e2e").unwrap();
    let core = support::conversion_core_path();
    fs::write(temp.join("Cargo.toml"),format!("[package]\nname=\"dcs-parameter-e2e\"\nversion=\"0.0.0\"\nedition=\"2024\"\n[dependencies]\nnkdk-conversion-core={{path={core:?}}}\n[workspace]\n")).unwrap();
    for file in generated.files {
        fs::write(temp.join("src").join(file.path), file.contents).unwrap();
    }
    let fixture = fs::read_to_string(
        root.join("../e2e/fixtures/xml/cf/CommonForms/ДинамическийСписок/Ext/Form.xml"),
    )
    .unwrap();
    let namespace_attributes = "xmlns:dcssch=\"http://v8.1c.ru/8.1/data-composition-system/schema\" xmlns:dcscor=\"http://v8.1c.ru/8.1/data-composition-system/core\" xmlns:dcsset=\"http://v8.1c.ru/8.1/data-composition-system/settings\" xmlns:ent=\"http://v8.1c.ru/8.1/data/enterprise\" xmlns:xs=\"http://www.w3.org/2001/XMLSchema\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\"";
    let case_blocks = cases.iter().enumerate().map(|(index, case)| {
        let start = fixture.match_indices(case.start_tag).nth(case.occurrence).map(|(offset, _)| offset).unwrap();
        let end = start + fixture[start..].find(case.end_tag).unwrap() + case.end_tag.len();
        let fragment = &fixture[start..end];
        let xml = if xml_path.starts_with("[ListSettings") {
            format!("<ListSettings {namespace_attributes}>{fragment}</ListSettings>")
        } else {
            fragment.replacen(case.start_tag, &format!("{} {namespace_attributes}>", &case.start_tag[..case.start_tag.len() - 1]), 1)
        };
        fs::write(temp.join(format!("fixture{index}.xml")), xml).unwrap();
        r##"{
 let source=include_bytes!("FIXTURE");
 let yaml=convert_file(EntryId(OWNER),Direction::XmlToYaml,source,&inputs).unwrap().bytes;
 let text=String::from_utf8_lossy(&yaml);
 for expected in YAML_VALUES {assert!(text.contains(expected),"{expected}: {text}");}
 assert!(!text.contains("!xml/"),"{text}");
 if CHECK_NIL {assert!(text.contains("Значение: null"),"{text}");}
 let xml=convert_file(EntryId(OWNER),Direction::YamlToXml,&yaml,&inputs).unwrap().bytes;
 let text=String::from_utf8_lossy(&xml);
 for expected in XML_VALUES {assert!(text.contains(expected),"{expected}: {text}");}
 assert_eq!(text.contains("SettingsParameterValue"),SETTINGS_XSI,"{text}");
 if CHECK_NIL {
  assert!(text.contains("nil=\"true\""),"{text}");
  let without_value=String::from_utf8_lossy(source).replace("<dcscor:value xsi:nil=\"true\"/>","");
  let absent=convert_file(EntryId(OWNER),Direction::XmlToYaml,without_value.as_bytes(),&inputs).unwrap().bytes;
  assert!(!String::from_utf8_lossy(&absent).contains("Значение: null"));
 }
 if CHECK_INVALID_LINK {
  let original=String::from_utf8_lossy(source);
  let malformed=original.replace("<dcscor:linkItem>2</dcscor:linkItem>","<dcscor:linkItem>oops</dcscor:linkItem>");
  assert_ne!(malformed,original);
  let annotated=convert_file(EntryId(OWNER),Direction::XmlToYaml,malformed.as_bytes(),&inputs).unwrap().bytes;
  let text=String::from_utf8_lossy(&annotated);
  assert!(text.contains("!xml/"),"{text}");
  assert!(text.contains("Маска"),"{text}");
  let restored=convert_file(EntryId(OWNER),Direction::YamlToXml,&annotated,&inputs).unwrap().bytes;
  assert!(String::from_utf8_lossy(&restored).contains("oops"));
 }
}"##
        .replace("FIXTURE", &format!("../fixture{index}.xml"))
        .replace("OWNER", &owner_id.to_string())
        .replace("YAML_VALUES", &format!("{:?}", case.yaml_values))
        .replace("XML_VALUES", &format!("{:?}", case.xml_values))
        .replace("CHECK_INVALID_LINK", &case.check_invalid_link.to_string())
        .replace("CHECK_NIL", &case.check_nil.to_string())
        .replace("SETTINGS_XSI", &case.settings_xsi.to_string())
    }).collect::<String>();
    let main=r##"#![allow(warnings)]
include!("generated.rs");
fn main() {
 use std::sync::Arc;
 use nkdk_conversion_core::facts::{Generation,text::TextBudget,prepared::{FactBudget,TextFactsBuilder,FactId,TextIndexInput,text_scalar_index,text_record_index}};
 let generation=Generation(1);
 let facts=Arc::new(TextFactsBuilder::with_indexes(generation,vec![text_scalar_index(generation),text_record_index(generation,["code","name"]),text_record_index(generation,["label","name"])],FactBudget{text:TextBudget{entries:16,bytes:1024},rows:16}).finish());
 let index=|slot|InputValue::TextIndex(TextIndexInput::new(facts.clone(),generation,FactId(slot)));
 let inputs=prepare_inputs(EntryId(OWNER),vec![("styleTypes".into(),index(0)),("defaultLanguage".into(),InputValue::Text("ru".into())),("registeredLanguages".into(),InputValue::Sequence(vec![InputValue::Text("ru".into())])),("labels".into(),index(1)),("codes".into(),index(2))]).unwrap();
 CASE_BLOCKS
}"##.replace("OWNER",&owner_id.to_string()).replace("CASE_BLOCKS",&case_blocks);
    fs::write(temp.join("src/main.rs"), main).unwrap();
    let result = run_generated_crate(temp);
    assert!(
        result.status.success(),
        "{}",
        String::from_utf8_lossy(&result.stderr)
    );
}
