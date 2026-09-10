use super::*;

pub(crate) fn rule<'a>(
    owner: &'a LinkedEntry,
    index: usize,
    value: &LinkedType,
    program: &'a Program,
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
        .first()
}

pub(crate) fn validate_owner(owner: &LinkedEntry) -> Result<(), Diagnostic> {
    for rule in &owner.presence {
        let constant = |expression: &Option<LinkedExpression>| {
            expression.as_ref().is_some_and(|expression| {
                matches!(
                    expression.kind,
                    LinkedExpressionKind::Absent | LinkedExpressionKind::Literal(_)
                )
            })
        };
        if !matches!(rule.target, LinkedPresenceTarget::Field(_))
            || !constant(&rule.xml_missing)
            || !constant(&rule.yaml_missing)
            || !supported_empty(rule)
            || !rule.yaml_empty.is_empty()
            || !supported_canonical(rule)
        {
            return Err(unsupported(
                owner,
                "Scalar field presence requires constant missing states and an explicit absence representation",
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
) -> Result<String, Diagnostic> {
    let Some(expression) = expression else {
        return Ok("None".into());
    };
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
            scalar::Codec::Enumeration(variants, ..),
        ) => {
            let index = variants
                .iter()
                .position(|variant| variant.value == *value)
                .ok_or_else(|| unsupported(owner, "Unknown enumeration default"))?;
            format!("{name}::V{index}")
        }
        _ => {
            return Err(unsupported(
                owner,
                "Scalar missing state requires a typed constant or absence",
            ));
        }
    };
    Ok(format!("Some({value})"))
}

pub(super) fn omit(
    expression: &LinkedExpression,
    index: usize,
    owner: &LinkedEntry,
    program: &Program,
) -> Result<String, Diagnostic> {
    predicate(
        expression,
        index,
        owner,
        program,
        &format!("omit_{}_{index}", owner.id),
    )
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
    let storage = fields
        .iter()
        .enumerate()
        .map(|(index, field)| {
            let codec = scalar::Codec::resolve(&field.value, owner, program)?;
            Ok((
                codec.optional_meaning(&format!("E{}F{index}", owner.id), index),
                format!("_value.f{index}.is_some()"),
            ))
        })
        .collect::<Result<Vec<_>, Diagnostic>>()?;
    let mut context = expressions::Expressions {
        entry: owner,
        program,
        fields,
        field_storage: Some(&storage),
        constants: String::new(),
        next_constant: 0,
        transforms: BTreeSet::new(),
        fallible: false,
    };
    let mut expression = expression.clone();
    replace_self(&mut expression, index);
    fn reads(expression: &LinkedExpression, result: &mut BTreeSet<u32>) {
        match &expression.kind {
            LinkedExpressionKind::Field(index) => {
                result.insert(*index);
            }
            LinkedExpressionKind::Operation { arguments, .. } => {
                for argument in arguments {
                    reads(argument, result)
                }
            }
            _ => (),
        }
    }
    let mut referenced = BTreeSet::new();
    reads(&expression, &mut referenced);
    let guard = referenced
        .iter()
        .map(|index| format!("_value.f{index}.is_none()"))
        .collect::<Vec<_>>()
        .join(" || ");
    let guard = if guard.is_empty() {
        String::new()
    } else {
        format!("if {guard} {{return Ok(false);}}")
    };
    let condition = context.lower(&expression)?;
    Ok(format!(
        "fn {name}(_value:&V{},_inputs:&PreparedInputs)->core::Result<bool>{{{guard} {} Ok({condition})}}\n",
        owner.id, context.constants
    ))
}

pub(super) fn supported_empty(rule: &LinkedPresence) -> bool {
    rule.xml_empty.iter().all(|empty| {
        matches!(empty.form, EmptyKind::Element | EmptyKind::Nil)
            && matches!(empty.denotes.kind, LinkedExpressionKind::Absent)
    })
}

pub(super) fn supported_canonical(rule: &LinkedPresence) -> bool {
    if rule.canonical.is_empty() {
        return true;
    }
    let [canonical] = rule.canonical.as_slice() else {
        return false;
    };
    if !matches!(
        canonical.form,
        XmlForm::Nil | XmlForm::EmptyElement | XmlForm::Missing
    ) {
        return false;
    }
    let Some(LinkedExpression {
        kind:
            LinkedExpressionKind::Operation {
                operator: LinkedOperator::Not,
                arguments,
            },
        ..
    }) = &canonical.when
    else {
        return false;
    };
    let [
        LinkedExpression {
            kind:
                LinkedExpressionKind::Operation {
                    operator: LinkedOperator::State(StatePredicate::Present),
                    arguments,
                },
            ..
        },
    ] = arguments.as_slice()
    else {
        return false;
    };
    let [value] = arguments.as_slice() else {
        return false;
    };
    matches!(
        (&rule.target, &value.kind),
        (
            LinkedPresenceTarget::SelfValue,
            LinkedExpressionKind::SelfValue
        )
    ) || matches!((&rule.target, &value.kind), (LinkedPresenceTarget::Field(a), LinkedExpressionKind::Field(b)) if a == b)
}

pub(super) fn absent_form(rule: Option<&LinkedPresence>) -> XmlForm {
    rule.and_then(|rule| rule.canonical.first())
        .map(|rule| rule.form.clone())
        .unwrap_or(XmlForm::Missing)
}

pub(super) fn empty(rule: Option<&LinkedPresence>, kind: EmptyKind) -> bool {
    rule.is_some_and(|rule| rule.xml_empty.iter().any(|empty| empty.form == kind))
}

pub(super) fn absent_attributes(form: &XmlForm) -> &'static str {
    if *form == XmlForm::Nil {
        "&[core::xml::WriteAttribute{name:(\"http://www.w3.org/2001/XMLSchema-instance\",\"nil\"),value:core::xml::AttributeValue::Text(\"true\")}]"
    } else {
        "&[]"
    }
}
