use std::{
    collections::BTreeSet,
    fs, io,
    path::{Path, PathBuf},
};

#[allow(dead_code)]
pub fn manifest_paths(path: &Path) -> io::Result<BTreeSet<String>> {
    Ok(fs::read_to_string(path)?
        .lines()
        .map(str::trim)
        .filter(|line| !line.is_empty() && !line.starts_with('#'))
        .map(|line| format!("declarations/{line}"))
        .collect())
}
fn collect(directory: &Path, files: &mut Vec<PathBuf>) -> io::Result<()> {
    for entry in fs::read_dir(directory)? {
        let entry = entry?;
        let kind = entry.file_type()?;
        let path = entry.path();
        if kind.is_dir() {
            collect(&path, files)?;
        } else if kind.is_file() && path.extension().is_some_and(|value| value == "yaml") {
            files.push(path);
        }
    }
    Ok(())
}
pub fn load(root: &Path, directory: &Path) -> io::Result<Vec<(String, Vec<u8>)>> {
    let mut files = vec![];
    collect(directory, &mut files)?;
    files.sort();
    if files.is_empty() {
        return Err(io::Error::new(
            io::ErrorKind::InvalidInput,
            "No YAML declarations found",
        ));
    }
    files
        .into_iter()
        .map(|path| {
            let relative = path
                .strip_prefix(root)
                .map_err(|error| io::Error::new(io::ErrorKind::InvalidInput, error))?;
            Ok((relative.to_string_lossy().into_owned(), fs::read(&path)?))
        })
        .collect()
}
