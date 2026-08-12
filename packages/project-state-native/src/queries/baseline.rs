use napi::{Error, Result};

use crate::buffers::ProjectStateSections;
use crate::format::SnapshotLayout;
use crate::query_protocol::{QueryEnvelope, write_envelope, write_u32, write_u64};

pub const OPERATION: u16 = 1;
const REQUEST_BYTES: usize = 8;
const RESPONSE_BYTES: usize = 16;
const FOUND: u32 = 1;
const MISSING_FILE_ID: u32 = u32::MAX;

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
                .checked_mul(RESPONSE_BYTES)
                .ok_or_else(|| Error::from_reason("Переполнение ответа file baseline"))?,
        )
        .ok_or_else(|| Error::from_reason("Переполнение ответа file baseline"))?;
    let mut response = vec![0; response_length];
    write_envelope(
        &mut response,
        OPERATION,
        envelope.request_count,
        QueryEnvelope::HEADER_BYTES,
        response_length,
    )?;
    let strings = sections.strings.as_ref();
    let files = sections.files.as_ref();
    for index in 0..envelope.request_count {
        let request_row = envelope.rows_offset + index * REQUEST_BYTES;
        let path_offset = usize::try_from(read_u32(request, request_row)?)
            .map_err(|_| Error::from_reason("Смещение строки не помещается в usize"))?;
        let path_length = usize::try_from(read_u32(request, request_row + 4)?)
            .map_err(|_| Error::from_reason("Длина строки не помещается в usize"))?;
        let path = envelope.read_string(request, path_offset, path_length)?;
        let response_row = QueryEnvelope::HEADER_BYTES + index * RESPONSE_BYTES;
        if let Some(file_id) = layout.find_file(strings, files, path)? {
            write_u32(&mut response, response_row, FOUND)?;
            write_u32(
                &mut response,
                response_row + 4,
                u32::try_from(file_id)
                    .map_err(|_| Error::from_reason("fileId не помещается в u32"))?,
            )?;
            write_u64(
                &mut response,
                response_row + 8,
                layout.file_hash(files, file_id)?,
            )?;
        } else {
            write_u32(&mut response, response_row + 4, MISSING_FILE_ID)?;
        }
    }
    Ok(response)
}

fn read_u32(bytes: &[u8], offset: usize) -> Result<u32> {
    let end = offset
        .checked_add(4)
        .ok_or_else(|| Error::from_reason("Переполнение смещения запроса"))?;
    let value = bytes
        .get(offset..end)
        .ok_or_else(|| Error::from_reason("Запрос file baseline оборван"))?;
    Ok(u32::from_le_bytes([value[0], value[1], value[2], value[3]]))
}
