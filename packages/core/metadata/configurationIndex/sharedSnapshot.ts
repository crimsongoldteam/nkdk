import fs from "fs"
import { NKDK_CORE_VERSION } from "../../version"
import { decodeConfigurationIndex, type DecodeConfigurationIndexOptions } from "./decode"
import { configurationIndexPath, DEFAULT_CONFIGURATION_INDEX_BASE_ID } from "./fileIO"
import type {
  ConfigurationIdentity,
  ConfigurationIndexBinding,
  ConfigurationProjectFile,
  ConfigurationXmlNode,
  ConfigurationXmlValue,
} from "./types"

export interface SharedConfigurationIndexSnapshot {
  readonly bytes: SharedArrayBuffer
  readonly byteLength: number
  readonly stringOffsets: SharedArrayBuffer
  readonly orderOffsets: SharedArrayBuffer
  readonly xmlNodeOffsets: SharedArrayBuffer
}

export interface ConfigurationIndexReader {
  readonly snapshot: SharedConfigurationIndexSnapshot
  binding(): ConfigurationIndexBinding
  projectFile(projectPath: string): ConfigurationProjectFile | undefined
  identity(logicalAddress: string, kind: ConfigurationIdentity["kind"]): string | undefined
  xmlNode(logicalAddress: string): ConfigurationXmlNode | undefined
  xmlValue(logicalAddress: string): ConfigurationXmlValue | undefined
}

interface DirectoryEntry {
  readonly offset: number
  readonly length: number
  readonly recordCount: number
}

const HEADER_LENGTH = 64
const DIRECTORY_ENTRY_LENGTH = 64
const SECTION_COUNT = 7
const fatalUtf8Decoder = new TextDecoder("utf-8", { fatal: true })

