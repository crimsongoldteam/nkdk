import type { ConfigurationContext } from "../context/types"
import type { SharedConfigurationIndexSnapshot } from "../configurationIndex/sharedSnapshot"
import type { ConfigurationIndexEntityRange } from "../configurationIndex/sharedSnapshot"
import type { FullXmlSyncSharedCompositionSnapshot } from "./sharedMetadataTypes"
import type { DeferredObjectValue } from "../ruleRuntime/property/deferredObjectValues"
import type { MetadataItemRule } from "../ruleRuntime/property/types"
import type { ConfigurationIndexCollector } from "../configurationIndex/collector/writer"
import type { YAMLToXMLProfile } from "../ruleRuntime/property/fromYAMLToXMLTypes"
import type { FullXmlSyncWorkerProfileRuntime } from "./componentProfile"
import type { ProjectStateReadToken } from "../projectState/contracts/readToken"
import type { MetadataXmlBaseInputDeclaration } from "../resourceTopology/core/types"
import type { MetadataWorkerBinaryResult } from "../workerPool/binaryResult"

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
  readonly baseFormPaths?: {
    readonly baseProjectPath: string
    readonly savedProjectPath?: string
  }
}

export interface FullXmlSyncExecutionAssignment extends FullXmlSyncAssignment {
  readonly configurationIndexEntityRange: ConfigurationIndexEntityRange
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

export interface FullXmlSyncGeneratedDocument {
  readonly assignmentId: string
  readonly declarationId: string
  readonly targetXmlPath: string
  readonly content: Uint8Array
}

export type FullXmlSyncOutputTarget =
  | { readonly kind: "directory"; readonly outputDir: string }
  | {
      readonly kind: "memory"
      readonly documentIdsByAssignment: Readonly<Record<string, readonly string[]>>
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
  readonly indexCollectors: readonly {
    readonly collector: ConfigurationIndexCollector
    readonly targetProjectPath: string
  }[]
  readonly profile: YAMLToXMLProfile
}

export type FullXmlSyncWorkerCommand =
  | {
      readonly kind: "initialize"
      readonly workerIndex: number
      readonly componentPath: string
      readonly componentDir: string
      readonly outputTarget: FullXmlSyncOutputTarget
      readonly context: ConfigurationContext
      readonly profile: FullXmlSyncWorkerProfileRuntime
      readonly composition: FullXmlSyncSharedCompositionSnapshot
      readonly targetIndex: SharedConfigurationIndexSnapshot
      readonly projectStateReadToken?: ProjectStateReadToken
    }
  | { readonly kind: "execute"; readonly assignments: readonly FullXmlSyncExecutionAssignment[] }
  | { readonly kind: "executeBatch"; readonly assignments: readonly FullXmlSyncExecutionAssignment[] }
  | { readonly kind: "finishExecution" }
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
  readonly generatedDocuments: readonly FullXmlSyncGeneratedDocument[]
  readonly fragmentBuffer: ArrayBuffer
}

export type FullXmlSyncWorkerCommandResult = FullXmlSyncExecutionResult | MetadataWorkerBinaryResult | undefined
