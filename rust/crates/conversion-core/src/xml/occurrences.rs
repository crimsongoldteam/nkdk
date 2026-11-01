use super::Name;
use std::collections::BTreeMap;

/// One-based sibling positions, counted separately for each expanded XML name.
#[derive(Default)]
pub(crate) struct Occurrences {
    siblings: Vec<BTreeMap<Name, usize>>,
    path: Vec<usize>,
}
impl Occurrences {
    pub fn enter(&mut self, name: &Name) {
        let index = self.siblings.last_mut().map_or(1, |siblings| {
            if let Some(count) = siblings.get_mut(name) {
                *count += 1;
                *count
            } else {
                siblings.insert(name.clone(), 1);
                1
            }
        });
        self.path.push(index);
        self.siblings.push(BTreeMap::new());
    }
    pub fn leave(&mut self) {
        self.siblings.pop();
        self.path.pop();
    }
    pub fn path(&self) -> &[usize] {
        &self.path
    }
}
