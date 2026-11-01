//! Resolve a referenced item as a complete contract, without flattening its fields.
use super::*;

/// Record-choice collection adapters require a mapping in every alternative.
pub(crate) fn record_choice(entry: &LinkedEntry, program: &Program) -> bool {
    let LinkedType::Choice(variants) = &entry.value else {
        return false;
    };
    !variants.is_empty()
        && variants.iter().all(|variant| {
            variant
                .value
                .as_reference()
                .and_then(|(id, _, _)| program.entries.iter().find(|entry| entry.id == id))
                .is_some_and(|entry| {
                    matches!(entry.value, LinkedType::Record(_))
                        && matches!(entry.yaml, YamlRepresentation::Mapping(_))
                })
        })
}

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
    if let LinkedType::Choice(variants) = &entry.value
        && (matches!(collection.yaml, YamlRepresentation::RecordMapping { .. })
            || record_choice(&entry, program))
    {
        let mut key_shape = None;
        for variant in variants {
            let record_variant = variant
                .value
                .as_reference()
                .and_then(|(id, _, _)| program.entries.iter().find(|entry| entry.id == id));
            if !record_variant.is_some_and(|entry| matches!(entry.value, LinkedType::Record(_))) {
                return Err(diagnostic(
                    "expression_type_mismatch",
                    &variant.source,
                    "Collection choice requires directly declared record variants",
                ));
            }
            let mut selected = collection.clone();
            selected.value = LinkedType::Sequence(Box::new(variant.value.clone()));
            let row = resolve(&selected, program)?.ok_or_else(|| {
                diagnostic(
                    "incomplete_item_contract",
                    &collection.source,
                    "Choice item requires declared record variants",
                )
            })?;
            let LinkedType::Record(_) = row.value else {
                return Err(diagnostic(
                    "expression_type_mismatch",
                    &collection.source,
                    "Choice item requires record variants",
                ));
            };
            if let YamlRepresentation::RecordMapping { key, .. } = &collection.yaml {
                let YamlRepresentation::Mapping(fields) = &row.yaml else {
                    unreachable!()
                };
                let yaml = fields
                    .iter()
                    .find(|field| &field.field == key)
                    .expect("validated key")
                    .key
                    .clone();
                let xml = crate::plan::xml_fields(&row.xml)
                    .and_then(|fields| fields.iter().find(|field| &field.field == key))
                    .map(|field| (field.path.clone(), field.attribute.clone()));
                let shape = (yaml, xml);
                if key_shape
                    .as_ref()
                    .is_some_and(|previous| previous != &shape)
                {
                    return Err(diagnostic(
                        "incomplete_item_contract",
                        &collection.source,
                        "Record variants must expose the same XML and YAML key boundary",
                    ));
                }
                key_shape = Some(shape);
            }
        }
        return Ok(Some(entry));
    }
    if let YamlRepresentation::RecordMapping {
        key,
        value,
        group_key,
        item_inputs,
        omit_empty_for,
        empty_tag,
        ..
    } = &collection.yaml
    {
        let row_inputs = &program
            .entries
            .iter()
            .find(|candidate| candidate.id == id)
            .expect("linked row")
            .inputs;
        let collection_inputs = &program
            .entries
            .iter()
            .find(|candidate| candidate.id == collection.id)
            .expect("linked collection")
            .inputs;
        for item_input in item_inputs {
            let Some(target) = row_inputs
                .iter()
                .find(|input| input.name == item_input.target)
            else {
                return Err(diagnostic(
                    "unknown_input",
                    &collection.source,
                    "Record mapping item input is not declared by its row",
                ));
            };
            if target.value != LinkedType::Scalar(ScalarType::Text) {
                return Err(diagnostic(
                    "expression_type_mismatch",
                    &target.source,
                    "Record mapping item input must be text",
                ));
            }
            if let RecordItemInputSource::Lookup {
                input,
                default_input,
            } = &item_input.source
            {
                let index_type = LinkedType::Index {
                    key: Box::new(LinkedType::Scalar(ScalarType::Text)),
                    value: Box::new(LinkedType::Scalar(ScalarType::Text)),
                };
                for (name, expected) in [
                    (input, &index_type),
                    (default_input, &LinkedType::Scalar(ScalarType::Text)),
                ] {
                    let Some(found) = collection_inputs.iter().find(|field| field.name == *name)
                    else {
                        return Err(diagnostic(
                            "unknown_input",
                            &collection.source,
                            "Record mapping lookup input is not declared",
                        ));
                    };
                    if &found.value != expected {
                        return Err(diagnostic(
                            "expression_type_mismatch",
                            &found.source,
                            "Record mapping lookup input has the wrong type",
                        ));
                    }
                }
            }
        }
        if empty_tag.is_some() != omit_empty_for.is_some() {
            return Err(diagnostic(
                "incomplete_item_contract",
                &collection.source,
                "A sparse record mapping requires both omitEmptyFor and emptyTag",
            ));
        }
        if empty_tag.as_ref().is_some_and(|tag| {
            tag.is_empty()
                || tag.chars().any(|character| {
                    character.is_whitespace() || matches!(character, '!' | ':' | '{' | '}')
                })
        }) {
            return Err(diagnostic(
                "invalid_tag",
                &collection.source,
                "emptyTag must be a nonempty YAML tag suffix",
            ));
        }
        if let Some(table) = match &collection.yaml {
            YamlRepresentation::RecordMapping { key_table, .. } => key_table.as_ref(),
            _ => None,
        } {
            let Some(input) = collection
                .inputs
                .iter()
                .find(|input| input.name == table.input)
            else {
                // Bound collection specializations have already substituted
                // and cleared their own input list. The containing generated
                // operation validates the resolved slot after composition.
                return Ok(Some(entry));
            };
            let LinkedType::Sequence(item) = &input.value else {
                return Err(diagnostic(
                    "expression_type_mismatch",
                    &input.source,
                    "Record mapping key table must be a record sequence",
                ));
            };
            let LinkedType::Record(profile_fields) = item.as_ref() else {
                return Err(diagnostic(
                    "expression_type_mismatch",
                    &input.source,
                    "Record mapping key table must be a record sequence",
                ));
            };
            for name in [&table.internal, &table.external] {
                if !profile_fields.iter().any(|field| {
                    field.name == *name && field.value == LinkedType::Scalar(ScalarType::Text)
                }) {
                    return Err(diagnostic(
                        "expression_type_mismatch",
                        &input.source,
                        "Record mapping key table fields must be text",
                    ));
                }
            }
            if table.internal == table.external {
                return Err(diagnostic(
                    "expression_type_mismatch",
                    &input.source,
                    "Record mapping key table fields must be distinct",
                ));
            }
        }
        let LinkedType::Record(fields) = &entry.value else {
            return Err(diagnostic(
                "expression_type_mismatch",
                &collection.source,
                "Record mapping requires record items",
            ));
        };
        if let Some(group) = group_key {
            if value.is_none()
                || Some(group) == value.as_ref()
                || group == key
                || fields.len() != 3
                || !fields.iter().any(|field| &field.name == group)
                || !fields
                    .iter()
                    .any(|field| Some(&field.name) == value.as_ref())
            {
                return Err(diagnostic(
                    "incomplete_item_contract",
                    &collection.source,
                    "A grouped mapping requires distinct key/groupKey/value fields and no additional row fields",
                ));
            }
            let field = fields
                .iter()
                .find(|field| &field.name == group)
                .expect("checked group field");
            let group_type = if let Some((id, _, _)) = field.value.as_reference() {
                &program
                    .entries
                    .iter()
                    .find(|entry| entry.id == id)
                    .expect("linked group value")
                    .value
            } else {
                &field.value
            };
            if !matches!(
                group_type,
                LinkedType::Scalar(ScalarType::Text) | LinkedType::Enum(_)
            ) || !matches!(&entry.yaml,YamlRepresentation::Mapping(fields) if fields.iter().any(|field|&field.field==group))
            {
                return Err(diagnostic(
                    "expression_type_mismatch",
                    &collection.source,
                    "groupKey needs a text or enumeration YAML field",
                ));
            }
            let projected = fields
                .iter()
                .find(|field| Some(&field.name) == value.as_ref())
                .expect("checked value field");
            let projected_type = if let Some((id, _, _)) = projected.value.as_reference() {
                &program
                    .entries
                    .iter()
                    .find(|entry| entry.id == id)
                    .expect("linked projected value")
                    .value
            } else {
                &projected.value
            };
            // An untagged mapping payload is indistinguishable from the
            // secondary-key mapping when groupKey is absent. Reject that
            // declaration rather than silently choose a meaning at runtime.
            if !matches!(projected_type, LinkedType::Scalar(_) | LinkedType::Enum(_)) {
                return Err(diagnostic(
                    "expression_type_mismatch",
                    &collection.source,
                    "groupKey currently requires a scalar projected value",
                ));
            }
        }
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
                            && matches!(
                                e.yaml,
                                YamlRepresentation::Text
                                    | YamlRepresentation::TextTable(TextTable::Resolved(_))
                            )
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
        if let YamlRepresentation::Mapping(fields) = &mut entry.yaml {
            if !fields.iter().any(|field| &field.field == key) {
                if item_inputs
                    .iter()
                    .any(|input| matches!(input.source, RecordItemInputSource::RowKey))
                {
                    fields.insert(
                        0,
                        YamlField {
                            field: key.clone(),
                            key: key.clone(),
                            file: None,
                            source: collection.source.clone(),
                        },
                    );
                } else {
                    return Err(diagnostic(
                        "unknown_representation_field",
                        &collection.source,
                        "Record mapping key needs a YAML field",
                    ));
                }
            }
        } else {
            return Err(diagnostic(
                "unknown_representation_field",
                &collection.source,
                "Record mapping key needs a YAML mapping",
            ));
        }
        if let Some(value) = value
            && (!fields.iter().any(|field| &field.name == value)
                || !matches!(&entry.yaml, YamlRepresentation::Mapping(fields) if fields.iter().any(|field| &field.field==value)))
        {
            return Err(diagnostic(
                "unknown_representation_field",
                &collection.source,
                "Record mapping value needs a YAML field",
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

/// Rebind a referenced value after its collection row is placed in a caller.
/// Scalar profiles may have been specialized before that placement, so their
/// captured input expressions still address the row's original slots.
pub(crate) fn rebind_input_expressions(
    entry: &mut LinkedEntry,
    bindings: &[LinkedBinding],
) -> Result<(), Diagnostic> {
    composition::instantiate_value(entry, bindings, &[])
}
