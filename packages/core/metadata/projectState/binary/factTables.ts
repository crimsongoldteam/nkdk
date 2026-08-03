import {
  ProjectStateDependencyRecordView,
  ProjectStateDiagnosticRecordView,
  ProjectStateDiagnosticSectionHeaderView,
  ProjectStateFactSectionHeaderView,
  ProjectStateFactTableRecordView,
  ProjectStateFieldRecordView,
  ProjectStateFormRecordView,
  ProjectStateOwnerFactRecordView,
  ProjectStateOwnerRecordView,
  ProjectStateOwnerTypeRecordView,
  ProjectStatePendingCheckRecordView,
  ProjectStatePendingReferenceRecordView,
  ProjectStateReferenceDetailsRecordView,
  ProjectStateReferenceRecordView,
  ProjectStateStringValueRecordView,
  ProjectStateTableInfoRecordView,
  ProjectStateTypeInfoRecordView,
  ProjectStateValidationStatusRecordView,
  ProjectStateYamlPathRecordView,
  ProjectStateYamlPathSegmentRecordView,
} from "./layouts"

export type ProjectStateFactTableKind =
  | "validationStatus"
  | "references"
  | "referenceDetails"
  | "pendingReferences"
  | "owners"
  | "ownerFacts"
  | "fields"
  | "typeInfo"
  | "typeKinds"
  | "definedTypes"
  | "ownerTypes"
  | "tableInfo"
  | "forms"
  | "formColumns"
  | "pendingChecks"
  | "allowedKinds"
  | "dependencies"
  | "yamlPaths"
  | "yamlPathSegments"

export const PROJECT_STATE_FACT_TABLE_IDS: Readonly<Record<ProjectStateFactTableKind, number>> = {
  validationStatus: 1,
  references: 2,
  referenceDetails: 3,
  pendingReferences: 4,
  owners: 5,
  ownerFacts: 6,
  fields: 7,
  typeInfo: 8,
  typeKinds: 9,
  definedTypes: 10,
  ownerTypes: 11,
  tableInfo: 12,
  forms: 13,
  formColumns: 14,
  pendingChecks: 15,
  allowedKinds: 16,
  dependencies: 17,
  yamlPaths: 18,
  yamlPathSegments: 19,
}

export interface ProjectStateFactTableRange {
  readonly byteOffset: number
  readonly byteLength: number
  readonly records: number
}

const NONE = 0xffff_ffff
const FACT_TABLE_KINDS = new Map<number, ProjectStateFactTableKind>(
  Object.entries(PROJECT_STATE_FACT_TABLE_IDS).map(([kind, id]) => [id, kind as ProjectStateFactTableKind]),
)
const RECORD_BYTE_LENGTHS: Readonly<Record<ProjectStateFactTableKind, number>> = {
  validationStatus: ProjectStateValidationStatusRecordView.viewLength,
  references: ProjectStateReferenceRecordView.viewLength,
  referenceDetails: ProjectStateReferenceDetailsRecordView.viewLength,
  pendingReferences: ProjectStatePendingReferenceRecordView.viewLength,
  owners: ProjectStateOwnerRecordView.viewLength,
  ownerFacts: ProjectStateOwnerFactRecordView.viewLength,
  fields: ProjectStateFieldRecordView.viewLength,
  typeInfo: ProjectStateTypeInfoRecordView.viewLength,
  typeKinds: ProjectStateStringValueRecordView.viewLength,
  definedTypes: ProjectStateStringValueRecordView.viewLength,
  ownerTypes: ProjectStateOwnerTypeRecordView.viewLength,
  tableInfo: ProjectStateTableInfoRecordView.viewLength,
  forms: ProjectStateFormRecordView.viewLength,
  formColumns: ProjectStateFormRecordView.viewLength,
  pendingChecks: ProjectStatePendingCheckRecordView.viewLength,
  allowedKinds: ProjectStateStringValueRecordView.viewLength,
  dependencies: ProjectStateDependencyRecordView.viewLength,
  yamlPaths: ProjectStateYamlPathRecordView.viewLength,
  yamlPathSegments: ProjectStateYamlPathSegmentRecordView.viewLength,
}

export function assertProjectStateFactSection(params: {
  readonly facts: ArrayBufferLike
  readonly diagnostics: ArrayBufferLike
  readonly fileCount: number
  readonly stringCount: number
}): void {
  assertCount(params.fileCount, "fileCount")
  assertCount(params.stringCount, "stringCount")
  const tables = openFactCatalog(params.facts)
  const diagnosticCount = assertDiagnostics(params.diagnostics, params.fileCount, params.stringCount)
  validateFactRows({ ...params, tables, diagnosticCount })
}

