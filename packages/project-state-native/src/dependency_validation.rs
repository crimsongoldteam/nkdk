use std::collections::HashSet;

use napi::bindgen_prelude::Uint8Array;
use napi::{Error, Result};
use napi_derive::napi;

use crate::buffers::ProjectStateSections;
use crate::diagnostic_batch::{DiagnosticBatchWriter, DiagnosticRecord};
use crate::format::{FactTableRange, SnapshotLayout};

const VALIDATION_STATUS_KIND: u16 = 1;
const PENDING_REFERENCE_KIND: u16 = 4;
const PENDING_CHECK_KIND: u16 = 15;
const STRUCTURED_DOCUMENT_KIND: u16 = 23;
const VALIDATION_STATUS_BYTES: usize = 24;
const PENDING_REFERENCE_BYTES: usize = 36;
const PENDING_CHECK_BYTES: usize = 60;
const STRUCTURED_DOCUMENT_BYTES: usize = 36;
const DIAGNOSTIC_RECORD_BYTES: usize = 24;
const DEFERRED_MAGIC: u32 = 0x5644_4b4e;
const DEFERRED_HEADER_BYTES: usize = 20;
const DEFERRED_ROW_BYTES: usize = 12;

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
    let readiness = readiness(sections, layout)?;
    let mut writer = DiagnosticBatchWriter::default();
    if input.cursor == 0 {
        append_readiness_diagnostics(&mut writer, &input.project_dir, &readiness)?;
    }
    let native_diagnostics = if input.cursor == 0 {
        readiness.blocked_component_paths.len() + usize::from(!readiness.has_configuration)
    } else {
        0
    };
    let diagnostics = writer.finish()?;
    let page = deferred_page(
        sections,
        layout,
        &readiness.blocked_component_paths,
        usize_from_u32(input.cursor)?,
        usize_from_u32(input.batch_size)?,
    )?;
    let deferred = encode_deferred(&page.rows)?;
    let next_cursor = if page.has_more {
        Some(
            input
                .cursor
                .checked_add(u32_len(page.rows.len())?)
                .ok_or_else(overflow)?,
        )
    } else {
        None
    };
    let temporary_bytes = diagnostics
        .len()
        .checked_add(deferred.len())
        .ok_or_else(overflow)?;
    Ok(NativeDependencyValidationPage {
        diagnostics: diagnostics.into(),
        deferred: deferred.into(),
        next_cursor,
        stats: NativeDependencyValidationStats {
            files_visited: u32_len(layout.file_count)?,
            checks_visited: u32_len(page.rows.len())?,
            native_diagnostics: u32_len(native_diagnostics)?,
            deferred_checks: u32_len(page.rows.len())?,
            native_temporary_bytes: u32_len(temporary_bytes)?,
        },
    })
}

struct Readiness {
    has_configuration: bool,
    blocked_component_paths: Vec<String>,
}

