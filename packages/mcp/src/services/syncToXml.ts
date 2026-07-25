import { loadCoreApi } from "../coreApi"
import { errorMessage, toolError, toolSuccess, type ToolPayload } from "../contracts/common"
import { type SyncToXmlInput } from "../contracts/syncToXml"
import { resolveComponent } from "./componentResolver"

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
  planSyncToXml?: (params: {
    projectDir: string
    yamlDir: string
    xmlDir: string
  }) => Promise<unknown>
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
    projectDir: string
    componentPath?: string
    yamlDir: string
    xmlDir: string
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
    if (isConfigurationExtensionPath(input.componentPath)) {
      return toolError(
        "invalid_arguments",
        "Синхронизация расширений конфигурации в XML пока не поддерживается",
        { componentPath: input.componentPath },
      )
    }
    const component = resolveComponent({
      projectDir: input.projectDir,
      componentPath: input.componentPath,
    })
    if (!component.ok) return component.error

    const core = deps ?? (await loadCoreApi())
    if (input.allowWrite !== true) {
      if (!core.planSyncToXml) return toolError("core_error", "План XML-синхронизации недоступен")
      const result = await core.planSyncToXml({
        projectDir: component.projectDir,
        yamlDir: component.componentDir,
        xmlDir: input.xmlDir,
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
      projectDir: component.projectDir,
      componentPath: component.componentPath,
      yamlDir: component.componentDir,
      xmlDir: input.xmlDir,
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

function isConfigurationExtensionPath(componentPath: string | undefined): boolean {
  return componentPath === "cfe" || componentPath?.startsWith("cfe/") === true
}

function mapWarning(diagnostic: CoreDiagnostic): { severity: "warning"; code: string; message: string } {
  return { severity: "warning", code: diagnostic.code, message: diagnostic.message }
}

function mapError(diagnostic: CoreDiagnostic): { severity: "error"; code: string; message: string } {
  return { severity: "error", code: diagnostic.code, message: diagnostic.message }
}
