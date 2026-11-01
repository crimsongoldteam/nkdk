// Compile the actual application boundary against a selected AOT catalog.
extern crate self as nkdk;
extern crate self as nkdk_compiled_rules;
#[allow(unused_imports)]
use nkdk_conversion_core as core;
#[allow(warnings)]
mod generated {
    include!(concat!(env!("OUT_DIR"), "/generated.rs"));
}
pub use generated::*;
#[path = "../../../../rust/apps/nkdk/src/conversion.rs"]
pub mod conversion;
#[path = "../../../../rust/apps/nkdk/src/facts.rs"]
pub mod facts;
#[path = "../../../../rust/apps/nkdk/src/project.rs"]
pub mod project;
#[path = "../../../../rust/apps/nkdk/src/publication.rs"]
pub mod publication;
#[path = "../../../../rust/apps/nkdk/src/resource_files.rs"]
pub mod resource_files;
#[path = "../../../../rust/apps/nkdk/src/route.rs"]
pub mod route;
use nkdk_conversion_core::resources::{Limits, RelativePath};
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
#[path = "../../../../rust/apps/nkdk/tests/support/resource_names.rs"]
mod resource_names;

#[test]
fn registered_child_name_readers_preserve_real_xml_order_and_use_current_yaml_files() {
    let route = fs::read_to_string(std::env::var("NKDK_CHILD_NAME_ROUTE").unwrap()).unwrap();
    let catalog = route::Catalog::parse(&route).unwrap();
    let root =
        Temp(std::env::temp_dir().join(format!("nkdk-child-context-{}", std::process::id())));
    let fixture = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../../../e2e/fixtures");
    let source = fixture.join("xml/cf/SettingsStorages/ХранилищеНастроекВсеСвойства.xml");
    let xml = fs::read(source).unwrap();
    let context = route::Context {
        component: "cf",
        parent: "configuration",
        default_language: "ru",
        registered_languages: &["ru", "en"],
        compatibility_mode: "Version8_3_27",
    };
    let mut snapshots = catalog
        .capture_with_resources(
            std::path::Path::new("Inputs/example.xml"),
            &xml,
            &context,
            None,
        )
        .unwrap()
        .unwrap();
    let names = |snapshots: &[route::OwnedSnapshot], field: &str| {
        let snapshot = snapshots
            .iter()
            .find(|row| row.name.ends_with(field))
            .unwrap();
        let documents =
            yaml_rust2::YamlLoader::load_from_str(std::str::from_utf8(&snapshot.bytes).unwrap())
                .unwrap();
        documents[0][field]
            .as_vec()
            .unwrap()
            .iter()
            .map(|row| row.as_str().unwrap().to_owned())
            .collect::<Vec<_>>()
    };
    assert_eq!(
        names(&snapshots, "forms"),
        ["ФормаСохранения", "ФормаЗагрузки"]
    );
    assert_eq!(names(&snapshots, "templates"), ["Макет"]);
    let internal = |snapshots: &[route::OwnedSnapshot]| {
        let source = snapshots
            .iter()
            .find(|row| row.name.ends_with("internal-type-facts"))
            .unwrap();
        yaml_rust2::YamlLoader::load_from_str(std::str::from_utf8(&source.bytes).unwrap())
            .unwrap()
            .remove(0)
    };
    let imported_types = internal(&snapshots);
    let row = &imported_types["ВнутренниеТипы"][0];
    assert_eq!(
        row["Имя"].as_str(),
        Some("SettingsStorageManager.ХранилищеНастроекВсеСвойства")
    );
    assert_eq!(row["Категория"].as_str(), Some("Manager"));
    assert_eq!(
        row["Тип"].as_str(),
        Some("28a83375-3a6c-4012-87fb-5191cc77ca98")
    );
    assert_eq!(
        row["Значение"].as_str(),
        Some("2cc8c31c-4c74-4a7a-99d9-e9f6ce2c59a7")
    );
    let minimal =
        fs::read(fixture.join("xml/cf/SettingsStorages/ХранилищеНастроекПоУмолчанию.xml")).unwrap();
    let empty = catalog
        .capture_with_resources(
            std::path::Path::new("Inputs/default.xml"),
            &minimal,
            &context,
            None,
        )
        .unwrap()
        .unwrap();
    assert!(names(&empty, "forms").is_empty());
    assert!(names(&empty, "templates").is_empty());
    for name in ["ФормаСохранения", "ФормаЗагрузки"] {
        let target = root.0.join("Outputs/example/Формы").join(name);
        fs::create_dir_all(&target).unwrap();
        fs::copy(
            fixture
                .join("nkdk/cf/ХранилищеНастроек/ХранилищеНастроекВсеСвойства/Формы")
                .join(name)
                .join("Форма.yaml"),
            target.join("Форма.yaml"),
        )
        .unwrap();
    }
    // The input XML is not installed in the temporary project at all.
    let template = root.0.join("Outputs/example/Шаблоны/Макет");
    fs::create_dir_all(&template).unwrap();
    fs::copy(
        fixture.join(
            "nkdk/cf/ХранилищеНастроек/ХранилищеНастроекВсеСвойства/Шаблоны/Макет/Template.xml",
        ),
        template.join("Template.xml"),
    )
    .unwrap();
    catalog
        .refresh_resource_facts(
            std::path::Path::new("Outputs/example/Свойства.yaml"),
            &context,
            &root.0,
            &mut snapshots,
        )
        .unwrap();
    assert_eq!(
        names(&snapshots, "forms"),
        ["ФормаСохранения", "ФормаЗагрузки"]
    );
    assert_eq!(names(&snapshots, "templates"), ["Макет"]);
    let borrowed = snapshots
        .iter()
        .map(route::OwnedSnapshot::borrow)
        .collect::<Vec<_>>();
    let resolved = catalog
        .resolve_with_snapshots(
            std::path::Path::new("Outputs/example/Свойства.yaml"),
            Direction::YamlToXml,
            route::Material::Yaml {
                owner: b"{}",
                snapshots: &borrowed,
                new_owner: false,
            },
            &context,
            &borrowed,
        )
        .unwrap()
        .unwrap();
    let type_entry = entry_id("migration.storage-context.internal-type-facts").unwrap();
    let type_source = resolved
        .sources
        .iter()
        .find(|source| source.entry.0 == type_entry.0)
        .unwrap();
    let type_snapshot = snapshots
        .iter()
        .find(|source| source.entry.0 == type_entry.0)
        .unwrap();
    let generation = core::facts::Generation(1);
    let mut builder = fact_builder(
        generation,
        core::facts::prepared::FactBudget {
            text: core::facts::text::TextBudget {
                entries: 64,
                bytes: 8192,
            },
            rows: 16,
        },
    );
    assert!(
        contribute_snapshot_file(
            type_entry,
            &type_snapshot.bytes,
            &type_source.inputs,
            &mut builder
        )
        .is_empty()
    );
    let facts = builder.finish();
    for (index_name, expected) in [
        (
            "metadata.internal-type-ids",
            "28a83375-3a6c-4012-87fb-5191cc77ca98",
        ),
        (
            "metadata.internal-value-ids",
            "2cc8c31c-4c74-4a7a-99d9-e9f6ce2c59a7",
        ),
    ] {
        let index = fact_id(index_name).unwrap();
        let columns = facts.key_fields(index).unwrap().unwrap();
        assert_eq!(columns.len(), 2);
        let key = columns
            .iter()
            .map(|column| match *column {
                "name" => "SettingsStorageManager",
                "owner" => "93a122b3-1062-46c2-8f12-5806459164ed",
                _ => panic!("Unexpected internal type index column: {column}"),
            })
            .collect::<Vec<_>>();
        assert_eq!(
            facts.lookup_parts(generation, index, &key),
            core::facts::FactState::Ready(expected)
        );
    }
    let owner = &resolved.sources[resolved.owner_source_index];
    let requests = resource_requests(owner.entry, &owner.inputs, FILE_LIMITS).unwrap();
    assert_eq!(
        requests.groups().len(),
        4,
        "The source-mounted child fragment must retain all accepted template resource routes"
    );
    let descriptor = &requests.groups()[0][0];
    assert_eq!(
        descriptor.paths(Direction::YamlToXml).0.segments(),
        ["Шаблоны", "Макет", "Template.xml"]
    );
    assert_eq!(
        descriptor.paths(Direction::YamlToXml).1.segments(),
        ["Templates", "Макет.xml"]
    );
    fs::remove_file(
        root.0
            .join("Outputs/example/Формы/ФормаСохранения/Форма.yaml"),
    )
    .unwrap();
    let added = root.0.join("Outputs/example/Формы/НоваяФорма");
    fs::create_dir_all(&added).unwrap();
    fs::write(added.join("Форма.yaml"), "{}").unwrap();
    catalog
        .refresh_resource_facts(
            std::path::Path::new("Outputs/example/Свойства.yaml"),
            &context,
            &root.0,
            &mut snapshots,
        )
        .unwrap();
    assert_eq!(names(&snapshots, "forms"), ["ФормаЗагрузки", "НоваяФорма"]);
    let new = catalog
        .materialize_sources(
            std::path::Path::new("Outputs/new/Свойства.yaml"),
            &context,
            "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            None,
        )
        .unwrap();
    assert!(names(&new, "forms").is_empty());
    assert!(names(&new, "templates").is_empty());
    let new_types = internal(&new);
    assert_eq!(
        new_types["ВнутренниеТипы"][0]["Имя"].as_str(),
        Some("SettingsStorageManager.new")
    );
    let repeat = catalog
        .materialize_sources(
            std::path::Path::new("Outputs/new/Свойства.yaml"),
            &context,
            "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            None,
        )
        .unwrap();
    assert_eq!(
        new_types,
        internal(&repeat),
        "Internal identities are stable for the same creation seed"
    );
    let other = catalog
        .materialize_sources(
            std::path::Path::new("Outputs/new/Свойства.yaml"),
            &context,
            "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
            None,
        )
        .unwrap();
    assert_ne!(
        new_types,
        internal(&other),
        "Different creation seeds must distinguish internal identities"
    );
    let parent_context = route::Context {
        parent: "another-configuration",
        ..context
    };
    let other_parent = catalog
        .materialize_sources(
            std::path::Path::new("Outputs/new/Свойства.yaml"),
            &parent_context,
            "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            None,
        )
        .unwrap();
    assert_ne!(
        new_types,
        internal(&other_parent),
        "Same names and creation seeds under different owners must distinguish internal identities"
    );
}

#[path = "../../../../rust/apps/nkdk/tests/support/resource_states.rs"]
mod resource_states;

#[path = "../../../../rust/apps/nkdk/tests/support/record_file_owners.rs"]
mod record_file_owners;
