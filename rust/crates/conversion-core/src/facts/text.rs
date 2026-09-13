//! Shared UTF-8 storage for projected keys and columns of one generation.
use super::{FactState, Generation};
use std::{collections::HashMap, sync::Arc};

#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct TextId(pub u32);

pub struct TextBudget {
    pub entries: usize,
    pub bytes: usize,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TextLimit {
    Entries,
    Bytes,
}

pub struct TextBuilder {
    text: PreparedText,
    budget: TextBudget,
    bytes: usize,
}

pub struct PreparedText {
    generation: Generation,
    ids: HashMap<Arc<str>, TextId>,
    values: Vec<Arc<str>>,
}

impl TextBuilder {
    pub fn new(generation: Generation, budget: TextBudget) -> Self {
        Self {
            text: PreparedText {
                generation,
                ids: HashMap::new(),
                values: Vec::new(),
            },
            budget,
            bytes: 0,
        }
    }

    /// Repeated text allocates nothing, including after reaching the budget.
    pub fn intern(&mut self, value: &str) -> Result<TextId, TextLimit> {
        if let Some(&id) = self.text.ids.get(value) {
            return Ok(id);
        }
        if self.text.values.len() >= self.budget.entries {
            return Err(TextLimit::Entries);
        }
        let id = TextId(u32::try_from(self.text.values.len()).map_err(|_| TextLimit::Entries)?);
        let bytes = self
            .bytes
            .checked_add(value.len())
            .ok_or(TextLimit::Bytes)?;
        if bytes > self.budget.bytes {
            return Err(TextLimit::Bytes);
        }
        let value: Arc<str> = value.into();
        self.text.values.push(value.clone());
        self.text.ids.insert(value, id);
        self.bytes = bytes;
        Ok(id)
    }

    pub fn finish(self) -> PreparedText {
        self.text
    }
}

impl PreparedText {
    pub fn lookup(&self, generation: Generation, value: &str) -> FactState<TextId> {
        if generation != self.generation {
            return FactState::Unready;
        }
        self.ids
            .get(value)
            .copied()
            .map_or(FactState::Missing, FactState::Ready)
    }

    pub fn resolve(&self, generation: Generation, id: TextId) -> FactState<&str> {
        if generation != self.generation {
            return FactState::Unready;
        }
        self.values
            .get(id.0 as usize)
            .map_or(FactState::Missing, |value| FactState::Ready(value))
    }
}
