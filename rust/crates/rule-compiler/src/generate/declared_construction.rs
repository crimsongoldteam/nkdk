//! Build declared rows from semantic expressions without serializing either format.
use super::*;
use std::fmt::Write;

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
            let method = scalar::Codec::resolve(&field.value, row, program)?
                .input_method()
                .expect("constructible scalar");
            let value = match method {
                "text" => format!("Text({source}.text({index})?)"),
                "boolean" => format!("Boolean({source}.boolean({index})?)"),
                "decimal" => format!("Decimal({source}.decimal({index})?)"),
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
        LinkedExpressionKind::Absent => {
            Ok(format!("V{id}{{rows:Vec::new(),present:false,raw:None}}"))
        }
        LinkedExpressionKind::Input(slot) => {
            if !constructible {
                return Err(unsupported(
                    row,
                    "Semantic construction requires borrowable scalar record fields",
                ));
            }
            let slots = borrowed_slots(row, program, "source")?;
            Ok(format!(
                "{{let mut constructed_rows=Vec::new();for source in inputs.records({slot})?{{constructed_rows.push(item_{id}::construct(&[{}],inputs)?);}}V{id}{{rows:constructed_rows,present:true,raw:None}}}}",
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
                "{{let _inputs=inputs;{constants}let mut constructed_rows=Vec::new();for v{slot} in {sequence}{{if {predicate}{{let source=v{slot};constructed_rows.push(item_{id}::construct(&[{}],inputs)?);}}}}V{id}{{rows:constructed_rows,present:true,raw:None}}}}",
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
                "{{let mut constructed_rows=Vec::with_capacity({capacity});{code}V{id}{{rows:constructed_rows,present:true,raw:None}}}}"
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
                "V{id}{{rows:vec![{}],present:true,raw:None}}",
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
        "{{let mut constructed_rows=Vec::new();{code}V{id}{{rows:constructed_rows,present:true,raw:None}}}}"
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
    let (constants, sequence, predicate, lowered) =
        expressions::borrowed_map(entry, program, &arguments[0], slot, &ordered)?;
    let mut bindings = String::new();
    let mut inputs = Vec::new();
    for (index, (field, value)) in fields.iter().zip(lowered).enumerate() {
        writeln!(bindings, "let m{index}={value};").unwrap();
        let method = scalar::Codec::resolve(&field.value, row, program)?
            .input_method()
            .expect("constructible scalar");
        let input = match method {
            "text" => format!("Text(m{index}.as_ref())"),
            "boolean" => format!("Boolean(m{index})"),
            "decimal" => format!("Decimal(m{index})"),
            _ => unreachable!("borrowable scalar"),
        };
        inputs.push(format!("Some(core::inputs::InputRef::{input})"));
    }
    let guard = predicate.map_or_else(String::new, |predicate| {
        format!("if !({predicate}){{continue;}}")
    });
    Ok(format!(
        "{{let _inputs=inputs;{constants}for v{slot} in {sequence}{{{guard}{bindings}constructed_rows.push(item_{id}::construct(&[{}],inputs)?);}}}}",
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
            Ok((
                format!("{{let _inputs=inputs;{constants}if {condition}{{{yes}}}else{{{no}}}}}"),
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

fn record(
    value: &LinkedExpression,
    entry: &LinkedEntry,
    row: &LinkedEntry,
    program: &Program,
    id: u32,
) -> Result<String, Diagnostic> {
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
    let mut code = String::from("{let _inputs=inputs;");
    let mut slots = Vec::new();
    for (index, field) in fields.iter().enumerate() {
        let slot = names
            .iter()
            .position(|name| name == &field.name)
            .expect("typed constructor field");
        let argument = &arguments[slot];
        let (constants, expression) = expressions::expression(entry, program, argument)?;
        writeln!(code, "let v{index}={{{constants}{expression}}};").unwrap();
        let method = scalar::Codec::resolve(&field.value, row, program)?
            .input_method()
            .expect("constructible scalar");
        let value = match method {
            "text" => format!("Text(v{index}.as_ref())"),
            "boolean" => format!("Boolean(v{index})"),
            "decimal" => format!("Decimal(v{index})"),
            _ => unreachable!("borrowable scalar"),
        };
        slots.push(format!("Some(core::inputs::InputRef::{value})"));
    }
    write!(
        code,
        "item_{id}::construct(&[{}],inputs)?}}",
        slots.join(",")
    )
    .unwrap();
    Ok(code)
}
