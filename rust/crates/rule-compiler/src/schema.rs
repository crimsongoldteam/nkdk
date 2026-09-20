mod composite;
mod keyed;
use crate::plan::{ConversionPlan as Program, ValueId};
use nkdk_rule_model::*;
use serde_json::{Value, json};
use std::{cell::RefCell, str::FromStr};

#[derive(Default)]
struct RecursiveSchemas {
    stack: Vec<SchemaFrame>,
    recursive: Vec<SchemaFrame>,
    definitions: std::collections::BTreeMap<String, Value>,
}

#[derive(Clone, PartialEq, Eq)]
struct SchemaFrame {
    id: u32,
    value: LinkedType,
    yaml: YamlRepresentation,
}

impl SchemaFrame {
    fn new(entry: &LinkedEntry) -> Self {
        Self {
            id: entry.id,
            value: entry.value.clone(),
            yaml: entry.yaml.clone(),
        }
    }
}

thread_local! {
    static RECURSIVE_SCHEMAS: RefCell<RecursiveSchemas> = RefCell::default();
}

pub fn schema(program: &nkdk_rule_model::Program, name: &str) -> Result<Vec<u8>, Vec<Diagnostic>> {
    from_plan(&crate::plan::build(program)?, name)
}

pub(crate) fn from_plan(program: &Program<'_>, name: &str) -> Result<Vec<u8>, Vec<Diagnostic>> {
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
    if entry.kind == ModuleKind::Resources {
        return Err(vec![unsupported(entry)]);
    }
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
            let target = program.value(ValueId(*id)).expect("linked reference").entry;
            if matches!(target.value, LinkedType::Sequence(_))
                && matches!(
                    target.yaml,
                    YamlRepresentation::Sequence { .. } | YamlRepresentation::RecordMapping { .. }
                )
            {
                return sequence_shape(program, target, &target.presence);
            }
            if matches!(target.value, LinkedType::Record(_))
                && matches!(target.yaml, YamlRepresentation::Mapping(_))
            {
                return build(program, target);
            }
            crate::generate::scalar::optional(target).map_err(|_| unsupported(target))?;
            match &target.yaml {
                YamlRepresentation::ScalarChoice => {
                    Ok(json!({"type":["string","number"],"x-nkdk-number-profile":"decimal"}))
                }
                YamlRepresentation::Text => Ok(json!({"type":"string"})),
                YamlRepresentation::Choice(_) => {
                    let LinkedType::Choice(variants) = &target.value else {
                        return Err(unsupported(target));
                    };
                    let mut alternatives = Vec::new();
                    for variant in variants {
                        let shape = scalar(program, target, variant)?;
                        if !alternatives.contains(&shape) {
                            alternatives.push(shape);
                        }
                    }
                    Ok(json!({"anyOf":alternatives,"x-nkdk-runtime-validation":true}))
                }
                YamlRepresentation::TextPattern(_)
                | YamlRepresentation::TextSequence { .. }
                | YamlRepresentation::TextTable(_) => {
                    Ok(json!({"type":"string","x-nkdk-runtime-validation":true}))
                }
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
                YamlRepresentation::States(values) => {
                    let forms = values
                        .iter()
                        .filter_map(|row| match &row.form {
                            YamlStateForm::Absent => None,
                            YamlStateForm::Empty => Some(Value::Null),
                            YamlStateForm::Text(text) => Some(json!(text)),
                        })
                        .fold(Vec::new(), |mut forms, form| {
                            if !forms.contains(&form) {
                                forms.push(form);
                            }
                            forms
                        });
                    Ok(if forms.is_empty() {
                        json!(false)
                    } else {
                        json!({"enum":forms, "x-nkdk-runtime-validation":true})
                    })
                }
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
    program: &'a Program<'a>,
    entry: &'a LinkedEntry,
    fields: &'a [LinkedField],
    record: std::borrow::Cow<'a, crate::plan::RecordPlan<'a>>,
}
impl Context<'_> {
    fn key(&self, index: usize) -> Result<&str, Diagnostic> {
        self.record.fields[index]
            .yaml
            .map(|mapping| mapping.key.as_str())
            .ok_or_else(|| unsupported(self.entry))
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
                (YamlRepresentation::States(_), _) => return Err(unsupported(target)),
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
    fn uses_runtime_value(&self, expression: &LinkedExpression) -> bool {
        self.record.requires_runtime(expression, self.program)
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
                json!({"properties":{self.key(index as usize)?:{"pattern":format!("^(?:{pattern})(?![\\s\\S])")}},"required":[self.key(index as usize)?]}),
            );
        }
        match &expression.kind {
            LinkedExpressionKind::Literal(ScalarLiteral::Boolean(value)) => Ok(json!(value)),
            LinkedExpressionKind::Field(index) => {
                let index = *index as usize;
                Ok(
                    json!({"properties":{self.key(index)?:{"const":self.literal(index,&ScalarLiteral::Boolean(true))?}},"required":[self.key(index)?]}),
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
                    Ok(json!({"required":[self.key(index as usize)?]}))
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
                        json!({"properties": {self.key(index)?: {keyword: self.literal(index, literal)?}}, "required":[self.key(index)?]}),
                    )
                }
                _ => Err(unsupported(self.entry)),
            },
            _ => Err(unsupported(self.entry)),
        }
    }
}
fn schema_pointer(name: &str) -> String {
    format!("#/$defs/{}", name.replace('~', "~0").replace('/', "~1"))
}

