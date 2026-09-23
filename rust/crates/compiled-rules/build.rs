#[path = "../../build-support/catalog.rs"]
mod catalog;

fn main() {
    let directory = std::path::PathBuf::from(std::env::var_os("CARGO_MANIFEST_DIR").unwrap())
        .join("../../declarations");
    let production_probes = directory.join("production-probes.txt");
    println!("cargo::rerun-if-changed={}", production_probes.display());
    let accepted_probes = std::fs::read_to_string(&production_probes)
        .expect("read production probe manifest")
        .lines()
        .map(str::trim)
        .filter(|line| !line.is_empty() && !line.starts_with('#'))
        .map(|line| format!("declarations/{line}"))
        .collect::<std::collections::BTreeSet<_>>();
    catalog::build(|path| {
        if path.starts_with("declarations/probes/") {
            accepted_probes.contains(path)
        } else if path.starts_with("declarations/candidates/") {
            matches!(
                path,
                "declarations/candidates/standard-attributes.generated.yaml"
                    | "declarations/candidates/document-attributes.generated.yaml"
            )
        } else {
            true
        }
    });
}
