import fs from "node:fs"
import type { Diagnostic } from "../validation/types"
import {
  encodeDiagnosticBatch,
  openDiagnosticBatch,
  type DiagnosticBatchView,
} from "@nkdk/runtime"
import { createBinaryProjectStateStore } from "./binary/store"
import { createProjectStateDependencyValidator } from "../validation/projectStateDependencyValidation"
import type { ProjectStateDependencyValidator } from "./contracts/dependencyValidation"
import { loadBinaryProjectState, projectStateBinaryPath, saveBinaryProjectState } from "./binary/persistence"
import type { ProjectStateSharedBuffers } from "./binary/snapshot"
import type { ProjectStateFragment } from "./binary/fragment"
import type {
  ProjectStateFileBaseline,
  ProjectStateFileBaselinePathPage,
  ProjectStateFileHashBatch,
  ProjectStateReadToken,
} from "./contracts"
import {
  type ProjectStateFileIdentity,
} from "./fileUpdate"
import type {
  ProjectStateComponentProjection,
  ProjectStateFileChanges,
  ProjectStateStore,
} from "./store"

export class ProjectStateWriterCancelledError extends Error {
  constructor() {
    super("Обновление состояния проекта отменено")
    this.name = "ProjectStateWriterCancelledError"
  }
}

export class ProjectStateWriterClosedError extends Error {
  constructor() {
    super("ProjectState writer закрыт")
    this.name = "ProjectStateWriterClosedError"
  }
}

export interface CreateProjectStateWriterHandleOptions {
  readonly dependencyValidator?: ProjectStateDependencyValidator
  readonly openStore?: (projectDir: string) => Promise<ProjectStateStore>
  readonly save?: (projectDir: string, buffers: ProjectStateSharedBuffers) => Promise<void>
}

export interface ProjectStateWriterHandle {
  openProject(projectDir: string): Promise<void>
  readFileBaseline(files: readonly ProjectStateFileIdentity[]): Promise<ProjectStateFileBaseline>
  readFileBaselinePathPage(projectPaths: readonly string[]): Promise<ProjectStateFileBaselinePathPage>
  compareFiles(batch: ProjectStateFileHashBatch): Promise<ProjectStateFileChanges>
  readLocalDiagnostics(): Promise<readonly Diagnostic[]>
  readLocalDiagnosticBatches(): Promise<readonly DiagnosticBatchView[]>
  validateDependencies(): Promise<readonly Diagnostic[]>
  validateDependencyDiagnosticBatches(): Promise<readonly DiagnosticBatchView[]>
  createReadToken(): Promise<ProjectStateReadToken>
  readComponentProjection(componentPath: string): Promise<ProjectStateComponentProjection>
  beginUpdate(projectDir: string, signal?: AbortSignal): Promise<void>
  writeFragment(fragment: ProjectStateFragment): Promise<void>
  clearImportOutput(componentPaths: readonly string[]): Promise<void>
  deleteFiles(projectPaths: readonly string[]): Promise<void>
  deleteUnseenFiles(seenFileIds: Uint8Array): Promise<number>
  commitAndScheduleCheckpoint(): Promise<{ readonly snapshotPath: string }>
  /** Временный псевдоним до перевода всех вызывающих сторон. */
  commitAndCheckpoint(): Promise<{ readonly snapshotPath: string }>
  flushCheckpoint(): Promise<{ readonly snapshotPath: string }>
  commitUpdate(): Promise<void>
  rollbackUpdate(): Promise<void>
  reset(projectDir: string): Promise<void>
  close(): Promise<void>
}

