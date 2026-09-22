use nkdk::resource_files::{load_documents, stage};
use nkdk_conversion_core::{
    Direction,
    resources::{Limits, Plan, RelativePath, Route},
};
use std::{fs, path::PathBuf};

const FILE_LIMITS: Limits = Limits {
    groups: 8,
    routes: 8,
    path_bytes: 4096,
};

struct Temp(PathBuf);
impl Drop for Temp {
    fn drop(&mut self) {
        let _ = fs::remove_dir_all(&self.0);
    }
}
#[test]
fn prepared_files_preserve_alternatives_and_do_not_publish_partial_output() {
    let root = Temp(std::env::temp_dir().join(format!("nkdk-resources-{}", std::process::id())));
    fs::create_dir(&root.0).unwrap();
    let source = root.0.join("source");
    let temp = root.0.join("staging");
    fs::create_dir(&source).unwrap();
    fs::create_dir(&temp).unwrap();
    let route = |a: &str, b: &str| {
        Route::new(
            RelativePath::new([a], 64).unwrap(),
            RelativePath::new([b], 64).unwrap(),
        )
    };
    let limits = Limits {
        groups: 16,
        routes: 32,
        path_bytes: 16384,
    };
    let mut plan = Plan::new(limits);
    plan.push(vec![route("a.bsl", "b.bsl"), route("a.bin", "b.bin")])
        .unwrap();
    let missing_root = stage(&plan, Direction::XmlToYaml, &root.0.join("missing"), &temp).unwrap();
    assert!(missing_root.files().is_empty());
    drop(missing_root);
    let empty = stage(&plan, Direction::XmlToYaml, &source, &temp).unwrap();
    assert!(empty.files().is_empty());
    drop(empty);
    fs::write(source.join("a.bsl"), b"").unwrap();
    fs::write(source.join("a.bin"), [0, 255, 42]).unwrap();
    let documents = load_documents(&[&["a.bin"], &["missing.xml"]], &source, limits, 3).unwrap();
    assert_eq!(documents.len(), 1);
    assert_eq!(documents[0].1, [0, 255, 42]);
    assert!(load_documents(&[&["a.bin"]], &source, limits, 2).is_err());
    let group = stage(&Plan::new(limits), Direction::XmlToYaml, &source, &temp)
        .unwrap()
        .with_documents(documents)
        .unwrap();
    assert_eq!(fs::read(group.root().join("a.bin")).unwrap(), [0, 255, 42]);
    let root_path = group.root().to_path_buf();
    assert!(
        group
            .with_documents(vec![(RelativePath::new(["a.bin"], 64).unwrap(), vec![1])])
            .is_err()
    );
    assert!(!root_path.exists());

    let snapshot = stage(&plan, Direction::XmlToYaml, &source, &temp).unwrap();
    assert_eq!(snapshot.files().len(), 2);
    assert_eq!(snapshot.diagnostics().len(), 1);
    assert!(fs::read(snapshot.files()[0].path()).unwrap().is_empty());
    assert_eq!(fs::read(snapshot.files()[1].path()).unwrap(), [0, 255, 42]);
    fs::write(source.join("a.bin"), b"changed").unwrap();
    assert_eq!(fs::read(snapshot.files()[1].path()).unwrap(), [0, 255, 42]);
    let reverse = stage(&plan, Direction::YamlToXml, snapshot.root(), &temp).unwrap();
    assert_eq!(
        fs::read(reverse.root().join("a.bin")).unwrap(),
        [0, 255, 42]
    );
    drop(reverse);
    drop(snapshot);
    assert_eq!(fs::read_dir(&temp).unwrap().count(), 0);
    plan.push(vec![route("a.bin", "b.bsl")]).unwrap();
    assert!(stage(&plan, Direction::XmlToYaml, &source, &temp).is_err());
    assert_eq!(fs::read_dir(&temp).unwrap().count(), 0);
    let mut repeated = Plan::new(limits);
    repeated.push(vec![route("a.bin", "b.bin")]).unwrap();
    repeated.push(vec![route("a.bin", "b.bin")]).unwrap();
    let shared = stage(&repeated, Direction::XmlToYaml, &source, &temp).unwrap();
    assert_eq!(shared.files().len(), 1);
    assert!(shared.diagnostics().is_empty());
    drop(shared);
    let mut failed_copy = Plan::new(limits);
    failed_copy.push(vec![route("a.bsl", "ok")]).unwrap();
    failed_copy
        .push(vec![Route::new(
            RelativePath::new(["a.bin"], 64).unwrap(),
            RelativePath::new(["x".repeat(300)], 512).unwrap(),
        )])
        .unwrap();
    assert!(stage(&failed_copy, Direction::XmlToYaml, &source, &temp).is_err());
    assert_eq!(fs::read_dir(&temp).unwrap().count(), 0);
    let fixtures = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../../../e2e/fixtures");
    let check = |entry_name: &str,
                 input_values,
                 xml_owner: &str,
                 yaml_owner: &str,
                 files: &[(&str, &str)],
                 count| {
        let entry = nkdk_compiled_rules_probes::entry_id(entry_name).unwrap();
        let inputs = nkdk_compiled_rules_probes::prepare_inputs(entry, input_values).unwrap();
        let requests =
            nkdk_compiled_rules_probes::resource_requests(entry, &inputs, limits).unwrap();
        assert!(
            nkdk_compiled_rules_probes::resource_requests(
                entry,
                &inputs,
                Limits {
                    groups: 0,
                    ..limits
                },
            )
            .is_err()
        );
        let xml_root = fixtures.join("xml/cf").join(xml_owner);
        let yaml_root = fixtures.join("nkdk/cf").join(yaml_owner);
        for (direction, source, expected_root, target_side) in [
            (Direction::XmlToYaml, &xml_root, &yaml_root, 1),
            (Direction::YamlToXml, &yaml_root, &xml_root, 0),
        ] {
            let declared_documents = nkdk_compiled_rules_probes::document_paths(entry).unwrap();
            let loaded_documents =
                load_documents(declared_documents, &xml_root, limits, 1_000_000).unwrap();
            assert_eq!(
                loaded_documents.len(),
                if declared_documents.is_empty() {
                    0
                } else {
                    ["Ext/Help.xml", "Ext/AdditionalIndexes.xml"]
                        .iter()
                        .filter(|path| xml_root.join(path).is_file())
                        .count()
                }
            );
            let actual = stage(&requests, direction, source, &temp).unwrap();
            assert_eq!(actual.files().len(), count, "{xml_owner}");
            assert!(actual.diagnostics().is_empty());
            let manifest = xml_root.join("Ext/Help.xml");
            if files.iter().any(|pair| pair.0 == "Ext/Help/ru.html") && manifest.is_file() {
                let directory = if target_side == 0 {
                    vec!["Ext", "Help"]
                } else {
                    vec!["Справка"]
                };
                let directory = RelativePath::new(directory, 4096).unwrap();
                let pages = actual.file_stems(&directory, ".html");
                assert_eq!(pages, ["ru"]);
                let entry =
                    nkdk_compiled_rules_probes::entry_id("migration.help-manifest").unwrap();
                let inputs = nkdk_compiled_rules_probes::prepare_inputs(
                    entry,
                    vec![(
                        "pages".into(),
                        nkdk_compiled_rules_probes::InputValue::Sequence(
                            pages
                                .into_iter()
                                .map(|page| {
                                    nkdk_compiled_rules_probes::InputValue::Text(page.into())
                                })
                                .collect(),
                        ),
                    )],
                )
                .unwrap();
                let original = fs::read(manifest).unwrap();
                let yaml = nkdk_compiled_rules_probes::convert_file(
                    entry,
                    Direction::XmlToYaml,
                    &original,
                    &inputs,
                )
                .unwrap();
                assert!(yaml.bytes.is_empty());
                nkdk_compiled_rules_probes::verify_candidate(
                    entry,
                    &original,
                    &yaml.bytes,
                    &inputs,
                )
                .unwrap();
            }
            for pair in files {
                let expected_file = if target_side == 0 { pair.0 } else { pair.1 };
                let expected = expected_root.join(expected_file);
                let staged = actual.root().join(expected_file);
                assert_eq!(staged.is_file(), expected.is_file());
                if expected.is_file() {
                    assert_eq!(fs::read(staged).unwrap(), fs::read(expected).unwrap());
                }
            }
        }
    };
    for (xml_owner, yaml_owner) in [
        (
            "Documents/ДокументВсеСвойства",
            "Документ/ДокументВсеСвойства",
        ),
        (
            "DocumentJournals/ЖурналДокументовВсеСвойства",
            "ЖурналДокументов/ЖурналДокументовВсеСвойства",
        ),
    ] {
        check(
            "migration.command-base-properties",
            vec![(
                "name".into(),
                nkdk_compiled_rules_probes::InputValue::Text("Команда1".into()),
            )],
            xml_owner,
            yaml_owner,
            &[(
                "Commands/Команда1/Ext/CommandModule.bsl",
                "Команды/Команда1.bsl",
            )],
            1,
        );
    }
    for (xml_owner, yaml_owner, count) in [
        (
            "Documents/ДокументВсеСвойства/Forms/ФормаВыбора",
            "Документ/ДокументВсеСвойства/Формы/ФормаВыбора",
            0,
        ),
        (
            "Documents/ДокументВсеСвойства/Forms/ФормаДокумента",
            "Документ/ДокументВсеСвойства/Формы/ФормаДокумента",
            1,
        ),
        (
            "Documents/ДокументВсеСвойства/Forms/ФормаДокументаВсеСвойства",
            "Документ/ДокументВсеСвойства/Формы/ФормаДокументаВсеСвойства",
            1,
        ),
        (
            "Documents/ДокументВсеСвойства/Forms/ФормаСписка",
            "Документ/ДокументВсеСвойства/Формы/ФормаСписка",
            0,
        ),
        (
            "Documents/ДокументКнопкаСПараметрами/Forms/ФормаДокумента",
            "Документ/ДокументКнопкаСПараметрами/Формы/ФормаДокумента",
            0,
        ),
        (
            "DocumentJournals/ЖурналДокументовВсеСвойства/Forms/ФормаСписка",
            "ЖурналДокументов/ЖурналДокументовВсеСвойства/Формы/ФормаСписка",
            1,
        ),
    ] {
        check(
            "migration.form-metadata-header",
            vec![],
            xml_owner,
            yaml_owner,
            &[("Ext/Form/Module.bsl", "Модуль.bsl")],
            count,
        );
    }
    for (kind, folder, names, module_files) in [
        (
            "document",
            "Документ",
            &[
                "ДокументБезНомера",
                "ДокументВсеСвойства",
                "ДокументДругойДляЖурнала",
                "ДокументКнопкаСПараметрами",
                "ДокументМаксимальнаяДлинаНомераСтрока",
                "ДокументМаксимальнаяДлинаНомераЧисло",
                "ДокументПоУмолчанию",
                "ДокументСНумератором",
            ][..],
            &[
                ("Ext/ObjectModule.bsl", "МодульОбъекта.bsl"),
                ("Ext/ManagerModule.bsl", "МодульМенеджера.bsl"),
            ][..],
        ),
        (
            "journal",
            "ЖурналДокументов",
            &[
                "ЖурналДокументов1",
                "ЖурналДокументовВсеСвойства",
                "ЖурналДокументовПоУмолчанию",
            ][..],
            &[("Ext/ManagerModule.bsl", "МодульМенеджера.bsl")][..],
        ),
    ] {
        for name in names {
            let xml_folder = if kind == "document" {
                "Documents"
            } else {
                "DocumentJournals"
            };
            let form_names: &[&str] = match *name {
                "ДокументВсеСвойства" => &[
                    "ФормаВыбора",
                    "ФормаДокумента",
                    "ФормаДокументаВсеСвойства",
                    "ФормаСписка",
                ],
                "ДокументКнопкаСПараметрами" => &["ФормаДокумента"],
                "ЖурналДокументовВсеСвойства" => &["ФормаСписка"],
                _ => &[],
            };
            let command_names: &[&str] = if name.ends_with("ВсеСвойства") {
                &["Команда1"]
            } else {
                &[]
            };
            let prepared_names = |names: &[&str]| {
                nkdk_compiled_rules_probes::InputValue::Sequence(
                    names
                        .iter()
                        .map(|name| nkdk_compiled_rules_probes::InputValue::Text((*name).into()))
                        .collect(),
                )
            };
            let mut files: Vec<(String, String)> = module_files
                .iter()
                .map(|(a, b)| ((*a).into(), (*b).into()))
                .collect();
            for form in form_names {
                files.push((
                    format!("Forms/{form}/Ext/Form/Module.bsl"),
                    format!("Формы/{form}/Модуль.bsl"),
                ));
            }
            for command in command_names {
                files.push((
                    format!("Commands/{command}/Ext/CommandModule.bsl"),
                    format!("Команды/{command}.bsl"),
                ));
            }
            let template_names: &[&str] = if name.ends_with("ВсеСвойства") {
                &["Макет"]
            } else {
                &[]
            };
            for template in template_names {
                files.push((
                    format!("Templates/{template}.xml"),
                    format!("Шаблоны/{template}/Template.xml"),
                ));
                for extension in ["txt", "bin"] {
                    files.push((
                        format!("Templates/{template}/Ext/Template.{extension}"),
                        format!("Шаблоны/{template}/Template.{extension}"),
                    ));
                }
            }
            files.push(("Ext/Help/ru.html".into(), "Справка/ru.html".into()));
            let files: Vec<_> = files
                .iter()
                .map(|(a, b)| (a.as_str(), b.as_str()))
                .collect();
            let count = match *name {
                "ДокументВсеСвойства" => 6,
                "ЖурналДокументовВсеСвойства" => 6,
                _ => 0,
            };
            check(
                &format!(
                    "migration.{kind}-{}",
                    if kind == "document" {
                        "resource-routes"
                    } else {
                        "identity-and-children"
                    }
                ),
                vec![
                    ("templates".into(), prepared_names(template_names)),
                    ("forms".into(), prepared_names(form_names)),
                    ("commandNames".into(), prepared_names(command_names)),
                ],
                &format!("{xml_folder}/{name}"),
                &format!("{folder}/{name}"),
                &files,
                count,
            );
        }
    }
    #[cfg(unix)]
    {
        std::os::unix::fs::symlink(&temp, source.join("outside")).unwrap();
        let mut escape = Plan::new(limits);
        escape
            .push(vec![Route::new(
                RelativePath::new(["outside", "missing"], 64).unwrap(),
                RelativePath::new(["out"], 64).unwrap(),
            )])
            .unwrap();
        assert!(stage(&escape, Direction::XmlToYaml, &source, &temp).is_err());
    }
}

