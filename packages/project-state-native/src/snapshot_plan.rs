use std::cmp::Ordering;
use std::collections::{HashMap, HashSet};
use std::time::Instant;

use napi::bindgen_prelude::Uint8Array;
use napi::{Error, Result};
use napi_derive::napi;
use xxhash_rust::xxh3::xxh3_64;

use crate::buffers::ProjectStateSections;
use crate::format::SnapshotLayout;

const NONE: u32 = u32::MAX;
const FACT_SIZES: [usize; 23] = [
    24, 24, 12, 36, 20, 24, 36, 36, 4, 4, 8, 12, 28, 28, 60, 4, 8, 8, 12, 20, 32, 4, 36,
];
const ROOT_TABLES: [usize; 10] = [1, 2, 4, 5, 7, 13, 14, 15, 17, 23];

#[napi(object)]
pub struct ProjectStateFragmentSections {
    pub header: Uint8Array,
    pub strings: Uint8Array,
    pub files: Uint8Array,
    pub facts: Uint8Array,
    pub diagnostics: Uint8Array,
}

#[napi(object)]
pub struct SnapshotPlanInput {
    pub base: Option<ProjectStateSections>,
    pub fragments: Vec<ProjectStateFragmentSections>,
    pub deleted_project_paths: Vec<String>,
}

#[napi(object)]
pub struct ProjectStateSectionSizes {
    pub header: u32,
    pub strings: u32,
    pub files: u32,
    pub facts: u32,
    pub lookups: u32,
    pub diagnostics: u32,
}

#[napi(object)]
pub struct NativeSnapshotStats {
    pub files: u32,
    pub strings: u32,
    pub temporary_bytes: i64,
    pub copied_snapshot_bytes: i64,
    pub plan_ms: f64,
    pub write_ms: f64,
}

struct Table {
    rows: Vec<u8>,
    count: usize,
}

#[derive(Clone)]
struct FileRecord {
    project_path_id: u32,
    component_path_id: u32,
    hash: u64,
    resource_kind: u8,
    yaml_role: u8,
    update_kind: u8,
}

struct Source {
    strings: Vec<Vec<u8>>,
    files: Vec<FileRecord>,
    tables: Vec<Option<Table>>,
    diagnostics: Vec<u8>,
    file_map: Vec<i32>,
    string_map: Vec<u32>,
    marks: Vec<Vec<bool>>,
    row_maps: Vec<Vec<i32>>,
    diagnostic_marks: Vec<bool>,
    diagnostic_map: Vec<i32>,
    base_strings: bool,
}

struct SnapshotData {
    header: Vec<u8>,
    strings: Vec<u8>,
    files: Vec<u8>,
    facts: Vec<u8>,
    lookups: Vec<u8>,
    diagnostics: Vec<u8>,
    file_count: usize,
    string_count: usize,
    plan_ms: f64,
}

#[napi]
pub struct NativeSnapshotPlan {
    data: Option<SnapshotData>,
}

#[napi]
impl NativeSnapshotPlan {
    #[napi]
    pub fn layout(&self) -> Result<ProjectStateSectionSizes> {
        let data = self.data()?;
        Ok(ProjectStateSectionSizes {
            header: u32_len(data.header.len())?,
            strings: u32_len(data.strings.len())?,
            files: u32_len(data.files.len())?,
            facts: u32_len(data.facts.len())?,
            lookups: u32_len(data.lookups.len())?,
            diagnostics: u32_len(data.diagnostics.len())?,
        })
    }

    #[napi]
    pub fn write_into(&mut self, mut output: ProjectStateSections) -> Result<NativeSnapshotStats> {
        let started = Instant::now();
        let data = self.data.take().ok_or_else(consumed_error)?;
        copy_exact(&mut output.header, &data.header, "header")?;
        copy_exact(&mut output.strings, &data.strings, "strings")?;
        copy_exact(&mut output.files, &data.files, "files")?;
        copy_exact(&mut output.facts, &data.facts, "facts")?;
        copy_exact(&mut output.lookups, &data.lookups, "lookups")?;
        copy_exact(&mut output.diagnostics, &data.diagnostics, "diagnostics")?;
        let temporary_bytes = data.header.len()
            + data.strings.len()
            + data.files.len()
            + data.facts.len()
            + data.lookups.len()
            + data.diagnostics.len();
        Ok(NativeSnapshotStats {
            files: u32_len(data.file_count)?,
            strings: u32_len(data.string_count)?,
            temporary_bytes: i64::try_from(temporary_bytes).unwrap_or(i64::MAX),
            copied_snapshot_bytes: i64::try_from(temporary_bytes).unwrap_or(i64::MAX),
            plan_ms: data.plan_ms,
            write_ms: started.elapsed().as_secs_f64() * 1_000.0,
        })
    }

    #[napi]
    pub fn close(&mut self) {
        self.data = None;
    }
}

impl NativeSnapshotPlan {
    fn data(&self) -> Result<&SnapshotData> {
        self.data.as_ref().ok_or_else(consumed_error)
    }
}

