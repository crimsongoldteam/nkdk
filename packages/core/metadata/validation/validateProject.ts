import { availableParallelism } from "node:os"
import { isAbsolute, relative, resolve, sep } from "path"
import type { ConfigurationContext } from "../context/types"
import {
  createPreparedYamlProjectWorkerPool,
  type PreparedWorkerPool,
} from "../project/preparedYamlProjectWorkerPool"
import { createProjectStateService, type ProjectStateService } from "../projectState/service"
import type { Diagnostic } from "./types"

export interface ValidateProjectParams {
  projectDir: string
  context?: ConfigurationContext
  concurrency?: number
  projectState?: ProjectStateService
}

export interface ValidateProjectResult {
  diagnostics: Diagnostic[]
}

export interface ValidationWorkerPoolHandle {
  validateProject(params: Omit<ValidateProjectParams, "concurrency">): Promise<ValidateProjectResult>
  close(): Promise<void>
  size(): number
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
    return { diagnostics: [...result.diagnostics] }
  } finally {
    if (ownsProjectState) await projectState.close()
  }
}

export function createValidationWorkerPoolHandle(
  params: {
    concurrency?: number
    createWorkerPool?: () => PreparedWorkerPool
    createProjectState?: () => ProjectStateService
  } = {}
): ValidationWorkerPoolHandle {
  const concurrency = normalizeValidationConcurrency(params.concurrency)
  const projectState = params.createProjectState?.() ?? createProjectStateService({
    createPool: (poolConcurrency) => createPreparedYamlProjectWorkerPool({
      concurrency: poolConcurrency,
      createWorkerPool: params.createWorkerPool,
    }),
  })
  let closed = false

  return {
    validateProject(projectParams) {
      if (closed) throw new Error("Validation worker pool handle is closed")
      return validateProject({
        ...projectParams,
        concurrency,
        projectState,
      })
    },
    async close() {
      if (closed) return
      closed = true
      await projectState.close()
    },
    size() {
      return concurrency
    },
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
  const relativePath = relative(resolve(projectDir), resolve(diagnostic.filePath))
  if (relativePath === ".." || relativePath.startsWith(`..${sep}`) || isAbsolute(relativePath)) {
    throw new Error(`Путь диагностики находится за пределами projectDir: ${diagnostic.filePath}`)
  }
  const rootProjectPath = relativePath.split(sep).join("/")
  const componentProjectPath =
    rootProjectPath.startsWith("cf/") || /^cfe\/[^/]+\//.test(rootProjectPath)
      ? rootProjectPath
      : `cf/${rootProjectPath}`
  return { ...diagnostic, filePath: componentProjectPath }
}
