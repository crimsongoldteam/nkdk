use super::{Result, RuntimeDiagnostic, Scalar};
use crate::Position;
use yaml_rust2::{
    parser::{Event, MarkedEventReceiver, Parser, Tag},
    scanner::{Marker, TScalarStyle},
};

pub enum Node {
    MappingStart(Option<String>),
    MappingEnd,
    SequenceStart(Option<String>),
    SequenceEnd,
    Scalar(Scalar, Option<String>),
}
impl Node {
    /// Track value nesting for streaming adapters without retaining nodes.
    pub(super) fn advance_depth(&self, depth: &mut usize) -> Result<()> {
        match self {
            Self::MappingStart(_) | Self::SequenceStart(_) => *depth += 1,
            Self::MappingEnd | Self::SequenceEnd => {
                *depth = depth.checked_sub(1).ok_or_else(|| {
                    RuntimeDiagnostic::new("yaml.structure", "Unexpected closing node")
                })?;
            }
            Self::Scalar(..) => (),
        }
        Ok(())
    }
}
fn tag(tag: Option<Tag>) -> Option<String> {
    tag.map(|tag| tag.handle + &tag.suffix)
}
pub fn visit_nodes(source: &[u8], consume: impl FnMut(Node, Position) -> Result<()>) -> Result<()> {
    let source = std::str::from_utf8(source)
        .map_err(|error| RuntimeDiagnostic::new("yaml.encoding", error.to_string()))?;
    let mut receiver = Receiver {
        consume,
        documents: 0,
        error: None,
    };
    Parser::new_from_str(source)
        .load(&mut receiver, true)
        .map_err(|error| {
            RuntimeDiagnostic::new("yaml.syntax", error.to_string())
                .at(error.marker().line(), error.marker().col() + 1)
        })?;
    if let Some(error) = receiver.error {
        return Err(error);
    }
    if receiver.documents != 1 {
        return Err(RuntimeDiagnostic::new(
            "yaml.document",
            "Expected one YAML document",
        ));
    }
    Ok(())
}
struct Receiver<F> {
    consume: F,
    documents: usize,
    error: Option<RuntimeDiagnostic>,
}
impl<F: FnMut(Node, Position) -> Result<()>> MarkedEventReceiver for Receiver<F> {
    fn on_event(&mut self, event: Event, mark: Marker) {
        if self.error.is_some() {
            return;
        }
        let position = Position::yaml(mark.line(), mark.col() + 1);
        let node = match event {
            Event::StreamStart | Event::StreamEnd | Event::DocumentEnd => return,
            Event::DocumentStart => {
                self.documents += 1;
                if self.documents > 1 {
                    self.error = Some(
                        RuntimeDiagnostic::new(
                            "yaml.multiple-documents",
                            "Multiple documents are not accepted",
                        )
                        .at(mark.line(), mark.col() + 1),
                    );
                }
                return;
            }
            Event::MappingStart(0, annotation) => Node::MappingStart(tag(annotation)),
            Event::MappingEnd => Node::MappingEnd,
            Event::SequenceStart(0, annotation) => Node::SequenceStart(tag(annotation)),
            Event::SequenceEnd => Node::SequenceEnd,
            Event::Scalar(text, style, 0, annotation) => Node::Scalar(
                Scalar {
                    text,
                    plain: style == TScalarStyle::Plain,
                    position,
                },
                tag(annotation),
            ),
            _ => {
                self.error = Some(
                    RuntimeDiagnostic::new("yaml.alias", "Anchors and aliases are not accepted")
                        .at(mark.line(), mark.col() + 1),
                );
                return;
            }
        };
        self.error = (self.consume)(node, position)
            .err()
            .map(|error| position.apply(&[], error));
    }
}
