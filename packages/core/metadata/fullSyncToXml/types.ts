import type { ObjectFieldIndex } from "../validation/dataPath/objectFields"
import type { ValidationOwnerFacts } from "../validation/dataPath/ownerFacts"
import type { ConfigurationProjectFile } from "../configurationIndex/types"
import type { ConfigurationContext } from "../context/types"
import type { SharedConfigurationIndexSnapshot } from "../configurationIndex/sharedSnapshot"
import type { FullXmlSyncSharedCompositionSnapshot, FullXmlSyncSharedMetadata } from "./sharedMetadata"
import type { DeferredObjectValue } from "../orchestration/property/deferredObjectValues"
import type { MetadataItemRule } from "../orchestration/property/types"
import type { ConfigurationIndexCollector } from "../configurationIndex/collector/writer"
import type { YAMLToXMLProfile } from "../orchestration/property/fromYAMLToXMLTypes"

export interface FullXmlSyncOutput {
  readonly targetXmlPath: string
  readonly routeKind: "owner" | "fileItem"
}

export interface FullXmlSyncPotentialOutput {
  readonly declarationId: string
  readonly targetXmlPath: string
  readonly role: "metadata" | "body" | "property"
  readonly required: boolean
  readonly prepareCapabilityId: string
}

export interface FullXmlSyncAssignment {
  readonly id: string
  readonly sourceProjectPath: string
  readonly sourcePath: string
  readonly role: "configuration" | "properties" | "form"
  readonly itemType: string
  readonly itemName: string
  readonly logicalAddress: string
  readonly owner?: { readonly itemType: string; readonly name: string; readonly logicalAddress: string }
  readonly nodeId?: string
  readonly potentialOutputs?: readonly FullXmlSyncPotentialOutput[]
  readonly outputs: readonly FullXmlSyncOutput[]
}

export interface FullXmlSyncExternalFile {
  readonly assignmentId?: string
  readonly sourceProjectPath: string
  readonly sourcePath: string
  readonly targetXmlPath: string
  readonly transferCapabilityId?: string
}

export interface FullXmlSyncPlan {
  readonly assignments: readonly FullXmlSyncAssignment[]
  readonly externalFiles: readonly FullXmlSyncExternalFile[]
}

export interface FullXmlSyncOwnerFacts {
  readonly assignmentId: string
  readonly sourceProjectPath: string
  readonly sourcePath: string
  readonly role: FullXmlSyncAssignment["role"]
  readonly owner: { readonly dir: string; readonly name: string }
  readonly itemType: string
  readonly ownerFacts?: ValidationOwnerFacts
  readonly fieldIndex?: ObjectFieldIndex
}

export interface FullXmlSyncDiagnostic {
  readonly severity: "error" | "warning"
  readonly code: string
  readonly message: string
  readonly assignmentId?: string
  readonly sourceProjectPath?: string
  readonly sourcePath?: string
  readonly targetXmlPath?: string
  readonly line?: number
  readonly col?: number
}

export interface FullXmlSyncWrittenFile {
  readonly assignmentId: string
  readonly targetXmlPath: string
}

export interface PreparedXMLDocument {
  readonly declarationId?: string
  readonly targetXmlPath: string
  readonly xml: Record<string, unknown>
  readonly deferred: readonly DeferredObjectValue[]
  readonly rootRule: MetadataItemRule
}

export interface PreparedXMLAssignment {
  readonly assignment: FullXmlSyncAssignment
  readonly documents: readonly PreparedXMLDocument[]
  readonly indexCollector: ConfigurationIndexCollector
  readonly profile: YAMLToXMLProfile
}

export type FullXmlSyncWorkerCommand =
  | {
      readonly kind: "initialize"
      readonly workerIndex: number
      readonly projectDir: string
      readonly outputDir: string
      readonly context: ConfigurationContext
      readonly composition: FullXmlSyncSharedCompositionSnapshot
      readonly index: SharedConfigurationIndexSnapshot
    }
  | { readonly kind: "firstPass"; readonly assignments: readonly FullXmlSyncAssignment[] }
  | {
      readonly kind: "secondPass"
      readonly sharedMetadata: FullXmlSyncSharedMetadata
    }
  | { readonly kind: "dispose" }

export interface FullXmlSyncFirstPassResult {
  readonly kind: "firstPassResult"
  readonly diagnostics: readonly FullXmlSyncDiagnostic[]
  readonly projectFiles: readonly ConfigurationProjectFile[]
  readonly ownerFacts: readonly FullXmlSyncOwnerFacts[]
}

export interface FullXmlSyncSecondPassResult {
  readonly kind: "secondPassResult"
  readonly diagnostics: readonly FullXmlSyncDiagnostic[]
  readonly warnings: readonly FullXmlSyncDiagnostic[]
  readonly writtenFiles: readonly FullXmlSyncWrittenFile[]
  readonly fragmentBuffer: ArrayBuffer
}

export type FullXmlSyncWorkerCommandResult = FullXmlSyncFirstPassResult | FullXmlSyncSecondPassResult | undefined
