//! Keep a scalar's semantic tag separate from an inferred anomaly annotation.
use super::{Node, Scalar, Source};
use crate::{Position, Result, RuntimeDiagnostic};

pub(super) fn visit(
    source: impl Source,
    mut consume: impl FnMut(Node, Position) -> Result<()>,
) -> Result<()> {
    let mut mark = None;
    let mut key_seen = false;
    let mut value: Option<(Scalar, Option<String>, Position)> = None;
    source.visit(|node, position| {
        if mark.is_some() {
            match node {
                Node::Scalar(key, None) if !key_seen => {
                    if key.into_text()? != "$значение" {
                        return Err(invalid());
                    }
                    key_seen = true;
                }
                Node::Scalar(scalar, tag) if key_seen && value.is_none() => {
                    value = Some((scalar, tag, position))
                }
                Node::MappingEnd if value.is_some() => {
                    let (mut scalar, tag, position) = value.take().unwrap();
                    scalar.annotation = mark.take().map(String::into_boxed_str);
                    key_seen = false;
                    consume(Node::Scalar(scalar, tag), position)?;
                }
                _ => return Err(invalid()),
            }
        } else if let Node::MappingStart(Some(tag)) = &node
            && (tag == "!xml/invalid"
                || tag.starts_with("!xml/invalid/")
                || tag == "!xml/important"
                || tag.starts_with("!xml/important/"))
        {
            mark = Some(tag.clone());
        } else {
            consume(node, position)?;
        }
        Ok(())
    })?;
    if mark.is_some() {
        return Err(invalid());
    }
    Ok(())
}
fn invalid() -> RuntimeDiagnostic {
    RuntimeDiagnostic::new(
        "yaml.scalar-annotation",
        "A scalar annotation envelope requires exactly one $значение scalar",
    )
}

/// `value` is already encoded YAML, not unescaped user text.
pub fn append(out: &mut String, value: &str, annotation: Option<&str>, indent: &str, nested: bool) {
    if let Some(annotation) = annotation {
        out.push_str(annotation);
        if value.starts_with('!') {
            out.push('\n');
            out.push_str(indent);
            if nested {
                out.push_str("  ");
            }
            out.push_str("  $значение: ");
        } else {
            out.push(' ');
        }
    }
    out.push_str(value);
}
