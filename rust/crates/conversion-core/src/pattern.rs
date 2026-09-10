//! Read a build-time DFA once. Incoming values never compile a regular expression.
use crate::{Result, RuntimeDiagnostic};
use regex_automata::{
    Input,
    dfa::{Automaton, dense::DFA},
};
use std::sync::OnceLock;

pub struct Pattern {
    bytes: &'static [u8],
    machine: OnceLock<std::result::Result<DFA<&'static [u32]>, String>>,
}
impl Pattern {
    pub const fn new(bytes: &'static [u8]) -> Self {
        Self {
            bytes,
            machine: OnceLock::new(),
        }
    }
    pub fn matches(&self, value: &str) -> Result<bool> {
        let machine = self.machine.get_or_init(|| {
            DFA::from_bytes(self.bytes)
                .map(|(machine, _)| machine)
                .map_err(|error| error.to_string())
        });
        let machine = machine
            .as_ref()
            .map_err(|error| RuntimeDiagnostic::new("pattern.compiled-data", error.clone()))?;
        machine
            .try_search_fwd(&Input::new(value))
            .map(|found| found.is_some())
            .map_err(|error| RuntimeDiagnostic::new("pattern.execution", error.to_string()))
    }
}
