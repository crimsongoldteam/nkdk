import {
  encodeDiagnosticBatch,
  openDiagnosticBatch,
  type DiagnosticBatchView,
} from "@nkdk/runtime"
import {
  decodeConfigurationBlockFragments,
  encodeConfigurationBlockFragments,
} from "@nkdk/runtime"
import type { ConfigurationIndexBlockFragment } from "@nkdk/runtime"
import {
  openProjectStateFragment,
  type ProjectStateFragment,
} from "../projectState/binary/fragment"
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
import {
  PROJECT_STATE_FRAGMENT_BUFFER_NAMES,
  projectStateFragmentFromNamedBuffers,
} from "../workerPool/projectStateBuffers"
import type { ImportDiagnostic, ImportResultFile } from "./types"
import type { MetadataDiagnostic } from "../validation/types"

const PAYLOAD_KIND = "import.batch"
const FILE_HEADER_BYTES = 16
const FILE_RECORD_BYTES = 12

export interface ImportResultFileBatchView {
  readonly count: number
  file(index: number): ImportResultFile
}

export interface ImportBinaryBatchView {
  readonly diagnostics: DiagnosticBatchView
  readonly warnings: DiagnosticBatchView
  readonly files: ImportResultFileBatchView
  readonly configurationFragmentBuffer?: ArrayBuffer
  readonly stateFragment?: ProjectStateFragment
}

export function createImportBinaryResult(params: {
  readonly diagnostics: readonly ImportDiagnostic[]
  readonly warnings?: readonly ImportDiagnostic[]
  readonly files: readonly ImportResultFile[]
  readonly configurationFragments?: readonly ConfigurationIndexBlockFragment[]
  readonly stateFragment?: ProjectStateFragment
}): MetadataWorkerBinaryResult {
  const configuration = params.configurationFragments === undefined
    ? undefined
    : encodeConfigurationBlockFragments(params.configurationFragments)
  return {
    kind: "binaryResult",
    payloadKind: PAYLOAD_KIND,
    counters: {
      hasConfiguration: configuration === undefined ? 0 : 1,
      hasState: params.stateFragment === undefined ? 0 : 1,
    },
    buffers: [
      { name: "diagnostics", buffer: encodeImportDiagnostics(params.diagnostics) },
      { name: "warnings", buffer: encodeImportDiagnostics(params.warnings ?? []) },
      { name: "files", buffer: encodeFiles(params.files) },
      ...(configuration === undefined ? [] : [{ name: "configuration", buffer: configuration }]),
      ...PROJECT_STATE_FRAGMENT_BUFFER_NAMES.map((name) => params.stateFragment === undefined
        ? undefined
        : { name: `projectState.${name}`, buffer: params.stateFragment.buffers[name] })
        .filter((entry): entry is { name: string; buffer: ArrayBuffer } => entry !== undefined),
    ],
  }
}

export function openImportBinaryResult(value: unknown): ImportBinaryBatchView {
  assertMetadataWorkerBinaryResult(value)
  if (value.payloadKind !== PAYLOAD_KIND) throw new Error("Worker вернул неожиданный двоичный результат import")
  assertFlag(value.counters.hasConfiguration, "hasConfiguration")
  assertFlag(value.counters.hasState, "hasState")
  if (Object.keys(value.counters).length !== 2) throw new Error("Повреждены счётчики двоичного результата import")
  const buffers = new Map(value.buffers.map(({ name, buffer }) => [name, buffer]))
  const expected = [
    "diagnostics",
    "warnings",
    "files",
    ...(value.counters.hasConfiguration === 1 ? ["configuration"] : []),
    ...(value.counters.hasState === 1 ? PROJECT_STATE_FRAGMENT_BUFFER_NAMES.map((name) => `projectState.${name}`) : []),
  ]
  if (buffers.size !== expected.length || expected.some((name) => !buffers.has(name))) {
    throw new Error("Повреждён состав буферов двоичного результата import")
  }
  const configurationFragmentBuffer = buffers.get("configuration")
  if (configurationFragmentBuffer !== undefined) decodeConfigurationBlockFragments(configurationFragmentBuffer)
  const stateFragment = value.counters.hasState === 0 ? undefined : projectStateFragmentFromNamedBuffers(buffers)
  if (stateFragment !== undefined) openProjectStateFragment(stateFragment)
  return {
    diagnostics: openDiagnosticBatch({ bytes: new Uint8Array(requireBuffer(buffers, "diagnostics")) }),
    warnings: openDiagnosticBatch({ bytes: new Uint8Array(requireBuffer(buffers, "warnings")) }),
    files: openFiles(requireBuffer(buffers, "files")),
    ...(configurationFragmentBuffer === undefined ? {} : { configurationFragmentBuffer }),
    ...(stateFragment === undefined ? {} : { stateFragment }),
  }
}

