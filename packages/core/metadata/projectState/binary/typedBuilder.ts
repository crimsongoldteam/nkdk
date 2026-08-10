import {
  assertProjectStateFactSection,
  PROJECT_STATE_FACT_RECORD_VIEWS,
  PROJECT_STATE_FACT_TABLE_IDS,
  PROJECT_STATE_FACT_TABLE_ORDER,
  type ProjectStateFactTableKind,
  type ProjectStateFactTableRange,
} from "./factTables"
import type { ProjectStateFragmentView } from "./fragment"
import { encodeProjectStateHeader, type ProjectStateSectionDescriptor } from "./format"
import { BinaryHashSlotRecordView, buildBinaryHashIndex } from "../../binary/hashIndex"
import {
  ProjectStateDiagnosticRecordView,
  ProjectStateDiagnosticSectionHeaderView,
  ProjectStateFactSectionHeaderView,
  ProjectStateFactTableRecordView,
  ProjectStateFileRecordView,
  ProjectStateFileSectionHeaderView,
  ProjectStateHeaderRecordView,
  ProjectStateLookupSectionHeaderView,
  ProjectStateOwnerEntryRecordView,
  ProjectStateOwnerRangeRecordView,
  ProjectStateSectionRecordView,
  ProjectStateTargetEntryRecordView,
  ProjectStateTargetRangeRecordView,
  type ProjectStateFileRecord,
  type ProjectStateOwnerEntryRecord,
  type ProjectStateOwnerRangeRecord,
  type ProjectStateTargetEntryRecord,
  type ProjectStateTargetRangeRecord,
} from "./layouts"
import { encodeBinaryOwnerKey } from "./ownerKey"
import {
  hashProjectStateTargetKey,
  ProjectStateSnapshotView,
  type ProjectStateSharedBuffers,
} from "./snapshot"
import { BinaryStringPoolBuilder, packBinaryStringPool, readBinaryString } from "./stringPool"

const NONE = 0xffff_ffff

const RECORDS = PROJECT_STATE_FACT_RECORD_VIEWS

interface Source {
  readonly facts: ArrayBufferLike
  readonly diagnostics: ArrayBufferLike
  readonly tables: ReadonlyMap<ProjectStateFactTableKind, ProjectStateFactTableRange>
  readonly fileCount: number
  readonly filePath: (fileId: number) => string
  readonly fileRecord: (fileId: number) => ProjectStateFileRecord
  readonly stringCount: number
  readonly stringValue: (id: number) => string
  readonly stringBytes?: (id: number) => Uint8Array
  readonly stringHash?: (id: number) => bigint
  readonly baseStrings: boolean
  fileMap: Int32Array
  stringMap: Uint32Array
  marks: Record<ProjectStateFactTableKind, Uint8Array>
  rowMaps: Record<ProjectStateFactTableKind, Int32Array>
  diagnosticMarks: Uint8Array
  diagnosticMap: Int32Array
}

interface FileCandidate {
  readonly source: Source
  readonly sourceFileId: number
  readonly path: string
}

export function buildTypedProjectStateSnapshot(input: {
  readonly base?: ProjectStateSharedBuffers
  readonly fragments: readonly ProjectStateFragmentView[]
  readonly deletions: readonly string[]
}): ProjectStateSharedBuffers {
  if (input.base !== undefined && input.fragments.length === 0 && input.deletions.length === 0) return input.base

  const baseView = input.base === undefined ? undefined : new ProjectStateSnapshotView(input.base)
  const sources = [
    ...(baseView === undefined ? [] : [sourceFromSnapshot(baseView)]),
    ...input.fragments.map(sourceFromFragment),
  ]
  const candidates = selectFiles(sources, new Set(input.deletions))
  candidates.forEach((candidate, fileId) => { candidate.source.fileMap[candidate.sourceFileId] = fileId })

  const strings = new BinaryStringPoolBuilder(baseView?.stringPool())
  for (const source of sources) {
    source.stringMap = new Uint32Array(source.stringCount)
    for (let id = 0; id < source.stringCount; id += 1) {
      source.stringMap[id] = source.baseStrings
        ? id
        : strings.internBytes(source.stringHash!(id), source.stringBytes!(id))
    }
  }

  sources.forEach(markReachableRows)
  assignRowIds(sources)
  assignDiagnosticIds(sources)
  const ownerKeyIds = internOwnerKeys(sources, strings)
  const stringPool = strings.finish()
  const facts = packFacts(sources)
  const diagnostics = packDiagnostics(sources)
  const files = packFiles(candidates)
  const lookups = packLookups(sources, ownerKeyIds, stringPool)
  const packedStrings = packBinaryStringPool(stringPool)
  assertProjectStateFactSection({ facts, diagnostics, fileCount: candidates.length, stringCount: stringPool.count })
  return assembleSnapshot({ strings: packedStrings, files, facts, lookups, diagnostics }, candidates.length, stringPool.count)
}

