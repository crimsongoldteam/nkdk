use std::borrow::Cow;
type Result<T> = std::result::Result<T, ParseDecimalError>;
#[derive(Debug, Clone, Copy)]
pub struct ParseDecimalError;
impl std::fmt::Display for ParseDecimalError {
    fn fmt(&self, out: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        out.write_str("Expected a finite exact decimal within the supported exponent range")
    }
}
impl std::error::Error for ParseDecimalError {}
use std::{cmp::Ordering, fmt};

/// Exact finite decimal. The exponent never materializes a run of zero digits.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Decimal {
    negative: bool,
    digits: Cow<'static, str>,
    exponent: i64,
}
impl Decimal {
    pub fn parse(source: &str) -> Result<Self> {
        Self::parse_owned(source.to_owned())
    }
    pub fn parse_owned(mut source: String) -> Result<Self> {
        let invalid = || ParseDecimalError;
        let (negative, start) = match source.as_bytes().first() {
            Some(b'-') => (true, 1),
            Some(b'+') => (false, 1),
            _ => (false, 0),
        };
        let end = source[start..]
            .find(['e', 'E'])
            .map_or(source.len(), |offset| offset + start);
        let exponent = if end < source.len() {
            source[end + 1..].parse::<i64>().map_err(|_| invalid())?
        } else {
            0
        };
        let mut fractional = 0i64;
        let mut point = false;
        let mut digits = 0usize;
        for byte in source[start..end].bytes() {
            match byte {
                b'0'..=b'9' => {
                    digits += 1;
                    if point {
                        fractional = fractional.checked_add(1).ok_or_else(invalid)?;
                    }
                }
                b'.' if !point => point = true,
                _ => return Err(invalid()),
            }
        }
        if digits == 0 {
            return Err(invalid());
        }
        source.truncate(end);
        source.retain(|character| character.is_ascii_digit());
        let leading = source.bytes().take_while(|byte| *byte == b'0').count();
        if leading == source.len() {
            return Ok(Self::constant(false, "0", 0));
        }
        let trailing = source.len() - source.trim_end_matches('0').len();
        let trailing = i64::try_from(trailing).map_err(|_| invalid())?;
        let exponent = i64::try_from(exponent as i128 - fractional as i128 + trailing as i128)
            .map_err(|_| invalid())?;
        source.truncate(source.len() - trailing as usize);
        source.drain(..leading);
        let scientific = exponent as i128 + source.len() as i128 - 1;
        i64::try_from(scientific).map_err(|_| invalid())?;
        Ok(Self {
            negative,
            digits: source.into(),
            exponent,
        })
    }
    pub fn parts(&self) -> (bool, &str, i64) {
        (self.negative, &self.digits, self.exponent)
    }
    pub const fn constant(negative: bool, digits: &'static str, exponent: i64) -> Self {
        let bytes = digits.as_bytes();
        assert!(!bytes.is_empty());
        let mut i = 0;
        while i < bytes.len() {
            assert!(bytes[i] >= b'0' && bytes[i] <= b'9');
            i += 1;
        }
        if bytes.len() == 1 && bytes[0] == b'0' {
            assert!(!negative && exponent == 0);
        } else {
            assert!(bytes[0] != b'0' && bytes[bytes.len() - 1] != b'0');
        }
        let scientific = exponent as i128 + bytes.len() as i128 - 1;
        assert!(scientific >= i64::MIN as i128 && scientific <= i64::MAX as i128);
        Self {
            negative,
            digits: Cow::Borrowed(digits),
            exponent,
        }
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
