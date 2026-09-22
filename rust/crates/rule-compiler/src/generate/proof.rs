//! Share the same XML meaning predicates between a property and its owner.
pub(super) fn generate(id: u32, scalar: &str, attribute: &str, qname: &str) -> String {
    generate_scoped(id, scalar, attribute, qname, false)
}

pub(super) fn generate_scoped(
    id: u32,
    scalar: &str,
    attribute: &str,
    qname: &str,
    occurrences: bool,
) -> String {
    let verify = if occurrences {
        format!(
            "core::proof::verify_with_occurrences(original,restored,|path,occurrences|xml_scalar_at_{id}(value,path,occurrences)"
        )
    } else {
        format!(
            "core::proof::verify_with_qnames(original,restored,|path|xml_scalar_{id}(value,path)"
        )
    };
    format!(
        r#"
#[allow(dead_code)] fn xml_scalar_{id}(value:&V{id},path:&[core::xml::Name])->bool {{let _=(value,path);{scalar}}}
fn xml_qname_attribute_{id}(path:&[core::xml::Name],name:&core::xml::Name)->bool {{let _=(path,name);{attribute}}}
fn xml_qname_text_{id}(path:&[core::xml::Name])->bool {{let _=path;{qname}}}
fn prove_xml_{id}(value:&V{id},original:&[u8],restored:&[u8])->core::Result<()> {{{verify},xml_qname_attribute_{id},xml_qname_text_{id})}}
"#
    )
}

/// Only exceptional owner preservation needs the combined QName-name catalogue.
pub(super) fn qnames(id: u32, names: &str) -> String {
    format!(
        "#[allow(dead_code)] fn xml_qnames_{id}()->Vec<(&'static str,&'static str)> {{{names}}}\n"
    )
}
