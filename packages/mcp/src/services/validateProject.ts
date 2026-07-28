import { posix, win32 } from "path"
import { loadCoreApi } from "../coreApi"
import { errorMessage, toolError, toolSuccess, type ToolPayload } from "../contracts/common"
import { type ValidateProjectInput } from "../contracts/validateProject"
import { resolveProjectRoot } from "./componentResolver"
import { getValidationHandle } from "./validationHandle"

export type ValidateProjectPayload = ToolPayload<{
  diagnostics: Array<{
    filePath: string
    severity: "error" | "warning"
    message: string
    path?: string
  }>
  summary: {
    errors: number
    warnings: number
  }
}>

export async function validateYamlProject(input: ValidateProjectInput): Promise<ValidateProjectPayload> {
  const project = resolveProjectRoot(input.projectDir)
  if (!project.ok) return project.error

  try {
    const handle = await getValidationHandle()
    const diagnostics = (await handle.validateProject({
      projectDir: project.projectDir,
    })).diagnostics

    const mapped = diagnostics.filter(isVisibleDiagnostic).map((diagnostic) => ({
      filePath: visibleProjectPath(diagnostic.filePath),
      severity: diagnostic.severity,
      message: diagnostic.message,
      ...(diagnostic.path !== undefined ? { path: diagnostic.path } : {}),
    }))

    return toolSuccess({
      diagnostics: mapped,
      summary: {
        errors: mapped.filter((diagnostic) => diagnostic.severity === "error").length,
        warnings: mapped.filter((diagnostic) => diagnostic.severity === "warning").length,
      },
    })
  } catch (caught) {
    const core = await loadCoreApi()
    if (caught instanceof core.ProjectFileSchemaError) {
      return toolError("invalid_arguments", caught.message)
    }
    if (caught instanceof Error && caught.message === "Файл находится вне указанного YAML-проекта") {
      return toolError("invalid_arguments", caught.message)
    }
    return toolError("core_error", errorMessage(caught))
  }
}

function visibleProjectPath(filePath: string): string {
  const normalized = filePath.replaceAll("\\", "/")
  if (
    posix.isAbsolute(normalized) ||
    win32.isAbsolute(normalized) ||
    /^[a-z][a-z\d+.-]*:/i.test(normalized) ||
    normalized.split("/").includes("..")
  ) {
    throw new Error("Core вернул путь диагностики вне NKDK-проекта")
  }
  return normalized
}

function isVisibleDiagnostic(diagnostic: { severity: "error" | "warning" }): boolean {
  return diagnostic.severity !== "warning"
}
