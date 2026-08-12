use std::collections::HashSet;

use napi::bindgen_prelude::Uint8Array;
use napi::{Error, Result};
use napi_derive::napi;

use crate::buffers::ProjectStateSections;
use crate::diagnostic_batch::{DiagnosticBatchWriter, DiagnosticRecord};
use crate::format::{FactTableRange, SnapshotLayout};

const VALIDATION_STATUS_KIND: u16 = 1;
const VALIDATION_STATUS_BYTES: usize = 24;
const DIAGNOSTIC_RECORD_BYTES: usize = 24;

#[napi(object)]
pub struct DependencyValidationPageInput {
    pub project_dir: String,
    pub cursor: u32,
    pub batch_size: u32,
}

#[napi(object)]
pub struct NativeDependencyValidationStats {
    pub files_visited: u32,
    pub checks_visited: u32,
    pub native_diagnostics: u32,
    pub deferred_checks: u32,
    pub native_temporary_bytes: u32,
}

#[napi(object)]
pub struct NativeDependencyValidationPage {
    pub diagnostics: Uint8Array,
    pub deferred: Uint8Array,
    pub next_cursor: Option<u32>,
    pub stats: NativeDependencyValidationStats,
}

pub fn validate_page(
    sections: &ProjectStateSections,
    layout: &SnapshotLayout,
    input: DependencyValidationPageInput,
) -> Result<NativeDependencyValidationPage> {
    if input.batch_size == 0 {
        return Err(Error::from_reason("batchSize должен быть положительным"));
    }
    if input.cursor != 0 {
        return Err(Error::from_reason("Курсор страницы проверки вне диапазона"));
    }

    let readiness = readiness(sections, layout)?;
    let mut writer = DiagnosticBatchWriter::default();
    if input.cursor == 0 {
        for component_path in &readiness.blocked_component_paths {
            let file_path = join_project_path(
                &input.project_dir,
                &format!("{component_path}/Конфигурация.yaml"),
            );
            writer.push(DiagnosticRecord {
                file_path: &file_path,
                line: 1,
                col: 1,
                message: "Семантическая валидация расширения невозможна из-за ошибок базовой конфигурации",
                path: None,
                severity: 1,
                source: 4,
                code: None,
                value: None,
            })?;
        }
        if !readiness.has_configuration {
            let file_path = join_project_path(&input.project_dir, "cf/Конфигурация.yaml");
            writer.push(DiagnosticRecord {
                file_path: &file_path,
                line: 1,
                col: 1,
                message: "Базовая конфигурация cf не найдена",
                path: None,
                severity: 1,
                source: 2,
                code: None,
                value: None,
            })?;
        }
    }
    let native_diagnostics =
        readiness.blocked_component_paths.len() + usize::from(!readiness.has_configuration);
    let diagnostics = writer.finish()?;
    let temporary_bytes = diagnostics.len();
    Ok(NativeDependencyValidationPage {
        diagnostics: diagnostics.into(),
        deferred: Vec::<u8>::new().into(),
        next_cursor: None,
        stats: NativeDependencyValidationStats {
            files_visited: u32_len(layout.file_count)?,
            checks_visited: 0,
            native_diagnostics: u32_len(native_diagnostics)?,
            deferred_checks: 0,
            native_temporary_bytes: u32_len(temporary_bytes)?,
        },
    })
}

struct Readiness {
    has_configuration: bool,
    blocked_component_paths: Vec<String>,
}

