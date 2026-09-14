//! Build declared rows from semantic expressions without serializing either format.
use super::*;
use std::fmt::Write;

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
