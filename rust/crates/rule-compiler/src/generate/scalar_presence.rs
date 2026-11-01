use super::*;

pub(crate) fn rule<'a>(
    owner: &'a LinkedEntry,
    index: usize,
    value: &LinkedType,
    program: &'a Program<'a>,
) -> Option<&'a LinkedPresence> {
    if let Some(rule) = owner
        .presence
        .iter()
        .find(|rule| rule.target == LinkedPresenceTarget::Field(index as u32))
    {
        return Some(rule);
    }
    let LinkedType::Reference(id) = value else {
        return None;
    };
    program
        .entries
        .iter()
        .find(|entry| entry.id == *id)?
        .presence
        .iter()
        .find(|rule| rule.target == LinkedPresenceTarget::SelfValue)
}

pub(crate) fn independent(expression: &LinkedExpression) -> bool {
    match &expression.kind {
        LinkedExpressionKind::Absent
        | LinkedExpressionKind::Literal(_)
        | LinkedExpressionKind::Input(_)
        | LinkedExpressionKind::CollectionPosition(_)
        | LinkedExpressionKind::Field(_)
        | LinkedExpressionKind::Variable(_) => true,
        LinkedExpressionKind::Operation { arguments, .. } => arguments.iter().all(independent),
        _ => false,
    }
}

pub(crate) fn validate_owner(owner: &LinkedEntry) -> Result<(), Diagnostic> {
    for rule in &owner.presence {
        let supported =
            |expression: &Option<LinkedExpression>| expression.as_ref().is_none_or(independent);
        if !matches!(rule.target, LinkedPresenceTarget::Field(_))
            || !supported(&rule.xml_missing)
            || !supported(&rule.yaml_missing)
            || !supported(&rule.yaml_null_when)
            || (rule.yaml_null_when.is_some()
                && !rule
                    .yaml_empty
                    .iter()
                    .any(|empty| empty.form == EmptyKind::Null))
            || !supported_empty(rule)
            || !rule
                .yaml_empty
                .iter()
                .all(|empty| (empty.form == EmptyKind::Null && independent(&empty.denotes))
                    || (empty.form == EmptyKind::Mapping
                        && matches!(&owner.yaml,YamlRepresentation::Projection(name) if matches!(rule.target,LinkedPresenceTarget::Field(index) if matches!(&owner.value,LinkedType::Record(fields) if fields[index as usize].name == *name)))
                        && matches!(empty.denotes.kind,LinkedExpressionKind::Absent)))
            || !supported_canonical(rule)
        {
            return Err(unsupported(
                owner,
                "Scalar field presence requires independent missing expressions when declared and supported empty/canonical forms",
            ));
        }
    }
    Ok(())
}

pub(super) fn yaml_null_value(presence: Option<&LinkedPresence>) -> Option<&LinkedExpression> {
    presence?.yaml_empty.iter().find_map(|empty| {
        (empty.form == EmptyKind::Null
            && !matches!(empty.denotes.kind, LinkedExpressionKind::Absent))
        .then_some(&empty.denotes)
    })
}

pub(crate) use crate::expressions::replace_self;

