//! Borrow events from a single parser; composed readers do not retain a token tree.
use super::{Name, NamespaceScope, Token};
use crate::Result;

pub type Consumer<'a> = dyn FnMut(&[Name], &Token<'_>) -> Result<()> + 'a;

pub trait Source {
    fn visit(self, consume: impl FnMut(&[Name], &Token<'_>) -> Result<()>) -> Result<()>;
}

pub struct DocumentSource<'a>(pub &'a [u8]);
impl Source for DocumentSource<'_> {
    fn visit(self, mut consume: impl FnMut(&[Name], &Token<'_>) -> Result<()>) -> Result<()> {
        super::visit(self.0, |path, token| consume(path, &token))
    }
}

pub struct Events<F>(pub F);
impl<F> Source for Events<F>
where
    F: FnOnce(&mut Consumer<'_>) -> Result<()>,
{
    fn visit(self, mut consume: impl FnMut(&[Name], &Token<'_>) -> Result<()>) -> Result<()> {
        (self.0)(&mut consume)
    }
}

/// Namespace bindings are borrowed only for the duration of each event.
pub type ScopedConsumer<'a> = dyn FnMut(&[Name], &Token<'_>, NamespaceScope<'_>) -> Result<()> + 'a;

pub trait ScopedSource {
    fn visit_scoped(
        self,
        consume: impl FnMut(&[Name], &Token<'_>, NamespaceScope<'_>) -> Result<()>,
    ) -> Result<()>;
}

impl ScopedSource for DocumentSource<'_> {
    fn visit_scoped(
        self,
        mut consume: impl FnMut(&[Name], &Token<'_>, NamespaceScope<'_>) -> Result<()>,
    ) -> Result<()> {
        super::visit_scoped(self.0, |path, token, scope| consume(path, &token, scope))
    }
}

pub struct ScopedEvents<F>(pub F);
impl<F> ScopedSource for ScopedEvents<F>
where
    F: FnOnce(&mut ScopedConsumer<'_>) -> Result<()>,
{
    fn visit_scoped(
        self,
        mut consume: impl FnMut(&[Name], &Token<'_>, NamespaceScope<'_>) -> Result<()>,
    ) -> Result<()> {
        (self.0)(&mut consume)
    }
}
