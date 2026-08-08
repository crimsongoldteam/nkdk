import { describe, expect, it, vi } from "vitest"
import type { Diagnostic } from "../validation/types"
import { encodeDiagnosticBatch, openDiagnosticBatch } from "../diagnostics/binaryBatch"
import type { ProjectStateFileIdentity, ProjectStateFileUpdate } from "./fileUpdate"
import { createProjectStateFragmentWriter, type ProjectStateFragment } from "./binary/fragment"
import type { ProjectStateFileBaselinePathPage, ProjectStateReadToken } from "./contracts"
import { createTestProjectStateReadToken } from "./tests/readToken"
import {
  refreshProjectState,
  type ProjectStateRefreshDependencies,
  type ProjectStateRefreshHandle,
  type ProjectStateRefreshOperation,
} from "./refresh"

describe("refreshProjectState", () => {
  it("выполняет один worker-проход внутри общей транзакции", async () => {
    const events: string[] = []
    const yaml = identity("cf/Конфигурация.yaml", "yaml")
    const deleted = identity("cf/Удалённый.yaml", "yaml")
    const handle = new TrackingRefreshHandle(events, { deleted })
    const files = [{
      projectPath: yaml.projectPath,
      componentPath: yaml.componentPath,
      identity: yaml,
      absolutePath: "/project/cf/Конфигурация.yaml",
      descriptor: {} as never,
      targets: [],
    }]

    const result = await refreshProjectState({ projectDir: "/project" }, {
      handle,
      async *discoverFiles() {
        events.push("discover")
        yield { paths: files.map((file) => ({
            projectPath: file.identity.projectPath,
            componentPath: file.identity.componentPath,
            absolutePath: file.absolutePath,
            classify: () => file,
          })) }
      },
      async processFiles(batches, producer, operation, projectDir) {
        const selected = []
        for await (const batch of batches) selected.push(...batch.files)
        events.push("process")
        expect(selected).toEqual(files)
        expect(operation.signal).toBe(handle.signal)
        expect(projectDir).toBe("/project")
        const writer = createProjectStateFragmentWriter()
        writer.appendFile(yamlUpdate(yaml), 0n)
        await producer.writeFragment(writer.finish())
        return { hashedFiles: 1, parsedYamlFiles: 1, changedFiles: 1, missingFiles: 1 }
      },
      afterProcessFiles: async () => { events.push("workers-closed") },
      beforeCheckpoint: async () => { events.push("prepare") },
    })

    expect(events).toEqual([
      "begin",
      "discover",
      "baseline",
      "process",
      "write",
      "delete:cf/Удалённый.yaml",
      "workers-closed",
      "local",
      "dependencies",
      "prepare",
      "token",
      "checkpoint",
    ])
    expect(result.stats).toEqual({
      hashedFiles: 1,
      parsedYamlFiles: 1,
      changedFiles: 1,
      deletedFiles: 2,
    })
  })

  it("не классифицирует известный путь, но классифицирует новый", async () => {
    const known = vi.fn(() => identity("cf/Известный.yaml", "yaml"))
    const freshIdentity = identity("cf/Новый.yaml", "yaml")
    const fresh = vi.fn(() => ({
      identity: freshIdentity,
      absolutePath: "/project/cf/Новый.yaml",
      descriptor: {} as never,
      targets: [],
    }))
    const handle = new TrackingRefreshHandle([], { knownProjectPaths: ["cf/Известный.yaml"] })
    let selected: readonly { readonly projectPath: string; readonly identity?: ProjectStateFileIdentity }[] = []

    await refreshProjectState({ projectDir: "/project" }, {
      ...emptyDependencies(handle),
      discoverFiles: async function* () {
        yield { paths: [
          {
            projectPath: "cf/Известный.yaml",
            componentPath: "cf",
            absolutePath: "/project/cf/Известный.yaml",
            classify: () => ({
              identity: known(),
              absolutePath: "/project/cf/Известный.yaml",
              descriptor: {} as never,
              targets: [],
            }),
          },
          {
            projectPath: freshIdentity.projectPath,
            componentPath: "cf",
            absolutePath: "/project/cf/Новый.yaml",
            classify: fresh,
          },
        ] }
      },
      processFiles: async (batches) => {
        for await (const batch of batches) selected = batch.files
        return { hashedFiles: 2, parsedYamlFiles: 1, changedFiles: 1, missingFiles: 0 }
      },
    })

    expect(handle.readPaths).toEqual(["cf/Известный.yaml", "cf/Новый.yaml"])
    expect(known).not.toHaveBeenCalled()
    expect(fresh).toHaveBeenCalledTimes(1)
    expect(selected[0]).toMatchObject({ projectPath: "cf/Известный.yaml" })
    expect(selected[0]).not.toHaveProperty("identity")
    expect(selected[1]?.identity?.projectPath).toBe("cf/Новый.yaml")
    expect(handle.seenFileIds).toEqual(Uint8Array.of(0b0000_0001))
  })

  it("представляет переименование удалением старого и появлением нового пути", async () => {
    const old = identity("cf/СтароеИмя.yaml", "yaml")
    const fresh = identity("cf/НовоеИмя.yaml", "yaml")
    const handle = new TrackingRefreshHandle([], { deleted: old })

    const result = await refreshProjectState({ projectDir: "/project" }, {
      ...emptyDependencies(handle),
      discoverFiles: async function* () {
        yield { paths: [{
          projectPath: fresh.projectPath,
          componentPath: fresh.componentPath,
          absolutePath: "/project/cf/НовоеИмя.yaml",
          classify: () => ({
            identity: fresh,
            absolutePath: "/project/cf/НовоеИмя.yaml",
            descriptor: {} as never,
            targets: [],
          }),
        }] }
      },
      processFiles: async (batches) => {
        for await (const batch of batches) expect(batch.files[0]?.identity).toEqual(fresh)
        return { hashedFiles: 1, parsedYamlFiles: 1, changedFiles: 1, missingFiles: 0 }
      },
    })

    expect(handle.seenFileIds).toEqual(Uint8Array.of(0))
    expect(result.stats.deletedFiles).toBe(1)
  })

  it("сохраняет локальные ошибки и выполняет полную проверку зависимостей", async () => {
    const duplicate = diagnostic("cf/Конфигурация.yaml", "duplicate", "structure", 1)
    const dependency = diagnostic("cf/Конфигурация.yaml", "dependency", "reference", 2)
    const handle = new TrackingRefreshHandle([], {
      localDiagnostics: [duplicate],
      dependencyDiagnostics: [dependency, duplicate],
    })

    const result = await refreshProjectState({ projectDir: "/project" }, emptyDependencies(handle))

    expect([...result.diagnostics]).toEqual([duplicate, dependency])
    expect(handle.checkpointCalls).toBe(1)
    expect(handle.rollbackCalls).toBe(0)
  })

  it("не декодирует сохранённые диагностики при создании результата", async () => {
    const stored = diagnostic("cf/Конфигурация.yaml", "stored", "structure", 1)
    let reads = 0
    const handle = new class extends TrackingRefreshHandle {
      override async readLocalDiagnosticBatches() {
        return [{
          count: 1,
          diagnostic() {
            reads += 1
            return stored
          },
        }]
      }
    }([])

    const result = await refreshProjectState({ projectDir: "/project" }, emptyDependencies(handle))

    expect(reads).toBe(0)
    expect([...result.diagnostics]).toEqual([stored])
    expect(reads).toBeGreaterThan(0)
  })

  it("не начинает транзакцию при ошибке обнаружения или чтения baseline", async () => {
    const discoveryHandle = new TrackingRefreshHandle([])
    await expect(refreshProjectState({ projectDir: "/project" }, {
      ...emptyDependencies(discoveryHandle),
      discoverFiles: async function* () { throw new Error("discover failed") },
    })).rejects.toThrow("discover failed")

    const baselineHandle = new class extends TrackingRefreshHandle {
      override async readFileBaselinePathPage(): Promise<ProjectStateFileBaselinePathPage> {
        throw new Error("baseline failed")
      }
    }([])
    await expect(refreshProjectState({ projectDir: "/project" }, emptyDependencies(baselineHandle)))
      .rejects.toThrow("baseline failed")

    expect(discoveryHandle.beginCalls).toBe(1)
    expect(discoveryHandle.rollbackCalls).toBe(1)
    expect(baselineHandle.beginCalls).toBe(1)
    expect(baselineHandle.rollbackCalls).toBe(1)
  })

  it("откатывает всю транзакцию при технической ошибке worker", async () => {
    const handle = new TrackingRefreshHandle([])

    await expect(refreshProjectState({ projectDir: "/project" }, {
      ...emptyDependencies(handle),
      processFiles: async () => { throw new Error("worker failed") },
    })).rejects.toThrow("worker failed")

    expect(handle.rollbackCalls).toBe(1)
    expect(handle.checkpointCalls).toBe(0)
  })

  it("сохраняет исходную ошибку вместе с ошибкой отката", async () => {
    const handle = new class extends TrackingRefreshHandle {
      override async rollbackUpdate(): Promise<void> {
        throw new Error("rollback failed")
      }
    }([])

    await expect(refreshProjectState({ projectDir: "/project" }, {
      ...emptyDependencies(handle),
      processFiles: async () => { throw new Error("worker failed") },
    })).rejects.toMatchObject({
      message: "worker failed",
      errors: [{ message: "worker failed" }, { message: "rollback failed" }],
    })
  })

  it("выдаёт token до checkpoint и откатывает при ошибке token", async () => {
    const events: string[] = []
    const handle = new class extends TrackingRefreshHandle {
      override async createReadToken(): Promise<ProjectStateReadToken> {
        events.push("token")
        throw new Error("token failed")
      }
    }(events)

    await expect(refreshProjectState({ projectDir: "/project" }, emptyDependencies(handle)))
      .rejects.toThrow("token failed")

    expect(events).not.toContain("checkpoint")
    expect(handle.rollbackCalls).toBe(1)
  })

  it("не откатывает из-за поздней отмены после начала checkpoint", async () => {
    const controller = new AbortController()
    let releaseCheckpoint!: () => void
    let checkpointStarted!: () => void
    const waitForRelease = new Promise<void>((resolve) => { releaseCheckpoint = resolve })
    const started = new Promise<void>((resolve) => { checkpointStarted = resolve })
    const handle = new class extends TrackingRefreshHandle {
      override async commitAndScheduleCheckpoint(): Promise<{ readonly snapshotPath: string }> {
        this.checkpointCalls += 1
        checkpointStarted()
        await waitForRelease
        return { snapshotPath: "/project/.nkdk/cache/project-state.bin" }
      }
    }([])
    const running = refreshProjectState(
      { projectDir: "/project", signal: controller.signal },
      emptyDependencies(handle),
    )
    await started

    controller.abort()
    releaseCheckpoint()

    const result = await running
    expect([...result.diagnostics]).toEqual([])
    expect(handle.rollbackCalls).toBe(0)
  })

  it("передаёт один внутренний сигнал в writer и worker и откатывает отменённую операцию", async () => {
    const userController = new AbortController()
    const handle = new TrackingRefreshHandle([])
    let workerSignal: AbortSignal | undefined

    await expect(refreshProjectState({ projectDir: "/project", signal: userController.signal }, {
      ...emptyDependencies(handle),
      async processFiles(batches, _producer, operation: ProjectStateRefreshOperation) {
        workerSignal = operation.signal
        for await (const _batch of batches) { /* завершить обнаружение */ }
        userController.abort()
        return { hashedFiles: 0, parsedYamlFiles: 0, changedFiles: 0, missingFiles: 0 }
      },
    })).rejects.toMatchObject({ name: "AbortError" })

    expect(handle.signal).toBeDefined()
    expect(handle.signal).not.toBe(userController.signal)
    expect(workerSignal).toBe(handle.signal)
    expect(handle.rollbackCalls).toBe(1)
  })
})

