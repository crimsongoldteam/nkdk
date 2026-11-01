pub fn fact_budget(
    entries: usize,
    bytes: usize,
    rows: usize,
) -> nkdk_conversion_core::facts::prepared::FactBudget {
    nkdk_conversion_core::facts::prepared::FactBudget {
        text: nkdk_conversion_core::facts::text::TextBudget { entries, bytes },
        rows,
    }
}
