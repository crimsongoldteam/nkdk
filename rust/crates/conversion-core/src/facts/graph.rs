//! Generation-scoped union expansion over projected node identifiers.
use super::{FactState, Generation};
use std::{
    collections::{HashMap, HashSet, VecDeque},
    hash::Hash,
    sync::Arc,
};

#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
pub struct NodeId(pub u32);

pub enum UnionNode<T> {
    Value(T),
    Union(Vec<NodeId>),
    Missing,
    Ambiguous,
    Unready,
}

/// A named declaration contains direct values and references to other names.
/// The subject-specific syntax is decoded before constructing this graph.
pub enum NamedAlternative<T> {
    Value(T),
    Reference(String),
}

pub struct NamedUnionGraph<T> {
    names: HashMap<String, NodeId>,
    graph: UnionGraph<T>,
}

#[derive(Clone)]
pub struct NamedValues<'a, T> {
    graph: &'a NamedUnionGraph<T>,
    ids: &'a [NodeId],
    cursor: usize,
}

impl<'a, T> Iterator for NamedValues<'a, T> {
    type Item = &'a T;

    fn next(&mut self) -> Option<Self::Item> {
        let node = *self.ids.get(self.cursor)?;
        self.cursor += 1;
        Some(
            self.graph
                .value(node)
                .expect("expanded node must contain a value"),
        )
    }

    fn size_hint(&self) -> (usize, Option<usize>) {
        let remaining = self.ids.len() - self.cursor;
        (remaining, Some(remaining))
    }
}

impl<T> ExactSizeIterator for NamedValues<'_, T> {}

impl<T> NamedUnionGraph<T> {
    pub fn prepare(
        generation: Generation,
        definitions: Vec<(String, Vec<NamedAlternative<T>>)>,
        budget: GraphBudget,
    ) -> Result<Self, GraphLimit>
    where
        T: Eq + Hash,
    {
        if definitions.len() > budget.nodes || definitions.len() > u32::MAX as usize {
            return Err(GraphLimit::Nodes);
        }
        let mut names = HashMap::with_capacity(definitions.len());
        let mut duplicates = HashSet::new();
        for (index, (name, _)) in definitions.iter().enumerate() {
            if names.insert(name.clone(), NodeId(index as u32)).is_some() {
                duplicates.insert(name.clone());
            }
        }
        let value_count = definitions
            .iter()
            .filter(|(name, _)| !duplicates.contains(name))
            .try_fold(0usize, |count, (_, alternatives)| {
                count.checked_add(
                    alternatives
                        .iter()
                        .filter(|item| matches!(item, NamedAlternative::Value(_)))
                        .count(),
                )
            })
            .ok_or(GraphLimit::Nodes)?;
        let total = definitions
            .len()
            .checked_add(value_count)
            .ok_or(GraphLimit::Nodes)?;
        if total > budget.nodes || total > u32::MAX as usize {
            return Err(GraphLimit::Nodes);
        }
        let mut nodes = (0..definitions.len())
            .map(|_| UnionNode::Unready)
            .collect::<Vec<_>>();
        for (index, (name, alternatives)) in definitions.into_iter().enumerate() {
            if duplicates.contains(&name) {
                nodes[index] = UnionNode::Ambiguous;
                continue;
            }
            if alternatives.is_empty() {
                continue;
            }
            let mut edges = Vec::with_capacity(alternatives.len());
            for alternative in alternatives {
                match alternative {
                    NamedAlternative::Value(value) => {
                        edges.push(NodeId(nodes.len() as u32));
                        nodes.push(UnionNode::Value(value));
                    }
                    NamedAlternative::Reference(name) => {
                        edges.push(names.get(&name).copied().unwrap_or(NodeId(u32::MAX)));
                    }
                }
            }
            nodes[index] = UnionNode::Union(edges);
        }
        let graph = UnionGraph::prepare(generation, nodes, budget)?;
        Ok(Self { names, graph })
    }

    pub fn lookup(&self, generation: Generation, name: &str) -> FactState<&[NodeId]> {
        self.graph.lookup(
            generation,
            self.names.get(name).copied().unwrap_or(NodeId(u32::MAX)),
        )
    }

    pub fn value(&self, node: NodeId) -> Option<&T> {
        self.graph.value(node)
    }

    /// Borrow effective alternatives without allocating a second value list.
    pub fn lookup_values(
        &self,
        generation: Generation,
        name: &str,
    ) -> FactState<NamedValues<'_, T>> {
        self.lookup(generation, name).map(|ids| NamedValues {
            graph: self,
            ids,
            cursor: 0,
        })
    }
}

