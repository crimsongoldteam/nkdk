use super::*;

pub(crate) struct CapturedInputs<'a> {
    pub entry: Cow<'a, LinkedEntry>,
    /// Owner fields borrowed into slots after the owner's declared inputs.
    pub captures: Vec<u32>,
}

pub(crate) fn capture_inputs(entry: &LinkedEntry) -> Result<CapturedInputs<'_>, Diagnostic> {
    fn expression(
        value: &LinkedExpression,
        captures: &mut Vec<(u32, LinkedField)>,
        local: Option<u32>,
    ) {
        match &value.kind {
            LinkedExpressionKind::Field(index) if Some(*index) != local => {
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
                    expression(argument, captures, local);
                }
            }
            _ => {}
        }
    }
    fn bindings(value: &LinkedType, captures: &mut Vec<(u32, LinkedField)>) {
        match value {
            LinkedType::BoundReference { bindings, .. } => {
                for binding in bindings {
                    expression(&binding.value, captures, None);
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
    for rule in &entry.presence {
        let local = match rule.target {
            LinkedPresenceTarget::Field(slot) => Some(slot),
            _ => None,
        };
        for value in rule
            .xml_missing
            .iter()
            .chain(&rule.yaml_missing)
            .chain(&rule.yaml_omit_when)
            .chain(&rule.yaml_null_when)
            .chain(
                rule.xml_empty
                    .iter()
                    .chain(&rule.yaml_empty)
                    .map(|form| &form.denotes),
            )
            .chain(rule.canonical.iter().filter_map(|form| form.when.as_ref()))
        {
            expression(value, &mut captures, local);
        }
    }
    for rule in &entry.constraints {
        let local = match rule.diagnostic.at {
            LinkedDiagnosticTarget::Field(slot) => Some(slot),
            _ => None,
        };
        for value in rule.expressions() {
            expression(value, &mut captures, local);
        }
    }
    let mut xml = &entry.xml;
    while let LinkedXml::WithAttributes {
        attributes,
        content,
    } = xml
    {
        for attribute in attributes {
            if let Some(when) = &attribute.when {
                expression(when, &mut captures, None);
            }
        }
        xml = content;
    }
    if captures.is_empty() {
        return Ok(CapturedInputs {
            entry: Cow::Borrowed(entry),
            captures: Vec::new(),
        });
    }
    let mut prepared = entry.clone();
    visit_mut(&mut prepared, &mut |value, local| {
        if let LinkedExpressionKind::Field(index) = value.kind
            && Some(index) != local
        {
            let slot = captures
                .iter()
                .position(|(field, _)| *field == index)
                .expect("collected field");
            value.kind = LinkedExpressionKind::Input((entry.inputs.len() + slot) as u32);
        }
    });
    prepared
        .inputs
        .extend(captures.iter().map(|(_, field)| field.clone()));
    prepared.field_dependencies = super::dependencies(&prepared.value, &prepared.presence)?;
    Ok(CapturedInputs {
        entry: Cow::Owned(prepared),
        captures: captures.into_iter().map(|(field, _)| field).collect(),
    })
}

impl CapturedInputs<'_> {
    /// A physical header may hold several scalar fields in one storage unit.
    /// References inside that unit remain local, including during restoration.
    pub(crate) fn localize(&self, part: &mut LinkedEntry) -> Result<(), Diagnostic> {
        if self.captures.is_empty() {
            return Ok(());
        }
        let (LinkedType::Record(owner), LinkedType::Record(fields)) =
            (&self.entry.value, &part.value)
        else {
            unreachable!()
        };
        let locals: Vec<_> = self
            .captures
            .iter()
            .map(|field| {
                fields
                    .iter()
                    .position(|candidate| candidate.name == owner[*field as usize].name)
            })
            .collect();
        let offset = self.entry.inputs.len() - self.captures.len();
        visit_mut(part, &mut |value, _| {
            if let LinkedExpressionKind::Input(slot) = value.kind
                && let Some(slot) = (slot as usize).checked_sub(offset)
                && let Some(Some(local)) = locals.get(slot)
            {
                value.kind = LinkedExpressionKind::Field(*local as u32);
            }
        });
        part.field_dependencies = super::dependencies(&part.value, &part.presence)?;
        Ok(())
    }
}

pub(crate) fn materialize_row_inputs(entry: &mut LinkedEntry, base: u32) {
    let mut materialize = |value: &mut LinkedExpression, _| {
        if let LinkedExpressionKind::RowInput(slot) = value.kind {
            value.kind = LinkedExpressionKind::Input(base + slot);
        }
    };
    visit_mut(entry, &mut materialize);
    // Contributions retain their own field scope, but row inputs use the
    // same placed slots as representations and constraints.
    for contribution in &mut entry.contributions {
        for value in std::iter::once(&mut contribution.key)
            .chain(contribution.write.value_mut())
            .chain(&mut contribution.when)
            .chain(
                contribution
                    .for_each
                    .iter_mut()
                    .map(|iteration| &mut iteration.input),
            )
        {
            expression(value, None, &mut materialize);
        }
    }
}

fn expression(
    value: &mut LinkedExpression,
    local: Option<u32>,
    visitor: &mut impl FnMut(&mut LinkedExpression, Option<u32>),
) {
    visitor(value, local);
    if let LinkedExpressionKind::Operation { arguments, .. } = &mut value.kind {
        for argument in arguments {
            expression(argument, local, visitor);
        }
    }
}

fn visit_mut(
    entry: &mut LinkedEntry,
    visitor: &mut impl FnMut(&mut LinkedExpression, Option<u32>),
) {
    fn bindings(
        value: &mut LinkedType,
        visitor: &mut impl FnMut(&mut LinkedExpression, Option<u32>),
    ) {
        match value {
            LinkedType::BoundReference { bindings, .. } => {
                for binding in bindings {
                    expression(&mut binding.value, None, visitor);
                }
            }
            LinkedType::Sequence(item) => bindings(item, visitor),
            _ => {}
        }
    }
    if let LinkedType::Record(fields) = &mut entry.value {
        for field in fields {
            bindings(&mut field.value, visitor);
        }
    }
    let mut xml = &mut entry.xml;
    while let LinkedXml::WithAttributes {
        attributes,
        content,
    } = xml
    {
        for attribute in attributes {
            if let Some(when) = &mut attribute.when {
                expression(when, None, visitor);
            }
        }
        xml = content;
    }
    for short in &mut entry.shorthands {
        for value in short.expressions_mut() {
            expression(value, None, visitor);
        }
    }
    for rule in &mut entry.presence {
        let local = match rule.target {
            LinkedPresenceTarget::Field(slot) => Some(slot),
            _ => None,
        };
        for value in rule.expressions_mut() {
            expression(value, local, visitor);
        }
    }
    for rule in &mut entry.constraints {
        let local = match rule.diagnostic.at {
            LinkedDiagnosticTarget::Field(slot) => Some(slot),
            _ => None,
        };
        for value in std::iter::once(&mut rule.assertion)
            .chain(&mut rule.when)
            .chain(
                rule.for_each
                    .iter_mut()
                    .map(|iteration| &mut iteration.input),
            )
            .chain(
                rule.diagnostic
                    .message
                    .iter_mut()
                    .filter_map(|part| match part {
                        LinkedMessagePart::Expression(value) => Some(value),
                        _ => None,
                    }),
            )
        {
            expression(value, local, visitor);
        }
    }
}
