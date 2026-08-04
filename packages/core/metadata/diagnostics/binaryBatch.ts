import type {
  DiagnosticSource,
  DiagnosticSeverity,
  MetadataDiagnostic,
} from "../validation/types"
import {
  ProjectStateDiagnosticRecordView,
  ProjectStateHashSlotRecordView,
  ProjectStateStringRecordView,
  ProjectStateStringSectionHeaderView,
} from "../projectState/binary/layouts"
import {
  BinaryStringPoolBuilder,
  openBinaryStringPool,
  packBinaryStringPool,
  readBinaryString,
  type BinaryStringPool,
} from "../projectState/binary/stringPool"

export interface EncodedDiagnosticBatch {
  readonly bytes: Uint8Array<ArrayBuffer>
}

export interface DiagnosticBatchView {
  readonly count: number
  diagnostic(index: number): MetadataDiagnostic
}

export interface DiagnosticBatchWriter {
  append(diagnostic: MetadataDiagnostic): void
  readonly byteLength: number
  finish(): EncodedDiagnosticBatch
  discard(): void
}

const DIAGNOSTIC_BATCH_MAGIC = 0x4444_4b4e
const DIAGNOSTIC_BATCH_VERSION = 1
const DIAGNOSTIC_HEADER_BYTES = 32
const NONE = 0xffff_ffff
const MAX_LOAD_FACTOR = 0.8
const textEncoder = new TextEncoder()
const SEVERITIES = [undefined, "error", "warning"] as const
const SOURCES = [undefined, "syntax", "structure", "external-file", "cross-file", "reference"] as const
const SEVERITY_IDS = { error: 1, warning: 2 } as const
const SOURCE_IDS = {
  syntax: 1,
  structure: 2,
  "external-file": 3,
  "cross-file": 4,
  reference: 5,
} as const

interface EncodedRow {
  readonly sourceFileId: number
  readonly line: number
  readonly col: number
  readonly messageId: number
  readonly pathId: number
  readonly severity: number
  readonly source: number
  readonly codeId: number
}

export function createDiagnosticBatchWriter(): DiagnosticBatchWriter {
  let rows: EncodedRow[] = []
  let stringIds = new Map<string, number>()
  let stringValues: string[] = []
  let utf8ByteLength = 0
  let fileIds = new Map<string, number>()
  let filePathStringIds: number[] = []
  let closed = false

  return {
    append(diagnostic) {
      assertOpen()
      const sourceFileId = internFile(diagnostic.filePath)
      rows.push({
        sourceFileId,
        line: uint32(diagnostic.line, "line"),
        col: uint32(diagnostic.col, "col"),
        messageId: intern(diagnostic.message),
        pathId: diagnostic.path === undefined ? NONE : intern(diagnostic.path),
        severity: SEVERITY_IDS[diagnostic.severity],
        source: SOURCE_IDS[diagnostic.source],
        codeId: diagnostic.code === undefined ? NONE : intern(diagnostic.code),
      })
    },
    get byteLength() {
      assertOpen()
      return encodedByteLength(rows.length, filePathStringIds.length, stringValues.length, utf8ByteLength)
    },
    finish() {
      assertOpen()
      closed = true
      const strings = packStrings(stringValues)
      const stringsOffset = DIAGNOSTIC_HEADER_BYTES
      const filesOffset = stringsOffset + strings.byteLength
      const recordsOffset = filesOffset + filePathStringIds.length * Uint32Array.BYTES_PER_ELEMENT
      const codesOffset = recordsOffset + rows.length * ProjectStateDiagnosticRecordView.viewLength
      const bytes = new Uint8Array(codesOffset + rows.length * Uint32Array.BYTES_PER_ELEMENT)
      const view = new DataView(bytes.buffer)

      view.setUint32(0, DIAGNOSTIC_BATCH_MAGIC, true)
      view.setUint16(4, DIAGNOSTIC_BATCH_VERSION, true)
      view.setUint16(6, 0, true)
      view.setUint32(8, rows.length, true)
      view.setUint32(12, filePathStringIds.length, true)
      view.setUint32(16, stringsOffset, true)
      view.setUint32(20, strings.byteLength, true)
      view.setUint32(24, filesOffset, true)
      view.setUint32(28, recordsOffset, true)
      bytes.set(new Uint8Array(strings), stringsOffset)

      filePathStringIds.forEach((stringId, index) => {
        view.setUint32(filesOffset + index * Uint32Array.BYTES_PER_ELEMENT, stringId, true)
      })
      rows.forEach((row, index) => {
        ProjectStateDiagnosticRecordView.encode({
          sourceFileId: row.sourceFileId,
          line: row.line,
          col: row.col,
          messageId: row.messageId,
          pathId: row.pathId,
          severity: row.severity,
          source: row.source,
          reserved: 0,
        }, view, recordsOffset + index * ProjectStateDiagnosticRecordView.viewLength)
        view.setUint32(codesOffset + index * Uint32Array.BYTES_PER_ELEMENT, row.codeId, true)
      })
      release()
      return { bytes }
    },
    discard() {
      if (closed) return
      closed = true
      release()
    },
  }

  function assertOpen(): void {
    if (closed) throw new Error("Writer двоичной пачки диагностик уже завершён")
  }

  function intern(value: string): number {
    const existing = stringIds.get(value)
    if (existing !== undefined) return existing
    const id = stringValues.length
    stringIds.set(value, id)
    stringValues.push(value)
    utf8ByteLength += textEncoder.encode(value).byteLength
    return id
  }

  function internFile(filePath: string): number {
    const existing = fileIds.get(filePath)
    if (existing !== undefined) return existing
    const id = filePathStringIds.length
    fileIds.set(filePath, id)
    filePathStringIds.push(intern(filePath))
    return id
  }

  function release(): void {
    rows = []
    stringIds = new Map()
    stringValues = []
    utf8ByteLength = 0
    fileIds = new Map()
    filePathStringIds = []
  }
}

