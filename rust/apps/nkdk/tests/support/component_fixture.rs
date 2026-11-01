use nkdk_compiled_rules::Direction;

pub(super) fn convert_component(
    catalog: &nkdk::route::Catalog,
    component: &str,
    direction: Direction,
    source_root: &std::path::Path,
    target_root: &std::path::Path,
    base_component_root: Option<&std::path::Path>,
    temporary_parent: &std::path::Path,
) -> Result<nkdk::project::Report, Vec<nkdk_conversion_core::RuntimeDiagnostic>> {
    nkdk::project::convert_component_with_catalog(
        catalog,
        nkdk::project::Request {
            source_root,
            target_root,
            base_component_root,
            temporary_parent,
            context: nkdk::route::Context {
                component,
                parent: "configuration",
                default_language: "ru",
                registered_languages: &["ru", "en"],
                compatibility_mode: "Version8_3_27",
            },
            direction,
            generation: nkdk_conversion_core::facts::Generation(1),
            fact_budget: nkdk_conversion_core::facts::prepared::FactBudget {
                text: nkdk_conversion_core::facts::text::TextBudget {
                    entries: 10000,
                    bytes: 1000000,
                },
                rows: 10000,
            },
            edge_budget: 10000,
            limits: nkdk_conversion_core::resources::Limits {
                groups: 16,
                routes: 16,
                path_bytes: 4096,
            },
            xml_bytes: 1000000,
        },
    )
}
