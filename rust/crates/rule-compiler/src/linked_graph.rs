//! Shared reference graph for build-time profiles and recursive code emission.
use nkdk_rule_model::{LinkedEntry, LinkedType};
use std::collections::{BTreeMap, BTreeSet};

pub(crate) struct ReferenceGraph(BTreeMap<u32, Vec<u32>>);
impl ReferenceGraph {
    pub(crate) fn new(entries: &[LinkedEntry]) -> Self {
        Self(
            entries
                .iter()
                .map(|entry| {
                    let mut edges = Vec::new();
                    references(&entry.value, &mut edges);
                    (entry.id, edges)
                })
                .collect(),
        )
    }
    pub(crate) fn reachable(&self, roots: impl IntoIterator<Item = u32>) -> BTreeSet<u32> {
        let mut pending: Vec<_> = roots.into_iter().collect();
        let mut found = BTreeSet::new();
        while let Some(id) = pending.pop() {
            if found.insert(id) {
                pending.extend(self.0.get(&id).expect("linked reference"));
            }
        }
        found
    }
    pub(crate) fn recursive(&self, id: u32) -> bool {
        self.reachable(self.0[&id].iter().copied()).contains(&id)
    }
}
fn references(value: &LinkedType, out: &mut Vec<u32>) {
    match value {
        LinkedType::Reference(id) | LinkedType::BoundReference { entry: id, .. } => out.push(*id),
        LinkedType::Index { key, value } => {
            references(key, out);
            references(value, out);
        }
        LinkedType::Optional(value) | LinkedType::Sequence(value) => references(value, out),
        LinkedType::Choice(fields) | LinkedType::Record(fields) => {
            for field in fields {
                references(&field.value, out);
            }
        }
        _ => {}
    }
}
