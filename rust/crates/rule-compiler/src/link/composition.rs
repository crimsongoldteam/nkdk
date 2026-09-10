use super::*;

pub(super) fn instantiate(
    entry: &mut LinkedEntry,
    offset: u32,
    bindings: &[LinkedBinding],
    arguments: &[ScalarLiteral],
) -> Result<(), Diagnostic> {
    let substitution = Substitution {
        offset,
        bindings,
        arguments,
    };
    substitution.value(&mut entry.value)?;
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
    arguments: &'a [ScalarLiteral],
}
impl Substitution<'_> {
    fn value(&self, value: &mut LinkedType) -> Result<(), Diagnostic> {
        match value {
            LinkedType::BoundReference { bindings, .. } => {
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
                value.kind = LinkedExpressionKind::Literal(argument.clone());
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
