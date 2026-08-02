import { loadCoreApi, type CoreApi, type CoreProjectStateService } from "../coreApi"
import { errorMessage, toolError, toolSuccess, type ToolPayload } from "../contracts/common"
import { type SyncToXmlInput } from "../contracts/syncToXml"
import { resolveComponent } from "./componentResolver"
import { projectStateHandle } from "./projectStateHandle"

interface SyncToXmlDeps {
  readonly projectState?: CoreProjectStateService
  readonly planSyncToXml?: CoreApi["planSyncToXml"]
  readonly syncConfigurationToXML: CoreApi["syncConfigurationToXML"]
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
    if (input.componentPath === "cfe") {
      return toolError("invalid_arguments", "Ожидался путь cfe/<Имя>", {
        componentPath: input.componentPath,
      })
    }
    const component = resolveComponent({
      projectDir: input.projectDir,
      componentPath: input.componentPath,
    })
    if (!component.ok) return component.error

    const loadedCore = deps === undefined ? await loadCoreApi() : undefined
    const core = deps ?? loadedCore!
    const projectState = deps?.projectState ?? await projectStateHandle.get()
    if (input.allowWrite !== true) {
      if (!core.planSyncToXml) return toolError("core_error", "План XML-синхронизации недоступен")
      const planParams = {
        projectDir: component.projectDir,
        componentPath: component.componentPath,
        xmlDir: input.xmlDir,
        ...(input.ignoreValidationErrors === undefined ? {} : { ignoreValidationErrors: input.ignoreValidationErrors }),
      }
      const result = await core.planSyncToXml({ ...planParams, projectState })
      return toolSuccess({ result })
    }

    const syncParams: Parameters<CoreApi["syncConfigurationToXML"]>[0] = {
      context: {
        defaultLanguage: "ru",
        version: "2.20",
        exportToYAML: { toTyped: false },
        exportToXML: {
          itemsTree: [],
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
      xmlDir: input.xmlDir,
      ...(input.concurrency === undefined ? {} : { concurrency: input.concurrency }),
      ...(input.ignoreValidationErrors === undefined ? {} : { ignoreValidationErrors: input.ignoreValidationErrors }),
      projectState,
    }
    const result = await core.syncConfigurationToXML(syncParams)

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

function mapWarning(diagnostic: { code: string; message: string }): { severity: "warning"; code: string; message: string } {
  return { severity: "warning", code: diagnostic.code, message: diagnostic.message }
}

function mapError(diagnostic: { code: string; message: string }): { severity: "error"; code: string; message: string } {
  return { severity: "error", code: diagnostic.code, message: diagnostic.message }
}
