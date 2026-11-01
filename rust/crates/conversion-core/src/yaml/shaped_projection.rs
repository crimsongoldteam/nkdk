//! Select declared fields using a compiled graph, including recursive records.
use super::{Node, Source};
use crate::{Position, Result, RuntimeDiagnostic};

#[derive(Clone, Copy)]
pub enum ProjectionShape<'a> {
    Pass,
    Record(&'a [(&'a str, usize)]),
    Mapping(usize),
    Sequence(usize),
}

pub struct ShapedProjectionSource<'a, S> {
    pub source: S,
    /// Node zero is the passthrough state for annotations and opaque layouts.
    pub shapes: &'a [ProjectionShape<'a>],
    pub root: usize,
}

impl<S: Source> ShapedProjectionSource<'_, S> {
    pub fn observe_raw(self, present: &mut bool) -> impl Source {
        RawObservedSource {
            source: self,
            present,
        }
    }

    /// Only exceptional readers need a document for their nested raw fallback.
    pub fn document(self) -> Result<Vec<u8>> {
        super::document::parse_source(self)?.document()
    }
}

struct RawObservedSource<'a, S> {
    source: S,
    present: &'a mut bool,
}
impl<S: Source> Source for RawObservedSource<'_, S> {
    fn visit(self, mut consume: impl FnMut(Node, Position) -> Result<()>) -> Result<()> {
        self.source.visit(|node, position| {
            *self.present |= matches!(&node, Node::MappingStart(Some(tag)) if tag == "!xml/raw");
            consume(node, position)
        })
    }
}

struct Frame {
    shape: usize,
    key: Option<bool>,
    next: Option<usize>,
    hidden: bool,
    semantic: Option<usize>,
}

impl<S: Source> Source for ShapedProjectionSource<'_, S> {
    fn visit(self, mut consume: impl FnMut(Node, Position) -> Result<()>) -> Result<()> {
        let shape = |index| {
            self.shapes.get(index).copied().ok_or_else(|| {
                RuntimeDiagnostic::new("yaml.projection-plan", "Invalid compiled projection edge")
            })
        };
        if !matches!(shape(0)?, ProjectionShape::Pass) {
            return Err(RuntimeDiagnostic::new(
                "yaml.projection-plan",
                "Projection node zero must preserve events",
            ));
        }
        shape(self.root)?;
        let mut stack: Vec<Frame> = Vec::new();
        self.source.visit(|node, position| {
            if matches!(node, Node::MappingEnd | Node::SequenceEnd) {
                let hidden = stack.pop().is_some_and(|frame| frame.hidden);
                return if hidden {
                    Ok(())
                } else {
                    consume(node, position)
                };
            }
            let (mut selected, hidden) = if let Some(parent) = stack.last_mut() {
                if parent.key == Some(true) {
                    parent.key = Some(false);
                    parent.next = match (&node, parent.semantic) {
                        (Node::Scalar(key, _), Some(semantic))
                            if key.clone().into_text()? == "$значение" =>
                        {
                            Some(semantic)
                        }
                        _ => match (shape(parent.shape)?, &node) {
                            (ProjectionShape::Record(fields), Node::Scalar(key, _)) => {
                                let name = key.clone().into_text()?;
                                fields
                                    .iter()
                                    .find(|(key, _)| *key == name)
                                    .map(|(_, edge)| *edge)
                            }
                            (ProjectionShape::Mapping(child), _) => Some(child),
                            _ => Some(0),
                        },
                    };
                    if matches!(node, Node::Scalar(..)) {
                        return if parent.hidden || parent.next.is_none() {
                            Ok(())
                        } else {
                            consume(node, position)
                        };
                    }
                    // Complex keys remain visible so the ordinary reader rejects
                    // them; a projection never turns malformed keys into absence.
                    (0, parent.hidden)
                } else if parent.key == Some(false) {
                    parent.key = Some(true);
                    (
                        parent.next.unwrap_or(0),
                        parent.hidden || parent.next.is_none(),
                    )
                } else {
                    let child = match shape(parent.shape)? {
                        ProjectionShape::Sequence(child) => child,
                        _ => 0,
                    };
                    (child, parent.hidden)
                }
            } else {
                (self.root, false)
            };
            // Select semantic fields in raw envelopes, preserving XML evidence
            // and unknown wrapper keys for the existing strict annotation reader.
            let semantic = matches!(&node, Node::MappingStart(Some(tag)) if tag == "!xml/raw")
                .then_some(selected);
            if matches!(
                &node,
                Node::MappingStart(Some(_)) | Node::SequenceStart(Some(_))
            ) {
                selected = 0;
            }
            let selected_shape = shape(selected)?;
            match &node {
                Node::MappingStart(_) => {
                    if !matches!(
                        selected_shape,
                        ProjectionShape::Record(_) | ProjectionShape::Mapping(_)
                    ) {
                        selected = 0;
                    }
                    stack.push(Frame {
                        shape: selected,
                        key: Some(true),
                        next: Some(0),
                        hidden,
                        semantic,
                    });
                }
                Node::SequenceStart(_) => {
                    if !matches!(selected_shape, ProjectionShape::Sequence(_)) {
                        selected = 0;
                    }
                    stack.push(Frame {
                        shape: selected,
                        key: None,
                        next: None,
                        hidden,
                        semantic: None,
                    });
                }
                _ => (),
            }
            if hidden {
                Ok(())
            } else {
                consume(node, position)
            }
        })
    }
}