pub(super) fn missing(
    expression: Option<&LinkedExpression>,
    codec: &scalar::Codec<'_>,
    name: &str,
    owner: &LinkedEntry,
    program: &Program,
) -> Result<String, Diagnostic> {
    let Some(expression) = expression else {
        return Ok("None".into());
    };
    if let LinkedExpressionKind::Operation {
        operator: LinkedOperator::Conditional,
        arguments,
    } = &expression.kind
    {
        let yes = missing(Some(&arguments[1]), codec, name, owner, program)?;
        let no = missing(Some(&arguments[2]), codec, name, owner, program)?;
        let (condition, constants) = lower_missing(&arguments[0], owner, program)?;
        let branch = format!("{{let condition={condition};if condition {{{yes}}} else {{{no}}}}}");
        return Ok(if constants.is_empty() {
            branch
        } else {
            format!("{{{} {branch}}}", constants)
        });
    }
    let value = match (&expression.kind, codec) {
        (LinkedExpressionKind::Absent, _) => return Ok("None".into()),
        (
            LinkedExpressionKind::Operation {
                operator: LinkedOperator::ConstructVariant(index),
                arguments,
            },
            scalar::Codec::Forms(choice),
        ) if arguments.len() == 1 => {
            choice.scalar_default(*index, &arguments[0], name, owner, program)?
        }
        (
            LinkedExpressionKind::Literal(ScalarLiteral::Boolean(value)),
            scalar::Codec::Boolean(..),
        ) => value.to_string(),
        (LinkedExpressionKind::Literal(ScalarLiteral::Text(value)), scalar::Codec::Text) => {
            format!("String::from({value:?})")
        }
        (
            LinkedExpressionKind::Literal(ScalarLiteral::Text(value)),
            scalar::Codec::QNameText(table),
        ) => {
            if !table.iter().any(|item| item.literal == *value) {
                return Err(unsupported(owner, "Text default has no QName spelling"));
            }
            format!("String::from({value:?})")
        }
        (
            LinkedExpressionKind::Literal(ScalarLiteral::Number(value)),
            scalar::Codec::Decimal | scalar::Codec::FormattedDecimal(_),
        ) => {
            let number = nkdk_decimal::Decimal::parse(value)
                .map_err(|_| unsupported(owner, "Invalid decimal default"))?;
            let (negative, digits, exponent) = number.parts();
            format!("core::decimal::Decimal::constant({negative},{digits:?},{exponent})")
        }
        (
            LinkedExpressionKind::Literal(ScalarLiteral::Text(value)),
            scalar::Codec::Calendar { .. },
        ) => {
            let date = nkdk_conversion_core::calendar::Value::from_xml(value)
                .map_err(|_| unsupported(owner, "Invalid calendar default"))?;
            format!(
                "const {{core::calendar::Value::from_parts({:?}).expect(\"validated calendar default\")}}",
                date.parts()
            )
        }
        (
            LinkedExpressionKind::Literal(ScalarLiteral::Text(value)),
            scalar::Codec::Enumeration(variants, ..) | scalar::Codec::States(variants, ..),
        ) => {
            let index = variants
                .iter()
                .position(|variant| variant.value == *value)
                .ok_or_else(|| unsupported(owner, "Unknown enumeration default"))?;
            format!("{name}::V{index}")
        }
        (_, scalar::Codec::Sequence(sequence)) if sequence.constructible() => {
            sequence.semantic_default(expression, name, owner, program)?
        }
        (_, scalar::Codec::Forms(choice)) if choice.constructible() => {
            choice_from_cell(expression, name, owner, program)?
        }

        _ => {
            let (lowered, constants) = if matches!(codec, scalar::Codec::Calendar { .. }) {
                let mut storage = scalar_storage(owner, program, true)?;
                if let LinkedType::Record(fields) = &owner.value {
                    for (index, field) in fields.iter().enumerate() {
                        if matches!(
                            scalar::Codec::resolve(&field.value, owner, program),
                            Ok(scalar::Codec::Calendar { .. })
                        ) {
                            storage[index].0 = format!(
                                "f{index}.as_ref().ok_or_else(||RuntimeDiagnostic::new(\"value.missing\",\"Calendar source is absent\"))?"
                            );
                        }
                    }
                }
                let (constants, lowered) =
                    expressions::calendar_expression(owner, program, expression, Some(&storage))?;
                (lowered, constants)
            } else {
                lower_missing(expression, owner, program)?
            };
            if matches!(expression.value_type, LinkedType::Optional(_))
                && matches!(codec, scalar::Codec::Text)
            {
                let value = format!("({lowered}).map(|value|value.to_owned())");
                return Ok(if constants.is_empty() {
                    value
                } else {
                    format!("{{{}{value}}}", constants)
                });
            }

            let value = match codec {
                scalar::Codec::Text => format!("({lowered}).to_owned()"),
                scalar::Codec::Boolean(..) => lowered,
                scalar::Codec::Calendar { .. } => format!("*({lowered})"),
                scalar::Codec::Decimal | scalar::Codec::FormattedDecimal(_) => {
                    format!("({lowered}).clone()")
                }
                _ => {
                    return Err(unsupported(
                        owner,
                        "Dynamic missing state requires a scalar text, boolean or decimal",
                    ));
                }
            };
            if constants.is_empty() {
                value
            } else {
                format!("{{{} {value}}}", constants)
            }
        }
    };
    Ok(format!("Some({value})"))
}

/// Choice wrapping/unwrapping retains one textual XML cell, including its evidence.
pub(super) fn choice_projection_source(
    expression: &LinkedExpression,
    owner: &LinkedEntry,
    program: &Program,
) -> Option<usize> {
    let source = match &expression.kind {
        LinkedExpressionKind::Field(index) => *index as usize,
        LinkedExpressionKind::Operation {
            operator: LinkedOperator::ConstructVariant(_) | LinkedOperator::VariantValue(_),
            arguments,
        } if arguments.len() == 1 => {
            return choice_projection_source(&arguments[0], owner, program);
        }
        _ => return None,
    };
    let LinkedType::Record(fields) = &owner.value else {
        return None;
    };
    match scalar::Codec::resolve(&fields.get(source)?.value, owner, program).ok()? {
        scalar::Codec::Forms(choice) if choice.constructible() => Some(source),
        _ => None,
    }
}

