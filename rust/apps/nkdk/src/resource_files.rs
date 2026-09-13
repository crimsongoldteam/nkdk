//! Materialize a resource request in a private snapshot. Publication belongs to
//! the enclosing project operation, after all conversions have succeeded.
mod documents;
mod selection;
pub use documents::load_documents;
use nkdk_conversion_core::{
    Direction, Result, RuntimeDiagnostic, Severity,
    resources::{Plan, RelativePath},
};
use std::{
    collections::{BTreeMap, BTreeSet},
    fs,
    path::{Path, PathBuf},
    sync::atomic::{AtomicU64, Ordering},
};

#[derive(Debug)]
pub struct PreparedFile {
    path: PathBuf,
    target: RelativePath,
}
impl PreparedFile {
    pub fn path(&self) -> &Path {
        &self.path
    }
    pub fn target(&self) -> &RelativePath {
        &self.target
    }
}
#[derive(Debug)]
pub struct Snapshot {
    root: PathBuf,
    files: Vec<PreparedFile>,
    diagnostics: Vec<RuntimeDiagnostic>,
}
impl Snapshot {
    fn empty(parent: &Path) -> Result<Self> {
        Ok(Self {
            root: create_private_directory(parent)?,
            files: Vec::new(),
            diagnostics: Vec::new(),
        })
    }

    pub fn root(&self) -> &Path {
        &self.root
    }
    pub fn files(&self) -> &[PreparedFile] {
        &self.files
    }
    /// Select direct filenames from the prepared snapshot without another directory walk.
    /// Returned stems borrow the bounded file inventory; ordering is UTF-8 byte order.
    pub fn file_stems(&self, directory: &RelativePath, suffix: &str) -> Vec<&str> {
        let mut names: Vec<_> = self
            .files
            .iter()
            .filter_map(|file| {
                let (name, parent) = file.target.segments().split_last()?;
                (parent == directory.segments())
                    .then(|| name.strip_suffix(suffix))
                    .flatten()
            })
            .collect();
        names.sort_unstable();
        names
    }

    pub fn diagnostics(&self) -> &[RuntimeDiagnostic] {
        &self.diagnostics
    }
}
impl Drop for Snapshot {
    fn drop(&mut self) {
        let _ = fs::remove_dir_all(&self.root);
    }
}

pub fn stage(
    plan: &Plan,
    direction: Direction,
    source_root: &Path,
    temporary_parent: &Path,
) -> Result<Snapshot> {
    let source_root = match fs::canonicalize(source_root) {
        Ok(root) => root,
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => {
            return Snapshot::empty(temporary_parent);
        }
        Err(error) => return Err(io_error(error)),
    };
    if !source_root.is_dir() {
        return Err(failure(
            "resource.source",
            "Resource source must be a directory",
        ));
    }
    let selected = selection::select(plan, direction, &source_root)?;
    let mut snapshot = Snapshot::empty(temporary_parent)?;
    snapshot.diagnostics = selected.diagnostics;
    for directory in selected.directories {
        fs::create_dir_all(snapshot.root.join(directory)).map_err(io_error)?;
    }
    let mut copies = BTreeMap::new();
    for (source, target) in selected.files {
        let path = snapshot.root.join(relative(&target));
        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent).map_err(io_error)?;
        }
        // Reserve the destination exclusively, including filesystem-specific aliases.
        drop(
            fs::OpenOptions::new()
                .write(true)
                .create_new(true)
                .open(&path)
                .map_err(io_error)?,
        );
        let prepared_source = copies.get(&source).unwrap_or(&source);
        fs::copy(prepared_source, &path).map_err(io_error)?;
        copies.entry(source).or_insert_with(|| path.clone());
        snapshot.files.push(PreparedFile { path, target });
    }
    Ok(snapshot)
}
fn existing_path(root: &Path, path: &RelativePath) -> Result<Option<PathBuf>> {
    let mut current = root.to_path_buf();
    for segment in path.segments() {
        current.push(segment);
        // Check each existing prefix, including a symlink preceding a missing file.
        current = match fs::canonicalize(&current) {
            Ok(path) => path,
            Err(error) if error.kind() == std::io::ErrorKind::NotFound => return Ok(None),
            Err(error) => return Err(io_error(error)),
        };
        if !current.starts_with(root) {
            return Err(failure(
                "resource.escape",
                "Resource source leaves its root",
            ));
        }
    }
    Ok(Some(current))
}
fn relative(path: &RelativePath) -> PathBuf {
    path.segments().iter().collect()
}
fn create_private_directory(parent: &Path) -> Result<PathBuf> {
    static NEXT: AtomicU64 = AtomicU64::new(0);
    for _ in 0..32 {
        let path = parent.join(format!(
            "nkdk-resources-{}-{}",
            std::process::id(),
            NEXT.fetch_add(1, Ordering::Relaxed)
        ));
        let mut builder = fs::DirBuilder::new();
        #[cfg(unix)]
        {
            use std::os::unix::fs::DirBuilderExt;
            builder.mode(0o700);
        }
        match builder.create(&path) {
            Ok(()) => return Ok(path),
            Err(error) if error.kind() == std::io::ErrorKind::AlreadyExists => continue,
            Err(error) => return Err(io_error(error)),
        }
    }
    Err(failure(
        "resource.staging",
        "Could not allocate a private resource directory",
    ))
}
fn failure(code: &str, message: impl Into<String>) -> RuntimeDiagnostic {
    RuntimeDiagnostic::new(code, message)
}
fn io_error(error: std::io::Error) -> RuntimeDiagnostic {
    failure("resource.io", error.to_string())
}
