//! Inputs consumed while reading and checking a fact source, not exporting it.
use super::*;

pub(crate) fn read(
    entry: &LinkedEntry,
    program: &Program,
    phase: ValidationPhase,
) -> BTreeSet<u32> {
    entry_inputs(entry, program, &phase, &mut BTreeSet::new())
}

fn expression(value: &LinkedExpression, inputs: &mut BTreeSet<u32>) {
    match &value.kind {
        LinkedExpressionKind::Input(slot) => {
            inputs.insert(*slot);
        }
        LinkedExpressionKind::Operation { arguments, .. } => {
            for value in arguments {
                expression(value, inputs);
            }
        }
        _ => {}
    }
}

fn entry_inputs(
    entry: &LinkedEntry,
    program: &Program,
    phase: &ValidationPhase,
    active: &mut BTreeSet<u32>,
) -> BTreeSet<u32> {
    // Until a representation exposes its reading expressions, retain all its
    // dependencies. A conservative edge may block a plan; a missing edge lies.
    if !entry.shorthands.is_empty()
        || entry.normalization.is_some()
        || !entry.text_transforms.is_empty()
        || !entry.resources.is_empty()
        || !active.insert(entry.id)
    {
        return (0..entry.inputs.len() as u32).collect();
    }
    let mut inputs = BTreeSet::new();
    value_inputs(&entry.value, program, phase, active, &mut inputs);
    for rule in &entry.presence {
        let (missing, empty) = match phase {
            ValidationPhase::XmlImport => (&rule.xml_missing, &rule.xml_empty),
            ValidationPhase::YamlValidation => (&rule.yaml_missing, &rule.yaml_empty),
        };
        for value in missing.iter().chain(empty.iter().map(|form| &form.denotes)) {
            expression(value, &mut inputs);
        }
        // Existing readers can validate canonical forms during reading.
        for value in rule
            .yaml_omit_when
            .iter()
            .chain(rule.canonical.iter().filter_map(|form| form.when.as_ref()))
        {
            expression(value, &mut inputs);
        }
    }
    for rule in entry
        .constraints
        .iter()
        .filter(|rule| rule.applies_to.contains(phase))
    {
        for value in rule.expressions() {
            expression(value, &mut inputs);
        }
    }
    for contribution in &entry.contributions {
        for value in [&contribution.key, &contribution.value].into_iter().chain(
            contribution
                .for_each
                .iter()
                .map(|iteration| &iteration.input),
        ) {
            expression(value, &mut inputs);
        }
    }
    if !xml_inputs(&entry.xml, &mut inputs) {
        inputs.extend(0..entry.inputs.len() as u32);
    }
    active.remove(&entry.id);
    inputs
}

fn xml_inputs(xml: &LinkedXml, inputs: &mut BTreeSet<u32>) -> bool {
    match xml {
        LinkedXml::WithAttributes {
            attributes,
            content,
        } => {
            for value in attributes
                .iter()
                .filter_map(|attribute| attribute.when.as_ref())
            {
                expression(value, inputs);
            }
            xml_inputs(content, inputs)
        }
        LinkedXml::ElementSequence { item, .. } => xml_inputs(item, inputs),
        LinkedXml::Tree(_) => false,
        _ => true,
    }
}

fn value_inputs(
    value: &LinkedType,
    program: &Program,
    phase: &ValidationPhase,
    active: &mut BTreeSet<u32>,
    inputs: &mut BTreeSet<u32>,
) {
    if let Some((id, bindings, _)) = value.as_reference() {
        let entry = program
            .entries
            .iter()
            .find(|entry| entry.id == id)
            .expect("linked reference");
        let required = entry_inputs(entry, program, phase, active);
        if bindings.is_empty() {
            // Link-time scalar specializations can already use the owner's
            // input frame without a remaining binding node.
            inputs.extend(required);
            return;
        }
        for binding in bindings {
            // Passing a slot is lazy; computed arguments are evaluated by the
            // call boundary even when the callee does not read their result.
            if required.contains(&binding.slot)
                || !matches!(binding.value.kind, LinkedExpressionKind::Input(_))
            {
                expression(&binding.value, inputs);
            }
        }
        return;
    }
    match value {
        LinkedType::Record(fields) | LinkedType::Choice(fields) => {
            for field in fields {
                value_inputs(&field.value, program, phase, active, inputs);
            }
        }
        LinkedType::Sequence(item) | LinkedType::Optional(item) => {
            value_inputs(item, program, phase, active, inputs)
        }
        _ => {}
    }
}
