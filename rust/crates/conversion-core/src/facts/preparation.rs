//! Execute the generated dependency schedule once per operation.
use super::{
    Generation,
    dependencies::DependencyPlan,
    prepared::{FactBudget, FactId, PreparedTextFacts, TextFactsBuilder},
};
use crate::{Direction, EntryId, PreparedInputs, RuntimeDiagnostic};
use std::{borrow::Cow, sync::Arc};

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

pub struct SourceHeader {
    pub entry: EntryId,
    pub direction: Direction,
    pub inputs: PreparedInputs,
}

#[derive(Clone, Copy, PartialEq, Eq)]
pub enum SourceKind {
    Ordinary,
    /// Semantic YAML retained independently of the index it contributes.
    Snapshot,
    /// Observe occupied attributes without interpreting the source as an object.
    AttributeReservations {
        max_depth: usize,
    },
    /// Occupation rebound to the current declaration and typed owner context.
    AttributeReservationSnapshot {
        max_depth: usize,
        budget: crate::xml::attribute_scan::SnapshotBudget,
    },
}

pub struct MaterialSourceHeader {
    pub source: SourceHeader,
    pub kind: SourceKind,
}

impl From<SourceHeader> for MaterialSourceHeader {
    fn from(source: SourceHeader) -> Self {
        Self {
            source,
            kind: SourceKind::Ordinary,
        }
    }
}

pub struct PreparedHeaders {
    pub facts: Arc<PreparedTextFacts>,
    pub sources: Vec<SourceHeader>,
}

/// Primary bytes and declared XML documents owned only by the current fact source.
pub struct LoadedSource {
    pub bytes: Vec<u8>,
    pub documents: Vec<(crate::resources::RelativePath, Vec<u8>)>,
}

struct LoadedBytes<'a> {
    bytes: Cow<'a, [u8]>,
    documents: Option<Vec<(crate::resources::RelativePath, Vec<u8>)>>,
}

/// Implemented by the compiled declaration catalog, never by individual objects.
pub trait Catalog {
    fn index_count() -> usize;
    fn plan(
        sources: &[(EntryId, Direction)],
        consumers: &[EntryId],
        edge_budget: usize,
    ) -> crate::Result<DependencyPlan>;
    fn plan_materials(
        sources: &[(EntryId, Direction, SourceKind)],
        consumers: &[EntryId],
        edge_budget: usize,
    ) -> crate::Result<DependencyPlan> {
        if sources
            .iter()
            .any(|source| source.2 != SourceKind::Ordinary)
        {
            return Err(RuntimeDiagnostic::new(
                "fact.snapshot",
                "Catalog does not support retained sources",
            ));
        }
        Self::plan(
            &sources
                .iter()
                .map(|source| (source.0, source.1))
                .collect::<Vec<_>>(),
            consumers,
            edge_budget,
        )
    }
    fn builder(generation: Generation, budget: FactBudget) -> TextFactsBuilder;
    /// Binding depends on the entry and typed inputs; only `contribute` reads source bytes.
    fn bind(
        source: &Source<'_>,
        direction: Option<Direction>,
        facts: Arc<PreparedTextFacts>,
        generation: Generation,
    ) -> crate::Result<PreparedInputs>;
    fn contribute(source: &Source<'_>, builder: &mut TextFactsBuilder) -> Vec<RuntimeDiagnostic>;
    fn reserve_attributes(
        _source: &Source<'_>,
        _builder: &mut TextFactsBuilder,
        _max_depth: usize,
    ) -> Vec<RuntimeDiagnostic> {
        vec![RuntimeDiagnostic::new(
            "fact.attribute-profile",
            "Catalog does not support attribute reservation sources",
        )]
    }
    fn reserve_attribute_snapshot(
        _source: &Source<'_>,
        _builder: &mut TextFactsBuilder,
        _max_depth: usize,
        _budget: crate::xml::attribute_scan::SnapshotBudget,
    ) -> Vec<RuntimeDiagnostic> {
        vec![RuntimeDiagnostic::new(
            "fact.attribute-profile",
            "Catalog does not support retained attribute reservations",
        )]
    }
    fn bind_attributes(
        source: &Source<'_>,
        facts: Arc<PreparedTextFacts>,
        generation: Generation,
    ) -> crate::Result<PreparedInputs> {
        Self::bind(source, Some(source.direction), facts, generation)
    }
    fn bind_snapshot(
        _source: &Source<'_>,
        _facts: Arc<PreparedTextFacts>,
        _generation: Generation,
    ) -> crate::Result<PreparedInputs> {
        Err(RuntimeDiagnostic::new(
            "fact.snapshot",
            "Catalog does not support retained sources",
        ))
    }
    fn contribute_snapshot(
        _source: &Source<'_>,
        _builder: &mut TextFactsBuilder,
    ) -> Vec<RuntimeDiagnostic> {
        vec![RuntimeDiagnostic::new(
            "fact.snapshot",
            "Catalog does not support retained sources",
        )]
    }
}

pub fn prepare<'a, C: Catalog>(
    sources: Vec<Source<'a>>,
    consumers: &[EntryId],
    generation: Generation,
    budget: FactBudget,
    edge_budget: usize,
) -> Result<PreparedFacts<'a>, Vec<RuntimeDiagnostic>> {
    let mut bytes = Vec::with_capacity(sources.len());
    let headers: Vec<SourceHeader> = sources
        .into_iter()
        .map(|source| {
            bytes.push(source.bytes);
            SourceHeader {
                entry: source.entry,
                direction: source.direction,
                inputs: source.inputs,
            }
        })
        .collect();
    let prepared = prepare_loaded::<C, _>(
        headers.into_iter().map(Into::into).collect(),
        consumers,
        generation,
        budget,
        edge_budget,
        |index, _| {
            Ok(LoadedBytes {
                bytes: Cow::Borrowed(bytes[index]),
                documents: None,
            })
        },
    )?;
    let sources = prepared
        .sources
        .into_iter()
        .zip(bytes)
        .map(|(header, bytes)| Source {
            entry: header.entry,
            direction: header.direction,
            bytes,
            inputs: header.inputs,
        })
        .collect();
    Ok(PreparedFacts {
        facts: prepared.facts,
        sources,
    })
}

