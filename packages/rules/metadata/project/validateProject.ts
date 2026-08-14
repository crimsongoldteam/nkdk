import { availableParallelism } from "node:os"
import type { ConfigurationContext } from "@nkdk/runtime"
import { projectPathFromFileSystem } from "../projectDefinition/path"
import { createProjectStateService, type ProjectStateService } from "../projectState/service"
import type { Diagnostic } from "../validation/types"
import type { MetadataDiagnosticCollection } from "@nkdk/runtime"
import { join } from "node:path"
import { loadConfigurationLanguagesFromYAML } from "../appliedObjects/configuration/languageRegistry"
import { configurationValidationContextVersions } from "../context/validationContextVersions"

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

export interface ValidateProjectDependencies {
  loadLanguages(configurationDir: string): ReturnType<typeof loadConfigurationLanguagesFromYAML>
}

const defaultDependencies: ValidateProjectDependencies = {
  loadLanguages: loadConfigurationLanguagesFromYAML,
}

export async function validateProject(
  params: ValidateProjectParams,
  deps: ValidateProjectDependencies = defaultDependencies,
): Promise<ValidateProjectResult> {
  const projectState = params.projectState ?? createProjectStateService()
  const ownsProjectState = params.projectState === undefined
  try {
    const languages = await deps.loadLanguages(join(params.projectDir, "cf"))
    const context = { ...(params.context ?? { version: "2.20" }), languages }
    const result = await projectState.refreshAndValidate({
      projectDir: params.projectDir,
      context,
      validationContextVersions: configurationValidationContextVersions(context),
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