#[test]
fn directory_remainder_preserves_unknown_files_without_duplicating_explicit_routes() {
    let root = Temp(std::env::temp_dir().join(format!("nkdk-remainder-{}", std::process::id())));
    let source = root.0.join("source");
    let temp = root.0.join("staging");
    for directory in [
        source.join("dir/Ext"),
        source.join("dir/empty"),
        source.join("dir/nested"),
        temp.clone(),
    ] {
        fs::create_dir_all(directory).unwrap();
    }
    let header = b"\xef\xbb\xbf<Original/>";
    fs::write(source.join("source.xml"), header).unwrap();
    fs::write(source.join("dir/Ext/body.bin"), [0, 255, 12]).unwrap();
    fs::write(source.join("dir/nested/unknown.data"), [42, 0, 1]).unwrap();
    let route = |a: &[&str], b: &[&str]| {
        Route::new(
            RelativePath::new(a, 4096).unwrap(),
            RelativePath::new(b, 4096).unwrap(),
        )
    };
    let limits = Limits {
        groups: 4,
        routes: 32,
        path_bytes: 4096,
    };
    let build = |limits| {
        let mut plan = Plan::new(limits);
        plan.push(vec![route(&["dir"], &["target"]).remainder()])
            .unwrap();
        plan.push(vec![route(&["source.xml"], &["target", "Header.xml"])])
            .unwrap();
        plan.push(vec![route(
            &["dir", "Ext", "body.bin"],
            &["target", "body.bin"],
        )])
        .unwrap();
        plan
    };
    let plan = build(limits);
    let snapshot = stage(&plan, Direction::XmlToYaml, &source, &temp).unwrap();
    assert_eq!(snapshot.files().len(), 3);
    assert!(snapshot.diagnostics().is_empty());
    assert_eq!(
        fs::read(snapshot.root().join("target/Header.xml")).unwrap(),
        header
    );
    assert_eq!(
        fs::read(snapshot.root().join("target/body.bin")).unwrap(),
        [0, 255, 12]
    );
    assert_eq!(
        fs::read(snapshot.root().join("target/nested/unknown.data")).unwrap(),
        [42, 0, 1]
    );
    let directory = RelativePath::new(["target"], 4096).unwrap();
    assert_eq!(snapshot.file_stems(&directory, ".xml"), ["Header"]);
    assert!(snapshot.file_stems(&directory, ".data").is_empty());
    assert_eq!(snapshot.file_stems(&directory, ".bin"), ["body"]);
    assert!(snapshot.root().join("target/empty").is_dir());
    assert!(!snapshot.root().join("target/Ext").exists());
    let reverse = stage(&plan, Direction::YamlToXml, snapshot.root(), &temp).unwrap();
    for file in ["source.xml", "dir/Ext/body.bin", "dir/nested/unknown.data"] {
        assert_eq!(
            fs::read(reverse.root().join(file)).unwrap(),
            fs::read(source.join(file)).unwrap()
        );
    }
    assert!(reverse.root().join("dir/empty").is_dir());
    drop(reverse);
    drop(snapshot);
    assert!(
        stage(
            &build(Limits {
                routes: 3,
                ..limits
            }),
            Direction::XmlToYaml,
            &source,
            &temp
        )
        .is_err()
    );
    fs::write(source.join("dir/Header.xml"), b"conflict").unwrap();
    assert!(stage(&plan, Direction::XmlToYaml, &source, &temp).is_err());
    assert_eq!(fs::read_dir(&temp).unwrap().count(), 0);
    #[cfg(unix)]
    {
        fs::remove_file(source.join("dir/Header.xml")).unwrap();
        fs::write(root.0.join("outside"), b"outside").unwrap();
        std::os::unix::fs::symlink(root.0.join("outside"), source.join("dir/link")).unwrap();
        let error = stage(&plan, Direction::XmlToYaml, &source, &temp).unwrap_err();
        assert_eq!(error.code.as_deref(), Some("resource.escape"));
        assert_eq!(fs::read_dir(&temp).unwrap().count(), 0);
    }
}

