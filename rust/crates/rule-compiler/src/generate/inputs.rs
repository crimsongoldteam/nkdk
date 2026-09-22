use super::*;
use std::fmt::Write;
fn shape(value: &LinkedType, entry: &LinkedEntry) -> Result<String, Diagnostic> {
    Ok(match value {
        LinkedType::Index { key, value } if **value == LinkedType::Scalar(ScalarType::Text) => {
            let columns = crate::fact_shape::columns(key)
                .ok_or_else(|| unsupported(entry, "Unsupported index key shape"))?;
            if columns.is_empty() {
                "core::InputType::TextIndex".into()
            } else {
                format!("core::InputType::TextRecordIndex(&{columns:?})")
            }
        }
        value if crate::fact_shape::text_union_index(value) => {
            "core::InputType::TextUnionIndex".into()
        }
        LinkedType::Scalar(ScalarType::Text) | LinkedType::Enum(_) => {
            "core::InputType::Text".into()
        }
        LinkedType::Scalar(ScalarType::Boolean) => "core::InputType::Boolean".into(),
        LinkedType::Scalar(ScalarType::Decimal) => "core::InputType::Decimal".into(),
        LinkedType::Sequence(item) => {
            format!("core::InputType::Sequence(&{})", shape(item, entry)?)
        }
        _ => {
            return Err(unsupported(
                entry,
                "Input type is not supported by the generated boundary",
            ));
        }
    })
}
pub(super) fn generate(entries: &[&LinkedEntry], program: &Program) -> Result<String, Diagnostic> {
    let mut out = String::from(
        "pub fn prepare_inputs(entry: EntryId, values: Vec<(String, InputValue)>) -> core::Result<PreparedInputs> { match entry.0 {\n",
    );
    for entry in entries {
        writeln!(out, "{} => PreparedInputs::prepare(entry, &[", entry.id).unwrap();
        for input in &entry.inputs {
            writeln!(out, "({:?}, {}),", input.name, shape(&input.value, entry)?).unwrap();
        }
        out.push_str("], values),\n");
    }
    out.push_str(
        "_ => Err(RuntimeDiagnostic::new(\"entry.unknown\", \"Unknown generated entry\")) } }\n",
    );
    out.push_str("pub fn read_inputs(entry: EntryId, source: &[u8]) -> core::Result<PreparedInputs> { prepare_inputs(entry, core::inputs::read(source)?) }\n");
    out.push_str(
        "pub fn input_names(entry: EntryId) -> &'static [&'static str] { match entry.0 {\n",
    );
    for entry in entries {
        writeln!(
            out,
            "{} => &{:?},",
            entry.id,
            entry
                .inputs
                .iter()
                .map(|input| input.name.as_str())
                .collect::<Vec<_>>()
        )
        .unwrap();
    }
    out.push_str("_ => &[] } }\n");
    out.push_str("pub struct StaticParameter { pub field: &'static str, pub name: &'static str, pub json: &'static str, pub default_json: Option<&'static str> }\n");
    out.push_str(
        "pub fn bound_parameters(entry: EntryId) -> &'static [StaticParameter] { match entry.0 {\n",
    );
    for entry in entries {
        writeln!(out, "{} => &[", entry.id).unwrap();
        if let LinkedType::Record(fields) = &entry.value {
            for field in fields {
                if let LinkedType::BoundReference {
                    entry: reference,
                    arguments,
                    ..
                } = &field.value
                {
                    let common = program
                        .entries
                        .iter()
                        .find(|entry| entry.id == *reference)
                        .expect("linked reference");
                    for (parameter, argument) in common.parameters.iter().zip(arguments) {
                        let LinkedExpressionKind::Literal(value) = &argument.kind else {
                            return Err(unsupported(
                                entry,
                                "Entry parameter must be a compile-time literal",
                            ));
                        };
                        writeln!(out, "StaticParameter {{ field: {:?}, name: {:?}, json: {:?}, default_json: {:?} }},", field.name, parameter.name, literal_json(value), parameter.default.as_ref().map(literal_json)).unwrap();
                    }
                }
            }
        }
        out.push_str("],\n");
    }
    out.push_str("_ => &[] } }\n");
    Ok(out)
}

fn literal_json(value: &ScalarLiteral) -> String {
    match value {
        ScalarLiteral::Text(value) => serde_json::to_string(value).expect("JSON string"),
        ScalarLiteral::Boolean(value) => value.to_string(),
        ScalarLiteral::Number(value) => value.clone(),
        ScalarLiteral::Null => "null".into(),
    }
}

pub(super) fn identity(entry: &LinkedEntry) -> Vec<LinkedBinding> {
    crate::link::identity_bindings(entry)
}
