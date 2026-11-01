mod defaults;
mod optional;
use super::*;
use std::fmt::Write;

enum DefinitionMode {
    Standalone,
    Item,
    Projected,
}

pub(super) struct Codec<'a> {
    common: &'a LinkedEntry,
    bound_common: Option<Box<LinkedEntry>>,
    program: &'a Program<'a>,
    fields: Vec<scalar::Codec<'a>>,
    xml: &'a [TextPatternPart],
    yaml: &'a [TextPatternPart],
    names: Vec<&'a str>,
    bound_scope: String,
}
impl<'a> Codec<'a> {
    pub(super) fn constructible(&self) -> bool {
        self.fields
            .iter()
            .all(super::scalar_construction::supported)
    }

    pub(super) fn record_default(
        &self,
        expression: &LinkedExpression,
        name: &str,
        owner: &LinkedEntry,
        program: &Program,
    ) -> Result<String, Diagnostic> {
        if !self.constructible() {
            return Err(unsupported(
                owner,
                "Text record has unsupported semantic fields",
            ));
        }
        super::declared_construction::record_expression(
            expression,
            owner,
            self.entry(),
            program,
            name,
        )
    }

    pub(super) fn has_child_checks(&self) -> bool {
        !self.entry().constraints.is_empty()
    }
    pub(super) fn exclude_lifted_checks(&mut self, owner: &LinkedEntry) {
        if owner.constraints.is_empty() {
            return;
        }
        let mut entry = self.entry().clone();
        entry.constraints.retain(|rule| {
            !owner
                .constraints
                .iter()
                .any(|lifted| lifted.source == rule.source)
        });
        self.bound_common = Some(Box::new(entry));
    }
    pub(super) fn qname_parts(&self) -> Option<(&str, &str)> {
        let TextPatternValue::Literal(literal) = &self.xml.first()?.value else {
            return None;
        };
        let prefix = literal.strip_suffix(':')?;
        if !nkdk_conversion_core::xml::is_ncname(prefix) {
            return None;
        }
        let namespace = self
            .entry()
            .namespaces
            .iter()
            .find(|binding| binding.name == prefix)?;
        Some((literal, namespace.value.as_str()))
    }
    fn entry(&self) -> &LinkedEntry {
        self.bound_common.as_deref().unwrap_or(self.common)
    }
    pub(super) fn bound_scope(&self) -> &str {
        &self.bound_scope
    }
    pub(super) fn bind_inputs(
        &mut self,
        bindings: &[LinkedBinding],
        owner: &LinkedEntry,
    ) -> Result<(), Diagnostic> {
        if bindings.is_empty() {
            return Ok(());
        }
        let direct = |value: &LinkedExpression| {
            matches!(value.kind, LinkedExpressionKind::Input(_))
                || matches!(&value.kind, LinkedExpressionKind::Operation {operator: LinkedOperator::Get(_), arguments}
                if matches!(arguments.as_slice(), [source] if matches!(source.kind, LinkedExpressionKind::Input(_))))
        };
        if bindings.iter().any(|binding| !direct(&binding.value)) {
            if !bindings
                .iter()
                .all(|binding| defaults::prepared(&binding.value))
            {
                return Err(unsupported(
                    owner,
                    "Text-pattern bindings require prepared caller expressions",
                ));
            }
            let mut bound = self.common.clone();
            crate::link::sequence_item::rebind_input_expressions(&mut bound, bindings)?;
            bound.inputs = owner.inputs.clone();
            self.bound_common = Some(Box::new(bound));
            self.bound_scope.clear();
            return Ok(());
        }
        let mut slots = vec!["None".to_owned(); self.common.inputs.len()];
        for binding in bindings {
            let source = match &binding.value.kind {
                LinkedExpressionKind::Input(source) => format!("_inputs.slot({source})"),
                LinkedExpressionKind::Operation {
                    operator: LinkedOperator::Get(field),
                    arguments,
                } if matches!(arguments.as_slice(), [source]
                    if matches!(source.kind, LinkedExpressionKind::Input(_))) =>
                {
                    let LinkedExpressionKind::Input(input) = arguments[0].kind else {
                        unreachable!()
                    };
                    format!(
                        "match _inputs.slot({input}){{Some(core::inputs::InputRef::Record(row))=>row.field({field}),Some(core::inputs::InputRef::MissingValue)=>Some(core::inputs::InputRef::MissingValue),None=>None,_=>Some(core::inputs::InputRef::MissingValue)}}"
                    )
                }
                _ => {
                    return Err(unsupported(
                        owner,
                        "Text-pattern input bindings require prepared caller slots",
                    ));
                }
            };
            slots[binding.slot as usize] = source;
        }
        self.bound_scope = format!(
            "let _bound_slots=[{}];let _bound_inputs=_inputs.rebind(&_bound_slots);let _inputs=&_bound_inputs;",
            slots.join(",")
        );
        Ok(())
    }
    fn constrained_slot(
        &self,
        index: usize,
        xml: bool,
        delimiter: Option<&str>,
    ) -> Option<Vec<crate::automata::Part>> {
        let LinkedType::Record(fields) = &self.entry().value else {
            return None;
        };
        let LinkedType::Reference(id) = fields[index].value else {
            return None;
        };
        let target = self.program.value(crate::plan::ValueId(id))?.entry;
        target.constraints.iter().find_map(|constraint| {
            let LinkedExpressionKind::Operation {
                operator: LinkedOperator::Matches(pattern),
                arguments,
            } = &constraint.assertion.kind
            else {
                return None;
            };
            if constraint.when.is_some()
                || constraint.for_each.is_some()
                || !constraint.applies_to.contains(&if xml {
                    ValidationPhase::XmlImport
                } else {
                    ValidationPhase::YamlValidation
                })
                || !matches!(arguments.as_slice(), [argument] if matches!(argument.kind, LinkedExpressionKind::SelfValue))
            {
                return None;
            }
            let delimited = (|| {
                let delimiter = delimiter?.as_bytes();
                let &[byte] = delimiter else { return None };
                pattern_excludes_byte(pattern, byte)
                    .then(|| vec![crate::automata::Part::Cell(String::from_utf8_lossy(delimiter).into_owned())])
            })();
            ascii_class_exact(pattern)
                .map(|part| vec![part])
                .or(delimited)
                .or_else(|| ascii_class_plus(pattern).map(|part| vec![part]))
                .or_else(|| leading_ascii_class(pattern).map(|ranges| {
                    vec![crate::automata::Part::AsciiClassPlus(ranges), crate::automata::Part::Rest]
                }))
        })
    }
    pub(super) fn resolve(
        common: &'a LinkedEntry,
        program: &'a Program<'a>,
    ) -> Result<Self, Diagnostic> {
        let (
            LinkedType::Record(fields),
            LinkedXml::TextPattern(xml),
            YamlRepresentation::TextPattern(yaml),
        ) = (
            &common.value,
            attributes::content(&common.xml).0,
            &common.yaml,
        )
        else {
            return Err(unsupported(
                common,
                "Text record requires paired text patterns",
            ));
        };
        Self::resolve_parts(common, program, fields, xml, yaml)
    }
    pub(super) fn resolve_parts(
        common: &'a LinkedEntry,
        program: &'a Program<'a>,
        fields: &'a [LinkedField],
        xml: &'a [TextPatternPart],
        yaml: &'a [TextPatternPart],
    ) -> Result<Self, Diagnostic> {
        if xml
            .iter()
            .any(|part| matches!(part.value, TextPatternValue::Optional { .. }))
        {
            return Err(unsupported(
                common,
                "Optional groups are only supported in YAML text patterns",
            ));
        }
        let mut codecs = Vec::new();
        for field in fields {
            if let LinkedType::Reference(id) = field.value {
                let target = program
                    .entries
                    .iter()
                    .find(|entry| entry.id == id)
                    .expect("linked slot");
                if !target.presence.is_empty() || !attributes::content(&target.xml).1.is_empty() {
                    return Err(unsupported(
                        target,
                        "Text slots currently require plain scalar spelling without presence or attributes",
                    ));
                }
            }
            let codec = scalar::Codec::resolve(&field.value, common, program)?;
            if !matches!(
                codec,
                scalar::Codec::Text
                    | scalar::Codec::Decimal
                    | scalar::Codec::Forms(_)
                    | scalar::Codec::Pattern(_)
                    | scalar::Codec::TextTable(_)
                    | scalar::Codec::InputTextTable { .. }
                    | scalar::Codec::Boolean(..)
                    | scalar::Codec::Enumeration(..)
            ) {
                return Err(unsupported(
                    common,
                    "Text patterns currently require textual scalar slots",
                ));
            }
            if let scalar::Codec::Pattern(nested) = &codec
                && !nested.entry().constraints.is_empty()
            {
                return Err(unsupported(
                    common,
                    "Nested text checks and inputs require propagation",
                ));
            }
            codecs.push(codec);
        }
        Ok(Self {
            common,
            bound_common: None,
            program,
            fields: codecs,
            xml,
            yaml,
            names: fields.iter().map(|field| field.name.as_str()).collect(),
            bound_scope: String::new(),
        })
    }
    pub(super) fn field_meaning(&self, name: &str, index: usize, receiver: &str) -> String {
        self.fields[index].meaning_reference(
            &format!("{name}P{index}"),
            &format!("&({receiver}).f{index}"),
        )
    }
    pub(super) fn selection_parts(&self, xml: bool, strict: bool) -> Vec<crate::automata::Part> {
        let parts = if xml { self.xml } else { self.yaml };
        self.selection_parts_with(parts, xml, strict, None)
    }
    pub(super) fn selection_forms(
        &self,
        xml: bool,
        strict: bool,
    ) -> Result<Vec<Vec<crate::automata::Part>>, Diagnostic> {
        let parts = if xml { self.xml } else { self.yaml };
        let forms = self.expand_optional_parts(parts)?;
        let boundary = parts.iter().find_map(|part| {
            let TextPatternValue::Optional { parts, .. } = &part.value else {
                return None;
            };
            let TextPatternValue::Literal(text) = &parts.last()?.value else {
                return None;
            };
            text.chars()
                .last()
                .filter(char::is_ascii_punctuation)
                .map(|character| character.to_string())
        });
        Ok(forms
            .iter()
            .map(|parts| self.selection_parts_with(parts, xml, strict, boundary.as_deref()))
            .collect())
    }
    fn expand_optional_parts(
        &self,
        parts: &[TextPatternPart],
    ) -> Result<Vec<Vec<TextPatternPart>>, Diagnostic> {
        let mut forms = vec![Vec::new()];
        for part in parts {
            let alternatives = if let TextPatternValue::Optional { parts, .. } = &part.value {
                let mut expanded = vec![Vec::new()];
                expanded.extend(self.expand_optional_parts(parts)?);
                expanded
            } else {
                vec![vec![part.clone()]]
            };
            if forms.len().saturating_mul(alternatives.len()) > 64 {
                return Err(unsupported(
                    self.entry(),
                    "Optional choice has too many text forms",
                ));
            }
            forms = forms
                .into_iter()
                .flat_map(|head| {
                    alternatives.iter().map(move |tail| {
                        let mut form = head.clone();
                        form.extend_from_slice(tail);
                        form
                    })
                })
                .collect();
        }
        Ok(forms)
    }
    fn selection_parts_with(
        &self,
        parts: &[TextPatternPart],
        xml: bool,
        strict: bool,
        boundary: Option<&str>,
    ) -> Vec<crate::automata::Part> {
        use crate::automata::Part;
        let mut selected = Vec::new();
        let mut position = 0;
        while position < parts.len() {
            match &parts[position].value {
                TextPatternValue::Optional { .. } => unreachable!("validated fixed pattern"),
                TextPatternValue::Literal(text) => selected.push(Part::Literal(text.clone())),
                TextPatternValue::Field(name) => {
                    let index = self
                        .names
                        .iter()
                        .position(|field| *field == name)
                        .expect("linked slot");
                    let delimiter = parts.get(position + 1).and_then(|part| match &part.value {
                        TextPatternValue::Literal(text) => Some(text),
                        _ => None,
                    });
                    let field = &self.fields[index];
                    if let scalar::Codec::Pattern(nested) = field
                        && (xml
                            || !matches!(&nested.entry().yaml, YamlRepresentation::TextPattern(parts) if parts.iter().any(|part|matches!(part.value,TextPatternValue::Optional{..}))))
                    {
                        selected.extend(nested.selection_parts(xml, strict));
                    } else if matches!(
                        field,
                        scalar::Codec::Boolean(..) | scalar::Codec::Enumeration(..)
                    ) {
                        let mut words = field
                            .cases("Unused", xml, true)
                            .into_iter()
                            .map(|(text, _)| text)
                            .collect::<Vec<_>>();
                        if let Some(delimiter) = delimiter {
                            let layout = [
                                nkdk_conversion_core::text_pattern::Part::Slot(0),
                                nkdk_conversion_core::text_pattern::Part::Literal(delimiter),
                            ];
                            let boundary =
                                nkdk_conversion_core::text_pattern::Pattern::<1>::new(&layout)
                                    .expect("linked delimiter");
                            words.retain(|word| boundary.check_values(&[word.as_str()]).is_ok());
                        }
                        if let Some(separator) = &parts[position].separator {
                            words.retain(|word| !word.contains(separator));
                            if delimiter.is_some() {
                                let layout = [
                                    nkdk_conversion_core::text_pattern::Part::Slot(0),
                                    nkdk_conversion_core::text_pattern::Part::Literal(separator),
                                ];
                                let boundary =
                                    nkdk_conversion_core::text_pattern::Pattern::<1>::new(&layout)
                                        .expect("linked separator");
                                words
                                    .retain(|word| boundary.check_values(&[word.as_str()]).is_ok());
                            }
                        }
                        selected.push(Part::Words(words));
                    } else if let Some(separator) = &parts[position].separator {
                        if let Some(delimiter) = delimiter {
                            selected.push(Part::Until(separator.clone()));
                            let suffix = delimiter
                                .strip_prefix(separator)
                                .expect("linked cell separator");
                            if !suffix.is_empty() {
                                selected.push(Part::Literal(suffix.into()));
                            }
                            position += 1;
                        } else {
                            selected.push(Part::Cell(separator.clone()));
                        }
                    } else if let Some(delimiter) = delimiter {
                        let exact = self.constrained_slot(index, xml, Some(delimiter));
                        if let Some([Part::AsciiClassExact(_, _)]) = exact.as_deref() {
                            selected.extend(exact.expect("checked exact selector"));
                            selected.push(Part::Literal(delimiter.clone()));
                        } else {
                            selected.push(Part::Until(delimiter.clone()));
                        }
                        position += 1;
                    } else {
                        let prior_delimiter = parts[..position].iter().rev().find_map(|part| {
                            if let TextPatternValue::Literal(text) = &part.value {
                                Some(text.as_str())
                            } else {
                                None
                            }
                        });
                        let constrained = self
                            .constrained_slot(index, xml, prior_delimiter)
                            .or_else(|| {
                                boundary.and_then(|boundary| {
                                    self.constrained_slot(index, xml, Some(boundary))
                                })
                            });
                        if strict || matches!(constrained.as_deref(), Some([Part::Cell(_)])) {
                            selected.extend(constrained.unwrap_or_else(|| vec![Part::Rest]));
                        } else {
                            selected.push(Part::Rest);
                        }
                    }
                }
            }
            position += 1;
        }
        selected
    }
    fn parts(&self, parts: &[TextPatternPart]) -> String {
        parts
            .iter()
            .map(|part| {
                runtime_part(part, |name| {
                    self.names
                        .iter()
                        .position(|field| *field == name)
                        .expect("linked slot")
                })
            })
            .collect::<Vec<_>>()
            .join(",")
    }
    pub(super) fn has_only_slot_defaults(&self) -> bool {
        defaults::presence_supported(self)
    }
    pub(super) fn projected(&self) -> bool {
        optional::applies(self) || self.shortened() || self.needs_inputs()
    }
    fn shortened(&self) -> bool {
        self.names.iter().any(|name| {
            !self
                .yaml
                .iter()
                .any(|part| matches!(&part.value, TextPatternValue::Field(field) if field == name))
        })
    }
    pub(super) fn needs_inputs(&self) -> bool {
        optional::applies(self)
            || self.fields.iter().any(|field| {
                matches!(field, scalar::Codec::InputTextTable { .. })
                    || matches!(field, scalar::Codec::Pattern(pattern) if pattern.needs_inputs())
                    || matches!(field, scalar::Codec::Forms(choice) if choice.needs_inputs())
            })
    }
    pub(super) fn definition(&self, name: &str) -> Result<String, Diagnostic> {
        let out = if optional::applies(self) {
            optional::definition(self, name)?
        } else if self.shortened() {
            defaults::definition(self, name)?
        } else {
            self.definition_mode(name, DefinitionMode::Standalone)?
        };
        let mut out = self.with_borrowed_fields(out, name, true)?;
        if self.has_child_checks() {
            out.push_str(&super::text_item_checks::generate(
                self.entry(),
                self.program,
                self,
                name,
                self.fields.len(),
                "child_issues",
            )?);
        }
        Ok(out)
    }
    pub(super) fn collection_definition(&self, name: &str) -> Result<String, Diagnostic> {
        let mut out = self.definition(name)?;
        out.push_str(&super::text_item_checks::generate(
            self.entry(),
            self.program,
            self,
            name,
            self.fields.len(),
            "issues",
        )?);
        Ok(out)
    }
    pub(super) fn element_definition(&self, name: &str) -> Result<String, Diagnostic> {
        if self.shortened() {
            return Err(unsupported(
                self.entry(),
                "Contextual text patterns require an independent scalar property",
            ));
        }
        self.with_borrowed_fields(
            self.definition_mode(name, DefinitionMode::Item)?,
            name,
            false,
        )
    }
    pub(super) fn framed_head_definition(&self, name: &str) -> Result<String, Diagnostic> {
        self.with_borrowed_fields(
            self.definition_mode(name, DefinitionMode::Projected)?,
            name,
            false,
        )
    }
    fn with_borrowed_fields(
        &self,
        mut out: String,
        name: &str,
        standalone: bool,
    ) -> Result<String, Diagnostic> {
        if self.constructible() {
            let slots = (0..self.fields.len())
                .map(|index| format!("source.field({index})"))
                .collect::<Vec<_>>()
                .join(",");
            writeln!(out,"impl {name}{{#[allow(dead_code)] fn from_record(source:&dyn core::inputs::RecordInput,inputs:&InputView<'_>)->core::Result<Self>{{let _source_inputs=inputs;let slots=[{slots}];{}",super::scalar_construction::bind_record_slots(self.fields.len())).unwrap();
            for (index, codec) in self.fields.iter().enumerate() {
                writeln!(
                    out,
                    "let f{index}={};",
                    super::scalar_construction::value(
                        codec,
                        &format!("{name}P{index}"),
                        "inputs",
                        index,
                        "_source_inputs"
                    )
                )
                .unwrap();
            }
            let fields = (0..self.fields.len())
                .map(|index| format!("f{index}"))
                .collect::<Vec<_>>()
                .join(",");
            let inputs = if self.needs_inputs() {
                ",_source_inputs"
            } else {
                ""
            };
            let restored = if self.shortened() && !optional::applies(self) {
                "if !value.matches_defaults(_source_inputs)? {return Err(RuntimeDiagnostic::new(\"value.text-pattern\",\"Semantic fields differ from their restored YAML fields\"));}"
            } else {
                ""
            };
            let checks = if standalone {
                format!("value.check(true{inputs})?;value.check(false{inputs})?;")
            } else {
                String::new()
            };
            writeln!(
                out,
                "let value=Self{{{fields}}};{checks}{restored}Ok(value)}}}}"
            )
            .unwrap();
        }

        if self.fields.is_empty() {
            writeln!(out, "impl core::inputs::RecordInput for {name}{{fn field(&self,_index:usize)->Option<core::inputs::InputRef<'_>>{{None}}}}").unwrap();
            return Ok(out);
        }
        writeln!(out, "impl core::inputs::RecordInput for {name}{{fn field(&self,index:usize)->Option<core::inputs::InputRef<'_>>{{match index{{").unwrap();
        for (index, codec) in self.fields.iter().enumerate() {
            if matches!(codec, scalar::Codec::Forms(choice) if choice.constructible()) {
                writeln!(out, "{index}=>Some(self.f{index}.as_input()),").unwrap();
                continue;
            }
            let variant = match codec.input_method() {
                Some("text") => "Text",
                Some("boolean") => "Boolean",
                Some("decimal") => "Decimal",
                Some("calendar") => "Calendar",
                _ if matches!(codec, scalar::Codec::Pattern(_)) => "Record",
                _ if matches!(codec, scalar::Codec::Sequence(sequence) if sequence.framed_value()) => {
                    "Record"
                }
                _ if matches!(codec, scalar::Codec::Sequence(_)) => "Records",
                _ => {
                    return Err(unsupported(
                        self.entry(),
                        "Text slot has no borrowed representation",
                    ));
                }
            };
            let value = self.fields[index]
                .input_reference(&format!("{name}P{index}"), &format!("&(self).f{index}"));
            writeln!(
                out,
                "{index}=>Some(core::inputs::InputRef::{variant}({value})),"
            )
            .unwrap();
        }
        out.push_str("_=>None}}}\n");
        Ok(out)
    }
    fn definition_mode(&self, name: &str, mode: DefinitionMode) -> Result<String, Diagnostic> {
        let standalone = matches!(mode, DefinitionMode::Standalone);
        let input = if self.needs_inputs() {
            ",_inputs:&InputView<'_>"
        } else {
            ""
        };
        let input_arg = if self.needs_inputs() { ",_inputs" } else { "" };
        let count = self.fields.len();
        let mut out = String::new();
        for (index, field) in self.fields.iter().enumerate() {
            out.push_str(&field.definition(&format!("{name}P{index}"))?);
        }
        writeln!(
            out,
            "#[derive(PartialEq, Eq)] struct {name} {{{}}}",
            self.fields
                .iter()
                .enumerate()
                .map(|(index, field)| format!(
                    "f{index}:{}",
                    field.rust_type(&format!("{name}P{index}"))
                ))
                .collect::<Vec<_>>()
                .join(",")
        )
        .unwrap();
        writeln!(out, "impl {name} {{").unwrap();
        if standalone {
            for (side, parts) in [("xml", self.xml), ("yaml", self.yaml)] {
                writeln!(out,"fn {side}_pattern()-> &'static core::text_pattern::Pattern<'static,{count}> {{ static PLAN: std::sync::LazyLock<core::text_pattern::Pattern<'static,{count}>>=std::sync::LazyLock::new(||core::text_pattern::Pattern::new(&[{}]).expect(\"checked text pattern\")); &PLAN }}",self.parts(parts)).unwrap();
            }
            writeln!(out,"fn pattern(xml:bool)-> &'static core::text_pattern::Pattern<'static,{count}> {{if xml{{Self::xml_pattern()}}else{{Self::yaml_pattern()}}}}").unwrap();
        }
        let side = if self
            .fields
            .iter()
            .all(|field| matches!(field, scalar::Codec::Text | scalar::Codec::Decimal))
        {
            "_xml"
        } else {
            "xml"
        };
        if standalone {
            writeln!(out,"fn read(text:&str,xml:bool{input})->core::Result<Self>{{core::xml::validate_text(text)?;let slots=Self::pattern(xml).parse(text).map_err(|_|RuntimeDiagnostic::new(\"value.text-pattern\",\"Text does not match the declared pattern\"))?;Self::read_slots(slots,xml{input_arg})}}\n").unwrap();
        }
        writeln!(
            out,
            "fn read_slots(slots:[&str;{count}],{side}:bool{input})->core::Result<Self>{{let value=Self{{"
        )
        .unwrap();
        for (index, field) in self.fields.iter().enumerate() {
            if let scalar::Codec::TextTable(table) = field {
                let text = format!("slots[{index}]");
                let xml = super::text_table::read(table, &text, true);
                let yaml = super::text_table::read(table, &text, false);
                writeln!(out, "f{index}:(if xml{{{xml}}}else{{{yaml}}}).to_owned(),").unwrap();
                continue;
            }
            if matches!(field, scalar::Codec::Text) {
                writeln!(out, "f{index}:slots[{index}].to_owned(),").unwrap();
                continue;
            }
            if let scalar::Codec::InputTextTable {
                input,
                internal,
                external,
            } = field
            {
                writeln!(out, "f{index}:if xml{{slots[{index}].to_owned()}}else{{let mut mapped=None;for row in _inputs.records({input})?{{if row.text({external})?==slots[{index}]{{if mapped.is_some(){{return Err(RuntimeDiagnostic::new(\"input.ambiguous\",\"Repeated external text spelling\"));}}mapped=Some(row.text({internal})?);}}}}mapped.unwrap_or(slots[{index}]).to_owned()}},").unwrap();
                continue;
            }
            if matches!(field, scalar::Codec::Pattern(_) | scalar::Codec::Forms(_)) {
                let nested_input = pattern_input_argument(field);
                let selector = field.choice_selector_argument(index, true);
                writeln!(
                    out,
                    "f{index}:{name}P{index}::read(slots[{index}],xml{selector}{nested_input})?,"
                )
                .unwrap();
                continue;
            }
            if matches!(field, scalar::Codec::Decimal) {
                writeln!(out, "f{index}:core::decimal::Decimal::parse_owned(slots[{index}].to_owned()).map_err(|error|RuntimeDiagnostic::new(\"value.decimal\",error.to_string()))?,").unwrap();
                continue;
            }
            writeln!(out, "f{index}:match (xml,slots[{index}]) {{").unwrap();
            for side in [true, false] {
                for (text, value) in field.cases(&format!("{name}P{index}"), side, true) {
                    writeln!(out, "({side},{text:?})=>{value},").unwrap();
                }
            }
            out.push_str("_=>return Err(RuntimeDiagnostic::new(\"value.enum\",\"Unknown text pattern token\")),},\n");
        }
        out.push_str("};");
        if standalone {
            writeln!(
                out,
                "value.check(true{input_arg})?;value.check(false{input_arg})?;"
            )
            .unwrap();
        }
        out.push_str("Ok(value)}\n");
        let owns_pieces = self.fields.iter().any(|field| {
            matches!(
                field,
                scalar::Codec::Decimal
                    | scalar::Codec::Forms(_)
                    | scalar::Codec::Pattern(_)
                    | scalar::Codec::InputTextTable { .. }
            )
        });
        let pieces_type = if owns_pieces {
            "std::borrow::Cow<'_ , str>"
        } else {
            "&str"
        };
        let pieces = |side| {
            self.fields
                .iter()
                .enumerate()
                .map(|(index, field)| {
                    if owns_pieces && matches!(field, scalar::Codec::Decimal) {
                        format!("std::borrow::Cow::Owned(self.f{index}.to_string())")
                    } else if matches!(field, scalar::Codec::InputTextTable { .. }) {
                        let piece = field.write_reference(
                            &format!("{name}P{index}"),
                            &format!("&self.f{index}"),
                            side,
                        );
                        format!("std::borrow::Cow::Owned(({piece}).to_owned())")
                    } else if matches!(field, scalar::Codec::Forms(_)) {
                        let nested_input = pattern_input_argument(field);
                        format!("std::borrow::Cow::Owned(self.f{index}.write_text({side}{nested_input})?)")
                    } else if matches!(field, scalar::Codec::Pattern(_)) {
                        let nested_input = pattern_input_argument(field);
                        format!(
                            "std::borrow::Cow::Owned(self.f{index}.write({side}{nested_input})?)"
                        )
                    } else {
                        let piece = field.write_reference(
                            &format!("{name}P{index}"),
                            &format!("&self.f{index}"),
                            side,
                        );
                        if owns_pieces {
                            format!("std::borrow::Cow::Borrowed({piece})")
                        } else {
                            piece
                        }
                    }
                })
                .collect::<Vec<_>>()
                .join(",")
        };
        let xml = pieces(true);
        let yaml = pieces(false);
        if xml == yaml {
            writeln!(
                out,
                "fn pieces(&self,_xml:bool{input})->core::Result<[{pieces_type};{count}]>{{Ok([{xml}])}}"
            )
            .unwrap();
        } else {
            writeln!(out, "fn pieces(&self,xml:bool{input})->core::Result<[{pieces_type};{count}]>{{Ok(if xml{{[{xml}]}}else{{[{yaml}]}})}}").unwrap();
        }
        if standalone {
            writeln!(out,"fn check(&self,xml:bool{input})->core::Result<()>{{let owned=self.pieces(xml{input_arg})?;Self::pattern(xml).check_values(&owned.each_ref().map(|piece| &piece[..])).map_err(|_|RuntimeDiagnostic::new(\"value.text-pattern\",\"Slot conflicts with the declared delimiter\"))}}").unwrap();
        }
        if matches!(mode, DefinitionMode::Standalone) {
            writeln!(out,"fn write(&self,xml:bool{input})->core::Result<String>{{let mut out=String::new();let owned=self.pieces(xml{input_arg})?;Self::pattern(xml).write(&owned.each_ref().map(|piece| &piece[..]),&mut out,usize::MAX).map_err(|_|RuntimeDiagnostic::new(\"value.text-pattern\",\"Text pattern cannot be printed\"))?;Ok(out)}}").unwrap();
        }
        out.push_str("}\n");
        if matches!(mode, DefinitionMode::Item) {
            out.push_str(&super::text_item_checks::generate(
                self.entry(),
                self.program,
                self,
                name,
                self.fields.len(),
                "issues",
            )?);
        }
        Ok(out)
    }
}

