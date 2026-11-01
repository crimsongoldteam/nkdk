use super::*;
#[path = "numbering.rs"]
mod numbering;
use crate::facts::graph::{
    GraphBudget, GraphLimit, NamedAlternative, NamedUnionGraph, NamedValues,
};
pub use numbering::text_number_index;

/// The catalog erases the index width once; rows retain fixed-size typed keys.
pub trait TextIndexBuilder: Send {
    fn push(&mut self, text: &mut TextBuilder, key: &[&str], value: &str) -> Result<(), FactLimit>;
    fn reserve_number(
        &mut self,
        _text: &mut TextBuilder,
        _scope: &[&str],
        _value: &str,
    ) -> Result<(), FactLimit> {
        Err(FactLimit::WrongIndexKind)
    }
    fn request_number(
        &mut self,
        _text: &mut TextBuilder,
        _key: &[&str],
        _first: u64,
    ) -> Result<(), FactLimit> {
        Err(FactLimit::WrongIndexKind)
    }
    fn request_number_in_phase(
        &mut self,
        _text: &mut TextBuilder,
        _key: &[&str],
        _first: u64,
        _phase: u32,
    ) -> Result<(), FactLimit> {
        Err(FactLimit::WrongIndexKind)
    }
    fn seal(&mut self, _text: &mut TextBuilder) -> Result<(), FactLimit> {
        Ok(())
    }
    fn begin_union(&mut self, _text: &mut TextBuilder, _name: &str) -> Result<(), FactLimit> {
        Err(FactLimit::WrongIndexKind)
    }
    fn push_union(&mut self, _text: &mut TextBuilder, _value: &str) -> Result<(), FactLimit> {
        Err(FactLimit::WrongIndexKind)
    }
    fn mark_unready(&mut self);
    fn finish(self: Box<Self>) -> Box<dyn PreparedTextIndex>;
}

pub trait PreparedTextIndex: Send + Sync {
    fn is_union(&self) -> bool {
        false
    }
    fn columns(&self) -> Option<&[&'static str]>;
    fn is_ready(&self, generation: Generation) -> bool;
    fn lookup<'a>(
        &'a self,
        text: &'a PreparedText,
        generation: Generation,
        key: &[&str],
    ) -> FactState<&'a str>;
    fn lookup_union<'a>(
        &'a self,
        _text: &'a PreparedText,
        _generation: Generation,
        _name: &str,
    ) -> FactState<TextUnionValues<'a>> {
        FactState::Unready
    }
    fn graph_limit(&self) -> Option<GraphLimit> {
        None
    }
}

pub struct TextUnionValues<'a> {
    values: NamedValues<'a, TextId>,
    text: &'a PreparedText,
    generation: Generation,
}
impl TextUnionValues<'_> {
    pub fn is_empty(&self) -> bool {
        self.values.len() == 0
    }
}

impl Clone for TextUnionValues<'_> {
    fn clone(&self) -> Self {
        Self {
            values: self.values.clone(),
            text: self.text,
            generation: self.generation,
        }
    }
}

impl<'a> Iterator for TextUnionValues<'a> {
    type Item = &'a str;

    fn next(&mut self) -> Option<Self::Item> {
        let id = *self.values.next()?;
        match self.text.resolve(self.generation, id) {
            FactState::Ready(value) => Some(value),
            _ => unreachable!("union values were interned in this generation"),
        }
    }

    fn size_hint(&self) -> (usize, Option<usize>) {
        self.values.size_hint()
    }
}
impl ExactSizeIterator for TextUnionValues<'_> {}

struct UnionBuilder {
    generation: Generation,
    prefix: &'static str,
    budget: GraphBudget,
    definitions: Vec<(String, Vec<NamedAlternative<TextId>>)>,
    current: Option<usize>,
    ready: bool,
}

struct UnionPrepared {
    generation: Generation,
    graph: Option<NamedUnionGraph<TextId>>,
    limit: Option<GraphLimit>,
    ready: bool,
}

pub fn text_union_index(
    generation: Generation,
    reference_prefix: &'static str,
    budget: GraphBudget,
) -> Box<dyn TextIndexBuilder> {
    Box::new(UnionBuilder {
        generation,
        prefix: reference_prefix,
        budget,
        definitions: Vec::new(),
        current: None,
        ready: true,
    })
}

