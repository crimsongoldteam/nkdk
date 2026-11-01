//! Route a structured choice to the ordinary generated backend of its selected variant.
use super::*;
use std::fmt::Write;

struct Shape<'a> {
    target: &'a LinkedEntry,
    variants: &'a [LinkedField],
    xml: XmlSelection<'a>,
    yaml: &'a [YamlChoiceCase],
    yaml_fallback: Option<&'a str>,
    property: Option<&'a str>,
    hidden: bool,
    route: Vec<ExpandedName>,
    xml_hidden: bool,
}

enum XmlSelection<'a> {
    Discriminated(&'a DiscriminatedChoiceXml<ExpandedName>),
    TryFallback(&'a str),
}
impl XmlSelection<'_> {
    fn fallback(&self) -> &str {
        match self {
            Self::Discriminated(choice) => &choice.otherwise,
            Self::TryFallback(name) => name,
        }
    }
}

fn emitted_qname<'a>(selection: &XmlSelection<'a>, variant: &str) -> Option<&'a ExpandedName> {
    let XmlSelection::Discriminated(choice) = selection else {
        return None;
    };
    choice
        .variants
        .iter()
        .find(|case| case.variant == variant)
        .and_then(|case| case.emit.as_ref())
}

fn shape<'a>(child: &'a LinkedEntry, program: &'a Program<'a>) -> Option<Shape<'a>> {
    let (LinkedType::Record(fields), LinkedXml::Record(xml)) = (&child.value, &child.xml) else {
        return None;
    };
    if fields.len() != 1 {
        return None;
    }
    let field = fields.first()?;
    let property = match &child.yaml {
        YamlRepresentation::Mapping(yaml) => yaml.first().map(|field| field.key.as_str()),
        YamlRepresentation::Projection(projected) if projected == &field.name => None,
        _ => return None,
    };
    // Keep existing scalar construction on its ordinary codec path.
    if xml.is_empty() && scalar::Codec::resolve(&field.value, child, program).is_ok() {
        return None;
    }
    let (target, _, _) = composite::reference(&field.value)?;
    let target = program.entries.iter().find(|entry| entry.id == target)?;
    let (
        LinkedType::Choice(variants),
        YamlRepresentation::Choice {
            variants: selectors,
            fallback: yaml_fallback,
        },
    ) = (&target.value, &target.yaml)
    else {
        return None;
    };
    let xml_selection = match &target.xml {
        LinkedXml::DiscriminatedChoice(choice) => XmlSelection::Discriminated(choice),
        LinkedXml::Choice {
            fallback: Some(name),
        } => XmlSelection::TryFallback(name),
        _ => return None,
    };
    if selectors.is_empty()
        && (target.inputs.is_empty() || !matches!(xml_selection, XmlSelection::TryFallback(_)))
    {
        return None;
    }
    Some(Shape {
        target,
        variants,
        xml: xml_selection,
        yaml: selectors,
        yaml_fallback: yaml_fallback.as_deref(),
        property,
        hidden: matches!(&child.yaml, YamlRepresentation::Mapping(fields) if fields.is_empty()),
        route: xml
            .first()
            .map(|field| field.path.clone())
            .unwrap_or_else(|| {
                vec![ExpandedName {
                    namespace: String::new(),
                    local: "__declarative_virtual__".into(),
                }]
            }),
        xml_hidden: xml.is_empty(),
    })
}

pub(super) fn applies(child: &LinkedEntry, program: &Program) -> bool {
    shape(child, program).is_some()
}

fn selected_literal_profile(child: &LinkedEntry, shape: &Shape<'_>) -> Option<usize> {
    let LinkedType::Record(fields) = &child.value else {
        return None;
    };
    let (_, bindings, _) = composite::reference(&fields.first()?.value)?;
    let profiles = shape
        .yaml
        .iter()
        .filter_map(|case| match &case.form {
            YamlChoiceForm::ScalarInput { input, equals }
            | YamlChoiceForm::MappingInput { input, equals }
            | YamlChoiceForm::InputProfile { input, equals } => {
                Some((case.variant.as_str(), input, equals))
            }
            _ => None,
        })
        .collect::<Vec<_>>();
    let (_, input, _) = profiles.first()?;
    let slot = shape
        .target
        .inputs
        .iter()
        .position(|field| field.name == **input)?;
    let binding = bindings
        .iter()
        .find(|binding| binding.slot as usize == slot)?;
    let LinkedExpressionKind::Literal(ScalarLiteral::Text(value)) = &binding.value.kind else {
        return None;
    };
    let selected = profiles
        .iter()
        .find(|(_, profile_input, equals)| *profile_input == *input && *equals == value)?
        .0;
    shape
        .variants
        .iter()
        .position(|field| field.name == selected)
}

fn profile_input_expression(
    child: &LinkedEntry,
    shape: &Shape<'_>,
    program: &Program,
) -> Result<Option<String>, Diagnostic> {
    let Some(input) = shape.yaml.iter().find_map(|case| match &case.form {
        YamlChoiceForm::ScalarInput { input, .. }
        | YamlChoiceForm::MappingInput { input, .. }
        | YamlChoiceForm::InputProfile { input, .. } => Some(input),
        _ => None,
    }) else {
        return Ok(None);
    };
    let Some(slot) = shape
        .target
        .inputs
        .iter()
        .position(|field| field.name == *input)
    else {
        return Ok(None);
    };
    let LinkedType::Record(fields) = &child.value else {
        return Ok(None);
    };
    let Some(field) = fields.first() else {
        return Ok(None);
    };
    let Some((_, bindings, _)) = composite::reference(&field.value) else {
        return Ok(None);
    };
    let expression = bindings
        .iter()
        .find(|binding| binding.slot as usize == slot)
        .map(|binding| &binding.value);
    let code = match expression {
        Some(expression) => {
            let mut expressions = expressions::Expressions::new(child, program, &[], None);
            let text = expressions.comparison_text(expression)?;
            format!("{{let _inputs=inputs;{}{text}}}", expressions.constants)
        }
        None => format!("inputs.text({slot})?"),
    };
    Ok(Some(code))
}

fn target<'a>(field: &LinkedField, program: &'a Program<'a>) -> &'a LinkedEntry {
    let (id, _, _) = composite::reference(&field.value).expect("linked choice variant");
    program
        .entries
        .iter()
        .find(|entry| entry.id == id)
        .expect("linked choice target")
}

pub(super) fn borrowed_input(module: &str, value: &str) -> String {
    format!("{module}::choice_input(&{value})")
}

// A mapping shorthand must not select a different declared text fallback.
fn expanded_mapping(shape: &Shape<'_>, variant: usize, program: &Program) -> bool {
    let field = &shape.variants[variant];
    if !super::collections::borrowed_records(target(field, program))
        || !shape.yaml.iter().any(|case| {
            case.variant == field.name && matches!(case.form, YamlChoiceForm::MappingAny)
        })
    {
        return false;
    }
    let YamlRepresentation::Choice {
        fallback: Some(fallback),
        ..
    } = &shape.target.yaml
    else {
        return false;
    };
    shape
        .variants
        .iter()
        .find(|field| &field.name == fallback)
        .is_some_and(|fallback| {
            fallback.name != field.name
                && matches!(target(fallback, program).yaml, YamlRepresentation::Text)
        })
}

fn finite_yaml_scalar_literals(
    entry: &LinkedEntry,
    program: &Program,
    depth: usize,
) -> Option<Vec<String>> {
    if depth > 8 {
        return None;
    }
    match (&entry.value, &entry.yaml) {
        (LinkedType::Enum(_), YamlRepresentation::EnumTable(values)) => {
            Some(values.iter().map(|value| value.text.clone()).collect())
        }
        (LinkedType::Scalar(ScalarType::Boolean), YamlRepresentation::BooleanTable(values)) => {
            Some(values.iter().map(|value| value.text.clone()).collect())
        }
        (LinkedType::Record(fields), YamlRepresentation::Projection(projected)) => {
            let field = fields.iter().find(|field| &field.name == projected)?;
            let (id, _, _) = composite::reference(&field.value)?;
            let target = program.entries.iter().find(|entry| entry.id == id)?;
            finite_yaml_scalar_literals(target, program, depth + 1)
        }
        _ => None,
    }
}

fn accepts_discriminator(
    entry: &LinkedEntry,
    attribute: &ExpandedName,
    expected: &ExpandedName,
    program: &Program,
    depth: usize,
) -> bool {
    if crate::qname_attributes::finite_domain(entry, attribute, &program.entries)
        .is_some_and(|domain| domain.contains(&expected))
    {
        return true;
    }
    if depth > 16 {
        return false;
    }
    if attributes::content(&entry.xml).1.into_iter().any(|declared| {
        declared.name == *attribute
            && matches!(&declared.value, LinkedXmlAttributeValue::QName(value) if value == expected)
    }) {
        return true;
    }
    if let LinkedXml::DiscriminatedChoice(choice) = &entry.xml {
        return choice.attribute == *attribute
            && choice
                .variants
                .iter()
                .any(|case| case.emit.as_ref() == Some(expected));
    }
    let LinkedXml::Record(fields) = attributes::content(&entry.xml).0 else {
        return false;
    };
    let LinkedType::Record(values) = &entry.value else {
        return false;
    };
    fields
        .iter()
        .filter(|field| field.path.is_empty() && field.attribute.is_none())
        .any(|field| {
            values
                .iter()
                .find(|value| value.name == field.field)
                .and_then(|value| composite::reference(&value.value))
                .and_then(|(id, _, _)| program.entries.iter().find(|entry| entry.id == id))
                .is_some_and(|nested| {
                    accepts_discriminator(nested, attribute, expected, program, depth + 1)
                })
        })
}

fn allows_absence(child: &LinkedEntry, empty: Option<EmptyKind>) -> bool {
    child.presence.iter().any(|presence| {
        presence.target == LinkedPresenceTarget::Field(0)
            && presence
                .yaml_missing
                .as_ref()
                .is_some_and(|value| matches!(value.kind, LinkedExpressionKind::Absent))
            && empty
                .as_ref()
                .is_none_or(|kind| scalar_presence::yaml_empty(Some(presence), kind.clone()))
    })
}

fn matches_default_omission(
    expression: &LinkedExpression,
    variant: u32,
    literal: &LinkedExpression,
) -> bool {
    // An empty semantic record has only one value within its variant.
    if matches!(&literal.kind, LinkedExpressionKind::Operation { operator: LinkedOperator::Record(names), arguments } if names.is_empty() && arguments.is_empty())
        && matches!(&expression.kind, LinkedExpressionKind::Operation { operator: LinkedOperator::IsVariant(selected), arguments } if *selected == variant && matches!(arguments.as_slice(), [LinkedExpression {kind: LinkedExpressionKind::Field(0), ..}]))
    {
        return true;
    }
    if let LinkedExpressionKind::Operation {
        operator: LinkedOperator::Equal,
        arguments,
    } = &expression.kind
        && let [left, right] = arguments.as_slice()
        && matches!(left.kind, LinkedExpressionKind::Field(0))
        && let LinkedExpressionKind::Operation {
            operator: LinkedOperator::ConstructVariant(index),
            arguments,
        } = &right.kind
        && *index == variant
        && arguments.len() == 1
        && arguments[0].equivalent_to(literal)
    {
        return true;
    }
    let LinkedExpressionKind::Operation {
        operator: LinkedOperator::And,
        arguments,
    } = &expression.kind
    else {
        return false;
    };
    if arguments.len() != 2 {
        return false;
    }
    let LinkedExpressionKind::Operation {
        operator: LinkedOperator::IsVariant(selected),
        arguments: guard,
    } = &arguments[0].kind
    else {
        return false;
    };
    if *selected != variant
        || !matches!(
            guard.as_slice(),
            [LinkedExpression {
                kind: LinkedExpressionKind::Field(0),
                ..
            }]
        )
    {
        return false;
    }
    let LinkedExpressionKind::Operation {
        operator: LinkedOperator::Equal,
        arguments: pair,
    } = &arguments[1].kind
    else {
        return false;
    };
    let [left, right] = pair.as_slice() else {
        return false;
    };
    matches!(&left.kind, LinkedExpressionKind::Operation { operator: LinkedOperator::VariantValue(selected), arguments } if *selected == variant && matches!(arguments.as_slice(), [LinkedExpression { kind: LinkedExpressionKind::Field(0), .. }]))
        && right.equivalent_to(literal)
}

struct ConstructedMissing {
    code: String,
    omission: Option<String>,
}

fn never_omit(expression: &LinkedExpression) -> bool {
    matches!(
        expression.kind,
        LinkedExpressionKind::Literal(ScalarLiteral::Boolean(false))
    )
}

// Distribute conditions outside a chain of variant constructors. Borrowed
// payload views then remain alive until their ordinary constructor consumes them.
fn conditional_variant(value: &LinkedExpression) -> Option<LinkedExpression> {
    let LinkedExpressionKind::Operation {
        operator: LinkedOperator::ConstructVariant(index),
        arguments,
    } = &value.kind
    else {
        return None;
    };
    let payload = arguments.first()?;
    let lifted = conditional_variant(payload);
    let payload = lifted.as_ref().unwrap_or(payload);
    let LinkedExpressionKind::Operation {
        operator: LinkedOperator::Conditional,
        arguments,
    } = &payload.kind
    else {
        return None;
    };
    let [condition, yes, no] = arguments.as_slice() else {
        return None;
    };
    let wrap = |payload: &LinkedExpression| {
        let mut branch = value.clone();
        branch.kind = LinkedExpressionKind::Operation {
            operator: LinkedOperator::ConstructVariant(*index),
            arguments: vec![payload.clone()],
        };
        branch
    };
    let mut result = value.clone();
    result.kind = LinkedExpressionKind::Operation {
        operator: LinkedOperator::Conditional,
        arguments: vec![condition.clone(), wrap(yes), wrap(no)],
    };
    Some(result)
}