#[napi]
pub fn plan_project_state_snapshot(input: SnapshotPlanInput) -> Result<NativeSnapshotPlan> {
    let started = Instant::now();
    let mut sources = Vec::new();
    if let Some(base) = input.base {
        sources.push(source_from_snapshot(base)?);
    }
    for fragment in input.fragments {
        sources.push(source_from_fragment(fragment)?);
    }
    let deleted: HashSet<String> = input.deleted_project_paths.into_iter().collect();
    let candidates = select_files(&mut sources, &deleted)?;
    let mut strings = build_string_pool(&mut sources)?;
    mark_sources(&mut sources)?;
    assign_row_ids(&mut sources);
    assign_diagnostic_ids(&mut sources);
    let owner_key_ids = intern_owner_keys(&sources, &mut strings)?;
    let facts = pack_facts(&sources)?;
    let diagnostics = pack_diagnostics(&sources)?;
    let files = pack_files(&sources, &candidates)?;
    let lookups = pack_lookups(&sources, &owner_key_ids, &strings)?;
    let packed_strings = pack_strings(&strings)?;
    let header = pack_header(
        packed_strings.len(),
        files.len(),
        facts.len(),
        lookups.len(),
        diagnostics.len(),
        candidates.len(),
        strings.len(),
    )?;
    Ok(NativeSnapshotPlan {
        data: Some(SnapshotData {
            header,
            strings: packed_strings,
            files,
            facts,
            lookups,
            diagnostics,
            file_count: candidates.len(),
            string_count: strings.len(),
            plan_ms: started.elapsed().as_secs_f64() * 1_000.0,
        }),
    })
}

fn source_from_snapshot(sections: ProjectStateSections) -> Result<Source> {
    let layout = SnapshotLayout::decode(&sections)?;
    let strings = (0..layout.string_count)
        .map(|id| {
            layout
                .string_value(sections.strings.as_ref(), id)
                .map(|value| value.as_bytes().to_vec())
        })
        .collect::<Result<Vec<_>>>()?;
    let mut files = Vec::with_capacity(layout.file_count);
    for id in 0..layout.file_count {
        let offset = layout.file_records_offset + id * 36;
        files.push(FileRecord {
            project_path_id: read_u32(sections.files.as_ref(), offset)?,
            component_path_id: read_u32(sections.files.as_ref(), offset + 4)?,
            hash: read_u64(sections.files.as_ref(), offset + 8)?,
            resource_kind: read_u8(sections.files.as_ref(), offset + 32)?,
            yaml_role: read_u8(sections.files.as_ref(), offset + 33)?,
            update_kind: read_u8(sections.files.as_ref(), offset + 34)?,
        });
    }
    source(
        strings,
        files,
        sections.facts.as_ref(),
        sections.diagnostics.as_ref(),
        true,
    )
}

fn source_from_fragment(fragment: ProjectStateFragmentSections) -> Result<Source> {
    let header = fragment.header.as_ref();
    if header.len() != 40
        || read_u32(header, 0)? != 0x4b44_4b4e
        || read_u32(header, 4)? != 0x4741_5246
        || read_u16(header, 8)? != 0
        || read_u16(header, 10)? != 5
        || read_u16(header, 12)? != 0
    {
        return invalid("Повреждён заголовок фрагмента ProjectState");
    }
    let file_count = usize_value(read_u32(header, 16)?)?;
    let string_count = usize_value(read_u32(header, 20)?)?;
    if usize_value(read_u32(header, 24)?)? != fragment.strings.len()
        || usize_value(read_u32(header, 28)?)? != fragment.files.len()
        || usize_value(read_u32(header, 32)?)? != fragment.facts.len()
        || usize_value(read_u32(header, 36)?)? != fragment.diagnostics.len()
        || fragment.files.len() != file_count.checked_mul(20).ok_or_else(overflow)?
    {
        return invalid("Размеры фрагмента ProjectState не совпадают с заголовком");
    }
    let bytes = fragment.strings.as_ref();
    if bytes.len() < 16 || usize_value(read_u32(bytes, 0)?)? != string_count {
        return invalid("Повреждён раздел строк фрагмента");
    }
    let records_offset = usize_value(read_u32(bytes, 4)?)?;
    let utf8_offset = usize_value(read_u32(bytes, 8)?)?;
    let utf8_length = usize_value(read_u32(bytes, 12)?)?;
    if records_offset != 16
        || utf8_offset != 16 + string_count * 16
        || utf8_offset + utf8_length != bytes.len()
    {
        return invalid("Повреждена таблица строк фрагмента");
    }
    let mut strings = Vec::with_capacity(string_count);
    let mut previous_end = 0;
    for id in 0..string_count {
        let record = records_offset + id * 16;
        let offset = usize_value(read_u32(bytes, record)?)?;
        let length = usize_value(read_u32(bytes, record + 4)?)?;
        if offset != previous_end || offset + length > utf8_length {
            return invalid("Строка фрагмента выходит за UTF-8 данные");
        }
        let value = bytes[utf8_offset + offset..utf8_offset + offset + length].to_vec();
        std::str::from_utf8(&value)
            .map_err(|_| Error::from_reason("Строка содержит неверный UTF-8"))?;
        strings.push(value);
        previous_end += length;
    }
    if previous_end != utf8_length {
        return invalid("UTF-8 данные фрагмента содержат лишние байты");
    }
    let mut files = Vec::with_capacity(file_count);
    for id in 0..file_count {
        let offset = id * 20;
        let file = FileRecord {
            project_path_id: read_u32(fragment.files.as_ref(), offset)?,
            component_path_id: read_u32(fragment.files.as_ref(), offset + 4)?,
            hash: read_u64(fragment.files.as_ref(), offset + 8)?,
            resource_kind: read_u8(fragment.files.as_ref(), offset + 16)?,
            yaml_role: read_u8(fragment.files.as_ref(), offset + 17)?,
            update_kind: read_u8(fragment.files.as_ref(), offset + 18)?,
        };
        if file.project_path_id as usize >= string_count
            || file.component_path_id as usize >= string_count
            || !(1..=2).contains(&file.resource_kind)
            || !(1..=2).contains(&file.update_kind)
        {
            return invalid("Файл фрагмента имеет неверные ссылки или вид");
        }
        files.push(file);
    }
    source(
        strings,
        files,
        fragment.facts.as_ref(),
        fragment.diagnostics.as_ref(),
        false,
    )
}

