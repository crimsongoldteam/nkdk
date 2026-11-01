//! Read declared sources once, and add generated documents to a private result.
use super::*;
use std::io::{Read, Write};

pub fn load_documents(
    paths: &[&[&str]],
    source_root: &Path,
    limits: nkdk_conversion_core::resources::Limits,
    max_bytes: usize,
) -> Result<Vec<(RelativePath, Vec<u8>)>> {
    let paths = paths
        .iter()
        .map(|path| RelativePath::new(*path, limits.path_bytes))
        .collect::<Result<Vec<_>>>()?;
    load_relative_documents(&paths, source_root, limits, max_bytes)
}

pub fn load_relative_documents(
    paths: &[RelativePath],
    source_root: &Path,
    limits: nkdk_conversion_core::resources::Limits,
    max_bytes: usize,
) -> Result<Vec<(RelativePath, Vec<u8>)>> {
    nkdk_conversion_core::resources::validate_document_paths(paths, limits)?;
    if paths.is_empty() {
        return Ok(Vec::new());
    }
    let Some(root) = canonical_source_root(source_root)? else {
        return Ok(Vec::new());
    };
    let mut result = Vec::new();
    let mut remaining = max_bytes;
    for path in paths {
        let relative = path.clone();
        let Some(path) = existing_path(&root, &relative)? else {
            continue;
        };
        let file = fs::File::open(path).map_err(io_error)?;
        if !file.metadata().map_err(io_error)?.is_file() {
            return Err(failure(
                "resource.source",
                "Declared source must be a regular file",
            ));
        }
        let mut bytes = Vec::new();
        file.take((remaining as u64).saturating_add(1))
            .read_to_end(&mut bytes)
            .map_err(io_error)?;
        remaining = remaining
            .checked_sub(bytes.len())
            .ok_or_else(|| failure("resource.limit", "Declared document bytes exceed limit"))?;
        result.push((relative, bytes));
    }
    Ok(result)
}

impl Snapshot {
    /// Consume the snapshot so any failed addition discards the entire unpublished group.
    pub fn with_documents(self, documents: Vec<(RelativePath, Vec<u8>)>) -> Result<Self> {
        self.with_document_refs(&documents)
    }
    pub fn with_document_refs(mut self, documents: &[(RelativePath, Vec<u8>)]) -> Result<Self> {
        for (target, bytes) in documents {
            let path = self.root.join(relative(target));
            if let Some(parent) = path.parent() {
                fs::create_dir_all(parent).map_err(io_error)?;
            }
            let mut file = fs::OpenOptions::new()
                .write(true)
                .create_new(true)
                .open(&path)
                .map_err(io_error)?;
            file.write_all(bytes).map_err(io_error)?;
            self.files.push(PreparedFile {
                path,
                target: target.clone(),
            });
        }
        Ok(self)
    }
}