fn ascii_class_plus(pattern: &str) -> Option<crate::automata::Part> {
    let body = pattern.strip_prefix('[')?.strip_suffix("]+")?;
    let bytes = body.as_bytes();
    if bytes.is_empty() || !bytes.is_ascii() {
        return None;
    }
    let mut ranges = Vec::new();
    let mut index = 0;
    while index < bytes.len() {
        let start = bytes[index];
        if !start.is_ascii_alphanumeric() && start != b'-' {
            return None;
        }
        if index + 2 < bytes.len() && bytes[index + 1] == b'-' {
            let end = bytes[index + 2];
            if !end.is_ascii_alphanumeric() || start > end {
                return None;
            }
            ranges.push((start, end));
            index += 3;
        } else {
            ranges.push((start, start));
            index += 1;
        }
    }
    Some(crate::automata::Part::AsciiClassPlus(ranges))
}

fn ascii_class_exact(pattern: &str) -> Option<crate::automata::Part> {
    let (body, count) = pattern.rsplit_once("]{")?;
    let count = count.strip_suffix('}')?.parse().ok()?;
    let ranges = ascii_class_plus(&format!("{body}]+"))?;
    let crate::automata::Part::AsciiClassPlus(ranges) = ranges else {
        unreachable!()
    };
    Some(crate::automata::Part::AsciiClassExact(count, ranges))
}