function sourceFromSnapshot(view: ProjectStateSnapshotView): Source {
  return createSource({
    facts: view.buffers.facts,
    diagnostics: view.buffers.diagnostics,
    tables: view.factTableCatalog(),
    fileCount: view.fileCount,
    filePath: (id) => view.filePath(id),
    fileRecord: (id) => view.fileRecord(id),
    stringCount: view.stringPool().count,
    stringValue: (id) => view.stringValue(id),
    baseStrings: true,
  })
}

function sourceFromFragment(fragment: ProjectStateFragmentView): Source {
  return createSource({
    facts: fragment.buffers.facts,
    diagnostics: fragment.buffers.diagnostics,
    tables: new Map(PROJECT_STATE_FACT_TABLE_ORDER.flatMap((kind) => {
      const range = fragment.tableRange(kind)
      return range === undefined ? [] : [[kind, range]]
    })),
    fileCount: fragment.fileCount,
    filePath: (id) => fragment.stringValue(fragment.fileRecord(id).projectPathId),
    fileRecord: (id) => ({
      ...fragment.fileRecord(id), factsOffset: 0, factsByteLength: 0,
      diagnosticsOffset: 0, diagnosticsByteLength: 0,
    }),
    stringCount: fragment.stringCount,
    stringValue: (id) => fragment.stringValue(id),
    stringBytes: (id) => fragment.stringBytes(id),
    stringHash: (id) => fragment.stringHash(id),
    baseStrings: false,
  })
}

function createSource(value: Omit<Source, "fileMap" | "stringMap" | "marks" | "rowMaps" | "diagnosticMarks" | "diagnosticMap">): Source {
  const diagnosticCount = ProjectStateDiagnosticSectionHeaderView.decode(new DataView(value.diagnostics)).count
  return {
    ...value,
    fileMap: filledMap(value.fileCount),
    stringMap: new Uint32Array(),
    marks: tableArrays(value.tables, (count) => new Uint8Array(count)),
    rowMaps: tableArrays(value.tables, filledMap),
    diagnosticMarks: new Uint8Array(diagnosticCount),
    diagnosticMap: filledMap(diagnosticCount),
  }
}

function tableArrays<T>(
  tables: ReadonlyMap<ProjectStateFactTableKind, ProjectStateFactTableRange>,
  create: (count: number) => T,
): Record<ProjectStateFactTableKind, T> {
  return Object.fromEntries(PROJECT_STATE_FACT_TABLE_ORDER.map((kind) => [kind, create(tables.get(kind)?.records ?? 0)])) as Record<ProjectStateFactTableKind, T>
}

function filledMap(count: number): Int32Array {
  const result = new Int32Array(count)
  result.fill(-1)
  return result
}

function selectFiles(sources: readonly Source[], deletions: ReadonlySet<string>): FileCandidate[] {
  const byPath = new Map<string, FileCandidate>()
  for (const source of sources) {
    for (let sourceFileId = 0; sourceFileId < source.fileCount; sourceFileId += 1) {
      const path = source.filePath(sourceFileId)
      if (!deletions.has(path)) byPath.set(path, { source, sourceFileId, path })
    }
  }
  return [...byPath.values()].sort((left, right) => left.path < right.path ? -1 : left.path > right.path ? 1 : 0)
}

function markReachableRows(source: Source): void {
  const roots: readonly ProjectStateFactTableKind[] = [
    "validationStatus", "targets", "pendingReferences", "owners", "fields",
    "forms", "formColumns", "pendingChecks", "dependencies",
    "structuredDocuments",
  ]
  for (const kind of roots) {
    const range = source.tables.get(kind)
    if (range === undefined) continue
    const codec = RECORDS[kind]
    const view = new DataView(source.facts)
    for (let id = 0; id < range.records; id += 1) {
      const row = codec.decode(view, range.byteOffset + id * codec.viewLength)
      if (source.fileMap[row.sourceFileId] >= 0) markRow(source, kind, id)
    }
  }
}