export function importDiagnostic(view: DiagnosticBatchView, index: number): ImportDiagnostic {
  return importDiagnosticValue(view.diagnostic(index))
}

export function importDiagnosticValue(diagnostic: MetadataDiagnostic): ImportDiagnostic {
  if (diagnostic.code === undefined) throw new Error("Import diagnostic не содержит code")
  return {
    severity: diagnostic.severity,
    code: diagnostic.code,
    message: diagnostic.message,
    targetProjectPath: diagnostic.filePath,
    ...(diagnostic.path === undefined ? {} : { sourcePath: diagnostic.path }),
    ...(diagnostic.value === undefined ? {} : { value: diagnostic.value }),
  }
}

function encodeImportDiagnostics(diagnostics: readonly ImportDiagnostic[]): ArrayBuffer {
  return encodeDiagnosticBatch(diagnostics.map((diagnostic) => ({
    filePath: diagnostic.targetProjectPath,
    line: 1,
    col: 1,
    severity: diagnostic.severity,
    source: "structure" as const,
    message: diagnostic.message,
    code: diagnostic.code,
    ...(diagnostic.sourcePath === undefined ? {} : { path: diagnostic.sourcePath }),
    ...(diagnostic.value === undefined ? {} : { value: diagnostic.value }),
  }))).bytes.buffer
}

function encodeFiles(files: readonly ImportResultFile[]): ArrayBuffer {
  const strings = new BinaryStringPoolBuilder()
  const records = files.map((file) => ({
    kind: file.sourceKind === "worker" ? 1 : 2,
    sourcePathId: strings.intern(file.sourcePath),
    targetProjectPathId: strings.intern(file.targetProjectPath),
  }))
  const packed = packBinaryStringPool(strings.finish())
  const recordsOffset = FILE_HEADER_BYTES + packed.byteLength
  const buffer = new ArrayBuffer(recordsOffset + records.length * FILE_RECORD_BYTES)
  const view = new DataView(buffer)
  view.setUint32(0, records.length, true)
  view.setUint32(4, FILE_HEADER_BYTES, true)
  view.setUint32(8, packed.byteLength, true)
  view.setUint32(12, recordsOffset, true)
  new Uint8Array(buffer).set(new Uint8Array(packed), FILE_HEADER_BYTES)
  records.forEach((record, index) => {
    const offset = recordsOffset + index * FILE_RECORD_BYTES
    view.setUint32(offset, record.kind, true)
    view.setUint32(offset + 4, record.sourcePathId, true)
    view.setUint32(offset + 8, record.targetProjectPathId, true)
  })
  return buffer
}

function openFiles(buffer: ArrayBuffer): ImportResultFileBatchView {
  if (buffer.byteLength < FILE_HEADER_BYTES) throw new Error("Буфер файлов import оборван")
  const view = new DataView(buffer)
  const count = view.getUint32(0, true)
  const stringsOffset = view.getUint32(4, true)
  const stringsLength = view.getUint32(8, true)
  const recordsOffset = view.getUint32(12, true)
  if (stringsOffset !== FILE_HEADER_BYTES || recordsOffset !== stringsOffset + stringsLength
    || recordsOffset + count * FILE_RECORD_BYTES !== buffer.byteLength) {
    throw new Error("Повреждена структура буфера файлов import")
  }
  const strings = openBinaryStringPool(buffer, stringsOffset, stringsLength)
  for (let index = 0; index < count; index += 1) decodeFile(index)
  return { count, file: decodeFile }

  function decodeFile(index: number): ImportResultFile {
    if (!Number.isSafeInteger(index) || index < 0 || index >= count) throw new RangeError(`Неизвестный файл import: ${index}`)
    const offset = recordsOffset + index * FILE_RECORD_BYTES
    const kind = view.getUint32(offset, true)
    if (kind !== 1 && kind !== 2) throw new Error("Неизвестный источник файла import")
    return {
      sourceKind: kind === 1 ? "worker" : "xml",
      sourcePath: readBinaryString(strings, view.getUint32(offset + 4, true)),
      targetProjectPath: readBinaryString(strings, view.getUint32(offset + 8, true)),
    }
  }
}

function requireBuffer(buffers: ReadonlyMap<string, ArrayBuffer>, name: string): ArrayBuffer {
  const buffer = buffers.get(name)
  if (buffer === undefined) throw new Error(`В результате import отсутствует буфер ${name}`)
  return buffer
}

function assertFlag(value: number | undefined, name: string): void {
  if (value !== 0 && value !== 1) throw new Error(`Счётчик ${name} import должен быть флагом`)
}
