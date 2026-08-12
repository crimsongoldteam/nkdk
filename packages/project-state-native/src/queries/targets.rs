use napi::{Error, Result};

use crate::buffers::ProjectStateSections;
use crate::format::{SnapshotLayout, TargetEntry};
use crate::query_protocol::{QueryEnvelope, write_envelope, write_u32};

pub const OPERATION: u16 = 3;
const REQUEST_BYTES: usize = 16;
const RESULT_BYTES: usize = 16;
const ENTRY_BYTES: usize = 48;
const FOUND: u32 = 1;
const AMBIGUOUS: u32 = 2;
const NONE: u32 = u32::MAX;

enum Resolution {
    Missing,
    Ambiguous,
    Found(ResolvedTarget),
}

struct ResolvedTarget {
    kind: u8,
    source_file_id: usize,
    canonical: String,
    project_path: String,
    component_path: String,
    item_project_path: Option<String>,
    owner_project_path: Option<String>,
}

pub fn execute(
    request: &[u8],
    envelope: QueryEnvelope,
    sections: &ProjectStateSections,
    layout: &SnapshotLayout,
) -> Result<Vec<u8>> {
    envelope.validate_rows(request, REQUEST_BYTES)?;
    let mut resolutions = Vec::with_capacity(envelope.request_count);
    for index in 0..envelope.request_count {
        let row = envelope.rows_offset + index * REQUEST_BYTES;
        let component_path = envelope.read_string(
            request,
            usize_from_u32(read_u32(request, row)?)?,
            usize_from_u32(read_u32(request, row + 4)?)?,
        )?;
        let canonical = envelope.read_string(
            request,
            usize_from_u32(read_u32(request, row + 8)?)?,
            usize_from_u32(read_u32(request, row + 12)?)?,
        )?;
        resolutions.push(resolve(sections, layout, component_path, canonical)?);
    }

    let found_count = resolutions
        .iter()
        .filter(|resolution| matches!(resolution, Resolution::Found(_)))
        .count();
    let entries_offset = QueryEnvelope::HEADER_BYTES + envelope.request_count * RESULT_BYTES;
    let strings_offset = entries_offset + found_count * ENTRY_BYTES;
    let strings_length = resolutions
        .iter()
        .map(resolution_strings_length)
        .sum::<usize>();
    let mut response = vec![0; strings_offset + strings_length];
    write_envelope(
        &mut response,
        OPERATION,
        envelope.request_count,
        QueryEnvelope::HEADER_BYTES,
        strings_offset,
    )?;

    let mut target_index = 0;
    let mut string_offset = 0;
    for (request_index, resolution) in resolutions.iter().enumerate() {
        let row = QueryEnvelope::HEADER_BYTES + request_index * RESULT_BYTES;
        match resolution {
            Resolution::Missing => {}
            Resolution::Ambiguous => write_u32(&mut response, row, AMBIGUOUS)?,
            Resolution::Found(target) => {
                write_u32(&mut response, row, FOUND)?;
                write_u32(&mut response, row + 4, u32_from_usize(target_index)?)?;
                let entry = entries_offset + target_index * ENTRY_BYTES;
                write_u32(&mut response, entry, u32::from(target.kind))?;
                write_u32(
                    &mut response,
                    entry + 4,
                    u32_from_usize(target.source_file_id)?,
                )?;
                write_string(
                    &mut response,
                    entry + 8,
                    strings_offset,
                    &mut string_offset,
                    Some(&target.canonical),
                )?;
                write_string(
                    &mut response,
                    entry + 16,
                    strings_offset,
                    &mut string_offset,
                    Some(&target.project_path),
                )?;
                write_string(
                    &mut response,
                    entry + 24,
                    strings_offset,
                    &mut string_offset,
                    Some(&target.component_path),
                )?;
                write_string(
                    &mut response,
                    entry + 32,
                    strings_offset,
                    &mut string_offset,
                    target.item_project_path.as_deref(),
                )?;
                write_string(
                    &mut response,
                    entry + 40,
                    strings_offset,
                    &mut string_offset,
                    target.owner_project_path.as_deref(),
                )?;
                target_index += 1;
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
    let files = sections.files.as_ref();
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
    let project_path_id = layout.file_project_path_id(files, first.source_file_id)?;
    Ok(Resolution::Found(ResolvedTarget {
        kind: first.kind,
        source_file_id: first.source_file_id,
        canonical: layout.string_value(strings, first.canonical_id)?.to_owned(),
        project_path: layout.string_value(strings, project_path_id)?.to_owned(),
        component_path: layout
            .string_value(strings, first.component_path_id)?
            .to_owned(),
        item_project_path: optional_string(layout, strings, first.item_project_path_id)?,
        owner_project_path: optional_string(layout, strings, first.owner_project_path_id)?,
    }))
}

fn same_file_backed_target(left: TargetEntry, right: TargetEntry) -> bool {
    left.component_path_id == right.component_path_id
        && left.canonical_id == right.canonical_id
        && left.kind == right.kind
        && left.item_project_path_id == right.item_project_path_id
        && left.owner_project_path_id == right.owner_project_path_id
}

fn optional_string(layout: &SnapshotLayout, strings: &[u8], id: usize) -> Result<Option<String>> {
    if id == u32::MAX as usize {
        Ok(None)
    } else {
        Ok(Some(layout.string_value(strings, id)?.to_owned()))
    }
}

fn resolution_strings_length(resolution: &Resolution) -> usize {
    match resolution {
        Resolution::Found(target) => {
            target.canonical.len()
                + target.project_path.len()
                + target.component_path.len()
                + target.item_project_path.as_ref().map_or(0, String::len)
                + target.owner_project_path.as_ref().map_or(0, String::len)
        }
        Resolution::Missing | Resolution::Ambiguous => 0,
    }
}

fn write_string(
    response: &mut [u8],
    entry_offset: usize,
    strings_offset: usize,
    string_offset: &mut usize,
    value: Option<&str>,
) -> Result<()> {
    let Some(value) = value else {
        write_u32(response, entry_offset, NONE)?;
        return write_u32(response, entry_offset + 4, 0);
    };
    write_u32(response, entry_offset, u32_from_usize(*string_offset)?)?;
    write_u32(response, entry_offset + 4, u32_from_usize(value.len())?)?;
    let start = strings_offset + *string_offset;
    let end = start + value.len();
    response
        .get_mut(start..end)
        .ok_or_else(|| Error::from_reason("Строка цели выходит за ответ"))?
        .copy_from_slice(value.as_bytes());
    *string_offset += value.len();
    Ok(())
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
