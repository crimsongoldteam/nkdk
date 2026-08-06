import { loadCoreApi, type CoreApi } from "../coreApi"
import { errorMessage, toolError, toolSuccess, type ToolPayload } from "../contracts/common"
import { type ValidateProjectInput } from "../contracts/validateProject"
import { resolveProjectRoot } from "./componentResolver"
import { projectStateHandle } from "./projectStateHandle"
import { prepareDiagnosticOutput } from "./diagnosticReport"
import type { DiagnosticReportReference, DiagnosticSummary } from "../contracts/diagnostics"

export type ValidateProjectPayload = ToolPayload<{
  diagnostics: readonly {
    filePath: string
    severity: "error" | "warning"
    message: string
    path?: string
  }[]
  summary: DiagnosticSummary
  truncated: boolean
  report?: DiagnosticReportReference
}>

export async function validateYamlProject(input: ValidateProjectInput): Promise<ValidateProjectPayload> {
  const project = resolveProjectRoot(input.projectDir)
  if (!project.ok) return project.error

  try {
    const projectState = await projectStateHandle.get()
    const core = await loadCoreApi()
    const diagnostics = (await core.validateProject({
      projectDir: project.projectDir,
      projectState,
    })).diagnostics
    const output = await prepareDiagnosticOutput({
      projectDir: project.projectDir,
      operation: "validation",
      operationId: `${Date.now()}-${Math.random()}`,
      diagnostics,
      map(diagnostic) {
        if (!isVisibleDiagnostic(diagnostic)) return undefined
        return {
          filePath: visibleProjectPath(core, diagnostic.filePath),
          severity: diagnostic.severity,
          message: diagnostic.message,
          ...(diagnostic.path === undefined ? {} : { path: diagnostic.path }),
        }
      },
    })
    return toolSuccess(output)
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

function visibleProjectPath(core: Pick<CoreApi, "parseProjectPath">, filePath: string): string {
  try {
    return core.parseProjectPath(filePath)
  } catch {
    throw new Error("Core вернул путь диагностики вне NKDK-проекта")
  }
}

function isVisibleDiagnostic(diagnostic: { severity: "error" | "warning" }): boolean {
  return diagnostic.severity !== "warning"
}