function markRow(source: Source, kind: ProjectStateFactTableKind, id: number): void {
  if (source.marks[kind][id] !== 0) return
  source.marks[kind][id] = 1
  const row = readRow(source, kind, id)
  const mark = (childKind: ProjectStateFactTableKind, childId: number) => {
    if (childId !== NONE) markRow(source, childKind, childId)
  }
  const markRange = (childKind: ProjectStateFactTableKind, start: number, count: number) => {
    for (let child = start; child < start + count; child += 1) markRow(source, childKind, child)
  }
  switch (kind) {
    case "validationStatus":
      markDiagnostics(source, row.diagnosticsStart, row.diagnosticsCount)
      markDiagnostics(source, row.schemaDiagnosticsStart, row.schemaDiagnosticsCount)
      break
    case "targets": mark("referenceDetails", row.detailsId); break
    case "referenceDetails": mark("typeInfo", row.typeInfoId); break
    case "pendingReferences": mark("yamlPaths", row.yamlPathId); break
    case "owners": markRange("ownerFacts", row.factsStart, row.factsCount); break
    case "ownerFacts":
      mark("ownerTypes", row.ownerId)
      if (row.valueKind === 2) markRange("definedTypes", row.itemsStart, row.itemsCount)
      if (row.valueKind === 3) mark("typeDescriptions", row.valueId)
      if (row.valueKind === 4 || row.valueKind === 5) markRange("ownerFactItems", row.itemsStart, row.itemsCount)
      break
    case "ownerFactItems":
      mark("ownerFacts", row.ownerFactId)
      mark("ownerFactItems", row.parentItemId)
      mark("typeDescriptions", row.typeDescriptionId)
      break
    case "fields":
      mark("ownerTypes", row.ownerId); mark("typeInfo", row.typeInfoId); mark("tableInfo", row.tableInfoId)
      break
    case "typeInfo":
      markRange("typeKinds", row.kindsStart, row.kindsCount)
      markRange("ownerTypes", row.nextTypesStart, row.nextTypesCount)
      markRange("definedTypes", row.definedTypesStart, row.definedTypesCount)
      mark("tableInfo", row.tableInfoId)
      break
    case "tableInfo": mark("ownerTypes", row.ownerTypeId); break
    case "forms": case "formColumns":
      mark("ownerTypes", row.ownerTypeId); mark("typeInfo", row.typeInfoId); mark("tableInfo", row.tableInfoId)
      break
    case "pendingChecks":
      mark("yamlPaths", row.yamlPathId); mark("ownerTypes", row.ownerTypeId)
      markRange("allowedKinds", row.allowedKindsStart, row.allowedKindsCount)
      break
    case "yamlPaths": markRange("yamlPathSegments", row.segmentsStart, row.segmentsCount); break
    case "structuredDocuments": mark("yamlPaths", row.yamlPathId); break
    case "typeDescriptions":
      markRange("typeDescriptionValues", row.typesStart, row.typesCount)
      markRange("typeDescriptionValues", row.typeIdsStart, row.typeIdsCount)
      break
  }
}

function markDiagnostics(source: Source, start: number, count: number): void {
  source.diagnosticMarks.fill(1, start, start + count)
}

function readRow(source: Source, kind: ProjectStateFactTableKind, id: number): Record<string, number> {
  const range = source.tables.get(kind)
  if (range === undefined || id < 0 || id >= range.records) throw new Error(`Неизвестная запись ${kind}: ${id}`)
  const codec = RECORDS[kind]
  return codec.decode(new DataView(source.facts), range.byteOffset + id * codec.viewLength)
}

function assignRowIds(sources: readonly Source[]): void {
  for (const kind of PROJECT_STATE_FACT_TABLE_ORDER) {
    let next = 0
    for (const source of sources) {
      for (let id = 0; id < source.marks[kind].length; id += 1) {
        if (source.marks[kind][id] !== 0) source.rowMaps[kind][id] = next++
      }
    }
  }
}

