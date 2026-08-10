import type {
  ConfigurationImportResult,
  FullXmlSyncPlanResult,
  FullXmlSyncResult,
  ImportConfigurationFromXmlParams,
  MetadataOperationResult,
  MetadataDiagnostic,
  MetadataDiagnosticCollection,
  MetadataProjectDirectoryStructure,
  MetadataProjectStructureNode,
  ProjectStateService,
} from "@nkdk/rules"
import { metadataRuntimeHandle } from "./metadataRuntimeHandle"

export type { MetadataProjectDirectoryStructure, MetadataProjectStructureNode } from "@nkdk/rules"

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
      defaultLanguage: "ru"
      version: "2.20"
    }
    filePath: string
    projectDir: string
    mode: "externalRefs" | "inline"
  }): unknown
  exportJSONSchemaForSchemaName(params: {
    context: {
      defaultLanguage: "ru"
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
  }): Promise<FullXmlSyncPlanResult>
  syncConfigurationFromXML(params: {
    context: {
      defaultLanguage: "ru"
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
      defaultLanguage: "ru"
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
  }): Promise<FullXmlSyncResult>
  readXmlSyncState(xmlDir: string): Promise<XmlSyncState | undefined>
  initializeXmlSyncState(params: {
    yamlDir: string
    xmlDir: string
  }): Promise<XmlSyncState>
}

export interface CoreProjectStateService {
  beginImport(params: unknown): Promise<unknown>
  refreshAndValidate(params: unknown): Promise<unknown>
  createReadToken(projectDir: string): Promise<unknown>
  openReadSession(token: unknown): unknown
  readComponentProjection(params: unknown): Promise<unknown>
  reset(projectDir: string): Promise<void>
  rebuild(params: unknown): Promise<{
    diagnostics: CoreDiagnosticCollection
    stats: CoreProjectStateStats
    readToken: unknown
  }>
  close(): Promise<void>
}

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
  }
}

function requireRuntimeProjectState(state: CoreProjectStateService): ProjectStateService {
  if (!("workers" in state)) {
    throw new Error("ProjectStateService создан вне MetadataRuntime")
  }
  return state as ProjectStateService
}
