mod names;
mod project;
pub use project::{PropertyProjection, project_attributes, project_property};
mod scope;
mod source;
pub use names::is_ncname;
pub use scope::NamespaceScope;
pub use source::{
    Consumer, DocumentSource, Events, ScopedConsumer, ScopedEvents, ScopedSource, Source,
};
mod tree;
use crate::{Result, RuntimeDiagnostic};
pub use tree::{Patch, Tree};
const XML_NAMESPACE: &str = "http://www.w3.org/XML/1998/namespace";
#[cfg(feature = "test-probes")]
static WRITERS: std::sync::atomic::AtomicUsize = std::sync::atomic::AtomicUsize::new(0);
#[cfg(feature = "test-probes")]
pub fn writer_count() -> usize {
    WRITERS.load(std::sync::atomic::Ordering::Relaxed)
}

use quick_xml::{NsReader, events::Event, name::ResolveResult};

#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord)]
pub struct Name {
    pub namespace: String,
    pub local: String,
}
pub fn validate_qname(value: (&str, &str)) -> Result<()> {
    validate_text(value.0)?;
    if value.0 == "http://www.w3.org/2000/xmlns/" {
        return Err(RuntimeDiagnostic::new(
            "xml.qname",
            "The xmlns namespace cannot name a value",
        ));
    }
    if !is_ncname(value.1) {
        return Err(RuntimeDiagnostic::new(
            "xml.qname",
            "Expected a local XML name",
        ));
    }
    Ok(())
}
pub struct Attribute {
    pub name: Name,
    pub text: String,
    pub qname: Option<Name>,
}
pub enum AttributeValue<'a> {
    Text(&'a str),
    QName((&'a str, &'a str)),
}
pub struct WriteAttribute<'a> {
    pub name: (&'a str, &'a str),
    pub value: AttributeValue<'a>,
}
pub enum Token<'a> {
    Attribute(Attribute),
    Start(usize),
    Text(&'a str),
    End,
}
pub fn matches(path: &[Name], expected: &[(&str, &str)]) -> bool {
    path.len() == expected.len()
        && path
            .iter()
            .zip(expected)
            .all(|(a, b)| a.namespace == b.0 && a.local == b.1)
}
pub fn visit(
    source: &[u8],
    mut consume: impl FnMut(&[Name], Token<'_>) -> Result<()>,
) -> Result<()> {
    visit_scoped(source, |path, token, _| consume(path, token))
}
pub fn visit_scoped(
    source: &[u8],
    mut consume: impl FnMut(&[Name], Token<'_>, NamespaceScope<'_>) -> Result<()>,
) -> Result<()> {
    let text = std::str::from_utf8(source)
        .map_err(|e| RuntimeDiagnostic::new("xml.encoding", e.to_string()))?;
    let mut reader = NsReader::from_str(text);
    // The slice reader removes the UTF-8 BOM without advancing buffer_position.
    let bom = usize::from(text.starts_with('\u{feff}')) * 3;
    let mut path = vec![];
    let mut roots = 0;
    let mut declaration_seen = false;
    loop {
        let offset = reader.buffer_position() as usize + bom;
        let event = reader.read_event().map_err(|e| {
            located(
                text,
                offset,
                RuntimeDiagnostic::new("xml.syntax", e.to_string()),
            )
        })?;
        let result = match event {
            Event::Start(ref e) | Event::Empty(ref e) => {
                let offset = reader.buffer_position() as usize + bom
                    - e.len()
                    - if matches!(event, Event::Empty(_)) {
                        3
                    } else {
                        2
                    };
                if path.is_empty() {
                    roots += 1;
                    if roots > 1 {
                        return Err(located(
                            text,
                            offset,
                            RuntimeDiagnostic::new(
                                "xml.multiple-roots",
                                "Expected a single XML root",
                            ),
                        ));
                    }
                }
                let (ns, local) = reader.resolver().resolve_element(e.name());
                let namespace = match ns {
                    ResolveResult::Unbound => String::new(),
                    ResolveResult::Bound(value) => value.as_ref().to_owned(),
                    ResolveResult::Unknown(_) => {
                        return Err(located(
                            text,
                            offset,
                            RuntimeDiagnostic::new("xml.namespace", "Unbound XML prefix"),
                        ));
                    }
                };
                let mut attributes = Vec::new();
                for attribute in e.attributes() {
                    let attribute = attribute
                        .map_err(|error| RuntimeDiagnostic::new("xml.syntax", error.to_string()))?;
                    if attribute.key.as_ref() == "xmlns"
                        || attribute.key.as_ref().starts_with("xmlns:")
                    {
                        continue;
                    }
                    let (ns, local) = reader.resolver().resolve_attribute(attribute.key);
                    let namespace = match ns {
                        ResolveResult::Unbound => String::new(),
                        ResolveResult::Bound(value) => value.as_ref().to_owned(),
                        ResolveResult::Unknown(_) => {
                            return Err(located(
                                text,
                                offset,
                                RuntimeDiagnostic::new("xml.namespace", "Unbound attribute prefix"),
                            ));
                        }
                    };
                    let name = Name {
                        namespace,
                        local: local.as_ref().to_owned(),
                    };
                    let value = attribute
                        .normalized_value(quick_xml::XmlVersion::Implicit1_0)
                        .map_err(|error| {
                            RuntimeDiagnostic::new("xml.attribute", error.to_string())
                        })?
                        .into_owned();
                    validate_text(&value)?;
                    let qname = if !value.is_empty() && !value.chars().any(char::is_whitespace) {
                        let (ns, local) = reader
                            .resolver()
                            .resolve_element(quick_xml::name::QName(&value));
                        match ns {
                            ResolveResult::Unknown(_) => None,
                            ResolveResult::Unbound => Some(Name {
                                namespace: String::new(),
                                local: local.as_ref().to_owned(),
                            }),
                            ResolveResult::Bound(namespace) => Some(Name {
                                namespace: namespace.as_ref().to_owned(),
                                local: local.as_ref().to_owned(),
                            }),
                        }
                    } else {
                        None
                    };
                    attributes.push(Attribute {
                        name,
                        text: value,
                        qname,
                    });
                }
                let unique_names: std::collections::BTreeSet<_> =
                    attributes.iter().map(|attribute| &attribute.name).collect();
                if unique_names.len() != attributes.len() {
                    return Err(located(
                        text,
                        offset,
                        RuntimeDiagnostic::new(
                            "xml.duplicate-attribute",
                            "Repeated expanded attribute name",
                        ),
                    ));
                }
                path.push(Name {
                    namespace,
                    local: local.as_ref().to_owned(),
                });
                consume(
                    &path,
                    Token::Start(offset),
                    NamespaceScope(reader.resolver()),
                )
                .map_err(|error| located(text, offset, error))?;
                for attribute in attributes {
                    consume(
                        &path,
                        Token::Attribute(attribute),
                        NamespaceScope(reader.resolver()),
                    )
                    .map_err(|error| located(text, offset, error))?;
                }
                if matches!(event, Event::Empty(_)) {
                    consume(&path, Token::End, NamespaceScope(reader.resolver()))?;
                    path.pop();
                }
                Ok(())
            }
            Event::End(_) => {
                let result = consume(&path, Token::End, NamespaceScope(reader.resolver()));
                path.pop();
                result
            }
            Event::Text(e) => consume_text(
                &e.xml10_content(),
                &path,
                NamespaceScope(reader.resolver()),
                &mut consume,
            ),
            Event::CData(e) => consume_text(
                &e.xml10_content(),
                &path,
                NamespaceScope(reader.resolver()),
                &mut consume,
            ),
            Event::GeneralRef(e) => {
                let value = if let Some(value) = e
                    .resolve_char_ref()
                    .map_err(|e| RuntimeDiagnostic::new("xml.entity", e.to_string()))?
                {
                    value.to_string()
                } else {
                    match e.as_ref() {
                        "amp" => "&",
                        "lt" => "<",
                        "gt" => ">",
                        "quot" => "\"",
                        "apos" => "'",
                        _ => return Err(RuntimeDiagnostic::new("xml.entity", "Unknown entity")),
                    }
                    .into()
                };
                consume_text(
                    &value,
                    &path,
                    NamespaceScope(reader.resolver()),
                    &mut consume,
                )
            }
            Event::Decl(declaration) => {
                if declaration_seen
                    || roots != 0
                    || offset > 3
                    || declaration
                        .version()
                        .map_err(|e| RuntimeDiagnostic::new("xml.syntax", e.to_string()))?
                        != "1.0"
                {
                    return Err(RuntimeDiagnostic::new(
                        "xml.declaration",
                        "Expected one initial XML 1.0 declaration",
                    ));
                }
                if let Some(encoding) = declaration.encoding() {
                    let encoding = encoding
                        .map_err(|e| RuntimeDiagnostic::new("xml.syntax", e.to_string()))?;
                    if !encoding.eq_ignore_ascii_case("utf-8") {
                        return Err(RuntimeDiagnostic::new(
                            "xml.encoding",
                            "Only UTF-8 is supported",
                        ));
                    }
                }
                declaration_seen = true;
                Ok(())
            }
            Event::Eof => {
                if !path.is_empty() {
                    return Err(RuntimeDiagnostic::new("xml.syntax", "Unclosed element"));
                }
                break;
            }
            _ => Err(RuntimeDiagnostic::new(
                "xml.unsupported-content",
                "XML comments, processing instructions and DTD require explicit preservation support",
            )),
        };
        result.map_err(|e| located(text, offset, e))?;
    }
    Ok(())
}

fn consume_text(
    value: &str,
    path: &[Name],
    scope: NamespaceScope<'_>,
    consume: &mut impl FnMut(&[Name], Token<'_>, NamespaceScope<'_>) -> Result<()>,
) -> Result<()> {
    validate_text(value)?;
    consume(path, Token::Text(value), scope)
}

fn located(text: &str, offset: usize, error: RuntimeDiagnostic) -> RuntimeDiagnostic {
    crate::Position::xml(offset).apply(text.as_bytes(), error)
}

pub fn escape(value: &str) -> String {
    let mut out = String::with_capacity(value.len());
    for c in value.chars() {
        match c {
            '&' => out.push_str("&amp;"),
            '<' => out.push_str("&lt;"),
            '>' => out.push_str("&gt;"),
            '\r' => out.push_str("&#13;"),
            _ => out.push(c),
        }
    }
    out
}
pub struct Writer<'a> {
    output: String,
    path: Vec<(&'a str, &'a str)>,
    children: Vec<bool>,
    namespaces: &'a [&'a str],
}
impl<'a> Writer<'a> {
    pub fn new(namespaces: &'a [&'a str]) -> Self {
        #[cfg(feature = "test-probes")]
        WRITERS.fetch_add(1, std::sync::atomic::Ordering::Relaxed);
        Self {
            output: String::new(),
            path: vec![],
            children: vec![],
            namespaces,
        }
    }
    fn name(&self, name: (&str, &str)) -> String {
        if name.0.is_empty() {
            name.1.into()
        } else if name.0 == XML_NAMESPACE {
            format!("xml:{}", name.1)
        } else {
            format!(
                "n{}:{}",
                self.namespaces
                    .iter()
                    .position(|ns| *ns == name.0)
                    .expect("generated namespace"),
                name.1
            )
        }
    }
    fn has_namespace(&self, namespace: &str) -> bool {
        namespace.is_empty() || namespace == XML_NAMESPACE || self.namespaces.contains(&namespace)
    }
    fn close(&mut self, container: bool) {
        let name = self.path.pop().unwrap();
        let children = self.children.pop().expect("opened element");
        if container && children {
            self.output.push('\n');
            for _ in 0..self.path.len() {
                self.output.push('\t');
            }
        }
        self.output.push_str(&format!("</{}>", self.name(name)));
    }
    /// Open an enclosing path only when it is not already an ancestor of the current node.
    /// Independent property writers must not close and reopen their shared owner.
    pub fn ensure_container(&mut self, path: &[(&'a str, &'a str)]) {
        if !self.path.starts_with(path) {
            self.container(path);
        }
    }
    pub fn container(&mut self, path: &[(&'a str, &'a str)]) {
        self.container_with_attributes(path, &[]);
    }
    pub fn container_with_attributes<'b, 'c: 'b>(
        &mut self,
        path: &[(&'a str, &'a str)],
        attributes: impl IntoIterator<Item = &'b WriteAttribute<'c>>,
    ) {
        let mut attributes = attributes.into_iter().peekable();
        let common = self
            .path
            .iter()
            .zip(path)
            .take_while(|(a, b)| a == b)
            .count();
        while self.path.len() > common {
            self.close(true);
        }
        assert!(
            attributes.peek().is_none() || common < path.len(),
            "Attributes require a newly opened element"
        );
        for (index, &part) in path[common..].iter().enumerate() {
            if !self.path.is_empty() {
                self.output.push('\n');
                for _ in 0..self.path.len() {
                    self.output.push('\t');
                }
            }
            if self.output.is_empty() {
                self.output
                    .push_str("\u{feff}<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
            }
            self.output.push('<');
            self.output.push_str(&self.name(part));
            if self.path.is_empty() {
                for (index, ns) in self.namespaces.iter().enumerate() {
                    if *ns == XML_NAMESPACE {
                        continue;
                    }
                    self.output.push_str(&format!(
                        " xmlns:n{index}=\"{}\"",
                        escape(ns).replace('"', "&quot;")
                    ));
                }
            }
            if common + index + 1 == path.len() {
                for attribute in attributes.by_ref() {
                    self.output.push(' ');
                    self.output.push_str(&self.name(attribute.name));
                    self.output.push_str("=\"");
                    let value = match attribute.value {
                        AttributeValue::Text(value) => escape(value)
                            .replace('"', "&quot;")
                            .replace('\n', "&#10;")
                            .replace('\r', "&#13;")
                            .replace('\t', "&#9;"),
                        AttributeValue::QName(name) => self.name(name),
                    };
                    self.output.push_str(&value);
                    self.output.push('"');
                }
            }
            self.output.push('>');
            if let Some(parent) = self.children.last_mut() {
                *parent = true;
            }
            self.path.push(part);
            self.children.push(false);
        }
    }
    pub fn end_container(&mut self) {
        self.close(true);
    }
    pub fn field(&mut self, path: &[(&'a str, &'a str)], value: &str) {
        self.field_with_attributes(path, value, &[]);
    }
    pub fn qname_field(&mut self, path: &[(&'a str, &'a str)], value: (&str, &str)) -> Result<()> {
        validate_qname(value)?;
        if !self.has_namespace(value.0) {
            return Err(RuntimeDiagnostic::new(
                "xml.qname-prefix",
                "QName namespace is not registered with the writer",
            ));
        }
        self.field(path, &self.name(value));
        Ok(())
    }
    pub fn field_with_attributes<'b, 'c: 'b>(
        &mut self,
        path: &[(&'a str, &'a str)],
        value: &str,
        attributes: impl IntoIterator<Item = &'b WriteAttribute<'c>>,
    ) {
        self.container_with_attributes(path, attributes);
        self.output.push_str(&escape(value));
        self.close(false);
    }
    /// Retain the document element when all of its optional values were omitted.
    /// Opening this fallback after field writers lets a scalar root write attributes first.
    pub fn finish_with_root(mut self, root: (&'a str, &'a str)) -> Vec<u8> {
        if self.output.is_empty() {
            self.container(&[root]);
        }
        self.finish()
    }
    pub fn finish(mut self) -> Vec<u8> {
        while !self.path.is_empty() {
            self.close(true);
        }
        self.output.into_bytes()
    }
}

pub fn is_whitespace(text: &str) -> bool {
    text.chars().all(|c| matches!(c, ' ' | '\t' | '\r' | '\n'))
}
pub fn validate_text(text: &str) -> Result<()> {
    if !text.chars().all(|c| matches!(c, '\t' | '\n' | '\r' | '\u{20}'..='\u{d7ff}' | '\u{e000}'..='\u{fffd}' | '\u{10000}'..='\u{10ffff}')) {
        return Err(RuntimeDiagnostic::new("xml.invalid-character", "Text contains a character forbidden in XML 1.0"));
    }
    Ok(())
}
