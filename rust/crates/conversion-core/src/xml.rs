pub mod attribute_scan;
mod names;
mod static_names;
pub use static_names::StaticNames;
mod occurrences;
pub(crate) use occurrences::Occurrences;
mod project;
pub use project::{
    PropertyProjection, borrow_or_project, project_attributes, project_property,
    visit_property_documents,
};
mod scope;
mod source;
pub use names::is_ncname;
pub use scope::{NamespaceScope, OwnedNamespaceScope};
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
#[derive(Clone)]
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
pub enum BufferedToken {
    Attribute(Attribute),
    Start(usize),
    Text(String),
    End,
}
impl BufferedToken {
    pub fn from_token(value: &Token<'_>) -> Self {
        match value {
            Token::Attribute(value) => Self::Attribute(value.clone()),
            Token::Start(value) => Self::Start(*value),
            Token::Text(value) => Self::Text((*value).to_owned()),
            Token::End => Self::End,
        }
    }
    pub fn visit<T>(&self, consume: impl FnOnce(&Token<'_>) -> T) -> T {
        match self {
            Self::Attribute(value) => consume(&Token::Attribute(value.clone())),
            Self::Start(value) => consume(&Token::Start(*value)),
            Self::Text(value) => consume(&Token::Text(value)),
            Self::End => consume(&Token::End),
        }
    }
}
pub fn matches(path: &[Name], expected: &[(&str, &str)]) -> bool {
    path.len() == expected.len()
        && path
            .iter()
            .zip(expected)
            .all(|(a, b)| a.namespace == b.0 && a.local == b.1)
}
/// Present any item in a nested linear chain at the same virtual route.
/// Chain nodes themselves are omitted; proof of the original XML remains the
/// caller's responsibility, including unexpected children and branching.
pub fn linear_chain_route_into<'a>(
    path: &'a [Name],
    root: &[(&str, &str)],
    next: &[(&str, &str)],
    item: &[(&str, &str)],
    scratch: &'a mut Vec<Name>,
) -> Option<&'a [Name]> {
    if next.is_empty()
        || item.is_empty()
        || path.len() < root.len()
        || !matches(&path[..root.len()], root)
    {
        return None;
    }
    let mut rest = &path[root.len()..];
    let mut depth = 0;
    while rest.len() >= next.len() && matches(&rest[..next.len()], next) {
        rest = &rest[next.len()..];
        depth += 1;
    }
    if rest.is_empty() {
        return (depth == 0).then_some(path);
    }
    if rest.len() < item.len() || !matches(&rest[..item.len()], item) {
        return None;
    }
    if depth == 0 {
        return Some(path);
    }
    scratch.clear();
    scratch.extend_from_slice(&path[..root.len()]);
    scratch.extend_from_slice(rest);
    Some(scratch)
}
pub fn first_offset(source: &[u8], expected: &[(&str, &str)]) -> Result<Option<usize>> {
    let mut offset = None;
    visit(source, |path, token| {
        if offset.is_none()
            && matches(path, expected)
            && let Token::Start(value) = token
        {
            offset = Some(value);
        }
        Ok(())
    })?;
    Ok(offset)
}
/// Read an attribute only on the exceptional round-trip preservation path.
pub fn attribute_value(
    source: &[u8],
    path: &[(&str, &str)],
    name: (&str, &str),
) -> Result<Option<String>> {
    let mut result = None;
    visit(source, |at, token| {
        if matches(at, path)
            && let Token::Attribute(attribute) = token
            && attribute.name.namespace == name.0
            && attribute.name.local == name.1
            && result.replace(attribute.text.clone()).is_some()
        {
            return Err(RuntimeDiagnostic::new(
                "xml.duplicate-field",
                "Repeated attribute path",
            ));
        }
        Ok(())
    })?;
    Ok(result)
}