function assignDiagnosticIds(sources: readonly Source[]): void {
  let next = 0
  for (const source of sources) {
    for (let id = 0; id < source.diagnosticMarks.length; id += 1) {
      if (source.diagnosticMarks[id] !== 0) source.diagnosticMap[id] = next++
    }
  }
}

function packFacts(sources: readonly Source[]): SharedArrayBuffer {
  const counts = new Map(PROJECT_STATE_FACT_TABLE_ORDER.map((kind) => [
    kind,
    sources.reduce((sum, source) => sum + countMarked(source.marks[kind]), 0),
  ]))
  const kinds = PROJECT_STATE_FACT_TABLE_ORDER.filter((kind) => counts.get(kind)! > 0)
  const catalogOffset = ProjectStateFactSectionHeaderView.viewLength
  let offset = catalogOffset + kinds.length * ProjectStateFactTableRecordView.viewLength
  const offsets = new Map<ProjectStateFactTableKind, number>()
  for (const kind of kinds) {
    offsets.set(kind, offset)
    offset += counts.get(kind)! * RECORDS[kind].viewLength
  }
  const buffer = new SharedArrayBuffer(offset)
  const view = new DataView(buffer)
  ProjectStateFactSectionHeaderView.encode({ tableCount: kinds.length, catalogOffset }, view)
  kinds.forEach((kind, catalogId) => {
    const codec = RECORDS[kind]
    ProjectStateFactTableRecordView.encode({
      kind: PROJECT_STATE_FACT_TABLE_IDS[kind], reserved: 0, offset: offsets.get(kind)!,
      records: counts.get(kind)!, recordByteLength: codec.viewLength,
    }, view, catalogOffset + catalogId * ProjectStateFactTableRecordView.viewLength)
    for (const source of sources) {
      for (let oldId = 0; oldId < source.marks[kind].length; oldId += 1) {
        const newId = source.rowMaps[kind][oldId]
        if (newId >= 0) codec.encode(remapRow(source, kind, readRow(source, kind, oldId)), view, offsets.get(kind)! + newId * codec.viewLength)
      }
    }
  })
  return buffer
}

function remapRow(source: Source, kind: ProjectStateFactTableKind, original: Record<string, number>): Record<string, number> {
  const row = { ...original }
  const string = (...fields: string[]) => fields.forEach((field) => { if (row[field] !== NONE) row[field] = source.stringMap[row[field]] })
  const file = () => { row.sourceFileId = source.fileMap[row.sourceFileId] }
  const ref = (field: string, table: ProjectStateFactTableKind) => { if (row[field] !== NONE) row[field] = source.rowMaps[table][row[field]] }
  const range = (start: string, count: string, table: ProjectStateFactTableKind) => {
    row[start] = row[count] > 0 ? source.rowMaps[table][row[start]] : 0
  }
  switch (kind) {
    case "validationStatus": file()
      row.diagnosticsStart = row.diagnosticsCount > 0 ? source.diagnosticMap[original.diagnosticsStart] : 0
      row.schemaDiagnosticsStart = row.schemaDiagnosticsCount > 0
        ? source.diagnosticMap[original.schemaDiagnosticsStart] : 0
      break
    case "targets":
      file()
      string("canonicalId", "itemProjectPathId", "ownerProjectPathId")
      ref("detailsId", "referenceDetails")
      break
    case "referenceDetails": ref("typeInfoId", "typeInfo"); string("sourceTextId"); break
    case "pendingReferences": file(); ref("yamlPathId", "yamlPaths"); string("canonicalId", "targetKindId", "targetRootId", "targetNameId", "targetMemberId", "constraintKindId"); break
    case "owners": file(); string("kindId", "nameId"); range("factsStart", "factsCount", "ownerFacts"); break
    case "ownerFacts":
      ref("ownerId", "ownerTypes"); string("roleId")
      if (row.valueKind === 1) string("valueId")
      if (row.valueKind === 2) range("itemsStart", "itemsCount", "definedTypes")
      if (row.valueKind === 3) ref("valueId", "typeDescriptions")
      if (row.valueKind === 4 || row.valueKind === 5) range("itemsStart", "itemsCount", "ownerFactItems")
      break
    case "ownerFactItems": ref("ownerFactId", "ownerFacts"); ref("parentItemId", "ownerFactItems"); string("nameId"); ref("typeDescriptionId", "typeDescriptions"); break
    case "fields": file(); ref("ownerId", "ownerTypes"); string("nameId", "targetNameId", "sourceCollectionId", "parentNameId"); ref("typeInfoId", "typeInfo"); ref("tableInfoId", "tableInfo"); break
    case "typeInfo": range("kindsStart", "kindsCount", "typeKinds"); range("nextTypesStart", "nextTypesCount", "ownerTypes"); range("definedTypesStart", "definedTypesCount", "definedTypes"); ref("tableInfoId", "tableInfo"); string("sourceTextId"); break
    case "typeKinds": case "definedTypes": case "allowedKinds": case "typeDescriptionValues": string("valueId"); break
    case "ownerTypes": string("kindId", "nameId"); break
    case "tableInfo": ref("ownerTypeId", "ownerTypes"); string("nameId"); break
    case "forms": case "formColumns": file(); ref("ownerTypeId", "ownerTypes"); string("nameId", "tablePathId"); ref("typeInfoId", "typeInfo"); ref("tableInfoId", "tableInfo"); break
    case "pendingChecks": file(); ref("yamlPathId", "yamlPaths"); string("kindId", "payloadId", "pathId", "valueId", "policyYamlId", "elementTypeId", "tableContextId"); ref("ownerTypeId", "ownerTypes"); range("allowedKindsStart", "allowedKindsCount", "allowedKinds"); break
    case "dependencies": file(); string("projectPathId"); break
    case "structuredDocuments":
      file()
      string("documentKindId", "representationId", "logicalAddressId", "workingProjectPathId", "componentKindId", "nameId", "payloadId")
      ref("yamlPathId", "yamlPaths")
      break
    case "yamlPaths": range("segmentsStart", "segmentsCount", "yamlPathSegments"); break
    case "yamlPathSegments": if (row.kind === 1) string("stringId"); break
    case "typeDescriptions": range("typesStart", "typesCount", "typeDescriptionValues"); range("typeIdsStart", "typeIdsCount", "typeDescriptionValues"); break
  }
  return row
}

