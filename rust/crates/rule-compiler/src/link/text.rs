use super::*;

pub(super) fn validate(module: &Module) -> Result<(), Diagnostic> {
    for item in &module.types {
        if let TypeDefinition::TextTransform(transform) = &item.definition {
            validate_transform(transform, &item.source)?;
        }
    }
    Ok(())
}

fn validate_transform(
    transform: &TextTransform,
    source: &SourceLocation,
) -> Result<(), Diagnostic> {
    let classes: BTreeSet<_> = transform
        .classes
        .iter()
        .map(|class| class.name.as_str())
        .collect();
    let flags: BTreeSet<_> = transform
        .state
        .iter()
        .map(|flag| flag.name.as_str())
        .collect();
    for transition in &transform.transitions {
        if let Some(when) = &transition.when {
            predicate(when, &classes, &flags)?;
        }
        for flag in &transition.set {
            require(&flag.name, &flags, &flag.source, "unknown_text_flag")?;
        }
    }
    for case in [&transform.result.first, &transform.result.rest] {
        if let TextCase::LowerFirstUnlessAllInClass(class) = case {
            require(class, &classes, source, "unknown_text_class")?;
        }
    }
    if transform
        .transitions
        .last()
        .is_none_or(|transition| transition.when.is_some())
    {
        return Err(diagnostic(
            "incomplete_text_transform",
            source,
            "Final text transition must be unconditional",
        ));
    }
    if let Some(first) = transform.transitions[..transform.transitions.len() - 1]
        .iter()
        .find(|transition| transition.when.is_none())
    {
        return Err(diagnostic(
            "unreachable_text_transition",
            &first.source,
            "Unconditional transition hides subsequent transitions",
        ));
    }
    for (index, shift) in transform.result.lowercase.iter().enumerate() {
        for boundary in [shift.from.0, shift.from.1] {
            let value = i64::from(boundary) + i64::from(shift.offset);
            if !(0..=65535).contains(&value) {
                return Err(diagnostic(
                    "invalid_case_shift",
                    &shift.source,
                    "Case shift exceeds UTF-16 unit range",
                ));
            }
        }
        if let Some(first) = transform.result.lowercase[..index]
            .iter()
            .find(|first| first.from.0 <= shift.from.1 && shift.from.0 <= first.from.1)
        {
            let mut error = diagnostic(
                "ambiguous_case_shift",
                &shift.source,
                "Case shift ranges overlap",
            );
            error.related.push(first.source.clone());
            return Err(error);
        }
    }
    Ok(())
}

fn predicate(
    value: &TextPredicate,
    classes: &BTreeSet<&str>,
    flags: &BTreeSet<&str>,
) -> Result<(), Diagnostic> {
    match &value.kind {
        TextCondition::Class(class) => {
            require(class, classes, &value.source, "unknown_text_class")?
        }
        TextCondition::Flag(flag) => require(flag, flags, &value.source, "unknown_text_flag")?,
        TextCondition::NextAfterRun { class, next } => {
            require(class, classes, &value.source, "unknown_text_class")?;
            if let Some(next) = next {
                require(next, classes, &value.source, "unknown_text_class")?;
            }
        }
        TextCondition::And(values) | TextCondition::Or(values) => {
            for value in values {
                predicate(value, classes, flags)?;
            }
        }
        TextCondition::Not(value) => predicate(value, classes, flags)?,
        TextCondition::TokenEmpty => {}
    }
    Ok(())
}

fn require(
    name: &str,
    names: &BTreeSet<&str>,
    source: &SourceLocation,
    code: &str,
) -> Result<(), Diagnostic> {
    if names.contains(name) {
        Ok(())
    } else {
        Err(diagnostic(
            code,
            source,
            "Text transform symbol is not declared",
        ))
    }
}

pub(super) fn transforms(module: &Module) -> Vec<LinkedTextTransform> {
    let mut output: Vec<_> = module
        .types
        .iter()
        .filter_map(|item| {
            if let TypeDefinition::TextTransform(value) = &item.definition {
                Some(LinkedTextTransform {
                    name: item.name.clone(),
                    definition: *value.clone(),
                    source: item.source.clone(),
                })
            } else {
                None
            }
        })
        .collect();
    output.sort_by(|a, b| a.name.cmp(&b.name));
    output
}
