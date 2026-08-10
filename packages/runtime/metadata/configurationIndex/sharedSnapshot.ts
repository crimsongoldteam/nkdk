import fs from "fs"
import { xxh3 } from "@node-rs/xxhash"
import {
  buildBinaryHashIndex,
  findBinaryHashIndex,
  forEachBinaryHashIndexEntry,
  openBinaryHashIndex,
  type BinaryHashIndex,
} from "@nkdk/runtime"
import { componentPath, type ComponentAddress } from "../components/address"
import { decodeConfigurationIndex, type DecodeConfigurationIndexOptions } from "./decode"
import { configurationIndexPath } from "./fileIO"
import type {
  ConfigurationSnapshot,
  ConfigurationSnapshotEntity,
  ConfigurationSnapshotFile,
  ConfigurationSnapshotXml,
} from "./types"

export interface SharedConfigurationIndexSnapshot {
  readonly bytes: SharedArrayBuffer
  readonly byteLength: number
  readonly stringOffsets: SharedArrayBuffer
  readonly entityOffsets: SharedArrayBuffer
  readonly stringLookup: BinaryHashIndex
  readonly fileLookup: BinaryHashIndex
  readonly entityLookup: BinaryHashIndex
  readonly sourceEntityOffsets: SharedArrayBuffer
  readonly sourceEntityRanges: SharedArrayBuffer
  readonly sourceEntityLookup: BinaryHashIndex
}

export interface ConfigurationIndexLookupHashOptions {
  readonly hashStringBytes?: (bytes: Uint8Array) => bigint
  readonly hashStringId?: (id: number) => bigint
}

export interface ConfigurationIndexEntityRange {
  readonly start: number
  readonly count: number
}

export interface ConfigurationIndexAssignmentLookupStats {
  localHits: number
  localMisses: number
  globalFallbacks: number
  decodedEntities: number
  rangeEntities: number
}

type SnapshotConfigurationIndexOptions = DecodeConfigurationIndexOptions
  & ConfigurationIndexLookupHashOptions

export interface ConfigurationIndexReader {
  readonly snapshot: SharedConfigurationIndexSnapshot
  header(): Pick<ConfigurationSnapshot, "specificationVersion" | "indexGeneration" | "componentPath">
  file(projectPath: string): ConfigurationSnapshotFile | undefined
  files(): Iterable<ConfigurationSnapshotFile>
  entity(logicalAddress: string): ConfigurationSnapshotEntity | undefined
  entities(): Iterable<ConfigurationSnapshotEntity>
  entitiesBySourceProjectPath(projectPath: string): Iterable<ConfigurationSnapshotEntity>
}

export interface AssignmentScopedConfigurationIndexReader extends ConfigurationIndexReader {
  entityRange(projectPath: string): ConfigurationIndexEntityRange
  forEntityRange(
    range: ConfigurationIndexEntityRange,
    stats?: ConfigurationIndexAssignmentLookupStats,
  ): ConfigurationIndexReader
}

interface DirectoryEntry {
  readonly offset: number
  readonly length: number
  readonly recordCount: number
}

type SectionType = 1 | 2 | 3 | 4

const HEADER_LENGTH = 64
const DIRECTORY_ENTRY_LENGTH = 64
const SECTION_COUNT = 4
const ENTITY_FLAGS = {
  uuid: 1 << 0,
  xmlId: 1 << 1,
  xmlName: 1 << 2,
  omittedNames: 1 << 3,
  omittedTypedNames: 1 << 4,
  extended: 1 << 5,
  xsiNil: 1 << 6,
  explicitEmpty: 1 << 7,
  xsiType: 1 << 8,
  xmlText: 1 << 9,
  xmlPrefix: 1 << 10,
} as const
const fatalUtf8Decoder = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true })
const textEncoder = new TextEncoder()
const stringIdHashBytes = Buffer.allocUnsafe(Uint32Array.BYTES_PER_ELEMENT)