function countMarked(marks: Uint8Array): number {
  let count = 0
  for (const mark of marks) count += mark
  return count
}

function packDiagnostics(sources: readonly Source[]): SharedArrayBuffer {
  const count = sources.reduce((sum, source) => sum + countMarked(source.diagnosticMarks), 0)
  const recordsOffset = ProjectStateDiagnosticSectionHeaderView.viewLength
  const buffer = new SharedArrayBuffer(recordsOffset + count * ProjectStateDiagnosticRecordView.viewLength)
  const view = new DataView(buffer)
  ProjectStateDiagnosticSectionHeaderView.encode({ count, recordsOffset }, view)
  for (const source of sources) {
    const inputHeader = ProjectStateDiagnosticSectionHeaderView.decode(new DataView(source.diagnostics))
    const inputView = new DataView(source.diagnostics)
    for (let oldId = 0; oldId < source.diagnosticMarks.length; oldId += 1) {
      const newId = source.diagnosticMap[oldId]
      if (newId < 0) continue
      const row = ProjectStateDiagnosticRecordView.decode(inputView, inputHeader.recordsOffset + oldId * ProjectStateDiagnosticRecordView.viewLength)
      ProjectStateDiagnosticRecordView.encode({
        ...row, sourceFileId: source.fileMap[row.sourceFileId], messageId: source.stringMap[row.messageId],
        pathId: row.pathId === NONE ? NONE : source.stringMap[row.pathId],
      }, view, recordsOffset + newId * ProjectStateDiagnosticRecordView.viewLength)
    }
  }
  return buffer
}

function packFiles(candidates: readonly FileCandidate[]): SharedArrayBuffer {
  const recordsOffset = ProjectStateFileSectionHeaderView.viewLength
  const buffer = new SharedArrayBuffer(recordsOffset + candidates.length * ProjectStateFileRecordView.viewLength)
  const view = new DataView(buffer)
  ProjectStateFileSectionHeaderView.encode({ count: candidates.length, recordsOffset }, view)
  candidates.forEach(({ source, sourceFileId }, fileId) => {
    const record = source.fileRecord(sourceFileId)
    ProjectStateFileRecordView.encode({
      ...record, projectPathId: source.stringMap[record.projectPathId], componentPathId: source.stringMap[record.componentPathId],
      factsOffset: 0, factsByteLength: 0, diagnosticsOffset: 0, diagnosticsByteLength: 0,
    }, view, recordsOffset + fileId * ProjectStateFileRecordView.viewLength)
  })
  return buffer
}

