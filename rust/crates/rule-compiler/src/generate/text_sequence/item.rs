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
                orders.push(crate::link::text_sequence::item_layout(variant, xml, yaml)?);
            }
            let width = orders[0].0.len();
            if orders.iter().any(|order| order.0.len() != width) {
                return Err(unsupported(
                    entry,
                    "Compact variants must have equal widths",
                ));
            }
            Ok(Layout {
                item: Self::Choice(Box::new(codec), orders),
                xml: (0..width).collect(),
                yaml: (0..width).collect(),
            })
        } else {
            let (xml, yaml) = crate::link::text_sequence::item_layout(entry, xml, yaml)?;
            Ok(Layout {
                item: Self::Record(text_pattern::Codec::resolve(entry, program)?),
                xml,
                yaml,
            })
        }
    }

    pub(super) fn with_text(&self) -> bool {
        matches!(self, Self::Choice(..))
    }

    pub(super) fn definition(&self, name: &str) -> Result<String, Diagnostic> {
        let Self::Choice(codec, orders) = self else {
            let Self::Record(codec) = self else {
                unreachable!()
            };
            return codec.element_definition(name);
        };
        let mut out = codec.compact_definition(name, orders)?;
        writeln!(out, "impl {name} {{fn visit_cells(&self,xml:bool,mut visit:impl FnMut(&str,bool)->core::Result<()>)->core::Result<()>{{match self{{").unwrap();
        for (index, orders) in orders.iter().enumerate() {
            let order = text_choice::cell_order(orders);
            writeln!(out, "Self::V{index}(value)=>{{let pieces=value.pieces(xml)?;let order={order};for(index,field)in order.iter().enumerate(){{visit(pieces[*field],index+1<order.len())?;}}}},").unwrap();
        }
        out.push_str("}Ok(())}}\n");
        Ok(out)
    }

    pub(super) fn read(&self, name: &str, count: usize) -> String {
        match self {
            Self::Record(_) => format!(
                "let order=Self::order(xml);let mut slots=[\"\";{count}];for(index,field)in order.iter().enumerate(){{slots[*field]=row[index];}}let item={name}Item::read_slots(slots,xml)?;"
            ),
            Self::Choice(..) => format!("let item={name}Item::read_row(row,xml)?;"),
        }
    }

    pub(super) fn visit(&self, count: usize, empty_guard: &str) -> String {
        match self {
            Self::Record(_) => format!(
                "let order=Self::order(xml);for(row_index,row)in self.rows.iter().enumerate(){{let pieces=row.pieces(xml)?;for(cell_index,field)in order.iter().enumerate(){{let value=pieces[*field];{empty_guard}visit(value,row_index+1<self.rows.len()||cell_index+1<{count})?;}}}}"
            ),
            Self::Choice(..) => format!(
                "for(row_index,row)in self.rows.iter().enumerate(){{row.visit_cells(xml,|value,followed|{{{empty_guard}visit(value,row_index+1<self.rows.len()||followed)}})?;}}"
            ),
        }
    }
}