export async function readConfigurationIndexSnapshot(params: {
  projectDir: string
  address: ComponentAddress
}): Promise<SharedConfigurationIndexSnapshot> {
  const expectedComponentPath = componentPath(params.address)
  const encoded = await fs.promises.readFile(configurationIndexPath(params.projectDir, params.address))
  return snapshotConfigurationIndex(encoded, { expectedComponentPath })
}

export function snapshotConfigurationIndex(
  input: Uint8Array,
  options: SnapshotConfigurationIndexOptions = {}
): SharedConfigurationIndexSnapshot {
  decodeConfigurationIndex(input, options)
  const bytes = copyToSharedBuffer(input)
  const buffer = Buffer.from(bytes, 0, input.byteLength)
  const directory = readDirectory(buffer)
  const stringOffsets = buildVariableRecordOffsets(section(buffer, directory, 2), directory[1]!.recordCount)
  const entityOffsets = buildVariableRecordOffsets(section(buffer, directory, 4), directory[3]!.recordCount)
  const lookups = buildSharedLookups({ buffer, directory, stringOffsets, entityOffsets, options })
  return {
    bytes,
    byteLength: input.byteLength,
    stringOffsets,
    entityOffsets,
    ...lookups,
  }
}

export function createConfigurationIndexReader(
  snapshot: SharedConfigurationIndexSnapshot,
  options: ConfigurationIndexLookupHashOptions = {},
): AssignmentScopedConfigurationIndexReader {
  return new SharedConfigurationIndexReader(snapshot, options)
}

export function createConfigurationIndexAssignmentLookupStats(): ConfigurationIndexAssignmentLookupStats {
  return {
    localHits: 0,
    localMisses: 0,
    globalFallbacks: 0,
    decodedEntities: 0,
    rangeEntities: 0,
  }
}

class SharedConfigurationIndexReader implements AssignmentScopedConfigurationIndexReader {
  readonly snapshot: SharedConfigurationIndexSnapshot
  private readonly buffer: Buffer
  private readonly directory: readonly DirectoryEntry[]
  private readonly stringOffsets: Uint32Array
  private readonly entityOffsets: Uint32Array
  private readonly sourceEntityOffsets: Uint32Array
  private readonly sourceEntityRanges: Uint32Array
  private readonly hashStringBytes: (bytes: Uint8Array) => bigint
  private readonly hashStringId: (id: number) => bigint
  private readonly stringCache = new Map<number, string>()

  constructor(
    snapshot: SharedConfigurationIndexSnapshot,
    options: ConfigurationIndexLookupHashOptions,
  ) {
    this.snapshot = snapshot
    this.buffer = Buffer.from(snapshot.bytes, 0, snapshot.byteLength)
    this.directory = readDirectory(this.buffer)
    this.stringOffsets = new Uint32Array(snapshot.stringOffsets)
    this.entityOffsets = new Uint32Array(snapshot.entityOffsets)
    this.sourceEntityOffsets = new Uint32Array(snapshot.sourceEntityOffsets)
    this.sourceEntityRanges = new Uint32Array(snapshot.sourceEntityRanges)
    this.hashStringBytes = options.hashStringBytes ?? defaultHashStringBytes
    this.hashStringId = options.hashStringId ?? defaultHashStringId
    openBinaryHashIndex(snapshot.stringLookup)
    openBinaryHashIndex(snapshot.fileLookup)
    openBinaryHashIndex(snapshot.entityLookup)
    openBinaryHashIndex(snapshot.sourceEntityLookup)
    this.validateLookups()
  }

  header(): Pick<ConfigurationSnapshot, "specificationVersion" | "indexGeneration" | "componentPath"> {
    const snapshot = section(this.buffer, this.directory, 1)
    return {
      specificationVersion: "1.3",
      indexGeneration: snapshot.readBigUInt64LE(0),
      componentPath: this.stringById(snapshot.readUInt32LE(8)),
    }
  }

  file(projectPath: string): ConfigurationSnapshotFile | undefined {
    const projectPathId = this.findStringId(projectPath)
    if (projectPathId === undefined) return undefined
    const offset = this.fileOffset(projectPathId)
    if (offset === undefined) return undefined
    return this.decodeFile(offset)
  }