fn constructed_missing_expression(
    expression: &LinkedExpression,
    omission: Option<&LinkedExpression>,
    child: &LinkedEntry,
    shape: &Shape<'_>,
    program: &Program,
    id: u32,
) -> Result<ConstructedMissing, Diagnostic> {
    if let Some(lifted) = conditional_variant(expression) {
        return constructed_missing_expression(&lifted, omission, child, shape, program, id);
    }
    if let LinkedExpressionKind::Operation {
        operator: LinkedOperator::Conditional,
        arguments,
    } = &expression.kind
    {
        let [condition, yes, no] = arguments.as_slice() else {
            return Err(unsupported(child, "Invalid conditional choice default"));
        };
        let LinkedType::Record(fields) = &child.value else {
            unreachable!("choice owner")
        };
        let mut context = expressions::Expressions::new(child, program, fields, None);
        let predicate = context.lower(condition)?;
        if !context.transforms.is_empty() {
            return Err(unsupported(
                child,
                "Choice default condition needs a generated transform",
            ));
        }
        let constants = context.constants;
        let branch_omissions = omission.and_then(|expression| {
            let LinkedExpressionKind::Operation {
                operator: LinkedOperator::Conditional,
                arguments,
            } = &expression.kind
            else {
                return None;
            };
            let [guard, yes, no] = arguments.as_slice() else {
                return None;
            };
            guard.equivalent_to(condition).then_some((yes, no))
        });
        if omission.is_some_and(|value| !never_omit(value)) && branch_omissions.is_none() {
            return Err(unsupported(
                child,
                "Choice omission condition cannot be generated",
            ));
        }
        let yes = constructed_missing_expression(
            yes,
            branch_omissions.map(|pair| pair.0),
            child,
            shape,
            program,
            id,
        )?;
        let no = constructed_missing_expression(
            no,
            branch_omissions.map(|pair| pair.1),
            child,
            shape,
            program,
            id,
        )?;
        let omit_code = (branch_omissions.is_some()
            || yes.omission.is_some()
            || no.omission.is_some())
        .then(|| {
            let yes = yes.omission.as_deref().unwrap_or("false");
            let no = no.omission.as_deref().unwrap_or("false");
            format!("{{let _inputs=inputs;{constants}if {predicate} {{{yes}}} else {{{no}}}}}")
        });
        return Ok(ConstructedMissing {
            code: format!(
                "{{let _inputs=inputs;{constants}if {predicate} {{{}}} else {{{}}}}}",
                yes.code, no.code
            ),
            omission: omit_code,
        });
    }
    if matches!(expression.kind, LinkedExpressionKind::Absent) {
        let absent_omit = omission.is_some_and(|value| matches!(&value.kind,
            LinkedExpressionKind::Operation { operator: LinkedOperator::Equal, arguments }
            if matches!(arguments.as_slice(), [LinkedExpression {kind: LinkedExpressionKind::Field(0), ..}, LinkedExpression {kind: LinkedExpressionKind::Absent, ..}])));
        if omission.is_some_and(|value| !never_omit(value)) && !absent_omit {
            return Err(unsupported(
                child,
                "Absent choice default cannot satisfy the omission condition",
            ));
        }
        let fallback = shape
            .variants
            .iter()
            .position(|field| field.name == shape.xml.fallback())
            .ok_or_else(|| unsupported(child, "Absent choice default requires a fallback"))?;
        return Ok(ConstructedMissing {
            code: absent_choice_value(child, shape, program, id, fallback),
            omission: absent_omit.then(|| "!semantic_present(value) && !has_raw(value)".into()),
        });
    }
    if let LinkedExpressionKind::Operation {
        operator: LinkedOperator::ParseYaml,
        arguments,
    } = &expression.kind
        && arguments.len() == 1
    {
        if omission.is_some_and(|value| !never_omit(value)) {
            return Err(unsupported(
                child,
                "Parsed YAML default uses inferred equality for omission",
            ));
        }
        let LinkedType::Record(fields) = &child.value else {
            unreachable!("choice owner")
        };
        let mut context = expressions::Expressions::new(child, program, fields, None);
        let lexical = context.lower(&arguments[0])?;
        if !context.transforms.is_empty() {
            return Err(unsupported(
                child,
                "Parsed YAML default requires a generated transform",
            ));
        }
        let constants = context.constants;
        let document = shape.property.map_or_else(
            || format!("core::yaml::scalar(std::convert::AsRef::<str>::as_ref(&({lexical})))"),
            |property| {
                format!("format!(\"{{}}: {{}}\",{property:?},core::yaml::scalar(std::convert::AsRef::<str>::as_ref(&({lexical}))))")
            },
        );
        let parse = format!(
            "{{let _inputs=inputs;{constants}let document={document};read_yaml_document(document.as_bytes(),inputs)}}"
        );
        let comparisons = (0..shape.variants.len()).map(|variant| format!(
            "(Stored::V{variant}(actual),Stored::V{variant}(default)) if !variant_{id}_{variant}::has_raw(actual)=>{{let mut left=String::new();let mut right=String::new();variant_{id}_{variant}::write_yaml(actual,inputs,&mut left)?;variant_{id}_{variant}::write_yaml(default,inputs,&mut right)?;left==right}},"
        )).collect::<String>();
        return Ok(ConstructedMissing {
            code: parse.clone(),
            omission: Some(format!(
                "{{let expected={parse}?;match(value,&expected){{{comparisons}_=>false,}}}}"
            )),
        });
    }
    if matches!(expression.value_type, LinkedType::Choice(_))
        && matches!(
            expression.kind,
            LinkedExpressionKind::Input(_)
                | LinkedExpressionKind::Operation {
                    operator: LinkedOperator::VariantValue(_),
                    ..
                }
        )
        && omission.is_none_or(never_omit)
    {
        if !super::record_construction::supported(shape.target, program) {
            return Err(unsupported(
                child,
                "Choice projection requires semantic constructors for all selected variants",
            ));
        }
        let (constants, payload) = expressions::expression(child, program, expression)?;
        return Ok(ConstructedMissing {
            code: format!(
                "{{let _inputs=inputs;{constants}let payload={payload};construct(&[Some(payload)],inputs)}}"
            ),
            omission: None,
        });
    }
    let LinkedExpressionKind::Operation {
        operator: LinkedOperator::ConstructVariant(index),
        arguments,
    } = &expression.kind
    else {
        return Err(unsupported(
            child,
            "Choice default requires a typed variant",
        ));
    };
    let selected = &shape.variants[*index as usize];
    let variant = *index as usize;
    let target = target(selected, program);
    if matches!(target.value, LinkedType::Choice(_))
        && super::record_construction::supported(target, program)
        && omission.is_none_or(never_omit)
    {
        let mut code = String::from("{let _inputs=inputs;");
        let slot = super::declared_construction::choice_slot(
            &arguments[0],
            child,
            target,
            program,
            &mut code,
            "default_choice",
        )?;
        write!(
            code,
            "variant_{id}_{variant}::construct(&[{slot}],inputs).map(Stored::V{variant})}}"
        )
        .unwrap();
        return Ok(ConstructedMissing {
            code,
            omission: None,
        });
    }
    if matches!(
        target.yaml,
        YamlRepresentation::Mapping(_) | YamlRepresentation::Projection(_)
    ) && matches!(
        arguments[0].kind,
        LinkedExpressionKind::Operation {
            operator: LinkedOperator::Record(_),
            ..
        }
    ) && super::record_construction::supported(target, program)
        && omission.is_none_or(never_omit)
    {
        let mut code = String::from("{let _inputs=inputs;");
        let slots = super::declared_construction::record_slots(
            &arguments[0],
            child,
            target,
            program,
            &mut code,
            "default_field",
        )?;
        write!(code,"let default_slots=[{}];let default_fields=core::inputs::RecordView::new(&default_slots);variant_{id}_{variant}::construct(&[Some(core::inputs::InputRef::Record(&default_fields))],inputs).map(Stored::V{variant})}}",slots.join(",")).unwrap();
        return Ok(ConstructedMissing {
            code,
            omission: None,
        });
    }
    if super::collections::borrowed_records(target) && omission.is_none_or(never_omit) {
        let mut code = String::from("{let _inputs=inputs;");
        let slot = super::declared_construction::sequence_slot(
            &arguments[0],
            child,
            target,
            program,
            &mut code,
            "default_rows",
        )?;
        write!(
            code,
            "variant_{id}_{variant}::construct(&[{slot}],inputs).map(Stored::V{variant})}}"
        )
        .unwrap();
        return Ok(ConstructedMissing {
            code,
            omission: None,
        });
    }
    if matches!(
        target.value,
        LinkedType::Scalar(_) | LinkedType::Enum(_) | LinkedType::Choice(_)
    ) && omission.is_none_or(never_omit)
        && let Ok(codec) = scalar::Codec::resolve(&selected.value, shape.target, program)
        && super::scalar_construction::supported(&codec)
        && (matches!(
            codec.input_method(),
            Some("text" | "boolean" | "decimal" | "calendar")
        ) || matches!(codec, scalar::Codec::Forms(_)))
    {
        let mut code = String::from("{let _inputs=inputs;");
        let payload = if matches!(codec, scalar::Codec::Forms(_)) {
            super::declared_construction::choice_slot(
                &arguments[0],
                child,
                target,
                program,
                &mut code,
                "payload",
            )?
        } else {
            super::declared_construction::scalar_slot(
                &arguments[0],
                child,
                &codec,
                program,
                &mut code,
                "payload",
            )?
        };
        write!(
            code,
            "variant_{id}_{variant}::construct(&[{payload}],inputs).map(Stored::V{variant})}}"
        )
        .unwrap();
        return Ok(ConstructedMissing {
            code,
            omission: None,
        });
    }
    let record_default =
        super::choice_defaults::projected_record(child, target, &arguments[0], program)?;
    let (literal, comparison) = if let Some((literal, comparison)) = &record_default {
        (
            literal.clone(),
            comparison.replace(
                "input_field(selected,0)",
                &format!("variant_{id}_{variant}::input_field(selected,0)"),
            ),
        )
    } else {
        match (&target.yaml, &arguments[0].kind) {
            (
                YamlRepresentation::Decimal,
                LinkedExpressionKind::Literal(ScalarLiteral::Number(value)),
            ) => {
                let number = nkdk_decimal::Decimal::parse(value)
                    .map_err(|_| unsupported(child, "Invalid decimal choice default"))?;
                let (negative, digits, exponent) = number.parts();
                (
                    value.clone(),
                    format!(
                        "matches!(variant_{id}_{variant}::input_field(selected,0),Some(core::inputs::InputRef::Decimal(actual)) if actual==&core::decimal::Decimal::constant({negative},{digits:?},{exponent}))"
                    ),
                )
            }
            (
                YamlRepresentation::Calendar { seconds, omit_zero },
                LinkedExpressionKind::Literal(ScalarLiteral::Text(value)),
            ) => {
                let date = nkdk_conversion_core::calendar::Value::from_xml(value)
                    .map_err(|_| unsupported(child, "Invalid calendar choice default"))?;
                (
                    date.yaml(*seconds, *omit_zero),
                    format!(
                        "variant_{id}_{variant}::calendar_field(selected,0).is_ok_and(|actual|actual==&core::calendar::Value::from_parts({:?}).expect(\"validated calendar default\"))",
                        date.parts()
                    ),
                )
            }
            (
                YamlRepresentation::BooleanTable(lexemes),
                LinkedExpressionKind::Literal(ScalarLiteral::Boolean(value)),
            ) => (
                lexemes
                    .iter()
                    .find(|lexeme| lexeme.value == *value)
                    .map(|lexeme| lexeme.text.clone())
                    .ok_or_else(|| unsupported(child, "Undeclared boolean choice default"))?,
                format!(
                    "matches!(variant_{id}_{variant}::input_field(selected,0),Some(core::inputs::InputRef::Boolean({value})))"
                ),
            ),
            (
                YamlRepresentation::Text,
                LinkedExpressionKind::Literal(ScalarLiteral::Text(value)),
            ) => (
                serde_json::to_string(value).expect("text literal is JSON-compatible"),
                format!(
                    "matches!(variant_{id}_{variant}::input_field(selected,0),Some(core::inputs::InputRef::Text(actual)) if actual=={value:?})"
                ),
            ),
            _ => {
                return Err(unsupported(
                    child,
                    &format!(
                        "Choice default for {} requires a supported semantic constructor or a declared scalar YAML form",
                        target.name
                    ),
                ));
            }
        }
    };
    let default_check = record_default.as_ref().map(|(_, _)| format!("if !({comparison}) {{return Err(RuntimeDiagnostic::new(\"declaration.default\",\"Projected YAML did not reconstruct the complete record default\"));}}" )).unwrap_or_default();
    let yaml = shape
        .property
        .map_or(literal.clone(), |property| format!("{property}: {literal}"));
    let comparison = match omission {
        Some(omit) if matches_default_omission(omit, *index, &arguments[0]) => Some(format!(
            "match value{{Stored::V{variant}(selected) if !variant_{id}_{variant}::has_raw(selected)=>{comparison},_=>false}}"
        )),
        Some(omit) if !never_omit(omit) => {
            return Err(unsupported(
                child,
                "Choice omission rule cannot be generated",
            ));
        }
        _ => None,
    };
    Ok(ConstructedMissing {
        code: format!(
            "(move ||->core::Result<Stored>{{let default=variant_{id}_{variant}::read_yaml_document({yaml:?}.as_bytes(),inputs)?;let selected=&default;{default_check}Ok(Stored::V{variant}(default))}})()"
        ),
        omission: comparison,
    })
}

fn absent_choice_value(
    child: &LinkedEntry,
    shape: &Shape<'_>,
    program: &Program,
    id: u32,
    variant: usize,
) -> String {
    // A scalar fallback has no empty mapping representation. Construct semantic
    // absence directly when its ordinary scalar constructor is available.
    let scalar = scalar::Codec::resolve(&shape.variants[variant].value, child, program)
        .is_ok_and(|codec| super::scalar_construction::supported(&codec));
    let operation = if scalar {
        "construct(&[Some(core::inputs::InputRef::MissingValue)],inputs)"
    } else if matches!(shape.xml, XmlSelection::Discriminated(_))
        && !shape.xml_hidden
        && super::presence::denotes_absent(
            child,
            LinkedPresenceTarget::Field(0),
            crate::plan::RepresentationSide::Xml,
        )
    {
        "XmlReader::new().finish(b\"\",inputs)"
    } else {
        "read_yaml_empty_mapping(inputs)"
    };
    format!("variant_{id}_{variant}::{operation}.map(Stored::V{variant})")
}

fn constructed_missing(
    child: &LinkedEntry,
    shape: &Shape<'_>,
    program: &Program,
    id: u32,
) -> Result<Option<ConstructedMissing>, Diagnostic> {
    let Some(rule) = child
        .presence
        .iter()
        .find(|rule| rule.target == LinkedPresenceTarget::Field(0))
    else {
        return Ok(None);
    };
    let Some(expression) = rule.yaml_missing.as_ref() else {
        return Ok(None);
    };
    if matches!(expression.kind, LinkedExpressionKind::Absent) {
        return Ok(None);
    }
    constructed_missing_expression(
        expression,
        rule.yaml_omit_when.as_ref(),
        child,
        shape,
        program,
        id,
    )
    .map(Some)
}

pub(super) fn emit(
    entry: &LinkedEntry,
    child: &LinkedEntry,
    program: &Program,
    id: u32,
    slot: usize,
    placement: value_adapters::Placement,
    names: &[(&str, &str)],
) -> Result<value_adapters::ValueEmission, Diagnostic> {
    emit_lifted(entry, child, program, id, slot, placement, names, None)
}

