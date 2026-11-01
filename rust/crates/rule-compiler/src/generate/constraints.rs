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
    if when == "false" || (when == "true" && assertion == "true") {
        "false".into()
    } else if when == "true" && assertion == "false" {
        "true".into()
    } else if when == "true" {
        format!("!({assertion})")
    } else {
        format!("({when}) && !({assertion})")
    }
}

pub(super) fn yaml_form(entry: &LinkedEntry) -> LinkedForm {
    if matches!(
        entry.yaml,
        YamlRepresentation::Projection(_) | YamlRepresentation::TextPattern(_)
    ) {
        LinkedForm::YamlScalar
    } else {
        LinkedForm::YamlMapping
    }
}

pub(super) fn generate(entry: &LinkedEntry, program: &Program) -> Result<String, Diagnostic> {
    if crate::plan::routes::record_usage(entry, program)?.is_some() {
        return Ok(String::new());
    }
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
        return generate_at(&layout.entry, program, None, Some(&layout.key), false);
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
                    if common.constraints.iter().any(|rule| {
                        rule.for_each.is_some()
                            || !rule.forms.is_empty()
                            || rule.diagnostic.at != LinkedDiagnosticTarget::SelfValue
                    }) {
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
                let common = super::collection_constraints::merge(
                    &common, entry, program, bindings, arguments,
                )?;
                let key = match &entry.yaml {
                    YamlRepresentation::Mapping(mapping) => Some(mapping[0].key.as_str()),
                    YamlRepresentation::Projection(_) => None,
                    _ => return Err(unsupported(entry, "Owner needs a mapping or projection")),
                };
                return generate_at(&common, program, key, None, false);
            }
        }
    }
    scalar_record(entry, program)
}

// A deferred property uses scalar-record storage even if its enclosing entry
// would normally select owner composition. Generate checks for that same storage.
pub(super) fn scalar_record(entry: &LinkedEntry, program: &Program) -> Result<String, Diagnostic> {
    generate_at(entry, program, None, None, false)
}

