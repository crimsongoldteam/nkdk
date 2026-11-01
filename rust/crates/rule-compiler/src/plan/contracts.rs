//! Keep owner field contracts attached to their typed storage after partitioning.
use super::*;

fn fields(entry: &LinkedEntry) -> &[LinkedField] {
    let LinkedType::Record(fields) = &entry.value else {
        unreachable!()
    };
    fields
}
fn index(slot: u32, owner: &LinkedEntry, part: &LinkedEntry) -> Result<u32, Diagnostic> {
    let name = &fields(owner)[slot as usize].name;
    fields(part)
        .iter()
        .position(|field| field.name == *name)
        .map(|slot| slot as u32)
        .ok_or_else(|| {
            unsupported(
                owner,
                "A cross-property contract requires combined owner storage",
            )
        })
}
pub(crate) fn expression(
    value: &mut LinkedExpression,
    owner: &LinkedEntry,
    part: &LinkedEntry,
) -> Result<(), Diagnostic> {
    match &mut value.kind {
        LinkedExpressionKind::Field(slot) => *slot = index(*slot, owner, part)?,
        LinkedExpressionKind::SelfValue => {
            return Err(unsupported(
                owner,
                "A whole-owner expression requires combined owner storage",
            ));
        }
        LinkedExpressionKind::Operation { arguments, .. } => {
            for child in arguments {
                expression(child, owner, part)?;
            }
        }
        _ => {}
    }
    Ok(())
}
fn first_field(value: &LinkedExpression, offset: usize, captures: &[u32]) -> Option<u32> {
    match &value.kind {
        LinkedExpressionKind::Field(slot) => Some(*slot),
        LinkedExpressionKind::Input(slot) => (*slot as usize)
            .checked_sub(offset)
            .and_then(|slot| captures.get(slot))
            .copied(),
        LinkedExpressionKind::Operation { arguments, .. } => arguments
            .iter()
            .find_map(|value| first_field(value, offset, captures)),
        _ => None,
    }
}
fn part_index(slot: u32, owner: &LinkedEntry, parts: &[LinkedEntry]) -> usize {
    parts
        .iter()
        .position(|part| index(slot, owner, part).is_ok())
        .expect("every owner field belongs to one part")
}

pub(super) fn distribute(
    owner: &LinkedEntry,
    parts: &mut [LinkedEntry],
    captures: &[u32],
) -> Result<(), Diagnostic> {
    // Capturing a sibling for lexical scope does not change which storage unit
    // owns its constraint. Resolve captured slots before choosing that unit.
    let offset = owner.inputs.len() - captures.len();
    for rule in &owner.presence {
        let LinkedPresenceTarget::Field(slot) = rule.target else {
            // A value's boundary absence is consumed by its enclosing reader;
            // it is not a default or omission contract for any partitioned field.
            let boundary_absence = owner.kind == ModuleKind::Value
                && rule
                    .xml_missing
                    .as_ref()
                    .is_none_or(|value| matches!(value.kind, LinkedExpressionKind::Absent))
                && rule
                    .yaml_missing
                    .as_ref()
                    .is_none_or(|value| matches!(value.kind, LinkedExpressionKind::Absent))
                && rule.xml_empty.is_empty()
                && rule.canonical.is_empty()
                && rule.yaml_omit_when.is_none()
                && !rule.yaml_empty.is_empty()
                && rule.yaml_empty.iter().all(|form| {
                    form.form == EmptyKind::Null
                        && matches!(form.denotes.kind, LinkedExpressionKind::Absent)
                });
            if boundary_absence {
                continue;
            }
            return Err(unsupported(
                owner,
                "Whole-owner presence is not a property contract",
            ));
        };
        let part = &mut parts[part_index(slot, owner, parts)];
        let mut rule = rule.clone();
        rule.target = LinkedPresenceTarget::Field(index(slot, owner, part)?);
        for value in rule.expressions_mut() {
            expression(value, owner, part)?;
        }
        part.presence.push(rule);
    }
    for rule in &owner.constraints {
        let slot = match rule.diagnostic.at {
            LinkedDiagnosticTarget::Field(slot) => Some(slot),
            _ => first_field(&rule.assertion, offset, captures).or_else(|| {
                rule.for_each
                    .as_ref()
                    .and_then(|iteration| first_field(&iteration.input, offset, captures))
            }),
        };
        let selected = slot.map_or(0, |slot| part_index(slot, owner, parts));
        let part = &mut parts[selected];
        let mut rule = rule.clone();
        if let Some(value) = &mut rule.when {
            expression(value, owner, part)?;
        }
        expression(&mut rule.assertion, owner, part)?;
        if let Some(iteration) = &mut rule.for_each {
            expression(&mut iteration.input, owner, part)?;
        }
        if let LinkedDiagnosticTarget::Field(slot) = &mut rule.diagnostic.at {
            *slot = index(*slot, owner, part)?;
        }
        for message in &mut rule.diagnostic.message {
            if let LinkedMessagePart::Expression(value) = message {
                expression(value, owner, part)?;
            }
        }
        part.constraints.push(rule);
    }
    Ok(())
}
