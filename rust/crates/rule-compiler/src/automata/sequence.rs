use super::*;
use regex_automata::{
    nfa::thompson::{Builder, Transition},
    util::{look::Look, primitives::StateID},
};

#[derive(Clone)]
pub(crate) enum Part {
    Literal(String),
    Words(Vec<String>),
    AsciiDigits(usize),
    Until(String),
    Rest,
    Cell(String),
}

fn build_error(error: impl std::fmt::Display) -> Error {
    Error::Build(error.to_string())
}

pub(crate) fn compile_sequences(
    patterns: &[Vec<Part>],
    state_budget: usize,
    byte_budget: usize,
) -> Result<DFA<Vec<u32>>, Error> {
    if patterns.is_empty() {
        return Err(Error::Empty);
    }
    let mut builder = Builder::new();
    builder
        .set_size_limit(Some(byte_budget))
        .map_err(build_error)?;
    // Source strings are UTF-8. Byte transitions mirror the text scanner exactly.
    builder.set_utf8(false);
    let mut starts = Vec::new();
    for pattern in patterns {
        builder.start_pattern().map_err(build_error)?;
        let matched = builder.add_match().map_err(build_error)?;
        let mut tail = builder.add_look(matched, Look::End).map_err(build_error)?;
        for part in pattern.iter().rev() {
            tail = match part {
                Part::Literal(text) => literal(&mut builder, text, tail)?,
                Part::Words(words) => {
                    let mut alternatives = Vec::new();
                    for word in words {
                        alternatives.push(literal(&mut builder, word, tail)?);
                    }
                    builder.add_union(alternatives).map_err(build_error)?
                }
                Part::AsciiDigits(count) => {
                    let mut digits = tail;
                    for _ in 0..*count {
                        digits = builder
                            .add_range(Transition {
                                start: b'0',
                                end: b'9',
                                next: digits,
                            })
                            .map_err(build_error)?;
                    }
                    digits
                }
                Part::Until(delimiter) => until(
                    &mut builder,
                    delimiter,
                    tail,
                    state_budget,
                    byte_budget,
                    true,
                )?,
                Part::Cell(separator) => until(
                    &mut builder,
                    separator,
                    tail,
                    state_budget,
                    byte_budget,
                    false,
                )?,
                Part::Rest => {
                    let repeat = builder.add_union(vec![tail]).map_err(build_error)?;
                    let next = builder
                        .add_range(Transition {
                            start: 0,
                            end: 255,
                            next: repeat,
                        })
                        .map_err(build_error)?;
                    builder.patch(repeat, next).map_err(build_error)?;
                    repeat
                }
            };
        }
        let start = builder.add_look(tail, Look::Start).map_err(build_error)?;
        builder.finish_pattern(start).map_err(build_error)?;
        starts.push(start);
    }
    let start = builder.add_union(starts).map_err(build_error)?;
    let nfa = builder.build(start, start).map_err(build_error)?;
    if nfa.states().len() > state_budget {
        return Err(Error::Budget);
    }
    let machine = DFA::builder()
        .configure(
            DFA::config()
                .match_kind(MatchKind::All)
                .dfa_size_limit(Some(byte_budget))
                .determinize_size_limit(Some(byte_budget)),
        )
        .build_from_nfa(&nfa)
        .map_err(build_error)?;
    check_disjoint(machine, patterns.len(), state_budget)
}

fn literal(builder: &mut Builder, text: &str, mut tail: StateID) -> Result<StateID, Error> {
    for &byte in text.as_bytes().iter().rev() {
        tail = builder
            .add_range(Transition {
                start: byte,
                end: byte,
                next: tail,
            })
            .map_err(build_error)?;
    }
    Ok(tail)
}

/// Deterministic prefix states consume the first complete delimiter and then leave.
fn until(
    builder: &mut Builder,
    delimiter: &str,
    tail: StateID,
    budget: usize,
    byte_budget: usize,
    consume: bool,
) -> Result<StateID, Error> {
    let terminal = if consume {
        tail
    } else {
        builder.add_fail().map_err(build_error)?
    };
    let bytes = delimiter.as_bytes();
    if bytes.is_empty() {
        return Err(Error::Build("Empty delimiter".into()));
    }
    if bytes.len() > budget {
        return Err(Error::Budget);
    }
    let mut scratch = bytes
        .len()
        .checked_mul(
            std::mem::size_of::<usize>()
                + std::mem::size_of::<StateID>()
                + std::mem::size_of::<Vec<Transition>>(),
        )
        .filter(|size| *size <= byte_budget)
        .ok_or(Error::Budget)?;
    let mut fallback = vec![0; bytes.len()];
    for index in 1..bytes.len() {
        let mut prefix = fallback[index - 1];
        while prefix > 0 && bytes[index] != bytes[prefix] {
            prefix = fallback[prefix - 1];
        }
        if bytes[index] == bytes[prefix] {
            prefix += 1;
        }
        fallback[index] = prefix;
    }
    let states = (0..bytes.len())
        .map(|_| builder.add_empty().map_err(build_error))
        .collect::<Result<Vec<_>, _>>()?;
    // Compressed transition rows allow prefix fallback without rescanning prefixes.
    let mut rows: Vec<Vec<Transition>> = Vec::with_capacity(bytes.len());
    for index in 0..bytes.len() {
        let mut row: Vec<Transition> = Vec::new();
        for byte in 0..=u8::MAX {
            let next = if byte == bytes[index] {
                if index + 1 == bytes.len() {
                    terminal
                } else {
                    states[index + 1]
                }
            } else if index == 0 {
                states[0]
            } else {
                let previous = &rows[fallback[index - 1]];
                previous[previous.partition_point(|transition| transition.end < byte)].next
            };
            if let Some(last) = row.last_mut()
                && last.next == next
            {
                last.end = byte;
            } else {
                row.push(Transition {
                    start: byte,
                    end: byte,
                    next,
                });
            }
        }
        scratch = scratch
            .checked_add(row.capacity() * std::mem::size_of::<Transition>())
            .ok_or(Error::Budget)?;
        if builder
            .memory_usage()
            .checked_add(scratch)
            .is_none_or(|size| size > byte_budget)
        {
            return Err(Error::Budget);
        }
        let sparse = builder.add_sparse(row.clone()).map_err(build_error)?;
        if builder
            .memory_usage()
            .checked_add(scratch)
            .is_none_or(|size| size > byte_budget)
        {
            return Err(Error::Budget);
        }
        let next = if consume {
            sparse
        } else {
            builder.add_union(vec![tail, sparse]).map_err(build_error)?
        };
        builder.patch(states[index], next).map_err(build_error)?;
        rows.push(row);
    }
    Ok(states[0])
}
