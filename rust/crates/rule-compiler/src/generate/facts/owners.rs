use super::*;

pub(super) fn field(entry: &LinkedEntry, slot: u32) -> Result<(usize, usize), Diagnostic> {
    let LinkedType::Record(fields) = &entry.value else {
        unreachable!()
    };
    let name = &fields[slot as usize].name;
    let captured = crate::plan::scopes::capture_inputs(entry)?;
    crate::plan::records::parts(&captured.entry)?
        .iter()
        .enumerate()
        .find_map(|(part, entry)| {
            let LinkedType::Record(fields) = &entry.value else {
                unreachable!()
            };
            fields
                .iter()
                .position(|field| field.name == *name)
                .map(|local| (part, local))
        })
        .ok_or_else(|| unsupported(entry, "Contribution field has no owner storage"))
}

pub(in crate::generate) fn accessors(
    owner: &LinkedEntry,
    part: &LinkedEntry,
    program: &Program,
) -> Result<String, Diagnostic> {
    fn collect(value: &LinkedExpression, slots: &mut BTreeSet<u32>) {
        match &value.kind {
            LinkedExpressionKind::Field(slot) => {
                slots.insert(*slot);
            }
            LinkedExpressionKind::Operation { arguments, .. } => {
                for value in arguments {
                    collect(value, slots)
                }
            }
            _ => {}
        }
    }
    let mut requested = BTreeSet::new();
    for contribution in &owner.contributions {
        if contribution.for_each.is_some() {
            continue;
        }
        collect(&contribution.key, &mut requested);
        collect(&contribution.value, &mut requested);
    }
    let LinkedType::Record(owner_fields) = &owner.value else {
        unreachable!()
    };
    let LinkedType::Record(fields) = &part.value else {
        unreachable!()
    };
    let mut out = String::new();
    for slot in requested {
        let Some(local) = fields
            .iter()
            .position(|field| field.name == owner_fields[slot as usize].name)
        else {
            continue;
        };
        let codec = scalar::Codec::resolve(&fields[local].value, part, program)?;
        if !matches!(codec, scalar::Codec::Text | scalar::Codec::Enumeration(..)) {
            return Err(unsupported(
                owner,
                "Contribution requires a text or enumeration field",
            ));
        }
        let id = part.id;
        let reference = format!(
            "value.0.f{local}.as_ref().ok_or_else(||vec![RuntimeDiagnostic::new(\"fact.unready\",\"Contribution field is unavailable\")])?"
        );
        let meaning = codec.meaning_reference(&format!("E{id}F{local}"), &reference);
        writeln!(out,"pub(super) fn fact_{local}<'a>(value:&'a Stored,direction:Direction,source:&[u8],inputs:&InputView<'_>)->std::result::Result<&'a str,Vec<RuntimeDiagnostic>> {{let issues=match direction {{Direction::XmlToYaml=>issues_xml_{id}(&value.0,source,inputs),Direction::YamlToXml=>issues_yaml_{id}(&value.0,source,inputs)}};if issues.iter().any(|issue|issue.severity==Severity::Error) {{return Err(issues);}}Ok({meaning})}}").unwrap();
    }
    for (ordinal, contribution) in owner.contributions.iter().enumerate() {
        let Some(iteration) = &contribution.for_each else {
            continue;
        };
        let LinkedExpressionKind::Field(slot) = iteration.input.kind else {
            return Err(unsupported(
                owner,
                "Owner contribution must iterate a field",
            ));
        };
        if !fields
            .iter()
            .any(|field| field.name == owner_fields[slot as usize].name)
        {
            continue;
        }
        let mut entry = part.clone();
        let mut contribution = contribution.clone();
        crate::plan::contracts::expression(
            &mut contribution.for_each.as_mut().unwrap().input,
            owner,
            part,
        )?;
        crate::plan::contracts::expression(&mut contribution.key, owner, part)?;
        crate::plan::contracts::expression(&mut contribution.value, owner, part)?;
        entry.contributions = vec![contribution];
        let id = entry.id;
        let code = super::collections::stored(&entry, program)?.expect("collection contribution");
        writeln!(out,"pub(super) fn contribute_{ordinal}(value:&Stored,direction:Direction,source:&[u8],inputs:&InputView<'_>,builder:&mut core::facts::prepared::TextFactsBuilder)->std::result::Result<(),Vec<RuntimeDiagnostic>> {{if !value.1 {{return Err(vec![RuntimeDiagnostic::new(\"fact.unready\",\"Collection meaning is unavailable\")]);}}{code}contribute_value_{id}(&value.0,direction,source,inputs,builder)}}").unwrap();
    }
    Ok(out)
}
