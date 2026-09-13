use super::*;

fn row_text(
    expression: &LinkedExpression,
    entry: &LinkedEntry,
    program: &Program,
) -> Result<String, Diagnostic> {
    match &expression.kind {
        LinkedExpressionKind::Variable(0) => Ok("row.fields[0].as_str()".into()),
        LinkedExpressionKind::Operation {
            operator: LinkedOperator::Get(index),
            arguments,
        } if matches!(arguments.as_slice(), [value] if matches!(value.kind,LinkedExpressionKind::Variable(0))) =>
        {
            let LinkedType::Record(fields) = &entry.value else {
                unreachable!("checked collection owner")
            };
            let (id, _, _) = composite::reference(&fields[0].value).expect("checked common");
            let common = program
                .entries
                .iter()
                .find(|value| value.id == id)
                .expect("linked common");
            if super::super::declared_items::applies(entry, program) {
                return Ok(format!(
                    "item_{}::text(row,{index}).map_err(|error|vec![error])?",
                    entry.id
                ));
            }
            if let Some(scalar::Codec::Sequence(codec)) = collection_values::codec(common, program)?
            {
                return codec
                    .head_meaning(
                        &collection_values::name(entry.id),
                        *index as usize,
                        "row.fields[0]",
                    )
                    .filter(|_| crate::fact_shape::text_cell(&expression.value_type))
                    .ok_or_else(|| {
                        unsupported(entry, "Index projection requires a scalar element field")
                    });
            }
            Ok(format!("row.fields[{index}].as_str()"))
        }
        LinkedExpressionKind::Operation { .. } => row_expression(expression, entry, program),
        _ => text(expression, entry, program),
    }
}

fn row_expression(
    value: &LinkedExpression,
    entry: &LinkedEntry,
    program: &Program,
) -> Result<String, Diagnostic> {
    fn independent(value: &LinkedExpression) -> bool {
        match &value.kind {
            LinkedExpressionKind::Field(_)
            | LinkedExpressionKind::SelfValue
            | LinkedExpressionKind::Capture(_) => false,
            LinkedExpressionKind::Operation { arguments, .. } => arguments.iter().all(independent),
            _ => true,
        }
    }
    if !independent(value) || value.value_type != LinkedType::Scalar(ScalarType::Text) {
        return Err(unsupported(
            entry,
            "Computed contribution requires a text expression over its row and prepared inputs",
        ));
    }
    let LinkedType::Record(owner) = &entry.value else {
        unreachable!()
    };
    let (reference, _, _) = composite::reference(&owner[0].value).expect("collection owner");
    let common = program
        .entries
        .iter()
        .find(|entry| entry.id == reference)
        .expect("linked collection");
    let LinkedType::Sequence(item) = &common.value else {
        unreachable!()
    };
    let LinkedType::Record(fields) = item.as_ref() else {
        return Err(unsupported(
            entry,
            "Computed contribution currently requires record rows",
        ));
    };
    if collection_values::codec(common, program)?.is_some() {
        return Err(unsupported(
            entry,
            "Computed typed contribution requires exposed row storage",
        ));
    }
    let mut expressions = super::super::expressions::Expressions::new(entry, program, &[], None);
    expressions.local_fields.insert(
        0,
        (0..fields.len())
            .map(|index| format!("row.fields[{index}].as_str()"))
            .collect(),
    );
    let lowered = expressions.lower(value)?;
    let lowered = super::super::expressions::Expressions::text_owned(value, lowered);
    Ok(format!(
        "&{{{}let _inputs=inputs;let evaluate=||->core::Result<String>{{let _v0=row;Ok({lowered})}};evaluate().map_err(|error|vec![error])?}}",
        expressions.constants
    ))
}

pub(super) fn generate(
    entry: &LinkedEntry,
    program: &Program,
    names: &[&str],
) -> Result<Option<String>, Diagnostic> {
    generate_impl(entry, program, names, false)
}

pub(super) fn stored(entry: &LinkedEntry, program: &Program) -> Result<Option<String>, Diagnostic> {
    generate_impl(entry, program, &[], true)
}

