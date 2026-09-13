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
pub(super) fn expression(
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
fn first_field(value: &LinkedExpression) -> Option<u32> {
    match &value.kind {
        LinkedExpressionKind::Field(slot) => Some(*slot),
        LinkedExpressionKind::Operation { arguments, .. } => arguments.iter().find_map(first_field),
        _ => None,
    }
}
fn part_index(slot: u32, owner: &LinkedEntry, parts: &[LinkedEntry]) -> usize {
    parts
        .iter()
        .position(|part| index(slot, owner, part).is_ok())
        .expect("every owner field belongs to one part")
}

pub(super) fn distribute(owner: &LinkedEntry, parts: &mut [LinkedEntry]) -> Result<(), Diagnostic> {
    for rule in &owner.presence {
        let LinkedPresenceTarget::Field(slot) = rule.target else {
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
            _ => first_field(&rule.assertion).or_else(|| {
                rule.for_each
                    .as_ref()
                    .and_then(|iteration| first_field(&iteration.input))
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