fn leading_ascii_class(pattern: &str) -> Option<Vec<(u8, u8)>> {
    use regex_syntax::hir::{Class, Hir, HirKind};

    fn first(hir: &Hir) -> Option<Vec<(u8, u8)>> {
        match hir.kind() {
            HirKind::Concat(parts) => parts.iter().find_map(|part| match part.kind() {
                HirKind::Empty | HirKind::Look(_) => None,
                _ => Some(first(part)),
            })?,
            HirKind::Capture(capture) => first(&capture.sub),
            HirKind::Repetition(repetition) if repetition.min > 0 => first(&repetition.sub),
            HirKind::Class(Class::Unicode(class)) => class
                .iter()
                .map(|range| {
                    (range.end() <= '\u{7f}').then_some((range.start() as u8, range.end() as u8))
                })
                .collect(),
            HirKind::Class(Class::Bytes(class)) => class
                .iter()
                .map(|range| (range.start(), range.end()))
                .collect::<Vec<_>>()
                .into(),
            _ => None,
        }
    }

    regex_syntax::parse(pattern)
        .ok()
        .and_then(|hir| first(&hir))
}

fn pattern_excludes_byte(pattern: &str, byte: u8) -> bool {
    use regex_syntax::hir::{Class, Hir, HirKind};

    fn excludes(hir: &Hir, byte: u8) -> bool {
        match hir.kind() {
            HirKind::Empty | HirKind::Look(_) => true,
            HirKind::Literal(literal) => !literal.0.contains(&byte),
            HirKind::Class(Class::Unicode(class)) => class.iter().all(|range| {
                !(range.start() <= char::from(byte) && char::from(byte) <= range.end())
            }),
            HirKind::Class(Class::Bytes(class)) => class
                .iter()
                .all(|range| !(range.start() <= byte && byte <= range.end())),
            _ => hir.kind().subs().iter().all(|sub| excludes(sub, byte)),
        }
    }

    regex_syntax::parse(pattern).is_ok_and(|hir| {
        hir.properties()
            .minimum_len()
            .is_some_and(|length| length > 0)
            && excludes(&hir, byte)
    })
}

fn pattern_input_argument(field: &scalar::Codec<'_>) -> &'static str {
    if matches!(field, scalar::Codec::Pattern(pattern) if pattern.needs_inputs())
        || matches!(field, scalar::Codec::Forms(choice) if choice.needs_inputs())
    {
        ",_inputs"
    } else {
        ""
    }
}

fn runtime_slot(index: usize, separator: Option<&str>) -> String {
    match separator {
        Some(separator) => format!("core::text_pattern::Part::Cell({index},{separator:?})"),
        None => format!("core::text_pattern::Part::Slot({index})"),
    }
}

pub(super) fn runtime_part(part: &TextPatternPart, index: impl FnOnce(&str) -> usize) -> String {
    match &part.value {
        TextPatternValue::Literal(text) => format!("core::text_pattern::Part::Literal({text:?})"),
        TextPatternValue::Field(name) => runtime_slot(index(name), part.separator.as_deref()),
        TextPatternValue::Optional { .. } => unreachable!("validated fixed pattern"),
    }
}
