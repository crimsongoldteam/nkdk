use nkdk_compiled_rules::{
    EntryId, PreparedInputs, bound_parameters, entry_id, input_names, read_inputs,
};
use serde_json::Value;
use std::collections::BTreeMap;

pub(super) fn prepare(context: &Value) -> Result<(EntryId, PreparedInputs), String> {
    let name = super::text(context, "entry")?;
    let name = match context.get("profile") {
        None => name.to_owned(),
        Some(Value::String(profile)) => format!("{name}.{profile}"),
        _ => return Err("Profile must be an explicit string".into()),
    };
    let entry = entry_id(&name).ok_or_else(|| format!("Unsupported generated entry: {name}"))?;
    let mut parameters = BTreeMap::new();
    for parameter in bound_parameters(entry) {
        let name = parameter.name;
        let value = parameter.json;
        if parameters
            .insert(
                name,
                serde_json::from_str::<Value>(value).map_err(|error| error.to_string())?,
            )
            .is_some()
        {
            return Err(
                "The property corpus cannot disambiguate parameters of multiple fields".into(),
            );
        }
    }
    if let Some(expected) = context.get("parameters") {
        let expected = expected.as_object().ok_or("Parameters must be an object")?;
        if expected.len() != parameters.len()
            || expected
                .iter()
                .any(|(name, value)| parameters.get(name.as_str()) != Some(value))
        {
            return Err("Declared static parameters differ from the corpus context".into());
        }
    } else if bound_parameters(entry)
        .iter()
        .any(|parameter| parameter.default_json != Some(parameter.json))
    {
        return Err("A nondefault profile requires explicit corpus parameters".into());
    }
    let mut inputs = serde_json::Map::new();
    for name in input_names(entry) {
        if let Some(value) = context.get(*name) {
            inputs.insert((*name).to_owned(), value.clone());
        }
    }
    // JSON is a YAML subset; the generated reader retains exact numeric spelling.
    let source = serde_json::to_vec(&inputs).map_err(|error| error.to_string())?;
    let inputs =
        read_inputs(entry, &source).map_err(|error| format!("Input context: {error:?}"))?;
    Ok((entry, inputs))
}

pub(super) fn xml(
    source: Vec<u8>,
    context: &Value,
    envelope: Option<&Value>,
) -> Result<Vec<u8>, String> {
    let namespaces = context.get("xmlFragmentNamespaces");
    if namespaces.is_none() && envelope.is_none() {
        return Ok(source);
    }
    let source = String::from_utf8(source).map_err(|error| error.to_string())?;
    let mut declarations = String::new();
    if let Some(namespaces) = namespaces {
        for (prefix, uri) in namespaces
            .as_object()
            .ok_or("Fragment namespaces must be an object")?
        {
            if !nkdk_conversion_core::xml::is_ncname(prefix)
                || matches!(prefix.as_str(), "xml" | "xmlns")
            {
                return Err("Invalid fragment namespace prefix".into());
            }
            let uri = uri.as_str().ok_or("Namespace URI must be a string")?;
            declarations.push_str(&format!(
                " xmlns:{prefix}=\"{}\"",
                nkdk_conversion_core::xml::escape(uri).replace('"', "&quot;")
            ));
        }
    }
    if let Some(envelope) = envelope {
        let name = envelope.as_str().ok_or("XML envelope must be a name")?;
        if !nkdk_conversion_core::xml::is_ncname(name) {
            return Err("Invalid XML envelope name".into());
        }
        return Ok(format!("<{name}{declarations}>{source}</{name}>").into_bytes());
    }
    // Corpus fragments have no prolog. Insert namespace context without rewriting their content.
    let start = source
        .strip_prefix('<')
        .ok_or("Expected an XML element fragment")?;
    let end = start
        .find(|c: char| c.is_ascii_whitespace() || c == '>' || c == '/')
        .ok_or("Incomplete XML fragment")?;
    if !nkdk_conversion_core::xml::is_ncname(&start[..end]) {
        return Err("Fragment must start with an unqualified element".into());
    }
    Ok(format!(
        "{}{}{}",
        &source[..end + 1],
        declarations,
        &source[end + 1..]
    )
    .into_bytes())
}