export async function readConfigurationIndexSnapshot(params: {
  projectDir: string
  baseId?: string
}): Promise<SharedConfigurationIndexSnapshot> {
  const baseId = params.baseId ?? DEFAULT_CONFIGURATION_INDEX_BASE_ID
  const encoded = await fs.promises.readFile(configurationIndexPath(params.projectDir, baseId))
  return snapshotConfigurationIndex(encoded, {
    expectedBaseId: baseId,
    expectedProducerVersion: NKDK_CORE_VERSION,
  })
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
    stringOffsets: buildVariableRecordOffsets(section(buffer, directory, 2), directory[1]!.recordCount, 4),
    orderOffsets: buildVariableRecordOffsets(section(buffer, directory, 5), directory[4]!.recordCount, 8),
    xmlNodeOffsets: buildVariableRecordOffsets(section(buffer, directory, 6), directory[5]!.recordCount, 16),
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
  private readonly orderOffsets: Uint32Array
  private readonly xmlNodeOffsets: Uint32Array
  private readonly stringCache = new Map<number, string>()
  private stringIds: Map<string, number> | undefined
  private projectFileOffsets: Map<number, number> | undefined
  private identityOffsets: Map<string, number> | undefined
  private xmlNodeOffsetsByAddress: Map<number, number> | undefined
  private xmlValueOffsets: Map<number, number> | undefined

  constructor(snapshot: SharedConfigurationIndexSnapshot) {
    this.snapshot = snapshot
    this.buffer = Buffer.from(snapshot.bytes, 0, snapshot.byteLength)
    this.directory = readDirectory(this.buffer)
    this.stringOffsets = new Uint32Array(snapshot.stringOffsets)
    this.orderOffsets = new Uint32Array(snapshot.orderOffsets)
    this.xmlNodeOffsets = new Uint32Array(snapshot.xmlNodeOffsets)
  }

  binding(): ConfigurationIndexBinding {
    const binding = section(this.buffer, this.directory, 1)
    const baseFingerprintLength = binding.readUInt32LE(16)
    const configurationVersionLength = binding.readUInt32LE(20)
    const baseFingerprintOffset = HEADER_LENGTH
    const configurationVersionOffset = baseFingerprintOffset + baseFingerprintLength
    return {
      indexGeneration: binding.readBigUInt64LE(0),
      producerVersion: this.stringById(binding.readUInt32LE(8)),
      baseId: this.stringById(binding.readUInt32LE(12)),
      baseFingerprint: Uint8Array.from(
        binding.subarray(baseFingerprintOffset, baseFingerprintOffset + baseFingerprintLength)
      ),
      configurationVersion: Uint8Array.from(
        binding.subarray(configurationVersionOffset, configurationVersionOffset + configurationVersionLength)
      ),
    }
  }

  projectFile(projectPath: string): ConfigurationProjectFile | undefined {
    const projectPathId = this.findStringId(projectPath)
    if (projectPathId === undefined) return undefined
    const projectFiles = section(this.buffer, this.directory, 3)
    const offset = this.projectFileOffset(projectPathId)
    if (offset === undefined) return undefined
    return {
      projectPath,
      contentHash: projectFiles.readBigUInt64LE(offset + 8),
    }
  }

  identity(logicalAddress: string, kind: ConfigurationIdentity["kind"]): string | undefined {
    const logicalAddressId = this.findStringId(logicalAddress)
    if (logicalAddressId === undefined) return undefined
    const kindId = identityKindId(kind)
    const identities = section(this.buffer, this.directory, 4)
    const offset = this.identityOffset(logicalAddressId, kindId)
    if (offset === undefined) return undefined
    return kind === "uuid" ? formatUuid(identities.subarray(offset + 16, offset + 32)) : this.stringById(identities.readUInt32LE(offset + 8))
  }

  xmlNode(logicalAddress: string): ConfigurationXmlNode | undefined {
    const logicalAddressId = this.findStringId(logicalAddress)
    if (logicalAddressId === undefined) return undefined
    const nodes = section(this.buffer, this.directory, 6)
    const offset = this.xmlNodeOffset(logicalAddressId)
    if (offset === undefined) return undefined
    const orderId = nodes.readUInt32LE(offset + 4)
    const aliasCount = nodes.readUInt32LE(offset + 8)
    const presentCount = nodes.readUInt32LE(offset + 12)
    let cursor = offset + 16
    const aliases: Record<string, string> = {}
    for (let aliasIndex = 0; aliasIndex < aliasCount; aliasIndex += 1) {
      aliases[this.stringById(nodes.readUInt32LE(cursor))] = this.stringById(nodes.readUInt32LE(cursor + 4))
      cursor += 8
    }
    const present: string[] = []
    for (let presentIndex = 0; presentIndex < presentCount; presentIndex += 1) {
      present.push(this.stringById(nodes.readUInt32LE(cursor)))
      cursor += 4
    }
    return {
      logicalAddress,
      ...(orderId === 0 ? {} : { order: this.orderById(orderId) }),
      ...(aliasCount === 0 ? {} : { aliases }),
      ...(presentCount === 0 ? {} : { present }),
    }
  }

  xmlValue(logicalAddress: string): ConfigurationXmlValue | undefined {
    const logicalAddressId = this.findStringId(logicalAddress)
    if (logicalAddressId === undefined) return undefined
    const values = section(this.buffer, this.directory, 7)
    const offset = this.xmlValueOffset(logicalAddressId)
    if (offset === undefined) return undefined
    const flags = values.readUInt32LE(offset + 4)
    return {
      logicalAddress,
      ...((flags & (1 << 0)) === 0 ? {} : { xsiNil: true as const }),
      ...((flags & (1 << 1)) === 0 ? {} : { explicitEmpty: true as const }),
      ...this.optionalValue(values, offset + 8, flags, 2, "xsiType"),
      ...this.optionalValue(values, offset + 12, flags, 3, "xmlText"),
      ...this.optionalValue(values, offset + 16, flags, 4, "xmlPrefix"),
      ...this.optionalValue(values, offset + 20, flags, 5, "userSettingsId"),
    }
  }

  private optionalValue(
    values: Buffer,
    offset: number,
    flags: number,
    bit: number,
    key: "xsiType" | "xmlText" | "xmlPrefix" | "userSettingsId"
  ): Partial<ConfigurationXmlValue> {
    if ((flags & (1 << bit)) === 0) return {}
    return { [key]: this.stringById(values.readUInt32LE(offset)) }
  }

  private orderById(orderId: number): string[] {
    const orders = section(this.buffer, this.directory, 5)
    const offset = this.orderOffsets[orderId - 1]
    if (offset === undefined) throw new Error(`Некорректный orderId XML_NODES: ${orderId}`)
    const count = orders.readUInt32LE(offset)
    return Array.from({ length: count }, (_, index) => this.stringById(orders.readUInt32LE(offset + 8 + index * 4)))
  }

  private findStringId(value: string): number | undefined {
    if (this.stringIds !== undefined) return this.stringIds.get(value)
    const strings = section(this.buffer, this.directory, 2)
    const ids = new Map<string, number>()
    for (let index = 0; index < this.stringOffsets.length; index += 1) {
      const offset = this.stringOffsets[index]!
      const length = strings.readUInt32LE(offset)
      const id = index + 1
      const string = fatalUtf8Decoder.decode(strings.subarray(offset + 4, offset + 4 + length))
      ids.set(string, id)
      this.stringCache.set(id, string)
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
    const length = strings.readUInt32LE(offset)
    const value = fatalUtf8Decoder.decode(strings.subarray(offset + 4, offset + 4 + length))
    this.stringCache.set(id, value)
    return value
  }

  private projectFileOffset(projectPathId: number): number | undefined {
    if (this.projectFileOffsets === undefined) {
      const projectFiles = section(this.buffer, this.directory, 3)
      const offsets = new Map<number, number>()
      for (let index = 0; index < this.directory[2]!.recordCount; index += 1) {
        const offset = index * 16
        offsets.set(projectFiles.readUInt32LE(offset), offset)
      }
      this.projectFileOffsets = offsets
    }
    return this.projectFileOffsets.get(projectPathId)
  }

  private identityOffset(logicalAddressId: number, kindId: number): number | undefined {
    if (this.identityOffsets === undefined) {
      const identities = section(this.buffer, this.directory, 4)
      const offsets = new Map<string, number>()
      for (let index = 0; index < this.directory[3]!.recordCount; index += 1) {
        const offset = index * 32
        offsets.set(identityKey(identities.readUInt32LE(offset), identities.readUInt16LE(offset + 4)), offset)
      }
      this.identityOffsets = offsets
    }
    return this.identityOffsets.get(identityKey(logicalAddressId, kindId))
  }

  private xmlNodeOffset(logicalAddressId: number): number | undefined {
    if (this.xmlNodeOffsetsByAddress === undefined) {
      const nodes = section(this.buffer, this.directory, 6)
      const offsets = new Map<number, number>()
      for (const offset of this.xmlNodeOffsets) offsets.set(nodes.readUInt32LE(offset), offset)
      this.xmlNodeOffsetsByAddress = offsets
    }
    return this.xmlNodeOffsetsByAddress.get(logicalAddressId)
  }

  private xmlValueOffset(logicalAddressId: number): number | undefined {
    if (this.xmlValueOffsets === undefined) {
      const values = section(this.buffer, this.directory, 7)
      const offsets = new Map<number, number>()
      for (let index = 0; index < this.directory[6]!.recordCount; index += 1) {
        const offset = index * 32
        offsets.set(values.readUInt32LE(offset), offset)
      }
      this.xmlValueOffsets = offsets
    }
    return this.xmlValueOffsets.get(logicalAddressId)
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

function section(buffer: Buffer, directory: readonly DirectoryEntry[], type: 1 | 2 | 3 | 4 | 5 | 6 | 7): Buffer {
  const entry = directory[type - 1]
  if (entry === undefined) throw new Error(`Отсутствует секция индекса ${type}`)
  return buffer.subarray(entry.offset, entry.offset + entry.length)
}

function buildVariableRecordOffsets(sectionBytes: Buffer, recordCount: number, headerLength: number): SharedArrayBuffer {
  const offsets = new Uint32Array(new SharedArrayBuffer(recordCount * Uint32Array.BYTES_PER_ELEMENT))
  let offset = 0
  for (let index = 0; index < recordCount; index += 1) {
    offsets[index] = offset
    const variableLength = variableRecordDataLength(sectionBytes, offset, headerLength)
    offset = align8(offset + headerLength + variableLength)
  }
  return offsets.buffer as SharedArrayBuffer
}

function variableRecordDataLength(sectionBytes: Buffer, offset: number, headerLength: number): number {
  switch (headerLength) {
    case 4:
      return sectionBytes.readUInt32LE(offset)
    case 8:
      return sectionBytes.readUInt32LE(offset) * 4
    case 16:
      return sectionBytes.readUInt32LE(offset + 8) * 8 + sectionBytes.readUInt32LE(offset + 12) * 4
    default:
      throw new Error(`Неподдерживаемая длина заголовка переменной записи: ${headerLength}`)
  }
}

function identityKindId(kind: ConfigurationIdentity["kind"]): 1 | 2 | 3 {
  switch (kind) {
    case "uuid":
      return 1
    case "xmlId":
      return 2
    case "xmlName":
      return 3
  }
}

function identityKey(logicalAddressId: number, kindId: number): string {
  return `${logicalAddressId}\0${kindId}`
}

function formatUuid(bytes: Buffer): string {
  const hex = bytes.toString("hex")
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

function align8(value: number): number {
  return Math.ceil(value / 8) * 8
}