/// Load only the source scheduled for contribution, then release its bytes.
pub fn prepare_streaming<C: Catalog>(
    sources: Vec<SourceHeader>,
    consumers: &[EntryId],
    generation: Generation,
    budget: FactBudget,
    edge_budget: usize,
    mut load: impl FnMut(usize) -> Result<Vec<u8>, Vec<RuntimeDiagnostic>>,
) -> Result<PreparedHeaders, Vec<RuntimeDiagnostic>> {
    prepare_loaded::<C, _>(
        sources.into_iter().map(Into::into).collect(),
        consumers,
        generation,
        budget,
        edge_budget,
        |index, _| {
            load(index).map(|bytes| LoadedBytes {
                bytes: Cow::Owned(bytes),
                documents: None,
            })
        },
    )
}

/// Load and release all XML material for one scheduled source at a time.
/// Returned headers retain typed context and index handles, never loaded XML documents.
pub fn prepare_streaming_with_documents<C: Catalog>(
    sources: Vec<SourceHeader>,
    consumers: &[EntryId],
    generation: Generation,
    budget: FactBudget,
    edge_budget: usize,
    load: impl FnMut(usize, &SourceHeader) -> Result<LoadedSource, Vec<RuntimeDiagnostic>>,
) -> Result<PreparedHeaders, Vec<RuntimeDiagnostic>> {
    prepare_streaming_materials::<C>(
        sources.into_iter().map(Into::into).collect(),
        consumers,
        generation,
        budget,
        edge_budget,
        load,
    )
}

/// Schedule ordinary sources and retained semantic YAML in the same operation.
pub fn prepare_streaming_materials<C: Catalog>(
    sources: Vec<MaterialSourceHeader>,
    consumers: &[EntryId],
    generation: Generation,
    budget: FactBudget,
    edge_budget: usize,
    mut load: impl FnMut(usize, &SourceHeader) -> Result<LoadedSource, Vec<RuntimeDiagnostic>>,
) -> Result<PreparedHeaders, Vec<RuntimeDiagnostic>> {
    prepare_loaded::<C, _>(
        sources,
        consumers,
        generation,
        budget,
        edge_budget,
        |index, header| {
            load(index, header).map(|loaded| LoadedBytes {
                bytes: Cow::Owned(loaded.bytes),
                documents: Some(loaded.documents),
            })
        },
    )
}