#[test]
fn group_conversion_keeps_external_documents_and_resources_together() {
    use nkdk::{conversion, conversion::Request};
    use nkdk_compiled_rules::{InputValue, entry_id, prepare_inputs};
    let root =
        Temp(std::env::temp_dir().join(format!("nkdk-document-group-{}", std::process::id())));
    let source = root.0.join("input");
    let temporary = root.0.join("temporary");
    fs::create_dir_all(source.join("Ext/Help/_files")).unwrap();
    fs::create_dir_all(&temporary).unwrap();
    fs::write(source.join("Ext/Help/ru.html"), b"<html>text</html>").unwrap();
    fs::write(source.join("Ext/Help/_files/data.bin"), [0, 255, 17]).unwrap();
    let entry = entry_id("migration.external-document").unwrap();
    let execute = |direction, primary: &[u8], source_root: &std::path::Path| {
        conversion::prepare(Request {
            entry,
            direction,
            primary,
            inputs: prepare_inputs(
                entry,
                vec![(
                    "pages".into(),
                    InputValue::Sequence(vec![InputValue::Text("ru".into())]),
                )],
            )
            .unwrap(),
            source_root,
            temporary_parent: &temporary,
            limits: Limits {
                groups: 8,
                routes: 64,
                path_bytes: 65536,
            },
            xml_bytes: 1_000_000,
        })
        .unwrap()
    };
    let fixture = include_bytes!(
        "../../../../e2e/fixtures/xml/cf/DocumentJournals/ЖурналДокументовВсеСвойства/Ext/Help.xml"
    )
    .as_slice();
    let empty = b"<Help xmlns=\"http://v8.1c.ru/8.3/xcf/extrnprops\" version=\"2.20\"/>".as_slice();
    for document in [Some(fixture), Some(empty), None] {
        let path = source.join("Ext/Help.xml");
        if let Some(bytes) = document {
            fs::write(&path, bytes).unwrap();
        } else {
            fs::remove_file(&path).unwrap();
        }
        let yaml = execute(
            Direction::XmlToYaml,
            b"<Root><Name>x</Name></Root>",
            &source,
        );
        assert_eq!(yaml.resources.files().len(), 2);
        let xml = execute(Direction::YamlToXml, &yaml.primary, yaml.resources.root());
        assert_eq!(
            xml.resources.root().join("Ext/Help.xml").is_file(),
            document.is_some()
        );
        assert_eq!(
            fs::read(xml.resources.root().join("Ext/Help/_files/data.bin")).unwrap(),
            [0, 255, 17]
        );
        let again = execute(Direction::XmlToYaml, &xml.primary, xml.resources.root());
        assert_eq!(again.primary, yaml.primary);
    }
    for owner in [
        "Reports/ОтчетВсеСвойства",
        "DataProcessors/ОбработкаВсеСвойства",
    ] {
        let owner_root = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .join("../../../e2e/fixtures/xml/cf")
            .join(owner);
        let imported = execute(
            Direction::XmlToYaml,
            b"<Root><Name>x</Name></Root>",
            &owner_root,
        );
        assert_eq!(
            std::str::from_utf8(&imported.primary).unwrap().trim(),
            "Имя: x"
        );
        let exported = execute(
            Direction::YamlToXml,
            &imported.primary,
            imported.resources.root(),
        );
        nkdk_conversion_core::proof::verify(
            &fs::read(owner_root.join("Ext/Help.xml")).unwrap(),
            &fs::read(exported.resources.root().join("Ext/Help.xml")).unwrap(),
            |_| false,
        )
        .unwrap();
        assert_eq!(
            fs::read(owner_root.join("Ext/Help/ru.html")).unwrap(),
            fs::read(exported.resources.root().join("Ext/Help/ru.html")).unwrap()
        );
        assert!(!exported.resources.root().join(owner).exists());
    }
}

