import type { ConfigurationContext, ConfigurationContextFromXML } from "./metadata/context/types"
import type { MetadataDiagnostic } from "./metadata/diagnostics/types"
import type { MetadataDiagnosticCollection } from "./metadata/diagnostics/collection"

export interface MetadataWorkerManifest {
  readonly preparedYamlProject: URL
  readonly importFromXml: URL
  readonly fullSyncToXml: URL
  readonly generic: URL
}

export interface MetadataProjectStructureNode {
  readonly name: string
  readonly kind: "directory" | "file"
  readonly pathTemplate: string
  readonly role: string
  readonly required: boolean
  readonly repeatable: boolean
  readonly description: string
  readonly children?: readonly MetadataProjectStructureNode[]
}

export interface MetadataProjectDirectoryStructure {
  readonly projectDir: string
  readonly directoryPath: string
  readonly depth: number | null
  readonly node: MetadataProjectStructureNode
}

export interface MetadataOperationReferenceChange {
  readonly filePath: string
  readonly yamlPath: readonly (string | number)[]
  readonly from: string
  readonly to: string
}

export interface MetadataOperationBlockedReference {
  readonly filePath: string
  readonly yamlPath: readonly (string | number)[]
  readonly value: string
}

export interface MetadataOperationDiagnostic extends MetadataDiagnostic {
  readonly code?: string
}

export interface MetadataOperationSuccess {
  readonly ok: true
  readonly mode: "plan" | "applied"
  readonly changedFiles: readonly string[]
  readonly rewrittenReferences: readonly MetadataOperationReferenceChange[]
  readonly blockedReferences: readonly []
  readonly diagnostics: readonly MetadataOperationDiagnostic[]
  readonly createdMigration?: { readonly from: string; readonly to: string; readonly fileName?: string }
}

export interface MetadataOperationFailure {
  readonly ok: false
  readonly code: string
  readonly message: string
  readonly changedFiles?: readonly string[]
  readonly rewrittenReferences?: readonly MetadataOperationReferenceChange[]
  readonly blockedReferences?: readonly MetadataOperationBlockedReference[]
  readonly diagnostics: readonly MetadataOperationDiagnostic[]
  readonly failedStep?: string
  readonly appliedFiles?: readonly string[]
  readonly pendingFiles?: readonly string[]
}

export type MetadataOperationResult = MetadataOperationSuccess | MetadataOperationFailure

export interface MetadataImportDiagnostic {
  readonly severity: "error" | "warning"
  readonly code: string
  readonly message: string
  readonly targetProjectPath: string
  readonly sourcePath?: string
  readonly value?: string
}

export interface MetadataSyncDiagnostic {
  readonly severity: "error" | "warning"
  readonly code: string
  readonly message: string
  readonly source?: string
  readonly assignmentId?: string
  readonly sourceProjectPath?: string
  readonly sourcePath?: string
  readonly targetXmlPath?: string
  readonly line?: number
  readonly col?: number
}

export interface ConfigurationImportResult {
  readonly componentPath?: string
  readonly succeeded: number
  readonly failed: readonly MetadataImportDiagnostic[]
  readonly warnings: readonly MetadataImportDiagnostic[]
  readonly configurationIndexPath?: string
}

export interface FullXmlSyncResult {
  readonly succeeded: number
  readonly failed: readonly MetadataSyncDiagnostic[]
  readonly warnings: readonly MetadataSyncDiagnostic[]
  readonly configurationIndexPath?: string
  readonly diagnostics: readonly MetadataSyncDiagnostic[]
}

export type FullXmlSyncPlanResult =
  | {
      readonly ok: true
      readonly mode: "plan"
      readonly assignments: number
      readonly externalFiles: number
      readonly configurationIndexPath: string
      readonly diagnostics: readonly MetadataSyncDiagnostic[]
    }
  | {
      readonly ok: false
      readonly failed: readonly MetadataSyncDiagnostic[]
      readonly diagnostics: readonly MetadataSyncDiagnostic[]
    }

