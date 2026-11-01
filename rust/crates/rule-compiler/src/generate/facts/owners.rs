use super::*;

/// Select scalar leaves of the declared graph only while preparing facts.
/// Unsupported layouts retain their existing strict reader.
fn xml_leaves(
    entry: &LinkedEntry,
    program: &Program,
    prefix: &[ExpandedName],
    active: &mut BTreeSet<u32>,
    result: &mut Vec<(Vec<ExpandedName>, Option<ExpandedName>)>,
) -> Option<()> {
    if !active.insert(entry.id) {
        return None;
    }
    let (xml, fixed) = super::super::attributes::content(&entry.xml);
    for attribute in fixed {
        result.push((prefix.to_vec(), Some(attribute.name.clone())));
    }
    match (&entry.value, xml) {
        (LinkedType::Record(fields), LinkedXml::Record(xml)) => {
            for mapping in xml {
                let field = fields.iter().find(|field| field.name == mapping.field)?;
                let mut path = prefix.to_vec();
                path.extend(mapping.path.iter().cloned());
                if scalar::Codec::resolve(&field.value, entry, program)
                    .is_ok_and(|codec| codec.input_method().is_some())
                {
                    result.push((path, mapping.attribute.clone()));
                } else {
                    if mapping.attribute.is_some() {
                        return None;
                    }
                    let (id, _, _) = field.value.as_reference()?;
                    xml_leaves(
                        program.entries.iter().find(|entry| entry.id == id)?,
                        program,
                        &path,
                        active,
                        result,
                    )?;
                }
            }
        }
        (LinkedType::Sequence(item), LinkedXml::ElementSequence { path, .. }) => {
            let (id, _, _) = item.as_reference()?;
            let mut prefix = prefix.to_vec();
            prefix.extend(path.iter().cloned());
            xml_leaves(
                program.entries.iter().find(|entry| entry.id == id)?,
                program,
                &prefix,
                active,
                result,
            )?;
        }
        _ => return None,
    }
    active.remove(&entry.id);
    Some(())
}

fn projection_condition(fields: &[(Vec<ExpandedName>, Option<ExpandedName>)]) -> String {
    let routes = fields
        .iter()
        .map(|(path, _)| record::path_code(path))
        .collect::<Vec<_>>()
        .join(",");
    let attributes = fields.iter().filter_map(|(path, attribute)| attribute.as_ref().map(|name| {
        format!("(core::xml::matches(path,{}) && attribute.name.namespace=={:?} && attribute.name.local=={:?})", record::path_code(path), name.namespace, name.local)
    })).collect::<Vec<_>>();
    let text = fields
        .iter()
        .filter(|(_, attribute)| attribute.is_none())
        .map(|(path, _)| format!("core::xml::matches(path,{})", record::path_code(path)))
        .collect::<Vec<_>>();
    let any = |conditions: Vec<String>| {
        if conditions.is_empty() {
            "false".into()
        } else {
            conditions.join(" || ")
        }
    };
    format!(
        "match &token {{core::xml::Token::Attribute(attribute)=>{},core::xml::Token::Text(_)=>{},_=>[{routes}].iter().any(|leaf|path.len()<=leaf.len() && core::xml::matches(path,&leaf[..path.len()]))}}",
        any(attributes),
        any(text)
    )
}

pub(super) fn collection_filter(
    entry: &LinkedEntry,
    program: &Program,
    prefix: &[ExpandedName],
) -> Option<String> {
    let mut fields = Vec::new();
    xml_leaves(entry, program, prefix, &mut BTreeSet::new(), &mut fields)?;
    if fields.is_empty() {
        return None;
    }
    let condition = projection_condition(&fields);
    Some(format!(
        "if path.len()>={} && !({condition}) {{return Ok(true);}}",
        prefix.len()
    ))
}

