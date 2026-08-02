import type {
  ConfigurationImportResult,
  FullXmlSyncPlanResult,
  FullXmlSyncResult,
  ImportConfigurationFromXmlParams,
  MetadataOperationResult,
  MetadataProjectDirectoryStructure,
  MetadataProjectStructureNode,
} from "@nkdk/core"

export type { MetadataProjectDirectoryStructure, MetadataProjectStructureNode } from "@nkdk/core"

export interface SchemaSummaryOptions {
  requiredOnly?: boolean
  search?: string
  exact?: boolean
  keyTerms?: string
}

export interface Diagnostic {
  filePath: string
  line: number
  col: number
  severity: "error" | "warning"
  message: string
  path?: string
}

export interface XmlSyncState {
  version: 1
  files: Record<string, string>
}

export interface CoreApi {
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
  createValidationWorkerPoolHandle(params?: { concurrency?: number }): {
    validateProject(params: { projectDir: string }): Promise<{ diagnostics: Diagnostic[] }>
    close(): Promise<void>
    size(): number
  }
  validateProject(params: { projectDir: string }): Promise<{ diagnostics: Diagnostic[] }>
  renameMetadataItem(params: {
    projectDir: string
    path: string
    newName: string
    allowWrite?: boolean
  }): Promise<MetadataOperationResult>
  findMetadataReferences(params: {
    projectDir: string
    path: string
    allowWrite?: boolean
  }): Promise<MetadataOperationResult>
  planSyncToXml(params: {
    projectDir: string
    componentPath: string
    xmlDir: string
    projectState: CoreProjectStateService
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
  importConfigurationFromXml(params: ImportConfigurationFromXmlParams): Promise<ConfigurationImportResult>
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
  }): Promise<FullXmlSyncResult>
  readXmlSyncState(xmlDir: string): Promise<XmlSyncState | undefined>
  initializeXmlSyncState(params: {
    yamlDir: string
    xmlDir: string
  }): Promise<XmlSyncState>
}

export interface CoreProjectStateService {
  refreshAndValidate(params: unknown): Promise<unknown>
  createReadToken(projectDir: string): Promise<unknown>
  openReadSession(token: unknown): unknown
  readComponentProjection(params: unknown): Promise<unknown>
  reset(projectDir: string): Promise<void>
  rebuild(params: unknown): Promise<unknown>
  close(): Promise<void>
}

export async function loadCoreApi(): Promise<CoreApi> {
  return await import("@nkdk/core") as CoreApi
}
