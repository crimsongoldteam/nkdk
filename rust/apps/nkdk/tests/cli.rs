use std::{fs, process::Command};
#[path = "../../../test-support/temp.rs"]
mod temp;
#[test]
fn conversion_replaces_output_without_modifying_a_hard_linked_input() {
    let directory = temp::unique_directory("cli");
    let input = directory.join("input.xml");
    let output = directory.join("output.yaml");
    let xml = b"<Root><Value>true</Value></Root>";
    fs::write(&input, xml).unwrap();
    fs::hard_link(&input, &output).unwrap();
    let run = |entry: &str| {
        Command::new(env!("CARGO_BIN_EXE_nkdk"))
            .args([
                "convert-file",
                "--entry",
                entry,
                "--direction",
                "xml-to-yaml",
                "--input",
            ])
            .arg(&input)
            .arg("--output")
            .arg(&output)
            .output()
            .unwrap()
    };
    let converted = run("pilot.boolean");
    assert!(
        converted.status.success(),
        "{}",
        String::from_utf8_lossy(&converted.stderr)
    );
    assert_eq!(
        fs::read(&input).unwrap(),
        xml,
        "output publication must preserve input inode contents"
    );
    assert_eq!(fs::read(&output).unwrap(), "Значение: Истина".as_bytes());
    fs::write(&output, "keep").unwrap();
    assert!(!run("missing.entry").status.success());
    assert!(!run("migration.external-document").status.success());
    assert_eq!(fs::read(&output).unwrap(), b"keep");
    assert_eq!(
        fs::read_dir(&directory).unwrap().count(),
        2,
        "no staging files remain"
    );
    fs::remove_dir_all(directory).unwrap();
}
