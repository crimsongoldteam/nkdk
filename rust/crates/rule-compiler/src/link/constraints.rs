use super::*;

pub(super) fn resolve_constraints(
    module: &Module,
    modules: &BTreeMap<&str, &Module>,
    ids: &BTreeMap<&str, u32>,
) -> Result<Vec<LinkedConstraint>, Diagnostic> {
    let mut names = BTreeMap::new();
    module
        .constraints
        .iter()
        .map(|constraint| {
            if let Some(first) = names.insert(&constraint.id, &constraint.source) {
                let mut error = diagnostic(
                    "duplicate_constraint",
                    &constraint.source,
                    "Constraint id is repeated",
                );
                error.related.push(first.clone());
                return Err(error);
            }
            let (for_each, scope) =
                expressions::iteration_scope(module, constraint.for_each.as_ref(), modules, ids)?;
            let resolve = |expression: &Expression| {
                expressions::resolve_expression_in(module, expression, modules, ids, &scope)
            };
            let assertion = resolve(&constraint.assertion)?;
            expressions::require_boolean(&assertion)?;
            let when = constraint
                .when
                .as_ref()
                .map(|expression| {
                    let value = resolve(expression)?;
                    expressions::require_boolean(&value)?;
                    Ok(value)
                })
                .transpose()?;
            let at = match &constraint.diagnostic.at {
                DiagnosticTarget::SelfValue => LinkedDiagnosticTarget::SelfValue,
                DiagnosticTarget::Field(name) => {
                    let LinkedType::Record(fields) =
                        expressions::module_shape(module, modules, ids, &mut BTreeSet::new())?
                    else {
                        return Err(diagnostic(
                            "unknown_field",
                            &constraint.source,
                            "Diagnostic field requires record",
                        ));
                    };
                    let index = fields
                        .iter()
                        .position(|field| &field.name == name)
                        .ok_or_else(|| {
                            diagnostic(
                                "unknown_field",
                                &constraint.source,
                                "Diagnostic field does not exist",
                            )
                        })?;
                    LinkedDiagnosticTarget::Field(index as u32)
                }
                DiagnosticTarget::Occurrence { name, field } => {
                    let (slot, (_, value_type)) = scope
                        .variables
                        .iter()
                        .enumerate()
                        .find(|(_, (variable, _))| variable == name)
                        .ok_or_else(|| {
                            diagnostic(
                                "unknown_variable",
                                &constraint.source,
                                "Diagnostic occurrence is outside its scope",
                            )
                        })?;
                    let LinkedType::Record(fields) = value_type else {
                        return Err(diagnostic(
                            "expression_type_mismatch",
                            &constraint.source,
                            "Occurrence field requires a record",
                        ));
                    };
                    let index = fields
                        .iter()
                        .position(|item| &item.name == field)
                        .ok_or_else(|| {
                            diagnostic(
                                "unknown_field",
                                &constraint.source,
                                "Occurrence member does not exist",
                            )
                        })?;
                    LinkedDiagnosticTarget::Occurrence {
                        slot: slot as u32,
                        field: index as u32,
                    }
                }
            };
            let message = match &constraint.diagnostic.message {
                MessageDefinition::Text(text) => vec![LinkedMessagePart::Text(text.clone())],
                MessageDefinition::Parts(parts) => parts
                    .iter()
                    .map(|part| match part {
                        MessagePart::Text(text) => Ok(LinkedMessagePart::Text(text.clone())),
                        MessagePart::Expression(expression) => {
                            let value = resolve(expression)?;
                            if value.value_type != LinkedType::Scalar(ScalarType::Text) {
                                return Err(diagnostic(
                                    "expression_type_mismatch",
                                    &value.source,
                                    "Message part must produce text",
                                ));
                            }
                            Ok(LinkedMessagePart::Expression(value))
                        }
                    })
                    .collect::<Result<_, Diagnostic>>()?,
            };
            Ok(LinkedConstraint {
                id: constraint.id.clone(),
                applies_to: constraint.applies_to.clone(),
                forms: resolve_forms(module, constraint)?,
                when,
                assertion,
                for_each,
                diagnostic: LinkedDiagnostic {
                    code: constraint.diagnostic.code.clone(),
                    source: constraint.diagnostic.source.clone(),
                    severity: constraint.diagnostic.severity.clone(),
                    at,
                    message,
                },
                source: constraint.source.clone(),
            })
        })
        .collect()
}