#[test]
fn declared_external_files_preserve_e2e_bytes_and_absence() {
    use nkdk_compiled_rules_probes::{InputValue, entry_id, prepare_inputs, resource_requests};
    let root =
        Temp(std::env::temp_dir().join(format!("nkdk-external-file-{}", std::process::id())));
    fs::create_dir_all(&root.0).unwrap();
    let entry = entry_id("migration.external-file").unwrap();
    let fixtures = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../../../e2e/fixtures/xml");
    let paths = |parts: &[&str]| {
        InputValue::Sequence(
            parts
                .iter()
                .map(|part| InputValue::Text((*part).into()))
                .collect(),
        )
    };
    for (owner, source, target) in [
        (
            "cf",
            "StandaloneConfigurationContent.bin",
            "СодержимоеАвтономнойКонфигурации.bin",
        ),
        (
            "cfe/control",
            "StandaloneConfigurationContent.bin",
            "СодержимоеАвтономнойКонфигурации.bin",
        ),
        (
            "cf/XDTOPackages/ПакетXDTOВсеСвойства",
            "Package.bin",
            "Package.bin",
        ),
        (
            "cfe/all-extension/XDTOPackages/ПакетXDTOВсеСвойстваExt",
            "Package.bin",
            "Package.bin",
        ),
        (
            "cf",
            "MobileClientSignature.bin",
            "ПодписьМобильногоКлиента.bin",
        ),
    ] {
        let inputs = prepare_inputs(
            entry,
            vec![
                ("sourcePath".into(), paths(&["Ext", source])),
                ("targetPath".into(), paths(&[target])),
            ],
        )
        .unwrap();
        let plan = resource_requests(entry, &inputs, FILE_LIMITS).unwrap();
        assert_file_routes(
            &plan,
            &fixtures.join(owner),
            &root.0,
            &[(source, target, source != "MobileClientSignature.bin")],
        );
    }
    let prepare = |parts: &[&str]| {
        prepare_inputs(
            entry,
            vec![
                ("sourcePath".into(), paths(parts)),
                ("targetPath".into(), paths(&["empty.bin"])),
            ],
        )
        .unwrap()
    };
    let limits = Limits {
        groups: 8,
        routes: 8,
        path_bytes: 4096,
    };
    for invalid in [vec![], vec!["..", "outside"], vec!["a/b"]] {
        assert!(resource_requests(entry, &prepare(&invalid), limits).is_err());
    }
    let empty_source = root.0.join("empty-source");
    fs::create_dir_all(empty_source.join("nested/deeper")).unwrap();
    fs::write(empty_source.join("nested/deeper/empty.bin"), []).unwrap();
    let plan =
        resource_requests(entry, &prepare(&["nested", "deeper", "empty.bin"]), limits).unwrap();
    let imported = stage(&plan, Direction::XmlToYaml, &empty_source, &root.0).unwrap();
    assert_eq!(
        fs::read(imported.root().join("empty.bin")).unwrap(),
        Vec::<u8>::new()
    );
    let exported = stage(&plan, Direction::YamlToXml, imported.root(), &root.0).unwrap();
    assert!(exported.root().join("nested/deeper/empty.bin").is_file());
}

