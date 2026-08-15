import { availableParallelism } from "node:os"
import { readdir, realpath, rm, stat } from "node:fs/promises"
import { basename, dirname, join } from "node:path"
import { performance } from "node:perf_hooks"
import { createConfigurationLanguages, type ConfigurationContext } from "@nkdk/runtime"
import type { ProjectStateReadToken } from "./contracts"
import type { ProjectStateReadSession } from "./readSession"
import {
  createProjectStateImportSession,
  type ProjectStateImportParams,
  type ProjectStateImportSession,
} from "./importSession"
import { createProjectStateWriterHandle, type ProjectStateWriterHandle } from "./writerHandle"
import { projectStateBinaryPath } from "./binary/persistence"
import {
  createProjectStateRefreshDependencies,
  refreshProjectState,
  type ProjectStateRefreshDependencies,
  type ProjectStateRefreshParams,
  type ProjectStateRefreshResult,
} from "./refresh"
import type { MetadataWorkerOperation, MetadataWorkerPoolHandle } from "../workerPool/types"
import { createProjectStateRefreshOperation, type ProjectStateRefreshExecutor } from "./refreshExecutor"

export interface ProjectStateComponentProjection {
  readonly componentPath: string
  readonly projectFiles: readonly { readonly projectPath: string }[]
  readonly hashBytes: Uint8Array
}

async function* measureAsyncIterable<T>(
  phase: "discoverFiles",
  source: AsyncIterable<T>,
  phaseMs: { discoverFilesMs: number },
  onPhase?: (event: import("./refresh").ProjectStateProfilePhaseEvent) => void,
): AsyncGenerator<T> {
  const iterator = source[Symbol.asyncIterator]()
  while (true) {
    const startedAt = performance.now()
    const next = await iterator.next()
    const elapsedMs = performance.now() - startedAt
    phaseMs.discoverFilesMs += elapsedMs
    onPhase?.({ phase, elapsedMs })
    if (next.done) return
    yield next.value
  }
}

export interface ProjectStateService {
  readonly workers: MetadataWorkerPoolHandle
  beginImport(params: ProjectStateImportParams): Promise<ProjectStateImportSession>
  refreshAndValidate(params: ProjectStateRefreshParams): Promise<ProjectStateRefreshResult>
  createReadToken(projectDir: string): Promise<ProjectStateReadToken>
  openReadSession(token: ProjectStateReadToken): ProjectStateReadSession
  readComponentProjection(params: {
    readonly projectDir: string
    readonly componentPath: string
  }): Promise<ProjectStateComponentProjection>
  reset(projectDir: string): Promise<void>
  rebuild(params: ProjectStateRefreshParams): Promise<ProjectStateRefreshResult>
  close(): Promise<void>
}

export interface ProjectStateServiceRefreshExecutor extends ProjectStateRefreshExecutor {
  initValidation(context: ConfigurationContext): Promise<unknown>
}

export interface ProjectStateServiceRefreshPool {
  initValidation(context: ConfigurationContext): Promise<unknown>
  runProjectStateRefresh(
    params: {
      projectDir: string
      context: ConfigurationContext
      source: { readonly batches: AsyncIterable<import("./refreshExecutor").ProjectStateValidationFileBatch> }
      operation: import("./refreshExecutor").ProjectStateRefreshOperation
    },
    producer: Parameters<ProjectStateRefreshExecutor["processFiles"]>[1],
  ): ReturnType<ProjectStateRefreshExecutor["processFiles"]>
  close(): Promise<void>
}

export interface CreateProjectStateServiceOptions {
  readonly createWriter?: () => ProjectStateWriterHandle
  readonly createPool?: (
    concurrency: number,
    operation?: MetadataWorkerOperation,
    context?: ConfigurationContext,
  ) => ProjectStateServiceRefreshExecutor | ProjectStateServiceRefreshPool
  readonly workerPool?: MetadataWorkerPoolHandle
  readonly useWorkerOperation?: boolean
  readonly discoverFiles?: ProjectStateRefreshDependencies["discoverFiles"]
  readonly refresh?: (
    params: ProjectStateRefreshParams,
    dependencies: ProjectStateRefreshDependencies,
  ) => Promise<ProjectStateRefreshResult>
  readonly openReadSession?: (token: ProjectStateReadToken) => ProjectStateReadSession
}