  *files(): Iterable<ConfigurationSnapshotFile> {
    const files = section(this.buffer, this.directory, 3)
    for (let index = 0; index < this.directory[2]!.recordCount; index += 1) {
      yield this.decodeFile(index * 16, files)
    }
  }

  entity(logicalAddress: string): ConfigurationSnapshotEntity | undefined {
    const logicalAddressId = this.findStringId(logicalAddress)
    if (logicalAddressId === undefined) return undefined
    const offset = this.entityOffset(logicalAddressId)
    if (offset === undefined) return undefined
    return this.decodeEntity(offset)
  }

  *entities(): Iterable<ConfigurationSnapshotEntity> {
    for (const offset of this.entityOffsets) yield this.decodeEntity(offset)
  }

  *entitiesBySourceProjectPath(projectPath: string): Iterable<ConfigurationSnapshotEntity> {
    const projectPathId = this.findStringId(projectPath)
    if (projectPathId === undefined) return
    const range = this.entityRangeForSourcePathId(projectPathId)
    for (const offset of this.sourceEntityOffsets.subarray(range.start, range.start + range.count)) {
      yield this.decodeEntity(offset)
    }
  }

  entityRange(projectPath: string): ConfigurationIndexEntityRange {
    const projectPathId = this.findStringId(projectPath)
    return projectPathId === undefined
      ? { start: 0, count: 0 }
      : this.entityRangeForSourcePathId(projectPathId)
  }

  forEntityRange(
    range: ConfigurationIndexEntityRange,
    stats = createConfigurationIndexAssignmentLookupStats(),
  ): ConfigurationIndexReader {
    if (
      !Number.isSafeInteger(range.start)
      || !Number.isSafeInteger(range.count)
      || range.start < 0
      || range.count < 0
      || range.start + range.count > this.sourceEntityOffsets.length
    ) {
      throw new Error("Повреждён диапазон entity индекса конфигурации")
    }
    return new AssignmentConfigurationIndexReader({
      source: this,
      offsets: this.sourceEntityOffsets.subarray(range.start, range.start + range.count),
      logicalAddressAt: (offset) => this.logicalAddressAt(offset),
      decodeAt: (offset) => this.decodeEntity(offset),
      stats,
    })
  }

  private decodeFile(offset: number, files = section(this.buffer, this.directory, 3)): ConfigurationSnapshotFile {
    return {
      projectPath: this.stringById(files.readUInt32LE(offset)),
      contentHash: files.readBigUInt64LE(offset + 8),
    }
  }