fn readiness(sections: &ProjectStateSections, layout: &SnapshotLayout) -> Result<Readiness> {
    let facts = sections.facts.as_ref();
    let statuses = layout.fact_table(facts, VALIDATION_STATUS_KIND)?;
    if let Some(range) = statuses
        && range.record_bytes != VALIDATION_STATUS_BYTES
    {
        return Err(Error::from_reason(
            "Неверный размер записи validationStatus",
        ));
    }
    let mut component_paths = Vec::new();
    let mut seen_components = HashSet::new();
    let mut has_configuration = false;
    let mut has_configuration_root = false;
    let mut configuration_files_ready = true;
    for file_id in 0..layout.file_count {
        let component_path = layout.file_component_path(sections, file_id)?;
        if seen_components.insert(component_path.to_owned()) {
            component_paths.push(component_path.to_owned());
        }
        if component_path != "cf" {
            continue;
        }
        has_configuration = true;
        if layout.file_project_path(sections, file_id)? == "cf/Конфигурация.yaml" {
            has_configuration_root = true;
        }
        if let Some((contributed_facts, schema_ready)) =
            validation_status(sections, statuses, file_id)?
            && (!contributed_facts || !schema_ready)
        {
            configuration_files_ready = false;
        }
    }
    let configuration_ready =
        has_configuration && has_configuration_root && configuration_files_ready;
    let blocked_component_paths = if configuration_ready {
        Vec::new()
    } else {
        component_paths
            .into_iter()
            .filter(|path| path.starts_with("cfe/") && path.len() > 4)
            .collect()
    };
    Ok(Readiness {
        has_configuration,
        blocked_component_paths,
    })
}

fn validation_status(
    sections: &ProjectStateSections,
    range: Option<FactTableRange>,
    file_id: usize,
) -> Result<Option<(bool, bool)>> {
    let Some(range) = range else {
        return Ok(None);
    };
    let facts = sections.facts.as_ref();
    for row_id in 0..range.records {
        let row = range.offset + row_id * range.record_bytes;
        if usize_from_u32(read_u32(facts, row)?)? != file_id {
            continue;
        }
        let contributed_facts = read_u8(facts, row + 4)? == 1;
        let schema_start = usize_from_u32(read_u32(facts, row + 16)?)?;
        let schema_count = usize_from_u32(read_u32(facts, row + 20)?)?;
        let schema_ready =
            schema_diagnostics_ready(sections.diagnostics.as_ref(), schema_start, schema_count)?;
        return Ok(Some((contributed_facts, schema_ready)));
    }
    Ok(None)
}

fn schema_diagnostics_ready(bytes: &[u8], start: usize, count: usize) -> Result<bool> {
    if bytes.len() < 8 {
        return Err(Error::from_reason("Раздел диагностик оборван"));
    }
    let records_offset = usize_from_u32(read_u32(bytes, 4)?)?;
    for index in start..start.checked_add(count).ok_or_else(overflow)? {
        let record = records_offset
            .checked_add(
                index
                    .checked_mul(DIAGNOSTIC_RECORD_BYTES)
                    .ok_or_else(overflow)?,
            )
            .ok_or_else(overflow)?;
        if read_u8(bytes, record + 20)? == 1 {
            return Ok(false);
        }
    }
    Ok(true)
}

fn join_project_path(project_dir: &str, project_path: &str) -> String {
    if project_dir.is_empty() {
        return project_path.to_owned();
    }
    format!("{}/{project_path}", project_dir.trim_end_matches('/'))
}

fn read_u8(bytes: &[u8], offset: usize) -> Result<u8> {
    bytes
        .get(offset)
        .copied()
        .ok_or_else(|| Error::from_reason("Двоичный снимок оборван"))
}

fn read_u32(bytes: &[u8], offset: usize) -> Result<u32> {
    let value = bytes
        .get(offset..offset + 4)
        .ok_or_else(|| Error::from_reason("Двоичный снимок оборван"))?;
    Ok(u32::from_le_bytes([value[0], value[1], value[2], value[3]]))
}

fn usize_from_u32(value: u32) -> Result<usize> {
    usize::try_from(value).map_err(|_| Error::from_reason("Размер не помещается в usize"))
}

fn u32_len(value: usize) -> Result<u32> {
    u32::try_from(value).map_err(|_| Error::from_reason("Размер не помещается в u32"))
}

fn overflow() -> Error {
    Error::from_reason("Переполнение диапазона проверки зависимостей")
}
