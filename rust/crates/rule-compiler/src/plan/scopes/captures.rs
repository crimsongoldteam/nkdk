use super::*;

pub(crate) struct CapturedInputs<'a> {
    pub entry: Cow<'a, LinkedEntry>,
    /// Owner fields borrowed into slots after the owner's declared inputs.
    pub captures: Vec<u32>,
}

pub(crate) fn capture_inputs(entry: &LinkedEntry) -> Result<CapturedInputs<'_>, Diagnostic> {
    fn expression(value: &LinkedExpression, captures: &mut Vec<(u32, LinkedField)>) {
        match &value.kind {
            LinkedExpressionKind::Field(index) => {
                if !captures.iter().any(|(field, _)| field == index) {
                    captures.push((
                        *index,
                        LinkedField {
                            name: format!("$capture{index}"),
                            value: value.value_type.clone(),
                            source: value.source.clone(),
                        },
                    ));
                }
            }
            LinkedExpressionKind::Operation { arguments, .. } => {
                for argument in arguments {
                    expression(argument, captures);
                }
            }
            _ => {}
        }
    }
    fn bindings(value: &LinkedType, captures: &mut Vec<(u32, LinkedField)>) {
        match value {
            LinkedType::BoundReference { bindings, .. } => {
                for binding in bindings {
                    expression(&binding.value, captures);
                }
            }
            LinkedType::Sequence(item) => bindings(item, captures),
            // An inline record has its own lexical field scope.
            _ => {}
        }
    }
    let LinkedType::Record(fields) = &entry.value else {
        return Ok(CapturedInputs {
            entry: Cow::Borrowed(entry),
            captures: Vec::new(),
        });
    };
    let mut captures = Vec::new();
    for field in fields {
        bindings(&field.value, &mut captures);
    }
    if captures.is_empty() {
        return Ok(CapturedInputs {
            entry: Cow::Borrowed(entry),
            captures: Vec::new(),
        });
    }
    fn rewrite(value: &mut LinkedExpression, captures: &[(u32, LinkedField)], offset: usize) {
        match &mut value.kind {
            LinkedExpressionKind::Field(index) => {
                let slot = captures
                    .iter()
                    .position(|(field, _)| field == index)
                    .expect("collected field");
                value.kind = LinkedExpressionKind::Input((offset + slot) as u32);
            }
            LinkedExpressionKind::Operation { arguments, .. } => {
                for argument in arguments {
                    rewrite(argument, captures, offset);
                }
            }
            _ => {}
        }
    }
    fn rewrite_bindings(value: &mut LinkedType, captures: &[(u32, LinkedField)], offset: usize) {
        match value {
            LinkedType::BoundReference { bindings, .. } => {
                for binding in bindings {
                    rewrite(&mut binding.value, captures, offset);
                }
            }
            LinkedType::Sequence(item) => rewrite_bindings(item, captures, offset),
            _ => {}
        }
    }
    let mut prepared = entry.clone();
    let LinkedType::Record(fields) = &mut prepared.value else {
        unreachable!()
    };
    for field in fields {
        rewrite_bindings(&mut field.value, &captures, entry.inputs.len());
    }
    prepared
        .inputs
        .extend(captures.iter().map(|(_, field)| field.clone()));
    prepared.field_dependencies = super::dependencies(&prepared.value, &prepared.presence)?;
    Ok(CapturedInputs {
        entry: Cow::Owned(prepared),
        captures: captures.into_iter().map(|(field, _)| field).collect(),
    })
}
