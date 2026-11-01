//! Compile observation profiles from explicit attribute reservations. This is
//! separate from projecting semantic fields: opaque descendants have no keys.
use super::*;

struct Boundary<'a> {
    path: &'a [ExpandedName],
    index: &'a str,
    key: Vec<String>,
}

/// Scopes must be known before observing the source, without decoding fields
/// from that source or constructing the object whose opaque XML is being read.
fn prepared(expression: &LinkedExpression) -> bool {
    match &expression.kind {
        LinkedExpressionKind::Input(_) | LinkedExpressionKind::Literal(_) => true,
        LinkedExpressionKind::Operation { arguments, .. } => arguments.iter().all(prepared),
        _ => false,
    }
}

struct CompiledProfile {
    metadata: String,
    scopes: String,
}

fn profile(entry: &LinkedEntry, program: &Program) -> Result<CompiledProfile, Diagnostic> {
    let fail = |message| unsupported(entry, message);
    if effective_contributions(entry, program).len() != entry.contributions.len() {
        return Err(fail(
            "Attribute observation cannot replace nested source contributions",
        ));
    }
    let (LinkedType::Record(fields), LinkedXml::Record(xml)) = (&entry.value, &entry.xml) else {
        return Err(fail(
            "Attribute reservations require declared record fields",
        ));
    };
    let mut attribute = None;
    let mut boundaries: Vec<Boundary<'_>> = Vec::new();
    for contribution in &entry.contributions {
        let nkdk_rule_model::IndexWrite::Reserve(value) = &contribution.write else {
            return Err(fail(
                "Attribute observation cannot replace semantic contributions",
            ));
        };
        let LinkedExpressionKind::Field(slot) = value.kind else {
            return Err(fail(
                "Attribute observation requires a direct field projection",
            ));
        };
        // A found attribute necessarily satisfies presence of its own field.
        // All other predicates still require semantic decoding and are rejected.
        let observed_presence = contribution.when.as_ref().is_none_or(|condition| {
            matches!(&condition.kind,
                LinkedExpressionKind::Operation { operator: nkdk_rule_model::LinkedOperator::State(nkdk_rule_model::StatePredicate::Present), arguments }
                if matches!(arguments.as_slice(), [argument] if matches!(argument.kind, LinkedExpressionKind::Field(guard) if guard == slot)))
        });
        if contribution.for_each.is_some() || !observed_presence {
            return Err(fail(
                "Attribute observation permits only unconditional reservations or presence of the observed field",
            ));
        }
        let field = xml
            .iter()
            .find(|field| field.field == fields[slot as usize].name)
            .ok_or_else(|| fail("Reservation has no XML field"))?;
        let Some(name) = &field.attribute else {
            return Err(fail("Reservation is not an XML attribute"));
        };
        if field.file.is_some() || field.path.is_empty() {
            return Err(fail(
                "Attribute observation requires mounted XML paths in one source",
            ));
        }
        if attribute.is_some_and(|other| other != name) {
            return Err(fail("One observation profile requires one attribute QName"));
        }
        attribute = Some(name);
        let key = super::super::fact_keys::parts(&contribution.key, entry, |value| {
            if !prepared(value) {
                return Err(fail(
                    "Reservation scope depends on unobserved source fields",
                ));
            }
            text(value, entry, program)
        })?;
        let boundary = Boundary {
            path: &field.path,
            index: &contribution.index,
            key,
        };
        if let Some(previous) = boundaries
            .iter()
            .find(|previous| previous.path.last() == boundary.path.last())
        {
            if previous.index != boundary.index || previous.key != boundary.key {
                return Err(fail(
                    "An attribute boundary QName selects conflicting scopes",
                ));
            }
        } else {
            boundaries.push(boundary);
        }
    }
    let attribute = attribute.ok_or_else(|| fail("No attribute reservation profile"))?;
    let root = boundaries
        .iter()
        .enumerate()
        .min_by_key(|(_, boundary)| boundary.path.len())
        .ok_or_else(|| fail("No attribute reservation boundary"))?;
    if boundaries
        .iter()
        .any(|boundary| !boundary.path.starts_with(root.1.path))
    {
        return Err(fail(
            "Attribute observation has no common declared default scope",
        ));
    }
    let default = root.0;
    let qname = |name: &ExpandedName| format!("({:?},{:?})", name.namespace, name.local);
    let routes = boundaries
        .iter()
        .enumerate()
        .map(|(slot, boundary)| format!("({}, {slot})", qname(boundary.path.last().unwrap())))
        .collect::<Vec<_>>()
        .join(",");
    let scopes = boundaries
        .iter()
        .map(|boundary| {
            format!(
                "(fact_id({:?}).expect(\"declared index\"),&[{}])",
                boundary.index,
                boundary.key.join(",")
            )
        })
        .collect::<Vec<_>>()
        .join(",");
    Ok(CompiledProfile {
        metadata: format!(
            "core::xml::attribute_scan::Profile{{attribute:{},default_scope:{default},boundaries:&[{routes}],max_depth}}",
            qname(attribute)
        ),
        scopes,
    })
}