fn source(
    strings: Vec<Vec<u8>>,
    files: Vec<FileRecord>,
    facts: &[u8],
    diagnostics: &[u8],
    base_strings: bool,
) -> Result<Source> {
    let tables = parse_tables(facts)?;
    if diagnostics.len() < 8 || read_u32(diagnostics, 4)? != 8 {
        return invalid("Раздел диагностик оборван");
    }
    let diagnostic_count = usize_value(read_u32(diagnostics, 0)?)?;
    if diagnostics.len() != 8 + diagnostic_count * 24 {
        return invalid("Повреждён раздел диагностик");
    }
    let marks = tables
        .iter()
        .map(|table| vec![false; table.as_ref().map_or(0, |value| value.count)])
        .collect();
    let row_maps = tables
        .iter()
        .map(|table| vec![-1; table.as_ref().map_or(0, |value| value.count)])
        .collect();
    Ok(Source {
        string_map: vec![0; strings.len()],
        file_map: vec![-1; files.len()],
        strings,
        files,
        tables,
        diagnostics: diagnostics.to_vec(),
        marks,
        row_maps,
        diagnostic_marks: vec![false; diagnostic_count],
        diagnostic_map: vec![-1; diagnostic_count],
        base_strings,
    })
}

fn parse_tables(facts: &[u8]) -> Result<Vec<Option<Table>>> {
    if facts.len() < 8 || read_u32(facts, 4)? != 8 {
        return invalid("Раздел фактов оборван");
    }
    let count = usize_value(read_u32(facts, 0)?)?;
    let catalog_end = 8usize
        .checked_add(count.checked_mul(16).ok_or_else(overflow)?)
        .ok_or_else(overflow)?;
    if catalog_end > facts.len() {
        return invalid("Каталог фактов оборван");
    }
    let mut tables: Vec<Option<Table>> = (0..23).map(|_| None).collect();
    let mut previous_end = catalog_end;
    for index in 0..count {
        let record = 8 + index * 16;
        let kind = usize_value(read_u16(facts, record)? as u32)?;
        if kind == 0 || kind > 23 || tables[kind - 1].is_some() {
            return invalid("Неизвестная или повторная таблица фактов");
        }
        let offset = usize_value(read_u32(facts, record + 4)?)?;
        let records = usize_value(read_u32(facts, record + 8)?)?;
        let record_size = usize_value(read_u32(facts, record + 12)?)?;
        if record_size != FACT_SIZES[kind - 1] {
            return invalid("Неверный размер записи таблицы фактов");
        }
        let end = offset
            .checked_add(records.checked_mul(record_size).ok_or_else(overflow)?)
            .ok_or_else(overflow)?;
        if offset < previous_end || end > facts.len() {
            return invalid("Повреждён диапазон таблицы фактов");
        }
        tables[kind - 1] = Some(Table {
            rows: facts[offset..end].to_vec(),
            count: records,
        });
        previous_end = end;
    }
    if previous_end != facts.len() {
        return invalid("Раздел фактов содержит лишние байты");
    }
    Ok(tables)
}

fn select_files(sources: &mut [Source], deleted: &HashSet<String>) -> Result<Vec<(usize, usize)>> {
    let mut by_path = HashMap::<String, (usize, usize)>::new();
    for (source_id, source) in sources.iter().enumerate() {
        for (file_id, file) in source.files.iter().enumerate() {
            let path = string(source, file.project_path_id)?.to_owned();
            if !deleted.contains(&path) {
                by_path.insert(path, (source_id, file_id));
            }
        }
    }
    let mut values: Vec<(String, (usize, usize))> = by_path.into_iter().collect();
    values.sort_by(|left, right| compare_utf16(&left.0, &right.0));
    let candidates: Vec<(usize, usize)> = values.into_iter().map(|(_, value)| value).collect();
    for (new_id, &(source_id, file_id)) in candidates.iter().enumerate() {
        sources[source_id].file_map[file_id] = i32::try_from(new_id).map_err(|_| overflow())?;
    }
    Ok(candidates)
}

fn build_string_pool(sources: &mut [Source]) -> Result<Vec<Vec<u8>>> {
    let mut result = Vec::<Vec<u8>>::new();
    let mut ids = HashMap::<Vec<u8>, u32>::new();
    for source in sources {
        for id in 0..source.strings.len() {
            let value = source.strings[id].clone();
            let new_id = if source.base_strings {
                let expected = u32_len(result.len())?;
                result.push(value.clone());
                ids.entry(value).or_insert(expected);
                expected
            } else if let Some(existing) = ids.get(&value) {
                *existing
            } else {
                let next = u32_len(result.len())?;
                result.push(value.clone());
                ids.insert(value, next);
                next
            };
            source.string_map[id] = new_id;
        }
    }
    Ok(result)
}

fn mark_sources(sources: &mut [Source]) -> Result<()> {
    for source in sources {
        let mut stack = Vec::<(usize, usize)>::new();
        for &kind in &ROOT_TABLES {
            let table_id = kind - 1;
            if let Some(table) = &source.tables[table_id] {
                for id in 0..table.count {
                    let row = row(source, table_id, id)?;
                    let file_id = usize_value(read_u32(row, 0)?)?;
                    if file_id < source.file_map.len() && source.file_map[file_id] >= 0 {
                        stack.push((table_id, id));
                    }
                }
            }
        }
        while let Some((table_id, id)) = stack.pop() {
            if source.marks[table_id][id] {
                continue;
            }
            source.marks[table_id][id] = true;
            let bytes = row(source, table_id, id)?.to_vec();
            mark_children(source, table_id + 1, &bytes, &mut stack)?;
        }
    }
    Ok(())
}