pub(super) fn xml_projection(entry: &LinkedEntry, program: &Program) -> Option<String> {
    let mut fields = Vec::new();
    xml_leaves(entry, program, &[], &mut BTreeSet::new(), &mut fields)?;
    let root = fields.iter().find_map(|(path, _)| path.first())?;
    let root = record::path_code(std::slice::from_ref(root));
    let condition = projection_condition(&fields);
    let id = entry.id;
    Some(format!(
        r#"fn read_xml_fact_{id}(source:&[u8],inputs:&InputView<'_>)->core::Result<V{id}> {{
        read_xml_shared_events_{id}(source,inputs,core::xml::ScopedEvents(|consume:&mut core::xml::ScopedConsumer<'_>| {{
            core::xml::visit_scoped(source,|path,token,scope| {{
                if path.is_empty() {{return Ok(());}}
                if !core::xml::matches(&path[..1],{root}) {{return Err(RuntimeDiagnostic::new("xml.root","Unexpected contribution document root"));}}
                let keep={condition};
                if keep {{consume(path,&token,scope)?;}} Ok(())
            }})
        }}))
    }}"#
    ))
}

fn collect_fields(
    value: &LinkedExpression,
    slots: &mut BTreeSet<u32>,
    summaries: &super::summaries::Summaries,
) {
    if summaries.contains(value) {
        return;
    }
    match &value.kind {
        LinkedExpressionKind::Field(slot) => {
            slots.insert(*slot);
        }
        LinkedExpressionKind::Operation { arguments, .. } => {
            for value in arguments {
                collect_fields(value, slots, summaries);
            }
        }
        _ => {}
    }
}

pub(super) fn context_fields(contribution: &LinkedContribution) -> BTreeSet<u32> {
    let mut slots = BTreeSet::new();
    let summaries = super::summaries::Summaries::new(contribution);
    collect_fields(&contribution.key, &mut slots, &summaries);
    if let Some(condition) = &contribution.when {
        collect_fields(condition, &mut slots, &summaries);
    }
    if let Some(value) = contribution.write.value() {
        collect_fields(value, &mut slots, &summaries);
    }
    slots
}

