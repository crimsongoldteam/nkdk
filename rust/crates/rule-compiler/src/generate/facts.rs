mod collections;
mod owners;
use super::*;
pub(super) use owners::accessors as owner_accessors;
use std::fmt::Write;

fn text(
    expression: &LinkedExpression,
    entry: &LinkedEntry,
    program: &Program,
) -> Result<String, Diagnostic> {
    match &expression.kind {
        LinkedExpressionKind::Literal(ScalarLiteral::Text(value)) => Ok(format!("{value:?}")),
        LinkedExpressionKind::Input(slot) => {
            Ok(format!("inputs.text({slot}).map_err(|error|vec![error])?"))
        }
        LinkedExpressionKind::Field(slot) => {
            let LinkedType::Record(fields) = &entry.value else {
                return Err(unsupported(entry, "Index field requires a record"));
            };
            let codec = scalar::Codec::resolve(&fields[*slot as usize].value, entry, program)?;
            if !matches!(codec, scalar::Codec::Text | scalar::Codec::Enumeration(..)) {
                return Err(unsupported(
                    entry,
                    "This index projection requires a text or enumeration field",
                ));
            }
            if super::owner::applies(entry, program) {
                let (part, local) = owners::field(entry, *slot, program)?;
                return Ok(format!(
                    "part_{}_{part}::fact_{local}(&value.p{part},direction,source,inputs)?",
                    entry.id
                ));
            }
            let field = &fields[*slot as usize];
            let reference = format!(
                "value.f{slot}.as_ref().ok_or_else(||vec![RuntimeDiagnostic::new(\"fact.unready\",\"Contribution field is unavailable\").field({:?})])?",
                field.name
            );
            Ok(codec.meaning_reference(&format!("E{}F{slot}", entry.id), &reference))
        }
        _ => Err(unsupported(
            entry,
            "This index projection supports declared text fields, inputs and literals",
        )),
    }
}

