import { createHash, randomBytes } from "node:crypto"
import type { ConfigurationIndexCollector } from "./collector/writer"
import type { ConfigurationIndexBlockEntity, ConfigurationIndexChild, ConfigurationSnapshotEntity } from "./types"
import type { ConfigurationIndexAddressingMode } from "../ruleRuntime/property/types"
import { childUid, yamlPropertyUid } from "./logicalAddress"

type IdentityKind = "uuid" | "xmlId"

interface ConfigurationIndexEntityReader {
  entity(logicalAddress: string): ConfigurationIndexBlockEntity | ConfigurationSnapshotEntity | undefined
  entities(): Iterable<ConfigurationIndexBlockEntity | ConfigurationSnapshotEntity>
}

export interface ConfigurationIndexExportRuntime {
  readonly source: ConfigurationIndexEntityReader
  readonly collector: ConfigurationIndexCollector
  readonly targetProjectPath: string
  readonly logicalAddress: string
  readonly xmlNodeLogicalAddress?: string
  readonly formElementRootLogicalAddress?: string
  readonly childCollectionUidSegment?: string
  readonly yamlPathAddressing?: true
  readonly referencePathByCurrentPath?: ReadonlyMap<string, string>
  identity(kind: IdentityKind, address?: string): string | undefined
  identityOrCreate(kind: IdentityKind, address?: string): string
  children(address?: string): readonly ConfigurationIndexChild[] | undefined
  configVersion(address: string): string
  withLogicalAddress(logicalAddress: string): ConfigurationIndexExportRuntime
  withXmlNodeLogicalAddress(xmlNodeLogicalAddress: string): ConfigurationIndexExportRuntime
  withFormElementRootLogicalAddress(logicalAddress: string): ConfigurationIndexExportRuntime
  withPropertyContext(
    propertyName: string,
    childCollectionUidSegment?: string,
    options?: { configurationIndexAddressing?: ConfigurationIndexAddressingMode },
  ): ConfigurationIndexExportRuntime
}

declare module "../context/types" {
  interface ToXMLConfigurationContext {
    readonly configurationIndex?: ConfigurationIndexExportRuntime
  }
}

export interface CreateConfigurationIndexExportRuntimeOptions {
  readonly source: ConfigurationIndexEntityReader
  readonly collector: ConfigurationIndexCollector
  readonly targetProjectPath: string
  readonly logicalAddress: string
  readonly operationSeed?: Uint8Array
  readonly xmlNodeLogicalAddress?: string
  readonly formElementRootLogicalAddress?: string
  readonly childCollectionUidSegment?: string
  readonly yamlPathAddressing?: true
  readonly referencePathByCurrentPath?: ReadonlyMap<string, string>
}

interface InternalOptions extends Omit<CreateConfigurationIndexExportRuntimeOptions, "operationSeed"> {
  readonly operationSeed: Buffer
}

export function createConfigurationIndexExportRuntime(
  options: CreateConfigurationIndexExportRuntimeOptions,
): ConfigurationIndexExportRuntime {
  const operationSeed = options.operationSeed ?? randomBytes(32)
  if (operationSeed.byteLength !== 32) throw new Error("operationSeed должен содержать 32 байта")
  return new DefaultConfigurationIndexExportRuntime({
    ...options,
    operationSeed: Buffer.from(operationSeed),
  })
}

class DefaultConfigurationIndexExportRuntime implements ConfigurationIndexExportRuntime {
  readonly source: ConfigurationIndexEntityReader
  readonly collector: ConfigurationIndexCollector
  readonly targetProjectPath: string
  readonly logicalAddress: string
  readonly xmlNodeLogicalAddress?: string
  readonly formElementRootLogicalAddress?: string
  readonly childCollectionUidSegment?: string
  readonly yamlPathAddressing?: true
  readonly referencePathByCurrentPath?: ReadonlyMap<string, string>
  private readonly operationSeed: Buffer
  private readonly generated: Map<string, string>

  constructor(options: InternalOptions, generated = new Map<string, string>()) {
    this.source = options.source
    this.collector = options.collector
    this.targetProjectPath = options.targetProjectPath
    this.logicalAddress = options.logicalAddress
    this.xmlNodeLogicalAddress = options.xmlNodeLogicalAddress
    this.formElementRootLogicalAddress = options.formElementRootLogicalAddress
    this.childCollectionUidSegment = options.childCollectionUidSegment
    this.yamlPathAddressing = options.yamlPathAddressing
    this.referencePathByCurrentPath = options.referencePathByCurrentPath
    this.operationSeed = options.operationSeed
    this.generated = generated
  }

