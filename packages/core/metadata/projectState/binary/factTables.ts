import {
  ProjectStateDependencyRecordView,
  ProjectStateDiagnosticRecordView,
  ProjectStateDiagnosticSectionHeaderView,
  ProjectStateFactSectionHeaderView,
  ProjectStateFactTableRecordView,
  ProjectStateFieldRecordView,
  ProjectStateFormRecordView,
  ProjectStateStructuredDocumentRecordView,
  ProjectStateOwnerFactRecordView,
  ProjectStateOwnerFactItemRecordView,
  ProjectStateOwnerRecordView,
  ProjectStateOwnerTypeRecordView,
  ProjectStatePendingCheckRecordView,
  ProjectStatePendingReferenceRecordView,
  ProjectStateReferenceDetailsRecordView,
  ProjectStateTargetRecordView,
  ProjectStateStringValueRecordView,
  ProjectStateTableInfoRecordView,
  ProjectStateTypeInfoRecordView,
  ProjectStateTypeDescriptionRecordView,
  ProjectStateValidationStatusRecordView,
  ProjectStateYamlPathRecordView,
  ProjectStateYamlPathSegmentRecordView,
} from "./layouts"

export type ProjectStateFactTableKind =
  | "validationStatus"
  | "targets"
  | "referenceDetails"
  | "pendingReferences"
  | "owners"
  | "ownerFacts"
  | "ownerFactItems"
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
  | "typeDescriptions"
  | "typeDescriptionValues"
  | "structuredDocuments"

export const PROJECT_STATE_FACT_TABLE_IDS: Readonly<Record<ProjectStateFactTableKind, number>> = {
  validationStatus: 1,
  targets: 2,
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
  ownerFactItems: 20,
  typeDescriptions: 21,
  typeDescriptionValues: 22,
  structuredDocuments: 23,
}

export interface ProjectStateFactTableRange {
  readonly byteOffset: number
  readonly byteLength: number
  readonly records: number
}

export const PROJECT_STATE_FACT_TABLE_ORDER = Object.freeze(
  Object.keys(PROJECT_STATE_FACT_TABLE_IDS) as ProjectStateFactTableKind[],
)

export interface ProjectStateFactRecordView {
  readonly viewLength: number
  decode(view: DataView, offset?: number): Record<string, number>
  encode(value: Record<string, number>, view: DataView, offset?: number): void
}

export const PROJECT_STATE_FACT_RECORD_VIEWS = {
  validationStatus: ProjectStateValidationStatusRecordView,
  targets: ProjectStateTargetRecordView,
  referenceDetails: ProjectStateReferenceDetailsRecordView,
  pendingReferences: ProjectStatePendingReferenceRecordView,
  owners: ProjectStateOwnerRecordView,
  ownerFacts: ProjectStateOwnerFactRecordView,
  ownerFactItems: ProjectStateOwnerFactItemRecordView,
  fields: ProjectStateFieldRecordView,
  typeInfo: ProjectStateTypeInfoRecordView,
  typeKinds: ProjectStateStringValueRecordView,
  definedTypes: ProjectStateStringValueRecordView,
  ownerTypes: ProjectStateOwnerTypeRecordView,
  tableInfo: ProjectStateTableInfoRecordView,
  forms: ProjectStateFormRecordView,
  formColumns: ProjectStateFormRecordView,
  pendingChecks: ProjectStatePendingCheckRecordView,
  allowedKinds: ProjectStateStringValueRecordView,
  dependencies: ProjectStateDependencyRecordView,
  yamlPaths: ProjectStateYamlPathRecordView,
  yamlPathSegments: ProjectStateYamlPathSegmentRecordView,
  typeDescriptions: ProjectStateTypeDescriptionRecordView,
  typeDescriptionValues: ProjectStateStringValueRecordView,
  structuredDocuments: ProjectStateStructuredDocumentRecordView,
} as unknown as Readonly<Record<ProjectStateFactTableKind, ProjectStateFactRecordView>>

