//! Inputs consumed while reading and checking a fact source, not exporting it.
use super::*;

pub(crate) fn read(
    entry: &LinkedEntry,
    program: &Program,
    phase: ValidationPhase,
) -> BTreeSet<u32> {
    // Solve recursive input demand monotonically. Cutting a cycle by requiring
    // every input creates false self-dependencies for output-only indexes.
    let entries = reachable_entries(entry, program);
    let mut required = BTreeMap::new();
    loop {
        let next: BTreeMap<_, _> = entries
            .values()
            .map(|candidate| {
                (
                    candidate.id,
                    entry_inputs(candidate, &entries, &phase, &required),
                )
            })
            .collect();
        if next == required {
            return entry_inputs(entry, &entries, &phase, &required);
        }
        required = next;
    }
}

fn reachable_entries<'a>(
    entry: &'a LinkedEntry,
    program: &'a Program,
) -> BTreeMap<u32, &'a LinkedEntry> {
    let mut entries = BTreeMap::from([(entry.id, entry)]);
    let mut pending = vec![entry.id];
    while let Some(id) = pending.pop() {
        let mut references = Vec::new();
        reference_ids(&entries[&id].value, &mut references);
        for id in references {
            if let std::collections::btree_map::Entry::Vacant(slot) = entries.entry(id) {
                slot.insert(
                    program
                        .entries
                        .iter()
                        .find(|candidate| candidate.id == id)
                        .expect("linked reference"),
                );
                pending.push(id);
            }
        }
    }
    entries
}

fn reference_ids(value: &LinkedType, result: &mut Vec<u32>) {
    if let Some((id, _, _)) = value.as_reference() {
        result.push(id);
        return;
    }
    match value {
        LinkedType::Record(fields) | LinkedType::Choice(fields) => {
            for field in fields {
                reference_ids(&field.value, result);
            }
        }
        LinkedType::Sequence(item) | LinkedType::Optional(item) => reference_ids(item, result),
        _ => {}
    }
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

/// Attribute observation evaluates scope keys, never semantic field defaults.
pub(crate) fn reservation_scopes(entry: &LinkedEntry) -> BTreeSet<u32> {
    let mut inputs = BTreeSet::new();
    for contribution in &entry.contributions {
        if contribution.write.is_reservation() {
            expression(&contribution.key, &mut inputs);
        }
    }
    inputs
}

fn entry_inputs(
    entry: &LinkedEntry,
    entries: &BTreeMap<u32, &LinkedEntry>,
    phase: &ValidationPhase,
    required: &BTreeMap<u32, BTreeSet<u32>>,
) -> BTreeSet<u32> {
    // Until a representation exposes its reading expressions, retain all its
    // dependencies. A conservative edge may block a plan; a missing edge lies.
    if !entry.shorthands.is_empty()
        || entry.normalization.is_some()
        || !entry.text_transforms.is_empty()
    {
        return (0..entry.inputs.len() as u32).collect();
    }
    let mut inputs = BTreeSet::new();
    value_inputs(&entry.value, entries, required, &mut inputs);
    for rule in &entry.presence {
        let (missing, empty) = match phase {
            ValidationPhase::XmlImport => (&rule.xml_missing, &rule.xml_empty),
            ValidationPhase::YamlValidation => (&rule.yaml_missing, &rule.yaml_empty),
        };
        for value in missing.iter().chain(empty.iter().map(|form| &form.denotes)) {
            expression(value, &mut inputs);
        }
        if matches!(phase, ValidationPhase::YamlValidation) {
            for value in rule.yaml_omit_when.iter().chain(&rule.yaml_null_when) {
                expression(value, &mut inputs);
            }
        }
        // XML canonical forms may be checked while reading either side.
        for value in rule.canonical.iter().filter_map(|form| form.when.as_ref()) {
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
        for value in std::iter::once(&contribution.key)
            .chain(contribution.write.value())
            .chain(
                contribution
                    .for_each
                    .iter()
                    .map(|iteration| &iteration.input),
            )
            .chain(&contribution.when)
        {
            expression(value, &mut inputs);
        }
    }
    if !xml_inputs(&entry.xml, &mut inputs) {
        inputs.extend(0..entry.inputs.len() as u32);
    }
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
    entries: &BTreeMap<u32, &LinkedEntry>,
    required: &BTreeMap<u32, BTreeSet<u32>>,
    inputs: &mut BTreeSet<u32>,
) {
    if let Some((id, bindings, _)) = value.as_reference() {
        let entry = entries[&id];
        let callee_inputs = required.get(&entry.id).cloned().unwrap_or_default();
        if bindings.is_empty() {
            // Link-time scalar specializations can already use the owner's
            // input frame without a remaining binding node.
            inputs.extend(callee_inputs);
            return;
        }
        for binding in bindings {
            // Passing a slot is lazy; computed arguments are evaluated by the
            // call boundary even when the callee does not read their result.
            if callee_inputs.contains(&binding.slot)
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
                value_inputs(&field.value, entries, required, inputs);
            }
        }
        LinkedType::Sequence(item) | LinkedType::Optional(item) => {
            value_inputs(item, entries, required, inputs)
        }
        _ => {}
    }
}
