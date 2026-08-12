use napi::{Error, Result};

use crate::buffers::ProjectStateSections;
use crate::format::SnapshotLayout;
use crate::queries::baseline;
use crate::queries::compare;
use crate::queries::targets;

const QUERY_MAGIC: u32 = 0x5153_4b4e;
const ABI_MAJOR: u16 = 1;
const ABI_MINOR: u16 = 0;

#[derive(Clone, Copy)]
pub struct QueryEnvelope {
    pub operation: u16,
    pub request_count: usize,
    pub rows_offset: usize,
    pub strings_offset: usize,
}

impl QueryEnvelope {
    pub const HEADER_BYTES: usize = 24;

    pub fn decode(bytes: &[u8]) -> Result<Self> {
        if bytes.len() < Self::HEADER_BYTES {
            return invalid("Запрос ProjectState оборван");
        }
        if read_u32(bytes, 0)? != QUERY_MAGIC
            || read_u16(bytes, 4)? != ABI_MAJOR
            || read_u16(bytes, 6)? != ABI_MINOR
        {
            return invalid("Несовместимый двоичный запрос ProjectState");
        }
        let rows_offset = usize_from_u32(read_u32(bytes, 16)?)?;
        let strings_offset = usize_from_u32(read_u32(bytes, 20)?)?;
        if rows_offset != Self::HEADER_BYTES
            || strings_offset < rows_offset
            || strings_offset > bytes.len()
        {
            return invalid("Повреждены смещения двоичного запроса ProjectState");
        }
        Ok(Self {
            operation: read_u16(bytes, 8)?,
            request_count: usize_from_u32(read_u32(bytes, 12)?)?,
            rows_offset,
            strings_offset,
        })
    }

    pub fn validate_rows(&self, bytes: &[u8], row_bytes: usize) -> Result<()> {
        let rows_length = self
            .request_count
            .checked_mul(row_bytes)
            .ok_or_else(|| Error::from_reason("Переполнение размера строк запроса"))?;
        if self
            .rows_offset
            .checked_add(rows_length)
            .ok_or_else(|| Error::from_reason("Переполнение размера строк запроса"))?
            != self.strings_offset
            || self.strings_offset > bytes.len()
        {
            return invalid("Повреждены строки двоичного запроса ProjectState");
        }
        Ok(())
    }

    pub fn read_string<'a>(
        &self,
        bytes: &'a [u8],
        offset: usize,
        length: usize,
    ) -> Result<&'a str> {
        let start = self
            .strings_offset
            .checked_add(offset)
            .ok_or_else(|| Error::from_reason("Переполнение смещения строки запроса"))?;
        let end = start
            .checked_add(length)
            .ok_or_else(|| Error::from_reason("Переполнение длины строки запроса"))?;
        let value = bytes
            .get(start..end)
            .ok_or_else(|| Error::from_reason("Строка запроса выходит за границы пакета"))?;
        std::str::from_utf8(value)
            .map_err(|_| Error::from_reason("Строка запроса содержит неверный UTF-8"))
    }
}

pub fn execute(
    request: &[u8],
    sections: &ProjectStateSections,
    layout: &SnapshotLayout,
) -> Result<Vec<u8>> {
    let envelope = QueryEnvelope::decode(request)?;
    match envelope.operation {
        baseline::OPERATION => baseline::execute(request, envelope, sections, layout),
        compare::OPERATION => compare::execute(request, envelope, sections, layout),
        targets::OPERATION => targets::execute(request, envelope, sections, layout),
        operation => invalid(&format!("Неизвестная операция ProjectState: {operation}")),
    }
}

pub fn write_envelope(
    bytes: &mut [u8],
    operation: u16,
    request_count: usize,
    rows_offset: usize,
    strings_offset: usize,
) -> Result<()> {
    write_u32(bytes, 0, QUERY_MAGIC)?;
    write_u16(bytes, 4, ABI_MAJOR)?;
    write_u16(bytes, 6, ABI_MINOR)?;
    write_u16(bytes, 8, operation)?;
    write_u16(bytes, 10, 0)?;
    write_u32(bytes, 12, u32_from_usize(request_count)?)?;
    write_u32(bytes, 16, u32_from_usize(rows_offset)?)?;
    write_u32(bytes, 20, u32_from_usize(strings_offset)?)
}

pub fn write_u32(bytes: &mut [u8], offset: usize, value: u32) -> Result<()> {
    write_bytes(bytes, offset, &value.to_le_bytes())
}

pub fn write_u64(bytes: &mut [u8], offset: usize, value: u64) -> Result<()> {
    write_bytes(bytes, offset, &value.to_le_bytes())
}

fn write_u16(bytes: &mut [u8], offset: usize, value: u16) -> Result<()> {
    write_bytes(bytes, offset, &value.to_le_bytes())
}

fn write_bytes(bytes: &mut [u8], offset: usize, value: &[u8]) -> Result<()> {
    let end = offset
        .checked_add(value.len())
        .ok_or_else(|| Error::from_reason("Переполнение смещения ответа"))?;
    bytes
        .get_mut(offset..end)
        .ok_or_else(|| Error::from_reason("Ответ ProjectState слишком короткий"))?
        .copy_from_slice(value);
    Ok(())
}

fn read_u16(bytes: &[u8], offset: usize) -> Result<u16> {
    let end = offset
        .checked_add(2)
        .ok_or_else(|| Error::from_reason("Переполнение смещения запроса"))?;
    let value = bytes
        .get(offset..end)
        .ok_or_else(|| Error::from_reason("Запрос ProjectState оборван"))?;
    Ok(u16::from_le_bytes([value[0], value[1]]))
}

fn read_u32(bytes: &[u8], offset: usize) -> Result<u32> {
    let end = offset
        .checked_add(4)
        .ok_or_else(|| Error::from_reason("Переполнение смещения запроса"))?;
    let value = bytes
        .get(offset..end)
        .ok_or_else(|| Error::from_reason("Запрос ProjectState оборван"))?;
    Ok(u32::from_le_bytes([value[0], value[1], value[2], value[3]]))
}

fn usize_from_u32(value: u32) -> Result<usize> {
    usize::try_from(value).map_err(|_| Error::from_reason("Размер запроса не помещается в usize"))
}

fn u32_from_usize(value: usize) -> Result<u32> {
    u32::try_from(value).map_err(|_| Error::from_reason("Размер ответа не помещается в u32"))
}

fn invalid<T>(message: &str) -> Result<T> {
    Err(Error::from_reason(message))
}