#[test]
fn owner_resource_entries_use_declared_routes_without_a_primary_document() {
    use nkdk_compiled_rules_probes::{
        convert_file, entry_id, prepare_inputs, resource_requests, validate_file, verify_candidate,
    };
    let temp = Temp(std::env::temp_dir().join(format!("nkdk-owner-files-{}", std::process::id())));
    fs::create_dir_all(&temp.0).unwrap();
    let fixtures = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../../../e2e/fixtures/xml");
    let configuration = [
        (
            "StandaloneConfigurationContent.bin",
            "СодержимоеАвтономнойКонфигурации.bin",
            true,
        ),
        (
            "MobileClientSignature.bin",
            "ПодписьМобильногоКлиента.bin",
            false,
        ),
    ];
    let package = [("Package.bin", "Package.bin", true)];
    for (declaration, owner, routes) in [
        (
            "configuration-external-files",
            "cf",
            configuration.as_slice(),
        ),
        (
            "configuration-extension-external-files",
            "cfe/control",
            &configuration[..1],
        ),
        (
            "xdto-package-external-files",
            "cf/XDTOPackages/ПакетXDTOВсеСвойства",
            package.as_slice(),
        ),
        (
            "xdto-package-external-files",
            "cfe/all-extension/XDTOPackages/ПакетXDTOВсеСвойстваExt",
            package.as_slice(),
        ),
    ] {
        let entry = entry_id(&format!("resources.{declaration}")).unwrap();
        let inputs = prepare_inputs(entry, vec![]).unwrap();
        let plan = resource_requests(entry, &inputs, FILE_LIMITS).unwrap();
        assert_file_routes(&plan, &fixtures.join(owner), &temp.0, routes);
        for direction in [Direction::XmlToYaml, Direction::YamlToXml] {
            let errors = convert_file(entry, direction, b"", &inputs).unwrap_err();
            assert_eq!(errors[0].code.as_deref(), Some("entry.resource-only"));
        }
        assert_eq!(
            validate_file(entry, b"", &inputs)[0].code.as_deref(),
            Some("entry.resource-only")
        );
        assert_eq!(
            verify_candidate(entry, b"", b"", &inputs).unwrap_err()[0]
                .code
                .as_deref(),
            Some("entry.resource-only")
        );
    }
}

