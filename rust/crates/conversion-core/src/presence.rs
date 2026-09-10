/// Absence and an explicitly empty collection have different reversible meanings.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Sequence<T> {
    Absent,
    Present(Vec<T>),
}
impl<T> Sequence<T> {
    pub fn is_present(&self) -> bool {
        matches!(self, Self::Present(_))
    }
}
impl<T> std::ops::Deref for Sequence<T> {
    type Target = [T];
    fn deref(&self) -> &[T] {
        match self {
            Self::Absent => &[],
            Self::Present(values) => values,
        }
    }
}
impl<'a, T> IntoIterator for &'a Sequence<T> {
    type Item = &'a T;
    type IntoIter = std::slice::Iter<'a, T>;
    fn into_iter(self) -> Self::IntoIter {
        self.iter()
    }
}
