#[path = "../../build-support/catalog.rs"]
#[allow(dead_code)]
mod catalog;

fn main() {
    catalog::build_family(&["migration.metadata-fields"]);
}
