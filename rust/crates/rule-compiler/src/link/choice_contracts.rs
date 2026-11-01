use super::*;
use crate::yaml_shape::{ProjectedShape, projected_shape};

struct MappingSelectorDomain<'a> {
    source: &'a SourceLocation,
    specific: bool,
    values: Option<BTreeSet<String>>,
}

pub(super) fn validate_selectors(program: &Program) -> Result<(), Diagnostic> {
    for choice in &program.entries {
        if matches!(
            choice.yaml,
            YamlRepresentation::Sequence {
                singleton: Some(nkdk_rule_model::YamlSingleton::Value),
                ..
            }
        ) && let LinkedType::Sequence(item) = &choice.value
            && crate::yaml_shape::sequence_surface(item, program, &mut BTreeSet::new())
            && crate::yaml_shape::profile_sequence_entry(item, program).is_none()
        {
            return Err(diagnostic(
                "ambiguous_singleton",
                &choice.source,
                "An item sequence cannot also denote a list of singleton values",
            ));
        }

        if matches!(
            &choice.yaml,
            YamlRepresentation::Sequence {
                item_tag: Some(_),
                ..
            }
        ) && let LinkedType::Sequence(item) = &choice.value
            && let Some((id, _, _)) = item.as_reference()
            && let Some(target) = program.entries.iter().find(|entry| entry.id == id)
            && crate::yaml_shape::semantic_root_tag(target, program, &mut BTreeSet::new())
        {
            return Err(diagnostic(
                "sequence_item_tag_collision",
                &choice.source,
                "An item mark cannot replace another semantic root mark",
            ));
        }
        if let (LinkedType::Choice(variants), LinkedXml::DiscriminatedChoice(xml)) =
            (&choice.value, &choice.xml)
        {
            for case in xml.variants.iter().filter(|case| case.emit.is_none()) {
                let target = variants
                    .iter()
                    .find(|variant| variant.name == case.variant)
                    .and_then(|variant| variant.value.as_reference())
                    .and_then(|(id, _, _)| program.entries.iter().find(|entry| entry.id == id));
                let domain = target.and_then(|target| {
                    crate::qname_attributes::finite_domain(target, &xml.attribute, &program.entries)
                });
                if !domain.is_some_and(|domain| {
                    !domain.is_empty()
                        && domain.iter().all(|name| case.values.contains(name))
                        && case.values.iter().all(|name| domain.contains(&name))
                }) {
                    return Err(diagnostic(
                        "invalid_choice_emit",
                        &choice.source,
                        "A choice variant without emit must own exactly the selected finite QName attribute domain",
                    ));
                }
            }
        }
        let (
            LinkedType::Choice(variants),
            YamlRepresentation::Choice {
                variants: selectors,
                fallback: yaml_fallback,
            },
        ) = (&choice.value, &choice.yaml)
        else {
            validate_qname_overlap(choice)?;
            continue;
        };
        let mut sequence = None;
        let mut scalar_tags = BTreeMap::new();
        let mut scalar_input = None::<(&str, &SourceLocation)>;
        let mut scalar_input_values = BTreeMap::new();
        let mut mapping_any = None;
        let mut mappings: BTreeMap<_, Vec<MappingSelectorDomain<'_>>> = BTreeMap::new();
        for selector in selectors {
            let variant = variants
                .iter()
                .find(|variant| variant.name == selector.variant)
                .expect("choice selector names were checked while linking");
            let (target, _, _) = variant
                .value
                .as_reference()
                .expect("checked choice reference");
            let target = program
                .entries
                .iter()
                .find(|entry| entry.id == target)
                .expect("linked choice variant");
            match (&selector.form, &target.yaml) {
                (YamlChoiceForm::Sequence, _) if projected_shape(target, program, &mut BTreeSet::new(), ProjectedShape::Sequence) => {
                    if let Some(first) = sequence.replace(&selector.source) {
                        let mut error = diagnostic(
                            "choice_selector_collision",
                            &selector.source,
                            "Several choice variants select the YAML sequence form",
                        );
                        error.related.push(first.clone());
                        return Err(error);
                    }
                }
                (YamlChoiceForm::Tagged { tag }, _) | (YamlChoiceForm::Scalar { tag }, _) if matches!(&selector.form, YamlChoiceForm::Tagged { .. }) || projected_shape(target, program, &mut BTreeSet::new(), ProjectedShape::Scalar) => {
                    if tag.is_empty()
                        || !tag.chars().all(|character| {
                            character.is_alphanumeric()
                                || matches!(character, '/' | '-' | '_' | '.')
                        })
                    {
                        return Err(diagnostic(
                            "invalid_choice_selector",
                            &selector.source,
                            "A semantic choice tag must contain only letters, numbers, /, -, _ or .",
                        ));
                    }
                    if let Some(first) = scalar_tags.insert(tag, &selector.source) {
                        let mut error = diagnostic(
                            "choice_selector_collision",
                            &selector.source,
                            "Several choice variants select the same YAML semantic tag",
                        );
                        error.related.push(first.clone());
                        return Err(error);
                    }
                }
                (
                    YamlChoiceForm::ScalarInput { input, equals }
                    | YamlChoiceForm::MappingInput { input, equals }
                    | YamlChoiceForm::InputProfile { input, equals },
                    target_yaml,
                ) if matches!(&selector.form, YamlChoiceForm::InputProfile { .. })
                    || matches!((&selector.form,target_yaml), (YamlChoiceForm::MappingInput { .. }, YamlRepresentation::RecordMapping { .. } | YamlRepresentation::KeyedMapping { .. } | YamlRepresentation::Mapping(_) | YamlRepresentation::Choice { .. }))
                    || matches!((&selector.form,target_yaml), (YamlChoiceForm::ScalarInput { .. }, YamlRepresentation::Text
                        | YamlRepresentation::TextPattern(_)
                        | YamlRepresentation::EnumTable(_)
                        | YamlRepresentation::Choice { .. })) => {
                    if !choice.inputs.iter().any(|field| {
                        field.name == *input
                            && matches!(field.value, LinkedType::Scalar(ScalarType::Text))
                    }) {
                        return Err(diagnostic(
                            "invalid_choice_selector",
                            &selector.source,
                            "Choice profile requires a declared text input",
                        ));
                    }
                    if let Some((previous, source)) = scalar_input {
                        if previous != input {
                            let mut error = diagnostic(
                                "choice_selector_collision",
                                &selector.source,
                                "Choice profiles must use one input",
                            );
                            error.related.push(source.clone());
                            return Err(error);
                        }
                    } else {
                        scalar_input = Some((input, &selector.source));
                    }
                    if let Some(first) = scalar_input_values.insert(equals, &selector.source) {
                        let mut error = diagnostic(
                            "choice_selector_collision",
                            &selector.source,
                            "Several variants select the same input profile",
                        );
                        error.related.push(first.clone());
                        return Err(error);
                    }
                }
                (YamlChoiceForm::MappingAny, YamlRepresentation::Mapping(_) | YamlRepresentation::RecordMapping { .. } | YamlRepresentation::KeyedMapping { .. }) => {
                    if let Some(first) = mapping_any.replace(&selector.source) {
                        let mut error = diagnostic(
                            "choice_selector_collision",
                            &selector.source,
                            "Several choice variants select every YAML mapping",
                        );
                        error.related.push(first.clone());
                        return Err(error);
                    }
                }
                (YamlChoiceForm::Mapping { key, value }, target_yaml)
                    if match target_yaml {
                        YamlRepresentation::Mapping(_) => true,
                        YamlRepresentation::Choice { variants, .. } => variants.iter().any(|nested| {
                            matches!(&nested.form, YamlChoiceForm::Mapping { key: nested_key, value: nested_value }
                                if nested_key == key && (value.is_none() || nested_value == value))
                        }),
                        _ => false,
                    } =>
                {
                    let selector_key = (key.as_str(), value.as_deref());
                    let specific = mapping_value_is_specific(target, key, program);
                    let domain = mapping_value_domain(target, key, program);
                    let prior = mappings.entry(selector_key).or_default();
                    if let Some(first) = prior.iter().find(|first| {
                        value.is_some()
                            || match (&first.values, &domain) {
                                (Some(left), Some(right)) => !left.is_disjoint(right),
                                _ => !(specific || first.specific),
                            }
                    }) {
                        let mut error = diagnostic(
                            "choice_selector_collision",
                            &selector.source,
                            "Several choice variants have the same YAML mapping selector",
                        );
                        error.related.push(first.source.clone());
                        return Err(error);
                    }
                    prior.push(MappingSelectorDomain {
                        source: &selector.source,
                        specific: specific || domain.is_some(),
                        values: domain,
                    });
                }
                _ => {
                    return Err(diagnostic(
                        "choice_selector_shape",
                        &selector.source,
                        "YAML choice selector does not match the selected declaration shape",
                    ));
                }
            }
        }
        if let Some(source) = mapping_any
            && let Some(first) = mappings.values().flatten().next()
        {
            let mut error = diagnostic(
                "choice_selector_collision",
                source,
                "A catch-all YAML mapping selector overlaps a keyed mapping selector",
            );
            error.related.push(first.source.clone());
            return Err(error);
        }
        for variant in variants {
            let Some((target, _, _)) = variant.value.as_reference() else {
                continue;
            };
            let target = program
                .entries
                .iter()
                .find(|entry| entry.id == target)
                .expect("linked choice variant");
            if matches!(
                target.yaml,
                YamlRepresentation::Mapping(_) | YamlRepresentation::Sequence { .. }
            ) && !(matches!(target.yaml, YamlRepresentation::Mapping(_))
                && yaml_fallback.as_deref() == Some(variant.name.as_str()))
                && !selectors
                    .iter()
                    .any(|selector| selector.variant == variant.name)
            {
                return Err(diagnostic(
                    "missing_choice_selector",
                    &variant.source,
                    "A structured YAML choice variant requires a selector",
                ));
            }
        }
        validate_qname_overlap(choice)?;
    }
    Ok(())
}

