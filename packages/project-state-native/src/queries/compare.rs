use napi::{Error, Result};

use crate::buffers::ProjectStateSections;
use crate::format::SnapshotLayout;
use crate::query_protocol::{QueryEnvelope, write_envelope, write_u32};

pub const OPERATION: u16 = 2;
const REQUEST_BYTES: usize = 32;
const RESPONSE_BYTES: usize = 8;
const CHANGED: u32 = 1;
const NONE: u32 = u32::MAX;

struct Comparison {
    changed: bool,
    file_id: Option<usize>,
}

pub fn execute(
    request: &[u8],
    envelope: QueryEnvelope,
    sections: &ProjectStateSections,
    layout: &SnapshotLayout,
) -> Result<Vec<u8>> {
    envelope.validate_rows(request, REQUEST_BYTES)?;
    let mut seen = vec![false; layout.file_count];
    let mut comparisons = Vec::with_capacity(envelope.request_count);
    for index in 0..envelope.request_count {
        let row = envelope.rows_offset + index * REQUEST_BYTES;
        let project_path = envelope.read_string(
            request,
            usize_from_u32(read_u32(request, row)?)?,
            usize_from_u32(read_u32(request, row + 4)?)?,
        )?;
        let component_path = envelope.read_string(
            request,
            usize_from_u32(read_u32(request, row + 8)?)?,
            usize_from_u32(read_u32(request, row + 12)?)?,
        )?;
        let hash = read_u64(request, row + 16)?;
        let resource_kind = read_u8(request, row + 24)?;
        let yaml_role = read_u8(request, row + 25)?;
        let file_id = layout.find_file(
            sections.strings.as_ref(),
            sections.files.as_ref(),
            project_path,
        )?;
        let changed = match file_id {
            None => true,
            Some(file_id) => {
                seen[file_id] = true;
                let stored = layout.file_identity(sections.files.as_ref(), file_id)?;
                stored.hash != hash
                    || stored.resource_kind != resource_kind
                    || stored.yaml_role != yaml_role
                    || layout.string_value(sections.strings.as_ref(), stored.component_path_id)?
                        != component_path
            }
        };
        comparisons.push(Comparison { changed, file_id });
    }

    let deleted: Vec<usize> = seen
        .iter()
        .enumerate()
        .filter_map(|(file_id, seen)| (!seen).then_some(file_id))
        .collect();
    let deleted_offset = QueryEnvelope::HEADER_BYTES + comparisons.len() * RESPONSE_BYTES;
    let response_length = deleted_offset + deleted.len() * 4;
    let mut response = vec![0; response_length];
    write_envelope(
        &mut response,
        OPERATION,
        comparisons.len(),
        QueryEnvelope::HEADER_BYTES,
        response_length,
    )?;
    for (index, comparison) in comparisons.iter().enumerate() {
        let row = QueryEnvelope::HEADER_BYTES + index * RESPONSE_BYTES;
        if comparison.changed {
            write_u32(&mut response, row, CHANGED)?;
            write_u32(
                &mut response,
                row + 4,
                comparison.file_id.map_or(Ok(NONE), u32_from_usize)?,
            )?;
        }
    }
    for (index, file_id) in deleted.into_iter().enumerate() {
        write_u32(
            &mut response,
            deleted_offset + index * 4,
            u32_from_usize(file_id)?,
        )?;
    }
    Ok(response)
}

fn read_u8(bytes: &[u8], offset: usize) -> Result<u8> {
    bytes
        .get(offset)
        .copied()
        .ok_or_else(|| Error::from_reason("Запрос compare files оборван"))
}

fn read_u32(bytes: &[u8], offset: usize) -> Result<u32> {
    let value = bytes
        .get(offset..offset + 4)
        .ok_or_else(|| Error::from_reason("Запрос compare files оборван"))?;
    Ok(u32::from_le_bytes([value[0], value[1], value[2], value[3]]))
}

fn read_u64(bytes: &[u8], offset: usize) -> Result<u64> {
    let value = bytes
        .get(offset..offset + 8)
        .ok_or_else(|| Error::from_reason("Запрос compare files оборван"))?;
    Ok(u64::from_le_bytes([
        value[0], value[1], value[2], value[3], value[4], value[5], value[6], value[7],
    ]))
}

fn usize_from_u32(value: u32) -> Result<usize> {
    usize::try_from(value)
        .map_err(|_| Error::from_reason("Размер compare files не помещается в usize"))
}

fn u32_from_usize(value: usize) -> Result<u32> {
    u32::try_from(value).map_err(|_| Error::from_reason("fileId не помещается в u32"))
}