fn mark_children(
    source: &mut Source,
    kind: usize,
    row: &[u8],
    stack: &mut Vec<(usize, usize)>,
) -> Result<()> {
    match kind {
        1 => {
            mark_diagnostics(source, row, 8, 12)?;
            mark_diagnostics(source, row, 16, 20)?;
        }
        2 => mark_reference(source, stack, row, 3, 8)?,
        3 => mark_reference(source, stack, row, 8, 0)?,
        4 => mark_reference(source, stack, row, 18, 4)?,
        5 => mark_range(source, stack, row, 6, 12, 16)?,
        6 => {
            mark_reference(source, stack, row, 11, 0)?;
            let value_kind = read_u16(row, 8)?;
            match value_kind {
                2 => mark_range(source, stack, row, 10, 16, 20)?,
                3 => mark_reference(source, stack, row, 21, 12)?,
                4 | 5 => mark_range(source, stack, row, 20, 16, 20)?,
                _ => {}
            }
        }
        20 => {
            mark_reference(source, stack, row, 6, 0)?;
            mark_reference(source, stack, row, 20, 4)?;
            mark_reference(source, stack, row, 21, 12)?;
        }
        7 => {
            mark_reference(source, stack, row, 11, 4)?;
            mark_reference(source, stack, row, 8, 24)?;
            mark_reference(source, stack, row, 12, 28)?;
        }
        8 => {
            mark_range(source, stack, row, 9, 0, 4)?;
            mark_range(source, stack, row, 11, 8, 12)?;
            mark_range(source, stack, row, 10, 16, 20)?;
            mark_reference(source, stack, row, 12, 24)?;
        }
        12 => mark_reference(source, stack, row, 11, 0)?,
        13 | 14 => {
            mark_reference(source, stack, row, 11, 4)?;
            mark_reference(source, stack, row, 8, 16)?;
            mark_reference(source, stack, row, 12, 20)?;
        }
        15 => {
            mark_reference(source, stack, row, 18, 4)?;
            mark_reference(source, stack, row, 11, 28)?;
            mark_range(source, stack, row, 16, 40, 44)?;
        }
        18 => mark_range(source, stack, row, 19, 0, 4)?,
        23 => mark_reference(source, stack, row, 18, 28)?,
        21 => {
            mark_range(source, stack, row, 22, 0, 4)?;
            mark_range(source, stack, row, 22, 8, 12)?;
        }
        _ => {}
    }
    Ok(())
}

fn mark_reference(
    source: &Source,
    stack: &mut Vec<(usize, usize)>,
    row: &[u8],
    table: usize,
    offset: usize,
) -> Result<()> {
    let id = read_u32(row, offset)?;
    if id != NONE {
        push_row(source, stack, table, usize_value(id)?)?;
    }
    Ok(())
}

fn mark_range(
    source: &Source,
    stack: &mut Vec<(usize, usize)>,
    row: &[u8],
    table: usize,
    start_offset: usize,
    count_offset: usize,
) -> Result<()> {
    let start = usize_value(read_u32(row, start_offset)?)?;
    let count = usize_value(read_u32(row, count_offset)?)?;
    for id in start..start.checked_add(count).ok_or_else(overflow)? {
        push_row(source, stack, table, id)?;
    }
    Ok(())
}

fn push_row(
    source: &Source,
    stack: &mut Vec<(usize, usize)>,
    table: usize,
    id: usize,
) -> Result<()> {
    let index = table - 1;
    if index >= source.tables.len() || id >= source.marks[index].len() {
        return invalid("Факт ссылается на неизвестную запись");
    }
    stack.push((index, id));
    Ok(())
}

fn mark_diagnostics(
    source: &mut Source,
    row: &[u8],
    start_offset: usize,
    count_offset: usize,
) -> Result<()> {
    let start = usize_value(read_u32(row, start_offset)?)?;
    let count = usize_value(read_u32(row, count_offset)?)?;
    let end = start.checked_add(count).ok_or_else(overflow)?;
    if end > source.diagnostic_marks.len() {
        return invalid("Факт ссылается на неизвестную диагностику");
    }
    source.diagnostic_marks[start..end].fill(true);
    Ok(())
}

fn assign_row_ids(sources: &mut [Source]) {
    for table_id in 0..23 {
        let mut next = 0;
        for source in sources.iter_mut() {
            for id in 0..source.marks[table_id].len() {
                if source.marks[table_id][id] {
                    source.row_maps[table_id][id] = next;
                    next += 1;
                }
            }
        }
    }
}

fn assign_diagnostic_ids(sources: &mut [Source]) {
    let mut next = 0;
    for source in sources {
        for id in 0..source.diagnostic_marks.len() {
            if source.diagnostic_marks[id] {
                source.diagnostic_map[id] = next;
                next += 1;
            }
        }
    }
}

fn intern_owner_keys(sources: &[Source], strings: &mut Vec<Vec<u8>>) -> Result<Vec<Vec<u32>>> {
    let mut ids: HashMap<Vec<u8>, u32> = strings
        .iter()
        .enumerate()
        .map(|(id, value)| (value.clone(), id as u32))
        .collect();
    let mut result = Vec::with_capacity(sources.len());
    for source in sources {
        let mut source_ids = vec![NONE; source.marks[4].len()];
        for (id, marked) in source.marks[4].iter().enumerate() {
            if !marked {
                continue;
            }
            let owner = row(source, 4, id)?;
            let kind = string(source, read_u32(owner, 4)?)?;
            let name_id = read_u32(owner, 8)?;
            let key = if name_id == NONE {
                format!("{}:{}-:", kind.encode_utf16().count(), kind)
            } else {
                let name = string(source, name_id)?;
                format!(
                    "{}:{}{}:{}",
                    kind.encode_utf16().count(),
                    kind,
                    name.encode_utf16().count(),
                    name
                )
            }
            .into_bytes();
            source_ids[id] = if let Some(existing) = ids.get(&key) {
                *existing
            } else {
                let next = u32_len(strings.len())?;
                strings.push(key.clone());
                ids.insert(key, next);
                next
            };
        }
        result.push(source_ids);
    }
    Ok(result)
}