#[allow(clippy::too_many_arguments)]
pub(super) fn emit_lifted(
    entry: &LinkedEntry,
    child: &LinkedEntry,
    program: &Program,
    id: u32,
    slot: usize,
    placement: value_adapters::Placement,
    names: &[(&str, &str)],
    lifted_key: Option<&str>,
) -> Result<value_adapters::ValueEmission, Diagnostic> {
    let LinkedType::Record(fields) = &child.value else {
        unreachable!("choice owner record")
    };
    let (target_id, bindings, _) = fields[0]
        .value
        .as_reference()
        .expect("choice owner reference");
    let original = program
        .entries
        .iter()
        .find(|value| value.id == target_id)
        .expect("linked choice");
    let scoped = super::scoped_inputs::rebind(original, bindings, program)?;
    let scoped_plan = super::scoped_inputs::plan(scoped.as_ref())?;
    let program = scoped_plan.as_ref().unwrap_or(program);
    let shape = shape(child, program).expect("structured choice");
    let fallback = shape
        .variants
        .iter()
        .position(|field| field.name == shape.xml.fallback());
    let normal_fallback = shape.yaml_fallback.and(fallback);
    let mapping_fallback = shape.yaml_fallback.and_then(|name| {
        shape
            .variants
            .iter()
            .enumerate()
            .find_map(|(index, field)| {
                let (target, _, _) = field.value.as_reference()?;
                let entry = program.entries.iter().find(|entry| entry.id == target)?;
                (field.name == name && matches!(entry.yaml, YamlRepresentation::Mapping(_)))
                    .then_some(index)
            })
    });
    let choice_reader = mapping_fallback.map_or_else(
        || "core::yaml::ChoiceReader::new(SELECTORS).without_event_buffer()".to_owned(),
        |variant| format!("core::yaml::ChoiceReader::new(SELECTORS).without_event_buffer().with_mapping_fallback({variant})"),
    );

    let missing_default = constructed_missing(child, &shape, program, id)?;
    let xml_default = if shape.xml_hidden {
        child
            .presence
            .iter()
            .find(|rule| rule.target == LinkedPresenceTarget::Field(0))
            .and_then(|rule| rule.xml_missing.as_ref())
            .map(|expression| {
                constructed_missing_expression(expression, None, child, &shape, program, id)
            })
            .transpose()?
    } else {
        None
    };

    let xml_absent = super::presence::denotes_absent(
        child,
        LinkedPresenceTarget::Field(0),
        crate::plan::RepresentationSide::Xml,
    );
    let missing_xml = if xml_absent && matches!(shape.xml, XmlSelection::Discriminated(_)) {
        let LinkedXml::Record(fields) = &child.xml else {
            unreachable!()
        };
        let evidence = if let Some(attribute) = &fields[0].attribute {
            format!(
                "matches!(token,core::xml::Token::Attribute(attribute) if attribute.name.namespace=={:?}&&attribute.name.local=={:?})",
                attribute.namespace, attribute.local
            )
        } else {
            "matches!(token,core::xml::Token::Start(_))".to_owned()
        };
        let route = record::path_code(&shape.route);
        let fallback = fallback.expect("linked absent choice fallback");
        format!(
            "if !self.events.iter().any(|(path,event,_)|core::xml::matches(path,{route})&&event.visit(|token|Ok::<bool,RuntimeDiagnostic>({evidence})).unwrap_or(false)){{return variant_{id}_{fallback}::XmlReader::new().finish(source,inputs).map(Stored::V{fallback});}}"
        )
    } else {
        String::new()
    };
    let selected_profile = (missing_default.is_none())
        .then(|| selected_literal_profile(child, &shape))
        .flatten();
    let variants = (0..shape.variants.len())
        .filter(|variant| {
            selected_profile
                .is_none_or(|selected| Some(*variant) == fallback || *variant == selected)
        })
        .collect::<Vec<_>>();
    let mut nested = String::new();
    let mut variant_sizes = Vec::new();
    let mut accepts = vec![false; shape.variants.len()];
    let mut scalar_variants = vec![false; shape.variants.len()];
    for (variant, field) in shape.variants.iter().enumerate() {
        if !variants.contains(&variant) {
            continue;
        }
        let mut selected = child.clone();
        // An absent discriminator selects the fallback, so only that branch
        // retains the choice's outer absence contract. A selected branch owns
        // the meaning of its empty representation (for example ValueList).
        let scalar_variant = matches!(
            target(field, program).value,
            LinkedType::Scalar(_) | LinkedType::Enum(_) | LinkedType::ScalarChoice(_)
        );
        if missing_default.is_some() && Some(variant) == fallback {
            for rule in &mut selected.presence {
                if rule.target == LinkedPresenceTarget::Field(0) {
                    rule.yaml_missing = Some(LinkedExpression {
                        kind: LinkedExpressionKind::Absent,
                        value_type: LinkedType::Absent,
                        source: rule.source.clone(),
                    });
                    rule.yaml_omit_when = None;
                }
            }
        } else if Some(variant) != fallback || missing_default.is_some() {
            selected.presence.retain_mut(|rule| {
                if !rule
                    .yaml_omit_when
                    .iter()
                    .chain(&rule.yaml_null_when)
                    .any(has_variant_test)
                {
                    return false;
                }
                let omitted_absence = rule.yaml_omit_when.is_some()
                    && rule
                        .yaml_missing
                        .as_ref()
                        .is_some_and(|value| matches!(value.kind, LinkedExpressionKind::Absent));
                rule.xml_missing = None;
                if !omitted_absence {
                    rule.yaml_missing = None;
                    rule.canonical.clear();
                }
                rule.xml_empty.clear();
                if rule.yaml_null_when.is_none() {
                    rule.yaml_empty.clear();
                } else {
                    rule.yaml_empty
                        .retain(|empty| empty.form == EmptyKind::Null);
                }
                rule.yaml_omit_when.is_some() || rule.yaml_null_when.is_some()
            });
        }
        for rule in &mut selected.presence {
            if shape.xml_hidden {
                rule.xml_missing = None;
            }
            for expression in rule.expressions_mut() {
                specialize_variant_test(expression, variant as u32);
            }
            // The complete choice already owns omission of its constructed
            // default. Reapplying it to the selected payload would reject
            // the very value needed to reconstruct that default.
            if rule.target == LinkedPresenceTarget::Field(0)
                && missing_default
                    .as_ref()
                    .is_some_and(|default| default.omission.is_some())
            {
                rule.yaml_omit_when = None;
            }
            for condition in [&mut rule.yaml_omit_when, &mut rule.yaml_null_when] {
                if condition.as_ref().is_some_and(never_omit) {
                    *condition = None;
                }
            }
        }
        selected.presence.retain(|rule| {
            rule.xml_missing.is_some()
                || rule.yaml_missing.is_some()
                || !rule.xml_empty.is_empty()
                || !rule.yaml_empty.is_empty()
                || !rule.canonical.is_empty()
                || rule.yaml_omit_when.is_some()
                || rule.yaml_null_when.is_some()
        });
        selected.constraints.clear();
        let LinkedType::Record(fields) = &mut selected.value else {
            unreachable!()
        };
        let (_, bindings, arguments) =
            composite::reference(&fields[0].value).expect("choice owner reference");
        let mut selected_type = field.value.clone();
        if !bindings.is_empty() || !arguments.is_empty() {
            crate::link::instantiate_type(&mut selected_type, bindings, arguments)?;
        }
        fields[0].value = selected_type;
        // A hidden outer field has no YAML key. Its internal variant still
        // needs the complete payload contract for semantic construction.
        if shape.hidden {
            selected.yaml = YamlRepresentation::Projection(fields[0].name.clone());
        }
        if shape.xml_hidden {
            selected.xml = LinkedXml::Record(vec![LinkedXmlField {
                file: None,
                field: fields[0].name.clone(),
                path: shape.route.clone(),
                attribute: None,
                source: fields[0].source.clone(),
            }]);
        }
        let emitted = if applies(&selected, program) {
            value_adapters::emit_usage(entry, &selected, program, id, variant, placement, names)?
        } else {
            value_adapters::emit_standard_usage(value_adapters::UsageRequest {
                entry,
                child: &selected,
                program,
                id,
                slot: variant,
                placement,
                names,
                variant_text_fields: child
                    .constraints
                    .iter()
                    .flat_map(LinkedConstraint::expressions)
                    .any(has_variant_field),
                lifted_key,
            })?
        };
        variant_sizes.push((field.name.clone(), emitted.source.len()));
        nested.push_str(&emitted.source.replacen(
            &format!("mod part_{id}_{variant}"),
            &format!("mod variant_{id}_{variant}"),
            1,
        ));
        accepts[variant] = match &shape.xml {
            // No emit means the linker proved that the nested record owns the
            // complete finite domain; do not discard its attribute on replay.
            XmlSelection::Discriminated(choice) => emitted_qname(&shape.xml, &field.name)
                .is_none_or(|expected| {
                    accepts_discriminator(
                        target(field, program),
                        &choice.attribute,
                        expected,
                        program,
                        0,
                    )
                }),
            XmlSelection::TryFallback(_) => true,
        };
        scalar_variants[variant] = scalar_variant;
    }

    let injected_selectors = shape
        .variants
        .iter()
        .map(|field| {
            let YamlRepresentation::Mapping(fields) = &target(field, program).yaml else {
                return None;
            };
            let cases = shape
                .yaml
                .iter()
                .filter(|case| case.variant == field.name)
                .collect::<Vec<_>>();
            let [case] = cases.as_slice() else {
                return None;
            };
            let YamlChoiceForm::Mapping {
                key,
                value: Some(value),
            } = &case.form
            else {
                return None;
            };
            (!fields.iter().any(|field| field.key == *key))
                .then_some((key.as_str(), value.as_str()))
        })
        .collect::<Vec<_>>();
    let enum_members = |kind: &str| {
        variants
            .iter()
            .map(|variant| format!("V{variant}(variant_{id}_{variant}::{kind})"))
            .collect::<Vec<_>>()
            .join(",")
    };
    let mut mapping_groups: BTreeMap<&str, Vec<usize>> = BTreeMap::new();
    for case in shape.yaml {
        if let YamlChoiceForm::Mapping { key, value: None } = &case.form {
            let variant = shape
                .variants
                .iter()
                .position(|field| field.name == case.variant)
                .expect("linked YAML choice selector");
            if !variants.contains(&variant) {
                continue;
            }
            mapping_groups.entry(key).or_default().push(variant);
        }
    }
    let dynamic_groups = mapping_groups
        .iter()
        .filter(|(_, variants)| variants.len() > 1)
        .enumerate()
        .map(|(group, (key, variants))| ((*key).to_owned(), (group, variants.clone())))
        .collect::<BTreeMap<_, _>>();
    let mut emitted_dynamic = BTreeSet::new();
    let selectors = shape
        .yaml
        .iter()
        .filter_map(|case| {
            let variant = shape
                .variants
                .iter()
                .position(|field| field.name == case.variant)
                .expect("linked YAML choice selector");
            if !variants.contains(&variant) { return None; }
            match &case.form {
                YamlChoiceForm::Tagged { tag } => Some(format!("core::yaml::ChoiceSelector::Tagged{{variant:{variant},tag:{:?}}}",format!("!{tag}"))),
                YamlChoiceForm::Sequence => {
                    Some(format!("core::yaml::ChoiceSelector::Sequence{{variant:{variant}}}"))
                }
                YamlChoiceForm::Mapping { key, value: None } if dynamic_groups.contains_key(key) => {
                    let (group, _) = &dynamic_groups[key];
                    emitted_dynamic.insert(key.clone()).then(|| format!(
                        "core::yaml::ChoiceSelector::MappingDynamic{{key:{key:?},select:select_mapping_{group}}}"
                    ))
                }
                YamlChoiceForm::Mapping { key, value } => Some(format!(
                    "core::yaml::ChoiceSelector::Mapping{{variant:{variant},key:{key:?},value:{value:?}}}"
                )),
                YamlChoiceForm::MappingAny => Some(format!(
                    "core::yaml::ChoiceSelector::MappingAny{{variant:{variant}}}"
                )),
                YamlChoiceForm::Scalar { .. } | YamlChoiceForm::ScalarInput { .. } | YamlChoiceForm::MappingInput { .. } | YamlChoiceForm::InputProfile { .. } => None,
            }
        })
        .collect::<Vec<_>>()
        .join(",");
    let allows_yaml_missing_absence = allows_absence(child, None);
    let allows_null_absence = allows_absence(child, Some(EmptyKind::Null));
    let mapping_absence = if allows_absence(child, Some(EmptyKind::Mapping)) {
        Some(absent_choice_value(
            child,
            &shape,
            program,
            id,
            fallback.ok_or_else(|| {
                unsupported(
                    child,
                    "Empty mapping absence requires a construction variant",
                )
            })?,
        ))
    } else {
        None
    };

    let null_variant = if allows_null_absence {
        fallback
            .map(|variant| format!("Some({variant})"))
            .unwrap_or_else(|| "None".into())
    } else {
        "None".into()
    };
    let mut xml_cases = String::new();
    let mut xml_child_cases = String::new();
    if let XmlSelection::Discriminated(choice) = &shape.xml {
        let mut xml_names = BTreeMap::<(&str, &str), Vec<usize>>::new();
        for case in &choice.variants {
            let variant = shape
                .variants
                .iter()
                .position(|field| field.name == case.variant)
                .expect("linked XML choice selector");
            if !variants.contains(&variant) {
                continue;
            }
            for value in &case.values {
                let selected = xml_names
                    .entry((&value.namespace, &value.local))
                    .or_default();
                if !selected.contains(&variant) {
                    selected.push(variant);
                }
            }
        }
        for ((namespace, local), selected) in xml_names {
            if let [variant] = selected.as_slice() {
                writeln!(xml_cases, "({namespace:?},{local:?})=>Ok(Some({variant})),").unwrap();
                continue;
            }
            let input = profile_input_expression(child, &shape, program)?.ok_or_else(|| {
                unsupported(
                    child,
                    "Overlapping XML choices require a bound text profile",
                )
            })?;
            writeln!(xml_cases, "({namespace:?},{local:?})=>{{let profile={input};match std::convert::AsRef::<str>::as_ref(&profile){{").unwrap();
            for variant in &selected {
                let name = &shape.variants[*variant].name;
                let profile = shape
                    .yaml
                    .iter()
                    .find_map(|case| {
                        if case.variant != *name {
                            return None;
                        }
                        match &case.form {
                            YamlChoiceForm::ScalarInput { equals, .. }
                            | YamlChoiceForm::MappingInput { equals, .. }
                            | YamlChoiceForm::InputProfile { equals, .. } => Some(equals),
                            _ => None,
                        }
                    })
                    .expect("linked overlapping XML choice profile");
                writeln!(xml_cases, "{profile:?}=>Ok(Some({variant})),").unwrap();
            }
            writeln!(xml_cases, "_=>Ok(Some({})),}}}},", selected[0]).unwrap();
        }
        if shape.yaml.iter().any(|case| {
            matches!(
                case.form,
                YamlChoiceForm::Scalar { .. } | YamlChoiceForm::ScalarInput { .. }
            )
        }) {
            let mut child_routes = Vec::<(Vec<ExpandedName>, Option<usize>)>::new();
            for (variant, field) in shape.variants.iter().enumerate() {
                if !variants.contains(&variant) {
                    continue;
                }
                if let LinkedXml::ElementSequence { path, .. } =
                    attributes::content(&target(field, program).xml).0
                {
                    if path.is_empty() {
                        continue;
                    }
                    let mut child_path = shape.route.to_vec();
                    child_path.extend(path.iter().cloned());
                    if let Some((_, selected)) = child_routes
                        .iter_mut()
                        .find(|(existing, _)| existing == &child_path)
                    {
                        // A shared child path cannot select a variant; the
                        // declared QName discriminator still can.
                        *selected = None;
                    } else {
                        child_routes.push((child_path, Some(variant)));
                    }
                }
            }
            for (child_path, variant) in child_routes {
                let Some(variant) = variant else {
                    continue;
                };
                writeln!(xml_child_cases,"if core::xml::matches(path,{})&&matches!(token,core::xml::Token::Start(_)){{return Ok(Some({variant}));}}",record::path_code(&child_path)).unwrap();
            }
        }
    }
    let route = record::path_code(&shape.route);
    let (discriminator_ns, discriminator_local) = match &shape.xml {
        XmlSelection::Discriminated(choice) => (
            choice.attribute.namespace.as_str(),
            choice.attribute.local.as_str(),
        ),
        XmlSelection::TryFallback(_) => ("", ""),
    };
    let mut emitted_attributes = Vec::new();
    for (variant, field) in shape.variants.iter().enumerate() {
        if !variants.contains(&variant) {
            emitted_attributes.push("&[][..]".to_owned());
            continue;
        }
        let emit = emitted_qname(&shape.xml, &field.name);
        let code = if !accepts[variant] {
            emit.map_or_else(
                || "&[][..]".to_owned(),
                |name| format!("&[core::xml::WriteAttribute{{name:({discriminator_ns:?},{discriminator_local:?}),value:core::xml::AttributeValue::QName(({:?},{:?}))}}][..]", name.namespace, name.local),
            )
        } else {
            "&[][..]".to_owned()
        };
        emitted_attributes.push(code);
    }

    let mut out = String::new();
    writeln!(
        out,
        "#[allow(dead_code,non_upper_case_globals,private_interfaces)] pub(crate) mod part_{id}_{slot} {{ use super::*;"
    )
    .unwrap();
    out.push_str(&nested);
    for (key, (group, variants)) in &dynamic_groups {
        let cases = variants
            .iter()
            .map(|variant| (*variant, key.as_str()))
            .collect::<Vec<_>>();
        out.push_str(&text_choice::mapping_yaml_selector(
            shape.target,
            program,
            &cases,
            &format!("select_mapping_{group}"),
        )?);
    }
    let structured = shape
        .yaml
        .iter()
        .filter(|case| {
            shape
                .variants
                .iter()
                .position(|field| field.name == case.variant)
                .is_some_and(|variant| variants.contains(&variant))
        })
        .filter(|case| {
            !matches!(case.form, YamlChoiceForm::MappingAny)
                || shape
                    .variants
                    .iter()
                    .find(|field| field.name == case.variant)
                    .is_some_and(|field| {
                        let target = target(field, program);
                        matches!(target.yaml, YamlRepresentation::Mapping(_))
                            && !text_choice::record_has_plain_scalar_shorthand(target)
                    })
                || shape
                    .variants
                    .iter()
                    .position(|field| field.name == case.variant)
                    .is_some_and(|variant| expanded_mapping(&shape, variant, program))
        })
        .map(|case| case.variant.as_str())
        .collect::<BTreeSet<_>>();
    let tagged = shape
        .yaml
        .iter()
        .filter_map(|case| {
            let (YamlChoiceForm::Scalar { tag } | YamlChoiceForm::Tagged { tag }) = &case.form
            else {
                return None;
            };
            let variant = shape
                .variants
                .iter()
                .position(|field| field.name == case.variant)
                .expect("linked YAML choice selector");
            if !variants.contains(&variant) {
                return None;
            }
            Some((variant, tag.as_str()))
        })
        .collect::<Vec<_>>();
    let untagged = shape
        .variants
        .iter()
        .enumerate()
        .filter(|(index, _)| variants.contains(index))
        .filter(|(_, field)| {
            !structured.contains(field.name.as_str())
                || text_choice::record_has_plain_scalar_shorthand(target(field, program))
                || text_choice::record_scalar_literals(target(field, program))
                    .next()
                    .is_some()
                || (shape.yaml.iter().any(|case| {
                    case.variant == field.name && matches!(case.form, YamlChoiceForm::Sequence)
                }) && crate::yaml_shape::has_singleton_shorthand(
                    target(field, program),
                    program,
                ))
        })
        .map(|(index, _)| index)
        .collect::<Vec<_>>();
    if untagged.is_empty() {
        out.push_str("fn select_yaml_scalar_untagged(_value:core::yaml::Scalar,_tag:Option<String>)->core::Result<usize>{Err(RuntimeDiagnostic::new(\"yaml.choice-form\",\"No untagged scalar variant is declared\"))}\n");
    } else if let [variant] = untagged.as_slice() {
        writeln!(out,"fn select_yaml_scalar_untagged(value:core::yaml::Scalar,_tag:Option<String>)->core::Result<usize>{{let _=value;Ok({variant})}}").unwrap();
    } else {
        out.push_str(&text_choice::scalar_yaml_selector(
            shape.target,
            program,
            &structured,
            "select_yaml_scalar_untagged",
        )?);
    }
    let input_scalar_cases = shape
        .yaml
        .iter()
        .filter_map(|case| match &case.form {
            YamlChoiceForm::ScalarInput { input, equals }
            | YamlChoiceForm::InputProfile { input, equals }
                if shape
                    .variants
                    .iter()
                    .position(|field| field.name == case.variant)
                    .is_some_and(|variant| variants.contains(&variant)) =>
            {
                Some((case, input, equals))
            }
            _ => None,
        })
        .collect::<Vec<_>>();
    if !input_scalar_cases.is_empty() {
        let input_value = profile_input_expression(child, &shape, program)?
            .ok_or_else(|| unsupported(child, "Scalar selector requires a text input binding"))?;
        writeln!(out,"fn select_yaml_scalar_profiled(value:core::yaml::Scalar,tag:Option<String>,inputs:&InputView<'_>)->core::Result<usize>{{let profile={input_value};match std::convert::AsRef::<str>::as_ref(&profile){{").unwrap();
        for (case, _, equals) in input_scalar_cases {
            let variant = shape
                .variants
                .iter()
                .position(|field| field.name == case.variant)
                .expect("linked scalar selector variant");
            writeln!(out, "{equals:?}=>Ok({variant}),").unwrap();
        }
        out.push_str("_=>select_yaml_scalar_untagged(value,tag)}}\n");
    } else {
        out.push_str("fn select_yaml_scalar_profiled(value:core::yaml::Scalar,tag:Option<String>,_inputs:&InputView<'_>)->core::Result<usize>{select_yaml_scalar_untagged(value,tag)}\n");
    }
    if tagged.is_empty() {
        out.push_str("fn select_yaml_scalar(value:core::yaml::Scalar,tag:Option<String>,inputs:&InputView<'_>)->core::Result<usize>{select_yaml_scalar_profiled(value,tag,inputs)}\n");
    } else {
        out.push_str("fn select_yaml_scalar(value:core::yaml::Scalar,tag:Option<String>,inputs:&InputView<'_>)->core::Result<usize>{if let Some(tag)=tag.as_deref(){return match tag{");
        for (variant, tag) in &tagged {
            writeln!(out, "{:?}=>Ok({variant}),", format!("!{tag}")).unwrap();
        }
        out.push_str("_=>Err(RuntimeDiagnostic::new(\"yaml.choice-form\",\"Unexpected scalar choice tag\")),}}select_yaml_scalar_profiled(value,None,inputs)}\n");
    }
    let container_input_cases = shape
        .yaml
        .iter()
        .filter_map(|case| {
            let (equals, mapping_only) = match &case.form {
                YamlChoiceForm::MappingInput { equals, .. } => (equals, true),
                YamlChoiceForm::InputProfile { equals, .. } => (equals, false),
                _ => return None,
            };
            let variant = shape
                .variants
                .iter()
                .position(|field| field.name == case.variant)?;
            variants
                .contains(&variant)
                .then_some((variant, equals, mapping_only))
        })
        .collect::<Vec<_>>();
    if container_input_cases.is_empty() {
        out.push_str("fn select_yaml_container_profiled(_inputs:&InputView<'_>,_sequence:bool)->core::Result<Option<usize>>{Ok(None)}\n");
    } else {
        let input = profile_input_expression(child, &shape, program)?.ok_or_else(|| {
            unsupported(child, "Container selector requires a text input binding")
        })?;
        writeln!(out,"fn select_yaml_container_profiled(inputs:&InputView<'_>,sequence:bool)->core::Result<Option<usize>>{{let _=sequence;let profile={input};match std::convert::AsRef::<str>::as_ref(&profile){{").unwrap();
        for (variant, equals, mapping_only) in container_input_cases {
            let guard = if mapping_only { " if !sequence" } else { "" };
            writeln!(out, "{equals:?}{guard}=>Ok(Some({variant})),").unwrap();
        }
        out.push_str("_=>Ok(None),}}\n");
    }
    writeln!(
        out,
        "#[allow(private_interfaces,clippy::large_enum_variant)] pub(super) enum Stored{{{}}} #[allow(private_interfaces,clippy::large_enum_variant)] pub(super) enum Prepared{{{}}}",
        enum_members("Stored"),
        enum_members("Prepared")
    )
    .unwrap();
    writeln!(
        out,
        "const SELECTORS:&[core::yaml::ChoiceSelector]=&[{selectors}];"
    )
    .unwrap();

    // Only QName-consuming events need a retained namespace resolver. Ordinary
    // scalar choices keep their previous buffering cost and allocate no scope.
    out.push_str("fn buffered_scope(path:&[core::xml::Name],token:&core::xml::Token<'_>,scope:Option<core::xml::NamespaceScope<'_>>)->Option<core::xml::OwnedNamespaceScope>{let needed=match token{core::xml::Token::End=>qname_text(path),core::xml::Token::Attribute(attribute)=>attribute.qname.is_none()&&qname_attribute(path,&attribute.name),_=>false};if needed{scope.map(|scope|scope.to_owned())}else{None}}\n");
    if shape.xml_hidden {
        let default = xml_default.as_ref().ok_or_else(|| {
            unsupported(
                child,
                "A computed XML choice requires a missing-value expression",
            )
        })?;
        writeln!(out,"pub(super) struct XmlReader;impl XmlReader{{pub(super) fn new()->Self{{Self}} pub(super) fn consume_scoped(&mut self,_path:&[core::xml::Name],_token:&core::xml::Token<'_>,_scope:Option<core::xml::NamespaceScope<'_>>,_source:&[u8],_inputs:&InputView<'_>)->core::Result<()>{{Ok(())}} pub(super) fn finish(self,_source:&[u8],inputs:&InputView<'_>)->core::Result<Stored>{{{}}}}}",default.code).unwrap();
    } else if matches!(shape.xml, XmlSelection::Discriminated(_)) {
        out.push_str("// Keep declared values inline; boxing adds allocations per conversion.\n#[allow(clippy::large_enum_variant)] enum XmlSelected{");
        for variant in &variants {
            write!(out, "V{variant}(variant_{id}_{variant}::XmlReader),").unwrap();
        }
        out.push_str("}\npub(super) struct XmlReader{selected:Option<XmlSelected>,events:Vec<(Vec<core::xml::Name>,core::xml::BufferedToken,Option<core::xml::OwnedNamespaceScope>)>}\nimpl XmlReader{pub(super) fn new()->Self{Self{selected:None,events:Vec::new()}}\n");
        writeln!(out, "fn select(&mut self,variant:usize,source:&[u8],inputs:&InputView<'_>)->core::Result<()>{{let mut selected=match variant{{").unwrap();
        for variant in &variants {
            writeln!(
                out,
                "{variant}=>XmlSelected::V{variant}(variant_{id}_{variant}::XmlReader::new()),"
            )
            .unwrap();
        }
        out.push_str("_=>unreachable!(\"linked choice variant\")};for(path,event,scope)in std::mem::take(&mut self.events){event.visit(|token|match &mut selected{");
        for variant in &variants {
            let skip = !accepts[*variant];
            writeln!(out,"XmlSelected::V{variant}(reader)=>{{if {skip} && is_discriminator(&path,token){{Ok(())}}else{{reader.consume_scoped(&path,token,scope.as_ref().map(|scope|scope.as_scope()),source,inputs)}}}},").unwrap();
        }
        out.push_str("})?;}self.selected=Some(selected);Ok(())}\n");
        writeln!(out,"pub(super) fn consume_scoped(&mut self,path:&[core::xml::Name],token:&core::xml::Token<'_>,_scope:Option<core::xml::NamespaceScope<'_>>,source:&[u8],inputs:&InputView<'_>)->core::Result<()>{{if let Some(selected)=&mut self.selected{{return match selected{{").unwrap();
        for variant in &variants {
            writeln!(
            out,
            "XmlSelected::V{variant}(reader)=>reader.consume_scoped(path,token,_scope,source,inputs),"
        )
        .unwrap();
        }
        out.push_str("};}let selected=xml_selection(path,token,inputs)?;self.events.push((path.to_vec(),core::xml::BufferedToken::from_token(token),buffered_scope(path,token,_scope)));if let Some(variant)=selected{self.select(variant,source,inputs)?;}Ok(())}\npub(super) fn finish(mut self,source:&[u8],inputs:&InputView<'_>)->core::Result<Stored>{if self.selected.is_none(){");
        out.push_str(&missing_xml);
        if let Some(fallback) = fallback {
            writeln!(out, "self.select({fallback},source,inputs)?;").unwrap();
        } else {
            out.push_str("return Err(RuntimeDiagnostic::new(\"xml.choice\",\"Missing XML choice discriminator\"));");
        }
        out.push_str("}match self.selected.unwrap(){");
        for variant in &variants {
            writeln!(
            out,
            "XmlSelected::V{variant}(reader)=>reader.finish(source,inputs).map(Stored::V{variant}),"
        )
        .unwrap();
        }
        out.push_str("}}}\n");
        writeln!(out,"fn is_discriminator(path:&[core::xml::Name],token:&core::xml::Token<'_>)->bool{{core::xml::matches(path,{route})&&matches!(token,core::xml::Token::Attribute(attribute) if attribute.name.namespace=={discriminator_ns:?}&&attribute.name.local=={discriminator_local:?})}}").unwrap();
        writeln!(out,"fn xml_selection(path:&[core::xml::Name],token:&core::xml::Token<'_>,inputs:&InputView<'_>)->core::Result<Option<usize>>{{let _=inputs;{xml_child_cases}if !core::xml::matches(path,{route}){{return Ok(None)}}match token{{core::xml::Token::Attribute(attribute) if attribute.name.namespace=={discriminator_ns:?}&&attribute.name.local=={discriminator_local:?}=>{{let Some(name)=attribute.qname.as_ref()else{{return Err(RuntimeDiagnostic::new(\"xml.choice\",\"Choice discriminator requires QName\"))}};match(name.namespace.as_str(),name.local.as_str()){{{xml_cases}_=>Ok({fallback:?}),}}}},core::xml::Token::End=>Ok({fallback:?}),_=>Ok(None)}}}}").unwrap();
    } else {
        out.push_str("pub(super) struct XmlReader{events:Vec<(Vec<core::xml::Name>,core::xml::BufferedToken,Option<core::xml::OwnedNamespaceScope>)>}\nimpl XmlReader{pub(super) fn new()->Self{Self{events:Vec::new()}}\npub(super) fn consume_scoped(&mut self,path:&[core::xml::Name],token:&core::xml::Token<'_>,_scope:Option<core::xml::NamespaceScope<'_>>,_source:&[u8],_inputs:&InputView<'_>)->core::Result<()>{self.events.push((path.to_vec(),core::xml::BufferedToken::from_token(token),buffered_scope(path,token,_scope)));Ok(())}\npub(super) fn finish(self,source:&[u8],inputs:&InputView<'_>)->core::Result<Stored>{\n");
        out.push_str(&missing_xml);
        // Placement presence precedes alternative selection. An explicitly
        // absent empty element is not the empty value of a non-fallback branch.
        if let Some(fallback) = fallback
            && child.presence.iter().any(|rule| {
                rule.target == LinkedPresenceTarget::Field(0)
                    && rule.xml_empty.iter().any(|form| {
                        form.form == EmptyKind::Element
                            && matches!(form.denotes.kind, LinkedExpressionKind::Absent)
                    })
            })
        {
            writeln!(out,"let declared_empty=self.events.iter().any(|(path,event,_)|core::xml::matches(path,{route})&&event.visit(|token|Ok::<bool,RuntimeDiagnostic>(matches!(token,core::xml::Token::Start(_)))).unwrap_or(false))&&!self.events.iter().any(|(path,event,_)|event.visit(|token|Ok::<bool,RuntimeDiagnostic>((path.len()>({route}).len()&&matches!(token,core::xml::Token::Start(_)))||matches!(token,core::xml::Token::Attribute(_))||matches!(token,core::xml::Token::Text(text) if !text.trim().is_empty()))).unwrap_or(true));if declared_empty{{let mut reader=variant_{id}_{fallback}::XmlReader::new();for(path,event,scope)in &self.events{{event.visit(|token|reader.consume_scoped(path,token,scope.as_ref().map(|scope|scope.as_scope()),source,inputs))?;}}return reader.finish(source,inputs).map(Stored::V{fallback});}}").unwrap();
        }
        for variant in variants
            .iter()
            .copied()
            .filter(|variant| Some(*variant) != fallback)
        {
            let selected = target(&shape.variants[variant], program);
            let evidence = if let LinkedXml::Record(fields) = attributes::content(&selected.xml).0
                && let Some(first) = fields.first()
            {
                let mut path = shape.route.to_vec();
                path.extend(first.path.iter().cloned());
                if path.len() > shape.route.len() {
                    format!(
                        "self.events.iter().any(|(path,event,_)|core::xml::matches(path,{})&&event.visit(|token|Ok::<bool,RuntimeDiagnostic>(matches!(token,core::xml::Token::Start(_)))).unwrap_or(false))",
                        record::path_code(&path)
                    )
                } else {
                    "true".to_owned()
                }
            } else {
                "true".to_owned()
            };
            let annotation_fields = match (&selected.yaml, &selected.value) {
                (YamlRepresentation::Mapping(fields), LinkedType::Record(value_fields)) => fields
                    .iter()
                    .filter(|field| shape.yaml.iter().any(|case| {
                        case.variant == shape.variants[variant].name
                            && matches!(&case.form, YamlChoiceForm::Mapping { key, value: None } if *key == field.key)
                    }))
                    .filter_map(|field| value_fields.iter().position(|value| value.name == field.field))
                    .collect::<Vec<_>>(),
                _ => Vec::new(),
            };
            let annotated = annotation_fields
                .iter()
                .map(|field| {
                    format!("variant_{id}_{variant}::field_has_annotation(&value,{field})")
                })
                .collect::<Vec<_>>()
                .join("||");
            let annotated = if annotated.is_empty() {
                "false"
            } else {
                &annotated
            };
            let missing = annotation_fields.iter().filter_map(|field| {
                let (LinkedXml::Record(xml), LinkedType::Record(fields)) =
                    (attributes::content(&selected.xml).0, &selected.value) else { return None };
                let name = &fields[*field].name;
                let mapping = xml.iter().find(|mapping| mapping.field == *name && mapping.attribute.is_some())?;
                let attribute = mapping.attribute.as_ref()?;
                let mut route = shape.route.to_vec();
                route.extend(mapping.path.iter().cloned());
                let path = record::path_code(&route);
                let namespace = &attribute.namespace;
                let local = &attribute.local;
                Some(format!("(!variant_{id}_{variant}::field_present(&value,{field})&&self.events.iter().any(|(path,event,_)|core::xml::matches(path,{path})&&event.visit(|token|Ok::<bool,RuntimeDiagnostic>(matches!(token,core::xml::Token::Attribute(attribute) if attribute.name.namespace=={namespace:?}&&attribute.name.local=={local:?}))).unwrap_or(false)))"))
            }).collect::<Vec<_>>().join("||");
            let missing = if missing.is_empty() {
                "false"
            } else {
                &missing
            };
            writeln!(out,"if {evidence}{{let mut reader=variant_{id}_{variant}::XmlReader::new();let parsed=self.events.iter().try_for_each(|(path,event,scope)|event.visit(|token|reader.consume_scoped(path,token,scope.as_ref().map(|scope|scope.as_scope()),source,inputs))).and_then(|()|reader.finish(source,inputs));if let Ok(value)=parsed && !variant_{id}_{variant}::has_raw(&value)&&!({annotated})&&!({missing}){{return Ok(Stored::V{variant}(value));}}}}").unwrap();
        }
        let fallback = fallback.expect("linked fallback choice");
        writeln!(out,"let mut reader=variant_{id}_{fallback}::XmlReader::new();for(path,event,scope)in &self.events{{event.visit(|token|reader.consume_scoped(path,token,scope.as_ref().map(|scope|scope.as_scope()),source,inputs))?;}}reader.finish(source,inputs).map(Stored::V{fallback})}}}}").unwrap();
    }

    out.push_str("#[allow(clippy::large_enum_variant)] enum YamlSelected{");
    for variant in &variants {
        write!(out, "V{variant}(variant_{id}_{variant}::YamlReader),").unwrap();
    }
    out.push_str(&"}\n#[allow(clippy::large_enum_variant)] enum YamlState{Selecting{property:core::yaml::PropertyReader,choice:core::yaml::ChoiceReader,form:Option<bool>,events:Vec<(core::yaml::Node,core::Position)>},Selected(YamlSelected)}\npub(super) struct YamlReader{state:YamlState,filter:Option<core::yaml::MappingLiteralFilter>}\nimpl YamlReader{pub(super) fn new()->core::Result<Self>{Ok(Self{state:YamlState::Selecting{property:core::yaml::PropertyReader::default(),choice:core::yaml::ChoiceReader::new(SELECTORS).without_event_buffer(),form:None,events:Vec::new()},filter:None})}\n".replace("core::yaml::ChoiceReader::new(SELECTORS).without_event_buffer()",&choice_reader));
    if mapping_absence.is_some() {
        let pattern = if let Some(property) = shape.property {
            format!(
                "matches!(events,[(core::yaml::Node::MappingStart(None),_),(core::yaml::Node::Scalar(key,None),_),(core::yaml::Node::MappingStart(None),_),(core::yaml::Node::MappingEnd,_)] | [(core::yaml::Node::MappingStart(None),_),(core::yaml::Node::Scalar(key,None),_),(core::yaml::Node::MappingStart(None),_),(core::yaml::Node::MappingEnd,_),(core::yaml::Node::MappingEnd,_)] if key.lexical_text()=={property:?})"
            )
        } else {
            "matches!(events,[(core::yaml::Node::MappingStart(None),_),(core::yaml::Node::MappingEnd,_)])".into()
        };
        writeln!(out,"fn empty_mapping_absence(events:&[(core::yaml::Node,core::Position)])->bool{{{pattern}}}").unwrap();
    }
    let mapping_end = if mapping_absence.is_some() {
        "if matches!(&payload,core::yaml::Node::MappingEnd)&&Self::empty_mapping_absence(events){return Ok(())}"
    } else {
        ""
    };
    let consume_payload = shape.property.map_or_else(
        || "let payload=node;{".to_owned(),
        |property| format!("if let Some(payload)=property.consume(node,{property:?},\"yaml.choice-property\")?{{"),
    );
    let hidden = shape.hidden;
    writeln!(out,"pub(super) fn consume(&mut self,node:core::yaml::Node,position:core::Position,source:&[u8],inputs:&InputView<'_>)->core::Result<()>{{if {hidden}{{return Ok(())}}match &mut self.state{{YamlState::Selected(selected)=>{{let node=if let Some(filter)=&mut self.filter{{filter.consume(node)?}}else{{Some(node)}};let Some(node)=node else{{return Ok(())}};match selected{{").unwrap();
    for variant in &variants {
        writeln!(
            out,
            "YamlSelected::V{variant}(reader)=>reader.consume(node,position,source,inputs),"
        )
        .unwrap();
    }
    writeln!(out,"}}}},YamlState::Selecting{{property,choice,form,events}}=>{{events.push((node.clone(),position));{consume_payload}{mapping_end}let first=form.is_none();if first{{*form=Some(!matches!(payload,core::yaml::Node::Scalar(..)));}}let mapping_profile=if first&&matches!(&payload,core::yaml::Node::MappingStart(None)|core::yaml::Node::SequenceStart(None)){{select_yaml_container_profiled(inputs,matches!(&payload,core::yaml::Node::SequenceStart(_)))?}}else{{None}};let variant=if first&&{allows_null_absence}&&matches!(&payload,core::yaml::Node::Scalar(value,_) if value.is_null()){{{null_variant}}}else if let Some(profiled)=mapping_profile{{Some(profiled)}}else if first{{match payload{{core::yaml::Node::Scalar(value,tag)=>Some(select_yaml_scalar(value,tag,inputs)?),payload=>match choice.consume(payload,position)?{{core::yaml::ChoiceSelection::Selected{{variant,..}}=>Some(variant),core::yaml::ChoiceSelection::Pending=>None,}}}}}}else{{match choice.consume(payload,position)?{{core::yaml::ChoiceSelection::Selected{{variant,..}}=>Some(variant),core::yaml::ChoiceSelection::Pending=>None,}}}};if let Some(variant)=variant{{").unwrap();
    if injected_selectors.iter().all(Option::is_none) {
        out.push_str("self.filter=None;");
    } else {
        out.push_str("self.filter=match variant{");
        for (variant, selector) in injected_selectors.iter().enumerate() {
            if let Some((key, value)) = selector {
                writeln!(
                    out,
                    "{variant}=>Some(core::yaml::MappingLiteralFilter::new({},{key:?},{value:?})),",
                    if shape.property.is_some() { 2 } else { 1 }
                )
                .unwrap();
            }
        }
        out.push_str("_=>None};");
    }
    out.push_str("let mut selected=match variant{");
    for variant in &variants {
        writeln!(
            out,
            "{variant}=>YamlSelected::V{variant}(variant_{id}_{variant}::YamlReader::new()?),"
        )
        .unwrap();
    }
    out.push_str("_=>unreachable!(\"linked choice variant\")};for(node,position)in std::mem::take(events){let node=if let Some(filter)=&mut self.filter{filter.consume(node)?}else{Some(node)};let Some(node)=node else{continue};");
    if !tagged.is_empty() {
        out.push_str("let node=match node{");
        for (variant, tag) in &tagged {
            writeln!(out,"core::yaml::Node::Scalar(value,Some(actual)) if variant=={variant}&&actual=={:?}=>core::yaml::Node::Scalar(value,None),",format!("!{tag}")).unwrap();
            writeln!(out,"core::yaml::Node::MappingStart(Some(actual)) if variant=={variant}&&actual=={:?}=>core::yaml::Node::MappingStart(None),",format!("!{tag}")).unwrap();
            writeln!(out,"core::yaml::Node::SequenceStart(Some(actual)) if variant=={variant}&&actual=={:?}=>core::yaml::Node::SequenceStart(None),",format!("!{tag}")).unwrap();
        }
        out.push_str("node=>node};");
    }
    out.push_str("match &mut selected{");
    for variant in &variants {
        writeln!(
            out,
            "YamlSelected::V{variant}(reader)=>reader.consume(node,position,source,inputs)?,"
        )
        .unwrap();
    }
    out.push_str("}}self.state=YamlState::Selected(selected);}}Ok(())}}}\npub(super) fn finish(self,source:&[u8],inputs:&InputView<'_>)->core::Result<Stored>{let filter=self.filter;match self.state{YamlState::Selecting{property,choice,events,..}=>{let _=(&property,&choice,&events);");
    if let Some(absent) = &mapping_absence {
        writeln!(
            out,
            "if Self::empty_mapping_absence(&events){{return {absent};}}"
        )
        .unwrap();
    }
    if let Some(default) = &missing_default {
        let missing = if shape.property.is_some() {
            "!property.finish(\"yaml.choice-property\")?"
        } else {
            "events.is_empty()"
        };
        writeln!(out, "if {missing}{{return {};}}", default.code).unwrap();
    } else if allows_yaml_missing_absence && let Some(fallback) = fallback {
        let missing = if shape.property.is_some() {
            "!property.finish(\"yaml.choice-property\")?"
        } else {
            "events.is_empty()"
        };
        writeln!(out,"if {missing}{{let mut reader=variant_{id}_{fallback}::YamlReader::new()?;for(node,position)in events{{reader.consume(node,position,source,inputs)?;}}return reader.finish(source,inputs).map(Stored::V{fallback});}}").unwrap();
    }
    if let Some(fallback) = normal_fallback {
        writeln!(out,"let mut reader=variant_{id}_{fallback}::YamlReader::new()?;for(node,position)in events{{reader.consume(node,position,source,inputs)?;}}reader.finish(source,inputs).map(Stored::V{fallback})").unwrap();
        out.push_str("},YamlState::Selected(selected)=>{if let Some(filter)=filter{filter.finish()?;}match selected{");
    } else {
        out.push_str("choice.finish()?;unreachable!()},YamlState::Selected(selected)=>{if let Some(filter)=filter{filter.finish()?;}match selected{");
    }
    for variant in &variants {
        writeln!(out,"YamlSelected::V{variant}(reader)=>reader.finish(source,inputs).map(Stored::V{variant}),").unwrap();
    }
    out.push_str("}}}}}\n");

    let select_payload = shape.property.map_or_else(
        || "let payload=node;{".to_owned(),
        |property| format!("if let Some(payload)=property.consume(node,{property:?},\"yaml.choice-property\")?{{"),
    );
    writeln!(out,"fn yaml_selection(source:&[u8],inputs:&InputView<'_>)->core::Result<Option<usize>>{{let mut property=core::yaml::PropertyReader::default();let mut choice={choice_reader};let mut form=None;let mut selected=None;core::yaml::visit_nodes(source,|node,position|{{if selected.is_some(){{return Ok(())}}\n{select_payload}let first=form.is_none();if first{{form=Some(!matches!(payload,core::yaml::Node::Scalar(..)));}}let mapping_profile=if first&&matches!(&payload,core::yaml::Node::MappingStart(None)|core::yaml::Node::SequenceStart(None)){{select_yaml_container_profiled(inputs,matches!(&payload,core::yaml::Node::SequenceStart(_)))?}}else{{None}};selected=if first&&{allows_null_absence}&&matches!(&payload,core::yaml::Node::Scalar(value,_) if value.is_null()){{{null_variant}}}else if let Some(profiled)=mapping_profile{{Some(profiled)}}else if first{{match payload{{core::yaml::Node::Scalar(value,tag)=>Some(select_yaml_scalar(value,tag,inputs)?),payload=>match choice.consume(payload,position)?{{core::yaml::ChoiceSelection::Selected{{variant,..}}=>Some(variant),core::yaml::ChoiceSelection::Pending=>None,}}}}}}else{{match choice.consume(payload,position)?{{core::yaml::ChoiceSelection::Selected{{variant,..}}=>Some(variant),core::yaml::ChoiceSelection::Pending=>None,}}}};}}Ok(())}})?;Ok(selected)}}").unwrap();

    writeln!(out,"pub(super) fn read_xml(source:&[u8],inputs:&InputView<'_>,events:impl core::xml::ScopedSource)->core::Result<Stored>{{let mut reader=XmlReader::new();events.visit_scoped(|path,token,scope|reader.consume_scoped(path,token,Some(scope),source,inputs))?;reader.finish(source,inputs)}}").unwrap();
    writeln!(out,"pub(super) fn read_yaml(source:&[u8],inputs:&InputView<'_>,events:impl core::yaml::Source)->core::Result<Stored>{{let mut reader=YamlReader::new()?;events.visit(|node,position|reader.consume(node,position,source,inputs))?;reader.finish(source,inputs)}}").unwrap();
    if shape.property.is_none() && (allows_yaml_missing_absence || missing_default.is_some()) {
        out.push_str("pub(super) fn read_yaml_empty_mapping(inputs:&InputView<'_>)->core::Result<Stored>{YamlReader::new()?.finish(b\"\",inputs)}\n");
    } else {
        out.push_str("pub(super) fn read_yaml_empty_mapping(inputs:&InputView<'_>)->core::Result<Stored>{read_yaml(b\"\",inputs,core::yaml::EmptyMappingSource)}\n");
    }
    if !shape.xml_hidden && matches!(shape.xml, XmlSelection::Discriminated(_)) {
        writeln!(out,"pub(super) fn read_xml_document(source:&[u8],inputs:&InputView<'_>)->core::Result<Stored>{{let mut selected=None;core::xml::visit(source,|path,token|{{if selected.is_none(){{match xml_selection(path,&token,inputs){{Ok(Some(variant))=>selected=Some(variant),Ok(None)=>{{}},Err(_)=>selected={fallback:?},}}}}Ok(())}})?;match selected.or({fallback:?}){{").unwrap();
        for variant in &variants {
            writeln!(out,"Some({variant})=>variant_{id}_{variant}::read_xml_document(source,inputs).map(Stored::V{variant}),").unwrap();
        }
        out.push_str(
            "_=>Err(RuntimeDiagnostic::new(\"xml.choice\",\"Missing XML choice discriminator\")),}}\n",
        );
    } else if !shape.xml_hidden
        && let Some(fallback) = fallback
    {
        // The selected value owns preservation; a transparent outer choice
        // must reach its document reader after a data-form streaming failure.
        writeln!(out,"pub(super) fn read_xml_document(source:&[u8],inputs:&InputView<'_>)->core::Result<Stored>{{match read_xml(source,inputs,core::xml::DocumentSource(source)){{Ok(value)=>Ok(value),Err(error) if error.code.as_deref().is_some_and(|code|code.starts_with(\"xml.\")||code.starts_with(\"value.\"))=>variant_{id}_{fallback}::read_xml_document(source,inputs).map(Stored::V{fallback}),Err(error)=>Err(error)}}}}\n").unwrap();
    } else {
        out.push_str("pub(super) fn read_xml_document(source:&[u8],inputs:&InputView<'_>)->core::Result<Stored>{read_xml(source,inputs,core::xml::DocumentSource(source))}\n");
    }
    let empty_document = if missing_default.is_some() {
        "if source.is_empty(){return YamlReader::new()?.finish(source,inputs);}let document=source;"
            .to_owned()
    } else if allows_yaml_missing_absence && let Some(fallback) = fallback {
        let absent = absent_choice_value(child, &shape, program, id, fallback);
        format!("if source.is_empty(){{return {absent};}}let document=source;")
    } else {
        format!(
            "let document=if source.is_empty()&&{allows_null_absence}{{b\"null\".as_slice()}}else{{source}};"
        )
    };
    let error_selection = shape
        .property
        .and_then(|property| {
            shape.route.last().map(|xml| {
                format!(
                    "yaml_selection(document,inputs).ok().flatten().or_else(||core::raw::Property::decode(document,{property:?},{:?}).ok().flatten().and_then(|envelope|yaml_selection(&envelope.meaning,inputs).ok().flatten().or({fallback:?}))).or({normal_fallback:?})",
                    xml.local
                )
            })
        })
        .unwrap_or_else(|| format!("yaml_selection(document,inputs).ok().flatten().or({fallback:?})"));
    let opaque_envelope = if shape.xml_hidden {
        String::new()
    } else {
        let envelope = if let Some(property) = shape.property {
            let physical = &shape.route.last().expect("choice route").local;
            format!("core::raw::Property::decode(source,{property:?},{physical:?})?")
        } else {
            "core::raw::Document::decode(source)?".into()
        };
        let empty = if let Some(property) = shape.property {
            format!(
                "core::raw::record_contents(&envelope.meaning,{property:?})?.map_or(Ok(true),|meaning|core::raw::meaning_is_empty(&meaning))?"
            )
        } else {
            "envelope.meaning_is_empty()?".into()
        };
        let route = record::path_code(&shape.route);
        let parent = record::path_code(&shape.route[..shape.route.len() - 1]);
        let root = shape.route.last().expect("choice route");
        let namespace = &root.namespace;
        let local = &root.local;
        format!(
            "if let Some(envelope)={envelope} && {empty}{{let qnames=qnames();let patch=core::xml::Patch::read(&envelope.payload,&[],&qnames)?;if patch.is_replacement(){{let tree=patch.apply(None,core::xml::Name{{namespace:{namespace:?}.into(),local:{local:?}.into()}},&[],&qnames)?;let mut names=Vec::new();tree.collect_namespaces(&mut names);let parent:&[(&str,&str)]={parent};for(namespace,_)in parent{{if !namespace.is_empty()&&!names.contains(namespace){{names.push(namespace);}}}}let mut out=core::xml::Writer::new(&names);tree.write_at(&mut out,parent,&qnames)?;let xml=out.finish_with_root(({route})[0]);return read_xml_document(&xml,inputs);}}}}"
        )
    };
    writeln!(out,"pub(super) fn read_yaml_document(source:&[u8],inputs:&InputView<'_>)->core::Result<Stored>{{{empty_document}match read_yaml(document,inputs,core::yaml::DocumentSource(document)){{Ok(value)=>Ok(value),Err(error)=>{{{opaque_envelope}match {error_selection}{{").unwrap();
    for variant in &variants {
        writeln!(out,"Some({variant})=>variant_{id}_{variant}::read_yaml_document(document,inputs).map(Stored::V{variant}).or(Err(error)),").unwrap();
    }
    out.push_str("_=>Err(error),}}}}\n");

    macro_rules! delegate_value {
        ($name:literal,$args:literal,$result:literal,$call:literal) => {{
            writeln!(
                out,
                "pub(super) fn {}(value:&Stored{}){}{{match value{{",
                $name, $args, $result
            )
            .unwrap();
            for variant in &variants {
                writeln!(
                    out,
                    "Stored::V{variant}(value)=>variant_{id}_{variant}::{}(value{}),",
                    $name, $call
                )
                .unwrap();
            }
            out.push_str("}}\n");
        }};
    }
    out.push_str("pub(super) fn variant_index(value:&Stored)->usize{match value{");
    for variant in &variants {
        writeln!(out, "Stored::V{variant}(_)=>{variant},").unwrap();
    }
    out.push_str("}}\n");
    out.push_str("pub(super) fn choice_input(value:&Stored)->Option<core::inputs::InputRef<'_>>{Some(if has_raw(value){core::inputs::InputRef::Choice{variant:variant_index(value),fields:value}}else if field_is_null(value,0){core::inputs::InputRef::NullValue}else if semantic_present(value){core::inputs::InputRef::Choice{variant:variant_index(value),fields:value}}else{core::inputs::InputRef::MissingValue})}\n");
    if super::record_construction::supported(shape.target, program) {
        out.push_str("pub(super) fn construct(slots:&[Option<core::inputs::InputRef<'_>>],inputs:&InputView<'_>)->core::Result<Stored>{match slots.first().copied().flatten(){\n");
        if allows_yaml_missing_absence {
            let fallback = fallback.expect("linked absent choice fallback");
            writeln!(
                out,
                "None|Some(core::inputs::InputRef::MissingValue)=>{},",
                absent_choice_value(child, &shape, program, id, fallback)
            )
            .unwrap();
        } else {
            out.push_str("None|Some(core::inputs::InputRef::MissingValue)=>Err(RuntimeDiagnostic::new(\"input.type\",\"Semantic absence is not declared for this choice\")),\n");
        }
        if allows_null_absence {
            let fallback = fallback.expect("linked null choice fallback");
            writeln!(
                out,
                "Some(core::inputs::InputRef::NullValue)=>{},",
                absent_choice_value(child, &shape, program, id, fallback)
            )
            .unwrap();
        }
        out.push_str("Some(core::inputs::InputRef::Choice{variant,fields}|core::inputs::InputRef::PreservedChoice{variant,fields,..})=>match variant{\n");
        for variant in &variants {
            let payload = if matches!(
                target(&shape.variants[*variant], program).value,
                LinkedType::Record(_)
            ) {
                "Some(core::inputs::InputRef::Record(fields))"
            } else {
                "fields.field(0)"
            };
            writeln!(out,"{variant}=>variant_{id}_{variant}::construct(&[{payload}],inputs).map(Stored::V{variant}),").unwrap();
        }
        writeln!(out, "_=>Err(RuntimeDiagnostic::new(\"input.type\",\"Unknown semantic choice variant\"))}},_=>Err(RuntimeDiagnostic::new(\"input.type\",\"Choice construction requires a choice input\").field({:?}))}}}}", child.name).unwrap();
    }
    out.push_str("pub(super) fn input_field(value:&Stored,field:usize)->Option<core::inputs::InputRef<'_>>{match value{\n");
    for variant in &variants {
        let input = if matches!(
            target(&shape.variants[*variant], program).value,
            LinkedType::Choice(_)
        ) {
            format!("if field==0{{variant_{id}_{variant}::choice_input(value)}}else{{None}}")
        } else {
            format!("variant_{id}_{variant}::input_field(value,field)")
        };
        writeln!(out, "Stored::V{variant}(value)=>{input},").unwrap();
    }
    out.push_str("}}\n");
    out.push_str("impl core::inputs::RecordInput for Stored{fn field(&self,index:usize)->Option<core::inputs::InputRef<'_>>{match input_field(self,0){Some(core::inputs::InputRef::Record(record))=>record.field(index),_=>input_field(self,index)}}}\n");
    delegate_value!(
        "text_field",
        ",field:usize",
        "->core::Result<&str>",
        ",field"
    );
    delegate_value!("field_is_null", ",field:usize", "->bool", ",field");
    delegate_value!("field_has_annotation", ",field:usize", "->bool", ",field");
    delegate_value!("has_raw", "", "->bool", "");
    let fact_variants: BTreeSet<_> = variants
        .iter()
        .copied()
        .filter(|variant| {
            super::facts::has_contributions(target(&shape.variants[*variant], program), program)
        })
        .collect();
    if !fact_variants.is_empty() {
        out.push_str("pub(super) fn contribute(value:&Stored,direction:Direction,source:&[u8],inputs:&InputView<'_>,builder:&mut core::facts::prepared::TextFactsBuilder)->std::result::Result<(),Vec<RuntimeDiagnostic>>{match value{");
        for variant in &variants {
            if fact_variants.contains(variant) {
                writeln!(out,"Stored::V{variant}(value)=>variant_{id}_{variant}::contribute(value,direction,source,inputs,builder),").unwrap();
            } else {
                writeln!(out, "Stored::V{variant}(_)=>Ok(()),").unwrap();
            }
        }
        out.push_str("}}\n");
    }
    delegate_value!("semantic_present", "", "->bool", "");
    if let Some(comparison) = missing_default
        .as_ref()
        .and_then(|default| default.omission.as_ref())
    {
        writeln!(out,"fn omit_default(value:&Stored,inputs:&InputView<'_>)->core::Result<bool>{{Ok({comparison})}}").unwrap();
    } else {
        out.push_str("fn omit_default(_value:&Stored,_inputs:&InputView<'_>)->core::Result<bool>{Ok(false)}\n");
    }
    delegate_value!(
        "document",
        ",inputs:&InputView<'_>",
        "->core::Result<Vec<u8>>",
        ",inputs"
    );
    let selector_write = |variant: usize, indent: &str| {
        injected_selectors[variant].map_or_else(
            || (String::new(), String::new()),
            |(key, value)| {
                (
                    "let start=out.len();".into(),
                    format!("?;core::yaml::insert_mapping_literal(out,start,{indent},{:?},{key:?},{value:?})",shape.property),
                )
            },
        )
    };
    let disambiguate_scalar = |variant: usize| -> Option<String> {
        if shape.property.is_some()
            || !text_choice::record_has_plain_scalar_shorthand(target(
                &shape.variants[variant],
                program,
            ))
        {
            return None;
        }
        let key = shape.yaml.iter().find_map(|case| {
            if case.variant == shape.variants[variant].name
                && let YamlChoiceForm::Mapping { key, value: None } = &case.form
            {
                return Some(key);
            }
            None
        })?;
        let finite = shape
            .variants
            .iter()
            .enumerate()
            .filter(|(index, _)| *index != variant)
            .map(|(_, field)| finite_yaml_scalar_literals(target(field, program), program, 0))
            .collect::<Option<Vec<_>>>();
        let collision = finite.map_or_else(
            || format!("yaml_selection(candidate.as_bytes())?!=Some({variant})"),
            |values| {
                let literals = values
                    .into_iter()
                    .flatten()
                    .map(|value| {
                        format!(
                            "candidate=={:?}",
                            nkdk_conversion_core::yaml::scalar(&value)
                        )
                    })
                    .collect::<Vec<_>>();
                if literals.is_empty() {
                    "false".to_owned()
                } else {
                    literals.join("||")
                }
            },
        );
        Some(format!(
            "let candidate=out[start..].trim_start();if {collision}{{let leading=out[start..].len()-candidate.len();let prefix=out[start..start+leading].to_owned();let scalar=candidate.to_owned();out.truncate(start);out.push_str(&prefix);out.push_str(&core::yaml::scalar({key:?}));out.push_str(\": \");out.push_str(&scalar);}}"
        ))
    };
    let write_mapping_absence = if mapping_absence.is_some() && !shape.hidden {
        let text = shape.property.map_or("{}".to_owned(), |key| {
            format!("{}: {{}}", nkdk_conversion_core::yaml::scalar(key))
        });
        format!(
            "if !semantic_present(value)&&!has_raw(value){{out.push_str(indent);out.push_str({text:?});return Ok(())}}"
        )
    } else {
        String::new()
    };
    out.push_str("pub(super) fn write_yaml(value:&Stored,inputs:&InputView<'_>,out:&mut String)->core::Result<()>{");
    out.push_str(&write_mapping_absence.replace("out.push_str(indent);", ""));
    out.push_str("if omit_default(value,inputs)?{return Ok(());}match value{");
    let tagged_property_prefix = shape
        .property
        .map(|name| format!("{}: ", nkdk_conversion_core::yaml::scalar(name)));
    let write_variant = |out: &mut String, variant: usize, method: &str, indent: &str| {
        if shape.hidden {
            writeln!(out, "Stored::V{variant}(_)=>Ok(()),").unwrap();
            return;
        }
        let call = if matches!(method, "write_yaml" | "write_yaml_indented")
            && expanded_mapping(&shape, variant, program)
        {
            format!("variant_{id}_{variant}::write_yaml_expanded(selected,inputs,out,{indent})")
        } else if method == "write_yaml" {
            format!("variant_{id}_{variant}::{method}(selected,inputs,out)")
        } else {
            format!("variant_{id}_{variant}::{method}(selected,inputs,out,indent)")
        };
        let (before, after) = selector_write(variant, indent);
        let normalize_raw = shape
            .property
            .filter(|property| selected_profile.is_some() && *property != shape.route.last().expect("choice route").local)
            .map_or_else(String::new, |property| {
            let physical = shape.route.last().expect("choice route").local.as_str();
            format!(
                "{{let start=out.len();{call}?;if variant_{id}_{variant}::has_raw(selected){{core::raw::Property::rename_physical_boundary(out,start,{property:?},{physical:?},{indent})?;}}Ok(())}}"
            )
        });
        let call = if normalize_raw.is_empty() {
            call
        } else {
            normalize_raw
        };
        if let Some((_, tag)) = tagged.iter().find(|(selected, _)| *selected == variant) {
            if shape.yaml.iter().any(|case| {
                case.variant == shape.variants[variant].name
                    && matches!(case.form, YamlChoiceForm::Tagged { .. })
            }) {
                let property = if method == "write_yaml" || method == "write_yaml_indented" {
                    tagged_property_prefix.as_deref()
                } else {
                    None
                };
                writeln!(out,"Stored::V{variant}(selected)=>{{let start=out.len();{call}?;if out.len()>start{{core::yaml::tag_written_value(out,start,{property:?},{:?})}}else{{Ok(())}}}},",format!("!{tag}")).unwrap();
            } else {
                writeln!(out,"Stored::V{variant}(selected)=>{{let start=out.len();{call}?;if out.len()>start{{core::yaml::tag_written_scalar(out,start,{tagged_property_prefix:?},{:?})}}else{{Ok(())}}}},",format!("!{tag} ")).unwrap();
            }
        } else {
            let disambiguation = disambiguate_scalar(variant);
            let before = if disambiguation.is_some() {
                format!("{before}let start=out.len();")
            } else {
                before
            };
            let after = disambiguation.map_or(after.clone(), |code| format!("?;{code}Ok(())"));
            writeln!(
                out,
                "Stored::V{variant}(selected)=>{{{before}{call}{after}}},"
            )
            .unwrap();
        }
    };
    for variant in &variants {
        write_variant(&mut out, *variant, "write_yaml", "\"\"");
    }
    out.push_str("}}\n");
    if lifted_key.is_some() {
        delegate_value!("key_can_be_lifted", "", "->bool", "");
        out.push_str("pub(super) fn write_mapping_value(value:&Stored,inputs:&InputView<'_>,out:&mut String,indent:&str)->core::Result<()>{match value{");
        for variant in &variants {
            write_variant(&mut out, *variant, "write_mapping_value", "indent");
        }
        out.push_str("}}\n");
    }
    delegate_value!(
        "scalar_at",
        ",path:&[core::xml::Name],occurrences:&[usize]",
        "->bool",
        ",path,occurrences"
    );
    delegate_value!("scalar", ",path:&[core::xml::Name]", "->bool", ",path");
    delegate_value!(
        "qname_text_at",
        ",path:&[core::xml::Name],occurrences:&[usize]",
        "->bool",
        ",path,occurrences"
    );
    delegate_value!(
        "canonical_omissions",
        ",inputs:&InputView<'_>,out:&mut Vec<&'static [(&'static str,&'static str)]>",
        "->core::Result<()>",
        ",inputs,out"
    );
    if shape.xml_hidden {
        // A computed field has no independent physical XML boundary. Its
        // containing record verifies the actual XML and the semantic projection.
        out.push_str("pub(super) fn verify_boundary(_value:&Stored,_before:&[u8],_after:&[u8],_inputs:&InputView<'_>)->core::Result<()>{Ok(())}\n");
    } else {
        delegate_value!(
            "verify_boundary",
            ",before:&[u8],after:&[u8],inputs:&InputView<'_>",
            "->core::Result<()>",
            ",before,after,inputs"
        );
    }
    out.push_str("pub(super) fn write_yaml_indented(value:&Stored,inputs:&InputView<'_>,out:&mut String,indent:&str)->core::Result<()>{");
    out.push_str(&write_mapping_absence);
    out.push_str("if omit_default(value,inputs)?{return Ok(());}match value{");
    for variant in &variants {
        write_variant(&mut out, *variant, "write_yaml_indented", "indent");
    }
    out.push_str("}}\n");
    if child.constraints.is_empty() {
        delegate_value!(
            "check_xml",
            ",source:&[u8],inputs:&InputView<'_>",
            "->Vec<RuntimeDiagnostic>",
            ",source,inputs"
        );
        delegate_value!(
            "check_yaml",
            ",source:&[u8],inputs:&InputView<'_>",
            "->Vec<RuntimeDiagnostic>",
            ",source,inputs"
        );
    } else {
        out.push_str(&generate_checks(
            child,
            program,
            id,
            shape.property,
            &variants,
            tagged.is_empty() && shape.property.is_some(),
        )?);
    }
    if tagged.is_empty() || shape.property.is_none() {
        out.push_str("pub(super) fn finalize_selected(source:&[u8],value:&Stored,inputs:&InputView<'_>)->core::Result<Vec<u8>>{match value{");
    } else {
        out.push_str("pub(super) fn finalize_selected(source:&[u8],value:&Stored,inputs:&InputView<'_>)->core::Result<Vec<u8>>{let result=match value{");
    }
    for variant in &variants {
        let finalize = if expanded_mapping(&shape, *variant, program) {
            "finalize_expanded"
        } else {
            "finalize"
        };
        let projected = if let XmlSelection::Discriminated(choice) = &shape.xml
            && !accepts[*variant]
        {
            let attribute = (&choice.attribute.namespace, &choice.attribute.local);
            format!(
                "{{let source=core::xml::project_property(source,{route},core::xml::PropertyProjection::WithoutAttributes(&[{attribute:?}]),qname_attribute,qname_text)?;variant_{id}_{variant}::{finalize}(&source,value,inputs)}}"
            )
        } else {
            format!("variant_{id}_{variant}::{finalize}(source,value,inputs)")
        };
        writeln!(out, "Stored::V{variant}(value)=>{projected},").unwrap();
    }
    if !tagged.is_empty()
        && let Some(property) = shape.property
    {
        let physical = shape.route.last().expect("choice route").local.as_str();
        writeln!(out,"}};let candidate=match result{{Ok(yaml)=>yaml,Err(error) if error.code.as_deref()==Some(core::proof::MISMATCH)=>{{let mut yaml=String::new();match value{{").unwrap();
        for variant in &variants {
            writeln!(out,"Stored::V{variant}(selected)=>variant_{id}_{variant}::write_yaml(selected,inputs,&mut yaml)?,").unwrap();
        }
        out.push_str("}yaml.into_bytes()},Err(error)=>return Err(error)};if candidate.windows(b\"!xml/raw\".len()).any(|bytes|bytes==b\"!xml/raw\"){return Ok(candidate)}let mut candidate=String::from_utf8(candidate).expect(\"generated YAML\");if !candidate.is_empty(){match value{");
        // The payload's finalizer knows its representation, but not the tag
        // which selects it in the containing choice. Retain that discriminator.
        for (variant, tag) in &tagged {
            if shape.yaml.iter().any(|case| {
                case.variant == shape.variants[*variant].name
                    && matches!(case.form, YamlChoiceForm::Tagged { .. })
            }) {
                writeln!(out,"Stored::V{variant}(_)=>core::yaml::tag_written_value(&mut candidate,0,{tagged_property_prefix:?},{:?})?,",format!("!{tag}")).unwrap();
            } else {
                writeln!(out,"Stored::V{variant}(_)=>core::yaml::tag_written_scalar(&mut candidate,0,{tagged_property_prefix:?},{:?})?,",format!("!{tag} ")).unwrap();
            }
        }
        out.push_str("_=>{},}}let candidate=candidate.into_bytes();let prepared=prepare(value,inputs)?;let mut names=Vec::new();namespaces(value,&prepared,&mut names);let mut writer=core::xml::Writer::new(&names);write_xml(value,&prepared,inputs,&mut writer)?;let ordinary=writer.finish();if core::proof::verify_with_value_qnames(source,&ordinary,&[],|path,occurrences|scalar_at(value,path,occurrences),qname_attribute,|path,occurrences|qname_text_at(value,path,occurrences)).is_ok(){return Ok(candidate)}");
        writeln!(out,"let source_tree=core::xml::Tree::capture_with_value_qnames(source,{route},|path,occurrences|qname_text_at(value,path,occurrences))?;let base=core::xml::Tree::capture_with_value_qnames(&ordinary,{route},|path,occurrences|qname_text_at(value,path,occurrences))?;let payload=source_tree.map_or_else(||Ok(\"null\".to_owned()),|tree|tree.patch_yaml(base.as_ref(),&[],&qnames()))?;core::raw::Property::encode({property:?},{physical:?},&candidate,payload.as_bytes())}}\n").unwrap();
    } else {
        out.push_str("}}\n");
    }

    // A raw envelope without meaning is read through the choice fallback. Its
    // canonical empty form can differ from that of the original variant.
    if shape.xml_hidden {
        out.push_str("pub(super) fn finalize(_source:&[u8],value:&Stored,inputs:&InputView<'_>)->core::Result<Vec<u8>>{let mut yaml=String::new();write_yaml(value,inputs,&mut yaml)?;Ok(yaml.into_bytes())}\n");
    } else if shape.hidden {
        // Preservation belongs to the nearest visible enclosing value.
        out.push_str("pub(super) fn finalize(_source:&[u8],_value:&Stored,_inputs:&InputView<'_>)->core::Result<Vec<u8>>{Ok(Vec::new())}\n");
    } else if let Some(property) = shape.property {
        let physical = shape.route.last().expect("choice route").local.as_str();
        writeln!(out, r#"pub(super) fn finalize(source:&[u8],value:&Stored,inputs:&InputView<'_>)->core::Result<Vec<u8>>{{
// An absent optional choice must not gain an envelope while another field
// is refined. A present empty XML element still requires preservation.
if !semantic_present(value) && core::xml::Tree::capture_with_value_qnames(source,{route},|path,occurrences|qname_text_at(value,path,occurrences))?.is_none(){{return Ok(Vec::new())}}
// The containing choice owns absence and defaults. Prove its omitted form
// before asking the payload to refine a representation with a different boundary.
if omit_default(value,inputs)?{{
let missing=read_yaml_empty_mapping(inputs)?;
let ordinary=project(&document(&missing,inputs)?)?;
let projected=project(source)?;
if core::proof::verify_with_value_qnames(&projected,&ordinary,&[],|path,occurrences|scalar_at(&missing,path,occurrences),qname_attribute,|path,occurrences|qname_text_at(&missing,path,occurrences)).is_ok(){{return Ok(Vec::new())}}
}}
let candidate=finalize_selected(source,value,inputs)?;
if !candidate.windows(b"!xml/raw".len()).any(|bytes|bytes==b"!xml/raw"){{return Ok(candidate)}}
let envelope=match core::raw::Property::decode(&candidate,{property:?},{physical:?}){{Ok(Some(envelope))=>envelope,Ok(None)=>return Ok(candidate),Err(error) if error.code.as_deref()==Some("yaml.raw-envelope")=>{{let tree=core::xml::Tree::capture_with_value_qnames(source,{route},|path,occurrences|qname_text_at(value,path,occurrences))?;let payload=tree.map_or_else(||Ok("null".to_owned()),|tree|tree.patch_yaml(None,&[],&qnames()))?;return core::raw::Property::encode({property:?},{physical:?},b"",payload.as_bytes())}},Err(error)=>return Err(error)}};
if envelope.has_semantic{{return Ok(candidate)}}
let meaning=read_yaml_document(&envelope.meaning,inputs)?;
let prepared=prepare(&meaning,inputs)?;let mut names=Vec::new();namespaces(&meaning,&prepared,&mut names);
let mut writer=core::xml::Writer::new(&names);write_xml(&meaning,&prepared,inputs,&mut writer)?;
let ordinary=writer.finish();
let expected=core::xml::Tree::capture_with_value_qnames(source,{route},|path,occurrences|qname_text_at(value,path,occurrences))?;
let base=core::xml::Tree::capture_with_value_qnames(&ordinary,{route},|path,occurrences|qname_text_at(&meaning,path,occurrences))?;
let payload=expected.map_or_else(||Ok("null".to_owned()),|expected|expected.patch_yaml(base.as_ref(),&[],&qnames()))?;
core::raw::Property::encode({property:?},{physical:?},&envelope.meaning,payload.as_bytes())}}
"#).unwrap();
    } else {
        out.push_str("pub(super) fn finalize(source:&[u8],value:&Stored,inputs:&InputView<'_>)->core::Result<Vec<u8>>{finalize_selected(source,value,inputs)}\n");
    }

    out.push_str(
        "pub(super) fn prepare(value:&Stored,inputs:&InputView<'_>)->core::Result<Prepared>{match value{",
    );
    for variant in &variants {
        writeln!(out,"Stored::V{variant}(value)=>variant_{id}_{variant}::prepare(value,inputs).map(Prepared::V{variant}),").unwrap();
    }
    out.push_str("}}\npub(super) fn namespaces<'a>(value:&'a Stored,prepared:&'a Prepared,names:&mut Vec<&'a str>){match(value,prepared){");
    for variant in &variants {
        writeln!(out,"(Stored::V{variant}(value),Prepared::V{variant}(prepared))=>variant_{id}_{variant}::namespaces(value,prepared,names),").unwrap();
    }
    if variants.len() > 1 {
        out.push_str("_=>unreachable!(\"choice preparation variant\"),");
    }
    out.push_str("};");
    let mut choice_namespaces = BTreeSet::new();
    if let XmlSelection::Discriminated(choice) = &shape.xml {
        choice_namespaces.insert(choice.attribute.namespace.as_str());
        for case in &choice.variants {
            for name in case.values.iter().chain(case.emit.iter()) {
                choice_namespaces.insert(name.namespace.as_str());
            }
        }
    }
    for namespace in choice_namespaces
        .into_iter()
        .filter(|name| !name.is_empty())
    {
        writeln!(
            out,
            "if !names.contains(&{namespace:?}){{names.push({namespace:?});}}"
        )
        .unwrap();
    }
    out.push_str("}\npub(super) fn write_xml<'a>(value:&Stored,prepared:&'a Prepared,inputs:&InputView<'_>,out:&mut core::xml::Writer<'a>)->core::Result<()>{match(value,prepared){");
    for variant in &variants {
        let semantic_present = if scalar_variants[*variant]
            || xml_absent
            || value_adapters::nullable_first_field(child)
        {
            format!("variant_{id}_{variant}::semantic_present(value)")
        } else {
            "true".to_owned()
        };
        if shape.xml_hidden {
            writeln!(
                out,
                "(Stored::V{variant}(_),Prepared::V{variant}(_))=>Ok(()),"
            )
            .unwrap();
            continue;
        }
        // A projected record can preserve a partial header at the same XML
        // boundary as its containing choice. Only untouched attributes inherit
        // the choice's discriminator; explicit removals/replacements still win.
        let selected = target(&shape.variants[*variant], program);
        let projected_field = match (&selected.yaml, &selected.value) {
            (YamlRepresentation::Projection(name), LinkedType::Record(fields)) => {
                let same_boundary = matches!(attributes::content(&selected.xml).0,
                    LinkedXml::Record(xml) if xml.iter().any(|field|
                        &field.field == name && field.path.is_empty() && field.attribute.is_none()));
                same_boundary
                    .then(|| fields.iter().position(|field| &field.name == name))
                    .flatten()
            }
            _ => None,
        };
        let inherits_discriminator = if let Some(projected_field) = projected_field {
            format!(
                "variant_{id}_{variant}::input_field(value,0).and_then(|field|field.preserved_xml().or_else(||match field{{core::inputs::InputRef::Record(fields)=>fields.field({projected_field}).and_then(core::inputs::InputRef::preserved_xml),_=>None}})).map(|patch|patch.inherits_attribute(({discriminator_ns:?},{discriminator_local:?}),&[])).transpose()?.unwrap_or(false)"
            )
        } else {
            "false".to_owned()
        };
        writeln!(out,"(Stored::V{variant}(value),Prepared::V{variant}(prepared))=>{{let attributes:&[core::xml::WriteAttribute<'_>]={};if !attributes.is_empty()&&(!variant_{id}_{variant}::has_raw(value)||{inherits_discriminator})&&{semantic_present}{{out.container_with_attributes({route},attributes);}}variant_{id}_{variant}::write_xml(value,prepared,inputs,out)}},",emitted_attributes[*variant]).unwrap();
    }
    if variants.len() > 1 {
        out.push_str("_=>unreachable!(\"choice preparation variant\"),");
    }
    out.push_str("}}\n");
    if shape.xml_hidden {
        out.push_str(
            "pub(super) fn project(_source:&[u8])->core::Result<Vec<u8>>{Ok(Vec::new())}\n",
        );
    } else {
        writeln!(out,"pub(super) fn project(source:&[u8])->core::Result<Vec<u8>>{{core::xml::project_property(source,{route},core::xml::PropertyProjection::Element,qname_attribute,qname_text)}}").unwrap();
    }

    let discriminator_match = if matches!(shape.xml, XmlSelection::Discriminated(_)) {
        format!(
            "(core::xml::matches(path,{route})&&name.namespace=={discriminator_ns:?}&&name.local=={discriminator_local:?})"
        )
    } else {
        "false".to_owned()
    };
    writeln!(out,"pub(super) fn qname_attribute(path:&[core::xml::Name],name:&core::xml::Name)->bool{{{discriminator_match}").unwrap();
    for variant in &variants {
        write!(out, "||variant_{id}_{variant}::qname_attribute(path,name)").unwrap();
    }
    out.push_str("}\npub(super) fn qname_text(path:&[core::xml::Name])->bool{false");
    for variant in &variants {
        write!(out, "||variant_{id}_{variant}::qname_text(path)").unwrap();
    }
    out.push_str("}\npub(super) fn qnames()->Vec<(&'static str,&'static str)>{let mut names=vec![");
    if let XmlSelection::Discriminated(choice) = &shape.xml {
        for case in &choice.variants {
            if let Some(name) = &case.emit {
                write!(out, "({:?},{:?}),", name.namespace, name.local).unwrap();
            }
        }
    }
    out.push_str("]; ");
    for variant in &variants {
        write!(out, "names.extend(variant_{id}_{variant}::qnames());").unwrap();
    }
    out.push_str("names.sort_unstable();names.dedup();names}\n");
    out.push_str("pub(super) fn infer_xml(value:&mut Stored,source:&[u8],inputs:&InputView<'_>)->core::Result<()>{match value{");
    for variant in &variants {
        writeln!(
            out,
            "Stored::V{variant}(value)=>variant_{id}_{variant}::infer_xml(value,source,inputs),"
        )
        .unwrap();
    }
    out.push_str("}}\n}\n");
    Ok(value_adapters::ValueEmission {
        source: out,
        xml_stateful: true,
        yaml_stateful: true,
        mechanism: "owner-choice-part",
        choice_variants: variant_sizes,
    })
}

