use super::*;

pub(super) fn instantiate(
    entry: &mut LinkedEntry,
    offset: u32,
    bindings: &[LinkedBinding],
    arguments: &[LinkedExpression],
) -> Result<(), Diagnostic> {
    let substitution = Substitution {
        offset,
        bindings,
        arguments,
    };
    substitution.value(&mut entry.value)?;
    substitution.xml(&mut entry.xml)?;
    for rule in &mut entry.presence {
        if let LinkedPresenceTarget::Field(index) = &mut rule.target {
            *index += offset;
        }
        for value in rule
            .xml_missing
            .iter_mut()
            .chain(&mut rule.yaml_missing)
            .chain(&mut rule.yaml_omit_when)
            .chain(
                rule.xml_empty
                    .iter_mut()
                    .chain(&mut rule.yaml_empty)
                    .map(|form| &mut form.denotes),
            )
        {
            substitution.expression(value)?;
        }
        for form in &mut rule.canonical {
            if let Some(when) = &mut form.when {
                substitution.expression(when)?;
            }
        }
    }
    for constraint in &mut entry.constraints {
        substitution.expression(&mut constraint.assertion)?;
        if let Some(when) = &mut constraint.when {
            substitution.expression(when)?;
        }
        if let Some(iteration) = &mut constraint.for_each {
            substitution.expression(&mut iteration.input)?;
        }
        if let LinkedDiagnosticTarget::Field(index) = &mut constraint.diagnostic.at {
            *index += offset;
        }
        for part in &mut constraint.diagnostic.message {
            if let LinkedMessagePart::Expression(value) = part {
                substitution.expression(value)?;
            }
        }
    }
    Ok(())
}

struct Substitution<'a> {
    offset: u32,
    bindings: &'a [LinkedBinding],
    arguments: &'a [LinkedExpression],
}
impl Substitution<'_> {
    fn xml(&self, xml: &mut LinkedXml) -> Result<(), Diagnostic> {
        match xml {
            LinkedXml::WithAttributes {
                attributes,
                content,
            } => {
                for attribute in attributes {
                    if let Some(when) = &mut attribute.when {
                        self.expression(when)?;
                    }
                }
                self.xml(content)?;
            }
            LinkedXml::ElementSequence { item, .. } => self.xml(item)?,
            _ => {}
        }
        Ok(())
    }

    fn value(&self, value: &mut LinkedType) -> Result<(), Diagnostic> {
        match value {
            LinkedType::BoundReference {
                bindings,
                arguments,
                ..
            } => {
                for argument in arguments {
                    self.expression(argument)?;
                }
                for binding in bindings {
                    self.expression(&mut binding.value)?;
                }
            }
            LinkedType::Sequence(item) | LinkedType::Optional(item) => self.value(item)?,
            LinkedType::Record(fields) => {
                for field in fields {
                    self.value(&mut field.value)?;
                }
            }
            _ => {}
        }
        Ok(())
    }
    fn expression(&self, value: &mut LinkedExpression) -> Result<(), Diagnostic> {
        match &mut value.kind {
            LinkedExpressionKind::Input(index) => {
                let binding = self
                    .bindings
                    .iter()
                    .find(|binding| binding.slot == *index)
                    .ok_or_else(|| {
                        diagnostic(
                            "missing_input_binding",
                            &value.source,
                            "Fragment input has no substitution",
                        )
                    })?;
                *value = binding.value.clone();
            }
            LinkedExpressionKind::Parameter(index) => {
                let argument = self.arguments.get(*index as usize).ok_or_else(|| {
                    diagnostic(
                        "missing_parameter_argument",
                        &value.source,
                        "Fragment parameter has no substitution",
                    )
                })?;
                *value = argument.clone();
            }
            LinkedExpressionKind::Field(index) => *index += self.offset,
            LinkedExpressionKind::Operation { arguments, .. } => {
                for argument in arguments {
                    self.expression(argument)?;
                }
            }
            LinkedExpressionKind::SelfValue => {
                let LinkedType::Record(fields) = &value.value_type else {
                    return Err(diagnostic(
                        "expression_type_mismatch",
                        &value.source,
                        "Fragment self must be a record",
                    ));
                };
                value.kind = LinkedExpressionKind::Operation {
                    operator: LinkedOperator::Record(
                        fields.iter().map(|field| field.name.clone()).collect(),
                    ),
                    arguments: fields
                        .iter()
                        .enumerate()
                        .map(|(index, field)| LinkedExpression {
                            kind: LinkedExpressionKind::Field(self.offset + index as u32),
                            value_type: field.value.clone(),
                            source: value.source.clone(),
                        })
                        .collect(),
                };
            }
            _ => {}
        }
        Ok(())
    }
}

pub(super) fn record_fields(xml: &mut LinkedXml) -> Option<&mut Vec<LinkedXmlField>> {
    match xml {
        LinkedXml::WithAttributes { content, .. } => record_fields(content),
        LinkedXml::Record(fields) => Some(fields),
        _ => None,
    }
}

pub(super) fn take_record(
    mut xml: LinkedXml,
) -> Option<(Vec<LinkedXmlField>, Vec<LinkedXmlAttribute>)> {
    let mut result = vec![];
    while let LinkedXml::WithAttributes {
        attributes,
        content,
    } = xml
    {
        result.extend(attributes);
        xml = *content;
    }
    if let LinkedXml::Record(fields) = xml {
        Some((fields, result))
    } else {
        None
    }
}
