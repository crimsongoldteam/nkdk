use super::expressions::Expressions;
use super::*;
use std::fmt::Write;

pub(super) fn severity_name(severity: &Severity) -> &'static str {
    match severity {
        Severity::Error => "Error",
        Severity::Warning => "Warning",
        Severity::Info => "Info",
    }
}
pub(super) fn violation(when: &str, assertion: &str) -> String {
    if when == "true" {
        format!("!({assertion})")
    } else {
        format!("({when}) && !({assertion})")
    }
}

pub(super) fn generate(entry: &LinkedEntry, program: &Program) -> Result<String, Diagnostic> {
    if super::declared_items::applies(entry, program) {
        return Ok(String::new());
    }
    if super::owner::applies(entry, program) {
        return Ok(String::new());
    }
    if super::qname::applies(entry, program) {
        return Ok(String::new());
    }
    if let Some(layout) = super::nested_record::lower(entry, program)? {
        return generate_at(&layout.entry, program, None, Some(&layout.key));
    }
    if super::composite::record(entry, program).is_some() {
        return Ok(String::new());
    }
    if let LinkedType::Record(fields) = &entry.value
        && fields.len() == 1
    {
        let reference = match &fields[0].value {
            LinkedType::Reference(id) => Some((*id, &[][..], &[][..])),
            LinkedType::BoundReference {
                entry,
                bindings,
                arguments,
            } => Some((*entry, bindings.as_slice(), arguments.as_slice())),
            _ => None,
        };
        if let Some((id, bindings, arguments)) = reference {
            let common = program
                .entries
                .iter()
                .find(|entry| entry.id == id)
                .expect("linked common");
            if matches!(common.value, LinkedType::Sequence(_))
                && !matches!(common.yaml, YamlRepresentation::TextSequence { .. })
            {
                if matches!(common.yaml, YamlRepresentation::Sequence { .. }) {
                    if common.constraints.is_empty()
                        && entry.constraints.is_empty()
                        && collection_values::codec(common, program)?.is_none()
                    {
                        return Ok(String::new());
                    }
                    if !entry.constraints.is_empty()
                        || common.constraints.iter().any(|rule| {
                            rule.for_each.is_some()
                                || !rule.forms.is_empty()
                                || rule.diagnostic.at != LinkedDiagnosticTarget::SelfValue
                        })
                    {
                        return Err(unsupported(
                            common,
                            "Ordinary sequence constraints currently target the whole value",
                        ));
                    }
                }
                let inherited = super::inputs::identity(entry);
                let bindings = if bindings.is_empty() && common.inputs.is_empty() {
                    inherited.as_slice()
                } else {
                    bindings
                };
                let mut common = common.clone();
                common.id = entry.id;
                for constraint in &mut common.constraints {
                    super::shorthand::specialize_constraint(
                        constraint, bindings, arguments, entry,
                    )?;
                }
                let YamlRepresentation::Mapping(mapping) = &entry.yaml else {
                    return Err(unsupported(entry, "Owner needs a mapping"));
                };
                return generate_at(&common, program, Some(&mapping[0].key), None);
            }
        }
    }
    generate_at(entry, program, None, None)
}
fn generate_at(
    entry: &LinkedEntry,
    program: &Program,
    base: Option<&str>,
    record_key: Option<&str>,
) -> Result<String, Diagnostic> {
    let fields = match &entry.value {
        LinkedType::Record(fields) => fields.as_slice(),
        LinkedType::Sequence(item) => match item.as_ref() {
            LinkedType::Record(fields) => fields.as_slice(),
            LinkedType::Scalar(ScalarType::Text) | LinkedType::Reference(_) => &[],
            _ => return Err(unsupported(entry, "Collection items need records")),
        },
        _ => {
            return Err(unsupported(
                entry,
                "Constraints require a record or record sequence",
            ));
        }
    };
    let _yaml = match &entry.yaml {
        YamlRepresentation::Mapping(mapping) => mapping.as_slice(),
        YamlRepresentation::KeyedMapping { .. } | YamlRepresentation::Sequence { .. } => &[],
        _ => return Err(unsupported(entry, "Constraints require a mapping")),
    };
    let key_index = match &entry.yaml {
        YamlRepresentation::KeyedMapping { key, .. } => fields
            .iter()
            .position(|field| field.name == *key)
            .expect("linked key"),
        _ => 0,
    };
    let prefix = base
        .map(|key| format!(".field({key:?})"))
        .unwrap_or_default();
    let mut out = String::new();
    for (side, phase, form) in [
        (
            "xml",
            ValidationPhase::XmlImport,
            if base.is_some() {
                LinkedForm::XmlElementSequence
            } else {
                LinkedForm::XmlRecord
            },
        ),
        (
            "yaml",
            ValidationPhase::YamlValidation,
            if base.is_some() {
                LinkedForm::YamlKeyedMapping
            } else {
                LinkedForm::YamlMapping
            },
        ),
    ] {
        let selected: Vec<_> = entry
            .constraints
            .iter()
            .filter(|constraint| {
                constraint.applies_to.contains(&phase)
                    && (constraint.forms.is_empty()
                        || constraint.forms.contains(&form)
                        || (base.is_some()
                            && side == "yaml"
                            && constraint.forms.contains(&LinkedForm::YamlScalar)))
            })
            .collect();
        let function = "issues";
        writeln!(
            out,
            "fn {function}_{side}_{}(_value: &V{}, _source: &[u8], _inputs: &PreparedInputs) -> Vec<RuntimeDiagnostic> {{",
            entry.id, entry.id
        )
        .unwrap();
        if record_key.is_some() {
            out.push_str("if !_value.present {return Vec::new();}\n");
        }
        let mut item_checks = String::new();
        if base.is_none() {
            for (index, field) in fields.iter().enumerate() {
                if let super::scalar::Codec::Sequence(_) =
                    super::scalar::Codec::resolve(&field.value, entry, program)?
                {
                    let key = super::record::diagnostic_key(entry, &field.name);
                    let xml = side == "xml";
                    writeln!(item_checks,"if let Some(value)=&_value.f{index}{{errors.extend(value.issues({xml},_inputs).into_iter().map(|issue|_value.positions[{index}].apply(_source,issue.field({key:?}))));}}").unwrap();
                }
            }
        }
        if let Some(key) = base
            && collection_values::codec(entry, program)?.is_some()
        {
            let xml = side == "xml";
            writeln!(item_checks,"for (index,row) in _value.rows.iter().enumerate(){{errors.extend(row.fields[0].issues({xml},_inputs).into_iter().map(|mut issue|{{issue.message=format!(\"Element {{}}: {{}}\",index+1,issue.message);_value.position.apply(_source,issue.field({key:?}))}}));}}").unwrap();
        }
        if selected.is_empty() && item_checks.is_empty() {
            out.push_str("Vec::new() }\n");
            continue;
        }
        let storage = if base.is_none() {
            Some(
                fields
                    .iter()
                    .enumerate()
                    .map(|(index, field)| {
                        Ok((
                            super::scalar::Codec::resolve(&field.value, entry, program)?
                                .optional_meaning(&format!("E{}F{index}", entry.id), index),
                            format!("_value.f{index}.is_some()"),
                        ))
                    })
                    .collect::<Result<Vec<_>, Diagnostic>>()?,
            )
        } else {
            None
        };
        let mut expressions = Expressions::new(entry, program, fields, storage.as_deref());
        let mut body = String::new();
        for constraint in selected {
            expressions.fallible = false;
            if let Some(iteration) = &constraint.for_each {
                if base.is_none() {
                    return Err(unsupported(
                        entry,
                        "Record iteration requires collection storage",
                    ));
                }
                let input = expressions.lower(&iteration.input)?;
                let count = if matches!(
                    constraint.diagnostic.at,
                    LinkedDiagnosticTarget::Occurrence { .. }
                ) {
                    format!(
                        "let count=occurrences.entry(v{}.fields[{key_index}].as_str()).or_insert(0u32); let Some(next)=count.checked_add(1) else {{ errors.push(RuntimeDiagnostic::new(\"collection.too-many-occurrences\", \"Occurrence count exceeds supported range\")); break; }}; *count=next; let occurrence=std::num::NonZeroU32::new(next).expect(\"positive occurrence\");",
                        iteration.slot
                    )
                } else {
                    String::new()
                };
                let counter = if count.is_empty() {
                    ""
                } else {
                    "let mut occurrences=std::collections::HashMap::new();"
                };
                writeln!(body, "let iterate = || -> core::Result<&[R{}]> {{ Ok({input}) }}; match iterate() {{ Err(error) => errors.push(error{prefix}), Ok(rows) => {{ {counter} for v{} in rows {{ {count}", entry.id, iteration.slot).unwrap();
            }
            let code = constraint.diagnostic.code.as_deref();
            let source = constraint.diagnostic.source.as_deref();
            let message = expressions.message(&constraint.diagnostic.message)?;
            let message_fallible = expressions.fallible;
            expressions.fallible = false;
            let mut when = constraint
                .when
                .as_ref()
                .map(|value| expressions.lower(value))
                .transpose()?
                .unwrap_or_else(|| "true".into());
            if base.is_some() && side == "yaml" && !constraint.forms.is_empty() {
                let selected = constraint
                    .forms
                    .iter()
                    .filter_map(|form| match form {
                        LinkedForm::YamlKeyedMapping => {
                            Some("_value.form == core::yaml::Form::Mapping")
                        }
                        LinkedForm::YamlScalar => Some("_value.form == core::yaml::Form::Scalar"),
                        _ => None,
                    })
                    .collect::<Vec<_>>()
                    .join(" || ");
                when = format!("({selected}) && ({when})");
            }
            if base.is_none() {
                let mut reads = BTreeSet::new();
                read_fields(&constraint.assertion, &mut reads);
                if let Some(value) = &constraint.when {
                    read_fields(value, &mut reads);
                }
                for part in &constraint.diagnostic.message {
                    if let LinkedMessagePart::Expression(value) = part {
                        read_fields(value, &mut reads);
                    }
                }
                if !reads.is_empty() {
                    when = format!(
                        "{} && ({when})",
                        reads
                            .iter()
                            .map(|index| format!("_value.f{index}.is_some()"))
                            .collect::<Vec<_>>()
                            .join(" && ")
                    );
                }
            }
            let assertion = expressions.lower(&constraint.assertion)?;
            let address = match constraint.diagnostic.at {
                LinkedDiagnosticTarget::SelfValue => prefix.clone(),
                LinkedDiagnosticTarget::Field(index) => {
                    let field = &fields[index as usize];
                    let key = super::record::diagnostic_key(entry, &field.name);
                    format!(".field({key:?})")
                }
                LinkedDiagnosticTarget::Occurrence { slot, .. } => format!(
                    "{prefix}.field(v{slot}.fields[{key_index}].as_str()).with_occurrence(occurrence)"
                ),
            };
            let position = match constraint.diagnostic.at {
                LinkedDiagnosticTarget::Field(index) => format!("_value.positions[{index}]"),
                LinkedDiagnosticTarget::Occurrence { slot, field } => {
                    format!("v{slot}.positions[{field}]")
                }
                LinkedDiagnosticTarget::SelfValue if base.is_some() => "_value.position".into(),
                _ => "core::Position::default()".into(),
            };
            let severity = severity_name(&constraint.diagnostic.severity);
            let condition = super::constraints::violation(&when, &assertion);
            let make_error = format!(
                "RuntimeDiagnostic::declared({code:?}, {source:?}, core::Severity::{severity}, {message}){address}"
            );
            let error = if message_fallible {
                format!(
                    "{{ let compose = || -> core::Result<RuntimeDiagnostic> {{ Ok({make_error}) }}; match compose() {{ Ok(error) => error, Err(error) => error{address} }} }}"
                )
            } else {
                make_error
            };
            let report =
                format!("let error = {error}; errors.push({position}.apply(_source, error));");
            if expressions.fallible {
                writeln!(body, "let evaluate = || -> core::Result<bool> {{ Ok({condition}) }}; match evaluate() {{ Ok(true) => {{ {report} }}, Ok(false) => {{}}, Err(error) => errors.push({position}.apply(_source, error{address})), }}").unwrap();
            } else {
                writeln!(body, "if {condition} {{ {report} }}").unwrap();
            }
            if constraint.for_each.is_some() {
                body.push_str("} } }\n");
            }
        }
        out.push_str(&expressions.constants);
        out.push_str("let mut errors = Vec::new();\n");
        out.push_str(&item_checks);
        out.push_str(&body);
        out.push_str("errors }\n");
    }
    if base.is_none() {
        let id = entry.id;
        let keys = fields
            .iter()
            .map(|field| super::record::diagnostic_key(entry, &field.name))
            .collect::<Vec<_>>();
        let address = record_key.map_or(String::new(), |key| {
            format!(".into_iter().map(|mut issue|{{issue.path.insert(0,{key:?}.into());issue}}).collect()")
        });
        writeln!(out,"fn check_xml_{id}(value:&V{id},_source:&[u8],_inputs:&PreparedInputs)->Vec<RuntimeDiagnostic> {{value.raw.diagnostics(){address}}}").unwrap();
        writeln!(out,"fn check_yaml_{id}(value:&V{id},source:&[u8],inputs:&PreparedInputs)->Vec<RuntimeDiagnostic> {{value.raw.validate(&{keys:?},issues_yaml_{id}(value,source,inputs),&issues_xml_{id}(value,source,inputs)){address}}}").unwrap();
    }
    Ok(out)
}

pub(super) fn read_fields(expression: &LinkedExpression, result: &mut BTreeSet<u32>) {
    match &expression.kind {
        LinkedExpressionKind::Field(index) => {
            result.insert(*index);
        }
        LinkedExpressionKind::Operation {
            operator: LinkedOperator::State(_),
            arguments,
        } => {
            // Inspect computed optional values: their inputs still need to exist.
            // A direct field state, however, deliberately accepts an absent field.
            for value in arguments {
                if !matches!(value.kind, LinkedExpressionKind::Field(_)) {
                    read_fields(value, result);
                }
            }
        }
        LinkedExpressionKind::Operation { arguments, .. } => {
            for value in arguments {
                read_fields(value, result);
            }
        }
        _ => (),
    }
}