fn build(program: &Program, entry: &LinkedEntry) -> Result<Value, Diagnostic> {
    let frame = SchemaFrame::new(entry);
    let repeated = RECURSIVE_SCHEMAS.with(|context| {
        let mut context = context.borrow_mut();
        if context.stack.contains(&frame) {
            if !context.recursive.contains(&frame) {
                context.recursive.push(frame.clone());
            }
            true
        } else {
            context.stack.push(frame.clone());
            false
        }
    });
    if repeated {
        return Ok(json!({"$ref": schema_pointer(&entry.name)}));
    }
    let result = build_entry(program, entry);
    let root = RECURSIVE_SCHEMAS.with(|context| {
        let mut context = context.borrow_mut();
        assert!(context.stack.pop().as_ref() == Some(&frame));
        if let Ok(value) = &result
            && context.recursive.contains(&frame)
        {
            context
                .definitions
                .insert(entry.name.clone(), value.clone());
        }
        context.stack.is_empty()
    });
    if !root {
        return result;
    }
    let context = RECURSIVE_SCHEMAS.with(|context| std::mem::take(&mut *context.borrow_mut()));
    let mut result = result?;
    if !context.definitions.is_empty() {
        let definitions = context
            .definitions
            .into_iter()
            .collect::<serde_json::Map<_, _>>();
        if let Some(object) = result.as_object_mut() {
            object.insert("$defs".into(), Value::Object(definitions));
        } else {
            result = json!({"allOf":[result],"$defs":definitions});
        }
    }
    Ok(result)
}

