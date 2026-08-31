import type {
  ConfigurationImportResult,
  ConfigurationLanguages,
  FullXmlSyncPlanResult,
  FullXmlSyncResult,
  ImportConfigurationFromXmlParams,
  MetadataOperationResult,
  MetadataDiagnostic,
  MetadataDiagnosticCollection,
  MetadataProjectDirectoryStructure,
  MetadataProjectStructureNode,
  MetadataRuntimeProjectState,
  PendingPartialSyncState,
  PreparePartialSyncResult,
} from "@nkdk/runtime"
import { metadataRuntimeHandle } from "./metadataRuntimeHandle"

export type { MetadataProjectDirectoryStructure, MetadataProjectStructureNode } from "@nkdk/runtime"

export interface SchemaSummaryOptions {
  requiredOnly?: boolean
  search?: string
  exact?: boolean
  keyTerms?: string
}

export type Diagnostic = MetadataDiagnostic
export type CoreDiagnosticCollection = MetadataDiagnosticCollection

export interface XmlSyncState {
  version: 1
  files: Record<string, string>
}

export interface CoreApi {
  parseProjectPath(input: string, options?: { readonly allowRoot?: boolean }): string
  createProjectStateService(): CoreProjectStateService
  ProjectFileSchemaError: {
    new (message: string): Error
    prototype: Error
  }
  splitSearchTerms(query: string): string[]
  listSchemaSummaryKeys(schema: unknown, options?: SchemaSummaryOptions): string[]
  summarizeJSONSchema(schema: unknown, options?: SchemaSummaryOptions): unknown | undefined
  exportJSONSchemaForProjectFile(params: {
    context: {
      languages: ConfigurationLanguages
      version: "2.20"
    }
    filePath: string
    projectDir: string
    mode: "externalRefs" | "inline"
  }): unknown
  exportJSONSchemaForSchemaName(params: {
    context: {
      languages: ConfigurationLanguages
      version: "2.20"
    }
    name: string
    mode: "externalRefs" | "inline"
  }): unknown
  describeMetadataProjectDirectoryStructure(params: {
    projectDir: string
    directoryPath?: string
    depth?: number
  }): MetadataProjectDirectoryStructure
  validateProject(params: {
    projectDir: string
    projectState: CoreProjectStateService
    signal?: AbortSignal
  }): Promise<{ diagnostics: CoreDiagnosticCollection }>
  renameMetadataItem(params: {
    projectDir: string
    componentPath: string
    path: string
    newName: string
    allowWrite?: boolean
    ignoreValidationErrors?: boolean
    projectState: CoreProjectStateService
  }): Promise<MetadataOperationResult>
  findMetadataReferences(params: {
    projectDir: string
    componentPath: string
    path: string
    ignoreValidationErrors?: boolean
    projectState: CoreProjectStateService
  }): Promise<MetadataOperationResult>
  planSyncToXml(params: {
    projectDir: string
    componentPath: string
    xmlDir: string
    projectState: CoreProjectStateService
    ignoreValidationErrors?: boolean
    signal?: AbortSignal
  }): Promise<FullXmlSyncPlanResult>
  syncConfigurationFromXML(params: {
    context: {
      languages: ConfigurationLanguages
      version: "2.20"
      exportToYAML: { toTyped: false }
      fromXML: { forReference: false }
    }
    inputDir: string
    projectDir?: string
    outputDir: string
    externalFileTransfer?: "copy" | "move"
  }): Promise<ConfigurationImportResult>
  importConfigurationFromXml(
    params: Omit<ImportConfigurationFromXmlParams, "projectState"> & { projectState: CoreProjectStateService }
  ): Promise<ConfigurationImportResult>
  syncConfigurationToXML(params: {
    context: {
      languages: ConfigurationLanguages
      version: "2.20"
      exportToYAML: { toTyped: false }
      exportToXML: {
        itemsTree: []
        version: "2.20"
        context: {
          forms: []
          templates: []
          parentName: ""
          metadataForNumbering: []
        }
      }
    }
    projectDir: string
    componentPath: string
    xmlDir: string
    concurrency?: number
    projectState: CoreProjectStateService
    ignoreValidationErrors?: boolean
    signal?: AbortSignal
  }): Promise<FullXmlSyncResult>
  readXmlSyncState(xmlDir: string): Promise<XmlSyncState | undefined>
  initializeXmlSyncState(params: {
    yamlDir: string
    xmlDir: string
  }): Promise<XmlSyncState>
  preparePartialSync(params: {
    context: { languages: ConfigurationLanguages; version: "2.20" }
    projectDir: string
    componentPath: string
    concurrency?: number
    projectState: CoreProjectStateService
  }): Promise<PreparePartialSyncResult>
  readPendingPartialSync(projectDir: string, componentPath: string): Promise<PendingPartialSyncState | undefined>
  markPartialSyncTransferring: MetadataRuntimePartialSync["markTransferring"]
  markPartialSyncPreparedAfterRejection: MetadataRuntimePartialSync["markPreparedAfterRejection"]
  markPartialSyncApplied: MetadataRuntimePartialSync["markApplied"]
  finalizePartialSync: MetadataRuntimePartialSync["finalize"]
  forceClearPendingSync: MetadataRuntimePartialSync["forceClear"]
}