  private decodeEntity(offset: number): ConfigurationSnapshotEntity {
    const entities = section(this.buffer, this.directory, 4)
    const logicalAddress = this.stringById(entities.readUInt32LE(offset + 4))
    const sourceProjectPath = this.stringById(entities.readUInt32LE(offset + 8))
    const fieldMask = entities.readUInt32LE(offset + 12)
    let cursor = offset + 16

    let uuid: string | undefined
    let xmlId: string | undefined
    let xmlName: string | undefined
    if (hasFlag(fieldMask, ENTITY_FLAGS.uuid)) {
      uuid = formatUuid(entities.subarray(cursor, cursor + 16))
      cursor += 16
    }
    if (hasFlag(fieldMask, ENTITY_FLAGS.xmlId)) {
      xmlId = this.stringById(entities.readUInt32LE(cursor))
      cursor += 4
    }
    if (hasFlag(fieldMask, ENTITY_FLAGS.xmlName)) {
      xmlName = this.stringById(entities.readUInt32LE(cursor))
      cursor += 4
    }

    let omittedChildren: ConfigurationSnapshotEntity["omittedChildren"]
    if (hasFlag(fieldMask, ENTITY_FLAGS.omittedNames)) {
      const count = entities.readUInt32LE(cursor)
      cursor += 8
      const names: string[] = []
      for (let index = 0; index < count; index += 1) {
        names.push(this.stringById(entities.readUInt32LE(cursor)))
        cursor += 4
      }
      omittedChildren = { kind: "names", names }
    } else if (hasFlag(fieldMask, ENTITY_FLAGS.omittedTypedNames)) {
      const count = entities.readUInt32LE(cursor)
      cursor += 8
      const items: Array<{ xmlName: string; name: string }> = []
      for (let index = 0; index < count; index += 1) {
        items.push({
          xmlName: this.stringById(entities.readUInt32LE(cursor)),
          name: this.stringById(entities.readUInt32LE(cursor + 4)),
        })
        cursor += 8
      }
      omittedChildren = { kind: "typedNames", items }
    }

    const xml: ConfigurationSnapshotXml = {
      ...(hasFlag(fieldMask, ENTITY_FLAGS.extended) ? { extended: true } : {}),
      ...(hasFlag(fieldMask, ENTITY_FLAGS.xsiNil) ? { xsiNil: true } : {}),
      ...(hasFlag(fieldMask, ENTITY_FLAGS.explicitEmpty) ? { explicitEmpty: true } : {}),
    }
    if (hasFlag(fieldMask, ENTITY_FLAGS.xsiType)) {
      Object.assign(xml, { xsiType: this.stringById(entities.readUInt32LE(cursor)) })
      cursor += 4
    }
    if (hasFlag(fieldMask, ENTITY_FLAGS.xmlText)) {
      Object.assign(xml, { xmlText: this.stringById(entities.readUInt32LE(cursor)) })
      cursor += 4
    }
    if (hasFlag(fieldMask, ENTITY_FLAGS.xmlPrefix)) {
      Object.assign(xml, { xmlPrefix: this.stringById(entities.readUInt32LE(cursor)) })
    }

    const hasIdentities = uuid !== undefined || xmlId !== undefined || xmlName !== undefined
    const hasXml = Object.keys(xml).length > 0
    return {
      logicalAddress,
      sourceProjectPath,
      ...(hasIdentities
        ? {
            identities: {
              ...(uuid === undefined ? {} : { uuid }),
              ...(xmlId === undefined ? {} : { xmlId }),
              ...(xmlName === undefined ? {} : { xmlName }),
            },
          }
        : {}),
      ...(omittedChildren === undefined ? {} : { omittedChildren }),
      ...(hasXml ? { xml } : {}),
    }
  }

  private logicalAddressAt(offset: number): string {
    const entities = section(this.buffer, this.directory, 4)
    return this.stringById(entities.readUInt32LE(offset + 4))
  }

  private findStringId(value: string): number | undefined {
    const encoded = textEncoder.encode(value)
    return findBinaryHashIndex(
      this.snapshot.stringLookup,
      this.hashStringBytes(encoded),
      (stringId) => this.stringBytesEqual(stringId, encoded),
    )
  }

  private stringById(id: number): string {
    const cached = this.stringCache.get(id)
    if (cached !== undefined) return cached
    if (id === 0 || id > this.stringOffsets.length) throw new Error(`Некорректный stringId: ${id}`)
    const strings = section(this.buffer, this.directory, 2)
    const offset = this.stringOffsets[id - 1]!
    const byteLength = strings.readUInt32LE(offset)
    const value = fatalUtf8Decoder.decode(strings.subarray(offset + 4, offset + 4 + byteLength))
    this.stringCache.set(id, value)
    return value
  }

  private fileOffset(projectPathId: number): number | undefined {
    const files = section(this.buffer, this.directory, 3)
    const fileId = findBinaryHashIndex(
      this.snapshot.fileLookup,
      this.hashStringId(projectPathId),
      (candidate) => files.readUInt32LE(candidate * 16) === projectPathId,
    )
    return fileId === undefined ? undefined : fileId * 16
  }

  private entityOffset(logicalAddressId: number): number | undefined {
    const entities = section(this.buffer, this.directory, 4)
    const entityId = findBinaryHashIndex(
      this.snapshot.entityLookup,
      this.hashStringId(logicalAddressId),
      (candidate) => entities.readUInt32LE(this.entityOffsets[candidate]! + 4) === logicalAddressId,
    )
    return entityId === undefined ? undefined : this.entityOffsets[entityId]
  }

