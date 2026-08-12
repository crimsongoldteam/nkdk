use napi::{Error, Result};
use std::cmp::Ordering;

use crate::buffers::ProjectStateSections;

const MAGIC_FIRST: u32 = 0x4b44_4b4e;
const MAGIC_SECOND: u32 = 0x5441_5453;
const HEADER_BYTES: usize = 32;
const SECTION_BYTES: usize = 16;
const SECTION_COUNT: usize = 5;
const STRING_HEADER_BYTES: usize = 28;
const STRING_RECORD_BYTES: usize = 8;
const HASH_SLOT_BYTES: usize = 16;
const FILE_HEADER_BYTES: usize = 8;
const FILE_RECORD_BYTES: usize = 36;
const LOOKUP_HEADER_BYTES: usize = 56;
const TARGET_ENTRY_BYTES: usize = 24;
const TARGET_RANGE_BYTES: usize = 16;
const OWNER_ENTRY_BYTES: usize = 8;
const OWNER_RANGE_BYTES: usize = 16;
const NONE: usize = u32::MAX as usize;

#[derive(Clone, Copy, PartialEq, Eq)]
pub struct TargetEntry {
    pub component_path_id: usize,
    pub canonical_id: usize,
    pub source_file_id: usize,
    pub item_project_path_id: usize,
    pub owner_project_path_id: usize,
    pub kind: u8,
}

pub struct FileIdentityRecord {
    pub component_path_id: usize,
    pub hash: u64,
    pub resource_kind: u8,
    pub yaml_role: u8,
}

pub struct SnapshotLayout {
    pub string_count: usize,
    pub string_records_offset: usize,
    pub string_utf8_offset: usize,
    pub string_utf8_length: usize,
    pub file_count: usize,
    pub file_records_offset: usize,
    pub target_entry_count: usize,
    pub target_range_count: usize,
    pub target_entries_offset: usize,
    pub target_ranges_offset: usize,
    pub target_index_offset: usize,
    pub target_index_capacity: usize,
}

