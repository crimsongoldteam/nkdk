use nkdk_rule_model::*;
use std::collections::BTreeSet;

#[derive(Clone, Copy, PartialEq, Eq)]
pub(crate) enum ProjectedShape {
    Scalar,
    Sequence,
    Singleton,
}

// A projection exposes its selected field's shape. Hidden fields retain their
// inverse denotations; they do not change the YAML selector domain.
pub(crate) fn projected_shape(
    entry: &LinkedEntry,
    program: &Program,
    seen: &mut BTreeSet<u32>,
    shape: ProjectedShape,
) -> bool {
    if !seen.insert(entry.id) {
        return false;
    }
    match (&entry.value, &entry.yaml) {
        (LinkedType::Record(fields), YamlRepresentation::Projection(name)) => {
            let Some(field) = fields.iter().find(|field| field.name == *name) else {
                return false;
            };
            match &field.value {
                LinkedType::Scalar(_) | LinkedType::Enum(_) | LinkedType::ScalarChoice(_) => {
                    shape == ProjectedShape::Scalar
                }
                value => value
                    .as_reference()
                    .and_then(|(id, _, _)| program.entries.iter().find(|entry| entry.id == id))
                    .is_some_and(|entry| projected_shape(entry, program, seen, shape)),
            }
        }
        (
            _,
            YamlRepresentation::Text
            | YamlRepresentation::Decimal
            | YamlRepresentation::BooleanTable(_)
            | YamlRepresentation::EnumTable(_)
            | YamlRepresentation::TextPattern(_),
        ) => shape == ProjectedShape::Scalar,
        (_, YamlRepresentation::Sequence { singleton, .. }) => {
            shape == ProjectedShape::Sequence
                || (singleton.is_some() && shape != ProjectedShape::Sequence)
        }
        (_, YamlRepresentation::GroupedSequence(_)) => shape == ProjectedShape::Sequence,
        _ => false,
    }
}

pub(crate) fn has_singleton_shorthand(entry: &LinkedEntry, program: &Program) -> bool {
    projected_shape(
        entry,
        program,
        &mut BTreeSet::new(),
        ProjectedShape::Singleton,
    )
}

fn projected_reference<'a>(entry: &LinkedEntry, program: &'a Program) -> Option<&'a LinkedEntry> {
    let (LinkedType::Record(fields), YamlRepresentation::Projection(name)) =
        (&entry.value, &entry.yaml)
    else {
        return None;
    };
    fields
        .iter()
        .find(|field| field.name == *name)
        .and_then(|field| field.value.as_reference())
        .and_then(|(id, _, _)| program.entries.iter().find(|entry| entry.id == id))
}

// One YAML value has one semantic root mark; nested field marks do not collide.
pub(crate) fn semantic_root_tag(
    entry: &LinkedEntry,
    program: &Program,
    seen: &mut BTreeSet<u32>,
) -> bool {
    if !seen.insert(entry.id) {
        return true;
    }
    match (&entry.value, &entry.yaml) {
        (_, YamlRepresentation::States(states)) => states.iter().any(|state| state.tag.is_some()),
        (_, YamlRepresentation::Choice { variants, .. })
            if variants.iter().any(|case| {
                matches!(
                    case.form,
                    YamlChoiceForm::Tagged { .. } | YamlChoiceForm::Scalar { .. }
                )
            }) =>
        {
            true
        }
        (
            LinkedType::Sequence(item),
            YamlRepresentation::Sequence {
                item: representation,
                item_tag,
                singleton: Some(_),
                ..
            },
        ) => {
            item_tag.is_some()
                || (**representation == YamlRepresentation::Declared
                    && item
                        .as_reference()
                        .and_then(|(id, _, _)| program.entries.iter().find(|entry| entry.id == id))
                        .is_some_and(|entry| semantic_root_tag(entry, program, seen)))
        }
        (LinkedType::Record(_), YamlRepresentation::Projection(_)) => {
            projected_reference(entry, program)
                .is_some_and(|entry| semantic_root_tag(entry, program, seen))
        }
        (LinkedType::Choice(variants), _) => variants
            .iter()
            .filter_map(|field| field.value.as_reference())
            .filter_map(|(id, _, _)| program.entries.iter().find(|entry| entry.id == id))
            .any(|entry| semantic_root_tag(entry, program, &mut seen.clone())),
        _ => false,
    }
}

// A projected sequence exposes the existing compiled item writer; no field
// copying or knowledge of the common's identity is required by its caller.
pub(crate) fn declared_sequence_projection(
    entry: &LinkedEntry,
    program: &Program,
    seen: &mut BTreeSet<u32>,
) -> bool {
    if let Some(projected) = projected_reference(entry, program) {
        return seen.insert(entry.id) && declared_sequence_projection(projected, program, seen);
    }
    match (&entry.value, &entry.yaml) {
        (
            LinkedType::Sequence(item),
            YamlRepresentation::Sequence {
                item: representation,
                ..
            },
        ) if **representation == YamlRepresentation::Declared => item
            .as_reference()
            .and_then(|(id, _, _)| program.entries.iter().find(|entry| entry.id == id))
            .is_some_and(|entry| {
                matches!(entry.value, LinkedType::Record(_))
                    && crate::plan::xml_fields(&entry.xml).is_some()
            }),
        _ => false,
    }
}

