mod grouped;
pub use grouped::GroupRouter;
mod projection;
pub use projection::ProjectionSource;
mod shaped_projection;
pub use shaped_projection::{ProjectionShape, ShapedProjectionSource};
mod key_table;
mod marked_scalar;
pub use key_table::{ProjectedKey, to_xml as key_table_to_xml, to_yaml as key_table_to_yaml};
pub use marked_scalar::append as append_marked_scalar;
mod choice;
pub use choice::{ChoiceReader, ChoiceSelection, ChoiceSelector};
mod mapping_literal_filter;
pub use mapping_literal_filter::MappingLiteralFilter;
mod record_mapping;
pub use record_mapping::{
    GroupedRecordMappingReader, GroupedRecordMappingWriter, RecordMappingFields,
    RecordMappingReader, append_generated_field_value, mapping_value,
    preserved_record_mapping_item,
};
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
pub use property::insert_mapping_literal;
mod record_scalars;
mod sequence;
mod split;
pub use record_scalars::{ScalarRecordReader, visit_record_scalar_events, visit_record_scalars};
pub use sequence::{
    SequenceForm, SequenceReader, SequenceValues, TextSequence, text_sequence,
    text_sequence_events, text_sequence_with,
};
pub use split::{split_properties, split_record_properties};

/// Remove an optional mapping property before inserting its exceptional XML envelope.
/// Other entries retain their original order and values.
pub fn without_property(source: &[u8], property: &str) -> Result<Vec<u8>> {
    let mut document = document::parse(source)?;
    let document::Kind::Mapping(entries) = &mut document.kind else {
        return Err(RuntimeDiagnostic::new(
            "yaml.annotation-address",
            "Expected a mapping",
        ));
    };
    let original_len = entries.len();
    entries.retain(|(key, _)| !key.key().is_ok_and(|key| key == property));
    if original_len - entries.len() > 1 {
        return Err(RuntimeDiagnostic::new(
            "yaml.annotation-address",
            "Expected one property",
        ));
    }
    document.document()
}

mod nodes;
use crate::{Result, RuntimeDiagnostic};
pub use nested::{RecordEventsSource, RecordSource, RecordState};
pub use nodes::{ItemTags, Node, visit_nodes};
mod scalar_mapping;
pub use scalar_mapping::{ScalarEntry, ScalarMapping, ScalarOrMapping, ScalarOrMappingEntry};
use yaml_rust2::Yaml;

pub(crate) fn parse_events(
    source: &[u8],
    #[cfg(debug_assertions)] receiver: &mut dyn yaml_rust2::parser::MarkedEventReceiver,
    #[cfg(not(debug_assertions))] receiver: &mut impl yaml_rust2::parser::MarkedEventReceiver,
    encoding_code: &'static str,
    syntax_code: &'static str,
) -> Result<()> {
    let source = std::str::from_utf8(source)
        .map_err(|error| RuntimeDiagnostic::new(encoding_code, error.to_string()))?;
    let mut parser = yaml_rust2::parser::Parser::new_from_str(source);
    #[cfg(debug_assertions)]
    let result = parser.load(&mut EventReceiver(receiver), true);
    #[cfg(not(debug_assertions))]
    let result = parser.load(receiver, true);
    result.map_err(|error| {
        RuntimeDiagnostic::new(syntax_code, error.to_string())
            .at(error.marker().line(), error.marker().col() + 1)
    })
}

