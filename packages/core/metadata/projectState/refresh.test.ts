import { describe, expect, it } from "vitest"
import type { Diagnostic } from "../validation/types"
import type { ProjectStateFileIdentity, ProjectStateFileUpdateBatch } from "./fileUpdate"
import type { ProjectStateFileBaseline, ProjectStateReadToken } from "./contracts"
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
      identity: yaml,
      absolutePath: "/project/cf/Конфигурация.yaml",
      descriptor: {} as never,
    }]

    const result = await refreshProjectState({ projectDir: "/project" }, {
      handle,
      async discoverFiles() {
        events.push("discover")
        return files
      },
      async processFiles(selected, baseline, producer, operation, projectDir) {
        events.push("process")
        expect(selected).toBe(files)
        expect(baseline.deleted).toEqual([deleted])
        expect(operation.signal).toBe(handle.signal)
        expect(projectDir).toBe("/project")
        await producer.writeBatch({ updates: [yamlUpdate(yaml)], hashBytes: new Uint8Array(8) })
        return { hashedFiles: 1, parsedYamlFiles: 1, changedFiles: 1, missingFiles: 1 }
      },
      beforeCheckpoint: async () => { events.push("prepare") },
    })

    expect(events).toEqual([
      "discover",
      "baseline",
      "begin",
      "delete:cf/Удалённый.yaml",
      "process",
      "write",
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

  it("сохраняет локальные ошибки и выполняет полную проверку зависимостей", async () => {
    const duplicate = diagnostic("cf/Конфигурация.yaml", "duplicate", "structure", 1)
    const dependency = diagnostic("cf/Конфигурация.yaml", "dependency", "reference", 2)
    const handle = new TrackingRefreshHandle([], {
      localDiagnostics: [duplicate],
      dependencyDiagnostics: [dependency, duplicate],
    })

    const result = await refreshProjectState({ projectDir: "/project" }, emptyDependencies(handle))

    expect(result.diagnostics).toEqual([duplicate, dependency])
    expect(handle.checkpointCalls).toBe(1)
    expect(handle.rollbackCalls).toBe(0)
  })

  it("не начинает транзакцию при ошибке обнаружения или чтения baseline", async () => {
    const discoveryHandle = new TrackingRefreshHandle([])
    await expect(refreshProjectState({ projectDir: "/project" }, {
      ...emptyDependencies(discoveryHandle),
      discoverFiles: async () => { throw new Error("discover failed") },
    })).rejects.toThrow("discover failed")

    const baselineHandle = new class extends TrackingRefreshHandle {
      override async readFileBaseline(): Promise<ProjectStateFileBaseline> {
        throw new Error("baseline failed")
      }
    }([])
    await expect(refreshProjectState({ projectDir: "/project" }, emptyDependencies(baselineHandle)))
      .rejects.toThrow("baseline failed")

    expect(discoveryHandle.beginCalls).toBe(0)
    expect(discoveryHandle.rollbackCalls).toBe(0)
    expect(baselineHandle.beginCalls).toBe(0)
    expect(baselineHandle.rollbackCalls).toBe(0)
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
      override async commitAndCheckpoint(): Promise<{ readonly snapshotPath: string }> {
        this.checkpointCalls += 1
        checkpointStarted()
        await waitForRelease
        return { snapshotPath: "/project/.nkdk/cache/project-state.sqlite" }
      }
    }([])
    const running = refreshProjectState(
      { projectDir: "/project", signal: controller.signal },
      emptyDependencies(handle),
    )
    await started

    controller.abort()
    releaseCheckpoint()

    await expect(running).resolves.toMatchObject({ readToken: new Uint8Array([1]) })
    expect(handle.rollbackCalls).toBe(0)
  })

  it("передаёт один внутренний сигнал в writer и worker и откатывает отменённую операцию", async () => {
    const userController = new AbortController()
    const handle = new TrackingRefreshHandle([])
    let workerSignal: AbortSignal | undefined

    await expect(refreshProjectState({ projectDir: "/project", signal: userController.signal }, {
      ...emptyDependencies(handle),
      async processFiles(_files, _baseline, _producer, operation: ProjectStateRefreshOperation) {
        workerSignal = operation.signal
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
  }
  signal?: AbortSignal
  beginCalls = 0
  checkpointCalls = 0
  rollbackCalls = 0

  constructor(events: string[], options: TrackingRefreshHandle["options"] = {}) {
    this.events = events
    this.options = options
  }

  async readFileBaseline(files: readonly ProjectStateFileIdentity[]): Promise<ProjectStateFileBaseline> {
    this.events.push("baseline")
    return {
      knownHashBits: new Uint8Array(Math.ceil(files.length / 8)),
      hashBytes: new Uint8Array(files.length * 8),
      deleted: this.options.deleted === undefined ? [] : [this.options.deleted],
    }
  }

  async beginUpdate(_projectDir: string, signal?: AbortSignal): Promise<void> {
    this.events.push("begin")
    this.beginCalls += 1
    this.signal = signal
  }

  async writeBatch(_batch: ProjectStateFileUpdateBatch): Promise<void> {
    this.events.push("write")
  }

  async deleteFiles(projectPaths: readonly string[]): Promise<void> {
    for (const path of projectPaths) this.events.push(`delete:${path}`)
  }

  async readLocalDiagnostics(): Promise<readonly Diagnostic[]> {
    this.events.push("local")
    return this.options.localDiagnostics ?? []
  }

  async validateDependencies(): Promise<readonly Diagnostic[]> {
    this.events.push("dependencies")
    return this.options.dependencyDiagnostics ?? []
  }

  async createReadToken(): Promise<ProjectStateReadToken> {
    this.events.push("token")
    return new Uint8Array([1]) as ProjectStateReadToken
  }

  async commitAndCheckpoint(): Promise<{ readonly snapshotPath: string }> {
    this.events.push("checkpoint")
    this.checkpointCalls += 1
    return { snapshotPath: "/project/.nkdk/cache/project-state.sqlite" }
  }

  async rollbackUpdate(): Promise<void> {
    this.events.push("rollback")
    this.rollbackCalls += 1
  }
}

function emptyDependencies(handle: ProjectStateRefreshHandle): ProjectStateRefreshDependencies {
  return {
    handle,
    discoverFiles: async () => [],
    processFiles: async () => ({
      hashedFiles: 0,
      parsedYamlFiles: 0,
      changedFiles: 0,
      missingFiles: 0,
    }),
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

function yamlUpdate(file: ProjectStateFileIdentity): ProjectStateFileUpdateBatch["updates"][number] {
  return {
    ...file,
    kind: "yaml",
    localValidation: { contributedFacts: false, diagnostics: [], schemaDiagnostics: [] },
    references: [],
    pendingReferences: [],
    owners: [],
    fields: [],
    forms: [],
    pendingChecks: [],
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
