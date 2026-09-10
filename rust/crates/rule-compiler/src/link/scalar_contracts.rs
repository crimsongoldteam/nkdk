use super::*;

pub(super) fn lift(entries: &mut [LinkedEntry]) -> Result<(), Diagnostic> {
    let originals: BTreeMap<_, _> = entries
        .iter()
        .map(|entry| (entry.id, entry.clone()))
        .collect();
    for owner in entries {
        let LinkedType::Record(fields) = &owner.value else {
            continue;
        };
        for (index, field) in fields.iter().enumerate() {
            let LinkedType::Reference(id) = field.value else {
                continue;
            };
            let common = &originals[&id];
            if !matches!(common.value, LinkedType::Scalar(_) | LinkedType::Enum(_)) {
                continue;
            }
            for constraint in &common.constraints {
                if constraint.for_each.is_some()
                    || !common.inputs.is_empty()
                    || !common.parameters.is_empty()
                {
                    return Err(diagnostic(
                        "unsupported_scalar_contract",
                        &constraint.source,
                        "Scalar constraint inputs require explicit specialization",
                    ));
                }
                let mut constraint = constraint.clone();
                constraint.id = format!("{}.{}", field.name, constraint.id);
                crate::expressions::replace_self(&mut constraint.assertion, index);
                if let Some(when) = &mut constraint.when {
                    crate::expressions::replace_self(when, index);
                }
                for part in &mut constraint.diagnostic.message {
                    if let LinkedMessagePart::Expression(value) = part {
                        crate::expressions::replace_self(value, index);
                    }
                }
                constraint.diagnostic.at = match constraint.diagnostic.at {
                    LinkedDiagnosticTarget::SelfValue => {
                        LinkedDiagnosticTarget::Field(index as u32)
                    }
                    _ => {
                        return Err(diagnostic(
                            "unsupported_scalar_contract",
                            &constraint.source,
                            "Scalar diagnostic must address its value",
                        ));
                    }
                };
                for form in &mut constraint.forms {
                    *form = match form {
                        LinkedForm::XmlText => LinkedForm::XmlRecord,
                        LinkedForm::YamlScalar => LinkedForm::YamlMapping,
                        _ => {
                            return Err(diagnostic(
                                "unsupported_scalar_contract",
                                &constraint.source,
                                "Scalar constraint has a non-scalar form",
                            ));
                        }
                    };
                }
                owner.constraints.push(constraint);
            }
        }
    }
    Ok(())
}
