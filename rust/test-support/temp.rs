use std::{fs, path::PathBuf};

pub fn unique_directory(label: &str) -> PathBuf {
    let root = std::env::temp_dir().join(format!(
        "nkdk-{label}-{}-{}",
        std::process::id(),
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_nanos()
    ));
    fs::create_dir_all(&root).unwrap();
    root
}