/// Local native choices and borrowed input choices share the same cell constructor.
pub(super) fn choice_from_cell(
    expression: &LinkedExpression,
    name: &str,
    owner: &LinkedEntry,
    program: &Program,
) -> Result<String, Diagnostic> {
    let (constants, cell) =
        if let Some(cell) = expressions::semantic_cell(owner, program, expression)? {
            cell
        } else {
            let (value, constants) = lower_missing(expression, owner, program)?;
            (constants, format!("Some(({value}).as_input())"))
        };
    Ok(format!(
        "{{{constants}let slots=[{cell}];let inputs=_inputs.rebind(&slots);{name}::from_input(&inputs,0,_inputs)?}}"
    ))
}

fn lower_missing(
    expression: &LinkedExpression,
    owner: &LinkedEntry,
    program: &Program,
) -> Result<(String, String), Diagnostic> {
    let LinkedType::Record(fields) = &owner.value else {
        unreachable!()
    };
    let storage = scalar_storage(owner, program, true)?;
    let mut context = expressions::Expressions::new(owner, program, fields, Some(&storage));
    context.null_field_storage = Some(null_storage(owner, program, true));
    let value = context.lower(expression)?;
    if !context.transforms.is_empty() {
        return Err(unsupported(
            owner,
            "Missing state transform requires a generated helper",
        ));
    }
    Ok((value, context.constants))
}

pub(super) fn omit(
    expression: &LinkedExpression,
    index: usize,
    owner: &LinkedEntry,
    program: &Program,
) -> Result<String, Diagnostic> {
    let id = owner.id;
    let check = format!("omit_check_{id}_{index}");
    let condition = predicate(expression, index, owner, program, &check)?;
    Ok(format!(
        "{condition}fn omit_{id}_{index}(value:&V{id},inputs:&InputView<'_>)->core::Result<bool>{{match {check}(value,inputs){{Err(error) if error.code.as_deref()==Some(\"fact.ambiguous\")=>Ok(false),result=>result}}}}\n"
    ))
}

pub(super) fn predicate(
    expression: &LinkedExpression,
    index: usize,
    owner: &LinkedEntry,
    program: &Program,
    name: &str,
) -> Result<String, Diagnostic> {
    let LinkedType::Record(fields) = &owner.value else {
        unreachable!()
    };
    let storage = scalar_storage(owner, program, false)?;
    let mut context = expressions::Expressions::new(owner, program, fields, Some(&storage));
    context.null_field_storage = Some(null_storage(owner, program, false));
    let mut expression = expression.clone();
    replace_self(&mut expression, index);
    let mut referenced = BTreeSet::new();
    super::constraints::read_fields(&expression, &mut referenced);
    let mut input_reads = BTreeSet::new();
    super::constraints::read_inputs(&expression, &mut input_reads);
    let guard = referenced
        .iter()
        .map(|index| format!("_value.f{index}.is_none()"))
        .chain(input_reads.iter().map(|slot| {
            format!("matches!(_inputs.slot({slot}),Some(core::inputs::InputRef::MissingValue))")
        }))
        .collect::<Vec<_>>()
        .join(" || ");
    let guard = if guard.is_empty() {
        String::new()
    } else {
        format!("if {guard} {{return Ok(false);}}")
    };
    let condition = context.lower(&expression)?;
    Ok(format!(
        "fn {name}(_value:&V{},_inputs:&InputView<'_>)->core::Result<bool>{{{guard} {} Ok({condition})}}\n",
        owner.id, context.constants
    ))
}

pub(super) use crate::presence::{supported_canonical, supported_empty};

