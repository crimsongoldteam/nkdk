import { createHash } from "crypto"
import type { ConfigurationIndexCollector } from "./collector/writer"
import type { SharedConfigurationIndexSnapshot } from "./sharedSnapshot"
import type { ConfigurationIndexReader } from "./sharedSnapshot"
import type { ConfigurationIdentity, ConfigurationXmlNode, ConfigurationXmlValue } from "./types"
import type { ConfigurationIndexAddressingMode } from "../orchestration/property/types"
import { childUid, yamlPropertyUid } from "./logicalAddress"

export interface ConfigurationIndexExportRuntime {
  readonly source: ConfigurationIndexReader
  readonly collector: ConfigurationIndexCollector
  readonly targetProjectPath: string
  readonly logicalAddress: string
  readonly xmlNodeLogicalAddress?: string
  readonly childCollectionUidSegment?: string
  readonly yamlPathAddressing?: true
  identity(kind: ConfigurationIdentity["kind"], address?: string): string | undefined
  identityOrCreate(kind: "uuid" | "xmlId", address?: string): string
  xmlNode(address?: string): ConfigurationXmlNode | undefined
  xmlValue(address?: string): ConfigurationXmlValue | undefined
  configVersion(address: string): string
  withLogicalAddress(logicalAddress: string): ConfigurationIndexExportRuntime
  withPropertyContext(
    propertyName: string,
    childCollectionUidSegment?: string,
    options?: { configurationIndexAddressing?: ConfigurationIndexAddressingMode }
  ): ConfigurationIndexExportRuntime
}

export interface CreateConfigurationIndexExportRuntimeOptions {
  readonly source: ConfigurationIndexReader
  readonly collector: ConfigurationIndexCollector
  readonly targetProjectPath: string
  readonly logicalAddress: string
  readonly targetGeneration?: bigint
  readonly xmlNodeLogicalAddress?: string
  readonly childCollectionUidSegment?: string
  readonly yamlPathAddressing?: true
}

export function createConfigurationIndexExportRuntime(
  options: CreateConfigurationIndexExportRuntimeOptions
): ConfigurationIndexExportRuntime {
  return new DefaultConfigurationIndexExportRuntime(options)
}

class DefaultConfigurationIndexExportRuntime implements ConfigurationIndexExportRuntime {
  readonly source: ConfigurationIndexReader
  readonly collector: ConfigurationIndexCollector
  readonly targetProjectPath: string
  readonly logicalAddress: string
  readonly xmlNodeLogicalAddress?: string
  readonly childCollectionUidSegment?: string
  readonly yamlPathAddressing?: true
  private readonly targetGeneration: bigint
  private readonly seed: Buffer
  private readonly generated = new Map<string, string>()

  constructor(options: CreateConfigurationIndexExportRuntimeOptions) {
    this.source = options.source
    this.collector = options.collector
    this.targetProjectPath = options.targetProjectPath
    this.logicalAddress = options.logicalAddress
    this.xmlNodeLogicalAddress = options.xmlNodeLogicalAddress
    this.childCollectionUidSegment = options.childCollectionUidSegment
    this.yamlPathAddressing = options.yamlPathAddressing
    this.targetGeneration = options.targetGeneration ?? this.source.binding().indexGeneration + 1n
    this.seed = operationSeed(this.source.snapshot, this.targetGeneration)
  }

  identity(kind: ConfigurationIdentity["kind"], address = this.logicalAddress): string | undefined {
    return this.source.identity(address, kind)
  }

  identityOrCreate(kind: "uuid" | "xmlId", address = this.logicalAddress): string {
    const existing = this.identity(kind, address)
    const value = existing ?? this.generatedIdentity(kind, address)
    if (kind === "uuid") this.collector.setUuid(address, value)
    else this.collector.setXmlId(address, value)
    return value
  }

  xmlNode(address = this.xmlNodeLogicalAddress ?? this.logicalAddress): ConfigurationXmlNode | undefined {
    return this.source.xmlNode(address)
  }

