import type { ObjectFieldIndex } from "../validation/dataPath/objectFields"
import type { ValidationOwnerFacts } from "../validation/dataPath/ownerFacts"
import type { ConfigurationProjectFile } from "../configurationIndex/types"
import type { ConfigurationContext } from "../context/types"
import type { SharedConfigurationIndexSnapshot } from "../configurationIndex/sharedSnapshot"
import type { FullXmlSyncSharedMetadata } from "./sharedMetadata"

export interface FullXmlSyncOutput {
  readonly targetXmlPath: string
  readonly routeKind: "owner" | "fileItem"
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
  readonly outputs: readonly FullXmlSyncOutput[]
}

export interface FullXmlSyncExternalFile {
  readonly sourceProjectPath: string
  readonly sourcePath: string
  readonly targetXmlPath: string
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

export type FullXmlSyncWorkerCommand =
  | {
      readonly kind: "initialize"
      readonly workerIndex: number
      readonly projectDir: string
      readonly outputDir: string
      readonly context: ConfigurationContext
    }
  | { readonly kind: "firstPass"; readonly assignments: readonly FullXmlSyncAssignment[] }
  | {
      readonly kind: "secondPass"
      readonly sharedMetadata: FullXmlSyncSharedMetadata
      readonly index: SharedConfigurationIndexSnapshot
      readonly generationSeed: Uint8Array
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