fn generate_impl(
    entry: &LinkedEntry,
    program: &Program,
    names: &[&str],
    stored: bool,
) -> Result<Option<String>, Diagnostic> {
    if entry
        .contributions
        .iter()
        .all(|value| value.for_each.is_none())
    {
        return Ok(None);
    }
    let LinkedType::Record(fields) = &entry.value else {
        return Err(unsupported(
            entry,
            "Collection projection requires an owner record",
        ));
    };
    let [field] = fields.as_slice() else {
        return Err(unsupported(
            entry,
            "Collection projection currently requires one collection field",
        ));
    };
    let reference = match &field.value {
        LinkedType::Reference(id) | LinkedType::BoundReference { entry: id, .. } => *id,
        _ => {
            return Err(unsupported(
                entry,
                "Collection projection requires a declared sequence",
            ));
        }
    };
    let common = program
        .entries
        .iter()
        .find(|entry| entry.id == reference)
        .expect("linked sequence");
    if !matches!(common.value, LinkedType::Sequence(_)) || !entry.constraints.is_empty() {
        return Err(unsupported(
            entry,
            "This projection stage requires a sequence without owner constraints",
        ));
    }
    let id = entry.id;
    // Conversion may preserve an invalid value with an annotation. Index
    // preparation must still see its declared violation, not the filtered
    // conversion diagnostics that accept that annotation.
    let check = if common.constraints.is_empty() {
        "check"
    } else {
        "issues"
    };
    let LinkedXml::Record(xml) = super::super::attributes::content(&entry.xml).0 else {
        unreachable!("checked collection mapping")
    };
    let route = super::super::record::path_code(&xml[0].path);
    let mut out = format!(
        r#"fn contribute_{id}(direction:Direction,source:&[u8],inputs:&PreparedInputs,builder:&mut core::facts::prepared::TextFactsBuilder)->std::result::Result<(),Vec<RuntimeDiagnostic>> {{
        let mut owner_seen=matches!(direction,Direction::YamlToXml);
        let value=match direction {{Direction::XmlToYaml=>read_xml_with_{id}(source,inputs,|path,token|{{
            if path.is_empty() {{return Ok(false);}}
            let route={route};
            if core::xml::matches(path,&route[..route.len().saturating_sub(1).max(1)]) && matches!(token,core::xml::Token::Start(_)) {{
                if owner_seen {{return Err(RuntimeDiagnostic::new("fact.unready","Contribution owner container is repeated"));}}
                owner_seen=true;
            }}
            if !core::xml::matches(&path[..1],&route[..1]) {{return Err(RuntimeDiagnostic::new("xml.root","Unexpected contribution document root"));}}
            let shared=path.len().min(route.len());
            Ok(!core::xml::matches(&path[..shared],&route[..shared]) || (path.len()<route.len() && matches!(token,core::xml::Token::Attribute(_) | core::xml::Token::Text(_))))
        }}),Direction::YamlToXml=>read_yaml_{id}(source,inputs)}}.map_err(|error|vec![error])?;
        if !owner_seen {{return Err(vec![RuntimeDiagnostic::new("fact.unready","Contribution owner container is missing")]);}}
        contribute_value_{id}(&value,direction,source,inputs,builder)
    }}"#
    );
    if stored {
        out.clear();
    }
    writeln!(out,r#"fn contribute_value_{id}(value:&V{id},direction:Direction,source:&[u8],inputs:&PreparedInputs,builder:&mut core::facts::prepared::TextFactsBuilder)->std::result::Result<(),Vec<RuntimeDiagnostic>> {{
        if value.raw.is_some() && value.rows.is_empty() {{return Err(vec![RuntimeDiagnostic::new("fact.unready","Collection meaning is unavailable")]);}}
        let issues=match direction {{Direction::XmlToYaml=>{check}_xml_{id}(value,source,inputs),Direction::YamlToXml=>{check}_yaml_{id}(value,source,inputs)}};
        if issues.iter().any(|issue|issue.severity==Severity::Error) {{return Err(issues);}}
"#).unwrap();
    for contribution in &entry.contributions {
        if !matches!(&contribution.for_each,Some(iteration) if matches!(iteration.input.kind,LinkedExpressionKind::Field(0)))
        {
            return Err(unsupported(
                entry,
                "Collection projection must iterate the declared owner field",
            ));
        }
        let index = if stored {
            format!(
                "fact_id({:?}).expect(\"declared index\")",
                contribution.index
            )
        } else {
            format!(
                "core::facts::prepared::FactId({})",
                names.binary_search(&contribution.index.as_str()).unwrap()
            )
        };
        let key = super::super::fact_keys::parts(&contribution.key, entry, |value| {
            row_text(value, entry, program)
        })?
        .join(",");
        let value = row_text(&contribution.value, entry, program)?;
        writeln!(out,"for row in value.rows.iter() {{builder.push_parts({index},&[{key}],{value}).map_err(|error|vec![RuntimeDiagnostic::new(\"fact.budget\",format!(\"{{error:?}}\"))])?;}}").unwrap();
    }
    out.push_str("Ok(())}\n");
    Ok(Some(out))
}
