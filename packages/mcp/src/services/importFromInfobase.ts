import fs from "node:fs"
import { randomUUID } from "node:crypto"
import { join } from "node:path"
import {
  PlatformSessionError,
  writeProjectSettings,
  type PlatformSessionManager,
  type PlatformSessionMode,
} from "@nkdk/platform"
import { loadCoreApi, type CoreApi } from "../coreApi"
import {
  toolError,
  toolSuccess,
  type ToolErrorCode,
  type ToolPayload,
} from "../contracts/common"
import type { ImportFromInfobaseInput } from "../contracts/importFromInfobase"
import { assertImportTargetEmpty, resolveComponent } from "./componentResolver"
import { getPlatformSessionManager } from "./platformSessionHandle"

type CoreImportDiagnostic = {
  severity: "error" | "warning"
  code: string
  message: string
  targetProjectPath: string
}

export interface ImportFromInfobaseDependencies {
  platformManager: Pick<PlatformSessionManager, "exportConfiguration">
  importXml: CoreApi["syncConfigurationFromXML"]
  writeSettings: typeof writeProjectSettings
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
  failed: Array<{ kind: string; name: string; parent?: string; message: string }>
  warnings: Array<{ code: string; message: string; targetProjectPath?: string }>
  configurationIndexPath?: string
  settingsPath?: string
  mode: PlatformSessionMode
  reusedConnection: boolean
  temporaryDirectory?: string
}>

export async function importFromInfobase(
  input: ImportFromInfobaseInput,
  providedDependencies?: ImportFromInfobaseDependencies
): Promise<ImportFromInfobasePayload> {
  if (input.allowWrite !== true) {
    return toolError(
      "confirmation_required",
      "import_from_infobase запускает 1С и пишет YAML-файлы; повторите вызов с allowWrite=true",
      { projectDir: input.projectDir, componentPath: "cf" }
    )
  }

  const dependencies = providedDependencies ?? defaultDependencies()
  let temporaryDirectory: string | undefined
  try {
    const component = dependencies.resolveTarget({
      projectDir: input.projectDir,
      componentPath: "cf",
      createIfMissing: true,
    })
    if (!component.ok) return component.error
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
    const connection = await dependencies.platformManager.exportConfiguration({
      projectDir: component.projectDir,
      outputDir: xmlDirectory,
      logPath: join(temporaryDirectory, "platform.log"),
      connectionString: input.connectionString,
      ...(input.user === undefined ? {} : { user: input.user }),
      ...(input.password === undefined ? {} : { password: input.password }),
      ...(input.useStandaloneServer === undefined
        ? {}
        : { useStandaloneServer: input.useStandaloneServer }),
      ...(input.sessionIdleTimeout === undefined
        ? {}
        : { sessionIdleTimeout: input.sessionIdleTimeout }),
      ...(input.database === undefined ? {} : { database: input.database }),
    })
    const result = await dependencies.importXml({
      context: {
        defaultLanguage: "ru",
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
      mode: connection.mode,
      reusedConnection: connection.reusedConnection,
    }
    if (result.failed.length > 0) {
      return toolSuccess({ ...payload, temporaryDirectory })
    }

    const settings = await dependencies.writeSettings({
      projectDir: component.projectDir,
      infobase: {
        connectionString: input.connectionString,
        ...(input.user === undefined ? {} : { user: input.user }),
        ...(input.password === undefined ? {} : { password: input.password }),
        ...(input.useStandaloneServer === undefined
          ? {}
          : { useStandaloneServer: input.useStandaloneServer }),
        ...(input.sessionIdleTimeout === undefined
          ? {}
          : { sessionIdleTimeout: input.sessionIdleTimeout }),
        ...(input.database === undefined ? {} : { database: input.database }),
      },
    })
    await dependencies.fs.rm(temporaryDirectory)
    return toolSuccess({ ...payload, settingsPath: settings.settingsPath })
  } catch (caught) {
    const code: ToolErrorCode =
      caught instanceof PlatformSessionError ? caught.code : "core_error"
    return toolError(code, safeOperationError(code), {
      ...(temporaryDirectory === undefined ? {} : { temporaryDirectory }),
    })
  }
}

function defaultDependencies(): ImportFromInfobaseDependencies {
  return {
    platformManager: getPlatformSessionManager(),
    async importXml(params) {
      return (await loadCoreApi()).syncConfigurationFromXML(params)
    },
    writeSettings: writeProjectSettings,
    resolveTarget: resolveComponent,
    assertTargetEmpty: assertImportTargetEmpty,
    fs: {
      async mkdir(path) {
        await fs.promises.mkdir(path, { recursive: true })
      },
      async rm(path) {
        await fs.promises.rm(path, { recursive: true, force: true })
      },
    },
    operationId: randomUUID,
  }
}

function mapFailure(
  failure: CoreImportDiagnostic
): { kind: string; name: string; message: string } {
  return {
    kind: failure.code,
    name: failure.targetProjectPath,
    message: failure.message,
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
    ...(warning.targetProjectPath.length === 0
      ? {}
      : { targetProjectPath: warning.targetProjectPath }),
  }
}

function safeOperationError(code: ToolErrorCode): string {
  return code === "core_error"
    ? "Не удалось импортировать конфигурацию из информационной базы"
    : `Операция платформы завершилась с ошибкой: ${code}`
}
