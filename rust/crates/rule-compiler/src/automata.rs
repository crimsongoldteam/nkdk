//! Build-time full-text selection. No declaration or regex compilation at runtime.
use regex_automata::{
    Input, MatchKind,
    dfa::{Automaton, dense::DFA},
};
use std::{
    collections::{BTreeSet, VecDeque},
    fmt::Write,
};

mod sequence;
pub(crate) use sequence::{Part, compile_sequences};

pub(crate) const STATE_BUDGET: usize = 65_536;
pub(crate) const BYTE_BUDGET: usize = 64 * 1024 * 1024;

#[derive(Debug, PartialEq, Eq)]
pub(crate) enum Error {
    Empty,
    Build(String),
    Overlap { left: usize, right: usize },
    Budget,
}
impl std::fmt::Display for Error {
    fn fmt(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Empty => formatter.write_str("Selection requires at least one form"),
            Self::Build(message) => formatter.write_str(message),
            Self::Overlap { left, right } => {
                write!(formatter, "Text forms {left} and {right} overlap")
            }
            Self::Budget => formatter.write_str("Text selection exceeds its analysis budget"),
        }
    }
}

pub(crate) fn compile(
    patterns: &[&str],
    state_budget: usize,
    byte_budget: usize,
) -> Result<DFA<Vec<u32>>, Error> {
    if patterns.is_empty() {
        return Err(Error::Empty);
    }
    let expressions = patterns
        .iter()
        .map(|pattern| format!(r"\A(?:{pattern})\z"))
        .collect::<Vec<_>>();
    let machine = DFA::builder()
        .configure(
            DFA::config()
                .match_kind(MatchKind::All)
                .dfa_size_limit(Some(byte_budget))
                .determinize_size_limit(Some(byte_budget)),
        )
        .build_many(&expressions)
        .map_err(|error| Error::Build(error.to_string()))?;
    check_disjoint(machine, patterns.len(), state_budget)
}

fn check_disjoint(
    machine: DFA<Vec<u32>>,
    count: usize,
    state_budget: usize,
) -> Result<DFA<Vec<u32>>, Error> {
    if count == 1 {
        return Ok(machine);
    }
    let start = machine
        .start_state_forward(&Input::new(""))
        .map_err(|error| Error::Build(error.to_string()))?;
    let mut seen = BTreeSet::from([start]);
    let mut pending = VecDeque::from([start]);
    while let Some(state) = pending.pop_front() {
        if seen.len() > state_budget {
            return Err(Error::Budget);
        }
        let terminal = machine.next_eoi_state(state);
        if machine.is_match_state(terminal) && machine.match_len(terminal) > 1 {
            return Err(Error::Overlap {
                left: machine.match_pattern(terminal, 0).as_usize(),
                right: machine.match_pattern(terminal, 1).as_usize(),
            });
        }
        for byte in 0..=u8::MAX {
            let next = machine.next_state(state, byte);
            if machine.is_quit_state(next) {
                return Err(Error::Build(
                    "Selection cannot use runtime quit states".into(),
                ));
            }
            if !machine.is_dead_state(next) && seen.insert(next) {
                if seen.len() > state_budget {
                    return Err(Error::Budget);
                }
                pending.push_back(next);
            }
        }
    }
    Ok(machine)
}

