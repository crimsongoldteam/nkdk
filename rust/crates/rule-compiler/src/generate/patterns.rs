use super::*;
use std::fmt::Write;
pub(super) struct Pattern {
    pub definitions: String,
    pub read: String,
    pub write: String,
}
struct Builder<'a> {
    owner: &'a LinkedEntry,
    common: &'a LinkedEntry,
    program: &'a Program<'a>,
    bindings: &'a [LinkedBinding],
    arguments: &'a [LinkedExpression],
    fields: &'a [LinkedField],
    prefix: String,
    next: usize,
    definitions: String,
}
impl Builder<'_> {
    fn expression(&self, value: &LinkedExpression) -> Result<(String, String), Diagnostic> {
        let value = super::shorthand::specialize(value, self.bindings, self.arguments, self.owner)?;
        let mut context = self.common.clone();
        context.id = self.owner.id;
        expressions::expression(&context, self.program, &value)
    }
    fn fixed(&mut self, value: &LinkedExpression) -> Result<String, Diagnostic> {
        let name = format!("{}_fixed_{}", self.prefix, self.next);
        self.next += 1;
        let LinkedExpressionKind::Operation {
            operator: LinkedOperator::Record(names),
            arguments: values,
        } = &value.kind
        else {
            return Err(unsupported(
                self.owner,
                "Fixed collection part requires a record constructor",
            ));
        };
        let mut body = String::new();
        for (index, field) in self.fields.iter().enumerate() {
            let source = names
                .iter()
                .position(|name| *name == field.name)
                .ok_or_else(|| unsupported(self.owner, "Missing fixed record field"))?;
            let value = &values[source];
            let (defs, code) = self.expression(value)?;
            if matches!(
                value.value_type,
                LinkedType::Optional(_) | LinkedType::Absent
            ) {
                writeln!(
                    body,
                    "let Some(f{index})=({{ {defs} {code} }}) else {{ return Ok(None); }};"
                )
                .unwrap();
            } else {
                writeln!(body, "let f{index}={{ {defs} ({code}).to_owned() }};").unwrap();
            }
        }
        let position = if self.common.constraints.iter().any(|rule| {
            matches!(
                rule.diagnostic.at,
                LinkedDiagnosticTarget::Occurrence { .. }
            )
        }) {
            ", positions: [core::Position::default(); 2]"
        } else {
            ""
        };
        writeln!(self.definitions, "fn {name}(_inputs: &InputView<'_>) -> core::Result<Option<R{}>> {{ {body} Ok(Some(R{} {{fields:[f0,f1]{position}}})) }}", self.owner.id, self.owner.id).unwrap();
        Ok(name)
    }
    fn fixed_many(&mut self, values: &[LinkedExpression]) -> Result<Vec<String>, Diagnostic> {
        values.iter().map(|value| self.fixed(value)).collect()
    }
    fn plan(
        &mut self,
        name: &str,
        source: (&[String], &[String]),
        target: (&[String], &[String]),
        absent_keys: &[LinkedExpression],
        key_field: u32,
        when: &Option<LinkedExpression>,
    ) -> Result<(), Diagnostic> {
        let id = self.owner.id;
        let (before, after) = source;
        let mut body = String::new();
        match before.len() + after.len() {
            0 => {}
            1 => body.push_str("if rows.is_empty() { return Ok(None); }\n"),
            length => writeln!(body, "if rows.len()<{length} {{ return Ok(None); }}").unwrap(),
        }
        let end = if after.is_empty() {
            "rows.len()".to_owned()
        } else {
            format!("rows.len()-{}", after.len())
        };
        writeln!(body, "let end={end};").unwrap();
        for (prefix, functions) in [(true, before), (false, after)] {
            for (index, function) in functions.iter().enumerate() {
                let address = if prefix {
                    index.to_string()
                } else if index == 0 {
                    "end".into()
                } else {
                    format!("end+{index}")
                };
                writeln!(body, "let Some(fixed)={function}(_inputs)? else {{ return Ok(None); }}; if rows[{address}] != fixed {{ return Ok(None); }}").unwrap();
            }
        }
        writeln!(body, "let _rest=&rows[{}..end];", before.len()).unwrap();
        for key in absent_keys {
            let (defs, code) = self.expression(key)?;
            writeln!(body, "{{ {defs} let key={code}; if _rest.iter().any(|row| row.fields[{key_field}]==key) {{ return Ok(None); }} }}").unwrap();
        }
        if let Some(when) = when {
            let (defs, code) = self.expression(when)?;
            writeln!(body, "let matches = || -> core::Result<bool> {{ {defs} Ok({code}) }}; if !matches()? {{ return Ok(None); }}").unwrap();
        }
        for (prefix, functions) in [(true, target.0), (false, target.1)] {
            let name = if prefix { "prefix" } else { "suffix" };
            let mut items = Vec::new();
            for (index, function) in functions.iter().enumerate() {
                writeln!(
                    body,
                    "let Some({name}{index})={function}(_inputs)? else {{ return Ok(None); }};"
                )
                .unwrap();
                items.push(format!("{name}{index}"));
            }
            writeln!(body, "let {name}=vec![{}];", items.join(",")).unwrap();
        }
        writeln!(
            body,
            "Ok(Some(core::sequence_pattern::Rewrite {{start:{}, end, prefix, suffix}}))",
            before.len()
        )
        .unwrap();
        writeln!(self.definitions, "fn {name}(rows: &[R{id}], _inputs: &InputView<'_>) -> core::Result<Option<core::sequence_pattern::Rewrite<R{id}>>> {{ {body} }}").unwrap();
        Ok(())
    }
}
pub(super) fn generate(
    owner: &LinkedEntry,
    common: &LinkedEntry,
    program: &Program,
    bindings: &[LinkedBinding],
    arguments: &[LinkedExpression],
    fields: &[LinkedField],
    index: usize,
) -> Result<Pattern, Diagnostic> {
    let short = &common.shorthands[index];
    let LinkedShorthandRepresentation::KeyedMapping {
        prefix,
        suffix,
        absent_keys,
        key_field,
    } = &short.representation
    else {
        unreachable!()
    };
    let LinkedExpressionKind::Operation {
        operator:
            LinkedOperator::SequencePattern {
                prefix_len,
                suffix_len,
            },
        arguments: denotes,
    } = &short.denotes.kind
    else {
        return Err(unsupported(
            owner,
            "Keyed shorthand requires one rest pattern",
        ));
    };
    let mut builder = Builder {
        owner,
        common,
        program,
        bindings,
        arguments,
        fields,
        prefix: format!("pattern_{}_{index}", owner.id),
        next: 0,
        definitions: String::new(),
    };
    let rep_prefix = builder.fixed_many(prefix)?;
    let rep_suffix = builder.fixed_many(suffix)?;
    let value_prefix = builder.fixed_many(&denotes[..*prefix_len as usize])?;
    let value_suffix = builder.fixed_many(&denotes[denotes.len() - *suffix_len as usize..])?;
    let read = format!("{}_read", builder.prefix);
    let write = format!("{}_write", builder.prefix);
    builder.plan(
        &read,
        (&rep_prefix, &rep_suffix),
        (&value_prefix, &value_suffix),
        absent_keys,
        *key_field,
        &short.when,
    )?;
    builder.plan(
        &write,
        (&value_prefix, &value_suffix),
        (&rep_prefix, &rep_suffix),
        absent_keys,
        *key_field,
        &short.when,
    )?;
    Ok(Pattern {
        definitions: builder.definitions,
        read: format!(
            "if let Some(rewrite)={read}(&rows, _inputs)? {{ return Ok(rewrite.apply(rows)); }}\n"
        ),
        write: format!(
            "if shorten && let Some(rewrite)={write}(&value.rows, _inputs)? {{ append_rows_{}(out, rewrite.iter(&value.rows)); return Ok(()); }}\n",
            owner.id
        ),
    })
}
