use super::*;
use std::fmt::Write;

pub(super) struct Expressions<'a> {
    pub(super) entry: &'a LinkedEntry,
    pub(super) program: &'a Program,
    pub(super) fields: &'a [LinkedField],
    pub(super) field_storage: Option<&'a [(String, String)]>,
    pub(super) constants: String,
    pub(super) next_constant: usize,
    pub(super) transforms: BTreeSet<(u32, u32)>,
    pub(super) fallible: bool,
}
impl Expressions<'_> {
    fn text_reference(value: &LinkedExpression, expression: String) -> String {
        if matches!(
            value.kind,
            LinkedExpressionKind::Operation {
                operator: LinkedOperator::Conditional | LinkedOperator::MatchOptional(_),
                ..
            }
        ) {
            format!("&({expression})")
        } else {
            expression
        }
    }
    pub(super) fn message(&mut self, parts: &[LinkedMessagePart]) -> Result<String, Diagnostic> {
        if parts
            .iter()
            .all(|part| matches!(part, LinkedMessagePart::Text(_)))
        {
            let text: String = parts
                .iter()
                .filter_map(|part| match part {
                    LinkedMessagePart::Text(text) => Some(text.as_str()),
                    _ => None,
                })
                .collect();
            return Ok(format!("{text:?}"));
        }
        let mut output = String::from("{ let mut message = String::new();\n");
        for part in parts {
            let expression = match part {
                LinkedMessagePart::Text(text) => format!("{text:?}"),
                LinkedMessagePart::Expression(value) => {
                    Self::text_reference(value, self.lower(value)?)
                }
            };
            writeln!(output, "message.push_str({expression});").unwrap();
        }
        output.push_str("message }");
        Ok(output)
    }
    fn fixed_sequence_equality(
        &mut self,
        arguments: &[LinkedExpression],
    ) -> Result<Option<String>, Diagnostic> {
        if !matches!(self.entry.value, LinkedType::Sequence(_)) {
            return Ok(None);
        }
        let constructor = if matches!(arguments[0].kind, LinkedExpressionKind::SelfValue) {
            &arguments[1]
        } else if matches!(arguments[1].kind, LinkedExpressionKind::SelfValue) {
            &arguments[0]
        } else {
            return Ok(None);
        };
        let LinkedExpressionKind::Operation {
            operator: LinkedOperator::Sequence,
            arguments: rows,
        } = &constructor.kind
        else {
            return Ok(None);
        };
        if rows.iter().any(|row| !matches!(&row.kind, LinkedExpressionKind::Operation {operator:LinkedOperator::Record(names), arguments:values} if names.len()==self.fields.len() && values.iter().all(|value| value.value_type==LinkedType::Scalar(ScalarType::Text)))) { return Ok(None); }
        let index = self.next_constant;
        self.next_constant += 1;
        let mut parameters = vec![format!("value: &V{}", self.entry.id)];
        let mut call = vec!["_value".to_owned()];
        let mut checks = vec![
            "value.rows.is_present()".to_owned(),
            format!("value.rows.len()=={}", rows.len()),
        ];
        for (row_index, row) in rows.iter().enumerate() {
            let LinkedExpressionKind::Operation {
                operator: LinkedOperator::Record(names),
                arguments: values,
            } = &row.kind
            else {
                unreachable!()
            };
            for (source_index, value) in values.iter().enumerate() {
                let field = self
                    .fields
                    .iter()
                    .position(|field| field.name == names[source_index])
                    .ok_or_else(|| unsupported(self.entry, "Unknown fixed record field"))?;
                parameters.push(format!("expected_{row_index}_{source_index}: &str"));
                let lowered = self.lower(value)?;
                call.push(Self::text_reference(value, lowered));
                checks.push(format!("value.rows[{row_index}].fields[{field}].as_str()==expected_{row_index}_{source_index}"));
            }
        }
        writeln!(
            self.constants,
            "fn fixed_equal_{index}({}) -> bool {{ {} }}",
            parameters.join(","),
            checks.join(" && ")
        )
        .unwrap();
        Ok(Some(format!("fixed_equal_{index}({})", call.join(","))))
    }
    fn optional_text(&mut self, value: &LinkedExpression) -> Result<String, Diagnostic> {
        if matches!(value.kind, LinkedExpressionKind::Absent) {
            return Ok("None".into());
        }
        let code = self.lower(value)?;
        if value.value_type == LinkedType::Scalar(ScalarType::Text) {
            Ok(format!("Some(({code}).to_owned())"))
        } else {
            Ok(code)
        }
    }
    pub(super) fn lower(&mut self, value: &LinkedExpression) -> Result<String, Diagnostic> {
        Ok(match &value.kind {
            LinkedExpressionKind::Capture(0)
                if matches!(value.value_type, LinkedType::Sequence(_)) =>
            {
                "_rest".into()
            }
            LinkedExpressionKind::Absent if matches!(self.entry.value, LinkedType::Sequence(_)) => {
                format!("core::Sequence::<R{}>::Absent", self.entry.id)
            }
            LinkedExpressionKind::SelfValue
                if matches!(value.value_type, LinkedType::Sequence(_)) =>
            {
                "&_value.rows".into()
            }
            LinkedExpressionKind::Input(slot) => {
                self.fallible = true;
                let method = match value.value_type {
                    LinkedType::Scalar(ScalarType::Text) => "text",
                    LinkedType::Scalar(ScalarType::Boolean) => "boolean",
                    LinkedType::Scalar(ScalarType::Decimal) => "decimal",
                    LinkedType::Sequence(_) => "sequence",
                    _ => {
                        return Err(unsupported(
                            self.entry,
                            "Input expression type is not generated",
                        ));
                    }
                };
                format!("_inputs.{method}({slot})?")
            }
            LinkedExpressionKind::Variable(slot) => match value.value_type {
                LinkedType::Scalar(ScalarType::Text) => format!("v{slot}.as_str()"),
                LinkedType::Scalar(ScalarType::Boolean) => format!("*v{slot}"),
                LinkedType::Scalar(ScalarType::Decimal) => format!("v{slot}"),
                LinkedType::Sequence(_) => format!("v{slot}.as_slice()"),
                LinkedType::Record(_) => format!("v{slot}"),
                _ => {
                    return Err(unsupported(
                        self.entry,
                        "This local variable type is not generated",
                    ));
                }
            },
            LinkedExpressionKind::Field(index) => {
                if let Some(storage) = self.field_storage {
                    return Ok(storage[*index as usize].0.clone());
                }
                let field = &self.fields[*index as usize];
                scalar::Codec::resolve(&field.value, self.entry, self.program)?
                    .meaning(&format!("E{}F{index}", self.entry.id), *index as usize)
            }
            LinkedExpressionKind::Literal(ScalarLiteral::Boolean(value)) => value.to_string(),
            LinkedExpressionKind::Literal(ScalarLiteral::Text(value)) => format!("{value:?}"),
            LinkedExpressionKind::Literal(ScalarLiteral::Number(value)) => {
                let number = nkdk_decimal::Decimal::parse(value)
                    .map_err(|_| unsupported(self.entry, "Invalid decimal constant"))?;
                let (negative, digits, exponent) = number.parts();
                let index = self.next_constant;
                self.next_constant += 1;
                writeln!(self.constants, "const D{index}: core::decimal::Decimal = core::decimal::Decimal::constant({negative}, {digits:?}, {exponent});").unwrap();
                format!("&D{index}")
            }
            LinkedExpressionKind::Operation {
                operator,
                arguments,
            } => {
                if let LinkedOperator::Matches(pattern) = operator {
                    let input = self.lower(&arguments[0])?;
                    let machine =
                        regex_automata::dfa::dense::DFA::new(&format!(r"\A(?:{pattern})\z"))
                            .map_err(|error| unsupported(self.entry, &error.to_string()))?;
                    let index = self.next_constant;
                    self.next_constant += 1;
                    let (little, pad) = machine.to_bytes_little_endian();
                    let little = &little[pad..];
                    let (big, pad) = machine.to_bytes_big_endian();
                    let big = &big[pad..];
                    writeln!(
                        self.constants,
                        "#[repr(align(4))] struct PatternBytes{index}([u8;{}]);",
                        little.len()
                    )
                    .unwrap();
                    for (endian, bytes) in [("little", little), ("big", big)] {
                        writeln!(self.constants,"#[cfg(target_endian={endian:?})] static PB{index}:PatternBytes{index}=PatternBytes{index}({bytes:?});").unwrap();
                    }
                    writeln!(self.constants,"static P{index}:core::pattern::Pattern=core::pattern::Pattern::new(&PB{index}.0);").unwrap();
                    self.fallible = true;
                    return Ok(format!("P{index}.matches({input})?"));
                }
                if matches!(&value.value_type, LinkedType::Optional(inner) if **inner==LinkedType::Scalar(ScalarType::Text))
                {
                    match operator {
                        LinkedOperator::Conditional => {
                            let condition = self.lower(&arguments[0])?;
                            let yes = self.optional_text(&arguments[1])?;
                            let no = self.optional_text(&arguments[2])?;
                            return Ok(format!("if {condition} {{ {yes} }} else {{ {no} }}"));
                        }
                        LinkedOperator::MatchOptional(slot) => {
                            let input = self.lower(&arguments[0])?;
                            let yes = self.optional_text(&arguments[1])?;
                            let no = self.optional_text(&arguments[2])?;
                            return Ok(format!(
                                "match {input} {{ Some(v{slot}) => {yes}, None => {no} }}"
                            ));
                        }
                        _ => {}
                    }
                }
                if *operator == LinkedOperator::Equal
                    && let Some(code) = self.fixed_sequence_equality(arguments)?
                {
                    return Ok(code);
                }
                if *operator == LinkedOperator::State(StatePredicate::IsReady) {
                    if let LinkedExpressionKind::Input(slot) = arguments[0].kind {
                        return Ok(format!("_inputs.is_ready({slot})"));
                    }
                    return Err(unsupported(self.entry, "Readiness requires an input slot"));
                }
                if let LinkedOperator::Each(slot) | LinkedOperator::Exists(slot) = operator {
                    let sequence = self.lower(&arguments[0])?;
                    if matches!(
                        arguments[1].kind,
                        LinkedExpressionKind::Literal(ScalarLiteral::Boolean(true))
                    ) && matches!(operator, LinkedOperator::Exists(_))
                    {
                        return Ok(format!("!({sequence}).is_empty()"));
                    }
                    if matches!(
                        arguments[1].kind,
                        LinkedExpressionKind::Literal(ScalarLiteral::Boolean(false))
                    ) && matches!(operator, LinkedOperator::Each(_))
                    {
                        return Ok(format!("({sequence}).is_empty()"));
                    }
                    let sequence = if self.field_storage.is_some()
                        && matches!(arguments[0].kind, LinkedExpressionKind::Field(_))
                    {
                        format!("&{sequence}")
                    } else {
                        sequence
                    };
                    let predicate = self.lower(&arguments[1])?;
                    let LinkedType::Sequence(item) = &arguments[0].value_type else {
                        return Err(unsupported(self.entry, "Iteration requires a sequence"));
                    };
                    if matches!(item.as_ref(), LinkedType::Record(_)) {
                        let each = matches!(operator, LinkedOperator::Each(_));
                        let condition = if each {
                            format!("!({predicate})")
                        } else {
                            predicate
                        };
                        return Ok(format!(
                            "{{ let mut matched = {each}; for v{slot} in {sequence} {{ if {condition} {{ matched = {}; break; }} }} matched }}",
                            !each
                        ));
                    }
                    let variant = match item.as_ref() {
                        LinkedType::Scalar(ScalarType::Text) => "Text",
                        LinkedType::Scalar(ScalarType::Boolean) => "Boolean",
                        LinkedType::Scalar(ScalarType::Decimal) => "Decimal",
                        LinkedType::Sequence(_) => "Sequence",
                        _ => {
                            return Err(unsupported(
                                self.entry,
                                "Iteration value is not generated",
                            ));
                        }
                    };
                    self.fallible = true;
                    let each = matches!(operator, LinkedOperator::Each(_));
                    let condition = if each {
                        format!("!({predicate})")
                    } else {
                        predicate
                    };
                    return Ok(format!(
                        "{{ let mut matched = {each}; for item in {sequence} {{ let InputValue::{variant}(v{slot}) = item else {{ return Err(RuntimeDiagnostic::new(\"input.type\", \"Unexpected sequence item type\")); }}; if {condition} {{ matched = {}; break; }} }} matched }}",
                        !each
                    ));
                }
                let values = arguments
                    .iter()
                    .map(|value| self.lower(value))
                    .collect::<Result<Vec<_>, _>>()?;
                match operator {
                    LinkedOperator::Sequence
                        if matches!(self.entry.value, LinkedType::Sequence(_)) =>
                    {
                        format!(
                            "core::Sequence::<R{}>::Present(vec![{}])",
                            self.entry.id,
                            values.join(",")
                        )
                    }
                    LinkedOperator::Record(names)
                        if matches!(self.entry.value, LinkedType::Sequence(_)) =>
                    {
                        if self.fields.len() != 2 {
                            return Err(unsupported(
                                self.entry,
                                "Record constructor needs the generated item shape",
                            ));
                        }
                        let mut fields = Vec::new();
                        for field in self.fields {
                            let index = names
                                .iter()
                                .position(|name| *name == field.name)
                                .ok_or_else(|| {
                                    unsupported(self.entry, "Missing constructor field")
                                })?;
                            if arguments[index].value_type != LinkedType::Scalar(ScalarType::Text) {
                                return Err(unsupported(
                                    self.entry,
                                    "Optional record fields require pattern lifting",
                                ));
                            }
                            fields.push(format!("({}).to_owned()", values[index]));
                        }
                        let positions = if self.entry.constraints.iter().any(|rule| {
                            matches!(
                                rule.diagnostic.at,
                                LinkedDiagnosticTarget::Occurrence { .. }
                            )
                        }) {
                            ", positions: [core::Position::default(); 2]"
                        } else {
                            ""
                        };
                        format!(
                            "R{} {{fields: [{}]{positions}}}",
                            self.entry.id,
                            fields.join(",")
                        )
                    }
                    LinkedOperator::State(StatePredicate::Present)
                        if matches!(arguments[0].value_type, LinkedType::Sequence(_)) =>
                    {
                        if let (Some(storage), LinkedExpressionKind::Field(index)) =
                            (self.field_storage, &arguments[0].kind)
                        {
                            storage[*index as usize].1.clone()
                        } else if matches!(arguments[0].kind, LinkedExpressionKind::SelfValue) {
                            "_value.rows.is_present()".into()
                        } else {
                            format!("({}).is_present()", values[0])
                        }
                    }
                    LinkedOperator::Get(index) => {
                        format!("({}).fields[{index}].as_str()", values[0])
                    }
                    LinkedOperator::Take(count) => format!(
                        "{{ let rows = {}; &rows[..rows.len().min({count})] }}",
                        values[0]
                    ),
                    LinkedOperator::Ordered { slot, unique } => {
                        let preferred = values[2..].join(",");
                        let (seen, skip) = if *unique {
                            (
                                "let mut seen=std::collections::HashSet::new();",
                                "if !seen.insert(key) { continue; }",
                            )
                        } else {
                            ("", "")
                        };
                        format!(
                            "{{ let preferred: &[&str] = &[{preferred}]; let mut previous: Option<(usize, &str)> = None; let mut ordered=true; {seen} for v{slot} in {} {{ let key={}; {skip} let rank=preferred.iter().position(|candidate| *candidate == key).unwrap_or(preferred.len()); if let Some((last_rank, last))=previous {{ let order=last_rank.cmp(&rank).then_with(|| last.encode_utf16().cmp(key.encode_utf16())); if order == std::cmp::Ordering::Greater {{ ordered=false; break; }} }} previous=Some((rank, key)); }} ordered }}",
                            values[0], values[1]
                        )
                    }
                    LinkedOperator::Transform { entry, index } => {
                        self.fallible = true;
                        if self.transforms.insert((*entry, *index)) {
                            let target = self
                                .program
                                .entries
                                .iter()
                                .find(|target| target.id == *entry)
                                .expect("linked transform entry");
                            self.constants.push_str(&text::generate(
                                *entry,
                                *index,
                                &target.text_transforms[*index as usize].definition,
                            ));
                        }
                        format!(
                            "text_{entry}_{index}({})?",
                            Self::text_reference(&arguments[0], values[0].clone())
                        )
                    }
                    LinkedOperator::MatchOptional(slot) => {
                        let (present, absent) =
                            if value.value_type == LinkedType::Scalar(ScalarType::Text) {
                                (
                                    format!("({}).to_owned()", values[1]),
                                    format!("({}).to_owned()", values[2]),
                                )
                            } else {
                                (values[1].clone(), values[2].clone())
                            };
                        format!(
                            "match {} {{ Some(v{slot}) => {present}, None => {absent} }}",
                            values[0]
                        )
                    }
                    LinkedOperator::Equal | LinkedOperator::Less | LinkedOperator::LessEqual => {
                        if matches!(
                            arguments[0].value_type,
                            LinkedType::Sequence(_) | LinkedType::Absent
                        ) {
                            let reference = |index: usize| {
                                if matches!(arguments[index].kind, LinkedExpressionKind::SelfValue)
                                {
                                    values[index].clone()
                                } else {
                                    format!("&({})", values[index])
                                }
                            };
                            format!(
                                "std::cmp::PartialEq::eq({}, {})",
                                reference(0),
                                reference(1)
                            )
                        } else if arguments[0].value_type == LinkedType::Scalar(ScalarType::Decimal)
                        {
                            let function = match operator {
                                LinkedOperator::Equal => "PartialEq::eq",
                                LinkedOperator::Less => "PartialOrd::lt",
                                _ => "PartialOrd::le",
                            };
                            format!("std::cmp::{function}({}, {})", values[0], values[1])
                        } else {
                            format!("({}) == ({})", values[0], values[1])
                        }
                    }
                    LinkedOperator::Not => format!("!({})", values[0]),
                    LinkedOperator::And | LinkedOperator::Or => {
                        let identity = if *operator == LinkedOperator::And {
                            "true"
                        } else {
                            "false"
                        };
                        let absorbing = if *operator == LinkedOperator::And {
                            "false"
                        } else {
                            "true"
                        };
                        let mut kept = Vec::new();
                        for value in &values {
                            if value == identity {
                                continue;
                            }
                            kept.push(value.clone());
                            if value == absorbing {
                                break;
                            }
                        }
                        let values = kept;
                        if values.is_empty() {
                            if *operator == LinkedOperator::And {
                                "true".into()
                            } else {
                                "false".into()
                            }
                        } else if values.len() == 1 {
                            values[0].clone()
                        } else {
                            values
                                .iter()
                                .map(|value| format!("({value})"))
                                .collect::<Vec<_>>()
                                .join(if *operator == LinkedOperator::And {
                                    " && "
                                } else {
                                    " || "
                                })
                        }
                    }
                    LinkedOperator::Conditional => {
                        if value.value_type == LinkedType::Scalar(ScalarType::Text) {
                            format!(
                                "if {} {{ ({}).to_owned() }} else {{ ({}).to_owned() }}",
                                values[0], values[1], values[2]
                            )
                        } else {
                            format!(
                                "if {} {{ {} }} else {{ {} }}",
                                values[0], values[1], values[2]
                            )
                        }
                    }
                    _ => {
                        return Err(unsupported(
                            self.entry,
                            "Constraint operation is not generated by the scalar profile",
                        ));
                    }
                }
            }
            _ => {
                return Err(unsupported(
                    self.entry,
                    "Constraint needs an unsupported runtime input or collection expression",
                ));
            }
        })
    }
}

pub(super) fn expression(
    entry: &LinkedEntry,
    program: &Program,
    value: &LinkedExpression,
) -> Result<(String, String), Diagnostic> {
    let fields = match &entry.value {
        LinkedType::Record(fields) => fields,
        LinkedType::Sequence(item) => match item.as_ref() {
            LinkedType::Record(fields) => fields,
            _ => return Err(unsupported(entry, "Expression needs record items")),
        },
        _ => return Err(unsupported(entry, "Expression owner needs record storage")),
    };
    let mut expressions = Expressions {
        entry,
        program,
        fields,
        field_storage: None,
        constants: String::new(),
        next_constant: 0,
        transforms: BTreeSet::new(),
        fallible: false,
    };
    let code = expressions.lower(value)?;
    Ok((expressions.constants, code))
}
