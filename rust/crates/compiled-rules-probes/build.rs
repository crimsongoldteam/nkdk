#[path = "../../build-support/catalog.rs"]
mod catalog;

fn main() {
    println!("cargo::rerun-if-env-changed=NKDK_FULL_PROBES");
    if std::env::var_os("NKDK_FULL_PROBES").as_deref() == Some(std::ffi::OsStr::new("1")) {
        for directory in ["common", "fragments", "objects", "resources", "probes"] {
            catalog::watch_directory(directory);
        }
        catalog::build(|path| {
            path != "declarations/probes/system-enumerations.yaml"
                && path != "declarations/probes/document-identity-and-children.yaml"
                && !path.starts_with("declarations/candidates/")
        });
    } else {
        println!(
            "cargo::rerun-if-changed={}/../../declarations/families/probe-corpus.txt",
            env!("CARGO_MANIFEST_DIR")
        );
        catalog::build_family(
            include_str!("../../declarations/families/probe-corpus.txt")
                .lines()
                .collect::<Vec<_>>()
                .as_slice(),
        );
    }
}
