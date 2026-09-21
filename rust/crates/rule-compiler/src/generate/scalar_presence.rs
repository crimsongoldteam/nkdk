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
            || !supported_empty(rule)
            || !rule.yaml_empty.iter().all(|empty| {
                empty.form == EmptyKind::Null
                    && matches!(empty.denotes.kind, LinkedExpressionKind::Absent)
            })
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
        let branch = format!("if {condition} {{{yes}}} else {{{no}}}");
        return Ok(if constants.is_empty() {
            branch
        } else {
            format!("{{{} {branch}}}", constants)
        });
    }
    let value = match (&expression.kind, codec) {
        (LinkedExpressionKind::Absent, _) => return Ok("None".into()),
        (
            LinkedExpressionKind::Literal(ScalarLiteral::Boolean(value)),
            scalar::Codec::Boolean(..),
        ) => value.to_string(),
        (LinkedExpressionKind::Literal(ScalarLiteral::Text(value)), scalar::Codec::Text) => {
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
        _ => {
            let (lowered, constants) = lower_missing(expression, owner, program)?;
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

pub(super) fn absent_form(rule: Option<&LinkedPresence>) -> XmlForm {
    rule.and_then(|rule| rule.canonical.first())
        .map(|rule| rule.form.clone())
        .unwrap_or(XmlForm::Missing)
}

pub(super) fn empty(rule: Option<&LinkedPresence>, kind: EmptyKind) -> bool {
    rule.is_some_and(|rule| rule.xml_empty.iter().any(|empty| empty.form == kind))
}

pub(super) fn yaml_empty(rule: Option<&LinkedPresence>, kind: EmptyKind) -> bool {
    rule.is_some_and(|rule| rule.yaml_empty.iter().any(|empty| empty.form == kind))
}

pub(super) fn absent_attributes(form: &XmlForm) -> &'static str {
    if *form == XmlForm::Nil {
        "&[core::xml::WriteAttribute{name:(\"http://www.w3.org/2001/XMLSchema-instance\",\"nil\"),value:core::xml::AttributeValue::Text(\"true\")}]"
    } else {
        "&[]"
    }
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
        let codec=scalar::Codec::resolve(&field.value,owner,program)?;
        let name=format!("E{}F{index}",owner.id);
        let (value, stored)=if local {
            (codec.meaning_reference(&name,&format!("f{index}.as_ref().ok_or_else(||RuntimeDiagnostic::new(\"value.missing\",\"Default dependency is unavailable\"))?")),format!("f{index}"))
        } else {(codec.optional_meaning(&name,index),format!("_value.f{index}"))};
        Ok((value,format!("{stored}.is_some()")))
    }).collect()
}
