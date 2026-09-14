use crate::diagnostic;
#[cfg(test)]
mod tests;
use nkdk_rule_model::*;
use std::{
    borrow::Cow,
    collections::{BTreeMap, BTreeSet},
    ops::Deref,
};
mod composition;
pub(crate) mod contracts;
pub(crate) mod input_dependencies;
pub(crate) mod records;
pub(crate) mod routes;
pub(crate) mod scopes;
mod values;
pub(crate) mod xml_ownership;
pub(crate) use values::{RecordPlan, ValueId, ValuePlan, diagnostic_key};

/// Prepared at build time. The runtime never receives this structure.
#[derive(Debug)]
pub(crate) struct ConversionPlan<'a> {
    program: &'a Program,
    values: BTreeMap<ValueId, ValuePlan<'a>>,
    compositions: composition::Table,
}
impl Deref for ConversionPlan<'_> {
    type Target = Program;
    fn deref(&self) -> &Program {
        self.program
    }
}
pub(crate) fn build(program: &Program) -> Result<ConversionPlan<'_>, Vec<Diagnostic>> {
    let mut values = BTreeMap::new();
    for entry in &program.entries {
        let record = RecordPlan::applies(entry)
            .then(|| RecordPlan::prepare(entry, program))
            .transpose()
            .map_err(|error| vec![error])?;
        values.insert(ValueId(entry.id), ValuePlan { entry, record });
    }
    Ok(ConversionPlan {
        program,
        values,
        compositions: Default::default(),
    })
}
impl ConversionPlan<'_> {
    pub(crate) fn composition(
        &self,
        entry: &LinkedEntry,
    ) -> Result<std::rc::Rc<composition::Composition>, Diagnostic> {
        self.compositions.prepare(entry, self.program)
    }
    pub(crate) fn value(&self, id: ValueId) -> Option<&ValuePlan<'_>> {
        self.values.get(&id)
    }
    pub(crate) fn record<'a>(
        &'a self,
        entry: &'a LinkedEntry,
    ) -> Result<Cow<'a, RecordPlan<'a>>, Diagnostic> {
        if let Some(record) = self
            .values
            .get(&ValueId(entry.id))
            .and_then(|value| value.record.as_ref())
            && std::ptr::eq(record.entry, entry)
        {
            return Ok(Cow::Borrowed(record));
        }
        // Existing lowering creates temporary specializations. They use the
        // same preparation contract until their routes move into the plan.
        RecordPlan::prepare(entry, self.program).map(Cow::Owned)
    }
}

#[derive(Clone, Copy, PartialEq, Eq)]
pub(crate) enum RepresentationSide {
    Xml,
    Yaml,
}
pub(crate) fn check_coverage(
    fields: &[LinkedField],
    covered: &BTreeSet<&str>,
    presence: &[LinkedPresence],
    side: RepresentationSide,
    source: &SourceLocation,
) -> Result<(), Diagnostic> {
    for (index, field) in fields.iter().enumerate() {
        if covered.contains(field.name.as_str()) {
            continue;
        }
        let restored = presence.iter().any(|rule| {
            rule.target == LinkedPresenceTarget::Field(index as u32)
                && match side {
                    RepresentationSide::Xml => rule.xml_missing.is_some(),
                    RepresentationSide::Yaml => rule.yaml_missing.is_some(),
                }
        });
        if !restored {
            return Err(diagnostic(
                "unrepresented_field",
                source,
                "Record field has neither representation nor explicit restoration",
            ));
        }
    }
    Ok(())
}

pub(crate) fn unsupported(entry: &LinkedEntry, message: &str) -> Diagnostic {
    diagnostic("unsupported_generation_feature", &entry.source, message)
}
