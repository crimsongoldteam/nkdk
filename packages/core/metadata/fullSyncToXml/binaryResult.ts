import {
  decodeConfigurationIndexFragments,
  encodeConfigurationIndexFragments,
} from "../configurationIndex/fragment"
import type { ConfigurationSnapshotFragment } from "../configurationIndex/types"
import {
  BinaryStringPoolBuilder,
  openBinaryStringPool,
  packBinaryStringPool,
  readBinaryString,
} from "../projectState/binary/stringPool"
import {
  assertMetadataWorkerBinaryResult,
  type MetadataWorkerBinaryResult,
} from "../workerPool/binaryResult"
import type {
  FullXmlSyncDiagnostic,
  FullXmlSyncExpectedOutput,
  FullXmlSyncWrittenFile,
} from "./types"

const PAYLOAD_KIND = "fullSync.batch"
const MAGIC = 0x53444b4e
const VERSION = 1
const HEADER_BYTES = 48
const DIAGNOSTIC_BYTES = 40
const FILE_BYTES = 8
const NONE = 0xffff_ffff

export interface FullXmlSyncDiagnosticBatchView {
  readonly count: number
  diagnostic(index: number): FullXmlSyncDiagnostic
}

export interface FullXmlSyncFileBatchView<T> {
  readonly count: number
  file(index: number): T
}

export interface FullXmlSyncBinaryBatchView {
  readonly diagnostics: FullXmlSyncDiagnosticBatchView
  readonly warnings: FullXmlSyncDiagnosticBatchView
  readonly writtenFiles: FullXmlSyncFileBatchView<FullXmlSyncWrittenFile>
  readonly expectedOutputs: FullXmlSyncFileBatchView<FullXmlSyncExpectedOutput>
  readonly fragmentBuffer: ArrayBuffer
}

export function createFullXmlSyncBinaryResult(params: {
  readonly diagnostics: readonly FullXmlSyncDiagnostic[]
  readonly warnings: readonly FullXmlSyncDiagnostic[]
  readonly writtenFiles: readonly FullXmlSyncWrittenFile[]
  readonly expectedOutputs: readonly FullXmlSyncExpectedOutput[]
  readonly configurationFragments?: readonly ConfigurationSnapshotFragment[]
  readonly fragmentBuffer?: ArrayBuffer
}): MetadataWorkerBinaryResult {
  if ((params.configurationFragments === undefined) === (params.fragmentBuffer === undefined)) {
    throw new Error("Двоичный результат sync должен получить один источник фрагмента индекса")
  }
  return {
    kind: "binaryResult",
    payloadKind: PAYLOAD_KIND,
    counters: {},
    buffers: [
      { name: "payload", buffer: encodePayload(params) },
      {
        name: "configuration",
        buffer: params.fragmentBuffer ?? encodeConfigurationIndexFragments(params.configurationFragments!),
      },
    ],
  }
}

export function openFullXmlSyncBinaryResult(value: unknown): FullXmlSyncBinaryBatchView {
  try {
    assertMetadataWorkerBinaryResult(value)
    if (value.payloadKind !== PAYLOAD_KIND || Object.keys(value.counters).length !== 0) {
      throw new Error("неожиданный вид результата")
    }
    const buffers = new Map(value.buffers.map(({ name, buffer }) => [name, buffer]))
    if (buffers.size !== 2 || !buffers.has("payload") || !buffers.has("configuration")) {
      throw new Error("повреждён состав буферов")
    }
    const payload = openPayload(buffers.get("payload")!)
    const fragmentBuffer = buffers.get("configuration")!
    decodeConfigurationIndexFragments(fragmentBuffer)
    return { ...payload, fragmentBuffer }
  } catch (caught) {
    throw new Error(`Некорректный двоичный результат sync: ${errorMessage(caught)}`)
  }
}

