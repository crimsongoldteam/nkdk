//! Lexical input frames are independent of XML routes and YAML property names.
use super::*;
use std::fmt::Write;

pub(super) struct InputScope {
    inherited: usize,
    fields: Vec<(usize, usize)>,
    order: Vec<usize>,
}
impl InputScope {
    pub(super) fn prepare(
        owner: &LinkedEntry,
        parts: &[LinkedEntry],
        captures: &[u32],
        program: &Program,
    ) -> Result<Self, Diagnostic> {
        let LinkedType::Record(fields) = &owner.value else {
            unreachable!()
        };
        let location = |index: usize| {
            parts
                .iter()
                .enumerate()
                .find_map(|(part, entry)| {
                    let LinkedType::Record(part_fields) = &entry.value else {
                        unreachable!()
                    };
                    part_fields
                        .iter()
                        .position(|field| field.name == fields[index].name)
                        .map(|field| (part, field))
                })
                .expect("partitioned owner field")
        };
        let mut captured = Vec::new();
        for &field in captures {
            let codec = scalar::Codec::resolve(&fields[field as usize].value, owner, program)?;
            if !matches!(
                codec,
                scalar::Codec::Text
                    | scalar::Codec::TextTable(_)
                    | scalar::Codec::Boolean(..)
                    | scalar::Codec::Decimal
                    | scalar::Codec::FormattedDecimal(_)
                    | scalar::Codec::Enumeration(..)
            ) {
                return Err(unsupported(
                    owner,
                    "An input capture requires a borrowable scalar value",
                ));
            }
            captured.push(location(field as usize));
        }
        let mut order = Vec::new();
        for field in &program.record(owner)?.schedule {
            let (part, _) = location(*field);
            if !order.contains(&part) {
                order.push(part);
            }
        }
        Ok(Self {
            inherited: owner.inputs.len(),
            fields: captured,
            order,
        })
    }
    pub(super) fn order(&self) -> &[usize] {
        &self.order
    }
    pub(super) fn bind(&self, id: u32, prefix: &str, ready: Option<&[bool]>) -> String {
        if self.fields.is_empty() {
            return String::new();
        }
        let mut out = String::from("let _captured_slots=[");
        for slot in 0..self.inherited {
            write!(out, "inputs.slot({slot}),").unwrap();
        }
        for &(part, field) in &self.fields {
            if ready.is_none_or(|ready| ready[part]) {
                write!(
                    out,
                    "part_{id}_{part}::input_field(&{prefix}p{part},{field}).or(Some(core::inputs::InputRef::MissingValue)),"
                )
                .unwrap();
            } else {
                out.push_str("None,");
            }
        }
        out.push_str("];let _captured_inputs=inputs.rebind(&_captured_slots);let inputs=&_captured_inputs;\n");
        out
    }
    pub(super) fn finish(&self, id: u32, count: usize) -> String {
        let mut out = String::new();
        let mut ready = vec![false; count];
        for &part in &self.order {
            let binding = self.bind(id, "", Some(&ready));
            writeln!(
                out,
                "let p{part}={{{binding}self.p{part}.finish(source,inputs)?}};"
            )
            .unwrap();
            ready[part] = true;
        }
        out
    }
}
