//! Bounded, borrowed documents produced by a conversion and used by its proof.
use super::*;
use crate::resources::{Limits, RelativePath};
use std::collections::{BTreeMap, BTreeSet};

#[derive(Debug)]
pub struct DocumentOverlay<'a> {
    pub(super) parent: InputView<'a>,
    pub(super) documents: &'a [(RelativePath, Vec<u8>)],
}
impl<'a> DocumentOverlay<'a> {
    pub(super) fn new(
        parent: InputView<'a>,
        documents: &'a [(RelativePath, Vec<u8>)],
        limits: Limits,
        max_bytes: usize,
    ) -> Result<Self> {
        let mut retained = BTreeMap::new();
        parent.collect_documents(&mut retained);
        let mut unique = BTreeSet::new();
        for (path, bytes) in documents {
            if !unique.insert(path.segments()) {
                return Err(RuntimeDiagnostic::new(
                    "input.document-duplicate",
                    "Repeated conversion document",
                ));
            }
            retained.insert(path.segments(), bytes.as_slice());
        }
        if retained.len() > limits.routes {
            return Err(RuntimeDiagnostic::new(
                "resource.limit",
                "Document count exceeds limit",
            ));
        }
        let mut content_bytes = 0_usize;
        let mut path_bytes = 0_usize;
        for (path, bytes) in retained {
            content_bytes = content_bytes
                .checked_add(bytes.len())
                .filter(|sum| *sum <= max_bytes)
                .ok_or_else(|| {
                    RuntimeDiagnostic::new("resource.limit", "Document bytes exceed limit")
                })?;
            for segment in path {
                path_bytes = path_bytes.checked_add(segment.len()).ok_or_else(|| {
                    RuntimeDiagnostic::new("resource.limit", "Document paths exceed limit")
                })?;
            }
            path_bytes = path_bytes
                .checked_add(path.len().saturating_sub(1))
                .filter(|sum| *sum <= limits.path_bytes)
                .ok_or_else(|| {
                    RuntimeDiagnostic::new("resource.limit", "Document paths exceed limit")
                })?;
        }
        Ok(Self { parent, documents })
    }
    pub fn view(&self) -> InputView<'_> {
        self.parent.with_document_overlay(self)
    }
}

pub(super) fn find<'a>(
    documents: &'a [(RelativePath, Vec<u8>)],
    path: &[&str],
) -> Option<&'a [u8]> {
    documents
        .iter()
        .find(|(candidate, _)| {
            candidate
                .segments()
                .iter()
                .map(String::as_str)
                .eq(path.iter().copied())
        })
        .map(|(_, bytes)| bytes.as_slice())
}

pub(super) fn decode_text<'a, 'p>(
    bytes: &'a [u8],
    path: impl Iterator<Item = &'p str>,
) -> Result<&'a str> {
    std::str::from_utf8(bytes).map_err(|_| {
        let mut issue = RuntimeDiagnostic::new("resource.encoding", "Text document is not UTF-8");
        issue.path = path.map(str::to_owned).collect();
        issue.file = issue.path.join("/").into_boxed_str();
        issue
    })
}
