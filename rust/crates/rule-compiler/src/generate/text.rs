use nkdk_rule_model::*;
use std::{collections::BTreeMap, fmt::Write};

struct Context<'a> {
    definition: &'a TextTransform,
    lookahead: BTreeMap<String, usize>,
}
impl Context<'_> {
    fn class(&self, name: &str, unit: &str) -> String {
        let mut ranges = self
            .definition
            .classes
            .iter()
            .find(|class| class.name == name)
            .expect("linked character class")
            .ranges
            .clone();
        ranges.sort_unstable();
        let mut merged: Vec<(u16, u16)> = Vec::new();
        for (start, end) in ranges {
            if let Some(last) = merged.last_mut()
                && start <= last.1.saturating_add(1)
            {
                last.1 = last.1.max(end);
            } else {
                merged.push((start, end));
            }
        }
        let ranges = merged;
        if ranges.is_empty() {
            return "false".into();
        }
        format!(
            "matches!({unit}, {})",
            ranges
                .iter()
                .map(|(start, end)| format!("{start}..={end}"))
                .collect::<Vec<_>>()
                .join(" | ")
        )
    }
    fn flag(&self, name: &str) -> usize {
        self.definition
            .state
            .iter()
            .position(|flag| flag.name == name)
            .expect("linked flag")
    }
    fn predicate(&mut self, value: &TextPredicate) -> String {
        match &value.kind {
            TextCondition::Class(name) => self.class(name, "_unit"),
            TextCondition::Flag(name) => format!("_flag{}", self.flag(name)),
            TextCondition::TokenEmpty => "output.len() == start".into(),
            TextCondition::Not(value) => format!("!({})", self.predicate(value)),
            TextCondition::And(values) | TextCondition::Or(values) => {
                let separator = if matches!(value.kind, TextCondition::And(_)) {
                    " && "
                } else {
                    " || "
                };
                values
                    .iter()
                    .map(|value| format!("({})", self.predicate(value)))
                    .collect::<Vec<_>>()
                    .join(separator)
            }
            TextCondition::NextAfterRun { class, next } => {
                let next_id = self.lookahead.len();
                let index = *self.lookahead.entry(class.clone()).or_insert(next_id);
                let member = self.class(class, &format!("units[look{index}]"));
                let next = next.as_ref().map_or_else(
                    || format!("look{index} == units.len()"),
                    |class| {
                        format!(
                            "units.get(look{index}).is_some_and(|&_next| {})",
                            self.class(class, "_next")
                        )
                    },
                );
                format!(
                    "{{ if look{index} <= _index {{ look{index} = _index; while look{index} < units.len() && {member} {{ look{index} += 1; }} }} {next} }}"
                )
            }
        }
    }
    fn casing(&self, case: &TextCase) -> String {
        match case {
            TextCase::Identity => String::new(),
            TextCase::LowerFirstUnlessAllInClass(class) => {
                let member = self.class(class, "_unit");
                let mut output = format!(
                    "if !_output[_start..].iter().all(|&_unit| {member}) {{ _output[_start] = match _output[_start] {{\n"
                );
                for shift in &self.definition.result.lowercase {
                    writeln!(
                        output,
                        "{}..={} => (i32::from(_output[_start]) + ({})) as u16,",
                        shift.from.0, shift.from.1, shift.offset
                    )
                    .unwrap();
                }
                output.push_str("unit => unit, }; }\n");
                output
            }
        }
    }
}
fn empty(result: &EmptyTextResult) -> &'static str {
    match result {
        EmptyTextResult::Absent => "None",
        EmptyTextResult::EmptyText => "Some(String::new())",
    }
}

/// Emit direct transitions. No runtime rule tree or domain-specific callback is retained.
pub(super) fn generate(entry: u32, index: u32, definition: &TextTransform) -> String {
    let mut context = Context {
        definition,
        lookahead: BTreeMap::new(),
    };
    let mut transitions = String::new();
    for (index, transition) in definition.transitions.iter().enumerate() {
        if index != 0 {
            transitions.push_str("else ");
        }
        if let Some(when) = &transition.when {
            write!(transitions, "if {} ", context.predicate(when)).unwrap();
        }
        transitions.push_str("{\n");
        match transition.emit {
            TextEmit::Append => transitions.push_str("output.push(_unit);\n"),
            TextEmit::StartToken => {
                writeln!(transitions, "if output.len() > start {{ finish_token(&mut output, start, first); first = false; output.extend({:?}.encode_utf16()); start = output.len(); }} output.push(_unit);", definition.result.separator).unwrap();
            }
            TextEmit::Discard => {}
        }
        for flag in &transition.set {
            writeln!(
                transitions,
                "_flag{} = {};",
                context.flag(&flag.name),
                flag.value
            )
            .unwrap();
        }
        transitions.push_str("}\n");
    }
    let mutable = if definition
        .transitions
        .iter()
        .any(|transition| matches!(transition.emit, TextEmit::StartToken))
    {
        "mut "
    } else {
        ""
    };
    let mut output = format!(
        "fn text_{entry}_{index}(source: &str) -> core::Result<Option<String>> {{\nif source.is_empty() {{ return Ok({}); }}\nlet units: Vec<u16> = source.encode_utf16().collect(); let mut output: Vec<u16> = Vec::with_capacity(units.len()); let {mutable}start = 0; let {mutable}first = true;\n",
        empty(&definition.result.empty_input)
    );
    // Every run cursor advances monotonically, so lookahead cannot repeatedly scan a long run.
    for index in context.lookahead.values() {
        writeln!(output, "let mut look{index} = 0;").unwrap();
    }
    for (index, flag) in definition.state.iter().enumerate() {
        let mutable = if definition.transitions.iter().any(|transition| {
            transition
                .set
                .iter()
                .any(|assignment| assignment.name == flag.name)
        }) {
            "mut "
        } else {
            ""
        };
        writeln!(output, "let {mutable}_flag{index} = {};", flag.value).unwrap();
    }
    writeln!(output, "let finish_token = |_output: &mut Vec<u16>, _start: usize, first: bool| {{ if first {{ {} }} else {{ {} }} }};", context.casing(&definition.result.first), context.casing(&definition.result.rest)).unwrap();
    output.push_str("for (_index, &_unit) in units.iter().enumerate() {\n");
    output.push_str(&transitions);
    writeln!(output, "}} if output.is_empty() {{ return Ok({}); }} finish_token(&mut output, start, first); drop(units); String::from_utf16(&output).map(Some).map_err(|error| RuntimeDiagnostic::new(\"text.invalid-utf16\", error.to_string())) }}", empty(&definition.result.no_tokens)).unwrap();
    output
}