  xmlValue(address = this.logicalAddress): ConfigurationXmlValue | undefined {
    return this.source.xmlValue(address)
  }

  configVersion(address: string): string {
    return this.generatedValue("configVersion", address).subarray(0, 20).toString("hex")
  }

  withLogicalAddress(logicalAddress: string): ConfigurationIndexExportRuntime {
    return new DefaultConfigurationIndexExportRuntime({
      source: this.source,
      collector: this.collector,
      targetProjectPath: this.targetProjectPath,
      logicalAddress,
      targetGeneration: this.targetGeneration,
      ...(this.childCollectionUidSegment === undefined ? {} : { childCollectionUidSegment: this.childCollectionUidSegment }),
      ...(this.yamlPathAddressing === undefined ? {} : { yamlPathAddressing: this.yamlPathAddressing }),
    })
  }

  withPropertyContext(
    propertyName: string,
    childCollectionUidSegment: string | undefined,
    options: { configurationIndexAddressing?: ConfigurationIndexAddressingMode } = {}
  ): ConfigurationIndexExportRuntime {
    const useYamlPath = this.yamlPathAddressing === true || options.configurationIndexAddressing === "yamlPath"
    const propertyAddress = useYamlPath
      ? yamlPropertyUid(this.logicalAddress, propertyName)
      : childUid(this.logicalAddress, "Свойство", propertyName)
    return new DefaultConfigurationIndexExportRuntime({
      source: this.source,
      collector: this.collector,
      targetProjectPath: this.targetProjectPath,
      logicalAddress: useYamlPath ? propertyAddress : this.logicalAddress,
      xmlNodeLogicalAddress: propertyAddress,
      targetGeneration: this.targetGeneration,
      ...(useYamlPath ? { yamlPathAddressing: true as const } : {}),
      ...(childCollectionUidSegment === undefined ? {} : { childCollectionUidSegment }),
    })
  }

  private generatedIdentity(kind: "uuid" | "xmlId", address: string): string {
    const cacheKey = `${kind}\0${address}`
    const cached = this.generated.get(cacheKey)
    if (cached !== undefined) return cached
    const bytes = this.generatedValue(kind, address)
    const value = kind === "uuid" ? formatDeterministicUuid(bytes.subarray(0, 16)) : bytes.subarray(0, 16).toString("hex")
    this.generated.set(cacheKey, value)
    return value
  }

  private generatedValue(kind: string, address: string): Buffer {
    return createHash("sha256")
      .update(this.seed)
      .update(Buffer.from([0]))
      .update(kind, "utf8")
      .update(Buffer.from([0]))
      .update(address, "utf8")
      .digest()
  }
}

const operationSeedCache = new WeakMap<SharedConfigurationIndexSnapshot, Map<bigint, Buffer>>()

function operationSeed(snapshot: SharedConfigurationIndexSnapshot, targetGeneration: bigint): Buffer {
  let seeds = operationSeedCache.get(snapshot)
  if (seeds === undefined) {
    seeds = new Map()
    operationSeedCache.set(snapshot, seeds)
  }
  const cached = seeds.get(targetGeneration)
  if (cached !== undefined) return cached
  const seed = deriveOperationSeed(snapshot.bytes, snapshot.byteLength, targetGeneration)
  seeds.set(targetGeneration, seed)
  return seed
}

function deriveOperationSeed(bytes: SharedArrayBuffer, byteLength: number, targetGeneration: bigint): Buffer {
  const generationBytes = Buffer.alloc(8)
  generationBytes.writeBigUInt64LE(targetGeneration)
  return createHash("sha256")
    .update(Buffer.from(bytes, 0, byteLength))
    .update(generationBytes)
    .digest()
}

function formatDeterministicUuid(input: Buffer): string {
  const bytes = Buffer.from(input)
  bytes[6] = (bytes[6]! & 0x0f) | 0x40
  bytes[8] = (bytes[8]! & 0x3f) | 0x80
  const hex = bytes.toString("hex")
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}
