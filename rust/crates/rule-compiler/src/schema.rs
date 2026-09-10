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
        && entry.presence.is_empty()
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
            if !plain(target) || !target.constraints.is_empty() {
                return Err(unsupported(target));
            }
            match &target.yaml {
                YamlRepresentation::Text => Ok(json!({"type":"string"})),
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
    if let Some(schema) = composite::build(program, entry)? {
        return Ok(schema);
    }
    if let Some(schema) = keyed::build(program, entry)? {
        return Ok(schema);
    }
    if !plain(entry) {
        return Err(unsupported(entry));
    }
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
        required.push(context.key(index));
    }
    let mut result = json!({"$schema":"https://json-schema.org/draft/2020-12/schema", "type":"object", "properties":properties, "required":required, "additionalProperties":false});
    let mut constraints = vec![];
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
