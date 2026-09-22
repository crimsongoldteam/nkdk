mod variant;
use super::*;
use regex_automata::dfa::dense::DFA;
use std::fmt::Write;
use variant::Variant;

pub(super) type CellOrders = (Vec<usize>, Vec<usize>);

fn referenced_variant<'a>(
    choice: &LinkedEntry,
    field: &LinkedField,
    program: &'a Program<'a>,
) -> Result<(&'a LinkedEntry, Variant<'a>), Diagnostic> {
    let LinkedType::Reference(id) = field.value else {
        return Err(unsupported(choice, "Choice needs referenced variants"));
    };
    let target = program
        .entries
        .iter()
        .find(|entry| entry.id == id)
        .expect("linked choice variant");
    Ok((target, Variant::resolve(target, program)?))
}

fn compile_variants<'a>(
    variants: impl IntoIterator<Item = (usize, &'a Variant<'a>)>,
    xml: bool,
    entry: &LinkedEntry,
    map_error: impl FnOnce(crate::automata::Error, &[usize]) -> Diagnostic,
) -> Result<(DFA<Vec<u32>>, Vec<usize>), Diagnostic> {
    let mut patterns = Vec::new();
    let mut selected = Vec::new();
    for (index, variant) in variants {
        for parts in variant.selection_parts(xml, entry)? {
            patterns.push(parts);
            selected.push(index);
        }
    }
    let machine = crate::automata::compile_sequences(
        &patterns,
        crate::automata::STATE_BUDGET,
        crate::automata::BYTE_BUDGET,
    )
    .map_err(|error| map_error(error, &selected))?;
    Ok((machine, selected))
}

pub(super) fn scalar_yaml_selector(
    entry: &LinkedEntry,
    program: &Program,
    structured: &BTreeSet<&str>,
    name: &str,
) -> Result<String, Diagnostic> {
    let LinkedType::Choice(fields) = &entry.value else {
        unreachable!("choice selector")
    };
    let mut variants = Vec::new();
    let mut decimal = None;
    let mut text = None;
    for (index, field) in fields.iter().enumerate() {
        if structured.contains(field.name.as_str()) {
            continue;
        }
        let (_, variant) = referenced_variant(entry, field, program)?;
        if variant.is_decimal() {
            decimal = Some(index);
        }
        if matches!(variant, Variant::Text(_)) {
            text = Some(index);
        }
        variants.push((index, variant));
    }
    let (machine, selected) = compile_variants(
        variants.iter().map(|(index, variant)| (*index, variant)),
        false,
        entry,
        |error, _| unsupported(entry, &format!("YAML scalar choice: {error}")),
    )?;
    let plan = "ChoiceScalarYaml";
    let mut out = crate::automata::declaration(plan, &machine);
    writeln!(out,"fn {name}(value:core::yaml::Scalar,tag:Option<String>)->core::Result<usize>{{if tag.is_some()||value.annotation().is_some(){{return Err(RuntimeDiagnostic::new(\"yaml.choice-form\",\"Annotated choice scalar requires preservation\"))}}let(text,form)=value.into_discriminated_choice_text()?;match form{{core::yaml::ChoiceScalarForm::Number=>{:?}.ok_or_else(||RuntimeDiagnostic::new(\"yaml.choice-form\",\"Numeric YAML has no declared choice variant\")),core::yaml::ChoiceScalarForm::QuotedText=>{:?}.ok_or_else(||RuntimeDiagnostic::new(\"yaml.choice-form\",\"Quoted YAML has no declared text variant\")),core::yaml::ChoiceScalarForm::PlainText=>Ok({plan}.select(&text)?.map(|index|{:?}[index]).or({text:?}).ok_or_else(||RuntimeDiagnostic::new(\"value.choice\",\"No declared YAML scalar form matches\"))?),}}}}",decimal,text,selected).unwrap();
    Ok(out)
}

pub(super) fn cell_order((xml, yaml): &CellOrders) -> String {
    if xml == yaml {
        format!("{xml:?}")
    } else {
        format!("if xml{{{xml:?}}}else{{{yaml:?}}}")
    }
}

