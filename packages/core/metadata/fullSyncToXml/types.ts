import type { ConfigurationContext } from "../context/types"
import type { SharedConfigurationIndexSnapshot } from "../configurationIndex/sharedSnapshot"
import type { FullXmlSyncSharedCompositionSnapshot } from "./sharedMetadata"
import type { DeferredObjectValue } from "../orchestration/property/deferredObjectValues"
import type { MetadataItemRule } from "../orchestration/property/types"
import type { ConfigurationIndexCollector } from "../configurationIndex/collector/writer"
import type { YAMLToXMLProfile } from "../orchestration/property/fromYAMLToXMLTypes"
import type { FullXmlSyncWorkerProfileRuntime } from "./componentProfile"
import type { ProjectStateReadToken } from "../projectState"
import type { MetadataXmlBaseInputDeclaration } from "../resourceTopology/types"

export interface FullXmlSyncPotentialOutput {
  readonly declarationId: string
  readonly targetXmlPath: string
  readonly role: "metadata" | "body" | "property"
  readonly required: boolean
  readonly prepareCapabilityId: string
  readonly propertyName?: string
  readonly baseInput?: MetadataXmlBaseInputDeclaration
}

export interface FullXmlSyncAssignment {
  readonly id: string
  readonly sourceProjectPath: string
  readonly sourcePath: string
  readonly expectedContentHash: bigint
  readonly role: "configuration" | "properties" | "form"
  readonly itemType: string
  readonly itemName: string
  readonly logicalAddress: string
  readonly owner?: { readonly itemType: string; readonly name: string; readonly logicalAddress: string }
  readonly nodeId: string
  readonly potentialOutputs: readonly FullXmlSyncPotentialOutput[]
}

export interface FullXmlSyncExternalFile {
  readonly assignmentId?: string
  readonly sourceProjectPath: string
  readonly sourcePath: string
  readonly expectedContentHash: bigint
  readonly targetXmlPath: string
  readonly transferCapabilityId?: string
}

export interface FullXmlSyncPlan {
  readonly assignments: readonly FullXmlSyncAssignment[]
  readonly externalFiles: readonly FullXmlSyncExternalFile[]
}

export interface FullXmlSyncDiagnostic {
  readonly severity: "error" | "warning"
  readonly code: string
  readonly source?: string
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
      readonly componentPath: string
      readonly componentDir: string
      readonly outputDir: string
      readonly context: ConfigurationContext
      readonly profile: FullXmlSyncWorkerProfileRuntime
      readonly composition: FullXmlSyncSharedCompositionSnapshot
      readonly targetIndex: SharedConfigurationIndexSnapshot
      readonly projectStateReadToken: ProjectStateReadToken
    }
  | { readonly kind: "execute"; readonly assignments: readonly FullXmlSyncAssignment[] }
  | { readonly kind: "dispose" }

export interface FullXmlSyncExpectedOutput {
  readonly assignmentId: string
  readonly targetXmlPath: string
}

export interface FullXmlSyncCopiedFile {
  readonly assignmentId?: string
  readonly sourceProjectPath: string
  readonly targetXmlPath: string
}

export interface FullXmlSyncExecutionResult {
  readonly kind: "executionResult"
  readonly diagnostics: readonly FullXmlSyncDiagnostic[]
  readonly warnings: readonly FullXmlSyncDiagnostic[]
  readonly writtenFiles: readonly FullXmlSyncWrittenFile[]
  readonly expectedOutputs: readonly FullXmlSyncExpectedOutput[]
  readonly fragmentBuffer: ArrayBuffer
}

export type FullXmlSyncWorkerCommandResult = FullXmlSyncExecutionResult | undefined