type MetadataRuntimePartialSync = Awaited<ReturnType<typeof metadataRuntimeHandle.get>>["sync"]["partial"]

export type CoreProjectStateService = MetadataRuntimeProjectState

export interface CoreProjectStateStats {
  readonly hashedFiles: number
  readonly parsedYamlFiles: number
  readonly changedFiles: number
  readonly deletedFiles: number
}

export async function loadCoreApi(): Promise<CoreApi> {
  const runtime = await metadataRuntimeHandle.get()
  return {
    parseProjectPath: runtime.projects.parsePath,
    createProjectStateService: runtime.projects.createState,
    ProjectFileSchemaError: runtime.schemas.ProjectFileSchemaError,
    splitSearchTerms: runtime.schemas.splitSearchTerms,
    listSchemaSummaryKeys: runtime.schemas.listSummaryKeys,
    summarizeJSONSchema: runtime.schemas.summarize,
    exportJSONSchemaForProjectFile: runtime.schemas.exportForProjectFile,
    exportJSONSchemaForSchemaName: runtime.schemas.exportByName,
    describeMetadataProjectDirectoryStructure: runtime.projects.describeStructure,
    validateProject: (params) => runtime.validation.validateProject({
      ...params,
      projectState: requireRuntimeProjectState(params.projectState),
    }),
    renameMetadataItem: (params) => runtime.metadata.rename({
      ...params,
      projectState: requireRuntimeProjectState(params.projectState),
    }),
    findMetadataReferences: (params) => runtime.metadata.findReferences({
      ...params,
      projectState: requireRuntimeProjectState(params.projectState),
    }),
    planSyncToXml: (params) => runtime.sync.planToXml({
      ...params,
      projectState: requireRuntimeProjectState(params.projectState),
    }),
    async syncConfigurationFromXML(params) {
      const { outputDir, projectDir, ...importParams } = params
      return runtime.import.configurationFromXml({
        ...importParams,
        projectDir: projectDir ?? outputDir,
        projectState: runtime.projects.createState(),
      })
    },
    importConfigurationFromXml: (params) => runtime.import.configurationFromXml({
      ...params,
      projectState: requireRuntimeProjectState(params.projectState),
    }),
    syncConfigurationToXML: (params) => runtime.sync.configurationToXml({
      ...params,
      projectState: requireRuntimeProjectState(params.projectState),
    }),
    readXmlSyncState: runtime.sync.readState,
    initializeXmlSyncState: runtime.sync.initializeState,
    preparePartialSync: (params) => runtime.sync.partial.prepare({
      ...params,
      projectState: requireRuntimeProjectState(params.projectState),
    }),
    readPendingPartialSync: runtime.sync.partial.readPending,
    markPartialSyncTransferring: runtime.sync.partial.markTransferring,
    markPartialSyncPreparedAfterRejection: runtime.sync.partial.markPreparedAfterRejection,
    markPartialSyncApplied: runtime.sync.partial.markApplied,
    finalizePartialSync: runtime.sync.partial.finalize,
    forceClearPendingSync: runtime.sync.partial.forceClear,
  }
}

function requireRuntimeProjectState(state: CoreProjectStateService): MetadataRuntimeProjectState {
  if (!("workers" in state)) {
    throw new Error("ProjectStateService создан вне MetadataRuntime")
  }
  return state as MetadataRuntimeProjectState
}
