import { resolve } from "path"
import { getDataPathOwnerKind } from "./dataPath/registry"
import type { OwnerMetadataCache, OwnerMetadataResult } from "./dataPath/ownerCache"
import type { ObjectField, ObjectFieldIndex, ObjectFieldTableSource } from "./dataPath/objectFields"
import type { DataPathTableInfo, DataPathTypeInfo, DataPathValueKind, OwnerTypeRef } from "./dataPath/types"
import type { ValidationObjectRecord, ValidationObjectTableSnapshot } from "./projectValidationTypes"
import { createSharedStringPool, createSharedStringPoolView, type SharedStringPool } from "./sharedStringPool"
import type { Diagnostic } from "./types"

const MAGIC = 0x4e4b444f
const VERSION = 1
const HEADER_INTS = 8
const OWNER_INTS = 11
const FIELD_INTS = 19
const ALIAS_INTS = 2
const DIAGNOSTIC_INTS = 5

const STATUS_OK = 1
const STATUS_IMPORT_ERROR = 2

const KIND_ATTRIBUTE = 1
const KIND_STANDARD_ATTRIBUTE = 2
const KIND_TABULAR_SECTION = 3
const KIND_DIMENSION = 4
const KIND_RESOURCE = 5
const KIND_ADDRESSING_ATTRIBUTE = 6

const EMPTY = ""
const LIST_SEPARATOR = "\u001f"
const REF_SEPARATOR = "\u001e"
const REF_PART_SEPARATOR = "\u001d"

export interface BinarySharedOwnersSnapshot {
  format: "binary"
  strings: Pick<SharedStringPool, "buffer" | "count" | "bytes">
  table: SharedArrayBuffer
  bytes: number
  records: number
  files: number
}

interface EncodedOwner {
  ref: OwnerTypeRef
  filePath: string
  modelText?: string
  status: number
  diagnostics: Diagnostic[]
  fields: EncodedField[]
  aliases: Array<[string, string]>
}

interface EncodedField {
  name: string
  targetName?: string
  kind: ObjectField["kind"]
  sourceCollection?: string
  typeInfo: DataPathTypeInfo
  tableSource?: ObjectFieldTableSource
  columns: EncodedField[]
}

interface FlatField {
  field: EncodedField
  columnStart: number
  columnCount: number
}

