use super::*;
use std::fmt::Write;

pub(super) fn generate(entries: &[&LinkedEntry]) -> Result<String, Diagnostic> {
    let mut out = String::from(
        "pub fn resource_requests(entry: EntryId, inputs: &PreparedInputs, limits: core::resources::Limits) -> core::Result<core::resources::Plan> { inputs.check_entry(entry)?; let mut plan = core::resources::Plan::new(limits); match entry.0 {\n",
    );
    for entry in entries {
        writeln!(out, "{} => {{", entry.id).unwrap();
        for group in &entry.resources {
            if let Some(iteration) = &group.for_each {
                writeln!(
                    out,
                    "for resource_item in {} {{ let _resource_v{} = resource_item?;",
                    sequence(&iteration.input, entry)?,
                    iteration.slot
                )
                .unwrap();
            }

            out.push_str("plan.push(vec![");
            for route in &group.alternatives {
                let xml = path(&route.xml, entry)?;
                let yaml = path(&route.yaml, entry)?;
                let remainder = if group.remainder { ".remainder()" } else { "" };
                write!(
                    out,
                    "core::resources::Route::new({xml}, {yaml}){remainder},"
                )
                .unwrap();
            }
            out.push_str("])?;\n");
            if group.for_each.is_some() {
                out.push_str("}\n");
            }
        }
        out.push_str("},\n");
    }
    out.push_str("_ => return Err(RuntimeDiagnostic::new(\"entry.unknown\", \"Unknown generated entry\")) } Ok(plan) }\n");
    // Catalogs without resource declarations must compile warning-free too.
    if entries.iter().all(|entry| entry.resources.is_empty()) {
        out = out.replace("let mut plan =", "let plan =");
    }
    out.push_str("pub fn document_paths(entry:EntryId)->core::Result<&'static [&'static [&'static str]]> {match entry.0 {\n");
    for entry in entries {
        let fields = match super::attributes::content(&entry.xml).0 {
            LinkedXml::Record(fields) => fields.as_slice(),
            _ => &[],
        };
        let paths = fields
            .iter()
            .filter_map(|field| field.file.as_ref())
            .map(|path| format!("&{path:?}"))
            .collect::<Vec<_>>()
            .join(",");
        writeln!(out, "{}=>Ok(&[{paths}]),", entry.id).unwrap();
    }
    out.push_str(
        "_=>Err(RuntimeDiagnostic::new(\"entry.unknown\",\"Unknown generated entry\"))}}\n",
    );
    Ok(out)
}
fn path(value: &LinkedExpression, entry: &LinkedEntry) -> Result<String, Diagnostic> {
    match &value.kind {
        LinkedExpressionKind::Input(_) => Ok(format!(
            "core::resources::RelativePath::new({}.collect::<core::Result<Vec<_>>>()?, limits.path_bytes)?",
            sequence(value, entry)?
        )),
        LinkedExpressionKind::Operation {
            operator: LinkedOperator::Sequence,
            arguments,
        } => Ok(format!(
            "core::resources::RelativePath::new([{}], limits.path_bytes)?",
            text_parts(arguments, entry)?
        )),
        _ => Err(unsupported(
            entry,
            "Resource path requires explicit sequence parts",
        )),
    }
}
fn text(value: &LinkedExpression, entry: &LinkedEntry) -> Result<String, Diagnostic> {
    match &value.kind {
        LinkedExpressionKind::Variable(slot) => Ok(format!("_resource_v{slot}")),
        LinkedExpressionKind::Literal(ScalarLiteral::Text(value)) => Ok(format!("{value:?}")),
        LinkedExpressionKind::Input(slot)
            if value.value_type == LinkedType::Scalar(ScalarType::Text) =>
        {
            Ok(format!("inputs.text({slot})?"))
        }
        LinkedExpressionKind::Operation {
            operator: LinkedOperator::Concat,
            arguments,
        } => Ok(format!(
            "&core::resources::concat(&[{}], limits.path_bytes)?",
            text_parts(arguments, entry)?
        )),
        _ => Err(unsupported(
            entry,
            "Resource segment requires prepared text",
        )),
    }
}

fn sequence(value: &LinkedExpression, entry: &LinkedEntry) -> Result<String, Diagnostic> {
    match &value.kind {
        LinkedExpressionKind::Input(slot) => Ok(format!(
            "inputs.sequence({slot})?.iter().map(|item| match item {{ InputValue::Text(value) => Ok(value.as_str()), _ => Err(RuntimeDiagnostic::new(\"input.type\", \"Resource iteration requires text\")) }})"
        )),
        LinkedExpressionKind::Operation {
            operator: LinkedOperator::Sequence,
            arguments,
        } => Ok(format!(
            "[{}].into_iter().map(Ok::<_, RuntimeDiagnostic>)",
            text_parts(arguments, entry)?
        )),
        _ => Err(unsupported(
            entry,
            "Resource iteration requires prepared text values",
        )),
    }
}

fn text_parts(values: &[LinkedExpression], entry: &LinkedEntry) -> Result<String, Diagnostic> {
    values
        .iter()
        .map(|value| text(value, entry))
        .collect::<Result<Vec<_>, _>>()
        .map(|parts| parts.join(","))
}

/// Validate the composed shape, so a fragment cannot hide discarded value behavior.
pub(super) fn validate_entry(entry: &LinkedEntry) -> Result<(), Diagnostic> {
    if !matches!(&entry.value, LinkedType::Record(fields) if fields.is_empty())
        || !matches!(&entry.xml, LinkedXml::Record(fields) if fields.is_empty())
        || !matches!(&entry.yaml, YamlRepresentation::Mapping(fields) if fields.is_empty())
        || !entry.constraints.is_empty()
        || !entry.contributions.is_empty()
        || !entry.presence.is_empty()
        || !entry.shorthands.is_empty()
        || entry.normalization.is_some()
        || !entry.text_transforms.is_empty()
    {
        return Err(unsupported(
            entry,
            "Resource entries cannot contain value representations or value behavior",
        ));
    }
    Ok(())
}
