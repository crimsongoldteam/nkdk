import { createHash } from "crypto"
import type { ConfigurationIndexCollector } from "./collector/writer"
import type { SharedConfigurationIndexSnapshot } from "./sharedSnapshot"
import type { ConfigurationIndexReader } from "./sharedSnapshot"
import type { ConfigurationSnapshotXml, OmittedChildren } from "./types"
import type { ConfigurationIndexAddressingMode } from "../orchestration/property/types"
import { childUid, yamlPropertyUid } from "./logicalAddress"

type IdentityKind = "uuid" | "xmlId" | "xmlName"

export interface ConfigurationIndexExportRuntime {
  readonly source: ConfigurationIndexReader
  readonly collector: ConfigurationIndexCollector
  readonly targetProjectPath: string
  readonly logicalAddress: string
  readonly xmlNodeLogicalAddress?: string
  readonly formElementRootLogicalAddress?: string
  readonly childCollectionUidSegment?: string
  readonly yamlPathAddressing?: true
  readonly referencePathByCurrentPath?: ReadonlyMap<string, string>
  identity(kind: IdentityKind, address?: string): string | undefined
  identityOrCreate(kind: "uuid" | "xmlId", address?: string): string
  xml(address?: string): ConfigurationSnapshotXml | undefined
  omittedChildren(address?: string): OmittedChildren | undefined
  configVersion(address: string): string
  withLogicalAddress(logicalAddress: string): ConfigurationIndexExportRuntime
  withXmlNodeLogicalAddress(xmlNodeLogicalAddress: string): ConfigurationIndexExportRuntime
  withFormElementRootLogicalAddress(logicalAddress: string): ConfigurationIndexExportRuntime
  withPropertyContext(
    propertyName: string,
    childCollectionUidSegment?: string,
    options?: { configurationIndexAddressing?: ConfigurationIndexAddressingMode }
  ): ConfigurationIndexExportRuntime
}

declare module "../context/types" {
  interface ToXMLConfigurationContext {
    readonly configurationIndex?: ConfigurationIndexExportRuntime
  }
}

export interface CreateConfigurationIndexExportRuntimeOptions {
  readonly source: ConfigurationIndexReader
  readonly collector: ConfigurationIndexCollector
  readonly targetProjectPath: string
  readonly logicalAddress: string
  readonly xmlNodeLogicalAddress?: string
  readonly formElementRootLogicalAddress?: string
  readonly childCollectionUidSegment?: string
  readonly yamlPathAddressing?: true
  readonly referencePathByCurrentPath?: ReadonlyMap<string, string>
}

interface InternalConfigurationIndexExportRuntimeOptions extends CreateConfigurationIndexExportRuntimeOptions {
  readonly seed: Buffer
}

export function createConfigurationIndexExportRuntime(
  options: CreateConfigurationIndexExportRuntimeOptions
): ConfigurationIndexExportRuntime {
  const targetGeneration = options.source.header().indexGeneration + 1n
  return new DefaultConfigurationIndexExportRuntime({
    ...options,
    seed: operationSeed(options.source.snapshot, targetGeneration),
  })
}

class DefaultConfigurationIndexExportRuntime implements ConfigurationIndexExportRuntime {
  readonly source: ConfigurationIndexReader
  readonly collector: ConfigurationIndexCollector
  readonly targetProjectPath: string
  readonly logicalAddress: string
  readonly xmlNodeLogicalAddress?: string
  readonly formElementRootLogicalAddress?: string
  readonly childCollectionUidSegment?: string
  readonly yamlPathAddressing?: true
  readonly referencePathByCurrentPath?: ReadonlyMap<string, string>
  private readonly seed: Buffer
  private readonly generated = new Map<string, string>()

