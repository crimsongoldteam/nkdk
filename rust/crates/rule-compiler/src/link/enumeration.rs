use super::*;

pub(super) fn variants(values: &[EnumVariant], source: &SourceLocation) -> Result<(), Diagnostic> {
    if values.is_empty() {
        return Err(diagnostic(
            "empty_enum",
            source,
            "An enum requires variants",
        ));
    }
    let mut names = BTreeMap::new();
    let mut meanings = BTreeMap::new();
    for value in values {
        if value.name.is_empty() {
            return Err(diagnostic(
                "empty_enum_name",
                &value.source,
                "Variant name must not be empty",
            ));
        }
        for (seen, key) in [(&mut names, &value.name), (&mut meanings, &value.value)] {
            if let Some(first) = seen.insert(key, &value.source) {
                let mut error = diagnostic(
                    "duplicate_enum_variant",
                    &value.source,
                    "Variant names and meanings must be unique",
                );
                error.related.push(first.clone());
                return Err(error);
            }
        }
    }
    Ok(())
}
pub(super) fn table(
    variants: &[EnumVariant],
    values: &[EnumLexeme],
    source: &SourceLocation,
) -> Result<(), Diagnostic> {
    let expected: BTreeSet<_> = variants.iter().map(|v| &v.value).collect();
    let mut meanings = BTreeSet::new();
    let mut spellings = BTreeSet::new();
    for value in values {
        if !expected.contains(&value.value)
            || !meanings.insert(&value.value)
            || !spellings.insert(&value.text)
        {
            return Err(diagnostic(
                "ambiguous_enum_table",
                &value.source,
                "Each enum value needs a distinct canonical spelling",
            ));
        }
    }
    if meanings != expected {
        return Err(diagnostic(
            "incomplete_enum_table",
            source,
            "Canonical table must cover every variant",
        ));
    }
    Ok(())
}