function openFactCatalog(facts: ArrayBufferLike): ReadonlyMap<ProjectStateFactTableKind, ProjectStateFactTableRange> {
  if (facts.byteLength < ProjectStateFactSectionHeaderView.viewLength) {
    throw new Error("Раздел фактов оборван")
  }
  const view = new DataView(facts)
  const header = ProjectStateFactSectionHeaderView.decode(view)
  if (header.catalogOffset !== ProjectStateFactSectionHeaderView.viewLength) {
    throw new Error("Неверное смещение каталога фактов")
  }
  const catalogEnd = header.catalogOffset + header.tableCount * ProjectStateFactTableRecordView.viewLength
  if (catalogEnd > facts.byteLength) throw new Error("Каталог фактов оборван")

  const result = new Map<ProjectStateFactTableKind, ProjectStateFactTableRange>()
  let previousEnd = catalogEnd
  for (let index = 0; index < header.tableCount; index += 1) {
    const record = ProjectStateFactTableRecordView.decode(
      view,
      header.catalogOffset + index * ProjectStateFactTableRecordView.viewLength,
    )
    const kind = FACT_TABLE_KINDS.get(record.kind)
    if (kind === undefined) throw new Error(`Неизвестная таблица фактов: ${record.kind}`)
    if (result.has(kind)) throw new Error(`Таблица фактов ${kind} повторяется`)
    if (record.recordByteLength !== RECORD_BYTE_LENGTHS[kind]) {
      throw new Error(`Неверный размер записи таблицы ${kind}`)
    }
    const byteLength = record.records * record.recordByteLength
    const end = record.offset + byteLength
    if (!Number.isSafeInteger(end) || record.offset < previousEnd || end > facts.byteLength) {
      throw new Error(`Повреждён диапазон таблицы ${kind}`)
    }
    result.set(kind, { byteOffset: record.offset, byteLength, records: record.records })
    previousEnd = end
  }
  if (previousEnd !== facts.byteLength) throw new Error("Раздел фактов содержит незарегистрированные байты")
  return result
}

function assertDiagnostics(diagnostics: ArrayBufferLike, fileCount: number, stringCount: number): number {
  if (diagnostics.byteLength < ProjectStateDiagnosticSectionHeaderView.viewLength) {
    throw new Error("Раздел диагностик оборван")
  }
  const view = new DataView(diagnostics)
  const header = ProjectStateDiagnosticSectionHeaderView.decode(view)
  const expectedLength = header.recordsOffset + header.count * ProjectStateDiagnosticRecordView.viewLength
  if (
    header.recordsOffset !== ProjectStateDiagnosticSectionHeaderView.viewLength ||
    expectedLength !== diagnostics.byteLength
  ) {
    throw new Error("Повреждён раздел диагностик")
  }
  for (let index = 0; index < header.count; index += 1) {
    const record = ProjectStateDiagnosticRecordView.decode(
      view,
      header.recordsOffset + index * ProjectStateDiagnosticRecordView.viewLength,
    )
    assertFileId(record.sourceFileId, fileCount, "diagnostic.sourceFileId")
    assertStringId(record.messageId, stringCount, "diagnostic.messageId")
    assertOptionalStringId(record.pathId, stringCount, "diagnostic.pathId")
    if (record.severity < 1 || record.severity > 2) throw new Error("Неизвестная важность диагностики")
    if (record.source < 1 || record.source > 5) throw new Error("Неизвестный источник диагностики")
  }
  return header.count
}

