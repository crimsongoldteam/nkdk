import { loadCoreApi, type CoreApi, type CoreProjectStateService } from "../coreApi"
import { errorMessage, toolError, toolSuccess, type ToolPayload } from "../contracts/common"
import { type SyncToXmlInput } from "../contracts/syncToXml"
import { resolveComponent } from "./componentResolver"

type OptionalProjectState<T extends { projectState: CoreProjectStateService }> =
  Omit<T, "projectState"> & { projectState?: CoreProjectStateService }

interface SyncToXmlDeps {
  readonly createProjectStateService?: CoreApi["createProjectStateService"]
  readonly planSyncToXml?: (
    params: OptionalProjectState<Parameters<CoreApi["planSyncToXml"]>[0]>,
  ) => ReturnType<CoreApi["planSyncToXml"]>
  readonly syncConfigurationToXML: (
    params: OptionalProjectState<Parameters<CoreApi["syncConfigurationToXML"]>[0]>,
  ) => ReturnType<CoreApi["syncConfigurationToXML"]>
}

export type SyncToXmlPayload = ToolPayload<{
  result?: unknown
  succeeded?: number
  configurationIndexPath?: string
  warnings?: Array<{ severity: "warning"; code: string; message: string }>
  failed?: Array<{ severity: "error"; code: string; message: string }>
}>

export async function syncToXml(input: SyncToXmlInput, deps?: SyncToXmlDeps): Promise<SyncToXmlPayload> {
  let ownedProjectState: CoreProjectStateService | undefined
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
    const createProjectState = loadedCore?.createProjectStateService ?? deps?.createProjectStateService
    ownedProjectState = createProjectState?.()
    const projectState = ownedProjectState
    if (input.allowWrite !== true) {
      if (!core.planSyncToXml) return toolError("core_error", "План XML-синхронизации недоступен")
      const planParams = {
        projectDir: component.projectDir,
        componentPath: component.componentPath,
        xmlDir: input.xmlDir,
      }
      const result = loadedCore === undefined
        ? await deps!.planSyncToXml!({ ...planParams, ...(projectState === undefined ? {} : { projectState }) })
        : await loadedCore.planSyncToXml({ ...planParams, projectState: projectState! })
      return toolSuccess({ result })
    }

    const syncParams: Parameters<SyncToXmlDeps["syncConfigurationToXML"]>[0] = {
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
    }
    const result = loadedCore === undefined
      ? await deps!.syncConfigurationToXML({ ...syncParams, ...(projectState === undefined ? {} : { projectState }) })
      : await loadedCore.syncConfigurationToXML({ ...syncParams, projectState: projectState! })

    return toolSuccess({
      succeeded: result.succeeded,
      ...(result.configurationIndexPath === undefined ? {} : { configurationIndexPath: result.configurationIndexPath }),
      warnings: result.warnings.map(mapWarning),
      failed: result.failed.map(mapError),
    })
  } catch (caught) {
    return toolError("core_error", errorMessage(caught))
  } finally {
    await ownedProjectState?.close().catch(() => undefined)
  }
}

function mapWarning(diagnostic: { code: string; message: string }): { severity: "warning"; code: string; message: string } {
  return { severity: "warning", code: diagnostic.code, message: diagnostic.message }
}

function mapError(diagnostic: { code: string; message: string }): { severity: "error"; code: string; message: string } {
  return { severity: "error", code: diagnostic.code, message: diagnostic.message }
}
