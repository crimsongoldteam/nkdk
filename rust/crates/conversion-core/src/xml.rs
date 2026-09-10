use crate::{Result, RuntimeDiagnostic};
#[cfg(feature = "test-probes")]
static WRITERS: std::sync::atomic::AtomicUsize = std::sync::atomic::AtomicUsize::new(0);
#[cfg(feature = "test-probes")]
pub fn writer_count() -> usize {
    WRITERS.load(std::sync::atomic::Ordering::Relaxed)
}

use quick_xml::{NsReader, events::Event, name::ResolveResult};

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Name {
    pub namespace: String,
    pub local: String,
}
pub enum Token<'a> {
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
                for attribute in e.attributes() {
                    let a = attribute
                        .map_err(|e| RuntimeDiagnostic::new("xml.syntax", e.to_string()))?;
                    if a.key.as_ref() != "xmlns" && !a.key.as_ref().starts_with("xmlns:") {
                        return Err(located(
                            text,
                            offset,
                            RuntimeDiagnostic::new(
                                "xml.unknown-attribute",
                                "Attribute is not supported by this generated operation",
                            ),
                        ));
                    }
                }
                path.push(Name {
                    namespace,
                    local: local.as_ref().to_owned(),
                });
                consume(&path, Token::Start(offset))
                    .map_err(|error| located(text, offset, error))?;
                if matches!(event, Event::Empty(_)) {
                    consume(&path, Token::End)?;
                    path.pop();
                }
                Ok(())
            }
            Event::End(_) => {
                let result = consume(&path, Token::End);
                path.pop();
                result
            }
            Event::Text(e) => {
                let value = e.xml10_content();
                validate_text(&value)?;
                consume(&path, Token::Text(&value))
            }
            Event::CData(e) => {
                let value = e.xml10_content();
                validate_text(&value)?;
                consume(&path, Token::Text(&value))
            }
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
                validate_text(&value)?;
                consume(&path, Token::Text(&value))
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
pub struct Writer {
    output: String,
    path: Vec<(&'static str, &'static str)>,
    namespaces: &'static [&'static str],
}
impl Writer {
    pub fn new(namespaces: &'static [&'static str]) -> Self {
        #[cfg(feature = "test-probes")]
        WRITERS.fetch_add(1, std::sync::atomic::Ordering::Relaxed);
        Self {
            output: "\u{feff}<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n".into(),
            path: vec![],
            namespaces,
        }
    }
    fn name(&self, name: (&str, &str)) -> String {
        if name.0.is_empty() {
            name.1.into()
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
    fn close(&mut self, container: bool) {
        let name = self.path.pop().unwrap();
        if container {
            self.output.push('\n');
            for _ in 0..self.path.len() {
                self.output.push('\t');
            }
        }
        self.output.push_str(&format!("</{}>", self.name(name)));
    }
    pub fn field(&mut self, path: &'static [(&'static str, &'static str)], value: &str) {
        let common = self
            .path
            .iter()
            .zip(path)
            .take_while(|(a, b)| a == b)
            .count();
        while self.path.len() > common {
            self.close(true);
        }
        for &part in &path[common..] {
            if !self.path.is_empty() {
                self.output.push('\n');
                for _ in 0..self.path.len() {
                    self.output.push('\t');
                }
            }
            self.output.push('<');
            self.output.push_str(&self.name(part));
            if self.path.is_empty() {
                for (index, ns) in self.namespaces.iter().enumerate() {
                    self.output.push_str(&format!(
                        " xmlns:n{index}=\"{}\"",
                        escape(ns).replace('"', "&quot;")
                    ));
                }
            }
            self.output.push('>');
            self.path.push(part);
        }
        self.output.push_str(&escape(value));
        self.close(false);
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
