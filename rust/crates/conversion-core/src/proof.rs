use crate::{
    Result, RuntimeDiagnostic,
    xml::{self, Name, Token},
};
/// Shared code for a failed reconstruction proof.
pub const MISMATCH: &str = "xml.round-trip-mismatch";

use sha2::{Digest, Sha256};

pub fn verify(original: &[u8], restored: &[u8], scalar: impl Fn(&[Name]) -> bool) -> Result<()> {
    verify_with_attributes(original, restored, scalar, |_, _| false)
}
pub fn verify_with_attributes(
    original: &[u8],
    restored: &[u8],
    scalar: impl Fn(&[Name]) -> bool,
    qname: impl Fn(&[Name], &Name) -> bool,
) -> Result<()> {
    verify_with_qnames(original, restored, scalar, qname, |_| false)
}
pub fn verify_with_qnames(
    original: &[u8],
    restored: &[u8],
    scalar: impl Fn(&[Name]) -> bool,
    qname_attribute: impl Fn(&[Name], &Name) -> bool,
    qname_text: impl Fn(&[Name]) -> bool,
) -> Result<()> {
    verify_with_canonical_omissions(original, restored, &[], scalar, qname_attribute, qname_text)
}

/// Compare a canonical export with an XML source whose declared properties
/// are intentionally omitted. Only the source paths are ignored.
pub fn verify_with_canonical_omissions<S, A, T>(
    original: &[u8],
    restored: &[u8],
    omitted: &[&[(&str, &str)]],
    scalar: S,
    qname_attribute: A,
    qname_text: T,
) -> Result<()>
where
    S: Fn(&[Name]) -> bool,
    A: Fn(&[Name], &Name) -> bool,
    T: Fn(&[Name]) -> bool,
{
    let skip = |path: &[Name]| {
        omitted.iter().any(|route| {
            path.len() >= route.len()
                && route.iter().zip(path).all(|((namespace, local), name)| {
                    name.namespace == *namespace && name.local == *local
                })
        })
    };
    compare(
        fingerprint::<false>(
            original,
            &|path, _| scalar(path),
            &qname_attribute,
            &|path, _| qname_text(path),
            &skip,
        )?,
        fingerprint::<false>(
            restored,
            &|path, _| scalar(path),
            &qname_attribute,
            &|path, _| qname_text(path),
            &|_| false,
        )?,
    )
}

pub fn verify_with_occurrences<S, A, T>(
    original: &[u8],
    restored: &[u8],
    scalar: S,
    qname_attribute: A,
    qname_text: T,
) -> Result<()>
where
    S: Fn(&[Name], &[usize]) -> bool,
    A: Fn(&[Name], &Name) -> bool,
    T: Fn(&[Name]) -> bool,
{
    verify_with_value_qnames(
        original,
        restored,
        &[],
        scalar,
        qname_attribute,
        |path, _| qname_text(path),
    )
}
/// Classify text from the selected semantic value at each sibling occurrence.
/// Possible routes of other choice variants must not determine XML meaning.
pub fn verify_with_value_qnames(
    original: &[u8],
    restored: &[u8],
    omitted: &[&[(&str, &str)]],
    scalar: impl Fn(&[Name], &[usize]) -> bool,
    qname_attribute: impl Fn(&[Name], &Name) -> bool,
    qname_text: impl Fn(&[Name], &[usize]) -> bool,
) -> Result<()> {
    let skip = |path: &[Name]| {
        omitted
            .iter()
            .any(|route| path.len() >= route.len() && xml::matches(&path[..route.len()], route))
    };
    compare(
        fingerprint::<true>(original, &scalar, &qname_attribute, &qname_text, &skip)?,
        fingerprint::<true>(restored, &scalar, &qname_attribute, &qname_text, &|_| false)?,
    )
}

