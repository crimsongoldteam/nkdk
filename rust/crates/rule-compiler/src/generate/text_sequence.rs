mod item;
use super::*;
use std::fmt::Write;

pub(super) struct Codec<'a> {
    entry: &'a LinkedEntry,
    program: &'a Program<'a>,
    head: Option<(text_pattern::Codec<'a>, Vec<usize>, Vec<usize>)>,
    item: item::Item<'a>,
    xml: (&'a str, Vec<usize>),
    yaml: (&'a str, Vec<usize>),
}
impl<'a> Codec<'a> {
    pub(super) fn framed_value(&self) -> bool {
        self.head.is_some()
    }
    pub(super) fn constructible(&self) -> bool {
        self.item.constructible()
            && self
                .head
                .as_ref()
                .is_none_or(|(head, _, _)| head.constructible())
    }
    pub(super) fn semantic_default(
        &self,
        expression: &LinkedExpression,
        name: &str,
        owner: &LinkedEntry,
        program: &Program,
    ) -> Result<String, Diagnostic> {
        if self.framed_value() {
            return super::declared_construction::record_expression(
                expression, owner, self.entry, program, name,
            );
        }
        let LinkedExpressionKind::Operation {
            operator: LinkedOperator::Sequence,
            arguments,
        } = &expression.kind
        else {
            return Err(unsupported(
                owner,
                "Text sequence default requires semantic rows",
            ));
        };
        let rows = arguments
            .iter()
            .map(|row| {
                self.item
                    .semantic_default(row, &format!("{name}Item"), owner, program)
            })
            .collect::<Result<Vec<_>, _>>()?;
        let context = if self.needs_inputs() { ",_inputs" } else { "" };
        Ok(format!(
            "{{let value={name}{{rows:vec![{}]}};value.check(true{context})?;value.check(false{context})?;value}}",
            rows.join(",")
        ))
    }
    pub(super) fn needs_inputs(&self) -> bool {
        (self.head.is_some() && !self.entry.inputs.is_empty())
            || self.item.needs_inputs()
            || self
                .head
                .as_ref()
                .is_some_and(|(head, _, _)| head.needs_inputs())
    }
    pub(super) fn resolve(
        entry: &'a LinkedEntry,
        program: &'a Program<'a>,
    ) -> Result<Self, Diagnostic> {
        let (
            LinkedType::Sequence(item),
            LinkedXml::TextSequence { separator: xml },
            YamlRepresentation::TextSequence { separator: yaml },
        ) = (&entry.value, &entry.xml, &entry.yaml)
        else {
            return Err(unsupported(entry, "Expected paired text sequence"));
        };
        specialized(entry, false)?;
        if !entry.constraints.is_empty() {
            return Err(unsupported(
                entry,
                "Whole sequence constraints require explicit specialization",
            ));
        }
        let LinkedType::Reference(id) = item.as_ref() else {
            return Err(unsupported(entry, "Text sequence requires imported record"));
        };
        let common = program
            .entries
            .iter()
            .find(|entry| entry.id == *id)
            .expect("linked item");
        let layout = item::Item::resolve(common, program, xml, yaml)?;
        Ok(Self {
            entry,
            program,
            head: None,
            item: layout.item,
            xml: (xml, layout.xml),
            yaml: (yaml, layout.yaml),
        })
    }
    pub(super) fn framed(
        entry: &'a LinkedEntry,
        program: &'a Program<'a>,
    ) -> Result<Option<Self>, Diagnostic> {
        let Some(id) = crate::link::text_sequence::tail_id(entry) else {
            return Ok(None);
        };
        let tail = program
            .entries
            .iter()
            .find(|entry| entry.id == id)
            .expect("linked tail");
        if !matches!(tail.xml, LinkedXml::TextSequence { .. }) {
            return Ok(None);
        }
        specialized(entry, true)?;
        let (fields, xml, xorder) = crate::link::text_sequence::head_layout(entry, tail, true)?;
        let (_, yaml, yorder) = crate::link::text_sequence::head_layout(entry, tail, false)?;
        let head = text_pattern::Codec::resolve_parts(entry, program, fields, xml, yaml)?;
        let mut codec = Self::resolve(tail, program)?;
        codec.entry = entry;
        codec.head = Some((head, xorder, yorder));
        Ok(Some(codec))
    }
    /// Select a framed sequence by its first finite cell before parsing the body.
    /// A malformed body must not escape into an unstructured choice variant.
    pub(super) fn selection_parts(
        &self,
        xml: bool,
        entry: &LinkedEntry,
    ) -> Result<Vec<Vec<crate::automata::Part>>, Diagnostic> {
        use crate::automata::Part;
        let Some((head, _, _)) = &self.head else {
            return Err(unsupported(
                entry,
                "Text sequence choice requires a discriminating head",
            ));
        };
        let mut parts = head.selection_parts(xml, false).into_iter();
        let Some(Part::Words(words)) = parts.next() else {
            return Err(unsupported(
                entry,
                "Text sequence choice head must start with a finite scalar table",
            ));
        };
        let separator = if xml { self.xml.0 } else { self.yaml.0 };
        Ok(vec![
            vec![Part::Words(words.clone())],
            vec![
                Part::Words(words),
                Part::Literal(separator.into()),
                Part::Rest,
            ],
        ])
    }
    pub(super) fn head_meaning(&self, name: &str, index: usize, receiver: &str) -> Option<String> {
        let (head, order, _) = self.head.as_ref()?;
        if index == order.len() {
            Some(format!("({receiver}).rows.as_slice()"))
        } else if index < order.len() {
            Some(head.field_meaning(&format!("{name}Head"), index, &format!("({receiver}).head")))
        } else {
            None
        }
    }
    pub(super) fn item_choice_type(&self, name: &str) -> Option<String> {
        self.item.with_text().then(|| format!("{name}Item"))
    }

    pub(super) fn item_fields(&self, name: &str, slot: u32) -> Vec<String> {
        let item::Item::Record(item) = &self.item else {
            return Vec::new();
        };
        (0..self.xml.1.len())
            .map(|index| item.field_meaning(&format!("{name}Item"), index, &format!("v{slot}")))
            .collect()
    }

    pub(super) fn definition(&self, name: &str) -> Result<String, Diagnostic> {
        let mut out = self.item.definition(&format!("{name}Item"))?;
        let count = self.xml.1.len();
        let variable_width = self.item.variable_width();
        out.push_str(
            &self
                .item
                .width_selector(&format!("{name}Item"), self.xml.0, self.yaml.0)?,
        );
        let width_argument = if variable_width {
            format!(
                ",|first|{name}Item::row_width(first,xml).map_err(|_|core::text_pattern::PatternError::Input{{offset:0}})"
            )
        } else {
            String::new()
        };

        let mut head_field = String::new();
        let mut head_read = String::new();
        let mut head_init = String::new();
        let mut head_visit = String::new();
        let mut head_issues = String::new();
        let input;
        let rows = if variable_width {
            "rows_variable"
        } else if self.item.with_text() {
            "rows_with_text"
        } else {
            "rows"
        };
        let rows_with_head = if variable_width {
            "rows_with_head_variable"
        } else if self.item.with_text() {
            "rows_with_head_text"
        } else {
            "rows_with_head"
        };
        if let Some((head, xorder, yorder)) = &self.head {
            out.push_str(&head.framed_head_definition(&format!("{name}Head"))?);
            let width = xorder.len();
            let order = if xorder == yorder {
                format!("{xorder:?}")
            } else {
                format!("if xml{{{xorder:?}}}else{{{yorder:?}}}")
            };
            head_field = format!("head:{name}Head,");
            head_init = "head,".into();
            let extra_generic = if variable_width { ",_" } else { "" };
            input = format!(
                "let (cells,input)=Self::plan(xml).{rows_with_head}::<{width}{extra_generic}>(text,usize::MAX,text.len(){width_argument}).map_err(|_|RuntimeDiagnostic::new(\"value.text-sequence\",\"Incomplete text head\"))?;"
            );
            head_read = format!(
                "let order={order};let mut slots=[\"\";{width}];for(index,field)in order.iter().enumerate(){{slots[*field]=cells[index];}}let head={name}Head::read_slots(slots,xml)?;"
            );
            head_visit = format!(
                "let owned_pieces=self.head.pieces(xml)?;let pieces=owned_pieces.each_ref().map(|piece| &piece[..]);let order={order};for(index,field)in order.iter().enumerate(){{visit(pieces[*field],index<order.len().saturating_sub(1)||!self.rows.is_empty())?;}}"
            );
            head_issues = "errors.extend(self.own_issues(xml,_inputs));".into();
        } else {
            input = format!(
                "let input=Self::plan(xml).{rows}(text,usize::MAX,text.len(){width_argument}).map_err(|_|RuntimeDiagnostic::new(\"value.text-sequence\",\"Invalid text sequence\"))?;"
            );
        }
        let empty_guard = if self.head.is_none() {
            format!(
                "if {count}==1&&self.rows.len()==1&&value.is_empty(){{return Err(RuntimeDiagnostic::new(\"value.text-sequence\",\"Empty item conflicts with empty sequence\"));}}"
            )
        } else {
            String::new()
        };
        let (xml_separator, xml_order) = &self.xml;
        let (yaml_separator, yaml_order) = &self.yaml;
        writeln!(
            out,
            "#[derive(PartialEq, Eq)] struct {name} {{ {head_field}rows:Vec<{name}Item> }} impl {name} {{"
        )
        .unwrap();
        if xml_separator == yaml_separator {
            writeln!(out,"fn plan(_xml:bool)-> &'static core::text_pattern::Sequence<'static,{count}>{{static PLAN:std::sync::LazyLock<core::text_pattern::Sequence<'static,{count}>>=std::sync::LazyLock::new(||core::text_pattern::Sequence::new({xml_separator:?}).expect(\"linked separator\")); &PLAN}}").unwrap();
        } else {
            writeln!(out,"fn plan(xml:bool)-> &'static core::text_pattern::Sequence<'static,{count}>{{static XML:std::sync::LazyLock<core::text_pattern::Sequence<'static,{count}>>=std::sync::LazyLock::new(||core::text_pattern::Sequence::new({xml_separator:?}).expect(\"linked separator\"));static YAML:std::sync::LazyLock<core::text_pattern::Sequence<'static,{count}>>=std::sync::LazyLock::new(||core::text_pattern::Sequence::new({yaml_separator:?}).expect(\"linked separator\"));if xml{{&XML}}else{{&YAML}}}}\n").unwrap();
        }
        let (order_side, order_body) = if xml_order == yaml_order {
            ("_xml", format!("{xml_order:?}"))
        } else {
            (
                "xml",
                format!("if xml{{{xml_order:?}}}else{{{yaml_order:?}}}"),
            )
        };
        if !self.item.with_text() {
            writeln!(
                out,
                "fn order({order_side}:bool)->[usize;{count}]{{{order_body}}}"
            )
            .unwrap();
        }
        let separator = if xml_separator == yaml_separator {
            format!("{xml_separator:?}")
        } else {
            format!("if xml{{{xml_separator:?}}}else{{{yaml_separator:?}}}")
        };

        let read_item = self.item.read(name, count);
        let visit_rows = self.item.visit(count, &empty_guard);
        let input_parameter = if self.needs_inputs() {
            ",_inputs:&InputView<'_>"
        } else {
            ""
        };
        let input_argument = if self.needs_inputs() { ",_inputs" } else { "" };
        writeln!(out,"fn read(text:&str,xml:bool{input_parameter})->core::Result<Self>{{core::xml::validate_text(text)?;{input}{head_read}let mut rows=Vec::new();for row in input{{let row=row.map_err(|_|RuntimeDiagnostic::new(\"value.text-sequence\",\"Incomplete text record\"))?;{read_item}rows.try_reserve(1).map_err(|_|RuntimeDiagnostic::new(\"value.budget\",\"Text sequence exceeds memory budget\"))?;rows.push(item);}}let value=Self{{{head_init}rows}};value.check(true{input_argument})?;value.check(false{input_argument})?;Ok(value)}}").unwrap();
        writeln!(out,"fn visit(&self,xml:bool{input_parameter},mut visit:impl FnMut(&str,bool)->core::Result<()>)->core::Result<()>{{{head_visit}{visit_rows}Ok(())}}").unwrap();
        writeln!(out,"fn check(&self,xml:bool{input_parameter})->core::Result<usize>{{let mut length=0usize;let separator={separator};let plan=Self::plan(xml);self.visit(xml{input_argument},|value,followed|{{plan.check_cell(value,followed).map_err(|_|RuntimeDiagnostic::new(\"value.text-sequence\",\"Cell conflicts with sequence separator\"))?;length=length.checked_add(value.len()).and_then(|length|length.checked_add(if followed{{separator.len()}}else{{0}})).ok_or_else(||RuntimeDiagnostic::new(\"value.budget\",\"Text size overflow\"))?;Ok(())}})?;Ok(length)}}").unwrap();
        writeln!(out,"fn write(&self,xml:bool{input_parameter})->core::Result<String>{{let length=self.check(xml{input_argument})?;let separator={separator};let mut out=String::new();out.try_reserve(length).map_err(|_|RuntimeDiagnostic::new(\"value.budget\",\"Text exceeds memory budget\"))?;self.visit(xml{input_argument},|value,followed|{{out.push_str(value);if followed{{out.push_str(separator);}}Ok(())}})?;Ok(out)}}").unwrap();
        let combined_issues = if head_issues.is_empty() {
            "self.child_issues(xml,_inputs)".to_owned()
        } else {
            format!("let mut errors=self.child_issues(xml,_inputs);{head_issues}errors")
        };
        writeln!(out,"#[allow(dead_code)] fn child_issues(&self,xml:bool,_inputs:&InputView<'_>)->Vec<RuntimeDiagnostic>{{let mut errors=Vec::new();for(index,row)in self.rows.iter().enumerate(){{errors.extend(row.issues(xml,_inputs).into_iter().map(|mut issue|{{issue.message=format!(\"Element {{}}: {{}}\",index+1,issue.message);issue}}));}}errors}}\n#[allow(dead_code)] fn issues(&self,xml:bool,_inputs:&InputView<'_>)->Vec<RuntimeDiagnostic>{{{combined_issues}}}}}\n").unwrap();
        if self.constructible() {
            let item = self.item.construct(name);
            writeln!(out,"impl {name}{{fn construct_rows(source:core::inputs::Records<'_>,inputs:&InputView<'_>)->core::Result<Vec<{name}Item>>{{let mut rows=Vec::new();for(position,row)in source.iter().enumerate(){{let context=inputs.with_collection_position(position);let item={item};rows.try_reserve(1).map_err(|_|RuntimeDiagnostic::new(\"value.budget\",\"Semantic text sequence exceeds memory budget\"))?;rows.push(item);}}Ok(rows)}}").unwrap();
            let context = if self.needs_inputs() { ",inputs" } else { "" };
            if let Some((_, order, _)) = &self.head {
                let width = order.len();
                writeln!(out,"fn from_record(source:&dyn core::inputs::RecordInput,inputs:&InputView<'_>)->core::Result<Self>{{let head={name}Head::from_record(source,inputs)?;let rows=Self::construct_rows(source.records({width})?,inputs)?;let value=Self{{head,rows}};value.check(true{context})?;value.check(false{context})?;Ok(value)}}}}impl core::inputs::RecordInput for {name}{{fn field(&self,index:usize)->Option<core::inputs::InputRef<'_>>{{if index<{width}{{core::inputs::RecordInput::field(&self.head,index)}}else if index=={width}{{Some(core::inputs::InputRef::Records(core::inputs::Records::new(&self.rows)))}}else{{None}}}}}}").unwrap();
            } else {
                writeln!(out,"fn from_rows(source:core::inputs::Records<'_>,inputs:&InputView<'_>)->core::Result<Self>{{let value=Self{{rows:Self::construct_rows(source,inputs)?}};value.check(true{context})?;value.check(false{context})?;Ok(value)}}}}").unwrap();
            }
        }
        if let Some((head, _, _)) = &self.head {
            let LinkedType::Record(fields) = &self.entry.value else {
                unreachable!("framed record")
            };
            let mut storage = (0..fields.len() - 1)
                .map(|index| {
                    (
                        head.field_meaning(&format!("{name}Head"), index, "self.head"),
                        "true".into(),
                    )
                })
                .collect::<Vec<_>>();
            storage.push(("self.rows.as_slice()".into(), "true".into()));
            out.push_str(&super::text_item_checks::generate_with_storage(
                self.entry,
                self.program,
                name,
                fields,
                &storage,
                "own_issues",
                super::text_item_checks::Scope {
                    sequence: Some(name),
                    input_prelude: "",
                    field_type_names: Some(
                        (0..fields.len())
                            .map(|index| format!("{name}HeadP{index}"))
                            .collect(),
                    ),
                },
            )?);
        }
        Ok(out)
    }
}

fn specialized(entry: &LinkedEntry, allow_inputs: bool) -> Result<(), Diagnostic> {
    if (!allow_inputs && !entry.inputs.is_empty())
        || !entry.parameters.is_empty()
        || !entry.presence.is_empty()
        || !entry.shorthands.is_empty()
        || !entry.contributions.is_empty()
        || entry.normalization.is_some()
        || !entry.text_transforms.is_empty()
    {
        return Err(unsupported(
            entry,
            "Text sequence contracts require explicit specialization",
        ));
    }
    Ok(())
}
