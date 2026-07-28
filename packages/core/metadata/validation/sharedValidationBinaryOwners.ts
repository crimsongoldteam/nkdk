import { resolve } from "path"
import { validationComponentLayers } from "./componentVisibility"
import { getDataPathOwnerKind } from "./dataPath/registry"
import type { OwnerMetadataCache, OwnerMetadataResult } from "./dataPath/ownerCache"
import type { ValidationOwnerFacts } from "./dataPath/ownerFacts"
import type { ObjectField, ObjectFieldIndex, ObjectFieldTableSource } from "./dataPath/objectFields"
import type { DataPathTableInfo, DataPathTypeInfo, DataPathValueKind, OwnerTypeRef } from "./dataPath/types"
import type {
  ProjectValidationGraph,
  ValidationObjectRecord,
  ValidationObjectTableSnapshot,
} from "./projectValidationTypes"
import { createSharedStringPool, createSharedStringPoolView, type SharedStringPool } from "./sharedStringPool"
import type { Diagnostic, DiagnosticSource } from "./types"

const MAGIC = 0x4e4b444f
const VERSION = 1
const HEADER_INTS = 8
const OWNER_INTS = 11
const PROJECT_MAGIC = 0x4e4b504f
const PROJECT_VERSION = 1
const PROJECT_OWNER_INTS = 12
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
  factsText?: string
  status: number
  diagnostics: Diagnostic[]
  fields: EncodedField[]
  aliases: Array<[string, string]>
}

interface EncodedOwnerRow {
  componentPath?: string
  owner: EncodedOwner
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
  return createBinaryOwnersSnapshot({
    owners: snapshot.records
      .filter((record) => record.ownerRef !== undefined)
      .map((record) => ({ owner: encodeOwner(record) }))
      .sort((left, right) => compareOwners(left.owner, right.owner)),
    filePaths: snapshot.filePaths,
    project: false,
  })
}

export function createBinarySharedProjectOwnersSnapshot(graph: ProjectValidationGraph): BinarySharedOwnersSnapshot {
  const owners = graph.layers
    .flatMap(({ componentPath, contribution }) =>
      contribution.objectRecords
        .filter((record) => record.ownerRef !== undefined)
        .map((record) => ({
          componentPath,
          owner: encodeOwner(record),
        }))
    )
    .sort(compareProjectOwners)
  const filePaths = [
    ...new Set(graph.layers.flatMap(({ contribution }) => contribution.objectRecords.map(({ filePath }) => filePath))),
  ].sort()

  return createBinaryOwnersSnapshot({ owners, filePaths, project: true })
}

