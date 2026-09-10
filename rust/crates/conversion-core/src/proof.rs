use crate::{
    Result, RuntimeDiagnostic,
    xml::{self, Name, Token},
};
use sha2::{Digest, Sha256};

pub fn verify(original: &[u8], restored: &[u8], scalar: impl Fn(&[Name]) -> bool) -> Result<()> {
    if fingerprint(original, &scalar)? != fingerprint(restored, &scalar)? {
        return Err(RuntimeDiagnostic::new(
            "xml.round-trip-mismatch",
            "The final YAML candidate does not restore the original XML structure",
        ));
    }
    Ok(())
}
fn fingerprint(source: &[u8], scalar: &impl Fn(&[Name]) -> bool) -> Result<[u8; 32]> {
    let mut hash = Sha256::new();
    xml::visit(source, |path, token| {
        match token {
            Token::Start(_) => {
                hash.update([0, b'S']);
                let name = path.last().expect("start has a name");
                for part in [&name.namespace, &name.local] {
                    hash.update((part.len() as u64).to_le_bytes());
                    hash.update(part.as_bytes());
                }
            }
            Token::End => hash.update([0, b'E']),
            Token::Text(text) if scalar(path) || !xml::is_whitespace(text) => {
                hash.update(text.as_bytes())
            }
            Token::Text(_) => {}
        }
        Ok(())
    })?;
    Ok(hash.finalize().into())
}
