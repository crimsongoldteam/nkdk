import type {
  ProjectReferenceLocation,
  ProjectReferenceLookup,
  ProjectStateReadSession,
} from "../projectState/readSession"
import {
  BinaryStringPoolBuilder,
  openBinaryStringPool,
  packBinaryStringPool,
  readBinaryString,
} from "../projectState/binary/stringPool"
import {
  assertMetadataWorkerBinaryResult,
  type MetadataWorkerBinaryResult,
} from "./binaryResult"

export interface IndexedReferencesQuery {
  readonly kind: "indexedReferences"
  readonly path: string
  readonly componentPath: string
  readonly canonical: string
  readonly dataPathTarget: ProjectReferenceLookup["dataPathTarget"]
}

export type ProjectQueryCommand = IndexedReferencesQuery

export type ProjectQueryResult =
  | MetadataWorkerBinaryResult
  | {
      readonly kind: "indexedReferencesResult"
      readonly found: false
      readonly message: string
    }

export interface IndexedReferencesBinaryView {
  readonly source: { readonly projectPath: string; readonly componentPath: string }
  readonly references: {
    readonly count: number
    reference(index: number): ProjectReferenceLocation
  }
}

const PAYLOAD_KIND = "projectQuery.indexedReferences"
const RECORD_HEADER_BYTES = 16
const RECORD_BYTES = 36
const YAML_SEGMENT_BYTES = 8
const NONE = 0xffff_ffff

export function runProjectQuery(
  command: ProjectQueryCommand,
  session: ProjectStateReadSession | undefined,
): ProjectQueryResult {
  if (session === undefined) throw new Error("Состояние проекта не установлено в универсальный worker")
  const [resolved] = session.resolveTargets([{
    requestId: "target",
    componentPath: command.componentPath,
    canonicalTarget: command.canonical,
  }])
  if (resolved?.status !== "found") {
    return { kind: "indexedReferencesResult", found: false, message: `Цель не найдена: ${command.path}` }
  }
  const [found] = session.findReferences([{
    requestId: "references",
    componentPath: resolved.source.componentPath,
    canonical: command.canonical,
    match: "prefix",
    dataPathTarget: command.dataPathTarget,
  }])
  if (found === undefined || found.requestId !== "references") {
    throw new Error("Ответ поиска ссылок не соответствует запросу")
  }
  return encodeIndexedReferencesResult(resolved.source, found.references)
}

export function openIndexedReferencesResult(value: unknown): IndexedReferencesBinaryView {
  assertMetadataWorkerBinaryResult(value)
  if (value.payloadKind !== PAYLOAD_KIND || Object.keys(value.counters).length !== 0) {
    throw new Error("Worker вернул неожиданный двоичный результат поиска ссылок")
  }
  const buffers = new Map(value.buffers.map(({ name, buffer }) => [name, buffer]))
  if (buffers.size !== 4 || ["records", "yamlPath", "resolvedSegments", "strings"].some((name) => !buffers.has(name))) {
    throw new Error("Повреждён состав двоичного результата поиска ссылок")
  }
  const recordsBuffer = buffers.get("records")!
  const yamlBuffer = buffers.get("yamlPath")!
  const resolvedBuffer = buffers.get("resolvedSegments")!
  if (recordsBuffer.byteLength < RECORD_HEADER_BYTES
    || yamlBuffer.byteLength % YAML_SEGMENT_BYTES !== 0
    || resolvedBuffer.byteLength % 4 !== 0) {
    throw new Error("Повреждены секции двоичного результата поиска ссылок")
  }
  const records = new DataView(recordsBuffer)
  const count = records.getUint32(8, true)
  if (records.getUint32(12, true) !== 0 || recordsBuffer.byteLength !== RECORD_HEADER_BYTES + count * RECORD_BYTES) {
    throw new Error("Повреждена таблица ссылок")
  }
  const yaml = new DataView(yamlBuffer)
  const resolved = new DataView(resolvedBuffer)
  const strings = openBinaryStringPool(buffers.get("strings")!, 0, buffers.get("strings")!.byteLength)
  const source = {
    projectPath: readBinaryString(strings, records.getUint32(0, true)),
    componentPath: readBinaryString(strings, records.getUint32(4, true)),
  }
  for (let index = 0; index < count; index += 1) validateRecord(index)
  return { source, references: { count, reference: decodeRecord } }

  function validateRecord(index: number): void {
    const offset = recordOffset(index, count)
    const kind = records.getUint32(offset, true)
    if (kind !== 1 && kind !== 2) throw new Error("Неизвестный вид ссылки")
    readBinaryString(strings, records.getUint32(offset + 4, true))
    readBinaryString(strings, records.getUint32(offset + 8, true))
    readBinaryString(strings, records.getUint32(offset + 12, true))
    const yamlStart = records.getUint32(offset + 16, true)
    const yamlCount = records.getUint32(offset + 20, true)
    const resolvedStart = records.getUint32(offset + 24, true)
    const resolvedCount = records.getUint32(offset + 28, true)
    if ((yamlStart + yamlCount) * YAML_SEGMENT_BYTES > yaml.byteLength
      || (resolvedStart + resolvedCount) * 4 > resolved.byteLength
      || (kind === 1 && (resolvedCount !== 0 || records.getUint32(offset + 32, true) !== NONE))) {
      throw new Error("Повреждены диапазоны ссылки")
    }
    for (let segment = yamlStart; segment < yamlStart + yamlCount; segment += 1) {
      const segmentKind = yaml.getUint32(segment * YAML_SEGMENT_BYTES, true)
      if (segmentKind === 1) readBinaryString(strings, yaml.getUint32(segment * YAML_SEGMENT_BYTES + 4, true))
      else if (segmentKind !== 2) throw new Error("Неизвестный сегмент YAML-пути")
    }
    for (let segment = resolvedStart; segment < resolvedStart + resolvedCount; segment += 1) {
      readBinaryString(strings, resolved.getUint32(segment * 4, true))
    }
    if (kind === 2 && records.getUint32(offset + 32, true) >= resolvedCount) {
      throw new Error("Индекс сегмента ссылки выходит за границы")
    }
  }

  function decodeRecord(index: number): ProjectReferenceLocation {
    const offset = recordOffset(index, count)
    const kind = records.getUint32(offset, true)
    const projectPath = readBinaryString(strings, records.getUint32(offset + 4, true))
    const componentPath = readBinaryString(strings, records.getUint32(offset + 8, true))
    const value = readBinaryString(strings, records.getUint32(offset + 12, true))
    const yamlStart = records.getUint32(offset + 16, true)
    const yamlCount = records.getUint32(offset + 20, true)
    const yamlPath = Array.from({ length: yamlCount }, (_unused, ordinal) => {
      const segmentOffset = (yamlStart + ordinal) * YAML_SEGMENT_BYTES
      return yaml.getUint32(segmentOffset, true) === 1
        ? readBinaryString(strings, yaml.getUint32(segmentOffset + 4, true))
        : yaml.getUint32(segmentOffset + 4, true)
    })
    if (kind === 1) return { kind: "metadataTarget", projectPath, componentPath, yamlPath, canonical: value }
    const resolvedStart = records.getUint32(offset + 24, true)
    const resolvedCount = records.getUint32(offset + 28, true)
    return {
      kind: "dataPath",
      projectPath,
      componentPath,
      yamlPath,
      value,
      resolvedSegments: Array.from({ length: resolvedCount }, (_unused, ordinal) =>
        readBinaryString(strings, resolved.getUint32((resolvedStart + ordinal) * 4, true))),
      segmentIndex: records.getUint32(offset + 32, true),
    }
  }
}

