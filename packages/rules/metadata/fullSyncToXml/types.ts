import type { ConfigurationContext } from "@nkdk/runtime"
import type { ConfigurationIndexStoreDescriptor } from "@nkdk/runtime"
import type { FullXmlSyncSharedCompositionSnapshot } from "./sharedMetadataTypes"
import type { DeferredObjectValue } from "@nkdk/runtime/rule-kit"
import type { MetadataItemRule } from "@nkdk/runtime/rule-kit"
import type { ConfigurationIndexCollector } from "@nkdk/runtime"
import type { YAMLToXMLProfile } from "@nkdk/runtime/rule-kit"
import type { FullXmlSyncWorkerProfileRuntime } from "./componentProfile"
import type { ProjectStateReadToken } from "../projectState/contracts/readToken"
import type { MetadataXmlBaseInputDeclaration } from "@nkdk/runtime/rule-kit"
import type { MetadataWorkerBinaryResult } from "../workerPool/binaryResult"
import type { XmlRawMergeBoundary } from "@nkdk/runtime"
import type { PreparedYamlFile } from "../project/preparedYamlProject"

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
  readonly configurationIndexSources: {
    readonly targetProjectPaths: readonly string[]
    readonly baseProjectPaths: readonly string[]
  }
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

export interface PreparedXmlAnomalyBoundary extends XmlRawMergeBoundary {
  readonly tag?: string
  /** Пустая строка выбирает основной документ, непустая — дополнительный по краткому имени. */
  readonly documentSelector?: string
  /** Отдельный XML-файл свойства, к которому относится граница. */
  readonly documentPath?: string
  /** Поправка заменяет или дополняет корень отдельного XML-документа. */
  readonly documentRootName?: string
  /** Привязка относительного raw-пути к фактически экспортированному item коллекции. */
  readonly exportClaimId?: string
}

export interface PreparedXMLDocument {
  readonly declarationId?: string
  readonly targetXmlPath: string
  readonly xml: Record<string, unknown>
  readonly deferred: readonly DeferredObjectValue[]
  readonly rootRule: MetadataItemRule
  readonly rawBoundaries: readonly PreparedXmlAnomalyBoundary[]
}

export interface PreparedXMLAssignment {
  readonly assignment: FullXmlSyncAssignment
  /** Смысловой YAML, фактически переданный обычным правилам экспорта. */
  readonly semanticYamlFile: PreparedYamlFile
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
      readonly targetIndex: ConfigurationIndexStoreDescriptor
      readonly baseIndex?: ConfigurationIndexStoreDescriptor
      readonly operationSeed: Uint8Array
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