export function createBinarySharedOwnersSnapshot(snapshot: ValidationObjectTableSnapshot): BinarySharedOwnersSnapshot {
  const owners = snapshot.records
    .filter((record) => record.ownerRef !== undefined)
    .map(encodeOwner)
    .sort(compareOwners)

  const flatFields: FlatField[] = []
  const flatAliases: Array<[string, string]> = []
  const flatDiagnostics: Diagnostic[] = []
  const ownerRows = owners.map((owner) => {
    const fieldStart = flatFields.length
    for (const field of owner.fields) flatFields.push({ field, columnStart: 0, columnCount: 0 })
    const aliasStart = flatAliases.length
    flatAliases.push(...owner.aliases)
    const diagnosticStart = flatDiagnostics.length
    flatDiagnostics.push(...owner.diagnostics)
    return { owner, fieldStart, aliasStart, diagnosticStart }
  })
  appendColumns(flatFields)

  const stringValues = [EMPTY, ...snapshot.filePaths]
  for (const owner of owners) {
    stringValues.push(owner.ref.kind, owner.ref.name ?? EMPTY, owner.filePath, owner.modelText ?? EMPTY)
    for (const diagnostic of owner.diagnostics) {
      stringValues.push(diagnostic.filePath, diagnostic.source, diagnostic.message)
    }
    for (const [alias, target] of owner.aliases) stringValues.push(alias, target)
    for (const field of owner.fields) collectFieldStrings(field, stringValues)
  }
  const strings = createSharedStringPool(stringValues)
  const stringId = createStringId(strings)

  const headerBytes = HEADER_INTS * Int32Array.BYTES_PER_ELEMENT
  const ownerBytes = ownerRows.length * OWNER_INTS * Int32Array.BYTES_PER_ELEMENT
  const fieldBytes = flatFields.length * FIELD_INTS * Int32Array.BYTES_PER_ELEMENT
  const aliasBytes = flatAliases.length * ALIAS_INTS * Int32Array.BYTES_PER_ELEMENT
  const diagnosticBytes = flatDiagnostics.length * DIAGNOSTIC_INTS * Int32Array.BYTES_PER_ELEMENT
  const table = new SharedArrayBuffer(headerBytes + ownerBytes + fieldBytes + aliasBytes + diagnosticBytes)
  const ints = new Int32Array(table)

  const ownersOffset = HEADER_INTS
  const fieldsOffset = ownersOffset + ownerRows.length * OWNER_INTS
  const aliasesOffset = fieldsOffset + flatFields.length * FIELD_INTS
  const diagnosticsOffset = aliasesOffset + flatAliases.length * ALIAS_INTS

  ints[0] = MAGIC
  ints[1] = VERSION
  ints[2] = ownerRows.length
  ints[3] = flatFields.length
  ints[4] = flatAliases.length
  ints[5] = flatDiagnostics.length
  ints[6] = snapshot.filePaths.length
  ints[7] = table.byteLength + strings.bytes

  ownerRows.forEach(({ owner, fieldStart, aliasStart, diagnosticStart }, index) => {
    const base = ownersOffset + index * OWNER_INTS
    ints[base] = stringId(owner.ref.kind)
    ints[base + 1] = stringId(owner.ref.name ?? EMPTY)
    ints[base + 2] = stringId(owner.filePath)
    ints[base + 3] = fieldStart
    ints[base + 4] = owner.fields.length
    ints[base + 5] = aliasStart
    ints[base + 6] = owner.aliases.length
    ints[base + 7] = diagnosticStart
    ints[base + 8] = owner.diagnostics.length
    ints[base + 9] = owner.status
    ints[base + 10] = stringId(owner.modelText ?? EMPTY)
  })

  flatFields.forEach(({ field, columnStart, columnCount }, index) => {
    const base = fieldsOffset + index * FIELD_INTS
    const tableInfo = field.tableSource?.table ?? field.typeInfo.table
    ints[base] = stringId(field.name)
    ints[base + 1] = stringId(field.targetName ?? EMPTY)
    ints[base + 2] = encodeFieldKind(field.kind)
    ints[base + 3] = stringId(encodeKinds(field.typeInfo.kinds))
    ints[base + 4] = stringId(field.typeInfo.sourceText ?? EMPTY)
    ints[base + 5] = stringId(field.sourceCollection ?? EMPTY)
    ints[base + 6] = stringId(tableInfo?.kind ?? EMPTY)
    ints[base + 7] = stringId(tableOwnerKind(tableInfo))
    ints[base + 8] = stringId(tableOwnerName(tableInfo))
    ints[base + 9] = stringId(tableName(tableInfo))
    ints[base + 10] = columnStart
    ints[base + 11] = columnCount
    ints[base + 12] = field.tableSource?.hasColumns === true ? 1 : 0
    ints[base + 13] = stringId(encodeNextTypes(field.typeInfo.nextTypes))
    ints[base + 14] = stringId(encodeDefinedTypes(field.typeInfo.definedTypes))
    ints[base + 15] = field.typeInfo.isComposite === true ? 1 : 0
    ints[base + 16] = field.tableSource === undefined ? 0 : 1
    ints[base + 17] = field.typeInfo.table === undefined ? 0 : 1
    ints[base + 18] = 0
  })

  flatAliases.forEach(([alias, target], index) => {
    const base = aliasesOffset + index * ALIAS_INTS
    ints[base] = stringId(alias)
    ints[base + 1] = stringId(target)
  })

  flatDiagnostics.forEach((diagnostic, index) => {
    const base = diagnosticsOffset + index * DIAGNOSTIC_INTS
    ints[base] = stringId(diagnostic.filePath)
    ints[base + 1] = diagnostic.line
    ints[base + 2] = diagnostic.col
    ints[base + 3] = stringId(diagnostic.source)
    ints[base + 4] = stringId(diagnostic.message)
  })

  return {
    format: "binary",
    strings: { buffer: strings.buffer, count: strings.count, bytes: strings.bytes },
    table,
    bytes: table.byteLength + strings.bytes,
    records: owners.length,
    files: snapshot.filePaths.length,
  }
}

