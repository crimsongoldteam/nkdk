import { existsSync, statSync } from "fs"
import { isAbsolute, relative, resolve, sep } from "path"
import { loadCoreApi } from "../coreApi"
import { errorMessage, toolError, toolSuccess, type ToolPayload } from "../contracts/common"
import { type ValidateProjectInput } from "../contracts/validateProject"

export type ValidateProjectPayload = ToolPayload<{
  diagnostics: Array<{
    filePath: string
    line: number
    col: number
    severity: "error" | "warning"
    message: string
  }>
  summary: {
    errors: number
    warnings: number
  }
}>

export async function validateYamlProject(input: ValidateProjectInput): Promise<ValidateProjectPayload> {
  const projectDir = resolve(input.projectDir)

  if (!existsSync(projectDir)) {
    return toolError("not_found", "YAML-проект не найден", { projectDir: input.projectDir })
  }

  if (!statSync(projectDir).isDirectory()) {
    return toolError("invalid_arguments", "Путь не является каталогом YAML-проекта", { projectDir: input.projectDir })
  }

  try {
    const core = await loadCoreApi()
    const diagnostics = (await core.validateProject({
      projectDir,
      ...(input.filePath !== undefined ? { filePath: input.filePath } : {}),
    })).diagnostics

    const mapped = diagnostics.filter(isVisibleDiagnostic).map((diagnostic) => ({
      filePath: toProjectRelativePath(projectDir, diagnostic.filePath),
      line: diagnostic.line,
      col: diagnostic.col,
      severity: diagnostic.severity,
      message: diagnostic.message,
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
