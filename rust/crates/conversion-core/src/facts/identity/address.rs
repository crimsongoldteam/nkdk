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

    /// Accepts an already escaped parent without escaping it for a second time.
    pub fn from_encoded(parent: &str) -> Result<Self> {
        let bytes = parent.as_bytes();
        let mut cursor = 0;
        loop {
            let start = cursor;
            while cursor < bytes.len() && !matches!(bytes[cursor], b'.' | b'[' | b']') {
                if bytes[cursor] == b'%' {
                    let escape = bytes.get(cursor..cursor + 3);
                    if !matches!(escape, Some(b"%25" | b"%2E" | b"%5B" | b"%5D")) {
                        return Err(invalid("Parent address has a noncanonical escape"));
                    }
                    cursor += 3;
                } else {
                    cursor += 1;
                }
            }
            if cursor == start {
                return Err(invalid("Parent address has an empty segment"));
            }
            while bytes.get(cursor) == Some(&b'[') {
                cursor += 1;
                let start = cursor;
                while bytes.get(cursor).is_some_and(u8::is_ascii_digit) {
                    cursor += 1;
                }
                let digits = &parent[start..cursor];
                let index = digits
                    .parse::<u64>()
                    .map_err(|_| invalid("Invalid parent address index"))?;
                if (digits.len() > 1 && digits.starts_with('0'))
                    || index > MAX_INDEX
                    || bytes.get(cursor) != Some(&b']')
                {
                    return Err(invalid("Parent address has a noncanonical index"));
                }
                cursor += 1;
            }
            if cursor == bytes.len() {
                return Ok(Self(parent.to_owned()));
            }
            if bytes[cursor] != b'.' {
                return Err(invalid("Parent address has an invalid segment boundary"));
            }
            cursor += 1;
        }
    }

    pub fn into_string(self) -> String {
        self.0
    }

    /// Exact integer conversion without formatting or expanding decimal exponents.
    pub fn push_decimal_index(&mut self, value: &crate::decimal::Decimal) -> Result<()> {
        let (negative, digits, exponent) = value.parts();
        if negative || !(0..=15).contains(&exponent) || digits.len() > 16 {
            return Err(invalid(
                "Address index must be a supported nonnegative integer",
            ));
        }
        let coefficient = digits
            .parse::<u64>()
            .map_err(|_| invalid("Invalid address index"))?;
        let index = coefficient
            .checked_mul(10u64.pow(exponent as u32))
            .ok_or_else(|| invalid("Address index is outside the supported range"))?;
        self.push_index(index)
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
        if index > MAX_INDEX {
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

const MAX_INDEX: u64 = 9_007_199_254_740_991;
