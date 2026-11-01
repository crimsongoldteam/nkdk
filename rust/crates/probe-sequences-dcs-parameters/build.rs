#[path = "../../build-support/catalog.rs"]
#[allow(dead_code)]
mod catalog;

fn main() {
    for group in [
        "fill",
        "value_core",
        "value_variants",
        "collections",
        "dcs_parameters",
        "dcs_primitive_values",
    ] {
        println!("cargo::rustc-check-cfg=cfg(nkdk_sequence_{group})");
    }
    println!("cargo::rustc-cfg=nkdk_sequence_dcs_parameters");
    catalog::build_family_with_budget(
        include_str!("../../declarations/families/probe-sequences-dcs-parameters.txt")
            .lines()
            .collect::<Vec<_>>()
            .as_slice(),
        8 * 1024 * 1024,
    );
}
