//! Optional text groups share one capture automaton; no enumeration of spellings.
use super::PatternError;
use regex_automata::{
    PatternID,
    nfa::thompson::pikevm::{Cache, PikeVM},
    util::captures::Captures,
};
use std::fmt::Write;

#[derive(Clone, Copy)]
pub enum OptionalPart<'a> {
    Literal(&'a str),
    Slot(usize),
    Optional(usize, &'a [OptionalPart<'a>]),
}

/// A caller keeps this prepared reader in its per-thread declaration state.
/// Captures borrow the input; automaton scratch storage is reused between calls.
pub struct OptionalPattern<'a, const N: usize> {
    parts: &'a [OptionalPart<'a>],
    machine: PikeVM,
    cache: Cache,
    captures: Captures,
    slots: Vec<(usize, usize)>,
}
impl<'a, const N: usize> OptionalPattern<'a, N> {
    pub fn new(parts: &'a [OptionalPart<'a>]) -> Result<Self, PatternError> {
        let mut seen = [false; N];
        let mut groups = [false; N];
        let mut expression = String::from("\\A");
        compile(parts, &mut seen, &mut groups, &mut expression, false)?;
        expression.push_str("\\z");
        let machine = PikeVM::new(&expression)
            .map_err(|_| PatternError::Plan("Invalid optional text automaton"))?;
        let slots = seen
            .into_iter()
            .enumerate()
            .filter(|(_, seen)| *seen)
            .map(|(slot, _)| {
                let group = machine
                    .get_nfa()
                    .group_info()
                    .to_index(PatternID::ZERO, &format!("f{slot}"))
                    .expect("compiled capture");
                (slot, group)
            })
            .collect();
        let cache = machine.create_cache();
        let captures = machine.create_captures();
        Ok(Self {
            parts,
            machine,
            cache,
            captures,
            slots,
        })
    }
    pub fn parse<'s>(&mut self, source: &'s str) -> Result<[Option<&'s str>; N], PatternError> {
        self.machine
            .captures(&mut self.cache, source, &mut self.captures);
        if !self.captures.is_match() {
            return Err(PatternError::Input { offset: 0 });
        }
        let mut result = [None; N];
        for &(slot, group) in &self.slots {
            result[slot] = self
                .captures
                .get_group(group)
                .map(|span| &source[span.start..span.end]);
        }
        Ok(result)
    }
    pub fn write(
        &mut self,
        values: &[Option<&str>; N],
        active: &[bool; N],
        out: &mut String,
        budget: usize,
    ) -> Result<(), PatternError> {
        let start = out.len();
        let mut expected = [None; N];
        let result = emit(
            self.parts,
            values,
            active,
            out,
            start,
            budget,
            &mut expected,
        )
        .and_then(|()| {
            if self.parse(&out[start..])? == expected {
                Ok(())
            } else {
                Err(PatternError::AmbiguousValue)
            }
        });
        if result.is_err() {
            out.truncate(start);
        }
        result
    }
}
fn compile<const N: usize>(
    sequence: &[OptionalPart<'_>],
    seen: &mut [bool; N],
    groups: &mut [bool; N],
    out: &mut String,
    mut previous_slot: bool,
) -> Result<bool, PatternError> {
    let mut optional_prefixes: Vec<&str> = Vec::new();
    for (position, part) in sequence.iter().enumerate() {
        match part {
            OptionalPart::Literal(text) => {
                if text.is_empty() {
                    return Err(PatternError::Plan("Empty literal"));
                }
                if optional_prefixes
                    .iter()
                    .any(|prefix| prefix.starts_with(text) || text.starts_with(prefix))
                {
                    return Err(PatternError::Plan("Optional prefixes must be disjoint"));
                }
                optional_prefixes.clear();
                for ch in text.chars() {
                    if "\\.^$|?*+()[]{}".contains(ch) {
                        out.push('\\');
                    }
                    out.push(ch);
                }
                previous_slot = false;
            }
            OptionalPart::Slot(index) => {
                let Some(slot) = seen.get_mut(*index) else {
                    return Err(PatternError::Plan("Unknown slot"));
                };
                if std::mem::replace(slot, true) {
                    return Err(PatternError::Plan("Repeated slot"));
                }
                if previous_slot {
                    return Err(PatternError::Plan("Adjacent slots are ambiguous"));
                }
                write!(out, "(?P<f{index}>(?s:.*?))").unwrap();
                previous_slot = true;
            }
            OptionalPart::Optional(index, parts) => {
                let Some(group) = groups.get_mut(*index) else {
                    return Err(PatternError::Plan("Unknown optional group"));
                };
                let opening = match parts.first() {
                    Some(OptionalPart::Literal(text)) if !text.is_empty() => *text,
                    Some(OptionalPart::Slot(_))
                        if position == 0
                            && matches!(parts.last(), Some(OptionalPart::Literal(text)) if !text.is_empty())
                            && matches!(
                                sequence.get(position + 1),
                                Some(OptionalPart::Slot(_))
                            ) =>
                    {
                        ""
                    }
                    _ => return Err(PatternError::Plan("Invalid optional group")),
                };
                if std::mem::replace(group, true) || seen[*index] {
                    return Err(PatternError::Plan("Invalid optional group"));
                }
                if optional_prefixes
                    .iter()
                    .any(|previous| previous.starts_with(opening) || opening.starts_with(previous))
                {
                    return Err(PatternError::Plan("Optional prefixes must be disjoint"));
                }
                optional_prefixes.push(opening);
                out.push_str("(?:");
                let ending_slot = compile(parts, seen, groups, out, previous_slot)?;
                if !seen[*index] {
                    return Err(PatternError::Plan(
                        "Optional group must contain its controlling slot",
                    ));
                }
                out.push_str(")?");
                previous_slot |= ending_slot;
            }
        }
    }
    Ok(previous_slot)
}
fn emit<'s, const N: usize>(
    parts: &[OptionalPart<'_>],
    values: &[Option<&'s str>; N],
    active: &[bool; N],
    out: &mut String,
    start: usize,
    budget: usize,
    expected: &mut [Option<&'s str>; N],
) -> Result<(), PatternError> {
    for part in parts {
        let text = match part {
            OptionalPart::Literal(text) => text,
            OptionalPart::Slot(index) => {
                let text = values[*index].ok_or(PatternError::AmbiguousValue)?;
                expected[*index] = Some(text);
                text
            }
            OptionalPart::Optional(index, parts) => {
                if active[*index] {
                    emit(parts, values, active, out, start, budget, expected)?;
                }
                continue;
            }
        };
        if (out.len() - start)
            .checked_add(text.len())
            .is_none_or(|length| length > budget)
        {
            return Err(PatternError::Budget);
        }
        out.try_reserve(text.len())
            .map_err(|_| PatternError::Budget)?;
        out.push_str(text);
    }
    Ok(())
}
