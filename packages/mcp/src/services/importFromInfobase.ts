import { randomUUID } from "node:crypto"
import { join } from "node:path"
import { pathToFileURL } from "node:url"
import {
  PlatformSessionError,
  readProjectSettings,
  type PlatformSessionManager,
  type PlatformSessionMode,
} from "@nkdk/platform"
import { loadCoreApi, type CoreApi } from "../coreApi"
import { toolError, toolSuccess, type ToolPayload } from "../contracts/common"
import type { ImportFromInfobaseInput } from "../contracts/importFromInfobase"
import { assertImportTargetEmpty, resolveComponent } from "./componentResolver"
import { getPlatformSessionManager } from "./platformSessionHandle"
import { projectSettingsFailure } from "./projectSettingsFailure"
import { temporaryDirectoryFileSystem } from "./temporaryDirectory"
import { defaultMcpConfigurationLanguages } from "../configurationContext"

type CoreImportDiagnostic = {
  severity: "error" | "warning"
  code: string
  message: string
  targetProjectPath: string
}

export interface ImportFromInfobaseDependencies {
  platformManager: Pick<PlatformSessionManager, "exportConfiguration">
  importXml: CoreApi["syncConfigurationFromXML"]
  readSettings: typeof readProjectSettings
  resolveTarget: typeof resolveComponent
  assertTargetEmpty: typeof assertImportTargetEmpty
  fs: {
    mkdir(path: string): Promise<void>
    rm(path: string): Promise<void>
  }
  operationId(): string
}

export type ImportFromInfobasePayload = ToolPayload<{
  succeeded: number
  failed: Array<{ severity: "error"; code: string; message: string; targetProjectPath?: string }>
  warnings: Array<{ code: string; message: string; targetProjectPath?: string }>
  configurationIndexPath?: string
  settingsPath?: string
  mode: PlatformSessionMode
  reusedConnection: boolean
  temporaryDirectory?: string
}>

export async function importFromInfobase(
  input: ImportFromInfobaseInput,
  providedDependencies?: ImportFromInfobaseDependencies,
  signal?: AbortSignal
): Promise<ImportFromInfobasePayload> {
  if (input.allowWrite !== true) {
    return toolError(
      "confirmation_required",
      "import_from_infobase запускает 1С и пишет YAML-файлы; повторите вызов с allowWrite=true",
      { projectDir: input.projectDir, componentPath: input.componentPath ?? "cf" }
    )
  }

  const dependencies = providedDependencies ?? defaultDependencies()
  let temporaryDirectory: string | undefined
  try {
    const settingsRead = await dependencies.readSettings(input.projectDir)
    if (settingsRead.status !== "ready") return projectSettingsFailure(settingsRead)!

    const requestedComponentPath = input.componentPath ?? "cf"
    const component = dependencies.resolveTarget({
      projectDir: settingsRead.projectDir,
      componentPath: requestedComponentPath,
      createIfMissing: true,
    })
    if (!component.ok) return component.error
    const extensionName = component.componentPath === "cf"
      ? undefined
      : component.componentPath.slice("cfe/".length)
    const targetError = dependencies.assertTargetEmpty(component.componentDir)
    if (targetError !== undefined) return targetError

    temporaryDirectory = join(
      component.projectDir,
      ".nkdk",
      "tmp",
      "import-from-infobase",
      dependencies.operationId()
    )
    const xmlDirectory = join(temporaryDirectory, "xml")
    await dependencies.fs.mkdir(xmlDirectory)
    throwIfCancelled(signal)
    const { operations, ...connectionSettings } = settingsRead.settings.infobase
    const connection = await dependencies.platformManager.exportConfiguration({
      projectDir: settingsRead.projectDir,
      outputDir: xmlDirectory,
      logPath: join(temporaryDirectory, "platform.log"),
      ...connectionSettings,
      mode: operations.import.mode,
      unresolvedReferences: operations.import.unresolvedReferences,
      ...(extensionName === undefined ? {} : { extensionName }),
      ...(signal === undefined ? {} : { signal }),
    })
    throwIfCancelled(signal)
    const result = await dependencies.importXml({
      context: {
        languages: defaultMcpConfigurationLanguages,
        version: "2.20",
        exportToYAML: { toTyped: false },
        fromXML: { forReference: false },
      },
      inputDir: xmlDirectory,
      projectDir: component.projectDir,
      outputDir: component.componentDir,
      externalFileTransfer: "move",
    })
    const payload = {
      succeeded: result.succeeded,
      failed: result.failed.map(mapFailure),
      warnings: result.warnings.map(mapWarning),
      ...(result.configurationIndexPath === undefined
        ? {}
        : { configurationIndexPath: result.configurationIndexPath }),
      settingsPath: settingsRead.settingsPath,
      mode: connection.mode,
      reusedConnection: connection.reusedConnection,
    }
    if (result.failed.length > 0) {
      return toolSuccess({ ...payload, temporaryDirectory })
    }

    await dependencies.fs.rm(temporaryDirectory)
    return toolSuccess(payload)
  } catch (caught) {
    if (caught instanceof PlatformSessionError) {
      return toolError(caught.code, caught.message, platformErrorDetails(caught, temporaryDirectory))
    }
    return toolError(
      "core_error",
      "Не удалось импортировать конфигурацию из информационной базы",
      temporaryDirectory === undefined ? undefined : { temporaryDirectory }
    )
  }
}

function platformErrorDetails(
  error: PlatformSessionError,
  temporaryDirectory?: string
): Record<string, unknown> | undefined {
  const details = error.details
  if (temporaryDirectory === undefined && details === undefined) return undefined
  return {
    ...(temporaryDirectory === undefined ? {} : { temporaryDirectory }),
    ...(details === undefined ? {} : {
      stage: details.stage,
      ...(details.mode === undefined ? {} : { mode: details.mode }),
      ...(details.logPath === undefined ? {} : {
        log: { uri: pathToFileURL(details.logPath).href, format: "text/plain" },
      }),
    }),
  }
}

function throwIfCancelled(signal?: AbortSignal): void {
  if (signal?.aborted !== true) return
  throw new PlatformSessionError("operation_cancelled", "Импорт конфигурации отменён")
}

function defaultDependencies(): ImportFromInfobaseDependencies {
  return {
    platformManager: getPlatformSessionManager(),
    async importXml(params) {
      return (await loadCoreApi()).syncConfigurationFromXML(params)
    },
    readSettings: readProjectSettings,
    resolveTarget: resolveComponent,
    assertTargetEmpty: assertImportTargetEmpty,
    fs: temporaryDirectoryFileSystem,
    operationId: randomUUID,
  }
}

function mapFailure(
  failure: CoreImportDiagnostic
): { severity: "error"; code: string; message: string; targetProjectPath?: string } {
  return {
    severity: "error",
    code: failure.code,
    message: failure.message,
    ...(failure.targetProjectPath.length === 0 ? {} : { targetProjectPath: failure.targetProjectPath }),
  }
}

function mapWarning(warning: CoreImportDiagnostic): {
  code: string
  message: string
  targetProjectPath?: string
} {
  return {
    code: warning.code,
    message: warning.message,
    ...(warning.targetProjectPath.length === 0 ? {} : { targetProjectPath: warning.targetProjectPath }),
  }
}
