use super::*;

pub(super) fn resolve(
    module: &Module,
    modules: &BTreeMap<&str, &Module>,
    ids: &BTreeMap<&str, u32>,
) -> Result<Vec<LinkedPresence>, Diagnostic> {
    module
        .presence
        .iter()
        .map(|presence| {
            let shape = expressions::module_shape(module, modules, ids, &mut BTreeSet::new())?;
            let (target, expected) = match &presence.target {
                PresenceTarget::SelfValue => (LinkedPresenceTarget::SelfValue, shape),
                PresenceTarget::Field(name) => {
                    let LinkedType::Record(fields) = shape else {
                        return Err(diagnostic(
                            "unknown_field",
                            &presence.source,
                            "Field presence requires record",
                        ));
                    };
                    let (index, field) = fields
                        .iter()
                        .enumerate()
                        .find(|(_, field)| &field.name == name)
                        .ok_or_else(|| {
                            diagnostic(
                                "unknown_field",
                                &presence.source,
                                "Presence target does not exist",
                            )
                        })?;
                    (
                        LinkedPresenceTarget::Field(index as u32),
                        field.value.clone(),
                    )
                }
            };
            let denotes = |expression: &Expression| {
                denotations::resolve(module, expression, &expected, modules, ids)
            };
            let predicate = |expression: &Expression| {
                let value = expressions::resolve_expression(module, expression, modules, ids)?;
                expressions::require_boolean(&value)?;
                Ok(value)
            };
            let empties = |forms: &[EmptyForm]| {
                forms
                    .iter()
                    .map(|form| {
                        Ok(LinkedEmpty {
                            form: form.form.clone(),
                            denotes: denotes(&form.denotes)?,
                            source: form.source.clone(),
                        })
                    })
                    .collect::<Result<Vec<_>, Diagnostic>>()
            };
            let canonical = presence
                .xml_canonical
                .iter()
                .map(|form| {
                    Ok(LinkedCanonical {
                        when: form.when.as_ref().map(predicate).transpose()?,
                        form: form.form.clone(),
                        source: form.source.clone(),
                    })
                })
                .collect::<Result<_, Diagnostic>>()?;
            Ok(LinkedPresence {
                target,
                canonical,
                xml_missing: presence.xml_missing.as_ref().map(denotes).transpose()?,
                yaml_missing: presence.yaml_missing.as_ref().map(denotes).transpose()?,
                xml_empty: empties(&presence.xml_empty)?,
                yaml_empty: empties(&presence.yaml_empty)?,
                yaml_omit_when: presence
                    .yaml_omit_when
                    .as_ref()
                    .map(predicate)
                    .transpose()?,
                source: presence.source.clone(),
            })
        })
        .collect()
}