  private entityRangeForSourcePathId(sourceProjectPathId: number): ConfigurationIndexEntityRange {
    const entities = section(this.buffer, this.directory, 4)
    const rangeId = findBinaryHashIndex(
      this.snapshot.sourceEntityLookup,
      this.hashStringId(sourceProjectPathId),
      (candidate) => {
        const start = this.sourceEntityRanges[candidate * 2]!
        const firstEntityOffset = this.sourceEntityOffsets[start]!
        return entities.readUInt32LE(firstEntityOffset + 8) === sourceProjectPathId
      },
    )
    return rangeId === undefined
      ? { start: 0, count: 0 }
      : {
          start: this.sourceEntityRanges[rangeId * 2]!,
          count: this.sourceEntityRanges[rangeId * 2 + 1]!,
        }
  }

  private stringBytesEqual(id: number, expected: Uint8Array): boolean {
    if (id === 0 || id > this.stringOffsets.length) {
      throw new Error(`Некорректный stringId lookup: ${id}`)
    }
    const strings = section(this.buffer, this.directory, 2)
    const offset = this.stringOffsets[id - 1]!
    const byteLength = strings.readUInt32LE(offset)
    if (byteLength !== expected.byteLength) return false
    for (let index = 0; index < byteLength; index += 1) {
      if (strings[offset + 4 + index] !== expected[index]) return false
    }
    return true
  }

  private validateLookups(): void {
    validateLookupRecordIds(this.snapshot.stringLookup, (id) => id >= 1 && id <= this.stringOffsets.length)
    validateLookupRecordIds(this.snapshot.fileLookup, (id) => id < this.directory[2]!.recordCount)
    validateLookupRecordIds(this.snapshot.entityLookup, (id) => id < this.entityOffsets.length)
    const rangeCount = this.sourceEntityRanges.length / 2
    if (this.sourceEntityRanges.length % 2 !== 0) throw new Error("Повреждён lookup индекса конфигурации")
    validateLookupRecordIds(this.snapshot.sourceEntityLookup, (id) => id < rangeCount)
    for (let rangeId = 0; rangeId < rangeCount; rangeId += 1) {
      const start = this.sourceEntityRanges[rangeId * 2]!
      const count = this.sourceEntityRanges[rangeId * 2 + 1]!
      if (count === 0 || start + count > this.sourceEntityOffsets.length) {
        throw new Error("Повреждён lookup индекса конфигурации")
      }
    }
    if (this.sourceEntityOffsets.length !== this.entityOffsets.length) {
      throw new Error("Повреждён lookup индекса конфигурации")
    }
    const seenEntityIds = new Uint8Array(this.entityOffsets.length)
    for (const offset of this.sourceEntityOffsets) {
      const entityId = sortedUint32IndexOf(this.entityOffsets, offset)
      if (entityId === -1 || seenEntityIds[entityId] !== 0) {
        throw new Error("Повреждён lookup индекса конфигурации")
      }
      seenEntityIds[entityId] = 1
    }
  }
}

class AssignmentConfigurationIndexReader implements ConfigurationIndexReader {
  readonly snapshot: SharedConfigurationIndexSnapshot
  private readonly source: ConfigurationIndexReader
  private readonly decodeAt: (offset: number) => ConfigurationSnapshotEntity
  private readonly stats: ConfigurationIndexAssignmentLookupStats
  private readonly offsetByLogicalAddress = new Map<string, number>()
  private readonly cache = new Map<string, ConfigurationSnapshotEntity | undefined>()

  constructor(params: {
    readonly source: ConfigurationIndexReader
    readonly offsets: Uint32Array
    readonly logicalAddressAt: (offset: number) => string
    readonly decodeAt: (offset: number) => ConfigurationSnapshotEntity
    readonly stats: ConfigurationIndexAssignmentLookupStats
  }) {
    this.source = params.source
    this.snapshot = params.source.snapshot
    this.decodeAt = params.decodeAt
    this.stats = params.stats
    this.stats.rangeEntities += params.offsets.length
    for (const offset of params.offsets) {
      const logicalAddress = params.logicalAddressAt(offset)
      if (this.offsetByLogicalAddress.has(logicalAddress)) {
        throw new Error("Повторяется logicalAddress entity в диапазоне")
      }
      this.offsetByLogicalAddress.set(logicalAddress, offset)
    }
  }

