//! Enumerate only ordinary immediate files; policy comes from the caller.
use super::*;
use nkdk_conversion_core::resources::Limits;

#[derive(Clone, Copy)]
pub enum FileNameMode {
    Stem,
    FileName,
}

pub fn file_names(
    root: &Path,
    directory: &RelativePath,
    extensions: &[String],
    mode: FileNameMode,
    case_sensitive: bool,
    limits: Limits,
) -> Result<Vec<String>> {
    discover_names(root, directory, limits, |item| {
        if !item.file_type().map_err(io_error)?.is_file() {
            return Ok(None);
        }
        let path = item.path();
        let allowed = path
            .extension()
            .and_then(|value| value.to_str())
            .is_some_and(|extension| {
                extensions.iter().any(|allowed| {
                    if case_sensitive {
                        allowed == extension
                    } else {
                        allowed.eq_ignore_ascii_case(extension)
                    }
                })
            });
        if !allowed {
            return Ok(None);
        }
        let name = match mode {
            FileNameMode::Stem => path.file_stem(),
            FileNameMode::FileName => path.file_name(),
        }
        .and_then(|value| value.to_str())
        .ok_or_else(|| failure("resource.name", "Resource name is not UTF-8"))?;
        Ok(Some(name.to_owned()))
    })
}

/// Enumerate ordinary immediate directories containing a declared ordinary file.
pub fn directory_names(
    root: &Path,
    directory: &RelativePath,
    entry_file: &str,
    limits: Limits,
) -> Result<Vec<String>> {
    RelativePath::new([entry_file], limits.path_bytes)?;
    discover_names(root, directory, limits, |item| {
        if !item.file_type().map_err(io_error)?.is_dir() {
            return Ok(None);
        }
        let leaf = match fs::symlink_metadata(item.path().join(entry_file)) {
            Ok(metadata) => metadata.is_file(),
            Err(error) if error.kind() == std::io::ErrorKind::NotFound => false,
            Err(error) => return Err(io_error(error)),
        };
        if !leaf {
            return Ok(None);
        }
        let name = item
            .file_name()
            .into_string()
            .map_err(|_| failure("resource.name", "Resource name is not UTF-8"))?;
        Ok(Some(name))
    })
}

fn discover_names(
    root: &Path,
    directory: &RelativePath,
    limits: Limits,
    mut select: impl FnMut(&fs::DirEntry) -> Result<Option<String>>,
) -> Result<Vec<String>> {
    let Some(root) = canonical_source_root(root)? else {
        return Ok(Vec::new());
    };
    let Some(directory) = existing_path(&root, directory)? else {
        return Ok(Vec::new());
    };
    let mut names = Vec::new();
    let mut bytes = 0usize;
    for item in fs::read_dir(directory).map_err(io_error)? {
        let item = item.map_err(io_error)?;
        let Some(name) = select(&item)? else {
            continue;
        };
        bytes = bytes
            .checked_add(name.len())
            .filter(|bytes| *bytes <= limits.path_bytes)
            .ok_or_else(|| failure("resource.limit", "Resource names exceed the byte limit"))?;
        if names.len() >= limits.routes {
            return Err(failure(
                "resource.limit",
                "Resource names exceed the route limit",
            ));
        }
        names.push(name);
    }
    names.sort();
    Ok(names)
}
