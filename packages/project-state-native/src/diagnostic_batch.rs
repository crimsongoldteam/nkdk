use std::collections::HashMap;

use napi::{Error, Result};

const MAGIC: u32 = 0x4444_4b4e;
const VERSION: u16 = 1;
const HEADER_BYTES: usize = 32;
const RECORD_BYTES: usize = 24;
const STRING_HEADER_BYTES: usize = 8;
const STRING_RECORD_BYTES: usize = 8;
const NONE: u32 = u32::MAX;

pub struct DiagnosticRecord<'a> {
    pub file_path: &'a str,
    pub line: u32,
    pub col: u32,
    pub message: &'a str,
    pub path: Option<&'a str>,
    pub severity: u8,
    pub source: u8,
    pub code: Option<&'a str>,
    pub value: Option<&'a str>,
}

struct EncodedRecord {
    source_file_id: u32,
    line: u32,
    col: u32,
    message_id: u32,
    path_id: u32,
    severity: u8,
    source: u8,
    code_id: u32,
    value_id: u32,
}

#[derive(Default)]
pub struct DiagnosticBatchWriter {
    rows: Vec<EncodedRecord>,
    strings: Vec<String>,
    string_ids: HashMap<String, u32>,
    file_ids: HashMap<String, u32>,
    file_path_string_ids: Vec<u32>,
}

impl DiagnosticBatchWriter {
    pub fn push(&mut self, diagnostic: DiagnosticRecord<'_>) -> Result<()> {
        let source_file_id = self.intern_file(diagnostic.file_path)?;
        let message_id = self.intern(diagnostic.message)?;
        let path_id = self.intern_optional(diagnostic.path)?;
        let code_id = self.intern_optional(diagnostic.code)?;
        let value_id = self.intern_optional(diagnostic.value)?;
        self.rows.push(EncodedRecord {
            source_file_id,
            line: diagnostic.line,
            col: diagnostic.col,
            message_id,
            path_id,
            severity: diagnostic.severity,
            source: diagnostic.source,
            code_id,
            value_id,
        });
        Ok(())
    }

    pub fn finish(self) -> Result<Vec<u8>> {
        let strings = pack_strings(&self.strings)?;
        let files_offset = checked_add(HEADER_BYTES, strings.len())?;
        let files_bytes = checked_mul(self.file_path_string_ids.len(), 4)?;
        let records_offset = checked_add(files_offset, files_bytes)?;
        let records_bytes = checked_mul(self.rows.len(), RECORD_BYTES)?;
        let codes_offset = checked_add(records_offset, records_bytes)?;
        let optional_bytes = checked_mul(self.rows.len(), 4)?;
        let values_offset = checked_add(codes_offset, optional_bytes)?;
        let byte_length = checked_add(values_offset, optional_bytes)?;
        let mut bytes = vec![0; byte_length];

        write_u32(&mut bytes, 0, MAGIC)?;
        write_u16(&mut bytes, 4, VERSION)?;
        write_u16(&mut bytes, 6, 0)?;
        write_u32(&mut bytes, 8, u32_len(self.rows.len())?)?;
        write_u32(&mut bytes, 12, u32_len(self.file_path_string_ids.len())?)?;
        write_u32(&mut bytes, 16, u32_len(HEADER_BYTES)?)?;
        write_u32(&mut bytes, 20, u32_len(strings.len())?)?;
        write_u32(&mut bytes, 24, u32_len(files_offset)?)?;
        write_u32(&mut bytes, 28, u32_len(records_offset)?)?;
        bytes[HEADER_BYTES..files_offset].copy_from_slice(&strings);

        for (index, string_id) in self.file_path_string_ids.iter().enumerate() {
            write_u32(&mut bytes, files_offset + index * 4, *string_id)?;
        }
        for (index, row) in self.rows.iter().enumerate() {
            let offset = records_offset + index * RECORD_BYTES;
            write_u32(&mut bytes, offset, row.source_file_id)?;
            write_u32(&mut bytes, offset + 4, row.line)?;
            write_u32(&mut bytes, offset + 8, row.col)?;
            write_u32(&mut bytes, offset + 12, row.message_id)?;
            write_u32(&mut bytes, offset + 16, row.path_id)?;
            write_u8(&mut bytes, offset + 20, row.severity)?;
            write_u8(&mut bytes, offset + 21, row.source)?;
            write_u16(&mut bytes, offset + 22, 0)?;
            write_u32(&mut bytes, codes_offset + index * 4, row.code_id)?;
            write_u32(&mut bytes, values_offset + index * 4, row.value_id)?;
        }
        Ok(bytes)
    }

