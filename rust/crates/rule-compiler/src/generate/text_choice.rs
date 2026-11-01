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
    let Some((id, _, _)) = super::composite::reference(&field.value) else {
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
    fallback: Option<usize>,
    strict: bool,
    map_error: impl FnOnce(crate::automata::Error, &[usize]) -> Diagnostic,
) -> Result<(DFA<Vec<u32>>, Vec<usize>), Diagnostic> {
    let mut forms = Vec::new();
    for (index, variant) in variants {
        for parts in variant.selection_parts(xml, entry, strict)? {
            forms.push((index, parts));
        }
    }
    compile_selection_forms(forms, fallback, map_error)
}

fn compile_selection_forms(
    mut forms: Vec<(usize, Vec<crate::automata::Part>)>,
    fallback: Option<usize>,
    map_error: impl FnOnce(crate::automata::Error, &[usize]) -> Diagnostic,
) -> Result<(DFA<Vec<u32>>, Vec<usize>), Diagnostic> {
    if let Some(fallback) = fallback {
        forms.sort_by_key(|(index, _)| *index == fallback);
    }
    let selected = forms.iter().map(|(index, _)| *index).collect::<Vec<_>>();
    let excluded = forms
        .iter()
        .map(|(index, _)| Some(*index) == fallback)
        .collect::<Vec<_>>();
    let patterns = forms
        .into_iter()
        .map(|(_, parts)| parts)
        .collect::<Vec<_>>();
    let has_fallback_form = fallback.is_some_and(|index| selected.contains(&index));
    let machine = crate::automata::compile_sequences_with_fallback(
        &patterns,
        has_fallback_form.then_some(excluded.as_slice()),
        crate::automata::STATE_BUDGET,
        crate::automata::BYTE_BUDGET,
    )
    .map_err(|error| map_error(error, &selected))?;
    Ok((machine, selected))
}

fn yaml_fallback_index(entry: &LinkedEntry, fields: &[LinkedField]) -> Option<usize> {
    let YamlRepresentation::Choice { fallback, .. } = &entry.yaml else {
        return None;
    };
    fallback
        .as_ref()
        .and_then(|name| fields.iter().position(|field| field.name == *name))
}

