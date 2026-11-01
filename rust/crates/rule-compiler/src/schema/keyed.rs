use super::*;
use crate::generate::shorthand::specialize;

fn text_mapping_shape(entry: &LinkedEntry) -> Result<Option<Value>, Diagnostic> {
    let (LinkedType::Sequence(item), YamlRepresentation::KeyedMapping { key, value, .. }) =
        (&entry.value, &entry.yaml)
    else {
        return Ok(None);
    };
    let LinkedType::Record(fields) = item.as_ref() else {
        return Err(unsupported(entry));
    };
    let text_field = |name: &str| {
        fields
            .iter()
            .any(|field| field.name == name && field.value == LinkedType::Scalar(ScalarType::Text))
    };
    if !text_field(key) || !text_field(value) {
        return Err(unsupported(entry));
    }
    Ok(Some(
        json!({"type":"object","additionalProperties":{"type":"string"}}),
    ))
}

pub(super) fn value_shape(entry: &LinkedEntry) -> Result<Option<Value>, Diagnostic> {
    let Some(mapping) = text_mapping_shape(entry)? else {
        return Ok(None);
    };
    let mut alternatives = vec![mapping];
    if entry.shorthands.iter().any(|shorthand| {
        matches!(
            shorthand.representation,
            LinkedShorthandRepresentation::ScalarField(_)
                | LinkedShorthandRepresentation::ScalarLiteral(_)
                | LinkedShorthandRepresentation::ScalarText { .. }
        )
    }) {
        alternatives.push(json!({"type":"string"}));
    }
    Ok(Some(
        json!({"anyOf":alternatives,"x-nkdk-runtime-validation":true}),
    ))
}

pub(super) fn build(program: &Program, owner: &LinkedEntry) -> Result<Option<Value>, Diagnostic> {
    let (LinkedType::Record(fields), YamlRepresentation::Mapping(mapping)) =
        (&owner.value, &owner.yaml)
    else {
        return Ok(None);
    };
    if fields.len() != 1 || mapping.len() != 1 {
        return Ok(None);
    }
    let (id, bindings, args) = match &fields[0].value {
        LinkedType::BoundReference {
            entry,
            bindings,
            arguments,
        } => (*entry, bindings.as_slice(), arguments.as_slice()),
        LinkedType::Reference(id) => (*id, &[][..], &[][..]),
        _ => return Ok(None),
    };
    let common = program
        .entries
        .iter()
        .find(|entry| entry.id == id)
        .expect("linked common");
    let (LinkedType::Sequence(item), YamlRepresentation::KeyedMapping { value, .. }) =
        (&common.value, &common.yaml)
    else {
        return Ok(None);
    };
    let LinkedType::Record(items) = item.as_ref() else {
        return Err(unsupported(common));
    };
    if items
        .iter()
        .any(|field| field.value != LinkedType::Scalar(ScalarType::Text))
        || !owner.constraints.is_empty()
        || !owner.presence.is_empty()
    {
        return Err(unsupported(owner));
    }
    let value_index = items
        .iter()
        .position(|field| field.name == *value)
        .expect("linked value") as u32;
    let mut nonempty = false;
    for constraint in &common.constraints {
        if !yaml_constraint_applies(constraint, LinkedForm::YamlKeyedMapping) {
            continue;
        }
        let Some(iteration) = &constraint.for_each else {
            continue;
        };
        let assertion = specialize(&constraint.assertion, bindings, args, owner)?;
        let when = constraint
            .when
            .as_ref()
            .map(|when| specialize(when, bindings, args, owner))
            .transpose()?;
        if when
            .as_ref()
            .is_none_or(|when| empty_boolean(when, iteration.slot, value_index) == Some(true))
            && empty_boolean(&assertion, iteration.slot, value_index) == Some(false)
        {
            nonempty = true;
        }
    }
    let mut mapping_shape = text_mapping_shape(common)?.ok_or_else(|| unsupported(common))?;
    if nonempty {
        mapping_shape["additionalProperties"]["minLength"] = json!(1);
    }
    let mut alternatives = vec![mapping_shape];
    for shorthand in &common.shorthands {
        if matches!(
            shorthand.representation,
            LinkedShorthandRepresentation::ScalarField(_)
                | LinkedShorthandRepresentation::ScalarLiteral(_)
                | LinkedShorthandRepresentation::ScalarText { .. }
        ) {
            let enabled = shorthand
                .when
                .as_ref()
                .map(|when| specialize(when, bindings, args, owner))
                .transpose()?;
            if enabled
                .as_ref()
                .is_none_or(|when| empty_boolean(when, u32::MAX, u32::MAX) != Some(false))
            {
                alternatives.push(json!({"type":"string"}));
                break;
            }
        }
    }
    let mut optional = false;
    for presence in &common.presence {
        if presence.target != LinkedPresenceTarget::SelfValue {
            return Err(unsupported(common));
        }
        optional |= presence.yaml_missing.is_some();
        for empty in &presence.yaml_empty {
            match empty.form {
                EmptyKind::String => {
                    if !alternatives.iter().any(|value| value["type"] == "string") {
                        alternatives.push(json!({"const":""}));
                    }
                }
                EmptyKind::Mapping => (),
                _ => return Err(unsupported(common)),
            }
        }
    }
    let key = &mapping[0].key;
    Ok(Some(
        json!({"$schema":"https://json-schema.org/draft/2020-12/schema","type":"object","properties":{key:{"anyOf":alternatives}},"required":if optional {Vec::<&str>::new()} else {vec![key.as_str()]},"additionalProperties":false,"x-nkdk-runtime-validation":true}),
    ))
}
// Evaluate only facts implied by an empty mapped value. Unknown inputs and
// other row fields remain unknown; they cannot accidentally tighten the schema.
fn empty_boolean(value: &LinkedExpression, slot: u32, field: u32) -> Option<bool> {
    match &value.kind {
        LinkedExpressionKind::Literal(ScalarLiteral::Boolean(value)) => Some(*value),
        LinkedExpressionKind::Operation {
            operator,
            arguments,
        } => match operator {
            LinkedOperator::Not => empty_boolean(&arguments[0], slot, field).map(|value| !value),
            LinkedOperator::And | LinkedOperator::Or => {
                let short = *operator == LinkedOperator::Or;
                let mut unknown = false;
                for argument in arguments {
                    match empty_boolean(argument, slot, field) {
                        Some(value) if value == short => return Some(short),
                        None => unknown = true,
                        _ => (),
                    }
                }
                if unknown { None } else { Some(!short) }
            }
            LinkedOperator::Conditional => match empty_boolean(&arguments[0], slot, field) {
                Some(true) => empty_boolean(&arguments[1], slot, field),
                Some(false) => empty_boolean(&arguments[2], slot, field),
                None => None,
            },
            LinkedOperator::Equal => Some(
                empty_literal(&arguments[0], slot, field)?
                    == empty_literal(&arguments[1], slot, field)?,
            ),
            _ => None,
        },
        _ => None,
    }
}
fn empty_literal(value: &LinkedExpression, slot: u32, field: u32) -> Option<ScalarLiteral> {
    match &value.kind {
        LinkedExpressionKind::Literal(value) => Some(value.clone()),
        LinkedExpressionKind::Operation {
            operator: LinkedOperator::Get(index),
            arguments,
        } if *index == field
            && matches!(arguments[0].kind,LinkedExpressionKind::Variable(value) if value==slot) =>
        {
            Some(ScalarLiteral::Text(String::new()))
        }
        _ => None,
    }
}
