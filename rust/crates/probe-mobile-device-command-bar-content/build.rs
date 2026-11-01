#[path = "../../build-support/catalog.rs"]
#[allow(dead_code)]
mod catalog;

fn main() {
    let roots =
        include_str!("../../declarations/families/probe-mobile-device-command-bar-content.txt")
            .lines()
            .collect::<Vec<_>>();
    catalog::build_family_with_budget(&roots, 6 * 1024 * 1024);
}