function internOwnerKeys(
  sources: readonly Source[],
  strings: BinaryStringPoolBuilder,
): ReadonlyMap<Source, Uint32Array> {
  const result = new Map<Source, Uint32Array>()
  for (const source of sources) {
    const ids = new Uint32Array(source.marks.owners.length)
    ids.fill(NONE)
    forMarked(source, "owners", (row, id) => {
      ids[id] = strings.intern(encodeBinaryOwnerKey({
        kind: source.stringValue(row.kindId),
        ...(row.nameId === NONE ? {} : { name: source.stringValue(row.nameId) }),
      }))
    })
    result.set(source, ids)
  }
  return result
}

function packLookups(
  sources: readonly Source[],
  ownerKeyIds: ReadonlyMap<Source, Uint32Array>,
  strings: ReturnType<BinaryStringPoolBuilder["finish"]>,
): SharedArrayBuffer {
  const targetEntries: ProjectStateTargetEntryRecord[] = []
  const ownerEntries: ProjectStateOwnerEntryRecord[] = []
  for (const source of sources) {
    forMarked(source, "targets", (row) => targetEntries.push({
      componentPathId: source.stringMap[source.fileRecord(row.sourceFileId).componentPathId],
      canonicalId: source.stringMap[row.canonicalId], sourceFileId: source.fileMap[row.sourceFileId],
      itemProjectPathId: row.itemProjectPathId === NONE ? NONE : source.stringMap[row.itemProjectPathId],
      ownerProjectPathId: row.ownerProjectPathId === NONE ? NONE : source.stringMap[row.ownerProjectPathId],
      kind: row.kind, reserved8: 0, reserved16: 0,
    }))
    forMarked(source, "owners", (row, id) => {
      ownerEntries.push({ ownerKeyId: ownerKeyIds.get(source)![id], sourceFileId: source.fileMap[row.sourceFileId] })
    })
  }
  targetEntries.sort((left, right) => compareTarget(left, right, strings))
  ownerEntries.sort((left, right) => readBinaryString(strings, left.ownerKeyId).localeCompare(readBinaryString(strings, right.ownerKeyId)) || left.sourceFileId - right.sourceFileId)
  return encodeLookups(targetEntries, ownerEntries, strings)
}

function forMarked(
  source: Source,
  kind: ProjectStateFactTableKind,
  visit: (row: Record<string, number>, id: number) => void,
): void {
  for (let id = 0; id < source.marks[kind].length; id += 1) {
    if (source.marks[kind][id] !== 0) visit(readRow(source, kind, id), id)
  }
}

function compareTarget(left: ProjectStateTargetEntryRecord, right: ProjectStateTargetEntryRecord, strings: ReturnType<BinaryStringPoolBuilder["finish"]>): number {
  return readBinaryString(strings, left.componentPathId).localeCompare(readBinaryString(strings, right.componentPathId)) ||
    readBinaryString(strings, left.canonicalId).localeCompare(readBinaryString(strings, right.canonicalId)) ||
    left.itemProjectPathId - right.itemProjectPathId || left.ownerProjectPathId - right.ownerProjectPathId ||
    left.sourceFileId - right.sourceFileId || left.kind - right.kind
}

