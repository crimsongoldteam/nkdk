//! Build declared rows from semantic expressions without serializing either format.
use super::*;
use std::fmt::Write;

pub(super) fn record_expression(
    expression: &LinkedExpression,
    owner: &LinkedEntry,
    target: &LinkedEntry,
    program: &Program,
    name: &str,
) -> Result<String, Diagnostic> {
    let mut code = String::new();
    let slots = record_slots(
        expression,
        owner,
        target,
        program,
        &mut code,
        "default_field",
    )?;
    Ok(format!(
        "{{{code}let slots=[{}];let source=core::inputs::RecordView::new(&slots);{name}::from_record(&source,_inputs)?}}",
        slots.join(",")
    ))
}

fn borrowed_slots(
    row: &LinkedEntry,
    program: &Program,
    source: &str,
) -> Result<String, Diagnostic> {
    let LinkedType::Record(fields) = &row.value else {
        unreachable!()
    };
    fields
        .iter()
        .enumerate()
        .map(|(index, field)| {
            let Ok(codec) = scalar::Codec::resolve(&field.value, row, program) else {
                return Ok(format!("{source}.field({index})"));
            };
            let Some(method) = codec.input_method() else {
                return Ok(format!("{source}.field({index})"));
            };
            let value = match method {
                "text" => format!("Text({source}.text({index})?)"),
                "boolean" => format!("Boolean({source}.boolean({index})?)"),
                "decimal" => format!("Decimal({source}.decimal({index})?)"),
                "calendar" => format!("Calendar({source}.calendar({index})?)"),
                _ => unreachable!("borrowable scalar"),
            };
            Ok(format!("Some(core::inputs::InputRef::{value})"))
        })
        .collect::<Result<Vec<_>, _>>()
        .map(|slots| slots.join(","))
}

pub(super) fn missing(
    value: Option<&LinkedExpression>,
    entry: &LinkedEntry,
    row: &LinkedEntry,
    program: &Program,
    constructible: bool,
    id: u32,
) -> Result<String, Diagnostic> {
    let Some(value) = value else {
        return Ok(format!(
            "Err::<V{id},_>(RuntimeDiagnostic::new(\"value.missing\",\"Missing collection\"))?"
        ));
    };
    match &value.kind {
        LinkedExpressionKind::Absent => Ok(format!(
            "V{id}{{rows:Vec::new(),present:false,nil:false,raw:None@collection_marks_initial@}}"
        )),
        LinkedExpressionKind::Input(slot) => {
            if !constructible {
                return Err(unsupported(
                    row,
                    "Semantic construction requires borrowable scalar record fields",
                ));
            }
            let slots = borrowed_slots(row, program, "source")?;
            Ok(format!(
                "{{let mut constructed_rows=Vec::new();for source in inputs.records({slot})?{{constructed_rows.push(item_{id}::construct(&[{}],inputs)?);}}V{id}{{rows:constructed_rows,present:true,nil:false,raw:None@collection_marks_initial@}}}}",
                slots
            ))
        }
        LinkedExpressionKind::Operation {
            operator: LinkedOperator::Filter(slot),
            arguments,
        } => {
            if !constructible {
                return Err(unsupported(
                    row,
                    "Semantic filtering requires borrowable scalar record fields",
                ));
            }
            let (constants, sequence, predicate) =
                expressions::borrowed_filter(entry, program, &arguments[0], *slot, &arguments[1])?;
            let slots = borrowed_slots(row, program, "source")?;
            Ok(format!(
                "{{let _inputs=inputs;{constants}let mut constructed_rows=Vec::new();for v{slot} in {sequence}{{if {predicate}{{let source=v{slot};constructed_rows.push(item_{id}::construct(&[{}],inputs)?);}}}}V{id}{{rows:constructed_rows,present:true,nil:false,raw:None@collection_marks_initial@}}}}",
                slots
            ))
        }
        LinkedExpressionKind::Operation {
            operator: LinkedOperator::Map(slot),
            arguments,
        } => map(arguments, *slot, entry, row, program, constructible, id),
        LinkedExpressionKind::Operation {
            operator: LinkedOperator::Conditional,
            arguments,
        } => {
            let (constants, condition) = expressions::expression(entry, program, &arguments[0])?;
            let yes = missing(Some(&arguments[1]), entry, row, program, constructible, id)?;
            let no = missing(Some(&arguments[2]), entry, row, program, constructible, id)?;
            Ok(format!(
                "{{let _inputs=inputs;{constants} if {condition}{{{yes}}}else{{{no}}}}}"
            ))
        }
        LinkedExpressionKind::Operation {
            operator: LinkedOperator::SequenceConcat,
            ..
        } => {
            let (code, capacity) = append(value, entry, row, program, constructible, id)?;
            Ok(format!(
                "{{let mut constructed_rows=Vec::with_capacity({capacity});{code}V{id}{{rows:constructed_rows,present:true,nil:false,raw:None@collection_marks_initial@}}}}"
            ))
        }
        LinkedExpressionKind::Operation {
            operator: LinkedOperator::Sequence,
            arguments,
        } => {
            let mut rows = Vec::new();
            for value in arguments {
                if !constructible {
                    return Err(unsupported(
                        row,
                        "Semantic construction requires borrowable scalar record fields",
                    ));
                }
                rows.push(record(value, entry, row, program, id)?);
            }
            Ok(format!(
                "V{id}{{rows:vec![{}],present:true,nil:false,raw:None@collection_marks_initial@}}",
                rows.join(",")
            ))
        }
        _ => Err(unsupported(
            entry,
            "Declared collection construction requires a sequence, absence or conditional",
        )),
    }
}

