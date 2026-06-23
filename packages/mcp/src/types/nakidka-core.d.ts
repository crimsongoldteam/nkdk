declare module "@nakidka/core" {
  export interface SchemaSummaryOptions {
    requiredOnly?: boolean
    search?: string
    exact?: boolean
    keyTerms?: string
  }

  export function splitSearchTerms(query: string): string[]

  export function listSchemaSummaryKeys(schema: unknown, options?: SchemaSummaryOptions): string[]

  export function summarizeJSONSchema(schema: unknown, options?: SchemaSummaryOptions): unknown | undefined

  export function exportJSONSchemaForProjectFile(params: {
    context: {
      defaultLanguage: "ru"
      version: "2.20"
    }
    filePath: string
    projectDir: string
    mode: "externalRefs" | "inline"
  }): unknown

  export function exportJSONSchemaForSchemaName(params: {
    context: {
      defaultLanguage: "ru"
      version: "2.20"
    }
    name: string
    mode: "externalRefs" | "inline"
  }): unknown

  export interface Diagnostic {
    filePath: string
    line: number
    col: number
    severity: "error" | "warning"
    message: string
  }

  export function validateProject(params: { projectDir: string; filePath?: string }): { diagnostics: Diagnostic[] }

  export class ProjectFileSchemaError extends Error {}

  export interface ConfigurationSyncFailure {
    kind: string
    name: string
    parent?: string
    error: unknown
  }

  export interface ConfigurationSyncResult {
    succeeded: number
    failed: ConfigurationSyncFailure[]
  }

  export function syncConfigurationFromXML(params: {
    context: {
      defaultLanguage: "ru"
      version: "2.20"
      exportToYAML: { toTyped: false }
      fromXML: { forReference: false }
    }
    inputDir: string
    outputDir: string
  }): Promise<ConfigurationSyncResult>

  type ConfigDumpInfo = Map<
    string,
    {
      children: Map<string, string>
      id: string
      configVersion: string
    }
  >

  export function syncConfigurationToXML(params: {
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
}