  header(): Pick<ConfigurationSnapshot, "specificationVersion" | "indexGeneration" | "componentPath"> {
    return this.source.header()
  }

  file(projectPath: string): ConfigurationSnapshotFile | undefined {
    return this.source.file(projectPath)
  }

  files(): Iterable<ConfigurationSnapshotFile> {
    return this.source.files()
  }

  entity(logicalAddress: string): ConfigurationSnapshotEntity | undefined {
    const offset = this.offsetByLogicalAddress.get(logicalAddress)
    if (offset === undefined) this.stats.localMisses += 1
    else this.stats.localHits += 1

    if (this.cache.has(logicalAddress)) return this.cache.get(logicalAddress)

    let entity: ConfigurationSnapshotEntity | undefined
    if (offset === undefined) {
      this.stats.globalFallbacks += 1
      entity = this.source.entity(logicalAddress)
    } else {
      entity = this.decodeAt(offset)
    }
    this.cache.set(logicalAddress, entity)
    if (entity !== undefined) this.stats.decodedEntities += 1
    return entity
  }

  entities(): Iterable<ConfigurationSnapshotEntity> {
    return this.source.entities()
  }

  entitiesBySourceProjectPath(projectPath: string): Iterable<ConfigurationSnapshotEntity> {
    return this.source.entitiesBySourceProjectPath(projectPath)
  }

}

function buildSharedLookups(params: {
  buffer: Buffer
  directory: readonly DirectoryEntry[]
  stringOffsets: SharedArrayBuffer
  entityOffsets: SharedArrayBuffer
  options: ConfigurationIndexLookupHashOptions
}): Pick<
  SharedConfigurationIndexSnapshot,
  | "stringLookup"
  | "fileLookup"
  | "entityLookup"
  | "sourceEntityOffsets"
  | "sourceEntityRanges"
  | "sourceEntityLookup"
> {
  const hashStringBytes = params.options.hashStringBytes ?? defaultHashStringBytes
  const hashStringId = params.options.hashStringId ?? defaultHashStringId
  const stringOffsets = new Uint32Array(params.stringOffsets)
  const entityOffsets = new Uint32Array(params.entityOffsets)
  const strings = section(params.buffer, params.directory, 2)
  const files = section(params.buffer, params.directory, 3)
  const entities = section(params.buffer, params.directory, 4)
  const stringLookup = buildBinaryHashIndex(
    BigUint64Array.from(stringOffsets, (offset) => {
      const byteLength = strings.readUInt32LE(offset)
      return hashStringBytes(strings.subarray(offset + 4, offset + 4 + byteLength))
    }),
    Uint32Array.from(stringOffsets, (_, index) => index + 1),
  )
  const fileCount = params.directory[2]!.recordCount
  const filePathIds = Uint32Array.from({ length: fileCount }, (_, fileId) => files.readUInt32LE(fileId * 16))
  assertUniqueIds(filePathIds, "projectPath файла")
  const fileLookup = buildBinaryHashIndex(
    BigUint64Array.from(filePathIds, hashStringId),
    Uint32Array.from(filePathIds, (_, fileId) => fileId),
  )
  const logicalAddressIds = Uint32Array.from(
    entityOffsets,
    (offset) => entities.readUInt32LE(offset + 4),
  )
  assertUniqueIds(logicalAddressIds, "logicalAddress entity")
  const entityLookup = buildBinaryHashIndex(
    BigUint64Array.from(logicalAddressIds, hashStringId),
    Uint32Array.from(logicalAddressIds, (_, entityId) => entityId),
  )
  const offsetsBySourcePathId = new Map<number, number[]>()
  for (const offset of entityOffsets) {
    const sourcePathId = entities.readUInt32LE(offset + 8)
    const grouped = offsetsBySourcePathId.get(sourcePathId)
    if (grouped === undefined) offsetsBySourcePathId.set(sourcePathId, [offset])
    else grouped.push(offset)
  }
  const groupedOffsets = [...offsetsBySourcePathId]
  const sourceEntityOffsets = new Uint32Array(new SharedArrayBuffer(
    entityOffsets.length * Uint32Array.BYTES_PER_ELEMENT,
  ))
  const sourceEntityRanges = new Uint32Array(new SharedArrayBuffer(
    groupedOffsets.length * 2 * Uint32Array.BYTES_PER_ELEMENT,
  ))
  let cursor = 0
  groupedOffsets.forEach(([, offsets], rangeId) => {
    sourceEntityRanges[rangeId * 2] = cursor
    sourceEntityRanges[rangeId * 2 + 1] = offsets.length
    sourceEntityOffsets.set(offsets, cursor)
    cursor += offsets.length
  })
  const sourceEntityLookup = buildBinaryHashIndex(
    BigUint64Array.from(groupedOffsets, ([sourcePathId]) => hashStringId(sourcePathId)),
    Uint32Array.from(groupedOffsets, (_, rangeId) => rangeId),
  )
  return {
    stringLookup,
    fileLookup,
    entityLookup,
    sourceEntityOffsets: sourceEntityOffsets.buffer as SharedArrayBuffer,
    sourceEntityRanges: sourceEntityRanges.buffer as SharedArrayBuffer,
    sourceEntityLookup,
  }
}