fn generate_checks(
    child: &LinkedEntry,
    program: &Program,
    id: u32,
    property: Option<&str>,
    variants: &[usize],
    recover_semantic: bool,
) -> Result<String, Diagnostic> {
    let LinkedType::Record(fields) = &child.value else {
        unreachable!("choice property is a record");
    };
    let mut out = String::new();
    for (side, phase, form) in [
        ("xml", ValidationPhase::XmlImport, LinkedForm::XmlRecord),
        (
            "yaml",
            ValidationPhase::YamlValidation,
            LinkedForm::YamlMapping,
        ),
    ] {
        writeln!(out, "pub(super) fn check_{side}(value:&Stored,source:&[u8],inputs:&InputView<'_>)->Vec<RuntimeDiagnostic>{{let _inputs=inputs;let mut errors=match value{{").unwrap();
        for variant in variants {
            writeln!(
                out,
                "Stored::V{variant}(value)=>variant_{id}_{variant}::check_{side}(value,source,inputs),"
            )
            .unwrap();
        }
        out.push_str("};match value{");
        for variant in variants.iter().copied() {
            writeln!(out, "Stored::V{variant}(value)=>{{").unwrap();
            let storage = [(
                format!("variant_{id}_{variant}::text_field(value,0).unwrap_or(\"\")"),
                format!(
                    "variant_{id}_{variant}::semantic_present(value)||variant_{id}_{variant}::has_raw(value)"
                ),
            )];
            let mut expressions =
                super::expressions::Expressions::new(child, program, fields, Some(&storage));
            expressions.null_field_storage = Some(vec![format!(
                "variant_{id}_{variant}::field_is_null(value,0)"
            )]);
            expressions.calendar_field_storage =
                Some(format!("variant_{id}_{variant}::calendar_field(value,0)"));
            expressions.decimal_field_storage = Some(format!(
                "(match variant_{id}_{variant}::input_field(value,0){{Some(core::inputs::InputRef::Decimal(number))=>Ok(number),_=>Err(RuntimeDiagnostic::new(\"fact.field-type\",\"Expected a decimal field\"))}})?"
            ));
            expressions.variant_text_storage = Some(format!(
                "variant_{id}_{variant}::render_text(value,inputs)?"
            ));
            expressions.variant_field_storage = Some(format!(
                "variant_{id}_{variant}::variant_input_field(value,"
            ));
            for original in &child.constraints {
                if !original.applies_to.contains(&phase)
                    || (!original.forms.is_empty() && !original.forms.contains(&form))
                {
                    continue;
                }
                if original.for_each.is_some() {
                    return Err(unsupported(
                        child,
                        "Choice property iterations need a declared collection",
                    ));
                }
                let mut rule = original.clone();
                crate::expressions::map_constraint(&mut rule, |expression| {
                    specialize_variant_test(expression, variant as u32)
                });
                if rule.expressions().any(uses_unprojected_owner_field) {
                    return Err(unsupported(
                        child,
                        "Choice property contract must use a variant test or a bound input",
                    ));
                }
                expressions.fallible = false;
                let message = expressions.message(&rule.diagnostic.message)?;
                if expressions.fallible {
                    return Err(unsupported(
                        child,
                        "Choice diagnostic message must be available without a fallible lookup",
                    ));
                }
                let when = if let Some(condition) = &rule.when {
                    expressions.lower(condition)?
                } else {
                    "true".to_owned()
                };
                let assertion = expressions.lower(&rule.assertion)?;
                let mut reads = BTreeSet::new();
                for expression in rule.expressions() {
                    super::constraints::read_inputs(expression, &mut reads);
                }
                let ready = reads.iter().map(|slot| format!("!matches!(_inputs.slot({slot}),Some(core::inputs::InputRef::MissingValue))")).collect::<Vec<_>>().join("&&");
                let guard = if ready.is_empty() {
                    when
                } else {
                    format!("({ready})&&({when})")
                };
                let violation = super::constraints::violation(&guard, &assertion);
                let code = rule.diagnostic.code.as_deref();
                let source_name = rule.diagnostic.source.as_deref();
                let severity = super::constraints::severity_name(&rule.diagnostic.severity);
                let path = match rule.diagnostic.at {
                    LinkedDiagnosticTarget::SelfValue => String::new(),
                    LinkedDiagnosticTarget::Field(0) => property
                        .map(|name| format!(".field({name:?})"))
                        .unwrap_or_default(),
                    _ => {
                        return Err(unsupported(
                            child,
                            "Choice diagnostic must address its value",
                        ));
                    }
                };
                let diagnostic = format!(
                    "RuntimeDiagnostic::declared({code:?},{source_name:?},core::Severity::{severity},{message}){path}"
                );
                let available = if checks_choice_absence(&original.assertion)
                    || original.when.as_ref().is_some_and(checks_choice_absence)
                {
                    "true".to_owned()
                } else {
                    format!("variant_{id}_{variant}::semantic_present(value)")
                };
                if expressions.fallible {
                    writeln!(out, "if {available}{{let evaluate=||->core::Result<bool>{{Ok({violation})}};match evaluate(){{Ok(true)=>errors.push({diagnostic}),Ok(false)=>{{}},Err(error)=>errors.push(error{path}),}}}}").unwrap();
                } else {
                    writeln!(
                        out,
                        "if {available}&&({violation}){{errors.push({diagnostic});}}"
                    )
                    .unwrap();
                }
            }
            out.push_str(&expressions.constants);
            out.push_str("},");
        }
        if side == "xml" && recover_semantic {
            out.push_str("}errors.retain(|issue|issue.kind==core::annotations::IssueKind::Structural||issue.severity!=core::Severity::Error);errors}\n");
        } else {
            out.push_str("}errors}\n");
        }
    }
    Ok(out)
}

