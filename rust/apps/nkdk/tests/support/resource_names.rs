use super::*;
pub(super) fn snapshot_document(snapshots: &[nkdk::route::OwnedSnapshot]) -> yaml_rust2::Yaml {
    yaml_rust2::YamlLoader::load_from_str(std::str::from_utf8(&snapshots[0].bytes).unwrap())
        .unwrap()
        .remove(0)
}
#[test]
fn resource_name_discovery_preserves_spelling_and_bounds_current_files() {
    use nkdk::resource_files::{FileNameMode, file_names};
    let root = Temp(std::env::temp_dir().join(format!("nkdk-file-names-{}", std::process::id())));
    fs::create_dir_all(&root.0).unwrap();
    let directory = RelativePath::new(["Files"], 64).unwrap();
    let extensions = vec!["xsd".to_owned()];
    let read = |mode, sensitive, limits| {
        file_names(&root.0, &directory, &extensions, mode, sensitive, limits)
    };
    assert!(
        read(FileNameMode::FileName, false, FILE_LIMITS)
            .unwrap()
            .is_empty()
    );
    fs::create_dir_all(root.0.join("Files/nested.xsd")).unwrap();
    for name in ["one.xsd", "two.XsD", "same.xsd", "ignored.xml"] {
        fs::write(root.0.join("Files").join(name), b"").unwrap();
    }
    fs::write(root.0.join("Files/nested.xsd/child.xsd"), b"").unwrap();
    assert_eq!(
        read(FileNameMode::FileName, false, FILE_LIMITS).unwrap(),
        ["one.xsd", "same.xsd", "two.XsD"]
    );
    assert_eq!(
        read(FileNameMode::Stem, true, FILE_LIMITS).unwrap(),
        ["one", "same"]
    );
    assert!(
        read(
            FileNameMode::FileName,
            false,
            Limits {
                routes: 2,
                ..FILE_LIMITS
            }
        )
        .is_err()
    );
    assert!(
        read(
            FileNameMode::FileName,
            false,
            Limits {
                path_bytes: 2,
                ..FILE_LIMITS
            }
        )
        .is_err()
    );
    let route = |options: &str| {
        format!(
            "format: nkdk-operation-routes/1\nroutes:\n- xmlDir: Inputs\n  yamlDir: Outputs\n  owners: {{cf: migration.journal-help-pages-source}}\n  inputs: {{}}\n  sources:\n  - entry: migration.journal-help-pages-source\n    inputs: {{}}\n    factDirections: []\n    resourceNames:\n      directory: [Files]\n      field: pages\n      extensions: [xsd]\n{options}"
        )
    };
    let context = nkdk::route::Context {
        component: "cf",
        parent: "",
        default_language: "ru",
        registered_languages: &["ru"],
        compatibility_mode: "DontUse",
    };
    let names = |snapshots: &[nkdk::route::OwnedSnapshot]| {
        snapshot_document(snapshots)["pages"]
            .as_vec()
            .unwrap()
            .iter()
            .map(|name| name.as_str().unwrap().to_owned())
            .collect::<Vec<_>>()
    };
    for (options, expected) in [
        ("", vec!["one", "same"]),
        (
            "      fullNames: true\n      caseSensitive: false\n",
            vec!["one.xsd", "same.xsd", "two.XsD"],
        ),
    ] {
        let catalog = nkdk::route::Catalog::parse(&route(options)).unwrap();
        let mut snapshots = catalog
            .capture_with_resources(
                std::path::Path::new("Inputs/example.xml"),
                b"",
                &context,
                Some(&root.0),
            )
            .unwrap()
            .unwrap();
        assert_eq!(names(&snapshots), expected);
        let exported = root.0.join("Outputs/example/Files");
        fs::create_dir_all(&exported).unwrap();
        for name in ["new.xsd", "same.xsd", "two.XsD"] {
            fs::write(exported.join(name), b"changed").unwrap();
        }
        // Refresh a retained snapshot, rather than recapturing the original XML.
        catalog
            .refresh_resource_facts(
                std::path::Path::new("Outputs/example.yaml"),
                &context,
                &root.0,
                &mut snapshots,
            )
            .unwrap();
        assert_eq!(
            names(&snapshots),
            if options.is_empty() {
                vec!["new", "same"]
            } else {
                vec!["new.xsd", "same.xsd", "two.XsD"]
            }
        );
    }
    for option in [
        "      fullNames: invalid\n",
        "      caseSensitive: invalid\n",
    ] {
        assert!(nkdk::route::Catalog::parse(&route(option)).is_err());
    }
    // An ordered XML list is refreshed from current child directories. The
    // source XML can disappear; retained names keep order and multiplicity.
    let ordered = route("      entryFile: Item.yaml\n      preserveOrder: true\n")
        .replace("      extensions: [xsd]\n", "");
    let catalog = nkdk::route::Catalog::parse(&ordered).unwrap();
    let xml = b"<Help xmlns=\"http://v8.1c.ru/8.3/xcf/extrnprops\"><Page>two</Page><Page>one</Page><Page>two</Page><Page>gone</Page></Help>";
    let mut snapshots = catalog
        .capture_with_resources(
            std::path::Path::new("Inputs/example.xml"),
            xml,
            &context,
            None,
        )
        .unwrap()
        .unwrap();
    assert_eq!(names(&snapshots), ["two", "one", "two", "gone"]);
    let children = root.0.join("Outputs/example/Files");
    for name in ["one", "two", "new", "unrelated"] {
        fs::create_dir_all(children.join(name)).unwrap();
        if name != "unrelated" {
            fs::write(children.join(name).join("Item.yaml"), b"{}").unwrap();
        }
    }
    let children_path = RelativePath::new(["Outputs", "example", "Files"], 128).unwrap();
    assert_eq!(
        nkdk::resource_files::directory_names(&root.0, &children_path, "Item.yaml", FILE_LIMITS)
            .unwrap(),
        ["new", "one", "two"]
    );
    assert!(
        nkdk::resource_files::directory_names(&root.0, &children_path, "../Item.yaml", FILE_LIMITS)
            .is_err()
    );
    assert!(
        nkdk::resource_files::directory_names(
            &root.0,
            &children_path,
            "Item.yaml",
            Limits {
                routes: 2,
                ..FILE_LIMITS
            }
        )
        .is_err()
    );
    #[cfg(unix)]
    {
        std::os::unix::fs::symlink(children.join("one"), children.join("alias")).unwrap();
        std::os::unix::fs::symlink(
            children.join("one/Item.yaml"),
            children.join("unrelated/Item.yaml"),
        )
        .unwrap();
    }
    catalog
        .refresh_resource_facts(
            std::path::Path::new("Outputs/example.yaml"),
            &context,
            &root.0,
            &mut snapshots,
        )
        .unwrap();
    assert_eq!(names(&snapshots), ["two", "one", "two", "new"]);
    fs::remove_file(children.join("one/Item.yaml")).unwrap();
    catalog
        .refresh_resource_facts(
            std::path::Path::new("Outputs/example.yaml"),
            &context,
            &root.0,
            &mut snapshots,
        )
        .unwrap();
    assert_eq!(names(&snapshots), ["two", "two", "new"]);
    for invalid in [
        "      entryFile: ../Item.yaml\n",
        "      preserveOrder: invalid\n",
    ] {
        assert!(
            nkdk::route::Catalog::parse(&route(invalid).replace("      extensions: [xsd]\n", ""))
                .is_err()
        );
    }
    fs::remove_file(root.0.join("Files/one.xsd")).unwrap();
    fs::write(root.0.join("Files/new.xsd"), b"changed").unwrap();
    assert_eq!(
        read(FileNameMode::FileName, false, FILE_LIMITS).unwrap(),
        ["new.xsd", "same.xsd", "two.XsD"]
    );
}