fn validate_qname_overlap(choice: &LinkedEntry) -> Result<(), Diagnostic> {
    let LinkedXml::DiscriminatedChoice(xml) = &choice.xml else {
        return Ok(());
    };
    let mut names = BTreeMap::<(&str, &str), Vec<&str>>::new();
    for case in &xml.variants {
        for name in &case.values {
            names
                .entry((&name.namespace, &name.local))
                .or_default()
                .push(case.variant.as_str());
        }
    }
    for selected in names.values().filter(|selected| selected.len() > 1) {
        let YamlRepresentation::Choice { variants, .. } = &choice.yaml else {
            return Err(diagnostic(
                "ambiguous_choice_selector",
                &choice.source,
                "A QName selects more than one choice variant",
            ));
        };
        let profiles = selected
            .iter()
            .filter_map(|name| {
                variants.iter().find_map(|selector| {
                    if selector.variant != *name {
                        return None;
                    }
                    let (input, equals) = match &selector.form {
                        YamlChoiceForm::ScalarInput { input, equals }
                        | YamlChoiceForm::MappingInput { input, equals }
                        | YamlChoiceForm::InputProfile { input, equals } => (input, equals),
                        _ => return None,
                    };
                    Some((input.as_str(), equals.as_str()))
                })
            })
            .collect::<Vec<_>>();
        if profiles.len() != selected.len()
            || profiles.iter().any(|(input, _)| *input != profiles[0].0)
            || profiles
                .iter()
                .map(|(_, equals)| *equals)
                .collect::<BTreeSet<_>>()
                .len()
                != selected.len()
        {
            return Err(diagnostic(
                "ambiguous_choice_selector",
                &choice.source,
                "A QName selects more than one choice variant without distinct input profiles",
            ));
        }
    }
    Ok(())
}

