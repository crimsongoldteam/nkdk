use super::*;

pub(super) enum Variant<'a> {
    Boolean(&'a [BooleanLexeme], &'a [BooleanLexeme]),
    Enumeration(&'a [EnumVariant], &'a [EnumLexeme], &'a [EnumLexeme]),
    Calendar { seconds: bool, omit_zero: bool },
    Decimal,
    Pattern(text_pattern::Codec<'a>),
    Sequence(Box<text_sequence::Codec<'a>>),
    Choice(Box<super::Codec<'a>>),
    Text(&'a LinkedEntry),
}

fn word_parts<'a>(values: impl Iterator<Item = &'a str>) -> Vec<Vec<crate::automata::Part>> {
    vec![vec![crate::automata::Part::Words(
        values.map(str::to_owned).collect(),
    )]]
}

impl<'a> Variant<'a> {
    pub(super) fn resolve(
        entry: &'a LinkedEntry,
        program: &'a Program<'a>,
    ) -> Result<Self, Diagnostic> {
        if let (
            LinkedType::Scalar(ScalarType::Boolean),
            LinkedXml::BooleanTable(xml),
            YamlRepresentation::BooleanTable(yaml),
        ) = (&entry.value, &entry.xml, &entry.yaml)
        {
            return Ok(Self::Boolean(xml, yaml));
        }
        if let (
            LinkedType::Enum(variants),
            LinkedXml::EnumTable(xml),
            YamlRepresentation::EnumTable(yaml),
        ) = (&entry.value, &entry.xml, &entry.yaml)
        {
            return Ok(Self::Enumeration(variants, xml, yaml));
        }
        if matches!(entry.value, LinkedType::Scalar(ScalarType::Decimal))
            && matches!(entry.xml, LinkedXml::Decimal)
            && matches!(entry.yaml, YamlRepresentation::Decimal)
        {
            return Ok(Self::Decimal);
        }
        if let (
            LinkedType::Scalar(ScalarType::Text),
            LinkedXml::Calendar,
            YamlRepresentation::Calendar { seconds, omit_zero },
        ) = (&entry.value, &entry.xml, &entry.yaml)
        {
            return Ok(Self::Calendar {
                seconds: *seconds,
                omit_zero: *omit_zero,
            });
        }
        if matches!(entry.value, LinkedType::Scalar(ScalarType::Text))
            && matches!(entry.xml, LinkedXml::Text)
            && matches!(entry.yaml, YamlRepresentation::Text)
        {
            plain(entry)?;
            if !entry.presence.is_empty() {
                return Err(unsupported(
                    entry,
                    "Unstructured choice text requires no presence",
                ));
            }
            return Ok(Self::Text(entry));
        }
        if matches!(entry.value, LinkedType::Choice(_))
            && matches!(entry.xml, LinkedXml::Choice)
            && matches!(entry.yaml, YamlRepresentation::Choice(_))
        {
            return Ok(Self::Choice(Box::new(super::Codec::resolve(
                entry, program,
            )?)));
        }
        if let Some(sequence) = text_sequence::Codec::framed(entry, program)? {
            return Ok(Self::Sequence(Box::new(sequence)));
        }
        let pattern = text_pattern::Codec::resolve(entry, program)?;
        if !pattern.has_only_slot_defaults() {
            return Err(unsupported(
                entry,
                "Text choice patterns require restored-slot defaults",
            ));
        }
        Ok(Self::Pattern(pattern))
    }

    pub(super) fn read_needs_inputs(&self) -> bool {
        matches!(self, Self::Pattern(pattern) if pattern.projected()) || self.nested_needs_inputs()
    }

    pub(super) fn write_needs_inputs(&self) -> bool {
        matches!(self, Self::Pattern(pattern) if pattern.needs_inputs())
            || self.nested_needs_inputs()
    }

    fn nested_needs_inputs(&self) -> bool {
        matches!(self, Self::Sequence(sequence) if sequence.needs_inputs())
            || matches!(self, Self::Choice(choice) if choice.needs_inputs())
    }

    pub(super) fn write_input_argument(&self) -> &'static str {
        if self.write_needs_inputs() {
            ",_inputs"
        } else {
            ""
        }
    }

    pub(super) fn selection_parts(
        &self,
        xml: bool,
        entry: &LinkedEntry,
    ) -> Result<Vec<Vec<crate::automata::Part>>, Diagnostic> {
        match self {
            Self::Boolean(xml_table, yaml_table) => Ok(word_parts(
                (if xml { *xml_table } else { *yaml_table })
                    .iter()
                    .map(|item| item.text.as_str()),
            )),
            Self::Enumeration(_, xml_table, yaml_table) => Ok(word_parts(
                (if xml { *xml_table } else { *yaml_table })
                    .iter()
                    .map(|item| item.text.as_str()),
            )),
            Self::Calendar { .. } if xml => Ok(Vec::new()),
            Self::Calendar { seconds, omit_zero } => {
                let date = vec![
                    crate::automata::Part::AsciiDigits(2),
                    crate::automata::Part::Literal(".".into()),
                    crate::automata::Part::AsciiDigits(2),
                    crate::automata::Part::Literal(".".into()),
                    crate::automata::Part::AsciiDigits(4),
                ];
                let mut clock = date.clone();
                clock.extend([
                    crate::automata::Part::Literal(" ".into()),
                    crate::automata::Part::AsciiDigits(2),
                    crate::automata::Part::Literal(":".into()),
                    crate::automata::Part::AsciiDigits(2),
                ]);
                if *seconds {
                    clock.extend([
                        crate::automata::Part::Literal(":".into()),
                        crate::automata::Part::AsciiDigits(2),
                    ]);
                }
                Ok(if *omit_zero {
                    vec![date, clock]
                } else {
                    vec![clock]
                })
            }
            Self::Decimal => Ok(Vec::new()),
            Self::Pattern(pattern) => Ok(vec![pattern.selection_parts(xml)]),
            Self::Sequence(sequence) => sequence.selection_parts(xml, entry),
            Self::Choice(choice) => choice.selection_parts(xml),
            Self::Text(_) => Ok(Vec::new()),
        }
    }

    pub(super) fn definition(
        &self,
        name: &str,
        collection: bool,
        compact: bool,
        entry: &LinkedEntry,
    ) -> Result<String, Diagnostic> {
        match self {
            Self::Boolean(..) if !compact => Ok(format!("type {name}=bool;\n")),
            Self::Enumeration(variants, ..) if !compact => Ok(format!(
                "#[derive(Clone,Copy,PartialEq,Eq)] enum {name}{{{}}}\n",
                (0..variants.len())
                    .map(|index| format!("V{index}"))
                    .collect::<Vec<_>>()
                    .join(",")
            )),
            Self::Calendar { .. } if !compact => {
                Ok(format!("type {name}=core::calendar::Value;\n"))
            }
            Self::Decimal if !compact => Ok(format!("type {name}=core::decimal::Decimal;\n")),
            Self::Pattern(pattern) if compact => pattern.element_definition(name),
            Self::Pattern(pattern) if collection => pattern.collection_definition(name),
            Self::Pattern(pattern) => pattern.definition(name),
            Self::Sequence(sequence) if !compact => sequence.definition(name),
            Self::Choice(choice) if !compact => choice.definition(name),
            Self::Text(common) if !compact && (!collection || common.constraints.is_empty()) => {
                Ok(format!("type {name}=String;\n"))
            }
            _ => Err(unsupported(
                entry,
                "Compact choice rows require fixed-width text patterns",
            )),
        }
    }

    pub(super) fn field_meaning(
        &self,
        name: &str,
        index: usize,
        receiver: &str,
        entry: &LinkedEntry,
    ) -> Result<String, Diagnostic> {
        match self {
            Self::Boolean(..) => Err(unsupported(entry, "Boolean has no record fields")),
            Self::Enumeration(..) => Err(unsupported(entry, "Enumeration has no record fields")),
            Self::Calendar { .. } => Err(unsupported(entry, "Calendar has no record fields")),
            Self::Decimal => Err(unsupported(entry, "Decimal has no record fields")),
            Self::Pattern(pattern) => Ok(pattern.field_meaning(name, index, receiver)),
            Self::Sequence(sequence) => sequence
                .head_meaning(name, index, receiver)
                .ok_or_else(|| unsupported(entry, "Unknown choice sequence field")),
            Self::Choice(_) => Err(unsupported(
                entry,
                "Nested choice has no direct record fields",
            )),
            Self::Text(_) => Err(unsupported(entry, "Unstructured text has no record fields")),
        }
    }

    pub(super) fn read(&self, name: &str, inputs: &str) -> String {
        match self {
            Self::Boolean(xml, yaml) => {
                let table = |items: &[BooleanLexeme]| {
                    items
                        .iter()
                        .map(|item| format!("{:?}=>{},", item.text, item.value))
                        .collect::<String>()
                };
                format!(
                    "if xml{{match text{{{}_=>return Err(RuntimeDiagnostic::new(\"value.boolean\",\"Unknown boolean literal\")),}}}}else{{match text{{{}_=>return Err(RuntimeDiagnostic::new(\"value.boolean\",\"Unknown boolean literal\")),}}}}",
                    table(xml),
                    table(yaml)
                )
            }
            Self::Enumeration(variants, xml, yaml) => {
                let table = |items: &[EnumLexeme]| {
                    items
                        .iter()
                        .flat_map(|item| {
                            let index = variants
                                .iter()
                                .position(|variant| variant.value == item.value)
                                .expect("linked enum choice table");
                            std::iter::once(&item.text)
                                .chain(item.accepted.iter())
                                .map(move |text| format!("{text:?}=>{name}::V{index},"))
                        })
                        .collect::<String>()
                };
                format!(
                    "if xml{{match text{{{}_=>return Err(RuntimeDiagnostic::new(\"value.enumeration\",\"Unknown enumeration literal\")),}}}}else{{match text{{{}_=>return Err(RuntimeDiagnostic::new(\"value.enumeration\",\"Unknown enumeration literal\")),}}}}",
                    table(xml),
                    table(yaml)
                )
            }
            Self::Decimal => "core::decimal::Decimal::parse_owned(text.to_owned()).map_err(|error|RuntimeDiagnostic::new(\"value.decimal\",error.to_string()))?".into(),
            Self::Calendar { seconds, omit_zero } => {
                format!("if xml{{core::calendar::Value::from_xml(text)?}}else{{core::calendar::Value::from_yaml(text,{seconds},{omit_zero})?}}")
            }
            _ => format!("{name}::read(text,xml{inputs})?"),
        }
    }

    pub(super) fn write(&self, value: &str, name: &str, inputs: &str) -> String {
        match self {
            Self::Boolean(xml, yaml) => {
                let literal = |items: &[BooleanLexeme], expected: bool| {
                    items
                        .iter()
                        .find(|item| item.value == expected)
                        .map(|item| format!("{:?}", item.text))
                        .unwrap_or_else(|| {
                            "return Err(RuntimeDiagnostic::new(\"value.unrepresented\",\"Boolean has no canonical literal\"))".into()
                        })
                };
                format!(
                    "Ok((if xml{{if *{value}{{{}}}else{{{}}}}}else{{if *{value}{{{}}}else{{{}}}}}).to_owned())",
                    literal(xml, true),
                    literal(xml, false),
                    literal(yaml, true),
                    literal(yaml, false)
                )
            }
            Self::Enumeration(variants, xml, yaml) => {
                let arms = |items: &[EnumLexeme]| {
                    variants
                        .iter()
                        .enumerate()
                        .map(|(index, variant)| {
                            let text = items
                                .iter()
                                .find(|item| item.value == variant.value)
                                .map(|item| format!("{:?}", item.text))
                                .unwrap_or_else(|| {
                                    "return Err(RuntimeDiagnostic::new(\"value.unrepresented\",\"Enumeration has no canonical literal\"))".into()
                                });
                            format!("{name}::V{index}=>{text},")
                        })
                        .collect::<String>()
                };
                format!(
                    "Ok((if xml{{match {value}{{{}}}}}else{{match {value}{{{}}}}}).to_owned())",
                    arms(xml),
                    arms(yaml)
                )
            }
            Self::Decimal => format!("Ok({value}.to_string())"),
            Self::Calendar { seconds, omit_zero } => {
                format!("Ok(if xml{{{value}.xml()}}else{{{value}.yaml({seconds},{omit_zero})}})")
            }
            _ => format!("{value}.write(xml{inputs})"),
        }
    }

    pub(super) fn write_text(&self, value: &str, name: &str, inputs: &str) -> String {
        if matches!(self, Self::Choice(_)) {
            format!("{value}.write_text(xml{inputs})")
        } else {
            self.write(value, name, inputs)
        }
    }

    pub(super) fn is_decimal(&self) -> bool {
        matches!(self, Self::Decimal)
    }

    pub(super) fn writes_yaml_document(&self) -> bool {
        matches!(self, Self::Decimal | Self::Choice(_))
    }
}
