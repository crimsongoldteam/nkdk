import type { ObjectField, ObjectFieldIndex, ObjectFieldTableSource } from "./dataPath/objectFields"
import type { DataPathTableInfo, DataPathTypeInfo, OwnerTypeRef } from "./dataPath/types"
import {
  createSharedProjectReferenceSnapshot,
  type SharedProjectReferenceSnapshot,
} from "./sharedProjectReferenceIndex"
import { createBinarySharedOwnersSnapshot, type BinarySharedOwnersSnapshot } from "./sharedValidationBinaryOwners"
import type { Diagnostic } from "./types"
import type { ValidationObjectRecord, ValidationObjectTableSnapshot } from "./projectValidationTypes"

const textEncoder = new TextEncoder()
const textDecoder = new TextDecoder()

export interface SharedValidationSnapshot {
  reference: SharedProjectReferenceSnapshot
  owners: JsonSharedOwnersSnapshot | BinarySharedOwnersSnapshot
}

export interface JsonSharedOwnersSnapshot {
  format: "json"
  buffer: SharedArrayBuffer
  bytes: number
  records: number
  files: number
}

export interface SharedValidationOwnerRecord {
  ref: OwnerTypeRef
  filePath: string
  model?: unknown
  fieldIndex?: SharedObjectFieldIndex
  importDiagnostics: Diagnostic[]
}

export interface SharedObjectFieldIndex {
  fields: Array<[string, SharedObjectField]>
  standardAttributeAliases: Array<[string, string]>
  diagnostics: Diagnostic[]
}

export interface SharedObjectField {
  name: string
  targetName?: string
  kind: ObjectField["kind"]
  typeInfo: DataPathTypeInfo
  tableSource?: SharedObjectFieldTableSource
  sourceCollection?: string
}

export interface SharedObjectFieldTableSource {
  table: DataPathTableInfo
  columns: Array<[string, SharedObjectField]>
  hasColumns: boolean
}

interface SharedOwnersPayload {
  records: SharedValidationOwnerRecord[]
  filePaths: string[]
}

export function createSharedValidationSnapshot(snapshot: ValidationObjectTableSnapshot): SharedValidationSnapshot {
  if (!Array.isArray(snapshot.records)) {
    throw new Error(
      `Некорректный ValidationObjectTableSnapshot для shared validation: keys=${Object.keys(snapshot as object).join(",")} records=${typeof snapshot.records}`
    )
  }
  const owners =
    process.env["NKDK_VALIDATION_SHARED_OWNER_FORMAT"] === "binary"
      ? createBinarySharedOwnersSnapshot(snapshot)
      : createJsonSharedOwnersSnapshot(snapshot)

  return {
    reference: createSharedProjectReferenceSnapshot({
      objectIndexEntries: snapshot.objectIndexEntries ?? [],
      memberIndexEntries: snapshot.memberIndexEntries ?? [],
      valueIndexEntries: snapshot.valueIndexEntries ?? [],
    }),
    owners,
  }
}

export function decodeSharedValidationOwners(snapshot: SharedValidationSnapshot): SharedOwnersPayload {
  if (snapshot.owners.format !== "json") throw new Error("Shared owner snapshot не является JSON snapshot")
  const decoded = JSON.parse(textDecoder.decode(new Uint8Array(snapshot.owners.buffer))) as Partial<SharedOwnersPayload>
  if (!Array.isArray(decoded.records) || !Array.isArray(decoded.filePaths)) {
    throw new Error(
      `Некорректный shared owner snapshot: keys=${Object.keys(decoded).join(",")} records=${typeof decoded.records}`
    )
  }
  return { records: decoded.records, filePaths: decoded.filePaths }
}

function createJsonSharedOwnersSnapshot(snapshot: ValidationObjectTableSnapshot): JsonSharedOwnersSnapshot {
  const payload: SharedOwnersPayload = {
    records: snapshot.records.filter((record) => record.ownerRef !== undefined).map(encodeOwnerRecord),
    filePaths: snapshot.filePaths,
  }
  const json = JSON.stringify(payload)
  const bytes = textEncoder.encode(json)
  const buffer = new SharedArrayBuffer(bytes.byteLength)
  new Uint8Array(buffer).set(bytes)
  return {
    format: "json",
    buffer,
    bytes: bytes.byteLength,
    records: payload.records.length,
    files: payload.filePaths.length,
  }
}

export function decodeObjectFieldIndex(value: SharedObjectFieldIndex): ObjectFieldIndex {
  return {
    fields: new Map(value.fields.map(([key, field]) => [key, decodeObjectField(field)])),
    standardAttributeAliases: new Map(value.standardAttributeAliases),
    diagnostics: value.diagnostics,
  }
}

function encodeOwnerRecord(record: ValidationObjectRecord): SharedValidationOwnerRecord {
  return {
    ref: record.ownerRef as OwnerTypeRef,
    filePath: record.filePath,
    ...(record.model === undefined ? {} : { model: record.model }),
    ...(record.fieldIndex === undefined ? {} : { fieldIndex: encodeObjectFieldIndex(record.fieldIndex) }),
    importDiagnostics: record.importDiagnostics,
  }
}

function encodeObjectFieldIndex(index: ObjectFieldIndex): SharedObjectFieldIndex {
  return {
    fields: [...index.fields.entries()].map(([key, field]) => [key, encodeObjectField(field)]),
    standardAttributeAliases: [...index.standardAttributeAliases.entries()],
    diagnostics: index.diagnostics,
  }
}

function encodeObjectField(field: ObjectField): SharedObjectField {
  return {
    name: field.name,
    ...(field.targetName === undefined ? {} : { targetName: field.targetName }),
    kind: field.kind,
    typeInfo: field.typeInfo,
    ...(field.tableSource === undefined ? {} : { tableSource: encodeTableSource(field.tableSource) }),
    ...(field.sourceCollection === undefined ? {} : { sourceCollection: field.sourceCollection }),
  }
}

function encodeTableSource(source: ObjectFieldTableSource): SharedObjectFieldTableSource {
  return {
    table: source.table,
    columns: [...source.columns.entries()].map(([key, field]) => [key, encodeObjectField(field)]),
    hasColumns: source.hasColumns,
  }
}

function decodeObjectField(field: SharedObjectField): ObjectField {
  return {
    name: field.name,
    ...(field.targetName === undefined ? {} : { targetName: field.targetName }),
    kind: field.kind,
    typeInfo: field.typeInfo,
    ...(field.tableSource === undefined ? {} : { tableSource: decodeTableSource(field.tableSource) }),
    ...(field.sourceCollection === undefined ? {} : { sourceCollection: field.sourceCollection }),
  }
}

function decodeTableSource(source: SharedObjectFieldTableSource): ObjectFieldTableSource {
  return {
    table: source.table,
    columns: new Map(source.columns.map(([key, field]) => [key, decodeObjectField(field)])),
    hasColumns: source.hasColumns,
  }
}
