import type { SharedProjectReferenceSnapshot } from "./sharedProjectReferenceIndex"
import type { BinarySharedOwnersSnapshot } from "./sharedValidationBinaryOwners"
import {
  createSharedValidationSnapshot,
  type SharedValidationSnapshot,
} from "./sharedValidationSnapshot"

export interface PersistedSharedValidationSnapshot {
  reference: Uint8Array
  ownerStrings: Uint8Array
  ownerTable: Uint8Array
}

const REFERENCE_MAGIC = 0x4e4b4452
const OWNER_STRINGS_MAGIC = 0x4e4b4453
const OWNER_TABLE_MAGIC = 0x4e4b444f
const SHARED_VERSION = 1

const REFERENCE_HEADER_INTS = 9
const REFERENCE_ENTRY_INTS = 9
const OWNER_STRINGS_HEADER_INTS = 4
const OWNER_STRINGS_ENTRY_INTS = 2
const OWNER_TABLE_HEADER_INTS = 8
const OWNER_ENTRY_INTS = 11
const OWNER_FIELD_INTS = 19
const OWNER_ALIAS_INTS = 2
const OWNER_DIAGNOSTIC_INTS = 5

const fatalUtf8Decoder = new TextDecoder("utf-8", { fatal: true })

export function serializeSharedValidationSnapshot(
  snapshot: SharedValidationSnapshot
): PersistedSharedValidationSnapshot {
  return {
    reference: Uint8Array.from(new Uint8Array(snapshot.reference.buffer)),
    ownerStrings: Uint8Array.from(new Uint8Array(snapshot.owners.strings.buffer)),
    ownerTable: Uint8Array.from(new Uint8Array(snapshot.owners.table)),
  }
}

export function createEmptyPersistedSharedValidationSnapshot(): PersistedSharedValidationSnapshot {
  return serializeSharedValidationSnapshot(
    createSharedValidationSnapshot({ records: [], filePaths: [] })
  )
}

export function restoreSharedValidationSnapshot(
  persisted: PersistedSharedValidationSnapshot
): SharedValidationSnapshot {
  try {
    const reference = restoreReferenceSnapshot(persisted.reference)
    const ownerStrings = validateOwnerStrings(persisted.ownerStrings)
    const owners = restoreOwnerSnapshot({
      bytes: persisted.ownerTable,
      strings: ownerStrings,
    })
    return { reference, owners }
  } catch (caught) {
    throw new Error(
      `Некорректный сохранённый validation snapshot: ${caught instanceof Error ? caught.message : String(caught)}`,
      { cause: caught }
    )
  }
}

function restoreReferenceSnapshot(bytes: Uint8Array): SharedProjectReferenceSnapshot {
  const view = dataView(bytes, REFERENCE_HEADER_INTS, "reference")
  requireHeader(view, REFERENCE_MAGIC, "reference")
  const entryCount = nonNegativeInt(view, 2, "entryCount reference")
  const stringsOffset = nonNegativeInt(view, 3, "stringsOffset reference")
  const expectedStringsOffset = (REFERENCE_HEADER_INTS + entryCount * REFERENCE_ENTRY_INTS) * 4
  if (stringsOffset !== expectedStringsOffset || stringsOffset > bytes.byteLength) {
    throw new Error("некорректное смещение строк reference")
  }
  const objectEntries = nonNegativeInt(view, 4, "objectEntries reference")
  const memberEntries = nonNegativeInt(view, 5, "memberEntries reference")
  const valueEntries = nonNegativeInt(view, 6, "valueEntries reference")
  const conflicts = nonNegativeInt(view, 7, "conflicts reference")
  if (objectEntries + memberEntries + valueEntries !== entryCount) {
    throw new Error("число записей reference не согласовано с секциями")
  }
  if (intAt(view, 8) !== bytes.byteLength) {
    throw new Error("длина reference не совпадает с заголовком")
  }

  for (let index = 0; index < entryCount; index += 1) {
    const base = REFERENCE_HEADER_INTS + index * REFERENCE_ENTRY_INTS
    const section = intAt(view, base)
    if (section < 0 || section > 2) throw new Error("некорректный тип записи reference")
    validateStringSlice(bytes, stringsOffset, intAt(view, base + 1), intAt(view, base + 2), "ключ reference")
    const conflict = intAt(view, base + 3)
    if (conflict !== 0 && conflict !== 1) throw new Error("некорректный флаг конфликта reference")
    validateStringSlice(bytes, stringsOffset, intAt(view, base + 7), intAt(view, base + 8), "details reference")
  }

  return {
    buffer: copyToShared(bytes),
    stats: {
      objectEntries,
      memberEntries,
      valueEntries,
      conflicts,
      snapshotBytes: bytes.byteLength,
    },
  }
}

function validateOwnerStrings(bytes: Uint8Array): {
  buffer: SharedArrayBuffer
  count: number
  bytes: number
} {
  const view = dataView(bytes, OWNER_STRINGS_HEADER_INTS, "owner strings")
  requireHeader(view, OWNER_STRINGS_MAGIC, "owner strings")
  const count = nonNegativeInt(view, 2, "count owner strings")
  const stringsOffset = nonNegativeInt(view, 3, "stringsOffset owner strings")
  const expectedStringsOffset = (OWNER_STRINGS_HEADER_INTS + count * OWNER_STRINGS_ENTRY_INTS) * 4
  if (stringsOffset !== expectedStringsOffset || stringsOffset > bytes.byteLength) {
    throw new Error("некорректное смещение owner strings")
  }

  let cursor = stringsOffset
  for (let index = 0; index < count; index += 1) {
    const base = OWNER_STRINGS_HEADER_INTS + index * OWNER_STRINGS_ENTRY_INTS
    const offset = intAt(view, base)
    const length = intAt(view, base + 1)
    if (offset !== cursor) throw new Error("owner strings расположены непоследовательно")
    validateStringSlice(bytes, stringsOffset, offset, length, "owner string")
    cursor += length
  }
  if (cursor !== bytes.byteLength) throw new Error("длина owner strings не совпадает с таблицей")

  return { buffer: copyToShared(bytes), count, bytes: bytes.byteLength }
}

