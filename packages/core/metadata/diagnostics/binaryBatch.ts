import type {
  DiagnosticSource,
  DiagnosticSeverity,
  MetadataDiagnostic,
} from "../validation/types"
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

export function encodeDiagnosticBatch(
  diagnostics: Iterable<MetadataDiagnostic>,
): EncodedDiagnosticBatch {
  const writer = createDiagnosticBatchWriter()
  for (const diagnostic of diagnostics) writer.append(diagnostic)
  return writer.finish()
}

const DIAGNOSTIC_BATCH_MAGIC = 0x4444_4b4e
const DIAGNOSTIC_BATCH_VERSION = 1
const DIAGNOSTIC_HEADER_BYTES = 32
const DIAGNOSTIC_RECORD_BYTES = 24
const STRING_HEADER_BYTES = 8
const STRING_RECORD_BYTES = 8
const NONE = 0xffff_ffff
const textEncoder = new TextEncoder()
const textDecoder = new TextDecoder("utf-8", { fatal: true })
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
  readonly valueId: number
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
        valueId: diagnostic.value === undefined ? NONE : intern(diagnostic.value),
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
      const codesOffset = recordsOffset + rows.length * DIAGNOSTIC_RECORD_BYTES
      const valuesOffset = codesOffset + rows.length * Uint32Array.BYTES_PER_ELEMENT
      const bytes = new Uint8Array(valuesOffset + rows.length * Uint32Array.BYTES_PER_ELEMENT)
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
        encodeDiagnosticRecord(view, recordsOffset + index * DIAGNOSTIC_RECORD_BYTES, {
          sourceFileId: row.sourceFileId,
          line: row.line,
          col: row.col,
          messageId: row.messageId,
          pathId: row.pathId,
          severity: row.severity,
          source: row.source,
        })
        view.setUint32(codesOffset + index * Uint32Array.BYTES_PER_ELEMENT, row.codeId, true)
        view.setUint32(valuesOffset + index * Uint32Array.BYTES_PER_ELEMENT, row.valueId, true)
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
  const codesOffset = safeAdd(recordsOffset, safeMultiply(count, DIAGNOSTIC_RECORD_BYTES))
  const valuesOffset = safeAdd(codesOffset, safeMultiply(count, Uint32Array.BYTES_PER_ELEMENT))
  const expectedByteLength = safeAdd(valuesOffset, safeMultiply(count, Uint32Array.BYTES_PER_ELEMENT))
  if (
    stringsOffset !== DIAGNOSTIC_HEADER_BYTES ||
    filesOffset !== expectedFilesOffset ||
    recordsOffset !== expectedRecordsOffset ||
    expectedByteLength !== bytes.byteLength
  ) throw new Error("Повреждена структура пачки диагностик")

  const strings = openDiagnosticStringPool(bytes.buffer, stringsOffset, stringsLength)
  for (let stringId = 0; stringId < strings.count; stringId += 1) readDiagnosticString(strings, stringId)
  const filePaths = Array.from({ length: fileCount }, (_, fileId) => {
    const stringId = view.getUint32(filesOffset + fileId * Uint32Array.BYTES_PER_ELEMENT, true)
    assertStringId(stringId, strings)
    return readDiagnosticString(strings, stringId)
  })

  for (let index = 0; index < count; index += 1) {
    const record = decodeDiagnosticRecord(view, recordsOffset + index * DIAGNOSTIC_RECORD_BYTES)
    if (record.sourceFileId >= fileCount) throw new Error("Диагностика ссылается на неизвестный файл")
    assertStringId(record.messageId, strings)
    assertOptionalStringId(record.pathId, strings)
    assertOptionalStringId(view.getUint32(codesOffset + index * Uint32Array.BYTES_PER_ELEMENT, true), strings)
    assertOptionalStringId(view.getUint32(valuesOffset + index * Uint32Array.BYTES_PER_ELEMENT, true), strings)
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
      const record = decodeDiagnosticRecord(view, recordsOffset + index * DIAGNOSTIC_RECORD_BYTES)
      const path = optionalString(strings, record.pathId)
      const code = optionalString(
        strings,
        view.getUint32(codesOffset + index * Uint32Array.BYTES_PER_ELEMENT, true),
      )
      const value = optionalString(
        strings,
        view.getUint32(valuesOffset + index * Uint32Array.BYTES_PER_ELEMENT, true),
      )
      return {
        filePath: filePaths[record.sourceFileId]!,
        line: record.line,
        col: record.col,
        message: readDiagnosticString(strings, record.messageId),
        severity: SEVERITIES[record.severity] as DiagnosticSeverity,
        source: SOURCES[record.source] as DiagnosticSource,
        ...(path === undefined ? {} : { path }),
        ...(code === undefined ? {} : { code }),
        ...(value === undefined ? {} : { value }),
      }
    },
  }
}