pub(super) fn canonical(
    rule: &LinkedPresence,
    index: usize,
    owner: &LinkedEntry,
    program: &Program,
) -> Result<String, Diagnostic> {
    let storage = scalar_storage(owner, program, false)?;
    let mut context = match &owner.value {
        LinkedType::Record(fields) => {
            expressions::Expressions::new(owner, program, fields, Some(&storage))
        }
        _ => unreachable!(),
    };
    context.null_field_storage = Some(null_storage(owner, program, false));
    let body = super::canonical::selection(&rule.canonical, |when| {
        let mut expression = when.clone();
        replace_self(&mut expression, index);
        let mut value_fields = BTreeSet::new();
        read_value_fields(&expression, &mut value_fields);
        let condition = context.lower(&expression)?;
        if value_fields.is_empty() {
            Ok(condition)
        } else {
            let ready = value_fields
                .iter()
                .map(|field| format!("_value.f{field}.is_some()"))
                .collect::<Vec<_>>()
                .join(" && ");
            Ok(format!("({ready}) && ({condition})"))
        }
    })?;
    if !context.transforms.is_empty() {
        return Err(unsupported(
            owner,
            "Canonical XML form requires an unsupported transform",
        ));
    }
    Ok(format!(
        "fn xml_form_{}_{index}(_value:&V{},_inputs:&InputView<'_>)->core::Result<usize>{{{}{body}}}\n",
        owner.id, owner.id, context.constants
    ))
}

fn read_value_fields(expression: &LinkedExpression, fields: &mut BTreeSet<u32>) {
    match &expression.kind {
        LinkedExpressionKind::Field(index) => {
            fields.insert(*index);
        }
        LinkedExpressionKind::Operation {
            operator:
                LinkedOperator::State(
                    StatePredicate::Present | StatePredicate::IsReady | StatePredicate::IsNull,
                ),
            ..
        } => (),
        LinkedExpressionKind::Operation { arguments, .. } => {
            for argument in arguments {
                read_value_fields(argument, fields);
            }
        }
        _ => (),
    }
}

pub(super) fn absent_form(rule: Option<&LinkedPresence>) -> XmlForm {
    rule.and_then(|rule| rule.canonical.first())
        .map(|rule| rule.form.clone())
        .unwrap_or(XmlForm::Missing)
}

// The reader recognizes every declared empty spelling. The writer chooses
// the active canonical branch using its context; round-trip inference preserves
// an input spelling that differs from that choice.
pub(super) fn can_emit_empty(rule: Option<&LinkedPresence>) -> bool {
    rule.is_some_and(|rule| {
        rule.canonical
            .iter()
            .any(|form| matches!(form.form, XmlForm::Nil | XmlForm::EmptyElement))
    })
}

pub(super) fn empty(rule: Option<&LinkedPresence>, kind: EmptyKind) -> bool {
    rule.is_some_and(|rule| rule.xml_empty.iter().any(|empty| empty.form == kind))
}

pub(crate) fn yaml_empty(rule: Option<&LinkedPresence>, kind: EmptyKind) -> bool {
    rule.is_some_and(|rule| rule.yaml_empty.iter().any(|empty| empty.form == kind))
}

pub(super) fn absent_attributes(form: &XmlForm) -> &'static str {
    if *form == XmlForm::Nil {
        "&[core::xml::WriteAttribute{name:(\"http://www.w3.org/2001/XMLSchema-instance\",\"nil\"),value:core::xml::AttributeValue::Text(\"true\")}]"
    } else {
        "&[]"
    }
}

fn null_storage(owner: &LinkedEntry, program: &Program, local: bool) -> Vec<String> {
    let LinkedType::Record(fields) = &owner.value else {
        unreachable!()
    };
    fields
        .iter()
        .enumerate()
        .map(|(index, field)| {
            if yaml_empty(rule(owner, index, &field.value, program), EmptyKind::Null) {
                format!(
                    "({0}null{index} && {0}f{index}.is_none())",
                    if local { "" } else { "_value." }
                )
            } else {
                "false".into()
            }
        })
        .collect()
}

fn scalar_storage(
    owner: &LinkedEntry,
    program: &Program,
    local: bool,
) -> Result<Vec<(String, String)>, Diagnostic> {
    let LinkedType::Record(fields) = &owner.value else {
        unreachable!()
    };
    fields.iter().enumerate().map(|(index,field)| {
        let name=format!("E{}F{index}",owner.id);
        let stored=if local {format!("f{index}")} else {format!("_value.f{index}")};
        let value=match scalar::Codec::resolve(&field.value,owner,program) {
            Ok(codec) if local => codec.meaning_reference(&name,&format!("f{index}.as_ref().ok_or_else(||RuntimeDiagnostic::new(\"value.missing\",\"Default dependency is unavailable\"))?")),
            Ok(codec) => codec.optional_meaning(&name,index),
            Err(_) if scalar::structured_reference(&field.value,program) => String::new(),
            Err(error) => return Err(error),
        };
        Ok((value,format!("{stored}.is_some()")))
    }).collect()
}
