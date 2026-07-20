import { loadCoreApi } from "../coreApi"
import { errorMessage, toolError, toolSuccess, type ToolPayload } from "../contracts/common"
import { type SyncToXmlInput } from "../contracts/syncToXml"

interface CoreDiagnostic {
  severity: "error" | "warning"
  code: string
  message: string
}

interface CoreSyncResult {
  succeeded: number
  failed: readonly CoreDiagnostic[]
  warnings: readonly CoreDiagnostic[]
  configurationIndexPath?: string
}

type ConfigDumpInfo = Map<
  string,
  {
    children: Map<string, string>
    id: string
    configVersion: string
  }
>

interface SyncToXmlDeps {
  planSyncToXml?: (params: { yamlDir: string; xmlDir: string; baseId?: string }) => Promise<unknown>
  syncConfigurationToXML: (params: {
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
    yamlDir: string
    xmlDir: string
    baseId?: string
    concurrency?: number
  }) => Promise<CoreSyncResult>
}

export type SyncToXmlPayload = ToolPayload<{
  result?: unknown
  succeeded?: number
  configurationIndexPath?: string
  warnings?: Array<{ severity: "warning"; code: string; message: string }>
  failed?: Array<{ severity: "error"; code: string; message: string }>
}>

export async function syncToXml(input: SyncToXmlInput, deps?: SyncToXmlDeps): Promise<SyncToXmlPayload> {
  try {
    const core = deps ?? (await loadCoreApi())
    if (input.allowWrite !== true) {
      if (!core.planSyncToXml) return toolError("core_error", "План XML-синхронизации недоступен")
      const result = await core.planSyncToXml({
        yamlDir: input.yamlDir,
        xmlDir: input.xmlDir,
        ...(input.baseId === undefined ? {} : { baseId: input.baseId }),
      })
      return toolSuccess({ result })
    }

    const result = await core.syncConfigurationToXML({
      context: {
        defaultLanguage: "ru",
        version: "2.20",
        exportToYAML: { toTyped: false },
        exportToXML: {
          itemsTree: [],
          configDumpInfo: new Map<string, { children: Map<string, string>; id: string; configVersion: string }>(),
          version: "2.20",
          context: {
            forms: [],
            templates: [],
            parentName: "",
            metadataForNumbering: [],
          },
        },
      },
      yamlDir: input.yamlDir,
      xmlDir: input.xmlDir,
      ...(input.baseId === undefined ? {} : { baseId: input.baseId }),
      ...(input.concurrency === undefined ? {} : { concurrency: input.concurrency }),
    })

    return toolSuccess({
      succeeded: result.succeeded,
      ...(result.configurationIndexPath === undefined ? {} : { configurationIndexPath: result.configurationIndexPath }),
      warnings: result.warnings.map(mapWarning),
      failed: result.failed.map(mapError),
    })
  } catch (caught) {
    return toolError("core_error", errorMessage(caught))
  }
}

function mapWarning(diagnostic: CoreDiagnostic): { severity: "warning"; code: string; message: string } {
  return { severity: "warning", code: diagnostic.code, message: diagnostic.message }
}

function mapError(diagnostic: CoreDiagnostic): { severity: "error"; code: string; message: string } {
  return { severity: "error", code: diagnostic.code, message: diagnostic.message }
}