  constructor(options: InternalConfigurationIndexExportRuntimeOptions) {
    this.source = options.source
    this.collector = options.collector
    this.targetProjectPath = options.targetProjectPath
    this.logicalAddress = options.logicalAddress
    this.xmlNodeLogicalAddress = options.xmlNodeLogicalAddress
    this.formElementRootLogicalAddress = options.formElementRootLogicalAddress
    this.childCollectionUidSegment = options.childCollectionUidSegment
    this.yamlPathAddressing = options.yamlPathAddressing
    this.referencePathByCurrentPath = options.referencePathByCurrentPath
    this.seed = options.seed
  }

  identity(kind: IdentityKind, address = this.logicalAddress): string | undefined {
    return this.source.entity(this.referencePathByCurrentPath?.get(address) ?? address)?.identities?.[kind]
  }

  identityOrCreate(kind: "uuid" | "xmlId", address = this.logicalAddress): string {
    const existing = this.identity(kind, address)
    const value = existing ?? this.generatedIdentity(kind, address)
    this.collector.setIdentity(address, kind, value)
    return value
  }

  xml(address = this.logicalAddress): ConfigurationSnapshotXml | undefined {
    return this.source.entity(address)?.xml
  }

  omittedChildren(address = this.xmlNodeLogicalAddress ?? this.logicalAddress): OmittedChildren | undefined {
    return this.source.entity(address)?.omittedChildren
  }

  configVersion(address: string): string {
    return this.generatedValue("configVersion", address).subarray(0, 20).toString("hex")
  }

  withLogicalAddress(logicalAddress: string): ConfigurationIndexExportRuntime {
    return new DefaultConfigurationIndexExportRuntime({
      ...this.inheritedOptions(logicalAddress),
    })
  }

  withXmlNodeLogicalAddress(xmlNodeLogicalAddress: string): ConfigurationIndexExportRuntime {
    return new DefaultConfigurationIndexExportRuntime({
      ...this.inheritedOptions(this.logicalAddress),
      xmlNodeLogicalAddress,
    })
  }

  withFormElementRootLogicalAddress(logicalAddress: string): ConfigurationIndexExportRuntime {
    return new DefaultConfigurationIndexExportRuntime({
      ...this.inheritedOptions(this.logicalAddress),
      formElementRootLogicalAddress: logicalAddress,
      ...(this.xmlNodeLogicalAddress === undefined ? {} : { xmlNodeLogicalAddress: this.xmlNodeLogicalAddress }),
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
      ...this.inheritedOptions(useYamlPath ? propertyAddress : this.logicalAddress),
      xmlNodeLogicalAddress: propertyAddress,
      childCollectionUidSegment,
      ...(useYamlPath ? { yamlPathAddressing: true as const } : {}),
    })
  }

  private inheritedOptions(logicalAddress: string): InternalConfigurationIndexExportRuntimeOptions {
    return {
      source: this.source,
      collector: this.collector,
      targetProjectPath: this.targetProjectPath,
      logicalAddress,
      seed: this.seed,
      ...(this.formElementRootLogicalAddress === undefined
        ? {}
        : { formElementRootLogicalAddress: this.formElementRootLogicalAddress }),
      ...(this.childCollectionUidSegment === undefined
        ? {}
        : { childCollectionUidSegment: this.childCollectionUidSegment }),
      ...(this.yamlPathAddressing === undefined ? {} : { yamlPathAddressing: this.yamlPathAddressing }),
      ...(this.referencePathByCurrentPath === undefined
        ? {}
        : { referencePathByCurrentPath: this.referencePathByCurrentPath }),
    }
  }

  private generatedIdentity(kind: "uuid" | "xmlId", address: string): string {
    const cacheKey = `${kind}\0${address}`
    const cached = this.generated.get(cacheKey)
    if (cached !== undefined) return cached
    const bytes = this.generatedValue(kind, address)
    const value =
      kind === "uuid" ? formatDeterministicUuid(bytes.subarray(0, 16)) : bytes.subarray(0, 16).toString("hex")
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
