use super::*;
use regex_automata::dfa::dense::DFA;
use std::fmt::Write;

pub(super) type CellOrders = (Vec<usize>, Vec<usize>);

pub(super) fn cell_order((xml, yaml): &CellOrders) -> String {
    if xml == yaml {
        format!("{xml:?}")
    } else {
        format!("if xml{{{xml:?}}}else{{{yaml:?}}}")
    }
}

pub(super) struct Codec<'a> {
    pub(super) variants: Vec<text_pattern::Codec<'a>>,
    xml: DFA<Vec<u32>>,
    yaml: DFA<Vec<u32>>,
}

impl<'a> Codec<'a> {
    pub(super) fn resolve(
        entry: &'a LinkedEntry,
        program: &'a Program<'a>,
    ) -> Result<Self, Diagnostic> {
        let LinkedType::Choice(fields) = &entry.value else {
            unreachable!("choice codec")
        };
        let mut variants = Vec::new();
        for field in fields {
            let LinkedType::Reference(id) = field.value else {
                return Err(unsupported(entry, "Choice needs referenced variants"));
            };
            let target = program
                .entries
                .iter()
                .find(|entry| entry.id == id)
                .expect("linked variant");
            let variant = text_pattern::Codec::resolve(target, program)?;
            if !target.inputs.is_empty()
                || !target.parameters.is_empty()
                || !variant.has_only_slot_defaults()
                || !target.shorthands.is_empty()
                || target.normalization.is_some()
                || !attributes::content(&target.xml).1.is_empty()
            {
                return Err(unsupported(
                    target,
                    "Text choice variants require text patterns with only restored-slot defaults",
                ));
            }
            variants.push(variant);
        }
        let compile = |xml| {
            let patterns: Vec<_> = variants
                .iter()
                .map(|variant| variant.selection_parts(xml))
                .collect();
            crate::automata::compile_sequences(
                &patterns,
                crate::automata::STATE_BUDGET,
                crate::automata::BYTE_BUDGET,
            )
            .map_err(|error| {
                let mut issue = unsupported(
                    entry,
                    &format!("{} choice: {error}", if xml { "XML" } else { "YAML" }),
                );
                if let crate::automata::Error::Overlap { left, right } = error {
                    issue.code = "choice_overlap".into();
                    issue.message = format!(
                        "{} forms '{}' and '{}' overlap",
                        if xml { "XML" } else { "YAML" },
                        fields[left].name,
                        fields[right].name
                    );
                    issue.related = vec![fields[left].source.clone(), fields[right].source.clone()];
                }
                issue
            })
        };
        let xml = compile(true)?;
        let yaml = compile(false)?;
        Ok(Self {
            variants,
            xml,
            yaml,
        })
    }

    pub(super) fn needs_inputs(&self) -> bool {
        self.variants.iter().any(text_pattern::Codec::projected)
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
            out.push_str(&if compact.is_some() {
                variant.element_definition(&variant_name)?
            } else if collection {
                variant.collection_definition(&variant_name)?
            } else {
                variant.definition(&variant_name)?
            });
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
        let reader = if let Some(orders) = compact {
            format!(
                "fn read_row(row:core::text_pattern::Row<'_,{}>,xml:bool)->core::Result<Self>{{let text=row.text;",
                orders[0].0.len()
            )
        } else {
            format!("fn read(text:&str,xml:bool{inputs})->core::Result<Self>{{")
        };
        writeln!(out, "impl {name} {{{reader}let selected=if xml{{{xml_plan}.select(text)?}}else{{{yaml_plan}.select(text)?}};match selected{{").unwrap();
        for (index, variant) in self.variants.iter().enumerate() {
            if let Some(orders) = compact {
                let count = orders[index].0.len();
                let order = cell_order(&orders[index]);
                writeln!(out, "Some({index})=>{{let order={order};let mut slots=[\"\";{count}];for(index,field)in order.iter().enumerate(){{slots[*field]=row.cells[index];}}Ok(Self::V{index}({name}V{index}::read_slots(slots,xml)?))}},").unwrap();
            } else {
                let inputs = if variant.projected() { ",_inputs" } else { "" };
                writeln!(
                    out,
                    "Some({index})=>Ok(Self::V{index}({name}V{index}::read(text,xml{inputs})?)),"
                )
                .unwrap();
            }
        }
        out.push_str("_=>Err(RuntimeDiagnostic::new(\"value.choice\",\"No declared text form matches\")),}}\n");
        if compact.is_none() {
            out.push_str("fn write(&self,xml:bool)->core::Result<String>{match self{\n");
            for index in 0..self.variants.len() {
                writeln!(out, "Self::V{index}(value)=>value.write(xml),").unwrap();
            }
            out.push_str("}}\n");
        }
        out.push_str("}\n");
        if collection {
            writeln!(
                out,
                "impl {name} {{fn issues(&self,xml:bool,_inputs:&InputView<'_>)->Vec<RuntimeDiagnostic>{{match self{{"
            )
            .unwrap();
            for index in 0..self.variants.len() {
                writeln!(out, "Self::V{index}(value)=>value.issues(xml,_inputs),").unwrap();
            }
            out.push_str("}}}\n");
        }
        Ok(out)
    }
}
