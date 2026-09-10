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
            if !matches!(presence.target, PresenceTarget::SelfValue) {
                return Err(diagnostic(
                    "unsupported_link_feature",
                    &presence.source,
                    "Field presence scope is not linked yet",
                ));
            }
            let expected = expressions::field_shape(
                module,
                &module.value,
                &module.source,
                modules,
                ids,
                &mut BTreeSet::new(),
            )?;
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
