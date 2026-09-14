//! Reuse semantic preparation across consumers of an identical placed record.
//! No generated Rust or runtime input values are stored here.
use super::*;
use std::{cell::RefCell, rc::Rc};

#[derive(Debug)]
pub(crate) struct Composition {
    original: LinkedEntry,
    captured: Option<LinkedEntry>,
    pub captures: Vec<u32>,
    pub parts: Vec<LinkedEntry>,
}
impl Composition {
    pub(crate) fn entry(&self) -> &LinkedEntry {
        self.captured.as_ref().unwrap_or(&self.original)
    }
    fn prepare(entry: &LinkedEntry, program: &Program) -> Result<Self, Diagnostic> {
        let scope = scopes::capture_inputs(entry)?;
        let mut parts = records::parts(&scope.entry, program)?;
        for part in &mut parts {
            scope.localize(part)?;
        }
        Ok(Self {
            original: entry.clone(),
            captured: match scope.entry {
                Cow::Borrowed(_) => None,
                Cow::Owned(entry) => Some(entry),
            },
            captures: scope.captures,
            parts,
        })
    }
}

#[derive(Debug, Default)]
pub(super) struct Table(RefCell<BTreeMap<ValueId, Vec<Rc<Composition>>>>);
impl Table {
    pub(super) fn prepare(
        &self,
        entry: &LinkedEntry,
        program: &Program,
    ) -> Result<Rc<Composition>, Diagnostic> {
        // Specializations keep the source id. Compare the complete declaration
        // to avoid sharing routes, arguments, bindings or diagnostics by mistake.
        if let Some(found) = self
            .0
            .borrow()
            .get(&ValueId(entry.id))
            .and_then(|variants| variants.iter().find(|plan| plan.original == *entry))
        {
            return Ok(Rc::clone(found));
        }
        let prepared = Rc::new(Composition::prepare(entry, program)?);
        self.0
            .borrow_mut()
            .entry(ValueId(entry.id))
            .or_default()
            .push(Rc::clone(&prepared));
        Ok(prepared)
    }
}