pub struct GraphBudget {
    pub nodes: usize,
    pub edges: usize,
    /// Total members of newly allocated expansions; aliases share storage.
    pub members: usize,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum GraphLimit {
    Nodes,
    Edges,
    Members,
}

pub struct UnionGraph<T> {
    generation: Generation,
    values: Vec<Option<T>>,
    expansions: Vec<FactState<Arc<[NodeId]>>>,
}

impl<T> UnionGraph<T> {
    pub fn prepare(
        generation: Generation,
        nodes: Vec<UnionNode<T>>,
        budget: GraphBudget,
    ) -> Result<Self, GraphLimit>
    where
        T: Eq + Hash,
    {
        if nodes.len() > budget.nodes || nodes.len() > u32::MAX as usize {
            return Err(GraphLimit::Nodes);
        }
        let mut edge_count = 0usize;
        for node in &nodes {
            if let UnionNode::Union(edges) = node {
                edge_count = edge_count
                    .checked_add(edges.len())
                    .ok_or(GraphLimit::Edges)?;
                if edge_count > budget.edges {
                    return Err(GraphLimit::Edges);
                }
            }
        }
        // Repeated leaves share one identity. A union therefore removes equal
        // alternatives even when they came from different declarations.
        let mut unique = HashMap::<&T, NodeId>::new();
        let canonical: Vec<_> = nodes
            .iter()
            .enumerate()
            .map(|(index, node)| match node {
                UnionNode::Value(value) => {
                    Some(*unique.entry(value).or_insert(NodeId(index as u32)))
                }
                _ => None,
            })
            .collect();
        drop(unique);
        let mut parents = vec![Vec::new(); nodes.len()];
        let mut pending = vec![0usize; nodes.len()];
        for (index, node) in nodes.iter().enumerate() {
            if let UnionNode::Union(edges) = node {
                for &NodeId(child) in edges {
                    if let Some(parents) = parents.get_mut(child as usize) {
                        parents.push(index);
                        pending[index] += 1;
                    }
                }
            }
        }
        let mut ready: VecDeque<_> = pending
            .iter()
            .enumerate()
            .filter_map(|(index, count)| (*count == 0).then_some(index))
            .collect();
        let mut expansions = vec![FactState::Unready; nodes.len()];
        let mut available = budget.members;
        let mut seen = vec![false; nodes.len()];
        while let Some(index) = ready.pop_front() {
            expansions[index] = match &nodes[index] {
                UnionNode::Value(_) => match canonical[index] {
                    Some(NodeId(id)) if id as usize != index => expansions[id as usize].clone(),
                    Some(id) => {
                        available = available.checked_sub(1).ok_or(GraphLimit::Members)?;
                        FactState::Ready(Arc::from([id]))
                    }
                    None => unreachable!("value has a canonical identity"),
                },
                UnionNode::Missing => FactState::Missing,
                UnionNode::Ambiguous => FactState::Ambiguous,
                UnionNode::Unready => FactState::Unready,
                UnionNode::Union(edges) => expand(edges, &expansions, &mut available, &mut seen)?,
            };
            for &parent in &parents[index] {
                pending[parent] -= 1;
                if pending[parent] == 0 {
                    ready.push_back(parent);
                }
            }
        }
        // Exactly the nodes in or depending on cycles remain after leaf removal.
        for (index, count) in pending.into_iter().enumerate() {
            if count != 0 {
                expansions[index] = FactState::Cycle;
            }
        }
        let values = nodes
            .into_iter()
            .map(|node| match node {
                UnionNode::Value(value) => Some(value),
                _ => None,
            })
            .collect();
        Ok(Self {
            generation,
            values,
            expansions,
        })
    }

    pub fn lookup(&self, generation: Generation, node: NodeId) -> FactState<&[NodeId]> {
        if generation != self.generation {
            return FactState::Unready;
        }
        match self.expansions.get(node.0 as usize) {
            Some(FactState::Ready(values)) => FactState::Ready(values),
            Some(FactState::Ambiguous) => FactState::Ambiguous,
            Some(FactState::Cycle) => FactState::Cycle,
            Some(FactState::Unready) => FactState::Unready,
            _ => FactState::Missing,
        }
    }

    pub fn value(&self, node: NodeId) -> Option<&T> {
        self.values.get(node.0 as usize).and_then(Option::as_ref)
    }
}

fn expand(
    edges: &[NodeId],
    prepared: &[FactState<Arc<[NodeId]>>],
    available: &mut usize,
    seen: &mut [bool],
) -> Result<FactState<Arc<[NodeId]>>, GraphLimit> {
    let mut failure = 0;
    for &NodeId(id) in edges {
        let rank = match prepared.get(id as usize) {
            Some(FactState::Ready(_)) => 0,
            Some(FactState::Ambiguous) => 2,
            Some(FactState::Unready | FactState::Cycle) => 3,
            _ => 1,
        };
        failure = failure.max(rank);
    }
    match failure {
        3 => return Ok(FactState::Unready),
        2 => return Ok(FactState::Ambiguous),
        1 => return Ok(FactState::Missing),
        _ => (),
    }
    if let [NodeId(id)] = edges {
        return Ok(prepared[*id as usize].clone());
    }
    let mut members = Vec::new();
    for &NodeId(id) in edges {
        let FactState::Ready(values) = &prepared[id as usize] else {
            unreachable!("checked dependencies")
        };
        for &value in values.iter() {
            if !seen[value.0 as usize] {
                if members.len() == *available {
                    return Err(GraphLimit::Members);
                }
                seen[value.0 as usize] = true;
                members.push(value);
            }
        }
    }
    for value in &members {
        seen[value.0 as usize] = false;
    }
    *available -= members.len();
    Ok(FactState::Ready(members.into()))
}