export function openDiagnosticBatch(batch: EncodedDiagnosticBatch): DiagnosticBatchView {
  const { bytes } = batch
  if (bytes.byteOffset !== 0 || bytes.byteLength !== bytes.buffer.byteLength) {
    throw new Error("Двоичная пачка диагностик должна владеть всем ArrayBuffer")
  }
  if (bytes.byteLength < DIAGNOSTIC_HEADER_BYTES) throw new Error("Заголовок пачки диагностик оборван")
  const view = new DataView(bytes.buffer)
  if (view.getUint32(0, true) !== DIAGNOSTIC_BATCH_MAGIC) throw new Error("Неизвестный формат пачки диагностик")
  if (view.getUint16(4, true) !== DIAGNOSTIC_BATCH_VERSION) throw new Error("Неизвестная версия пачки диагностик")
  if (view.getUint16(6, true) !== 0) throw new Error("Повреждён заголовок пачки диагностик")

  const count = view.getUint32(8, true)
  const fileCount = view.getUint32(12, true)
  const stringsOffset = view.getUint32(16, true)
  const stringsLength = view.getUint32(20, true)
  const filesOffset = view.getUint32(24, true)
  const recordsOffset = view.getUint32(28, true)
  const expectedFilesOffset = safeAdd(stringsOffset, stringsLength)
  const expectedRecordsOffset = safeAdd(filesOffset, safeMultiply(fileCount, Uint32Array.BYTES_PER_ELEMENT))
  const codesOffset = safeAdd(recordsOffset, safeMultiply(count, ProjectStateDiagnosticRecordView.viewLength))
  const expectedByteLength = safeAdd(codesOffset, safeMultiply(count, Uint32Array.BYTES_PER_ELEMENT))
  if (
    stringsOffset !== DIAGNOSTIC_HEADER_BYTES ||
    filesOffset !== expectedFilesOffset ||
    recordsOffset !== expectedRecordsOffset ||
    expectedByteLength !== bytes.byteLength
  ) throw new Error("Повреждена структура пачки диагностик")

  const strings = openBinaryStringPool(bytes.buffer, stringsOffset, stringsLength)
  for (let stringId = 0; stringId < strings.count; stringId += 1) readBinaryString(strings, stringId)
  const filePaths = Array.from({ length: fileCount }, (_, fileId) => {
    const stringId = view.getUint32(filesOffset + fileId * Uint32Array.BYTES_PER_ELEMENT, true)
    assertStringId(stringId, strings)
    return readBinaryString(strings, stringId)
  })

  for (let index = 0; index < count; index += 1) {
    const record = ProjectStateDiagnosticRecordView.decode(
      view,
      recordsOffset + index * ProjectStateDiagnosticRecordView.viewLength,
    )
    if (record.sourceFileId >= fileCount) throw new Error("Диагностика ссылается на неизвестный файл")
    assertStringId(record.messageId, strings)
    assertOptionalStringId(record.pathId, strings)
    assertOptionalStringId(view.getUint32(codesOffset + index * Uint32Array.BYTES_PER_ELEMENT, true), strings)
    if (record.severity < 1 || record.severity >= SEVERITIES.length) throw new Error("Неизвестная важность диагностики")
    if (record.source < 1 || record.source >= SOURCES.length) throw new Error("Неизвестный источник диагностики")
    if (record.reserved !== 0) throw new Error("Повреждена запись диагностики")
  }

  return {
    count,
    diagnostic(index) {
      if (!Number.isSafeInteger(index) || index < 0 || index >= count) {
        throw new RangeError(`Неизвестная диагностика: ${index}`)
      }
      const record = ProjectStateDiagnosticRecordView.decode(
        view,
        recordsOffset + index * ProjectStateDiagnosticRecordView.viewLength,
      )
      const path = optionalString(strings, record.pathId)
      const code = optionalString(
        strings,
        view.getUint32(codesOffset + index * Uint32Array.BYTES_PER_ELEMENT, true),
      )
      return {
        filePath: filePaths[record.sourceFileId]!,
        line: record.line,
        col: record.col,
        message: readBinaryString(strings, record.messageId),
        severity: SEVERITIES[record.severity] as DiagnosticSeverity,
        source: SOURCES[record.source] as DiagnosticSource,
        ...(path === undefined ? {} : { path }),
        ...(code === undefined ? {} : { code }),
      }
    },
  }
}