fn mapping_value_domain(
    target: &LinkedEntry,
    key: &str,
    program: &Program,
) -> Option<BTreeSet<String>> {
    let referenced = mapping_selector_value(target, key, program)?;
    match &referenced.yaml {
        YamlRepresentation::EnumTable(values) => {
            Some(values.iter().map(|value| value.text.clone()).collect())
        }
        YamlRepresentation::BooleanTable(values) => {
            Some(values.iter().map(|value| value.text.clone()).collect())
        }
        _ => None,
    }
}

fn mapping_selector_value<'a>(
    target: &LinkedEntry,
    key: &str,
    program: &'a Program,
) -> Option<&'a LinkedEntry> {
    let (LinkedType::Record(fields), YamlRepresentation::Mapping(mapping)) =
        (&target.value, &target.yaml)
    else {
        return None;
    };
    let mapped = mapping.iter().find(|mapped| mapped.key == key)?;
    let field = fields.iter().find(|field| field.name == mapped.field)?;
    let LinkedType::Reference(id) = field.value else {
        return None;
    };
    program.entries.iter().find(|entry| entry.id == id)
}

fn mapping_value_is_specific(target: &LinkedEntry, key: &str, program: &Program) -> bool {
    mapping_selector_value(target, key, program).is_some_and(|referenced| {
        matches!(
            referenced.yaml,
            YamlRepresentation::TextPattern(_) | YamlRepresentation::Choice { .. }
        )
    })
}

