//! Generation-scoped union expansion over projected node identifiers.
use super::{FactState, Generation};
use std::{collections::VecDeque, sync::Arc};

#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
pub struct NodeId(pub u32);

pub enum UnionNode<T> {
    Value(T),
    Union(Vec<NodeId>),
    Missing,
    Ambiguous,
    Unready,
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
    ) -> Result<Self, GraphLimit> {
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
                UnionNode::Value(_) => {
                    available = available.checked_sub(1).ok_or(GraphLimit::Members)?;
                    FactState::Ready(Arc::from([NodeId(index as u32)]))
                }
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
    members.sort_unstable();
    *available -= members.len();
    Ok(FactState::Ready(members.into()))
}
