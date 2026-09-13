use super::*;

pub(crate) fn layout(
    fields: &[LinkedField],
    parts: &[TextPatternPart],
    separator: &str,
    source: &SourceLocation,
) -> Result<Vec<usize>, Diagnostic> {
    let invalid = || {
        diagnostic(
            "text_sequence_layout",
            source,
            "Sequence item requires fields separated only by its nonempty separator",
        )
    };
    if separator.is_empty() || fields.is_empty() || parts.len() != fields.len() * 2 - 1 {
        return Err(invalid());
    }
    text_pattern::fields(fields, parts, source)?;
    let mut order = Vec::new();
    for (index, part) in parts.iter().enumerate() {
        if part
            .separator
            .as_deref()
            .is_some_and(|cell| cell != separator)
        {
            return Err(invalid());
        }
        match &part.value {
            TextPatternValue::Field(name) if index % 2 == 0 => order.push(
                fields
                    .iter()
                    .position(|field| field.name == *name)
                    .expect("checked field"),
            ),
            TextPatternValue::Literal(text) if index % 2 == 1 && text == separator => (),
            _ => return Err(invalid()),
        }
    }
    Ok(order)
}

pub(super) fn types(entries: &BTreeMap<u32, LinkedEntry>) -> Result<(), Diagnostic> {
    for entry in entries.values() {
        if !matches!(entry.xml, LinkedXml::TextSequence { .. })
            && !matches!(entry.yaml, YamlRepresentation::TextSequence { .. })
        {
            continue;
        }
        let invalid = || {
            diagnostic(
                "text_sequence_shape",
                &entry.source,
                "Text sequence requires paired representations and an imported plain text record",
            )
        };
        let (
            LinkedType::Sequence(item),
            LinkedXml::TextSequence {
                separator: xml_separator,
            },
            YamlRepresentation::TextSequence {
                separator: yaml_separator,
            },
        ) = (&entry.value, &entry.xml, &entry.yaml)
        else {
            return Err(invalid());
        };
        let LinkedType::Reference(id) = item.as_ref() else {
            return Err(invalid());
        };
        let target = &entries[id];
        if !plain(target) {
            return Err(invalid());
        }
        let variants = if let LinkedType::Choice(fields) = &target.value {
            if !matches!(target.xml, LinkedXml::Choice)
                || !matches!(target.yaml, YamlRepresentation::Choice)
            {
                return Err(invalid());
            }
            fields
                .iter()
                .map(|field| match &field.value {
                    LinkedType::Reference(id) => Ok(&entries[id]),
                    _ => Err(invalid()),
                })
                .collect::<Result<Vec<_>, _>>()?
        } else {
            vec![target]
        };
        let mut width = None;
        for variant in variants {
            let (xml, _) = item_layout(variant, xml_separator, yaml_separator)?;
            if width.is_some_and(|width| width != xml.len()) {
                return Err(invalid());
            }
            width = Some(xml.len());
        }
    }
    Ok(())
}

fn plain(entry: &LinkedEntry) -> bool {
    entry.inputs.is_empty()
        && entry.parameters.is_empty()
        && entry.presence.is_empty()
        && entry.shorthands.is_empty()
        && entry.contributions.is_empty()
        && entry.normalization.is_none()
        && entry.text_transforms.is_empty()
}

pub(crate) fn item_layout(
    entry: &LinkedEntry,
    xml_separator: &str,
    yaml_separator: &str,
) -> Result<(Vec<usize>, Vec<usize>), Diagnostic> {
    let (
        LinkedType::Record(fields),
        LinkedXml::TextPattern(xml),
        YamlRepresentation::TextPattern(yaml),
    ) = (&entry.value, &entry.xml, &entry.yaml)
    else {
        return Err(diagnostic(
            "text_sequence_shape",
            &entry.source,
            "Sequence variants require plain text records",
        ));
    };
    if !plain(entry) {
        return Err(diagnostic(
            "text_sequence_shape",
            &entry.source,
            "Sequence variants require specialized plain contracts",
        ));
    }
    Ok((
        layout(fields, xml, xml_separator, &entry.source)?,
        layout(fields, yaml, yaml_separator, &entry.source)?,
    ))
}

/// A final imported sequence can frame a fixed set of scalar cells.
pub(crate) fn tail_id(entry: &LinkedEntry) -> Option<u32> {
    let LinkedType::Record(fields) = &entry.value else {
        return None;
    };
    match fields.last()?.value {
        LinkedType::Reference(id) => Some(id),
        _ => None,
    }
}

type HeadLayout<'a> = (&'a [LinkedField], &'a [TextPatternPart], Vec<usize>);

pub(crate) fn head_layout<'a>(
    entry: &'a LinkedEntry,
    tail: &LinkedEntry,
    xml_side: bool,
) -> Result<HeadLayout<'a>, Diagnostic> {
    let invalid = || {
        diagnostic(
            "text_sequence_head",
            &entry.source,
            "A text sequence tail must be last, with a fixed scalar head and matching separators",
        )
    };
    let LinkedType::Record(fields) = &entry.value else {
        return Err(invalid());
    };
    let (LinkedXml::TextPattern(xml), YamlRepresentation::TextPattern(yaml)) =
        (&entry.xml, &entry.yaml)
    else {
        return Err(invalid());
    };
    let (
        LinkedXml::TextSequence { separator: xs },
        YamlRepresentation::TextSequence { separator: ys },
    ) = (&tail.xml, &tail.yaml)
    else {
        return Err(invalid());
    };
    let parts = if xml_side { xml } else { yaml };
    let separator = if xml_side { xs } else { ys };
    if fields.len() < 2 || parts.len() < 3 {
        return Err(invalid());
    }
    let last = fields.last().unwrap();
    if !matches!(&parts[parts.len()-1].value, TextPatternValue::Field(name) if name == &last.name)
        || !matches!(&parts[parts.len()-2].value, TextPatternValue::Literal(text) if text == separator)
    {
        return Err(invalid());
    }
    let head = &fields[..fields.len() - 1];
    let parts = &parts[..parts.len() - 2];
    let order = layout(head, parts, separator, &entry.source)?;
    Ok((head, parts, order))
}
