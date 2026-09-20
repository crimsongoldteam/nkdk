mod marked_scalar;
pub use marked_scalar::append as append_marked_scalar;
mod choice;
pub use choice::{ChoiceReader, ChoiceSelection, ChoiceSelector};
mod record_mapping;
pub use record_mapping::{RecordMappingReader, mapping_value, preserved_record_mapping_item};
pub(crate) mod document;
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Form {
    Missing,
    Scalar,
    Mapping,
}
mod mapping_property;
mod nested;
pub use mapping_property::MappingPropertySource;
mod output;
mod partition;
mod property;
pub use output::{Indented, append_encoded_properties, append_properties};
pub use partition::{PartitionRouter, PartitionSource, visit_partitions};
pub use property::PropertyReader;
mod record_scalars;
mod sequence;
mod split;
pub use record_scalars::{ScalarRecordReader, visit_record_scalar_events, visit_record_scalars};
pub use sequence::{
    SequenceForm, SequenceReader, SequenceValues, TextSequence, text_sequence,
    text_sequence_events, text_sequence_with,
};
pub use split::{split_properties, split_record_properties};
mod nodes;
use crate::{Result, RuntimeDiagnostic};
pub use nested::{RecordEventsSource, RecordSource, RecordState};
pub use nodes::{Node, visit_nodes};
mod scalar_mapping;
pub use scalar_mapping::{ScalarEntry, ScalarMapping};
use yaml_rust2::Yaml;

#[derive(Clone)]
pub struct Scalar {
    annotation: Option<Box<str>>,
    text: String,
    plain: bool,
    position: crate::Position,
}
#[derive(Clone, Copy, PartialEq, Eq)]
pub enum ChoiceScalarForm {
    PlainText,
    QuotedText,
    Number,
}
impl Scalar {
    pub fn annotation(&self) -> Option<&str> {
        self.annotation.as_deref()
    }
    pub fn is_empty(&self) -> bool {
        self.text.is_empty()
    }
    pub(crate) fn is_null(&self) -> bool {
        self.plain && matches!(Yaml::from_str(&self.text), Yaml::Null)
    }
    pub fn position(&self) -> crate::Position {
        self.position
    }
    pub fn into_choice_text(self) -> Result<(String, bool)> {
        if !self.plain {
            return Ok((self.text, false));
        }
        match Yaml::from_str(&self.text) {
            Yaml::Integer(_) | Yaml::Real(_) => return Ok((self.text, true)),
            Yaml::String(_) => return Ok((self.text, false)),
            _ => (),
        }
        Err(RuntimeDiagnostic::new(
            "yaml.expected-scalar-choice",
            "Expected text or an exact finite number",
        ))
    }
    pub fn into_discriminated_choice_text(self) -> Result<(String, ChoiceScalarForm)> {
        if !self.plain {
            return Ok((self.text, ChoiceScalarForm::QuotedText));
        }
        match Yaml::from_str(&self.text) {
            Yaml::Integer(_) | Yaml::Real(_) => Ok((self.text, ChoiceScalarForm::Number)),
            Yaml::String(_) => Ok((self.text, ChoiceScalarForm::PlainText)),
            _ => Err(RuntimeDiagnostic::new(
                "yaml.expected-scalar-choice",
                "Expected text or an exact finite number",
            )),
        }
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
    pub fn into_nullable_text(self) -> Result<Option<String>> {
        if self.plain && matches!(Yaml::from_str(&self.text), Yaml::Null) {
            Ok(None)
        } else {
            self.into_text().map(Some)
        }
    }
    pub fn into_mapping_key(self) -> Result<String> {
        if self.text.is_empty() {
            Ok(String::new())
        } else {
            self.into_text()
        }
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
    mut consume: impl FnMut(String, Scalar) -> Result<()>,
) -> Result<()> {
    visit_tagged_scalars(source, |key, value, tag| {
        if tag.is_some() || value.annotation().is_some() {
            return Err(
                RuntimeDiagnostic::new("yaml.annotation", "Unexpected scalar annotation")
                    .field(key),
            );
        }
        consume(key, value)
    })
}
pub fn visit_tagged_scalars(
    source: &[u8],
    consume: impl FnMut(String, Scalar, Option<String>) -> Result<()>,
) -> Result<()> {
    visit_scalar_events(DocumentSource(source), consume)
}

/// Decode scalar fields from the same event source used by nested values.
pub fn visit_scalar_events(
    source: impl Source,
    mut consume: impl FnMut(String, Scalar, Option<String>) -> Result<()>,
) -> Result<()> {
    let mut state = ScalarMapping::default();
    marked_scalar::visit(source, |node, position| {
        if let Some(entry) = state.consume(node, position)? {
            consume(entry.key, entry.value, entry.tag)
                .map_err(|error| position.apply(&[], error))?;
        }
        Ok(())
    })?;
    state.finish()
}
pub fn mapping_key(value: &str) -> String {
    if value.is_empty() {
        String::new()
    } else {
        scalar(value)
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
    quoted_scalar(value)
}
pub fn quoted_scalar(value: &str) -> String {
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

/// A statically dispatched stream of YAML nodes. Composition routes the same
/// parse into a child decoder rather than serializing a temporary document.
pub trait Source {
    fn visit(self, consume: impl FnMut(Node, crate::Position) -> Result<()>) -> Result<()>;
}
pub struct DocumentSource<'a>(pub &'a [u8]);
impl Source for DocumentSource<'_> {
    fn visit(self, consume: impl FnMut(Node, crate::Position) -> Result<()>) -> Result<()> {
        visit_nodes(self.0, consume)
    }
}

/// A composition can forward nodes directly without retaining them.
pub type Consumer<'a> = dyn FnMut(Node, crate::Position) -> Result<()> + 'a;
pub struct Events<F>(pub F);
impl<F> Source for Events<F>
where
    F: FnOnce(&mut Consumer<'_>) -> Result<()>,
{
    fn visit(self, mut consume: impl FnMut(Node, crate::Position) -> Result<()>) -> Result<()> {
        (self.0)(&mut consume)
    }
}

/// Reconstruct one row only after its streaming reader requests exceptional recovery.
pub fn preserved_sequence_item(
    source: &[u8],
    property: Option<&str>,
    index: usize,
) -> Result<Vec<u8>> {
    let value = preserved_collection_value(source, property)?;
    let document::Kind::Sequence(items) = value.kind else {
        return Err(RuntimeDiagnostic::new(
            "yaml.collection-form",
            "Expected a sequence",
        ));
    };
    items
        .get(index)
        .ok_or_else(|| RuntimeDiagnostic::new("yaml.collection-form", "Missing sequence item"))?
        .render()
}

pub(super) fn preserved_collection_value(
    source: &[u8],
    property: Option<&str>,
) -> Result<document::Value> {
    let root = document::parse(source)?;
    Ok(if let Some(property) = property {
        let document::Kind::Mapping(entries) = root.kind else {
            return Err(RuntimeDiagnostic::new(
                "yaml.collection-form",
                "Expected a property mapping",
            ));
        };
        entries
            .into_iter()
            .find_map(|(key, value)| key.key().is_ok_and(|key| key == property).then_some(value))
            .ok_or_else(|| RuntimeDiagnostic::new("yaml.collection-form", "Missing sequence"))?
    } else {
        root
    })
}
