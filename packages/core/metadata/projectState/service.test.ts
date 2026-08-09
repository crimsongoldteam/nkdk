import { access, mkdir, mkdtemp, readFile, realpath, rm, symlink, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import type { PreparedYamlProjectWorkerPool } from "../project/preparedYamlProjectWorkerPool"
import type { ProjectStateRefreshDependencies, ProjectStateRefreshResult } from "./refresh"
import { createProjectStateService, type CreateProjectStateServiceOptions } from "./service"
import { openProjectStateReadSession } from "../composition/projectState"
import type { ProjectStateWriterHandle } from "./writerHandle"
import type { ProjectStateReadToken } from "./contracts"
import { buildProjectStateSnapshot } from "./binary/builder"
import { createBinaryProjectStateReadToken } from "./binary/readToken"
import { createMetadataWorkerPoolHandle } from "../workerPool/handle"
import { createMetadataWorkerLineFactory } from "../../tests/metadataWorkerTestPool"
import { createMetadataDiagnosticCollectionFromDiagnostics } from "../diagnostics/collection"

const tempDirs: string[] = []

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })))
})

describe("ProjectStateService", () => {
  it("переиспользует растущий пул между актуализациями и закрывает его вместе с сервисом", async () => {
    const projectDir = await mkdtemp(join(tmpdir(), "nkdk-project-state-worker-lifecycle-"))
    tempDirs.push(projectDir)
    const lines = createMetadataWorkerLineFactory()
    const workers = createMetadataWorkerPoolHandle({ createLine: lines.factory })
    const service = createProjectStateService({
      createWriter: () => testWriterHandle(1),
      workerPool: workers,
      async refresh() { return refreshResult(1) },
    })

    await service.refreshAndValidate({ projectDir, concurrency: 1 })
    await service.refreshAndValidate({ projectDir, concurrency: 3 })
    await service.refreshAndValidate({ projectDir, concurrency: 1 })

    expect(service.workers).toBe(workers)
    expect(lines.created()).toBe(3)
    expect(lines.destroyed()).toEqual([0, 0, 0])

    await service.close()
    expect(lines.destroyed()).toEqual([1, 1, 1])
  })

  it("публикует новый снимок в worker после проверки зависимостей и очищает при reset", async () => {
    const projectDir = await mkdtemp(join(tmpdir(), "nkdk-project-state-worker-publication-"))
    tempDirs.push(projectDir)
    const events: string[] = []
    const lines = createMetadataWorkerLineFactory((command) => {
      if (command.kind === "installProjectState") events.push("install")
      if (command.kind === "clearProjectState") events.push("clear")
      if (command.kind === "runOperation") {
        return { kind: "probeResult", value: command.command.kind }
      }
      return undefined
    })
    const workers = createMetadataWorkerPoolHandle({ createLine: lines.factory })
    const writer = testWriterHandle(1)
    writer.validateDependencyDiagnosticBatches = async () => { events.push("dependencies"); return [] }
    writer.commitAndScheduleCheckpoint = async () => {
      events.push("checkpoint")
      return { snapshotPath: "snapshot" }
    }
    const service = createProjectStateService({
      createWriter: () => writer,
      workerPool: workers,
      async refresh(_params, dependencies) {
        await dependencies.handle.validateDependencyDiagnosticBatches()
        await dependencies.handle.commitAndScheduleCheckpoint()
        return { ...refreshResult(1), readToken: await dependencies.handle.createReadToken() }
      },
    })

    await service.refreshAndValidate({ projectDir, concurrency: 1 })
    await service.reset(projectDir)

    expect(events).toEqual(["install", "dependencies", "checkpoint", "install", "clear"])
    await service.close()
  })

  it("returns load, checkpoint and snapshot measurements only for an explicitly profiled refresh", async () => {
    const projectDir = await mkdtemp(join(tmpdir(), "nkdk-project-state-profile-"))
    tempDirs.push(projectDir)
    const snapshotPath = join(projectDir, ".nkdk", "cache", "project-state.bin")
    const writer = testWriterHandle(1)
    writer.commitAndScheduleCheckpoint = async () => {
      await mkdir(join(projectDir, ".nkdk", "cache"), { recursive: true })
      await writeFile(snapshotPath, "snapshot")
      return { snapshotPath }
    }
    const service = createProjectStateService({
      createWriter: () => writer,
      createPool: () => testPool(),
      async refresh(params, dependencies) {
        await dependencies.handle.beginUpdate(params.projectDir)
        const batches = (async function* () {
          let yielded = false
          for await (const batch of dependencies.discoverFiles(params)) {
            yielded = true
            const baseline = await dependencies.handle.readFileBaselinePathPage(batch.paths.map(({ projectPath }) => projectPath))
            const files = batch.paths.flatMap((path) => {
              const file = path.classify()
              return file === undefined ? [] : [{
                projectPath: file.identity.projectPath,
                componentPath: file.identity.componentPath,
                absolutePath: file.absolutePath,
                identity: file.identity,
                ...(file.descriptor === undefined ? {} : { descriptor: file.descriptor }),
              }]
            })
            yield { files, ...baseline }
          }
          if (!yielded) await dependencies.handle.readFileBaselinePathPage([])
        })()
        await dependencies.processFiles(
          batches,
          dependencies.handle,
          { signal: new AbortController().signal, abort() {} },
          params.projectDir,
        )
        await dependencies.handle.readLocalDiagnosticBatches()
        await dependencies.handle.validateDependencyDiagnosticBatches()
        await dependencies.handle.commitAndScheduleCheckpoint()
        return refreshResult(1)
      },
    })

    const phases: string[] = []
    const profiled = await service.refreshAndValidate({
      projectDir,
      profile: { onPhase: ({ phase }) => phases.push(phase) },
    })
    const ordinary = await service.refreshAndValidate({ projectDir })

    expect(profiled.profile).toEqual({
      snapshotBytes: 8,
      loadMs: expect.any(Number),
      scheduleSaveMs: expect.any(Number),
      saveBinaryMs: expect.any(Number),
      discoverFilesMs: expect.any(Number),
      readBaselineMs: expect.any(Number),
      processFilesMs: expect.any(Number),
      readLocalDiagnosticsMs: expect.any(Number),
      dependencyValidationMs: expect.any(Number),
      workerPoolCreateMs: expect.any(Number),
      workerReadyMs: expect.any(Number),
      workerReuseMs: expect.any(Number),
    })
    expect(profiled.profile?.loadMs).toBeGreaterThanOrEqual(0)
    expect(profiled.profile?.scheduleSaveMs).toBeGreaterThanOrEqual(0)
    expect(profiled.profile?.saveBinaryMs).toBeGreaterThanOrEqual(0)
    expect(profiled.profile?.dependencyValidationMs).toBeGreaterThanOrEqual(0)
    expect(phases).toEqual([
      "workerReady",
      "discoverFiles",
      "readBaseline",
      "processFiles",
      "readLocalDiagnostics",
      "dependencyValidation",
      "scheduleSave",
      "saveBinary",
    ])
    expect(ordinary).not.toHaveProperty("profile")
    await service.close()
  })

  it("успешно публикует import после checkpoint, даже если прежний writer не закрылся", async () => {
    const projectDir = await mkdtemp(join(tmpdir(), "nkdk-project-state-import-publish-"))
    tempDirs.push(projectDir)
    const old = testWriterHandle(1)
    const candidate = testWriterHandle(2)
    const closeOld = old.close.bind(old)
    let closeAttempts = 0
    old.close = async () => {
      closeAttempts += 1
      if (closeAttempts === 1) throw new Error("old runtime close failed")
      await closeOld()
    }
    const writers = [old, candidate]
    const service = createProjectStateService({ createWriter: () => writers.shift()!, createPool: () => testPool() })
    await service.createReadToken(projectDir)

    const session = await service.beginImport({ projectDir, workerCount: 1, output: { componentPaths: ["cf"] } })
    await session.commitWorkingIndex()
    const result = await session.finalize()
    expect([...result.diagnostics]).toEqual([])
    await expect(readProjectFiles(service, projectDir)).resolves.toEqual([{ projectPath: "old-2" }])

    await service.close()
    expect(closeAttempts).toBe(2)
  })

  it("abort сохраняет primary первым и добавляет ошибку discard как secondary", async () => {
    const projectDir = await mkdtemp(join(tmpdir(), "nkdk-project-state-import-abort-"))
    tempDirs.push(projectDir)
    const primary = new Error("import failed")
    const cleanup = new Error("candidate close failed")
    const candidate = testWriterHandle(1)
    let closeAttempts = 0
    candidate.close = async () => { closeAttempts += 1; throw cleanup }
    const service = createProjectStateService({ createWriter: () => candidate, createPool: () => testPool() })
    const session = await service.beginImport({ projectDir, workerCount: 1, output: { componentPaths: ["cf"] } })

    const caught = await session.abort(primary).catch((reason: unknown) => reason)

    expect(caught).toBeInstanceOf(AggregateError)
    expect((caught as AggregateError).errors).toEqual([primary, cleanup])
    expect((caught as Error).message).toBe(primary.message)
    await expect(service.close()).rejects.toThrow(cleanup.message)
    expect(closeAttempts).toBe(2)
  })

  it.each(["reset", "refresh", "rebuild"] as const)(
    "удерживает %s до успешного finalize активной import session",
    async (operation) => {
      let refreshCalls = 0
      const { projectDir, candidate, writers, service, session } = await beginImportLeaseTest(
        `nkdk-project-state-import-${operation}-`,
        undefined,
        {
          async refresh() { refreshCalls += 1; return refreshResult(refreshCalls) },
        },
      )
      await session.commitWorkingIndex()

      const queued = operation === "reset"
        ? service.reset(projectDir)
        : operation === "refresh"
          ? service.refreshAndValidate({ projectDir }).then(() => undefined)
          : service.rebuild({ projectDir }).then(() => undefined)
      let settled = false
      void queued.then(() => { settled = true }, () => { settled = true })
      await nextTurn()

      expect(settled).toBe(false)
      expect(writers).toHaveLength(1)
      expect(refreshCalls).toBe(0)

      await session.finalize()
      await queued

      expect(operation === "reset" ? candidate.resets.length : refreshCalls).toBe(1)
      await service.close()
    },
  )

  it("abort освобождает import lease перед следующей операцией", async () => {
    const { projectDir, candidate, next, service, session } = await beginImportLeaseTest(
      "nkdk-project-state-import-abort-lease-",
    )
    const resetting = service.reset(projectDir)
    await nextTurn()

    await session.abort(new Error("import cancelled"))
    await resetting

    expect(candidate.closed).toBe(1)
    expect(next.resets).toEqual([await realpath(projectDir)])
    await service.close()
  })

  it("close ждёт завершения активной import session без взаимной блокировки", async () => {
    const { candidate, service, session } = await beginImportLeaseTest(
      "nkdk-project-state-import-close-lease-",
    )
    let closeSettled = false

    const closing = service.close().then(() => { closeSettled = true })
    await nextTurn()

    expect(closeSettled).toBe(false)
    await session.abort(new Error("server shutdown"))
    await closing
    expect(candidate.closed).toBe(1)
  })

  it("ошибка finalize сначала завершает candidate и только затем освобождает lease", async () => {
    const events: string[] = []
    const primary = new Error("checkpoint failed")
    const { projectDir, service, session } = await beginImportLeaseTest(
      "nkdk-project-state-import-finalize-failure-",
      ({ candidate, next }) => {
        candidate.commitAndScheduleCheckpoint = async () => { throw primary }
        candidate.rollbackUpdate = async () => { events.push("rollback") }
        candidate.close = async () => { candidate.closed += 1; events.push("discard") }
        const openNext = next.openProject.bind(next)
        next.openProject = async (path) => { events.push("next-open"); await openNext(path) }
      },
    )
    await session.commitWorkingIndex()
    const resetting = service.reset(projectDir)
    await nextTurn()

    await expect(session.finalize()).rejects.toBe(primary)
    await resetting

    expect(events).toEqual(["rollback", "discard", "next-open"])
    await service.close()
  })

  it("finalize сохраняет primary первым и повторяет неудачный discard при service.close", async () => {
    const primary = new Error("checkpoint failed")
    const cleanup = new Error("discard failed")
    let closeAttempts = 0
    const { service, session } = await beginImportLeaseTest(
      "nkdk-project-state-import-finalize-cleanup-failure-",
      ({ candidate }) => {
        candidate.commitAndScheduleCheckpoint = async () => { throw primary }
        candidate.close = async () => {
          closeAttempts += 1
          if (closeAttempts === 1) throw cleanup
          candidate.closed += 1
        }
      },
    )
    await session.commitWorkingIndex()

    const failure = await session.finalize().catch((caught: unknown) => caught)

    expect(failure).toBeInstanceOf(AggregateError)
    expect((failure as AggregateError).errors).toEqual([primary, cleanup])
    await expect(session.abort(primary)).resolves.toBeUndefined()
    await service.close()
    expect(closeAttempts).toBe(2)
  })

  it("ошибка abort освобождает lease после завершённой попытки discard", async () => {
    const events: string[] = []
    const discardFailure = new Error("discard failed")
    const { projectDir, service, session } = await beginImportLeaseTest(
      "nkdk-project-state-import-abort-failure-",
      ({ candidate, next }) => {
        candidate.close = async () => { candidate.closed += 1; events.push("discard"); throw discardFailure }
        const openNext = next.openProject.bind(next)
        next.openProject = async (path) => { events.push("next-open"); await openNext(path) }
      },
    )
    const resetting = service.reset(projectDir)
    await nextTurn()

    await expect(session.abort(new Error("import failed"))).rejects.toThrow("import failed")
    await resetting

    expect(events).toEqual(["discard", "next-open"])
    await expect(service.close()).rejects.toThrow(discardFailure.message)
    expect(events).toEqual(["discard", "next-open", "discard"])
  })

  it("повторный abort после finalize не освобождает очередь второй раз", async () => {
    const { projectDir, service, session } = await beginImportLeaseTest(
      "nkdk-project-state-import-release-once-",
    )
    await session.commitWorkingIndex()

    await session.finalize()
    await session.abort(new Error("late abort"))
    const readSession = service.openReadSession(await service.createReadToken(projectDir))
    readSession.close()
    await service.close()
  })

  it("reset после finalize удаляет опубликованный import snapshot без последующего воскрешения", async () => {
    let snapshotPath = ""
    const { projectDir, service, session } = await beginImportLeaseTest(
      "nkdk-project-state-import-reset-snapshot-",
      async ({ projectDir: dir, candidate }) => {
        snapshotPath = join(dir, ".nkdk", "cache", "project-state.bin")
        await mkdir(join(dir, ".nkdk", "cache"), { recursive: true })
        candidate.commitAndScheduleCheckpoint = async () => {
          await writeFile(snapshotPath, "import snapshot")
          return { snapshotPath }
        }
      },
    )
    await session.commitWorkingIndex()
    const resetting = service.reset(projectDir)
    await nextTurn()

    await session.finalize()
    await resetting

    await expect(access(snapshotPath)).rejects.toMatchObject({ code: "ENOENT" })
    await Promise.resolve()
    await expect(access(snapshotPath)).rejects.toMatchObject({ code: "ENOENT" })
    await service.close()
  })

  it("нормализует projectDir через realpath и последовательно выполняет параллельные актуализации", async () => {
    const projectDir = await mkdtemp(join(tmpdir(), "nkdk-project-state-service-"))
    tempDirs.push(projectDir)
    const alias = `${projectDir}-alias`
    tempDirs.push(alias)
    await symlink(projectDir, alias, process.platform === "win32" ? "junction" : "dir")
    const handle = testWriterHandle(1)
    let active = 0
    let maxActive = 0
    let releaseFirst!: () => void
    let notifyFirstStarted!: () => void
    const firstGate = new Promise<void>((resolve) => { releaseFirst = resolve })
    const firstStarted = new Promise<void>((resolve) => { notifyFirstStarted = resolve })
    let calls = 0
    const service = createProjectStateService({
      createWriter: () => handle,
      createPool: () => testPool(),
      async refresh(_params, _dependencies) {
        calls += 1
        if (calls === 1) notifyFirstStarted()
        active += 1
        maxActive = Math.max(maxActive, active)
        if (calls === 1) await firstGate
        active -= 1
        return refreshResult(calls)
      },
    })

    const first = service.refreshAndValidate({ projectDir })
    const second = service.refreshAndValidate({ projectDir: alias })
    await firstStarted
    expect(calls).toBe(1)
    releaseFirst()
    await Promise.all([first, second])

    expect(maxActive).toBe(1)
    expect(handle.opened).toEqual([await realpath(projectDir)])
    await service.close()
  })

  it("при технической ошибке rebuild сохраняет прежнее активное состояние", async () => {
    const { projectDir, snapshotPath } = await snapshotProject("nkdk-project-state-rebuild-")
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
    await expect(readFile(snapshotPath, "utf8")).resolves.toBe("previous")
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

  it("ошибка закрытия rebuild pool до checkpoint сохраняет прежние runtime, disk и token", async () => {
    const { projectDir, snapshotPath } = await snapshotProject("nkdk-project-state-rebuild-pool-cleanup-")
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
      async refresh(_params, dependencies) {
        if (poolCalls === 2) {
          await (dependencies as ProjectStateRefreshDependencies & {
            beforeCheckpoint?: () => Promise<void>
          }).beforeCheckpoint?.()
          await writeFile(snapshotPath, "candidate")
        }
        return refreshResult(poolCalls)
      },
    })

    await service.refreshAndValidate({ projectDir })
    const oldToken = await service.createReadToken(projectDir)

    await expect(service.rebuild({ projectDir })).rejects.toBe(cleanup)

    await expectPreservedProjectState(service, projectDir, snapshotPath, oldToken)
    expect(old.closed).toBe(0)
    expect(candidate.closed).toBe(1)
    await service.close()
  })

  it("отмена во время закрытия rebuild pool сохраняет прежние runtime, disk и token", async () => {
    const { projectDir, snapshotPath } = await snapshotProject("nkdk-project-state-rebuild-pool-abort-")
    const old = testWriterHandle(1)
    const candidate = testWriterHandle(2)
    const writers = [old, candidate]
    const controller = new AbortController()
    let releasePool!: () => void
    let notifyPoolStarted!: () => void
    const poolGate = new Promise<void>((resolve) => { releasePool = resolve })
    const poolStarted = new Promise<void>((resolve) => { notifyPoolStarted = resolve })
    let tokenCalls = 0
    let checkpointCalls = 0
    let rollbackCalls = 0
    const createCandidateToken = candidate.createReadToken.bind(candidate)
    candidate.createReadToken = async () => {
      tokenCalls += 1
      return createCandidateToken()
    }
    candidate.commitAndScheduleCheckpoint = async () => {
      checkpointCalls += 1
      return { snapshotPath }
    }
    candidate.rollbackUpdate = async () => { rollbackCalls += 1 }
    const service = createProjectStateService({
      createWriter: () => writers.shift()!,
      createPool: () => ({
        ...testPool(),
        close: async () => {
          notifyPoolStarted()
          await poolGate
        },
      }) as PreparedYamlProjectWorkerPool,
    })
    const oldToken = await service.createReadToken(projectDir)
    const rebuilding = service.rebuild({ projectDir, signal: controller.signal })
    await poolStarted

    controller.abort()
    releasePool()

    await expect(rebuilding).rejects.toMatchObject({ name: "AbortError" })
    await expectPreservedProjectState(service, projectDir, snapshotPath, oldToken)
    expect({ tokenCalls, checkpointCalls, rollbackCalls }).toEqual({
      tokenCalls: 0,
      checkpointCalls: 0,
      rollbackCalls: 1,
    })
    expect(old.closed).toBe(0)
    expect(candidate.closed).toBe(1)
    await service.close()
  })

  it("отмена во время выдачи rebuild token сохраняет прежние runtime, disk и token", async () => {
    const { projectDir, snapshotPath } = await snapshotProject("nkdk-project-state-rebuild-token-abort-")
    const old = testWriterHandle(1)
    const candidate = testWriterHandle(2)
    const writers = [old, candidate]
    const controller = new AbortController()
    let releaseToken!: () => void
    let notifyTokenStarted!: () => void
    const tokenGate = new Promise<void>((resolve) => { releaseToken = resolve })
    const tokenStarted = new Promise<void>((resolve) => { notifyTokenStarted = resolve })
    let checkpointCalls = 0
    let rollbackCalls = 0
    const createCandidateToken = candidate.createReadToken.bind(candidate)
    candidate.createReadToken = async () => {
      notifyTokenStarted()
      await tokenGate
      return createCandidateToken()
    }
    candidate.commitAndScheduleCheckpoint = async () => {
      checkpointCalls += 1
      await writeFile(snapshotPath, "candidate")
      return { snapshotPath }
    }
    candidate.rollbackUpdate = async () => { rollbackCalls += 1 }
    const service = createProjectStateService({
      createWriter: () => writers.shift()!,
      createPool: () => testPool(),
    })
    const oldToken = await service.createReadToken(projectDir)
    const rebuilding = service.rebuild({ projectDir, signal: controller.signal })
    await tokenStarted

    controller.abort()
    releaseToken()

    await expect(rebuilding).rejects.toMatchObject({ name: "AbortError" })
    await expectPreservedProjectState(service, projectDir, snapshotPath, oldToken)
    expect({ checkpointCalls, rollbackCalls }).toEqual({ checkpointCalls: 0, rollbackCalls: 1 })
    expect(old.closed).toBe(0)
    expect(candidate.closed).toBe(1)
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

  it("после публикации возвращает rebuild success и повторяет закрытие прежнего writer при service.close", async () => {
    const cleanup = new Error("old writer close failed")
    let closeAttempts = 0
    const { projectDir, candidate, service } = await rebuildRetirementTest(
      "nkdk-project-state-rebuild-writer-cleanup-",
      (old) => {
        const closeOld = old.close.bind(old)
        old.close = async () => {
          closeAttempts += 1
          if (closeAttempts === 1) throw cleanup
          await closeOld()
        }
      },
    )

    await service.refreshAndValidate({ projectDir })
    const rebuilt = await service.rebuild({ projectDir })
    expect([...rebuilt.diagnostics]).toEqual([])
    await expect(readProjectFiles(service, projectDir)).resolves.toEqual([{ projectPath: "old-2" }])
    expect(candidate.closed).toBe(0)
    await service.close()
    expect(closeAttempts).toBe(2)
  })

  it("возвращает стабильную aggregate-ошибку service.close для незакрывшегося retired writer", async () => {
    const cleanup = new Error("old writer close failed")
    let closeAttempts = 0
    const { projectDir, candidate, service } = await rebuildRetirementTest(
      "nkdk-project-state-retired-writer-cleanup-",
      (old) => {
        old.close = async () => {
          closeAttempts += 1
          throw cleanup
        }
      },
    )

    await service.refreshAndValidate({ projectDir })
    const rebuilt = await service.rebuild({ projectDir })
    expect([...rebuilt.diagnostics]).toEqual([])
    const firstClose = service.close()
    const secondClose = service.close()
    const failure = await firstClose.catch((caught: unknown) => caught)

    expect(secondClose).toBe(firstClose)
    expect(failure).toBeInstanceOf(AggregateError)
    expect((failure as AggregateError).errors).toEqual([cleanup])
    expect(candidate.closed).toBe(1)
    expect(closeAttempts).toBe(2)
  })

  it("rebuild меняет активное состояние только после успешного завершения refresh checkpoint", async () => {
    const { projectDir, snapshotPath } = await snapshotProject("nkdk-project-state-rebuild-success-")
    const old = testWriterHandle(1)
    const candidate = testWriterHandle(2)
    const handles = [old, candidate]
    let calls = 0
    const refreshedProjectDirs: string[] = []
    let finishCheckpoint!: () => void
    let notifyCheckpointStarted!: () => void
    const checkpoint = new Promise<void>((resolve) => { finishCheckpoint = resolve })
    const checkpointStarted = new Promise<void>((resolve) => { notifyCheckpointStarted = resolve })
    const service = createProjectStateService({
      createWriter: () => handles.shift()!,
      createPool: () => testPool(),
      async refresh(params) {
        calls += 1
        refreshedProjectDirs.push(params.projectDir)
        if (calls === 2) {
          notifyCheckpointStarted()
          await checkpoint
          await writeFile(snapshotPath, "candidate")
          return {
            ...refreshResult(calls),
            diagnostics: createMetadataDiagnosticCollectionFromDiagnostics([{
              filePath: "cf/Справочник/Товары/Свойства.yaml",
              line: 1,
              col: 1,
              severity: "error",
              source: "structure",
              message: "Ошибка validation",
            }]),
          }
        }
        return refreshResult(calls)
      },
    })

    await service.refreshAndValidate({ projectDir })
    const rebuilding = service.rebuild({ projectDir })
    await checkpointStarted
    expect(calls).toBe(2)
    expect(old.closed).toBe(0)
    finishCheckpoint()
    const rebuildResult = await rebuilding
    const projectFiles = await readProjectFiles(service, projectDir)

    expect([...rebuildResult.diagnostics]).toEqual([expect.objectContaining({ severity: "error" })])
    expect(old.closed).toBe(1)
    expect(candidate.opened).toEqual([await realpath(projectDir)])
    expect(refreshedProjectDirs).toEqual([await realpath(projectDir), await realpath(projectDir)])
    expect(projectFiles).toEqual([{ projectPath: "old-2" }])
    await expect(readFile(snapshotPath, "utf8")).resolves.toBe("candidate")
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

    const rebuilt = await service.rebuild({ projectDir })
    expect([...rebuilt.diagnostics]).toEqual([])
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
    let notifyFirstStarted!: () => void
    const firstGate = new Promise<void>((resolve) => { finishFirst = resolve })
    const firstStarted = new Promise<void>((resolve) => { notifyFirstStarted = resolve })
    let calls = 0
    const service = createProjectStateService({
      createWriter: () => writers.shift()!,
      createPool: () => testPool(),
      async refresh() {
        calls += 1
        if (calls === 1) {
          notifyFirstStarted()
          await firstGate
        }
        return refreshResult(calls)
      },
    })

    const first = service.refreshAndValidate({ projectDir: firstDir })
    const second = service.refreshAndValidate({ projectDir: secondDir })
    await firstStarted
    expect(calls).toBe(1)
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
        { kind: "resource", projectPath: "cf/a.bin", componentPath, resourceKind: "resource", targets: [] },
        { kind: "resource", projectPath: "cf/b.bin", componentPath, resourceKind: "resource", targets: [] },
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

  it("выдаёт независимые read token активного состояния для нескольких worker", async () => {
    const projectDir = await mkdtemp(join(tmpdir(), "nkdk-project-state-worker-tokens-"))
    tempDirs.push(projectDir)
    const writer = testWriterHandle(1)
    writer.createReadToken = async () => testReadToken()
    const service = createProjectStateService({ createWriter: () => writer, createPool: () => testPool() })

    const first = await service.createReadToken(projectDir)
    const second = await service.createReadToken(projectDir)

    expect(first.claim).not.toBe(second.claim)
    await service.close()
  })

  it("reset канонизирует путь и не запускает построение состояния", async () => {
    const projectDir = await mkdtemp(join(tmpdir(), "nkdk-project-state-reset-"))
    tempDirs.push(projectDir)
    const alias = `${projectDir}-alias`
    tempDirs.push(alias)
    await symlink(projectDir, alias, process.platform === "win32" ? "junction" : "dir")
    const writer = testWriterHandle(1)
    let tokenValid = true
    const resetWriter = writer.reset.bind(writer)
    writer.reset = async (canonicalProjectDir) => {
      await resetWriter(canonicalProjectDir)
      tokenValid = false
    }
    const snapshotPath = join(projectDir, ".nkdk", "cache", "project-state.bin")
    const configurationIndexPath = join(projectDir, ".nkdk", "components", "cf", "configuration-index.bin")
    let refreshCalls = 0
    const service = createProjectStateService({
      createWriter: () => writer,
      createPool: () => testPool(),
      async refresh() { refreshCalls += 1; return refreshResult(refreshCalls) },
      openReadSession() {
        if (!tokenValid) throw new Error("Read token устарел")
        return {} as never
      },
    })
    const staleToken = await service.createReadToken(projectDir)
    await mkdir(join(projectDir, ".nkdk", "cache"), { recursive: true })
    await mkdir(join(projectDir, ".nkdk", "components", "cf"), { recursive: true })
    await writeFile(snapshotPath, "snapshot")
    await writeFile(configurationIndexPath, "configuration-index")

    await service.reset(alias)

    expect(writer.resets).toEqual([await realpath(projectDir)])
    expect(refreshCalls).toBe(0)
    expect(() => service.openReadSession(staleToken)).toThrow()
    await expect(access(snapshotPath)).rejects.toMatchObject({ code: "ENOENT" })
    await expect(access(configurationIndexPath)).resolves.toBeUndefined()
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
    async readFileBaseline(files) {
      return {
        knownHashBits: new Uint8Array(Math.ceil(files.length / 8)),
        hashBytes: new Uint8Array(files.length * 8),
        deleted: [],
      }
    },
    async readFileBaselinePathPage(projectPaths) {
      return {
        knownHashBits: new Uint8Array(Math.ceil(projectPaths.length / 8)),
        hashBytes: new Uint8Array(projectPaths.length * 8),
        previousFileIds: new Int32Array(projectPaths.length).fill(-1),
        storedFileCount: 0,
      }
    },
    async compareFiles() { return { changed: [], deleted: [] } },
    async readLocalDiagnostics() { return [] },
    async readLocalDiagnosticBatches() { return [] },
    async validateDependencies() { return [] },
    async validateDependencyDiagnosticBatches() { return [] },
    async createReadToken() { return testReadToken() },
    async readComponentProjection(componentPath) {
      return {
        componentPath,
        updates: [{ kind: "resource", projectPath: `old-${id}`, componentPath, resourceKind: "resource", targets: [] }],
        hashBytes: new Uint8Array(8),
      }
    },
    async beginUpdate() {},
    async writeFragment() {},
    async clearImportOutput() {},
    async deleteFiles() {},
    async deleteUnseenFiles() { return 0 },
    async commitAndScheduleCheckpoint() { return { snapshotPath: "snapshot" } },
    async commitAndCheckpoint() { return { snapshotPath: "snapshot" } },
    async flushCheckpoint() { return { snapshotPath: "snapshot" } },
    async commitUpdate() {},
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
  return {
    initValidation: async () => ({
      workerInitMs: 0,
      schemaCompileMs: 0,
      formSchemaMs: 0,
      propertiesSchemaMs: 0,
      rulesSnapshotBytes: 0,
    }),
    runProjectStateRefresh: async ({ source }: Parameters<PreparedYamlProjectWorkerPool["runProjectStateRefresh"]>[0]) => {
      for await (const _batch of source.batches) { /* завершить обнаружение */ }
      return { hashedFiles: 0, parsedYamlFiles: 0, changedFiles: 0, missingFiles: 0 }
    },
    close: async () => undefined,
  } as unknown as PreparedYamlProjectWorkerPool
}

async function beginImportLeaseTest(
  prefix: string,
  configure?: (params: {
    readonly projectDir: string
    readonly candidate: TestWriter
    readonly next: TestWriter
  }) => void | Promise<void>,
  options: Pick<CreateProjectStateServiceOptions, "refresh" | "openReadSession"> = {},
) {
  const projectDir = await mkdtemp(join(tmpdir(), prefix))
  tempDirs.push(projectDir)
  const candidate = testWriterHandle(1)
  const next = testWriterHandle(2)
  await configure?.({ projectDir, candidate, next })
  const writers = [candidate, next]
  const service = createProjectStateService({
    ...options,
    openReadSession: options.openReadSession ?? openProjectStateReadSession,
    createWriter: () => writers.shift()!,
    createPool: () => testPool(),
  })
  const session = await service.beginImport({
    projectDir,
    workerCount: 1,
    output: { componentPaths: ["cf"] },
  })
  return { projectDir, candidate, next, writers, service, session }
}

async function snapshotProject(prefix: string): Promise<{ projectDir: string; snapshotPath: string }> {
  const projectDir = await mkdtemp(join(tmpdir(), prefix))
  tempDirs.push(projectDir)
  const snapshotPath = join(projectDir, ".nkdk", "cache", "project-state.bin")
  await mkdir(join(projectDir, ".nkdk", "cache"), { recursive: true })
  await writeFile(snapshotPath, "previous")
  return { projectDir, snapshotPath }
}

async function rebuildRetirementTest(
  prefix: string,
  configureOld: (writer: TestWriter) => void,
) {
  const projectDir = await mkdtemp(join(tmpdir(), prefix))
  tempDirs.push(projectDir)
  const old = testWriterHandle(1)
  const candidate = testWriterHandle(2)
  configureOld(old)
  const writers = [old, candidate]
  const service = createProjectStateService({
    createWriter: () => writers.shift()!,
    createPool: () => testPool(),
    async refresh() { return refreshResult(2) },
  })
  return { projectDir, candidate, service }
}

function nextTurn(): Promise<void> {
  return new Promise((resolve) => setImmediate(resolve))
}

async function readProjectFiles(
  service: ReturnType<typeof createProjectStateService>,
  projectDir: string,
): Promise<readonly { readonly projectPath: string }[]> {
  return (await service.readComponentProjection({ projectDir, componentPath: "cf" })).projectFiles
}

async function expectPreservedProjectState(
  service: ReturnType<typeof createProjectStateService>,
  projectDir: string,
  snapshotPath: string,
  readToken: ProjectStateReadToken,
): Promise<void> {
  await expect(readProjectFiles(service, projectDir)).resolves.toEqual([{ projectPath: "old-1" }])
  await expect(readFile(snapshotPath, "utf8")).resolves.toBe("previous")
  await expect(service.createReadToken(projectDir)).resolves.toEqual(readToken)
}

function refreshResult(_value: number): ProjectStateRefreshResult {
  return {
    diagnostics: createMetadataDiagnosticCollectionFromDiagnostics([]),
    readToken: testReadToken(),
    stats: { hashedFiles: 0, parsedYamlFiles: 0, changedFiles: 0, deletedFiles: 0 },
  }
}

function testReadToken(): ProjectStateReadToken {
  return createBinaryProjectStateReadToken(buildProjectStateSnapshot({ fragments: [], deletions: [] }))
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
