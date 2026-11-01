//! Capability and direct construction of semantic records, independent of formats.
use super::*;

pub(super) fn sequence_row<'a>(
    entry: &LinkedEntry,
    program: &'a Program<'_>,
) -> Option<&'a LinkedEntry> {
    let LinkedType::Sequence(item) = &entry.value else {
        return None;
    };
    if !matches!(
        attributes::content(&entry.xml).0,
        LinkedXml::ElementSequence { next: None, .. }
    ) || !matches!(
        entry.yaml,
        YamlRepresentation::Sequence { .. } | YamlRepresentation::RecordMapping { .. }
    ) {
        return None;
    }
    let (id, _, _) = item.as_reference()?;
    program.entries.iter().find(|target| target.id == id)
}

pub(super) fn choice_variants(row: &LinkedEntry) -> Option<&[LinkedField]> {
    let LinkedType::Choice(variants) = &row.value else {
        return None;
    };
    (matches!(row.yaml, YamlRepresentation::Choice { .. })
        && matches!(
            attributes::content(&row.xml).0,
            LinkedXml::Choice { fallback: Some(_) } | LinkedXml::DiscriminatedChoice(_)
        ))
    .then_some(variants)
}

pub(super) fn supported(row: &LinkedEntry, program: &Program) -> bool {
    fn visit(row: &LinkedEntry, program: &Program, seen: &mut BTreeSet<u32>) -> bool {
        if !seen.insert(row.id) {
            // A back edge does not introduce another storage backend. The
            // active ancestor still checks every field before returning true;
            // an unsupported field therefore rejects the whole reachable cycle.
            return true;
        }
        if super::collections::borrowed_records(row) {
            seen.remove(&row.id);
            return true;
        }
        if let Some(item) = sequence_row(row, program) {
            // The declared choice-item backend converts both formats but does
            // not expose direct semantic construction (choice_items::generate).
            // Do not promise a constructor that would resolve a parent's name.
            let supported = choice_variants(item).is_none() && visit(item, program, seen);
            seen.remove(&row.id);
            return supported;
        }
        if let Some(variants) = choice_variants(row) {
            let supported = variants.iter().all(|variant| {
                let Some((id, _, _)) = variant.value.as_reference() else {
                    return false;
                };
                let Some(target) = program.entries.iter().find(|entry| entry.id == id) else {
                    return false;
                };
                if scalar::Codec::resolve(&variant.value, row, program)
                    .is_ok_and(|codec| super::scalar_construction::supported(&codec))
                {
                    return true;
                }
                match &target.value {
                    LinkedType::Record(_) | LinkedType::Sequence(_) | LinkedType::Choice(_) => {
                        visit(target, program, seen)
                    }
                    _ => false,
                }
            });
            seen.remove(&row.id);
            return supported;
        }
        let LinkedType::Record(fields) = &row.value else {
            return false;
        };
        // Special record representations (for example QName) own a distinct
        // storage backend and cannot promise the ordinary record constructor.
        if !matches!(
            attributes::content(&row.xml).0,
            LinkedXml::Record(_) | LinkedXml::TextPattern(_)
        ) {
            seen.remove(&row.id);
            return false;
        }
        // Mapping and projection share the ordinary composed record storage.
        // Other representations still need their own proven constructors.
        if !matches!(
            row.yaml,
            YamlRepresentation::Mapping(_) | YamlRepresentation::Projection(_)
        ) && fields
            .iter()
            .any(|field| scalar::Codec::resolve(&field.value, row, program).is_err())
        {
            seen.remove(&row.id);
            return false;
        }
        let supported = fields.iter().all(|field| {
            if scalar::Codec::resolve(&field.value, row, program)
                .is_ok_and(|codec| super::scalar_construction::supported(&codec))
            {
                return true;
            }
            let Some((id, _, _)) = field.value.as_reference() else {
                return false;
            };
            let Some(target) = program.entries.iter().find(|entry| entry.id == id) else {
                return false;
            };
            (super::collections::borrowed_records(target)
                || sequence_row(target, program).is_some()
                || choice_variants(target).is_some()
                || (matches!(target.yaml, YamlRepresentation::Mapping(_))
                    && matches!(attributes::content(&target.xml).0, LinkedXml::Record(routes) if routes.iter().all(|route|route.file.is_none()))))
                && visit(target, program, seen)
        });
        seen.remove(&row.id);
        supported
    }
    visit(row, program, &mut BTreeSet::new())
}