class TrackingRefreshHandle implements ProjectStateRefreshHandle {
  readonly events: string[]
  readonly options: {
    readonly deleted?: ProjectStateFileIdentity
    readonly localDiagnostics?: readonly Diagnostic[]
    readonly dependencyDiagnostics?: readonly Diagnostic[]
    readonly knownProjectPaths?: readonly string[]
  }
  signal?: AbortSignal
  beginCalls = 0
  checkpointCalls = 0
  rollbackCalls = 0
  readPaths: string[] = []
  seenFileIds?: Uint8Array

  constructor(events: string[], options: TrackingRefreshHandle["options"] = {}) {
    this.events = events
    this.options = options
  }

  async readFileBaselinePathPage(projectPaths: readonly string[]): Promise<ProjectStateFileBaselinePathPage> {
    this.events.push("baseline")
    this.readPaths.push(...projectPaths)
    const knownHashBits = new Uint8Array(Math.ceil(projectPaths.length / 8))
    const previousFileIds = new Int32Array(projectPaths.length).fill(-1)
    for (const [index, projectPath] of projectPaths.entries()) {
      const fileId = this.options.knownProjectPaths?.indexOf(projectPath) ?? -1
      if (fileId < 0) continue
      previousFileIds[index] = fileId
      knownHashBits[Math.floor(index / 8)]! |= 1 << (index % 8)
    }
    return {
      knownHashBits,
      hashBytes: new Uint8Array(projectPaths.length * 8),
      previousFileIds,
      storedFileCount: this.options.knownProjectPaths?.length ?? (this.options.deleted === undefined ? 0 : 1),
    }
  }

