pub(super) use nkdk_conversion_core::xml::is_ncname as ncname;

// https://www.w3.org/TR/xml-names/#xmlReserved
pub(super) fn validate(
    module: &nkdk_rule_model::Module,
) -> Result<(), nkdk_rule_model::Diagnostic> {
    const XML: &str = "http://www.w3.org/XML/1998/namespace";
    const XMLNS: &str = "http://www.w3.org/2000/xmlns/";
    for binding in &module.namespaces {
        let prefix = binding.name.as_str();
        let uri = binding.value.as_str();
        if (!prefix.is_empty() && (!ncname(prefix) || uri.is_empty()))
            || (prefix == "xml") != (uri == XML)
            || prefix == "xmlns"
            || uri == XMLNS
        {
            return Err(super::diagnostic(
                "invalid_namespace_binding",
                &binding.source,
                "Invalid or reserved XML namespace binding",
            ));
        }
    }
    Ok(())
}