fn prepare_loaded<'a, C: Catalog, F>(
    sources: Vec<MaterialSourceHeader>,
    consumers: &[EntryId],
    generation: Generation,
    budget: FactBudget,
    edge_budget: usize,
    mut load: F,
) -> Result<PreparedHeaders, Vec<RuntimeDiagnostic>>
where
    F: FnMut(usize, &SourceHeader) -> Result<LoadedBytes<'a>, Vec<RuntimeDiagnostic>>,
{
    let (mut sources, kinds): (Vec<_>, Vec<_>) = sources
        .into_iter()
        .map(|source| (source.source, source.kind))
        .unzip();
    if sources.iter().zip(&kinds).any(|(source, kind)| {
        matches!(
            kind,
            SourceKind::Snapshot | SourceKind::AttributeReservationSnapshot { .. }
        ) && !matches!(source.direction, Direction::YamlToXml)
    }) {
        return Err(vec![RuntimeDiagnostic::new(
            "fact.snapshot-direction",
            "Retained sources must contain semantic YAML",
        )]);
    }
    if sources.iter().zip(&kinds).any(|(source, kind)| {
        matches!(kind, SourceKind::AttributeReservations { .. })
            && !matches!(source.direction, Direction::XmlToYaml)
    }) {
        return Err(vec![RuntimeDiagnostic::new(
            "fact.attribute-direction",
            "Attribute observation requires an XML source",
        )]);
    }
    let operations: Vec<_> = sources
        .iter()
        .zip(&kinds)
        .map(|(source, kind)| (source.entry, source.direction, *kind))
        .collect();
    let plan =
        C::plan_materials(&operations, consumers, edge_budget).map_err(|error| vec![error])?;
    let mut builder = C::builder(generation, budget);
    for step in plan.order() {
        let position = step.0 as usize;
        if let Some(header) = sources.get_mut(position) {
            let loaded = load(position, header)?;
            let release_documents = loaded.documents.is_some();
            let mut inputs = std::mem::take(&mut header.inputs);
            if let Some(documents) = loaded.documents {
                inputs = inputs
                    .with_documents(documents)
                    .map_err(|error| vec![error])?;
            }
            let mut source = Source {
                entry: header.entry,
                direction: header.direction,
                bytes: loaded.bytes.as_ref(),
                inputs,
            };
            bind::<C>(
                &mut source,
                Some(header.direction),
                kinds[position],
                builder.snapshot(),
                generation,
            )?;
            let diagnostics = match kinds[position] {
                SourceKind::Ordinary => C::contribute(&source, &mut builder),
                SourceKind::Snapshot => C::contribute_snapshot(&source, &mut builder),
                SourceKind::AttributeReservations { max_depth } => {
                    C::reserve_attributes(&source, &mut builder, max_depth)
                }
                SourceKind::AttributeReservationSnapshot { max_depth, budget } => {
                    C::reserve_attribute_snapshot(&source, &mut builder, max_depth, budget)
                }
            };
            if !diagnostics.is_empty() {
                return Err(diagnostics);
            }
            header.inputs = if release_documents {
                source
                    .inputs
                    .with_documents(vec![])
                    .map_err(|error| vec![error])?
            } else {
                source.inputs
            };
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
    for header in &mut sources {
        let mut source = Source {
            entry: header.entry,
            direction: header.direction,
            bytes: &[],
            inputs: std::mem::take(&mut header.inputs),
        };
        bind::<C>(
            &mut source,
            None,
            SourceKind::Ordinary,
            facts.clone(),
            generation,
        )?;
        header.inputs = source.inputs;
    }
    Ok(PreparedHeaders { facts, sources })
}

fn bind<C: Catalog>(
    source: &mut Source<'_>,
    direction: Option<Direction>,
    kind: SourceKind,
    facts: Arc<PreparedTextFacts>,
    generation: Generation,
) -> Result<(), Vec<RuntimeDiagnostic>> {
    let overlay = if direction.is_some() {
        match kind {
            SourceKind::Snapshot => C::bind_snapshot(source, facts, generation),
            SourceKind::AttributeReservations { .. }
            | SourceKind::AttributeReservationSnapshot { .. } => {
                C::bind_attributes(source, facts, generation)
            }
            SourceKind::Ordinary => C::bind(source, direction, facts, generation),
        }
    } else {
        C::bind(source, direction, facts, generation)
    }
    .map_err(|error| vec![error])?;
    source.inputs = std::mem::take(&mut source.inputs)
        .with_indexes(overlay)
        .map_err(|error| vec![error])?;
    Ok(())
}
