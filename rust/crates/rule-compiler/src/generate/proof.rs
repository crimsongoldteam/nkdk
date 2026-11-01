//! Share the same XML meaning predicates between a property and its owner.
pub(super) fn generate(id: u32, scalar: &str, attribute: &str, qname: &str) -> String {
    generate_scoped(id, scalar, attribute, qname, false, None)
}

pub(super) fn generate_scoped(
    id: u32,
    scalar: &str,
    attribute: &str,
    qname: &str,
    occurrences: bool,
    selected_qname: Option<&str>,
) -> String {
    let qualified =
        selected_qname.map_or_else(|| format!("xml_qname_text_{id}(path)"), str::to_owned);
    let verify = if selected_qname.is_some() {
        format!(
            "core::proof::verify_with_value_qnames(original,restored,&[],|path,occurrences|xml_scalar_at_{id}(value,path,occurrences)"
        )
    } else if occurrences {
        format!(
            "core::proof::verify_with_occurrences(original,restored,|path,occurrences|xml_scalar_at_{id}(value,path,occurrences)"
        )
    } else {
        format!(
            "core::proof::verify_with_qnames(original,restored,|path|xml_scalar_{id}(value,path)"
        )
    };
    let qname_callback = if selected_qname.is_some() {
        format!("|path,occurrences|xml_qname_text_at_{id}(value,path,occurrences)")
    } else {
        format!("xml_qname_text_{id}")
    };
    format!(
        r#"
#[allow(dead_code)] fn xml_scalar_{id}(value:&V{id},path:&[core::xml::Name])->bool {{let _=(value,path);{scalar}}}
fn xml_qname_attribute_{id}(path:&[core::xml::Name],name:&core::xml::Name)->bool {{let _=(path,name);{attribute}}}
#[allow(dead_code)] fn xml_qname_text_{id}(path:&[core::xml::Name])->bool {{let _=path;{qname}}}
#[allow(dead_code)] fn xml_qname_text_at_{id}(value:&V{id},path:&[core::xml::Name],occurrences:&[usize])->bool {{let _=(value,occurrences);{qualified}}}
fn prove_xml_{id}(value:&V{id},original:&[u8],restored:&[u8])->core::Result<()> {{{verify},xml_qname_attribute_{id},{qname_callback})}}
"#
    )
}

/// Only exceptional owner preservation needs the combined QName-name catalogue.
pub(super) fn qnames(id: u32, names: &str) -> String {
    format!(
        "#[allow(dead_code)] fn xml_qnames_{id}()->Vec<(&'static str,&'static str)> {{{names}}}\n"
    )
}

pub(super) fn finalize_yaml_prefix(id: u32) -> String {
    format!(
        r#"fn finalize_yaml_{id}(original: &[u8],candidate:Vec<u8>,value:&V{id},inputs:&InputView<'_>)->core::Result<Vec<u8>> {{
match verify_{id}(original,&candidate,inputs) {{Ok(())=>return Ok(candidate),Err(error) if matches!(error.code.as_deref(),Some("xml.round-trip-mismatch"|"yaml.implicit-value"))=>{{}},Err(error)=>return Err(error)}}
let full=prepare_yaml_{id}(value,inputs,false)?;
if full!=candidate {{match verify_{id}(original,&full,inputs) {{Ok(())=>return Ok(full),Err(error) if matches!(error.code.as_deref(),Some("xml.round-trip-mismatch"|"yaml.implicit-value"))=>{{}},Err(error)=>return Err(error)}}}}
"#
    )
}

/// A raw boundary retains its own text classification when semantic rows or
/// variants cannot be reconstructed. Ordinary values do not inspect patches.
pub(super) fn preserved_qname(patch: &str, route: &str) -> String {
    format!(
        "if let Some(patch)={patch} && path.len()>={route}.len() && core::xml::matches(&path[..{route}.len()],{route}) && let Some(qualified)=patch.text_is_qname(&path[{route}.len()..],occurrences.get({route}.len()..).unwrap_or(&[]),&[]){{return qualified;}}"
    )
}
