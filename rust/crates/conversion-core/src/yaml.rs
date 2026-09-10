use crate::{Result, RuntimeDiagnostic};
use std::collections::HashSet;
use yaml_rust2::{
    Yaml,
    parser::{Event, MarkedEventReceiver, Parser},
    scanner::{Marker, TScalarStyle},
};

pub struct Scalar {
    text: String,
    plain: bool,
    position: crate::Position,
}
impl Scalar {
    pub fn position(&self) -> crate::Position {
        self.position
    }
    pub fn into_text(self) -> Result<String> {
        if self.plain && !matches!(Yaml::from_str(&self.text), Yaml::String(_)) {
            return Err(RuntimeDiagnostic::new(
                "yaml.expected-text",
                "Expected a textual scalar",
            ));
        }
        Ok(self.text)
    }
    pub fn into_decimal_text(self) -> Result<String> {
        if !self.plain {
            return Err(RuntimeDiagnostic::new(
                "yaml.expected-number",
                "Expected an unquoted decimal number",
            ));
        }
        Ok(self.text)
    }
}
pub fn visit(source: &[u8], mut consume: impl FnMut(String, String) -> Result<()>) -> Result<()> {
    visit_scalars(source, |key, value| consume(key, value.into_text()?))
}
pub fn visit_scalars(
    source: &[u8],
    consume: impl FnMut(String, Scalar) -> Result<()>,
) -> Result<()> {
    let source = std::str::from_utf8(source)
        .map_err(|e| RuntimeDiagnostic::new("yaml.encoding", e.to_string()))?;
    let mut receiver = Receiver {
        consume,
        key: None,
        keys: HashSet::new(),
        depth: 0,
        documents: 0,
        mapping_seen: false,
        error: None,
    };
    Parser::new_from_str(source)
        .load(&mut receiver, true)
        .map_err(|e| {
            RuntimeDiagnostic::new("yaml.syntax", e.to_string())
                .at(e.marker().line(), e.marker().col() + 1)
        })?;
    if let Some(error) = receiver.error {
        return Err(error);
    }
    if receiver.documents != 1 || !receiver.mapping_seen {
        return Err(RuntimeDiagnostic::new(
            "yaml.expected-mapping",
            "Expected one YAML mapping",
        ));
    }
    Ok(())
}
struct Receiver<F> {
    consume: F,
    key: Option<String>,
    keys: HashSet<String>,
    depth: usize,
    documents: usize,
    mapping_seen: bool,
    error: Option<RuntimeDiagnostic>,
}
impl<F: FnMut(String, Scalar) -> Result<()>> MarkedEventReceiver for Receiver<F> {
    fn on_event(&mut self, event: Event, mark: Marker) {
        if self.error.is_some() {
            return;
        }
        let error = match event {
            Event::StreamStart | Event::StreamEnd | Event::DocumentEnd => None,
            Event::DocumentStart => {
                self.documents += 1;
                if self.documents > 1 {
                    Some(RuntimeDiagnostic::new(
                        "yaml.multiple-documents",
                        "Multiple documents are not accepted",
                    ))
                } else {
                    None
                }
            }
            Event::MappingStart(0, None) if self.depth == 0 && !self.mapping_seen => {
                self.depth = 1;
                self.mapping_seen = true;
                None
            }
            Event::MappingEnd if self.depth == 1 => {
                self.depth = 0;
                None
            }
            Event::Scalar(value, style, 0, None) if self.depth == 1 => {
                if let Some(key) = self.key.take() {
                    (self.consume)(
                        key,
                        Scalar {
                            text: value,
                            plain: style == TScalarStyle::Plain,
                            position: crate::Position::yaml(mark.line(), mark.col() + 1),
                        },
                    )
                    .err()
                } else if style == TScalarStyle::Plain
                    && !matches!(Yaml::from_str(&value), Yaml::String(_))
                {
                    Some(RuntimeDiagnostic::new(
                        "yaml.expected-text",
                        "Expected a textual scalar",
                    ))
                } else if !self.keys.insert(value.clone()) {
                    Some(
                        RuntimeDiagnostic::new(
                            "yaml.duplicate-key",
                            format!("Duplicate key: {value}"),
                        )
                        .field(value),
                    )
                } else {
                    self.key = Some(value);
                    None
                }
            }
            _ => Some(RuntimeDiagnostic::new(
                "yaml.unsupported-form",
                "This generated operation accepts an untagged flat mapping without aliases",
            )),
        };
        if let Some(error) = error {
            self.error = Some(error.at(mark.line(), mark.col() + 1));
        }
    }
}
pub fn scalar(value: &str) -> String {
    let safe = !value.is_empty()
        && value.trim() == value
        && !value.contains(['\n', '\r', '\t'])
        && !value.contains(": ")
        && !value.contains(" #")
        && !value.ends_with(':')
        && !value.starts_with([
            '-', '?', ':', ',', '[', ']', '{', '}', '#', '&', '*', '!', '|', '>', '\'', '"', '%',
            '@', '`',
        ])
        && matches!(Yaml::from_str(value), Yaml::String(_));
    if safe {
        return value.into();
    }
    let mut output = String::from("\"");
    for c in value.chars() {
        match c {
            '"' => output.push_str("\\\""),
            '\\' => output.push_str("\\\\"),
            '\n' => output.push_str("\\n"),
            '\r' => output.push_str("\\r"),
            '\t' => output.push_str("\\t"),
            c if c.is_control() => output.push_str(&format!("\\u{:04X}", c as u32)),
            _ => output.push(c),
        }
    }
    output.push('"');
    output
}