fn append_readiness_diagnostics(
    writer: &mut DiagnosticBatchWriter,
    project_dir: &str,
    readiness: &Readiness,
) -> Result<()> {
    for component_path in &readiness.blocked_component_paths {
        let file_path =
            join_project_path(project_dir, &format!("{component_path}/Конфигурация.yaml"));
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
        let file_path = join_project_path(project_dir, "cf/Конфигурация.yaml");
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
    Ok(())
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

#[derive(Clone, Copy)]
struct DeferredRow {
    kind: u16,
    file_id: usize,
    row_id: usize,
}

struct DeferredPage {
    rows: Vec<DeferredRow>,
    has_more: bool,
}

struct DeferredTable {
    protocol_kind: u16,
    range: FactTableRange,
    next_row: usize,
    previous_file_id: Option<usize>,
}

fn deferred_page(
    sections: &ProjectStateSections,
    layout: &SnapshotLayout,
    blocked_component_paths: &[String],
    cursor: usize,
    batch_size: usize,
) -> Result<DeferredPage> {
    let facts = sections.facts.as_ref();
    let mut tables = Vec::new();
    for (fact_kind, protocol_kind, record_bytes) in [
        (PENDING_REFERENCE_KIND, 1, PENDING_REFERENCE_BYTES),
        (PENDING_CHECK_KIND, 2, PENDING_CHECK_BYTES),
        (STRUCTURED_DOCUMENT_KIND, 3, STRUCTURED_DOCUMENT_BYTES),
    ] {
        let Some(range) = layout.fact_table(facts, fact_kind)? else {
            continue;
        };
        if range.record_bytes != record_bytes {
            return Err(Error::from_reason(
                "Неверный размер записи отложенной проверки",
            ));
        }
        tables.push(DeferredTable {
            protocol_kind,
            range,
            next_row: 0,
            previous_file_id: None,
        });
    }
    let blocked: HashSet<&str> = blocked_component_paths.iter().map(String::as_str).collect();
    let mut blocked_files = Vec::with_capacity(layout.file_count);
    for file_id in 0..layout.file_count {
        blocked_files.push(blocked.contains(layout.file_component_path(sections, file_id)?));
    }

    let mut eligible = 0usize;
    let mut rows = Vec::with_capacity(batch_size.min(2_000));
    let mut has_more = false;
    loop {
        let mut selected: Option<(usize, usize, u16)> = None;
        for (table_index, table) in tables.iter().enumerate() {
            if table.next_row >= table.range.records {
                continue;
            }
            let offset = table.range.offset + table.next_row * table.range.record_bytes;
            let file_id = usize_from_u32(read_u32(facts, offset)?)?;
            if file_id >= layout.file_count {
                return Err(Error::from_reason(
                    "Отложенная проверка ссылается на неизвестный файл",
                ));
            }
            let candidate = (file_id, table_index, table.protocol_kind);
            if selected
                .map(|current| (candidate.0, candidate.2) < (current.0, current.2))
                .unwrap_or(true)
            {
                selected = Some(candidate);
            }
        }
        let Some((file_id, table_index, protocol_kind)) = selected else {
            break;
        };
        let table = &mut tables[table_index];
        if table
            .previous_file_id
            .is_some_and(|previous| file_id < previous)
        {
            return Err(Error::from_reason(
                "Таблица отложенных проверок не отсортирована по файлу",
            ));
        }
        table.previous_file_id = Some(file_id);
        let row_id = table.next_row;
        table.next_row += 1;
        if blocked_files[file_id] {
            continue;
        }
        if eligible < cursor {
            eligible += 1;
            continue;
        }
        if rows.len() == batch_size {
            has_more = true;
            break;
        }
        rows.push(DeferredRow {
            kind: protocol_kind,
            file_id,
            row_id,
        });
        eligible += 1;
    }
    if eligible < cursor {
        return Err(Error::from_reason("Курсор страницы проверки вне диапазона"));
    }
    Ok(DeferredPage { rows, has_more })
}

fn encode_deferred(rows: &[DeferredRow]) -> Result<Vec<u8>> {
    let rows_bytes = rows
        .len()
        .checked_mul(DEFERRED_ROW_BYTES)
        .ok_or_else(overflow)?;
    let byte_length = DEFERRED_HEADER_BYTES
        .checked_add(rows_bytes)
        .ok_or_else(overflow)?;
    let mut bytes = vec![0; byte_length];
    write_u32(&mut bytes, 0, DEFERRED_MAGIC)?;
    write_u16(&mut bytes, 4, 1)?;
    write_u16(&mut bytes, 6, 0)?;
    write_u32(&mut bytes, 8, u32_len(rows.len())?)?;
    write_u32(&mut bytes, 12, u32_len(DEFERRED_HEADER_BYTES)?)?;
    write_u32(&mut bytes, 16, u32_len(byte_length)?)?;
    for (index, row) in rows.iter().enumerate() {
        let offset = DEFERRED_HEADER_BYTES + index * DEFERRED_ROW_BYTES;
        write_u16(&mut bytes, offset, row.kind)?;
        write_u16(&mut bytes, offset + 2, 0)?;
        write_u32(&mut bytes, offset + 4, u32_len(row.file_id)?)?;
        write_u32(&mut bytes, offset + 8, u32_len(row.row_id)?)?;
    }
    Ok(bytes)
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

fn write_u16(bytes: &mut [u8], offset: usize, value: u16) -> Result<()> {
    let output = bytes
        .get_mut(offset..offset + 2)
        .ok_or_else(|| Error::from_reason("Deferred validation response оборван"))?;
    output.copy_from_slice(&value.to_le_bytes());
    Ok(())
}

fn write_u32(bytes: &mut [u8], offset: usize, value: u32) -> Result<()> {
    let output = bytes
        .get_mut(offset..offset + 4)
        .ok_or_else(|| Error::from_reason("Deferred validation response оборван"))?;
    output.copy_from_slice(&value.to_le_bytes());
    Ok(())
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
