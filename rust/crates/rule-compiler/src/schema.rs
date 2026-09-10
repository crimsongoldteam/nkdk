mod composite;
mod keyed;
use nkdk_rule_model::*;
use serde_json::{Value, json};
use std::str::FromStr;

pub fn schema(program: &Program, name: &str) -> Result<Vec<u8>, Vec<Diagnostic>> {
    let entry = program
        .entries
        .iter()
        .find(|entry| entry.name == name)
        .ok_or_else(|| {
            vec![Diagnostic {
                code: "unknown_schema_entry".into(),
                file: String::new(),
                line: 0,
                column: 0,
                message: format!("Unknown entry: {name}"),
                related: vec![],
            }]
        })?;
    let result = build(program, entry).map_err(|error| vec![error])?;
    Ok(serde_json::to_vec_pretty(&result).expect("JSON schema values are serializable"))
}
fn unsupported(entry: &LinkedEntry) -> Diagnostic {
    Diagnostic {
        code: "unsupported_schema_feature".into(),
        file: entry.source.file.clone(),
        line: entry.source.line,
        column: entry.source.column,
        message: "This contract is not represented by the current structural schema profile".into(),
        related: vec![],
    }
}
fn plain(entry: &LinkedEntry) -> bool {
    entry.inputs.is_empty()
        && entry.parameters.is_empty()
        && entry.shorthands.is_empty()
        && entry.normalization.is_none()
        && entry.text_transforms.is_empty()
}
fn scalar(
    program: &Program,
    owner: &LinkedEntry,
    field: &LinkedField,
) -> Result<Value, Diagnostic> {
    match &field.value {
        LinkedType::Scalar(ScalarType::Text) => Ok(json!({"type":"string"})),
        LinkedType::Scalar(ScalarType::Decimal) => {
            Ok(json!({"type":"number", "x-nkdk-number-profile":"decimal"}))
        }
        LinkedType::Reference(id) => {
            let target = program
                .entries
                .iter()
                .find(|entry| entry.id == *id)
                .expect("linked reference");
            crate::generate::scalar::optional(target).map_err(|_| unsupported(target))?;
            match &target.yaml {
                YamlRepresentation::ScalarChoice => {
                    Ok(json!({"type":["string","number"],"x-nkdk-number-profile":"decimal"}))
                }
                YamlRepresentation::Text => Ok(json!({"type":"string"})),
                YamlRepresentation::Calendar { seconds, omit_zero } => {
                    let clock = if *seconds {
                        " ([01][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]"
                    } else {
                        " ([01][0-9]|2[0-3]):[0-5][0-9]"
                    };
                    let suffix = if *omit_zero {
                        format!("({clock})?")
                    } else {
                        clock.into()
                    };
                    Ok(
                        json!({"type":"string","pattern":format!("^(0[1-9]|[12][0-9]|3[01])\\.(0[1-9]|1[0-2])\\.[0-9]{{4}}{suffix}$"),"x-nkdk-runtime-validation":true}),
                    )
                }
                YamlRepresentation::Decimal => {
                    Ok(json!({"type":"number", "x-nkdk-number-profile":"decimal"}))
                }
                YamlRepresentation::BooleanTable(values) => Ok(
                    json!({"type":"string", "enum":values.iter().map(|value| &value.text).collect::<Vec<_>>()}),
                ),
                YamlRepresentation::EnumTable(values) => Ok(
                    json!({"type":"string", "enum":values.iter().map(|value| &value.text).collect::<Vec<_>>()}),
                ),
                _ => Err(unsupported(target)),
            }
        }
        _ => Err(unsupported(owner)),
    }
}
struct Context<'a> {
    program: &'a Program,
    entry: &'a LinkedEntry,
    fields: &'a [LinkedField],
    mappings: &'a [YamlField],
}
impl Context<'_> {
    fn key(&self, index: usize) -> &str {
        &self
            .mappings
            .iter()
            .find(|mapping| mapping.field == self.fields[index].name)
            .expect("linked mapping")
            .key
    }
    fn literal(&self, index: usize, literal: &ScalarLiteral) -> Result<Value, Diagnostic> {
        if let LinkedType::Reference(id) = self.fields[index].value {
            let target = self
                .program
                .entries
                .iter()
                .find(|entry| entry.id == id)
                .expect("linked reference");
            match (&target.yaml, literal) {
                (
                    YamlRepresentation::Calendar { seconds, omit_zero },
                    ScalarLiteral::Text(value),
                ) => {
                    let date = nkdk_conversion_core::calendar::Value::from_xml(value)
                        .map_err(|_| unsupported(target))?;
                    return Ok(json!(date.yaml(*seconds, *omit_zero)));
                }
                (YamlRepresentation::EnumTable(table), ScalarLiteral::Text(value)) => {
                    return table
                        .iter()
                        .find(|item| item.value == *value)
                        .map(|item| json!(item.text))
                        .ok_or_else(|| unsupported(target));
                }
                (YamlRepresentation::BooleanTable(table), ScalarLiteral::Boolean(value)) => {
                    return table
                        .iter()
                        .find(|item| item.value == *value)
                        .map(|item| json!(item.text))
                        .ok_or_else(|| unsupported(target));
                }
                _ => {}
            }
        }
        match literal {
            ScalarLiteral::Text(text) => Ok(json!(text)),
            ScalarLiteral::Boolean(value) => Ok(json!(value)),
            ScalarLiteral::Number(text) => {
                let canonical = nkdk_decimal::Decimal::parse(text)
                    .map_err(|_| unsupported(self.entry))?
                    .to_string();
                Ok(Value::Number(
                    serde_json::Number::from_str(&canonical)
                        .map_err(|_| unsupported(self.entry))?,
                ))
            }
            _ => Err(unsupported(self.entry)),
        }
    }
    fn expression(&self, expression: &LinkedExpression) -> Result<Value, Diagnostic> {
        if let LinkedExpressionKind::Operation {
            operator: LinkedOperator::Matches(pattern),
            arguments,
        } = &expression.kind
        {
            let LinkedExpressionKind::Field(index) = arguments[0].kind else {
                return Err(unsupported(self.entry));
            };
            return Ok(
                json!({"properties":{self.key(index as usize):{"pattern":format!("^(?:{pattern})(?![\\s\\S])")}},"required":[self.key(index as usize)]}),
            );
        }
        match &expression.kind {
            LinkedExpressionKind::Literal(ScalarLiteral::Boolean(value)) => Ok(json!(value)),
            LinkedExpressionKind::Field(index) => {
                let index = *index as usize;
                Ok(
                    json!({"properties":{self.key(index):{"const":self.literal(index,&ScalarLiteral::Boolean(true))?}},"required":[self.key(index)]}),
                )
            }
            LinkedExpressionKind::Operation {
                operator,
                arguments,
            } => match operator {
                LinkedOperator::State(StatePredicate::Present) => {
                    let LinkedExpressionKind::Field(index) = arguments[0].kind else {
                        return Err(unsupported(self.entry));
                    };
                    Ok(json!({"required":[self.key(index as usize)]}))
                }
                LinkedOperator::And | LinkedOperator::Or => {
                    let values = arguments
                        .iter()
                        .map(|value| self.expression(value))
                        .collect::<Result<Vec<_>, _>>()?;
                    Ok(
                        json!({if *operator == LinkedOperator::And {"allOf"} else {"anyOf"}: values}),
                    )
                }
                LinkedOperator::Not => Ok(json!({"not": self.expression(&arguments[0])?})),
                LinkedOperator::Conditional => Ok(
                    json!({"if":self.expression(&arguments[0])?, "then":self.expression(&arguments[1])?, "else":self.expression(&arguments[2])?}),
                ),
                LinkedOperator::Equal | LinkedOperator::Less | LinkedOperator::LessEqual => {
                    let (index, literal, reverse) = match (&arguments[0].kind, &arguments[1].kind) {
                        (
                            LinkedExpressionKind::Field(index),
                            LinkedExpressionKind::Literal(literal),
                        ) => (*index as usize, literal, false),
                        (
                            LinkedExpressionKind::Literal(literal),
                            LinkedExpressionKind::Field(index),
                        ) => (*index as usize, literal, true),
                        _ => return Err(unsupported(self.entry)),
                    };
                    let keyword = match (operator, reverse) {
                        (LinkedOperator::Equal, _) => "const",
                        (LinkedOperator::Less, false) => "exclusiveMaximum",
                        (LinkedOperator::Less, true) => "exclusiveMinimum",
                        (_, false) => "maximum",
                        (_, true) => "minimum",
                    };
                    Ok(
                        json!({"properties": {self.key(index): {keyword: self.literal(index, literal)?}}, "required":[self.key(index)]}),
                    )
                }
                _ => Err(unsupported(self.entry)),
            },
            _ => Err(unsupported(self.entry)),
        }
    }
}
fn build(program: &Program, entry: &LinkedEntry) -> Result<Value, Diagnostic> {
    if let Some(layout) = crate::generate::nested_record::lower(entry, program)? {
        let inner = build(program, &layout.entry)?;
        return Ok(
            json!({"$schema":"https://json-schema.org/draft/2020-12/schema","type":"object","properties":{layout.key:inner},"additionalProperties":false,"x-nkdk-runtime-validation":true}),
        );
    }
    if let Some(schema) = composite::build(program, entry)? {
        return Ok(schema);
    }
    if let Some(schema) = keyed::build(program, entry)? {
        return Ok(schema);
    }
    if !plain(entry) {
        return Err(unsupported(entry));
    }
    crate::generate::scalar_presence::validate_owner(entry).map_err(|_| unsupported(entry))?;
    let (LinkedType::Record(fields), YamlRepresentation::Mapping(mappings)) =
        (&entry.value, &entry.yaml)
    else {
        return Err(unsupported(entry));
    };
    let context = Context {
        program,
        entry,
        fields,
        mappings,
    };
    let mut properties = serde_json::Map::new();
    let mut required = vec![];
    for (index, field) in fields.iter().enumerate() {
        properties.insert(context.key(index).into(), scalar(program, entry, field)?);
        if crate::generate::scalar_presence::rule(entry, index, &field.value, program)
            .and_then(|presence| presence.yaml_missing.as_ref())
            .is_none()
            && !crate::generate::scalar::field_optional(&field.value, program)
                .map_err(|_| unsupported(entry))?
        {
            required.push(context.key(index));
        }
    }
    let mut result = json!({"$schema":"https://json-schema.org/draft/2020-12/schema", "type":"object", "properties":properties, "required":required, "additionalProperties":false});
    let mut constraints = vec![];
    for (index, field) in fields.iter().enumerate() {
        if let Some(expression) =
            crate::generate::scalar_presence::rule(entry, index, &field.value, program)
                .and_then(|presence| presence.yaml_omit_when.as_ref())
        {
            let mut expression = expression.clone();
            crate::generate::scalar_presence::replace_self(&mut expression, index);
            constraints.push(json!({"if":{"required":[context.key(index)]},"then":{"not":context.expression(&expression)?}}));
        }
    }
    for constraint in &entry.constraints {
        if constraint.diagnostic.severity != Severity::Error
            || !constraint
                .applies_to
                .contains(&ValidationPhase::YamlValidation)
            || (!constraint.forms.is_empty()
                && !constraint.forms.contains(&LinkedForm::YamlMapping))
        {
            continue;
        }
        if constraint.for_each.is_some() {
            return Err(unsupported(entry));
        }
        let assertion = context.expression(&constraint.assertion)?;
        constraints.push(if let Some(when) = &constraint.when {
            json!({"if":context.expression(when)?, "then":assertion})
        } else {
            assertion
        });
    }
    if !constraints.is_empty() {
        result["allOf"] = json!(constraints);
    }
    Ok(result)
}