function packStrings(values: readonly string[]): ArrayBuffer {
  const encoded = values.map((value) => textEncoder.encode(value))
  const utf8Offset = STRING_HEADER_BYTES + values.length * STRING_RECORD_BYTES
  const utf8ByteLength = encoded.reduce((total, value) => total + value.byteLength, 0)
  const bytes = new Uint8Array(utf8Offset + utf8ByteLength)
  const view = new DataView(bytes.buffer)
  ;[values.length, utf8Offset].forEach((value, index) => {
    view.setUint32(index * Uint32Array.BYTES_PER_ELEMENT, value, true)
  })
  let offset = 0
  for (const [index, value] of encoded.entries()) {
    const recordOffset = STRING_HEADER_BYTES + index * STRING_RECORD_BYTES
    view.setUint32(recordOffset, offset, true)
    view.setUint32(recordOffset + 4, value.byteLength, true)
    bytes.set(value, utf8Offset + offset)
    offset += value.byteLength
  }
  return bytes.buffer
}

function encodedByteLength(count: number, fileCount: number, stringCount: number, utf8ByteLength: number): number {
  const stringsLength = STRING_HEADER_BYTES + stringCount * STRING_RECORD_BYTES + utf8ByteLength
  return DIAGNOSTIC_HEADER_BYTES
    + stringsLength
    + fileCount * Uint32Array.BYTES_PER_ELEMENT
    + count * (DIAGNOSTIC_RECORD_BYTES + 2 * Uint32Array.BYTES_PER_ELEMENT)
}

function uint32(value: number, field: string): number {
  if (!Number.isSafeInteger(value) || value < 0 || value > NONE) {
    throw new RangeError(`${field} вне диапазона uint32`)
  }
  return value
}

interface DiagnosticStringPool {
  readonly view: DataView
  readonly count: number
  readonly recordsOffset: number
  readonly utf8Offset: number
  readonly endOffset: number
}

function openDiagnosticStringPool(
  buffer: ArrayBuffer,
  byteOffset: number,
  byteLength: number,
): DiagnosticStringPool {
  if (byteLength < STRING_HEADER_BYTES) throw new Error("Таблица строк диагностик оборвана")
  const view = new DataView(buffer)
  const count = view.getUint32(byteOffset, true)
  const relativeUtf8Offset = view.getUint32(byteOffset + 4, true)
  const expectedUtf8Offset = STRING_HEADER_BYTES + safeMultiply(count, STRING_RECORD_BYTES)
  if (relativeUtf8Offset !== expectedUtf8Offset || relativeUtf8Offset > byteLength) {
    throw new Error("Повреждена таблица строк диагностик")
  }
  return {
    view,
    count,
    recordsOffset: byteOffset + STRING_HEADER_BYTES,
    utf8Offset: byteOffset + relativeUtf8Offset,
    endOffset: byteOffset + byteLength,
  }
}

function readDiagnosticString(strings: DiagnosticStringPool, id: number): string {
  assertStringId(id, strings)
  const recordOffset = strings.recordsOffset + id * STRING_RECORD_BYTES
  const offset = strings.view.getUint32(recordOffset, true)
  const byteLength = strings.view.getUint32(recordOffset + 4, true)
  const start = safeAdd(strings.utf8Offset, offset)
  const end = safeAdd(start, byteLength)
  if (end > strings.endOffset) throw new Error("Строка диагностики выходит за границы таблицы")
  return textDecoder.decode(new Uint8Array(strings.view.buffer, start, byteLength))
}

function assertStringId(id: number, strings: DiagnosticStringPool): void {
  if (id >= strings.count) throw new Error("Диагностика ссылается на неизвестную строку")
}

function assertOptionalStringId(id: number, strings: DiagnosticStringPool): void {
  if (id !== NONE) assertStringId(id, strings)
}

function optionalString(strings: DiagnosticStringPool, id: number): string | undefined {
  return id === NONE ? undefined : readDiagnosticString(strings, id)
}

function encodeDiagnosticRecord(view: DataView, offset: number, row: Omit<EncodedRow, "codeId" | "valueId">): void {
  view.setUint32(offset, row.sourceFileId, true)
  view.setUint32(offset + 4, row.line, true)
  view.setUint32(offset + 8, row.col, true)
  view.setUint32(offset + 12, row.messageId, true)
  view.setUint32(offset + 16, row.pathId, true)
  view.setUint8(offset + 20, row.severity)
  view.setUint8(offset + 21, row.source)
  view.setUint16(offset + 22, 0, true)
}

function decodeDiagnosticRecord(view: DataView, offset: number): Omit<EncodedRow, "codeId" | "valueId"> & { reserved: number } {
  return {
    sourceFileId: view.getUint32(offset, true),
    line: view.getUint32(offset + 4, true),
    col: view.getUint32(offset + 8, true),
    messageId: view.getUint32(offset + 12, true),
    pathId: view.getUint32(offset + 16, true),
    severity: view.getUint8(offset + 20),
    source: view.getUint8(offset + 21),
    reserved: view.getUint16(offset + 22, true),
  }
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
