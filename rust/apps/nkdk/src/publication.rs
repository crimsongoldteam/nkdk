use std::{
    fs::{self, OpenOptions},
    io::Write,
    path::{Path, PathBuf},
};
struct Staging(PathBuf);
impl Drop for Staging {
    fn drop(&mut self) {
        let _ = fs::remove_file(&self.0);
    }
}
fn staging(output: &Path) -> Result<Staging, String> {
    let parent = output
        .parent()
        .filter(|path| !path.as_os_str().is_empty())
        .unwrap_or(Path::new("."));
    let mut name = output
        .file_name()
        .ok_or("Output must name a file")?
        .to_os_string();
    name.push(format!(
        ".nkdk-{}-{}.tmp",
        std::process::id(),
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map_err(|e| e.to_string())?
            .as_nanos()
    ));
    Ok(Staging(parent.join(name)))
}
pub fn publish(output: &Path, bytes: &[u8]) -> Result<(), String> {
    let staging = staging(output)?;
    let mut file = OpenOptions::new()
        .write(true)
        .create_new(true)
        .open(&staging.0)
        .map_err(|e| e.to_string())?;
    file.write_all(bytes).map_err(|e| e.to_string())?;
    drop(file);
    fs::rename(&staging.0, output).map_err(|e| e.to_string())?;
    Ok(())
}

pub fn publish_file(output: &Path, source: &Path) -> Result<(), String> {
    let staging = staging(output)?;
    fs::copy(source, &staging.0).map_err(|error| error.to_string())?;
    fs::rename(&staging.0, output).map_err(|error| error.to_string())?;
    Ok(())
}