function encodeIndexedReferencesResult(
  source: { readonly projectPath: string; readonly componentPath: string },
  references: readonly ProjectReferenceLocation[],
): MetadataWorkerBinaryResult {
  const strings = new BinaryStringPoolBuilder()
  const yamlSegments: number[] = []
  const resolvedSegments: number[] = []
  const records = new ArrayBuffer(RECORD_HEADER_BYTES + references.length * RECORD_BYTES)
  const view = new DataView(records)
  view.setUint32(0, strings.intern(source.projectPath), true)
  view.setUint32(4, strings.intern(source.componentPath), true)
  view.setUint32(8, references.length, true)
  references.forEach((reference, index) => {
    const offset = RECORD_HEADER_BYTES + index * RECORD_BYTES
    const yamlStart = yamlSegments.length / 2
    for (const segment of reference.yamlPath) {
      yamlSegments.push(typeof segment === "string" ? 1 : 2, typeof segment === "string" ? strings.intern(segment) : segment)
    }
    const resolvedStart = resolvedSegments.length
    if (reference.kind === "dataPath") {
      for (const segment of reference.resolvedSegments) resolvedSegments.push(strings.intern(segment))
    }
    view.setUint32(offset, reference.kind === "metadataTarget" ? 1 : 2, true)
    view.setUint32(offset + 4, strings.intern(reference.projectPath), true)
    view.setUint32(offset + 8, strings.intern(reference.componentPath), true)
    view.setUint32(offset + 12, strings.intern(reference.kind === "metadataTarget" ? reference.canonical : reference.value), true)
    view.setUint32(offset + 16, yamlStart, true)
    view.setUint32(offset + 20, reference.yamlPath.length, true)
    view.setUint32(offset + 24, resolvedStart, true)
    view.setUint32(offset + 28, reference.kind === "dataPath" ? reference.resolvedSegments.length : 0, true)
    view.setUint32(offset + 32, reference.kind === "dataPath" ? reference.segmentIndex : NONE, true)
  })
  const yamlPath = Uint32Array.from(yamlSegments).buffer
  const resolved = Uint32Array.from(resolvedSegments).buffer
  const packedStrings = packBinaryStringPool(strings.finish())
  const stringBuffer = new ArrayBuffer(packedStrings.byteLength)
  new Uint8Array(stringBuffer).set(new Uint8Array(packedStrings))
  return {
    kind: "binaryResult",
    payloadKind: PAYLOAD_KIND,
    counters: {},
    buffers: [
      { name: "records", buffer: records },
      { name: "yamlPath", buffer: yamlPath },
      { name: "resolvedSegments", buffer: resolved },
      { name: "strings", buffer: stringBuffer },
    ],
  }
}

function recordOffset(index: number, count: number): number {
  if (!Number.isSafeInteger(index) || index < 0 || index >= count) throw new RangeError(`Неизвестная ссылка: ${index}`)
  return RECORD_HEADER_BYTES + index * RECORD_BYTES
}
