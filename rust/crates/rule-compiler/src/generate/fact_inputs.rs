use super::*;
use std::fmt::Write;

pub(super) fn generate(entries: &[&LinkedEntry], names: &[&str], program: &Program) -> String {
    let mut out = String::from(
        "pub fn fact_input_bindings(entry:EntryId)-> &'static [(&'static str,core::facts::prepared::FactId)] {match entry.0 {\n",
    );
    for entry in entries {
        writeln!(out, "{}=>&[", entry.id).unwrap();
        for binding in &entry.input_indexes {
            let slot = names
                .binary_search(&binding.value.as_str())
                .expect("linked index binding");
            writeln!(
                out,
                "({:?},core::facts::prepared::FactId({slot})),",
                binding.name
            )
            .unwrap();
        }
        out.push_str("],\n");
    }
    out.push_str("_=>&[]}}\n");
    out.push_str("pub fn fact_source_input_bindings(entry:EntryId,direction:Direction)-> &'static [(&'static str,core::facts::prepared::FactId)] {match (entry.0,direction) {\n");
    for entry in entries {
        for (phase, direction) in [
            (ValidationPhase::XmlImport, "XmlToYaml"),
            (ValidationPhase::YamlValidation, "YamlToXml"),
        ] {
            let required = crate::plan::input_dependencies::read(entry, program, phase);
            writeln!(out, "({},Direction::{direction})=>&[", entry.id).unwrap();
            for binding in &entry.input_indexes {
                let slot = entry
                    .inputs
                    .iter()
                    .position(|input| input.name == binding.name)
                    .expect("linked input");
                if !required.contains(&(slot as u32)) {
                    continue;
                }
                let index = names
                    .binary_search(&binding.value.as_str())
                    .expect("linked index binding");
                writeln!(
                    out,
                    "({:?},core::facts::prepared::FactId({index})),",
                    binding.name
                )
                .unwrap();
            }
            out.push_str("],\n");
        }
    }
    out.push_str("_=>&[]}}\n");
    out.push_str(r#"
pub fn prepare_fact_inputs(entry:EntryId,facts:std::sync::Arc<core::facts::prepared::PreparedTextFacts>,generation:core::facts::Generation,values:Vec<(String,InputValue)>)->core::Result<PreparedInputs> {
    bind_fact_inputs(entry,fact_input_bindings(entry),facts,generation,values)
}
pub fn prepare_fact_source_inputs(entry:EntryId,direction:Direction,facts:std::sync::Arc<core::facts::prepared::PreparedTextFacts>,generation:core::facts::Generation,values:Vec<(String,InputValue)>)->core::Result<PreparedInputs> {
    bind_fact_inputs(entry,fact_source_input_bindings(entry,direction),facts,generation,values)
}
fn bind_fact_inputs(entry:EntryId,bindings:&[(&str,core::facts::prepared::FactId)],facts:std::sync::Arc<core::facts::prepared::PreparedTextFacts>,generation:core::facts::Generation,mut values:Vec<(String,InputValue)>)->core::Result<PreparedInputs> {
    values.extend(bindings.iter().map(|(name,index)| ((*name).to_owned(),InputValue::TextIndex(core::facts::prepared::TextIndexInput::new(facts.clone(),generation,*index)))));
    prepare_inputs(entry,values)
}
"#);
    out
}
