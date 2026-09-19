use super::{DocumentSource, Node, Source, property::visit_property};
use crate::{Result, RuntimeDiagnostic};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub enum SequenceForm {
    #[default]
    Sequence,
    EmptyMapping,
    Shorthand,
}

pub struct SequenceValues<T> {
    pub rows: Vec<T>,
    pub form: SequenceForm,
    pub annotations: crate::annotations::Mapping,
    pub position: crate::Position,
}

impl<T> Default for SequenceValues<T> {
    fn default() -> Self {
        Self {
            rows: Vec::new(),
            form: SequenceForm::default(),
            annotations: crate::annotations::Mapping::default(),
            position: crate::Position::default(),
        }
    }
}

pub type TextSequence<const N: usize> = SequenceValues<[String; N]>;

/// Read text scalars or flat text records without constructing a YAML tree.
/// A missing property differs from a present empty sequence.
pub fn text_sequence<const N: usize>(
    source: &[u8],
    property: &str,
    keys: Option<&[&str; N]>,
    shorthand: &[(&str, &[&str])],
    accept_empty_mapping: bool,
) -> Result<Option<TextSequence<N>>> {
    text_sequence_with(
        source,
        property,
        keys,
        shorthand,
        accept_empty_mapping,
        |fields, _| Ok(fields),
    )
}

/// Convert each physical row immediately, without retaining a second collection.
pub fn text_sequence_with<const N: usize, T>(
    source: &[u8],
    property: &str,
    keys: Option<&[&str; N]>,
    shorthand: &[(&str, &[&str])],
    accept_empty_mapping: bool,
    convert: impl FnMut([String; N], crate::Position) -> Result<T>,
) -> Result<Option<SequenceValues<T>>> {
    text_sequence_events(
        DocumentSource(if source.is_empty() { b"{}" } else { source }),
        property,
        keys,
        shorthand,
        accept_empty_mapping,
        convert,
    )
}
/// Decode rows from a routed event source without a temporary document.
pub fn text_sequence_events<const N: usize, T>(
    source: impl Source,
    property: &str,
    keys: Option<&[&str; N]>,
    shorthand: &[(&str, &[&str])],
    accept_empty_mapping: bool,
    mut convert: impl FnMut([String; N], crate::Position) -> Result<T>,
) -> Result<Option<SequenceValues<T>>> {
    let mut state = SequenceReader::new(keys, shorthand, accept_empty_mapping);
    let present = visit_property(source, property, "yaml.collection-form", |node, at| {
        state.consume(node, at, &mut convert)
    })?;
    Ok(present.then_some(state.finish()?))
}

/// State of one sequence value. Owners can feed nested readers from one parser.
/// The supplied converter consumes each row immediately; no physical row list is retained.
pub struct SequenceReader<'a, const N: usize, T> {
    keys: Option<&'a [&'a str; N]>,
    shorthand: &'a [(&'a str, &'a [&'a str])],
    accept_empty_mapping: bool,
    accept_singleton: bool,
    form: SequenceForm,
    annotations: crate::annotations::Mapping,
    position: crate::Position,
    depth: usize,
    pending: Option<usize>,
    fields: [Option<String>; N],
    rows: Vec<T>,
}
impl<'a, const N: usize, T> SequenceReader<'a, N, T> {
    pub fn new(
        keys: Option<&'a [&'a str; N]>,
        shorthand: &'a [(&'a str, &'a [&'a str])],
        accept_empty_mapping: bool,
    ) -> Self {
        Self {
            keys,
            shorthand,
            accept_empty_mapping,
            accept_singleton: false,
            form: SequenceForm::Sequence,
            annotations: crate::annotations::Mapping::default(),
            position: crate::Position::default(),
            depth: 0,
            pending: None,
            fields: std::array::from_fn(|_| None),
            rows: Vec::new(),
        }
    }
    pub fn with_singleton(mut self, enabled: bool) -> Self {
        self.accept_singleton = enabled;
        self
    }
    pub fn consume(
        &mut self,
        node: Node,
        at: crate::Position,
        mut convert: impl FnMut([String; N], crate::Position) -> Result<T>,
    ) -> Result<()> {
        match node {
            Node::Scalar(value, tag) if self.depth == 0 && self.keys.is_none() && N == 1 => {
                self.annotations.read(None, tag.as_deref(), at)?;
                self.position = at;
                self.form = SequenceForm::Shorthand;
                let text = value.into_text()?;
                let values = self
                    .shorthand
                    .iter()
                    .find(|(name, _)| *name == text)
                    .map(|(_, values)| *values);
                let Some(values) = values else {
                    if !self.accept_singleton {
                        return Err(failure("Unknown sequence shorthand"));
                    }
                    let mut row = std::array::from_fn(|_| String::new());
                    row[0] = text;
                    self.rows.push(convert(row, at)?);
                    return Ok(());
                };
                for value in values.iter() {
                    let mut row = std::array::from_fn(|_| String::new());
                    row[0] = (*value).to_owned();
                    self.rows.push(convert(row, at)?);
                }
            }
            Node::MappingStart(tag) if self.depth == 0 && self.accept_empty_mapping => {
                self.annotations.read(None, tag.as_deref(), at)?;
                self.position = at;
                self.form = SequenceForm::EmptyMapping;
                self.depth = 1;
            }
            Node::MappingEnd if self.depth == 1 => self.depth = 0,
            Node::SequenceStart(tag) if self.depth == 0 => {
                self.annotations.read(None, tag.as_deref(), at)?;
                self.position = at;
                self.depth = 2;
            }
            Node::Scalar(value, None) if self.depth == 2 && self.keys.is_none() && N == 1 => {
                let mut row = std::array::from_fn(|_| String::new());
                row[0] = value.into_text()?;
                self.rows.push(convert(row, at)?);
            }
            Node::MappingStart(None) if self.depth == 2 && self.keys.is_some() => {
                self.fields = std::array::from_fn(|_| None);
                self.depth = 3;
            }
            Node::Scalar(value, None) if self.depth == 3 => {
                if let Some(index) = self.pending.take() {
                    self.fields[index] = Some(value.into_text()?);
                } else {
                    let name = value.into_text()?;
                    let index = self
                        .keys
                        .unwrap()
                        .iter()
                        .position(|key| *key == name)
                        .ok_or_else(|| failure("Unknown item field"))?;
                    if self.fields[index].is_some() {
                        return Err(failure("Repeated item field"));
                    }
                    self.pending = Some(index);
                }
            }
            Node::MappingEnd if self.depth == 3 && self.pending.is_none() => {
                if self.fields.iter().any(Option::is_none) {
                    return Err(failure("Missing item field"));
                }
                self.rows.push(convert(
                    std::array::from_fn(|index| self.fields[index].take().unwrap()),
                    at,
                )?);
                self.depth = 2;
            }
            Node::SequenceEnd if self.depth == 2 => self.depth = 0,
            _ => return Err(failure("Expected a sequence of declared items")),
        }
        Ok(())
    }
    pub fn finish(self) -> Result<SequenceValues<T>> {
        if self.depth != 0 {
            return Err(failure("Incomplete sequence"));
        }
        Ok(SequenceValues {
            rows: self.rows,
            form: self.form,
            annotations: self.annotations,
            position: self.position,
        })
    }
}

fn failure(message: &str) -> RuntimeDiagnostic {
    RuntimeDiagnostic::new("yaml.collection-form", message)
}