fn map(
    arguments: &[LinkedExpression],
    slot: u32,
    entry: &LinkedEntry,
    row: &LinkedEntry,
    program: &Program,
    constructible: bool,
    id: u32,
) -> Result<String, Diagnostic> {
    let code = map_rows(arguments, slot, entry, row, program, constructible, id)?;
    Ok(format!(
        "{{let mut constructed_rows=Vec::new();{code}V{id}{{rows:constructed_rows,present:true,nil:false,raw:None@collection_marks_initial@}}}}"
    ))
}

fn map_rows(
    arguments: &[LinkedExpression],
    slot: u32,
    entry: &LinkedEntry,
    row: &LinkedEntry,
    program: &Program,
    constructible: bool,
    id: u32,
) -> Result<String, Diagnostic> {
    if !constructible {
        return Err(unsupported(
            row,
            "Semantic mapping requires borrowable scalar record fields",
        ));
    }
    let LinkedType::Record(fields) = &row.value else {
        unreachable!()
    };
    let LinkedExpressionKind::Operation {
        operator: LinkedOperator::Record(names),
        arguments: values,
    } = &arguments[1].kind
    else {
        return Err(unsupported(
            entry,
            "Declared mapping requires a record value",
        ));
    };
    let ordered = fields
        .iter()
        .map(|field| {
            names
                .iter()
                .position(|name| name == &field.name)
                .map(|index| &values[index])
                .ok_or_else(|| unsupported(entry, "Mapped record field is absent"))
        })
        .collect::<Result<Vec<_>, _>>()?;
    let expressions::BorrowedMap {
        constants,
        sequence,
        predicate,
        values: lowered,
        text_sequence,
    } = expressions::borrowed_map(entry, program, &arguments[0], slot, &ordered)?;
    let mut bindings = String::new();
    let mut inputs = Vec::new();
    for (index, (field, value)) in fields.iter().zip(lowered).enumerate() {
        writeln!(bindings, "let m{index}={value};").unwrap();
        let method = scalar::Codec::resolve(&field.value, row, program)?
            .input_method()
            .expect("constructible scalar");
        let input = match method {
            "text" => format!("Text(AsRef::<str>::as_ref(&m{index}))"),
            "boolean" => format!("Boolean(m{index})"),
            "decimal" => format!("Decimal(m{index})"),
            "calendar" => format!("Calendar(m{index})"),
            _ => unreachable!("borrowable scalar"),
        };
        inputs.push(format!("Some(core::inputs::InputRef::{input})"));
    }
    let guard = predicate.map_or_else(String::new, |predicate| {
        format!("if !({predicate}){{continue;}}")
    });
    let iteration = if text_sequence {
        format!(
            "for item_{slot} in {sequence}{{let InputValue::Text(v{slot})=item_{slot} else{{return Err(RuntimeDiagnostic::new(\"input.type\",\"Expected text item\"));}};"
        )
    } else {
        format!("for v{slot} in {sequence}{{")
    };
    Ok(format!(
        "{{let _inputs=inputs;{constants}{iteration}{guard}{bindings}constructed_rows.push(item_{id}::construct(&[{}],inputs)?);}}}}",
        inputs.join(",")
    ))
}
fn append(
    value: &LinkedExpression,
    entry: &LinkedEntry,
    row: &LinkedEntry,
    program: &Program,
    constructible: bool,
    id: u32,
) -> Result<(String, usize), Diagnostic> {
    if let LinkedExpressionKind::Input(slot) = value.kind {
        if !constructible {
            return Err(unsupported(
                row,
                "Semantic concatenation requires borrowable scalar record fields",
            ));
        }
        let slots = borrowed_slots(row, program, "source")?;
        return Ok((
            format!(
                "for source in inputs.records({slot})?{{constructed_rows.push(item_{id}::construct(&[{}],inputs)?);}}",
                slots
            ),
            0,
        ));
    }
    let LinkedExpressionKind::Operation {
        operator,
        arguments,
    } = &value.kind
    else {
        return Err(unsupported(
            entry,
            "Concatenation requires present sequences",
        ));
    };
    match operator {
        LinkedOperator::Conditional => {
            let (constants, condition) = expressions::expression(entry, program, &arguments[0])?;
            let (yes, left) = append(&arguments[1], entry, row, program, constructible, id)?;
            let (no, right) = append(&arguments[2], entry, row, program, constructible, id)?;
            let branch = if no.is_empty() {
                format!("if {condition}{{{yes}}}")
            } else if yes.is_empty() {
                format!("if !({condition}){{{no}}}")
            } else {
                format!("if {condition}{{{yes}}}else{{{no}}}")
            };
            Ok((
                format!("{{let _inputs=inputs;{constants}{branch}}}"),
                left.max(right),
            ))
        }
        LinkedOperator::SequenceConcat => {
            let mut code = String::new();
            let mut capacity = 0;
            for argument in arguments {
                let (part, count) = append(argument, entry, row, program, constructible, id)?;
                code.push_str(&part);
                capacity += count;
            }
            Ok((code, capacity))
        }
        LinkedOperator::Sequence => {
            let mut code = String::new();
            for argument in arguments {
                if !constructible {
                    return Err(unsupported(
                        row,
                        "Semantic construction requires borrowable scalar record fields",
                    ));
                }
                let value = record(argument, entry, row, program, id)?;
                write!(code, "constructed_rows.push({value});").unwrap();
            }
            Ok((code, arguments.len()))
        }
        LinkedOperator::Map(slot) => Ok((
            map_rows(arguments, *slot, entry, row, program, constructible, id)?,
            0,
        )),
        _ => Err(unsupported(
            entry,
            "Concatenation requires declared sequence constructors",
        )),
    }
}