impl TextIndexBuilder for UnionBuilder {
    fn push(
        &mut self,
        _text: &mut TextBuilder,
        _key: &[&str],
        _value: &str,
    ) -> Result<(), FactLimit> {
        Err(FactLimit::WrongIndexKind)
    }
    fn begin_union(&mut self, text: &mut TextBuilder, name: &str) -> Result<(), FactLimit> {
        text.intern(name).map_err(FactLimit::Text)?;
        self.definitions.push((name.to_owned(), Vec::new()));
        self.current = Some(self.definitions.len() - 1);
        Ok(())
    }
    fn push_union(&mut self, text: &mut TextBuilder, value: &str) -> Result<(), FactLimit> {
        let current = self.current.ok_or(FactLimit::WrongIndexKind)?;
        let alternative = if value.starts_with(self.prefix) {
            NamedAlternative::Reference(value.to_owned())
        } else {
            NamedAlternative::Value(text.intern(value).map_err(FactLimit::Text)?)
        };
        self.definitions[current].1.push(alternative);
        Ok(())
    }
    fn mark_unready(&mut self) {
        self.ready = false;
    }
    fn finish(self: Box<Self>) -> Box<dyn PreparedTextIndex> {
        let (graph, limit) = if self.ready {
            match NamedUnionGraph::prepare(self.generation, self.definitions, self.budget) {
                Ok(graph) => (Some(graph), None),
                Err(limit) => (None, Some(limit)),
            }
        } else {
            (None, None)
        };
        Box::new(UnionPrepared {
            generation: self.generation,
            graph,
            limit,
            ready: self.ready,
        })
    }
}

impl PreparedTextIndex for UnionPrepared {
    fn is_union(&self) -> bool {
        true
    }
    fn columns(&self) -> Option<&[&'static str]> {
        None
    }
    fn is_ready(&self, generation: Generation) -> bool {
        self.ready && self.generation == generation && self.graph.is_some()
    }
    fn lookup<'a>(
        &'a self,
        _text: &'a PreparedText,
        _generation: Generation,
        _key: &[&str],
    ) -> FactState<&'a str> {
        FactState::Unready
    }
    fn lookup_union<'a>(
        &'a self,
        text: &'a PreparedText,
        generation: Generation,
        name: &str,
    ) -> FactState<TextUnionValues<'a>> {
        let Some(graph) = self.graph.as_ref().filter(|_| self.is_ready(generation)) else {
            return FactState::Unready;
        };
        graph
            .lookup_values(generation, name)
            .map(|values| TextUnionValues {
                values,
                text,
                generation,
            })
    }
    fn graph_limit(&self) -> Option<GraphLimit> {
        self.limit
    }
}

struct Builder<const N: usize> {
    coalesce_equal: bool,
    columns: Option<[&'static str; N]>,
    index: FactIndexBuilder<[TextId; N], TextId>,
}
struct Prepared<const N: usize> {
    columns: Option<[&'static str; N]>,
    index: FactIndex<[TextId; N], TextId>,
}

pub fn text_scalar_index(generation: Generation) -> Box<dyn TextIndexBuilder> {
    text_scalar_index_with_coalescing(generation, false)
}
pub fn text_scalar_index_with_coalescing(
    generation: Generation,
    coalesce_equal: bool,
) -> Box<dyn TextIndexBuilder> {
    Box::new(Builder::<1> {
        coalesce_equal,
        columns: None,
        index: FactIndexBuilder::new(generation),
    })
}
pub fn text_record_index<const N: usize>(
    generation: Generation,
    columns: [&'static str; N],
) -> Box<dyn TextIndexBuilder> {
    text_record_index_with_coalescing(generation, columns, false)
}
pub fn text_record_index_with_coalescing<const N: usize>(
    generation: Generation,
    columns: [&'static str; N],
    coalesce_equal: bool,
) -> Box<dyn TextIndexBuilder> {
    Box::new(Builder {
        coalesce_equal,
        columns: Some(columns),
        index: FactIndexBuilder::new(generation),
    })
}

impl<const N: usize> TextIndexBuilder for Builder<N> {
    fn push(&mut self, text: &mut TextBuilder, key: &[&str], value: &str) -> Result<(), FactLimit> {
        let ids = intern_key(text, key)?;
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
            index: if self.coalesce_equal {
                self.index.finish_coalesced()
            } else {
                self.index.finish()
            },
        })
    }
}

fn intern_key<const N: usize>(
    text: &mut TextBuilder,
    key: &[&str],
) -> Result<[TextId; N], FactLimit> {
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
    Ok(ids)
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
