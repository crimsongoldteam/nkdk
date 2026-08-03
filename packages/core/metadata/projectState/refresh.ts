import type { ConfigurationContext } from "../context/types"
import {
  createPreparedYamlValidationOperation,
  type PreparedYamlProjectWorkerPool,
  type PreparedYamlValidationOperation,
  type ProjectStateValidationStats,
} from "../project/preparedYamlProjectWorkerPool"
import type { Diagnostic } from "../validation/types"
import { dedupeDiagnostics, sortDiagnostics } from "../validation/diagnostics"
import type { ProjectStateFragment } from "./binary/fragment"
import type { ProjectStateFileBaseline, ProjectStateReadToken } from "./contracts"
import {
  discoverProjectStateValidationFiles,
  type ProjectStateValidationFile,
} from "./projectFiles"

export interface ProjectStateRefreshStats {
  readonly hashedFiles: number
  readonly parsedYamlFiles: number
  readonly changedFiles: number
  readonly deletedFiles: number
}

export interface ProjectStateRefreshResult {
  readonly diagnostics: readonly Diagnostic[]
  readonly readToken: ProjectStateReadToken
  readonly stats: ProjectStateRefreshStats
  readonly profile?: ProjectStateRefreshProfile
}

export interface ProjectStateRefreshProfile {
  readonly snapshotBytes: number
  readonly loadMs: number
  readonly scheduleSaveMs: number
  readonly saveBinaryMs: number
  readonly discoverFilesMs: number
  readonly readBaselineMs: number
  readonly processFilesMs: number
  readonly readLocalDiagnosticsMs: number
  readonly dependencyValidationMs: number
}

export type ProjectStateProfilePhase =
  | "discoverFiles"
  | "readBaseline"
  | "processFiles"
  | "readLocalDiagnostics"
  | "dependencyValidation"
  | "scheduleSave"
  | "saveBinary"

export interface ProjectStateProfilePhaseEvent {
  readonly phase: ProjectStateProfilePhase
  readonly elapsedMs: number
}

export interface ProjectStateProfileOptions {
  readonly onPhase?: (event: ProjectStateProfilePhaseEvent) => void
}

export interface ProjectStateRefreshHandle {
  readFileBaseline(files: readonly import("./fileUpdate").ProjectStateFileIdentity[]): Promise<ProjectStateFileBaseline>
  beginUpdate(projectDir: string, signal?: AbortSignal): Promise<void>
  writeFragment(fragment: ProjectStateFragment): Promise<void>
  deleteFiles(projectPaths: readonly string[]): Promise<void>
  readLocalDiagnostics(): Promise<readonly Diagnostic[]>
  validateDependencies(): Promise<readonly Diagnostic[]>
  createReadToken(): Promise<ProjectStateReadToken>
  commitAndScheduleCheckpoint(): Promise<{ readonly snapshotPath: string }>
  rollbackUpdate(): Promise<void>
}

export interface ProjectStateRefreshParams {
  readonly projectDir: string
  readonly context?: ConfigurationContext
  readonly concurrency?: number
  readonly signal?: AbortSignal
  readonly profile?: true | ProjectStateProfileOptions
}

export interface ProjectStateRefreshOperation extends PreparedYamlValidationOperation {}

export interface ProjectStateRefreshDependencies {
  readonly handle: ProjectStateRefreshHandle
  readonly afterProcessFiles?: () => Promise<void>
  readonly beforeCheckpoint?: () => Promise<void>
  readonly discoverFiles: (params: ProjectStateRefreshParams) => Promise<readonly ProjectStateValidationFile[]>
  readonly processFiles: (
    files: readonly ProjectStateValidationFile[],
    baseline: ProjectStateFileBaseline,
    producer: Pick<ProjectStateRefreshHandle, "writeFragment" | "deleteFiles">,
    operation: ProjectStateRefreshOperation,
    projectDir: string,
  ) => Promise<ProjectStateValidationStats>
}

export function createProjectStateRefreshDependencies(params: {
  readonly handle: ProjectStateRefreshHandle
  readonly pool: PreparedYamlProjectWorkerPool
  readonly context: ConfigurationContext
  readonly afterProcessFiles?: () => Promise<void>
  readonly beforeCheckpoint?: () => Promise<void>
}): ProjectStateRefreshDependencies {
  return {
    handle: params.handle,
    ...(params.afterProcessFiles === undefined ? {} : { afterProcessFiles: params.afterProcessFiles }),
    ...(params.beforeCheckpoint === undefined ? {} : { beforeCheckpoint: params.beforeCheckpoint }),
    discoverFiles: ({ projectDir }) => discoverProjectStateValidationFiles(projectDir),
    processFiles(files, baseline, producer, operation, projectDir) {
      return params.pool.runProjectStateRefresh({
        projectDir,
        context: params.context,
        source: { files, baseline },
        operation,
      }, producer)
    },
  }
}

export async function refreshProjectState(
  params: ProjectStateRefreshParams,
  dependencies: ProjectStateRefreshDependencies,
): Promise<ProjectStateRefreshResult> {
  const operation = createPreparedYamlValidationOperation(params.signal)
  const operationParams = { ...params, signal: operation.signal }
  let updateActive = false
  try {
    operation.signal.throwIfAborted()
    const files = await dependencies.discoverFiles(operationParams)
    operation.signal.throwIfAborted()
    const baseline = await dependencies.handle.readFileBaseline(files.map(({ identity }) => identity))
    operation.signal.throwIfAborted()
    await dependencies.handle.beginUpdate(params.projectDir, operation.signal)
    updateActive = true
    await dependencies.handle.deleteFiles(baseline.deleted.map(({ projectPath }) => projectPath))
    const workerStats = await dependencies.processFiles(
      files,
      baseline,
      dependencies.handle,
      operation,
      params.projectDir,
    )
    await dependencies.afterProcessFiles?.()
    operation.signal.throwIfAborted()
    const localDiagnostics = await dependencies.handle.readLocalDiagnostics()
    operation.signal.throwIfAborted()
    const dependencyDiagnostics = await dependencies.handle.validateDependencies()
    operation.signal.throwIfAborted()
    const diagnostics = sortDiagnostics(dedupeDiagnostics([
      ...localDiagnostics,
      ...dependencyDiagnostics,
    ]))
    await dependencies.beforeCheckpoint?.()
    operation.signal.throwIfAborted()
    const readToken = await dependencies.handle.createReadToken()
    operation.signal.throwIfAborted()
    await dependencies.handle.commitAndScheduleCheckpoint()
    updateActive = false
    return {
      diagnostics,
      readToken,
      stats: {
        hashedFiles: workerStats.hashedFiles,
        parsedYamlFiles: workerStats.parsedYamlFiles,
        changedFiles: workerStats.changedFiles,
        deletedFiles: baseline.deleted.length + workerStats.missingFiles,
      },
    }
  } catch (caught) {
    if (updateActive) {
      try {
        await dependencies.handle.rollbackUpdate()
      } catch (rollbackCaught) {
        throw new AggregateError([caught, rollbackCaught], errorMessage(caught))
      }
    }
    throw caught
  }
}

function errorMessage(caught: unknown): string {
  return caught instanceof Error ? caught.message : "Ошибка актуализации состояния проекта"
}
