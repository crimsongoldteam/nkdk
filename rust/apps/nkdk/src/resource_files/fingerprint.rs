//! Optional bounded content facts. Metadata policy belongs to declarations.
use super::*;
use sha2::{Digest, Sha256};
use std::io::Read;

pub struct Fingerprint {
    pub digest: String,
    pub bytes: usize,
}

pub fn file_fingerprint(
    root: &Path,
    path: &RelativePath,
    max_bytes: usize,
) -> Result<Option<Fingerprint>> {
    let Some(path) = existing_file(root, path)? else {
        return Ok(None);
    };
    let mut file = fs::File::open(path).map_err(io_error)?;
    if file.metadata().map_err(io_error)?.len() > max_bytes as u64 {
        return Err(failure(
            "resource.limit",
            "Resource fingerprint bytes exceed limit",
        ));
    }
    let mut digest = Sha256::new();
    let mut buffer = [0u8; 64 * 1024];
    let mut bytes = 0usize;
    loop {
        let size = match file.read(&mut buffer) {
            Ok(size) => size,
            Err(error) if error.kind() == std::io::ErrorKind::Interrupted => continue,
            Err(error) => return Err(io_error(error)),
        };
        if size == 0 {
            break;
        }
        bytes = bytes
            .checked_add(size)
            .filter(|bytes| *bytes <= max_bytes)
            .ok_or_else(|| failure("resource.limit", "Resource fingerprint bytes exceed limit"))?;
        digest.update(&buffer[..size]);
    }
    Ok(Some(Fingerprint {
        digest: format!("{:x}", digest.finalize()),
        bytes,
    }))
}
