#![allow(dead_code)] // Each integration test imports only the shared helpers it needs.

use std::{fs, path::PathBuf};

#[path = "../../../../test-support/temp.rs"]
mod temp;

pub fn repository() -> PathBuf {
    std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
        .join("../../..")
        .canonicalize()
        .unwrap()
}

pub fn temporary_directory(name: &str) -> PathBuf {
    temp::unique_directory(name)
}

pub fn corpus_manifest(repository: &std::path::Path) -> serde_json::Value {
    serde_json::from_slice(
        &fs::read(repository.join("tests/conversion-corpus/manifest.json")).unwrap(),
    )
    .unwrap()
}

pub fn corpus_case(manifest: &serde_json::Value, id: &str) -> serde_json::Value {
    manifest["cases"]
        .as_array()
        .unwrap()
        .iter()
        .find(|case| case["id"] == id)
        .unwrap()
        .clone()
}
