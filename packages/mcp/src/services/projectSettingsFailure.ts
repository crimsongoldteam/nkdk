import {
  PROJECT_SETTINGS_SCHEMA_URI,
  type ProjectSettingsReadResult,
} from "@nkdk/platform"
import { toolError, type ToolFailure } from "../contracts/common"

const schemaReference = {
  uri: PROJECT_SETTINGS_SCHEMA_URI,
  format: "application/schema+json",
} as const

export function projectSettingsFailure(
  result: ProjectSettingsReadResult
): ToolFailure | undefined {
  if (result.status === "ready") return undefined
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