// Resolve the complete projected sequence once, with cycle protection.
pub(crate) fn projected_sequence<'a>(
    entry: &'a LinkedEntry,
    program: &'a Program,
) -> Option<&'a LinkedEntry> {
    let mut current = entry;
    let mut seen = BTreeSet::new();
    loop {
        if !seen.insert(current.id) {
            return None;
        }
        if matches!(current.value, LinkedType::Sequence(_))
            && matches!(current.yaml, YamlRepresentation::Sequence { .. })
        {
            return Some(current);
        }
        current = projected_reference(current, program)?;
    }
}

// Group placeholders occupy the sequence-root domain, including alternatives
// reached through a record projection. Unbounded projection cycles are unsafe.
pub(crate) fn sequence_root(
    entry: &LinkedEntry,
    program: &Program,
    seen: &mut BTreeSet<u32>,
) -> bool {
    if !seen.insert(entry.id) {
        return true;
    }
    if let Some(projected) = projected_reference(entry, program) {
        return sequence_root(projected, program, seen);
    }
    if let LinkedType::Choice(variants) = &entry.value {
        return variants
            .iter()
            .filter_map(|variant| variant.value.as_reference())
            .filter_map(|(id, _, _)| program.entries.iter().find(|entry| entry.id == id))
            .any(|entry| sequence_root(entry, program, &mut seen.clone()));
    }
    matches!(
        entry.yaml,
        YamlRepresentation::Sequence { .. } | YamlRepresentation::GroupedSequence(_)
    )
}

// Conservative structural check: nested sequences cannot be confused with rows.
pub(crate) fn sequence_surface(
    value: &LinkedType,
    program: &Program,
    seen: &mut BTreeSet<u32>,
) -> bool {
    let Some((id, _, _)) = value.as_reference() else {
        return matches!(value, LinkedType::Sequence(_));
    };
    if !seen.insert(id) {
        return false;
    }
    let entry = program
        .entries
        .iter()
        .find(|entry| entry.id == id)
        .expect("linked reference");
    match (&entry.value, &entry.yaml) {
        (_, YamlRepresentation::Sequence { .. } | YamlRepresentation::GroupedSequence(_)) => true,
        (LinkedType::Record(fields), YamlRepresentation::Projection(name)) => fields
            .iter()
            .find(|field| field.name == *name)
            .is_some_and(|field| sequence_surface(&field.value, program, seen)),
        (LinkedType::Choice(variants), YamlRepresentation::Choice { .. }) => variants
            .iter()
            .any(|variant| sequence_surface(&variant.value, program, &mut seen.clone())),
        _ => false,
    }
}

// A declared input selector distinguishes one sequence-valued item from many rows.
pub(crate) fn sequence_profile(
    entry: &LinkedEntry,
    program: &Program,
) -> Option<(String, BTreeSet<String>)> {
    let (
        LinkedType::Choice(variants),
        YamlRepresentation::Choice {
            variants: cases, ..
        },
    ) = (&entry.value, &entry.yaml)
    else {
        return None;
    };
    let mut input = None;
    let mut values = BTreeSet::new();
    for variant in variants {
        if !sequence_surface(&variant.value, program, &mut BTreeSet::new()) {
            continue;
        }
        let mut selected = false;
        for case in cases.iter().filter(|case| case.variant == variant.name) {
            if let YamlChoiceForm::InputProfile {
                input: name,
                equals,
            } = &case.form
            {
                if input.as_ref().is_some_and(|old| old != name) {
                    return None;
                }
                input = Some(name.clone());
                // Only a sequence-only branch may consume the outer sequence as
                // one item. A mixed nested choice keeps its outer list boundary.
                if variant
                    .value
                    .as_reference()
                    .and_then(|(id, _, _)| program.entries.iter().find(|entry| entry.id == id))
                    .is_some_and(|entry| {
                        projected_shape(
                            entry,
                            program,
                            &mut BTreeSet::new(),
                            ProjectedShape::Sequence,
                        )
                    })
                {
                    values.insert(equals.clone());
                }
                selected = true;
            }
        }
        if !selected {
            return None;
        }
    }
    Some((input?, values))
}

pub(crate) fn profile_sequence_entry<'a>(
    value: &LinkedType,
    program: &'a Program,
) -> Option<&'a LinkedEntry> {
    fn visit<'a>(
        value: &LinkedType,
        program: &'a Program,
        seen: &mut BTreeSet<u32>,
    ) -> Option<&'a LinkedEntry> {
        let (id, _, _) = value.as_reference()?;
        if !seen.insert(id) {
            return None;
        }
        let entry = program.entries.iter().find(|entry| entry.id == id)?;
        if sequence_profile(entry, program).is_some() {
            return Some(entry);
        }
        if let (LinkedType::Record(fields), YamlRepresentation::Projection(name)) =
            (&entry.value, &entry.yaml)
        {
            return visit(
                &fields.iter().find(|field| field.name == *name)?.value,
                program,
                seen,
            );
        }
        None
    }
    visit(value, program, &mut BTreeSet::new())
}