fn pack_facts(sources: &[Source]) -> Result<Vec<u8>> {
    let counts: Vec<usize> = (0..23)
        .map(|table| {
            sources
                .iter()
                .map(|source| source.marks[table].iter().filter(|&&v| v).count())
                .sum()
        })
        .collect();
    let populated: Vec<usize> = (0..23).filter(|&table| counts[table] > 0).collect();
    let mut offsets = [0usize; 23];
    let mut length = 8 + populated.len() * 16;
    for &table in &populated {
        offsets[table] = length;
        length += counts[table] * FACT_SIZES[table];
    }
    let mut output = vec![0; length];
    write_u32(&mut output, 0, u32_len(populated.len())?);
    write_u32(&mut output, 4, 8);
    for (catalog_id, &table) in populated.iter().enumerate() {
        let record = 8 + catalog_id * 16;
        write_u16(&mut output, record, (table + 1) as u16);
        write_u32(&mut output, record + 4, u32_len(offsets[table])?);
        write_u32(&mut output, record + 8, u32_len(counts[table])?);
        write_u32(&mut output, record + 12, u32_len(FACT_SIZES[table])?);
        for source in sources {
            for id in 0..source.marks[table].len() {
                let mapped = source.row_maps[table][id];
                if mapped < 0 {
                    continue;
                }
                let mut bytes = row(source, table, id)?.to_vec();
                remap_row(source, table + 1, &mut bytes)?;
                let start = offsets[table] + mapped as usize * FACT_SIZES[table];
                output[start..start + FACT_SIZES[table]].copy_from_slice(&bytes);
            }
        }
    }
    Ok(output)
}

fn remap_row(source: &Source, kind: usize, row: &mut [u8]) -> Result<()> {
    let map_string = |row: &mut [u8], offset: usize| -> Result<()> {
        let old = read_u32(row, offset)?;
        if old != NONE {
            write_u32(row, offset, mapped(&source.string_map, old)?);
        }
        Ok(())
    };
    let map_file = |row: &mut [u8], offset: usize| -> Result<()> {
        let old = read_u32(row, offset)?;
        write_u32(row, offset, mapped_i32(&source.file_map, old)?);
        Ok(())
    };
    let map_ref = |row: &mut [u8], offset: usize, table: usize| -> Result<()> {
        let old = read_u32(row, offset)?;
        if old != NONE {
            write_u32(row, offset, mapped_i32(&source.row_maps[table - 1], old)?);
        }
        Ok(())
    };
    let map_range = |row: &mut [u8], start: usize, count: usize, table: usize| -> Result<()> {
        let old_count = read_u32(row, count)?;
        let value = if old_count == 0 {
            0
        } else {
            mapped_i32(&source.row_maps[table - 1], read_u32(row, start)?)?
        };
        write_u32(row, start, value);
        Ok(())
    };
    match kind {
        1 => {
            map_file(row, 0)?;
            map_diagnostic(source, row, 8, 12)?;
            map_diagnostic(source, row, 16, 20)?;
        }
        2 => {
            map_file(row, 0)?;
            for offset in [4, 12, 16] {
                map_string(row, offset)?;
            }
            map_ref(row, 8, 3)?;
        }
        3 => {
            map_ref(row, 0, 8)?;
            map_string(row, 4)?;
        }
        4 => {
            map_file(row, 0)?;
            map_ref(row, 4, 18)?;
            for offset in [8, 12, 16, 20, 24, 28] {
                map_string(row, offset)?;
            }
        }
        5 => {
            map_file(row, 0)?;
            map_string(row, 4)?;
            map_string(row, 8)?;
            map_range(row, 12, 16, 6)?;
        }
        6 => {
            map_ref(row, 0, 11)?;
            map_string(row, 4)?;
            match read_u16(row, 8)? {
                1 => map_string(row, 12)?,
                2 => map_range(row, 16, 20, 10)?,
                3 => map_ref(row, 12, 21)?,
                4 | 5 => map_range(row, 16, 20, 20)?,
                _ => {}
            }
        }
        20 => {
            map_ref(row, 0, 6)?;
            map_ref(row, 4, 20)?;
            map_string(row, 8)?;
            map_ref(row, 12, 21)?;
        }
        7 => {
            map_file(row, 0)?;
            map_ref(row, 4, 11)?;
            for offset in [8, 12, 16, 20] {
                map_string(row, offset)?;
            }
            map_ref(row, 24, 8)?;
            map_ref(row, 28, 12)?;
        }
        8 => {
            map_range(row, 0, 4, 9)?;
            map_range(row, 8, 12, 11)?;
            map_range(row, 16, 20, 10)?;
            map_ref(row, 24, 12)?;
            map_string(row, 28)?;
        }
        9 | 10 | 16 | 22 => map_string(row, 0)?,
        11 => {
            map_string(row, 0)?;
            map_string(row, 4)?;
        }
        12 => {
            map_ref(row, 0, 11)?;
            map_string(row, 4)?;
        }
        13 | 14 => {
            map_file(row, 0)?;
            map_ref(row, 4, 11)?;
            map_string(row, 8)?;
            map_string(row, 12)?;
            map_ref(row, 16, 8)?;
            map_ref(row, 20, 12)?;
        }
        15 => {
            map_file(row, 0)?;
            map_ref(row, 4, 18)?;
            for offset in [8, 12, 24, 32, 36, 48, 52] {
                map_string(row, offset)?;
            }
            map_ref(row, 28, 11)?;
            map_range(row, 40, 44, 16)?;
        }
        17 => {
            map_file(row, 0)?;
            map_string(row, 4)?;
        }
        18 => map_range(row, 0, 4, 19)?,
        19 => {
            if read_u8(row, 8)? == 1 {
                map_string(row, 0)?;
            }
        }
        21 => {
            map_range(row, 0, 4, 22)?;
            map_range(row, 8, 12, 22)?;
        }
        23 => {
            map_file(row, 0)?;
            for offset in [4, 8, 12, 16, 20, 24, 32] {
                map_string(row, offset)?;
            }
            map_ref(row, 28, 18)?;
        }
        _ => {}
    }
    Ok(())
}

