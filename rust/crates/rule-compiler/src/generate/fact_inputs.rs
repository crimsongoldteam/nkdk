use super::*;
use std::fmt::Write;

pub(super) fn generate(entries: &[&LinkedEntry], names: &[&str]) -> String {
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
    out.push_str(r#"
pub fn prepare_fact_inputs(entry:EntryId,facts:std::sync::Arc<core::facts::prepared::PreparedTextFacts>,generation:core::facts::Generation,mut values:Vec<(String,InputValue)>)->core::Result<PreparedInputs> {
    values.extend(fact_input_bindings(entry).iter().map(|(name,index)| ((*name).to_owned(),InputValue::TextIndex(core::facts::prepared::TextIndexInput::new(facts.clone(),generation,*index)))));
    prepare_inputs(entry,values)
}
"#);
    out
}
