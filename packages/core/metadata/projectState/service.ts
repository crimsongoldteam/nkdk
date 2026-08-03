import { availableParallelism } from "node:os"
import { realpath, rm, stat } from "node:fs/promises"
import { performance } from "node:perf_hooks"
import type { ConfigurationContext } from "../context/types"
import type { ProjectStateReadToken } from "./contracts"
import type { ProjectStateReadSession } from "./readSession"
import {
  createProjectStateImportSession,
  type ProjectStateImportParams,
  type ProjectStateImportSession,
} from "./importSession"
import { openSqliteProjectStateReadSession } from "./sqlite/readSession"
import {
  createPreparedYamlProjectWorkerPool,
  type PreparedYamlProjectWorkerPool,
} from "../project/preparedYamlProjectWorkerPool"
import { createProjectStateWriterHandle, type ProjectStateWriterHandle } from "./writerHandle"
import { projectStateSnapshotPath } from "./sqlite/persistence"
import {
  createProjectStateRefreshDependencies,
  refreshProjectState,
  type ProjectStateRefreshDependencies,
  type ProjectStateRefreshParams,
  type ProjectStateRefreshResult,
} from "./refresh"

export interface ProjectStateComponentProjection {
  readonly componentPath: string
  readonly projectFiles: readonly { readonly projectPath: string }[]
  readonly hashBytes: Uint8Array
}

export interface ProjectStateService {
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

export const openProjectStateReadSession = openSqliteProjectStateReadSession

export interface CreateProjectStateServiceOptions {
  readonly createWriter?: () => ProjectStateWriterHandle
  readonly createPool?: (concurrency: number) => PreparedYamlProjectWorkerPool
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
  const createPool = options.createPool ?? ((concurrency) => createPreparedYamlProjectWorkerPool({ concurrency }))
  const refresh = options.refresh ?? refreshProjectState
  const openReadSession = options.openReadSession ?? openSqliteProjectStateReadSession
  let active: { readonly projectDir: string; readonly writer: ProjectStateWriterHandle } | undefined
  const retiredWriters = new Set<ProjectStateWriterHandle>()
  let sequence = Promise.resolve()
  let closing = false
  let closePromise: Promise<void> | undefined

  const service: ProjectStateService = {
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
        await rm(projectStateSnapshotPath(canonical), { force: true })
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
      candidate = createWriter()
      const importWriter = candidate
      const previous = active
      let settled = false
      const session = await createProjectStateImportSession({
        ...params,
        projectDir,
        writer: importWriter,
        async publish() {
          if (settled) return
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
      writeFirstPassBatch: (batch) => session.writeFirstPassBatch(batch),
      registerFileIdentities: (files) => session.registerFileIdentities(files),
      commitWorkingIndex: () => session.commitWorkingIndex(),
      createReadToken: () => session.createReadToken(),
      writeFinalFileState: (batch) => session.writeFinalFileState(batch),
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
    const pool = createPool(normalizeConcurrency(params.concurrency))
    const context = params.context ?? defaultContext()
    let poolCloseStarted = false
    let poolClosePromise: Promise<void> | undefined
    const closePool = () => {
      poolCloseStarted = true
      poolClosePromise ??= pool.close()
      return poolClosePromise
    }
    let checkpointMs = 0
    let snapshotPath: string | undefined
    const phaseMs = {
      discoverFilesMs: 0,
      readBaselineMs: 0,
      processFilesMs: 0,
      readLocalDiagnosticsMs: 0,
      dependencyValidationMs: 0,
    }
    const measurePhase = async <T>(
      phase: Exclude<import("./refresh").ProjectStateProfilePhase, "checkpoint">,
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
          readFileBaseline: (files: Parameters<ProjectStateWriterHandle["readFileBaseline"]>[0]) =>
            measurePhase("readBaseline", () => writer.readFileBaseline(files)),
          readLocalDiagnostics: () => measurePhase("readLocalDiagnostics", () => writer.readLocalDiagnostics()),
          validateDependencies: () => measurePhase("dependencyValidation", () => writer.validateDependencies()),
          async commitAndCheckpoint() {
            const startedAt = performance.now()
            const checkpoint = await writer.commitAndCheckpoint()
            const elapsedMs = performance.now() - startedAt
            checkpointMs += elapsedMs
            snapshotPath = checkpoint.snapshotPath
            options.onPhase?.({ phase: "checkpoint", elapsedMs })
            return checkpoint
          },
        }
    let result: ProjectStateRefreshResult
    try {
      const dependencies = createProjectStateRefreshDependencies({
        handle: refreshHandle,
        pool,
        context,
        ...(options.closePoolBeforeCheckpoint === true ? { beforeCheckpoint: closePool } : {}),
      })
      result = await refresh(params, options.loadMs === undefined
        ? dependencies
        : {
            ...dependencies,
            discoverFiles: (refreshParams) => measurePhase("discoverFiles", () => dependencies.discoverFiles(refreshParams)),
            processFiles: (files, baseline, producer, operation, projectDir) => measurePhase(
              "processFiles",
              () => dependencies.processFiles(files, baseline, producer, operation, projectDir),
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
    if (options.loadMs === undefined) return result
    if (snapshotPath === undefined) throw new Error("Профиль состояния проекта не получил путь checkpoint")
    return {
      ...result,
      profile: {
        snapshotBytes: (await stat(snapshotPath)).size,
        loadMs: options.loadMs,
        checkpointMs,
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
  return { version: "2.20", defaultLanguage: "ru", exportToYAML: { toTyped: false } }
}