fn map_diagnostic(source: &Source, row: &mut [u8], start: usize, count: usize) -> Result<()> {
    if read_u32(row, count)? > 0 {
        let mapped = mapped_i32(&source.diagnostic_map, read_u32(row, start)?)?;
        write_u32(row, start, mapped);
    } else {
        write_u32(row, start, 0);
    }
    Ok(())
}

fn pack_diagnostics(sources: &[Source]) -> Result<Vec<u8>> {
    let count: usize = sources
        .iter()
        .map(|source| {
            source
                .diagnostic_marks
                .iter()
                .filter(|&&value| value)
                .count()
        })
        .sum();
    let mut output = vec![0; 8 + count * 24];
    write_u32(&mut output, 0, u32_len(count)?);
    write_u32(&mut output, 4, 8);
    for source in sources {
        for old_id in 0..source.diagnostic_marks.len() {
            let new_id = source.diagnostic_map[old_id];
            if new_id < 0 {
                continue;
            }
            let mut row = source.diagnostics[8 + old_id * 24..8 + (old_id + 1) * 24].to_vec();
            let old_file_id = read_u32(&row, 0)?;
            write_u32(&mut row, 0, mapped_i32(&source.file_map, old_file_id)?);
            for offset in [12, 16] {
                let old = read_u32(&row, offset)?;
                if old != NONE {
                    write_u32(&mut row, offset, mapped(&source.string_map, old)?);
                }
            }
            let start = 8 + new_id as usize * 24;
            output[start..start + 24].copy_from_slice(&row);
        }
    }
    Ok(output)
}

fn pack_files(sources: &[Source], candidates: &[(usize, usize)]) -> Result<Vec<u8>> {
    let mut output = vec![0; 8 + candidates.len() * 36];
    write_u32(&mut output, 0, u32_len(candidates.len())?);
    write_u32(&mut output, 4, 8);
    for (new_id, &(source_id, file_id)) in candidates.iter().enumerate() {
        let source = &sources[source_id];
        let file = &source.files[file_id];
        let offset = 8 + new_id * 36;
        write_u32(
            &mut output,
            offset,
            mapped(&source.string_map, file.project_path_id)?,
        );
        write_u32(
            &mut output,
            offset + 4,
            mapped(&source.string_map, file.component_path_id)?,
        );
        write_u64(&mut output, offset + 8, file.hash);
        output[offset + 32] = file.resource_kind;
        output[offset + 33] = file.yaml_role;
        output[offset + 34] = file.update_kind;
    }
    Ok(output)
}

#[derive(Clone)]
struct TargetEntry {
    component: u32,
    canonical: u32,
    source_file: u32,
    item: u32,
    owner: u32,
    kind: u8,
}
#[derive(Clone)]
struct OwnerEntry {
    key: u32,
    source_file: u32,
}

