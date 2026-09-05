import {
  PROJECT_SETTINGS_SCHEMA_URI,
  type ProjectSettingsReadResult,
} from "@nkdk/platform"
import { toolError, type ToolFailure } from "../contracts/common"

const schemaReference = {
  uri: PROJECT_SETTINGS_SCHEMA_URI,
  format: "application/schema+json",
} as const

export type InfobaseSettingsReadResult = Extract<ProjectSettingsReadResult, { status: "ready" }> & {
  settings: { infobase: NonNullable<Extract<ProjectSettingsReadResult, { status: "ready" }>["settings"]["infobase"]> }
}

export function hasInfobaseSettings(result: ProjectSettingsReadResult): result is InfobaseSettingsReadResult {
  return result.status === "ready" && result.settings.infobase !== undefined
}

export function projectSettingsFailure(
  result: ProjectSettingsReadResult
): ToolFailure | undefined {
  if (hasInfobaseSettings(result)) return undefined
  if (result.status === "ready") {
    return projectSettingsFailure({
      ...result,
      status: "invalid",
      diagnostics: [{ code: "infobase_required", path: "infobase", message: "Для операции 1С нужны настройки информационной базы" }],
    })
  }
  if (result.status === "missing") {
    return toolError(
      "project_settings_required",
      "Создайте файл настроек проекта и повторите импорт.",
      { settingsPath: result.settingsPath, schema: schemaReference }
    )
  }
  return toolError(
    "invalid_project_settings",
    "Исправьте файл настроек проекта и повторите импорт.",
    {
      settingsPath: result.settingsPath,
      diagnostics: result.diagnostics,
      schema: schemaReference,
    }
  )
}
