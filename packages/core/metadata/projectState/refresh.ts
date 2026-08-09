import type { ConfigurationContext } from "../context/types"
import type { DiagnosticBatchView } from "../diagnostics/binaryBatch"
import {
  createMetadataDiagnosticCollection,
  type MetadataDiagnosticCollection,
} from "../diagnostics/collection"
import type { ProjectStateFragment } from "./binary/fragment"
import type { ProjectStateFileBaselinePathPage, ProjectStateReadToken } from "./contracts"
import {
  discoverProjectStateValidationFileBatches,
  type ProjectStateDiscoveredFileBatch,
  type ProjectStateValidationFileTask,
} from "./projectFiles"
import type {
  ProjectStateRefreshExecutor,
  ProjectStateRefreshOperation,
  ProjectStateValidationFileBatch,
  ProjectStateValidationStats,
} from "./refreshExecutor"
import { createProjectStateRefreshOperation } from "./refreshExecutor"
export type {
  ProjectStateRefreshExecutor,
  ProjectStateRefreshOperation,
  ProjectStateValidationFileBatch,
  ProjectStateValidationStats,
} from "./refreshExecutor"

export interface ProjectStateRefreshStats {
  readonly hashedFiles: number
  readonly parsedYamlFiles: number
  readonly changedFiles: number
  readonly deletedFiles: number
}

export interface ProjectStateRefreshResult {
  readonly diagnostics: MetadataDiagnosticCollection
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
  readonly workerPoolCreateMs: number
  readonly workerReadyMs: number
  readonly workerReuseMs: number
}

export type ProjectStateProfilePhase =
  | "discoverFiles"
  | "readBaseline"
  | "processFiles"
  | "readLocalDiagnostics"
  | "dependencyValidation"
  | "scheduleSave"
  | "saveBinary"
  | "workerPoolCreate"
  | "workerReady"
  | "workerReuse"

export interface ProjectStateProfilePhaseEvent {
  readonly phase: ProjectStateProfilePhase
  readonly elapsedMs: number
}

export interface ProjectStateProfileOptions {
  readonly onPhase?: (event: ProjectStateProfilePhaseEvent) => void
}

