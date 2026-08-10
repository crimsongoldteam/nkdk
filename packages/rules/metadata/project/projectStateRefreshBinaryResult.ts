import {
  assertMetadataWorkerBinaryResult,
  type MetadataWorkerBinaryResult,
} from "../workerPool/binaryResult"
import {
  openProjectStateFragment,
  type ProjectStateFragment,
  type ProjectStateFragmentView,
} from "../projectState/binary/fragment"
import {
  PROJECT_STATE_FRAGMENT_BUFFER_NAMES,
  projectStateFragmentFromNamedBuffers,
} from "../workerPool/projectStateBuffers"

const PAYLOAD_KIND = "validation.refresh"
const PATH_HEADER_BYTES = 8
const textEncoder = new TextEncoder()
const textDecoder = new TextDecoder("utf-8", { fatal: true })
const COUNTER_NAMES = ["hashedFiles", "parsedYamlFiles", "changedFiles"] as const

export interface ProjectStateRefreshBinaryResultView {
  readonly fragment: ProjectStateFragment
  readonly fragmentView: ProjectStateFragmentView
  readonly missingProjectPaths: readonly string[]
  readonly hashedFiles: number
  readonly parsedYamlFiles: number
  readonly changedFiles: number
}

export function createProjectStateRefreshBinaryResult(params: {
  readonly fragment: ProjectStateFragment
  readonly missingProjectPaths: readonly string[]
  readonly hashedFiles: number
  readonly parsedYamlFiles: number
  readonly changedFiles: number
}): MetadataWorkerBinaryResult {
  return {
    kind: "binaryResult",
    payloadKind: PAYLOAD_KIND,
    counters: {
      hashedFiles: params.hashedFiles,
      parsedYamlFiles: params.parsedYamlFiles,
      changedFiles: params.changedFiles,
    },
    buffers: [
      ...PROJECT_STATE_FRAGMENT_BUFFER_NAMES.map((name) => ({
        name: `projectState.${name}`,
        buffer: params.fragment.buffers[name],
      })),
      { name: "missingProjectPaths", buffer: encodeStrings(params.missingProjectPaths) },
    ],
  }
}

export function openProjectStateRefreshBinaryResult(
  value: unknown,
): ProjectStateRefreshBinaryResultView {
  assertMetadataWorkerBinaryResult(value)
  if (value.payloadKind !== PAYLOAD_KIND) throw new Error("Worker вернул неожиданный двоичный результат validation refresh")
  assertExactNames(Object.keys(value.counters), COUNTER_NAMES, "счётчиков validation refresh")
  for (const counter of COUNTER_NAMES) {
    if (!Number.isSafeInteger(value.counters[counter])) {
      throw new Error(`Счётчик ${counter} validation refresh должен быть целым числом`)
    }
  }
  const expectedBufferNames = [
    ...PROJECT_STATE_FRAGMENT_BUFFER_NAMES.map((name) => `projectState.${name}`),
    "missingProjectPaths",
  ]
  assertExactNames(value.buffers.map(({ name }) => name), expectedBufferNames, "буферов validation refresh")
  const buffers = new Map(value.buffers.map(({ name, buffer }) => [name, buffer]))
  const fragment: ProjectStateFragment = projectStateFragmentFromNamedBuffers(buffers)
  const fragmentView = openProjectStateFragment(fragment)
  return {
    fragment,
    fragmentView,
    missingProjectPaths: decodeStrings(requireBuffer(buffers, "missingProjectPaths")),
    hashedFiles: value.counters.hashedFiles!,
    parsedYamlFiles: value.counters.parsedYamlFiles!,
    changedFiles: value.counters.changedFiles!,
  }
}

function encodeStrings(values: readonly string[]): ArrayBuffer {
  const encoded = values.map((value) => textEncoder.encode(value))
  const offsetsBytes = (values.length + 1) * Uint32Array.BYTES_PER_ELEMENT
  const utf8Offset = PATH_HEADER_BYTES + offsetsBytes
  const utf8Bytes = encoded.reduce((sum, value) => sum + value.byteLength, 0)
  const buffer = new ArrayBuffer(utf8Offset + utf8Bytes)
  const view = new DataView(buffer)
  const bytes = new Uint8Array(buffer)
  view.setUint32(0, values.length, true)
  view.setUint32(4, utf8Offset, true)
  let offset = 0
  encoded.forEach((value, index) => {
    view.setUint32(PATH_HEADER_BYTES + index * Uint32Array.BYTES_PER_ELEMENT, offset, true)
    bytes.set(value, utf8Offset + offset)
    offset += value.byteLength
  })
  view.setUint32(PATH_HEADER_BYTES + values.length * Uint32Array.BYTES_PER_ELEMENT, offset, true)
  return buffer
}

function decodeStrings(buffer: ArrayBuffer): readonly string[] {
  if (buffer.byteLength < PATH_HEADER_BYTES + Uint32Array.BYTES_PER_ELEMENT) {
    throw new Error("Список удалённых путей validation refresh оборван")
  }
  const view = new DataView(buffer)
  const count = view.getUint32(0, true)
  const utf8Offset = view.getUint32(4, true)
  const expectedUtf8Offset = PATH_HEADER_BYTES + (count + 1) * Uint32Array.BYTES_PER_ELEMENT
  if (!Number.isSafeInteger(expectedUtf8Offset) || utf8Offset !== expectedUtf8Offset || utf8Offset > buffer.byteLength) {
    throw new Error("Повреждена структура удалённых путей validation refresh")
  }
  const result: string[] = []
  let previous = 0
  for (let index = 0; index <= count; index += 1) {
    const offset = view.getUint32(PATH_HEADER_BYTES + index * Uint32Array.BYTES_PER_ELEMENT, true)
    if (offset < previous || utf8Offset + offset > buffer.byteLength) {
      throw new Error("Повреждён диапазон удалённого пути validation refresh")
    }
    if (index > 0) {
      result.push(textDecoder.decode(new Uint8Array(buffer, utf8Offset + previous, offset - previous)))
    }
    previous = offset
  }
  if (utf8Offset + previous !== buffer.byteLength) {
    throw new Error("Список удалённых путей validation refresh содержит лишние байты")
  }
  return result
}

function requireBuffer(buffers: ReadonlyMap<string, ArrayBuffer>, name: string): ArrayBuffer {
  const buffer = buffers.get(name)
  if (buffer === undefined) throw new Error(`В результате validation refresh отсутствует буфер ${name}`)
  return buffer
}

function assertExactNames(actual: readonly string[], expected: readonly string[], subject: string): void {
  const actualNames = new Set(actual)
  if (actualNames.size !== expected.length || expected.some((name) => !actualNames.has(name))) {
    throw new Error(`Повреждён состав ${subject}`)
  }
}