pub(super) fn external_context(
    contribution: &LinkedContribution,
    owner: &LinkedEntry,
    part: &LinkedEntry,
) -> bool {
    if !super::summaries::Summaries::new(contribution).is_empty() {
        return true;
    }
    let (LinkedType::Record(owner_fields), LinkedType::Record(part_fields)) =
        (&owner.value, &part.value)
    else {
        return false;
    };
    context_fields(contribution).iter().any(|slot| {
        !part_fields
            .iter()
            .any(|field| field.name == owner_fields[*slot as usize].name)
    })
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
        let result_type = match codec.input_method() {
            Some("text") => "&'a str",
            Some("boolean") => "bool",
            Some("decimal") => "&'a core::decimal::Decimal",
            Some("calendar") => "&'a core::calendar::Value",
            _ => {
                return Err(unsupported(
                    owner,
                    "Contribution requires a borrowed scalar field",
                ));
            }
        };
        writeln!(
            out,
            "pub(super) fn fact_{local}_present(value:&Stored)->bool{{value.0.f{local}.is_some()}}"
        )
        .unwrap();
        let id = part.id;
        let reference = format!(
            "value.0.f{local}.as_ref().ok_or_else(||vec![RuntimeDiagnostic::new(\"fact.unready\",\"Contribution field is unavailable\")])?"
        );
        let meaning = codec.input_reference(&format!("E{id}F{local}"), &reference);
        writeln!(out,"pub(super) fn fact_{local}<'a>(value:&'a Stored,direction:Direction,source:&[u8],inputs:&InputView<'_>)->std::result::Result<{result_type},Vec<RuntimeDiagnostic>> {{let issues=match direction {{Direction::XmlToYaml=>issues_xml_{id}(&value.0,source,inputs),Direction::YamlToXml=>issues_yaml_{id}(&value.0,source,inputs)}};if issues.iter().any(|issue|issue.severity==Severity::Error) {{return Err(issues);}}Ok({meaning})}}").unwrap();
    }
    if super::collection_has_contributions(part, program)
        && super::implicit_value_contributions(owner, part, program)
    {
        let mut nested = part.clone();
        nested.contributions.clear();
        let code =
            super::collections::stored(&nested, program)?.expect("declared collection facts");
        writeln!(out,"pub(super) fn contribute_nested(value:&Stored,direction:Direction,source:&[u8],inputs:&InputView<'_>,builder:&mut core::facts::prepared::TextFactsBuilder)->std::result::Result<(),Vec<RuntimeDiagnostic>> {{if !value.1 {{return Err(vec![RuntimeDiagnostic::new(\"fact.unready\",\"Collection meaning is unavailable\")]);}}{code}contribute_value_{}(&value.0,direction,source,inputs,builder)}}",part.id).unwrap();
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
        let summaries = super::summaries::Summaries::new(contribution);
        let mut entry = part.clone();
        let mut contribution = contribution.clone();
        crate::plan::contracts::expression(
            &mut contribution.for_each.as_mut().unwrap().input,
            owner,
            part,
        )?;
        if path.is_empty()
            && (!summaries.is_empty() || external_context(&contribution, owner, part))
        {
            out.push_str(&sequence_with_context(
                ordinal,
                &contribution,
                owner,
                part,
                program,
                &summaries,
            )?);
            continue;
        }
        if !path.is_empty() {
            out.push_str(&nested_contribution(
                ordinal,
                &contribution,
                owner,
                part,
                program,
                (slot, &path),
                &summaries,
            )?);
            continue;
        }
        if let Some(condition) = contribution.when.as_mut() {
            crate::plan::contracts::expression(condition, owner, part)?;
        }
        crate::plan::contracts::expression(&mut contribution.key, owner, part)?;
        if let Some(value) = contribution.write.value_mut() {
            crate::plan::contracts::expression(value, owner, part)?;
        }
        entry.contributions = vec![contribution];
        let id = entry.id;
        let code = super::collections::stored(&entry, program)?.expect("collection contribution");
        writeln!(out,"pub(super) fn contribute_{ordinal}(value:&Stored,direction:Direction,source:&[u8],inputs:&InputView<'_>,builder:&mut core::facts::prepared::TextFactsBuilder)->std::result::Result<(),Vec<RuntimeDiagnostic>> {{if !value.1 {{return Err(vec![RuntimeDiagnostic::new(\"fact.unready\",\"Collection meaning is unavailable\")]);}}{code}contribute_value_{id}(&value.0,direction,source,inputs,builder)}}").unwrap();
    }
    Ok(out)
}

struct RowProjection {
    constants: String,
    keys: Vec<String>,
    value: String,
    method: &'static str,
    condition: String,
    preparation: String,
}

fn row_projection(
    contribution: &LinkedContribution,
    owner: &LinkedEntry,
    part: &LinkedEntry,
    program: &Program,
    owner_fields: &[LinkedField],
    row_fields: &[LinkedField],
    summaries: &super::summaries::Summaries,
) -> Result<RowProjection, Diagnostic> {
    let mut storage = vec![(String::new(), String::new()); owner_fields.len()];
    let mut context_slots = BTreeSet::new();
    for expression in std::iter::once(&contribution.key)
        .chain(contribution.write.value())
        .chain(contribution.when.as_ref())
    {
        collect_fields(expression, &mut context_slots, summaries);
    }
    for slot in context_slots {
        let method = scalar::Codec::resolve(&owner_fields[slot as usize].value, owner, program)?
            .input_method()
            .ok_or_else(|| unsupported(owner, "Contribution context requires a borrowed scalar"))?;
        storage[slot as usize] = (
            format!("core::inputs::RecordInput::{method}(&context_view,{slot})?"),
            format!("context[{slot}].is_some()"),
        );
    }
    let mut lowered =
        super::super::expressions::Expressions::new(owner, program, owner_fields, Some(&storage));
    lowered.borrow_record_row(0, row_fields);
    summaries.bind(&mut lowered)?;
    let keys = super::super::fact_keys::parts(&contribution.key, part, |value| {
        let code = lowered.lower(value)?;
        Ok(super::super::expressions::Expressions::text_reference(
            value, code,
        ))
    })?;
    let (method, value) = super::projection(contribution, |value| {
        let code = lowered.lower(value)?;
        Ok(super::super::expressions::Expressions::text_reference(
            value, code,
        ))
    })?;
    let condition = contribution
        .when
        .as_ref()
        .map(|value| lowered.lower(value))
        .transpose()?
        .unwrap_or_else(|| "true".into());
    Ok(RowProjection {
        constants: lowered.constants,
        keys,
        value,
        method,
        condition,
        preparation: summaries.prepare(),
    })
}