pub(super) fn record(
    value: &LinkedExpression,
    entry: &LinkedEntry,
    row: &LinkedEntry,
    program: &Program,
    id: u32,
) -> Result<String, Diagnostic> {
    let mut code = String::from("{let _inputs=inputs;");
    let slots = record_slots(value, entry, row, program, &mut code, "v")?;
    write!(
        code,
        "item_{id}::construct(&[{}],inputs)?}}",
        slots.join(",")
    )
    .unwrap();
    Ok(code)
}

pub(super) fn scalar_slot(
    argument: &LinkedExpression,
    entry: &LinkedEntry,
    codec: &scalar::Codec<'_>,
    program: &Program,
    code: &mut String,
    name: &str,
) -> Result<String, Diagnostic> {
    if codec.input_method().is_some()
        && let Some((constants, cell)) = expressions::semantic_cell(entry, program, argument)?
    {
        writeln!(code, "let {name}={{{constants}{cell}}};").unwrap();
        return Ok(name.into());
    }
    let (constants, expression) = if matches!(codec, scalar::Codec::Calendar { .. }) {
        expressions::calendar_expression(entry, program, argument, None)?
    } else {
        expressions::expression(entry, program, argument)?
    };
    writeln!(code, "let {name}={{{constants}{expression}}};").unwrap();
    let value = match codec.input_method() {
        Some("text") => format!("Text(AsRef::<str>::as_ref(&{name}))"),
        Some("boolean") => format!("Boolean({name})"),
        Some("decimal") => format!("Decimal({name})"),
        Some("calendar") => format!("Calendar({name})"),
        _ => {
            return Err(unsupported(
                entry,
                "Scalar construction has no borrowed representation",
            ));
        }
    };
    Ok(format!("Some(core::inputs::InputRef::{value})"))
}