pub(super) struct Codec<'a> {
    variants: Vec<Variant<'a>>,
    entry: &'a LinkedEntry,
    xml_variants: Vec<usize>,
    yaml_variants: Vec<usize>,
    fallback: Option<usize>,
    xml: DFA<Vec<u32>>,
    yaml: DFA<Vec<u32>>,
    discriminator: Option<&'a DiscriminatedChoiceXml<ExpandedName>>,
}

impl<'a> Codec<'a> {
    pub(super) fn scalar_default(
        &self,
        index: u32,
        expression: &LinkedExpression,
        name: &str,
    ) -> Result<String, Diagnostic> {
        let selected = self
            .variants
            .get(index as usize)
            .ok_or_else(|| unsupported(self.entry, "Unknown choice default variant"))?;
        let value = match (selected, &expression.kind) {
            (Variant::Decimal, LinkedExpressionKind::Literal(ScalarLiteral::Number(value))) => {
                let number = nkdk_decimal::Decimal::parse(value)
                    .map_err(|_| unsupported(self.entry, "Invalid decimal choice default"))?;
                let (negative, digits, exponent) = number.parts();
                format!("core::decimal::Decimal::constant({negative},{digits:?},{exponent})")
            }
            (
                Variant::Calendar { .. },
                LinkedExpressionKind::Literal(ScalarLiteral::Text(value)),
            ) => {
                let date = nkdk_conversion_core::calendar::Value::from_xml(value)
                    .map_err(|_| unsupported(self.entry, "Invalid calendar choice default"))?;
                format!(
                    "const {{core::calendar::Value::from_parts({:?}).expect(\"validated calendar default\")}}",
                    date.parts()
                )
            }
            (
                Variant::Boolean(..),
                LinkedExpressionKind::Literal(ScalarLiteral::Boolean(value)),
            ) => value.to_string(),
            (Variant::Text(_), LinkedExpressionKind::Literal(ScalarLiteral::Text(value))) => {
                format!("String::from({value:?})")
            }
            _ => {
                return Err(unsupported(
                    self.entry,
                    "Choice default requires a declared scalar literal",
                ));
            }
        };
        Ok(format!("{name}::V{index}({value})"))
    }

    pub(super) fn resolve(
        entry: &'a LinkedEntry,
        program: &'a Program<'a>,
    ) -> Result<Self, Diagnostic> {
        let LinkedType::Choice(fields) = &entry.value else {
            unreachable!("choice codec")
        };
        let discriminator = match &entry.xml {
            LinkedXml::DiscriminatedChoice(choice) => Some(choice),
            _ => None,
        };
        let mut variants = Vec::new();
        for field in fields {
            let (target, variant) = referenced_variant(entry, field, program)?;
            if !target.inputs.is_empty()
                || !target.parameters.is_empty()
                || !target.shorthands.is_empty()
                || target.normalization.is_some()
                || (discriminator.is_none() && !attributes::content(&target.xml).1.is_empty())
            {
                return Err(unsupported(
                    target,
                    "Text choice variants require text patterns with only restored-slot defaults",
                ));
            }
            variants.push(variant);
        }
        let fallback = variants
            .iter()
            .position(|variant| matches!(variant, Variant::Text(_)));
        if variants
            .iter()
            .filter(|variant| matches!(variant, Variant::Text(_)))
            .count()
            > 1
        {
            return Err(unsupported(
                entry,
                "Choice permits only one unstructured text variant",
            ));
        }
        let compile = |xml| {
            compile_variants(
                variants.iter().enumerate(),
                xml,
                entry,
                |error, selected| {
                    let mut issue = unsupported(
                        entry,
                        &format!("{} choice: {error}", if xml { "XML" } else { "YAML" }),
                    );
                    if let crate::automata::Error::Overlap { left, right } = error {
                        issue.code = "choice_overlap".into();
                        issue.message = format!(
                            "{} forms '{}' and '{}' overlap",
                            if xml { "XML" } else { "YAML" },
                            fields[selected[left]].name,
                            fields[selected[right]].name
                        );
                        issue.related = vec![
                            fields[selected[left]].source.clone(),
                            fields[selected[right]].source.clone(),
                        ];
                    }
                    issue
                },
            )
        };
        let (xml, xml_variants) = compile(true)?;
        let (yaml, yaml_variants) = compile(false)?;
        Ok(Self {
            variants,
            entry,
            xml_variants,
            yaml_variants,
            fallback,
            xml,
            yaml,
            discriminator,
        })
    }

