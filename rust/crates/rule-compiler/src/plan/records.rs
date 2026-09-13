//! Partition by physical XML ownership, never by semantic dependencies.
use super::*;

pub(crate) fn parts(entry: &LinkedEntry) -> Result<Vec<LinkedEntry>, Diagnostic> {
    let record = RecordPlan::prepare(entry)?;
    let mut result: Vec<LinkedEntry> = Vec::new();
    for planned in &record.fields {
        let field = planned.field;
        let mapping = planned.xml.ok_or_else(|| {
            unsupported(entry, "An XML-free field needs a storage-only placement")
        })?;
        let property = planned.yaml;
        if mapping.path.is_empty()
            || (mapping.file.is_none() && mapping.attribute.is_none() && mapping.path.len() < 2)
        {
            return Err(unsupported(
                entry,
                "Composed properties require a rooted boundary",
            ));
        }
        let group = if mapping.attribute.is_some() {
            result.iter_mut().find(|part|matches!(&part.xml,LinkedXml::Record(fields) if fields[0].attribute.is_some() && fields[0].path==mapping.path))
        } else {
            None
        };
        if let Some(part) = group {
            let (
                LinkedType::Record(fields),
                LinkedXml::Record(xml),
                YamlRepresentation::Mapping(yaml),
            ) = (&mut part.value, &mut part.xml, &mut part.yaml)
            else {
                unreachable!()
            };
            fields.push(field.clone());
            xml.push(mapping.clone());
            yaml.extend(property.cloned());
            part.field_dependencies.push(Vec::new());
        } else {
            let mut child = entry.clone();
            child.contributions.clear();
            child.constraints.clear();
            child.presence.clear();
            child.value = LinkedType::Record(vec![field.clone()]);
            child.xml = LinkedXml::Record(vec![mapping.clone()]);
            child.yaml = YamlRepresentation::Mapping(property.cloned().into_iter().collect());
            child.field_dependencies = vec![Vec::new()];
            result.push(child);
        }
    }
    super::contracts::distribute(entry, &mut result)?;
    for part in &mut result {
        let LinkedType::Record(fields) = &part.value else {
            unreachable!()
        };
        part.field_dependencies = fields
            .iter()
            .map(|field| {
                let original = fields_index(entry, &field.name);
                entry.field_dependencies[original]
                    .iter()
                    .map(|dependency| {
                        let LinkedType::Record(owner_fields) = &entry.value else {
                            unreachable!()
                        };
                        fields
                            .iter()
                            .position(|field| field.name == owner_fields[*dependency as usize].name)
                            .map(|slot| slot as u32)
                            .ok_or_else(|| {
                                unsupported(
                                    entry,
                                    "A dependency has not been bound in its field scope",
                                )
                            })
                    })
                    .collect::<Result<Vec<_>, _>>()
            })
            .collect::<Result<Vec<_>, _>>()?;
    }

    Ok(result)
}

fn fields_index(entry: &LinkedEntry, name: &str) -> usize {
    let LinkedType::Record(fields) = &entry.value else {
        unreachable!()
    };
    fields
        .iter()
        .position(|field| field.name == name)
        .expect("owner field")
}

/// A container is shared when another storage unit owns a route below it.
pub(crate) fn shares_container(parts: &[LinkedEntry], slot: usize, path: &[ExpandedName]) -> bool {
    parts.iter().enumerate().any(|(other, entry)| {
        other != slot
            && super::values::xml_fields(&entry.xml)
                .is_some_and(|fields| fields.iter().any(|field| field.path.starts_with(path)))
    })
}
