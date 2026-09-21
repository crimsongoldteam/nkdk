mod compile {
    include!("compile.rs");
}

use std::{fs, path::PathBuf};

fn main() {
    let workspace = PathBuf::from(std::env::var_os("CARGO_MANIFEST_DIR").unwrap())
        .join("../../..")
        .canonicalize()
        .unwrap();
    let shard: usize = std::env::var("CARGO_PKG_NAME")
        .unwrap()
        .rsplit('-')
        .next()
        .unwrap()
        .parse()
        .unwrap();
    const SHARDS: usize = 8;
    assert!(shard < SHARDS);
    let system_catalog = "declarations/common/system-enumerations.yaml";
    let matrix_path = "declarations/probes/system-enumerations.yaml";
    println!("cargo::rerun-if-changed={}", workspace.join(system_catalog).display());
    println!("cargo::rerun-if-changed={}", workspace.join(matrix_path).display());
    // Enumeration probes import only this catalog. Reading every common file
    // rebuilt all eight shards after unrelated declaration changes.
    let mut sources = vec![(
        system_catalog.into(),
        fs::read(workspace.join(system_catalog)).expect("read system enumerations"),
    )];
    let matrix = fs::read(workspace.join(matrix_path)).unwrap();
    let matrix = std::str::from_utf8(&matrix).unwrap();
    let mut parts = matrix.split("\n- kind: object\n");
    let mut selected = parts.next().unwrap().to_owned();
    let mut count = 0;
    for (index, entry) in parts.enumerate() {
        if (index / 2) % SHARDS == shard {
            selected.push_str("\n- kind: object\n");
            selected.push_str(entry);
        }
        count += 1;
    }
    assert_eq!(count % 2, 0, "each enumeration needs ordinary and DCS probes");
    sources.push((
        "declarations/probes/system-enumerations.yaml".into(),
        selected.into_bytes(),
    ));
    compile::declarations(&workspace, &sources, 8 * 1024 * 1024);
}