// Declared items expose the same borrowed record contract as lexical inputs.
// Use ordinary expression lowering without depending on their physical storage.
pub(super) fn declared_sequence(
    entry: &LinkedEntry,
    program: &Program,
    key: Option<&str>,
) -> Result<String, Diagnostic> {
    if entry.constraints.is_empty() {
        return Ok(String::new());
    }
    if entry.constraints.iter().any(|rule| {
        rule.for_each.is_some()
            || rule.diagnostic.at != LinkedDiagnosticTarget::SelfValue
            || rule
                .diagnostic
                .message
                .iter()
                .any(|part| !matches!(part, LinkedMessagePart::Text(_)))
    }) {
        return Err(unsupported(
            entry,
            "Declared-item collection constraints require a whole-value diagnostic",
        ));
    }
    generate_at(entry, program, Some(key.unwrap_or("")), None, true)
}
fn generate_at(
    entry: &LinkedEntry,
    program: &Program,
    base: Option<&str>,
    record_key: Option<&str>,
    declared: bool,
) -> Result<String, Diagnostic> {
    // Storage follows the semantic value; a projection only changes its address.
    let collection = matches!(entry.value, LinkedType::Sequence(_));
    let fields = match &entry.value {
        LinkedType::Record(fields) => fields.as_slice(),
        LinkedType::Sequence(item) => match item.as_ref() {
            LinkedType::Record(fields) => fields.as_slice(),
            LinkedType::Scalar(ScalarType::Text)
            | LinkedType::Reference(_)
            | LinkedType::BoundReference { .. } => &[],
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
        YamlRepresentation::TextPattern(_) | YamlRepresentation::Projection(_) => &[],
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
            if collection {
                LinkedForm::XmlElementSequence
            } else {
                LinkedForm::XmlRecord
            },
        ),
        (
            "yaml",
            ValidationPhase::YamlValidation,
            if collection {
                LinkedForm::YamlKeyedMapping
            } else {
                yaml_form(entry)
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
                        || (collection
                            && side == "yaml"
                            && constraint.forms.contains(&LinkedForm::YamlScalar)))
            })
            .collect();
        let function = "issues";
        writeln!(
            out,
            "fn {function}_{side}_{}(_value: &V{}, _source: &[u8], _inputs: &InputView<'_>) -> Vec<RuntimeDiagnostic> {{",
            entry.id, entry.id
        )
        .unwrap();
        if record_key.is_some() {
            out.push_str("if !_value.present {return Vec::new();}\n");
        }
        let mut item_checks = String::new();
        if !collection {
            for (index, field) in fields.iter().enumerate() {
                let codec = match super::scalar::Codec::resolve(&field.value, entry, program) {
                    Ok(codec) => Some(codec),
                    Err(_) if super::scalar::structured_reference(&field.value, program) => None,
                    Err(error) => return Err(error),
                };
                if let Some(method) = codec.and_then(|codec| codec.child_check_method()) {
                    let key = super::record::diagnostic_key(entry, &field.name);
                    let xml = side == "xml";
                    writeln!(item_checks,"if let Some(value)=&_value.f{index}{{errors.extend(value.{method}({xml},_inputs).into_iter().map(|issue|_value.positions[{index}].apply(_source,issue.field({key:?}))));}}").unwrap();
                }
            }
        }
        if !declared
            && collection
            && let Some(codec) = collection_values::codec(entry, program)?
            && let Some(method) = match codec {
                scalar::Codec::Pattern(_)
                | scalar::Codec::Forms(_)
                | scalar::Codec::Sequence(_) => Some("issues"),
                _ => codec.child_check_method(),
            }
        {
            let xml = side == "xml";
            writeln!(item_checks,"for (index,row) in _value.rows.iter().enumerate(){{errors.extend(row.fields[0].{method}({xml},_inputs).into_iter().map(|mut issue|{{issue.message=format!(\"Element {{}}: {{}}\",index+1,issue.message);_value.position.apply(_source,issue{prefix})}}));}}").unwrap();
        }
        if selected.is_empty() && item_checks.is_empty() {
            out.push_str("Vec::new() }\n");
            continue;
        }
        let storage = if !collection {
            Some(super::expressions::record_storage(entry, program, fields)?)
        } else {
            None
        };
        let mut expressions = Expressions::new(entry, program, fields, storage.as_deref());
        expressions.borrowed_sequence = declared;
        let mut body = String::new();
        for constraint in selected {
            expressions.fallible = false;
            if let Some(iteration) = &constraint.for_each {
                if !collection {
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
                let loop_open = super::expressions::iteration_loop(
                    iteration,
                    "rows",
                    &format!("v{}", iteration.slot),
                );
                writeln!(body, "let iterate = || -> core::Result<&[R{}]> {{ Ok({input}) }}; match iterate() {{ Err(error) => errors.push(error{prefix}), Ok(rows) => {{ {counter} {loop_open} {count}", entry.id).unwrap();
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
            if collection && side == "yaml" && !constraint.forms.is_empty() {
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
            if !collection {
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
            let mut input_reads = BTreeSet::new();
            for expression in std::iter::once(&constraint.assertion)
                .chain(&constraint.when)
                .chain(
                    constraint
                        .diagnostic
                        .message
                        .iter()
                        .filter_map(|part| match part {
                            LinkedMessagePart::Expression(value) => Some(value),
                            _ => None,
                        }),
                )
            {
                read_inputs(expression, &mut input_reads);
            }
            if !input_reads.is_empty() {
                when = format!("{} && ({when})", input_reads.iter().map(|slot|format!("!matches!(_inputs.slot({slot}),Some(core::inputs::InputRef::MissingValue))")).collect::<Vec<_>>().join(" && "));
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
                LinkedDiagnosticTarget::SelfValue if collection && !declared => {
                    "_value.position".into()
                }
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
    if !collection {
        let id = entry.id;
        let keys = fields
            .iter()
            .map(|field| super::record::diagnostic_key(entry, &field.name))
            .collect::<Vec<_>>();
        let address = record_key.map_or(String::new(), |key| {
            format!(".into_iter().map(|mut issue|{{issue.path.insert(0,{key:?}.into());issue}}).collect()")
        });
        writeln!(out,"fn check_xml_{id}(value:&V{id},_source:&[u8],_inputs:&InputView<'_>)->Vec<RuntimeDiagnostic> {{value.raw.diagnostics(){address}}}").unwrap();
        if matches!(entry.yaml, YamlRepresentation::TextPattern(_)) {
            writeln!(out,"fn check_yaml_{id}(value:&V{id},source:&[u8],inputs:&InputView<'_>)->Vec<RuntimeDiagnostic> {{value.raw.validate_value({},issues_yaml_{id}(value,source,inputs),issues_xml_{id}(value,source,inputs)){address}}}",fields.len()).unwrap();
        } else {
            writeln!(out,"fn check_yaml_{id}(value:&V{id},source:&[u8],inputs:&InputView<'_>)->Vec<RuntimeDiagnostic> {{value.raw.validate(&{keys:?},issues_yaml_{id}(value,source,inputs),&issues_xml_{id}(value,source,inputs)){address}}}").unwrap();
        }
    }
    Ok(out)
}

pub(super) fn read_fields(expression: &LinkedExpression, result: &mut BTreeSet<u32>) {
    read_slots(expression, &mut |kind| {
        if let LinkedExpressionKind::Field(index) = kind {
            result.insert(*index);
        }
    });
}
pub(super) fn read_inputs(expression: &LinkedExpression, result: &mut BTreeSet<u32>) {
    read_slots(expression, &mut |kind| {
        if let LinkedExpressionKind::Input(index) = kind {
            result.insert(*index);
        }
    });
}
fn read_slots(expression: &LinkedExpression, visitor: &mut dyn FnMut(&LinkedExpressionKind)) {
    match &expression.kind {
        LinkedExpressionKind::Operation {
            operator: LinkedOperator::Conditional,
            arguments,
        } if matches!(&arguments[0].kind, LinkedExpressionKind::Operation {
                operator: LinkedOperator::State(StatePredicate::Present), arguments: tested
            } if matches!(tested[0].kind, LinkedExpressionKind::Input(_) | LinkedExpressionKind::Field(_))) =>
        {
            let LinkedExpressionKind::Operation {
                arguments: tested, ..
            } = &arguments[0].kind
            else {
                unreachable!()
            };
            // The selected branch may read this value, but its absence selects
            // the other branch; it must not disable the complete constraint.
            read_slots(&arguments[1], &mut |kind| {
                if kind != &tested[0].kind {
                    visitor(kind);
                }
            });
            read_slots(&arguments[2], visitor);
        }
        LinkedExpressionKind::Operation {
            operator: LinkedOperator::State(_) | LinkedOperator::IsVariant(_),
            arguments,
        } => {
            // Direct state predicates intentionally observe absent data.
            for value in arguments {
                if !matches!(
                    value.kind,
                    LinkedExpressionKind::Field(_) | LinkedExpressionKind::Input(_)
                ) {
                    read_slots(value, visitor);
                }
            }
        }
        LinkedExpressionKind::Operation { arguments, .. } => {
            for value in arguments {
                read_slots(value, visitor);
            }
        }
        kind => visitor(kind),
    }
}

fn context_only(value: &LinkedExpression) -> bool {
    match &value.kind {
        LinkedExpressionKind::Field(_)
        | LinkedExpressionKind::SelfValue
        | LinkedExpressionKind::Capture(_) => false,
        LinkedExpressionKind::Operation { arguments, .. } => arguments.iter().all(context_only),
        _ => true,
    }
}

/// An absent item has no fields to validate, but its context and key still do.
pub(super) fn validate_absent_context(
    entry: &LinkedEntry,
    program: &Program,
) -> Result<String, Diagnostic> {
    let LinkedType::Record(fields) = &entry.value else {
        return Err(unsupported(
            entry,
            "Absent context validation requires a record",
        ));
    };
    let mut expressions = Expressions::new(entry, program, fields, None);
    let mut checks = String::new();
    for rule in &entry.constraints {
        if !rule.applies_to.contains(&ValidationPhase::YamlValidation)
            || !context_only(&rule.assertion)
            || rule.when.as_ref().is_some_and(|when| !context_only(when))
            || (!rule.forms.is_empty() && !rule.forms.contains(&LinkedForm::YamlScalar))
        {
            continue;
        }
        if rule.for_each.is_some() {
            return Err(unsupported(
                entry,
                "Absent record context iterations are not generated",
            ));
        }
        if rule.diagnostic.message.iter().any(
            |part| matches!(part, LinkedMessagePart::Expression(value) if !context_only(value)),
        ) {
            return Err(unsupported(
                entry,
                "Absent record diagnostics must use context-only messages",
            ));
        }
        let when = rule
            .when
            .as_ref()
            .map(|value| expressions.lower(value))
            .transpose()?
            .unwrap_or_else(|| "true".to_owned());
        let assertion = expressions.lower(&rule.assertion)?;
        let message = expressions.message(&rule.diagnostic.message)?;
        let condition = violation(&when, &assertion);
        let code = &rule.diagnostic.code;
        let source = &rule.diagnostic.source;
        let severity = severity_name(&rule.diagnostic.severity);
        let address = match rule.diagnostic.at {
            LinkedDiagnosticTarget::SelfValue => String::new(),
            LinkedDiagnosticTarget::Field(index) => format!(
                ".field({:?})",
                super::record::diagnostic_key(entry, &fields[index as usize].name)
            ),
            _ => {
                return Err(unsupported(
                    entry,
                    "Absent record diagnostics cannot address an occurrence",
                ));
            }
        };
        writeln!(checks,"if {condition}{{return Err(RuntimeDiagnostic::declared({code:?},{source:?},core::Severity::{severity},{message}){address});}}").unwrap();
    }
    Ok(format!(
        "let _inputs=inputs;{}{}",
        expressions.constants, checks
    ))
}

#[cfg(test)]
mod tests {
    #[test]
    fn collection_checks_keep_row_storage_without_a_property_key() {
        let modules = crate::parse_many(crate::SourceFile {
            path: "i8n-text.yaml",
            bytes: include_bytes!("../../../../declarations/common/i8n-text.yaml"),
        })
        .unwrap();
        let linked = crate::link(&modules).unwrap();
        let program = crate::plan::build(&linked).unwrap();
        let mut entry = program
            .entries
            .iter()
            .find(|entry| entry.name == "common.i8n-text")
            .unwrap()
            .clone();
        // The row rule is independent of shorthand expansion and parameters.
        entry.constraints.truncate(1);
        entry.constraints[0]
            .applies_to
            .push(nkdk_rule_model::ValidationPhase::YamlValidation);
        let entry = &entry;
        let keyed = super::generate_at(entry, &program, Some("Translations"), None, false).unwrap();
        let projected = super::generate_at(entry, &program, None, None, false).expect(
            "a collection retains row storage when its outer property key is projected away",
        );
        assert!(keyed.contains("&_value.rows"));
        assert!(projected.contains("&_value.rows"));
        assert!(projected.contains("with_occurrence(occurrence)"));
        assert!(projected.contains(&format!("fn issues_yaml_{}", entry.id)));
        assert!(!projected.contains("_value.f0"));
        assert!(!projected.contains(".field(\"Translations\")"));
        assert_eq!(keyed.replace(".field(\"Translations\")", ""), projected);
    }

    #[test]
    fn constant_constraints_do_not_emit_redundant_boolean_expressions() {
        assert_eq!(super::violation("false", "true"), "false");
        assert_eq!(super::violation("false", "false"), "false");
        assert_eq!(super::violation("true", "true"), "false");
        assert_eq!(super::violation("true", "false"), "true");
    }
}
