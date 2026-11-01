#[path = "../../build-support/catalog.rs"]
#[allow(dead_code)]
mod catalog;

fn main() {
    let journal_full = std::env::var_os("CARGO_FEATURE_JOURNAL_FULL").is_some();
    let roots = if journal_full {
        vec![
            "migration.journal-identity-and-children",
            "migration.journal-internal-types",
            "migration.adopted-journal-base-source",
            "migration.adopted-command-group-root-source",
            "migration.document-root-source",
        ]
    } else {
        include_str!("../../declarations/families/probe-path-lexicons.txt")
            .lines()
            .collect::<Vec<_>>()
    };
    catalog::build_family_with_budget(&roots, if journal_full { 18 } else { 10 } * 1024 * 1024);
}
