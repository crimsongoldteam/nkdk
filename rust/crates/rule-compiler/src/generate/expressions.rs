use super::*;
use std::fmt::Write;

pub(super) struct Expressions<'a> {
    pub(super) entry: &'a LinkedEntry,
    pub(super) program: &'a Program<'a>,
    pub(super) fields: &'a [LinkedField],
    pub(super) local_fields: std::collections::BTreeMap<u32, Vec<String>>,
    pub(super) field_storage: Option<&'a [(String, String)]>,
    pub(super) constants: String,
    pub(super) next_constant: usize,
    pub(super) transforms: BTreeSet<(u32, u32)>,
    pub(super) fallible: bool,
}
impl<'a> Expressions<'a> {
    pub(super) fn new(
        entry: &'a LinkedEntry,
        program: &'a Program<'a>,
        fields: &'a [LinkedField],
        field_storage: Option<&'a [(String, String)]>,
    ) -> Self {
        Self {
            entry,
            program,
            fields,
            field_storage,
            local_fields: Default::default(),
            constants: String::new(),
            next_constant: 0,
            transforms: BTreeSet::new(),
            fallible: false,
        }
    }
    fn bind_typed_row(&mut self, input: &LinkedExpression, slot: u32) -> Result<bool, Diagnostic> {
        if matches!(input.kind, LinkedExpressionKind::SelfValue)
            && let Some(codec) = collection_values::codec(self.entry, self.program)?
            && let LinkedType::Sequence(item) = &input.value_type
            && let LinkedType::Record(fields) = item.as_ref()
        {
            let name = collection_values::name(self.entry.id);
            let receiver = format!("v{slot}.fields[0]");
            let values = (0..fields.len())
                .map(|index| match &codec {
                    scalar::Codec::Pattern(pattern) => {
                        Ok(pattern.field_meaning(&name, index, &receiver))
                    }
                    scalar::Codec::Sequence(sequence) => sequence
                        .head_meaning(&name, index, &receiver)
                        .ok_or_else(|| {
                            unsupported(self.entry, "Typed collection field is unavailable")
                        }),
                    _ => Err(unsupported(
                        self.entry,
                        "Typed collection field is unavailable",
                    )),
                })
                .collect::<Result<Vec<_>, _>>()?;
            self.local_fields.insert(slot, values);
            return Ok(true);
        }
        let LinkedExpressionKind::Operation {
            operator: LinkedOperator::Get(_),
            arguments,
        } = &input.kind
        else {
            return Ok(false);
        };
        if let LinkedExpressionKind::Variable(owner) = arguments[0].kind
            && self.local_fields.contains_key(&owner)
            && let Some(scalar::Codec::Sequence(codec)) =
                collection_values::codec(self.entry, self.program)?
        {
            self.local_fields.insert(
                slot,
                codec.item_fields(&collection_values::name(self.entry.id), slot),
            );
            return Ok(true);
        }
        let LinkedExpressionKind::Field(owner) = arguments[0].kind else {
            return Ok(false);
        };
        let scalar::Codec::Sequence(codec) =
            scalar::Codec::resolve(&self.fields[owner as usize].value, self.entry, self.program)?
        else {
            return Ok(false);
        };
        self.local_fields.insert(
            slot,
            codec.item_fields(&format!("E{}F{owner}", self.entry.id), slot),
        );
        Ok(true)
    }

