//! Deterministic placement of indivisible generated groups.
use super::{
    shared_graph::Component,
    shared_units::{UnitGraph, UnitId},
};
use std::collections::BTreeMap;

#[derive(Debug, Clone, PartialEq, Eq)]
pub(super) struct Package {
    pub units: Vec<UnitId>,
    pub rust_bytes: usize,
    pub level: usize,
}
#[derive(Debug, Clone, PartialEq, Eq)]
pub(super) struct Layout {
    pub packages: Vec<Package>,
    pub owners: BTreeMap<UnitId, usize>,
}

pub(super) fn place(
    graph: &UnitGraph,
    groups: &[Component],
    budget: usize,
) -> Result<Layout, String> {
    if budget == 0 {
        return Err("shared_unit_budget_exceeded: zero budget".into());
    }
    let mut layout = Layout {
        packages: Vec::new(),
        owners: BTreeMap::new(),
    };
    for group in groups {
        let bytes = group
            .members
            .iter()
            .try_fold(0usize, |total, id| {
                total.checked_add(graph.units[id].source.len())
            })
            .ok_or("shared_unit_budget_exceeded: size overflow")?;
        if bytes > budget {
            return Err(format!(
                "shared_unit_budget_exceeded: {} bytes > {budget}; units: {:?}",
                bytes, group.members
            ));
        }
        let level = group
            .dependencies
            .iter()
            .map(|id| layout.packages[layout.owners[id]].level + 1)
            .max()
            .unwrap_or(0);
        // Each indivisible component has a stable owner; unrelated additions
        // must not change the source/contract of an existing library.
        let package = layout.packages.len();
        layout.packages.push(Package {
            units: vec![],
            rust_bytes: 0,
            level,
        });
        let target = &mut layout.packages[package];
        target.rust_bytes += bytes;
        for id in &group.members {
            target.units.push(id.clone());
            layout.owners.insert(id.clone(), package);
        }
    }
    Ok(layout)
}

#[cfg(test)]
mod tests {
    use super::super::{shared_graph::components, shared_units::*};
    use super::*;
    #[test]
    fn layout_preserves_one_owner_and_enforces_indivisible_budget() {
        let mut graph = UnitGraph::default();
        for (name, references, bytes) in [
            ("shared", vec![], 5),
            ("left", vec!["shared"], 6),
            ("right", vec!["shared"], 6),
        ] {
            graph
                .insert(GeneratedUnit::example(
                    name,
                    &[name],
                    &references,
                    &"x".repeat(bytes),
                ))
                .unwrap();
        }
        let groups =
            components(&graph, &[SymbolId("left".into()), SymbolId("right".into())]).unwrap();
        let layout = place(&graph, &groups, 11).unwrap();
        assert_eq!(layout.packages.len(), 3);
        assert_eq!(layout.owners.len(), 3);
        assert!(layout.packages.iter().all(|p| p.rust_bytes <= 11));
        assert_eq!(layout, place(&graph, &groups, 11).unwrap());
        let error = place(&graph, &groups, 4).unwrap_err();
        assert!(error.contains("shared_unit_budget_exceeded"));
        assert!(error.contains("shared"));
        assert!(place(&graph, &groups, 0).is_err());
    }
}