function encodeLookups(entries: readonly ProjectStateTargetEntryRecord[], ownerEntries: readonly ProjectStateOwnerEntryRecord[], strings: ReturnType<BinaryStringPoolBuilder["finish"]>): SharedArrayBuffer {
  const ranges: ProjectStateTargetRangeRecord[] = []
  for (let start = 0; start < entries.length;) {
    let end = start + 1
    while (end < entries.length && entries[end].componentPathId === entries[start].componentPathId && entries[end].canonicalId === entries[start].canonicalId) end += 1
    ranges.push({ componentPathId: entries[start].componentPathId, canonicalId: entries[start].canonicalId, start, count: end - start })
    start = end
  }
  const index = buildBinaryHashIndex(BigUint64Array.from(ranges, (range) => hashProjectStateTargetKey(readBinaryString(strings, range.componentPathId), readBinaryString(strings, range.canonicalId))), Uint32Array.from(ranges, (_, id) => id))
  const ownerRanges: ProjectStateOwnerRangeRecord[] = []
  for (let start = 0; start < ownerEntries.length;) {
    let end = start + 1
    while (end < ownerEntries.length && ownerEntries[end].ownerKeyId === ownerEntries[start].ownerKeyId) end += 1
    ownerRanges.push({ ownerKeyId: ownerEntries[start].ownerKeyId, start, count: end - start, reserved: 0 })
    start = end
  }
  const ownerIndex = buildBinaryHashIndex(BigUint64Array.from(ownerRanges, (range) => hashProjectStateTargetKey("owner", readBinaryString(strings, range.ownerKeyId))), Uint32Array.from(ownerRanges, (_, id) => id))
  const entriesOffset = ProjectStateLookupSectionHeaderView.viewLength
  const rangesOffset = entriesOffset + entries.length * ProjectStateTargetEntryRecordView.viewLength
  const indexOffset = rangesOffset + ranges.length * ProjectStateTargetRangeRecordView.viewLength
  const ownerEntriesOffset = indexOffset + index.capacity * BinaryHashSlotRecordView.viewLength
  const ownerRangesOffset = ownerEntriesOffset + ownerEntries.length * ProjectStateOwnerEntryRecordView.viewLength
  const ownerIndexOffset = ownerRangesOffset + ownerRanges.length * ProjectStateOwnerRangeRecordView.viewLength
  const buffer = new SharedArrayBuffer(ownerIndexOffset + ownerIndex.capacity * BinaryHashSlotRecordView.viewLength)
  const view = new DataView(buffer)
  ProjectStateLookupSectionHeaderView.encode({ targetEntryCount: entries.length, targetRangeCount: ranges.length, entriesOffset, rangesOffset, indexOffset, indexSize: index.size, indexCapacity: index.capacity, ownerEntryCount: ownerEntries.length, ownerRangeCount: ownerRanges.length, ownerEntriesOffset, ownerRangesOffset, ownerIndexOffset, ownerIndexSize: ownerIndex.size, ownerIndexCapacity: ownerIndex.capacity }, view)
  entries.forEach((row, id) => ProjectStateTargetEntryRecordView.encode(row, view, entriesOffset + id * ProjectStateTargetEntryRecordView.viewLength))
  ranges.forEach((row, id) => ProjectStateTargetRangeRecordView.encode(row, view, rangesOffset + id * ProjectStateTargetRangeRecordView.viewLength))
  new Uint8Array(buffer).set(new Uint8Array(index.slots, index.byteOffset ?? 0, index.capacity * BinaryHashSlotRecordView.viewLength), indexOffset)
  ownerEntries.forEach((row, id) => ProjectStateOwnerEntryRecordView.encode(row, view, ownerEntriesOffset + id * ProjectStateOwnerEntryRecordView.viewLength))
  ownerRanges.forEach((row, id) => ProjectStateOwnerRangeRecordView.encode(row, view, ownerRangesOffset + id * ProjectStateOwnerRangeRecordView.viewLength))
  new Uint8Array(buffer).set(new Uint8Array(ownerIndex.slots, ownerIndex.byteOffset ?? 0, ownerIndex.capacity * BinaryHashSlotRecordView.viewLength), ownerIndexOffset)
  return buffer
}

function assembleSnapshot(sections: Omit<ProjectStateSharedBuffers, "header">, fileCount: number, stringCount: number): ProjectStateSharedBuffers {
  const ordered = [sections.strings, sections.files, sections.facts, sections.lookups, sections.diagnostics] as const
  const kinds = ["strings", "files", "facts", "lookups", "diagnostics"] as const
  const headerByteLength = ProjectStateHeaderRecordView.viewLength + kinds.length * ProjectStateSectionRecordView.viewLength
  let offset = headerByteLength
  const descriptors: ProjectStateSectionDescriptor[] = kinds.map((kind, index) => {
    const descriptor = { kind, offset, byteLength: ordered[index].byteLength, records: kind === "strings" ? stringCount : kind === "files" ? fileCount : 0 }
    offset += descriptor.byteLength
    return descriptor
  })
  const encoded = encodeProjectStateHeader({ sections: descriptors, payloadHash: 0n })
  const header = new SharedArrayBuffer(encoded.byteLength)
  new Uint8Array(header).set(encoded)
  return { header, ...sections }
}
