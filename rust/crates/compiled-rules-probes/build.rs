#[path = "../../build-support/catalog.rs"]
mod catalog;

fn main() {
    catalog::build(|path| {
        path != "declarations/probes/system-enumerations.yaml"
            && path != "declarations/probes/document-identity-and-children.yaml"
            && !path.starts_with("declarations/candidates/")
    });
}