fn build_entry(program: &Program, entry: &LinkedEntry) -> Result<Value, Diagnostic> {
    if let YamlRepresentation::Projection(key) = &entry.yaml {
        let mut inner = entry.clone();
        inner.yaml = YamlRepresentation::Mapping(vec![YamlField {
            field: key.clone(),
            key: key.clone(),
            source: entry.source.clone(),
        }]);
        let shape = build(program, &inner)?;
        let mut shape = shape["properties"][key].clone();
        shape["$schema"] = json!("https://json-schema.org/draft/2020-12/schema");
        return Ok(shape);
    }

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
    if let (LinkedType::Record(fields), YamlRepresentation::Mapping(mapping)) =
        (&entry.value, &entry.yaml)
        && fields.len() == 1
        && let Some((id, _, _)) = crate::generate::composite::reference(&fields[0].value)
    {
        let common = program
            .entries
            .iter()
            .find(|value| value.id == id)
            .expect("linked common");
        if let (
            LinkedType::Sequence(item),
            YamlRepresentation::Sequence { .. } | YamlRepresentation::RecordMapping { .. },
        ) = (&common.value, &common.yaml)
        {
            let presence = if entry.presence.is_empty() {
                &common.presence
            } else {
                &entry.presence
            };
            let shape = sequence_shape(program, common, presence)?;
            let key = &mapping[0].key;
            let mut result = json!({"$schema":"https://json-schema.org/draft/2020-12/schema","type":"object","properties":{key:shape},"additionalProperties":false});
            if !common.constraints.is_empty() || matches!(item.as_ref(), LinkedType::Reference(_)) {
                result["x-nkdk-runtime-validation"] = json!(true);
            }
            if !presence.iter().any(|rule| rule.yaml_missing.is_some()) {
                result["required"] = json!([key]);
            }
            return Ok(result);
        }
    }
    if !plain(entry) {
        return Err(unsupported(entry));
    }
    let mut scalar_contract = entry.clone();
    if let LinkedType::Record(fields) = &entry.value {
        scalar_contract.presence.retain(|rule| match rule.target {
            LinkedPresenceTarget::Field(index) => {
                !referenced(&fields[index as usize].value, program).is_some_and(|entry| {
                    matches!(entry.value, LinkedType::Sequence(_) | LinkedType::Record(_))
                })
            }
            // Presence of the record itself belongs to its enclosing use.
            // This pass validates only the fields of an existing record.
            LinkedPresenceTarget::SelfValue => false,
        });
    }
    crate::generate::scalar_presence::validate_owner(&scalar_contract)
        .map_err(|_| unsupported(entry))?;
    let (LinkedType::Record(fields), YamlRepresentation::Mapping(_)) = (&entry.value, &entry.yaml)
    else {
        return Err(unsupported(entry));
    };
    let context = Context {
        program,
        entry,
        fields,
        record: program.record(entry)?,
    };
    let mut properties = serde_json::Map::new();
    let mut required = vec![];
    for (index, field) in fields.iter().enumerate() {
        let Some(mapping) = context.record.fields[index].yaml else {
            continue;
        };
        properties.insert(mapping.key.clone(), scalar(program, entry, field)?);
        let common = referenced(&field.value, program);
        let inherited_missing = common.is_some_and(|entry| {
            entry
                .presence
                .iter()
                .any(|rule| rule.yaml_missing.is_some())
        });
        let optional =
            match crate::generate::scalar_presence::rule(entry, index, &field.value, program) {
                Some(rule) => {
                    rule.yaml_missing.is_some()
                        || (inherited_missing
                            && common.is_some_and(|entry| {
                                matches!(entry.value, LinkedType::Sequence(_))
                            }))
                }
                None if common.is_some_and(|entry| {
                    matches!(entry.value, LinkedType::Record(_) | LinkedType::Sequence(_))
                }) =>
                {
                    inherited_missing
                }
                None => crate::generate::scalar::field_optional(&field.value, program)
                    .map_err(|_| unsupported(entry))?,
            };
        if !optional {
            required.push(context.key(index)?);
        }
    }
    let mut result = json!({"$schema":"https://json-schema.org/draft/2020-12/schema", "type":"object", "properties":properties, "required":required, "additionalProperties":false});
    if context
        .record
        .fields
        .iter()
        .any(|field| field.yaml.is_none())
    {
        result["x-nkdk-runtime-validation"] = json!(true);
    }
    let mut constraints = vec![];
    for (index, field) in fields.iter().enumerate() {
        if context.record.fields[index].yaml.is_none() {
            continue;
        }
        if let Some(expression) =
            crate::generate::scalar_presence::rule(entry, index, &field.value, program)
                .and_then(|presence| presence.yaml_omit_when.as_ref())
        {
            let mut expression = expression.clone();
            crate::generate::scalar_presence::replace_self(&mut expression, index);
            match context.expression(&expression) {
                Ok(shape) => constraints
                    .push(json!({"if":{"required":[context.key(index)?]},"then":{"not":shape}})),
                Err(error) if error.code == "unsupported_schema_feature" => {
                    result["x-nkdk-runtime-validation"] = json!(true)
                }
                Err(error) => return Err(error),
            }
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
        if context.uses_runtime_value(&constraint.assertion)
            || constraint
                .when
                .as_ref()
                .is_some_and(|value| context.uses_runtime_value(value))
        {
            result["x-nkdk-runtime-validation"] = json!(true);
            continue;
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

pub(super) fn sequence_shape(
    program: &Program,
    common: &LinkedEntry,
    presence: &[LinkedPresence],
) -> Result<Value, Diagnostic> {
    if let YamlRepresentation::RecordMapping { key, value } = &common.yaml {
        let item = crate::link::sequence_item::resolve(common, program)?
            .ok_or_else(|| unsupported(common))?;
        let YamlRepresentation::Mapping(fields) = &item.yaml else {
            return Err(unsupported(common));
        };
        let key = &fields
            .iter()
            .find(|field| &field.field == key)
            .ok_or_else(|| unsupported(common))?
            .key;
        // A relation over the full row cannot be evaluated against its keyless
        // body. Compiled validation sees the reconstituted row and keeps it.
        let mut body = item.clone();
        body.constraints.clear();
        let mut shape = build(program, &body)?;
        if let Some(fields) = shape["properties"].as_object_mut() {
            fields.remove(key);
        }
        if let Some(required) = shape["required"].as_array_mut() {
            required.retain(|value| value.as_str() != Some(key));
        }
        let body = if let Some(value) = value {
            let yaml_key = fields
                .iter()
                .find(|field| &field.field == value)
                .ok_or_else(|| unsupported(common))?
                .key
                .as_str();
            shape["properties"]
                .get(yaml_key)
                .cloned()
                .ok_or_else(|| unsupported(common))?
        } else {
            shape
        };
        return Ok(
            json!({"type":"object","additionalProperties":body,"x-nkdk-runtime-validation":true}),
        );
    }
    let (
        LinkedType::Sequence(item),
        YamlRepresentation::Sequence {
            item: yaml,
            shorthand,
            singleton,
        },
    ) = (&common.value, &common.yaml)
    else {
        return Err(unsupported(common));
    };
    let items = match (item.as_ref(), yaml.as_ref()) {
        (
            LinkedType::Reference(_) | LinkedType::BoundReference { .. },
            YamlRepresentation::Declared,
        ) => {
            let item =
                crate::link::sequence_item::resolve(common, program)?.expect("linked reference");
            build(program, &item)?
        }
        (LinkedType::Scalar(ScalarType::Text), YamlRepresentation::Text) => {
            json!({"type":"string"})
        }
        (LinkedType::Reference(_), YamlRepresentation::Text) => scalar(
            program,
            common,
            &LinkedField {
                name: "item".into(),
                value: *item.clone(),
                source: common.source.clone(),
            },
        )?,
        (LinkedType::Record(fields), YamlRepresentation::Mapping(mappings)) => {
            let mut properties = serde_json::Map::new();
            let mut required = Vec::new();
            for field in fields {
                let key = &mappings
                    .iter()
                    .find(|mapping| mapping.field == field.name)
                    .expect("linked mapping")
                    .key;
                properties.insert(key.clone(), scalar(program, common, field)?);
                required.push(key.clone());
            }
            json!({"type":"object","properties":properties,"required":required,"additionalProperties":false})
        }
        _ => return Err(unsupported(common)),
    };
    let mut forms = vec![json!({"type":"array","items":items})];
    if *singleton {
        forms.push(items);
    }
    if !shorthand.is_empty() {
        forms.push(json!({"type":"string","enum":shorthand.iter().map(|short|&short.text).collect::<Vec<_>>()}));
    }
    if presence
        .iter()
        .flat_map(|rule| &rule.yaml_empty)
        .any(|form| form.form == nkdk_rule_model::EmptyKind::Mapping)
    {
        forms.push(json!({"type":"object","maxProperties":0}));
    }
    Ok(if forms.len() == 1 {
        forms.remove(0)
    } else {
        json!({"anyOf":forms})
    })
}

fn referenced<'a>(value: &LinkedType, program: &'a Program<'a>) -> Option<&'a LinkedEntry> {
    let (id, _, _) = value.as_reference()?;
    program.entries.iter().find(|entry| entry.id == id)
}
