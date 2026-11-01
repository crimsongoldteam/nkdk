use super::*;
use std::fmt::Write;

pub(super) struct Expressions<'a> {
    pub(super) entry: &'a LinkedEntry,
    pub(super) program: &'a Program<'a>,
    pub(super) fields: &'a [LinkedField],
    pub(super) local_fields: std::collections::BTreeMap<u32, Vec<String>>,
    borrowed_rows: std::collections::BTreeMap<u32, Vec<LinkedField>>,
    local_choice_types: std::collections::BTreeMap<u32, String>,
    union_rows: BTreeSet<u32>,
    borrowed_text_rows: BTreeSet<u32>,
    pub(super) borrowed_record_storage: Option<String>,
    pub(super) field_type_names: Option<Vec<String>>,
    pub(super) field_storage: Option<&'a [(String, String)]>,
    pub(super) null_field_storage: Option<Vec<String>>,
    pub(super) sequence_item_name: Option<String>,
    pub(super) borrowed_sequence: bool,
    pub(super) calendar_field_storage: Option<String>,
    pub(super) decimal_field_storage: Option<String>,
    pub(super) variant_text_storage: Option<String>,
    pub(super) variant_field_storage: Option<String>,
    pub(super) constants: String,
    pub(super) prepared: Vec<(LinkedExpression, String)>,
    pub(super) next_constant: usize,
    pub(super) transforms: BTreeSet<(u32, u32)>,
    pub(super) fallible: bool,
}
impl<'a> Expressions<'a> {
    fn field_type_name(&self, index: u32) -> String {
        self.field_type_names
            .as_ref()
            .map(|names| names[index as usize].clone())
            .unwrap_or_else(|| format!("E{}F{index}", self.entry.id))
    }
    pub(super) fn borrow_record_row(&mut self, slot: u32, fields: &[LinkedField]) {
        self.borrowed_rows.insert(slot, fields.to_vec());
    }
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
            field_type_names: None,
            null_field_storage: None,
            borrowed_record_storage: None,
            sequence_item_name: None,
            borrowed_sequence: false,
            calendar_field_storage: None,
            decimal_field_storage: None,
            variant_text_storage: None,
            variant_field_storage: None,
            local_fields: Default::default(),
            borrowed_rows: Default::default(),
            local_choice_types: Default::default(),
            union_rows: Default::default(),
            borrowed_text_rows: Default::default(),
            constants: String::new(),
            prepared: Vec::new(),
            next_constant: 0,
            transforms: BTreeSet::new(),
            fallible: false,
        }
    }
    fn sequence_origin(input: &LinkedExpression) -> &LinkedExpression {
        if let LinkedExpressionKind::Operation {
            operator: LinkedOperator::FirstBy(_),
            arguments,
        } = &input.kind
        {
            Self::sequence_origin(&arguments[0])
        } else {
            input
        }
    }
    fn iteration_binding(
        &mut self,
        input: &LinkedExpression,
        item: &LinkedType,
        slot: u32,
    ) -> Result<String, Diagnostic> {
        let union = matches!(input.kind, LinkedExpressionKind::Variable(owner) if self.union_rows.contains(&owner));
        if union || matches!(item, LinkedType::Record(_)) {
            Ok(format!("let v{slot}=item;"))
        } else if matches!(
            Self::sequence_origin(input).kind,
            LinkedExpressionKind::SelfValue
        ) && matches!(item, LinkedType::Scalar(ScalarType::Text))
        {
            Ok(format!("let v{slot}=&item.fields[0];"))
        } else {
            let variant = self.input_variant(item)?;
            self.fallible = true;
            Ok(format!(
                "let InputValue::{variant}(v{slot})=item else{{return Err(RuntimeDiagnostic::new(\"input.type\",\"Unexpected sequence item type\"));}};"
            ))
        }
    }
    fn bind_sequence_item(
        &mut self,
        codec: &super::text_sequence::Codec<'_>,
        name: &str,
        slot: u32,
    ) {
        if let Some(choice) = codec.item_choice_type(name) {
            self.local_choice_types.insert(slot, choice);
        } else {
            self.local_fields
                .insert(slot, codec.item_fields(name, slot));
        }
    }
    fn bind_variant_sequence(
        &mut self,
        input: &LinkedExpression,
        variant: u32,
        slot: u32,
    ) -> Result<bool, Diagnostic> {
        let LinkedExpressionKind::Field(owner) = input.kind else {
            return Ok(false);
        };
        let scalar::Codec::Forms(choice) =
            scalar::Codec::resolve(&self.fields[owner as usize].value, self.entry, self.program)?
        else {
            return Ok(false);
        };
        let Some(codec) = choice.variant_text_sequence(variant as usize) else {
            return Ok(false);
        };
        self.bind_sequence_item(
            codec,
            &format!("{}V{variant}", self.field_type_name(owner)),
            slot,
        );
        Ok(true)
    }
    fn bind_typed_row(&mut self, input: &LinkedExpression, slot: u32) -> Result<bool, Diagnostic> {
        let input = Self::sequence_origin(input);
        if let LinkedExpressionKind::Field(index) = input.kind
            && let Some(name) = &self.sequence_item_name
            && let scalar::Codec::Sequence(codec) = scalar::Codec::resolve(
                &self.fields[index as usize].value,
                self.entry,
                self.program,
            )?
        {
            let name = name.clone();
            self.bind_sequence_item(&codec, &name, slot);
            return Ok(true);
        }
        let borrowed = self.borrowed_origin(input);
        if borrowed
            && let LinkedType::Sequence(item) = &input.value_type
            && let LinkedType::Record(fields) = item.as_ref()
        {
            self.borrowed_rows.insert(slot, fields.clone());
            return Ok(true);
        }
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
        if let LinkedExpressionKind::Operation {
            operator: LinkedOperator::VariantField { variant, .. },
            arguments,
        } = &input.kind
        {
            return self.bind_variant_sequence(&arguments[0], *variant, slot);
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
        if let LinkedExpressionKind::Operation {
            operator: LinkedOperator::VariantValue(variant),
            arguments: choice,
        } = &arguments[0].kind
        {
            return self.bind_variant_sequence(&choice[0], *variant, slot);
        }
        let LinkedExpressionKind::Field(owner) = arguments[0].kind else {
            return Ok(false);
        };
        let scalar::Codec::Sequence(codec) =
            scalar::Codec::resolve(&self.fields[owner as usize].value, self.entry, self.program)?
        else {
            return Ok(false);
        };
        let name = self.field_type_name(owner);
        self.bind_sequence_item(&codec, &name, slot);
        Ok(true)
    }

    fn lower_bound_predicate(
        &mut self,
        input: &LinkedExpression,
        predicate: &LinkedExpression,
        slot: u32,
    ) -> Result<String, Diagnostic> {
        let typed = self.bind_typed_row(input, slot)?;
        let predicate = self.lower(predicate);
        if typed {
            self.local_fields.remove(&slot);
            self.borrowed_rows.remove(&slot);
            self.local_choice_types.remove(&slot);
        }
        predicate
    }

    fn input_variant(&self, item: &LinkedType) -> Result<&'static str, Diagnostic> {
        match item {
            LinkedType::Scalar(ScalarType::Text) | LinkedType::Enum(_) => Ok("Text"),
            LinkedType::Scalar(ScalarType::Boolean) => Ok("Boolean"),
            LinkedType::Scalar(ScalarType::Decimal) => Ok("Decimal"),
            LinkedType::Sequence(_) => Ok("Sequence"),
            _ => Err(unsupported(self.entry, "Iteration value is not generated")),
        }
    }

    fn scalar_input_method(value: &LinkedType) -> Option<&'static str> {
        match value {
            LinkedType::Scalar(ScalarType::Text) | LinkedType::Enum(_) => Some("text"),
            LinkedType::Scalar(ScalarType::Boolean) => Some("boolean"),
            LinkedType::Scalar(ScalarType::Decimal) => Some("decimal"),
            _ => None,
        }
    }

    fn borrowed_origin(&self, value: &LinkedExpression) -> bool {
        match &value.kind {
            LinkedExpressionKind::Input(_) => true,
            LinkedExpressionKind::Variable(slot) if self.borrowed_rows.contains_key(slot) => true,
            LinkedExpressionKind::Field(_) if self.borrowed_record_storage.is_some() => true,
            LinkedExpressionKind::SelfValue if self.borrowed_sequence => true,
            LinkedExpressionKind::Operation {
                operator: LinkedOperator::Conditional,
                arguments,
            } => self.borrowed_origin(&arguments[1]) && self.borrowed_origin(&arguments[2]),
            LinkedExpressionKind::Operation {
                operator:
                    LinkedOperator::Get(_)
                    | LinkedOperator::VariantField { .. }
                    | LinkedOperator::VariantValue(_),
                arguments,
            } => {
                self.borrowed_origin(&arguments[0])
                    || (self.variant_field_storage.is_some()
                        && matches!(
                            &value.kind,
                            LinkedExpressionKind::Operation {
                                operator: LinkedOperator::VariantField { .. },
                                ..
                            }
                        ))
            }
            _ => false,
        }
    }

    fn borrowed_union(&self, value: &LinkedExpression) -> bool {
        match &value.kind {
            LinkedExpressionKind::Operation {
                operator: LinkedOperator::SequenceConcat,
                arguments,
            } => arguments.iter().all(|part| self.borrowed_union(part)),
            LinkedExpressionKind::Operation {
                operator: LinkedOperator::Conditional,
                arguments,
            } => self.borrowed_union(&arguments[1]) && self.borrowed_union(&arguments[2]),
            LinkedExpressionKind::Operation {
                operator: LinkedOperator::Sequence,
                arguments,
            } if arguments.is_empty() => true,
            _ => {
                self.borrowed_origin(value)
                    && matches!(&value.value_type, LinkedType::Sequence(item) if matches!(item.as_ref(), LinkedType::Record(_)))
            }
        }
    }

    fn visit_borrowed_union(
        &mut self,
        value: &LinkedExpression,
        slot: u32,
        action: &str,
    ) -> Result<String, Diagnostic> {
        match &value.kind {
            LinkedExpressionKind::Operation {
                operator: LinkedOperator::SequenceConcat,
                arguments,
            } => {
                let mut code = String::new();
                for part in arguments {
                    code.push_str(&self.visit_borrowed_union(part, slot, action)?);
                }
                Ok(code)
            }
            LinkedExpressionKind::Operation {
                operator: LinkedOperator::Conditional,
                arguments,
            } => {
                let condition = self.lower(&arguments[0])?;
                let yes = self.visit_borrowed_union(&arguments[1], slot, action)?;
                let no = self.visit_borrowed_union(&arguments[2], slot, action)?;
                Ok(match (yes.is_empty(), no.is_empty()) {
                    (true, true) => format!("let _={condition};"),
                    (false, true) => format!("if {condition}{{{yes}}}"),
                    (true, false) => format!("if !({condition}){{{no}}}"),
                    (false, false) => format!("if {condition}{{{yes}}}else{{{no}}}"),
                })
            }
            LinkedExpressionKind::Operation {
                operator: LinkedOperator::Sequence,
                arguments,
            } if arguments.is_empty() => Ok(String::new()),
            _ => {
                let source = self.lower(value)?;
                Ok(format!(
                    "for v{slot} in ({source}).iter(){{let _=&v{slot};{action}}}"
                ))
            }
        }
    }

    fn borrowed_union_predicate(
        &mut self,
        operator: &LinkedOperator,
        arguments: &[LinkedExpression],
    ) -> Result<Option<String>, Diagnostic> {
        let (slot, limit, result, negate) = match operator {
            LinkedOperator::One(slot) => (*slot, 2, "matched==1", false),
            LinkedOperator::Exists(slot) => (*slot, 1, "matched!=0", false),
            LinkedOperator::Each(slot) => (*slot, 1, "matched==0", true),
            LinkedOperator::Find(slot) => (*slot, 1, "found", false),
            _ => return Ok(None),
        };
        if !self.borrowed_union(&arguments[0]) {
            return Ok(None);
        }
        let LinkedType::Sequence(item) = &arguments[0].value_type else {
            return Ok(None);
        };
        let LinkedType::Record(fields) = item.as_ref() else {
            return Ok(None);
        };
        let previous = self.borrowed_rows.insert(slot, fields.clone());
        let predicate = self.lower(&arguments[1]);
        self.borrowed_rows.remove(&slot);
        self.local_choice_types.remove(&slot);
        if let Some(previous) = previous {
            self.borrowed_rows.insert(slot, previous);
        }
        let predicate = predicate?;
        let condition = if negate {
            format!("!({predicate})")
        } else {
            predicate
        };
        let finding = matches!(operator, LinkedOperator::Find(_));
        let action = if finding {
            format!(
                "let condition={condition};if condition{{found=Some(v{slot});break 'borrowed_scan_{slot};}}"
            )
        } else {
            format!(
                "let condition={condition};if condition{{matched+=1;if matched=={limit}{{break 'borrowed_scan_{slot};}}}}"
            )
        };
        let scan = self.visit_borrowed_union(&arguments[0], slot, &action)?;
        let initial = if finding { "found=None" } else { "matched=0u8" };
        Ok(Some(format!(
            "{{let mut {initial};'borrowed_scan_{slot}:{{{scan}}}{result}}}"
        )))
    }

    fn borrowed_field_method(&self, value: &LinkedType) -> Result<&'static str, Diagnostic> {
        if let Some(method) = Self::scalar_input_method(value) {
            return Ok(method);
        }
        match value {
            LinkedType::Record(_) => Ok("record"),
            LinkedType::Choice(_) => Ok("value"),
            LinkedType::Sequence(item) if matches!(item.as_ref(), LinkedType::Record(_)) => {
                Ok("records")
            }
            LinkedType::Reference(id) | LinkedType::BoundReference { entry: id, .. } => {
                let target = self
                    .program
                    .entries
                    .iter()
                    .find(|entry| entry.id == *id)
                    .expect("linked borrowed record");
                if matches!(target.value, LinkedType::Record(_)) {
                    return Ok("record");
                }
                if matches!(target.value, LinkedType::Choice(_)) {
                    return Ok("value");
                }
                scalar::Codec::resolve(value, self.entry, self.program)?
                    .input_method()
                    .ok_or_else(|| {
                        unsupported(
                            self.entry,
                            "Record input field has no borrowed representation",
                        )
                    })
            }
            _ => Err(unsupported(
                self.entry,
                "Record input field has no borrowed representation",
            )),
        }
    }

    fn borrowed_method(&self, slot: u32, index: u32) -> Result<&'static str, Diagnostic> {
        self.borrowed_field_method(&self.borrowed_rows[&slot][index as usize].value)
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
                    | LinkedOperator::Identity { .. }
                    | LinkedOperator::LogicalAddress { .. }
                    | LinkedOperator::VariantText(_)
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
    /// Keep borrowed branches for comparison, but retain computed strings until
    /// the consumer finishes. Unlike a value constructor, literals need no copy.
    pub(super) fn comparison_text(
        &mut self,
        value: &LinkedExpression,
    ) -> Result<String, Diagnostic> {
        fn borrowed(value: &LinkedExpression) -> bool {
            match &value.kind {
                LinkedExpressionKind::Operation {
                    operator: LinkedOperator::Conditional,
                    arguments,
                } => borrowed(&arguments[1]) && borrowed(&arguments[2]),
                _ => !Expressions::owns_text(value),
            }
        }
        if !borrowed(value) {
            return self.lower(value);
        }
        if let LinkedExpressionKind::Operation {
            operator: LinkedOperator::Conditional,
            arguments,
        } = &value.kind
        {
            let condition = self.lower(&arguments[0])?;
            let yes = self.comparison_text(&arguments[1])?;
            let no = self.comparison_text(&arguments[2])?;
            return Ok(format!("if {condition}{{{yes}}}else{{{no}}}"));
        }
        let code = self.lower(value)?;
        let reference = Self::text_reference(value, code);
        Ok(format!("std::convert::AsRef::<str>::as_ref({reference})"))
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
    /// Compare constructor fragments against stored rows without allocating expected rows.
    fn borrowed_sequence_constructor(
        &mut self,
        constructor: &LinkedExpression,
    ) -> Result<Option<String>, Diagnostic> {
        let LinkedExpressionKind::Operation {
            operator,
            arguments,
        } = &constructor.kind
        else {
            return Ok(None);
        };
        match operator {
            LinkedOperator::Conditional => {
                let condition = self.lower(&arguments[0])?;
                let yes = self.borrowed_sequence_constructor(&arguments[1])?;
                let no = self.borrowed_sequence_constructor(&arguments[2])?;
                Ok(yes.zip(no).map(|(yes, no)| {
                    format!("{{let condition={condition};if condition{{{yes}}}else{{{no}}}}}")
                }))
            }
            LinkedOperator::SequenceConcat => {
                let mut parts = Vec::new();
                for argument in arguments {
                    let Some(part) = self.borrowed_sequence_constructor(argument)? else {
                        return Ok(None);
                    };
                    parts.push(format!("({part})"));
                }
                Ok(Some(if parts.is_empty() {
                    "true".into()
                } else {
                    parts.join("&&")
                }))
            }
            LinkedOperator::Sequence => {
                let rows = arguments;
                let mut parts = Vec::new();
                for row in rows {
                    let LinkedExpressionKind::Operation {
                        operator: LinkedOperator::Record(names),
                        arguments: values,
                    } = &row.kind
                    else {
                        return Ok(None);
                    };
                    if names.len() != self.fields.len() {
                        return Ok(None);
                    }
                    let mut checks = Vec::new();
                    for (name, value) in names.iter().zip(values) {
                        let field = self
                            .fields
                            .iter()
                            .position(|field| &field.name == name)
                            .ok_or_else(|| {
                                unsupported(self.entry, "Unknown constructed record field")
                            })?;
                        let expected = self.lower(value)?;
                        let (variant, comparison) =
                            match Self::scalar_input_method(&value.value_type) {
                                Some("text") => (
                                    "Text",
                                    format!("actual=={}", Self::text_reference(value, expected)),
                                ),
                                Some("boolean") => ("Boolean", format!("actual==({expected})")),
                                Some("decimal") => ("Decimal", format!("actual==({expected})")),
                                _ => return Ok(None),
                            };
                        checks.push(format!("matches!(core::inputs::RecordInput::field(_row,{field}),Some(core::inputs::InputRef::{variant}(actual)) if {comparison})"));
                    }
                    let comparison = if checks.is_empty() {
                        "true".to_owned()
                    } else {
                        checks.join("&&")
                    };
                    parts.push(format!("match _value.rows.get(_cursor){{Some(_row)=>{{_cursor+=1;{comparison}}},None=>false}}"));
                }
                Ok(Some(if parts.is_empty() {
                    "true".into()
                } else if parts.len() == 1 {
                    parts.pop().expect("one constructed row")
                } else {
                    parts
                        .into_iter()
                        .map(|part| format!("{{{part}}}"))
                        .collect::<Vec<_>>()
                        .join("&&")
                }))
            }
            _ => Ok(None),
        }
    }
    fn fixed_sequence_equality(
        &mut self,
        arguments: &[LinkedExpression],
    ) -> Result<Option<String>, Diagnostic> {
        if !matches!(self.entry.value, LinkedType::Sequence(_)) {
            return Ok(None);
        }
        let (selected, constructor) =
            if matches!(arguments[0].kind, LinkedExpressionKind::SelfValue) {
                (&arguments[0], &arguments[1])
            } else if matches!(arguments[1].kind, LinkedExpressionKind::SelfValue) {
                (&arguments[1], &arguments[0])
            } else {
                return Ok(None);
            };
        if self.borrowed_sequence {
            return Ok(self.borrowed_sequence_constructor(constructor)?.map(|comparison|format!("_value.present && {{let mut _cursor=0usize;({comparison}) && _cursor==_value.rows.len()}}")));
        }
        if let LinkedExpressionKind::Operation {
            operator: LinkedOperator::Conditional,
            arguments: branches,
        } = &constructor.kind
        {
            let condition = self.lower(&branches[0])?;
            let yes = self.fixed_sequence_equality(&[selected.clone(), branches[1].clone()])?;
            let no = self.fixed_sequence_equality(&[selected.clone(), branches[2].clone()])?;
            return Ok(yes.zip(no).map(|(yes, no)| {
                format!("{{let condition={condition};if condition{{{yes}}}else{{{no}}}}}")
            }));
        }
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
            if rows.is_empty() {
                "value.rows.is_empty()".to_owned()
            } else {
                format!("value.rows.len()=={}", rows.len())
            },
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
        if let Some((_, code)) = self
            .prepared
            .iter()
            .find(|(expression, _)| expression.equivalent_to(value))
        {
            return Ok(code.clone());
        }
        if let LinkedExpressionKind::Operation {
            operator: LinkedOperator::State(StatePredicate::Present),
            arguments,
        } = &value.kind
            && let LinkedExpressionKind::Operation {
                operator: LinkedOperator::Get(index),
                arguments: row,
            } = &arguments[0].kind
            && let LinkedExpressionKind::Variable(slot) = row[0].kind
            && self.borrowed_rows.contains_key(&slot)
        {
            return Ok(format!(
                "v{slot}.field({index}).is_some_and(|cell|cell.is_present())"
            ));
        }
        if let LinkedExpressionKind::Operation {
            operator,
            arguments,
        } = &value.kind
            && let Some(code) = self.borrowed_union_predicate(operator, arguments)?
        {
            return Ok(code);
        }
        if let LinkedExpressionKind::Operation {
            operator,
            arguments,
        } = &value.kind
            && let Some(argument) = arguments.first()
            && !matches!(argument.kind, LinkedExpressionKind::Input(_))
            && self.borrowed_origin(argument)
        {
            match operator {
                LinkedOperator::IsVariant(variant) => {
                    let receiver = self.lower(argument)?;
                    self.fallible = true;
                    return Ok(format!("({receiver}).choice_variant()?=={variant}"));
                }
                LinkedOperator::VariantValue(variant)
                | LinkedOperator::VariantField { variant, .. } => {
                    let receiver = self.lower(argument)?;
                    self.fallible = true;
                    let selected = format!("({receiver}).choice_record({variant})?");
                    return if matches!(operator, LinkedOperator::VariantValue(_))
                        && matches!(value.value_type, LinkedType::Record(_))
                    {
                        Ok(selected)
                    } else {
                        let method = self.borrowed_field_method(&value.value_type)?;
                        let field = match operator {
                            LinkedOperator::VariantField { field, .. } => *field,
                            _ => 0,
                        };
                        Ok(format!("({selected}).{method}({field})?"))
                    };
                }
                _ => {}
            }
        }
        if let LinkedExpressionKind::Operation {
            operator: LinkedOperator::IsVariant(variant),
            arguments,
        } = &value.kind
            && let LinkedExpressionKind::Variable(slot) = arguments[0].kind
            && let Some(name) = self.local_choice_types.get(&slot)
        {
            return Ok(format!("matches!(v{slot},{name}::V{variant}(_))"));
        }
        if let LinkedExpressionKind::Operation {
            operator: LinkedOperator::IsVariant(variant),
            arguments,
        } = &value.kind
            && let LinkedExpressionKind::Input(slot) = arguments[0].kind
        {
            self.fallible = true;
            return Ok(format!(
                "_inputs.is_present({slot})? && _inputs.choice_variant({slot})?=={variant}"
            ));
        }
        if let LinkedExpressionKind::Operation {
            operator,
            arguments,
        } = &value.kind
            && let Some(argument) = arguments.first()
            && let LinkedExpressionKind::Input(slot) = argument.kind
        {
            let projection = match operator {
                LinkedOperator::VariantField { variant, field } => Some((*variant, *field)),
                LinkedOperator::VariantValue(variant) => Some((*variant, 0)),
                _ => None,
            };
            if let Some((variant, field)) = projection {
                if matches!(operator, LinkedOperator::VariantValue(_))
                    && matches!(value.value_type, LinkedType::Record(_))
                {
                    self.fallible = true;
                    return Ok(format!("_inputs.choice_record({slot},{variant})?"));
                }
                let method = self.borrowed_field_method(&value.value_type)?;
                self.fallible = true;
                return Ok(format!(
                    "_inputs.choice_record({slot},{variant})?.{method}({field})?"
                ));
            }
        }
        if let LinkedExpressionKind::Operation {
            operator: LinkedOperator::Get(index),
            arguments,
        } = &value.kind
            && self.borrowed_origin(&arguments[0])
        {
            let method = self.borrowed_field_method(&value.value_type)?;
            let receiver = self.lower(&arguments[0])?;
            self.fallible = true;
            return Ok(format!("({receiver}).{method}({index})?"));
        }
        if let LinkedExpressionKind::Operation {
            operator: LinkedOperator::VariantField { field, .. },
            ..
        } = &value.kind
            && let Some(storage) = &self.variant_field_storage
        {
            self.fallible = true;
            let (variant, result) = match value.value_type {
                LinkedType::Scalar(ScalarType::Text) | LinkedType::Enum(_) => ("Text", "cell"),
                LinkedType::Scalar(ScalarType::Decimal) => ("Decimal", "cell"),
                LinkedType::Scalar(ScalarType::Boolean) => ("Boolean", "cell"),
                LinkedType::Record(_) => ("Record", "cell"),
                LinkedType::Sequence(ref item)
                    if matches!(item.as_ref(), LinkedType::Record(_)) =>
                {
                    ("Records", "cell")
                }
                _ => {
                    return Err(unsupported(
                        self.entry,
                        "Variant field access requires a borrowed representation",
                    ));
                }
            };
            return Ok(format!(
                "(match {storage}{field})?{{core::inputs::InputRef::{variant}(cell)=>Ok({result}),_=>Err(RuntimeDiagnostic::new(\"input.type\",\"Wrong variant field type\"))}})?"
            ));
        }
        if let LinkedExpressionKind::Operation {
            operator: LinkedOperator::VariantText(_),
            ..
        } = &value.kind
            && let Some(storage) = &self.variant_text_storage
        {
            self.fallible = true;
            return Ok(storage.clone());
        }
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
            let union = matches!(&arguments[0].value_type, LinkedType::Index { value, .. } if matches!(value.as_ref(), LinkedType::Sequence(item) if **item == LinkedType::Scalar(ScalarType::Text)));
            return Ok(if union {
                format!("({index}).lookup({})?", key[0])
            } else {
                format!("({index}).lookup_parts(&[{}])?", key.join(","))
            });
        }
        if let LinkedExpressionKind::Operation {
            operator: LinkedOperator::LogicalAddress { parent },
            arguments,
        } = &value.kind
        {
            self.fallible = true;
            let first = Self::text_reference(&arguments[0], self.lower(&arguments[0])?);
            let constructor = if *parent {
                "from_encoded"
            } else {
                "from_segments"
            };
            let first = if *parent { first } else { format!("[{first}]") };
            let mut statements = format!(
                "{{let mut address=core::facts::identity::LogicalAddress::{constructor}({first})?;"
            );
            for part in &arguments[1..] {
                if let LinkedExpressionKind::CollectionPosition(depth) = part.kind {
                    write!(
                        statements,
                        "address.push_index(_inputs.collection_position_at({depth})? as u64)?;"
                    )
                    .unwrap();
                    continue;
                }
                if let LinkedExpressionKind::Ordinal(slot) = part.kind {
                    write!(statements, "address.push_index(_position{slot} as u64)?;").unwrap();
                    continue;
                }
                let code = self.lower(part)?;
                let (method, code) = match part.value_type {
                    LinkedType::Scalar(ScalarType::Text) => {
                        ("push_segment", Self::text_reference(part, code))
                    }
                    LinkedType::Scalar(ScalarType::Decimal) => ("push_decimal_index", code),
                    _ => unreachable!("linked address part type"),
                };
                write!(statements, "address.{method}({code})?;").unwrap();
            }
            statements.push_str("address.into_string()}");
            return Ok(statements);
        }
        if let LinkedExpressionKind::Operation {
            operator: LinkedOperator::Identity { domain, format },
            arguments,
        } = &value.kind
        {
            self.fallible = true;
            let values = arguments
                .iter()
                .map(|part| {
                    self.lower(part)
                        .map(|code| Self::text_reference(part, code))
                })
                .collect::<Result<Vec<_>, _>>()?;
            let format = match format.as_str() {
                "uuid" => "Uuid",
                "hex128" => "Hex128",
                "hex160" => "Hex160",
                _ => unreachable!("linked identity format"),
            };
            return Ok(format!(
                "core::facts::identity::derive({}, {domain:?}, core::facts::identity::IdentityFormat::{format}, &[{}])?",
                values[0],
                values[1..].join(",")
            ));
        }
        Ok(match &value.kind {
            LinkedExpressionKind::Capture(0)
                if value.value_type == LinkedType::Scalar(ScalarType::Text) =>
            {
                "captured".into()
            }
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
                if self.borrowed_sequence {
                    "core::inputs::Records::new(&_value.rows)".into()
                } else {
                    "&_value.rows".into()
                }
            }
            LinkedExpressionKind::Input(slot) => {
                self.fallible = true;
                let method = if let Some(method) = Self::scalar_input_method(&value.value_type) {
                    method
                } else {
                    match &value.value_type {
                        LinkedType::Index { key, value }
                            if crate::fact_shape::columns(key).is_some()
                                && **value == LinkedType::Scalar(ScalarType::Text) =>
                        {
                            "text_index"
                        }
                        value if crate::fact_shape::text_union_index(value) => "text_union_index",
                        LinkedType::Sequence(item)
                            if matches!(item.as_ref(), LinkedType::Record(_)) =>
                        {
                            "records"
                        }
                        LinkedType::Record(_) => "record",
                        LinkedType::Choice(_) => "value",
                        LinkedType::Reference(id)
                        | LinkedType::BoundReference { entry: id, .. }
                            if self.program.entries.iter().any(|entry| {
                                entry.id == *id && matches!(entry.value, LinkedType::Choice(_))
                            }) =>
                        {
                            "value"
                        }
                        LinkedType::Reference(id)
                        | LinkedType::BoundReference { entry: id, .. }
                            if self.program.entries.iter().any(|entry| {
                                entry.id == *id && matches!(entry.value, LinkedType::Record(_))
                            }) =>
                        {
                            "record"
                        }
                        LinkedType::Reference(_) => super::scalar::Codec::resolve(
                            &value.value_type,
                            self.entry,
                            self.program,
                        )?
                        .input_method()
                        .ok_or_else(|| {
                            unsupported(self.entry, "Input scalar has no borrowed representation")
                        })?,
                        LinkedType::Sequence(_) => "sequence",
                        _ => {
                            return Err(unsupported(
                                self.entry,
                                "Input expression type is not generated",
                            ));
                        }
                    }
                };
                format!("_inputs.{method}({slot})?")
            }
            LinkedExpressionKind::CollectionPosition(depth) => {
                self.fallible = true;
                format!("&core::decimal::from_position(_inputs.collection_position_at({depth})?)")
            }
            LinkedExpressionKind::Ordinal(slot) => {
                format!("&core::decimal::from_position(_position{slot})")
            }
            LinkedExpressionKind::Variable(slot) => match value.value_type {
                LinkedType::Scalar(ScalarType::Text) | LinkedType::Enum(_) => {
                    if self.borrowed_text_rows.contains(slot) {
                        format!("std::convert::AsRef::<str>::as_ref(v{slot})")
                    } else {
                        format!("std::convert::AsRef::<str>::as_ref(&v{slot})")
                    }
                }
                LinkedType::Scalar(ScalarType::Boolean) => format!("*v{slot}"),
                LinkedType::Scalar(ScalarType::Decimal) => format!("v{slot}"),
                LinkedType::Sequence(_) if self.union_rows.contains(slot) => {
                    format!("v{slot}.clone()")
                }
                LinkedType::Sequence(_) => format!("v{slot}.as_slice()"),
                LinkedType::Record(_) => format!("v{slot}"),
                LinkedType::Choice(_) if self.local_choice_types.contains_key(slot) => {
                    format!("v{slot}")
                }
                _ => {
                    return Err(unsupported(
                        self.entry,
                        "This local variable type is not generated",
                    ));
                }
            },
            LinkedExpressionKind::Field(index) => {
                if let Some(receiver) = &self.borrowed_record_storage {
                    let method = self.borrowed_field_method(&value.value_type)?;
                    return Ok(format!("({receiver}).{method}({index})?"));
                }
                if value.value_type == LinkedType::Scalar(ScalarType::Decimal)
                    && *index == 0
                    && let Some(decimal) = &self.decimal_field_storage
                {
                    self.fallible = true;
                    return Ok(decimal.clone());
                }
                if let Some(storage) = self.field_storage {
                    return storage
                        .get(*index as usize)
                        .filter(|value| !value.0.is_empty())
                        .map(|value| value.0.clone())
                        .ok_or_else(|| {
                            unsupported(
                                self.entry,
                                "This structured field requires a specialized constraint evaluator",
                            )
                        });
                }
                let field = &self.fields[*index as usize];
                scalar::Codec::resolve(&field.value, self.entry, self.program)?
                    .meaning(&format!("E{}F{index}", self.entry.id), *index as usize)
            }
            LinkedExpressionKind::Literal(ScalarLiteral::Boolean(value)) => value.to_string(),
            LinkedExpressionKind::Literal(ScalarLiteral::Text(text)) => {
                if matches!(&value.value_type,LinkedType::Optional(inner) if **inner==LinkedType::Scalar(ScalarType::Text))
                {
                    format!("Some({text:?}.to_owned())")
                } else {
                    format!("{text:?}")
                }
            }
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
                if *operator == LinkedOperator::Equal {
                    let constant = match (&arguments[0].kind, &arguments[1].kind) {
                        (
                            LinkedExpressionKind::Literal(ScalarLiteral::Text(left)),
                            LinkedExpressionKind::Literal(ScalarLiteral::Text(right)),
                        ) => Some(left == right),
                        (
                            LinkedExpressionKind::Literal(ScalarLiteral::Boolean(left)),
                            LinkedExpressionKind::Literal(ScalarLiteral::Boolean(right)),
                        ) => Some(left == right),
                        _ => None,
                    };
                    if let Some(value) = constant {
                        return Ok(value.to_string());
                    }
                    for (literal, other) in [
                        (&arguments[0], &arguments[1]),
                        (&arguments[1], &arguments[0]),
                    ] {
                        if matches!(&literal.kind, LinkedExpressionKind::Literal(ScalarLiteral::Text(text)) if text.is_empty())
                            && other.value_type == LinkedType::Scalar(ScalarType::Text)
                        {
                            let value = self.lower(other)?;
                            return Ok(format!("{{let text={value};text.is_empty()}}"));
                        }
                    }
                }
                if let LinkedOperator::Matches(pattern) = operator {
                    let input = self.comparison_text(&arguments[0])?;
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
                    return Ok(format!(
                        "{{let text={input};P{index}.matches(std::convert::AsRef::<str>::as_ref(&text))?}}"
                    ));
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
                    self.borrowed_rows.remove(item);
                    self.local_choice_types.remove(item);
                    let next = next?;
                    return Ok(format!(
                        "{{let mut accumulated={initial};if accumulated.is_some(){{for v{item} in {sequence} {{let Some(v{state})=accumulated else{{break;}};accumulated={next};}}}}accumulated}}"
                    ));
                }
                if let LinkedOperator::MatchOptional(slot) = operator {
                    let input = self.lower(&arguments[0])?;
                    let union = matches!(&arguments[0].kind, LinkedExpressionKind::Operation { operator: LinkedOperator::Lookup, arguments } if matches!(&arguments[0].value_type, LinkedType::Index { value, .. } if matches!(value.as_ref(), LinkedType::Sequence(item) if **item == LinkedType::Scalar(ScalarType::Text))));
                    if union {
                        self.union_rows.insert(*slot);
                    }
                    if let LinkedType::Optional(inner) = &arguments[0].value_type
                        && let LinkedType::Record(fields) = inner.as_ref()
                    {
                        self.borrowed_rows.insert(*slot, fields.clone());
                    }
                    let optional_text = matches!(&value.value_type,LinkedType::Optional(inner) if **inner==LinkedType::Scalar(ScalarType::Text));
                    let present = if optional_text {
                        self.optional_text(&arguments[1])
                    } else {
                        self.lower(&arguments[1])
                    };
                    self.borrowed_rows.remove(slot);
                    if union {
                        self.union_rows.remove(slot);
                    }
                    let mut present = present?;
                    let mut absent = if optional_text {
                        self.optional_text(&arguments[2])?
                    } else {
                        self.lower(&arguments[2])?
                    };
                    if value.value_type == LinkedType::Scalar(ScalarType::Text) {
                        present = Self::text_owned(&arguments[1], present);
                        absent = Self::text_owned(&arguments[2], absent);
                    }
                    return Ok(format!(
                        "{{let selected_input={input};match selected_input{{Some(v{slot})=>{present},None=>{absent}}}}}"
                    ));
                }
                if *operator == LinkedOperator::Conditional
                    && matches!(&value.value_type, LinkedType::Optional(inner) if **inner==LinkedType::Scalar(ScalarType::Text))
                {
                    let condition = self.lower(&arguments[0])?;
                    let yes = self.optional_text(&arguments[1])?;
                    let no = self.optional_text(&arguments[2])?;
                    return Ok(format!(
                        "{{let condition={condition};if condition {{ {yes} }} else {{ {no} }}}}"
                    ));
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
                if matches!(
                    operator,
                    LinkedOperator::State(StatePredicate::Present | StatePredicate::IsReady)
                ) && let LinkedExpressionKind::Operation {
                    operator: LinkedOperator::VariantField { variant, field },
                    arguments: choice,
                } = &arguments[0].kind
                    && let LinkedExpressionKind::Input(slot) = choice[0].kind
                {
                    self.fallible = true;
                    return Ok(format!(
                        "_inputs.choice_record({slot},{variant})?.field({field}).is_some_and(|value| value.is_present())"
                    ));
                }
                if matches!(
                    operator,
                    LinkedOperator::State(StatePredicate::Present | StatePredicate::IsReady)
                ) && let LinkedExpressionKind::Operation {
                    operator: LinkedOperator::Get(index),
                    arguments: row,
                } = &arguments[0].kind
                    && (self.borrowed_origin(&row[0])
                        || matches!(row[0].kind, LinkedExpressionKind::Variable(slot) if self.borrowed_rows.contains_key(&slot)))
                {
                    let receiver = self.lower(&row[0])?;
                    return Ok(format!(
                        "({receiver}).field({index}).is_some_and(|value| value.is_present())"
                    ));
                }
                if *operator == LinkedOperator::State(StatePredicate::IsNull) {
                    if let LinkedExpressionKind::Input(slot) = arguments[0].kind {
                        self.fallible = true;
                        return Ok(format!("_inputs.is_null({slot})?"));
                    }
                    if let LinkedExpressionKind::Field(index) = arguments[0].kind
                        && let Some(storage) = &self.null_field_storage
                    {
                        return storage
                            .get(index as usize)
                            .cloned()
                            .ok_or_else(|| unsupported(self.entry, "Null field has no storage"));
                    }
                    if let LinkedExpressionKind::Field(index) = arguments[0].kind
                        && let Some(receiver) = &self.borrowed_record_storage
                    {
                        return Ok(format!(
                            "({receiver}).field({index}).is_some_and(core::inputs::InputRef::is_null)"
                        ));
                    }
                }
                if *operator == LinkedOperator::State(StatePredicate::Present)
                    && let LinkedExpressionKind::Input(slot) = arguments[0].kind
                {
                    self.fallible = true;
                    return Ok(format!("_inputs.is_present({slot})?"));
                }
                if matches!(
                    operator,
                    LinkedOperator::State(StatePredicate::Present | StatePredicate::IsReady)
                ) && let LinkedExpressionKind::Field(index) = arguments[0].kind
                    && let Some(receiver) = &self.borrowed_record_storage
                {
                    return Ok(format!(
                        "({receiver}).field({index}).is_some_and(|value|value.is_present())"
                    ));
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
                    if !matches!(arguments[0].value_type, LinkedType::Optional(_)) {
                        return Ok("true".into());
                    }
                    return Err(unsupported(self.entry, "Readiness requires an input slot"));
                }
                if let LinkedOperator::Filter(slot) = operator {
                    let sequence = self.lower(&arguments[0])?;
                    let predicate =
                        self.lower_bound_predicate(&arguments[0], &arguments[1], *slot)?;
                    let LinkedType::Sequence(item) = &arguments[0].value_type else {
                        return Err(unsupported(self.entry, "Filtering requires a sequence"));
                    };
                    if matches!(item.as_ref(), LinkedType::Scalar(ScalarType::Text))
                        && matches!(arguments[0].kind, LinkedExpressionKind::Input(_))
                    {
                        self.fallible = true;
                        return Ok(format!(
                            "{{let mut selected=Vec::new();for item in {sequence}{{let InputValue::Text(v{slot})=item else{{return Err(RuntimeDiagnostic::new(\"input.type\",\"Unexpected sequence item type\"));}};if {predicate}{{selected.push(R{}{{fields:[v{slot}.clone()]}});}}}}core::Sequence::Present(selected)}}",
                            self.entry.id
                        ));
                    }
                    if matches!(item.as_ref(), LinkedType::Scalar(ScalarType::Text))
                        && matches!(arguments[0].kind, LinkedExpressionKind::SelfValue)
                    {
                        return Ok(format!(
                            "{{let mut selected=Vec::new();for row in {sequence}{{let v{slot}=&row.fields[0];if {predicate}{{selected.push(R{}{{fields:[v{slot}.clone()]}});}}}}core::Sequence::Present(selected)}}",
                            self.entry.id
                        ));
                    }
                    return Err(unsupported(
                        self.entry,
                        "Filtering currently requires scalar text sequence storage",
                    ));
                }
                if let LinkedOperator::Find(slot) = operator {
                    if matches!(arguments[0].kind, LinkedExpressionKind::Input(_))
                        && matches!(&arguments[0].value_type, LinkedType::Sequence(item) if matches!(item.as_ref(), LinkedType::Scalar(ScalarType::Text)))
                    {
                        let sequence = self.lower(&arguments[0])?;
                        let predicate = self.lower(&arguments[1])?;
                        self.fallible = true;
                        return Ok(format!(
                            "{{let mut found=None;for item in {sequence}{{let InputValue::Text(v{slot})=item else{{return Err(RuntimeDiagnostic::new(\"input.type\",\"Unexpected sequence item type\"));}};if {predicate}{{found=Some(v{slot}.as_str());break;}}}}found}}"
                        ));
                    }
                    if !matches!(arguments[0].kind, LinkedExpressionKind::Input(_))
                        || !self.bind_typed_row(&arguments[0], *slot)?
                    {
                        return Err(unsupported(
                            self.entry,
                            "Finding currently requires borrowed declared records",
                        ));
                    }
                    let sequence = self.lower(&arguments[0])?;
                    let predicate = self.lower(&arguments[1]);
                    self.borrowed_rows.remove(slot);
                    let predicate = predicate?;
                    return Ok(format!(
                        "{{let mut found=None;for v{slot} in {sequence}{{if {predicate}{{found=Some(v{slot});break;}}}}found}}"
                    ));
                }
                if let LinkedOperator::FirstBy(slot) = operator {
                    if matches!(
                        Self::sequence_origin(&arguments[0]).kind,
                        LinkedExpressionKind::Operation {
                            operator: LinkedOperator::Sequence | LinkedOperator::Map(_),
                            ..
                        }
                    ) {
                        return Err(unsupported(
                            self.entry,
                            "First-key view of constructed owned rows is not generated",
                        ));
                    }
                    let sequence = self.lower(&arguments[0])?;
                    self.borrowed_text_rows.insert(*slot);
                    let key = self.lower_bound_predicate(&arguments[0], &arguments[1], *slot);
                    self.borrowed_text_rows.remove(slot);
                    let key = key?;
                    let LinkedType::Sequence(item) = &arguments[0].value_type else {
                        return Err(unsupported(
                            self.entry,
                            "First-key view requires a sequence",
                        ));
                    };
                    let binding = self.iteration_binding(&arguments[0], item, *slot)?;
                    let retained = if matches!(item.as_ref(), LinkedType::Record(_)) {
                        format!("v{slot}")
                    } else {
                        "item".to_owned()
                    };
                    return Ok(format!(
                        "{{let mut seen=std::collections::HashSet::new();let mut selected=Vec::new();for item in {sequence}{{{binding}if seen.insert({key}){{selected.push({retained});}}}}selected}}"
                    ));
                }
                if let LinkedOperator::Each(slot)
                | LinkedOperator::Exists(slot)
                | LinkedOperator::One(slot)
                | LinkedOperator::Select(slot) = operator
                {
                    if matches!(
                        operator,
                        LinkedOperator::Each(_) | LinkedOperator::Exists(_)
                    ) && let LinkedExpressionKind::Operation {
                        operator: LinkedOperator::Sequence,
                        arguments: rows,
                    } = &arguments[0].kind
                    {
                        if let LinkedType::Sequence(item) = &arguments[0].value_type
                            && let LinkedType::Record(fields) = item.as_ref()
                            && rows.iter().all(|row| {
                                matches!(
                                    row.kind,
                                    LinkedExpressionKind::Operation {
                                        operator: LinkedOperator::Record(_),
                                        ..
                                    }
                                )
                            })
                        {
                            let mut predicates = Vec::with_capacity(rows.len());
                            for row in rows {
                                let LinkedExpressionKind::Operation {
                                    operator: LinkedOperator::Record(names),
                                    arguments: values,
                                } = &row.kind
                                else {
                                    unreachable!()
                                };
                                let field_values = fields
                                    .iter()
                                    .map(|field| {
                                        let index = names
                                            .iter()
                                            .position(|name| *name == field.name)
                                            .ok_or_else(|| {
                                                unsupported(
                                                    self.entry,
                                                    "Missing static record field",
                                                )
                                            })?;
                                        self.lower(&values[index])
                                    })
                                    .collect::<Result<Vec<_>, _>>()?;
                                self.local_fields.insert(*slot, field_values);
                                let predicate = self.lower(&arguments[1]);
                                self.local_fields.remove(slot);
                                predicates.push(predicate?);
                            }
                            let each = matches!(operator, LinkedOperator::Each(_));
                            let fallback = each.to_string();
                            return Ok(if predicates.is_empty() {
                                fallback
                            } else {
                                format!("({})", predicates.join(if each { " && " } else { " || " }))
                            });
                        }
                        let values = rows
                            .iter()
                            .map(|row| self.lower(row))
                            .collect::<Result<Vec<_>, _>>()?;
                        let predicate =
                            self.lower_bound_predicate(&arguments[0], &arguments[1], *slot)?;
                        let each = matches!(operator, LinkedOperator::Each(_));
                        let condition = if each {
                            format!("!({predicate})")
                        } else {
                            predicate
                        };
                        return Ok(format!(
                            "{{let mut matched={each};for v{slot} in [{}]{{if {condition}{{matched={};break;}}}}matched}}",
                            values.join(","),
                            !each
                        ));
                    }
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
                    let predicate =
                        self.lower_bound_predicate(&arguments[0], &arguments[1], *slot)?;
                    let LinkedType::Sequence(item) = &arguments[0].value_type else {
                        return Err(unsupported(self.entry, "Iteration requires a sequence"));
                    };
                    let union = matches!(arguments[0].kind, LinkedExpressionKind::Variable(owner) if self.union_rows.contains(&owner));
                    if matches!(operator, LinkedOperator::One(_) | LinkedOperator::Select(_)) {
                        let binding = self.iteration_binding(&arguments[0], item, *slot)?;
                        self.fallible = true;
                        let selected = matches!(operator, LinkedOperator::Select(_));
                        if selected
                            && !(matches!(item.as_ref(), LinkedType::Record(_))
                                && matches!(arguments[0].kind, LinkedExpressionKind::Input(_)))
                        {
                            return Err(unsupported(
                                self.entry,
                                "Selection currently requires borrowed declared records",
                            ));
                        }
                        let sequence = if selected {
                            "_selected_rows".to_owned()
                        } else {
                            sequence.clone()
                        };
                        let selection = format!(
                            "core::sequence_pattern::select_matching(({sequence}).iter().map(|item|->core::Result<bool>{{{binding}Ok({predicate})}}))?"
                        );
                        return Ok(if selected {
                            format!(
                                "{{let _selected_rows={};let selection={selection};_selected_rows.selected(selection)}}",
                                self.lower(&arguments[0])?
                            )
                        } else {
                            format!(
                                "matches!({selection},core::sequence_pattern::Selection::Unique(_))"
                            )
                        });
                    }
                    if matches!(item.as_ref(), LinkedType::Scalar(ScalarType::Text))
                        && matches!(
                            Self::sequence_origin(&arguments[0]).kind,
                            LinkedExpressionKind::SelfValue
                        )
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
                    if union {
                        let each = matches!(operator, LinkedOperator::Each(_));
                        let condition = if each {
                            format!("!({predicate})")
                        } else {
                            predicate
                        };
                        return Ok(format!(
                            "{{let mut matched={each};for v{slot} in {sequence}{{if {condition}{{matched={};break;}}}}matched}}",
                            !each
                        ));
                    }
                    let variant = self.input_variant(item)?;
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
                            "matches!({}, {}::V{variant}(_))",
                            values[0],
                            self.field_type_name(owner)
                        )
                    }
                    LinkedOperator::VariantValue(variant) => {
                        let LinkedExpressionKind::Field(owner) = arguments[0].kind else {
                            return Err(unsupported(
                                self.entry,
                                "Scalar variant projection requires an owning field",
                            ));
                        };
                        let selected =
                            if matches!(value.value_type, LinkedType::Scalar(ScalarType::Text)) {
                                "selected.as_str()"
                            } else if matches!(
                                value.value_type,
                                LinkedType::Scalar(ScalarType::Boolean)
                            ) {
                                "*selected"
                            } else {
                                "selected"
                            };
                        let exhaustive = self.fields[owner as usize].value.as_reference()
                            .and_then(|(id, _, _)| self.program.entries.iter().find(|entry| entry.id == id))
                            .is_some_and(|entry| matches!(&entry.value, LinkedType::Choice(variants) if variants.len() == 1));
                        let otherwise = if exhaustive {
                            ""
                        } else {
                            ", _=>unreachable!(\"guarded scalar variant\")"
                        };
                        format!(
                            "match {} {{ {}::V{variant}(selected)=>{selected}{otherwise} }}",
                            values[0],
                            self.field_type_name(owner)
                        )
                    }
                    LinkedOperator::VariantText(variant) => {
                        let LinkedExpressionKind::Field(owner) = arguments[0].kind else {
                            return Err(unsupported(
                                self.entry,
                                "Variant text requires an owning field",
                            ));
                        };
                        self.fallible = true;
                        format!(
                            "match {} {{ {}::V{variant}(selected)=>selected.write_text(false)?, _=>unreachable!(\"guarded text variant\") }}",
                            values[0],
                            self.field_type_name(owner)
                        )
                    }
                    LinkedOperator::ParseYaml => {
                        return Err(unsupported(
                            self.entry,
                            "YAML parsing is only generated for typed missing values",
                        ));
                    }
                    LinkedOperator::TextSegmentPrefix(separator) => {
                        let value = Self::text_reference(&arguments[0], values[0].clone());
                        let prefix = Self::text_reference(&arguments[1], values[1].clone());
                        let separator = format!("{separator:?}");
                        format!(
                            "({value}).strip_prefix({prefix}).is_some_and(|tail|tail.starts_with({separator})&&tail.len()>{separator}.len())"
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
                        let name = self.field_type_name(owner);
                        let meaning = choice.field_meaning(
                            *variant as usize,
                            &format!("{name}V{variant}"),
                            *field as usize,
                            "selected",
                        )?;
                        let one_variant = match &self.fields[owner as usize].value {
                            LinkedType::Reference(id)
                            | LinkedType::BoundReference { entry: id, .. } => self
                                .program
                                .value(ValueId(*id))
                                .is_some_and(|target| {
                                    matches!(&target.entry.value, LinkedType::Choice(variants) if variants.len() == 1)
                                }),
                            LinkedType::Choice(variants) => variants.len() == 1,
                            _ => false,
                        };
                        let otherwise = if one_variant {
                            String::new()
                        } else {
                            ", _=>unreachable!(\"guarded variant\")".into()
                        };
                        format!(
                            "match {} {{ {name}::V{variant}(selected)=>{meaning}{otherwise} }}",
                            values[0]
                        )
                    }
                    LinkedOperator::Get(index) => {
                        if let LinkedExpressionKind::Input(slot) = arguments[0].kind
                            && let Some(method) = Self::scalar_input_method(&value.value_type)
                        {
                            self.fallible = true;
                            return Ok(format!("_inputs.record({slot})?.{method}({index})?"));
                        }
                        if let LinkedExpressionKind::Input(slot) = arguments[0].kind
                            && matches!(&value.value_type, LinkedType::Sequence(item) if matches!(item.as_ref(), LinkedType::Record(_)))
                        {
                            self.fallible = true;
                            return Ok(format!("_inputs.record({slot})?.records({index})?"));
                        }
                        if let LinkedExpressionKind::Variable(slot) = arguments[0].kind
                            && self.borrowed_rows.contains_key(&slot)
                        {
                            let method = self.borrowed_method(slot, *index)?;
                            self.fallible = true;
                            return Ok(format!("v{slot}.{method}({index})?"));
                        }
                        if let LinkedExpressionKind::Variable(slot) = arguments[0].kind
                            && let Some(fields) = self.local_fields.get(&slot)
                        {
                            return fields.get(*index as usize).cloned().ok_or_else(|| {
                                unsupported(self.entry, "Typed row field is unavailable")
                            });
                        }
                        if let LinkedExpressionKind::Field(owner) = arguments[0].kind {
                            let name = self.field_type_name(owner);
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
                    LinkedOperator::TextLengthAtMost | LinkedOperator::TextLengthEquals => {
                        let text = Self::text_reference(&arguments[0], values[0].clone());
                        let limit = Self::text_reference(&arguments[1], values[1].clone());
                        let comparison = if matches!(operator, LinkedOperator::TextLengthEquals) {
                            "=="
                        } else {
                            "<="
                        };
                        format!(
                            "({limit}).parse::<usize>().ok().is_some_and(|maximum| ({text}).encode_utf16().count() {comparison} maximum)"
                        )
                    }
                    LinkedOperator::CalendarFits => {
                        let fraction = Self::text_reference(&arguments[1], values[1].clone());
                        if matches!(arguments[0].kind, LinkedExpressionKind::Field(0))
                            && let Some(calendar) = &self.calendar_field_storage
                        {
                            format!(
                                "match {calendar}{{Ok(date)=>date.fits_fraction({fraction}),Err(_)=>false}}"
                            )
                        } else {
                            let date = Self::text_reference(&arguments[0], values[0].clone());
                            format!("core::calendar::fits_fraction({date}, {fraction})")
                        }
                    }
                    LinkedOperator::DecimalText | LinkedOperator::EnumText => {
                        format!("({}).to_string()", values[0])
                    }
                    LinkedOperator::DecimalFits => {
                        let digits = Self::text_reference(&arguments[1], values[1].clone());
                        let fraction = Self::text_reference(&arguments[2], values[2].clone());
                        let sign = Self::text_reference(&arguments[3], values[3].clone());
                        format!(
                            "core::decimal::fits_qualifiers({}, {digits}, {fraction}, {sign})",
                            values[0]
                        )
                    }
                    LinkedOperator::MatchOptional(_) => {
                        unreachable!("optional match lowered before scalar operators")
                    }
                    LinkedOperator::Find(_) | LinkedOperator::Map(_) => {
                        unreachable!("collection operator lowered before scalar operators")
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
                                "{{let condition={};if condition {{ {} }} else {{ {} }}}}",
                                values[0],
                                Self::text_owned(&arguments[1], values[1].clone()),
                                Self::text_owned(&arguments[2], values[2].clone())
                            )
                        } else {
                            format!(
                                "{{let condition={};if condition {{ {} }} else {{ {} }}}}",
                                values[0], values[1], values[2]
                            )
                        }
                    }
                    _ => {
                        return Err(unsupported(
                            self.entry,
                            &format!(
                                "Constraint operation {operator:?} is not generated by the scalar profile"
                            ),
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

/// Copy a declared scalar cell, retaining preservation evidence independently of its type.
pub(super) fn semantic_cell(
    entry: &LinkedEntry,
    program: &Program,
    value: &LinkedExpression,
) -> Result<Option<(String, String)>, Diagnostic> {
    let LinkedType::Record(fields) = &entry.value else {
        return Ok(None);
    };
    let mut context = Expressions::new(entry, program, fields, None);
    let code = match &value.kind {
        LinkedExpressionKind::Input(slot) => {
            format!("Some(_inputs.slot({slot}).map_or_else(||_inputs.value({slot}),Ok)?)")
        }
        LinkedExpressionKind::Operation {
            operator: LinkedOperator::Get(index),
            arguments,
        } if context.borrowed_origin(&arguments[0]) => {
            let source = context.lower(&arguments[0])?;
            format!("({source}).field({index})")
        }
        LinkedExpressionKind::Operation {
            operator: LinkedOperator::VariantField { variant, field },
            arguments,
        } if context.borrowed_origin(&arguments[0]) => {
            let source = context.lower(&arguments[0])?;
            format!("({source}).choice_record({variant})?.field({field})")
        }
        LinkedExpressionKind::Operation {
            operator: LinkedOperator::VariantValue(variant),
            arguments,
        } if context.borrowed_origin(&arguments[0]) => {
            let source = context.lower(&arguments[0])?;
            format!("({source}).choice_record({variant})?.field(0)")
        }
        _ => return Ok(None),
    };
    Ok(Some((context.constants, code)))
}

/// Lower a calendar-producing expression to components, retaining text semantics elsewhere.
pub(super) fn calendar_expression(
    entry: &LinkedEntry,
    program: &Program,
    value: &LinkedExpression,
    storage: Option<&[(String, String)]>,
) -> Result<(String, String), Diagnostic> {
    let LinkedType::Record(fields) = &entry.value else {
        return Err(unsupported(
            entry,
            "Calendar expression requires record storage",
        ));
    };
    let mut context = Expressions::new(entry, program, fields, storage);
    fn lower(
        context: &mut Expressions<'_>,
        value: &LinkedExpression,
    ) -> Result<String, Diagnostic> {
        match &value.kind {
            LinkedExpressionKind::Input(slot) => Ok(format!("_inputs.calendar({slot})?")),
            LinkedExpressionKind::Field(index) => {
                Ok(if let Some(storage) = context.field_storage {
                    storage[*index as usize].0.clone()
                } else {
                    format!(
                        "_value.f{index}.as_ref().ok_or_else(||RuntimeDiagnostic::new(\"value.missing\",\"Calendar source is absent\"))?"
                    )
                })
            }
            LinkedExpressionKind::Operation {
                operator: LinkedOperator::Get(index),
                arguments,
            } => {
                let source = context.lower(&arguments[0])?;
                Ok(format!("({source}).calendar({index})?"))
            }
            LinkedExpressionKind::Operation {
                operator: LinkedOperator::VariantField { variant, field },
                arguments,
            } => {
                let source = context.lower(&arguments[0])?;
                Ok(format!(
                    "({source}).choice_record({variant})?.calendar({field})?"
                ))
            }
            LinkedExpressionKind::Operation {
                operator: LinkedOperator::VariantValue(variant),
                arguments,
            } => {
                let source = context.lower(&arguments[0])?;
                Ok(format!("({source}).choice_record({variant})?.calendar(0)?"))
            }
            LinkedExpressionKind::Operation {
                operator: LinkedOperator::Conditional,
                arguments,
            } => {
                let condition = context.lower(&arguments[0])?;
                let yes = lower(context, &arguments[1])?;
                let no = lower(context, &arguments[2])?;
                Ok(format!("if {condition}{{{yes}}}else{{{no}}}"))
            }
            LinkedExpressionKind::Literal(ScalarLiteral::Text(text)) => {
                let date = nkdk_conversion_core::calendar::Value::from_xml(text).map_err(|_| {
                    unsupported(context.entry, "Invalid calendar construction constant")
                })?;
                Ok(format!(
                    "&const {{core::calendar::Value::from_parts({:?}).expect(\"validated calendar constant\")}}",
                    date.parts()
                ))
            }
            _ => Err(unsupported(
                context.entry,
                "Calendar construction expression is not generated",
            )),
        }
    }
    let code = lower(&mut context, value)?;
    Ok((context.constants, code))
}

pub(super) fn expression(
    entry: &LinkedEntry,
    program: &Program,
    value: &LinkedExpression,
) -> Result<(String, String), Diagnostic> {
    expression_with_storage(entry, program, value, None)
}

pub(super) fn expression_with_storage(
    entry: &LinkedEntry,
    program: &Program,
    value: &LinkedExpression,
    storage: Option<&[(String, String)]>,
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
    let mut expressions = Expressions::new(entry, program, fields, storage);
    let code = expressions.lower(value)?;
    Ok((expressions.constants, code))
}

pub(super) fn borrowed_filter(
    entry: &LinkedEntry,
    program: &Program,
    input: &LinkedExpression,
    slot: u32,
    predicate: &LinkedExpression,
) -> Result<(String, String, String), Diagnostic> {
    let mut expressions = Expressions::new(entry, program, &[], None);
    if !expressions.bind_typed_row(input, slot)? {
        return Err(unsupported(
            entry,
            "Declared filtering requires borrowed record rows",
        ));
    }
    let sequence = expressions.lower(input)?;
    let predicate = expressions.lower(predicate)?;
    Ok((expressions.constants, sequence, predicate))
}

pub(super) struct BorrowedMap {
    pub constants: String,
    pub sequence: String,
    pub predicate: Option<String>,
    pub values: Vec<String>,
    pub text_sequence: bool,
}

pub(super) fn borrowed_map(
    entry: &LinkedEntry,
    program: &Program,
    input: &LinkedExpression,
    slot: u32,
    values: &[&LinkedExpression],
) -> Result<BorrowedMap, Diagnostic> {
    let mut expressions = Expressions::new(entry, program, &[], None);
    let (source, predicate) = match &input.kind {
        LinkedExpressionKind::Operation {
            operator: LinkedOperator::Filter(filter_slot),
            arguments,
        } if *filter_slot == slot => (&arguments[0], Some(&arguments[1])),
        _ => (input, None),
    };
    let text_sequence = matches!(source.kind, LinkedExpressionKind::Input(_))
        && matches!(&source.value_type, LinkedType::Sequence(item) if matches!(item.as_ref(), LinkedType::Scalar(ScalarType::Text)));
    if !text_sequence && !expressions.bind_typed_row(source, slot)? {
        return Err(unsupported(
            entry,
            "Declared mapping requires borrowed record rows or text items",
        ));
    }
    let sequence = expressions.lower(source)?;
    let predicate = predicate
        .map(|predicate| expressions.lower(predicate))
        .transpose()?;
    let values = values
        .iter()
        .map(|value| expressions.lower(value))
        .collect::<Result<Vec<_>, _>>()?;
    Ok(BorrowedMap {
        constants: expressions.constants,
        sequence,
        predicate,
        values,
        text_sequence,
    })
}

pub(super) fn record_storage(
    entry: &LinkedEntry,
    program: &Program,
    fields: &[LinkedField],
) -> Result<Vec<(String, String)>, Diagnostic> {
    fields
        .iter()
        .enumerate()
        .map(|(index, field)| {
            let readiness = format!("_value.f{index}.is_some()");
            let meaning = match super::scalar::Codec::resolve(&field.value, entry, program) {
                Ok(codec) => codec.optional_meaning(&format!("E{}F{index}", entry.id), index),
                Err(_) if super::scalar::structured_reference(&field.value, program) => {
                    String::new()
                }
                Err(error) => return Err(error),
            };
            Ok((meaning, readiness))
        })
        .collect()
}

/// Position is bound by enumeration before any per-row predicate is evaluated.
pub(super) fn iteration_loop(iteration: &LinkedIteration, input: &str, binding: &str) -> String {
    match iteration.index {
        Some(slot) => {
            format!("for (_position{slot},{binding}) in ({input}).into_iter().enumerate() {{")
        }
        None => format!("for {binding} in {input} {{"),
    }
}
