use super::*;

pub(super) enum Item<'a> {
    Record(text_pattern::Codec<'a>),
    Choice(Box<text_choice::Codec<'a>>, Vec<text_choice::CellOrders>),
}

pub(super) struct Layout<'a> {
    pub item: Item<'a>,
    pub xml: Vec<usize>,
    pub yaml: Vec<usize>,
}

impl<'a> Item<'a> {
    pub(super) fn semantic_default(
        &self,
        expression: &LinkedExpression,
        name: &str,
        owner: &LinkedEntry,
        program: &Program,
    ) -> Result<String, Diagnostic> {
        match self {
            Self::Record(codec) => codec.record_default(expression, name, owner, program),
            Self::Choice(codec, _) => match &expression.kind {
                LinkedExpressionKind::Operation {
                    operator: LinkedOperator::ConstructVariant(index),
                    arguments,
                } if arguments.len() == 1 => {
                    codec.scalar_default(*index, &arguments[0], name, owner, program)
                }
                _ => Err(unsupported(
                    owner,
                    "Text sequence choice default requires a selected variant",
                )),
            },
        }
    }
    pub(super) fn constructible(&self) -> bool {
        match self {
            Self::Record(codec) => codec.constructible(),
            Self::Choice(codec, _) => codec.constructible(),
        }
    }
    pub(super) fn construct(&self, name: &str) -> String {
        match self {
            Self::Record(_) => format!("{name}Item::from_record(row.as_record(),&context)?"),
            Self::Choice(..) => format!(
                "{{let slots=[Some(row.as_input())];let view=context.rebind(&slots);{name}Item::from_input(&view,0,&context)?}}"
            ),
        }
    }
    pub(super) fn resolve(
        entry: &'a LinkedEntry,
        program: &'a Program<'a>,
        xml: &str,
        yaml: &str,
    ) -> Result<Layout<'a>, Diagnostic> {
        if let LinkedType::Choice(fields) = &entry.value {
            let codec = text_choice::Codec::resolve(entry, program)?;
            let mut orders = Vec::new();
            for field in fields {
                let LinkedType::Reference(id) = field.value else {
                    return Err(unsupported(
                        entry,
                        "Compact variants require resolved references",
                    ));
                };
                let variant = program
                    .entries
                    .iter()
                    .find(|entry| entry.id == id)
                    .expect("linked compact variant");
                orders.push(crate::link::text_sequence::item_layout(
                    variant, xml, yaml, false,
                )?);
            }
            let width = orders
                .iter()
                .map(|order| order.0.len())
                .max()
                .expect("choice variants");
            Ok(Layout {
                item: Self::Choice(Box::new(codec), orders),
                xml: (0..width).collect(),
                yaml: (0..width).collect(),
            })
        } else {
            let (xml, yaml) = crate::link::text_sequence::item_layout(entry, xml, yaml, false)?;
            Ok(Layout {
                item: Self::Record(text_pattern::Codec::resolve(entry, program)?),
                xml,
                yaml,
            })
        }
    }

    pub(super) fn variable_width(&self) -> bool {
        matches!(self, Self::Choice(_, orders) if orders.iter().any(|order| order.0.len()!=orders[0].0.len()))
    }

    pub(super) fn width_selector(
        &self,
        name: &str,
        xml: &str,
        yaml: &str,
    ) -> Result<String, Diagnostic> {
        if let Self::Choice(codec, orders) = self
            && self.variable_width()
        {
            codec.width_selector(name, orders, xml, yaml)
        } else {
            Ok(String::new())
        }
    }

    pub(super) fn with_text(&self) -> bool {
        matches!(self, Self::Choice(..))
    }

    pub(super) fn needs_inputs(&self) -> bool {
        match self {
            Self::Record(codec) => codec.needs_inputs(),
            Self::Choice(codec, _) => codec.needs_inputs(),
        }
    }

    pub(super) fn definition(&self, name: &str) -> Result<String, Diagnostic> {
        let Self::Choice(codec, orders) = self else {
            let Self::Record(codec) = self else {
                unreachable!()
            };
            return codec.element_definition(name);
        };
        let mut out = codec.compact_definition(name, orders)?;
        let input = if codec.needs_inputs() {
            ",_inputs:&InputView<'_>"
        } else {
            ""
        };
        let input_arg = if codec.needs_inputs() { ",_inputs" } else { "" };
        writeln!(out, "impl {name} {{fn visit_cells(&self,xml:bool{input},mut visit:impl FnMut(&str,bool)->core::Result<()>)->core::Result<()>{{match self{{").unwrap();
        for (index, orders) in orders.iter().enumerate() {
            let order = text_choice::cell_order(orders);
            let variant_input = if codec.variant_write_needs_inputs(index) {
                input_arg
            } else {
                ""
            };
            writeln!(out, "Self::V{index}(value)=>{{let owned_pieces=value.pieces(xml{variant_input})?;let pieces=owned_pieces.each_ref().map(|piece| &piece[..]);let order={order};for(index,field)in order.iter().enumerate(){{visit(pieces[*field],index+1<order.len())?;}}}},").unwrap();
        }
        out.push_str("}Ok(())}}\n");
        Ok(out)
    }

    pub(super) fn read(&self, name: &str, count: usize) -> String {
        let input = if self.needs_inputs() { ",_inputs" } else { "" };
        match self {
            Self::Record(_) => format!(
                "let order=Self::order(xml);let mut slots=[\"\";{count}];for(index,field)in order.iter().enumerate(){{slots[*field]=row[index];}}let item={name}Item::read_slots(slots,xml{input})?;"
            ),
            Self::Choice(..) => format!("let item={name}Item::read_row(row,xml{input})?;"),
        }
    }

    pub(super) fn visit(&self, count: usize, empty_guard: &str) -> String {
        let input = if self.needs_inputs() { ",_inputs" } else { "" };
        match self {
            Self::Record(_) => format!(
                "let order=Self::order(xml);for(row_index,row)in self.rows.iter().enumerate(){{let owned_pieces=row.pieces(xml{input})?;let pieces=owned_pieces.each_ref().map(|piece| &piece[..]);for(cell_index,field)in order.iter().enumerate(){{let value=pieces[*field];{empty_guard}visit(value,row_index+1<self.rows.len()||cell_index+1<{count})?;}}}}"
            ),
            Self::Choice(..) => format!(
                "for(row_index,row)in self.rows.iter().enumerate(){{row.visit_cells(xml{input},|value,followed|{{{empty_guard}visit(value,row_index+1<self.rows.len()||followed)}})?;}}"
            ),
        }
    }
}