export function createOwnerMetadataCacheFromBinarySharedOwners(params: {
  projectDir: string
  snapshot: BinarySharedOwnersSnapshot
}): OwnerMetadataCache {
  const view = createBinaryOwnersView(params.snapshot)
  const results = new Map<string, OwnerMetadataResult>()

  return {
    get(ref) {
      const key = ownerKey(ref)
      const cached = results.get(key)
      if (cached !== undefined) return cached

      const ownerKind = getDataPathOwnerKind(ref.kind)
      const tableRef = ownerKind ? { kind: ownerKind.projectDir, name: ref.name } : ref
      const ownerId = view.findOwner(tableRef)
      const result =
        ownerId === undefined
          ? notFound(resolve(params.projectDir), ownerKind?.projectDir ?? ref.kind, ref)
          : ownerResult(ref, view, ownerId)
      results.set(key, result)
      return result
    },
  }
}

function createBinaryOwnersView(snapshot: BinarySharedOwnersSnapshot) {
  const header = new Int32Array(snapshot.table, 0, HEADER_INTS)
  if (header[0] !== MAGIC || header[1] !== VERSION) throw new Error("Некорректный binary shared owner snapshot")
  const ownerCount = header[2] ?? 0
  const fieldCount = header[3] ?? 0
  const aliasCount = header[4] ?? 0
  const strings = createSharedStringPoolView(snapshot.strings)
  const ints = new Int32Array(snapshot.table)
  const ownersOffset = HEADER_INTS
  const fieldsOffset = ownersOffset + ownerCount * OWNER_INTS
  const aliasesOffset = fieldsOffset + fieldCount * FIELD_INTS
  const diagnosticsOffset = aliasesOffset + aliasCount * ALIAS_INTS

  return {
    findOwner(ref: OwnerTypeRef): number | undefined {
      let left = 0
      let right = ownerCount - 1
      const kind = ref.kind
      const name = ref.name ?? EMPTY
      while (left <= right) {
        const middle = Math.floor((left + right) / 2)
        const base = ownersOffset + middle * OWNER_INTS
        const currentKind = strings.get(ints[base] ?? 0)
        const currentName = strings.get(ints[base + 1] ?? 0)
        const order = compareOwnerKey(currentKind, currentName, kind, name)
        if (order === 0) return middle
        if (order < 0) left = middle + 1
        else right = middle - 1
      }
      return undefined
    },
    owner(ownerId: number) {
      const base = ownersOffset + ownerId * OWNER_INTS
      return {
        filePath: strings.get(ints[base + 2] ?? 0),
        fieldStart: ints[base + 3] ?? 0,
        fieldCount: ints[base + 4] ?? 0,
        aliasStart: ints[base + 5] ?? 0,
        aliasCount: ints[base + 6] ?? 0,
        diagnosticStart: ints[base + 7] ?? 0,
        diagnosticCount: ints[base + 8] ?? 0,
        status: ints[base + 9] ?? 0,
        modelText: strings.get(ints[base + 10] ?? 0),
      }
    },
    field(index: number): ObjectField {
      const base = fieldsOffset + index * FIELD_INTS
      const table = decodeTableInfo({
        kind: strings.get(ints[base + 6] ?? 0),
        ownerKind: strings.get(ints[base + 7] ?? 0),
        ownerName: strings.get(ints[base + 8] ?? 0),
        name: strings.get(ints[base + 9] ?? 0),
      })
      const tableSource =
        (ints[base + 16] ?? 0) === 1
          ? {
              table: table ?? { kind: "ValueTable" },
              columns: readColumns(this, ints[base + 10] ?? 0, ints[base + 11] ?? 0),
              hasColumns: (ints[base + 12] ?? 0) === 1,
            }
          : undefined
      const field: ObjectField = {
        name: strings.get(ints[base] ?? 0),
        ...(strings.get(ints[base + 1] ?? 0) === EMPTY ? {} : { targetName: strings.get(ints[base + 1] ?? 0) }),
        kind: decodeFieldKind(ints[base + 2] ?? 0),
        typeInfo: decodeTypeInfo({
          kinds: strings.get(ints[base + 3] ?? 0),
          sourceText: strings.get(ints[base + 4] ?? 0),
          nextTypes: strings.get(ints[base + 13] ?? 0),
          definedTypes: strings.get(ints[base + 14] ?? 0),
          isComposite: (ints[base + 15] ?? 0) === 1,
          table: (ints[base + 17] ?? 0) === 1 ? table : undefined,
        }),
        ...(strings.get(ints[base + 5] ?? 0) === EMPTY ? {} : { sourceCollection: strings.get(ints[base + 5] ?? 0) }),
        ...(tableSource === undefined ? {} : { tableSource }),
      }
      return field
    },
    alias(index: number): [string, string] {
      const base = aliasesOffset + index * ALIAS_INTS
      return [strings.get(ints[base] ?? 0), strings.get(ints[base + 1] ?? 0)]
    },
    diagnostic(index: number): Diagnostic {
      const base = diagnosticsOffset + index * DIAGNOSTIC_INTS
      return {
        filePath: strings.get(ints[base] ?? 0),
        line: ints[base + 1] ?? 1,
        col: ints[base + 2] ?? 1,
        severity: "error",
        source: strings.get(ints[base + 3] ?? 0),
        message: strings.get(ints[base + 4] ?? 0),
      }
    },
  }
}

