import { mkdtemp, realpath, rm, symlink } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, it, vi } from "vitest"
import type { PreparedYamlProjectWorkerPool } from "../project/preparedYamlProjectWorkerPool"
import type { ProjectStateRefreshResult } from "./refresh"
import { createProjectStateService } from "./service"
import type { ProjectStateWriterHandle } from "./writerHandle"

const tempDirs: string[] = []

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })))
})

describe("ProjectStateService", () => {
  it("нормализует projectDir через realpath и последовательно выполняет параллельные актуализации", async () => {
    const projectDir = await mkdtemp(join(tmpdir(), "nkdk-project-state-service-"))
    tempDirs.push(projectDir)
    const alias = `${projectDir}-alias`
    tempDirs.push(alias)
    await symlink(projectDir, alias)
    const handle = testWriterHandle(1)
    let active = 0
    let maxActive = 0
    let releaseFirst!: () => void
    const firstGate = new Promise<void>((resolve) => { releaseFirst = resolve })
    let calls = 0
    const service = createProjectStateService({
      createWriter: () => handle,
      createPool: () => testPool(),
      async refresh(_params, _dependencies) {
        calls += 1
        active += 1
        maxActive = Math.max(maxActive, active)
        if (calls === 1) await firstGate
        active -= 1
        return refreshResult(calls)
      },
    })

    const first = service.refreshAndValidate({ projectDir })
    const second = service.refreshAndValidate({ projectDir: alias })
    await vi.waitFor(() => expect(calls).toBe(1))
    releaseFirst()
    await Promise.all([first, second])

    expect(maxActive).toBe(1)
    expect(handle.opened).toEqual([await realpath(projectDir)])
    await service.close()
  })

  it("при технической ошибке rebuild сохраняет прежнее активное состояние", async () => {
    const projectDir = await mkdtemp(join(tmpdir(), "nkdk-project-state-rebuild-"))
    tempDirs.push(projectDir)
    const old = testWriterHandle(1)
    const candidate = testWriterHandle(2)
    const handles = [old, candidate]
    let refreshCalls = 0
    const service = createProjectStateService({
      createWriter: () => handles.shift()!,
      createPool: () => testPool(),
      async refresh(_params, _dependencies) {
        refreshCalls += 1
        if (refreshCalls === 2) throw new Error("checkpoint failed")
        return refreshResult(refreshCalls)
      },
    })

    await service.refreshAndValidate({ projectDir })
    await expect(service.rebuild({ projectDir })).rejects.toThrow("checkpoint failed")
    const projectFiles = await readProjectFiles(service, projectDir)

    expect(projectFiles).toEqual([{ projectPath: "old-1" }])
    expect(old.closed).toBe(0)
    expect(candidate.closed).toBe(1)
    await service.close()
  })

  it("не маскирует ошибку refresh ошибкой закрытия pool", async () => {
    const projectDir = await mkdtemp(join(tmpdir(), "nkdk-project-state-refresh-cleanup-"))
    tempDirs.push(projectDir)
    const primary = new Error("refresh failed")
    const cleanup = new Error("pool close failed")
    const service = createProjectStateService({
      createWriter: () => testWriterHandle(1),
      createPool: () => ({ close: async () => { throw cleanup } }) as unknown as PreparedYamlProjectWorkerPool,
      async refresh() { throw primary },
    })

    const failure = await service.refreshAndValidate({ projectDir }).catch((caught: unknown) => caught)

    expect(failure).toBeInstanceOf(AggregateError)
    expect((failure as AggregateError).errors).toEqual([primary, cleanup])
    expect((failure as Error).message).toBe("refresh failed")
    await service.close()
  })

  it("нормализует primary AggregateError обычного refresh при успешном pool cleanup", async () => {
    const projectDir = await mkdtemp(join(tmpdir(), "nkdk-project-state-primary-refresh-"))
    tempDirs.push(projectDir)
    const { failure, leaves } = nestedPrimaryFailure()
    const service = createProjectStateService({
      createWriter: () => testWriterHandle(1),
      createPool: () => testPool(),
      async refresh() { throw failure },
    })

    const caught = await service.refreshAndValidate({ projectDir }).catch((reason: unknown) => reason)

    expectNormalizedFailure(caught, leaves)
    await service.close()
  })

  it("нормализует primary AggregateError rebuild при успешном candidate cleanup", async () => {
    const projectDir = await mkdtemp(join(tmpdir(), "nkdk-project-state-primary-rebuild-"))
    tempDirs.push(projectDir)
    const old = testWriterHandle(1)
    const candidate = testWriterHandle(2)
    const handles = [old, candidate]
    const { failure, leaves } = nestedPrimaryFailure()
    let refreshCalls = 0
    const service = createProjectStateService({
      createWriter: () => handles.shift()!,
      createPool: () => testPool(),
      async refresh() {
        refreshCalls += 1
        if (refreshCalls === 2) throw failure
        return refreshResult(refreshCalls)
      },
    })

    await expectNormalizedRebuildFailure(service, projectDir, leaves)
    expect(old.closed).toBe(0)
    expect(candidate.closed).toBe(1)
    await service.close()
  })

  it("нормализует primary AggregateError после публикации при успешном writer cleanup", async () => {
    const projectDir = await mkdtemp(join(tmpdir(), "nkdk-project-state-primary-published-"))
    tempDirs.push(projectDir)
    const old = testWriterHandle(1)
    const candidate = testWriterHandle(2)
    const handles = [old, candidate]
    const { failure, leaves } = nestedPrimaryFailure()
    let poolCalls = 0
    const service = createProjectStateService({
      createWriter: () => handles.shift()!,
      createPool: () => {
        poolCalls += 1
        return {
          close: async () => { if (poolCalls === 2) throw failure },
        } as PreparedYamlProjectWorkerPool
      },
      async refresh() { return refreshResult(poolCalls) },
    })

    await expectNormalizedRebuildFailure(service, projectDir, leaves)
    expect(old.closed).toBe(1)
    expect(candidate.closed).toBe(0)
    await service.close()
  })

  it("рекурсивно распрямляет primary, rollback, pool и candidate cleanup до публикации", async () => {
    const projectDir = await mkdtemp(join(tmpdir(), "nkdk-project-state-nested-cleanup-"))
    tempDirs.push(projectDir)
    const old = testWriterHandle(1)
    const candidate = testWriterHandle(2)
    const handles = [old, candidate]
    const primary = new Error("refresh failed")
    const rollbackCleanup = new Error("rollback failed")
    const poolCleanup = new Error("pool close failed")
    const candidateCleanup = new Error("candidate close failed")
    const closeCandidate = candidate.close.bind(candidate)
    candidate.close = async () => {
      await closeCandidate()
      throw candidateCleanup
    }
    let poolCalls = 0
    let refreshCalls = 0
    const service = createProjectStateService({
      createWriter: () => handles.shift()!,
      createPool: () => {
        poolCalls += 1
        return {
          close: async () => { if (poolCalls === 2) throw poolCleanup },
        } as PreparedYamlProjectWorkerPool
      },
      async refresh() {
        refreshCalls += 1
        if (refreshCalls === 2) {
          throw new AggregateError([
            primary,
            new AggregateError([rollbackCleanup], "nested rollback"),
          ], "nested refresh")
        }
        return refreshResult(refreshCalls)
      },
    })

    await service.refreshAndValidate({ projectDir })
    const failure = await service.rebuild({ projectDir }).catch((caught: unknown) => caught)

    expect(failure).toBeInstanceOf(AggregateError)
    expect((failure as AggregateError).errors).toEqual([primary, rollbackCleanup, poolCleanup, candidateCleanup])
    expect((failure as Error).message).toBe("refresh failed")
    expect(old.closed).toBe(0)
    await service.close()
  })

  it("после checkpoint сохраняет candidate активным при ошибке закрытия rebuild pool", async () => {
    const projectDir = await mkdtemp(join(tmpdir(), "nkdk-project-state-rebuild-pool-cleanup-"))
    tempDirs.push(projectDir)
    const old = testWriterHandle(1)
    const candidate = testWriterHandle(2)
    const handles = [old, candidate]
    const cleanup = new Error("rebuild pool close failed")
    let poolCalls = 0
    const service = createProjectStateService({
      createWriter: () => handles.shift()!,
      createPool: () => {
        poolCalls += 1
        return {
          close: async () => { if (poolCalls === 2) throw cleanup },
        } as PreparedYamlProjectWorkerPool
      },
      async refresh() { return refreshResult(poolCalls) },
    })

    await expectPublishedCandidateAfterFailedRebuild(service, projectDir, cleanup)
    expect(old.closed).toBe(1)
    expect(candidate.closed).toBe(0)
    await service.close()
  })

  it("после checkpoint сохраняет candidate активным при ошибке закрытия прежнего writer", async () => {
    const projectDir = await mkdtemp(join(tmpdir(), "nkdk-project-state-rebuild-writer-cleanup-"))
    tempDirs.push(projectDir)
    const old = testWriterHandle(1)
    const candidate = testWriterHandle(2)
    const handles = [old, candidate]
    const cleanup = new Error("old writer close failed")
    const closeOld = old.close.bind(old)
    old.close = async () => {
      await closeOld()
      if (old.closed === 1) throw cleanup
    }
    const service = createProjectStateService({
      createWriter: () => handles.shift()!,
      createPool: () => testPool(),
      async refresh() { return refreshResult(2) },
    })

    await expectPublishedCandidateAfterFailedRebuild(service, projectDir, cleanup)
    expect(candidate.closed).toBe(0)
    await service.close()
  })

  it("агрегирует ошибки закрытия rebuild pool и прежнего writer после публикации candidate", async () => {
    const projectDir = await mkdtemp(join(tmpdir(), "nkdk-project-state-rebuild-cleanup-errors-"))
    tempDirs.push(projectDir)
    const old = testWriterHandle(1)
    const candidate = testWriterHandle(2)
    const handles = [old, candidate]
    const poolCleanup = [new Error("rebuild pool close failed"), new Error("pool secondary failed")]
    const writerCleanup = [new Error("old writer close failed"), new Error("writer secondary failed")]
    let poolCalls = 0
    const closeOld = old.close.bind(old)
    old.close = async () => {
      await closeOld()
      if (old.closed === 1) throw new AggregateError(writerCleanup, "old writer cleanup")
    }
    const service = createProjectStateService({
      createWriter: () => handles.shift()!,
      createPool: () => {
        poolCalls += 1
        return {
          close: async () => {
            if (poolCalls === 2) throw new AggregateError(poolCleanup, "rebuild pool cleanup")
          },
        } as PreparedYamlProjectWorkerPool
      },
      async refresh() { return refreshResult(poolCalls) },
    })

    await service.refreshAndValidate({ projectDir })
    const failure = await service.rebuild({ projectDir }).catch((caught: unknown) => caught)
    const projectFiles = await readProjectFiles(service, projectDir)

    expect(failure).toBeInstanceOf(AggregateError)
    expect((failure as AggregateError).errors).toEqual([...poolCleanup, ...writerCleanup])
    expect(projectFiles).toEqual([{ projectPath: "old-2" }])
    expect(candidate.closed).toBe(0)
    await service.close()
  })

  it("rebuild меняет активное состояние только после успешного завершения refresh checkpoint", async () => {
    const projectDir = await mkdtemp(join(tmpdir(), "nkdk-project-state-rebuild-success-"))
    tempDirs.push(projectDir)
    const old = testWriterHandle(1)
    const candidate = testWriterHandle(2)
    const handles = [old, candidate]
    let calls = 0
    const refreshedProjectDirs: string[] = []
    let finishCheckpoint!: () => void
    const checkpoint = new Promise<void>((resolve) => { finishCheckpoint = resolve })
    const service = createProjectStateService({
      createWriter: () => handles.shift()!,
      createPool: () => testPool(),
      async refresh(params) {
        calls += 1
        refreshedProjectDirs.push(params.projectDir)
        if (calls === 2) await checkpoint
        return refreshResult(calls)
      },
    })

    await service.refreshAndValidate({ projectDir })
    const rebuilding = service.rebuild({ projectDir })
    await vi.waitFor(() => expect(calls).toBe(2))
    expect(old.closed).toBe(0)
    finishCheckpoint()
    await rebuilding
    const projectFiles = await readProjectFiles(service, projectDir)

    expect(old.closed).toBe(1)
    expect(candidate.opened).toEqual([await realpath(projectDir)])
    expect(refreshedProjectDirs).toEqual([await realpath(projectDir), await realpath(projectDir)])
    expect(projectFiles).toEqual([{ projectPath: "old-2" }])
    await service.close()
  })

  it("rebuild строит состояние без ранее активного проекта", async () => {
    const projectDir = await mkdtemp(join(tmpdir(), "nkdk-project-state-rebuild-cold-"))
    tempDirs.push(projectDir)
    const candidate = testWriterHandle(1)
    const service = createProjectStateService({
      createWriter: () => candidate,
      createPool: () => testPool(),
      async refresh() { return refreshResult(1) },
    })

    await expect(service.rebuild({ projectDir })).resolves.toEqual(refreshResult(1))
    expect(candidate.opened).toEqual([await realpath(projectDir)])
    expect(candidate.closed).toBe(0)
    await service.close()
  })

  it("переключает проект только после текущей операции и открывает новый до закрытия старого", async () => {
    const firstDir = await mkdtemp(join(tmpdir(), "nkdk-project-state-switch-a-"))
    const secondDir = await mkdtemp(join(tmpdir(), "nkdk-project-state-switch-b-"))
    tempDirs.push(firstDir, secondDir)
    const events: string[] = []
    const firstWriter = testWriterHandle(1)
    const secondWriter = testWriterHandle(2)
    const firstClose = firstWriter.close.bind(firstWriter)
    firstWriter.close = async () => { events.push("close-first"); await firstClose() }
    const secondOpen = secondWriter.openProject.bind(secondWriter)
    secondWriter.openProject = async (dir) => { events.push("open-second"); await secondOpen(dir) }
    const writers = [firstWriter, secondWriter]
    let finishFirst!: () => void
    const firstGate = new Promise<void>((resolve) => { finishFirst = resolve })
    let calls = 0
    const service = createProjectStateService({
      createWriter: () => writers.shift()!,
      createPool: () => testPool(),
      async refresh() {
        calls += 1
        if (calls === 1) await firstGate
        return refreshResult(calls)
      },
    })

    const first = service.refreshAndValidate({ projectDir: firstDir })
    const second = service.refreshAndValidate({ projectDir: secondDir })
    await vi.waitFor(() => expect(calls).toBe(1))
    expect(secondWriter.opened).toEqual([])
    expect(firstWriter.closed).toBe(0)
    finishFirst()
    await Promise.all([first, second])

    expect(events).toEqual(["open-second", "close-first"])
    await service.close()
  })

  it("возвращает позиционную проекцию с собственным общим hashBytes точной длины", async () => {
    const projectDir = await mkdtemp(join(tmpdir(), "nkdk-project-state-projection-"))
    tempDirs.push(projectDir)
    const writer = testWriterHandle(1)
    const source = new Uint8Array(new ArrayBuffer(17), 1, 16)
    source.set(Array.from({ length: 16 }, (_, index) => index + 1))
    writer.readComponentProjection = async (componentPath) => ({
      componentPath,
      updates: [
        { kind: "resource", projectPath: "cf/a.bin", componentPath, resourceKind: "resource" },
        { kind: "resource", projectPath: "cf/b.bin", componentPath, resourceKind: "resource" },
      ],
      hashBytes: source,
    })
    const service = createProjectStateService({ createWriter: () => writer, createPool: () => testPool() })

    const projection = await service.readComponentProjection({ projectDir, componentPath: "cf" })

    expect(projection.projectFiles).toEqual([{ projectPath: "cf/a.bin" }, { projectPath: "cf/b.bin" }])
    expect(projection.hashBytes).toEqual(Uint8Array.from({ length: 16 }, (_, index) => index + 1))
    expect(projection.hashBytes.byteOffset).toBe(0)
    expect(projection.hashBytes.byteLength).toBe(16)
    expect(projection.hashBytes.buffer.byteLength).toBe(16)
    await service.close()
  })

  it("reset канонизирует путь и не запускает построение состояния", async () => {
    const projectDir = await mkdtemp(join(tmpdir(), "nkdk-project-state-reset-"))
    tempDirs.push(projectDir)
    const alias = `${projectDir}-alias`
    tempDirs.push(alias)
    await symlink(projectDir, alias)
    const writer = testWriterHandle(1)
    let refreshCalls = 0
    const service = createProjectStateService({
      createWriter: () => writer,
      createPool: () => testPool(),
      async refresh() { refreshCalls += 1; return refreshResult(refreshCalls) },
    })

    await service.reset(alias)

    expect(writer.resets).toEqual([await realpath(projectDir)])
    expect(refreshCalls).toBe(0)
    await service.close()
  })
})