    fn owns_text(value: &LinkedExpression) -> bool {
        match &value.kind {
            LinkedExpressionKind::Operation {
                operator: LinkedOperator::Require,
                arguments,
            } => Self::owns_text(&arguments[0]),
            LinkedExpressionKind::Operation {
                operator: LinkedOperator::Fold { .. },
                arguments,
            } => Self::owns_text(&arguments[1]),
            LinkedExpressionKind::Operation {
                operator:
                    LinkedOperator::Conditional
                    | LinkedOperator::MatchOptional(_)
                    | LinkedOperator::Concat
                    | LinkedOperator::Transform { .. },
                ..
            } => true,
            _ => false,
        }
    }
    pub(super) fn text_reference(value: &LinkedExpression, expression: String) -> String {
        if Self::owns_text(value) {
            format!("&({expression})")
        } else {
            expression
        }
    }
    pub(super) fn text_owned(value: &LinkedExpression, expression: String) -> String {
        if Self::owns_text(value) {
            expression
        } else {
            format!("({expression}).to_owned()")
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
        if matches!(constructor.kind, LinkedExpressionKind::Input(_))
            && matches!(&self.entry.value, LinkedType::Sequence(item) if **item == LinkedType::Scalar(ScalarType::Text))
        {
            let input = self.lower(constructor)?;
            return Ok(Some(format!(
                "{{let expected={input};_value.rows.is_present() && _value.rows.len()==expected.len() && _value.rows.iter().zip(expected).all(|(row,item)| matches!(item,InputValue::Text(text) if &row.fields[0]==text))}}"
            )));
        }
        let LinkedExpressionKind::Operation {
            operator: LinkedOperator::Sequence,
            arguments: rows,
        } = &constructor.kind
        else {
            return Ok(None);
        };
        if matches!(&self.entry.value, LinkedType::Sequence(item) if **item == LinkedType::Scalar(ScalarType::Text))
        {
            if rows.is_empty() {
                return Ok(Some(
                    "_value.rows.is_present() && _value.rows.is_empty()".into(),
                ));
            }
            let values = rows
                .iter()
                .map(|row| {
                    let code = self.lower(row)?;
                    Ok(Self::text_reference(row, code))
                })
                .collect::<Result<Vec<_>, Diagnostic>>()?;
            return Ok(Some(format!(
                "_value.rows.is_present() && _value.rows.iter().map(|row|row.fields[0].as_str()).eq([{}])",
                values.join(",")
            )));
        }
        if rows.iter().any(|row| !matches!(&row.kind, LinkedExpressionKind::Operation {operator:LinkedOperator::Record(names), arguments:values} if names.len()==self.fields.len() && values.iter().all(|value| value.value_type==LinkedType::Scalar(ScalarType::Text)))) { return Ok(None); }
        let index = self.next_constant;
        self.next_constant += 1;
        let mut call = Vec::new();
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
                let expected_index = call.len();
                let lowered = self.lower(value)?;
                call.push(Self::text_reference(value, lowered));
                checks.push(format!(
                    "value.rows[{row_index}].fields[{field}].as_str()==expected[{expected_index}]"
                ));
            }
        }
        writeln!(
            self.constants,
            "fn fixed_equal_{index}(value: &V{}, {}: &[&str; {}]) -> bool {{ {} }}",
            self.entry.id,
            if call.is_empty() {
                "_expected"
            } else {
                "expected"
            },
            call.len(),
            checks.join(" && ")
        )
        .unwrap();
        Ok(Some(format!(
            "fixed_equal_{index}(_value,&[{}])",
            call.join(",")
        )))
    }
    fn optional_text(&mut self, value: &LinkedExpression) -> Result<String, Diagnostic> {
        if matches!(value.kind, LinkedExpressionKind::Absent) {
            return Ok("None".into());
        }
        let code = self.lower(value)?;
        if value.value_type == LinkedType::Scalar(ScalarType::Text) {
            Ok(format!("Some({})", Self::text_owned(value, code)))
        } else {
            Ok(code)
        }
    }
    pub(super) fn lower(&mut self, value: &LinkedExpression) -> Result<String, Diagnostic> {
        if let LinkedExpressionKind::Operation {
            operator: LinkedOperator::Lookup,
            arguments,
        } = &value.kind
        {
            self.fallible = true;
            let index = self.lower(&arguments[0])?;
            let entry = self.entry;
            let key = super::fact_keys::parts(&arguments[1], entry, |value| {
                let code = self.lower(value)?;
                Ok(Self::text_reference(value, code))
            })?;
            return Ok(format!("({index}).lookup_parts(&[{}])?", key.join(",")));
        }
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
                let method = match &value.value_type {
                    LinkedType::Index { key, value }
                        if crate::fact_shape::columns(key).is_some()
                            && **value == LinkedType::Scalar(ScalarType::Text) =>
                    {
                        "text_index"
                    }
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
                LinkedType::Scalar(ScalarType::Text) => {
                    format!("std::convert::AsRef::<str>::as_ref(&v{slot})")
                }
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
                    return storage
                        .get(*index as usize)
                        .map(|value| value.0.clone())
                        .ok_or_else(|| {
                            unsupported(
                                self.entry,
                                "This field requires a specialized constraint evaluator",
                            )
                        });
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
                    let machine = crate::automata::compile(
                        &[pattern],
                        crate::automata::STATE_BUDGET,
                        crate::automata::BYTE_BUDGET,
                    )
                    .map_err(|error| unsupported(self.entry, &error.to_string()))?;
                    let index = self.next_constant;
                    self.next_constant += 1;
                    self.constants.push_str(&crate::automata::declaration(
                        &format!("P{index}"),
                        &machine,
                    ));
                    self.fallible = true;
                    return Ok(format!("P{index}.matches({input})?"));
                }
                if let LinkedOperator::Fold { item, state } = operator {
                    let sequence = self.lower(&arguments[0])?;
                    let initial = self.lower(&arguments[1])?;
                    if !self.bind_typed_row(&arguments[0], *item)? {
                        return Err(unsupported(
                            self.entry,
                            "Fold currently requires a typed text sequence tail",
                        ));
                    }
                    let next = self.lower(&arguments[2]);
                    self.local_fields.remove(item);
                    let next = next?;
                    return Ok(format!(
                        "{{let mut accumulated={initial};if accumulated.is_some(){{for v{item} in {sequence} {{let Some(v{state})=accumulated else{{break;}};accumulated={next};}}}}accumulated}}"
                    ));
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
                if *operator == LinkedOperator::Equal {
                    for (literal, other) in [
                        (&arguments[0], &arguments[1]),
                        (&arguments[1], &arguments[0]),
                    ] {
                        if let LinkedExpressionKind::Literal(ScalarLiteral::Boolean(expected)) =
                            literal.kind
                        {
                            let value = self.lower(other)?;
                            return Ok(if expected {
                                value
                            } else {
                                format!("!({value})")
                            });
                        }
                    }
                }
                if *operator == LinkedOperator::Equal
                    && let Some(code) = self.fixed_sequence_equality(arguments)?
                {
                    return Ok(code);
                }
                if *operator == LinkedOperator::State(StatePredicate::Present)
                    && let LinkedExpressionKind::Field(index) = arguments[0].kind
                    && let Some(storage) = self.field_storage
                {
                    return storage
                        .get(index as usize)
                        .map(|field| field.1.clone())
                        .ok_or_else(|| unsupported(self.entry, "Presence field has no storage"));
                }
                if *operator == LinkedOperator::State(StatePredicate::IsReady) {
                    if let LinkedExpressionKind::Input(slot) = arguments[0].kind {
                        return Ok(format!("_inputs.is_ready({slot})"));
                    }
                    return Err(unsupported(self.entry, "Readiness requires an input slot"));
                }
                if let LinkedOperator::Each(slot) | LinkedOperator::Exists(slot) = operator {
                    let sequence = self.lower(&arguments[0])?;
                    let receiver = sequence.strip_prefix('&').unwrap_or(&sequence);
                    if matches!(
                        arguments[1].kind,
                        LinkedExpressionKind::Literal(ScalarLiteral::Boolean(true))
                    ) && matches!(operator, LinkedOperator::Exists(_))
                    {
                        return Ok(format!("!({receiver}).is_empty()"));
                    }
                    if matches!(
                        arguments[1].kind,
                        LinkedExpressionKind::Literal(ScalarLiteral::Boolean(false))
                    ) && matches!(operator, LinkedOperator::Each(_))
                    {
                        return Ok(format!("({receiver}).is_empty()"));
                    }
                    let sequence = if self.field_storage.is_some()
                        && matches!(arguments[0].kind, LinkedExpressionKind::Field(_))
                    {
                        sequence
                            .strip_prefix('*')
                            .map_or_else(|| format!("&{sequence}"), str::to_owned)
                    } else {
                        sequence
                    };
                    let typed = self.bind_typed_row(&arguments[0], *slot)?;
                    let predicate = self.lower(&arguments[1]);
                    if typed {
                        self.local_fields.remove(slot);
                    }
                    let predicate = predicate?;
                    let LinkedType::Sequence(item) = &arguments[0].value_type else {
                        return Err(unsupported(self.entry, "Iteration requires a sequence"));
                    };
                    if matches!(item.as_ref(), LinkedType::Scalar(ScalarType::Text))
                        && matches!(arguments[0].kind, LinkedExpressionKind::SelfValue)
                        && matches!(self.entry.value, LinkedType::Sequence(_))
                    {
                        let each = matches!(operator, LinkedOperator::Each(_));
                        let condition = if each {
                            format!("!({predicate})")
                        } else {
                            predicate
                        };
                        return Ok(format!(
                            "{{let mut matched={each}; for row in {sequence} {{ let v{slot}=&row.fields[0]; if {condition} {{ matched={};break; }} }} matched}}",
                            !each
                        ));
                    }
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
                    LinkedOperator::Require => {
                        self.fallible = true;
                        format!(
                            "({}).ok_or_else(||RuntimeDiagnostic::new(\"input.required\",\"A required prepared value is missing\"))?",
                            values[0]
                        )
                    }
                    LinkedOperator::Concat => {
                        let pieces = arguments
                            .iter()
                            .zip(&values)
                            .map(|(value, code)| Self::text_reference(value, code.clone()))
                            .collect::<Vec<_>>();
                        format!(
                            "{{let pieces:[&str;{}]=[{}];let mut joined=String::with_capacity(pieces.iter().map(|piece|piece.len()).sum());for piece in pieces {{joined.push_str(piece);}}joined}}",
                            pieces.len(),
                            pieces.join(",")
                        )
                    }
                    LinkedOperator::Sequence
                        if matches!(self.entry.value, LinkedType::Sequence(_)) =>
                    {
                        let values = if matches!(&self.entry.value, LinkedType::Sequence(item) if **item == LinkedType::Scalar(ScalarType::Text))
                        {
                            values
                                .iter()
                                .zip(arguments)
                                .map(|(code, value)| {
                                    format!(
                                        "R{}{{fields:[{}]}}",
                                        self.entry.id,
                                        Self::text_owned(value, code.clone())
                                    )
                                })
                                .collect::<Vec<_>>()
                        } else {
                            values
                        };
                        format!(
                            "core::Sequence::<R{}>::Present(vec![{}])",
                            self.entry.id,
                            values.join(",")
                        )
                    }
                    LinkedOperator::Record(names)
                        if matches!(self.entry.value, LinkedType::Sequence(_)) =>
                    {
                        if self.fields.len() != names.len() {
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
                            fields.push(Self::text_owned(&arguments[index], values[index].clone()));
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
                    LinkedOperator::State(StatePredicate::Present)
                        if matches!(arguments[0].value_type, LinkedType::Optional(_)) =>
                    {
                        format!("({}).is_some()", values[0])
                    }
                    LinkedOperator::IsVariant(variant) => {
                        let LinkedExpressionKind::Field(owner) = arguments[0].kind else {
                            return Err(unsupported(
                                self.entry,
                                "Variant guard requires an owning field",
                            ));
                        };
                        format!(
                            "matches!({}, E{}F{owner}::V{variant}(_))",
                            values[0], self.entry.id
                        )
                    }
                    LinkedOperator::VariantField { variant, field } => {
                        let LinkedExpressionKind::Field(owner) = arguments[0].kind else {
                            return Err(unsupported(
                                self.entry,
                                "Variant projection requires an owning field",
                            ));
                        };
                        let scalar::Codec::Forms(choice) = scalar::Codec::resolve(
                            &self.fields[owner as usize].value,
                            self.entry,
                            self.program,
                        )?
                        else {
                            return Err(unsupported(
                                self.entry,
                                "Variant projection needs a choice",
                            ));
                        };
                        let name = format!("E{}F{owner}", self.entry.id);
                        let meaning = choice.variants[*variant as usize].field_meaning(
                            &format!("{name}V{variant}"),
                            *field as usize,
                            "selected",
                        );
                        format!(
                            "match {} {{ {name}::V{variant}(selected)=>{meaning}, _=>unreachable!(\"guarded variant\") }}",
                            values[0]
                        )
                    }
                    LinkedOperator::Get(index) => {
                        if let LinkedExpressionKind::Variable(slot) = arguments[0].kind
                            && let Some(fields) = self.local_fields.get(&slot)
                        {
                            return fields.get(*index as usize).cloned().ok_or_else(|| {
                                unsupported(self.entry, "Typed row field is unavailable")
                            });
                        }
                        if let LinkedExpressionKind::Field(owner) = arguments[0].kind {
                            let name = format!("E{}F{owner}", self.entry.id);
                            match scalar::Codec::resolve(&self.fields[owner as usize].value,self.entry,self.program)? {
                                scalar::Codec::Pattern(pattern)=>pattern.field_meaning(&name,*index as usize,&values[0]),
                                scalar::Codec::Sequence(sequence)=>sequence.head_meaning(&name,*index as usize,&values[0]).ok_or_else(||unsupported(self.entry,"Sequence projection requires a supported fixed head field"))?,
                                _=>format!("({}).fields[{index}].as_str()",values[0]),
                            }
                        } else {
                            format!("({}).fields[{index}].as_str()", values[0])
                        }
                    }
                    LinkedOperator::Fold { .. } => {
                        unreachable!("fold lowered before scalar operators")
                    }
                    LinkedOperator::Take(0) => {
                        format!("{{ let rows = {}; &rows[..0] }}", values[0])
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
                    LinkedOperator::Lookup => {
                        self.fallible = true;
                        format!("({}).lookup({})?", values[0], values[1])
                    }
                    LinkedOperator::MatchOptional(slot) => {
                        let (present, absent) =
                            if value.value_type == LinkedType::Scalar(ScalarType::Text) {
                                (
                                    Self::text_owned(&arguments[1], values[1].clone()),
                                    Self::text_owned(&arguments[2], values[2].clone()),
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
                                "if {} {{ {} }} else {{ {} }}",
                                values[0],
                                Self::text_owned(&arguments[1], values[1].clone()),
                                Self::text_owned(&arguments[2], values[2].clone())
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
    let fields: &[LinkedField] = match &entry.value {
        LinkedType::Record(fields) => fields,
        LinkedType::Sequence(item) => match item.as_ref() {
            LinkedType::Record(fields) => fields,
            LinkedType::Scalar(ScalarType::Text) | LinkedType::Reference(_) => &[],
            _ => {
                return Err(unsupported(
                    entry,
                    "Expression needs supported sequence items",
                ));
            }
        },
        _ => return Err(unsupported(entry, "Expression owner needs record storage")),
    };
    let mut expressions = Expressions::new(entry, program, fields, None);
    let code = expressions.lower(value)?;
    Ok((expressions.constants, code))
}
