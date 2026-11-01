//! Package compatibility is determined at build time, never from input data.
use crate::{GeneratedSources, GenerationSize, SourceFile};
use sha2::{Digest, Sha256};

pub(crate) fn add_signature(generated: &mut GeneratedSources, sources: &[SourceFile<'_>]) {
    let signature = catalog_signature(sources);
    let code = format!("pub fn catalog_signature()-> &'static str {{ {signature:?} }}\n");
    generated
        .files
        .iter_mut()
        .find(|file| file.path == "generated.rs")
        .expect("generated executable catalog")
        .contents
        .extend_from_slice(code.as_bytes());
    generated.sizes.push(GenerationSize {
        entry: "<shared>".into(),
        source: String::new(),
        mechanism: "partition-signature",
        bytes: code.len(),
    });
}

pub(crate) fn catalog_signature(sources: &[SourceFile<'_>]) -> String {
    let mut sources: Vec<_> = sources.iter().collect();
    sources.sort_by(|left, right| (left.path, left.bytes).cmp(&(right.path, right.bytes)));
    let mut digest = Sha256::new();
    digest.update(b"nkdk-partition-catalog/1");
    for source in sources {
        digest.update((source.path.len() as u64).to_le_bytes());
        digest.update(source.path.as_bytes());
        digest.update((source.bytes.len() as u64).to_le_bytes());
        digest.update(source.bytes);
    }
    format!("{:x}", digest.finalize())
}