fn uses_unprojected_owner_field(value: &LinkedExpression) -> bool {
    match &value.kind {
        LinkedExpressionKind::Operation {
            operator: LinkedOperator::State(StatePredicate::Present | StatePredicate::IsNull),
            arguments,
        } if matches!(
            arguments.as_slice(),
            [LinkedExpression {
                kind: LinkedExpressionKind::Field(0),
                ..
            }]
        ) =>
        {
            false
        }
        LinkedExpressionKind::Operation {
            operator: LinkedOperator::VariantText(_),
            arguments,
        } if matches!(
            arguments.as_slice(),
            [LinkedExpression {
                kind: LinkedExpressionKind::Field(0),
                ..
            }]
        ) =>
        {
            false
        }
        LinkedExpressionKind::Operation {
            operator: LinkedOperator::VariantField { .. },
            arguments,
        } if matches!(
            arguments.as_slice(),
            [LinkedExpression {
                kind: LinkedExpressionKind::Field(0),
                ..
            }]
        ) =>
        {
            false
        }
        LinkedExpressionKind::Field(0)
            if matches!(
                value.value_type,
                LinkedType::Scalar(ScalarType::Text | ScalarType::Decimal)
            ) =>
        {
            false
        }
        LinkedExpressionKind::Field(_) | LinkedExpressionKind::SelfValue => true,
        LinkedExpressionKind::Operation { arguments, .. } => {
            arguments.iter().any(uses_unprojected_owner_field)
        }
        _ => false,
    }
}

