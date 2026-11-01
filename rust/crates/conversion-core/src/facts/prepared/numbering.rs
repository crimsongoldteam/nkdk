//! Requests are completed only after every retained value has been reserved.
use super::*;
use std::collections::{HashMap, HashSet};

struct NumberRequest<const N: usize> {
    key: [TextId; N],
    first: u64,
    phase: u32,
    order: usize,
}

struct NumberBuilder<const N: usize, const S: usize> {
    inner: Builder<N>,
    scope: [usize; S],
    known: HashSet<[TextId; N]>,
    occupied: HashMap<[TextId; S], HashSet<u64>>,
    requests: Vec<NumberRequest<N>>,
    next_order: usize,
    requested: HashMap<[TextId; N], usize>,
    failed: Option<FactLimit>,
}

pub fn text_number_index<const N: usize, const S: usize>(
    generation: Generation,
    columns: [&'static str; N],
    scope: [usize; S],
    coalesce_equal: bool,
) -> Box<dyn TextIndexBuilder> {
    Box::new(NumberBuilder {
        inner: Builder {
            coalesce_equal,
            columns: Some(columns),
            index: FactIndexBuilder::new(generation),
        },
        scope,
        known: HashSet::new(),
        occupied: HashMap::new(),
        requests: Vec::new(),
        next_order: 0,
        requested: HashMap::new(),
        failed: None,
    })
}

impl<const N: usize, const S: usize> NumberBuilder<N, S> {
    fn reserve(&mut self, scope: [TextId; S], value: &str) {
        // Only exact canonical positive numbers can collide with generated ids.
        // Other spellings are retained by the source, not reinterpreted here.
        if let Some(number) = crate::facts::positive_number(value) {
            self.occupied.entry(scope).or_default().insert(number);
        }
    }
    fn scope(&self, key: &[TextId; N]) -> Result<[TextId; S], FactLimit> {
        let mut scope = [TextId(0); S];
        for (value, slot) in scope.iter_mut().zip(self.scope) {
            *value = *key.get(slot).ok_or(FactLimit::WrongIndexKind)?;
        }
        Ok(scope)
    }
    fn allocate(&mut self, text: &mut TextBuilder) -> Result<(), FactLimit> {
        let mut cursors = HashMap::<[TextId; S], Option<u64>>::new();
        let mut requests = std::mem::take(&mut self.requests);
        if !requests.is_sorted_by_key(|request| (request.phase, request.order)) {
            requests.sort_unstable_by_key(|request| (request.phase, request.order));
        }
        for NumberRequest { key, first, .. } in requests {
            if self.known.contains(&key) {
                continue;
            }
            let scope = self.scope(&key)?;
            let cursor = cursors.entry(scope).or_insert(Some(first));
            let mut next = cursor.ok_or(FactLimit::NumberExhausted)?.max(first);
            let used = self.occupied.entry(scope).or_default();
            while used.contains(&next) {
                next = next.checked_add(1).ok_or(FactLimit::NumberExhausted)?;
            }
            let value = text.intern(&next.to_string()).map_err(FactLimit::Text)?;
            self.inner.index.extend([(key, value)]);
            used.insert(next);
            *cursor = next.checked_add(1);
        }
        Ok(())
    }
}

impl<const N: usize, const S: usize> TextIndexBuilder for NumberBuilder<N, S> {
    fn push(&mut self, text: &mut TextBuilder, key: &[&str], value: &str) -> Result<(), FactLimit> {
        let key = intern_key(text, key)?;
        let scope = self.scope(&key)?;
        let stored = text.intern(value).map_err(FactLimit::Text)?;
        self.known.insert(key);
        self.reserve(scope, value);
        self.inner.index.extend([(key, stored)]);
        Ok(())
    }
    fn reserve_number(
        &mut self,
        text: &mut TextBuilder,
        scope: &[&str],
        value: &str,
    ) -> Result<(), FactLimit> {
        let scope = intern_key(text, scope)?;
        self.reserve(scope, value);
        Ok(())
    }
    fn request_number(
        &mut self,
        text: &mut TextBuilder,
        key: &[&str],
        first: u64,
    ) -> Result<(), FactLimit> {
        self.request_number_in_phase(text, key, first, 0)
    }
    fn request_number_in_phase(
        &mut self,
        text: &mut TextBuilder,
        key: &[&str],
        first: u64,
        phase: u32,
    ) -> Result<(), FactLimit> {
        if first == 0 {
            return Err(FactLimit::WrongIndexKind);
        }
        let key = intern_key(text, key)?;
        self.scope(&key)?;
        if let Some(slot) = self.requested.get(&key) {
            let request = &mut self.requests[*slot];
            if phase < request.phase {
                request.phase = phase;
                request.first = first;
                request.order = self.next_order;
                self.next_order = self
                    .next_order
                    .checked_add(1)
                    .ok_or(FactLimit::NumberExhausted)?;
            } else if phase == request.phase {
                request.first = request.first.max(first);
            }
        } else {
            self.requested.insert(key, self.requests.len());
            let order = self.next_order;
            self.next_order = self
                .next_order
                .checked_add(1)
                .ok_or(FactLimit::NumberExhausted)?;
            self.requests.push(NumberRequest {
                key,
                first,
                phase,
                order,
            });
        }
        Ok(())
    }
    fn seal(&mut self, text: &mut TextBuilder) -> Result<(), FactLimit> {
        if let Some(limit) = self.failed {
            return Err(limit);
        }
        if let Err(limit) = self.allocate(text) {
            self.mark_unready();
            self.failed = Some(limit);
            return Err(limit);
        }
        Ok(())
    }
    fn mark_unready(&mut self) {
        self.inner.index.mark_unready();
    }
    fn finish(self: Box<Self>) -> Box<dyn PreparedTextIndex> {
        Box::new(self.inner).finish()
    }
}
