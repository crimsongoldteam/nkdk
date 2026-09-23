use super::*;

pub(super) fn fields(
    fields: &[LinkedField],
    parts: &[TextPatternPart],
    source: &SourceLocation,
) -> Result<(), Diagnostic> {
    fn visit(
        parts: &[TextPatternPart],
        fields: &[LinkedField],
        seen: &mut BTreeSet<String>,
        mut previous: bool,
    ) -> Result<bool, Diagnostic> {
        let mut prefixes: Vec<&str> = Vec::new();
        for part in parts {
            match &part.value {
                TextPatternValue::Field(name) => {
                    if previous {
                        return Err(diagnostic(
                            "text_pattern_ambiguous",
                            &part.source,
                            "Text fields need a nonempty separating literal",
                        ));
                    }
                    if !fields.iter().any(|field| field.name == *name) {
                        return Err(diagnostic(
                            "text_pattern_field",
                            &part.source,
                            "Unknown pattern field",
                        ));
                    }
                    if !seen.insert(name.clone()) {
                        return Err(diagnostic(
                            "text_pattern_field",
                            &part.source,
                            "Repeated pattern field",
                        ));
                    }
                    previous = true;
                }
                TextPatternValue::Literal(text) => {
                    if prefixes
                        .iter()
                        .any(|prefix| prefix.starts_with(text) || text.starts_with(prefix))
                    {
                        return Err(diagnostic(
                            "text_pattern_ambiguous",
                            &part.source,
                            "Optional prefixes must be disjoint",
                        ));
                    }
                    prefixes.clear();
                    previous = false;
                }
                TextPatternValue::Optional { field, parts } => {
                    if !matches!(parts.first().map(|part|&part.value),Some(TextPatternValue::Literal(text)) if !text.is_empty())
                    {
                        return Err(diagnostic(
                            "text_pattern_group",
                            &part.source,
                            "Optional group requires a nonempty opening literal",
                        ));
                    }
                    let TextPatternValue::Literal(prefix) = &parts[0].value else {
                        unreachable!("opening literal")
                    };
                    if prefixes.iter().any(|previous| {
                        previous.starts_with(prefix) || prefix.starts_with(previous)
                    }) {
                        return Err(diagnostic(
                            "text_pattern_ambiguous",
                            &part.source,
                            "Optional prefixes must be disjoint",
                        ));
                    }
                    prefixes.push(prefix);
                    if !nkdk_rule_model::text_pattern_fields(parts).contains(&field.as_str()) {
                        return Err(diagnostic(
                            "text_pattern_group",
                            &part.source,
                            "Optional group must contain its controlling field",
                        ));
                    }
                    previous |= visit(parts, fields, seen, previous)?;
                }
            }
        }
        Ok(previous)
    }
    let mut seen = BTreeSet::new();
    visit(parts, fields, &mut seen, false)?;
    if seen.len() != fields.len() {
        return Err(diagnostic(
            "text_pattern_coverage",
            source,
            "Every field must occur exactly once in a text pattern",
        ));
    }
    Ok(())
}

pub(super) fn types(entries: &BTreeMap<u32, LinkedEntry>) -> Result<(), Diagnostic> {
    fn xml_parts(xml: &LinkedXml) -> Option<&[TextPatternPart]> {
        match xml {
            LinkedXml::TextPattern(parts) => Some(parts),
            LinkedXml::WithAttributes { content, .. } => xml_parts(content),
            _ => None,
        }
    }
    for entry in entries.values() {
        if xml_parts(&entry.xml).is_some_and(|parts| {
            parts
                .iter()
                .any(|part| matches!(part.value, TextPatternValue::Optional { .. }))
        }) {
            return Err(diagnostic(
                "text_pattern_group",
                &entry.source,
                "Optional groups currently belong to the YAML representation",
            ));
        }
        if xml_parts(&entry.xml).is_none()
            && !matches!(entry.yaml, YamlRepresentation::TextPattern(_))
        {
            continue;
        }
        let LinkedType::Record(fields) = &entry.value else {
            unreachable!("validated text pattern shape")
        };
        for (index, field) in fields.iter().enumerate() {
            if let Some((id, _, _)) = field.value.as_reference()
                && matches!(entries[&id].xml, LinkedXml::TextSequence { .. })
            {
                let yaml_parts = match &entry.yaml {
                    YamlRepresentation::TextPattern(parts) => parts.as_slice(),
                    _ => &[],
                };
                if xml_parts(&entry.xml)
                    .unwrap_or_default()
                    .iter()
                    .chain(yaml_parts)
                    .any(|part| part.separator.is_some())
                {
                    return Err(diagnostic(
                        "text_pattern_type",
                        &field.source,
                        "A delimited cell cannot contain a sequence",
                    ));
                }
                if index + 1 != fields.len() {
                    return Err(diagnostic(
                        "text_sequence_head",
                        &field.source,
                        "Sequence must be the final field",
                    ));
                }
                super::text_sequence::head_layout(entry, &entries[&id], true)?;
                super::text_sequence::head_layout(entry, &entries[&id], false)?;
                continue;
            }
            if let Some((id, _, _)) = field.value.as_reference() {
                let target = &entries[&id];
                let mut content = &target.xml;
                while let LinkedXml::WithAttributes { content: inner, .. } = content {
                    content = inner;
                }
                if (matches!(target.value, LinkedType::Record(_))
                    && xml_parts(&target.xml).is_some()
                    && matches!(target.yaml, YamlRepresentation::TextPattern(_)))
                    || (matches!(target.value, LinkedType::Choice(_))
                        && matches!(content, LinkedXml::Choice { .. })
                        && matches!(target.yaml, YamlRepresentation::Choice { .. }))
                {
                    continue;
                }
            }
            let value = match &field.value {
                LinkedType::Reference(id) | LinkedType::BoundReference { entry: id, .. } => {
                    &entries[id].value
                }
                value => value,
            };
            if !matches!(value, LinkedType::Scalar(_) | LinkedType::Enum(_)) {
                return Err(diagnostic(
                    "text_pattern_type",
                    &field.source,
                    "Text pattern slots require scalar values",
                ));
            }
        }
    }
    Ok(())
}
