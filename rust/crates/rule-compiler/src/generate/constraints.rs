use super::expressions::Expressions;
use super::*;
use std::fmt::Write;

pub(super) fn generate(entry: &LinkedEntry, program: &Program) -> Result<String, Diagnostic> {
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
            if matches!(common.value, LinkedType::Sequence(_)) {
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
                return generate_at(&common, program, Some(&mapping[0].key));
            }
        }
    }
    generate_at(entry, program, None)
}
fn generate_at(
    entry: &LinkedEntry,
    program: &Program,
    base: Option<&str>,
) -> Result<String, Diagnostic> {
    let fields = match &entry.value {
        LinkedType::Record(fields) => fields.as_slice(),
        LinkedType::Sequence(item) => match item.as_ref() {
            LinkedType::Record(fields) => fields.as_slice(),
            _ => return Err(unsupported(entry, "Collection items need records")),
        },
        _ => {
            return Err(unsupported(
                entry,
                "Constraints require a record or record sequence",
            ));
        }
    };
    let yaml = match &entry.yaml {
        YamlRepresentation::Mapping(mapping) => mapping.as_slice(),
        YamlRepresentation::KeyedMapping { .. } => &[],
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
        writeln!(
            out,
            "fn check_{side}_{}(_value: &V{}, _source: &[u8], _inputs: &PreparedInputs) -> Vec<RuntimeDiagnostic> {{",
            entry.id, entry.id
        )
        .unwrap();
        if selected.is_empty() {
            out.push_str("Vec::new() }\n");
            continue;
        }
        let mut expressions = Expressions {
            entry,
            program,
            fields,
            constants: String::new(),
            next_constant: 0,
            transforms: BTreeSet::new(),
            fallible: false,
        };
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
            let assertion = expressions.lower(&constraint.assertion)?;
            let address = match constraint.diagnostic.at {
                LinkedDiagnosticTarget::SelfValue => prefix.clone(),
                LinkedDiagnosticTarget::Field(index) => {
                    let field = &fields[index as usize];
                    let key = &yaml
                        .iter()
                        .find(|mapping| mapping.field == field.name)
                        .expect("linked mapping")
                        .key;
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
            let severity = match constraint.diagnostic.severity {
                Severity::Error => "Error",
                Severity::Warning => "Warning",
                Severity::Info => "Info",
            };
            let condition = if when == "true" {
                format!("!({assertion})")
            } else {
                format!("({when}) && !({assertion})")
            };
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
        out.push_str(&body);
        out.push_str("errors }\n");
    }
    Ok(out)
}