pub(super) fn record_slots(
    value: &LinkedExpression,
    entry: &LinkedEntry,
    row: &LinkedEntry,
    program: &Program,
    code: &mut String,
    prefix: &str,
) -> Result<Vec<String>, Diagnostic> {
    let LinkedExpressionKind::Operation {
        operator: LinkedOperator::Record(names),
        arguments,
    } = &value.kind
    else {
        return Err(unsupported(entry, "Expected a declared record constructor"));
    };
    let LinkedType::Record(fields) = &row.value else {
        unreachable!()
    };
    if names.is_empty() && !fields.is_empty() {
        return Err(unsupported(
            entry,
            "Implicit record fields require the declared default constructor boundary",
        ));
    }
    let mut slots = Vec::new();
    for (index, field) in fields.iter().enumerate() {
        let slot = names
            .iter()
            .position(|name| name == &field.name)
            .expect("typed constructor field");
        let argument = &arguments[slot];
        if matches!(argument.kind, LinkedExpressionKind::Absent) {
            slots.push("None".into());
            continue;
        }
        let name = format!("{prefix}{index}");
        let Ok(codec) = scalar::Codec::resolve(&field.value, row, program) else {
            let (id, _, _) = field
                .value
                .as_reference()
                .ok_or_else(|| unsupported(row, "Record constructor needs a referenced record"))?;
            let target = program
                .entries
                .iter()
                .find(|entry| entry.id == id)
                .expect("linked record");
            if super::record_construction::choice_variants(target).is_some() {
                slots.push(choice_slot(argument, entry, target, program, code, &name)?);
                continue;
            }
            if super::collections::borrowed_records(target)
                || super::record_construction::sequence_row(target, program).is_some()
            {
                slots.push(sequence_slot(
                    argument, entry, target, program, code, &name,
                )?);
                continue;
            }
            let nested = record_slots(argument, entry, target, program, code, &format!("{name}_"))?;
            writeln!(
                code,
                "let {name}_slots=[{}];let {name}=core::inputs::RecordView::new(&{name}_slots);",
                nested.join(",")
            )
            .unwrap();
            slots.push(format!("Some(core::inputs::InputRef::Record(&{name}))"));
            continue;
        };
        if matches!(&codec, scalar::Codec::Sequence(sequence) if !sequence.framed_value()) {
            let id = field
                .value
                .as_reference()
                .expect("text sequence reference")
                .0;
            let target = program
                .entries
                .iter()
                .find(|entry| entry.id == id)
                .expect("linked text sequence");
            slots.push(sequence_slot(
                argument, entry, target, program, code, &name,
            )?);
            continue;
        }
        if matches!(
            codec,
            scalar::Codec::Pattern(_) | scalar::Codec::Forms(_) | scalar::Codec::Sequence(_)
        ) {
            let (id, _, _) = field
                .value
                .as_reference()
                .expect("structured scalar reference");
            let target = program
                .entries
                .iter()
                .find(|entry| entry.id == id)
                .expect("linked value");
            if matches!(codec, scalar::Codec::Forms(_)) {
                slots.push(choice_slot(argument, entry, target, program, code, &name)?);
            } else {
                let fields =
                    record_slots(argument, entry, target, program, code, &format!("{name}_"))?;
                writeln!(code,"let {name}_slots=[{}];let {name}=core::inputs::RecordView::new(&{name}_slots);",fields.join(",")).unwrap();
                slots.push(format!("Some(core::inputs::InputRef::Record(&{name}))"));
            }
            continue;
        }
        slots.push(scalar_slot(argument, entry, &codec, program, code, &name)?);
    }
    Ok(slots)
}

