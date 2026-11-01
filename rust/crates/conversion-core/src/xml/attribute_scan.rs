//! Borrow selected attribute values; namespace and inherited scope are data.
use super::{DocumentSource, Patch, Source as XmlSource, Token};
use crate::{Result, RuntimeDiagnostic};

mod snapshot;
pub use snapshot::SnapshotBudget;

type QName<'a> = (&'a str, &'a str);

pub enum Event<'a> {
    Enter(QName<'a>),
    Attribute(QName<'a>, &'a str),
    Leave,
}

pub trait Source {
    fn visit_attributes(self, consume: impl FnMut(Event<'_>) -> Result<()>) -> Result<()>;
}

/// Adapt an existing XML event source, including a composed reader's borrowed
/// events, without starting another parser or buffering its tokens.
pub struct Xml<S>(pub S);

/// Actual ancestor names for a detached source, supplied by its declared mount.
/// Only boundaries are replayed: no ancestor attributes or XML serialization.
pub struct InContext<'a, S> {
    pub source: S,
    pub ancestors: &'a [QName<'a>],
}
impl<S: Source> Source for InContext<'_, S> {
    fn visit_attributes(self, mut consume: impl FnMut(Event<'_>) -> Result<()>) -> Result<()> {
        for name in self.ancestors {
            super::validate_qname(*name)?;
        }
        for name in self.ancestors {
            consume(Event::Enter(*name))?;
        }
        let mut depth = 0usize;
        self.source.visit_attributes(|event| {
            match &event {
                Event::Enter(_) => {
                    depth = depth
                        .checked_add(1)
                        .ok_or_else(|| failure("Attribute depth overflow"))?
                }
                Event::Leave => {
                    depth = depth
                        .checked_sub(1)
                        .ok_or_else(|| failure("Detached source leaves its context"))?
                }
                Event::Attribute(..) if depth == 0 => {
                    return Err(failure("Detached attribute has no owner"));
                }
                _ => (),
            }
            consume(event)
        })?;
        if depth != 0 {
            return Err(failure("Incomplete detached attribute source"));
        }
        for _ in self.ancestors {
            consume(Event::Leave)?;
        }
        Ok(())
    }
}

/// Partial patches expose additions/replacements only. Null removals do not
/// occupy a value; unchanged ordinary attributes belong to their own source.
pub struct Preserved<'a> {
    pub patch: &'a Patch,
    pub root: QName<'a>,
    pub namespaces: &'a [QName<'a>],
}

/// A scalar attribute patch has no element envelope of its own.
pub struct AttributePatch<'a> {
    pub patch: &'a Patch,
    pub owner: QName<'a>,
    pub name: QName<'a>,
}

impl Source for AttributePatch<'_> {
    fn visit_attributes(self, mut consume: impl FnMut(Event<'_>) -> Result<()>) -> Result<()> {
        super::validate_qname(self.owner)?;
        super::validate_qname(self.name)?;
        if let Some(value) = self.patch.attribute_text()? {
            consume(Event::Enter(self.owner))?;
            consume(Event::Attribute(self.name, value))?;
            consume(Event::Leave)?;
        }
        Ok(())
    }
}

pub struct Profile<'a> {
    pub attribute: QName<'a>,
    pub default_scope: usize,
    pub boundaries: &'a [(QName<'a>, usize)],
    pub max_depth: usize,
}

impl Profile<'_> {
    pub fn visit(
        &self,
        source: impl Source,
        mut consume: impl FnMut(usize, &str) -> Result<()>,
    ) -> Result<()> {
        self.walk(source, false, |scope, _, value| consume(scope, value))
    }

    /// Without an externally supplied inherited scope, a detached subtree must
    /// start at a declared boundary. Guessing the default would reserve its ids
    /// in the wrong scope when an opaque child originally belonged to another.
    pub fn visit_from_boundary(
        &self,
        source: impl Source,
        mut consume: impl FnMut(usize, &str) -> Result<()>,
    ) -> Result<()> {
        self.walk(source, true, |scope, _, value| consume(scope, value))
    }

    fn walk(
        &self,
        source: impl Source,
        require_boundary: bool,
        mut consume: impl FnMut(usize, Option<QName<'_>>, &str) -> Result<()>,
    ) -> Result<()> {
        super::validate_qname(self.attribute)?;
        for (slot, (name, _)) in self.boundaries.iter().enumerate() {
            super::validate_qname(*name)?;
            if self.boundaries[..slot]
                .iter()
                .any(|(other, _)| other == name)
            {
                return Err(failure("Repeated scope boundary"));
            }
        }
        let mut stack = Vec::new();
        source.visit_attributes(|event| {
            match event {
                Event::Enter(name) => {
                    if stack.len() >= self.max_depth {
                        return Err(failure("Attribute source exceeds depth budget"));
                    }
                    let inherited = stack.last().copied().unwrap_or((self.default_scope, None));
                    let boundary = self
                        .boundaries
                        .iter()
                        .find(|(candidate, _)| *candidate == name);
                    if require_boundary && stack.is_empty() && boundary.is_none() {
                        return Err(failure(
                            "Detached attribute source has no declared scope boundary",
                        ));
                    }
                    stack.push(boundary.map_or(inherited, |(name, scope)| (*scope, Some(*name))));
                }
                Event::Attribute(name, value) => {
                    let scope = stack
                        .last()
                        .copied()
                        .ok_or_else(|| failure("Attribute outside an element"))?;
                    if name == self.attribute {
                        consume(scope.0, scope.1, value)?;
                    }
                }
                Event::Leave => {
                    stack
                        .pop()
                        .ok_or_else(|| failure("Unbalanced element boundary"))?;
                }
            }
            Ok(())
        })?;
        if !stack.is_empty() {
            return Err(failure("Incomplete attribute source"));
        }
        Ok(())
    }
}

fn failure(message: &str) -> RuntimeDiagnostic {
    RuntimeDiagnostic::new("xml.attribute-scan", message)
}

impl Source for DocumentSource<'_> {
    fn visit_attributes(self, consume: impl FnMut(Event<'_>) -> Result<()>) -> Result<()> {
        Xml(self).visit_attributes(consume)
    }
}

impl<S: XmlSource> Source for Xml<S> {
    fn visit_attributes(self, mut consume: impl FnMut(Event<'_>) -> Result<()>) -> Result<()> {
        self.0.visit(|path, token| match token {
            Token::Start(_) => {
                let name = path.last().ok_or_else(|| failure("Missing element name"))?;
                consume(Event::Enter((&name.namespace, &name.local)))
            }
            Token::Attribute(value) => consume(Event::Attribute(
                (&value.name.namespace, &value.name.local),
                &value.text,
            )),
            Token::End => consume(Event::Leave),
            Token::Text(_) => Ok(()),
        })
    }
}