type TestWriter = ProjectStateWriterHandle & { opened: string[]; resets: string[]; closed: number }

function testWriterHandle(id: number): TestWriter {
  const opened: string[] = []
  const writer: TestWriter = {
    opened,
    resets: [],
    closed: 0,
    async openProject(projectDir) { opened.push(projectDir) },
    async compareFiles() { return { changed: [], deleted: [] } },
    async readLocalDiagnostics() { return [] },
    async validateDependencies() { return [] },
    async createReadToken() { return new Uint8Array([id]) as never },
    async readComponentProjection(componentPath) {
      return {
        componentPath,
        updates: [{ kind: "resource", projectPath: `old-${id}`, componentPath, resourceKind: "resource" }],
        hashBytes: new Uint8Array(8),
      }
    },
    async beginUpdate() {},
    async writeBatch() {},
    async deleteFiles() {},
    async commitAndCheckpoint() { return { snapshotPath: "snapshot" } },
    async rollbackUpdate() {},
    async reset(projectDir) {
      if (opened.at(-1) !== projectDir) throw new Error("reset before open")
      writer.resets.push(projectDir)
    },
    async close() { writer.closed += 1 },
  }
  return writer
}

function testPool(): PreparedYamlProjectWorkerPool {
  return { close: async () => undefined } as PreparedYamlProjectWorkerPool
}