export function createProjectStateService(
  options: CreateProjectStateServiceOptions = {},
): ProjectStateService {
  const createWriter = options.createWriter ?? (() => createProjectStateWriterHandle())
  const createPool = options.createPool
  const discoverFiles = options.discoverFiles
  const useWorkerOperation = options.useWorkerOperation ?? createPool === undefined
  const workers = options.workerPool ?? createIdleMetadataWorkerPoolHandle()
  const refresh = options.refresh ?? refreshProjectState
  const openReadSession = options.openReadSession ?? (() => {
    throw new Error("ProjectState read session factory is not configured")
  })
  let active: { readonly projectDir: string; readonly writer: ProjectStateWriterHandle } | undefined
  const retiredWriters = new Set<ProjectStateWriterHandle>()
  let sequence = Promise.resolve()
  let closing = false
  let closePromise: Promise<void> | undefined

  const service: ProjectStateService = {
    workers,
    beginImport(params) {
      return beginImportWithLease(params)
    },
    refreshAndValidate(params) {
      return runExclusive(async () => {
        const projectDir = await realpath(params.projectDir)
        const loadStartedAt = params.profile === undefined ? undefined : performance.now()
        const writer = await activate(projectDir)
        const loadMs = loadStartedAt === undefined ? undefined : performance.now() - loadStartedAt
        return runRefresh(writer, { ...params, projectDir }, {
          loadMs,
          ...(typeof params.profile === "object" ? { onPhase: params.profile.onPhase } : {}),
        })
      })
    },
    openReadSession(token) {
      if (closing) throw new Error("ProjectStateService закрыт")
      return openReadSession(token)
    },
    createReadToken(projectDir) {
      return runExclusive(async () => {
        const canonical = await realpath(projectDir)
        const writer = await activate(canonical)
        return writer.createReadToken()
      })
    },
    readComponentProjection(params) {
      return runExclusive(async () => {
        const projectDir = await realpath(params.projectDir)
        const writer = await activate(projectDir)
        const projection = await writer.readComponentProjection(params.componentPath)
        const hashBytes = projection.hashBytes.slice()
        if (hashBytes.byteOffset !== 0
          || hashBytes.byteLength !== projection.updates.length * 8
          || hashBytes.buffer.byteLength !== hashBytes.byteLength) {
          throw new Error("Проекция компонента получила несогласованный общий hashBytes")
        }
        return {
          componentPath: projection.componentPath,
          projectFiles: projection.updates.map(({ projectPath }) => ({ projectPath })),
          hashBytes,
        }
      })
    },
    reset(projectDir) {
      return runExclusive(async () => {
        const canonical = await realpath(projectDir)
        const writer = await activate(canonical)
        await writer.reset(canonical)
        await workers.clearProjectState()
        await removeBinaryProjectStateFiles(canonical)
      })
    },
    rebuild(params) {
      return runExclusive(async () => {
        const projectDir = await realpath(params.projectDir)
        const candidate = createWriter()
        const previous = active
        try {
          await candidate.openProject(projectDir)
          await candidate.reset(projectDir)
        } catch (caught) {
          throw await closePreservingPrimary(candidate, caught)
        }

        let result: ProjectStateRefreshResult
        try {
          result = await runRefresh(candidate, { ...params, projectDir }, { closePoolBeforeCheckpoint: true })
        } catch (caught) {
          throw await closePreservingPrimary(candidate, caught)
        }

        active = { projectDir, writer: candidate }
        await closeOrRetire(previous?.writer)
        return result
      })
    },
    close() {
      if (closePromise !== undefined) return closePromise
      closing = true
      closePromise = sequence.then(async () => {
        const writers = [
          ...(active === undefined ? [] : [active.writer]),
          ...retiredWriters,
        ]
        active = undefined
        retiredWriters.clear()
        const failures: unknown[] = []
        for (const writer of writers) {
          try {
            await writer.close()
          } catch (caught) {
            failures.push(...flattenFailures(caught))
          }
        }
        try {
          await workers.close()
        } catch (caught) {
          failures.push(...flattenFailures(caught))
        }
        if (failures.length > 0) throw new AggregateError(failures, errorMessage(failures[0]))
      })
      sequence = closePromise.then(() => undefined, () => undefined)
      return closePromise
    },
  }
  return service

  async function beginImportWithLease(params: ProjectStateImportParams): Promise<ProjectStateImportSession> {
    const release = await acquireExclusive()
    let candidate: ProjectStateWriterHandle | undefined
    try {
      const projectDir = await realpath(params.projectDir)
      const previous = active
      await previous?.writer.flushCheckpoint()
      candidate = createWriter()
      const importWriter = candidate
      let settled = false
      const session = await createProjectStateImportSession({
        ...params,
        projectDir,
        writer: importWriter,
        async publish(result) {
          if (settled) return
          await workers.installProjectState(result.readToken)
          settled = true
          active = { projectDir, writer: importWriter }
          await closeOrRetire(previous?.writer)
        },
        async discard() {
          if (settled) return
          settled = true
          try {
            await importWriter.close()
          } catch (caught) {
            retiredWriters.add(importWriter)
            throw caught
          }
        },
      })
      return importSessionWithLease(session, release)
    } catch (caught) {
      try {
        if (candidate === undefined) throw normalizeFailure(caught)
        throw await closePreservingPrimary(candidate, caught)
      } finally {
        release()
      }
    }
  }

  function importSessionWithLease(
    session: ProjectStateImportSession,
    release: () => void,
  ): ProjectStateImportSession {
    return {
      writeStateFragment: (fragment) => session.writeStateFragment(fragment),
      replaceFinalHashes: (files) => session.replaceFinalHashes(files),
      commitWorkingIndex: () => session.commitWorkingIndex(),
      createReadToken: () => session.createReadToken(),
      async finalize(beforeCheckpoint) {
        try {
          const result = await session.finalize(beforeCheckpoint)
          release()
          return result
        } catch (caught) {
          try {
            await session.abort(caught)
          } finally {
            release()
          }
          throw caught
        }
      },
      async abort(cause) {
        try {
          await session.abort(cause)
        } finally {
          release()
        }
      },
    }
  }

  async function acquireExclusive(): Promise<() => void> {
    if (closing) throw new Error("ProjectStateService закрыт")
    const previous = sequence
    let releaseLease!: () => void
    const lease = new Promise<void>((resolve) => { releaseLease = resolve })
    sequence = previous.then(() => lease)
    await previous
    let released = false
    return () => {
      if (released) return
      released = true
      releaseLease()
    }
  }

  async function runExclusive<T>(task: () => Promise<T>): Promise<T> {
    const release = await acquireExclusive()
    try {
      return await task()
    } finally {
      release()
    }
  }

  async function activate(projectDir: string): Promise<ProjectStateWriterHandle> {
    if (active?.projectDir === projectDir) return active.writer
    const writer = createWriter()
    try {
      await writer.openProject(projectDir)
    } catch (caught) {
      await writer.close().catch(() => undefined)
      throw caught
    }
    try {
      await active?.writer.close()
    } catch (caught) {
      await writer.close().catch(() => undefined)
      throw caught
    }
    active = { projectDir, writer }
    await workers.installProjectState(await writer.createReadToken())
    return writer
  }

  async function runRefresh(
    writer: ProjectStateWriterHandle,
    params: ProjectStateRefreshParams,
    options: {
      readonly closePoolBeforeCheckpoint?: boolean
      readonly loadMs?: number
      readonly onPhase?: NonNullable<Exclude<ProjectStateRefreshParams["profile"], true>>["onPhase"]
    } = {},
  ): Promise<ProjectStateRefreshResult> {
    const context = params.context ?? defaultContext()
    const concurrency = normalizeConcurrency(params.concurrency)
    const poolStart = performance.now()
    const previousWorkerCount = workers.size()
    const workerOperation = useWorkerOperation
      ? await workers.beginOperation({
          id: `project-state-refresh-${Date.now()}-${Math.random()}`,
          concurrency,
          context,
          ...(params.signal === undefined ? {} : { signal: params.signal }),
        })
      : undefined
    let workerPoolCreateMs = 0
    let workerReuseMs = 0
    if (useWorkerOperation) {
      const elapsedMs = performance.now() - poolStart
      if (workers.size() > previousWorkerCount) {
        workerPoolCreateMs = elapsedMs
        options.onPhase?.({ phase: "workerPoolCreate", elapsedMs })
      } else {
        workerReuseMs = elapsedMs
        options.onPhase?.({ phase: "workerReuse", elapsedMs })
      }
    }
    const pool = createPool === undefined
      ? createOperationOnlyRefreshExecutor(workerOperation)
      : createPool(concurrency, workerOperation, context)
    const executor = asRefreshExecutor(pool, context)
    let poolCloseStarted = false
    let poolClosePromise: Promise<void> | undefined
    const closePool = () => {
      poolCloseStarted = true
      poolClosePromise ??= pool.close()
      return poolClosePromise
    }
    let scheduleSaveMs = 0
    let saveStartedAt: number | undefined
    let snapshotPath: string | undefined
    let workerReadyMs = 0
    if (options.loadMs !== undefined) {
      const startedAt = performance.now()
      await pool.initValidation(context)
      workerReadyMs = performance.now() - startedAt
      options.onPhase?.({ phase: "workerReady", elapsedMs: workerReadyMs })
    }
    const phaseMs = {
      discoverFilesMs: 0,
      readBaselineMs: 0,
      processFilesMs: 0,
      readLocalDiagnosticsMs: 0,
      dependencyValidationMs: 0,
    }
    const measurePhase = async <T>(
      phase: "discoverFiles" | "readBaseline" | "processFiles" | "readLocalDiagnostics" | "dependencyValidation",
      action: () => Promise<T>,
    ): Promise<T> => {
      const startedAt = performance.now()
      try {
        return await action()
      } finally {
        const elapsedMs = performance.now() - startedAt
        phaseMs[`${phase}Ms`] += elapsedMs
        options.onPhase?.({ phase, elapsedMs })
      }
    }
    const refreshHandle = options.loadMs === undefined
      ? writer
      : {
          ...writer,
          readFileBaselinePathPage: (
            projectPaths: Parameters<ProjectStateWriterHandle["readFileBaselinePathPage"]>[0],
          ) => measurePhase("readBaseline", () => writer.readFileBaselinePathPage(projectPaths)),
          readLocalDiagnosticBatches: () => measurePhase(
            "readLocalDiagnostics",
            () => writer.readLocalDiagnosticBatches(),
          ),
          validateDependencyDiagnosticBatches: () => measurePhase(
            "dependencyValidation",
            () => writer.validateDependencyDiagnosticBatches(),
          ),
          async commitAndScheduleCheckpoint() {
            saveStartedAt = performance.now()
            const startedAt = performance.now()
            const checkpoint = await writer.commitAndScheduleCheckpoint()
            const elapsedMs = performance.now() - startedAt
            scheduleSaveMs += elapsedMs
            snapshotPath = checkpoint.snapshotPath
            options.onPhase?.({ phase: "scheduleSave", elapsedMs })
            return checkpoint
          },
        }
    let result: ProjectStateRefreshResult
    try {
      const dependencies = createProjectStateRefreshDependencies({
        handle: refreshHandle,
        executor,
        ...(discoverFiles === undefined ? {} : { discoverFiles }),
        afterProcessFiles: closePool,
        ...(options.closePoolBeforeCheckpoint === true ? { beforeCheckpoint: closePool } : {}),
      })
      result = await refresh(params, options.loadMs === undefined
        ? dependencies
        : {
            ...dependencies,
            discoverFiles: (refreshParams) => measureAsyncIterable(
              "discoverFiles",
              dependencies.discoverFiles(refreshParams),
              phaseMs,
              options.onPhase,
            ),
            processFiles: (batches, producer, operation, projectDir) => measurePhase(
              "processFiles",
              () => dependencies.processFiles(batches, producer, operation, projectDir),
            ),
          })
    } catch (caught) {
      if (poolCloseStarted) throw normalizeFailure(caught)
      try {
        await closePool()
      } catch (cleanupFailure) {
        throw aggregateCleanupFailure(caught, cleanupFailure)
      }
      throw normalizeFailure(caught)
    }
    await closePool()
    await workers.installProjectState(result.readToken)
    if (options.loadMs === undefined) return result
    await writer.flushCheckpoint()
    const saveBinaryMs = saveStartedAt === undefined ? 0 : performance.now() - saveStartedAt
    options.onPhase?.({ phase: "saveBinary", elapsedMs: saveBinaryMs })
    if (snapshotPath === undefined) throw new Error("Профиль состояния проекта не получил путь checkpoint")
    return {
      ...result,
      profile: {
        snapshotBytes: (await stat(snapshotPath)).size,
        loadMs: options.loadMs,
        scheduleSaveMs,
        saveBinaryMs,
        workerPoolCreateMs,
        workerReadyMs,
        workerReuseMs,
        ...phaseMs,
      },
    }
  }

  async function closeOrRetire(writer: ProjectStateWriterHandle | undefined): Promise<void> {
    if (writer === undefined) return
    try {
      await writer.close()
    } catch {
      retiredWriters.add(writer)
    }
  }

  async function closePreservingPrimary(writer: ProjectStateWriterHandle, primary: unknown): Promise<unknown> {
    try {
      await writer.close()
      return normalizeFailure(primary)
    } catch (cleanupFailure) {
      return aggregateCleanupFailure(primary, cleanupFailure)
    }
  }

  function aggregateCleanupFailure(primary: unknown, cleanupFailure: unknown): AggregateError {
    const primaryErrors = flattenFailures(primary)
    return new AggregateError(
      [...primaryErrors, ...flattenFailures(cleanupFailure)],
      errorMessage(primaryErrors[0] ?? primary),
    )
  }
}