pub(super) fn generate(entries: &[&LinkedEntry], program: &Program) -> Result<String, Diagnostic> {
    let names: Vec<_> = entries
        .iter()
        .flat_map(|entry| entry.contributions.iter().map(|value| value.index.as_str()))
        .collect::<BTreeSet<_>>()
        .into_iter()
        .collect();
    let mut out = format!(
        "pub fn fact_names()-> &'static [&'static str] {{ &{names:?} }}\npub fn fact_id(name:&str)->Option<core::facts::prepared::FactId> {{fact_names().iter().position(|candidate|*candidate==name).map(|slot|core::facts::prepared::FactId(slot as u32))}}\n"
    );
    let mut layouts = Vec::new();
    for name in &names {
        let projection = entries
            .iter()
            .flat_map(|entry| &entry.contributions)
            .find(|value| value.index == *name)
            .expect("declared index");
        let columns =
            crate::fact_shape::columns(&projection.key.value_type).expect("linked index shape");
        layouts.push(if columns.is_empty() {
            "core::facts::prepared::text_scalar_index(generation)".to_owned()
        } else {
            format!("core::facts::prepared::text_record_index(generation,{columns:?})")
        });
    }
    writeln!(out,"pub fn fact_builder(generation:core::facts::Generation,budget:core::facts::prepared::FactBudget)->core::facts::prepared::TextFactsBuilder {{core::facts::prepared::TextFactsBuilder::with_indexes(generation,vec![{}],budget)}}",layouts.join(",")).unwrap();
    out.push_str("pub fn contribution_indexes(entry:EntryId)-> &'static [core::facts::prepared::FactId] {match entry.0 {\n");
    for entry in entries {
        let ids: BTreeSet<_> = entry
            .contributions
            .iter()
            .map(|value| names.binary_search(&value.index.as_str()).unwrap())
            .collect();
        writeln!(
            out,
            "{}=>&[{}],",
            entry.id,
            ids.iter()
                .map(|id| format!("core::facts::prepared::FactId({id})"))
                .collect::<Vec<_>>()
                .join(",")
        )
        .unwrap();
    }
    out.push_str("_=>&[]}}\n");
    out.push_str(&super::fact_inputs::generate(entries, &names));
    let entry_ids: Vec<_> = entries.iter().map(|entry| entry.id).collect();
    writeln!(out, r#"pub fn fact_plan(sources:&[EntryId],consumers:&[EntryId],edge_budget:usize)->core::Result<core::facts::dependencies::DependencyPlan> {{
        let count=sources.len().checked_add(fact_names().len()).and_then(|count|count.checked_add(consumers.len())).filter(|count|u32::try_from(*count).is_ok()).ok_or_else(||RuntimeDiagnostic::new("fact.plan-budget","Too many preparation steps"))?;
        let mut dependencies=vec![Vec::new();count];
        let mut edges=0usize;
        for (slot,entry) in sources.iter().enumerate() {{
            if !{entry_ids:?}.contains(&entry.0) {{return Err(RuntimeDiagnostic::new("entry.unknown","Unknown fact source entry"));}}
            for (_,index) in fact_input_bindings(*entry) {{
                if edges==edge_budget {{return Err(RuntimeDiagnostic::new("fact.plan-budget","Too many preparation dependencies"));}}edges+=1;
                dependencies[slot].push(core::facts::dependencies::StepId((sources.len()+index.0 as usize) as u32));
            }}
            for index in contribution_indexes(*entry) {{if edges==edge_budget {{return Err(RuntimeDiagnostic::new("fact.plan-budget","Too many preparation dependencies"));}}edges+=1;dependencies[sources.len()+index.0 as usize].push(core::facts::dependencies::StepId(slot as u32));}}
        }}
        for (slot,entry) in consumers.iter().enumerate() {{
            if !{entry_ids:?}.contains(&entry.0) {{return Err(RuntimeDiagnostic::new("entry.unknown","Unknown fact consumer entry"));}}
            for (_,index) in fact_input_bindings(*entry) {{
                if edges==edge_budget {{return Err(RuntimeDiagnostic::new("fact.plan-budget","Too many preparation dependencies"));}}edges+=1;
                dependencies[sources.len()+fact_names().len()+slot].push(core::facts::dependencies::StepId((sources.len()+index.0 as usize) as u32));
            }}
        }}
        core::facts::dependencies::DependencyPlan::new(dependencies,edge_budget).map_err(|error|RuntimeDiagnostic::new("fact.plan",format!("{{error:?}}")))
    }}"#).unwrap();
    for entry in entries
        .iter()
        .filter(|entry| !entry.contributions.is_empty())
    {
        if !super::owner::applies(entry, program)
            && let Some(projection) = collections::generate(entry, program, &names)?
        {
            out.push_str(&projection);
            continue;
        }
        // Other generated layouts have distinct storage; never silently project
        // from a flattened record or an unrelated collection representation.
        let LinkedType::Record(fields) = &entry.value else {
            return Err(unsupported(
                entry,
                "Index extraction requires a scalar record",
            ));
        };
        if !super::owner::applies(entry, program) {
            for field in fields {
                scalar::Codec::resolve(&field.value, entry, program)?;
            }
        }
        let id = entry.id;
        let checks = if super::owner::applies(entry, program) {
            format!(
                "if matches!(direction,Direction::YamlToXml) && value.root.is_some() {{let issues=check_yaml_{id}(&value,source,inputs);if issues.iter().any(|issue|issue.severity==Severity::Error) {{return Err(issues);}}}}"
            )
        } else {
            format!(
                "let issues=match direction {{Direction::XmlToYaml=>issues_xml_{id}(&value,source,inputs),Direction::YamlToXml=>issues_yaml_{id}(&value,source,inputs)}};if issues.iter().any(|issue|issue.severity==Severity::Error) {{return Err(issues);}}"
            )
        };
        writeln!(out,"fn contribute_{id}(direction:Direction,source:&[u8],inputs:&PreparedInputs,builder:&mut core::facts::prepared::TextFactsBuilder)->std::result::Result<(),Vec<RuntimeDiagnostic>> {{let value=match direction {{Direction::XmlToYaml=>read_xml_{id}(source,inputs),Direction::YamlToXml=>read_yaml_{id}(source,inputs)}}.map_err(|error|vec![error])?;{checks}").unwrap();
        for (ordinal, contribution) in entry.contributions.iter().enumerate() {
            if super::owner::applies(entry, program)
                && let Some(iteration) = &contribution.for_each
            {
                let LinkedExpressionKind::Field(field) = iteration.input.kind else {
                    return Err(unsupported(
                        entry,
                        "Owner contribution must iterate a field",
                    ));
                };
                let (part, _) = owners::field(entry, field, program)?;
                writeln!(out,"if matches!(direction,Direction::XmlToYaml) && value.containers[{part}]!=1 {{return Err(vec![RuntimeDiagnostic::new(\"fact.unready\",\"Contribution owner container is missing or repeated\")]);}}part_{id}_{part}::contribute_{ordinal}(&value.p{part},direction,source,inputs,builder)?;").unwrap();
                continue;
            }
            let index = names.binary_search(&contribution.index.as_str()).unwrap();
            let key = super::fact_keys::parts(&contribution.key, entry, |value| {
                text(value, entry, program)
            })?
            .join(",");
            let value = text(&contribution.value, entry, program)?;
            writeln!(out,"builder.push_parts(core::facts::prepared::FactId({index}),&[{key}],{value}).map_err(|error|vec![RuntimeDiagnostic::new(\"fact.budget\",format!(\"{{error:?}}\"))])?;").unwrap();
        }
        out.push_str("Ok(())}\n");
    }
    out.push_str("pub fn contribute_file(entry:EntryId,direction:Direction,source:&[u8],inputs:&PreparedInputs,builder:&mut core::facts::prepared::TextFactsBuilder)->Vec<RuntimeDiagnostic> {let _=(direction,source);let result=inputs.check_entry(entry).map_err(|error|vec![error]).and_then(|()|match entry.0 {\n");
    for entry in entries {
        if entry.contributions.is_empty() {
            writeln!(out, "{}=>Ok(()),", entry.id).unwrap();
        } else {
            writeln!(
                out,
                "{}=>contribute_{}(direction,source,inputs,builder),",
                entry.id, entry.id
            )
            .unwrap();
        }
    }
    out.push_str("_=>Err(vec![RuntimeDiagnostic::new(\"entry.unknown\",\"Unknown generated entry\")])});match result {Ok(())=>Vec::new(),Err(errors)=>{for index in contribution_indexes(entry) {let _=builder.mark_unready(*index);}errors}}}\n");
    Ok(out)
}
