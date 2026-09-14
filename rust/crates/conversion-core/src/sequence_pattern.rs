/// Cardinality of a declaration's selector. Ambiguous matches are never consumed.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Selection {
    Missing,
    Unique(usize),
    Ambiguous,
}

/// A borrowed partition retaining the original occurrence order.
pub struct SelectionView<'a, T> {
    rows: &'a [T],
    selection: Selection,
}

pub fn select_unique<T>(rows: &[T], mut predicate: impl FnMut(&T) -> bool) -> SelectionView<'_, T> {
    let mut selection = Selection::Missing;
    for (index, row) in rows.iter().enumerate() {
        if predicate(row) {
            selection = match selection {
                Selection::Missing => Selection::Unique(index),
                _ => Selection::Ambiguous,
            };
        }
    }
    SelectionView { rows, selection }
}

impl<'a, T> SelectionView<'a, T> {
    pub fn selection(&self) -> Selection {
        self.selection
    }

    pub fn selected(&self) -> Option<&'a T> {
        match self.selection {
            Selection::Unique(index) => self.rows.get(index),
            _ => None,
        }
    }

    pub fn remaining(&self) -> impl Iterator<Item = &'a T> + '_ {
        self.rows
            .iter()
            .enumerate()
            .filter_map(|(index, row)| (self.selection != Selection::Unique(index)).then_some(row))
    }

    pub fn original(&self) -> impl Iterator<Item = &'a T> {
        self.rows.iter()
    }
}

/// A checked structural rewrite. Existing item values move without cloning their strings.
pub struct Rewrite<T> {
    pub start: usize,
    pub end: usize,
    pub prefix: Vec<T>,
    pub suffix: Vec<T>,
}
impl<T> Rewrite<T> {
    pub fn apply(self, mut values: Vec<T>) -> Vec<T> {
        values.truncate(self.end);
        values.drain(..self.start);
        values.splice(..0, self.prefix);
        values.extend(self.suffix);
        values
    }
    pub fn iter<'a>(&'a self, values: &'a [T]) -> impl Iterator<Item = &'a T> {
        self.prefix
            .iter()
            .chain(values[self.start..self.end].iter())
            .chain(&self.suffix)
    }
}
