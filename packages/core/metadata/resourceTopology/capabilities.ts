import type { ConfigurationIndexReader } from "../configurationIndex/sharedSnapshot"
import type { ConfigurationContextWithExportToXML } from "../context/types"
import type { DeferredObjectValue } from "../orchestration/property/deferredObjectValues"
import type { YAMLToXMLProfile } from "../orchestration/property/fromYAMLToXMLTypes"
import type { MetadataItemRule } from "../orchestration/property/types"
import type { PreparedYamlFile } from "../project/preparedYamlProject"
import type { CompiledMetadataAssignmentNode } from "./types"

export interface MetadataXmlPrepareOutput {
  readonly declarationId: string
  readonly targetXmlPath: string
  readonly role: "metadata" | "body" | "property"
}

export interface MetadataXmlPrepareCompositionEntry {
  readonly sourceProjectPath: string
  readonly itemName: string
  readonly logicalAddress: string
  readonly assignmentRole: "configuration" | "properties" | "fileItem"
  readonly ownerLogicalAddress?: string
}

export interface PreparedMetadataXmlDocument {
  readonly declarationId: string
  readonly targetXmlPath: string
  readonly xml: Record<string, unknown>
  readonly deferred: readonly DeferredObjectValue[]
  readonly rootRule: MetadataItemRule
}

export interface MetadataXmlPrepareCapability {
  readonly id: string
  readonly run: (params: {
    readonly context: ConfigurationContextWithExportToXML
    readonly preparedYamlFile: PreparedYamlFile
    readonly assignment: CompiledMetadataAssignmentNode
    readonly itemName: string
    readonly logicalAddress: string
    readonly outputs: readonly MetadataXmlPrepareOutput[]
    readonly index: ConfigurationIndexReader
    readonly composition: readonly MetadataXmlPrepareCompositionEntry[]
    readonly profile: YAMLToXMLProfile
  }) => readonly PreparedMetadataXmlDocument[]
}

const prepareCapabilities = new Map<string, MetadataXmlPrepareCapability>()

export interface MetadataExternalTransferCapability {
  readonly id: string
  readonly projectToXml: (params: {
    readonly sourcePath: string
    readonly targetPath: string
  }) => { readonly sourcePath: string; readonly targetPath: string }
}

const externalTransferCapabilities = new Map<string, MetadataExternalTransferCapability>()

export function registerMetadataXmlPrepareCapability(capability: MetadataXmlPrepareCapability): void {
  const previous = prepareCapabilities.get(capability.id)
  if (previous !== undefined && previous.run !== capability.run) {
    throw new Error(`Возможность подготовки XML уже зарегистрирована: ${capability.id}`)
  }
  prepareCapabilities.set(capability.id, capability)
}

export function getMetadataXmlPrepareCapability(id: string): MetadataXmlPrepareCapability | undefined {
  return prepareCapabilities.get(id)
}

export function clearMetadataXmlPrepareCapabilitiesForTests(): void {
  prepareCapabilities.clear()
}

export function registerMetadataExternalTransferCapability(
  capability: MetadataExternalTransferCapability
): void {
  const previous = externalTransferCapabilities.get(capability.id)
  if (previous !== undefined && previous.projectToXml !== capability.projectToXml) {
    throw new Error(`Возможность переноса внешнего файла уже зарегистрирована: ${capability.id}`)
  }
  externalTransferCapabilities.set(capability.id, capability)
}

export function getMetadataExternalTransferCapability(
  id: string
): MetadataExternalTransferCapability | undefined {
  return externalTransferCapabilities.get(id)
}