    fn intern_optional(&mut self, value: Option<&str>) -> Result<u32> {
        match value {
            Some(value) => self.intern(value),
            None => Ok(NONE),
        }
    }

    fn intern_file(&mut self, value: &str) -> Result<u32> {
        if let Some(id) = self.file_ids.get(value) {
            return Ok(*id);
        }
        let string_id = self.intern(value)?;
        let id = u32_len(self.file_path_string_ids.len())?;
        self.file_ids.insert(value.to_owned(), id);
        self.file_path_string_ids.push(string_id);
        Ok(id)
    }

    fn intern(&mut self, value: &str) -> Result<u32> {
        if let Some(id) = self.string_ids.get(value) {
            return Ok(*id);
        }
        let id = u32_len(self.strings.len())?;
        self.string_ids.insert(value.to_owned(), id);
        self.strings.push(value.to_owned());
        Ok(id)
    }
}

fn pack_strings(values: &[String]) -> Result<Vec<u8>> {
    let records_bytes = checked_mul(values.len(), STRING_RECORD_BYTES)?;
    let utf8_offset = checked_add(STRING_HEADER_BYTES, records_bytes)?;
    let utf8_bytes = values
        .iter()
        .try_fold(0usize, |total, value| checked_add(total, value.len()))?;
    let mut bytes = vec![0; checked_add(utf8_offset, utf8_bytes)?];
    write_u32(&mut bytes, 0, u32_len(values.len())?)?;
    write_u32(&mut bytes, 4, u32_len(utf8_offset)?)?;
    let mut offset = 0usize;
    for (index, value) in values.iter().enumerate() {
        let record = STRING_HEADER_BYTES + index * STRING_RECORD_BYTES;
        write_u32(&mut bytes, record, u32_len(offset)?)?;
        write_u32(&mut bytes, record + 4, u32_len(value.len())?)?;
        let start = utf8_offset + offset;
        bytes[start..start + value.len()].copy_from_slice(value.as_bytes());
        offset += value.len();
    }
    Ok(bytes)
}

fn write_u8(bytes: &mut [u8], offset: usize, value: u8) -> Result<()> {
    let slot = bytes
        .get_mut(offset)
        .ok_or_else(|| Error::from_reason("Пачка диагностик оборвана"))?;
    *slot = value;
    Ok(())
}

fn write_u16(bytes: &mut [u8], offset: usize, value: u16) -> Result<()> {
    let output = bytes
        .get_mut(offset..offset + 2)
        .ok_or_else(|| Error::from_reason("Пачка диагностик оборвана"))?;
    output.copy_from_slice(&value.to_le_bytes());
    Ok(())
}

fn write_u32(bytes: &mut [u8], offset: usize, value: u32) -> Result<()> {
    let output = bytes
        .get_mut(offset..offset + 4)
        .ok_or_else(|| Error::from_reason("Пачка диагностик оборвана"))?;
    output.copy_from_slice(&value.to_le_bytes());
    Ok(())
}

fn checked_add(left: usize, right: usize) -> Result<usize> {
    left.checked_add(right)
        .ok_or_else(|| Error::from_reason("Переполнение размера пачки диагностик"))
}

fn checked_mul(left: usize, right: usize) -> Result<usize> {
    left.checked_mul(right)
        .ok_or_else(|| Error::from_reason("Переполнение размера пачки диагностик"))
}

fn u32_len(value: usize) -> Result<u32> {
    u32::try_from(value)
        .map_err(|_| Error::from_reason("Размер пачки диагностик не помещается в u32"))
}