fn has_variant_test(value: &LinkedExpression) -> bool {
    match &value.kind {
        LinkedExpressionKind::Operation {
            operator: LinkedOperator::IsVariant(_),
            arguments,
        } if current_choice(arguments) => true,
        LinkedExpressionKind::Operation { arguments, .. } => arguments.iter().any(has_variant_test),
        _ => false,
    }
}

fn has_variant_field(value: &LinkedExpression) -> bool {
    matches!(
        &value.kind,
        LinkedExpressionKind::Operation {
            operator: LinkedOperator::VariantField { .. },
            ..
        }
    ) || matches!(&value.kind,LinkedExpressionKind::Operation{arguments,..} if arguments.iter().any(has_variant_field))
}

fn neutral_scalar(value_type: &LinkedType) -> LinkedExpressionKind {
    LinkedExpressionKind::Literal(match value_type {
        LinkedType::Scalar(ScalarType::Decimal) => ScalarLiteral::Number("0".into()),
        LinkedType::Scalar(ScalarType::Boolean) => ScalarLiteral::Boolean(false),
        _ => ScalarLiteral::Text(String::new()),
    })
}

fn current_choice(arguments: &[LinkedExpression]) -> bool {
    matches!(
        arguments,
        [LinkedExpression {
            kind: LinkedExpressionKind::Field(0),
            ..
        }]
    )
}