function encodePayload(params: {
  readonly diagnostics: readonly FullXmlSyncDiagnostic[]
  readonly warnings: readonly FullXmlSyncDiagnostic[]
  readonly writtenFiles: readonly FullXmlSyncWrittenFile[]
  readonly expectedOutputs: readonly FullXmlSyncExpectedOutput[]
}): ArrayBuffer {
  const strings = new BinaryStringPoolBuilder()
  const diagnostics = params.diagnostics.map((value) => encodeDiagnostic(value, strings))
  const warnings = params.warnings.map((value) => encodeDiagnostic(value, strings))
  const writtenFiles = params.writtenFiles.map((value) => encodeFile(value, strings))
  const expectedOutputs = params.expectedOutputs.map((value) => encodeFile(value, strings))
  const packedStrings = packBinaryStringPool(strings.finish())
  const diagnosticsOffset = HEADER_BYTES + packedStrings.byteLength
  const warningsOffset = diagnosticsOffset + diagnostics.length * DIAGNOSTIC_BYTES
  const writtenOffset = warningsOffset + warnings.length * DIAGNOSTIC_BYTES
  const expectedOffset = writtenOffset + writtenFiles.length * FILE_BYTES
  const buffer = new ArrayBuffer(expectedOffset + expectedOutputs.length * FILE_BYTES)
  const view = new DataView(buffer)
  view.setUint32(0, MAGIC, true)
  view.setUint32(4, VERSION, true)
  view.setUint32(8, diagnostics.length, true)
  view.setUint32(12, warnings.length, true)
  view.setUint32(16, writtenFiles.length, true)
  view.setUint32(20, expectedOutputs.length, true)
  view.setUint32(24, HEADER_BYTES, true)
  view.setUint32(28, packedStrings.byteLength, true)
  view.setUint32(32, diagnosticsOffset, true)
  view.setUint32(36, warningsOffset, true)
  view.setUint32(40, writtenOffset, true)
  view.setUint32(44, expectedOffset, true)
  new Uint8Array(buffer).set(new Uint8Array(packedStrings), HEADER_BYTES)
  diagnostics.forEach((record, index) => writeDiagnostic(view, diagnosticsOffset + index * DIAGNOSTIC_BYTES, record))
  warnings.forEach((record, index) => writeDiagnostic(view, warningsOffset + index * DIAGNOSTIC_BYTES, record))
  writtenFiles.forEach((record, index) => writeFile(view, writtenOffset + index * FILE_BYTES, record))
  expectedOutputs.forEach((record, index) => writeFile(view, expectedOffset + index * FILE_BYTES, record))
  return buffer
}

interface EncodedDiagnostic {
  readonly values: readonly number[]
}

function encodeDiagnostic(value: FullXmlSyncDiagnostic, strings: BinaryStringPoolBuilder): EncodedDiagnostic {
  return {
    values: [
      value.severity === "error" ? 1 : 2,
      strings.intern(value.code),
      optionalStringId(strings, value.source),
      strings.intern(value.message),
      optionalStringId(strings, value.assignmentId),
      optionalStringId(strings, value.sourceProjectPath),
      optionalStringId(strings, value.sourcePath),
      optionalStringId(strings, value.targetXmlPath),
      value.line ?? NONE,
      value.col ?? NONE,
    ],
  }
}

function encodeFile(
  value: FullXmlSyncWrittenFile | FullXmlSyncExpectedOutput,
  strings: BinaryStringPoolBuilder,
): readonly number[] {
  return [strings.intern(value.assignmentId), strings.intern(value.targetXmlPath)]
}

function writeDiagnostic(view: DataView, offset: number, record: EncodedDiagnostic): void {
  record.values.forEach((value, index) => view.setUint32(offset + index * 4, value, true))
}

function writeFile(view: DataView, offset: number, record: readonly number[]): void {
  view.setUint32(offset, record[0]!, true)
  view.setUint32(offset + 4, record[1]!, true)
}