pub(crate) fn declaration(name: &str, machine: &DFA<Vec<u32>>) -> String {
    let (little, pad) = machine.to_bytes_little_endian();
    let little = &little[pad..];
    let (big, pad) = machine.to_bytes_big_endian();
    let big = &big[pad..];
    let mut out = format!(
        "#[repr(align(4))] struct {name}Bytes([u8;{}]);\n",
        little.len()
    );
    for (endian, bytes) in [("little", little), ("big", big)] {
        writeln!(out,"#[cfg(target_endian={endian:?})] static {name}_BYTES:{name}Bytes={name}Bytes({bytes:?});").unwrap();
    }
    writeln!(
        out,
        "static {name}:core::pattern::Pattern=core::pattern::Pattern::new(&{name}_BYTES.0);"
    )
    .unwrap();
    out
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn selection_is_total_disjoint_and_bounded_at_compile_time() {
        let machine = compile(&["left:[a-z]+", "право:[А-Яа-я]+", ""], 1024, 1 << 20).unwrap();
        let (bytes, padding) = machine.to_bytes_native_endian();
        let bytes = &bytes[padding..];
        let mut storage = vec![0; bytes.len() + 3].into_boxed_slice();
        let start = storage.as_ptr().align_offset(4);
        storage[start..start + bytes.len()].copy_from_slice(bytes);
        let storage = Box::leak(storage);
        let pattern =
            nkdk_conversion_core::pattern::Pattern::new(&storage[start..start + bytes.len()]);
        for (text, expected) in [
            ("left:abc", Some(0)),
            ("право:Имя", Some(1)),
            ("", Some(2)),
            ("left:a!", None),
            ("prefixleft:a", None),
        ] {
            assert_eq!(pattern.select(text).unwrap(), expected);
            assert_eq!(pattern.matches(text).unwrap(), expected.is_some());
        }
        assert!(matches!(
            compile(&["a.*", "ab"], 1024, 1 << 20),
            Err(Error::Overlap { left: 0, right: 1 })
        ));
        assert!(compile(&["a", "ab"], 1024, 1 << 20).is_ok());
        assert!(matches!(
            compile(&["", "a*"], 1024, 1 << 20),
            Err(Error::Overlap { .. })
        ));
        assert!(matches!(
            compile(&["a", "b"], 1, 1 << 20),
            Err(Error::Budget)
        ));
        assert!(matches!(compile(&[], 1024, 1 << 20), Err(Error::Empty)));
        assert!(compile(&["["], 1024, 1 << 20).is_err());
        assert!(compile(&["a+"], 1024, 1).is_err());
        use nkdk_conversion_core::text_pattern::{Part as Layout, Pattern as LayoutPattern};
        let mut level = vec![String::new()];
        let mut samples = level.clone();
        for _ in 0..6 {
            level = level
                .iter()
                .flat_map(|prefix| {
                    ['a', 'b', ':', '\u{416}']
                        .into_iter()
                        .map(move |character| format!("{prefix}{character}"))
                })
                .collect();
            samples.extend(level.iter().cloned());
        }
        for delimiter in ["aa", "aba", "aab", "::", "\u{416}a"] {
            let cells =
                compile_sequences(&[vec![Part::Cell(delimiter.into())]], 4096, 1 << 20).unwrap();
            for text in &samples {
                assert_eq!(
                    cells.try_search_fwd(&Input::new(text)).unwrap().is_some(),
                    !text.contains(delimiter),
                    "cell {delimiter:?}: {text:?}"
                );
            }
            let words = ["", "a", "b"];
            let machine = compile_sequences(
                &[vec![
                    Part::Until(delimiter.into()),
                    Part::Words(words.iter().map(|word| word.to_string()).collect()),
                ]],
                4096,
                1 << 20,
            )
            .unwrap();
            let parts = [Layout::Slot(0), Layout::Literal(delimiter), Layout::Slot(1)];
            let layout = LayoutPattern::<2>::new(&parts).unwrap();
            for text in &samples {
                let expected = layout
                    .parse(text)
                    .is_ok_and(|fields| words.contains(&fields[1]));
                assert_eq!(
                    machine.try_search_fwd(&Input::new(text)).unwrap().is_some(),
                    expected,
                    "{delimiter:?}: {text:?}"
                );
            }
        }
        assert!(
            compile_sequences(
                &[
                    vec![Part::Until("aa".into()), Part::Words(vec!["a".into()])],
                    vec![Part::Literal("aaaa".into())]
                ],
                4096,
                1 << 20
            )
            .is_ok()
        );
        assert!(matches!(
            compile_sequences(
                &[
                    vec![Part::Until("aa".into()), Part::Words(vec!["a".into()])],
                    vec![Part::Literal("aaa".into())]
                ],
                4096,
                1 << 20
            ),
            Err(Error::Overlap { .. })
        ));
        assert!(compile_sequences(&[vec![Part::Until("".into())]], 4096, 1 << 20).is_err());
        assert!(compile_sequences(&[vec![Part::Until("aaaa".into())]], 2, 1 << 20).is_err());
    }
}
