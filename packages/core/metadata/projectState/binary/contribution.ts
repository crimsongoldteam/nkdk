import {
  assertProjectStateFileUpdateBatch,
  type ProjectStateFileUpdate,
  type ProjectStateFileUpdateBatch,
} from "../fileUpdate"
import type {
  ProjectStateImportFinalFileState,
  ProjectStateImportFinalFileStateBatch,
  ProjectStateImportIndexContribution,
} from "../importSession"
import { assertProjectStateImportFinalFileStateBatch } from "../importSession"
import {
  assertProjectStateImportIndexContribution,
  assertProjectStatePortableData,
} from "../fileUpdateValidation"
import { BinaryStringPoolBuilder, openBinaryStringPool, packBinaryStringPool, readBinaryString } from "./stringPool"
import { decodeBinaryValue, encodeBinaryValue } from "./valueCodec"
import type { ProjectStateEncodedFileUpdateBatch } from "../contracts/fileUpdate"
export type { ProjectStateEncodedFileUpdateBatch } from "../contracts/fileUpdate"

export interface ProjectStateEncodedImportIndexBatch {
  readonly bytes: Uint8Array<ArrayBuffer>
}

export interface ProjectStateEncodedImportFinalBatch {
  readonly bytes: Uint8Array<ArrayBuffer>
}

export interface ProjectStateImportIndexBatchView {
  readonly fileCount: number
  contribution(index: number): ProjectStateImportIndexContribution
}

export interface ProjectStateImportFinalBatchView {
  readonly fileCount: number
  hash(index: number): bigint
  finalState(index: number): ProjectStateImportFinalFileState
}

export interface ProjectStateFileUpdateBatchView {
  readonly fileCount: number
  projectPath(index: number): string
  hash(index: number): bigint
  targets(index: number): ProjectStateFileUpdate["targets"]
  update(index: number): ProjectStateFileUpdate
}

const MAGIC = 0x43444b4e
const VERSION = 1
const HEADER_BYTES = 32
const RECORD_BYTES = 32
const IMPORT_INDEX_MAGIC = 0x49444b4e
const IMPORT_FINAL_MAGIC = 0x46444b4e
const IMPORT_RECORD_BYTES = 24

export function encodeProjectStateImportIndexBatch(
  contributions: readonly ProjectStateImportIndexContribution[],
): ProjectStateEncodedImportIndexBatch {
  assertProjectStatePortableData(contributions, "contributions")
  contributions.forEach((contribution, index) =>
    assertProjectStateImportIndexContribution(contribution, `contributions[${index}]`)
  )
  return encodeImportBatch(IMPORT_INDEX_MAGIC, contributions)
}

export function openProjectStateImportIndexBatch(
  batch: ProjectStateEncodedImportIndexBatch,
): ProjectStateImportIndexBatchView {
  const view = openImportBatch(batch, IMPORT_INDEX_MAGIC)
  return {
    fileCount: view.fileCount,
    contribution(index) {
      return view.value(index) as ProjectStateImportIndexContribution
    },
  }
}

export function encodeProjectStateImportFinalBatch(
  batch: ProjectStateImportFinalFileStateBatch,
): ProjectStateEncodedImportFinalBatch {
  assertProjectStateImportFinalFileStateBatch(batch)
  const hashes = new DataView(batch.hashBytes.buffer, batch.hashBytes.byteOffset, batch.hashBytes.byteLength)
  return encodeImportBatch(
    IMPORT_FINAL_MAGIC,
    batch.updates,
    (index) => hashes.getBigUint64(index * 8, false),
  )
}

export function openProjectStateImportFinalBatch(
  batch: ProjectStateEncodedImportFinalBatch,
): ProjectStateImportFinalBatchView {
  const view = openImportBatch(batch, IMPORT_FINAL_MAGIC)
  return {
    fileCount: view.fileCount,
    hash: view.hash,
    finalState(index) {
      return view.value(index) as ProjectStateImportFinalFileState
    },
  }
}

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
  const { bytes, view, recordsOffset, payloadOffset } = createPayloadEnvelope({
    magic: MAGIC,
    count: batch.updates.length,
    recordBytes: RECORD_BYTES,
    packedStrings,
    payloads,
  })

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

function encodeImportBatch(
  magic: number,
  values: readonly (ProjectStateImportIndexContribution | ProjectStateImportFinalFileState)[],
  hash: (index: number) => bigint = () => 0n,
): { readonly bytes: Uint8Array<ArrayBuffer> } {
  const strings = new BinaryStringPoolBuilder()
  const payloads = values.map((value) => encodeBinaryValue(value, strings))
  const packedStrings = packBinaryStringPool(strings.finish())
  const { bytes, view, recordsOffset, payloadOffset } = createPayloadEnvelope({
    magic,
    count: values.length,
    recordBytes: IMPORT_RECORD_BYTES,
    packedStrings,
    payloads,
  })
  let nextPayloadOffset = payloadOffset
  payloads.forEach((payload, index) => {
    const offset = recordsOffset + index * IMPORT_RECORD_BYTES
    view.setBigUint64(offset, hash(index), true)
    view.setUint32(offset + 8, nextPayloadOffset, true)
    view.setUint32(offset + 12, payload.byteLength, true)
    bytes.set(payload, nextPayloadOffset)
    nextPayloadOffset += payload.byteLength
  })
  return { bytes }
}