fn compare(original: [u8; 32], restored: [u8; 32]) -> Result<()> {
    if original != restored {
        return Err(RuntimeDiagnostic::new(
            "xml.round-trip-mismatch",
            "The final YAML candidate does not restore the original XML structure",
        ));
    }
    Ok(())
}
#[derive(Default)]
struct TextRun {
    hash: Sha256,
    length: u64,
    meaningful: bool,
    children: bool,
    scalar: bool,
    qname: Option<String>,
}
impl TextRun {
    fn flush(&mut self, output: &mut Sha256, keep_leaf: bool) {
        if self.length != 0 && (self.scalar || self.meaningful || keep_leaf) {
            output.update([0, b'T']);
            output.update(self.length.to_le_bytes());
            output.update(std::mem::take(&mut self.hash).finalize());
        } else {
            self.hash = Sha256::new();
        }
        self.length = 0;
        self.meaningful = false;
    }
}
fn fingerprint<const OCCURRENCES: bool>(
    source: &[u8],
    scalar: &impl Fn(&[Name], &[usize]) -> bool,
    qname: &impl Fn(&[Name], &Name) -> bool,
    qname_text: &impl Fn(&[Name], &[usize]) -> bool,
    skip: &impl Fn(&[Name]) -> bool,
) -> Result<[u8; 32]> {
    let mut hash = Sha256::new();
    let mut text_runs: Vec<TextRun> = Vec::new();
    let mut occurrences = xml::Occurrences::default();
    xml::visit_scoped(source, |path, token, scope| {
        if skip(path) {
            return Ok(());
        }
        match token {
            Token::Start(_) => {
                if OCCURRENCES {
                    occurrences.enter(path.last().expect("element name"));
                }
                if let Some(parent) = text_runs.last_mut() {
                    parent.children = true;
                    parent.qname = None;
                    // A route may be scalar for another branch of a choice.
                    // Once an element has children, indentation is structural
                    // formatting; meaningful mixed text is still retained.
                    parent.scalar = false;
                    parent.flush(&mut hash, false);
                }
                text_runs.push(TextRun {
                    scalar: scalar(path, occurrences.path()),
                    qname: qname_text(path, occurrences.path()).then(String::new),
                    ..TextRun::default()
                });
                hash.update([0, b'S']);
                let name = path.last().expect("start has a name");
                for part in [&name.namespace, &name.local] {
                    hash.update((part.len() as u64).to_le_bytes());
                    hash.update(part.as_bytes());
                }
            }
            Token::Attribute(attribute) => {
                hash.update([0, b'A']);
                for part in [&attribute.name.namespace, &attribute.name.local] {
                    hash.update((part.len() as u64).to_le_bytes());
                    hash.update(part.as_bytes());
                }
                let expanded = if (attribute.name.namespace
                    == "http://www.w3.org/2001/XMLSchema-instance"
                    && attribute.name.local == "type")
                    || qname(path, &attribute.name)
                {
                    attribute
                        .qname
                        .as_ref()
                        .map(|name| (name.namespace.as_str(), name.local.as_str()))
                        .or_else(|| scope.resolve_qname(&attribute.text).ok())
                } else {
                    None
                };
                if let Some((namespace, local)) = expanded {
                    hash.update(b"Q");
                    for part in [namespace, local] {
                        hash.update((part.len() as u64).to_le_bytes());
                        hash.update(part.as_bytes());
                    }
                } else {
                    hash.update(b"T");
                    hash.update((attribute.text.len() as u64).to_le_bytes());
                    hash.update(attribute.text.as_bytes());
                }
            }
            Token::End => {
                if OCCURRENCES {
                    occurrences.leave();
                }
                let mut run = text_runs.pop().expect("started element");
                if let Some(value) = run.qname.as_deref()
                    && let Ok((namespace, local)) = scope.resolve_qname(value)
                {
                    hash.update([0, b'Q']);
                    for part in [namespace, local] {
                        hash.update((part.len() as u64).to_le_bytes());
                        hash.update(part.as_bytes());
                    }
                } else {
                    // Invalid or mixed content must remain provable as literal XML.
                    run.flush(&mut hash, !run.children);
                }
                hash.update([0, b'E']);
            }
            Token::Text(text) => {
                if let Some(run) = text_runs.last_mut() {
                    if let Some(value) = &mut run.qname {
                        value.push_str(text);
                    }
                    run.hash.update(text.as_bytes());
                    run.length += text.len() as u64;
                    run.meaningful |= !xml::is_whitespace(text);
                } else if !xml::is_whitespace(text) {
                    return Err(RuntimeDiagnostic::new(
                        "xml.outside-root",
                        "Text outside the XML root",
                    ));
                }
            }
        }
        Ok(())
    })?;
    Ok(hash.finalize().into())
}

#[cfg(test)]
mod canonical_tests {
    use super::*;

    #[test]
    fn omitted_property_does_not_hide_changes_to_siblings() {
        let original = b"<Root><Defaulted>value</Defaulted><Name>One</Name></Root>";
        let omitted = &[&[("", "Root"), ("", "Defaulted")][..]];
        let verify = |restored: &[u8]| {
            let plain = verify_with_canonical_omissions(
                original,
                restored,
                omitted,
                |_| true,
                |_, _| false,
                |_| false,
            );
            let scoped = verify_with_value_qnames(
                original,
                restored,
                omitted,
                |_, _| true,
                |_, _| false,
                |_, _| false,
            );
            assert_eq!(plain.is_ok(), scoped.is_ok());
            scoped
        };
        verify(b"<Root><Name>One</Name></Root>").unwrap();
        assert!(verify(b"<Root><Name>Two</Name></Root>").is_err());
    }
}