fn pack_lookups(
    sources: &[Source],
    owner_keys: &[Vec<u32>],
    strings: &[Vec<u8>],
) -> Result<Vec<u8>> {
    let mut targets = Vec::<TargetEntry>::new();
    let mut owners = Vec::<OwnerEntry>::new();
    for (source_id, source) in sources.iter().enumerate() {
        for id in 0..source.marks[1].len() {
            if !source.marks[1][id] {
                continue;
            }
            let row = row(source, 1, id)?;
            let old_file = usize_value(read_u32(row, 0)?)?;
            targets.push(TargetEntry {
                component: mapped(&source.string_map, source.files[old_file].component_path_id)?,
                canonical: mapped(&source.string_map, read_u32(row, 4)?)?,
                source_file: mapped_i32(&source.file_map, old_file as u32)?,
                item: mapped_optional(&source.string_map, read_u32(row, 12)?)?,
                owner: mapped_optional(&source.string_map, read_u32(row, 16)?)?,
                kind: read_u8(row, 20)?,
            });
        }
        for (id, (&marked, &key)) in source.marks[4]
            .iter()
            .zip(&owner_keys[source_id])
            .enumerate()
        {
            if !marked {
                continue;
            }
            let row = row(source, 4, id)?;
            owners.push(OwnerEntry {
                key,
                source_file: mapped_i32(&source.file_map, read_u32(row, 0)?)?,
            });
        }
    }
    targets.sort_by(|a, b| {
        compare_string_ids(strings, a.component, b.component)
            .then_with(|| compare_string_ids(strings, a.canonical, b.canonical))
            .then_with(|| a.item.cmp(&b.item))
            .then_with(|| a.owner.cmp(&b.owner))
            .then_with(|| a.source_file.cmp(&b.source_file))
            .then_with(|| a.kind.cmp(&b.kind))
    });
    owners.sort_by(|a, b| {
        compare_string_ids(strings, a.key, b.key).then_with(|| a.source_file.cmp(&b.source_file))
    });
    let mut target_ranges = Vec::<(u32, u32, u32, u32)>::new();
    let mut start = 0;
    while start < targets.len() {
        let mut end = start + 1;
        while end < targets.len()
            && targets[end].component == targets[start].component
            && targets[end].canonical == targets[start].canonical
        {
            end += 1;
        }
        target_ranges.push((
            targets[start].component,
            targets[start].canonical,
            start as u32,
            (end - start) as u32,
        ));
        start = end;
    }
    let mut owner_ranges = Vec::<(u32, u32, u32)>::new();
    start = 0;
    while start < owners.len() {
        let mut end = start + 1;
        while end < owners.len() && owners[end].key == owners[start].key {
            end += 1;
        }
        owner_ranges.push((owners[start].key, start as u32, (end - start) as u32));
        start = end;
    }
    let target_hashes: Vec<u64> = target_ranges
        .iter()
        .map(|(component, canonical, _, _)| {
            target_key_hash(
                bytes_as_str(&strings[*component as usize]),
                bytes_as_str(&strings[*canonical as usize]),
            )
        })
        .collect();
    let owner_hashes: Vec<u64> = owner_ranges
        .iter()
        .map(|(key, _, _)| target_key_hash("owner", bytes_as_str(&strings[*key as usize])))
        .collect();
    let target_index = hash_index(&target_hashes)?;
    let owner_index = hash_index(&owner_hashes)?;
    let entries_offset = 56;
    let ranges_offset = entries_offset + targets.len() * 24;
    let index_offset = ranges_offset + target_ranges.len() * 16;
    let owner_entries_offset = index_offset + target_index.len();
    let owner_ranges_offset = owner_entries_offset + owners.len() * 8;
    let owner_index_offset = owner_ranges_offset + owner_ranges.len() * 16;
    let mut output = vec![0; owner_index_offset + owner_index.len()];
    for (offset, value) in [
        targets.len(),
        target_ranges.len(),
        entries_offset,
        ranges_offset,
        index_offset,
        target_ranges.len(),
        target_index.len() / 16,
        owners.len(),
        owner_ranges.len(),
        owner_entries_offset,
        owner_ranges_offset,
        owner_index_offset,
        owner_ranges.len(),
        owner_index.len() / 16,
    ]
    .into_iter()
    .enumerate()
    {
        write_u32(&mut output, offset * 4, u32_len(value)?);
    }
    for (id, target) in targets.iter().enumerate() {
        let offset = entries_offset + id * 24;
        for (field, value) in [
            target.component,
            target.canonical,
            target.source_file,
            target.item,
            target.owner,
        ]
        .into_iter()
        .enumerate()
        {
            write_u32(&mut output, offset + field * 4, value);
        }
        output[offset + 20] = target.kind;
    }
    for (id, (component, canonical, start, count)) in target_ranges.iter().enumerate() {
        let offset = ranges_offset + id * 16;
        for (field, value) in [*component, *canonical, *start, *count]
            .into_iter()
            .enumerate()
        {
            write_u32(&mut output, offset + field * 4, value);
        }
    }
    output[index_offset..index_offset + target_index.len()].copy_from_slice(&target_index);
    for (id, owner) in owners.iter().enumerate() {
        let offset = owner_entries_offset + id * 8;
        write_u32(&mut output, offset, owner.key);
        write_u32(&mut output, offset + 4, owner.source_file);
    }
    for (id, (key, start, count)) in owner_ranges.iter().enumerate() {
        let offset = owner_ranges_offset + id * 16;
        write_u32(&mut output, offset, *key);
        write_u32(&mut output, offset + 4, *start);
        write_u32(&mut output, offset + 8, *count);
    }
    output[owner_index_offset..].copy_from_slice(&owner_index);
    Ok(output)
}

fn pack_strings(strings: &[Vec<u8>]) -> Result<Vec<u8>> {
    let utf8_length: usize = strings.iter().map(Vec::len).sum();
    let capacity = hash_capacity(strings.len());
    let utf8_offset = 28 + strings.len() * 8;
    let lookup_offset = utf8_offset + utf8_length;
    let mut output = vec![0; lookup_offset + capacity * 16];
    for (offset, value) in [
        strings.len(),
        28,
        utf8_offset,
        utf8_length,
        lookup_offset,
        strings.len(),
        capacity,
    ]
    .into_iter()
    .enumerate()
    {
        write_u32(&mut output, offset * 4, u32_len(value)?);
    }
    let mut cursor = 0;
    let hashes: Vec<u64> = strings.iter().map(|value| xxh3_64(value)).collect();
    for (id, value) in strings.iter().enumerate() {
        write_u32(&mut output, 28 + id * 8, u32_len(cursor)?);
        write_u32(&mut output, 32 + id * 8, u32_len(value.len())?);
        output[utf8_offset + cursor..utf8_offset + cursor + value.len()].copy_from_slice(value);
        cursor += value.len();
    }
    let index = hash_index(&hashes)?;
    output[lookup_offset..].copy_from_slice(&index);
    Ok(output)
}

fn hash_index(hashes: &[u64]) -> Result<Vec<u8>> {
    let capacity = hash_capacity(hashes.len());
    let mut output = vec![0; capacity * 16];
    for (id, &hash) in hashes.iter().enumerate() {
        let mut slot = hash as usize & (capacity - 1);
        while output[slot * 16 + 12] != 0 {
            slot = (slot + 1) & (capacity - 1);
        }
        write_u64(&mut output, slot * 16, hash);
        write_u32(&mut output, slot * 16 + 8, u32_len(id)?);
        output[slot * 16 + 12] = 1;
    }
    Ok(output)
}
fn hash_capacity(size: usize) -> usize {
    let minimum = if size == 0 { 1 } else { (size * 5).div_ceil(4) };
    minimum.next_power_of_two()
}