function assertUniqueIds(ids: Uint32Array, label: string): void {
  const unique = new Set(ids)
  if (unique.size !== ids.length) throw new Error(`Повторяется ${label} в индексе конфигурации`)
}

function validateLookupRecordIds(index: BinaryHashIndex, valid: (recordId: number) => boolean): void {
  forEachBinaryHashIndexEntry(index, (_hash, recordId) => {
    if (!valid(recordId)) throw new Error("Повреждён lookup индекса конфигурации")
  })
}

function sortedUint32IndexOf(values: Uint32Array, searched: number): number {
  let low = 0
  let high = values.length - 1
  while (low <= high) {
    const middle = low + Math.floor((high - low) / 2)
    const value = values[middle]!
    if (value === searched) return middle
    if (value < searched) low = middle + 1
    else high = middle - 1
  }
  return -1
}

function defaultHashStringBytes(bytes: Uint8Array): bigint {
  return xxh3.xxh64(bytes)
}

function defaultHashStringId(id: number): bigint {
  stringIdHashBytes.writeUInt32LE(id)
  return xxh3.xxh64(stringIdHashBytes)
}

function copyToSharedBuffer(input: Uint8Array): SharedArrayBuffer {
  const bytes = new SharedArrayBuffer(input.byteLength)
  new Uint8Array(bytes).set(input)
  return bytes
}

function readDirectory(buffer: Buffer): readonly DirectoryEntry[] {
  return Array.from({ length: SECTION_COUNT }, (_, index) => {
    const offset = HEADER_LENGTH + index * DIRECTORY_ENTRY_LENGTH
    return {
      offset: Number(buffer.readBigUInt64LE(offset + 16)),
      length: Number(buffer.readBigUInt64LE(offset + 24)),
      recordCount: Number(buffer.readBigUInt64LE(offset + 40)),
    }
  })
}

function section(buffer: Buffer, directory: readonly DirectoryEntry[], type: SectionType): Buffer {
  const entry = directory[type - 1]
  if (entry === undefined) throw new Error(`Отсутствует секция индекса ${type}`)
  return buffer.subarray(entry.offset, entry.offset + entry.length)
}

function buildVariableRecordOffsets(sectionBytes: Buffer, recordCount: number): SharedArrayBuffer {
  const offsets = new Uint32Array(new SharedArrayBuffer(recordCount * Uint32Array.BYTES_PER_ELEMENT))
  let offset = 0
  for (let index = 0; index < recordCount; index += 1) {
    offsets[index] = offset
    offset = align8(offset + 4 + sectionBytes.readUInt32LE(offset))
  }
  return offsets.buffer as SharedArrayBuffer
}

function hasFlag(mask: number, flag: number): boolean {
  return (mask & flag) !== 0
}

function formatUuid(bytes: Buffer): string {
  const hex = bytes.toString("hex")
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

function align8(value: number): number {
  return Math.ceil(value / 8) * 8
}