impl SnapshotLayout {
    pub fn decode(sections: &ProjectStateSections) -> Result<Self> {
        let section_records = validate_header(sections)?;
        let strings = sections.strings.as_ref();
        require_length(strings, STRING_HEADER_BYTES, "Раздел строк оборван")?;
        let string_count = usize_from_u32(read_u32(strings, 0)?)?;
        let string_records_offset = usize_from_u32(read_u32(strings, 4)?)?;
        let string_utf8_offset = usize_from_u32(read_u32(strings, 8)?)?;
        let string_utf8_length = usize_from_u32(read_u32(strings, 12)?)?;
        let lookup_offset = usize_from_u32(read_u32(strings, 16)?)?;
        let lookup_size = usize_from_u32(read_u32(strings, 20)?)?;
        let lookup_capacity = usize_from_u32(read_u32(strings, 24)?)?;
        let records_length = checked_mul(string_count, STRING_RECORD_BYTES)?;
        let expected_utf8_offset = checked_add(STRING_HEADER_BYTES, records_length)?;
        let expected_lookup_offset = checked_add(expected_utf8_offset, string_utf8_length)?;
        let lookup_length = checked_mul(lookup_capacity, HASH_SLOT_BYTES)?;
        let expected_length = checked_add(expected_lookup_offset, lookup_length)?;
        if string_records_offset != STRING_HEADER_BYTES
            || string_utf8_offset != expected_utf8_offset
            || lookup_offset != expected_lookup_offset
            || expected_length != strings.len()
            || lookup_size != string_count
            || lookup_capacity == 0
            || !lookup_capacity.is_power_of_two()
        {
            return invalid("Повреждена структура раздела строк");
        }

        let files = sections.files.as_ref();
        require_length(files, FILE_HEADER_BYTES, "Раздел файлов оборван")?;
        let file_count = usize_from_u32(read_u32(files, 0)?)?;
        let file_records_offset = usize_from_u32(read_u32(files, 4)?)?;
        let records_length = checked_mul(file_count, FILE_RECORD_BYTES)?;
        if file_records_offset != FILE_HEADER_BYTES
            || checked_add(file_records_offset, records_length)? != files.len()
        {
            return invalid("Повреждена структура раздела файлов");
        }
        if section_records != [string_count, file_count, 0, 0, 0] {
            return invalid("Число записей каталога разделов не совпадает со снимком");
        }

        let lookups = sections.lookups.as_ref();
        require_length(lookups, LOOKUP_HEADER_BYTES, "Раздел индексов оборван")?;
        let target_entry_count = usize_from_u32(read_u32(lookups, 0)?)?;
        let target_range_count = usize_from_u32(read_u32(lookups, 4)?)?;
        let target_entries_offset = usize_from_u32(read_u32(lookups, 8)?)?;
        let target_ranges_offset = usize_from_u32(read_u32(lookups, 12)?)?;
        let target_index_offset = usize_from_u32(read_u32(lookups, 16)?)?;
        let target_index_size = usize_from_u32(read_u32(lookups, 20)?)?;
        let target_index_capacity = usize_from_u32(read_u32(lookups, 24)?)?;
        let owner_entry_count = usize_from_u32(read_u32(lookups, 28)?)?;
        let owner_range_count = usize_from_u32(read_u32(lookups, 32)?)?;
        let owner_entries_offset = usize_from_u32(read_u32(lookups, 36)?)?;
        let owner_ranges_offset = usize_from_u32(read_u32(lookups, 40)?)?;
        let owner_index_offset = usize_from_u32(read_u32(lookups, 44)?)?;
        let owner_index_size = usize_from_u32(read_u32(lookups, 48)?)?;
        let owner_index_capacity = usize_from_u32(read_u32(lookups, 52)?)?;
        let expected_ranges_offset = checked_add(
            LOOKUP_HEADER_BYTES,
            checked_mul(target_entry_count, TARGET_ENTRY_BYTES)?,
        )?;
        let expected_index_offset = checked_add(
            expected_ranges_offset,
            checked_mul(target_range_count, TARGET_RANGE_BYTES)?,
        )?;
        let expected_owner_entries_offset = checked_add(
            expected_index_offset,
            checked_mul(target_index_capacity, HASH_SLOT_BYTES)?,
        )?;
        let expected_owner_ranges_offset = checked_add(
            expected_owner_entries_offset,
            checked_mul(owner_entry_count, OWNER_ENTRY_BYTES)?,
        )?;
        let expected_owner_index_offset = checked_add(
            expected_owner_ranges_offset,
            checked_mul(owner_range_count, OWNER_RANGE_BYTES)?,
        )?;
        let expected_lookup_length = checked_add(
            expected_owner_index_offset,
            checked_mul(owner_index_capacity, HASH_SLOT_BYTES)?,
        )?;
        if target_entries_offset != LOOKUP_HEADER_BYTES
            || target_ranges_offset != expected_ranges_offset
            || target_index_offset != expected_index_offset
            || owner_entries_offset != expected_owner_entries_offset
            || owner_ranges_offset != expected_owner_ranges_offset
            || owner_index_offset != expected_owner_index_offset
            || expected_lookup_length != lookups.len()
            || target_index_size != target_range_count
            || owner_index_size != owner_range_count
            || !valid_hash_capacity(target_index_size, target_index_capacity)
            || !valid_hash_capacity(owner_index_size, owner_index_capacity)
        {
            return invalid("Повреждена структура раздела индексов");
        }

        Ok(Self {
            string_count,
            string_records_offset,
            string_utf8_offset,
            string_utf8_length,
            file_count,
            file_records_offset,
            target_entry_count,
            target_range_count,
            target_entries_offset,
            target_ranges_offset,
            target_index_offset,
            target_index_capacity,
        })
    }