async function removeBinaryProjectStateFiles(projectDir: string): Promise<void> {
  const target = projectStateBinaryPath(projectDir)
  const directory = dirname(target)
  let names: string[]
  try {
    names = await readdir(directory)
  } catch {
    return
  }
  const targetName = basename(target)
  await Promise.all(names
    .filter((name) => name === targetName || (name.startsWith(`.${targetName}.`) && name.endsWith(".tmp")))
    .map((name) => rm(join(directory, name), { force: true })))
}

function flattenFailures(caught: unknown): unknown[] {
  return caught instanceof AggregateError
    ? caught.errors.flatMap((failure) => flattenFailures(failure))
    : [caught]
}

function normalizeFailure(caught: unknown): unknown {
  if (!(caught instanceof AggregateError)) return caught
  const errors = flattenFailures(caught)
  return new AggregateError(errors, errorMessage(errors[0] ?? caught))
}

function errorMessage(caught: unknown): string {
  return caught instanceof Error ? caught.message : String(caught)
}

function normalizeConcurrency(value: number | undefined): number {
  if (value !== undefined) {
    if (!Number.isInteger(value) || value < 1) throw new Error("concurrency должен быть положительным целым числом")
    return value
  }
  return Math.max(1, Math.min(4, availableParallelism() - 1))
}