    pub(super) fn discriminated(&self) -> bool {
        self.discriminator.is_some()
    }

    pub(super) fn fallback_variant(&self) -> Option<usize> {
        let choice = self.discriminator?;
        let LinkedType::Choice(fields) = &self.entry.value else {
            return None;
        };
        fields
            .iter()
            .position(|field| field.name == choice.otherwise)
    }

    pub(super) fn decimal_variant(&self) -> Option<usize> {
        self.variants.iter().position(Variant::is_decimal)
    }

    pub(super) fn text_variant(&self) -> Option<usize> {
        self.fallback
    }

    pub(super) fn read_attribute(
        &self,
        path: &[ExpandedName],
        index: usize,
        prefix: &str,
    ) -> String {
        let Some(choice) = self.discriminator else {
            return String::new();
        };
        let LinkedType::Choice(fields) = &self.entry.value else {
            unreachable!()
        };
        let mut arms = String::new();
        for case in &choice.variants {
            let variant = fields
                .iter()
                .position(|field| field.name == case.variant)
                .unwrap();
            for value in &case.values {
                let canonical = case.emit.as_ref().is_some_and(|emit| emit == value);
                let shape = if !canonical {
                    format!("{prefix}shape{index}=true;")
                } else {
                    String::new()
                };
                writeln!(arms, "({:?},{:?})=>{{{prefix}variant{index}=Some({variant});{shape}return Ok(());}},", value.namespace, value.local).unwrap();
            }
        }
        format!(
            "if core::xml::matches(path,{}) && _attribute.name.namespace=={:?} && _attribute.name.local=={:?} {{if let Some(name)=_attribute.qname.as_ref(){{match(name.namespace.as_str(),name.local.as_str()){{{arms}_=>{{{prefix}shape{index}=true;return Ok(());}}}}}}{prefix}shape{index}=true;return Ok(());}}\n",
            super::record::path_code(path),
            choice.attribute.namespace,
            choice.attribute.local
        )
    }

    pub(super) fn attributes(&self, name: &str) -> String {
        let Some(choice) = self.discriminator else {
            return "&[]".into();
        };
        let LinkedType::Choice(fields) = &self.entry.value else {
            unreachable!()
        };
        let arms = choice.variants.iter().map(|case| {
            let variant = fields.iter().position(|field| field.name == case.variant).unwrap();
            let emit = case.emit.as_ref().expect("validated choice emit");
            format!("{name}::V{variant}(_)=>&[core::xml::WriteAttribute{{name:({:?},{:?}),value:core::xml::AttributeValue::QName(({:?},{:?}))}}][..],", choice.attribute.namespace, choice.attribute.local, emit.namespace, emit.local)
        }).collect::<String>();
        format!("match field_value{{{arms}}}")
    }

    pub(super) fn xml_namespaces(&self) -> Vec<&str> {
        let Some(choice) = self.discriminator else {
            return Vec::new();
        };
        std::iter::once(choice.attribute.namespace.as_str())
            .chain(
                choice
                    .variants
                    .iter()
                    .filter_map(|case| case.emit.as_ref())
                    .map(|name| name.namespace.as_str()),
            )
            .filter(|namespace| !namespace.is_empty())
            .collect()
    }

    pub(super) fn field_meaning(
        &self,
        variant: usize,
        name: &str,
        field: usize,
        receiver: &str,
    ) -> Result<String, Diagnostic> {
        self.variants[variant].field_meaning(name, field, receiver, self.entry)
    }

    pub(super) fn has_child_checks(&self) -> bool {
        self.variants
            .iter()
            .any(|variant| matches!(variant, Variant::Sequence(_)))
    }

    pub(super) fn needs_inputs(&self) -> bool {
        self.variants
            .iter()
            .any(|variant| variant.read_needs_inputs() || variant.write_needs_inputs())
    }

