use super::*;

pub(super) fn validate(modules: &[Module], program: &Program) -> Result<(), Diagnostic> {
    for module in modules {
        let entry = program
            .entries
            .iter()
            .find(|entry| entry.name == module.id)
            .expect("linked module");
        for relation in &module.state_relations {
            let mut xml = &entry.xml;
            while let LinkedXml::WithAttributes { content, .. } = xml {
                xml = content;
            }
            let xml_sources = matches!(xml, LinkedXml::Record(fields)
            if !fields.iter().any(|field| field.field == relation.field)
            && relation.sources.iter().all(|source| {
                let physical = fields.iter().any(|field| &field.field == source);
                physical != relation.computed_sources.contains(source)
            }));
            let yaml_state = match &entry.yaml {
                YamlRepresentation::Mapping(fields) => {
                    fields.iter().any(|field| field.field == relation.field)
                        && !fields
                            .iter()
                            .any(|field| relation.sources.contains(&field.field))
                }
                YamlRepresentation::Projection(field) => field == &relation.field,
                _ => false,
            };
            if !xml_sources || !yaml_state {
                return Err(diagnostic(
                    "conflicting_state_projection",
                    &relation.source,
                    "The relation derives a YAML state from XML-only sources",
                ));
            }
            let LinkedType::Record(fields) = &entry.value else {
                return Err(diagnostic(
                    "invalid_state_relation_target",
                    &relation.source,
                    "State relation requires a record",
                ));
            };
            let Some(field) = fields.iter().find(|field| field.name == relation.field) else {
                return Err(diagnostic(
                    "invalid_state_relation_target",
                    &relation.source,
                    "State relation requires a declared field",
                ));
            };
            let mut value = &field.value;
            while let Some((id, _, _)) = value.as_reference() {
                value = &program
                    .entries
                    .iter()
                    .find(|entry| entry.id == id)
                    .expect("linked reference")
                    .value;
            }
            let LinkedType::Enum(variants) = value else {
                return Err(diagnostic(
                    "invalid_state_relation_target",
                    &relation.source,
                    "State relation requires a finite enum",
                ));
            };
            let domain: BTreeSet<_> = variants.iter().map(|value| value.value.as_str()).collect();
            let table: BTreeSet<_> = relation.values.iter().map(String::as_str).collect();
            if domain != table {
                return Err(diagnostic(
                    "incomplete_state_relation_domain",
                    &relation.source,
                    "State relation must cover the complete enum domain",
                ));
            }
        }
    }
    Ok(())
}