  async beginUpdate(_projectDir: string, signal?: AbortSignal): Promise<void> {
    this.events.push("begin")
    this.beginCalls += 1
    this.signal = signal
  }

  async writeFragment(_fragment: ProjectStateFragment): Promise<void> {
    this.events.push("write")
  }

  async deleteFiles(projectPaths: readonly string[]): Promise<void> {
    for (const path of projectPaths) this.events.push(`delete:${path}`)
  }

  async deleteUnseenFiles(seenFileIds: Uint8Array): Promise<number> {
    this.seenFileIds = seenFileIds
    if (this.options.deleted === undefined) return 0
    this.events.push(`delete:${this.options.deleted.projectPath}`)
    return 1
  }

  async readLocalDiagnosticBatches() {
    this.events.push("local")
    return [openDiagnosticBatch(encodeDiagnosticBatch(this.options.localDiagnostics ?? []))]
  }

  async validateDependencyDiagnosticBatches() {
    this.events.push("dependencies")
    return [openDiagnosticBatch(encodeDiagnosticBatch(this.options.dependencyDiagnostics ?? []))]
  }

  async createReadToken(): Promise<ProjectStateReadToken> {
    this.events.push("token")
    return createTestProjectStateReadToken()
  }

  async commitAndScheduleCheckpoint(): Promise<{ readonly snapshotPath: string }> {
    this.events.push("checkpoint")
    this.checkpointCalls += 1
    return { snapshotPath: "/project/.nkdk/cache/project-state.bin" }
  }