pub(super) fn generate(
    entries: &[&LinkedEntry],
    fact_entries: &[&LinkedEntry],
    program: &Program,
    names: &[&str],
) -> String {
    let observed: Vec<_> = fact_entries
        .iter()
        .filter(|entry| {
            entry
                .contributions
                .iter()
                .any(|item| item.write.is_reservation())
        })
        .collect();
    // Bindings and dependency metadata cover the whole catalog, even when this
    // package owns no observation operation. Executable bodies remain local.
    // Ordinary catalogs pay no code-size/compile-time cost for this operation.
    if observed.is_empty() {
        return String::new();
    }
    let profiles: Vec<_> = observed
        .iter()
        .filter(|entry| entries.iter().any(|local| local.id == entry.id))
        .map(|entry| (entry.id, profile(entry, program)))
        .collect();
    let mut out = String::from(
        "fn attribute_profile(entry:EntryId,max_depth:usize)->core::Result<core::xml::attribute_scan::Profile<'static>>{match entry.0{\n",
    );
    for (id, result) in &profiles {
        let body = match result {
            Ok(profile) => format!("Ok({})", profile.metadata),
            Err(error) => format!(
                "Err(RuntimeDiagnostic::new(\"fact.attribute-profile\",{:?}))",
                error.message
            ),
        };
        writeln!(out, "{id}=>{body},").unwrap();
    }
    out.push_str(r#"_=>Err(RuntimeDiagnostic::new("fact.attribute-profile","Entry has no compiled attribute reservation profile"))}}
    fn with_attribute_scopes(entry:EntryId,inputs:&PreparedInputs,consume:impl FnOnce(&[(core::facts::prepared::FactId,&[&str])])->Result<(),Vec<RuntimeDiagnostic>>)->Result<(),Vec<RuntimeDiagnostic>>{
        inputs.check_entry(entry).map_err(|error|vec![error])?;let inputs=&inputs.view();let _=inputs;match entry.0{
    "#);
    for (id, result) in &profiles {
        if let Ok(profile) = result {
            writeln!(out, "{id}=>consume(&[{}]),", profile.scopes).unwrap();
        }
    }
    out.push_str(r#"_=>Err(vec![RuntimeDiagnostic::new("fact.attribute-profile","Entry has no compiled attribute reservation scopes")])}}
    pub fn snapshot_attribute_source(entry:EntryId,source:impl core::xml::attribute_scan::Source,max_depth:usize,budget:core::xml::attribute_scan::SnapshotBudget)->core::Result<Vec<u8>>{
        attribute_profile(entry,max_depth)?.capture(source,budget)
    }
    pub fn empty_attribute_snapshot(entry:EntryId,budget:core::xml::attribute_scan::SnapshotBudget)->core::Result<Vec<u8>>{
        attribute_profile(entry,1)?.empty_snapshot(budget)
    }
    fn write_attribute_reservations(entry:EntryId,inputs:&PreparedInputs,builder:&mut core::facts::prepared::TextFactsBuilder,max_depth:usize,visit:impl FnOnce(&core::xml::attribute_scan::Profile<'_>,&mut dyn FnMut(usize,&str)->core::Result<()>)->core::Result<()>)->Vec<RuntimeDiagnostic>{
        let result=attribute_profile(entry,max_depth).map_err(|error|vec![error]).and_then(|profile|with_attribute_scopes(entry,inputs,|scopes|{
            visit(&profile,&mut |slot,value|{
                let (index,key)=scopes[slot];
                builder.reserve_number(index,key,value).map_err(|error|RuntimeDiagnostic::new("fact.budget",format!("{error:?}")))
            }).map_err(|error|vec![error])
        }));
        finish_contribution(entry,result,builder)
    }
    pub fn reserve_attribute_source(entry:EntryId,source:impl core::xml::attribute_scan::Source,inputs:&PreparedInputs,builder:&mut core::facts::prepared::TextFactsBuilder,max_depth:usize)->Vec<RuntimeDiagnostic>{
        write_attribute_reservations(entry,inputs,builder,max_depth,|profile,consume|profile.visit_from_boundary(source,consume))
    }
    pub fn contribute_attribute_snapshot_file(entry:EntryId,bytes:&[u8],inputs:&PreparedInputs,builder:&mut core::facts::prepared::TextFactsBuilder,max_depth:usize,budget:core::xml::attribute_scan::SnapshotBudget)->Vec<RuntimeDiagnostic>{
        write_attribute_reservations(entry,inputs,builder,max_depth,|profile,consume|profile.visit_snapshot(bytes,budget,consume))
    }
    "#);
    out.push_str("fn fact_attribute_input_bindings(entry:EntryId)-> &'static [(&'static str,core::facts::prepared::FactId)]{match entry.0{\n");
    for entry in observed {
        let required = crate::plan::input_dependencies::reservation_scopes(entry);
        writeln!(out, "{}=>&[", entry.id).unwrap();
        super::super::fact_inputs::emit_bindings(&mut out, entry, names, Some(&required));
        out.push_str("],\n");
    }
    out.push_str("_=>&[]}}\n");
    out
}
