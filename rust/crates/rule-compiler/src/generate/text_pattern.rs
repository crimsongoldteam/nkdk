mod defaults;
use super::*;
use std::fmt::Write;

enum DefinitionMode {
    Standalone,
    Item,
    Projected,
}

pub(super) struct Codec<'a> {
    common: &'a LinkedEntry,
    program: &'a Program<'a>,
    fields: Vec<scalar::Codec<'a>>,
    xml: &'a [TextPatternPart],
    yaml: &'a [TextPatternPart],
    names: Vec<&'a str>,
}
impl<'a> Codec<'a> {
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
            .chain(yaml)
            .any(|part| matches!(part.value, TextPatternValue::Optional { .. }))
        {
            return Err(unsupported(
                common,
                "Optional groups require record XML with text YAML",
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
                    | scalar::Codec::Pattern(_)
                    | scalar::Codec::TextTable(_)
                    | scalar::Codec::InputTextTable { .. }
                    | scalar::Codec::Boolean(..)
                    | scalar::Codec::Enumeration(..)
            ) {
                return Err(unsupported(
                    common,
                    "Text patterns currently support text, exact decimal and table-based scalar slots",
                ));
            }
            if let scalar::Codec::Pattern(nested) = &codec
                && !nested.common.constraints.is_empty()
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
            program,
            fields: codecs,
            xml,
            yaml,
            names: fields.iter().map(|field| field.name.as_str()).collect(),
        })
    }
    pub(super) fn field_meaning(&self, name: &str, index: usize, receiver: &str) -> String {
        self.fields[index].meaning_reference(
            &format!("{name}P{index}"),
            &format!("&({receiver}).f{index}"),
        )
    }
    pub(super) fn selection_parts(&self, xml: bool) -> Vec<crate::automata::Part> {
        use crate::automata::Part;
        let parts = if xml { self.xml } else { self.yaml };
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
                    if matches!(
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
                        selected.push(Part::Until(delimiter.clone()));
                        position += 1;
                    } else {
                        selected.push(Part::Rest);
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
        self.shortened() || self.needs_inputs()
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
        self.fields.iter().any(|field| {
            matches!(field, scalar::Codec::InputTextTable { .. })
                || matches!(field, scalar::Codec::Pattern(pattern) if pattern.needs_inputs())
        })
    }
    pub(super) fn definition(&self, name: &str) -> Result<String, Diagnostic> {
        if self.shortened() {
            return defaults::definition(self, name);
        }
        self.definition_mode(name, DefinitionMode::Standalone)
    }
    pub(super) fn collection_definition(&self, name: &str) -> Result<String, Diagnostic> {
        let mut out = self.definition(name)?;
        out.push_str(&super::text_item_checks::generate(
            self.common,
            self.program,
            self,
            name,
            self.fields.len(),
        )?);
        Ok(out)
    }
    pub(super) fn element_definition(&self, name: &str) -> Result<String, Diagnostic> {
        if self.shortened() {
            return Err(unsupported(
                self.common,
                "Contextual text patterns require an independent scalar property",
            ));
        }
        self.definition_mode(name, DefinitionMode::Item)
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
            if matches!(field, scalar::Codec::Pattern(_)) {
                let nested_input = pattern_input_argument(field);
                writeln!(
                    out,
                    "f{index}:{name}P{index}::read(slots[{index}],xml{nested_input})?,"
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
                self.common,
                self.program,
                self,
                name,
                self.fields.len(),
            )?);
        }
        Ok(out)
    }
}

fn pattern_input_argument(field: &scalar::Codec<'_>) -> &'static str {
    if matches!(field, scalar::Codec::Pattern(pattern) if pattern.needs_inputs()) {
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