export function createProjectStateWriterHandle(
  options: CreateProjectStateWriterHandleOptions = {},
): ProjectStateWriterHandle {
  const dependencyValidator = options.dependencyValidator ?? createProjectStateDependencyValidator()
  const save = options.save ?? saveBinaryProjectState
  let projectDir: string | undefined
  let store: ProjectStateStore | undefined
  let updateActive = false
  let operationSignal: AbortSignal | undefined
  let pendingSave: Promise<void> | undefined
  let saveFailure: unknown
  let closed = false
  let closePromise: Promise<void> | undefined

  const handle: ProjectStateWriterHandle = {
    async openProject(nextProjectDir) {
      assertOpen()
      if (projectDir === nextProjectDir && store !== undefined) return
      await closeCurrentStore()
      projectDir = nextProjectDir
      store = options.openStore === undefined
        ? createBinaryProjectStateStore({
            dependencyValidator,
            initial: await loadBinaryProjectState(nextProjectDir),
            projectDir: nextProjectDir,
          }).store
        : await options.openStore(nextProjectDir)
    },
    async readFileBaseline(files) {
      return requireStore().readFileBaseline(files)
    },
    async readFileBaselinePathPage(projectPaths) {
      return requireStore().readFileBaselinePathPage(projectPaths)
    },
    async compareFiles(batch) {
      return requireStore().compareFiles(batch)
    },
    async readLocalDiagnostics() {
      return requireStore().readLocalDiagnostics()
    },
    async readLocalDiagnosticBatches() {
      const current = requireStore()
      return current.readLocalDiagnosticBatches?.()
        ?? [openDiagnosticBatch(encodeDiagnosticBatch(current.readLocalDiagnostics()))]
    },
    async validateDependencies() {
      assertOperation()
      assertNotCancelled()
      return requireStore().validateDependencies({ requests: [] })
    },
    async validateDependencyDiagnosticBatches() {
      assertOperation()
      assertNotCancelled()
      const current = requireStore()
      return current.validateDependencyDiagnosticBatches?.({ requests: [] })
        ?? [openDiagnosticBatch(encodeDiagnosticBatch(current.validateDependencies({ requests: [] })))]
    },
    async createReadToken() {
      return requireStore().createReadToken()
    },
    async readComponentProjection(componentPath) {
      return requireStore().readComponentProjection(componentPath)
    },
    async beginUpdate(nextProjectDir, signal) {
      assertOpen()
      await handle.openProject(nextProjectDir)
      if (updateActive) throw new Error("Обновление состояния проекта уже начато")
      await awaitPreviousSaveWithRetry()
      if (signal?.aborted === true) throw new ProjectStateWriterCancelledError()
      requireStore().beginUpdate()
      updateActive = true
      operationSignal = signal
    },
    async writeFragment(fragment) {
      assertOperation()
      assertNotCancelled()
      requireStore().appendFragment(fragment)
    },
    async clearImportOutput(componentPaths) {
      assertOperation()
      assertNotCancelled()
      requireStore().clearImportOutput(componentPaths)
    },
    async deleteFiles(projectPaths) {
      assertOperation()
      assertNotCancelled()
      requireStore().deleteFiles(projectPaths)
    },
    async deleteUnseenFiles(seenFileIds) {
      assertOperation()
      assertNotCancelled()
      return requireStore().deleteUnseenFiles(seenFileIds)
    },
    async commitAndScheduleCheckpoint() {
      assertOperation()
      assertNotCancelled()
      const currentStore = requireStore()
      const changed = currentStore.commitUpdate()
      updateActive = false
      operationSignal = undefined
      if (changed) scheduleSave(snapshotBuffers(currentStore))
      return { snapshotPath: projectStateBinaryPath(projectDir!) }
    },
    commitAndCheckpoint() {
      return handle.commitAndScheduleCheckpoint()
    },
    async flushCheckpoint() {
      assertOpen()
      await pendingSave
      if (saveFailure !== undefined) throw saveFailure
      return { snapshotPath: projectStateBinaryPath(requireProjectDir()) }
    },
    async commitUpdate() {
      assertOperation()
      assertNotCancelled()
      requireStore().commitUpdate()
      updateActive = false
      operationSignal = undefined
    },
    async rollbackUpdate() {
      assertOpen()
      if (!updateActive) return
      requireStore().rollbackUpdate()
      updateActive = false
      operationSignal = undefined
    },
    async reset(nextProjectDir) {
      assertOpen()
      await handle.openProject(nextProjectDir)
      if (updateActive) await handle.rollbackUpdate()
      await pendingSave?.catch(() => undefined)
      requireStore().close()
      await fs.promises.unlink(projectStateBinaryPath(nextProjectDir)).catch(() => undefined)
      store = options.openStore === undefined
        ? createBinaryProjectStateStore({ projectDir: nextProjectDir, dependencyValidator }).store
        : await options.openStore(nextProjectDir)
      pendingSave = undefined
      saveFailure = undefined
    },
    close() {
      if (closePromise !== undefined) return closePromise
      closed = true
      closePromise = closeCurrentStore()
      return closePromise
    },
  }

  return handle

  function assertOpen(): void {
    if (closed) throw new ProjectStateWriterClosedError()
  }

  function requireStore(): ProjectStateStore {
    assertOpen()
    if (store === undefined) throw new Error("Проект состояния ещё не открыт")
    return store
  }

  function requireProjectDir(): string {
    if (projectDir === undefined) throw new Error("Проект состояния ещё не открыт")
    return projectDir
  }

  function assertOperation(): void {
    requireStore()
    if (!updateActive) throw new Error("Нет активного обновления состояния проекта")
  }

  function assertNotCancelled(): void {
    if (operationSignal?.aborted === true) throw new ProjectStateWriterCancelledError()
  }

  function scheduleSave(buffers: ProjectStateSharedBuffers): void {
    const currentProjectDir = requireProjectDir()
    const previous = pendingSave?.catch(() => undefined) ?? Promise.resolve()
    saveFailure = undefined
    pendingSave = previous.then(() => save(currentProjectDir, buffers)).catch((caught) => {
      saveFailure = caught
      throw caught
    })
    void pendingSave.catch(() => undefined)
  }

  async function awaitPreviousSaveWithRetry(): Promise<void> {
    try {
      await pendingSave
    } catch {
      const currentStore = requireStore()
      saveFailure = undefined
      scheduleSave(snapshotBuffers(currentStore))
      await pendingSave
    }
    if (saveFailure !== undefined) throw saveFailure
  }

  async function closeCurrentStore(): Promise<void> {
    if (updateActive) {
      store?.rollbackUpdate()
      updateActive = false
      operationSignal = undefined
    }
    let failure: unknown
    try {
      await pendingSave
      if (saveFailure !== undefined) failure = saveFailure
    } catch (caught) {
      failure = caught
    }
    store?.close()
    store = undefined
    projectDir = undefined
    pendingSave = undefined
    saveFailure = undefined
    if (failure !== undefined) throw failure
  }
}

function snapshotBuffers(store: ProjectStateStore): ProjectStateSharedBuffers {
  const token = store.createReadToken()
  return token.buffers
}