function createBinaryOwnersSnapshot(params: {
  owners: EncodedOwnerRow[]
  filePaths: readonly string[]
  project: boolean
}): BinarySharedOwnersSnapshot {
  const { owners } = params
  const flatFields: FlatField[] = []
  const flatAliases: Array<[string, string]> = []
  const flatDiagnostics: Diagnostic[] = []
  const ownerRows = owners.map(({ componentPath, owner }) => {
    const fieldStart = flatFields.length
    for (const field of owner.fields) flatFields.push({ field, columnStart: 0, columnCount: 0 })
    const aliasStart = flatAliases.length
    flatAliases.push(...owner.aliases)
    const diagnosticStart = flatDiagnostics.length
    flatDiagnostics.push(...owner.diagnostics)
    return { componentPath, owner, fieldStart, aliasStart, diagnosticStart }
  })
  appendColumns(flatFields)

  const stringValues = [EMPTY, ...params.filePaths]
  for (const { componentPath, owner } of owners) {
    if (componentPath !== undefined) stringValues.push(componentPath)
    stringValues.push(owner.ref.kind, owner.ref.name ?? EMPTY, owner.filePath, owner.factsText ?? EMPTY)
    for (const diagnostic of owner.diagnostics) {
      stringValues.push(diagnostic.filePath, diagnostic.source, diagnostic.message)
    }
    for (const [alias, target] of owner.aliases) stringValues.push(alias, target)
    for (const field of owner.fields) collectFieldStrings(field, stringValues)
  }
  const strings = createSharedStringPool(stringValues)
  const stringId = createStringId(strings)

  const headerBytes = HEADER_INTS * Int32Array.BYTES_PER_ELEMENT
  const ownerInts = params.project ? PROJECT_OWNER_INTS : OWNER_INTS
  const ownerBytes = ownerRows.length * ownerInts * Int32Array.BYTES_PER_ELEMENT
  const fieldBytes = flatFields.length * FIELD_INTS * Int32Array.BYTES_PER_ELEMENT
  const aliasBytes = flatAliases.length * ALIAS_INTS * Int32Array.BYTES_PER_ELEMENT
  const diagnosticBytes = flatDiagnostics.length * DIAGNOSTIC_INTS * Int32Array.BYTES_PER_ELEMENT
  const table = new SharedArrayBuffer(headerBytes + ownerBytes + fieldBytes + aliasBytes + diagnosticBytes)
  const ints = new Int32Array(table)

  const ownersOffset = HEADER_INTS
  const fieldsOffset = ownersOffset + ownerRows.length * ownerInts
  const aliasesOffset = fieldsOffset + flatFields.length * FIELD_INTS
  const diagnosticsOffset = aliasesOffset + flatAliases.length * ALIAS_INTS

  ints[0] = params.project ? PROJECT_MAGIC : MAGIC
  ints[1] = params.project ? PROJECT_VERSION : VERSION
  ints[2] = ownerRows.length
  ints[3] = flatFields.length
  ints[4] = flatAliases.length
  ints[5] = flatDiagnostics.length
  ints[6] = params.filePaths.length
  ints[7] = table.byteLength + strings.bytes

  ownerRows.forEach(({ componentPath, owner, fieldStart, aliasStart, diagnosticStart }, index) => {
    const base = ownersOffset + index * ownerInts
    const valueOffset = params.project ? 1 : 0
    if (params.project) {
      ints[base] = stringId(componentPath ?? EMPTY)
    }
    ints[base + valueOffset] = stringId(owner.ref.kind)
    ints[base + valueOffset + 1] = stringId(owner.ref.name ?? EMPTY)
    ints[base + valueOffset + 2] = stringId(owner.filePath)
    ints[base + valueOffset + 3] = fieldStart
    ints[base + valueOffset + 4] = owner.fields.length
    ints[base + valueOffset + 5] = aliasStart
    ints[base + valueOffset + 6] = owner.aliases.length
    ints[base + valueOffset + 7] = diagnosticStart
    ints[base + valueOffset + 8] = owner.diagnostics.length
    ints[base + valueOffset + 9] = owner.status
    ints[base + valueOffset + 10] = stringId(owner.factsText ?? EMPTY)
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
    files: params.filePaths.length,
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
    listRefs(kind) {
      const ownerKind = getDataPathOwnerKind(kind)
      const tableKind = ownerKind?.projectDir ?? kind
      return view.listOwners(tableKind).map((ref) => ({
        kind,
        ...(ref.name !== undefined ? { name: ref.name } : {}),
      }))
    },
  }
}

export function createOwnerMetadataCacheFromBinarySharedProjectOwners(params: {
  projectDir: string
  componentPath: string
  snapshot: BinarySharedOwnersSnapshot
}): OwnerMetadataCache {
  const view = createBinaryOwnersView(params.snapshot, true)
  const results = new Map<string, OwnerMetadataResult>()
  const layers = validationComponentLayers(params.componentPath)

  return {
    get(ref) {
      const key = ownerKey(ref)
      const cached = results.get(key)
      if (cached !== undefined) return cached

      const ownerKind = getDataPathOwnerKind(ref.kind)
      const tableRef = ownerKind ? { kind: ownerKind.projectDir, name: ref.name } : ref
      let ownerId: number | undefined
      for (const layer of layers) {
        ownerId = view.findOwner(tableRef, layer)
        if (ownerId !== undefined) break
      }
      const result =
        ownerId === undefined
          ? notFound(resolve(params.projectDir), ownerKind?.projectDir ?? ref.kind, ref)
          : ownerResult(ref, view, ownerId)
      results.set(key, result)
      return result
    },
    listRefs(kind) {
      const ownerKind = getDataPathOwnerKind(kind)
      const tableKind = ownerKind?.projectDir ?? kind
      const refs = new Map<string, OwnerTypeRef>()
      for (const layer of layers) {
        for (const ref of view.listOwners(tableKind, layer)) {
          const result = {
            kind,
            ...(ref.name !== undefined ? { name: ref.name } : {}),
          }
          refs.set(ownerKey(result), result)
        }
      }
      return [...refs.values()]
    },
  }
}

function createBinaryOwnersView(snapshot: BinarySharedOwnersSnapshot, project = false) {
  const header = new Int32Array(snapshot.table, 0, HEADER_INTS)
  const expectedMagic = project ? PROJECT_MAGIC : MAGIC
  const expectedVersion = project ? PROJECT_VERSION : VERSION
  if (header[0] !== expectedMagic || header[1] !== expectedVersion) {
    throw new Error("Некорректный binary shared owner snapshot")
  }
  const ownerCount = header[2] ?? 0
  const fieldCount = header[3] ?? 0
  const aliasCount = header[4] ?? 0
  const strings = createSharedStringPoolView(snapshot.strings)
  const ints = new Int32Array(snapshot.table)
  const ownerInts = project ? PROJECT_OWNER_INTS : OWNER_INTS
  const valueOffset = project ? 1 : 0
  const ownersOffset = HEADER_INTS
  const fieldsOffset = ownersOffset + ownerCount * ownerInts
  const aliasesOffset = fieldsOffset + fieldCount * FIELD_INTS
  const diagnosticsOffset = aliasesOffset + aliasCount * ALIAS_INTS

  return {
    findOwner(ref: OwnerTypeRef, componentPath?: string): number | undefined {
      let left = 0
      let right = ownerCount - 1
      const kind = ref.kind
      const name = ref.name ?? EMPTY
      while (left <= right) {
        const middle = Math.floor((left + right) / 2)
        const base = ownersOffset + middle * ownerInts
        const currentComponentPath = project ? strings.get(ints[base] ?? 0) : EMPTY
        const currentKind = strings.get(ints[base + valueOffset] ?? 0)
        const currentName = strings.get(ints[base + valueOffset + 1] ?? 0)
        const order = project
          ? compareProjectOwnerKey(currentComponentPath, currentKind, currentName, componentPath ?? EMPTY, kind, name)
          : compareOwnerKey(currentKind, currentName, kind, name)
        if (order === 0) return middle
        if (order < 0) left = middle + 1
        else right = middle - 1
      }
      return undefined
    },
    listOwners(kind: OwnerTypeRef["kind"], componentPath?: string): readonly OwnerTypeRef[] {
      const result: OwnerTypeRef[] = []
      for (let ownerId = 0; ownerId < ownerCount; ownerId += 1) {
        const base = ownersOffset + ownerId * ownerInts
        if (project && strings.get(ints[base] ?? 0) !== (componentPath ?? EMPTY)) {
          continue
        }
        const currentKind = strings.get(ints[base + valueOffset] ?? 0)
        if (currentKind !== kind) continue
        const name = strings.get(ints[base + valueOffset + 1] ?? 0)
        result.push({ kind, ...(name.length > 0 ? { name } : {}) })
      }
      return result
    },
    owner(ownerId: number) {
      const base = ownersOffset + ownerId * ownerInts + valueOffset
      return {
        filePath: strings.get(ints[base + 2] ?? 0),
        fieldStart: ints[base + 3] ?? 0,
        fieldCount: ints[base + 4] ?? 0,
        aliasStart: ints[base + 5] ?? 0,
        aliasCount: ints[base + 6] ?? 0,
        diagnosticStart: ints[base + 7] ?? 0,
        diagnosticCount: ints[base + 8] ?? 0,
        status: ints[base + 9] ?? 0,
        factsText: strings.get(ints[base + 10] ?? 0),
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
        source: strings.get(ints[base + 3] ?? 0) as DiagnosticSource,
        message: strings.get(ints[base + 4] ?? 0),
      }
    },
  }
}

function encodeOwner(record: ValidationObjectRecord): EncodedOwner {
  const facts = record.ownerFacts
  const fieldIndex = facts?.fieldIndex ?? record.fieldIndex
  const compactFacts = facts === undefined ? undefined : ownerFactsWithoutIndex(facts)
  return {
    ref: (facts?.ref ?? record.ownerRef) as OwnerTypeRef,
    filePath: facts?.filePath ?? record.filePath,
    ...(compactFacts === undefined ? {} : { factsText: JSON.stringify(compactFacts) }),
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
      field.tableSource === undefined
        ? []
        : [...field.tableSource.columns.values()].map((column) => encodeField(column)),
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

function ownerResult(
  ref: OwnerTypeRef,
  view: ReturnType<typeof createBinaryOwnersView>,
  ownerId: number
): OwnerMetadataResult {
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
  }
  const fieldIndex = readFieldIndex(view, owner)
  const facts = decodeOwnerFacts(owner.factsText, ref, owner.filePath, fieldIndex)

  return {
    status: "ok",
    owner: {
      ref,
      filePath: owner.filePath,
      facts,
      rule: spec.rule,
      spec,
      fieldIndex,
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

function ownerFactsWithoutIndex(
  facts: ValidationOwnerFacts
): Omit<ValidationOwnerFacts, "ref" | "filePath" | "fieldIndex"> {
  const { ref: _ref, filePath: _filePath, fieldIndex: _fieldIndex, ...compact } = facts
  return compact
}

function decodeOwnerFacts(
  factsText: string,
  ref: OwnerTypeRef,
  filePath: string,
  fieldIndex: ObjectFieldIndex
): ValidationOwnerFacts {
  const compact =
    factsText === EMPTY ? {} : (JSON.parse(factsText) as Omit<ValidationOwnerFacts, "ref" | "filePath" | "fieldIndex">)
  return { ref, filePath, fieldIndex, ...compact }
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

function readColumns(
  view: ReturnType<typeof createBinaryOwnersView>,
  columnStart: number,
  columnCount: number
): Map<string, ObjectField> {
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
  return table !== undefined && "owner" in table ? (table.owner.name ?? EMPTY) : EMPTY
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

function compareProjectOwners(left: EncodedOwnerRow, right: EncodedOwnerRow): number {
  return compareProjectOwnerKey(
    left.componentPath ?? EMPTY,
    left.owner.ref.kind,
    left.owner.ref.name ?? EMPTY,
    right.componentPath ?? EMPTY,
    right.owner.ref.kind,
    right.owner.ref.name ?? EMPTY
  )
}

function compareProjectOwnerKey(
  leftComponentPath: string,
  leftKind: string,
  leftName: string,
  rightComponentPath: string,
  rightKind: string,
  rightName: string
): number {
  const componentPath = leftComponentPath.localeCompare(rightComponentPath)
  return componentPath === 0 ? compareOwnerKey(leftKind, leftName, rightKind, rightName) : componentPath
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
    diagnostics: [
      crossFileDiagnostic(
        `${projectDir}/${dir}/${ref.name ?? EMPTY}/Свойства.yaml`,
        `Не найден владелец ${formatOwnerRef(ref)}`
      ),
    ],
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