function createPayloadEnvelope(params: {
  readonly magic: number
  readonly count: number
  readonly recordBytes: number
  readonly packedStrings: SharedArrayBuffer
  readonly payloads: readonly Uint8Array[]
}) {
  const recordsOffset = HEADER_BYTES
  const stringsOffset = recordsOffset + params.count * params.recordBytes
  const payloadOffset = stringsOffset + params.packedStrings.byteLength
  const payloadBytes = params.payloads.reduce((sum, payload) => sum + payload.byteLength, 0)
  const buffer = new ArrayBuffer(payloadOffset + payloadBytes)
  const bytes = new Uint8Array(buffer)
  const view = new DataView(buffer)
  view.setUint32(0, params.magic, true)
  view.setUint32(4, VERSION, true)
  view.setUint32(8, params.count, true)
  view.setUint32(12, recordsOffset, true)
  view.setUint32(16, stringsOffset, true)
  view.setUint32(20, params.packedStrings.byteLength, true)
  view.setUint32(24, payloadOffset, true)
  view.setUint32(28, buffer.byteLength, true)
  bytes.set(new Uint8Array(params.packedStrings), stringsOffset)
  return { bytes, view, recordsOffset, payloadOffset }
}

function openImportBatch(
  batch: { readonly bytes: Uint8Array<ArrayBuffer> },
  magic: number,
): {
  readonly fileCount: number
  hash(index: number): bigint
  value(index: number): unknown
} {
  const { bytes, view, fileCount, recordsOffset, strings, payloadOffset } = openPayloadEnvelope(
    batch,
    { magic, recordBytes: IMPORT_RECORD_BYTES, label: "import" },
  )
  let expectedPayloadOffset = payloadOffset
  for (let index = 0; index < fileCount; index += 1) {
    const record = readRecord(index)
    if (
      record.payloadOffset !== expectedPayloadOffset
      || record.payloadOffset + record.payloadLength > bytes.byteLength
    ) {
      throw new Error("Запись двоичного вклада import повреждена")
    }
    expectedPayloadOffset += record.payloadLength
  }
  if (expectedPayloadOffset !== bytes.byteLength) throw new Error("Полезные данные двоичного вклада import повреждены")
  return {
    fileCount,
    hash(index) {
      return readRecordChecked(index).hash
    },
    value(index) {
      const record = readRecordChecked(index)
      return decodeBinaryValue(bytes.subarray(record.payloadOffset, record.payloadOffset + record.payloadLength), strings)
    },
  }

  function readRecordChecked(index: number) {
    if (!Number.isSafeInteger(index) || index < 0 || index >= fileCount) {
      throw new Error(`Неизвестный файл двоичного вклада import: ${index}`)
    }
    return readRecord(index)
  }

  function readRecord(index: number) {
    const offset = recordsOffset + index * IMPORT_RECORD_BYTES
    return {
      hash: view.getBigUint64(offset, true),
      payloadOffset: view.getUint32(offset + 8, true),
      payloadLength: view.getUint32(offset + 12, true),
    }
  }
}

export function openProjectStateFileUpdateBatch(
  batch: ProjectStateEncodedFileUpdateBatch,
): ProjectStateFileUpdateBatchView {
  const { bytes, view, fileCount, recordsOffset, strings, payloadOffset } = openPayloadEnvelope(
    batch,
    { magic: MAGIC, recordBytes: RECORD_BYTES, label: "файлов" },
  )
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
    targets(index) {
      const update = decodeUpdate(index)
      return update.targets
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

function openPayloadEnvelope(
  batch: { readonly bytes: Uint8Array<ArrayBuffer> },
  params: { readonly magic: number; readonly recordBytes: number; readonly label: string },
) {
  assertEncodedBatch(batch)
  const { bytes } = batch
  if (bytes.byteLength < HEADER_BYTES) throw new Error(`Двоичный вклад ${params.label} оборван`)
  const view = new DataView(bytes.buffer)
  const fileCount = view.getUint32(8, true)
  const recordsOffset = view.getUint32(12, true)
  const stringsOffset = view.getUint32(16, true)
  const stringsLength = view.getUint32(20, true)
  const payloadOffset = view.getUint32(24, true)
  if (
    view.getUint32(0, true) !== params.magic
    || view.getUint32(4, true) !== VERSION
    || view.getUint32(28, true) !== bytes.byteLength
    || recordsOffset !== HEADER_BYTES
    || stringsOffset !== recordsOffset + fileCount * params.recordBytes
    || payloadOffset !== stringsOffset + stringsLength
    || payloadOffset > bytes.byteLength
  ) {
    throw new Error(`Структура двоичного вклада ${params.label} повреждена`)
  }
  const strings = openBinaryStringPool(bytes.buffer, stringsOffset, stringsLength)
  return { bytes, view, fileCount, recordsOffset, strings, payloadOffset }
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
