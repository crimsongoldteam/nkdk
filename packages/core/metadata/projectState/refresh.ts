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
import type { ProjectStateFileBaselinePage, ProjectStateReadToken } from "./contracts"
import {
  discoverProjectStateValidationFileBatches,
  type ProjectStateDiscoveredFileBatch,
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
  readFileBaselinePage(files: readonly import("./fileUpdate").ProjectStateFileIdentity[]): Promise<ProjectStateFileBaselinePage>
  beginUpdate(projectDir: string, signal?: AbortSignal): Promise<void>
  writeFragment(fragment: ProjectStateFragment): Promise<void>
  deleteFiles(projectPaths: readonly string[]): Promise<void>
  deleteUnseenFiles(seenFileIds: Uint8Array): Promise<number>
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
  readonly discoverFiles: (params: ProjectStateRefreshParams) => AsyncIterable<ProjectStateDiscoveredFileBatch>
  readonly processFiles: (
    batches: AsyncIterable<ProjectStateValidationFileBatch>,
    producer: Pick<ProjectStateRefreshHandle, "writeFragment" | "deleteFiles">,
    operation: ProjectStateRefreshOperation,
    projectDir: string,
  ) => Promise<ProjectStateValidationStats>
}

export interface ProjectStateValidationFileBatch extends ProjectStateFileBaselinePage {
  readonly files: ProjectStateDiscoveredFileBatch["files"]
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
    discoverFiles: ({ projectDir }) => discoverProjectStateValidationFileBatches(projectDir),
    processFiles(batches, producer, operation, projectDir) {
      return params.pool.runProjectStateRefresh({
        projectDir,
        context: params.context,
        source: { batches },
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
    await dependencies.handle.beginUpdate(params.projectDir, operation.signal)
    updateActive = true
    const scan = createBaselineScan(dependencies.discoverFiles(operationParams), dependencies.handle, operation.signal)
    const workerStats = await dependencies.processFiles(
      scan.batches,
      dependencies.handle,
      operation,
      params.projectDir,
    )
    const deletedFiles = await dependencies.handle.deleteUnseenFiles(await scan.finish())
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
        deletedFiles: deletedFiles + workerStats.missingFiles,
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

function createBaselineScan(
  discovered: AsyncIterable<ProjectStateDiscoveredFileBatch>,
  handle: Pick<ProjectStateRefreshHandle, "readFileBaselinePage">,
  signal: AbortSignal,
): { readonly batches: AsyncIterable<ProjectStateValidationFileBatch>; finish(): Promise<Uint8Array> } {
  let storedFileCount: number | undefined
  let seenFileIds: Uint8Array | undefined
  let completed = false
  const batches = (async function* () {
    for await (const batch of discovered) {
      signal.throwIfAborted()
      const baseline = await handle.readFileBaselinePage(batch.files.map(({ identity }) => identity))
      storedFileCount ??= baseline.storedFileCount
      if (baseline.storedFileCount !== storedFileCount) throw new Error("Сохранённое состояние изменилось во время обнаружения файлов")
      seenFileIds ??= new Uint8Array(Math.ceil(storedFileCount / 8))
      for (const fileId of baseline.previousFileIds) {
        if (fileId >= 0) seenFileIds[Math.floor(fileId / 8)]! |= 1 << (fileId % 8)
      }
      yield { files: batch.files, ...baseline }
    }
    completed = true
  })()
  return {
    batches,
    async finish() {
      if (!completed) throw new Error("Обнаружение файлов проекта не завершено")
      if (seenFileIds !== undefined) return seenFileIds
      const empty = await handle.readFileBaselinePage([])
      return new Uint8Array(Math.ceil(empty.storedFileCount / 8))
    },
  }
}

function errorMessage(caught: unknown): string {
  return caught instanceof Error ? caught.message : "Ошибка актуализации состояния проекта"
}