fn sequence_with_context(
    ordinal: usize,
    contribution: &LinkedContribution,
    owner: &LinkedEntry,
    part: &LinkedEntry,
    program: &Program,
    summaries: &super::summaries::Summaries,
) -> Result<String, Diagnostic> {
    let LinkedType::Record(owner_fields) = &owner.value else {
        unreachable!()
    };
    let Some(iteration) = &contribution.for_each else {
        unreachable!()
    };
    let LinkedType::Sequence(item) = &iteration.input.value_type else {
        return Err(unsupported(
            owner,
            "Collection contribution requires row values",
        ));
    };
    let LinkedType::Record(row_fields) = item.as_ref() else {
        return Err(unsupported(
            owner,
            "Collection contribution requires record rows",
        ));
    };
    let RowProjection {
        constants,
        keys,
        value,
        method,
        condition,
        preparation,
    } = row_projection(
        contribution,
        owner,
        part,
        program,
        owner_fields,
        row_fields,
        summaries,
    )?;
    if contribution.union_reference_prefix.is_some() {
        return Err(unsupported(
            owner,
            "Nested union contribution needs its own sequence projection",
        ));
    }
    let loop_open = super::super::expressions::iteration_loop(iteration, "rows", "v0");
    Ok(format!(
        "pub(super) fn contribute_{ordinal}(value:&Stored,context:&[Option<core::inputs::InputRef<'_>>],direction:Direction,source:&[u8],inputs:&InputView<'_>,builder:&mut core::facts::prepared::TextFactsBuilder)->std::result::Result<(),Vec<RuntimeDiagnostic>> {{if !value.1 {{return Err(vec![RuntimeDiagnostic::new(\"fact.unready\",\"Collection meaning is unavailable\")]);}}let issues=match direction {{Direction::XmlToYaml=>check_xml_{}(&value.0,source,inputs),Direction::YamlToXml=>check_yaml_{}(&value.0,source,inputs)}};if issues.iter().any(|issue|issue.severity==Severity::Error) {{return Err(issues);}}let context_view=core::inputs::RecordView::new(context);let rows=core::inputs::Records::new(&value.0.rows);{preparation}{}{loop_open}let result=(||->std::result::Result<(),FactErrors>{{let _inputs=inputs;if {condition} {{builder.{method}(fact_id({:?}).expect(\"declared index\"),&[{}],{}).map_err(|error|RuntimeDiagnostic::new(\"fact.budget\",format!(\"{{error:?}}\")))?;}}Ok(())}})();result.map_err(|errors|errors.0)?;}}Ok(())}}",
        part.id,
        part.id,
        constants,
        contribution.index,
        keys.join(","),
        value
    ))
}