pub fn visit(
    source: &[u8],
    mut consume: impl FnMut(&[Name], Token<'_>) -> Result<()>,
) -> Result<()> {
    visit_scoped(source, |path, token, _| consume(path, token))
}

fn resolved_namespace(
    namespace: ResolveResult<'_>,
    text: &str,
    offset: usize,
    message: &'static str,
) -> Result<String> {
    match namespace {
        ResolveResult::Unbound => Ok(String::new()),
        ResolveResult::Bound(value) => Ok(value.as_ref().to_owned()),
        ResolveResult::Unknown(_) => Err(located(
            text,
            offset,
            RuntimeDiagnostic::new("xml.namespace", message),
        )),
    }
}

// One parser body, with static dispatch in release and one compiled scanner
// in development. The macro changes only the function signature.
macro_rules! scoped_scanner {
    ($visibility:vis fn $name:ident($source:ident: &[u8], mut $consume:ident: $consumer:ty,)) => {
        $visibility fn $name($source: &[u8], mut $consume: $consumer) -> Result<()> {
            let text = std::str::from_utf8($source)
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
                        let namespace = resolved_namespace(ns, text, offset, "Unbound XML prefix")?;
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
                            let namespace =
                                resolved_namespace(ns, text, offset, "Unbound attribute prefix")?;
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
                        $consume(
                            &path,
                            Token::Start(offset),
                            NamespaceScope(reader.resolver()),
                        )
                        .map_err(|error| located(text, offset, error))?;
                        for attribute in attributes {
                            $consume(
                                &path,
                                Token::Attribute(attribute),
                                NamespaceScope(reader.resolver()),
                            )
                            .map_err(|error| located(text, offset, error))?;
                        }
                        if matches!(event, Event::Empty(_)) {
                            $consume(&path, Token::End, NamespaceScope(reader.resolver()))?;
                            path.pop();
                        }
                        Ok(())
                    }
                    Event::End(_) => {
                        let result = $consume(&path, Token::End, NamespaceScope(reader.resolver()));
                        path.pop();
                        result
                    }
                    Event::Text(e) => consume_text(
                        &e.xml10_content(),
                        &path,
                        NamespaceScope(reader.resolver()),
                        &mut $consume,
                    ),
                    Event::CData(e) => consume_text(
                        &e.xml10_content(),
                        &path,
                        NamespaceScope(reader.resolver()),
                        &mut $consume,
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
                            &mut $consume,
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
    };
}

#[cfg(not(debug_assertions))]
scoped_scanner!(pub fn visit_scoped(
    source: &[u8],
    mut consume: impl FnMut(&[Name], Token<'_>, NamespaceScope<'_>) -> Result<()>,
));

#[cfg(debug_assertions)]
type ScannerConsumer<'a> = dyn FnMut(&[Name], Token<'_>, NamespaceScope<'_>) -> Result<()> + 'a;

#[cfg(debug_assertions)]
scoped_scanner!(fn scan_scoped(
    source: &[u8],
    mut consume: &mut ScannerConsumer<'_>,
));

#[cfg(debug_assertions)]
pub fn visit_scoped(
    source: &[u8],
    mut consume: impl FnMut(&[Name], Token<'_>, NamespaceScope<'_>) -> Result<()>,
) -> Result<()> {
    scan_scoped(source, &mut consume)
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

fn append_escaped(out: &mut String, value: &str, attribute: bool) {
    let mut start = 0;
    for (index, byte) in value.bytes().enumerate() {
        let escaped = match byte {
            b'&' => "&amp;",
            b'<' => "&lt;",
            b'>' => "&gt;",
            b'\r' => "&#13;",
            b'"' if attribute => "&quot;",
            b'\n' if attribute => "&#10;",
            b'\t' if attribute => "&#9;",
            _ => continue,
        };
        out.push_str(&value[start..index]);
        out.push_str(escaped);
        start = index + 1;
    }
    out.push_str(&value[start..]);
}
pub fn escape(value: &str) -> String {
    let mut out = String::with_capacity(value.len());
    append_escaped(&mut out, value, false);
    out
}
fn append_name(out: &mut String, namespaces: &[&str], name: (&str, &str)) {
    use std::fmt::Write;
    if name.0 == XML_NAMESPACE {
        out.push_str("xml:");
    } else if !name.0.is_empty() {
        let index = namespaces
            .iter()
            .position(|ns| *ns == name.0)
            .unwrap_or_else(|| {
                panic!(
                    "generated namespace is absent: {}:{} from {:?}",
                    name.0, name.1, namespaces
                )
            });
        write!(out, "n{index}:").expect("String formatting");
    }
    out.push_str(name.1);
}
type WriterRoute<'a> = Vec<(&'a str, &'a str)>;

pub struct Writer<'a> {
    output: String,
    path: Vec<(&'a str, &'a str)>,
    children: Vec<bool>,
    namespaces: &'a [&'a str],
    last_closed: Option<Vec<(&'a str, &'a str)>>,
    route_alias: Option<(WriterRoute<'a>, WriterRoute<'a>)>,
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
            last_closed: None,
            route_alias: None,
        }
    }
    /// Let a compiled child keep its static route while the caller places it
    /// under a different node of the same XML document.
    pub fn with_route_alias<T>(
        &mut self,
        from: &[(&'a str, &'a str)],
        to: &[(&'a str, &'a str)],
        write: impl FnOnce(&mut Self) -> T,
    ) -> T {
        if from == to {
            return write(self);
        }
        let previous = self.route_alias.replace((from.to_vec(), to.to_vec()));
        let result = write(self);
        self.route_alias = previous;
        result
    }
    fn aliased_path<'b>(
        &self,
        path: &'b [(&'a str, &'a str)],
    ) -> std::borrow::Cow<'b, [(&'a str, &'a str)]> {
        let Some((from, to)) = &self.route_alias else {
            return std::borrow::Cow::Borrowed(path);
        };
        let Some(rest) = path.strip_prefix(from.as_slice()) else {
            return std::borrow::Cow::Borrowed(path);
        };
        let mut resolved = Vec::with_capacity(to.len() + rest.len());
        resolved.extend_from_slice(to);
        resolved.extend_from_slice(rest);
        std::borrow::Cow::Owned(resolved)
    }
    fn name(&self, name: (&str, &str)) -> String {
        let mut value = String::new();
        append_name(&mut value, self.namespaces, name);
        value
    }
    fn has_namespace(&self, namespace: &str) -> bool {
        namespace.is_empty() || namespace == XML_NAMESPACE || self.namespaces.contains(&namespace)
    }
    fn close(&mut self, container: bool) {
        self.last_closed = Some(self.path.clone());
        let name = self.path.pop().unwrap();
        let children = self.children.pop().expect("opened element");
        if container && children {
            self.output.push('\n');
            for _ in 0..self.path.len() {
                self.output.push('\t');
            }
        }
        self.output.push_str("</");
        append_name(&mut self.output, self.namespaces, name);
        self.output.push('>');
    }
    /// Open an enclosing path only when it is not already an ancestor of the current node.
    /// Independent property writers must not close and reopen their shared owner.
    pub fn ensure_container(&mut self, path: &[(&'a str, &'a str)]) {
        if !self.path.starts_with(path) {
            self.container(path);
        }
    }
    /// Retain an empty fallback only when a composed writer did not already
    /// emit this exact boundary and close it as a scalar value.
    pub fn ensure_container_written(&mut self, path: &[(&'a str, &'a str)]) {
        if !self.path.starts_with(path) && self.last_closed.as_deref() != Some(path) {
            self.container(path);
        }
    }
    pub fn container(&mut self, path: &[(&'a str, &'a str)]) {
        self.container_with_attributes(path, &[]);
    }
    fn append_attribute(&mut self, attribute: &WriteAttribute<'_>) {
        self.output.push(' ');
        append_name(&mut self.output, self.namespaces, attribute.name);
        self.output.push_str("=\"");
        match attribute.value {
            AttributeValue::Text(value) => append_escaped(&mut self.output, value, true),
            AttributeValue::QName(name) => append_name(&mut self.output, self.namespaces, name),
        }
        self.output.push('"');
    }
    pub fn container_with_attributes<'b, 'c: 'b>(
        &mut self,
        path: &[(&'a str, &'a str)],
        attributes: impl IntoIterator<Item = &'b WriteAttribute<'c>>,
    ) {
        let aliased = self.aliased_path(path);
        let path = aliased.as_ref();
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
        if common == path.len() && attributes.peek().is_some() {
            assert!(
                self.children.last() == Some(&false) && self.output.ends_with('>'),
                "Attributes require an element without content"
            );
            self.output.pop();
            for attribute in attributes {
                self.append_attribute(attribute);
            }
            self.output.push('>');
            return;
        }
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
            append_name(&mut self.output, self.namespaces, part);
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
                    self.append_attribute(attribute);
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
    /// Close `path` when a composed value writer left that element open.
    /// Scalar writers close their own element, while structured writers may
    /// leave it as the current container; collection emitters can use this
    /// operation without needing to know which representation was selected.
    pub fn end_container_if_open(&mut self, path: &[(&str, &str)]) {
        let path = self.aliased_path(path);
        let path = path.as_ref();
        while self.path.len() >= path.len() && self.path.starts_with(path) {
            self.close(true);
        }
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
        append_escaped(&mut self.output, value, false);
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

#[cfg(test)]
mod streaming_escape_tests {
    #[test]
    fn streaming_escapes_append_exact_text_and_attribute_bytes() {
        for (attribute, expected) in [
            (false, "prefix:Ж&amp;&lt;&gt;\"'\n\t&#13;🙂tail"),
            (true, "prefix:Ж&amp;&lt;&gt;&quot;'&#10;&#9;&#13;🙂tail"),
        ] {
            let mut output = String::with_capacity(128);
            output.push_str("prefix:");
            let capacity = output.capacity();
            super::append_escaped(&mut output, "Ж&<>\"'\n\t\r🙂tail", attribute);
            assert_eq!(output, expected);
            assert_eq!(output.capacity(), capacity);
        }
    }
}