    pub(super) fn variant_write_needs_inputs(&self, index: usize) -> bool {
        self.variants[index].write_needs_inputs()
    }

    pub(super) fn selection_parts(
        &self,
        xml: bool,
    ) -> Result<Vec<Vec<crate::automata::Part>>, Diagnostic> {
        let mut result = Vec::new();
        for variant in &self.variants {
            result.extend(variant.selection_parts(xml, self.entry)?);
        }
        Ok(result)
    }

    pub(super) fn definition(&self, name: &str) -> Result<String, Diagnostic> {
        self.definition_mode(name, false, None)
    }

    pub(super) fn collection_definition(&self, name: &str) -> Result<String, Diagnostic> {
        self.definition_mode(name, true, None)
    }

    pub(super) fn compact_definition(
        &self,
        name: &str,
        orders: &[CellOrders],
    ) -> Result<String, Diagnostic> {
        self.definition_mode(name, true, Some(orders))
    }

    fn definition_mode(
        &self,
        name: &str,
        collection: bool,
        compact: Option<&[CellOrders]>,
    ) -> Result<String, Diagnostic> {
        let mut out = String::new();
        for (index, variant) in self.variants.iter().enumerate() {
            let variant_name = format!("{name}V{index}");
            out.push_str(&variant.definition(
                &variant_name,
                collection,
                compact.is_some(),
                self.entry,
            )?);
        }
        writeln!(
            out,
            "#[derive(PartialEq, Eq)] enum {name} {{ {} }}",
            (0..self.variants.len())
                .map(|index| format!("V{index}({name}V{index})"))
                .collect::<Vec<_>>()
                .join(",")
        )
        .unwrap();
        let xml_plan = format!("{name}XML").to_uppercase();
        let yaml_plan = format!("{name}YAML").to_uppercase();
        out.push_str(&crate::automata::declaration(&xml_plan, &self.xml));
        out.push_str(&crate::automata::declaration(&yaml_plan, &self.yaml));
        let inputs = if self.needs_inputs() {
            ",_inputs:&InputView<'_>"
        } else {
            ""
        };
        let selector_argument = if self.discriminated() {
            ",selected:Option<usize>"
        } else {
            ""
        };
        let reader = if let Some(orders) = compact {
            format!(
                "fn read_row(row:core::text_pattern::Row<'_,{}>,xml:bool{inputs})->core::Result<Self>{{let text=row.text;",
                orders[0].0.len(),
            )
        } else {
            format!("fn read(text:&str,xml:bool{selector_argument}{inputs})->core::Result<Self>{{")
        };
        let xml_select = if self.discriminated() {
            "selected".to_owned()
        } else {
            format!(
                "{xml_plan}.select(text)?.map(|index|{:?}[index])",
                self.xml_variants
            )
        };
        let yaml_select = if self.discriminated() {
            format!(
                "if selected.is_some(){{selected}}else{{{yaml_plan}.select(text)?.map(|index|{:?}[index])}}",
                self.yaml_variants
            )
        } else {
            format!(
                "{yaml_plan}.select(text)?.map(|index|{:?}[index])",
                self.yaml_variants
            )
        };
        writeln!(out, "impl {name} {{{reader}let selected=if xml{{{xml_select}}}else{{{yaml_select}}};match selected{{").unwrap();
        for (index, variant) in self.variants.iter().enumerate() {
            if let Some(orders) = compact {
                let count = orders[index].0.len();
                let order = cell_order(&orders[index]);
                let inputs = if variant.read_needs_inputs() {
                    ",_inputs"
                } else {
                    ""
                };
                writeln!(out, "Some({index})=>{{let order={order};let mut slots=[\"\";{count}];for(index,field)in order.iter().enumerate(){{slots[*field]=row.cells[index];}}Ok(Self::V{index}({name}V{index}::read_slots(slots,xml{inputs})?))}},").unwrap();
            } else if matches!(variant, Variant::Text(_)) {
                if self.discriminated() {
                    writeln!(out, "Some({index})=>{{core::xml::validate_text(text)?;Ok(Self::V{index}(text.to_owned()))}},").unwrap();
                }
                continue;
            } else {
                let inputs = if variant.read_needs_inputs() {
                    ",_inputs"
                } else {
                    ""
                };
                let read = variant.read(&format!("{name}V{index}"), inputs);
                writeln!(out, "Some({index})=>Ok(Self::V{index}({read})),").unwrap();
            }
        }
        if let Some(index) = self.fallback {
            writeln!(out, "_=>{{if (if xml{{{yaml_plan}.select(text)?}}else{{{xml_plan}.select(text)?}}).is_some(){{return Err(RuntimeDiagnostic::new(\"value.choice-collision\",\"Unstructured text conflicts with the other representation\"));}}core::xml::validate_text(text)?;Ok(Self::V{index}(text.to_owned()))}},}}}}\n").unwrap();
        } else {
            out.push_str("_=>Err(RuntimeDiagnostic::new(\"value.choice\",\"No declared text form matches\")),}}\n");
        }
        if compact.is_none() {
            writeln!(out,"#[allow(dead_code)] fn write_text(&self,xml:bool{inputs})->core::Result<String>{{match self{{").unwrap();
            for index in 0..self.variants.len() {
                let input_argument = self.variants[index].write_input_argument();
                let write = if matches!(self.variants[index], Variant::Text(_)) {
                    "Ok(value.clone())".into()
                } else {
                    self.variants[index].write_text(
                        "value",
                        &format!("{name}V{index}"),
                        input_argument,
                    )
                };
                writeln!(out, "Self::V{index}(value)=>{write},").unwrap();
            }
            out.push_str("}}\n");
            writeln!(
                out,
                "fn write(&self,xml:bool{inputs})->core::Result<String>{{match self{{"
            )
            .unwrap();
            for index in 0..self.variants.len() {
                if matches!(self.variants[index], Variant::Text(_)) && self.discriminated() {
                    writeln!(out, "Self::V{index}(value)=>{{let text=value.clone();Ok(if xml{{text}}else if {yaml_plan}.select(&text)?.is_some(){{core::yaml::quoted_scalar(&text)}}else{{core::yaml::scalar(&text)}})}},").unwrap();
                    continue;
                }
                let input_argument = self.variants[index].write_input_argument();
                let write = if matches!(self.variants[index], Variant::Text(_)) {
                    "Ok(value.clone())".into()
                } else {
                    self.variants[index].write("value", &format!("{name}V{index}"), input_argument)
                };
                if self.variants[index].writes_yaml_document() {
                    writeln!(out, "Self::V{index}(value)=>{write},").unwrap();
                } else {
                    writeln!(out, "Self::V{index}(value)=>{{let text={write}?;Ok(if xml{{text}}else{{core::yaml::scalar(&text)}})}},").unwrap();
                }
            }
            out.push_str("}}\n");
        }
        out.push_str("}\n");
        if self.has_child_checks() {
            writeln!(out, "impl {name} {{#[allow(dead_code)] fn child_issues(&self,xml:bool,inputs:&InputView<'_>)->Vec<RuntimeDiagnostic>{{match self{{").unwrap();
            for (index, variant) in self.variants.iter().enumerate() {
                if matches!(variant, Variant::Sequence(_)) {
                    writeln!(
                        out,
                        "Self::V{index}(value)=>value.child_issues(xml,inputs),"
                    )
                    .unwrap();
                } else {
                    writeln!(out, "Self::V{index}(_)=>Vec::new(),").unwrap();
                }
            }
            out.push_str("}}}\n");
        }
        if collection {
            writeln!(
                out,
                "impl {name} {{#[allow(dead_code)] fn issues(&self,xml:bool,_inputs:&InputView<'_>)->Vec<RuntimeDiagnostic>{{match self{{"
            )
            .unwrap();
            for index in 0..self.variants.len() {
                if matches!(self.variants[index], Variant::Text(_)) {
                    writeln!(out, "Self::V{index}(_)=>Vec::new(),").unwrap();
                } else {
                    writeln!(out, "Self::V{index}(value)=>value.issues(xml,_inputs),").unwrap();
                }
            }
            out.push_str("}}}\n");
        }
        Ok(out)
    }
}
