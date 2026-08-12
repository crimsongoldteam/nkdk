use napi::{Error, Result};

use crate::buffers::ProjectStateSections;
use crate::format::{SnapshotLayout, TargetEntry};
use crate::query_protocol::{QueryEnvelope, write_envelope, write_u32};

pub const OPERATION: u16 = 3;
const REQUEST_BYTES: usize = 16;
const RESULT_BYTES: usize = 28;
const FOUND: u32 = 1;
const AMBIGUOUS: u32 = 2;

enum Resolution {
    Missing,
    Ambiguous,
    Found(TargetEntry),
}

pub fn execute(
    request: &[u8],
    envelope: QueryEnvelope,
    sections: &ProjectStateSections,
    layout: &SnapshotLayout,
) -> Result<Vec<u8>> {
    envelope.validate_rows(request, REQUEST_BYTES)?;
    let response_length = QueryEnvelope::HEADER_BYTES
        .checked_add(
            envelope
                .request_count
                .checked_mul(RESULT_BYTES)
                .ok_or_else(|| Error::from_reason("Переполнение размера ответа target lookup"))?,
        )
        .ok_or_else(|| Error::from_reason("Переполнение размера ответа target lookup"))?;
    let mut response = vec![0; response_length];
    write_envelope(
        &mut response,
        OPERATION,
        envelope.request_count,
        QueryEnvelope::HEADER_BYTES,
        response_length,
    )?;

    for index in 0..envelope.request_count {
        let request_row = envelope.rows_offset + index * REQUEST_BYTES;
        let component_path = envelope.read_string(
            request,
            usize_from_u32(read_u32(request, request_row)?)?,
            usize_from_u32(read_u32(request, request_row + 4)?)?,
        )?;
        let canonical = envelope.read_string(
            request,
            usize_from_u32(read_u32(request, request_row + 8)?)?,
            usize_from_u32(read_u32(request, request_row + 12)?)?,
        )?;
        let response_row = QueryEnvelope::HEADER_BYTES + index * RESULT_BYTES;
        match resolve(sections, layout, component_path, canonical)? {
            Resolution::Missing => {}
            Resolution::Ambiguous => write_u32(&mut response, response_row, AMBIGUOUS)?,
            Resolution::Found(target) => {
                write_u32(&mut response, response_row, FOUND)?;
                write_u32(&mut response, response_row + 4, u32::from(target.kind))?;
                write_u32(
                    &mut response,
                    response_row + 8,
                    u32_from_usize(target.source_file_id)?,
                )?;
                write_u32(
                    &mut response,
                    response_row + 12,
                    u32_from_usize(target.canonical_id)?,
                )?;
                write_u32(
                    &mut response,
                    response_row + 16,
                    u32_from_usize(target.component_path_id)?,
                )?;
                write_u32(
                    &mut response,
                    response_row + 20,
                    u32_from_usize(target.item_project_path_id)?,
                )?;
                write_u32(
                    &mut response,
                    response_row + 24,
                    u32_from_usize(target.owner_project_path_id)?,
                )?;
            }
        }
    }
    Ok(response)
}

fn resolve(
    sections: &ProjectStateSections,
    layout: &SnapshotLayout,
    component_path: &str,
    canonical: &str,
) -> Result<Resolution> {
    let strings = sections.strings.as_ref();
    let lookups = sections.lookups.as_ref();
    let Some(range_id) = layout.find_target_range(lookups, strings, component_path, canonical)?
    else {
        return Ok(Resolution::Missing);
    };
    let (_, _, start, count) = layout.target_range(lookups, range_id)?;
    if count == 0 {
        return Ok(Resolution::Missing);
    }
    let first = layout.target_entry(lookups, start)?;
    if count > 1 {
        if first.item_project_path_id == u32::MAX as usize
            || first.owner_project_path_id == u32::MAX as usize
        {
            return Ok(Resolution::Ambiguous);
        }
        for index in 1..count {
            if !same_file_backed_target(first, layout.target_entry(lookups, start + index)?) {
                return Ok(Resolution::Ambiguous);
            }
        }
    }
    Ok(Resolution::Found(first))
}

fn same_file_backed_target(left: TargetEntry, right: TargetEntry) -> bool {
    left.component_path_id == right.component_path_id
        && left.canonical_id == right.canonical_id
        && left.kind == right.kind
        && left.item_project_path_id == right.item_project_path_id
        && left.owner_project_path_id == right.owner_project_path_id
}

fn read_u32(bytes: &[u8], offset: usize) -> Result<u32> {
    let value = bytes
        .get(offset..offset + 4)
        .ok_or_else(|| Error::from_reason("Запрос target lookup оборван"))?;
    Ok(u32::from_le_bytes([value[0], value[1], value[2], value[3]]))
}

fn usize_from_u32(value: u32) -> Result<usize> {
    usize::try_from(value)
        .map_err(|_| Error::from_reason("Размер target lookup не помещается в usize"))
}

fn u32_from_usize(value: usize) -> Result<u32> {
    u32::try_from(value)
        .map_err(|_| Error::from_reason("Размер target response не помещается в u32"))
}
