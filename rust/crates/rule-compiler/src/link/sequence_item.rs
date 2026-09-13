//! Resolve a referenced item as a complete contract, without flattening its fields.
use super::*;

pub(crate) fn resolve(
    collection: &LinkedEntry,
    program: &Program,
) -> Result<Option<LinkedEntry>, Diagnostic> {
    let LinkedType::Sequence(item) = &collection.value else {
        return Ok(None);
    };
    let Some((id, bindings, arguments)) = item.as_reference() else {
        return Ok(None);
    };
    let mut entry = program
        .entries
        .iter()
        .find(|entry| entry.id == id)
        .expect("linked item")
        .clone();
    instantiate(&mut entry, bindings, arguments)?;
    if let YamlRepresentation::RecordMapping { key } = &collection.yaml {
        let LinkedType::Record(fields) = &entry.value else {
            return Err(diagnostic(
                "expression_type_mismatch",
                &collection.source,
                "Record mapping requires record items",
            ));
        };
        let Some(field) = fields.iter().find(|field| &field.name == key) else {
            return Err(diagnostic(
                "unknown_representation_field",
                &collection.source,
                "Record mapping key is absent",
            ));
        };
        let text =
            match &field.value {
                LinkedType::Scalar(ScalarType::Text) => true,
                LinkedType::Reference(id) => program
                    .entries
                    .iter()
                    .find(|e| e.id == *id)
                    .is_some_and(|e| {
                        e.value == LinkedType::Scalar(ScalarType::Text)
                            && e.yaml == YamlRepresentation::Text
                    }),
                _ => false,
            };
        if !text {
            return Err(diagnostic(
                "expression_type_mismatch",
                &collection.source,
                "Record mapping key must be text",
            ));
        }
        if !matches!(&entry.yaml, YamlRepresentation::Mapping(fields) if fields.iter().any(|field| &field.field==key))
        {
            return Err(diagnostic(
                "unknown_representation_field",
                &collection.source,
                "Record mapping key needs a YAML field",
            ));
        }
    }

    Ok(Some(entry))
}

/// Inheritance describes one bidirectional contract, never only half of it.
pub(super) fn validate(entry: &LinkedEntry) -> Result<(), Diagnostic> {
    fn visit(
        xml: &LinkedXml,
        yaml: &YamlRepresentation,
        source: &SourceLocation,
    ) -> Result<(), Diagnostic> {
        let xml = match xml {
            LinkedXml::WithAttributes { content, .. } => return visit(content, yaml, source),
            other => other,
        };
        if matches!(yaml, YamlRepresentation::RecordMapping { .. })
            && !matches!(xml,LinkedXml::ElementSequence {item,..} if **item==LinkedXml::Declared)
        {
            return Err(diagnostic(
                "incomplete_item_contract",
                source,
                "A record mapping inherits the complete XML item declaration",
            ));
        }
        if let (
            LinkedXml::ElementSequence { item: xml, .. },
            YamlRepresentation::Sequence { item: yaml, .. },
        ) = (xml, yaml)
        {
            if matches!(xml.as_ref(), LinkedXml::Declared)
                != matches!(yaml.as_ref(), YamlRepresentation::Declared)
            {
                return Err(diagnostic(
                    "incomplete_item_contract",
                    source,
                    "A referenced item inherits both XML and YAML representations; omit item on both sides",
                ));
            }
            visit(xml, yaml, source)?;
        }
        Ok(())
    }
    visit(&entry.xml, &entry.yaml, &entry.source)
}

pub(crate) fn instantiate(
    entry: &mut LinkedEntry,
    bindings: &[LinkedBinding],
    arguments: &[LinkedExpression],
) -> Result<(), Diagnostic> {
    if !bindings.is_empty() || !arguments.is_empty() {
        composition::instantiate_value(entry, bindings, arguments)?;
        entry.inputs.clear();
        entry.parameters.clear();
    }
    Ok(())
}
