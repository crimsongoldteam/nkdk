use super::*;

fn declared_row_module(entry: &LinkedEntry, program: &Program) -> Option<&'static str> {
    super::super::declared_items::applies(entry, program).then(|| {
        if super::super::declared_items::needs_row_boundary(entry, program) {
            "row"
        } else {
            "item"
        }
    })
}

fn row_text(
    expression: &LinkedExpression,
    entry: &LinkedEntry,
    program: &Program,
    summaries: &super::summaries::Summaries,
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
            if let Some(module) = declared_row_module(entry, program) {
                return Ok(format!(
                    "{module}_{}::text(row,{index}).map_err(|error|vec![error])?",
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
        LinkedExpressionKind::Operation { .. } => {
            row_expression(expression, entry, program, summaries)
        }
        _ => text(expression, entry, program),
    }
}

fn row_condition(
    condition: &LinkedExpression,
    entry: &LinkedEntry,
    program: &Program,
    summaries: &super::summaries::Summaries,
) -> Result<String, Diagnostic> {
    if super::super::declared_items::applies(entry, program) {
        return row_expression(condition, entry, program, summaries);
    }
    let LinkedExpressionKind::Operation {
        operator: LinkedOperator::State(StatePredicate::Present),
        arguments,
    } = &condition.kind
    else {
        return Err(unsupported(
            entry,
            "Collection contribution requires a row-field presence condition",
        ));
    };
    let [argument] = arguments.as_slice() else {
        return Err(unsupported(
            entry,
            "Collection contribution requires one presence argument",
        ));
    };
    let LinkedExpressionKind::Operation {
        operator: LinkedOperator::Get(slot),
        arguments: row,
    } = &argument.kind
    else {
        return Err(unsupported(
            entry,
            "Collection contribution condition must read a row field",
        ));
    };
    if !matches!(row.as_slice(), [value] if matches!(value.kind,LinkedExpressionKind::Variable(0)))
    {
        return Err(unsupported(
            entry,
            "Collection contribution condition must read its current row",
        ));
    }
    if argument.value_type != LinkedType::Scalar(ScalarType::Text) {
        return Err(unsupported(
            entry,
            "Collection contribution condition requires a text field",
        ));
    }
    if let Some(module) = declared_row_module(entry, program) {
        return Ok(format!(
            "match {module}_{}::text(row,{slot}) {{Ok(text)=>!text.is_empty(),Err(error) if error.code.as_deref()==Some(\"fact.unready\")=>false,Err(error)=>return Err(vec![error])}}",
            entry.id
        ));
    }
    Ok(format!(
        "!({}).is_empty()",
        row_text(argument, entry, program, summaries)?
    ))
}

fn row_expression(
    value: &LinkedExpression,
    entry: &LinkedEntry,
    program: &Program,
    summaries: &super::summaries::Summaries,
) -> Result<String, Diagnostic> {
    fn independent(value: &LinkedExpression, summaries: &super::summaries::Summaries) -> bool {
        if summaries.contains(value) {
            return true;
        }
        match &value.kind {
            LinkedExpressionKind::Field(_)
            | LinkedExpressionKind::SelfValue
            | LinkedExpressionKind::Capture(_) => false,
            LinkedExpressionKind::Operation {
                operator: LinkedOperator::Get(_),
                arguments,
            } if matches!(arguments.as_slice(), [row] if matches!(row.kind, LinkedExpressionKind::Variable(0))) => {
                true
            }
            LinkedExpressionKind::Operation { arguments, .. } => {
                arguments.iter().all(|value| independent(value, summaries))
            }
            _ => true,
        }
    }
    let result_type = match value.value_type {
        LinkedType::Scalar(ScalarType::Text) => "String",
        LinkedType::Scalar(ScalarType::Boolean) => "bool",
        _ => {
            return Err(unsupported(
                entry,
                "Contribution expression requires text or boolean",
            ));
        }
    };
    if !independent(value, summaries) {
        return Err(unsupported(
            entry,
            "Computed contribution requires an expression over its row and prepared inputs",
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
    let declared = super::super::declared_items::applies(entry, program);
    let resolved = if declared {
        crate::link::sequence_item::resolve(common, program)?
    } else {
        None
    };
    let row_type = resolved.as_ref().map_or(item.as_ref(), |row| &row.value);
    let LinkedType::Record(fields) = row_type else {
        return Err(unsupported(
            entry,
            "Computed contribution currently requires record rows",
        ));
    };
    if !declared && collection_values::codec(common, program)?.is_some() {
        return Err(unsupported(
            entry,
            "Computed typed contribution requires exposed row storage",
        ));
    }
    let mut expressions = super::super::expressions::Expressions::new(entry, program, &[], None);
    let binding = if declared {
        expressions.borrow_record_row(0, fields);
        "let v0: &dyn core::inputs::RecordInput=row;"
    } else {
        expressions.local_fields.insert(
            0,
            (0..fields.len())
                .map(|index| format!("row.fields[{index}].as_str()"))
                .collect(),
        );
        "let _v0=row;"
    };
    summaries.bind(&mut expressions)?;
    let lowered = expressions.lower(value)?;
    let lowered = if result_type == "String" {
        super::super::expressions::Expressions::text_owned(value, lowered)
    } else {
        lowered
    };
    let reference = if result_type == "String" { "&" } else { "" };
    Ok(format!(
        "{reference}{{{}let _inputs=inputs;let evaluate=||->core::Result<{result_type}>{{{binding}Ok({lowered})}};evaluate().map_err(|error|vec![error])?}}",
        expressions.constants
    ))
}

pub(super) fn generate(
    entry: &LinkedEntry,
    program: &Program,
    names: &[&str],
) -> Result<Option<String>, Diagnostic> {
    generate_impl(entry, program, names, false, false)
}

/// Snapshot a declared text sequence without requiring an index contribution.
/// It uses the same projection as collection facts, not the strict converter.
pub(super) fn snapshot(
    entry: &LinkedEntry,
    program: &Program,
) -> Result<Option<String>, Diagnostic> {
    let LinkedType::Record(fields) = &entry.value else {
        return Ok(None);
    };
    let [field] = fields.as_slice() else {
        return Ok(None);
    };
    let Some((id, _, _)) = field.value.as_reference() else {
        return Ok(None);
    };
    let Some(common) = program.entries.iter().find(|row| row.id == id) else {
        return Ok(None);
    };
    if !matches!(&common.value, LinkedType::Sequence(item) if **item == LinkedType::Scalar(ScalarType::Text))
        || !matches!(&common.xml, LinkedXml::ElementSequence { .. })
        || !entry.constraints.is_empty()
    {
        return Ok(None);
    }
    generate_impl(entry, program, &[], false, true)
}

pub(super) fn stored(entry: &LinkedEntry, program: &Program) -> Result<Option<String>, Diagnostic> {
    // The owner has already loaded this value from its document. Its file
    // placement must not suppress the declared-row backend used by conversion.
    let mut local = entry.clone();
    if let LinkedXml::Record(fields) = &mut local.xml {
        for field in fields {
            field.file = None;
        }
    }
    generate_impl(&local, program, &[], true, false)
}

fn generate_impl(
    entry: &LinkedEntry,
    program: &Program,
    names: &[&str],
    stored: bool,
    snapshot_only: bool,
) -> Result<Option<String>, Diagnostic> {
    let contributions = super::effective_contributions(entry, program);
    if contributions.is_empty() && !snapshot_only {
        return Ok(None);
    }
    let implicit_rows = contributions.iter().all(|value| value.for_each.is_none());
    if implicit_rows && !super::collection_has_contributions(entry, program) && !snapshot_only {
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
    let projected_fields = if let (
        LinkedXml::ElementSequence { path, .. },
        LinkedType::Sequence(item),
    ) = (&common.xml, &common.value)
        && let Some((row_id, _, _)) = item.as_reference()
        && let Some(row) = program.entries.iter().find(|entry| entry.id == row_id)
        && let LinkedType::Record(row_values) = &row.value
        && !row_values.is_empty()
        && let (LinkedXml::Record(row_fields), _) = super::super::attributes::content(&row.xml)
    {
        let mut prefix = xml[0].path.clone();
        prefix.extend(path.iter().cloned());
        let leaves = row_fields
            .iter()
            .filter(|field| !field.path.is_empty())
            .map(|field| {
                let mut leaf = prefix.clone();
                leaf.extend(field.path.iter().cloned());
                super::super::record::path_code(&leaf)
            })
            .collect::<Vec<_>>();
        let (_, fixed_attributes) = super::super::attributes::content(&row.xml);
        let attributes = row_fields
            .iter()
            .filter(|field| field.path.is_empty())
            .filter_map(|field| field.attribute.as_ref())
            .chain(fixed_attributes.iter().map(|attribute| &attribute.name))
            .map(|name| {
                format!(
                    "({})",
                    super::super::attributes::name_matches(name, "attribute.name")
                )
            })
            .collect::<Vec<_>>();
        let header = format!(
            "if path.len()=={} && let core::xml::Token::Attribute(attribute)=token && !({}) {{return Ok(true);}}",
            prefix.len(),
            if attributes.is_empty() {
                "false".into()
            } else {
                attributes.join(" || ")
            }
        );
        let children = if leaves.is_empty() {
            format!("if path.len()>{} {{return Ok(true);}}", prefix.len())
        } else {
            format!(
                "if path.len()>{} && ![{}].iter().any(|leaf| {{let shared=path.len().min(leaf.len());core::xml::matches(&path[..shared],&leaf[..shared])}}) {{return Ok(true);}}",
                prefix.len(),
                leaves.join(",")
            )
        };
        super::owners::collection_filter(row, program, &prefix)
            .unwrap_or_else(|| format!("{header}{children}"))
    } else {
        String::new()
    };
    let yaml_read = if declared_row_module(entry, program).is_some() {
        let events = super::yaml_projection::events(entry, program);
        format!(
            "let mut preserved=false;let value=match read_yaml_events_{id}(source,inputs,({events}).observe_raw(&mut preserved)) {{Ok(value)=>value,Err(error) if error.code.as_deref().is_some_and(|code|code.starts_with(\"yaml.\"))=>{{let projected=({events}).document()?;read_yaml_{id}(&projected,inputs)?}},Err(error)=>return Err(error)}};if preserved {{let xml=write_xml_{id}(&value,inputs)?;read_xml_fact_{id}(&xml,inputs)}} else {{Ok(value)}}"
        )
    } else {
        format!("read_yaml_{id}(source,inputs)")
    };
    let mut out = format!(
        r#"fn read_xml_fact_{id}(source:&[u8],inputs:&InputView<'_>)->core::Result<V{id}> {{
        let mut owner_seen=false;
        let value=read_xml_with_{id}(source,inputs,|path,token|{{
            if path.is_empty() {{return Ok(false);}}
            let route={route};
            if core::xml::matches(path,&route[..route.len().saturating_sub(1).max(1)]) && matches!(token,core::xml::Token::Start(_)) {{
                if owner_seen {{return Err(RuntimeDiagnostic::new("fact.unready","Contribution owner container is repeated"));}}
                owner_seen=true;
            }}
            if !core::xml::matches(&path[..1],&route[..1]) {{return Err(RuntimeDiagnostic::new("xml.root","Unexpected contribution document root"));}}
            let shared=path.len().min(route.len());
            if !core::xml::matches(&path[..shared],&route[..shared]) || (path.len()<route.len() && matches!(token,core::xml::Token::Attribute(_) | core::xml::Token::Text(_))) {{return Ok(true);}}
            {projected_fields}
            Ok(false)
        }})?;
        if !owner_seen && {require_owner} {{return Err(RuntimeDiagnostic::new("fact.unready","Contribution owner container is missing"));}}
        Ok(value)
    }}
    fn read_yaml_fact_{id}(source:&[u8],inputs:&InputView<'_>)->core::Result<V{id}> {{{yaml_read}}}
"#,
        require_owner = !snapshot_only
            && !super::super::presence::denotes_absent(
                entry,
                LinkedPresenceTarget::Field(0),
                crate::plan::RepresentationSide::Xml
            ),
    );
    if snapshot_only {
        return Ok(Some(out));
    }
    write!(out, r#"fn contribute_{id}(direction:Direction,source:&[u8],inputs:&InputView<'_>,builder:&mut core::facts::prepared::TextFactsBuilder)->std::result::Result<(),Vec<RuntimeDiagnostic>> {{
        let value=match direction {{Direction::XmlToYaml=>read_xml_fact_{id}(source,inputs),Direction::YamlToXml=>read_yaml_fact_{id}(source,inputs)}}.map_err(|error|vec![error])?;
        contribute_value_{id}(&value,direction,source,inputs,builder)
    }}"#).unwrap();
    if stored {
        out.clear();
    }
    writeln!(out,r#"fn contribute_value_{id}(value:&V{id},direction:Direction,source:&[u8],inputs:&InputView<'_>,builder:&mut core::facts::prepared::TextFactsBuilder)->std::result::Result<(),Vec<RuntimeDiagnostic>> {{
        if value.raw.is_some() && value.rows.is_empty() {{return Err(vec![RuntimeDiagnostic::new("fact.unready","Collection meaning is unavailable")]);}}
        let issues=match direction {{Direction::XmlToYaml=>{check}_xml_{id}(value,source,inputs),Direction::YamlToXml=>{check}_yaml_{id}(value,source,inputs)}};
        if issues.iter().any(|issue|issue.severity==Severity::Error) {{return Err(issues);}}
"#).unwrap();
    for contribution in &entry.contributions {
        let summaries = super::summaries::Summaries::new(contribution);
        if !summaries.is_empty() {
            if !super::super::declared_items::applies(entry, program) {
                return Err(unsupported(
                    entry,
                    "Prepared collection summaries require declared record rows",
                ));
            }
            writeln!(
                out,
                "let rows=core::inputs::Records::new(&value.rows);{}",
                summaries.prepare()
            )
            .unwrap();
        }
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
            row_text(value, entry, program, &summaries)
        })?
        .join(",");
        let (method, value) = super::projection(contribution, |value| {
            row_text(value, entry, program, &summaries)
        })?;
        let condition = contribution
            .when
            .as_ref()
            .map(|when| row_condition(when, entry, program, &summaries))
            .transpose()?
            .unwrap_or_else(|| "true".into());
        let loop_open = super::super::expressions::iteration_loop(
            contribution.for_each.as_ref().expect("validated iteration"),
            "value.rows.iter()",
            "row",
        );
        writeln!(out,"{loop_open}if {condition} {{builder.{method}({index},&[{key}],{value}).map_err(|error|vec![RuntimeDiagnostic::new(\"fact.budget\",format!(\"{{error:?}}\"))])?;}}}}").unwrap();
    }
    if super::super::declared_items::applies(entry, program)
        && super::has_contributions(common, program)
    {
        let module = if super::super::declared_items::needs_row_boundary(entry, program) {
            "row"
        } else {
            "item"
        };
        let call = format!("{module}_{id}::contribute(row,direction,source,inputs,builder)");
        let call = if matches!(&common.yaml,
            YamlRepresentation::RecordMapping { item_inputs, .. } if !item_inputs.is_empty())
        {
            format!(
                "with_stored_row_{id}(row,inputs,|inputs|Ok({call})).map_err(|error|vec![error])??;"
            )
        } else {
            format!("{call}?;")
        };
        writeln!(out, "for (position,row) in value.rows.iter().enumerate() {{let inputs=&inputs.with_collection_position(position);{call}}}").unwrap();
    }
    out.push_str("Ok(())}\n");
    Ok(Some(out))
}
