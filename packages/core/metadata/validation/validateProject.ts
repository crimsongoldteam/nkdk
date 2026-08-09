import { availableParallelism } from "node:os"
import type { ConfigurationContext } from "../context/types"
import { projectPathFromFileSystem } from "../projectDefinition/path"
import { createProjectStateService, type ProjectStateService } from "../projectState/service"
import type { Diagnostic } from "./types"
import type { MetadataDiagnosticCollection } from "../diagnostics/collection"

export interface ValidateProjectParams {
  projectDir: string
  context?: ConfigurationContext
  concurrency?: number
  projectState?: ProjectStateService
}

export interface ValidateProjectResult {
  diagnostics: MetadataDiagnosticCollection
}

export interface ValidationWorkerPoolHandle {
  validateProject(params: Omit<ValidateProjectParams, "concurrency">): Promise<ValidateProjectResult>
}

export async function validateProject(params: ValidateProjectParams): Promise<ValidateProjectResult> {
  const projectState = params.projectState ?? createProjectStateService()
  const ownsProjectState = params.projectState === undefined
  try {
    const result = await projectState.refreshAndValidate({
      projectDir: params.projectDir,
      context: params.context,
      concurrency: normalizeValidationConcurrency(params.concurrency),
    })
    return { diagnostics: result.diagnostics }
  } finally {
    if (ownsProjectState) await projectState.close()
  }
}

function normalizeValidationConcurrency(value: number | undefined): number {
  if (value !== undefined) {
    if (!Number.isInteger(value) || value < 1) throw new Error("validation concurrency must be a positive integer")
    return value
  }

  return Math.max(1, Math.min(4, availableParallelism() - 1))
}

export function toRootProjectDiagnostic(projectDir: string, diagnostic: Diagnostic): Diagnostic {
  let rootProjectPath: string
  try {
    rootProjectPath = projectPathFromFileSystem(projectDir, diagnostic.filePath)
  } catch {
    throw new Error(`Путь диагностики находится за пределами projectDir: ${diagnostic.filePath}`)
  }
  const componentProjectPath =
    rootProjectPath.startsWith("cf/") || /^cfe\/[^/]+\//.test(rootProjectPath)
      ? rootProjectPath
      : `cf/${rootProjectPath}`
  return { ...diagnostic, filePath: componentProjectPath }
}
