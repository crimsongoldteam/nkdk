//! Project operation composition uses the same preparation as migration checks.
pub use nkdk_conversion_core::facts::preparation::{PreparedFacts, Source};
use nkdk_conversion_core::{
    EntryId, RuntimeDiagnostic,
    facts::{Generation, prepared::FactBudget},
};

pub fn prepare<'a>(
    sources: Vec<Source<'a>>,
    consumers: &[EntryId],
    generation: Generation,
    budget: FactBudget,
    edge_budget: usize,
) -> Result<PreparedFacts<'a>, Vec<RuntimeDiagnostic>> {
    nkdk_conversion_core::facts::preparation::prepare::<nkdk_compiled_rules::FactCatalog>(
        sources,
        consumers,
        generation,
        budget,
        edge_budget,
    )
}