function encodeOwner(record: ValidationObjectRecord): EncodedOwner {
  const fieldIndex = record.fieldIndex
  return {
    ref: record.ownerRef as OwnerTypeRef,
    filePath: record.filePath,
    ...(record.model === undefined ? {} : { modelText: JSON.stringify(record.model) }),
    status: record.importDiagnostics.length > 0 ? STATUS_IMPORT_ERROR : STATUS_OK,
    diagnostics: record.importDiagnostics,
    fields: fieldIndex === undefined ? [] : [...fieldIndex.fields.values()].map(encodeField),
    aliases: fieldIndex === undefined ? [] : [...fieldIndex.standardAttributeAliases.entries()],
  }
}

function encodeField(field: ObjectField): EncodedField {
  return {
    name: field.name,
    ...(field.targetName === undefined ? {} : { targetName: field.targetName }),
    kind: field.kind,
    ...(field.sourceCollection === undefined ? {} : { sourceCollection: field.sourceCollection }),
    typeInfo: field.typeInfo,
    ...(field.tableSource === undefined ? {} : { tableSource: field.tableSource }),
    columns:
      field.tableSource === undefined ? [] : [...field.tableSource.columns.values()].map((column) => encodeField(column)),
  }
}

function appendColumns(flatFields: FlatField[]): void {
  for (let index = 0; index < flatFields.length; index++) {
    const columns = flatFields[index]?.field.columns ?? []
    if (columns.length === 0) continue
    const columnStart = flatFields.length
    for (const column of columns) flatFields.push({ field: column, columnStart: 0, columnCount: 0 })
    const field = flatFields[index]
    if (field !== undefined) {
      field.columnStart = columnStart
      field.columnCount = columns.length
    }
  }
}

function collectFieldStrings(field: EncodedField, values: string[]): void {
  const tableInfo = field.tableSource?.table ?? field.typeInfo.table
  values.push(
    field.name,
    field.targetName ?? EMPTY,
    field.sourceCollection ?? EMPTY,
    encodeKinds(field.typeInfo.kinds),
    field.typeInfo.sourceText ?? EMPTY,
    tableInfo?.kind ?? EMPTY,
    tableOwnerKind(tableInfo),
    tableOwnerName(tableInfo),
    tableName(tableInfo),
    encodeNextTypes(field.typeInfo.nextTypes),
    encodeDefinedTypes(field.typeInfo.definedTypes)
  )
  for (const column of field.columns) collectFieldStrings(column, values)
}

