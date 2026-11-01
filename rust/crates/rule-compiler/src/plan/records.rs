//! Partition by physical XML ownership, never by semantic dependencies.
use super::*;

pub(crate) fn parts(
    entry: &LinkedEntry,
    program: &Program,
    captures: &[u32],
) -> Result<Vec<LinkedEntry>, Diagnostic> {
    let record = RecordPlan::prepare(entry, program)?;
    let mut result: Vec<LinkedEntry> = Vec::new();
    for planned in &record.fields {
        let field = planned.field;
        let mapping = planned.xml;
        let property = planned.yaml;
        if mapping.is_some_and(|mapping| mapping.path.is_empty()) {
            return Err(unsupported(
                entry,
                "Composed properties require a rooted boundary",
            ));
        }
        let is_choice = |value: &LinkedType| {
            value.as_reference().is_some_and(|(id, _, _)| {
                program
                    .entries
                    .iter()
                    .find(|entry| entry.id == id)
                    .is_some_and(|entry| matches!(entry.value, LinkedType::Choice(_)))
            })
        };
        let group = if let Some(mapping) =
            mapping.filter(|mapping| mapping.attribute.is_some() && !is_choice(&field.value))
        {
            result.iter_mut().find(|part|
                matches!(&part.value, LinkedType::Record(fields) if fields.iter().all(|field| !is_choice(&field.value)))
                && matches!(&part.xml,LinkedXml::Record(fields) if fields.first().is_some_and(|field| field.attribute.is_some() && field.path==mapping.path)))
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
            if let Some(file) = entry
                .yaml_files
                .iter()
                .find(|file| file.field as usize == planned.id.0)
            {
                part.yaml_files.push(LinkedYamlFile {
                    field: fields.len() as u32,
                    path: file.path.clone(),
                });
            }
            fields.push(field.clone());
            xml.extend(mapping.cloned());
            yaml.extend(property.cloned());
            part.field_dependencies.push(Vec::new());
        } else {
            let mut child = entry.clone();
            child.contributions.clear();
            child.constraints.clear();
            child.presence.clear();
            child.yaml_files = entry
                .yaml_files
                .iter()
                .filter(|file| file.field as usize == planned.id.0)
                .map(|file| LinkedYamlFile {
                    field: 0,
                    path: file.path.clone(),
                })
                .collect();
            child.value = LinkedType::Record(vec![field.clone()]);
            child.xml = LinkedXml::Record(mapping.cloned().into_iter().collect());
            child.yaml = match &entry.yaml {
                YamlRepresentation::GroupedSequence(groups)
                    if groups.iter().any(|group| group.field == field.name) =>
                {
                    YamlRepresentation::Projection(field.name.clone())
                }
                YamlRepresentation::Projection(selected) if selected == &field.name => {
                    YamlRepresentation::Projection(field.name.clone())
                }
                _ => YamlRepresentation::Mapping(property.cloned().into_iter().collect()),
            };
            child.field_dependencies = vec![Vec::new()];
            result.push(child);
        }
    }
    let mut source_xml = &entry.xml;
    while let LinkedXml::WithAttributes { content, .. } = source_xml {
        source_xml = content;
    }
    if let LinkedXml::Record(source_mappings) = source_xml {
        for part in &mut result {
            if let LinkedXml::Record(mappings) = &mut part.xml {
                mappings.sort_by_key(|mapping| {
                    source_mappings
                        .iter()
                        .position(|source| source.field == mapping.field)
                        .unwrap_or(usize::MAX)
                });
            }
        }
    }
    super::contracts::distribute(entry, &mut result, captures)?;
    for part in &mut result {
        // Whole-record representations belong to the containing owner.
        part.shorthands.clear();
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

/// Order YAML storage parts by the declared YAML fields, independently of XML.
pub(crate) fn yaml_slots(entry: &LinkedEntry, parts: &[LinkedEntry]) -> Vec<usize> {
    if let Some(slot) = yaml_projection_slot(entry, parts) {
        return vec![slot];
    }
    let mut slots: Vec<_> = (0..parts.len()).collect();
    let YamlRepresentation::Mapping(mapping) = &entry.yaml else {
        return slots;
    };
    slots.sort_by_key(|slot| {
        let LinkedType::Record(fields) = &parts[*slot].value else {
            unreachable!()
        };
        mapping
            .iter()
            .position(|item| fields.iter().any(|field| field.name == item.field))
            .unwrap_or(usize::MAX)
    });
    slots
}

/// Order physical XML writers independently of semantic storage and YAML output.
pub(crate) fn xml_slots(entry: &LinkedEntry, parts: &[LinkedEntry]) -> Vec<usize> {
    let mut slots: Vec<_> = (0..parts.len()).collect();
    if !entry.xml_order_declared {
        // All writers below one XML container must run together. Otherwise a
        // later fragment reopens that container as a second sibling element.
        let mut branches: Vec<(Vec<ExpandedName>, ExpandedName, usize)> = Vec::new();
        let mut next_rank = 0;
        let keys = parts
            .iter()
            .map(|part| {
                let path = super::values::xml_fields(&part.xml)
                    .and_then(|fields| fields.first())
                    .map_or(&[][..], |field| field.path.as_slice());
                let mut key = Vec::with_capacity(path.len().max(1));
                for (depth, name) in path.iter().enumerate() {
                    let prefix = path[..depth].to_vec();
                    let rank = branches
                        .iter()
                        .find_map(|(seen_prefix, seen_name, rank)| {
                            (*seen_prefix == prefix && seen_name == name).then_some(*rank)
                        })
                        .unwrap_or_else(|| {
                            let rank = next_rank;
                            next_rank += 1;
                            branches.push((prefix, name.clone(), rank));
                            rank
                        });
                    key.push(rank);
                }
                // The writer at a container also needs a rank relative to its
                // descendants; a shorter key would always put it first.
                key.push(next_rank);
                next_rank += 1;
                key
            })
            .collect::<Vec<_>>();
        slots.sort_by(|left, right| keys[*left].cmp(&keys[*right]));
        return slots;
    }
    let Some(mapping) = super::values::xml_fields(&entry.xml) else {
        return slots;
    };
    slots.sort_by_key(|slot| {
        let Some(fields) = super::values::xml_fields(&parts[*slot].xml) else {
            return usize::MAX;
        };
        mapping
            .iter()
            .position(|item| fields.iter().any(|field| field.field == item.field))
            .unwrap_or(usize::MAX)
    });
    slots
}

pub(crate) fn yaml_projection_slot(entry: &LinkedEntry, parts: &[LinkedEntry]) -> Option<usize> {
    let YamlRepresentation::Projection(selected) = &entry.yaml else {
        return None;
    };
    Some(
        parts
            .iter()
            .position(|part| {
                matches!(&part.value, LinkedType::Record(fields) if fields.iter().any(|field| &field.name == selected))
            })
            .expect("linked YAML projection"),
    )
}
