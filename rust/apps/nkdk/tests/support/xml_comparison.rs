fn expanded_xml_name(namespace: quick_xml::name::ResolveResult<'_>, local: &str) -> String {
    match namespace {
        quick_xml::name::ResolveResult::Bound(namespace) => {
            format!("{{{}}}{local}", namespace.as_ref())
        }
        quick_xml::name::ResolveResult::Unbound => local.into(),
        quick_xml::name::ResolveResult::Unknown(prefix) => {
            panic!("Unbound XML prefix: {prefix}")
        }
    }
}

pub(super) fn normalized_xml(source: &str) -> Vec<String> {
    use quick_xml::{events::Event, name::QName, reader::NsReader};
    let mut reader = NsReader::from_str(source);
    let mut result = Vec::new();
    loop {
        let event = reader.read_event().unwrap();
        let empty = matches!(&event, Event::Empty(_));
        match event {
            Event::Start(element) | Event::Empty(element) => {
                let (namespace, local) = reader.resolver().resolve_element(element.name());
                let name = expanded_xml_name(namespace, local.as_ref());
                let mut attributes = Vec::new();
                for attribute in element.attributes() {
                    let attribute = attribute.unwrap();
                    let key = attribute.key.as_ref();
                    if key == "xmlns" || key.starts_with("xmlns:") {
                        continue;
                    }
                    let (namespace, local) = reader.resolver().resolve_attribute(attribute.key);
                    let name = expanded_xml_name(namespace, local.as_ref());
                    let value = attribute
                        .normalized_value(quick_xml::XmlVersion::Implicit1_0)
                        .unwrap();
                    let value = if value.contains(':') && !value.contains(char::is_whitespace) {
                        let (namespace, local) =
                            reader.resolver().resolve_element(QName(value.as_ref()));
                        if matches!(namespace, quick_xml::name::ResolveResult::Bound(_)) {
                            expanded_xml_name(namespace, local.as_ref())
                        } else {
                            value.into_owned()
                        }
                    } else {
                        value.into_owned()
                    };
                    attributes.push(format!("{name}={value}"));
                }
                attributes.sort();
                result.push(format!("start {name} {attributes:?}"));
                if empty {
                    result.push(format!("end {name}"));
                }
            }
            Event::End(element) => {
                let (namespace, local) = reader.resolver().resolve_element(element.name());
                result.push(format!(
                    "end {}",
                    expanded_xml_name(namespace, local.as_ref())
                ));
            }
            Event::Text(content) => {
                let value = quick_xml::escape::unescape(content.xml10_content().as_ref())
                    .unwrap()
                    .into_owned();
                if value.trim().is_empty() {
                    continue;
                }
                let value = if value.contains(':') && !value.contains(char::is_whitespace) {
                    let (namespace, local) = reader.resolver().resolve_element(QName(&value));
                    if matches!(namespace, quick_xml::name::ResolveResult::Bound(_)) {
                        expanded_xml_name(namespace, local.as_ref())
                    } else {
                        value
                    }
                } else {
                    value
                };
                result.push(format!("text {value}"));
            }
            Event::Eof => break,
            _ => {}
        }
    }
    result
}