function ownerResult(ref: OwnerTypeRef, view: ReturnType<typeof createBinaryOwnersView>, ownerId: number): OwnerMetadataResult {
  const owner = view.owner(ownerId)
  if (owner.status === STATUS_IMPORT_ERROR) return { status: "import-error", diagnostics: readDiagnostics(view, owner) }

  const ownerKind = getDataPathOwnerKind(ref.kind)
  if (ownerKind === undefined) {
    return {
      status: "import-error",
      diagnostics: [crossFileDiagnostic(owner.filePath, `Не удалось импортировать владельца ${formatOwnerRef(ref)}`)],
    }
  }

  const spec = {
    kind: ownerKind.kind,
    dir: ownerKind.projectDir,
    rule: ownerKind.rule,
    exportSchema: () => ({}) as never,
    importModel: () => undefined,
  }

  return {
    status: "ok",
    owner: {
      ref,
      filePath: owner.filePath,
      model: decodeOwnerModel(owner.modelText) as never,
      rule: spec.rule,
      spec,
      fieldIndex: readFieldIndex(view, owner),
    },
  }
}

function readFieldIndex(
  view: ReturnType<typeof createBinaryOwnersView>,
  owner: ReturnType<ReturnType<typeof createBinaryOwnersView>["owner"]>
): ObjectFieldIndex {
  const fields = new Map<string, ObjectField>()
  for (let offset = 0; offset < owner.fieldCount; offset++) {
    const field = view.field(owner.fieldStart + offset)
    fields.set(field.name, field)
  }

  const standardAttributeAliases = new Map<string, string>()
  for (let offset = 0; offset < owner.aliasCount; offset++) {
    const [alias, target] = view.alias(owner.aliasStart + offset)
    standardAttributeAliases.set(alias, target)
  }

  return { fields, standardAttributeAliases, diagnostics: readDiagnostics(view, owner) }
}

function decodeOwnerModel(modelText: string): unknown {
  if (modelText === EMPTY) return {}
  return JSON.parse(modelText) as unknown
}

function readDiagnostics(
  view: ReturnType<typeof createBinaryOwnersView>,
  owner: Pick<ReturnType<ReturnType<typeof createBinaryOwnersView>["owner"]>, "diagnosticStart" | "diagnosticCount">
): Diagnostic[] {
  const diagnostics: Diagnostic[] = []
  for (let offset = 0; offset < owner.diagnosticCount; offset++) {
    diagnostics.push(view.diagnostic(owner.diagnosticStart + offset))
  }
  return diagnostics
}

function readColumns(view: ReturnType<typeof createBinaryOwnersView>, columnStart: number, columnCount: number): Map<string, ObjectField> {
  const columns = new Map<string, ObjectField>()
  for (let offset = 0; offset < columnCount; offset++) {
    const column = view.field(columnStart + offset)
    columns.set(column.name, column)
  }
  return columns
}

function encodeFieldKind(kind: ObjectField["kind"]): number {
  switch (kind) {
    case "attribute":
      return KIND_ATTRIBUTE
    case "standardAttribute":
      return KIND_STANDARD_ATTRIBUTE
    case "tabularSection":
      return KIND_TABULAR_SECTION
    case "dimension":
      return KIND_DIMENSION
    case "resource":
      return KIND_RESOURCE
    case "addressingAttribute":
      return KIND_ADDRESSING_ATTRIBUTE
  }
}

function decodeFieldKind(value: number): ObjectField["kind"] {
  switch (value) {
    case KIND_ATTRIBUTE:
      return "attribute"
    case KIND_STANDARD_ATTRIBUTE:
      return "standardAttribute"
    case KIND_TABULAR_SECTION:
      return "tabularSection"
    case KIND_DIMENSION:
      return "dimension"
    case KIND_RESOURCE:
      return "resource"
    case KIND_ADDRESSING_ATTRIBUTE:
      return "addressingAttribute"
    default:
      return "attribute"
  }
}

function decodeTypeInfo(params: {
  kinds: string
  sourceText: string
  nextTypes: string
  definedTypes: string
  isComposite: boolean
  table: DataPathTableInfo | undefined
}): DataPathTypeInfo {
  return {
    kinds: decodeKinds(params.kinds),
    nextTypes: decodeNextTypes(params.nextTypes),
    ...(params.definedTypes === EMPTY ? {} : { definedTypes: decodeDefinedTypes(params.definedTypes) }),
    ...(params.table === undefined ? {} : { table: params.table }),
    ...(params.isComposite ? { isComposite: true } : {}),
    ...(params.sourceText === EMPTY ? {} : { sourceText: params.sourceText }),
  }
}

