use napi::bindgen_prelude::Uint8Array;
use napi::{Error, Result};
use napi_derive::napi;

use crate::buffers::ProjectStateSections;
use crate::dependency_validation::{
    DependencyValidationPageInput, DependencyValidationPlanInput, NativeDependencyValidationPage,
    NativeDependencyValidationPlan,
};
use crate::format::SnapshotLayout;
use crate::query_protocol;

#[napi(object)]
pub struct ProjectStateReaderStats {
    pub format: String,
    pub files: u32,
    pub copied_snapshot_bytes: u32,
    pub decoded_string_cache_bytes: u32,
}

#[napi]
pub struct NativeProjectStateReader {
    sections: Option<ProjectStateSections>,
    layout: SnapshotLayout,
}

#[napi]
impl NativeProjectStateReader {
    #[napi]
    pub fn stats(&self) -> Result<ProjectStateReaderStats> {
        self.require_sections()?;
        Ok(ProjectStateReaderStats {
            format: "0.5.0".to_owned(),
            files: u32::try_from(self.layout.file_count)
                .map_err(|_| Error::from_reason("Число файлов не помещается в u32"))?,
            copied_snapshot_bytes: 0,
            decoded_string_cache_bytes: 0,
        })
    }

    #[napi]
    pub fn file_paths(&self) -> Result<Vec<String>> {
        let sections = self.require_sections()?;
        let strings = sections.strings.as_ref();
        let files = sections.files.as_ref();
        (0..self.layout.file_count)
            .map(|file_id| {
                let path_id = self.layout.file_project_path_id(files, file_id)?;
                Ok(self.layout.string_value(strings, path_id)?.to_owned())
            })
            .collect()
    }

    #[napi]
    pub fn execute(&self, request: Uint8Array) -> Result<Uint8Array> {
        let sections = self.require_sections()?;
        Ok(query_protocol::execute(request.as_ref(), sections, &self.layout)?.into())
    }

    #[napi]
    pub fn validate_dependency_page(
        &self,
        input: DependencyValidationPageInput,
    ) -> Result<NativeDependencyValidationPage> {
        let sections = self.require_sections()?;
        crate::dependency_validation::validate_page(sections, &self.layout, input)
    }

    #[napi]
    pub fn plan_dependency_validation(
        &self,
        input: DependencyValidationPlanInput,
    ) -> Result<NativeDependencyValidationPlan> {
        NativeDependencyValidationPlan::open(self.require_sections()?, &self.layout, input)
    }

    #[napi]
    pub fn close(&mut self) {
        self.sections = None;
    }
}

impl NativeProjectStateReader {
    pub fn open(sections: ProjectStateSections) -> Result<Self> {
        let layout = SnapshotLayout::decode(&sections)?;
        Ok(Self {
            sections: Some(sections),
            layout,
        })
    }

    fn require_sections(&self) -> Result<&ProjectStateSections> {
        self.sections
            .as_ref()
            .ok_or_else(|| Error::from_reason("ProjectState reader закрыт"))
    }
}