    pub fn string_value<'a>(&self, strings: &'a [u8], id: usize) -> Result<&'a str> {
        if id >= self.string_count {
            return invalid("Неизвестный идентификатор строки");
        }
        let record = checked_add(
            self.string_records_offset,
            checked_mul(id, STRING_RECORD_BYTES)?,
        )?;
        let offset = usize_from_u32(read_u32(strings, record)?)?;
        let length = usize_from_u32(read_u32(strings, checked_add(record, 4)?)?)?;
        if checked_add(offset, length)? > self.string_utf8_length {
            return invalid("Повреждён диапазон строки");
        }
        let start = checked_add(self.string_utf8_offset, offset)?;
        let end = checked_add(start, length)?;
        std::str::from_utf8(&strings[start..end])
            .map_err(|_| Error::from_reason("Строка содержит неверный UTF-8"))
    }

    pub fn file_project_path_id(&self, files: &[u8], file_id: usize) -> Result<usize> {
        if file_id >= self.file_count {
            return invalid("Неизвестный файл снимка");
        }
        let record = checked_add(
            self.file_records_offset,
            checked_mul(file_id, FILE_RECORD_BYTES)?,
        )?;
        usize_from_u32(read_u32(files, record)?)
    }

    pub fn file_hash(&self, files: &[u8], file_id: usize) -> Result<u64> {
        let record = self.file_record_offset(file_id)?;
        read_u64(files, checked_add(record, 8)?)
    }

    pub fn file_identity(&self, files: &[u8], file_id: usize) -> Result<FileIdentityRecord> {
        let record = self.file_record_offset(file_id)?;
        Ok(FileIdentityRecord {
            component_path_id: usize_from_u32(read_u32(files, checked_add(record, 4)?)?)?,
            hash: read_u64(files, checked_add(record, 8)?)?,
            resource_kind: read_u8(files, checked_add(record, 32)?)?,
            yaml_role: read_u8(files, checked_add(record, 33)?)?,
        })
    }

    pub fn find_file(&self, strings: &[u8], files: &[u8], path: &str) -> Result<Option<usize>> {
        let mut low = 0;
        let mut high = self.file_count;
        while low < high {
            let middle = low + (high - low) / 2;
            let path_id = self.file_project_path_id(files, middle)?;
            let candidate = self.string_value(strings, path_id)?;
            match compare_utf16(candidate, path) {
                Ordering::Less => low = middle + 1,
                Ordering::Greater => high = middle,
                Ordering::Equal => return Ok(Some(middle)),
            }
        }
        Ok(None)
    }

    pub fn find_target_range(
        &self,
        lookups: &[u8],
        strings: &[u8],
        component_path: &str,
        canonical: &str,
    ) -> Result<Option<usize>> {
        let hash = target_key_hash(component_path, canonical);
        let mut slot = hash as usize & (self.target_index_capacity - 1);
        for _ in 0..self.target_index_capacity {
            let offset = checked_add(
                self.target_index_offset,
                checked_mul(slot, HASH_SLOT_BYTES)?,
            )?;
            if read_u8(lookups, checked_add(offset, 12)?)? == 0 {
                return Ok(None);
            }
            if read_u64(lookups, offset)? == hash {
                let range_id = usize_from_u32(read_u32(lookups, checked_add(offset, 8)?)?)?;
                let (component_id, canonical_id, _, _) = self.target_range(lookups, range_id)?;
                if self.string_value(strings, component_id)? == component_path
                    && self.string_value(strings, canonical_id)? == canonical
                {
                    return Ok(Some(range_id));
                }
            }
            slot = (slot + 1) & (self.target_index_capacity - 1);
        }
        Ok(None)
    }

    pub fn target_range(
        &self,
        lookups: &[u8],
        range_id: usize,
    ) -> Result<(usize, usize, usize, usize)> {
        if range_id >= self.target_range_count {
            return invalid("Неизвестный диапазон индекса целей");
        }
        let offset = checked_add(
            self.target_ranges_offset,
            checked_mul(range_id, TARGET_RANGE_BYTES)?,
        )?;
        let start = usize_from_u32(read_u32(lookups, checked_add(offset, 8)?)?)?;
        let count = usize_from_u32(read_u32(lookups, checked_add(offset, 12)?)?)?;
        if checked_add(start, count)? > self.target_entry_count {
            return invalid("Диапазон целей выходит за таблицу");
        }
        Ok((
            usize_from_u32(read_u32(lookups, offset)?)?,
            usize_from_u32(read_u32(lookups, checked_add(offset, 4)?)?)?,
            start,
            count,
        ))
    }

    pub fn target_entry(&self, lookups: &[u8], entry_id: usize) -> Result<TargetEntry> {
        if entry_id >= self.target_entry_count {
            return invalid("Неизвестная запись индекса целей");
        }
        let offset = checked_add(
            self.target_entries_offset,
            checked_mul(entry_id, TARGET_ENTRY_BYTES)?,
        )?;
        let entry = TargetEntry {
            component_path_id: usize_from_u32(read_u32(lookups, offset)?)?,
            canonical_id: usize_from_u32(read_u32(lookups, checked_add(offset, 4)?)?)?,
            source_file_id: usize_from_u32(read_u32(lookups, checked_add(offset, 8)?)?)?,
            item_project_path_id: usize_from_u32(read_u32(lookups, checked_add(offset, 12)?)?)?,
            owner_project_path_id: usize_from_u32(read_u32(lookups, checked_add(offset, 16)?)?)?,
            kind: read_u8(lookups, checked_add(offset, 20)?)?,
        };
        if entry.source_file_id >= self.file_count
            || entry.component_path_id >= self.string_count
            || entry.canonical_id >= self.string_count
            || !valid_optional_string_id(entry.item_project_path_id, self.string_count)
            || !valid_optional_string_id(entry.owner_project_path_id, self.string_count)
            || !(1..=3).contains(&entry.kind)
        {
            return invalid("Повреждена запись индекса целей");
        }
        Ok(entry)
    }

    fn file_record_offset(&self, file_id: usize) -> Result<usize> {
        if file_id >= self.file_count {
            return invalid("Неизвестный файл снимка");
        }
        checked_add(
            self.file_records_offset,
            checked_mul(file_id, FILE_RECORD_BYTES)?,
        )
    }
}