fn specialize_variant_test(value: &mut LinkedExpression, selected: u32) {
    if let LinkedExpressionKind::Operation {
        operator: LinkedOperator::VariantField { variant, .. },
        arguments,
    } = &value.kind
        && current_choice(arguments)
        && *variant != selected
    {
        value.kind = neutral_scalar(&value.value_type);
        return;
    }
    if let LinkedExpressionKind::Operation {
        operator: LinkedOperator::VariantText(variant),
        arguments,
    } = &value.kind
        && current_choice(arguments)
        && *variant != selected
    {
        value.kind = LinkedExpressionKind::Literal(ScalarLiteral::Text(String::new()));
        return;
    }
    if let LinkedExpressionKind::Operation {
        operator: LinkedOperator::VariantValue(variant),
        arguments,
    } = &value.kind
        && current_choice(arguments)
    {
        value.kind = if *variant == selected {
            LinkedExpressionKind::Field(0)
        } else {
            neutral_scalar(&value.value_type)
        };
        return;
    }
    if let LinkedExpressionKind::Operation {
        operator: LinkedOperator::IsVariant(variant),
        arguments,
    } = &value.kind
        && current_choice(arguments)
    {
        value.kind = LinkedExpressionKind::Literal(ScalarLiteral::Boolean(*variant == selected));
    } else if let LinkedExpressionKind::Operation { arguments, .. } = &mut value.kind {
        for argument in arguments {
            specialize_variant_test(argument, selected);
        }
    }
    if let LinkedExpressionKind::Operation {
        operator,
        arguments,
    } = &value.kind
    {
        let boolean = |argument: &LinkedExpression| match argument.kind {
            LinkedExpressionKind::Literal(ScalarLiteral::Boolean(value)) => Some(value),
            _ => None,
        };
        let folded = match operator {
            LinkedOperator::And
                if arguments
                    .iter()
                    .any(|argument| boolean(argument) == Some(false)) =>
            {
                Some(false)
            }
            LinkedOperator::Or
                if arguments
                    .iter()
                    .any(|argument| boolean(argument) == Some(true)) =>
            {
                Some(true)
            }
            LinkedOperator::Not => boolean(&arguments[0]).map(|value| !value),
            LinkedOperator::Conditional
                if boolean(&arguments[1]).is_some()
                    && boolean(&arguments[1]) == boolean(&arguments[2]) =>
            {
                boolean(&arguments[1])
            }
            _ => None,
        };
        if let Some(folded) = folded {
            value.kind = LinkedExpressionKind::Literal(ScalarLiteral::Boolean(folded));
        }
    }
    if let LinkedExpressionKind::Operation {
        operator: LinkedOperator::Conditional,
        arguments,
    } = &value.kind
        && let LinkedExpressionKind::Literal(ScalarLiteral::Boolean(condition)) = arguments[0].kind
    {
        let branch = &arguments[if condition { 1 } else { 2 }];
        value.kind = branch.kind.clone();
    }
}

