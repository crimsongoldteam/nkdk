//! Reachability and indivisible cycles in the generated symbol graph.
use super::shared_units::{SymbolId, UnitGraph, UnitId};
use std::collections::{BTreeMap, BTreeSet};

#[derive(Debug, Clone, PartialEq, Eq)]
pub(super) struct Component {
    pub members: Vec<UnitId>,
    pub dependencies: BTreeSet<UnitId>,
}

pub(super) fn components(
    graph: &UnitGraph,
    exports: &[SymbolId],
) -> Result<Vec<Component>, String> {
    let owner = |symbol: &SymbolId| {
        graph
            .owners
            .get(symbol)
            .cloned()
            .ok_or_else(|| format!("Unresolved generated symbol: {}", symbol.0))
    };
    let mut pending = exports.iter().map(owner).collect::<Result<Vec<_>, _>>()?;
    let mut edges = BTreeMap::<UnitId, BTreeSet<UnitId>>::new();
    while let Some(id) = pending.pop() {
        if edges.contains_key(&id) {
            continue;
        }
        let dependencies = graph.units[&id]
            .references
            .iter()
            .map(owner)
            .collect::<Result<BTreeSet<_>, _>>()?;
        pending.extend(dependencies.iter().cloned());
        edges.insert(id, dependencies);
    }
    // Iterative Kosaraju: declaration depth must not consume the Rust stack.
    let mut visited = BTreeSet::new();
    let mut finished = Vec::new();
    for start in edges.keys() {
        let mut stack = vec![(start.clone(), false)];
        while let Some((id, exiting)) = stack.pop() {
            if exiting {
                finished.push(id);
                continue;
            }
            if !visited.insert(id.clone()) {
                continue;
            }
            stack.push((id.clone(), true));
            stack.extend(edges[&id].iter().rev().cloned().map(|id| (id, false)));
        }
    }
    let mut reverse: BTreeMap<_, BTreeSet<_>> = edges
        .keys()
        .cloned()
        .map(|id| (id, BTreeSet::new()))
        .collect();
    for (id, dependencies) in &edges {
        for dependency in dependencies {
            reverse.get_mut(dependency).unwrap().insert(id.clone());
        }
    }
    let mut groups = Vec::new();
    let mut membership = BTreeMap::new();
    for start in finished.into_iter().rev() {
        if membership.contains_key(&start) {
            continue;
        }
        let index = groups.len();
        let mut members = Vec::new();
        let mut stack = vec![start];
        while let Some(id) = stack.pop() {
            if membership.contains_key(&id) {
                continue;
            }
            membership.insert(id.clone(), index);
            stack.extend(reverse[&id].iter().cloned());
            members.push(id);
        }
        members.sort();
        groups.push(Component {
            members,
            dependencies: BTreeSet::new(),
        });
    }
    for (index, group) in groups.iter_mut().enumerate() {
        for member in &group.members {
            group.dependencies.extend(
                edges[member]
                    .iter()
                    .filter(|dependency| membership[*dependency] != index)
                    .cloned(),
            );
        }
    }
    let mut ready = BTreeSet::new();
    let mut remaining = Vec::new();
    let mut consumers = vec![BTreeSet::new(); groups.len()];
    for (index, group) in groups.iter().enumerate() {
        let dependencies: BTreeSet<_> =
            group.dependencies.iter().map(|id| membership[id]).collect();
        if dependencies.is_empty() {
            ready.insert((group.members[0].clone(), index));
        }
        remaining.push(dependencies.len());
        for dependency in dependencies {
            consumers[dependency].insert(index);
        }
    }
    let mut ordered = Vec::with_capacity(groups.len());
    while let Some((_, index)) = ready.pop_first() {
        ordered.push(groups[index].clone());
        for &consumer in &consumers[index] {
            remaining[consumer] -= 1;
            if remaining[consumer] == 0 {
                ready.insert((groups[consumer].members[0].clone(), consumer));
            }
        }
    }
    debug_assert_eq!(ordered.len(), groups.len());
    Ok(ordered)
}

#[cfg(test)]
mod tests {
    use super::super::shared_units::{GeneratedUnit, SymbolId, UnitGraph, UnitId};
    use super::*;

    #[test]
    fn shared_graph_resolves_owners_cycles_and_reachability() {
        let mut graph = UnitGraph::default();
        for (id, symbols, links) in [
            ("left", vec!["left"], vec!["shared", "cycle-a"]),
            ("right", vec!["right"], vec!["shared"]),
            ("shared", vec!["shared"], vec![]),
            ("a", vec!["cycle-a"], vec!["cycle-b"]),
            ("b", vec!["cycle-b"], vec!["cycle-a", "shared"]),
            ("unused", vec!["unused"], vec![]),
        ] {
            graph
                .insert(GeneratedUnit::example(id, &symbols, &links, id))
                .unwrap();
        }
        let groups =
            components(&graph, &[SymbolId("left".into()), SymbolId("right".into())]).unwrap();
        assert_eq!(groups.len(), 4);
        assert!(
            groups
                .iter()
                .any(|group| group.members == [UnitId("a".into()), UnitId("b".into())])
        );
        assert!(
            !groups
                .iter()
                .any(|group| group.members.contains(&UnitId("unused".into())))
        );
        let positions: std::collections::BTreeMap<_, _> = groups
            .iter()
            .enumerate()
            .flat_map(|(i, group)| group.members.iter().cloned().map(move |id| (id, i)))
            .collect();
        for (i, group) in groups.iter().enumerate() {
            for dependency in &group.dependencies {
                assert!(positions[dependency] < i);
            }
        }
        let original = groups;
        let mut reversed = UnitGraph::default();
        for unit in graph.units.values().rev() {
            reversed.insert(unit.clone()).unwrap();
        }
        assert_eq!(
            original,
            components(
                &reversed,
                &[SymbolId("right".into()), SymbolId("left".into())]
            )
            .unwrap()
        );
        graph
            .units
            .get_mut(&UnitId("right".into()))
            .unwrap()
            .references
            .insert(SymbolId("missing".into()));
        assert!(
            components(&graph, &[SymbolId("right".into())])
                .unwrap_err()
                .contains("missing")
        );
    }
}
