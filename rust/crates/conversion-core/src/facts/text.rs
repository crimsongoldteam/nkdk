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
    offset: usize,
    ids: HashMap<Arc<str>, TextId>,
    values: Vec<Arc<str>>,
    segments: Vec<Arc<PreparedText>>,
}

impl TextBuilder {
    pub fn new(generation: Generation, budget: TextBudget) -> Self {
        Self {
            text: PreparedText {
                generation,
                offset: 0,
                ids: HashMap::new(),
                values: Vec::new(),
                segments: Vec::new(),
            },
            budget,
            bytes: 0,
        }
    }

    /// Repeated text allocates nothing, including after reaching the budget.
    pub fn intern(&mut self, value: &str) -> Result<TextId, TextLimit> {
        if let FactState::Ready(id) = self.text.lookup(self.text.generation, value) {
            return Ok(id);
        }
        let count = self.text.offset + self.text.values.len();
        if count >= self.budget.entries || count.checked_add(1).is_none() {
            return Err(TextLimit::Entries);
        }
        let id = TextId(u32::try_from(count).map_err(|_| TextLimit::Entries)?);
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

    /// Freeze only new strings. Existing snapshots retain immutable segments.
    pub fn snapshot(&mut self) -> PreparedText {
        if !self.text.values.is_empty() {
            let next = self.text.offset + self.text.values.len();
            let next_text = PreparedText {
                generation: self.text.generation,
                offset: next,
                ids: HashMap::new(),
                values: Vec::new(),
                segments: Vec::new(),
            };
            let mut segment = std::mem::replace(&mut self.text, next_text);
            self.text.segments = std::mem::take(&mut segment.segments);
            self.text.segments.push(Arc::new(segment));
        }
        PreparedText {
            generation: self.text.generation,
            offset: self.text.offset,
            ids: HashMap::new(),
            values: Vec::new(),
            segments: self.text.segments.clone(),
        }
    }

    /// Final conversion uses a flat lookup table again, never a segment walk.
    pub fn finish(mut self) -> PreparedText {
        if self.text.segments.is_empty() {
            return self.text;
        }
        let mut ids = HashMap::with_capacity(self.text.offset + self.text.values.len());
        let mut values = Vec::with_capacity(self.text.offset + self.text.values.len());
        for segment in self.text.segments.drain(..) {
            match Arc::try_unwrap(segment) {
                Ok(segment) => {
                    ids.extend(segment.ids);
                    values.extend(segment.values);
                }
                Err(segment) => {
                    ids.extend(segment.ids.iter().map(|(text, id)| (Arc::clone(text), *id)));
                    values.extend(segment.values.iter().cloned());
                }
            }
        }
        ids.extend(self.text.ids);
        values.extend(self.text.values);
        PreparedText {
            generation: self.text.generation,
            offset: 0,
            ids,
            values,
            segments: Vec::new(),
        }
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
            .or_else(|| {
                self.segments
                    .iter()
                    .rev()
                    .find_map(|segment| segment.ids.get(value).copied())
            })
            .map_or(FactState::Missing, FactState::Ready)
    }

    pub fn resolve(&self, generation: Generation, id: TextId) -> FactState<&str> {
        if generation != self.generation {
            return FactState::Unready;
        }
        let index = id.0 as usize;
        if let Some(local) = index.checked_sub(self.offset) {
            return self
                .values
                .get(local)
                .map_or(FactState::Missing, |value| FactState::Ready(value));
        }
        let segment = self
            .segments
            .partition_point(|segment| segment.offset <= index);
        segment
            .checked_sub(1)
            .and_then(|slot| self.segments.get(slot))
            .map_or(FactState::Missing, |segment| {
                segment.resolve(generation, id)
            })
    }
}
