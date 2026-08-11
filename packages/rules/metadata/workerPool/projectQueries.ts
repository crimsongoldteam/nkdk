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
import type { MetadataWorkerOperationRegistry } from "./operationRegistry"

declare module "./types" {
  interface MetadataWorkerOperationTypeMap {
    projectQuery: {
      command: { readonly kind: "projectQuery"; readonly command: ProjectQueryCommand }
      result: ProjectQueryResult
    }
  }
}

export function registerProjectQueryWorkerOperation(
  registry: MetadataWorkerOperationRegistry,
): void {
  registry.register("projectQuery", async (operation, state) =>
    runProjectQuery(operation.command, state.projectState))
}

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
  readonly source: {
    readonly projectPath: string
    readonly componentPath: string
    readonly itemProjectPath?: string
    readonly ownerProjectPath?: string
  }
  readonly collectionNames: readonly string[]
  readonly references: {
    readonly count: number
    reference(index: number): ProjectReferenceLocation
  }
}

const PAYLOAD_KIND = "projectQuery.indexedReferences"
const RECORD_HEADER_BYTES = 32
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
  return encodeIndexedReferencesResult(
    resolved.source,
    found.references,
    indexedCollectionNames(session, resolved.source.componentPath, command.canonical),
  )
}

export function openIndexedReferencesResult(value: unknown): IndexedReferencesBinaryView {
  assertMetadataWorkerBinaryResult(value)
  if (value.payloadKind !== PAYLOAD_KIND || Object.keys(value.counters).length !== 0) {
    throw new Error("Worker вернул неожиданный двоичный результат поиска ссылок")
  }
  const buffers = new Map(value.buffers.map(({ name, buffer }) => [name, buffer]))
  if (buffers.size !== 5
    || ["records", "yamlPath", "resolvedSegments", "collectionNames", "strings"].some((name) => !buffers.has(name))) {
    throw new Error("Повреждён состав двоичного результата поиска ссылок")
  }
  const recordsBuffer = buffers.get("records")!
  const yamlBuffer = buffers.get("yamlPath")!
  const resolvedBuffer = buffers.get("resolvedSegments")!
  const collectionNamesBuffer = buffers.get("collectionNames")!
  if (recordsBuffer.byteLength < RECORD_HEADER_BYTES
    || yamlBuffer.byteLength % YAML_SEGMENT_BYTES !== 0
    || resolvedBuffer.byteLength % 4 !== 0
    || collectionNamesBuffer.byteLength % 4 !== 0) {
    throw new Error("Повреждены секции двоичного результата поиска ссылок")
  }
  const records = new DataView(recordsBuffer)
  const count = records.getUint32(16, true)
  const collectionNameCount = records.getUint32(20, true)
  if (records.getUint32(24, true) !== 0 || records.getUint32(28, true) !== 0
    || recordsBuffer.byteLength !== RECORD_HEADER_BYTES + count * RECORD_BYTES
    || collectionNamesBuffer.byteLength !== collectionNameCount * 4) {
    throw new Error("Повреждена таблица ссылок")
  }
  const yaml = new DataView(yamlBuffer)
  const resolved = new DataView(resolvedBuffer)
  const collectionNames = new DataView(collectionNamesBuffer)
  const strings = openBinaryStringPool(buffers.get("strings")!, 0, buffers.get("strings")!.byteLength)
  const source = {
    projectPath: readBinaryString(strings, records.getUint32(0, true)),
    componentPath: readBinaryString(strings, records.getUint32(4, true)),
    ...optionalSourcePath("itemProjectPath", records.getUint32(8, true)),
    ...optionalSourcePath("ownerProjectPath", records.getUint32(12, true)),
  }
  for (let index = 0; index < count; index += 1) validateRecord(index)
  return {
    source,
    collectionNames: Array.from({ length: collectionNameCount }, (_unused, index) =>
      readBinaryString(strings, collectionNames.getUint32(index * 4, true))),
    references: { count, reference: decodeRecord },
  }

  function optionalSourcePath<Key extends "itemProjectPath" | "ownerProjectPath">(
    key: Key,
    stringId: number,
  ): { readonly [K in Key]?: string } {
    return stringId === NONE ? {} : { [key]: readBinaryString(strings, stringId) } as { readonly [K in Key]: string }
  }

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
  source: {
    readonly projectPath: string
    readonly componentPath: string
    readonly itemProjectPath?: string
    readonly ownerProjectPath?: string
  },
  references: readonly ProjectReferenceLocation[],
  collectionNames: readonly string[],
): MetadataWorkerBinaryResult {
  const strings = new BinaryStringPoolBuilder()
  const yamlSegments: number[] = []
  const resolvedSegments: number[] = []
  const records = new ArrayBuffer(RECORD_HEADER_BYTES + references.length * RECORD_BYTES)
  const view = new DataView(records)
  view.setUint32(0, strings.intern(source.projectPath), true)
  view.setUint32(4, strings.intern(source.componentPath), true)
  view.setUint32(8, source.itemProjectPath === undefined ? NONE : strings.intern(source.itemProjectPath), true)
  view.setUint32(12, source.ownerProjectPath === undefined ? NONE : strings.intern(source.ownerProjectPath), true)
  view.setUint32(16, references.length, true)
  view.setUint32(20, collectionNames.length, true)
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
  const encodedCollectionNames = Uint32Array.from(collectionNames.map((name) => strings.intern(name))).buffer
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
      { name: "collectionNames", buffer: encodedCollectionNames },
      { name: "strings", buffer: stringBuffer },
    ],
  }
}

function indexedCollectionNames(
  session: ProjectStateReadSession,
  componentPath: string,
  canonical: string,
): string[] {
  const prefix = canonical.slice(0, canonical.lastIndexOf(".") + 1)
  if (prefix.length === 0) return []
  const names = new Set<string>()
  let cursor: string | undefined
  do {
    const page = session.readComponentTargetPage({ componentPath, ...(cursor === undefined ? {} : { cursor }) })
    for (const entry of page.entries) {
      if (!entry.logicalAddress.startsWith(prefix)) continue
      const suffix = entry.logicalAddress.slice(prefix.length)
      if (suffix.length > 0 && !suffix.includes(".")) names.add(suffix)
    }
    cursor = page.nextCursor
  } while (cursor !== undefined)
  return [...names]
}

function recordOffset(index: number, count: number): number {
  if (!Number.isSafeInteger(index) || index < 0 || index >= count) throw new RangeError(`Неизвестная ссылка: ${index}`)
  return RECORD_HEADER_BYTES + index * RECORD_BYTES
}
