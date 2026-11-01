//! Lexical input frames are independent of XML routes and YAML property names.
use super::*;
use crate::plan::RepresentationSide;
use std::fmt::Write;

pub(super) struct InputScope {
    inherited: usize,
    fields: Vec<(usize, usize)>,
    choices: BTreeSet<usize>,
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
        let mut choices = BTreeSet::new();
        for &field in captures {
            let capture = location(field as usize);
            if super::choice_value::applies(&parts[capture.0], program) {
                choices.insert(captured.len());
                captured.push(capture);
                continue;
            }
            let local;
            let captured_part = if matches!(&parts[capture.0].xml, LinkedXml::Record(fields) if fields.iter().any(|field| field.file.is_some()))
            {
                local = super::value_adapters::local_usage(&parts[capture.0], program)?;
                &local
            } else {
                &parts[capture.0]
            };
            if super::declared_items::applies(captured_part, program) {
                captured.push(capture);
                continue;
            }
            let target = fields[field as usize]
                .value
                .as_reference()
                .and_then(|(id, _, _)| program.entries.iter().find(|entry| entry.id == id));
            // The collection adapter already exposes these rows through
            // input_field. Borrow that view instead of resolving a sequence
            // as a scalar (which also imposes scalar-only presence rules).
            if target.is_some_and(super::collections::borrowed_records) {
                captured.push(capture);
                continue;
            }
            let borrowed_record =
                target.is_some_and(|entry| matches!(entry.value, LinkedType::Record(_)));
            if borrowed_record
                && crate::plan::routes::record_usage(captured_part, program)?.is_some()
            {
                captured.push(capture);
                continue;
            }
            let codec = scalar::Codec::resolve(&fields[field as usize].value, owner, program)?;
            if codec.input_method().is_none()
                && !matches!(&codec, scalar::Codec::Forms(choice) if choice.constructible())
            {
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
            choices,
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
        for (slot, &(part, field)) in self.fields.iter().enumerate() {
            if ready.is_none_or(|ready| ready[part]) {
                if self.choices.contains(&slot) {
                    let input = super::choice_value::borrowed_input(
                        &format!("part_{id}_{part}"),
                        &format!("{prefix}p{part}"),
                    );
                    write!(out, "{input},").unwrap();
                    continue;
                }
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
