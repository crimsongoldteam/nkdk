use super::*;
use std::fmt::Write;
fn shape(value: &LinkedType, entry: &LinkedEntry) -> Result<String, Diagnostic> {
    Ok(match value {
        LinkedType::Scalar(ScalarType::Text) => "core::InputType::Text".into(),
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
pub(super) fn generate(entries: &[&LinkedEntry]) -> Result<String, Diagnostic> {
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
    Ok(out)
}
