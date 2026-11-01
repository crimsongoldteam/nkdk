#[path = "../../build-support/catalog.rs"]
#[allow(dead_code)]
mod catalog;

fn main() {
    catalog::build_family(&[
        "probe.picture-reference-owner",
        "probe.picture-owner",
        "probe.picture-expanded-owner",
    ]);
}
