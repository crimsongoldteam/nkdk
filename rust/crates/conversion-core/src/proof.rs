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
    if fingerprint(original, &scalar, &qname)? != fingerprint(restored, &scalar, &qname)? {
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
fn fingerprint(
    source: &[u8],
    scalar: &impl Fn(&[Name]) -> bool,
    qname: &impl Fn(&[Name], &Name) -> bool,
) -> Result<[u8; 32]> {
    let mut hash = Sha256::new();
    let mut text_runs: Vec<TextRun> = Vec::new();
    xml::visit(source, |path, token| {
        match token {
            Token::Start(_) => {
                if let Some(parent) = text_runs.last_mut() {
                    parent.children = true;
                    parent.flush(&mut hash, false);
                }
                text_runs.push(TextRun {
                    scalar: scalar(path),
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
                if qname(path, &attribute.name) {
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
                let mut run = text_runs.pop().expect("started element");
                run.flush(&mut hash, !run.children);
                hash.update([0, b'E']);
            }
            Token::Text(text) => {
                if let Some(run) = text_runs.last_mut() {
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
