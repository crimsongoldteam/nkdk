#[path = "../../build-support/catalog.rs"]
#[allow(dead_code)]
mod catalog;

fn main() {
    catalog::build_family_with_budget(
        include_str!("../../declarations/families/probe-journal-columns.txt")
            .lines()
            .collect::<Vec<_>>()
            .as_slice(),
        4 * 1024 * 1024,
    );
}