  async rollbackUpdate(): Promise<void> {
    this.events.push("rollback")
    this.rollbackCalls += 1
  }
}

function emptyDependencies(handle: ProjectStateRefreshHandle): ProjectStateRefreshDependencies {
  return {
    handle,
    discoverFiles: async function* () {},
    processFiles: async (batches) => {
      for await (const _batch of batches) { /* завершить обнаружение */ }
      return { hashedFiles: 0, parsedYamlFiles: 0, changedFiles: 0, missingFiles: 0 }
    },
  }
}

function identity(projectPath: string, resourceKind: "yaml" | "resource"): ProjectStateFileIdentity {
  return {
    projectPath,
    componentPath: "cf",
    resourceKind,
    ...(resourceKind === "yaml" ? { yamlRole: "configuration" as const } : {}),
  }
}

function yamlUpdate(file: ProjectStateFileIdentity): ProjectStateFileUpdate {
  return {
    ...file,
    kind: "yaml",
    localValidation: { contributedFacts: false, diagnostics: [], schemaDiagnostics: [] },
    pendingChecks: [],
    forms: [],
    fields: [],
    owners: [],
    pendingReferences: [],
    targets: [],
    dependencies: [],
  }
}

function diagnostic(
  filePath: string,
  message: string,
  source: Diagnostic["source"],
  line: number,
): Diagnostic {
  return { filePath, line, col: 1, severity: "error", source, message }
}