pub(super) fn lift(entries: &mut [LinkedEntry]) -> Result<(), Diagnostic> {
    let originals = scalar_contracts::snapshot(entries);
    for owner in entries {
        for (index, field, choice) in scalar_contracts::referenced_fields(&owner.value, &originals)
        {
            let LinkedType::Choice(variants) = &choice.value else {
                continue;
            };
            if !choice.constraints.is_empty() {
                return Err(diagnostic(
                    "unsupported_choice_contract",
                    &choice.source,
                    "Choice-level constraints need variant expressions; use variant constraints in this profile",
                ));
            }
            for (variant, item) in variants.iter().enumerate() {
                let LinkedType::Reference(id) = item.value else {
                    continue;
                };
                let common = &originals[&id];
                // Structured variants validate their own nested fields when read and checked.
                // Lifting those constraints into the choice would duplicate validation and
                // lose the nested field path used by the variant's own representation.
                if matches!(common.value, LinkedType::Record(_))
                    && !matches!(common.yaml, YamlRepresentation::TextPattern(_))
                {
                    continue;
                }
                for constraint in &common.constraints {
                    if constraint.for_each.is_some()
                        || !common.inputs.is_empty()
                        || !common.parameters.is_empty()
                    {
                        return Err(diagnostic(
                            "unsupported_choice_contract",
                            &constraint.source,
                            "Text choice constraints currently require plain variant values",
                        ));
                    }
                    let mut constraint = constraint.clone();
                    constraint.id = format!("{}.{}.{}", field.name, item.name, constraint.id);
                    let project = |value: &mut LinkedExpression| {
                        crate::expressions::project_record(value, index, &common.value);
                        if matches!(common.value, LinkedType::Scalar(_)) {
                            project_scalar(value, index as u32, variant as u32);
                        } else {
                            project_fields(value, index as u32, variant as u32);
                        }
                    };
                    crate::expressions::map_constraint(&mut constraint, project);
                    let guard = LinkedExpression {
                        kind: LinkedExpressionKind::Operation {
                            operator: LinkedOperator::IsVariant(variant as u32),
                            arguments: vec![LinkedExpression {
                                kind: LinkedExpressionKind::Field(index as u32),
                                value_type: choice.value.clone(),
                                source: constraint.source.clone(),
                            }],
                        },
                        value_type: LinkedType::Scalar(ScalarType::Boolean),
                        source: constraint.source.clone(),
                    };
                    constraint.when = Some(if let Some(when) = constraint.when.take() {
                        LinkedExpression {
                            kind: LinkedExpressionKind::Operation {
                                operator: LinkedOperator::And,
                                arguments: vec![guard, when],
                            },
                            value_type: LinkedType::Scalar(ScalarType::Boolean),
                            source: constraint.source.clone(),
                        }
                    } else {
                        guard
                    });
                    constraint.diagnostic.at = match constraint.diagnostic.at {
                        LinkedDiagnosticTarget::SelfValue | LinkedDiagnosticTarget::Field(_) => {
                            LinkedDiagnosticTarget::Field(index as u32)
                        }
                        _ => {
                            return Err(diagnostic(
                                "unsupported_choice_contract",
                                &constraint.source,
                                "Text choice diagnostics must address the variant value",
                            ));
                        }
                    };
                    for form in &mut constraint.forms {
                        *form = match form {
                            LinkedForm::XmlText => LinkedForm::XmlRecord,
                            LinkedForm::YamlScalar => LinkedForm::YamlMapping,
                            _ => {
                                return Err(diagnostic(
                                    "unsupported_choice_contract",
                                    &constraint.source,
                                    "Text choice variant needs scalar forms",
                                ));
                            }
                        };
                    }
                    owner.constraints.push(constraint);
                }
            }
        }
    }
    Ok(())
}

fn project_fields(value: &mut LinkedExpression, owner: u32, variant: u32) {
    if let LinkedExpressionKind::Operation {
        operator,
        arguments,
    } = &mut value.kind
    {
        if let LinkedOperator::Get(field) = operator
            && arguments.len() == 1
            && arguments[0].kind == LinkedExpressionKind::Field(owner)
        {
            *operator = LinkedOperator::VariantField {
                variant,
                field: *field,
            };
        } else {
            for argument in arguments {
                project_fields(argument, owner, variant);
            }
        }
    }
}

fn project_scalar(value: &mut LinkedExpression, owner: u32, variant: u32) {
    if value.kind == LinkedExpressionKind::Field(owner) {
        value.kind = LinkedExpressionKind::Operation {
            operator: LinkedOperator::VariantValue(variant),
            arguments: vec![value.clone()],
        };
    } else if let LinkedExpressionKind::Operation { arguments, .. } = &mut value.kind {
        for argument in arguments {
            project_scalar(argument, owner, variant);
        }
    }
}
