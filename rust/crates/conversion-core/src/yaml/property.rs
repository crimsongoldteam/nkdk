use super::{Node, Source};
use crate::{Result, RuntimeDiagnostic};

/// Add the discriminator of a selected mapping to an already rendered value.
/// The child declaration remains responsible for all of its own fields.
pub fn insert_mapping_literal(
    output: &mut String,
    start: usize,
    indent: &str,
    property: Option<&str>,
    key: &str,
    value: &str,
) -> Result<()> {
    let position = if let Some(property) = property {
        let header = format!("{indent}{}:\n", super::mapping_key(property));
        if !output[start..].starts_with(&header) {
            return Err(RuntimeDiagnostic::new(
                "yaml.choice-form",
                "Selected value did not write its declared mapping property",
            ));
        }
        start + header.len()
    } else {
        start
    };
    let inner = if property.is_some() {
        format!("{indent}  ")
    } else {
        indent.to_owned()
    };
    output.insert_str(
        position,
        &format!(
            "{inner}{}: {}\n",
            super::mapping_key(key),
            super::scalar(value)
        ),
    );
    Ok(())
}

/// Stream the value of one declared property, rejecting extra or repeated keys.
pub(super) fn visit_property(
    source: impl Source,
    property: &str,
    code: &str,
    mut consume: impl FnMut(Node, crate::Position) -> Result<()>,
) -> Result<bool> {
    let mut state = PropertyReader::default();
    source.visit(|node, position| {
        if let Some(node) = state.consume(node, property, code)? {
            consume(node, position)?;
        }
        Ok(())
    })?;
    state.finish(code)
}

/// State of one property envelope. Only payload nodes leave this reader.
#[derive(Default)]
pub struct PropertyReader {
    depth: usize,
    root: bool,
    selected: bool,
    present: bool,
}
impl PropertyReader {
    pub fn consume(&mut self, node: Node, property: &str, code: &str) -> Result<Option<Node>> {
        let failure = || RuntimeDiagnostic::new(code, "Expected one declared property mapping");
        if self.depth == 0 {
            if self.root || !matches!(node, Node::MappingStart(None)) {
                return Err(failure());
            }
            self.root = true;
            self.depth = 1;
            return Ok(None);
        }
        if self.depth == 1 {
            if matches!(node, Node::MappingEnd) && self.selected == self.present {
                self.depth = 0;
                return Ok(None);
            }
            if !self.selected {
                let Node::Scalar(key, None) = node else {
                    return Err(failure());
                };
                if key.annotation().is_some() || key.into_text()? != property {
                    return Err(failure());
                }
                self.selected = true;
                return Ok(None);
            }
            if self.present {
                return Err(failure());
            }
            self.present = true;
        }
        node.advance_depth(&mut self.depth)?;
        Ok(Some(node))
    }
    pub fn finish(self, code: &str) -> Result<bool> {
        if self.depth != 0 {
            return Err(RuntimeDiagnostic::new(
                code,
                "Expected one declared property mapping",
            ));
        }
        Ok(self.present)
    }
}
