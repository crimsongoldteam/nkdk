//! Shared text columns and compact indexes prepared once per operation.
mod index;
use super::{
    FactIndex, FactIndexBuilder, FactState, Generation,
    text::{PreparedText, TextBudget, TextBuilder, TextId, TextLimit},
};
pub use index::{PreparedTextIndex, TextIndexBuilder, text_record_index, text_scalar_index};
use std::sync::Arc;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct FactId(pub u32);

pub struct FactBudget {
    pub text: TextBudget,
    pub rows: usize,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum FactLimit {
    UnknownIndex(FactId),
    PublishedIndex(FactId),
    Text(TextLimit),
    Rows,
    KeyArity { expected: usize, actual: usize },
}

pub struct TextFactsBuilder {
    generation: Generation,
    text: TextBuilder,
    indexes: Vec<Option<Box<dyn TextIndexBuilder>>>,
    published: Vec<Option<Arc<dyn PreparedTextIndex>>>,
    snapshot: Option<Arc<PreparedTextFacts>>,
    remaining_rows: usize,
}

pub struct PreparedTextFacts {
    generation: Generation,
    text: PreparedText,
    indexes: Vec<Option<Arc<dyn PreparedTextIndex>>>,
}

impl TextFactsBuilder {
    pub fn new(generation: Generation, index_count: usize, budget: FactBudget) -> Self {
        Self::with_indexes(
            generation,
            (0..index_count)
                .map(|_| text_scalar_index(generation))
                .collect(),
            budget,
        )
    }

    pub fn with_indexes(
        generation: Generation,
        indexes: Vec<Box<dyn TextIndexBuilder>>,
        budget: FactBudget,
    ) -> Self {
        Self {
            generation,
            text: TextBuilder::new(generation, budget.text),
            published: (0..indexes.len()).map(|_| None).collect(),
            indexes: indexes.into_iter().map(Some).collect(),
            snapshot: None,
            remaining_rows: budget.rows,
        }
    }

    pub fn push(&mut self, index: FactId, key: &str, value: &str) -> Result<(), FactLimit> {
        self.push_parts(index, &[key], value)
    }

    pub fn push_parts(
        &mut self,
        index: FactId,
        key: &[&str],
        value: &str,
    ) -> Result<(), FactLimit> {
        let target = self
            .indexes
            .get_mut(index.0 as usize)
            .ok_or(FactLimit::UnknownIndex(index))?
            .as_mut()
            .ok_or(FactLimit::PublishedIndex(index))?;
        let result = if self.remaining_rows == 0 {
            Err(FactLimit::Rows)
        } else {
            target.push(&mut self.text, key, value)
        };
        match result {
            Ok(()) => {
                self.remaining_rows -= 1;
                Ok(())
            }
            Err(error) => {
                target.mark_unready();
                Err(error)
            }
        }
    }

    pub fn mark_unready(&mut self, index: FactId) -> Result<(), FactLimit> {
        self.indexes
            .get_mut(index.0 as usize)
            .ok_or(FactLimit::UnknownIndex(index))?
            .as_mut()
            .ok_or(FactLimit::PublishedIndex(index))?
            .mark_unready();
        Ok(())
    }

    /// Seal an index after every scheduled producer has contributed.
    pub fn publish(&mut self, index: FactId) -> Result<(), FactLimit> {
        let pending = self
            .indexes
            .get_mut(index.0 as usize)
            .ok_or(FactLimit::UnknownIndex(index))?;
        if let Some(pending) = pending.take() {
            self.published[index.0 as usize] = Some(Arc::from(pending.finish()));
            self.snapshot = None;
        }
        Ok(())
    }

    /// Pending indexes stay unavailable; already published tables are shared.
    pub fn snapshot(&mut self) -> Arc<PreparedTextFacts> {
        Arc::clone(self.snapshot.get_or_insert_with(|| {
            Arc::new(PreparedTextFacts {
                generation: self.generation,
                text: self.text.snapshot(),
                indexes: self.published.clone(),
            })
        }))
    }

