import fs from "fs"
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
}

export interface ConfigurationIndexReader {
  readonly snapshot: SharedConfigurationIndexSnapshot
  header(): Pick<ConfigurationSnapshot, "specificationVersion" | "indexGeneration" | "componentPath">
  file(projectPath: string): ConfigurationSnapshotFile | undefined
  files(): Iterable<ConfigurationSnapshotFile>
  entity(logicalAddress: string): ConfigurationSnapshotEntity | undefined
  entities(): Iterable<ConfigurationSnapshotEntity>
  entitiesBySourceProjectPath(projectPath: string): Iterable<ConfigurationSnapshotEntity>
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
  options: DecodeConfigurationIndexOptions = {}
): SharedConfigurationIndexSnapshot {
  decodeConfigurationIndex(input, options)
  const bytes = copyToSharedBuffer(input)
  const buffer = Buffer.from(bytes, 0, input.byteLength)
  const directory = readDirectory(buffer)
  return {
    bytes,
    byteLength: input.byteLength,
    stringOffsets: buildVariableRecordOffsets(section(buffer, directory, 2), directory[1]!.recordCount),
    entityOffsets: buildVariableRecordOffsets(section(buffer, directory, 4), directory[3]!.recordCount),
  }
}

export function createConfigurationIndexReader(snapshot: SharedConfigurationIndexSnapshot): ConfigurationIndexReader {
  return new SharedConfigurationIndexReader(snapshot)
}

class SharedConfigurationIndexReader implements ConfigurationIndexReader {
  readonly snapshot: SharedConfigurationIndexSnapshot
  private readonly buffer: Buffer
  private readonly directory: readonly DirectoryEntry[]
  private readonly stringOffsets: Uint32Array
  private readonly entityOffsets: Uint32Array
  private readonly stringCache = new Map<number, string>()
  private stringIds?: Map<string, number>
  private fileOffsetByPathId?: Map<number, number>
  private entityOffsetByAddressId?: Map<number, number>
  private entityOffsetsBySourcePathId?: Map<number, readonly number[]>

  constructor(snapshot: SharedConfigurationIndexSnapshot) {
    this.snapshot = snapshot
    this.buffer = Buffer.from(snapshot.bytes, 0, snapshot.byteLength)
    this.directory = readDirectory(this.buffer)
    this.stringOffsets = new Uint32Array(snapshot.stringOffsets)
    this.entityOffsets = new Uint32Array(snapshot.entityOffsets)
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
    for (const offset of this.entityOffsetsForSourcePath(projectPathId)) yield this.decodeEntity(offset)
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

  private findStringId(value: string): number | undefined {
    if (this.stringIds !== undefined) return this.stringIds.get(value)
    const ids = new Map<string, number>()
    for (let index = 0; index < this.stringOffsets.length; index += 1) {
      const id = index + 1
      ids.set(this.stringById(id), id)
    }
    this.stringIds = ids
    return ids.get(value)
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
    if (this.fileOffsetByPathId === undefined) {
      const files = section(this.buffer, this.directory, 3)
      const offsets = new Map<number, number>()
      for (let index = 0; index < this.directory[2]!.recordCount; index += 1) {
        const offset = index * 16
        offsets.set(files.readUInt32LE(offset), offset)
      }
      this.fileOffsetByPathId = offsets
    }
    return this.fileOffsetByPathId.get(projectPathId)
  }

  private entityOffset(logicalAddressId: number): number | undefined {
    if (this.entityOffsetByAddressId === undefined) {
      const entities = section(this.buffer, this.directory, 4)
      const offsets = new Map<number, number>()
      for (const offset of this.entityOffsets) offsets.set(entities.readUInt32LE(offset + 4), offset)
      this.entityOffsetByAddressId = offsets
    }
    return this.entityOffsetByAddressId.get(logicalAddressId)
  }

  private entityOffsetsForSourcePath(sourceProjectPathId: number): readonly number[] {
    if (this.entityOffsetsBySourcePathId === undefined) {
      const entities = section(this.buffer, this.directory, 4)
      const mutableOffsets = new Map<number, number[]>()
      for (const offset of this.entityOffsets) {
        const sourcePathId = entities.readUInt32LE(offset + 8)
        const offsets = mutableOffsets.get(sourcePathId)
        if (offsets === undefined) mutableOffsets.set(sourcePathId, [offset])
        else offsets.push(offset)
      }
      this.entityOffsetsBySourcePathId = mutableOffsets
    }
    return this.entityOffsetsBySourcePathId.get(sourceProjectPathId) ?? []
  }
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
