//! Explicit ownership and references of generated compilation units.
use std::collections::{BTreeMap, BTreeSet};

#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord)]
pub(crate) struct UnitId(pub String);
#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord)]
pub(crate) struct SymbolId(pub String);
#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct GeneratedUnit {
    pub id: UnitId,
    pub namespace: Vec<String>,
    pub definitions: BTreeSet<SymbolId>,
    pub references: BTreeSet<SymbolId>,
    pub source: String,
    pub source_kinds: BTreeSet<String>,
    pub files: Vec<(String, Vec<u8>)>,
}
#[derive(Debug, Default)]
pub(crate) struct UnitGraph {
    pub units: BTreeMap<UnitId, GeneratedUnit>,
    pub owners: BTreeMap<SymbolId, UnitId>,
}

impl UnitGraph {
    pub fn insert(&mut self, unit: GeneratedUnit) -> Result<(), String> {
        if self.units.contains_key(&unit.id) {
            return Err(format!("Duplicate generated unit: {}", unit.id.0));
        }
        for symbol in &unit.definitions {
            if let Some(owner) = self.owners.get(symbol) {
                return Err(format!(
                    "Duplicate generated symbol {} (owner {})",
                    symbol.0, owner.0
                ));
            }
        }
        for symbol in &unit.definitions {
            self.owners.insert(symbol.clone(), unit.id.clone());
        }
        self.units.insert(unit.id.clone(), unit);
        Ok(())
    }
}

#[cfg(test)]
impl GeneratedUnit {
    pub fn example(id: &str, definitions: &[&str], references: &[&str], source: &str) -> Self {
        Self {
            id: UnitId(id.into()),
            namespace: vec![],
            definitions: definitions.iter().map(|s| SymbolId((*s).into())).collect(),
            references: references.iter().map(|s| SymbolId((*s).into())).collect(),
            source: source.into(),
            source_kinds: BTreeSet::new(),
            files: vec![],
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn shared_units_require_unique_owners_without_partial_insertion() {
        let unit = |id: &str, definitions: &[&str]| GeneratedUnit {
            id: UnitId(id.into()),
            namespace: vec![],
            definitions: definitions.iter().map(|s| SymbolId((*s).into())).collect(),
            references: BTreeSet::new(),
            source: id.into(),
            source_kinds: BTreeSet::new(),
            files: vec![],
        };
        let mut graph = UnitGraph::default();
        graph.insert(unit("first", &["value", "path"])).unwrap();
        assert!(graph.insert(unit("second", &["new", "value"])).is_err());
        assert_eq!(graph.units.len(), 1);
        assert!(!graph.owners.contains_key(&SymbolId("new".into())));
        assert!(graph.insert(unit("first", &["other"])).is_err());
        assert_eq!(graph.units[&UnitId("first".into())].source, "first");
    }
}