fn assert_file_routes(
    plan: &Plan,
    source_root: &std::path::Path,
    temporary: &std::path::Path,
    routes: &[(&str, &str, bool)],
) {
    let imported = stage(plan, Direction::XmlToYaml, source_root, temporary).unwrap();
    let exported = stage(plan, Direction::YamlToXml, imported.root(), temporary).unwrap();
    for (source, target, present) in routes {
        let original = fs::read(source_root.join("Ext").join(source)).ok();
        assert_eq!(
            original.is_some(),
            *present,
            "{}/{source}",
            source_root.display()
        );
        assert_eq!(fs::read(imported.root().join(target)).ok(), original);
        assert_eq!(
            fs::read(exported.root().join("Ext").join(source)).ok(),
            original
        );
    }
    assert_eq!(
        imported.files().len(),
        routes.iter().filter(|(_, _, present)| *present).count()
    );
    assert_eq!(exported.files().len(), imported.files().len());
}

#[test]
fn static_module_entries_preserve_e2e_files_and_configuration_groups() {
    use nkdk_compiled_rules_probes::{entry_id, prepare_inputs, resource_requests};
    let temporary =
        Temp(std::env::temp_dir().join(format!("nkdk-module-e2e-{}", std::process::id())));
    fs::create_dir_all(&temporary.0).unwrap();
    let workspace = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../../..");
    let corpus: serde_json::Value = serde_json::from_str(include_str!(
        "../../../../tests/migration/module-resource-e2e.json"
    ))
    .unwrap();
    let mut files = 0;
    for case in corpus["cases"].as_array().unwrap() {
        let entry = entry_id(case["entry"].as_str().unwrap()).unwrap();
        let inputs = prepare_inputs(entry, vec![]).unwrap();
        let plan = resource_requests(entry, &inputs, FILE_LIMITS).unwrap();
        assert_eq!(plan.groups().len(), 1);
        assert_eq!(plan.groups()[0].len(), 2);
        let source = case["xml"].as_str().unwrap().strip_prefix("Ext/").unwrap();
        let target = case["yaml"].as_str().unwrap();
        let binary_source = format!("{}.bin", source.strip_suffix(".bsl").unwrap());
        let binary_target = format!("{}.bin", target.strip_suffix(".bsl").unwrap());
        for fixture in case["files"].as_array().unwrap() {
            assert!(workspace.join(fixture["file"].as_str().unwrap()).is_file());
            let root = workspace.join(fixture["root"].as_str().unwrap());
            let routes = [
                (source, target, root.join("Ext").join(source).is_file()),
                (
                    binary_source.as_str(),
                    binary_target.as_str(),
                    root.join("Ext").join(&binary_source).is_file(),
                ),
            ];
            assert_file_routes(&plan, &root, &temporary.0, &routes);
            files += 1;
        }
    }
    assert!(files > 0);
    let entry = entry_id("resources.configuration-modules").unwrap();
    let inputs = prepare_inputs(entry, vec![]).unwrap();
    let plan = resource_requests(entry, &inputs, FILE_LIMITS).unwrap();
    assert_eq!(plan.groups().len(), 4);
    assert!(plan.groups().iter().all(|group| group.len() == 2));
    let mut routes = Vec::new();
    for (source, target) in [
        ("ManagedApplicationModule", "МодульПриложения"),
        ("SessionModule", "МодульСеанса"),
        ("ExternalConnectionModule", "МодульВнешнегоСоединения"),
        ("OrdinaryApplicationModule", "МодульОбычногоПриложения"),
    ] {
        for extension in ["bsl", "bin"] {
            routes.push((
                format!("{source}.{extension}"),
                format!("{target}.{extension}"),
                extension == "bsl" && source != "OrdinaryApplicationModule",
            ));
        }
    }
    let borrowed: Vec<_> = routes
        .iter()
        .map(|(source, target, present)| (source.as_str(), target.as_str(), *present))
        .collect();
    for owner in ["cf", "cfe/control"] {
        assert_file_routes(
            &plan,
            &workspace.join("e2e/fixtures/xml").join(owner),
            &temporary.0,
            &borrowed,
        );
    }
}
