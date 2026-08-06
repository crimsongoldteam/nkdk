import {
  PlatformSessionError,
  readProjectSettings,
  type ConfigurationExtensionInfo,
  type PlatformSessionManager,
  type PlatformSessionMode,
} from "@nkdk/platform"
import { toolError, toolSuccess, type ToolErrorCode, type ToolPayload } from "../contracts/common"
import type { ListInfobaseExtensionsInput } from "../contracts/listInfobaseExtensions"
import { getPlatformSessionManager } from "./platformSessionHandle"
import { projectSettingsFailure } from "./projectSettingsFailure"

export interface ListInfobaseExtensionsDependencies {
  readSettings: typeof readProjectSettings
  platformManager: Pick<PlatformSessionManager, "listExtensions">
}

export type ListInfobaseExtensionsPayload = ToolPayload<{
  extensions: ConfigurationExtensionInfo[]
  mode: PlatformSessionMode
  reusedConnection: boolean
}>

export async function listInfobaseExtensions(
  input: ListInfobaseExtensionsInput,
  providedDependencies?: ListInfobaseExtensionsDependencies,
  signal?: AbortSignal
): Promise<ListInfobaseExtensionsPayload> {
  const dependencies = providedDependencies ?? defaultDependencies()
  try {
    const settingsRead = await dependencies.readSettings(input.projectDir)
    if (settingsRead.status !== "ready") return projectSettingsFailure(settingsRead)!
    const { operations, ...connectionSettings } = settingsRead.settings.infobase
    return toolSuccess(await dependencies.platformManager.listExtensions({
      projectDir: settingsRead.projectDir,
      ...connectionSettings,
      mode: operations.import.mode,
      ...(signal === undefined ? {} : { signal }),
    }))
  } catch (caught) {
    const code: ToolErrorCode = caught instanceof PlatformSessionError ? caught.code : "core_error"
    return toolError(code, safeOperationError(code))
  }
}

function defaultDependencies(): ListInfobaseExtensionsDependencies {
  return {
    readSettings: readProjectSettings,
    platformManager: getPlatformSessionManager(),
  }
}

function safeOperationError(code: ToolErrorCode): string {
  return code === "core_error"
    ? "Не удалось получить список расширений информационной базы"
    : `Операция платформы завершилась с ошибкой: ${code}`
}
