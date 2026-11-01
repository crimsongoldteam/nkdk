//! Select declared mapping fields while streaming fact source documents.
use super::{Node, Source};
use crate::{Position, Result};

pub struct ProjectionSource<'a, S> {
    pub source: S,
    pub keys: &'a [(usize, &'a [&'a str])],
}
struct Mapping<'a> {
    key: bool,
    allowed: Option<&'a [&'a str]>,
}
impl<S: Source> Source for ProjectionSource<'_, S> {
    fn visit(self, mut consume: impl FnMut(Node, Position) -> Result<()>) -> Result<()> {
        let mut stack: Vec<Option<Mapping<'_>>> = Vec::new();
        let mut skipped = None;
        self.source.visit(|node, position| {
            let depth = stack.len();
            let ending = matches!(node, Node::MappingEnd | Node::SequenceEnd);
            if !ending && let Some(Some(mapping)) = stack.last_mut() {
                if mapping.key {
                    if let Node::Scalar(key, _) = &node
                        && skipped.is_none()
                        && let Some(allowed) = mapping.allowed
                    {
                        let name = key.clone().into_text()?;
                        if !allowed.contains(&name.as_str()) {
                            skipped = Some(depth);
                        }
                    }
                    mapping.key = false;
                    if skipped == Some(depth) {
                        return Ok(());
                    }
                } else {
                    mapping.key = true;
                }
            }
            let hidden = skipped.is_some();
            match &node {
                Node::MappingStart(tag) => {
                    let depth = stack.len() + 1;
                    let allowed = if hidden || tag.is_some() {
                        None
                    } else {
                        self.keys
                            .iter()
                            .find(|(level, _)| *level == depth)
                            .map(|(_, keys)| *keys)
                    };
                    stack.push(Some(Mapping { key: true, allowed }));
                }
                Node::SequenceStart(_) => stack.push(None),
                Node::MappingEnd | Node::SequenceEnd => {
                    stack.pop();
                }
                Node::Scalar(..) => (),
            }
            if skipped == Some(stack.len()) {
                skipped = None;
            }
            if !hidden {
                consume(node, position)?;
            }
            Ok(())
        })
    }
}