fn checks_choice_absence(value: &LinkedExpression) -> bool {
    match &value.kind {
        LinkedExpressionKind::Operation {
            operator: LinkedOperator::State(StatePredicate::Present | StatePredicate::IsNull),
            arguments,
        } if current_choice(arguments) => true,
        LinkedExpressionKind::Operation { arguments, .. } => {
            arguments.iter().any(checks_choice_absence)
        }
        _ => false,
    }
}

pub(super) fn singleton_sequence(
    child: &LinkedEntry,
    program: &Program,
) -> Result<String, Diagnostic> {
    let Some(shape) = shape(child, program) else {
        return Ok("false".into());
    };
    let Some((input, values)) = crate::yaml_shape::sequence_profile(shape.target, program) else {
        return Ok("false".into());
    };
    if values.is_empty() {
        return Ok("false".into());
    }
    let first = shape.yaml.iter().find_map(|case| match &case.form {
        YamlChoiceForm::InputProfile { input, .. }
        | YamlChoiceForm::ScalarInput { input, .. }
        | YamlChoiceForm::MappingInput { input, .. } => Some(input),
        _ => None,
    });
    if first != Some(&input) {
        return Err(unsupported(
            child,
            "Sequence singleton requires one consistent profile input",
        ));
    }
    let expression = profile_input_expression(child, &shape, program)?
        .ok_or_else(|| unsupported(child, "Sequence singleton profile is not bound"))?;
    let values = values
        .iter()
        .map(|value| format!("{value:?}"))
        .collect::<Vec<_>>()
        .join("|");
    Ok(format!(
        "matches!(std::convert::AsRef::<str>::as_ref(&({expression})),{values})"
    ))
}