// The existing YAML field contracts define the meaning of an omitted record.
pub(super) fn defaultable(row: &LinkedEntry, program: &Program) -> Result<bool, Diagnostic> {
    if !matches!(row.yaml, YamlRepresentation::Mapping(_)) {
        return Ok(false);
    }
    let LinkedType::Record(fields) = &row.value else {
        return Ok(false);
    };
    if fields
        .iter()
        .all(|field| scalar::Codec::resolve(&field.value, row, program).is_ok())
    {
        return Ok(scalar_defaults(row, fields, program));
    }
    for part in &program.composition(row)?.parts {
        if let Some(usage) = crate::plan::routes::record_usage(part, program)? {
            if !usage.yaml_missing {
                return Ok(false);
            }
            continue;
        }
        let LinkedType::Record(fields) = &part.value else {
            unreachable!()
        };
        if let [field] = fields.as_slice()
            && let Some((id, bindings, arguments)) = field.value.as_reference()
            && let Some(common) = program.entries.iter().find(|entry| entry.id == id)
            && matches!(common.value, LinkedType::Sequence(_))
        {
            let placed =
                super::collection_presence::override_for(common, part, bindings, arguments)?;
            if !placed
                .as_ref()
                .unwrap_or(common)
                .presence
                .iter()
                .any(|rule| {
                    rule.target == LinkedPresenceTarget::SelfValue && rule.yaml_missing.is_some()
                })
            {
                return Ok(false);
            }
        } else if !scalar_defaults(part, fields, program) {
            return Ok(false);
        }
    }
    Ok(true)
}

fn scalar_defaults(row: &LinkedEntry, fields: &[LinkedField], program: &Program) -> bool {
    fields.iter().enumerate().all(|(index, field)| {
        super::scalar_presence::rule(row, index, &field.value, program)
            .is_some_and(|rule| rule.yaml_missing.is_some())
    })
}

pub(super) fn composed(row: &LinkedEntry, program: &Program) -> Result<String, Diagnostic> {
    let prepared = program.composition(row)?;
    let LinkedType::Record(fields) = &row.value else {
        unreachable!()
    };
    let scope =
        super::value::InputScope::prepare(row, &prepared.parts, &prepared.captures, program)?;
    let mut ready = vec![false; prepared.parts.len()];
    let mut body = String::new();
    for &slot in scope.order(crate::plan::RepresentationSide::Yaml) {
        let part = &prepared.parts[slot];
        let LinkedType::Record(local) = &part.value else {
            unreachable!()
        };
        let indices = local.iter().map(|field| {
            fields
                .iter()
                .position(|item| item.name == field.name)
                .expect("composed field")
        });
        let slots = indices
            .map(|index| {
                let access = if index == 0 {
                    "slots.first()".into()
                } else {
                    format!("slots.get({index})")
                };
                format!("{access}.copied().flatten()")
            })
            .collect::<Vec<_>>()
            .join(",");
        let binding = scope.bind(row.id, "", Some(&ready));
        writeln!(
            body,
            "let p{slot}={{{binding}part_@id@_{slot}::construct(&[{slots}],inputs)?}};"
        )
        .unwrap();
        ready[slot] = true;
    }
    let fields = (0..prepared.parts.len())
        .map(|slot| format!("p{slot},"))
        .collect::<String>();
    Ok(format!(
        "#[allow(dead_code)] fn construct_@id@(slots:&[Option<core::inputs::InputRef<'_>>],inputs:&InputView<'_>)->core::Result<V@id@>{{{body}Ok(V@id@{{root:None,containers:[1;{}],{fields}}})}}",
        super::owner::container_slots(prepared.entry(), prepared.parts.len())
    ))
}
