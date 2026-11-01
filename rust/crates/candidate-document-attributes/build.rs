#[path = "../../build-support/catalog.rs"]
#[allow(dead_code)]
mod catalog;

fn main() {
    for candidate in ["standard", "document"] {
        println!("cargo::rustc-check-cfg=cfg(nkdk_candidate_{candidate})");
    }
    println!("cargo::rustc-cfg=nkdk_candidate_document");
    catalog::build_family_with_budget(
        include_str!("../../declarations/families/candidate-document-attributes.txt")
            .lines()
            .collect::<Vec<_>>()
            .as_slice(),
        20 * 1024 * 1024,
    );
}
