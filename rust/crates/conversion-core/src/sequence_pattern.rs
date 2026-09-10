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
