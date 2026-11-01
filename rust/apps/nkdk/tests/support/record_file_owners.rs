use super::{component_fixture, xml_comparison, yaml_comparison};
use nkdk_compiled_rules::{Direction, entry_id};
use xml_comparison::normalized_xml;
use yaml_comparison::{canonical_state_nulls, equivalent_yaml, expected_missing_changed_resource};

use component_fixture::convert_component;

#[test]
fn registered_file_owners_round_trip_real_cf_and_cfe_and_create_new_owners() {
    let routes = std::env::var("NKDK_RECORD_FILE_ROUTES")
        .map(|path| std::fs::read_to_string(path).unwrap())
        .unwrap_or_else(|_| {
            include_str!("../../../../../rust/operations/record-file-owners.routes.generated.yaml")
                .to_owned()
        });
    let catalog = nkdk::route::Catalog::parse(&routes).unwrap();
    for (
        entry,
        xml_dir,
        yaml_dir,
        xml_file,
        yaml_file,
        cf_count,
        cfe_count,
        new_yaml,
        new_value,
        properties_file,
    ) in [
        (
            "metadata.xdto-package",
            "XDTOPackages",
            "ПакетXDTO",
            "Ext/Package.bin",
            "Package.bin",
            2,
            4,
            "ПространствоИмен: urn://new\n",
            ">urn://new</",
            Some("Свойства.yaml"),
        ),
        (
            "metadata.websocket-client",
            "WebSocketClients",
            "WebSocketКлиент",
            "Ext/Module.bsl",
            "Модуль.bsl",
            2,
            2,
            "АдресСервера: wss://new\n",
            ">wss://new</",
            Some("Свойства.yaml"),
        ),
        (
            "metadata.language",
            "Languages",
            "Язык",
            "",
            "",
            2,
            2,
            "КодЯзыка: xx\n",
            ">xx</",
            None,
        ),
        (
            "metadata.style",
            "Styles",
            "Стиль",
            "Ext/Style.xml",
            "Style.xml",
            2,
            4,
            "Синоним: Новый стиль\n",
            ">Новый стиль</",
            Some("Свойства.yaml"),
        ),
        (
            "metadata.event-subscription",
            "EventSubscriptions",
            "ПодпискаНаСобытие",
            "",
            "",
            2,
            4,
            "Источник: Строка\nСобытие: НовоеСобытие\nОбработчик: НовыйОбработчик\n",
            ">НовоеСобытие</",
            None,
        ),
        (
            "metadata.session-parameter",
            "SessionParameters",
            "ПараметрСеанса",
            "",
            "",
            3,
            6,
            "Тип: Строка(10)\n",
            ">10</",
            None,
        ),
        (
            "metadata.functional-options-parameter",
            "FunctionalOptionsParameters",
            "ПараметрФункциональныхОпций",
            "",
            "",
            2,
            3,
            "Использование:\n  - Справочник.СправочникПолный\n",
            ">Catalog.СправочникПолный</",
            None,
        ),
        (
            "metadata.style-item",
            "StyleItems",
            "ЭлементСтиля",
            "",
            "",
            3,
            6,
            "Тип: Цвет\nЗначение:\n  Вид: Цвет\n  Значение: ЭлементСтиля.ЭлементСтиляЦвет\n",
            "{http://v8.1c.ru/8.1/data/ui/style}ЭлементСтиляЦвет",
            None,
        ),
        (
            "metadata.command-group",
            "CommandGroups",
            "ГруппаКоманд",
            "",
            "",
            2,
            4,
            "Представление: Картинка\n",
            ">Picture</",
            None,
        ),
        (
            "metadata.common-module",
            "CommonModules",
            "ОбщийМодуль",
            "Ext/Module.bsl",
            "Модуль.bsl",
            6,
            10,
            "Глобальный: Истина\n",
            ">true</",
            Some("Свойства.yaml"),
        ),
        (
            "metadata.bot",
            "Bots",
            "Бот",
            "Ext/Module.bsl",
            "Модуль.bsl",
            2,
            2,
            "Предопределенный: Ложь\n",
            ">false</",
            Some("Свойства.yaml"),
        ),
        (
            "metadata.role",
            "Roles",
            "Роль",
            "Ext/Rights.xml",
            "Rights.xml",
            3,
            3,
            "Синоним: Новая роль\n",
            ">Новая роль</",
            Some("Свойства.yaml"),
        ),
        (
            "metadata.common-template",
            "CommonTemplates",
            "ОбщийМакет",
            "Ext/Template.xml",
            "Template.xml",
            3,
            6,
            "Синоним: Новый макет\n",
            ">Новый макет</",
            Some("Свойства.yaml"),
        ),
    ] {
        if let Ok(selected) = std::env::var("NKDK_RECORD_FILE_ENTRIES")
            && !selected.split(',').any(|name| name == entry)
        {
            continue;
        }
        assert!(entry_id(entry).is_some());
        let repository = std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join("../../..");
        let temp = std::env::temp_dir().join(format!(
            "nkdk-production-files-{entry}-{}",
            std::process::id()
        ));
        let _ = std::fs::remove_dir_all(&temp);
        std::fs::create_dir_all(&temp).unwrap();
        let base = temp.join("cf-yaml");
        for (component, fixture, count) in [
            ("cf", "e2e/fixtures/xml/cf", cf_count),
            ("cfe", "e2e/fixtures/xml/cfe/all-extension", cfe_count),
        ] {
            let input = temp.join(format!("{component}-input"));
            let directory = input.join(xml_dir);
            std::fs::create_dir_all(&directory).unwrap();
            let mut names = Vec::new();
            for file in std::fs::read_dir(repository.join(fixture).join(xml_dir)).unwrap() {
                let file = file.unwrap();
                if file
                    .path()
                    .extension()
                    .is_none_or(|extension| extension != "xml")
                {
                    continue;
                }
                let name = file
                    .path()
                    .file_stem()
                    .unwrap()
                    .to_str()
                    .unwrap()
                    .to_owned();
                std::fs::copy(file.path(), directory.join(file.file_name())).unwrap();
                // Only a temporary copy changes spelling: the QName meaning
                // must survive an alias that differs from the declaration.
                if entry == "metadata.style-item"
                    && component == "cfe"
                    && name == "ЭлементСтиляШрифтВсеСвойства"
                {
                    let copied = directory.join(file.file_name());
                    let xml = std::fs::read_to_string(&copied)
                        .unwrap()
                        .replace("xmlns:style=", "xmlns:alternateStyle=")
                        .replace("ref=\"style:TextFont\"", "ref=\"alternateStyle:TextFont\"");
                    std::fs::write(copied, xml).unwrap();
                }
                if !xml_file.is_empty() {
                    let resource = directory.join(&name).join(xml_file);
                    if matches!(
                        entry,
                        "metadata.common-module"
                            | "metadata.bot"
                            | "metadata.role"
                            | "metadata.common-template"
                    ) {
                        let original = repository
                            .join(fixture)
                            .join(xml_dir)
                            .join(&name)
                            .join(xml_file);
                        if original.exists() {
                            std::fs::create_dir_all(resource.parent().unwrap()).unwrap();
                            std::fs::copy(original, resource).unwrap();
                        }
                    } else {
                        std::fs::create_dir_all(resource.parent().unwrap()).unwrap();
                        std::fs::write(resource, b"same").unwrap();
                    }
                }
                names.push(name);
            }
            assert_eq!(names.len(), count);
            let yaml = temp.join(format!("{component}-yaml"));
            let run = |direction, source: &std::path::Path, target: &std::path::Path| {
                convert_component(
                    &catalog,
                    component,
                    direction,
                    source,
                    target,
                    (component == "cfe").then_some(base.as_path()),
                    &temp,
                )
                .unwrap_or_else(|errors| panic!("{entry} {component} {direction:?}: {errors:?}"))
            };
            let imported = run(Direction::XmlToYaml, &input, &yaml);
            assert_eq!(imported.outputs.len(), count);
            for path in &imported.outputs {
                let document = std::fs::read_to_string(yaml.join(path)).unwrap();
                let fixture_root = if component == "cf" {
                    "e2e/fixtures/nkdk/cf"
                } else {
                    "e2e/fixtures/nkdk/cfe/Расширение_All"
                };
                let independent_yaml =
                    std::fs::read_to_string(repository.join(fixture_root).join(path));
                // Derive the expected missing-resource anomaly from the XML
                // fixture and actual file absence, independently of conversion.
                let resource_property = std::path::Path::new(xml_file)
                    .file_stem()
                    .and_then(|name| name.to_str())
                    .unwrap_or("");
                let missing_changed_resource = component == "cfe"
                    && !resource_property.is_empty()
                    && !yaml.join(path.parent().unwrap()).join(yaml_file).exists()
                    && {
                        let name = path
                            .parent()
                            .unwrap()
                            .file_name()
                            .unwrap()
                            .to_str()
                            .unwrap();
                        let source =
                            std::fs::read_to_string(directory.join(format!("{name}.xml"))).unwrap();
                        source.contains(&format!("<xr:Property>{resource_property}</xr:Property>"))
                            && source.contains("<xr:State>Extended</xr:State>")
                    };
                assert_eq!(
                    document.contains("!xml/invalid"),
                    missing_changed_resource,
                    "{path:?}: {document}; diagnostics: {:?}",
                    imported.diagnostics
                );
                let raw = nkdk_conversion_core::raw::Document::decode(document.as_bytes()).unwrap();
                let meaning = raw.as_ref().map_or(document.as_str(), |raw| {
                    std::str::from_utf8(&raw.meaning).unwrap()
                });
                let semantic_yaml =
                    yaml_rust2::YamlLoader::load_from_str(if meaning.trim().is_empty() {
                        "{}"
                    } else {
                        meaning
                    })
                    .unwrap();
                if matches!(
                    entry,
                    "metadata.event-subscription"
                        | "metadata.session-parameter"
                        | "metadata.functional-options-parameter"
                        | "metadata.command-group"
                        | "metadata.common-module"
                        | "metadata.bot"
                        | "metadata.role"
                        | "metadata.common-template"
                ) {
                    let mut expected = independent_yaml.unwrap();
                    if missing_changed_resource {
                        let name = path
                            .parent()
                            .unwrap()
                            .file_name()
                            .unwrap()
                            .to_str()
                            .unwrap();
                        expected = expected_missing_changed_resource(
                            &expected,
                            &directory.join(format!("{name}.xml")),
                            xml_file,
                            resource_property,
                            &base.join(path.parent().unwrap()).join(yaml_file),
                        );
                    }
                    let parse = |source: &str| {
                        let source = canonical_state_nulls(source);
                        yaml_rust2::YamlLoader::load_from_str(if source.trim().is_empty() {
                            "{}"
                        } else {
                            &source
                        })
                        .unwrap()
                    };
                    let expected = parse(&expected);
                    let actual = parse(meaning);
                    assert!(
                        equivalent_yaml(&expected[0], &actual[0]),
                        "{entry} {component} {path:?}: expected {expected:?}, actual {actual:?}"
                    );
                }
                if entry == "metadata.style-item"
                    && component == "cfe"
                    && path.file_stem().unwrap() == "ЭлементСтиляШрифтВсеСвойства"
                {
                    assert_eq!(
                        semantic_yaml[0]["Тип"],
                        yaml_rust2::Yaml::Null,
                        "{document}"
                    );
                    assert_eq!(
                        semantic_yaml[0]["Значение"]["Значение"]["Вид"].as_str(),
                        Some("ШрифтТекста"),
                        "{document}"
                    );
                }
                if entry == "metadata.event-subscription" && component == "cfe" {
                    if path.file_stem().unwrap() == "ПодпискаНаСобытиеВсеСвойства"
                    {
                        assert_eq!(
                            semantic_yaml[0]["Источник"],
                            yaml_rust2::Yaml::Array(Vec::new()),
                            "{document}"
                        );
                    } else if path.file_stem().unwrap() == "ПодпискаНаСобытиеПоУмолчанию"
                    {
                        assert_eq!(
                            semantic_yaml[0]["Источник"],
                            yaml_rust2::Yaml::BadValue,
                            "{document}"
                        );
                    }
                }
            }
            // No original XML is available to the reverse conversion.
            let expected = names
                .iter()
                .map(|name| std::fs::read_to_string(directory.join(format!("{name}.xml"))).unwrap())
                .collect::<Vec<_>>();
            std::fs::remove_dir_all(&input).unwrap();
            let rebuilt = temp.join(format!("{component}-rebuilt"));
            assert_eq!(
                run(Direction::YamlToXml, &yaml, &rebuilt).outputs.len(),
                count
            );
            for (name, expected) in names.iter().zip(expected) {
                let actual =
                    std::fs::read_to_string(rebuilt.join(xml_dir).join(format!("{name}.xml")))
                        .unwrap();
                assert_eq!(
                    normalized_xml(&expected),
                    normalized_xml(&actual),
                    "{component} {name}"
                );
                if !xml_file.is_empty() {
                    let restored = rebuilt.join(xml_dir).join(name).join(xml_file);
                    if matches!(
                        entry,
                        "metadata.common-module"
                            | "metadata.bot"
                            | "metadata.role"
                            | "metadata.common-template"
                    ) {
                        let original = repository
                            .join(fixture)
                            .join(xml_dir)
                            .join(name)
                            .join(xml_file);
                        assert_eq!(restored.exists(), original.exists());
                        if original.exists() {
                            assert_eq!(
                                std::fs::read(restored).unwrap(),
                                std::fs::read(original).unwrap()
                            );
                        }
                    } else {
                        assert_eq!(std::fs::read(restored).unwrap(), b"same");
                    }
                }
            }
            if component == "cf" {
                let new = if properties_file.is_some() {
                    yaml.join(yaml_dir).join("Новый")
                } else {
                    yaml.join(yaml_dir)
                };
                std::fs::create_dir_all(&new).unwrap();
                std::fs::write(new.join(properties_file.unwrap_or("Новый.yaml")), new_yaml)
                    .unwrap();
                if !yaml_file.is_empty() {
                    std::fs::write(new.join(yaml_file), b"new").unwrap();
                }
                let first = temp.join("new-first");
                let second = temp.join("new-second");
                for destination in [&first, &second] {
                    assert_eq!(
                        run(Direction::YamlToXml, &yaml, destination).outputs.len(),
                        count + 1
                    );
                }
                let path = format!("{xml_dir}/Новый.xml");
                let first_xml = std::fs::read_to_string(first.join(&path)).unwrap();
                let second_xml = std::fs::read_to_string(second.join(&path)).unwrap();
                assert_eq!(normalized_xml(&first_xml), normalized_xml(&second_xml));
                assert!(first_xml.contains(">Новый</"));
                assert!(
                    first_xml.contains(new_value)
                        || normalized_xml(&first_xml)
                            .iter()
                            .any(|token| token.contains(new_value))
                );
            }
        }
        std::fs::remove_dir_all(temp).unwrap();
    }
}