const NONE = 0xffff_ffff
const FACT_TABLE_KINDS = new Map<number, ProjectStateFactTableKind>(
  Object.entries(PROJECT_STATE_FACT_TABLE_IDS).map(([kind, id]) => [id, kind as ProjectStateFactTableKind]),
)
const RECORD_BYTE_LENGTHS = Object.fromEntries(PROJECT_STATE_FACT_TABLE_ORDER.map((kind) => [
  kind,
  PROJECT_STATE_FACT_RECORD_VIEWS[kind].viewLength,
])) as Readonly<Record<ProjectStateFactTableKind, number>>

export function assertProjectStateFactSection(params: {
  readonly facts: ArrayBufferLike
  readonly diagnostics: ArrayBufferLike
  readonly fileCount: number
  readonly stringCount: number
}): void {
  assertCount(params.fileCount, "fileCount")
  assertCount(params.stringCount, "stringCount")
  const tables = openProjectStateFactCatalog(params.facts)
  const diagnosticCount = assertDiagnostics(params.diagnostics, params.fileCount, params.stringCount)
  validateFactRows({ ...params, tables, diagnosticCount })
}

export function openProjectStateFactCatalog(
  facts: ArrayBufferLike,
): ReadonlyMap<ProjectStateFactTableKind, ProjectStateFactTableRange> {
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
  forEachRecord(params.tables.get("targets"), ProjectStateTargetRecordView, view, (record) => {
    assertFileId(record.sourceFileId, params.fileCount, "target.sourceFileId")
    assertStringId(record.canonicalId, params.stringCount, "target.canonicalId")
    assertOptionalStringId(record.itemProjectPathId, params.stringCount, "target.itemProjectPathId")
    assertOptionalStringId(record.ownerProjectPathId, params.stringCount, "target.ownerProjectPathId")
    if ((record.itemProjectPathId === NONE) !== (record.ownerProjectPathId === NONE)) {
      throw new Error("Файловая цель должна содержать оба проектных пути")
    }
    assertOptionalRowId(record.detailsId, params.tables.get("referenceDetails")?.records ?? 0, "target.detailsId")
    if (record.kind < 1 || record.kind > 3) throw new Error("Неизвестный вид цели")
  })
  forEachRecord(params.tables.get("referenceDetails"), ProjectStateReferenceDetailsRecordView, view, (record) => {
    assertOptionalRowId(record.typeInfoId, params.tables.get("typeInfo")?.records ?? 0, "referenceDetails.typeInfoId")
    assertOptionalStringId(record.sourceTextId, params.stringCount, "referenceDetails.sourceTextId")
    if (record.kind > 2 || record.styleItemType > 3) throw new Error("Неизвестный вариант сведений ссылки")
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
  forEachRecord(params.tables.get("ownerFacts"), ProjectStateOwnerFactRecordView, view, (record) => {
    assertRowId(record.ownerId, params.tables.get("ownerTypes")?.records ?? 0, "ownerFact.ownerId")
    assertStringId(record.roleId, params.stringCount, "ownerFact.roleId")
    if (record.valueKind < 1 || record.valueKind > 5) throw new Error("Неизвестный вариант owner fact")
    if (record.valueKind === 1) assertStringId(record.valueId, params.stringCount, "ownerFact.valueId")
    if (record.valueKind === 2) {
      assertRange(record.itemsStart, record.itemsCount, params.tables.get("definedTypes")?.records ?? 0, "ownerFact.items")
    }
    if (record.valueKind === 3) {
      assertRowId(record.valueId, params.tables.get("typeDescriptions")?.records ?? 0, "ownerFact.typeDescriptionId")
    }
    if (record.valueKind === 4 || record.valueKind === 5) {
      assertRange(record.itemsStart, record.itemsCount, params.tables.get("ownerFactItems")?.records ?? 0, "ownerFact.items")
    }
  })
  forEachRecord(params.tables.get("fields"), ProjectStateFieldRecordView, view, (record) => {
    assertFileId(record.sourceFileId, params.fileCount, "field.sourceFileId")
    assertRowId(record.ownerId, params.tables.get("ownerTypes")?.records ?? 0, "field.ownerId")
    assertStringId(record.nameId, params.stringCount, "field.nameId")
    assertOptionalStringId(record.targetNameId, params.stringCount, "field.targetNameId")
    assertOptionalStringId(record.sourceCollectionId, params.stringCount, "field.sourceCollectionId")
    assertOptionalStringId(record.parentNameId, params.stringCount, "field.parentNameId")
    assertRowId(record.typeInfoId, params.tables.get("typeInfo")?.records ?? 0, "field.typeInfoId")
    assertOptionalRowId(record.tableInfoId, params.tables.get("tableInfo")?.records ?? 0, "field.tableInfoId")
    if (record.kind < 1 || record.kind > 6) throw new Error("Неизвестный вид поля")
    assertTernary(record.tableHasColumns, "field.tableHasColumns")
  })
  forEachRecord(params.tables.get("typeInfo"), ProjectStateTypeInfoRecordView, view, (record) => {
    assertRange(record.kindsStart, record.kindsCount, params.tables.get("typeKinds")?.records ?? 0, "typeInfo.kinds")
    assertRange(record.nextTypesStart, record.nextTypesCount, params.tables.get("ownerTypes")?.records ?? 0, "typeInfo.nextTypes")
    assertRange(record.definedTypesStart, record.definedTypesCount, params.tables.get("definedTypes")?.records ?? 0, "typeInfo.definedTypes")
    assertOptionalRowId(record.tableInfoId, params.tables.get("tableInfo")?.records ?? 0, "typeInfo.tableInfoId")
    assertOptionalStringId(record.sourceTextId, params.stringCount, "typeInfo.sourceTextId")
    assertTernary(record.isComposite, "typeInfo.isComposite")
  })
  for (const kind of ["typeKinds", "definedTypes", "allowedKinds", "typeDescriptionValues"] as const) {
    forEachRecord(params.tables.get(kind), ProjectStateStringValueRecordView, view, (record) => {
      assertStringId(record.valueId, params.stringCount, `${kind}.valueId`)
    })
  }
  forEachRecord(params.tables.get("ownerTypes"), ProjectStateOwnerTypeRecordView, view, (record) => {
    assertStringId(record.kindId, params.stringCount, "ownerType.kindId")
    assertOptionalStringId(record.nameId, params.stringCount, "ownerType.nameId")
  })
  forEachRecord(params.tables.get("tableInfo"), ProjectStateTableInfoRecordView, view, (record) => {
    assertOptionalRowId(record.ownerTypeId, params.tables.get("ownerTypes")?.records ?? 0, "tableInfo.ownerTypeId")
    assertOptionalStringId(record.nameId, params.stringCount, "tableInfo.nameId")
    if (record.kind < 1 || record.kind > 7) throw new Error("Неизвестный вид таблицы DataPath")
  })
  for (const kind of ["forms", "formColumns"] as const) {
    forEachRecord(params.tables.get(kind), ProjectStateFormRecordView, view, (record) => {
      assertFileId(record.sourceFileId, params.fileCount, `${kind}.sourceFileId`)
      assertRowId(record.ownerTypeId, params.tables.get("ownerTypes")?.records ?? 0, `${kind}.ownerTypeId`)
      assertStringId(record.nameId, params.stringCount, `${kind}.nameId`)
      assertOptionalStringId(record.tablePathId, params.stringCount, `${kind}.tablePathId`)
      if (record.kind === 3) {
        assertOptionalRowId(record.typeInfoId, params.tables.get("typeInfo")?.records ?? 0, `${kind}.typeInfoId`)
      } else {
        assertRowId(record.typeInfoId, params.tables.get("typeInfo")?.records ?? 0, `${kind}.typeInfoId`)
      }
      assertOptionalRowId(record.tableInfoId, params.tables.get("tableInfo")?.records ?? 0, `${kind}.tableInfoId`)
      if (kind === "forms" ? record.kind !== 1 : record.kind !== 2 && record.kind !== 3) {
        throw new Error(`Неверный вид записи ${kind}`)
      }
      assertTernary(record.tableHasColumns, `${kind}.tableHasColumns`)
    })
  }
  forEachRecord(params.tables.get("pendingChecks"), ProjectStatePendingCheckRecordView, view, (record) => {
    assertFileId(record.sourceFileId, params.fileCount, "pendingCheck.sourceFileId")
    assertRowId(record.yamlPathId, params.tables.get("yamlPaths")?.records ?? 0, "pendingCheck.yamlPathId")
    assertStringId(record.kindId, params.stringCount, "pendingCheck.kindId")
    assertOptionalStringId(record.payloadId, params.stringCount, "pendingCheck.payloadId")
    assertOptionalStringId(record.pathId, params.stringCount, "pendingCheck.pathId")
    assertOptionalRowId(record.ownerTypeId, params.tables.get("ownerTypes")?.records ?? 0, "pendingCheck.ownerTypeId")
    assertOptionalStringId(record.valueId, params.stringCount, "pendingCheck.valueId")
    assertOptionalStringId(record.policyYamlId, params.stringCount, "pendingCheck.policyYamlId")
    assertRange(record.allowedKindsStart, record.allowedKindsCount, params.tables.get("allowedKinds")?.records ?? 0, "pendingCheck.allowedKinds")
    assertOptionalStringId(record.elementTypeId, params.stringCount, "pendingCheck.elementTypeId")
    assertOptionalStringId(record.tableContextId, params.stringCount, "pendingCheck.tableContextId")
    assertTernary(record.allowComposite, "pendingCheck.allowComposite")
    assertTernary(record.hasValuesPicture, "pendingCheck.hasValuesPicture")
  })
  forEachRecord(params.tables.get("dependencies"), ProjectStateDependencyRecordView, view, (record) => {
    assertFileId(record.sourceFileId, params.fileCount, "dependency.sourceFileId")
    assertStringId(record.projectPathId, params.stringCount, "dependency.projectPathId")
  })
  forEachRecord(params.tables.get("structuredDocuments"), ProjectStateStructuredDocumentRecordView, view, (record) => {
    assertFileId(record.sourceFileId, params.fileCount, "structuredDocument.sourceFileId")
    for (const id of [record.documentKindId, record.representationId, record.logicalAddressId,
      record.workingProjectPathId, record.componentKindId, record.nameId]) {
      assertStringId(id, params.stringCount, "structuredDocument.stringId")
    }
    assertOptionalStringId(record.payloadId, params.stringCount, "structuredDocument.payloadId")
    assertRowId(record.yamlPathId, params.tables.get("yamlPaths")?.records ?? 0, "structuredDocument.yamlPathId")
  })
  forEachRecord(params.tables.get("ownerFactItems"), ProjectStateOwnerFactItemRecordView, view, (record) => {
    assertRowId(record.ownerFactId, params.tables.get("ownerFacts")?.records ?? 0, "ownerFactItem.ownerFactId")
    assertOptionalRowId(record.parentItemId, params.tables.get("ownerFactItems")?.records ?? 0, "ownerFactItem.parentItemId")
    assertStringId(record.nameId, params.stringCount, "ownerFactItem.nameId")
    assertOptionalRowId(
      record.typeDescriptionId,
      params.tables.get("typeDescriptions")?.records ?? 0,
      "ownerFactItem.typeDescriptionId",
    )
  })
  forEachRecord(params.tables.get("typeDescriptions"), ProjectStateTypeDescriptionRecordView, view, (record) => {
    const values = params.tables.get("typeDescriptionValues")?.records ?? 0
    assertRange(record.typesStart, record.typesCount, values, "typeDescription.types")
    assertRange(record.typeIdsStart, record.typeIdsCount, values, "typeDescription.typeIds")
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

function assertTernary(value: number, field: string): void {
  if (value < 0 || value > 2) throw new Error(`${field} должен быть трёхзначным признаком`)
}