  identity(kind: IdentityKind, address = this.logicalAddress): string | undefined {
    const entity = this.source.entity(this.referencePathByCurrentPath?.get(address) ?? address)
    if (entity === undefined) return undefined
    return isLegacyEntity(entity) ? entity.identities?.[kind] : entity[kind]
  }

  identityOrCreate(kind: IdentityKind, address = this.logicalAddress): string {
    const value = this.identity(kind, address) ?? this.generatedIdentity(kind, address)
    this.collector.setIdentity(address, kind, value)
    return value
  }

  children(address = this.xmlNodeLogicalAddress ?? this.logicalAddress): readonly ConfigurationIndexChild[] | undefined {
    const entity = this.source.entity(address)
    if (entity === undefined) return undefined
    if (!isLegacyEntity(entity)) return entity.children
    const omitted = entity.omittedChildren
    if (omitted === undefined) return undefined
    return omitted.kind === "typedNames"
      ? omitted.items
      : omitted.names.map((name) => ({ xmlName: "Form", name }))
  }

  configVersion(address: string): string {
    return this.generatedValue("configVersion", address).subarray(0, 20).toString("hex")
  }

  withLogicalAddress(logicalAddress: string): ConfigurationIndexExportRuntime {
    return new DefaultConfigurationIndexExportRuntime(this.inheritedOptions(logicalAddress), this.generated)
  }

  withXmlNodeLogicalAddress(xmlNodeLogicalAddress: string): ConfigurationIndexExportRuntime {
    return new DefaultConfigurationIndexExportRuntime({
      ...this.inheritedOptions(this.logicalAddress),
      xmlNodeLogicalAddress,
    }, this.generated)
  }

  withFormElementRootLogicalAddress(logicalAddress: string): ConfigurationIndexExportRuntime {
    return new DefaultConfigurationIndexExportRuntime({
      ...this.inheritedOptions(this.logicalAddress),
      formElementRootLogicalAddress: logicalAddress,
    }, this.generated)
  }

  withPropertyContext(
    propertyName: string,
    childCollectionUidSegment?: string,
    options: { configurationIndexAddressing?: ConfigurationIndexAddressingMode } = {},
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
    }, this.generated)
  }

  private inheritedOptions(logicalAddress: string): InternalOptions {
    return {
      source: this.source,
      collector: this.collector,
      targetProjectPath: this.targetProjectPath,
      logicalAddress,
      operationSeed: this.operationSeed,
      ...(this.xmlNodeLogicalAddress === undefined ? {} : { xmlNodeLogicalAddress: this.xmlNodeLogicalAddress }),
      ...(this.formElementRootLogicalAddress === undefined ? {} : { formElementRootLogicalAddress: this.formElementRootLogicalAddress }),
      ...(this.childCollectionUidSegment === undefined ? {} : { childCollectionUidSegment: this.childCollectionUidSegment }),
      ...(this.yamlPathAddressing === undefined ? {} : { yamlPathAddressing: this.yamlPathAddressing }),
      ...(this.referencePathByCurrentPath === undefined ? {} : { referencePathByCurrentPath: this.referencePathByCurrentPath }),
    }
  }

  private generatedIdentity(kind: IdentityKind, address: string): string {
    const cacheKey = `${kind}\0${address}`
    const cached = this.generated.get(cacheKey)
    if (cached !== undefined) return cached
    const bytes = this.generatedValue(kind, address)
    const value = kind === "uuid"
      ? formatDeterministicUuid(bytes.subarray(0, 16))
      : bytes.subarray(0, 16).toString("hex")
    this.generated.set(cacheKey, value)
    return value
  }

  private generatedValue(kind: string, address: string): Buffer {
    return createHash("sha256")
      .update(this.operationSeed)
      .update(Buffer.from([0]))
      .update(kind, "utf8")
      .update(Buffer.from([0]))
      .update(address, "utf8")
      .digest()
  }
}

function isLegacyEntity(
  entity: ConfigurationIndexBlockEntity | ConfigurationSnapshotEntity,
): entity is ConfigurationSnapshotEntity {
  return "sourceProjectPath" in entity
}

function formatDeterministicUuid(bytes: Uint8Array): string {
  const copy = Buffer.from(bytes)
  copy[6] = (copy[6]! & 0x0f) | 0x40
  copy[8] = (copy[8]! & 0x3f) | 0x80
  const hex = copy.toString("hex")
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}
