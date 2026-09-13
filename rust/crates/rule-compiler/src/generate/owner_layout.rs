use super::*;

pub(super) fn parts(
    entry: &LinkedEntry,
    program: &Program,
) -> Result<Vec<LinkedEntry>, Diagnostic> {
    let (LinkedType::Record(fields), LinkedXml::Record(xml), YamlRepresentation::Mapping(yaml)) = (
        &entry.value,
        super::attributes::content(&entry.xml).0,
        &entry.yaml,
    ) else {
        return Err(unsupported(
            entry,
            "Composed owner requires record mappings",
        ));
    };
    let groups = constraint_groups(entry, fields, xml, program)?;
    let mut result: Vec<LinkedEntry> = Vec::new();
    for (slot, field) in fields.iter().enumerate() {
        let mapping = xml
            .iter()
            .find(|mapping| mapping.field == field.name)
            .expect("linked XML field");
        let property = yaml.iter().find(|mapping| mapping.field == field.name);
        if mapping.path.is_empty()
            || (mapping.file.is_none() && mapping.attribute.is_none() && mapping.path.len() < 2)
        {
            return Err(unsupported(
                entry,
                "Composed properties require a rooted boundary",
            ));
        }
        let group = if groups[slot] != slot {
            result.iter_mut().find(|part|matches!(&part.value,LinkedType::Record(part_fields) if part_fields[0].name==fields[groups[slot]].name))
        } else if mapping.attribute.is_some() {
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
    super::owner_contracts::distribute(entry, &mut result)?;
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
                            .expect("grouped dependency") as u32
                    })
                    .collect()
            })
            .collect();
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

fn constraint_groups(
    entry: &LinkedEntry,
    fields: &[LinkedField],
    xml: &[LinkedXmlField],
    program: &Program,
) -> Result<Vec<usize>, Diagnostic> {
    fn scalar_type(value: &LinkedType, program: &Program) -> bool {
        match value {
            LinkedType::Scalar(_) | LinkedType::Enum(_) => true,
            LinkedType::Reference(id) => program
                .entries
                .iter()
                .find(|entry| entry.id == *id)
                .is_some_and(|entry| {
                    matches!(entry.value, LinkedType::Scalar(_) | LinkedType::Enum(_))
                }),
            _ => false,
        }
    }
    fn collect(
        value: &LinkedExpression,
        slots: &mut BTreeSet<usize>,
        scalar: &mut bool,
        program: &Program,
    ) {
        match &value.kind {
            LinkedExpressionKind::Field(slot) => {
                slots.insert(*slot as usize);
                *scalar &= scalar_type(&value.value_type, program);
            }
            LinkedExpressionKind::Operation { arguments, .. } => {
                for value in arguments {
                    collect(value, slots, scalar, program);
                }
            }
            _ => (),
        }
    }
    let mut groups: Vec<_> = (0..fields.len()).collect();
    for (slot, dependencies) in entry.field_dependencies.iter().enumerate() {
        let merged: BTreeSet<_> = std::iter::once(slot)
            .chain(dependencies.iter().map(|slot| *slot as usize))
            .map(|slot| groups[slot])
            .collect();
        if merged.len() > 1 {
            if std::iter::once(slot)
                .chain(dependencies.iter().map(|slot| *slot as usize))
                .any(|slot| !scalar_type(&fields[slot].value, program))
            {
                return Err(unsupported(
                    entry,
                    "Dependent defaults currently require scalar fields",
                ));
            }
            let first = *merged.first().unwrap();
            for group in &mut groups {
                if merged.contains(group) {
                    *group = first;
                }
            }
        }
    }
    for rule in &entry.constraints {
        let mut slots = BTreeSet::new();
        let mut scalar = true;
        collect(&rule.assertion, &mut slots, &mut scalar, program);
        if let Some(value) = &rule.when {
            collect(value, &mut slots, &mut scalar, program);
        }
        if let Some(iteration) = &rule.for_each {
            collect(&iteration.input, &mut slots, &mut scalar, program);
        }
        for message in &rule.diagnostic.message {
            if let LinkedMessagePart::Expression(value) = message {
                collect(value, &mut slots, &mut scalar, program);
            }
        }
        if let LinkedDiagnosticTarget::Field(slot) = rule.diagnostic.at {
            slots.insert(slot as usize);
        }
        if slots.len() < 2 {
            continue;
        }
        if !scalar {
            return Err(unsupported(
                entry,
                "Cross-property constraints currently require scalar fields",
            ));
        }
        let merged: BTreeSet<_> = slots.iter().map(|slot| groups[*slot]).collect();
        let first = *merged.first().unwrap();
        for group in &mut groups {
            if merged.contains(group) {
                *group = first;
            }
        }
    }
    for first in 0..fields.len() {
        let members: Vec<_> = groups
            .iter()
            .enumerate()
            .filter_map(|(slot, group)| (*group == first).then_some(slot))
            .collect();
        if members.len() < 2 {
            continue;
        }
        if members.windows(2).any(|pair| pair[1] != pair[0] + 1) {
            return Err(unsupported(
                entry,
                "Grouped constraints require adjacent scalar properties",
            ));
        }
        let mappings: Vec<_> = members
            .iter()
            .map(|slot| {
                xml.iter()
                    .find(|mapping| mapping.field == fields[*slot].name)
                    .expect("linked field")
            })
            .collect();
        let first = mappings[0];
        let parent = &first.path[..if first.attribute.is_some() {
            first.path.len()
        } else {
            first.path.len().saturating_sub(1)
        }];
        if mappings.iter().any(|mapping| {
            let len = if mapping.attribute.is_some() {
                mapping.path.len()
            } else {
                mapping.path.len().saturating_sub(1)
            };
            mapping.path.is_empty() || &mapping.path[..len] != parent
        }) {
            return Err(unsupported(
                entry,
                "Grouped scalar properties require sibling XML elements",
            ));
        }
    }
    Ok(groups)
}