function defaultContext(): ConfigurationContext {
  return {
    version: "2.20",
    languages: createConfigurationLanguages({ default: "ru", registered: ["ru"] }),
    exportToYAML: { toTyped: false },
  }
}

function createIdleMetadataWorkerPoolHandle(): MetadataWorkerPoolHandle {
  return {
    async beginOperation() {
      throw new Error("Metadata worker pool is not configured")
    },
    async installProjectState() {},
    async clearProjectState() {},
    size: () => 0,
    async close() {},
  }
}

function asRefreshExecutor(
  pool: ProjectStateServiceRefreshExecutor | ProjectStateServiceRefreshPool,
  context: ConfigurationContext,
): ProjectStateServiceRefreshExecutor {
  if ("processFiles" in pool) return pool
  return {
    begin: createProjectStateRefreshOperation,
    initValidation: (validationContext) => pool.initValidation(validationContext),
    processFiles: (batches, producer, operation, projectDir) => pool.runProjectStateRefresh({
      projectDir,
      context,
      source: { batches },
      operation,
    }, producer),
    close: () => pool.close(),
  }
}

function createOperationOnlyRefreshExecutor(
  operation: MetadataWorkerOperation | undefined,
): ProjectStateServiceRefreshExecutor {
  if (operation === undefined) throw new Error("ProjectState refresh executor factory is not configured")
  return {
    begin: createProjectStateRefreshOperation,
    async initValidation() {},
    async processFiles() {
      throw new Error("ProjectState refresh processFiles is not configured")
    },
    close: () => operation.finish("success"),
  }
}