function validateFactRows(params: {
  readonly facts: ArrayBufferLike
  readonly fileCount: number
  readonly stringCount: number
  readonly diagnosticCount: number
  readonly tables: ReadonlyMap<ProjectStateFactTableKind, ProjectStateFactTableRange>
}): void {
  const view = new DataView(params.facts)
  forEachRecord(params.tables.get("validationStatus"), ProjectStateValidationStatusRecordView, view, (record) => {
    assertFileId(record.sourceFileId, params.fileCount, "validationStatus.sourceFileId")
    assertBoolean(record.contributedFacts, "validationStatus.contributedFacts")
    assertRange(record.diagnosticsStart, record.diagnosticsCount, params.diagnosticCount, "diagnostics")
    assertRange(record.schemaDiagnosticsStart, record.schemaDiagnosticsCount, params.diagnosticCount, "schemaDiagnostics")
  })
  forEachRecord(params.tables.get("references"), ProjectStateReferenceRecordView, view, (record) => {
    assertFileId(record.sourceFileId, params.fileCount, "reference.sourceFileId")
    assertStringId(record.canonicalId, params.stringCount, "reference.canonicalId")
    assertOptionalRowId(record.detailsId, params.tables.get("referenceDetails")?.records ?? 0, "reference.detailsId")
    if (record.kind < 1 || record.kind > 3) throw new Error("Неизвестный вид ссылки")
  })
  forEachRecord(params.tables.get("pendingReferences"), ProjectStatePendingReferenceRecordView, view, (record) => {
    assertFileId(record.sourceFileId, params.fileCount, "pendingReference.sourceFileId")
    assertRowId(record.yamlPathId, params.tables.get("yamlPaths")?.records ?? 0, "pendingReference.yamlPathId")
    for (const [field, id] of [
      ["canonicalId", record.canonicalId], ["targetKindId", record.targetKindId],
      ["targetRootId", record.targetRootId], ["targetNameId", record.targetNameId],
      ["targetMemberId", record.targetMemberId], ["constraintKindId", record.constraintKindId],
    ] as const) assertOptionalStringId(id, params.stringCount, `pendingReference.${field}`)
  })
  forEachRecord(params.tables.get("owners"), ProjectStateOwnerRecordView, view, (record) => {
    assertFileId(record.sourceFileId, params.fileCount, "owner.sourceFileId")
    assertStringId(record.kindId, params.stringCount, "owner.kindId")
    assertOptionalStringId(record.nameId, params.stringCount, "owner.nameId")
    assertRange(record.factsStart, record.factsCount, params.tables.get("ownerFacts")?.records ?? 0, "owner.facts")
  })
  validateRowsWithSourceFile(params, "fields", ProjectStateFieldRecordView)
  validateRowsWithSourceFile(params, "forms", ProjectStateFormRecordView)
  validateRowsWithSourceFile(params, "formColumns", ProjectStateFormRecordView)
  validateRowsWithSourceFile(params, "pendingChecks", ProjectStatePendingCheckRecordView)
  validateRowsWithSourceFile(params, "dependencies", ProjectStateDependencyRecordView)
  for (const kind of ["typeKinds", "definedTypes", "allowedKinds"] as const) {
    forEachRecord(params.tables.get(kind), ProjectStateStringValueRecordView, view, (record) => {
      assertStringId(record.valueId, params.stringCount, `${kind}.valueId`)
    })
  }
  forEachRecord(params.tables.get("ownerTypes"), ProjectStateOwnerTypeRecordView, view, (record) => {
    assertStringId(record.kindId, params.stringCount, "ownerType.kindId")
    assertOptionalStringId(record.nameId, params.stringCount, "ownerType.nameId")
  })
  forEachRecord(params.tables.get("yamlPaths"), ProjectStateYamlPathRecordView, view, (record) => {
    assertRange(
      record.segmentsStart,
      record.segmentsCount,
      params.tables.get("yamlPathSegments")?.records ?? 0,
      "yamlPath.segments",
    )
  })
  forEachRecord(params.tables.get("yamlPathSegments"), ProjectStateYamlPathSegmentRecordView, view, (record) => {
    if (record.kind !== 1 && record.kind !== 2) throw new Error("Неизвестный вид сегмента YAML-пути")
    if (record.kind === 1) assertStringId(record.stringId, params.stringCount, "yamlPathSegment.stringId")
  })
}

function validateRowsWithSourceFile<TRow extends { readonly sourceFileId: number }>(
  params: {
    readonly facts: ArrayBufferLike
    readonly fileCount: number
    readonly tables: ReadonlyMap<ProjectStateFactTableKind, ProjectStateFactTableRange>
  },
  kind: ProjectStateFactTableKind,
  recordView: RecordView<TRow>,
): void {
  forEachRecord(params.tables.get(kind), recordView, new DataView(params.facts), (record) => {
    assertFileId(record.sourceFileId, params.fileCount, `${kind}.sourceFileId`)
  })
}

interface RecordView<TRow> {
  readonly viewLength: number
  decode(view: DataView, offset?: number): TRow
}

function forEachRecord<TRow>(
  range: ProjectStateFactTableRange | undefined,
  recordView: RecordView<TRow>,
  view: DataView,
  visit: (record: TRow) => void,
): void {
  if (range === undefined) return
  for (let index = 0; index < range.records; index += 1) {
    visit(recordView.decode(view, range.byteOffset + index * recordView.viewLength))
  }
}

function assertCount(value: number, field: string): void {
  if (!Number.isSafeInteger(value) || value < 0) throw new Error(`${field} должен быть неотрицательным целым`)
}

function assertFileId(value: number, count: number, field: string): void {
  if (value >= count) throw new Error(`${field} выходит за число файлов`)
}

function assertStringId(value: number, count: number, field: string): void {
  if (value >= count) throw new Error(`${field} выходит за таблицу строк`)
}

function assertOptionalStringId(value: number, count: number, field: string): void {
  if (value !== NONE) assertStringId(value, count, field)
}

function assertRowId(value: number, count: number, field: string): void {
  if (value >= count) throw new Error(`${field} выходит за таблицу`)
}

function assertOptionalRowId(value: number, count: number, field: string): void {
  if (value !== NONE) assertRowId(value, count, field)
}

function assertRange(start: number, count: number, total: number, field: string): void {
  if (start > total || count > total - start) throw new Error(`${field} выходит за таблицу`)
}

function assertBoolean(value: number, field: string): void {
  if (value !== 0 && value !== 1) throw new Error(`${field} должен быть двоичным признаком`)
}
