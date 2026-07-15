import type {
  MetadataOperationChangedXmlFile,
  MetadataOperationResult,
  MigrationChainInvalidResult,
  MigrationPlanItem,
} from "@nkdk/core"
import * as coreApi from "@nkdk/core"

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

export interface ConfigurationSyncFailure {
  kind: string
  name: string
  parent?: string
  error: unknown
}

export interface ConfigurationSyncResult {
  succeeded: number
  changedXmlFiles?: MetadataOperationChangedXmlFile[]
  migrationsApplied?: MigrationPlanItem[]
  migrationChain?: MigrationChainInvalidResult
  failed: ConfigurationSyncFailure[]
}

export interface XmlSyncState {
  version: 1
  files: Record<string, string>
}

export interface MetadataProjectStructureNode {
  name: string
  kind: "directory" | "file"
  pathTemplate: string
  role: string
  required: boolean
  repeatable: boolean
  description: string
  children?: MetadataProjectStructureNode[]
}

export interface MetadataProjectDirectoryStructure extends Record<string, unknown> {
  projectDir: string
  directoryPath: string
  depth: number | null
  node: MetadataProjectStructureNode
}

type ConfigDumpInfo = Map<
  string,
  {
    children: Map<string, string>
    id: string
    configVersion: string
  }
>

export interface CoreApi {
  ProjectFileSchemaError: typeof Error
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
    validateProject(params: { projectDir: string; filePath?: string }): Promise<{ diagnostics: Diagnostic[] }>
    close(): Promise<void>
    size(): number
  }
  validateProject(params: { projectDir: string; filePath?: string }): Promise<{ diagnostics: Diagnostic[] }>
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
  planSyncToXml(params: { inputDir: string; outputDir: string; referenceDir?: string }): Promise<
    | { ok: true; mode: "plan"; migrationsToApply: MigrationPlanItem[] }
    | MigrationChainInvalidResult
  >
  syncConfigurationFromXML(params: {
    context: {
      defaultLanguage: "ru"
      version: "2.20"
      exportToYAML: { toTyped: false }
      fromXML: { forReference: false }
    }
    inputDir: string
    outputDir: string
  }): Promise<ConfigurationSyncResult>
  syncConfigurationToXML(params: {
    context: {
      defaultLanguage: "ru"
      version: "2.20"
      exportToYAML: { toTyped: false }
      exportToXML: {
        itemsTree: []
        configDumpInfo: ConfigDumpInfo
        version: "2.20"
        context: {
          forms: []
          templates: []
          parentName: ""
          metadataForNumbering: []
        }
      }
    }
    inputDir: string
    outputDir: string
    referenceDir?: string
  }): Promise<ConfigurationSyncResult>
  syncConfigurationIncrementallyToXML(params: {
    context: {
      defaultLanguage: "ru"
      version: "2.20"
      exportToYAML: { toTyped: false }
      exportToXML: {
        itemsTree: []
        configDumpInfo: ConfigDumpInfo
        version: "2.20"
        context: {
          forms: []
          templates: []
          parentName: ""
          metadataForNumbering: []
        }
      }
    }
    inputDir: string
    outputDir: string
    referenceDir?: string
  }): Promise<ConfigurationSyncResult>
  readXmlSyncState(xmlDir: string): Promise<XmlSyncState | undefined>
  initializeXmlSyncState(params: {
    yamlDir: string
    xmlDir: string
  }): Promise<void>
}

export function loadCoreApi(): Promise<CoreApi> {
  return Promise.resolve(coreApi as CoreApi)
}