function packStrings(values: readonly string[]): SharedArrayBuffer {
  const builder = new BinaryStringPoolBuilder()
  values.forEach((value, expectedId) => {
    const actualId = builder.intern(value)
    if (actualId !== expectedId) throw new Error("Нарушен порядок строк пачки диагностик")
  })
  return packBinaryStringPool(builder.finish())
}

function encodedByteLength(count: number, fileCount: number, stringCount: number, utf8ByteLength: number): number {
  const lookupCapacity = capacityFor(stringCount)
  const stringsLength = ProjectStateStringSectionHeaderView.viewLength
    + stringCount * ProjectStateStringRecordView.viewLength
    + utf8ByteLength
    + lookupCapacity * ProjectStateHashSlotRecordView.viewLength
  return DIAGNOSTIC_HEADER_BYTES
    + stringsLength
    + fileCount * Uint32Array.BYTES_PER_ELEMENT
    + count * (ProjectStateDiagnosticRecordView.viewLength + Uint32Array.BYTES_PER_ELEMENT)
}

function capacityFor(size: number): number {
  const minimumCapacity = Math.max(1, Math.ceil(size / MAX_LOAD_FACTOR))
  let capacity = 1
  while (capacity < minimumCapacity) capacity *= 2
  return capacity
}

function uint32(value: number, field: string): number {
  if (!Number.isSafeInteger(value) || value < 0 || value > NONE) {
    throw new RangeError(`${field} вне диапазона uint32`)
  }
  return value
}

function assertStringId(id: number, strings: BinaryStringPool): void {
  if (id >= strings.count) throw new Error("Диагностика ссылается на неизвестную строку")
}

function assertOptionalStringId(id: number, strings: BinaryStringPool): void {
  if (id !== NONE) assertStringId(id, strings)
}

function optionalString(strings: BinaryStringPool, id: number): string | undefined {
  return id === NONE ? undefined : readBinaryString(strings, id)
}

function safeAdd(left: number, right: number): number {
  const result = left + right
  if (!Number.isSafeInteger(result)) throw new Error("Размер пачки диагностик переполнен")
  return result
}

function safeMultiply(left: number, right: number): number {
  const result = left * right
  if (!Number.isSafeInteger(result)) throw new Error("Размер пачки диагностик переполнен")
  return result
}
