use super::*;
use crate::generate::{
    composite::{nested_owner, record, reference},
    shorthand::specialize,
};

pub(super) fn build(program: &Program, owner: &LinkedEntry) -> Result<Option<Value>, Diagnostic> {
    let Some((common, bindings, args)) = record(owner, program) else {
        return Ok(None);
    };
    let (
        LinkedType::Record(fields),
        YamlRepresentation::Mapping(_),
        YamlRepresentation::Mapping(owner_mapping),
    ) = (&common.value, &common.yaml, &owner.yaml)
    else {
        return Err(unsupported(common));
    };
    if !fields.iter().any(|field| {
        reference(&field.value).is_some_and(|(id, _, _)| {
            program
                .entries
                .iter()
                .any(|entry| entry.id == id && matches!(entry.value, LinkedType::Sequence(_)))
        })
    }) {
        return Ok(None);
    }
    let mut properties = serde_json::Map::new();
    let mut required = Vec::new();
    let planned = program.record(common)?;
    for (index, field) in fields.iter().enumerate() {
        let Some(mapping) = planned.fields[index].yaml else {
            continue;
        };
        if mapping.file.is_some() {
            continue;
        }
        let key = &mapping.key;
        let target = reference(&field.value).map(|(id, _, _)| {
            program
                .entries
                .iter()
                .find(|entry| entry.id == id)
                .expect("linked reference")
        });
        let schema = if let Some(target) = target {
            match &target.yaml {
                YamlRepresentation::BooleanTable(values) => {
                    json!({"type":"string","enum":values.iter().map(|v|v.text.as_str()).collect::<Vec<_>>()})
                }
                YamlRepresentation::KeyedMapping { .. } => {
                    let nested = nested_owner(owner, common, field, program)?;
                    let mut schema =
                        keyed::build(program, &nested)?.ok_or_else(|| unsupported(target))?;
                    schema["properties"]
                        .as_object_mut()
                        .and_then(|p| p.remove(key))
                        .ok_or_else(|| unsupported(target))?
                }
                YamlRepresentation::Sequence { .. } | YamlRepresentation::RecordMapping { .. } => {
                    sequence_shape(program, target, &target.presence)?
                }
                _ => return Err(unsupported(target)),
            }
        } else {
            scalar(program, common, field)?
        };
        let optional = common.presence.iter().any(|p| {
            p.target == LinkedPresenceTarget::Field(index as u32) && p.yaml_missing.is_some()
        }) || target.is_some_and(|target| {
            target
                .presence
                .iter()
                .any(|p| p.target == LinkedPresenceTarget::SelfValue && p.yaml_missing.is_some())
        });
        if !optional {
            required.push(key);
        }
        properties.insert(key.clone(), schema);
    }
    let context = Context {
        program,
        entry: common,
        fields,
        record: planned,
    };
    let mut checks = Vec::new();
    for rule in &common.constraints {
        if rule.applies_to.contains(&ValidationPhase::YamlValidation)
            && rule.diagnostic.severity == Severity::Error
        {
            if rule.for_each.is_some() || !rule.forms.is_empty() {
                return Err(unsupported(common));
            }
            let assertion = specialize(&rule.assertion, &bindings, &args, owner)?;
            let when = rule
                .when
                .as_ref()
                .map(|when| specialize(when, &bindings, &args, owner))
                .transpose()?;
            if context.uses_runtime_value(&assertion)
                || when
                    .as_ref()
                    .is_some_and(|when| context.uses_runtime_value(when))
            {
                continue;
            }
            let mut check = context.expression(&assertion)?;
            if let Some(when) = &rule.when {
                check = json!({"if":context.expression(&specialize(when,&bindings,&args,owner)?)?,"then":check});
            }
            checks.push(check);
        }
    }
    let mut value = json!({"type":"object","properties":properties,"required":required,"additionalProperties":false});
    if !checks.is_empty() {
        value["allOf"] = json!(checks);
    }
    Ok(Some(
        json!({"$schema":"https://json-schema.org/draft/2020-12/schema","type":"object","properties":{&owner_mapping[0].key:value},"additionalProperties":false,"x-nkdk-runtime-validation":true}),
    ))
}
