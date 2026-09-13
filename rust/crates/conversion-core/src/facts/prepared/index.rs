use super::*;

/// The catalog erases the index width once; rows retain fixed-size typed keys.
pub trait TextIndexBuilder: Send {
    fn push(&mut self, text: &mut TextBuilder, key: &[&str], value: &str) -> Result<(), FactLimit>;
    fn mark_unready(&mut self);
    fn finish(self: Box<Self>) -> Box<dyn PreparedTextIndex>;
}

pub trait PreparedTextIndex: Send + Sync {
    fn columns(&self) -> Option<&[&'static str]>;
    fn is_ready(&self, generation: Generation) -> bool;
    fn lookup<'a>(
        &'a self,
        text: &'a PreparedText,
        generation: Generation,
        key: &[&str],
    ) -> FactState<&'a str>;
}

struct Builder<const N: usize> {
    columns: Option<[&'static str; N]>,
    index: FactIndexBuilder<[TextId; N], TextId>,
}
struct Prepared<const N: usize> {
    columns: Option<[&'static str; N]>,
    index: FactIndex<[TextId; N], TextId>,
}

pub fn text_scalar_index(generation: Generation) -> Box<dyn TextIndexBuilder> {
    Box::new(Builder::<1> {
        columns: None,
        index: FactIndexBuilder::new(generation),
    })
}
pub fn text_record_index<const N: usize>(
    generation: Generation,
    columns: [&'static str; N],
) -> Box<dyn TextIndexBuilder> {
    Box::new(Builder {
        columns: Some(columns),
        index: FactIndexBuilder::new(generation),
    })
}

impl<const N: usize> TextIndexBuilder for Builder<N> {
    fn push(&mut self, text: &mut TextBuilder, key: &[&str], value: &str) -> Result<(), FactLimit> {
        if key.len() != N {
            return Err(FactLimit::KeyArity {
                expected: N,
                actual: key.len(),
            });
        }
        let mut ids = [TextId(0); N];
        for (id, part) in ids.iter_mut().zip(key) {
            *id = text.intern(part).map_err(FactLimit::Text)?;
        }
        let value = text.intern(value).map_err(FactLimit::Text)?;
        self.index.extend([(ids, value)]);
        Ok(())
    }
    fn mark_unready(&mut self) {
        self.index.mark_unready();
    }
    fn finish(self: Box<Self>) -> Box<dyn PreparedTextIndex> {
        Box::new(Prepared {
            columns: self.columns,
            index: self.index.finish(),
        })
    }
}

impl<const N: usize> PreparedTextIndex for Prepared<N> {
    fn columns(&self) -> Option<&[&'static str]> {
        self.columns.as_ref().map(|columns| columns.as_slice())
    }
    fn is_ready(&self, generation: Generation) -> bool {
        self.index.ready && self.index.generation == generation
    }
    fn lookup<'a>(
        &'a self,
        text: &'a PreparedText,
        generation: Generation,
        key: &[&str],
    ) -> FactState<&'a str> {
        // Completeness precedes text lookup: an unread source may contain a new spelling.
        if !self.is_ready(generation) || key.len() != N {
            return FactState::Unready;
        }
        let mut ids = [TextId(0); N];
        for (id, part) in ids.iter_mut().zip(key) {
            match text.lookup(generation, part) {
                FactState::Ready(value) => *id = value,
                FactState::Missing => return FactState::Missing,
                _ => return FactState::Unready,
            }
        }
        match self.index.lookup(generation, &ids) {
            FactState::Ready(value) => text.resolve(generation, *value),
            FactState::Missing => FactState::Missing,
            FactState::Ambiguous => FactState::Ambiguous,
            FactState::Cycle => FactState::Cycle,
            FactState::Unready => FactState::Unready,
        }
    }
}
