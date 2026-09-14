//! Lexical input frames are independent of XML routes and YAML property names.
use super::*;
use crate::plan::RepresentationSide;
use std::fmt::Write;

pub(super) struct InputScope {
    inherited: usize,
    fields: Vec<(usize, usize)>,
    orders: [Vec<usize>; 2],
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
            let capture = location(field as usize);
            if super::declared_items::applies(&parts[capture.0], program) {
                captured.push(capture);
                continue;
            }
            let codec = scalar::Codec::resolve(&fields[field as usize].value, owner, program)?;
            if codec.input_method().is_none() {
                return Err(unsupported(
                    owner,
                    "An input capture requires a borrowable scalar value",
                ));
            }
            captured.push(location(field as usize));
        }
        let record = program.record(owner)?;
        let orders = [RepresentationSide::Xml, RepresentationSide::Yaml].map(|side| {
            let mut order = Vec::new();
            for field in record.schedule(side) {
                let (part, _) = location(*field);
                if !order.contains(&part) {
                    order.push(part);
                }
            }
            order
        });
        Ok(Self {
            inherited: owner.inputs.len(),
            fields: captured,
            orders,
        })
    }
    pub(super) fn order(&self, side: RepresentationSide) -> &[usize] {
        &self.orders[match side {
            RepresentationSide::Xml => 0,
            RepresentationSide::Yaml => 1,
        }]
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
    pub(super) fn finish(&self, id: u32, count: usize, side: RepresentationSide) -> String {
        let mut out = String::new();
        let mut ready = vec![false; count];
        for &part in self.order(side) {
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
