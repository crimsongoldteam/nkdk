//! Calendar components retain the written clock; no machine timezone is consulted.
use crate::{Result, RuntimeDiagnostic};

#[derive(Clone, Copy, PartialEq, Eq)]
pub struct Value {
    year: u16,
    month: u8,
    day: u8,
    hour: u8,
    minute: u8,
    second: u8,
}
fn invalid() -> RuntimeDiagnostic {
    RuntimeDiagnostic::new("value.calendar", "Invalid calendar representation")
}
fn digits(value: &str) -> Result<u16> {
    if value.is_empty() || !value.bytes().all(|byte| byte.is_ascii_digit()) {
        return Err(invalid());
    }
    value.parse().map_err(|_| invalid())
}
impl Value {
    fn checked(parts: [u16; 6]) -> Result<Self> {
        Self::from_parts(parts).ok_or_else(invalid)
    }
    /// The same calendar check serves parsed inputs and compiled constants.
    pub const fn from_parts(parts: [u16; 6]) -> Option<Self> {
        let [year, month, day, hour, minute, second] = parts;
        let leap =
            year.is_multiple_of(4) && (!year.is_multiple_of(100) || year.is_multiple_of(400));
        let days = match month {
            1 | 3 | 5 | 7 | 8 | 10 | 12 => 31,
            4 | 6 | 9 | 11 => 30,
            2 => {
                if leap {
                    29
                } else {
                    28
                }
            }
            _ => 0,
        };
        if year == 0
            || year > 9999
            || day == 0
            || day > days
            || hour > 23
            || minute > 59
            || second > 59
        {
            return None;
        }
        Some(Self {
            year,
            month: month as u8,
            day: day as u8,
            hour: hour as u8,
            minute: minute as u8,
            second: second as u8,
        })
    }
    pub const fn parts(&self) -> [u16; 6] {
        [
            self.year,
            self.month as u16,
            self.day as u16,
            self.hour as u16,
            self.minute as u16,
            self.second as u16,
        ]
    }
    pub fn fits_fraction(&self, fraction: &str) -> bool {
        let [year, month, day, hour, minute, second] = self.parts();
        match fraction {
            "Date" => hour == 0 && minute == 0 && second == 0,
            "Time" => year == 1 && month == 1 && day == 1,
            "DateTime" => true,
            _ => false,
        }
    }
    pub fn from_xml(source: &str) -> Result<Self> {
        if !source.is_ascii()
            || source.len() < 19
            || &source[4..5] != "-"
            || &source[7..8] != "-"
            || &source[10..11] != "T"
            || &source[13..14] != ":"
            || &source[16..17] != ":"
        {
            return Err(invalid());
        }
        let mut suffix = &source[19..];
        if let Some(fraction) = suffix.strip_prefix('.') {
            let count = fraction.bytes().take_while(u8::is_ascii_digit).count();
            if count == 0 {
                return Err(invalid());
            }
            suffix = &fraction[count..];
        }
        if !suffix.is_empty() && suffix != "Z" {
            if suffix.len() != 6
                || !matches!(suffix.as_bytes()[0], b'+' | b'-')
                || &suffix[3..4] != ":"
            {
                return Err(invalid());
            }
            let hours = digits(&suffix[1..3])?;
            let minutes = digits(&suffix[4..6])?;
            if hours > 14 || minutes > 59 || (hours == 14 && minutes != 0) {
                return Err(invalid());
            }
        }
        Self::checked([
            digits(&source[..4])?,
            digits(&source[5..7])?,
            digits(&source[8..10])?,
            digits(&source[11..13])?,
            digits(&source[14..16])?,
            digits(&source[17..19])?,
        ])
    }
    pub fn from_yaml(source: &str, seconds: bool, omit_zero: bool) -> Result<Self> {
        let length = if seconds { 19 } else { 16 };
        if !source.is_ascii()
            || (source.len() != length && !(omit_zero && source.len() == 10))
            || &source[2..3] != "."
            || &source[5..6] != "."
        {
            return Err(invalid());
        }
        let mut parts = [
            digits(&source[6..10])?,
            digits(&source[3..5])?,
            digits(&source[..2])?,
            0,
            0,
            0,
        ];
        if source.len() > 10 {
            if &source[10..11] != " " || &source[13..14] != ":" {
                return Err(invalid());
            }
            parts[3] = digits(&source[11..13])?;
            parts[4] = digits(&source[14..16])?;
            if seconds {
                if &source[16..17] != ":" {
                    return Err(invalid());
                }
                parts[5] = digits(&source[17..19])?;
            }
        }
        Self::checked(parts)
    }
    pub fn xml(&self) -> String {
        format!(
            "{:04}-{:02}-{:02}T{:02}:{:02}:{:02}",
            self.year, self.month, self.day, self.hour, self.minute, self.second
        )
    }
    pub fn yaml(&self, seconds: bool, omit_zero: bool) -> String {
        let date = format!("{:02}.{:02}.{:04}", self.day, self.month, self.year);
        if omit_zero && self.hour == 0 && self.minute == 0 && self.second == 0 {
            date
        } else if seconds {
            format!(
                "{date} {:02}:{:02}:{:02}",
                self.hour, self.minute, self.second
            )
        } else {
            format!("{date} {:02}:{:02}", self.hour, self.minute)
        }
    }
}

/// Check the date/time shape of a semantic YAML calendar value.
pub fn fits_fraction(source: &str, fraction: &str) -> bool {
    let Ok(value) = Value::from_yaml(source, true, false) else {
        return false;
    };
    value.fits_fraction(fraction)
}
