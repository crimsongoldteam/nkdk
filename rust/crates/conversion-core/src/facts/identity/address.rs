use crate::{Result, RuntimeDiagnostic};
use std::fmt::Write;

/// An escaped operation address; segment boundaries cannot collide with names.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct LogicalAddress(String);

impl LogicalAddress {
    pub fn from_segments<'a>(parts: impl IntoIterator<Item = &'a str>) -> Result<Self> {
        let mut address = Self(String::new());
        for part in parts {
            address.push_segment(part)?;
        }
        if address.0.is_empty() {
            return Err(invalid("An identity address must contain a segment"));
        }
        Ok(address)
    }

    pub fn as_str(&self) -> &str {
        &self.0
    }

    /// Appends directly to the existing buffer, escaping each segment once.
    pub fn push_segment(&mut self, segment: &str) -> Result<()> {
        if segment.is_empty() {
            return Err(invalid("An identity address segment cannot be empty"));
        }
        if !self.0.is_empty() {
            self.0.push('.');
        }
        for character in segment.chars() {
            match character {
                '%' => self.0.push_str("%25"),
                '.' => self.0.push_str("%2E"),
                '[' => self.0.push_str("%5B"),
                ']' => self.0.push_str("%5D"),
                other => self.0.push(other),
            }
        }
        Ok(())
    }

    pub fn push_index(&mut self, index: u64) -> Result<()> {
        // Preserve the supported integer range of persisted TypeScript addresses.
        if index > 9_007_199_254_740_991 {
            return Err(invalid(
                "Identity address index is outside the supported range",
            ));
        }
        write!(self.0, "[{index}]").expect("writing into String");
        Ok(())
    }
}

fn invalid(message: &str) -> RuntimeDiagnostic {
    RuntimeDiagnostic::new("identity.address", message)
}