function decodeTableInfo(params: {
  kind: string
  ownerKind: string
  ownerName: string
  name: string
}): DataPathTableInfo | undefined {
  switch (params.kind) {
    case "ValueTable":
    case "ValueTree":
    case "ValueList":
    case "GanttChart":
    case "DynamicList":
      return { kind: params.kind }
    case "RegisterRecordSet":
      return { kind: "RegisterRecordSet", owner: { kind: params.ownerKind, name: params.ownerName || undefined } }
    case "TabularSection":
      return {
        kind: "TabularSection",
        owner: { kind: params.ownerKind, name: params.ownerName || undefined },
        name: params.name,
      }
    default:
      return undefined
  }
}

function tableOwnerKind(table: DataPathTableInfo | undefined): string {
  return table !== undefined && "owner" in table ? table.owner.kind : EMPTY
}

function tableOwnerName(table: DataPathTableInfo | undefined): string {
  return table !== undefined && "owner" in table ? table.owner.name ?? EMPTY : EMPTY
}

function tableName(table: DataPathTableInfo | undefined): string {
  return table !== undefined && "name" in table ? table.name : EMPTY
}

function encodeKinds(kinds: readonly DataPathValueKind[]): string {
  return kinds.join(LIST_SEPARATOR)
}

function decodeKinds(value: string): DataPathValueKind[] {
  return value === EMPTY ? [] : (value.split(LIST_SEPARATOR) as DataPathValueKind[])
}

function encodeNextTypes(nextTypes: readonly OwnerTypeRef[]): string {
  return nextTypes.map((type) => `${type.kind}${REF_PART_SEPARATOR}${type.name ?? EMPTY}`).join(REF_SEPARATOR)
}

function decodeNextTypes(value: string): OwnerTypeRef[] {
  if (value === EMPTY) return []
  return value.split(REF_SEPARATOR).map((item) => {
    const [kind = EMPTY, name = EMPTY] = item.split(REF_PART_SEPARATOR)
    return { kind, ...(name === EMPTY ? {} : { name }) }
  })
}

function encodeDefinedTypes(definedTypes: readonly string[] | undefined): string {
  return definedTypes === undefined ? EMPTY : definedTypes.join(LIST_SEPARATOR)
}

function decodeDefinedTypes(value: string): string[] {
  return value === EMPTY ? [] : value.split(LIST_SEPARATOR)
}

function compareOwners(left: EncodedOwner, right: EncodedOwner): number {
  return compareOwnerKey(left.ref.kind, left.ref.name ?? EMPTY, right.ref.kind, right.ref.name ?? EMPTY)
}

function compareOwnerKey(leftKind: string, leftName: string, rightKind: string, rightName: string): number {
  const kind = leftKind.localeCompare(rightKind)
  return kind === 0 ? leftName.localeCompare(rightName) : kind
}

function createStringId(strings: SharedStringPool): (value: string) => number {
  return (value) => {
    const id = strings.idByValue.get(value)
    if (id === undefined) throw new Error(`String pool не содержит "${value}"`)
    return id
  }
}

function notFound(projectDir: string, dir: string, ref: OwnerTypeRef): OwnerMetadataResult {
  return {
    status: "not-found",
    diagnostics: [crossFileDiagnostic(`${projectDir}/${dir}/${ref.name ?? EMPTY}/Свойства.yaml`, `Не найден владелец ${formatOwnerRef(ref)}`)],
  }
}

function ownerKey(ref: OwnerTypeRef): string {
  return `${ref.kind}:${ref.name ?? EMPTY}`
}

function formatOwnerRef(ref: OwnerTypeRef): string {
  return ref.name ? `${ref.kind}.${ref.name}` : ref.kind
}

function crossFileDiagnostic(filePath: string, message: string): Diagnostic {
  return {
    filePath,
    line: 1,
    col: 1,
    severity: "error",
    source: "cross-file",
    message,
  }
}