    pub fn finish(self) -> PreparedTextFacts {
        drop(self.snapshot);
        PreparedTextFacts {
            generation: self.generation,
            text: self.text.finish(),
            indexes: self
                .indexes
                .into_iter()
                .zip(self.published)
                .map(|(pending, published)| {
                    published.or_else(|| pending.map(|index| Arc::from(index.finish())))
                })
                .collect(),
        }
    }
}

impl PreparedTextFacts {
    /// Names have already been bound to slots; a lookup borrows the stored value.
    pub fn lookup(&self, generation: Generation, index: FactId, key: &str) -> FactState<&str> {
        self.lookup_parts(generation, index, &[key])
    }
    pub fn lookup_parts(
        &self,
        generation: Generation,
        index: FactId,
        key: &[&str],
    ) -> FactState<&str> {
        self.indexes
            .get(index.0 as usize)
            .and_then(Option::as_ref)
            .map_or(FactState::Unready, |index| {
                index.lookup(&self.text, generation, key)
            })
    }
    pub fn key_fields(&self, index: FactId) -> Option<Option<&[&'static str]>> {
        self.indexes
            .get(index.0 as usize)
            .and_then(Option::as_ref)
            .map(|index| index.columns())
    }
    pub fn is_ready(&self, generation: Generation, index: FactId) -> bool {
        self.generation == generation
            && self
                .indexes
                .get(index.0 as usize)
                .and_then(Option::as_ref)
                .is_some_and(|index| index.is_ready(generation))
    }
}

/// A cheap shared handle bound at the operation boundary, never decoded from YAML.
#[derive(Clone)]
pub struct TextIndexInput {
    facts: std::sync::Arc<PreparedTextFacts>,
    generation: Generation,
    index: FactId,
}

impl TextIndexInput {
    pub fn new(
        facts: std::sync::Arc<PreparedTextFacts>,
        generation: Generation,
        index: FactId,
    ) -> Self {
        Self {
            facts,
            generation,
            index,
        }
    }

    pub fn is_ready(&self) -> bool {
        self.facts.is_ready(self.generation, self.index)
    }
    pub fn key_fields(&self) -> Option<Option<&[&'static str]>> {
        self.facts.key_fields(self.index)
    }
    pub fn lookup(&self, key: &str) -> crate::Result<Option<&str>> {
        self.lookup_parts(&[key])
    }
    pub fn lookup_parts(&self, key: &[&str]) -> crate::Result<Option<&str>> {
        if let Some(fields) = self.key_fields() {
            let width = fields.map_or(1, <[&str]>::len);
            if width != key.len() {
                return Err(crate::RuntimeDiagnostic::new(
                    "fact.key-type",
                    "Key does not match the bound index shape",
                ));
            }
        }
        let (code, message) = match self.facts.lookup_parts(self.generation, self.index, key) {
            FactState::Ready(value) => return Ok(Some(value)),
            FactState::Missing => return Ok(None),
            FactState::Ambiguous => ("fact.ambiguous", "The index key is ambiguous"),
            FactState::Cycle => ("fact.cycle", "The indexed value depends on a cycle"),
            FactState::Unready => (
                "fact.unready",
                "The index is incomplete or belongs to another generation",
            ),
        };
        Err(crate::RuntimeDiagnostic::new(code, message))
    }
}

impl std::fmt::Debug for TextIndexInput {
    fn fmt(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        formatter
            .debug_struct("TextIndexInput")
            .field("generation", &self.generation)
            .field("index", &self.index)
            .finish_non_exhaustive()
    }
}
impl PartialEq for TextIndexInput {
    fn eq(&self, other: &Self) -> bool {
        self.generation == other.generation
            && self.index == other.index
            && std::sync::Arc::ptr_eq(&self.facts, &other.facts)
    }
}
impl Eq for TextIndexInput {}
