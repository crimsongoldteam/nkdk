import { availableParallelism } from "node:os"
import { realpath } from "node:fs/promises"
import type { ConfigurationContext } from "../context/types"
import {
  createPreparedYamlProjectWorkerPool,
  type PreparedYamlProjectWorkerPool,
} from "../project/preparedYamlProjectWorkerPool"
import { createProjectStateWriterHandle, type ProjectStateWriterHandle } from "./writerHandle"
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
  refreshAndValidate(params: ProjectStateRefreshParams): Promise<ProjectStateRefreshResult>
  readComponentProjection(params: {
    readonly projectDir: string
    readonly componentPath: string
  }): Promise<ProjectStateComponentProjection>
  reset(projectDir: string): Promise<void>
  rebuild(params: ProjectStateRefreshParams): Promise<ProjectStateRefreshResult>
  close(): Promise<void>
}

export interface CreateProjectStateServiceOptions {
  readonly createWriter?: () => ProjectStateWriterHandle
  readonly createPool?: (concurrency: number) => PreparedYamlProjectWorkerPool
  readonly refresh?: (
    params: ProjectStateRefreshParams,
    dependencies: ProjectStateRefreshDependencies,
  ) => Promise<ProjectStateRefreshResult>
}

export function createProjectStateService(
  options: CreateProjectStateServiceOptions = {},
): ProjectStateService {
  const createWriter = options.createWriter ?? (() => createProjectStateWriterHandle())
  const createPool = options.createPool ?? ((concurrency) => createPreparedYamlProjectWorkerPool({ concurrency }))
  const refresh = options.refresh ?? refreshProjectState
  let active: { readonly projectDir: string; readonly writer: ProjectStateWriterHandle } | undefined
  let sequence = Promise.resolve()
  let closing = false
  let closePromise: Promise<void> | undefined

  const service: ProjectStateService = {
    refreshAndValidate(params) {
      return runExclusive(async () => {
        const projectDir = await realpath(params.projectDir)
        const writer = await activate(projectDir)
        return runRefresh(writer, { ...params, projectDir })
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
      })
    },
    rebuild(params) {
      return runExclusive(async () => {
        const projectDir = await realpath(params.projectDir)
        const candidate = createWriter()
        try {
          await candidate.openProject(projectDir)
          await candidate.reset(projectDir)
          const result = await runRefresh(candidate, { ...params, projectDir })
          await active?.writer.close()
          active = { projectDir, writer: candidate }
          return result
        } catch (caught) {
          await candidate.close().catch(() => undefined)
          throw caught
        }
      })
    },
    close() {
      if (closePromise !== undefined) return closePromise
      closing = true
      closePromise = sequence.then(async () => {
        await active?.writer.close()
        active = undefined
      })
      sequence = closePromise.then(() => undefined, () => undefined)
      return closePromise
    },
  }
  return service

  function runExclusive<T>(task: () => Promise<T>): Promise<T> {
    if (closing) return Promise.reject(new Error("ProjectStateService закрыт"))
    const result = sequence.then(task, task)
    sequence = result.then(() => undefined, () => undefined)
    return result
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
  ): Promise<ProjectStateRefreshResult> {
    const pool = createPool(normalizeConcurrency(params.concurrency))
    const context = params.context ?? defaultContext()
    try {
      return await refresh(params, createProjectStateRefreshDependencies({ handle: writer, pool, context }))
    } finally {
      await pool.close()
    }
  }
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