fn resolve_forms(module: &Module, constraint: &Constraint) -> Result<Vec<LinkedForm>, Diagnostic> {
    let mut available = vec![];
    if constraint.applies_to.contains(&ValidationPhase::XmlImport) {
        let mut xml = &module.representations.xml;
        while let XmlRepresentation::WithAttributes { content, .. } = xml {
            xml = content;
        }
        available.push(match xml {
            XmlRepresentation::Declared => {
                return Err(diagnostic(
                    "invalid_declared_representation",
                    &module.source,
                    "Inherited representation is only valid for a referenced sequence item",
                ));
            }
            XmlRepresentation::WithAttributes { .. } => unreachable!(),
            XmlRepresentation::Choice
            | XmlRepresentation::Text
            | XmlRepresentation::TextPattern(_)
            | XmlRepresentation::TextSequence { .. }
            | XmlRepresentation::QName { .. }
            | XmlRepresentation::ScalarChoice(_)
            | XmlRepresentation::FormattedDecimal(_)
            | XmlRepresentation::Calendar
            | XmlRepresentation::BooleanTable(_)
            | XmlRepresentation::Decimal
            | XmlRepresentation::EnumTable(_) => ("text", LinkedForm::XmlText),
            XmlRepresentation::Record(_) => ("record", LinkedForm::XmlRecord),
            XmlRepresentation::Tree(_) => ("tree", LinkedForm::XmlTree),
            XmlRepresentation::ElementSequence { .. } => {
                ("element-sequence", LinkedForm::XmlElementSequence)
            }
        });
    }
    if constraint
        .applies_to
        .contains(&ValidationPhase::YamlValidation)
    {
        let form = match &module.representations.yaml {
            YamlRepresentation::Projection(_) => {
                return Err(diagnostic(
                    "unsupported_projection_constraint",
                    &module.source,
                    "Define constraints on the projected field declaration; whole-projection constraints are not yet supported",
                ));
            }
            YamlRepresentation::Declared => {
                return Err(diagnostic(
                    "invalid_declared_representation",
                    &module.source,
                    "Inherited representation is only valid for a referenced sequence item",
                ));
            }
            YamlRepresentation::Choice
            | YamlRepresentation::TextTable(_)
            | YamlRepresentation::Text
            | YamlRepresentation::TextPattern(_)
            | YamlRepresentation::TextSequence { .. }
            | YamlRepresentation::ScalarChoice
            | YamlRepresentation::Calendar { .. }
            | YamlRepresentation::BooleanTable(_)
            | YamlRepresentation::Decimal
            | YamlRepresentation::EnumTable(_) => ("scalar", LinkedForm::YamlScalar),
            YamlRepresentation::Mapping(_) => ("mapping", LinkedForm::YamlMapping),
            YamlRepresentation::Sequence { .. } => ("sequence", LinkedForm::YamlSequence),
            YamlRepresentation::KeyedMapping { shorthand, .. } => {
                if shorthand.iter().any(|short| {
                    matches!(short.representation, ShorthandRepresentation::ScalarText)
                }) {
                    available.push(("scalar", LinkedForm::YamlScalar));
                }
                ("keyed-mapping", LinkedForm::YamlKeyedMapping)
            }
        };
        available.push(form);
    }
    constraint
        .forms
        .iter()
        .map(|name| {
            available
                .iter()
                .find(|(form, _)| form == name)
                .map(|(_, form)| form.clone())
                .ok_or_else(|| {
                    diagnostic(
                        "unknown_constraint_form",
                        &constraint.source,
                        "Constraint form is absent from its selected representation phases",
                    )
                })
        })
        .collect()
}
