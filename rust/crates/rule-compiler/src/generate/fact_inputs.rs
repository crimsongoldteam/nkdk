use super::*;
use std::fmt::Write;

pub(super) fn generate(
    entries: &[&LinkedEntry],
    names: &[&str],
    program: &Program,
    reservations: bool,
) -> String {
    let mut out = String::from(
        "pub fn fact_input_bindings(entry:EntryId)-> &'static [(&'static str,core::facts::prepared::FactId)] {match entry.0 {\n",
    );
    for entry in entries {
        writeln!(out, "{}=>&[", entry.id).unwrap();
        emit_bindings(&mut out, entry, names, None);
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
            emit_bindings(&mut out, entry, names, Some(&required));
            out.push_str("],\n");
        }
    }
    out.push_str("_=>&[]}}\n");
    out.push_str(r#"
pub struct FactCatalog;
impl core::facts::preparation::Catalog for FactCatalog {
    fn index_count()->usize { fact_names().len() }
    fn plan(sources:&[(EntryId,Direction)],consumers:&[EntryId],budget:usize)->core::Result<core::facts::dependencies::DependencyPlan> { fact_plan_for_sources(sources,consumers,budget) }
    fn plan_materials(sources:&[(EntryId,Direction,core::facts::preparation::SourceKind)],consumers:&[EntryId],budget:usize)->core::Result<core::facts::dependencies::DependencyPlan> { fact_plan_materials(sources,consumers,budget) }
    fn builder(generation:core::facts::Generation,budget:core::facts::prepared::FactBudget)->core::facts::prepared::TextFactsBuilder { fact_builder(generation,budget) }
    fn bind(source:&core::facts::preparation::Source<'_>,direction:Option<Direction>,facts:std::sync::Arc<core::facts::prepared::PreparedTextFacts>,generation:core::facts::Generation)->core::Result<PreparedInputs> {
        match direction {
            Some(direction)=>prepare_fact_source_inputs(source.entry,direction,facts,generation,vec![]),
            None=>prepare_fact_inputs(source.entry,facts,generation,vec![]),
        }
    }
    fn contribute(source:&core::facts::preparation::Source<'_>,builder:&mut core::facts::prepared::TextFactsBuilder)->Vec<RuntimeDiagnostic> { contribute_file(source.entry,source.direction,source.bytes,&source.inputs,builder) }
    fn contribute_snapshot(source:&core::facts::preparation::Source<'_>,builder:&mut core::facts::prepared::TextFactsBuilder)->Vec<RuntimeDiagnostic> { contribute_snapshot_file(source.entry,source.bytes,&source.inputs,builder) }
    fn bind_snapshot(source:&core::facts::preparation::Source<'_>,facts:std::sync::Arc<core::facts::prepared::PreparedTextFacts>,generation:core::facts::Generation)->core::Result<PreparedInputs> { prepare_fact_snapshot_inputs(source.entry,facts,generation,vec![]) }
}
pub fn prepare_fact_inputs(entry:EntryId,facts:std::sync::Arc<core::facts::prepared::PreparedTextFacts>,generation:core::facts::Generation,values:Vec<(String,InputValue)>)->core::Result<PreparedInputs> {
    bind_fact_inputs(entry,fact_input_bindings(entry),facts,generation,values)
}
pub fn prepare_fact_source_inputs(entry:EntryId,direction:Direction,facts:std::sync::Arc<core::facts::prepared::PreparedTextFacts>,generation:core::facts::Generation,values:Vec<(String,InputValue)>)->core::Result<PreparedInputs> {
    bind_fact_inputs(entry,fact_source_input_bindings(entry,direction),facts,generation,values)
}
pub fn prepare_fact_snapshot_inputs(entry:EntryId,facts:std::sync::Arc<core::facts::prepared::PreparedTextFacts>,generation:core::facts::Generation,values:Vec<(String,InputValue)>)->core::Result<PreparedInputs> {
    let bindings:Vec<_>=fact_source_input_bindings(entry,Direction::YamlToXml).iter().copied().filter(|(_,index)|!contribution_indexes(entry).contains(index)).collect();
    bind_fact_inputs(entry,&bindings,facts,generation,values)
}
fn bind_fact_inputs(entry:EntryId,bindings:&[(&str,core::facts::prepared::FactId)],facts:std::sync::Arc<core::facts::prepared::PreparedTextFacts>,generation:core::facts::Generation,mut values:Vec<(String,InputValue)>)->core::Result<PreparedInputs> {
    values.extend(bindings.iter().map(|(name,index)| {
        ((*name).to_owned(),fact_index_input(facts.clone(),generation,*index))
    }));
    prepare_inputs(entry,values)
}
fn fact_index_input(facts:std::sync::Arc<core::facts::prepared::PreparedTextFacts>,generation:core::facts::Generation,index:core::facts::prepared::FactId)->InputValue {
    if fact_is_union(index) {
        InputValue::TextUnionIndex(core::facts::prepared::TextUnionIndexInput::new(facts,generation,index))
    } else {
        InputValue::TextIndex(core::facts::prepared::TextIndexInput::new(facts,generation,index))
    }
}
"#);
    if reservations {
        let before = "    fn contribute_snapshot(source:";
        let methods = r#"    fn reserve_attributes(source:&core::facts::preparation::Source<'_>,builder:&mut core::facts::prepared::TextFactsBuilder,max_depth:usize)->Vec<RuntimeDiagnostic>{reserve_attribute_source(source.entry,core::xml::DocumentSource(source.bytes),&source.inputs,builder,max_depth)}
    fn reserve_attribute_snapshot(source:&core::facts::preparation::Source<'_>,builder:&mut core::facts::prepared::TextFactsBuilder,max_depth:usize,budget:core::xml::attribute_scan::SnapshotBudget)->Vec<RuntimeDiagnostic>{contribute_attribute_snapshot_file(source.entry,source.bytes,&source.inputs,builder,max_depth,budget)}
    fn bind_attributes(source:&core::facts::preparation::Source<'_>,facts:std::sync::Arc<core::facts::prepared::PreparedTextFacts>,generation:core::facts::Generation)->core::Result<PreparedInputs>{bind_fact_inputs(source.entry,fact_attribute_input_bindings(source.entry),facts,generation,vec![])}
"#;
        out = out.replace(before, &format!("{methods}{before}"));
    }
    out
}

/// One canonical binding table for consumers, ordinary sources and observations.
pub(super) fn emit_bindings(
    out: &mut String,
    entry: &LinkedEntry,
    names: &[&str],
    required: Option<&BTreeSet<u32>>,
) {
    for binding in &entry.input_indexes {
        if let Some(required) = required {
            let slot = entry
                .inputs
                .iter()
                .position(|input| input.name == binding.name)
                .expect("linked input");
            if !required.contains(&(slot as u32)) {
                continue;
            }
        }
        let index = names
            .binary_search(&binding.value.as_str())
            .unwrap_or_else(|_| {
                panic!("linked index binding: {} in {}", binding.value, entry.name)
            });
        writeln!(
            out,
            "({:?},core::facts::prepared::FactId({index})),",
            binding.name
        )
        .unwrap();
    }
}
