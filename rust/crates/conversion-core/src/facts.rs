//! Typed, immutable indexes prepared outside individual value conversions.
//! Keys and values belong to generated projections, not metadata-specific code.

pub mod dependencies;
pub mod graph;
pub mod identity;
pub mod prepared;
pub mod text;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Generation(pub u64);

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum FactState<T> {
    Ready(T),
    Missing,
    Ambiguous,
    Cycle,
    Unready,
}

pub struct FactIndexBuilder<K, V> {
    generation: Generation,
    ready: bool,
    rows: Vec<(K, V)>,
}

pub struct FactIndex<K, V> {
    generation: Generation,
    ready: bool,
    rows: Vec<(K, V)>,
}

impl<K: Ord, V> FactIndexBuilder<K, V> {
    pub fn new(generation: Generation) -> Self {
        Self {
            generation,
            ready: true,
            rows: Vec::new(),
        }
    }

    /// Batch ingestion retains only projected keys and values, never source XML.
    pub fn extend(&mut self, rows: impl IntoIterator<Item = (K, V)>) {
        self.rows.extend(rows);
    }

    /// An unreadable contribution may hide either a match or a duplicate.
    /// Later successful batches cannot establish completeness again.
    pub fn mark_unready(&mut self) {
        self.ready = false;
    }

    pub fn finish(mut self) -> FactIndex<K, V> {
        self.rows
            .sort_unstable_by(|left, right| left.0.cmp(&right.0));
        FactIndex {
            generation: self.generation,
            ready: self.ready,
            rows: self.rows,
        }
    }
}

impl<K: Ord, V> FactIndex<K, V> {
    /// A borrowed result needs no allocation and never chooses among duplicates.
    pub fn lookup(&self, generation: Generation, key: &K) -> FactState<&V> {
        if !self.ready || generation != self.generation {
            return FactState::Unready;
        }
        let index = self.rows.partition_point(|(candidate, _)| candidate < key);
        let Some((candidate, value)) = self.rows.get(index) else {
            return FactState::Missing;
        };
        if candidate != key {
            return FactState::Missing;
        }
        if self
            .rows
            .get(index + 1)
            .is_some_and(|(candidate, _)| candidate == key)
        {
            FactState::Ambiguous
        } else {
            FactState::Ready(value)
        }
    }
}