function openPayload(buffer: ArrayBuffer): Omit<FullXmlSyncBinaryBatchView, "fragmentBuffer"> {
  if (buffer.byteLength < HEADER_BYTES) throw new Error("буфер оборван")
  const view = new DataView(buffer)
  if (view.getUint32(0, true) !== MAGIC || view.getUint32(4, true) !== VERSION) {
    throw new Error("неверный заголовок")
  }
  const diagnosticCount = view.getUint32(8, true)
  const warningCount = view.getUint32(12, true)
  const writtenCount = view.getUint32(16, true)
  const expectedCount = view.getUint32(20, true)
  const stringsOffset = view.getUint32(24, true)
  const stringsLength = view.getUint32(28, true)
  const diagnosticsOffset = view.getUint32(32, true)
  const warningsOffset = view.getUint32(36, true)
  const writtenOffset = view.getUint32(40, true)
  const expectedOffset = view.getUint32(44, true)
  if (stringsOffset !== HEADER_BYTES
    || diagnosticsOffset !== stringsOffset + stringsLength
    || warningsOffset !== diagnosticsOffset + diagnosticCount * DIAGNOSTIC_BYTES
    || writtenOffset !== warningsOffset + warningCount * DIAGNOSTIC_BYTES
    || expectedOffset !== writtenOffset + writtenCount * FILE_BYTES
    || expectedOffset + expectedCount * FILE_BYTES !== buffer.byteLength) {
    throw new Error("повреждена структура секций")
  }
  const strings = openBinaryStringPool(buffer, stringsOffset, stringsLength)
  const diagnostics = diagnosticView(view, strings, diagnosticsOffset, diagnosticCount)
  const warnings = diagnosticView(view, strings, warningsOffset, warningCount)
  const writtenFiles = fileView<FullXmlSyncWrittenFile>(view, strings, writtenOffset, writtenCount)
  const expectedOutputs = fileView<FullXmlSyncExpectedOutput>(view, strings, expectedOffset, expectedCount)
  for (let index = 0; index < diagnosticCount; index += 1) diagnostics.diagnostic(index)
  for (let index = 0; index < warningCount; index += 1) warnings.diagnostic(index)
  for (let index = 0; index < writtenCount; index += 1) writtenFiles.file(index)
  for (let index = 0; index < expectedCount; index += 1) expectedOutputs.file(index)
  return { diagnostics, warnings, writtenFiles, expectedOutputs }
}

function diagnosticView(
  view: DataView,
  strings: ReturnType<typeof openBinaryStringPool>,
  recordsOffset: number,
  count: number,
): FullXmlSyncDiagnosticBatchView {
  return {
    count,
    diagnostic(index) {
      assertIndex(index, count, "diagnostic")
      const offset = recordsOffset + index * DIAGNOSTIC_BYTES
      const severity = view.getUint32(offset, true)
      if (severity !== 1 && severity !== 2) throw new Error("неизвестная важность diagnostic")
      const line = view.getUint32(offset + 32, true)
      const col = view.getUint32(offset + 36, true)
      return {
        severity: severity === 1 ? "error" : "warning",
        code: requiredString(strings, view.getUint32(offset + 4, true)),
        ...optionalProperty("source", strings, view.getUint32(offset + 8, true)),
        message: requiredString(strings, view.getUint32(offset + 12, true)),
        ...optionalProperty("assignmentId", strings, view.getUint32(offset + 16, true)),
        ...optionalProperty("sourceProjectPath", strings, view.getUint32(offset + 20, true)),
        ...optionalProperty("sourcePath", strings, view.getUint32(offset + 24, true)),
        ...optionalProperty("targetXmlPath", strings, view.getUint32(offset + 28, true)),
        ...(line === NONE ? {} : { line }),
        ...(col === NONE ? {} : { col }),
      }
    },
  }
}

function fileView<T extends FullXmlSyncWrittenFile | FullXmlSyncExpectedOutput>(
  view: DataView,
  strings: ReturnType<typeof openBinaryStringPool>,
  recordsOffset: number,
  count: number,
): FullXmlSyncFileBatchView<T> {
  return {
    count,
    file(index) {
      assertIndex(index, count, "file")
      const offset = recordsOffset + index * FILE_BYTES
      return {
        assignmentId: requiredString(strings, view.getUint32(offset, true)),
        targetXmlPath: requiredString(strings, view.getUint32(offset + 4, true)),
      } as T
    },
  }
}

function optionalStringId(strings: BinaryStringPoolBuilder, value: string | undefined): number {
  return value === undefined ? NONE : strings.intern(value)
}

function requiredString(strings: ReturnType<typeof openBinaryStringPool>, id: number): string {
  if (id === NONE) throw new Error("обязательная строка отсутствует")
  return readBinaryString(strings, id)
}

function optionalProperty<K extends string>(
  key: K,
  strings: ReturnType<typeof openBinaryStringPool>,
  id: number,
): { [P in K]?: string } {
  return id === NONE ? {} : { [key]: readBinaryString(strings, id) } as { [P in K]?: string }
}

function assertIndex(index: number, count: number, kind: string): void {
  if (!Number.isSafeInteger(index) || index < 0 || index >= count) throw new RangeError(`Неизвестный ${kind}: ${index}`)
}

function errorMessage(caught: unknown): string {
  return caught instanceof Error ? caught.message : String(caught)
}
