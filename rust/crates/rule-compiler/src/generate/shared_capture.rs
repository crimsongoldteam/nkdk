//! Optional compilation-unit capture; legacy generation remains byte-identical.
use super::{asset_session::Session, shared_references::ReferenceIndex, shared_units::*};
use std::{cell::RefCell, collections::BTreeSet, ops::Range};

#[derive(Default)]
pub(super) struct Capture {
    graph: UnitGraph,
    references: ReferenceIndex,
    excluded: Vec<Range<usize>>,
    facade_references: BTreeSet<SymbolId>,
    errors: Vec<String>,
}
thread_local! {
    pub(super) static CURRENT: RefCell<Option<Capture>> = const { RefCell::new(None) };
}

pub(crate) fn active() -> bool {
    CURRENT.with(|current| current.borrow().is_some())
}

pub(crate) fn reference(symbol: &str, rendered: String) -> String {
    CURRENT.with(|current| {
        if let Some(capture) = current.borrow_mut().as_mut()
            && let Err(error) = capture
                .references
                .register(SymbolId(symbol.into()), &rendered)
        {
            capture.errors.push(error);
        }
    });
    rendered
}
pub(crate) fn unit(build: impl FnOnce() -> GeneratedUnit) {
    CURRENT.with(|current| {
        if let Some(capture) = current.borrow_mut().as_mut()
            && let Err(error) = capture.graph.insert(build())
        {
            capture.errors.push(error);
        }
    });
}
/// Public facade exports remain reachable even when its implementation does not call them.
pub(crate) fn export(symbol: &str) {
    CURRENT.with(|current| {
        if let Some(capture) = current.borrow_mut().as_mut() {
            capture.facade_references.insert(SymbolId(symbol.into()));
        }
    });
}
pub(super) fn exclude(start: usize, end: usize) {
    CURRENT.with(|current| {
        if let Some(capture) = current.borrow_mut().as_mut() {
            capture.excluded.push(start..end);
        }
    });
}
pub(super) fn finish(
    session: Session<Capture>,
    source: &str,
    files: Vec<(String, Vec<u8>)>,
) -> Result<UnitGraph, String> {
    let mut capture = session.take();
    if !capture.errors.is_empty() {
        return Err(capture.errors.join("\n"));
    }
    let mut facade = source.to_owned();
    capture.excluded.sort_by_key(|range| range.start);
    for range in capture.excluded.into_iter().rev() {
        facade.replace_range(range, "");
    }
    capture.graph.insert(GeneratedUnit {
        id: UnitId("facade".into()),
        namespace: vec![],
        definitions: [SymbolId("facade".into())].into(),
        references: capture.facade_references,
        source: facade,
        source_kinds: BTreeSet::new(),
        files,
    })?;
    for unit in capture.graph.units.values_mut() {
        unit.references
            .extend(capture.references.resolve(&unit.source)?);
    }
    Ok(capture.graph)
}