// Literal rows and borrowed rows use the same constructor input boundary.
pub(super) fn sequence_slot(
    argument: &LinkedExpression,
    entry: &LinkedEntry,
    target: &LinkedEntry,
    program: &Program,
    code: &mut String,
    name: &str,
) -> Result<String, Diagnostic> {
    if let LinkedExpressionKind::Operation {
        operator: LinkedOperator::Sequence,
        arguments: rows,
    } = &argument.kind
    {
        let inline;
        let item = if let Some(item) = super::record_construction::sequence_row(target, program) {
            item
        } else {
            let LinkedType::Sequence(item) = &target.value else {
                unreachable!("sequence constructor")
            };
            if let Some((id, _, _)) = item.as_reference() {
                program
                    .entries
                    .iter()
                    .find(|entry| entry.id == id)
                    .expect("linked sequence item")
            } else {
                inline = LinkedEntry {
                    value: *item.clone(),
                    ..target.clone()
                };
                &inline
            }
        };
        let choice = matches!(item.value, LinkedType::Choice(_));
        let view = if choice {
            "ChoiceRecordView"
        } else {
            "RecordView"
        };
        let mut names = Vec::new();
        for (index, row) in rows.iter().enumerate() {
            let row_name = format!("{name}_row{index}");
            if choice {
                let cell = choice_slot(
                    row,
                    entry,
                    item,
                    program,
                    code,
                    &format!("{row_name}_choice"),
                )?;
                writeln!(code,"let {row_name}=match {cell}{{Some(core::inputs::InputRef::Choice{{variant,fields}})=>core::inputs::ChoiceRecordView::new(variant,fields),_=>return Err(RuntimeDiagnostic::new(\"input.type\",\"Semantic sequence item is not a selected choice\"))}};").unwrap();
            } else {
                let slots = record_slots(row, entry, item, program, code, &format!("{row_name}_"))?;
                writeln!(code,"let {row_name}_slots=[{}];let {row_name}=core::inputs::RecordView::new(&{row_name}_slots);",slots.join(",")).unwrap();
            }
            names.push(row_name);
        }
        writeln!(
            code,
            "let {name}_rows:[core::inputs::{view}<'_>;{}]=[{}];",
            names.len(),
            names.join(",")
        )
        .unwrap();
        Ok(format!(
            "Some(core::inputs::InputRef::Records(core::inputs::Records::from_array(&{name}_rows)))"
        ))
    } else {
        let (constants, expression) = expressions::expression(entry, program, argument)?;
        writeln!(code, "let {name}={{{constants}{expression}}};").unwrap();
        Ok(format!("Some(core::inputs::InputRef::Records({name}))"))
    }
}

// Scalar and structural variants share the same semantic payload lowering.
pub(super) fn choice_slot(
    argument: &LinkedExpression,
    entry: &LinkedEntry,
    target: &LinkedEntry,
    program: &Program,
    code: &mut String,
    name: &str,
) -> Result<String, Diagnostic> {
    let LinkedExpressionKind::Operation {
        operator: LinkedOperator::ConstructVariant(index),
        arguments,
    } = &argument.kind
    else {
        let (constants, expression) = expressions::expression(entry, program, argument)?;
        writeln!(code, "let {name}_value={{{constants}{expression}}};").unwrap();
        return Ok(format!("Some({name}_value)"));
    };
    let LinkedType::Choice(variants) = &target.value else {
        unreachable!()
    };
    let (id, _, _) = variants[*index as usize]
        .value
        .as_reference()
        .expect("referenced variant");
    let row = program
        .entries
        .iter()
        .find(|entry| entry.id == id)
        .expect("linked variant");
    let fields = if matches!(row.value, LinkedType::Record(_)) {
        record_slots(
            &arguments[0],
            entry,
            row,
            program,
            code,
            &format!("{name}_"),
        )?
    } else if matches!(row.value, LinkedType::Choice(_)) {
        vec![choice_slot(
            &arguments[0],
            entry,
            row,
            program,
            code,
            &format!("{name}_inner"),
        )?]
    } else if super::collections::borrowed_records(row) {
        vec![sequence_slot(
            &arguments[0],
            entry,
            row,
            program,
            code,
            name,
        )?]
    } else {
        let codec = scalar::Codec::resolve(&variants[*index as usize].value, target, program)?;
        vec![scalar_slot(
            &arguments[0],
            entry,
            &codec,
            program,
            code,
            &format!("{name}_value"),
        )?]
    };
    writeln!(
        code,
        "let {name}_slots=[{}];let {name}=core::inputs::RecordView::new(&{name}_slots);",
        fields.join(",")
    )
    .unwrap();
    Ok(format!(
        "Some(core::inputs::InputRef::Choice{{variant:{index},fields:&{name}}})"
    ))
}
