//! Reversible fixed-slot text layouts. Prepared plans contain no domain names.
mod sequence;
pub use sequence::{Row, Sequence};
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Part<'a> {
    Literal(&'a str),
    Slot(usize),
    Cell(usize, &'a str),
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum PatternError {
    Plan(&'static str),
    Input { offset: usize },
    AmbiguousValue,
    Budget,
}

pub struct Pattern<'a, const N: usize> {
    parts: &'a [Part<'a>],
    boundaries: Vec<Option<Boundary<'a>>>,
}
impl<'a, const N: usize> Pattern<'a, N> {
    pub fn new(parts: &'a [Part<'a>]) -> Result<Self, PatternError> {
        let mut seen = [false; N];
        for (index, part) in parts.iter().enumerate() {
            match part {
                Part::Literal("") => return Err(PatternError::Plan("Empty literal")),
                Part::Literal(_)
                    if matches!(
                        index.checked_sub(1).map(|i| parts[i]),
                        Some(Part::Literal(_))
                    ) =>
                {
                    return Err(PatternError::Plan("Merge adjacent literals"));
                }
                Part::Slot(slot) | Part::Cell(slot, _) => {
                    if let Part::Cell(_, separator) = part {
                        if separator.is_empty() {
                            return Err(PatternError::Plan("Empty cell separator"));
                        }
                        if let Some(Part::Literal(next)) = parts.get(index + 1)
                            && !next.starts_with(separator)
                        {
                            return Err(PatternError::Plan("Cell must end at its separator"));
                        }
                    }
                    let Some(used) = seen.get_mut(*slot) else {
                        return Err(PatternError::Plan("Unknown slot"));
                    };
                    if std::mem::replace(used, true) {
                        return Err(PatternError::Plan("Repeated slot"));
                    }
                    if matches!(parts.get(index + 1), Some(Part::Slot(_) | Part::Cell(..))) {
                        return Err(PatternError::Plan("Adjacent slots are ambiguous"));
                    }
                }
                _ => (),
            }
        }
        if seen.contains(&false) {
            return Err(PatternError::Plan("Missing slot"));
        }
        let boundaries = parts
            .iter()
            .enumerate()
            .map(|(index, part)| match (part, parts.get(index + 1)) {
                (Part::Slot(_), Some(Part::Literal(literal))) => Some(Boundary::new(literal)),
                (Part::Cell(_, separator), Some(Part::Literal(_))) => {
                    Some(Boundary::new(separator))
                }
                _ => None,
            })
            .collect();
        Ok(Self { parts, boundaries })
    }

    pub fn parse<'s>(&self, source: &'s str) -> Result<[&'s str; N], PatternError> {
        let mut values = [""; N];
        let mut offset = 0;
        for (index, part) in self.parts.iter().enumerate() {
            let rest = &source[offset..];
            match part {
                Part::Literal(text) => {
                    if !rest.starts_with(text) {
                        return Err(PatternError::Input { offset });
                    }
                    offset += text.len();
                }
                Part::Slot(slot) | Part::Cell(slot, _) => {
                    let length = match self.parts.get(index + 1) {
                        Some(Part::Literal(delimiter)) => {
                            let delimiter = if let Part::Cell(_, separator) = part {
                                separator
                            } else {
                                delimiter
                            };
                            rest.find(delimiter).ok_or(PatternError::Input { offset })?
                        }
                        None => rest.len(),
                        _ => unreachable!("validated alternating pattern"),
                    };
                    if let Part::Cell(_, separator) = part
                        && self.parts.get(index + 1).is_none()
                        && rest[..length].contains(separator)
                    {
                        return Err(PatternError::Input { offset });
                    }
                    values[*slot] = &rest[..length];
                    offset += length;
                }
            }
        }
        if offset != source.len() {
            return Err(PatternError::Input { offset });
        }
        Ok(values)
    }

    /// Checks printing without constructing the output or copying any value.
    pub fn check_values(&self, values: &[&str; N]) -> Result<(), PatternError> {
        for (part, boundary) in self.parts.iter().zip(&self.boundaries) {
            if let Part::Cell(slot, separator) = part
                && boundary.is_none()
                && values[*slot].contains(separator)
            {
                return Err(PatternError::AmbiguousValue);
            }
            if let (Part::Slot(slot) | Part::Cell(slot, _), Some(boundary)) = (part, boundary)
                && !boundary.accepts(values[*slot])
            {
                return Err(PatternError::AmbiguousValue);
            }
        }
        Ok(())
    }

    /// Appends atomically: failed representation or budget leaves the prefix intact.
    pub fn write(
        &self,
        values: &[&str; N],
        output: &mut String,
        byte_budget: usize,
    ) -> Result<(), PatternError> {
        let length = self.parts.iter().try_fold(0usize, |length, part| {
            length
                .checked_add(match part {
                    Part::Literal(text) => text.len(),
                    Part::Slot(slot) | Part::Cell(slot, _) => values[*slot].len(),
                })
                .filter(|length| *length <= byte_budget)
                .ok_or(PatternError::Budget)
        })?;
        self.check_values(values)?;
        output
            .try_reserve(length)
            .map_err(|_| PatternError::Budget)?;
        for part in self.parts {
            output.push_str(match part {
                Part::Literal(text) => text,
                Part::Slot(slot) | Part::Cell(slot, _) => values[*slot],
            });
        }
        Ok(())
    }
}

/// Prefix fallback is prepared once; values only scan borrowed bytes.
struct Boundary<'a> {
    literal: &'a str,
    fallback: Vec<usize>,
}
impl<'a> Boundary<'a> {
    fn new(literal: &'a str) -> Self {
        let bytes = literal.as_bytes();
        let mut fallback = vec![0; bytes.len()];
        for index in 1..bytes.len() {
            let mut matched = fallback[index - 1];
            while matched > 0 && bytes[index] != bytes[matched] {
                matched = fallback[matched - 1];
            }
            if bytes[index] == bytes[matched] {
                matched += 1;
            }
            fallback[index] = matched;
        }
        Self { literal, fallback }
    }
    fn accepts(&self, value: &str) -> bool {
        if value.contains(self.literal) {
            return false;
        }
        let needle = self.literal.as_bytes();
        if needle.len() == 1 {
            return true;
        }
        let bytes = value.as_bytes();
        let tail = &bytes[bytes.len().saturating_sub(needle.len() - 1)..];
        let mut matched = 0;
        for (index, byte) in tail.iter().chain(needle).enumerate() {
            while matched > 0 && *byte != needle[matched] {
                matched = self.fallback[matched - 1];
            }
            if *byte == needle[matched] {
                matched += 1;
            }
            if matched == needle.len() {
                return index + 1 - matched == tail.len();
            }
        }
        unreachable!("The appended delimiter always completes a match")
    }
}
