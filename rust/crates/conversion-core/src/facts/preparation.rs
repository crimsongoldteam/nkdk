//! Execute the generated dependency schedule once per operation.
use super::{
    Generation,
    dependencies::DependencyPlan,
    prepared::{FactBudget, FactId, PreparedTextFacts, TextFactsBuilder},
};
use crate::{Direction, EntryId, PreparedInputs, RuntimeDiagnostic};
use std::sync::Arc;

pub struct Source<'a> {
    pub entry: EntryId,
    pub direction: Direction,
    pub bytes: &'a [u8],
    pub inputs: PreparedInputs,
}

pub struct PreparedFacts<'a> {
    pub facts: Arc<PreparedTextFacts>,
    pub sources: Vec<Source<'a>>,
}

/// Implemented by the compiled declaration catalog, never by individual objects.
pub trait Catalog {
    fn index_count() -> usize;
    fn plan(
        sources: &[(EntryId, Direction)],
        consumers: &[EntryId],
        edge_budget: usize,
    ) -> crate::Result<DependencyPlan>;
    fn builder(generation: Generation, budget: FactBudget) -> TextFactsBuilder;
    fn bind(
        source: &Source<'_>,
        direction: Option<Direction>,
        facts: Arc<PreparedTextFacts>,
        generation: Generation,
    ) -> crate::Result<PreparedInputs>;
    fn contribute(source: &Source<'_>, builder: &mut TextFactsBuilder) -> Vec<RuntimeDiagnostic>;
}

pub fn prepare<'a, C: Catalog>(
    mut sources: Vec<Source<'a>>,
    consumers: &[EntryId],
    generation: Generation,
    budget: FactBudget,
    edge_budget: usize,
) -> Result<PreparedFacts<'a>, Vec<RuntimeDiagnostic>> {
    let operations: Vec<_> = sources
        .iter()
        .map(|source| (source.entry, source.direction))
        .collect();
    let plan = C::plan(&operations, consumers, edge_budget).map_err(|error| vec![error])?;
    let mut builder = C::builder(generation, budget);
    for step in plan.order() {
        let position = step.0 as usize;
        if let Some(source) = sources.get_mut(position) {
            bind::<C>(
                source,
                Some(source.direction),
                builder.snapshot(),
                generation,
            )?;
            let diagnostics = C::contribute(source, &mut builder);
            if !diagnostics.is_empty() {
                return Err(diagnostics);
            }
        } else if position - sources.len() < C::index_count() {
            builder
                .publish(FactId((position - sources.len()) as u32))
                .map_err(|error| {
                    vec![RuntimeDiagnostic::new(
                        "fact.publish",
                        format!("Cannot publish prepared index: {error:?}"),
                    )]
                })?;
        }
    }
    let facts = Arc::new(builder.finish());
    for source in &mut sources {
        bind::<C>(source, None, facts.clone(), generation)?;
    }
    Ok(PreparedFacts { facts, sources })
}

fn bind<C: Catalog>(
    source: &mut Source<'_>,
    direction: Option<Direction>,
    facts: Arc<PreparedTextFacts>,
    generation: Generation,
) -> Result<(), Vec<RuntimeDiagnostic>> {
    let overlay = C::bind(source, direction, facts, generation).map_err(|error| vec![error])?;
    source.inputs = std::mem::take(&mut source.inputs)
        .with_indexes(overlay)
        .map_err(|error| vec![error])?;
    Ok(())
}
