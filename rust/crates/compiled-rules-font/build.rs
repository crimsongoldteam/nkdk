#[path = "../../build-support/catalog.rs"]
#[allow(dead_code)]
mod catalog;

fn main() {
    catalog::build_family(&[
        "probe.font-owner",
        "probe.font-record-owner",
        "probe.font-reference-owner",
        "probe.style-item-type-facts",
    ]);
}
