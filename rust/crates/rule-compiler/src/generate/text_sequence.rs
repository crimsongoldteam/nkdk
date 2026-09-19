mod item;
use super::*;
use std::fmt::Write;

pub(super) struct Codec<'a> {
    head: Option<(text_pattern::Codec<'a>, Vec<usize>, Vec<usize>)>,
    item: item::Item<'a>,
    xml: (&'a str, Vec<usize>),
    yaml: (&'a str, Vec<usize>),
}
impl<'a> Codec<'a> {
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
        specialized(entry)?;
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
        specialized(entry)?;
        let (fields, xml, xorder) = crate::link::text_sequence::head_layout(entry, tail, true)?;
        let (_, yaml, yorder) = crate::link::text_sequence::head_layout(entry, tail, false)?;
        let head = text_pattern::Codec::resolve_parts(entry, program, fields, xml, yaml)?;
        let mut codec = Self::resolve(tail, program)?;
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
        let mut parts = head.selection_parts(xml).into_iter();
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
        let mut head_field = String::new();
        let mut head_read = String::new();
        let mut head_init = String::new();
        let mut head_visit = String::new();
        let mut head_issues = String::new();
        let input;
        let rows = if self.item.with_text() {
            "rows_with_text"
        } else {
            "rows"
        };
        let rows_with_head = if self.item.with_text() {
            "rows_with_head_text"
        } else {
            "rows_with_head"
        };
        if let Some((head, xorder, yorder)) = &self.head {
            out.push_str(&head.element_definition(&format!("{name}Head"))?);
            let width = xorder.len();
            let order = if xorder == yorder {
                format!("{xorder:?}")
            } else {
                format!("if xml{{{xorder:?}}}else{{{yorder:?}}}")
            };
            head_field = format!("head:{name}Head,");
            head_init = "head,".into();
            input = format!(
                "let (cells,input)=Self::plan(xml).{rows_with_head}::<{width}>(text,usize::MAX,text.len()).map_err(|_|RuntimeDiagnostic::new(\"value.text-sequence\",\"Incomplete text head\"))?;"
            );
            head_read = format!(
                "let order={order};let mut slots=[\"\";{width}];for(index,field)in order.iter().enumerate(){{slots[*field]=cells[index];}}let head={name}Head::read_slots(slots,xml)?;"
            );
            head_visit = format!(
                "let owned_pieces=self.head.pieces(xml)?;let pieces=owned_pieces.each_ref().map(|piece| &piece[..]);let order={order};for(index,field)in order.iter().enumerate(){{visit(pieces[*field],index<order.len().saturating_sub(1)||!self.rows.is_empty())?;}}"
            );
            head_issues = "errors.extend(self.head.issues(xml,_inputs));".into();
        } else {
            input = format!(
                "let input=Self::plan(xml).{rows}(text,usize::MAX,text.len()).map_err(|_|RuntimeDiagnostic::new(\"value.text-sequence\",\"Invalid text sequence\"))?;"
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
        writeln!(out,"fn read(text:&str,xml:bool)->core::Result<Self>{{core::xml::validate_text(text)?;{input}{head_read}let mut rows=Vec::new();for row in input{{let row=row.map_err(|_|RuntimeDiagnostic::new(\"value.text-sequence\",\"Incomplete text record\"))?;{read_item}rows.try_reserve(1).map_err(|_|RuntimeDiagnostic::new(\"value.budget\",\"Text sequence exceeds memory budget\"))?;rows.push(item);}}let value=Self{{{head_init}rows}};value.check(true)?;value.check(false)?;Ok(value)}}").unwrap();
        writeln!(out,"fn visit(&self,xml:bool,mut visit:impl FnMut(&str,bool)->core::Result<()>)->core::Result<()>{{{head_visit}{visit_rows}Ok(())}}").unwrap();
        writeln!(out,"fn check(&self,xml:bool)->core::Result<usize>{{let mut length=0usize;let separator={separator};let plan=Self::plan(xml);self.visit(xml,|value,followed|{{plan.check_cell(value,followed).map_err(|_|RuntimeDiagnostic::new(\"value.text-sequence\",\"Cell conflicts with sequence separator\"))?;length=length.checked_add(value.len()).and_then(|length|length.checked_add(if followed{{separator.len()}}else{{0}})).ok_or_else(||RuntimeDiagnostic::new(\"value.budget\",\"Text size overflow\"))?;Ok(())}})?;Ok(length)}}").unwrap();
        writeln!(out,"fn write(&self,xml:bool)->core::Result<String>{{let length=self.check(xml)?;let separator={separator};let mut out=String::new();out.try_reserve(length).map_err(|_|RuntimeDiagnostic::new(\"value.budget\",\"Text exceeds memory budget\"))?;self.visit(xml,|value,followed|{{out.push_str(value);if followed{{out.push_str(separator);}}Ok(())}})?;Ok(out)}}").unwrap();
        let combined_issues = if head_issues.is_empty() {
            "self.child_issues(xml,_inputs)".to_owned()
        } else {
            format!("let mut errors=self.child_issues(xml,_inputs);{head_issues}errors")
        };
        writeln!(out,"#[allow(dead_code)] fn child_issues(&self,xml:bool,_inputs:&InputView<'_>)->Vec<RuntimeDiagnostic>{{let mut errors=Vec::new();for(index,row)in self.rows.iter().enumerate(){{errors.extend(row.issues(xml,_inputs).into_iter().map(|mut issue|{{issue.message=format!(\"Element {{}}: {{}}\",index+1,issue.message);issue}}));}}errors}}\n#[allow(dead_code)] fn issues(&self,xml:bool,_inputs:&InputView<'_>)->Vec<RuntimeDiagnostic>{{{combined_issues}}}}}\n").unwrap();
        Ok(out)
    }
}

fn specialized(entry: &LinkedEntry) -> Result<(), Diagnostic> {
    if !entry.inputs.is_empty()
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
