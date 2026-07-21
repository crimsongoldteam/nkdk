import { isAbsolute, relative, resolve, sep } from "path"
import { loadCoreApi } from "../coreApi"
import { errorMessage, toolError, toolSuccess, type ToolPayload } from "../contracts/common"
import { type ValidateProjectInput } from "../contracts/validateProject"
import { resolveComponent } from "./componentResolver"
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
  const component = resolveComponent({ projectDir: input.projectDir, componentPath: "cf" })
  if (!component.ok) return component.error

  try {
    const handle = await getValidationHandle()
    const diagnostics = (await handle.validateProject({
      projectDir: component.componentDir,
    })).diagnostics

    const mapped = diagnostics.filter(isVisibleDiagnostic).map((diagnostic) => ({
      filePath: toProjectRelativePath(component.componentDir, diagnostic.filePath),
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

function toProjectRelativePath(projectDir: string, filePath: string): string {
  const absolutePath = isAbsolute(filePath) ? resolve(filePath) : resolve(projectDir, filePath)
  return relative(resolve(projectDir), absolutePath).split(sep).join("/")
}

function isVisibleDiagnostic(diagnostic: { severity: "error" | "warning" }): boolean {
  return diagnostic.severity !== "warning"
}
