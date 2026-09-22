use super::*;

fn collect_fields(value: &LinkedExpression, slots: &mut BTreeSet<u32>) {
    match &value.kind {
        LinkedExpressionKind::Field(slot) => {
            slots.insert(*slot);
        }
        LinkedExpressionKind::Operation { arguments, .. } => {
            for value in arguments {
                collect_fields(value, slots);
            }
        }
        _ => {}
    }
}

pub(super) fn context_fields(contribution: &LinkedContribution) -> BTreeSet<u32> {
    let mut slots = BTreeSet::new();
    collect_fields(&contribution.key, &mut slots);
    collect_fields(&contribution.value, &mut slots);
    slots
}

pub(super) fn field(
    entry: &LinkedEntry,
    slot: u32,
    program: &Program,
) -> Result<(usize, usize), Diagnostic> {
    let LinkedType::Record(fields) = &entry.value else {
        unreachable!()
    };
    let name = &fields[slot as usize].name;
    program
        .composition(entry)?
        .parts
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
    let mut requested = BTreeSet::new();
    for contribution in &owner.contributions {
        if contribution.for_each.as_ref().is_some_and(|iteration| {
            super::collection_path(&iteration.input).is_some_and(|(_, path)| path.is_empty())
        }) {
            continue;
        }
        requested.extend(context_fields(contribution));
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
        if !codec.is_index_text() {
            return Err(unsupported(
                owner,
                "Contribution requires a text or enumeration field",
            ));
        }
        writeln!(
            out,
            "pub(super) fn fact_{local}_present(value:&Stored)->bool{{value.0.f{local}.is_some()}}"
        )
        .unwrap();
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
        let Some((slot, path)) = super::collection_path(&iteration.input) else {
            return Err(unsupported(
                owner,
                "Owner contribution must iterate a declared field path",
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
        if !path.is_empty() {
            out.push_str(&nested_contribution(
                ordinal,
                &contribution,
                owner,
                part,
                program,
                slot,
                &path,
            )?);
            continue;
        }
        crate::plan::contracts::expression(&mut contribution.key, owner, part)?;
        crate::plan::contracts::expression(&mut contribution.value, owner, part)?;
        entry.contributions = vec![contribution];
        let id = entry.id;
        let code = super::collections::stored(&entry, program)?.expect("collection contribution");
        writeln!(out,"pub(super) fn contribute_{ordinal}(value:&Stored,direction:Direction,source:&[u8],inputs:&InputView<'_>,builder:&mut core::facts::prepared::TextFactsBuilder)->std::result::Result<(),Vec<RuntimeDiagnostic>> {{if !value.1 {{return Err(vec![RuntimeDiagnostic::new(\"fact.unready\",\"Collection meaning is unavailable\")]);}}{code}contribute_value_{id}(&value.0,direction,source,inputs,builder)}}").unwrap();
    }
    Ok(out)
}

fn nested_contribution(
    ordinal: usize,
    contribution: &LinkedContribution,
    owner: &LinkedEntry,
    part: &LinkedEntry,
    program: &Program,
    owner_root: u32,
    path: &[u32],
) -> Result<String, Diagnostic> {
    let Some(iteration) = &contribution.for_each else {
        unreachable!()
    };
    let LinkedType::Sequence(item) = &iteration.input.value_type else {
        return Err(unsupported(part, "Nested contribution requires a sequence"));
    };
    let LinkedType::Record(row_fields) = item.as_ref() else {
        return Err(unsupported(
            part,
            "Nested contribution requires record rows",
        ));
    };
    let (root, _) = super::collection_path(&iteration.input).expect("validated path");
    let xml_missing = owner.presence.iter().any(|rule| {
        rule.target == LinkedPresenceTarget::Field(owner_root)
            && rule
                .xml_missing
                .as_ref()
                .is_some_and(|value| matches!(value.kind, LinkedExpressionKind::Absent))
    });
    let yaml_missing = owner.presence.iter().any(|rule| {
        rule.target == LinkedPresenceTarget::Field(owner_root)
            && rule
                .yaml_missing
                .as_ref()
                .is_some_and(|value| matches!(value.kind, LinkedExpressionKind::Absent))
    });
    let LinkedType::Record(fields) = &owner.value else {
        unreachable!()
    };
    let mut storage = vec![(String::new(), String::new()); fields.len()];
    for slot in context_fields(contribution) {
        storage[slot as usize] = (
            format!(
                "context[{slot}].ok_or_else(||RuntimeDiagnostic::new(\"fact.unready\",\"Contribution field is unavailable\"))?"
            ),
            format!("context[{slot}].is_some()"),
        );
    }
    let mut lowered =
        super::super::expressions::Expressions::new(owner, program, fields, Some(&storage));
    lowered.borrow_record_row(0, row_fields);
    let keys = super::super::fact_keys::parts(&contribution.key, part, |value| {
        let code = lowered.lower(value)?;
        Ok(super::super::expressions::Expressions::text_reference(
            value, code,
        ))
    })?;
    let value = lowered.lower(&contribution.value)?;
    let value = super::super::expressions::Expressions::text_reference(&contribution.value, value);
    let mut out = format!(
        "pub(super) fn contribute_{ordinal}(value:&Stored,context:&[Option<&str>],direction:Direction,source:&[u8],inputs:&InputView<'_>,builder:&mut core::facts::prepared::TextFactsBuilder)->std::result::Result<(),Vec<RuntimeDiagnostic>> {{let issues=match direction {{Direction::XmlToYaml=>check_xml(value,source,inputs),Direction::YamlToXml=>check_yaml(value,source,inputs)}};if issues.iter().any(|issue|issue.severity==Severity::Error) {{return Err(issues);}}let normal_missing=match direction {{Direction::XmlToYaml=>{xml_missing},Direction::YamlToXml=>{yaml_missing}}};let record=match input_field(value,{root}) {{Some(core::inputs::InputRef::Record(record))=>Some(record),None if normal_missing=>None,_=>return Err(vec![RuntimeDiagnostic::new(\"fact.unready\",\"Contribution record is unavailable\")])}};"
    );
    for slot in &path[..path.len() - 1] {
        writeln!(out,"let record=match record {{Some(record)=>match record.field({slot}) {{Some(core::inputs::InputRef::Record(record))=>Some(record),_=>return Err(vec![RuntimeDiagnostic::new(\"fact.unready\",\"Contribution record is unavailable\")])}},None=>None}};").unwrap();
    }
    let last = path[path.len() - 1];
    if contribution.union_reference_prefix.is_some() {
        let key = keys.first().expect("linked named union key");
        writeln!(out,"{}let result=(||->std::result::Result<(),FactErrors>{{builder.begin_union(fact_id({:?}).expect(\"declared index\"),{}).map_err(|error|RuntimeDiagnostic::new(\"fact.budget\",format!(\"{{error:?}}\")))?;Ok(())}})();result.map_err(|errors|errors.0)?;",lowered.constants,contribution.index,key).unwrap();
        writeln!(out,"if let Some(record)=record {{let rows=record.records({last}).map_err(|error|vec![error])?;for v0 in rows {{let result=(||->std::result::Result<(),FactErrors>{{let _inputs=inputs;builder.push_union(fact_id({:?}).expect(\"declared index\"),{}).map_err(|error|RuntimeDiagnostic::new(\"fact.budget\",format!(\"{{error:?}}\")))?;Ok(())}})();result.map_err(|errors|errors.0)?;}}}}Ok(())}}",contribution.index,value).unwrap();
    } else {
        writeln!(out,"if let Some(record)=record {{let rows=record.records({last}).map_err(|error|vec![error])?;for v0 in rows {{let result=(||->std::result::Result<(),FactErrors>{{{}let _inputs=inputs;builder.push_parts(fact_id({:?}).expect(\"declared index\"),&[{}],{}).map_err(|error|RuntimeDiagnostic::new(\"fact.budget\",format!(\"{{error:?}}\")))?;Ok(())}})();result.map_err(|errors|errors.0)?;}}}}Ok(())}}",lowered.constants,contribution.index,keys.join(","),value).unwrap();
    }
    Ok(out)
}
