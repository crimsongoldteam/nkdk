use crate::{Result, RuntimeDiagnostic};
use std::{cmp::Ordering, fmt};

/// Exact finite decimal. The exponent never materializes a run of zero digits.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Decimal {
    negative: bool,
    digits: String,
    exponent: i64,
}
impl Decimal {
    pub fn parse(source: &str) -> Result<Self> {
        let invalid = || {
            RuntimeDiagnostic::new(
                "value.decimal",
                "Expected a finite decimal literal with a signed 64-bit exponent",
            )
        };
        let (negative, unsigned) = match source.as_bytes().first() {
            Some(b'-') => (true, &source[1..]),
            Some(b'+') => (false, &source[1..]),
            _ => (false, source),
        };
        let mut parts = unsigned.split(['e', 'E']);
        let mantissa = parts.next().ok_or_else(invalid)?;
        let exponent = parts
            .next()
            .map(|value| value.parse::<i64>().map_err(|_| invalid()))
            .transpose()?
            .unwrap_or(0);
        if parts.next().is_some() {
            return Err(invalid());
        }
        let mut digits = String::with_capacity(mantissa.len());
        let mut fractional = 0i64;
        let mut point = false;
        for byte in mantissa.bytes() {
            match byte {
                b'0'..=b'9' => {
                    digits.push(byte as char);
                    if point {
                        fractional = fractional.checked_add(1).ok_or_else(invalid)?;
                    }
                }
                b'.' if !point => point = true,
                _ => return Err(invalid()),
            }
        }
        if digits.is_empty() {
            return Err(invalid());
        }
        let digits = digits.trim_start_matches('0');
        if digits.is_empty() {
            return Ok(Self {
                negative: false,
                digits: "0".into(),
                exponent: 0,
            });
        }
        let normalized = digits.trim_end_matches('0');
        let trailing = i64::try_from(digits.len() - normalized.len()).map_err(|_| invalid())?;
        let exponent = exponent
            .checked_sub(fractional)
            .and_then(|value| value.checked_add(trailing))
            .ok_or_else(invalid)?;
        let scientific_exponent = exponent as i128 + normalized.len() as i128 - 1;
        i64::try_from(scientific_exponent).map_err(|_| invalid())?;
        Ok(Self {
            negative,
            digits: normalized.into(),
            exponent,
        })
    }
    fn point(&self) -> i128 {
        self.exponent as i128 + self.digits.len() as i128
    }
}
impl Ord for Decimal {
    fn cmp(&self, other: &Self) -> Ordering {
        if self.negative != other.negative {
            return if self.negative {
                Ordering::Less
            } else {
                Ordering::Greater
            };
        }
        let magnitude = match (self.digits == "0", other.digits == "0") {
            (true, true) => Ordering::Equal,
            (true, false) => Ordering::Less,
            (false, true) => Ordering::Greater,
            (false, false) => self.point().cmp(&other.point()).then_with(|| {
                let width = self.digits.len().max(other.digits.len());
                self.digits
                    .bytes()
                    .chain(std::iter::repeat(b'0'))
                    .take(width)
                    .cmp(
                        other
                            .digits
                            .bytes()
                            .chain(std::iter::repeat(b'0'))
                            .take(width),
                    )
            }),
        };
        if self.negative {
            magnitude.reverse()
        } else {
            magnitude
        }
    }
}
impl PartialOrd for Decimal {
    fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
        Some(self.cmp(other))
    }
}
impl fmt::Display for Decimal {
    fn fmt(&self, out: &mut fmt::Formatter<'_>) -> fmt::Result {
        if self.negative {
            out.write_str("-")?;
        }
        let point = self.point();
        if point > -6 && point <= 21 {
            if point <= 0 {
                out.write_str("0.")?;
                for _ in 0..-point {
                    out.write_str("0")?;
                }
                out.write_str(&self.digits)
            } else {
                let point = point as usize;
                let cut = point.min(self.digits.len());
                out.write_str(&self.digits[..cut])?;
                if point < self.digits.len() {
                    out.write_str(".")?;
                    out.write_str(&self.digits[cut..])?;
                }
                for _ in self.digits.len()..point {
                    out.write_str("0")?;
                }
                Ok(())
            }
        } else {
            out.write_str(&self.digits[..1])?;
            if self.digits.len() > 1 {
                out.write_str(".")?;
                out.write_str(&self.digits[1..])?;
            }
            write!(out, "e{:+}", point - 1)
        }
    }
}