fn nested_contribution(
    ordinal: usize,
    contribution: &LinkedContribution,
    owner: &LinkedEntry,
    part: &LinkedEntry,
    program: &Program,
    route: (u32, &[u32]),
    summaries: &super::summaries::Summaries,
) -> Result<String, Diagnostic> {
    let (owner_root, path) = route;
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
    let xml_missing = super::super::presence::denotes_absent(
        owner,
        LinkedPresenceTarget::Field(owner_root),
        crate::plan::RepresentationSide::Xml,
    );
    let yaml_missing = super::super::presence::denotes_absent(
        owner,
        LinkedPresenceTarget::Field(owner_root),
        crate::plan::RepresentationSide::Yaml,
    );
    let LinkedType::Record(fields) = &owner.value else {
        unreachable!()
    };
    let RowProjection {
        constants,
        keys,
        value,
        method,
        condition,
        preparation,
    } = row_projection(
        contribution,
        owner,
        part,
        program,
        fields,
        row_fields,
        summaries,
    )?;
    let mut out = format!(
        "pub(super) fn contribute_{ordinal}(value:&Stored,context:&[Option<core::inputs::InputRef<'_>>],direction:Direction,source:&[u8],inputs:&InputView<'_>,builder:&mut core::facts::prepared::TextFactsBuilder)->std::result::Result<(),Vec<RuntimeDiagnostic>> {{let issues=match direction {{Direction::XmlToYaml=>check_xml(value,source,inputs),Direction::YamlToXml=>check_yaml(value,source,inputs)}};if issues.iter().any(|issue|issue.severity==Severity::Error) {{return Err(issues);}}let context_view=core::inputs::RecordView::new(context);let normal_missing=match direction {{Direction::XmlToYaml=>{xml_missing},Direction::YamlToXml=>{yaml_missing}}};let record=match input_field(value,{root}) {{Some(core::inputs::InputRef::Record(record))=>Some(record),None if normal_missing=>None,_=>return Err(vec![RuntimeDiagnostic::new(\"fact.unready\",\"Contribution record is unavailable\")])}};"
    );
    for slot in &path[..path.len() - 1] {
        writeln!(out,"let record=match record {{Some(record)=>match record.field({slot}) {{Some(core::inputs::InputRef::Record(record))=>Some(record),_=>return Err(vec![RuntimeDiagnostic::new(\"fact.unready\",\"Contribution record is unavailable\")])}},None=>None}};").unwrap();
    }
    let last = path[path.len() - 1];
    let loop_open = super::super::expressions::iteration_loop(iteration, "rows", "v0");
    if contribution.union_reference_prefix.is_some() {
        let key = keys.first().expect("linked named union key");
        writeln!(out,"{}let result=(||->std::result::Result<(),FactErrors>{{builder.begin_union(fact_id({:?}).expect(\"declared index\"),{}).map_err(|error|RuntimeDiagnostic::new(\"fact.budget\",format!(\"{{error:?}}\")))?;Ok(())}})();result.map_err(|errors|errors.0)?;",constants,contribution.index,key).unwrap();
        writeln!(out,"if let Some(record)=record {{let rows=record.records({last}).map_err(|error|vec![error])?;{preparation}{loop_open}let result=(||->std::result::Result<(),FactErrors>{{let _inputs=inputs;if {condition} {{builder.push_union(fact_id({:?}).expect(\"declared index\"),{}).map_err(|error|RuntimeDiagnostic::new(\"fact.budget\",format!(\"{{error:?}}\")))?;}}Ok(())}})();result.map_err(|errors|errors.0)?;}}}}Ok(())}}",contribution.index,value).unwrap();
    } else {
        writeln!(out,"if let Some(record)=record {{let rows=record.records({last}).map_err(|error|vec![error])?;{preparation}{loop_open}let result=(||->std::result::Result<(),FactErrors>{{{}let _inputs=inputs;if {condition} {{builder.{method}(fact_id({:?}).expect(\"declared index\"),&[{}],{}).map_err(|error|RuntimeDiagnostic::new(\"fact.budget\",format!(\"{{error:?}}\")))?;}}Ok(())}})();result.map_err(|errors|errors.0)?;}}}}Ok(())}}",constants,contribution.index,keys.join(","),value).unwrap();
    }
    Ok(out)
}