fn validate_header(sections: &ProjectStateSections) -> Result<[usize; SECTION_COUNT]> {
    let header = sections.header.as_ref();
    let expected_header_length = checked_add(HEADER_BYTES, SECTION_COUNT * SECTION_BYTES)?;
    if header.len() != expected_header_length {
        return invalid("Неверный размер заголовка снимка");
    }
    if read_u32(header, 0)? != MAGIC_FIRST || read_u32(header, 4)? != MAGIC_SECOND {
        return invalid("Неверная сигнатура состояния проекта");
    }
    if read_u16(header, 8)? != 0 || read_u16(header, 10)? != 5 || read_u16(header, 12)? != 0 {
        return invalid("Несовместимая версия состояния проекта");
    }
    if usize::from(read_u16(header, 14)?) != SECTION_COUNT
        || usize_from_u32(read_u32(header, 24)?)? != expected_header_length
    {
        return invalid("Неверная длина заголовка состояния проекта");
    }

    let mut expected_offset = expected_header_length;
    let mut records = [0; SECTION_COUNT];
    for (index, bytes) in sections.ordered().into_iter().enumerate() {
        let record = HEADER_BYTES + index * SECTION_BYTES;
        let kind = usize::from(read_u16(header, record)?);
        let offset = usize_from_u32(read_u32(header, record + 4)?)?;
        let length = usize_from_u32(read_u32(header, record + 8)?)?;
        if kind != index + 1 || offset != expected_offset || length != bytes.len() {
            return invalid("Каталог разделов снимка не соответствует общим буферам");
        }
        records[index] = usize_from_u32(read_u32(header, record + 12)?)?;
        expected_offset = checked_add(expected_offset, length)?;
    }
    Ok(records)
}

fn read_u16(bytes: &[u8], offset: usize) -> Result<u16> {
    let end = checked_add(offset, 2)?;
    let value = bytes
        .get(offset..end)
        .ok_or_else(|| Error::from_reason("Двоичный снимок оборван"))?;
    Ok(u16::from_le_bytes([value[0], value[1]]))
}

fn read_u8(bytes: &[u8], offset: usize) -> Result<u8> {
    bytes
        .get(offset)
        .copied()
        .ok_or_else(|| Error::from_reason("Двоичный снимок оборван"))
}

fn read_u32(bytes: &[u8], offset: usize) -> Result<u32> {
    let end = checked_add(offset, 4)?;
    let value = bytes
        .get(offset..end)
        .ok_or_else(|| Error::from_reason("Двоичный снимок оборван"))?;
    Ok(u32::from_le_bytes([value[0], value[1], value[2], value[3]]))
}

fn read_u64(bytes: &[u8], offset: usize) -> Result<u64> {
    let end = checked_add(offset, 8)?;
    let value = bytes
        .get(offset..end)
        .ok_or_else(|| Error::from_reason("Двоичный снимок оборван"))?;
    Ok(u64::from_le_bytes([
        value[0], value[1], value[2], value[3], value[4], value[5], value[6], value[7],
    ]))
}

fn compare_utf16(left: &str, right: &str) -> Ordering {
    left.encode_utf16().cmp(right.encode_utf16())
}

fn target_key_hash(component_path: &str, canonical: &str) -> u64 {
    let mut bytes = Vec::with_capacity(4 + component_path.len() + canonical.len());
    bytes.extend_from_slice(&(component_path.len() as u32).to_le_bytes());
    bytes.extend_from_slice(component_path.as_bytes());
    bytes.extend_from_slice(canonical.as_bytes());
    xxhash_rust::xxh3::xxh3_64(&bytes)
}

fn valid_hash_capacity(size: usize, capacity: usize) -> bool {
    capacity > 0
        && capacity.is_power_of_two()
        && size <= capacity
        && size.saturating_mul(10) <= capacity.saturating_mul(8)
}

fn valid_optional_string_id(id: usize, string_count: usize) -> bool {
    id == NONE || id < string_count
}

fn require_length(bytes: &[u8], minimum: usize, message: &str) -> Result<()> {
    if bytes.len() < minimum {
        return invalid(message);
    }
    Ok(())
}

fn checked_add(left: usize, right: usize) -> Result<usize> {
    left.checked_add(right)
        .ok_or_else(|| Error::from_reason("Переполнение размера двоичного снимка"))
}

fn checked_mul(left: usize, right: usize) -> Result<usize> {
    left.checked_mul(right)
        .ok_or_else(|| Error::from_reason("Переполнение размера двоичного снимка"))
}

fn usize_from_u32(value: u32) -> Result<usize> {
    usize::try_from(value)
        .map_err(|_| Error::from_reason("Размер не помещается в адресное пространство"))
}

fn invalid<T>(message: &str) -> Result<T> {
    Err(Error::from_reason(message))
}
