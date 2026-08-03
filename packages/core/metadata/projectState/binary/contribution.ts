import {
  assertProjectStateFileUpdateBatch,
  type ProjectStateFileUpdate,
  type ProjectStateFileUpdateBatch,
} from "../fileUpdate"
import { BinaryStringPoolBuilder, openBinaryStringPool, packBinaryStringPool, readBinaryString } from "./stringPool"
import { decodeBinaryValue, encodeBinaryValue } from "./valueCodec"

export interface ProjectStateEncodedFileUpdateBatch {
  readonly bytes: Uint8Array<ArrayBuffer>
}

export interface ProjectStateFileUpdateBatchView {
  readonly fileCount: number
  projectPath(index: number): string
  hash(index: number): bigint
  references(index: number): Extract<ProjectStateFileUpdate, { kind: "yaml" }>["references"]
  update(index: number): ProjectStateFileUpdate
}

const MAGIC = 0x43444b4e
const VERSION = 1
const HEADER_BYTES = 32
const RECORD_BYTES = 32
export function encodeProjectStateFileUpdateBatch(
  batch: ProjectStateFileUpdateBatch,
): ProjectStateEncodedFileUpdateBatch {
  assertProjectStateFileUpdateBatch(batch)
  const strings = new BinaryStringPoolBuilder()
  const payloads = batch.updates.map((update) => {
    strings.intern(update.projectPath)
    strings.intern(update.componentPath)
    return encodeBinaryValue(update, strings)
  })
  const pool = strings.finish()
  const packedStrings = packBinaryStringPool(pool)
  const recordsOffset = HEADER_BYTES
  const stringsOffset = recordsOffset + batch.updates.length * RECORD_BYTES
  const payloadOffset = stringsOffset + packedStrings.byteLength
  const payloadBytes = payloads.reduce((sum, payload) => sum + payload.byteLength, 0)
  const buffer = new ArrayBuffer(payloadOffset + payloadBytes)
  const bytes = new Uint8Array(buffer)
  const view = new DataView(buffer)
  view.setUint32(0, MAGIC, true)
  view.setUint32(4, VERSION, true)
  view.setUint32(8, batch.updates.length, true)
  view.setUint32(12, recordsOffset, true)
  view.setUint32(16, stringsOffset, true)
  view.setUint32(20, packedStrings.byteLength, true)
  view.setUint32(24, payloadOffset, true)
  view.setUint32(28, buffer.byteLength, true)
  bytes.set(new Uint8Array(packedStrings), stringsOffset)

  const hashView = new DataView(batch.hashBytes.buffer, batch.hashBytes.byteOffset, batch.hashBytes.byteLength)
  let nextPayloadOffset = payloadOffset
  batch.updates.forEach((update, index) => {
    const offset = recordsOffset + index * RECORD_BYTES
    view.setUint32(offset, strings.intern(update.projectPath), true)
    view.setUint32(offset + 4, strings.intern(update.componentPath), true)
    view.setBigUint64(offset + 8, hashView.getBigUint64(index * 8, false), true)
    view.setUint32(offset + 16, nextPayloadOffset, true)
    view.setUint32(offset + 20, payloads[index]!.byteLength, true)
    view.setUint8(offset + 24, update.kind === "yaml" ? 1 : 2)
    bytes.set(payloads[index]!, nextPayloadOffset)
    nextPayloadOffset += payloads[index]!.byteLength
  })
  return { bytes }
}

export function openProjectStateFileUpdateBatch(
  batch: ProjectStateEncodedFileUpdateBatch,
): ProjectStateFileUpdateBatchView {
  assertEncodedBatch(batch)
  const { bytes } = batch
  if (bytes.byteLength < HEADER_BYTES) throw new Error("Двоичный вклад файлов оборван")
  const view = new DataView(bytes.buffer)
  const fileCount = view.getUint32(8, true)
  const recordsOffset = view.getUint32(12, true)
  const stringsOffset = view.getUint32(16, true)
  const stringsLength = view.getUint32(20, true)
  const payloadOffset = view.getUint32(24, true)
  if (
    view.getUint32(0, true) !== MAGIC
    || view.getUint32(4, true) !== VERSION
    || view.getUint32(28, true) !== bytes.byteLength
    || recordsOffset !== HEADER_BYTES
    || stringsOffset !== recordsOffset + fileCount * RECORD_BYTES
    || payloadOffset !== stringsOffset + stringsLength
    || payloadOffset > bytes.byteLength
  ) {
    throw new Error("Структура двоичного вклада файлов повреждена")
  }
  const strings = openBinaryStringPool(bytes.buffer, stringsOffset, stringsLength)
  let expectedPayloadOffset = payloadOffset
  for (let index = 0; index < fileCount; index += 1) {
    const record = readRecord(index)
    readBinaryString(strings, record.projectPathId)
    readBinaryString(strings, record.componentPathId)
    if (
      record.updateKind !== 1 && record.updateKind !== 2
      || record.payloadOffset !== expectedPayloadOffset
      || record.payloadOffset + record.payloadLength > bytes.byteLength
    ) {
      throw new Error("Запись двоичного вклада файлов повреждена")
    }
    expectedPayloadOffset += record.payloadLength
  }
  if (expectedPayloadOffset !== bytes.byteLength) throw new Error("Полезные данные двоичного вклада повреждены")

  return {
    fileCount,
    projectPath(index) {
      return readBinaryString(strings, readRecordChecked(index).projectPathId)
    },
    hash(index) {
      return readRecordChecked(index).hash
    },
    references(index) {
      const update = decodeUpdate(index)
      return update.kind === "yaml" ? update.references : []
    },
    update: decodeUpdate,
  }

  function decodeUpdate(index: number): ProjectStateFileUpdate {
    const record = readRecordChecked(index)
    const update = decodeBinaryValue(
      bytes.subarray(record.payloadOffset, record.payloadOffset + record.payloadLength),
      strings,
    ) as ProjectStateFileUpdate
    if ((record.updateKind === 1) !== (update.kind === "yaml")) {
      throw new Error("Вид файла двоичного вклада не совпадает с полезными данными")
    }
    return update
  }

  function readRecordChecked(index: number) {
    if (!Number.isSafeInteger(index) || index < 0 || index >= fileCount) {
      throw new Error(`Неизвестный файл двоичного вклада: ${index}`)
    }
    return readRecord(index)
  }

  function readRecord(index: number) {
    const offset = recordsOffset + index * RECORD_BYTES
    return {
      projectPathId: view.getUint32(offset, true),
      componentPathId: view.getUint32(offset + 4, true),
      hash: view.getBigUint64(offset + 8, true),
      payloadOffset: view.getUint32(offset + 16, true),
      payloadLength: view.getUint32(offset + 20, true),
      updateKind: view.getUint8(offset + 24),
    }
  }
}

function assertEncodedBatch(value: unknown): asserts value is ProjectStateEncodedFileUpdateBatch {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error("Двоичный вклад файлов должен быть объектом")
  }
  const record = value as Record<string, unknown>
  if (Object.keys(record).length !== 1 || !(record["bytes"] instanceof Uint8Array)) {
    throw new Error("Двоичный вклад файлов должен содержать только bytes")
  }
  const bytes = record["bytes"]
  if (
    !(bytes.buffer instanceof ArrayBuffer)
    || bytes.byteOffset !== 0
    || bytes.byteLength !== bytes.buffer.byteLength
  ) {
    throw new Error("bytes должен владеть целым ArrayBuffer")
  }
}
