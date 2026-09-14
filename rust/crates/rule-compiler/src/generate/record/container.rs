//! Attributes on the record boundary share the scalar attribute contract.
use super::*;

pub(super) struct Container<'a> {
    pub path: &'a [ExpandedName],
    pub code: super::super::attributes::Attributes,
    pub write: String,
    pub qnames: Vec<(&'a str, &'a str)>,
}

pub(super) fn prepare<'a>(
    entry: &'a LinkedEntry,
    program: &Program,
    boundary: Option<&'a [ExpandedName]>,
) -> Result<Option<Container<'a>>, Diagnostic> {
    let (_, attributes) = super::super::attributes::content(&entry.xml);
    if attributes.is_empty() {
        return Ok(None);
    }
    let path = boundary
        .ok_or_else(|| unsupported(entry, "Record attributes require a placed XML boundary"))?;
    let fields = match &entry.value {
        LinkedType::Record(fields) => fields,
        _ => {
            return Err(unsupported(
                entry,
                "Record attributes require record storage",
            ));
        }
    };
    let storage = super::super::expressions::record_storage(entry, program, fields)?;
    let code = super::super::attributes::generate_with_storage(
        entry,
        program,
        &attributes,
        path,
        Some(&storage),
    )?;
    let write = if attributes.iter().all(|attribute| attribute.when.is_none()) {
        format!(
            "let attributes={};",
            super::super::attributes::static_attributes(
                &attributes
                    .iter()
                    .map(|attribute| (*attribute).clone())
                    .collect::<Vec<_>>()
            )
        )
    } else {
        format!("let _value=value;{}", code.write)
    };
    let qnames = super::super::attributes::qname_names(attributes.iter().copied());
    Ok(Some(Container {
        path,
        code,
        write,
        qnames,
    }))
}
