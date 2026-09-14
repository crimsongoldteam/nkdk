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
    let selection = match select_matching(
        rows.iter()
            .map(|row| Ok::<_, std::convert::Infallible>(predicate(row))),
    ) {
        Ok(selection) => selection,
        Err(never) => match never {},
    };
    SelectionView { rows, selection }
}

/// Classify matches without allocating or selecting an arbitrary duplicate.
/// Once a second match is found, no later result can change the cardinality.
pub fn select_matching<E>(
    matches: impl IntoIterator<Item = Result<bool, E>>,
) -> Result<Selection, E> {
    let mut selection = Selection::Missing;
    for (index, matches) in matches.into_iter().enumerate() {
        if matches? {
            if !matches!(selection, Selection::Missing) {
                return Ok(Selection::Ambiguous);
            }
            selection = Selection::Unique(index);
        }
    }
    Ok(selection)
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

/// Owns a selected occurrence and its ordered remainder in the original allocation.
/// The remainder's length is private, so restoration cannot lose its insertion slot.
#[derive(Debug)]
pub struct Extracted<T> {
    selected: Option<(usize, T)>,
    remaining: Vec<T>,
}
impl Selection {
    /// Ambiguous or invalid selections return all input values unchanged.
    pub fn extract<T>(self, mut rows: Vec<T>) -> Result<Extracted<T>, Vec<T>> {
        let selected = match self {
            Self::Missing => None,
            Self::Unique(index) if index < rows.len() => Some((index, rows.remove(index))),
            Self::Unique(_) | Self::Ambiguous => return Err(rows),
        };
        Ok(Extracted {
            selected,
            remaining: rows,
        })
    }
}
impl<T> Extracted<T> {
    pub fn selected(&self) -> Option<&T> {
        self.selected.as_ref().map(|(_, value)| value)
    }
    pub fn selected_mut(&mut self) -> Option<&mut T> {
        self.selected.as_mut().map(|(_, value)| value)
    }
    pub fn remaining(&self) -> &[T] {
        &self.remaining
    }
    pub fn remaining_mut(&mut self) -> &mut [T] {
        &mut self.remaining
    }
    pub fn restore(mut self) -> Vec<T> {
        if let Some((index, value)) = self.selected {
            self.remaining.insert(index, value);
        }
        self.remaining
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
