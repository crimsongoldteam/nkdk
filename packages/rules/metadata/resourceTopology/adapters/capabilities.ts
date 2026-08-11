import type { ConfigurationIndexReader } from "@nkdk/runtime"
import type { ConfigurationSnapshotFragment } from "@nkdk/runtime"
import type { ConfigurationContextFromXML } from "@nkdk/runtime"
import type { ConfigurationContextWithExportToXML } from "@nkdk/runtime"
import type { DeferredObjectValue } from "@nkdk/runtime/rule-kit"
import type { YAMLToXMLProfile } from "@nkdk/runtime/rule-kit"
import type { MetadataItemRule } from "@nkdk/runtime/rule-kit"
import type { PreparedYamlFile } from "../../project/preparedYamlProject"
import { currentOperationRegistrySet } from "../../operations/operationExecutionContext"
import { defineMetadataRules } from "../../ruleRuntime/definition"
import { emptyMetadataRules } from "../../ruleRuntime/definition/testSupport"
import type {
  CompiledMetadataAssignmentNode,
  MetadataXmlBaseInputDeclaration,
} from "../core/types"

export interface MetadataXmlPrepareOutput {
  readonly declarationId: string
  readonly targetXmlPath: string
  readonly role: "metadata" | "body" | "property"
  readonly propertyName?: string
  readonly baseInput?: MetadataXmlBaseInputDeclaration
}

export interface MetadataXmlPrepareCompositionEntry {
  readonly sourceProjectPath: string
  readonly itemType: string
  readonly itemName: string
  readonly logicalAddress: string
  readonly assignmentRole: "configuration" | "properties" | "fileItem"
  readonly ownerLogicalAddress?: string
}

export interface MetadataXmlPrepareComposition {
  children(ownerLogicalAddress: string): readonly MetadataXmlPrepareCompositionEntry[]
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
    readonly baseFormPreparedYamlFile?: PreparedYamlFile
    readonly currentConfigurationFormPreparedYamlFile?: PreparedYamlFile
    readonly baseFormSourceKind?: "saved" | "projected"
    readonly baseConfigurationIndex?: ConfigurationIndexReader
    readonly baseFormContext?: ConfigurationContextWithExportToXML
    readonly assignment: CompiledMetadataAssignmentNode
    readonly itemName: string
    readonly logicalAddress: string
    readonly outputs: readonly MetadataXmlPrepareOutput[]
    readonly index: ConfigurationIndexReader
    readonly composition: MetadataXmlPrepareComposition
    readonly profile: YAMLToXMLProfile
  }) => readonly PreparedMetadataXmlDocument[]
}

export interface MetadataExternalTransferCapability {
  readonly id: string
  readonly projectToXml: (params: {
    readonly sourcePath: string
    readonly targetPath: string
  }) => { readonly sourcePath: string; readonly targetPath: string }
}

export interface MetadataSnapshotImportCapability {
  readonly id: string
  readonly run: (params: {
    readonly context: ConfigurationContextFromXML
    readonly sourcePath: string
    readonly targetProjectPath: string
  }) => Promise<ConfigurationSnapshotFragment>
}

export type MetadataResourceCapabilityContribution =
  | { readonly kind: "xmlPrepareCapability"; readonly capability: MetadataXmlPrepareCapability }
  | { readonly kind: "externalTransferCapability"; readonly capability: MetadataExternalTransferCapability }
  | { readonly kind: "snapshotImportCapability"; readonly capability: MetadataSnapshotImportCapability }

export function defineMetadataXmlPrepareCapability(capability: MetadataXmlPrepareCapability) {
  return defineMetadataRules({
    ...emptyMetadataRules,
    synchronization: [{ kind: "xmlPrepareCapability", capability }] as const,
  })
}

export function defineMetadataExternalTransferCapability(capability: MetadataExternalTransferCapability) {
  return defineMetadataRules({
    ...emptyMetadataRules,
    synchronization: [{ kind: "externalTransferCapability", capability }] as const,
  })
}

export function defineMetadataSnapshotImportCapability(capability: MetadataSnapshotImportCapability) {
  return defineMetadataRules({
    ...emptyMetadataRules,
    synchronization: [{ kind: "snapshotImportCapability", capability }] as const,
  })
}

export function getMetadataXmlPrepareCapability(id: string): MetadataXmlPrepareCapability | undefined {
  return capabilityRegistry().xmlPrepare(id)
}

export function getMetadataExternalTransferCapability(
  id: string
): MetadataExternalTransferCapability | undefined {
  return capabilityRegistry().externalTransfer(id)
}

export function getMetadataSnapshotImportCapability(id: string): MetadataSnapshotImportCapability | undefined {
  return capabilityRegistry().snapshotImport(id)
}

function capabilityRegistry() {
  const registry = currentOperationRegistrySet<{
    readonly resourceCapabilities: {
      xmlPrepare(id: string): MetadataXmlPrepareCapability | undefined
      externalTransfer(id: string): MetadataExternalTransferCapability | undefined
      snapshotImport(id: string): MetadataSnapshotImportCapability | undefined
    }
  }>()
  if (registry === undefined) throw new Error("Не задан execution context resource capabilities")
  return registry.resourceCapabilities
}
