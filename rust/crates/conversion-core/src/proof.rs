use crate::{
    Result, RuntimeDiagnostic,
    xml::{self, Name, Token},
};
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
    compare(
        fingerprint::<false>(
            original,
            &|path, _| scalar(path),
            &qname_attribute,
            &qname_text,
        )?,
        fingerprint::<false>(
            restored,
            &|path, _| scalar(path),
            &qname_attribute,
            &qname_text,
        )?,
    )
}

/// Supply one-based sibling occurrences for each component of the current path.
/// This separates repeated records whose corresponding fields have different shapes.
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
    compare(
        fingerprint::<true>(original, &scalar, &qname_attribute, &qname_text)?,
        fingerprint::<true>(restored, &scalar, &qname_attribute, &qname_text)?,
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
    qname_text: &impl Fn(&[Name]) -> bool,
) -> Result<[u8; 32]> {
    let mut hash = Sha256::new();
    let mut text_runs: Vec<TextRun> = Vec::new();
    let mut counts: Vec<std::collections::BTreeMap<Name, usize>> = Vec::new();
    let mut occurrences = Vec::new();
    xml::visit_scoped(source, |path, token, scope| {
        match token {
            Token::Start(_) => {
                if OCCURRENCES {
                    let index = if let Some(siblings) = counts.last_mut() {
                        let name = path.last().expect("element name");
                        if let Some(count) = siblings.get_mut(name) {
                            *count += 1;
                            *count
                        } else {
                            siblings.insert(name.clone(), 1);
                            1
                        }
                    } else {
                        1
                    };
                    occurrences.push(index);
                    counts.push(std::collections::BTreeMap::new());
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
                    scalar: scalar(path, &occurrences),
                    qname: qname_text(path).then(String::new),
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
                if (attribute.name.namespace == "http://www.w3.org/2001/XMLSchema-instance"
                    && attribute.name.local == "type")
                    || qname(path, &attribute.name)
                {
                    let name = attribute.qname.ok_or_else(|| {
                        RuntimeDiagnostic::new(
                            "xml.qname",
                            "Expected a bound QName attribute value",
                        )
                    })?;
                    hash.update(b"Q");
                    for part in [&name.namespace, &name.local] {
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
                    counts.pop();
                    occurrences.pop();
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