export interface MetadataRuntimeProjectState {
  beginImport(params: unknown): Promise<unknown>
  refreshAndValidate(params: unknown): Promise<unknown>
  createReadToken(projectDir: string): Promise<unknown>
  openReadSession(token: unknown): unknown
  readComponentProjection(params: unknown): Promise<unknown>
  reset(projectDir: string): Promise<void>
  rebuild(params: unknown): Promise<{
    readonly diagnostics: MetadataDiagnosticCollection
    readonly stats: {
      readonly hashedFiles: number
      readonly parsedYamlFiles: number
      readonly changedFiles: number
      readonly deletedFiles: number
    }
    readonly readToken: unknown
  }>
  close(): Promise<void>
}

export interface ImportConfigurationFromXmlParams {
  readonly context: ConfigurationContextFromXML
  readonly inputDir: string
  readonly projectDir: string
  readonly requestedComponentPath?: string
  readonly concurrency?: number
  readonly copyExternalConcurrency?: number
  readonly externalFileTransfer?: "copy" | "move"
  readonly hashConcurrency?: number
  readonly operationId?: string
  readonly projectState: MetadataRuntimeProjectState
}

export interface MetadataRuntime {
  readonly projects: {
    createState(): MetadataRuntimeProjectState
    parsePath(input: string, options?: { readonly allowRoot?: boolean }): string
    describeStructure(params: {
      readonly projectDir: string
      readonly directoryPath?: string
      readonly depth?: number
    }): MetadataProjectDirectoryStructure
  }
  readonly schemas: {
    readonly ProjectFileSchemaError: { new(message: string): Error; readonly prototype: Error }
    splitSearchTerms(query: string): string[]
    listSummaryKeys(schema: unknown, options?: Record<string, unknown>): string[]
    summarize(schema: unknown, options?: Record<string, unknown>): unknown | undefined
    exportForProjectFile(params: Record<string, unknown>): unknown
    exportByName(params: Record<string, unknown>): unknown
  }
  readonly validation: {
    validateProject(params: {
      readonly projectDir: string
      readonly projectState: MetadataRuntimeProjectState
    }): Promise<{ readonly diagnostics: MetadataDiagnosticCollection }>
  }
  readonly import: {
    configurationFromXml(params: ImportConfigurationFromXmlParams): Promise<ConfigurationImportResult>
  }
  readonly sync: {
    planToXml(params: {
      readonly projectDir: string
      readonly componentPath: string
      readonly xmlDir: string
      readonly projectState: MetadataRuntimeProjectState
      readonly ignoreValidationErrors?: boolean
    }): Promise<FullXmlSyncPlanResult>
    configurationToXml(params: {
      readonly context: ConfigurationContext
      readonly projectDir: string
      readonly componentPath: string
      readonly xmlDir: string
      readonly concurrency?: number
      readonly projectState: MetadataRuntimeProjectState
      readonly ignoreValidationErrors?: boolean
    }): Promise<FullXmlSyncResult>
    readState(xmlDir: string): Promise<{ readonly version: 1; readonly files: Record<string, string> } | undefined>
    initializeState(params: { readonly yamlDir: string; readonly xmlDir: string }): Promise<{
      readonly version: 1
      readonly files: Record<string, string>
    }>
  }
  readonly metadata: {
    rename(params: {
      readonly projectDir: string
      readonly componentPath: string
      readonly path: string
      readonly newName: string
      readonly allowWrite?: boolean
      readonly ignoreValidationErrors?: boolean
      readonly projectState: MetadataRuntimeProjectState
    }): Promise<MetadataOperationResult>
    findReferences(params: {
      readonly projectDir: string
      readonly componentPath: string
      readonly path: string
      readonly ignoreValidationErrors?: boolean
      readonly projectState: MetadataRuntimeProjectState
    }): Promise<MetadataOperationResult>
  }
  close(): Promise<void>
}

export interface MetadataRuntimeFactoryOptions {
  readonly workers: MetadataWorkerManifest
}

export interface MetadataRuntimeRules {
  createRuntime(options: MetadataRuntimeFactoryOptions): MetadataRuntime
}

export function createMetadataRuntime(options: {
  readonly rules: MetadataRuntimeRules
  readonly workers: MetadataWorkerManifest
}): MetadataRuntime {
  return options.rules.createRuntime({ workers: options.workers })
}
