// XML 1.0 Fifth Edition, NameStartChar/NameChar without colon (NCName).
// https://www.w3.org/TR/xml/#NT-NameStartChar
pub(super) fn ncname(value: &str) -> bool {
    let mut chars = value.chars();
    chars.next().is_some_and(start)
        && chars.all(|c| start(c) || matches!(c, '-' | '.' | '0'..='9' | '\u{b7}' | '\u{300}'..='\u{36f}' | '\u{203f}'..='\u{2040}'))
}

fn start(c: char) -> bool {
    matches!(c, 'A'..='Z' | '_' | 'a'..='z'
        | '\u{c0}'..='\u{d6}' | '\u{d8}'..='\u{f6}' | '\u{f8}'..='\u{2ff}'
        | '\u{370}'..='\u{37d}' | '\u{37f}'..='\u{1fff}' | '\u{200c}'..='\u{200d}'
        | '\u{2070}'..='\u{218f}' | '\u{2c00}'..='\u{2fef}' | '\u{3001}'..='\u{d7ff}'
        | '\u{f900}'..='\u{fdcf}' | '\u{fdf0}'..='\u{fffd}' | '\u{10000}'..='\u{effff}')
}

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