function restoreOwnerSnapshot(params: {
  bytes: Uint8Array
  strings: { buffer: SharedArrayBuffer; count: number; bytes: number }
}): BinarySharedOwnersSnapshot {
  const view = dataView(params.bytes, OWNER_TABLE_HEADER_INTS, "owner table")
  requireHeader(view, OWNER_TABLE_MAGIC, "owner table")
  const ownerCount = nonNegativeInt(view, 2, "ownerCount")
  const fieldCount = nonNegativeInt(view, 3, "fieldCount")
  const aliasCount = nonNegativeInt(view, 4, "aliasCount")
  const diagnosticCount = nonNegativeInt(view, 5, "diagnosticCount")
  const fileCount = nonNegativeInt(view, 6, "fileCount")
  const expectedInts =
    OWNER_TABLE_HEADER_INTS +
    ownerCount * OWNER_ENTRY_INTS +
    fieldCount * OWNER_FIELD_INTS +
    aliasCount * OWNER_ALIAS_INTS +
    diagnosticCount * OWNER_DIAGNOSTIC_INTS
  if (expectedInts * 4 !== params.bytes.byteLength) {
    throw new Error("длина owner table не согласована со счётчиками")
  }
  if (intAt(view, 7) !== params.bytes.byteLength + params.strings.bytes) {
    throw new Error("общая длина owner snapshot не совпадает с заголовком")
  }

  const ownersOffset = OWNER_TABLE_HEADER_INTS
  const fieldsOffset = ownersOffset + ownerCount * OWNER_ENTRY_INTS
  const aliasesOffset = fieldsOffset + fieldCount * OWNER_FIELD_INTS
  const diagnosticsOffset = aliasesOffset + aliasCount * OWNER_ALIAS_INTS
  for (let index = 0; index < ownerCount; index += 1) {
    const base = ownersOffset + index * OWNER_ENTRY_INTS
    validateStringIds(view, params.strings.count, base, [0, 1, 2, 10])
    validateRange(intAt(view, base + 3), intAt(view, base + 4), fieldCount, "поля owner")
    validateRange(intAt(view, base + 5), intAt(view, base + 6), aliasCount, "aliases owner")
    validateRange(intAt(view, base + 7), intAt(view, base + 8), diagnosticCount, "diagnostics owner")
    const status = intAt(view, base + 9)
    if (status !== 1 && status !== 2) throw new Error("некорректный статус owner")
  }
  for (let index = 0; index < fieldCount; index += 1) {
    const base = fieldsOffset + index * OWNER_FIELD_INTS
    validateStringIds(view, params.strings.count, base, [0, 1, 3, 4, 5, 6, 7, 8, 9, 13, 14])
    validateRange(intAt(view, base + 10), intAt(view, base + 11), fieldCount, "колонки owner")
  }
  for (let index = 0; index < aliasCount; index += 1) {
    validateStringIds(view, params.strings.count, aliasesOffset + index * OWNER_ALIAS_INTS, [0, 1])
  }
  for (let index = 0; index < diagnosticCount; index += 1) {
    validateStringIds(view, params.strings.count, diagnosticsOffset + index * OWNER_DIAGNOSTIC_INTS, [0, 3, 4])
  }

  return {
    format: "binary",
    strings: params.strings,
    table: copyToShared(params.bytes),
    bytes: params.bytes.byteLength + params.strings.bytes,
    records: ownerCount,
    files: fileCount,
  }
}

function dataView(bytes: Uint8Array, minimumInts: number, name: string): DataView {
  if (!(bytes instanceof Uint8Array) || bytes.byteLength < minimumInts * 4) {
    throw new Error(`слишком короткий ${name}`)
  }
  return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
}

function requireHeader(view: DataView, magic: number, name: string): void {
  if (intAt(view, 0) !== magic || intAt(view, 1) !== SHARED_VERSION) {
    throw new Error(`неверный magic/version ${name}`)
  }
}

function intAt(view: DataView, index: number): number {
  const offset = index * 4
  if (offset < 0 || offset + 4 > view.byteLength) throw new Error("выход за границы int32")
  return view.getInt32(offset, true)
}

function nonNegativeInt(view: DataView, index: number, name: string): number {
  const value = intAt(view, index)
  if (value < 0) throw new Error(`отрицательное значение ${name}`)
  return value
}

function validateStringSlice(
  bytes: Uint8Array,
  stringsOffset: number,
  offset: number,
  length: number,
  name: string
): void {
  if (offset < stringsOffset || length < 0 || offset > bytes.byteLength - length) {
    throw new Error(`некорректный диапазон ${name}`)
  }
  fatalUtf8Decoder.decode(bytes.subarray(offset, offset + length))
}

function validateStringIds(view: DataView, count: number, base: number, indexes: readonly number[]): void {
  for (const index of indexes) {
    const id = intAt(view, base + index)
    if (id < 0 || id >= count) throw new Error(`некорректный owner string id ${id}`)
  }
}

function validateRange(start: number, count: number, total: number, name: string): void {
  if (start < 0 || count < 0 || start > total - count) {
    throw new Error(`некорректный диапазон ${name}`)
  }
}

function copyToShared(bytes: Uint8Array): SharedArrayBuffer {
  const result = new SharedArrayBuffer(bytes.byteLength)
  new Uint8Array(result).set(bytes)
  return result
}