export interface ProjectStateRefreshHandle {
  readFileBaselinePathPage(projectPaths: readonly string[]): Promise<ProjectStateFileBaselinePathPage>
  beginUpdate(projectDir: string, signal?: AbortSignal): Promise<void>
  writeFragment(fragment: ProjectStateFragment): Promise<void>
  deleteFiles(projectPaths: readonly string[]): Promise<void>
  deleteUnseenFiles(seenFileIds: Uint8Array): Promise<number>
  readLocalDiagnosticBatches(): Promise<readonly DiagnosticBatchView[]>
  validateDependencyDiagnosticBatches(): Promise<readonly DiagnosticBatchView[]>
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

export function createProjectStateRefreshDependencies(params: {
  readonly handle: ProjectStateRefreshHandle
  readonly executor: ProjectStateRefreshExecutor
  readonly afterProcessFiles?: () => Promise<void>
  readonly beforeCheckpoint?: () => Promise<void>
}): ProjectStateRefreshDependencies {
  return {
    handle: params.handle,
    ...(params.afterProcessFiles === undefined ? {} : { afterProcessFiles: params.afterProcessFiles }),
    ...(params.beforeCheckpoint === undefined ? {} : { beforeCheckpoint: params.beforeCheckpoint }),
    discoverFiles: ({ projectDir }) => discoverProjectStateValidationFileBatches(projectDir),
    processFiles(batches, producer, operation, projectDir) {
      return params.executor.processFiles(batches, producer, operation, projectDir)
    },
  }
}

export async function refreshProjectState(
  params: ProjectStateRefreshParams,
  dependencies: ProjectStateRefreshDependencies,
): Promise<ProjectStateRefreshResult> {
  const operation = createProjectStateRefreshOperation(params.signal)
  const operationParams = { ...params, signal: operation.signal }
  let updateActive = false
  let diagnostics: MetadataDiagnosticCollection | undefined
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
    const localDiagnostics = await dependencies.handle.readLocalDiagnosticBatches()
    operation.signal.throwIfAborted()
    const dependencyDiagnostics = await dependencies.handle.validateDependencyDiagnosticBatches()
    operation.signal.throwIfAborted()
    diagnostics = createMetadataDiagnosticCollection([
      ...localDiagnostics,
      ...dependencyDiagnostics,
    ])
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
    diagnostics?.release()
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
  handle: Pick<ProjectStateRefreshHandle, "readFileBaselinePathPage">,
  signal: AbortSignal,
): { readonly batches: AsyncIterable<ProjectStateValidationFileBatch>; finish(): Promise<Uint8Array> } {
  let storedFileCount: number | undefined
  let seenFileIds: Uint8Array | undefined
  let completed = false
  const batches = (async function* () {
    for await (const batch of discovered) {
      signal.throwIfAborted()
      const baseline = await handle.readFileBaselinePathPage(batch.paths.map(({ projectPath }) => projectPath))
      storedFileCount ??= baseline.storedFileCount
      if (baseline.storedFileCount !== storedFileCount) throw new Error("Сохранённое состояние изменилось во время обнаружения файлов")
      seenFileIds ??= new Uint8Array(Math.ceil(storedFileCount / 8))
      for (const fileId of baseline.previousFileIds) {
        if (fileId >= 0) seenFileIds[Math.floor(fileId / 8)]! |= 1 << (fileId % 8)
      }
      const selected = selectValidationFiles(batch, baseline)
      if (selected.files.length > 0) yield selected
    }
    completed = true
  })()
  return {
    batches,
    async finish() {
      if (!completed) throw new Error("Обнаружение файлов проекта не завершено")
      if (seenFileIds !== undefined) return seenFileIds
      const empty = await handle.readFileBaselinePathPage([])
      return new Uint8Array(Math.ceil(empty.storedFileCount / 8))
    },
  }
}

function selectValidationFiles(
  batch: ProjectStateDiscoveredFileBatch,
  baseline: ProjectStateFileBaselinePathPage,
): ProjectStateValidationFileBatch {
  const files: ProjectStateValidationFileTask[] = []
  const known: boolean[] = []
  const hashes: Uint8Array[] = []
  const previousFileIds: number[] = []
  batch.paths.forEach((path, index) => {
    const previousFileId = baseline.previousFileIds[index]!
    if (previousFileId >= 0) {
      files.push({
        projectPath: path.projectPath,
        componentPath: path.componentPath,
        absolutePath: path.absolutePath,
      })
      known.push(true)
      hashes.push(baseline.hashBytes.slice(index * 8, (index + 1) * 8))
      previousFileIds.push(previousFileId)
      return
    }
    const discovered = path.classify()
    if (discovered === undefined) return
    files.push({
      projectPath: discovered.identity.projectPath,
      componentPath: discovered.identity.componentPath,
      absolutePath: discovered.absolutePath,
      identity: discovered.identity,
      ...(discovered.descriptor === undefined ? {} : { descriptor: discovered.descriptor }),
    })
    known.push(false)
    hashes.push(new Uint8Array(8))
    previousFileIds.push(-1)
  })
  const knownHashBits = new Uint8Array(Math.ceil(files.length / 8))
  known.forEach((value, index) => {
    if (value) knownHashBits[Math.floor(index / 8)]! |= 1 << (index % 8)
  })
  const hashBytes = new Uint8Array(files.length * 8)
  hashes.forEach((hash, index) => hashBytes.set(hash, index * 8))
  return {
    files,
    knownHashBits,
    hashBytes,
    previousFileIds: Int32Array.from(previousFileIds),
    storedFileCount: baseline.storedFileCount,
  }
}

function errorMessage(caught: unknown): string {
  return caught instanceof Error ? caught.message : "Ошибка актуализации состояния проекта"
}