#[cfg(debug_assertions)]
struct EventReceiver<'a>(&'a mut dyn yaml_rust2::parser::MarkedEventReceiver);
#[cfg(debug_assertions)]
impl yaml_rust2::parser::MarkedEventReceiver for EventReceiver<'_> {
    #[inline]
    fn on_event(&mut self, event: yaml_rust2::parser::Event, mark: yaml_rust2::scanner::Marker) {
        self.0.on_event(event, mark);
    }
}

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
    pub fn new_text(text: impl Into<String>, position: crate::Position) -> Self {
        Self {
            annotation: None,
            text: text.into(),
            plain: false,
            position,
        }
    }
    pub fn lexical_text(&self) -> &str {
        &self.text
    }

    pub fn annotation(&self) -> Option<&str> {
        self.annotation.as_deref()
    }
    pub fn is_empty(&self) -> bool {
        self.text.is_empty()
    }
    pub fn is_null(&self) -> bool {
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
pub fn visit_scalar_or_mapping_events(
    source: impl Source,
    mut consume: impl FnMut(ScalarOrMappingEntry) -> Result<()>,
) -> Result<()> {
    let mut state = ScalarOrMapping::default();
    marked_scalar::visit(source, |node, position| {
        if let Some(entry) = state.consume(node, position)? {
            consume(entry).map_err(|error| position.apply(&[], error))?;
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

/// A generated collection may shorten one item only when its rendered form is
/// a scalar. The writer already quotes ambiguous textual values.
pub fn inline_scalar_rendering(rendered: &str) -> Option<&str> {
    let value = rendered.trim_end_matches('\n');
    if value.is_empty()
        || value.contains('\n')
        || value.starts_with(['{', '['])
        || value.starts_with("- ")
        || (!value.starts_with(['\'', '"']) && value.contains(": "))
    {
        None
    } else {
        Some(value)
    }
}

/// Append a structured value after a mapping key or sequence dash. A tag
/// belongs to that value's first line, while its contents are indented.
pub fn append_nested_value(output: &mut String, rendered: &str, child_indent: &str) {
    let rendered = rendered.trim_end_matches('\n');
    if let Some((tag, body)) = rendered.split_once('\n')
        && tag.starts_with('!')
        && !tag.contains(char::is_whitespace)
    {
        output.push(' ');
        output.push_str(tag);
        output.push('\n');
        Indented::new(output, child_indent).push_str(body);
    } else {
        output.push('\n');
        Indented::new(output, child_indent).push_str(rendered);
    }
}

/// Move a tag emitted on the first indented line next to its mapping key.
/// Ordinary values only scan their first line and stay in the output buffer.
pub fn lift_nested_tag(output: &mut String, key_end: usize, content_start: usize) {
    let Some(line_end) = output[content_start..].find('\n') else {
        return;
    };
    let first_line = output[content_start..content_start + line_end].trim();
    if !first_line.starts_with('!') || first_line.contains(char::is_whitespace) {
        return;
    }
    let tag = first_line.to_owned();
    let contents = output[content_start + line_end + 1..].to_owned();
    output.truncate(key_end);
    output.push_str(": ");
    output.push_str(&tag);
    output.push('\n');
    output.push_str(&contents);
}

/// Add a declared semantic scalar tag to a generated YAML value.
pub fn tag_written_scalar(
    output: &mut String,
    start: usize,
    property_prefix: Option<&str>,
    tag_prefix: &str,
) -> Result<()> {
    let fragment = output.get(start..).ok_or_else(|| {
        RuntimeDiagnostic::new("yaml.choice-form", "Invalid generated scalar offset")
    })?;
    let indentation = fragment.len() - fragment.trim_start_matches([' ', '\t']).len();
    let fragment = &fragment[indentation..];
    let offset = if let Some(prefix) = property_prefix {
        if fragment.starts_with(prefix) {
            prefix.len()
        } else {
            // A reusable declaration can be rendered under another owner's YAML key.
            rendered_property_value_offset(fragment).ok_or_else(|| {
                RuntimeDiagnostic::new(
                    "yaml.choice-form",
                    "Tagged choice did not render a scalar property",
                )
            })?
        }
    } else {
        0
    };
    if fragment[offset..].is_empty() || fragment[offset..].contains('\n') {
        return Err(RuntimeDiagnostic::new(
            "yaml.choice-form",
            "Tagged choice did not render one scalar",
        ));
    }
    output.insert_str(start + indentation + offset, tag_prefix);
    Ok(())
}

/// Borrow a standalone tag header and its block payload without parsing YAML.
pub fn tagged_block(rendered: &str) -> Option<(&str, &str)> {
    rendered
        .split_once('\n')
        .filter(|(tag, _)| tag.starts_with('!') && !tag.chars().any(char::is_whitespace))
}

/// Add a semantic tag to a complete value without parsing or copying its contents.
/// At a property boundary the first line already contains the owner key.
pub fn tag_written_value(
    output: &mut String,
    start: usize,
    property: Option<&str>,
    tag: &str,
) -> Result<()> {
    let fragment = output.get(start..).ok_or_else(|| {
        RuntimeDiagnostic::new("yaml.choice-form", "Invalid generated value offset")
    })?;
    let leading = fragment.len() - fragment.trim_start_matches([' ', '\t', '\n', '\r']).len();
    let fragment = &fragment[leading..];
    if let Some(property) = property {
        let first = fragment.split('\n').next().unwrap_or("");
        let expected = property.trim_end();
        let end = if first.starts_with(expected) {
            expected.len()
        } else {
            // Reusable values may be rendered under a different declared owner key.
            rendered_property_value_offset(&format!("{first} "))
                .map(|offset| offset - 1)
                .ok_or_else(|| {
                    RuntimeDiagnostic::new(
                        "yaml.choice-form",
                        "Tagged value has no rendered property",
                    )
                })?
        };
        if is_preserved_value(&first[end..]) {
            return Ok(());
        }
        output.insert_str(start + leading + end, &format!(" {tag}"));
    } else {
        if is_preserved_value(fragment) {
            return Ok(());
        }
        let indentation = output[start..start + leading]
            .rsplit(['\n', '\r'])
            .next()
            .unwrap_or("");
        let prefix = format!("{tag}\n{indentation}");
        output.insert_str(start + leading, &prefix);
    }
    Ok(())
}

fn is_preserved_value(value: &str) -> bool {
    let tag = value.split_whitespace().next();
    matches!(tag, Some("!xml/raw" | "!xml/invalid"))
}

fn rendered_property_value_offset(fragment: &str) -> Option<usize> {
    let line_start = fragment.rfind('\n').map_or(0, |position| position + 1);
    let line = &fragment[line_start..];
    let indentation = line.len() - line.trim_start_matches([' ', '\t']).len();
    let property = &line[indentation..];
    let prefix = line_start + indentation;
    if property.starts_with('"') {
        let mut escaped = false;
        for (position, character) in property.char_indices().skip(1) {
            if escaped {
                escaped = false;
            } else if character == '\\' {
                escaped = true;
            } else if character == '"' {
                let end = position + character.len_utf8();
                return property[end..]
                    .starts_with(": ")
                    .then_some(prefix + end + 2);
            }
        }
        return None;
    }
    let (key, _) = property.split_once(": ")?;
    (!key.is_empty()).then_some(prefix + key.len() + 2)
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

/// An empty mapping frame initializes declared absence/defaults without parsing
/// a fabricated document. This is distinct from null and from a missing stream.
pub struct EmptyMappingSource;
impl Source for EmptyMappingSource {
    fn visit(self, mut consume: impl FnMut(Node, crate::Position) -> Result<()>) -> Result<()> {
        let position = crate::Position::default();
        consume(Node::MappingStart(None), position)?;
        consume(Node::MappingEnd, position)
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
    preserved_marked_sequence_item(source, property, index, None)
}

/// Remove only the owning collection's mark on exceptional row recovery.
/// Nested tags and XML preservation envelopes still belong to the common reader.
pub fn preserved_marked_sequence_item(
    source: &[u8],
    property: Option<&str>,
    index: usize,
    expected: Option<&str>,
) -> Result<Vec<u8>> {
    preserved_collection_item(source, property, index, expected, false)
}

/// Recover an exceptional declared item from its single-value or list spelling.
/// Ordinary streaming conversion does not call this recovery path.
pub fn preserved_singleton_item(
    source: &[u8],
    property: Option<&str>,
    index: usize,
    expected: Option<&str>,
) -> Result<Vec<u8>> {
    preserved_collection_item(source, property, index, expected, true)
}

/// Recover only the exceptional value routed to a nested streaming reader.
/// Root property names cannot identify repeated or nested collection values.
pub fn preserved_value_at(source: &[u8], position: crate::Position) -> Result<Vec<u8>> {
    document::parse_at(source, position)?.render()
}

fn preserved_collection_item(
    source: &[u8],
    property: Option<&str>,
    index: usize,
    expected: Option<&str>,
    singleton: bool,
) -> Result<Vec<u8>> {
    let value = preserved_collection_value(source, property)?;
    let mut row = match value.kind {
        document::Kind::Sequence(items) => items.into_iter().nth(index).ok_or_else(|| {
            RuntimeDiagnostic::new("yaml.collection-form", "Missing sequence item")
        })?,
        _ if singleton && index == 0 => value,
        _ => {
            return Err(RuntimeDiagnostic::new(
                "yaml.collection-form",
                "Expected a sequence",
            ));
        }
    };
    if let Some(expected) = expected {
        if row.tag.as_deref() == Some(expected) {
            row.tag = None;
        } else if !row
            .tag
            .as_deref()
            .is_some_and(|tag| tag.starts_with("!xml/"))
        {
            return Err(RuntimeDiagnostic::new(
                "yaml.item-tag",
                "Unexpected or missing item tag",
            ));
        }
    }
    row.render()
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
