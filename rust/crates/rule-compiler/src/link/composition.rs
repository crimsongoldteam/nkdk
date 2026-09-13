use super::*;

pub(super) fn instantiate(
    entry: &mut LinkedEntry,
    offset: u32,
    bindings: &[LinkedBinding],
    arguments: &[LinkedExpression],
) -> Result<(), Diagnostic> {
    instantiate_with(
        entry,
        Substitution {
            offset,
            bindings,
            arguments,
            project_self: true,
        },
    )
}

/// Bind a value without projecting its self into a containing record.
pub(super) fn instantiate_value(
    entry: &mut LinkedEntry,
    bindings: &[LinkedBinding],
    arguments: &[LinkedExpression],
) -> Result<(), Diagnostic> {
    instantiate_with(
        entry,
        Substitution {
            offset: 0,
            bindings,
            arguments,
            project_self: false,
        },
    )
}

fn instantiate_with(
    entry: &mut LinkedEntry,
    substitution: Substitution<'_>,
) -> Result<(), Diagnostic> {
    let offset = substitution.offset;
    substitution.value(&mut entry.value)?;
    substitution.xml(&mut entry.xml)?;
    for rule in &mut entry.presence {
        if let LinkedPresenceTarget::Field(index) = &mut rule.target {
            *index += offset;
        }
        for value in rule.expressions_mut() {
            substitution.expression(value)?;
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
    for group in &mut entry.resources {
        if let Some(iteration) = &mut group.for_each {
            substitution.expression(&mut iteration.input)?;
            resources::validate_sequence(&iteration.input)?;
        }

        for route in &mut group.alternatives {
            substitution.expression(&mut route.xml)?;
            substitution.expression(&mut route.yaml)?;
            resources::validate(&route.xml)?;
            resources::validate(&route.yaml)?;
        }
    }
    for contribution in &mut entry.contributions {
        if let Some(iteration) = &mut contribution.for_each {
            substitution.expression(&mut iteration.input)?;
        }
        substitution.expression(&mut contribution.key)?;
        substitution.expression(&mut contribution.value)?;
    }
    Ok(())
}

struct Substitution<'a> {
    offset: u32,
    project_self: bool,
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
            LinkedType::Record(fields) | LinkedType::Choice(fields) => {
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
            LinkedExpressionKind::SelfValue if self.project_self => {
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