fn pack_header(
    strings: usize,
    files: usize,
    facts: usize,
    lookups: usize,
    diagnostics: usize,
    file_count: usize,
    string_count: usize,
) -> Result<Vec<u8>> {
    let lengths = [strings, files, facts, lookups, diagnostics];
    let mut output = vec![0; 112];
    write_u32(&mut output, 0, 0x4b44_4b4e);
    write_u32(&mut output, 4, 0x5441_5453);
    write_u16(&mut output, 8, 0);
    write_u16(&mut output, 10, 5);
    write_u16(&mut output, 12, 0);
    write_u16(&mut output, 14, 5);
    write_u32(&mut output, 24, 112);
    let mut payload_offset = 112;
    for (id, &length) in lengths.iter().enumerate() {
        let offset = 32 + id * 16;
        write_u16(&mut output, offset, (id + 1) as u16);
        write_u32(&mut output, offset + 4, u32_len(payload_offset)?);
        write_u32(&mut output, offset + 8, u32_len(length)?);
        write_u32(
            &mut output,
            offset + 12,
            u32_len(if id == 0 {
                string_count
            } else if id == 1 {
                file_count
            } else {
                0
            })?,
        );
        payload_offset += length;
    }
    Ok(output)
}

fn row(source: &Source, table: usize, id: usize) -> Result<&[u8]> {
    let value = source.tables[table]
        .as_ref()
        .ok_or_else(|| Error::from_reason("Таблица фактов отсутствует"))?;
    if id >= value.count {
        return invalid("Неизвестная запись таблицы фактов");
    }
    let size = FACT_SIZES[table];
    Ok(&value.rows[id * size..(id + 1) * size])
}
fn string(source: &Source, id: u32) -> Result<&str> {
    let index = usize_value(id)?;
    let bytes = source
        .strings
        .get(index)
        .ok_or_else(|| Error::from_reason("Неизвестная строка"))?;
    std::str::from_utf8(bytes).map_err(|_| Error::from_reason("Строка содержит неверный UTF-8"))
}
fn mapped(map: &[u32], old: u32) -> Result<u32> {
    map.get(usize_value(old)?)
        .copied()
        .ok_or_else(|| Error::from_reason("Неизвестная строка"))
}
fn mapped_optional(map: &[u32], old: u32) -> Result<u32> {
    if old == NONE {
        Ok(NONE)
    } else {
        mapped(map, old)
    }
}
fn mapped_i32(map: &[i32], old: u32) -> Result<u32> {
    let value = *map
        .get(usize_value(old)?)
        .ok_or_else(|| Error::from_reason("Неизвестная ссылка"))?;
    if value < 0 {
        return invalid("Ссылка ведёт на удалённую запись");
    }
    Ok(value as u32)
}
fn compare_utf16(left: &str, right: &str) -> Ordering {
    left.encode_utf16().cmp(right.encode_utf16())
}
fn compare_string_ids(strings: &[Vec<u8>], left: u32, right: u32) -> Ordering {
    compare_utf16(
        bytes_as_str(&strings[left as usize]),
        bytes_as_str(&strings[right as usize]),
    )
}
fn bytes_as_str(value: &[u8]) -> &str {
    std::str::from_utf8(value).expect("строки проверены при чтении")
}
fn target_key_hash(component: &str, canonical: &str) -> u64 {
    let component_bytes = component.as_bytes();
    let mut bytes = Vec::with_capacity(4 + component_bytes.len() + canonical.len());
    bytes.extend_from_slice(&(component_bytes.len() as u32).to_le_bytes());
    bytes.extend_from_slice(component_bytes);
    bytes.extend_from_slice(canonical.as_bytes());
    xxh3_64(&bytes)
}

fn copy_exact(output: &mut Uint8Array, input: &[u8], name: &str) -> Result<()> {
    if output.len() != input.len() {
        return invalid(&format!("Неверный размер выходного раздела {name}"));
    } // SAFETY: writeInto синхронен, вызывающая сторона не обращается к выходному SAB до возврата.
    unsafe { output.as_mut() }.copy_from_slice(input);
    Ok(())
}
fn read_u8(bytes: &[u8], offset: usize) -> Result<u8> {
    bytes
        .get(offset)
        .copied()
        .ok_or_else(|| Error::from_reason("Двоичные данные оборваны"))
}
fn read_u16(bytes: &[u8], offset: usize) -> Result<u16> {
    let end = offset.checked_add(2).ok_or_else(overflow)?;
    let value = bytes
        .get(offset..end)
        .ok_or_else(|| Error::from_reason("Двоичные данные оборваны"))?;
    Ok(u16::from_le_bytes(value.try_into().unwrap()))
}
fn read_u32(bytes: &[u8], offset: usize) -> Result<u32> {
    let end = offset.checked_add(4).ok_or_else(overflow)?;
    let value = bytes
        .get(offset..end)
        .ok_or_else(|| Error::from_reason("Двоичные данные оборваны"))?;
    Ok(u32::from_le_bytes(value.try_into().unwrap()))
}
fn read_u64(bytes: &[u8], offset: usize) -> Result<u64> {
    let end = offset.checked_add(8).ok_or_else(overflow)?;
    let value = bytes
        .get(offset..end)
        .ok_or_else(|| Error::from_reason("Двоичные данные оборваны"))?;
    Ok(u64::from_le_bytes(value.try_into().unwrap()))
}
fn write_u16(bytes: &mut [u8], offset: usize, value: u16) {
    bytes[offset..offset + 2].copy_from_slice(&value.to_le_bytes())
}
fn write_u32(bytes: &mut [u8], offset: usize, value: u32) {
    bytes[offset..offset + 4].copy_from_slice(&value.to_le_bytes())
}
fn write_u64(bytes: &mut [u8], offset: usize, value: u64) {
    bytes[offset..offset + 8].copy_from_slice(&value.to_le_bytes())
}
fn usize_value(value: u32) -> Result<usize> {
    usize::try_from(value).map_err(|_| overflow())
}
fn u32_len(value: usize) -> Result<u32> {
    u32::try_from(value).map_err(|_| overflow())
}
fn overflow() -> Error {
    Error::from_reason("Переполнение размера ProjectState")
}
fn invalid<T>(message: &str) -> Result<T> {
    Err(Error::from_reason(message))
}
fn consumed_error() -> Error {
    Error::from_reason("PROJECT_STATE_PLAN_CONSUMED")
}