async function readProjectFiles(
  service: ReturnType<typeof createProjectStateService>,
  projectDir: string,
): Promise<readonly { readonly projectPath: string }[]> {
  return (await service.readComponentProjection({ projectDir, componentPath: "cf" })).projectFiles
}

async function expectPublishedCandidateAfterFailedRebuild(
  service: ReturnType<typeof createProjectStateService>,
  projectDir: string,
  expectedFailure: Error,
): Promise<void> {
  await service.refreshAndValidate({ projectDir })
  await expect(service.rebuild({ projectDir })).rejects.toBe(expectedFailure)
  await expect(readProjectFiles(service, projectDir)).resolves.toEqual([{ projectPath: "old-2" }])
}

function refreshResult(value: number): ProjectStateRefreshResult {
  return {
    diagnostics: [],
    readToken: new Uint8Array([value]) as never,
    stats: { hashedFiles: 0, parsedYamlFiles: 0, changedFiles: 0, deletedFiles: 0 },
  }
}

function nestedPrimaryFailure() {
  const primary = new Error("primary failed")
  const secondary = new Error("secondary failed")
  return {
    failure: new AggregateError([
      primary,
      new AggregateError([secondary], "nested secondary"),
    ], "outer failure"),
    leaves: [primary, secondary],
  }
}

function expectNormalizedFailure(caught: unknown, leaves: readonly Error[]): void {
  expect(caught).toBeInstanceOf(AggregateError)
  expect((caught as AggregateError).errors).toEqual(leaves)
  expect((caught as Error).message).toBe(leaves[0]?.message)
}

async function expectNormalizedRebuildFailure(
  service: ReturnType<typeof createProjectStateService>,
  projectDir: string,
  leaves: readonly Error[],
): Promise<void> {
  await service.refreshAndValidate({ projectDir })
  const caught = await service.rebuild({ projectDir }).catch((reason: unknown) => reason)
  expectNormalizedFailure(caught, leaves)
}