fn compile_yaml_variants(
    variants: &[(usize, Variant<'_>)],
    entry: &LinkedEntry,
    profile: &str,
    strict: bool,
) -> Result<(DFA<Vec<u32>>, Vec<usize>), Diagnostic> {
    compile_variants(
        variants.iter().map(|(index, variant)| (*index, variant)),
        false,
        entry,
        None,
        strict,
        |error, _| unsupported(entry, &format!("{profile}: {error}")),
    )
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
    let mut literal_forms = Vec::new();
    for (index, field) in fields.iter().enumerate() {
        let (id, _, _) = super::composite::reference(&field.value)
            .ok_or_else(|| unsupported(entry, "Choice needs referenced variants"))?;
        let target = program
            .entries
            .iter()
            .find(|entry| entry.id == id)
            .expect("linked choice variant");
        let literals = record_scalar_literals(target).collect::<Vec<_>>();
        for literal in &literals {
            literal_forms.push((
                index,
                vec![crate::automata::Part::Literal((*literal).into())],
            ));
        }
        if !literals.is_empty() && !record_has_plain_scalar_shorthand(target) {
            continue;
        }
        if record_has_plain_scalar_shorthand(target)
            || crate::yaml_shape::has_singleton_shorthand(target, program)
        {
            if text.replace(index).is_some() {
                return Err(unsupported(
                    entry,
                    "YAML scalar choice has several text fallbacks",
                ));
            }
            continue;
        }
        if structured.contains(field.name.as_str()) {
            continue;
        }
        let selection =
            if let (LinkedType::Record(fields), YamlRepresentation::Projection(projected)) =
                (&target.value, &target.yaml)
            {
                let field = fields
                    .iter()
                    .find(|field| &field.name == projected)
                    .ok_or_else(|| unsupported(target, "Unknown projected choice field"))?;
                let (id, _, _) = super::composite::reference(&field.value).ok_or_else(|| {
                    unsupported(target, "Projected choice field needs a declaration")
                })?;
                program
                    .entries
                    .iter()
                    .find(|entry| entry.id == id)
                    .expect("linked projected choice field")
            } else {
                target
            };
        let variant = Variant::resolve(selection, program)?;
        if variant.is_decimal() {
            decimal = Some(index);
        }
        if matches!(variant, Variant::Text(_)) {
            text = Some(index);
        }
        variants.push((index, variant));
    }
    let fallback = yaml_fallback_index(entry, fields);
    let strict = text.is_some() || fallback.is_some();
    for (index, variant) in &variants {
        for parts in variant.selection_parts(false, entry, strict)? {
            literal_forms.push((*index, parts));
        }
    }
    let (machine, selected) =
        compile_selection_forms(literal_forms, fallback, |error, selected| {
            let names = selected
                .iter()
                .map(|index| fields[*index].name.as_str())
                .collect::<Vec<_>>();
            unsupported(
                entry,
                &format!("YAML scalar choice: {error}; forms: {names:?}"),
            )
        })?;
    let plan = "ChoiceScalarYaml";
    let mut out = crate::automata::declaration(plan, &machine);
    writeln!(out,"fn {name}(value:core::yaml::Scalar,tag:Option<String>)->core::Result<usize>{{if tag.as_deref().is_some_and(|tag|tag!=\"!xml/invalid\")||value.annotation().is_some_and(|tag|tag!=\"!xml/invalid\"){{return Err(RuntimeDiagnostic::new(\"yaml.choice-form\",\"Annotated choice scalar requires preservation\"))}}let(text,form)=value.into_discriminated_choice_text()?;match form{{core::yaml::ChoiceScalarForm::Number=>{:?}.ok_or_else(||RuntimeDiagnostic::new(\"yaml.choice-form\",\"Numeric YAML has no declared choice variant\")),core::yaml::ChoiceScalarForm::QuotedText|core::yaml::ChoiceScalarForm::PlainText=>Ok({plan}.select(&text)?.map(|index|{:?}[index]).or({text:?}).ok_or_else(||RuntimeDiagnostic::new(\"value.choice\",\"No declared YAML scalar form matches\"))?),}}}}",decimal,selected).unwrap();
    Ok(out)
}

pub(super) fn record_scalar_literals(entry: &LinkedEntry) -> impl Iterator<Item = &str> {
    entry
        .shorthands
        .iter()
        .filter_map(move |shorthand| match &shorthand.representation {
            LinkedShorthandRepresentation::ScalarLiteral(value)
                if matches!(entry.yaml, YamlRepresentation::Mapping(_)) =>
            {
                Some(value.as_str())
            }
            _ => None,
        })
}

pub(super) fn record_has_plain_scalar_shorthand(entry: &LinkedEntry) -> bool {
    matches!(entry.yaml, YamlRepresentation::Mapping(_))
        && entry.shorthands.iter().any(|shorthand| {
            matches!(&shorthand.representation, LinkedShorthandRepresentation::ScalarText { prefix, suffix } if prefix.is_empty() && suffix.is_empty())
        })
}

pub(super) fn mapping_yaml_selector(
    entry: &LinkedEntry,
    program: &Program,
    cases: &[(usize, &str)],
    name: &str,
) -> Result<String, Diagnostic> {
    let LinkedType::Choice(fields) = &entry.value else {
        unreachable!("choice mapping selector")
    };
    let mut variants = Vec::new();
    let mut fallback = None;
    for (index, key) in cases {
        let (id, _, _) = super::composite::reference(&fields[*index].value)
            .ok_or_else(|| unsupported(entry, "Mapping choice needs referenced variants"))?;
        let target = program
            .entries
            .iter()
            .find(|entry| entry.id == id)
            .expect("linked choice variant");
        let (LinkedType::Record(value_fields), YamlRepresentation::Mapping(yaml_fields)) =
            (&target.value, &target.yaml)
        else {
            return Err(unsupported(target, "Mapping choice needs a record variant"));
        };
        let yaml_field = yaml_fields
            .iter()
            .find(|field| field.key == *key)
            .ok_or_else(|| unsupported(target, "Mapping selector key needs a declared field"))?;
        let value_field = value_fields
            .iter()
            .find(|field| field.name == yaml_field.field)
            .ok_or_else(|| unsupported(target, "Mapping selector field is missing"))?;
        let (value_id, _, _) = super::composite::reference(&value_field.value)
            .ok_or_else(|| unsupported(target, "Mapping selector needs a referenced value"))?;
        let value = program
            .entries
            .iter()
            .find(|entry| entry.id == value_id)
            .expect("linked mapping value");
        let variant = Variant::resolve(value, program)?;
        if matches!(variant, Variant::Text(_)) && fallback.replace(*index).is_some() {
            return Err(unsupported(
                entry,
                "Mapping choice has several unrestricted text fallbacks",
            ));
        }
        if !matches!(variant, Variant::Text(_)) {
            variants.push((*index, variant));
        }
    }
    let (machine, selected) = compile_yaml_variants(
        &variants,
        entry,
        "YAML mapping value choice",
        fallback.is_some(),
    )?;
    let plan = "ChoiceMappingYaml";
    let mut out = crate::automata::declaration(plan, &machine);
    writeln!(out, "fn {name}(value:&str)->core::Result<Option<usize>>{{Ok({plan}.select(value)?.map(|index|{selected:?}[index]).or({fallback:?}))}}").unwrap();
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
    xml_exclusion: Option<usize>,
    yaml_exclusion: Option<usize>,
    xml: DFA<Vec<u32>>,
    yaml: DFA<Vec<u32>>,
    discriminator: Option<&'a DiscriminatedChoiceXml<ExpandedName>>,
}

impl<'a> Codec<'a> {
    pub(super) fn constructible(&self) -> bool {
        self.variants.iter().all(|variant| match variant {
            Variant::Pattern(pattern) => pattern.constructible(),
            Variant::Choice(choice) => choice.constructible(),
            Variant::Sequence(sequence) => sequence.constructible(),
            Variant::Text(_)
            | Variant::Boolean(..)
            | Variant::Decimal
            | Variant::Calendar { .. }
            | Variant::Enumeration(..) => true,
        })
    }

    pub(super) fn qname_parts(&self) -> Option<Vec<(&str, &str)>> {
        self.variants
            .iter()
            .map(|variant| match variant {
                Variant::Pattern(pattern) => pattern.qname_parts(),
                _ => None,
            })
            .collect()
    }
    pub(super) fn scalar_default(
        &self,
        index: u32,
        expression: &LinkedExpression,
        name: &str,
        owner: &LinkedEntry,
        program: &Program,
    ) -> Result<String, Diagnostic> {
        let selected = self
            .variants
            .get(index as usize)
            .ok_or_else(|| unsupported(self.entry, "Unknown choice default variant"))?;
        let value = match (selected, &expression.kind) {
            (
                Variant::Pattern(pattern),
                LinkedExpressionKind::Operation {
                    operator: LinkedOperator::Record(_),
                    ..
                },
            ) => pattern.record_default(expression, &format!("{name}V{index}"), owner, program)?,
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
            (Variant::Sequence(sequence), _) if sequence.constructible() => {
                sequence.semantic_default(expression, &format!("{name}V{index}"), owner, program)?
            }
            (Variant::Choice(choice), _) if choice.constructible() => {
                super::scalar_presence::choice_from_cell(
                    expression,
                    &format!("{name}V{index}"),
                    owner,
                    program,
                )?
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
            if matches!(&variant, Variant::Pattern(pattern) if !pattern.has_only_slot_defaults())
                || !target.inputs.is_empty()
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
        let xml_exclusion = match attributes::content(&entry.xml).0 {
            LinkedXml::Choice { fallback } => fallback
                .as_ref()
                .and_then(|name| fields.iter().position(|field| field.name == *name)),
            _ => None,
        };
        let yaml_exclusion = yaml_fallback_index(entry, fields);
        let compile = |xml| {
            let fallback = if xml { xml_exclusion } else { yaml_exclusion };
            compile_variants(
                variants.iter().enumerate(),
                xml,
                entry,
                fallback,
                fallback.is_some(),
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
            xml_exclusion,
            yaml_exclusion,
            xml,
            yaml,
            discriminator,
        })
    }

    pub(super) fn discriminated(&self) -> bool {
        self.discriminator.is_some()
    }

    pub(super) fn scalar_tags(&self) -> Vec<(usize, &str)> {
        let (LinkedType::Choice(fields), YamlRepresentation::Choice { variants, .. }) =
            (&self.entry.value, &self.entry.yaml)
        else {
            return Vec::new();
        };
        variants
            .iter()
            .filter_map(|selector| {
                let nkdk_rule_model::YamlChoiceForm::Scalar { tag } = &selector.form else {
                    return None;
                };
                fields
                    .iter()
                    .position(|field| field.name == selector.variant)
                    .map(|index| (index, tag.as_str()))
            })
            .collect()
    }

    pub(super) fn selects_scalar_variant(&self) -> bool {
        self.discriminated() || !self.scalar_tags().is_empty()
    }

    pub(super) fn has_untagged_scalar_variant(&self) -> bool {
        let tagged = self.scalar_tags();
        (0..self.variants.len()).any(|index| !tagged.iter().any(|(variant, _)| *variant == index))
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
        self.variants.iter().any(|variant| {
            matches!(variant, Variant::Sequence(_))
                || matches!(variant, Variant::Pattern(pattern) if pattern.has_child_checks())
        })
    }

    pub(super) fn exclude_lifted_checks(&mut self, owner: &LinkedEntry) {
        for variant in &mut self.variants {
            if let Variant::Pattern(pattern) = variant {
                pattern.exclude_lifted_checks(owner);
            }
        }
    }

    pub(super) fn needs_inputs(&self) -> bool {
        self.variants
            .iter()
            .any(|variant| variant.read_needs_inputs() || variant.write_needs_inputs())
    }

    pub(super) fn variant_text_sequence(
        &self,
        index: usize,
    ) -> Option<&super::text_sequence::Codec<'a>> {
        match &self.variants[index] {
            Variant::Sequence(sequence) => Some(sequence),
            _ => None,
        }
    }

    pub(super) fn variant_write_needs_inputs(&self, index: usize) -> bool {
        self.variants[index].write_needs_inputs()
    }

    pub(super) fn selection_parts(
        &self,
        xml: bool,
        strict: bool,
    ) -> Result<Vec<Vec<crate::automata::Part>>, Diagnostic> {
        let mut result = Vec::new();
        for variant in &self.variants {
            result.extend(variant.selection_parts(xml, self.entry, strict)?);
        }
        Ok(result)
    }

    pub(super) fn definition(&self, name: &str) -> Result<String, Diagnostic> {
        self.definition_mode(name, false, None)
    }

    pub(super) fn collection_definition(&self, name: &str) -> Result<String, Diagnostic> {
        self.definition_mode(name, true, None)
    }

    /// Different row widths require disjoint first-cell languages in both directions.
    pub(super) fn width_selector(
        &self,
        name: &str,
        orders: &[CellOrders],
        xml: &str,
        yaml: &str,
    ) -> Result<String, Diagnostic> {
        let mut output = String::new();
        for (side, separator) in [(true, xml), (false, yaml)] {
            let mut forms = Vec::new();
            for (index, variant) in self.variants.iter().enumerate() {
                for mut parts in variant.selection_parts(side, self.entry, true)? {
                    if let Some(end)=parts.iter().position(|part| matches!(part, crate::automata::Part::Literal(text) if text==separator)) {
                        parts.truncate(end);
                    }
                    forms.push((index, parts));
                }
            }
            let (machine, variants) = compile_selection_forms(forms, None, |error, _| {
                unsupported(
                    self.entry,
                    &format!("Variable row first cells must be disjoint: {error}"),
                )
            })?;
            let plan = format!("{name}_{}_WIDTH", if side { "XML" } else { "YAML" });
            output.push_str(&crate::automata::declaration(&plan, &machine));
            let widths = variants
                .iter()
                .map(|index| {
                    if side {
                        orders[*index].0.len()
                    } else {
                        orders[*index].1.len()
                    }
                })
                .collect::<Vec<_>>();
            writeln!(output,"impl {name} {{fn {}_width(first:&str)->core::Result<usize>{{{plan}.select(first)?.map(|index|{:?}[index]).ok_or_else(||RuntimeDiagnostic::new(\"value.text-sequence\",\"Unknown row prefix\"))}}}}",if side {"xml"}else{"yaml"},widths).unwrap();
        }
        writeln!(output,"impl {name} {{fn row_width(first:&str,xml:bool)->core::Result<usize>{{if xml{{Self::xml_width(first)}}else{{Self::yaml_width(first)}}}}}}").unwrap();
        Ok(output)
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
        if self.constructible() {
            writeln!(out,"impl {name}{{#[allow(dead_code)] fn from_input(inputs:&InputView<'_>,slot:usize,_context:&InputView<'_>)->core::Result<Self>{{match inputs.choice_variant(slot)?{{").unwrap();
            for (index, variant) in self.variants.iter().enumerate() {
                let child = format!("{name}V{index}");
                let value = match variant {
                    Variant::Pattern(_) => format!("{child}::from_record(fields,_context)?"),
                    Variant::Text(_) => "fields.text(0)?.to_owned()".to_owned(),
                    Variant::Boolean(..) => "fields.boolean(0)?".to_owned(),
                    Variant::Decimal => "fields.decimal(0)?.clone()".to_owned(),
                    Variant::Calendar { .. } => "*fields.calendar(0)?".to_owned(),
                    Variant::Sequence(sequence) if sequence.framed_value() => {
                        format!("{child}::from_record(fields,_context)?")
                    }
                    Variant::Sequence(_) => {
                        format!("{child}::from_rows(fields.records(0)?,_context)?")
                    }
                    Variant::Choice(_) => format!(
                        "{{let slots=[fields.field(0)];let inputs=_context.rebind(&slots);{child}::from_input(&inputs,0,_context)?}}"
                    ),
                    Variant::Enumeration(variants, ..) => {
                        super::scalar_construction::enumeration(variants, &child, "fields.text(0)?")
                    }
                };
                writeln!(out,"{index}=>{{let fields=inputs.choice_record(slot,{index})?;Ok(Self::V{index}({value}))}},").unwrap();
            }
            out.push_str("_=>Err(RuntimeDiagnostic::new(\"input.type\",\"Unknown semantic choice variant\"))}}}\n");
        }
        if self.constructible() {
            writeln!(out,"impl {name}{{#[allow(dead_code)] fn as_input(&self)->core::inputs::InputRef<'_>{{let variant=match self{{").unwrap();
            for index in 0..self.variants.len() {
                writeln!(out, "Self::V{index}(_)=>{index},").unwrap();
            }
            out.push_str("};core::inputs::InputRef::Choice{variant,fields:self}}}\n");
            writeln!(out,"impl core::inputs::RecordInput for {name}{{fn selected_variant(&self)->Option<usize>{{match self.as_input(){{core::inputs::InputRef::Choice{{variant,..}}=>Some(variant),_=>None}}}}fn field(&self,index:usize)->Option<core::inputs::InputRef<'_>>{{match self{{").unwrap();
            for (index, variant) in self.variants.iter().enumerate() {
                let value = match variant {
                    Variant::Pattern(_) => "core::inputs::RecordInput::field(value,index)".into(),
                    Variant::Text(_) => {
                        "(index==0).then_some(core::inputs::InputRef::Text(value))".into()
                    }
                    Variant::Boolean(..) => {
                        "(index==0).then_some(core::inputs::InputRef::Boolean(*value))".into()
                    }
                    Variant::Decimal => {
                        "(index==0).then_some(core::inputs::InputRef::Decimal(value))".into()
                    }
                    Variant::Calendar { .. } => "(index==0).then_some(core::inputs::InputRef::Calendar(value))".into(),
                    Variant::Sequence(sequence) if sequence.framed_value() => "core::inputs::RecordInput::field(value,index)".into(),
                    Variant::Sequence(_) => "(index==0).then(||core::inputs::InputRef::Records(core::inputs::Records::new(&value.rows)))".into(),
                    Variant::Choice(_) => "(index==0).then(||value.as_input())".into(),
                    Variant::Enumeration(variants, xml, yaml) => {
                        let meaning = scalar::Codec::Enumeration(variants, xml, yaml)
                            .meaning_reference(&format!("{name}V{index}"), "value");
                        format!("(index==0).then_some(core::inputs::InputRef::Text({meaning}))")
                    }
                };
                writeln!(out, "Self::V{index}(value)=>{value},").unwrap();
            }
            out.push_str("}}}\n");
        }
        let xml_plan = format!("{name}XML").to_uppercase();
        let yaml_plan = format!("{name}YAML").to_uppercase();
        out.push_str(&crate::automata::declaration(&xml_plan, &self.xml));
        out.push_str(&crate::automata::declaration(&yaml_plan, &self.yaml));
        let inputs = if self.needs_inputs() {
            ",_inputs:&InputView<'_>"
        } else {
            ""
        };
        let selector_argument = if self.selects_scalar_variant() {
            ",selected:Option<usize>"
        } else {
            ""
        };
        let reader = if let Some(orders) = compact {
            format!(
                "fn read_row(row:core::text_pattern::Row<'_,{}>,xml:bool{inputs})->core::Result<Self>{{let text=row.text;",
                orders
                    .iter()
                    .map(|order| order.0.len())
                    .max()
                    .expect("choice variants"),
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
        let yaml_select = if !self.scalar_tags().is_empty() {
            let tagged = self
                .scalar_tags()
                .iter()
                .map(|(index, _)| *index)
                .collect::<Vec<_>>();
            format!(
                "if selected.is_some(){{selected}}else{{{yaml_plan}.select(text)?.map(|index|{:?}[index]).filter(|index|!{tagged:?}.contains(index))}}",
                self.yaml_variants
            )
        } else if self.discriminated() {
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
                let guard = self.write_exclusion_guard(index, &xml_plan, &yaml_plan);
                if guard.is_empty() {
                    writeln!(out, "Self::V{index}(value)=>{write},").unwrap();
                } else {
                    writeln!(
                        out,
                        "Self::V{index}(value)=>{{let text={write}?;{guard}Ok(text)}},"
                    )
                    .unwrap();
                }
            }
            out.push_str("}}\n");
            writeln!(
                out,
                "fn write(&self,xml:bool{inputs})->core::Result<String>{{match self{{"
            )
            .unwrap();
            for index in 0..self.variants.len() {
                let tag = self
                    .scalar_tags()
                    .into_iter()
                    .find(|(variant, _)| *variant == index)
                    .map(|(_, tag)| tag);
                if matches!(self.variants[index], Variant::Text(_)) && self.discriminated() {
                    let yaml=tag.map_or_else(||format!("if {yaml_plan}.select(&text)?.is_some(){{core::yaml::quoted_scalar(&text)}}else{{core::yaml::scalar(&text)}}"),|tag|format!("format!(\"!{{}} {{}}\",{tag:?},core::yaml::scalar(&text))"));
                    writeln!(out, "Self::V{index}(value)=>{{let text=value.clone();Ok(if xml{{text}}else{{{yaml}}})}},").unwrap();
                    continue;
                }
                let input_argument = self.variants[index].write_input_argument();
                let write = if matches!(self.variants[index], Variant::Text(_)) {
                    "Ok(value.clone())".into()
                } else {
                    self.variants[index].write("value", &format!("{name}V{index}"), input_argument)
                };
                let guard = self.write_exclusion_guard(index, &xml_plan, &yaml_plan);
                if self.variants[index].writes_yaml_document() {
                    if let Some(tag) = tag {
                        writeln!(out,"Self::V{index}(value)=>{{let text={write}?;Ok(if xml{{text}}else{{format!(\"!{{}} {{}}\",{tag:?},text)}})}},").unwrap();
                    } else {
                        writeln!(out, "Self::V{index}(value)=>{write},").unwrap();
                    }
                } else {
                    let yaml = tag.map_or_else(
                        || "core::yaml::scalar(&text)".into(),
                        |tag| format!("format!(\"!{{}} {{}}\",{tag:?},core::yaml::scalar(&text))"),
                    );
                    writeln!(out, "Self::V{index}(value)=>{{let text={write}?;{guard}Ok(if xml{{text}}else{{{yaml}}})}},").unwrap();
                }
            }
            out.push_str("}}\n");
        }
        if let Some(parts) = self.qname_parts() {
            out.push_str("#[allow(dead_code)] fn qname_parts(&self)->(&'static str,&'static str){match self{");
            for (index, (prefix, namespace)) in parts.iter().enumerate() {
                writeln!(out, "Self::V{index}(_)=>({prefix:?},{namespace:?}),").unwrap();
            }
            out.push_str("}}\n");
        }
        out.push_str("}\n");
        if !collection && self.has_child_checks() {
            writeln!(out, "impl {name} {{#[allow(dead_code)] fn child_issues(&self,xml:bool,inputs:&InputView<'_>)->Vec<RuntimeDiagnostic>{{match self{{").unwrap();
            for (index, variant) in self.variants.iter().enumerate() {
                if matches!(variant, Variant::Sequence(_))
                    || matches!(variant, Variant::Pattern(pattern) if pattern.has_child_checks())
                {
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
                if matches!(
                    self.variants[index],
                    Variant::Text(_)
                        | Variant::Boolean(..)
                        | Variant::Enumeration(..)
                        | Variant::Calendar { .. }
                        | Variant::Decimal
                ) {
                    writeln!(out, "Self::V{index}(_)=>Vec::new(),").unwrap();
                } else {
                    writeln!(out, "Self::V{index}(value)=>value.issues(xml,_inputs),").unwrap();
                }
            }
            out.push_str("}}}\n");
        }
        Ok(out)
    }

    fn write_exclusion_guard(&self, index: usize, xml_plan: &str, yaml_plan: &str) -> String {
        if self.xml_exclusion != Some(index) && self.yaml_exclusion != Some(index) {
            return String::new();
        }
        let xml = if self.xml_exclusion == Some(index) {
            if matches!(self.variants[index], Variant::Text(_)) {
                format!("{xml_plan}.select(&text)?.is_some()")
            } else {
                format!(
                    "{xml_plan}.select(&text)?.map(|form|{:?}[form])!=Some({index})",
                    self.xml_variants
                )
            }
        } else {
            "false".into()
        };
        let yaml = if self.yaml_exclusion == Some(index) {
            if matches!(self.variants[index], Variant::Text(_)) {
                format!("{yaml_plan}.select(&text)?.is_some()")
            } else {
                format!(
                    "{yaml_plan}.select(&text)?.map(|form|{:?}[form])!=Some({index})",
                    self.yaml_variants
                )
            }
        } else {
            "false".into()
        };
        format!(
            "if (xml&&({xml}))||(!xml&&({yaml})){{return Err(RuntimeDiagnostic::new(\"value.choice-collision\",\"Open choice value belongs to an exact variant\"));}}"
        )
    }
}
