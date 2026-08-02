import { mkdtemp, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import { configurationMetadataProjectSpec } from "../project/specs"
import type { PreparedYamlProjectWorkerPool } from "../project/preparedYamlProjectWorkerPool"
import type { Diagnostic } from "../validation/types"
import type { ProjectStateFileIdentity, ProjectStateFileUpdateBatch } from "./fileUpdate"
import type { ProjectStateFileChanges } from "./store"
import type { ProjectStateFileHashBatch, ProjectStateReadToken } from "./contracts"
import {
  createProjectStateRefreshDependencies,
  refreshProjectState,
  type CollectedProjectStateFiles,
  type ProjectStateRefreshHandle,
  type ProjectStateRefreshOperation,
  type ProjectStateYamlInput,
} from "./refresh"
import {
  collectProjectStateFiles,
  isProjectStateFileCollectionStable,
  ProjectStateFilesChangedError,
  releaseProjectResourceBytesExcept,
} from "./projectFiles"

const tempDirs: string[] = []

afterEach(async () => {
  for (const dir of tempDirs.splice(0)) await rm(dir, { recursive: true, force: true })
})

describe("refreshProjectState", () => {
  it("не перебирает YAML inputs и не строит DTO до индексного запроса pool", async () => {
    const yaml = identity("cf/Конфигурация.yaml", "yaml")
    let inputReads = 0
    let valueReads = 0
    const inputs = new Proxy([{
      identity: yaml,
      get value() {
        valueReads += 1
        return {}
      },
    }] satisfies ProjectStateYamlInput[], {
      get(target, property, receiver) {
        if (typeof property === "string" && /^\d+$/u.test(property)) inputReads += 1
        return Reflect.get(target, property, receiver)
      },
    })
    const pool = {
      async runLocalValidation() {
        expect(inputReads).toBe(0)
        expect(valueReads).toBe(0)
        return { diagnostics: [], parsedYamlFiles: 0 }
      },
    } as unknown as PreparedYamlProjectWorkerPool
    const dependencies = createProjectStateRefreshDependencies({
      handle: new MemoryRefreshHandle(),
      pool,
      context: { version: "2.20", defaultLanguage: "ru", exportToYAML: { toTyped: false } },
    })
    const controller = new AbortController()

    await expect(dependencies.runLocalValidation(inputs, dependencies.handle, {
      signal: controller.signal,
      abort: (reason) => controller.abort(reason),
    }, "/project")).resolves.toBe(0)
    expect({ inputReads, valueReads }).toEqual({ inputReads: 0, valueReads: 0 })
  })

  it("на холодном и прогретом проходах хэширует все ресурсы, но повторно не разбирает YAML", async () => {
    const yaml = identity("cf/Конфигурация.yaml", "yaml")
    const resource = identity("cf/Логотип.png", "resource")
    const hashBytes = Uint8Array.from([
      0, 0, 0, 0, 0, 0, 0, 1,
      0, 0, 0, 0, 0, 0, 0, 2,
    ])
    const handle = new MemoryRefreshHandle()
    let hashCalls = 0
    let parseCalls = 0
    let validateCalls = 0
    const retainedBytes: string[][] = []

    const collectFiles = async (): Promise<CollectedProjectStateFiles> => {
      hashCalls += 2
      return {
        projectDir: "/project",
        resources: [],
        discover: async () => [],
        hashBatch: { files: [yaml, resource], hashBytes: hashBytes.slice() },
        yamlInputs: [{ identity: yaml, value: {} }],
        releaseBytesExcept: (paths) => retainedBytes.push([...paths]),
      }
    }
    const runLocalValidation = async (
      files: readonly unknown[],
      producer: Pick<ProjectStateRefreshHandle, "writeBatch">,
    ): Promise<number> => {
      parseCalls += files.length
      validateCalls += files.length
      if (files.length > 0) {
        await producer.writeBatch({
          updates: [yamlUpdate(yaml)],
          hashBytes: hashBytes.slice(0, 8),
        })
      }
      return files.length
    }
    const dependencies = {
      handle,
      collectFiles,
      runLocalValidation,
      writeChangedResources: async (
        changes: ProjectStateFileChanges,
        _files: CollectedProjectStateFiles,
        producer: Pick<ProjectStateRefreshHandle, "writeBatch">,
      ) => {
        const resourceChanges = changes.changed.filter(({ file }) => file.resourceKind === "resource")
        if (resourceChanges.length > 0) {
          await producer.writeBatch({
            updates: resourceChanges.map(({ file }) => ({ ...file, kind: "resource" as const })),
            hashBytes: hashBytes.slice(8),
          })
        }
      },
      isStable: async () => true,
    }

    const cold = await refreshProjectState({ projectDir: "/project" }, dependencies)
    const warm = await refreshProjectState({ projectDir: "/project" }, dependencies)

    expect(cold.stats).toEqual({ hashedFiles: 2, parsedYamlFiles: 1, changedFiles: 2, deletedFiles: 0 })
    expect(warm.stats).toEqual({ hashedFiles: 2, parsedYamlFiles: 0, changedFiles: 0, deletedFiles: 0 })
    expect({ hashCalls, parseCalls, validateCalls }).toEqual({ hashCalls: 4, parseCalls: 1, validateCalls: 1 })
    expect(retainedBytes).toEqual([[yaml.projectPath], []])
  })

  it("разбирает только изменённый YAML, отдельно обновляет ресурс и каскадно удаляет diagnostics", async () => {
    const first = identity("cf/Первый.yaml", "yaml")
    const second = identity("cf/Второй.yaml", "yaml")
    const resource = identity("cf/Картинка.bin", "resource")
    const handle = new MemoryRefreshHandle()
    let current = collected([first, second, resource], [1, 2, 3])
    const parsed: string[] = []
    const dependencies = {
      handle,
      collectFiles: async () => current,
      async runLocalValidation(files: readonly ProjectStateYamlInput[], producer: Pick<ProjectStateRefreshHandle, "writeBatch">) {
        const inputs = files
        parsed.push(...inputs.map(({ identity }) => identity.projectPath))
        if (inputs.length > 0) {
          await producer.writeBatch({
            updates: inputs.map(({ identity }) => yamlUpdate(identity, `diag:${identity.projectPath}`)),
            hashBytes: hashesFor(current.hashBatch, inputs.map(({ identity }) => identity.projectPath)),
          })
        }
        return inputs.length
      },
      writeChangedResources,
      isStable: async () => true,
    }

    await refreshProjectState({ projectDir: "/project" }, dependencies)
    parsed.length = 0
    current = collected([first, second, resource], [1, 9, 8])
    const changed = await refreshProjectState({ projectDir: "/project" }, dependencies)
    expect(changed.stats).toMatchObject({ parsedYamlFiles: 1, changedFiles: 2 })
    expect(parsed).toEqual([second.projectPath])

    current = collected([second, resource], [9, 8])
    const deleted = await refreshProjectState({ projectDir: "/project" }, dependencies)
    expect(deleted.stats.deletedFiles).toBe(1)
    expect(deleted.diagnostics.map(({ message }) => message)).toEqual([`diag:${second.projectPath}`])
  })

  it("при изменении только управляемого resource обновляет его хэш без разбора YAML", async () => {
    const yaml = identity("cf/Конфигурация.yaml", "yaml")
    const resource = identity("cf/Картинка.bin", "resource")
    const handle = new MemoryRefreshHandle()
    let current = collected([yaml, resource], [1, 2])
    let parseCalls = 0
    const dependencies = {
      handle,
      collectFiles: async () => current,
      async runLocalValidation(files: readonly ProjectStateYamlInput[], producer: Pick<ProjectStateRefreshHandle, "writeBatch">) {
        parseCalls += files.length
        if (files.length > 0) await producer.writeBatch({ updates: [yamlUpdate(yaml)], hashBytes: current.hashBatch.hashBytes.slice(0, 8) })
        return files.length
      },
      writeChangedResources,
      isStable: async () => true,
    }

    await refreshProjectState({ projectDir: "/project" }, dependencies)
    current = collected([yaml, resource], [1, 7])
    const changed = await refreshProjectState({ projectDir: "/project" }, dependencies)
    const warm = await refreshProjectState({ projectDir: "/project" }, dependencies)

    expect(changed.stats).toMatchObject({ parsedYamlFiles: 0, changedFiles: 1 })
    expect(warm.stats).toMatchObject({ parsedYamlFiles: 0, changedFiles: 0 })
    expect(parseCalls).toBe(1)
  })

  it("после двух конфликтов stability откатывает обе попытки и возвращает техническую ошибку", async () => {
    const yaml = identity("cf/Конфигурация.yaml", "yaml")
    const handle = new MemoryRefreshHandle()
    const current = collected([yaml], [1])
    let attempts = 0
    const dependencies = {
      handle,
      collectFiles: async () => {
        attempts += 1
        return current
      },
      async runLocalValidation(files: readonly ProjectStateYamlInput[], producer: Pick<ProjectStateRefreshHandle, "writeBatch">) {
        if (files.length > 0) await producer.writeBatch({ updates: [yamlUpdate(yaml)], hashBytes: current.hashBatch.hashBytes.slice() })
        return files.length
      },
      writeChangedResources: async () => undefined,
      isStable: async () => false,
    }

    await expect(refreshProjectState({ projectDir: "/project" }, dependencies)).rejects.toThrow("после двух попыток")
    expect(attempts).toBe(2)
    await expect(handle.compareFiles(current.hashBatch)).resolves.toMatchObject({ changed: [{ index: 0 }] })
  })

  it("не маскирует ошибку checkpoint ошибкой повторного cleanup", async () => {
    const yaml = identity("cf/Конфигурация.yaml", "yaml")
    const current = collected([yaml], [1])
    const handle = new class extends MemoryRefreshHandle {
      override async commitAndCheckpoint(): Promise<{ readonly snapshotPath: string }> {
        await super.commitAndCheckpoint()
        throw new Error("checkpoint failed")
      }

      override async rollbackUpdate(): Promise<void> {
        throw new Error("Нет активного обновления состояния проекта")
      }
    }()
    const dependencies = {
      handle,
      collectFiles: async () => current,
      async runLocalValidation(files: readonly ProjectStateYamlInput[], producer: Pick<ProjectStateRefreshHandle, "writeBatch">) {
        await producer.writeBatch({ updates: [yamlUpdate(yaml)], hashBytes: current.hashBatch.hashBytes.slice() })
        return files.length
      },
      writeChangedResources: async () => undefined,
      isStable: async () => true,
    }

    await expect(refreshProjectState({ projectDir: "/project" }, dependencies)).rejects.toMatchObject({
      message: "checkpoint failed",
      errors: [
        { message: "checkpoint failed" },
        { message: "Нет активного обновления состояния проекта" },
      ],
    })
  })

  it("выполняет обязательную подготовку до выдачи token и checkpoint", async () => {
    const events: string[] = []
    const handle = new class extends MemoryRefreshHandle {
      override async createReadToken(): Promise<ProjectStateReadToken> {
        events.push("token")
        return super.createReadToken()
      }

      override async commitAndCheckpoint(): Promise<{ readonly snapshotPath: string }> {
        events.push("checkpoint")
        return super.commitAndCheckpoint()
      }
    }()
    const dependencies = {
      handle,
      collectFiles: async () => collected([], []),
      runLocalValidation: async () => 0,
      writeChangedResources: async () => undefined,
      isStable: async () => true,
      beforeCheckpoint: async () => { events.push("prepare") },
    }

    await refreshProjectState({ projectDir: "/project" }, dependencies)

    expect(events).toEqual(["prepare", "token", "checkpoint"])
  })

  it("отменяется после подготовки до выдачи token и checkpoint", async () => {
    const controller = new AbortController()
    const preparation = new TestGate()
    let tokenCalls = 0
    const handle = new class extends TrackingRefreshHandle {
      override async createReadToken(): Promise<ProjectStateReadToken> {
        tokenCalls += 1
        return super.createReadToken()
      }
    }()
    const running = refreshProjectState({ projectDir: "/project", signal: controller.signal }, {
      ...emptyRefreshDependencies(handle),
      async beforeCheckpoint() {
        preparation.start()
        await preparation.wait()
      },
    })
    await preparation.started

    controller.abort()
    preparation.release()

    await expect(running).rejects.toMatchObject({ name: "AbortError" })
    expect({ tokenCalls, checkpointCalls: handle.checkpointCalls, rollbackCalls: handle.rollbackCalls }).toEqual({
      tokenCalls: 0,
      checkpointCalls: 0,
      rollbackCalls: 1,
    })
  })

  it("игнорирует позднюю отмену после начала необратимого checkpoint", async () => {
    const controller = new AbortController()
    const checkpoint = new TestGate()
    let rollbackCalls = 0
    const handle = new class extends MemoryRefreshHandle {
      override async commitAndCheckpoint(): Promise<{ readonly snapshotPath: string }> {
        checkpoint.start()
        await checkpoint.wait()
        return super.commitAndCheckpoint()
      }

      override async rollbackUpdate(): Promise<void> {
        rollbackCalls += 1
        return super.rollbackUpdate()
      }
    }()
    const running = refreshProjectState(
      { projectDir: "/project", signal: controller.signal },
      emptyRefreshDependencies(handle),
    )
    await checkpoint.started

    controller.abort()
    checkpoint.release()

    await expect(running).resolves.toMatchObject({ readToken: new Uint8Array([1]) })
    expect(rollbackCalls).toBe(0)
  })

  it("не вызывает cleanup до начала транзакции", async () => {
    const current = collected([], [])
    let cleanupCalls = 0
    const handle = new class extends MemoryRefreshHandle {
      override async compareFiles(): Promise<ProjectStateFileChanges> {
        throw new Error("compare failed")
      }

      override async rollbackUpdate(): Promise<void> {
        cleanupCalls += 1
      }
    }()

    await expect(refreshProjectState({ projectDir: "/project" }, {
      handle,
      collectFiles: async () => current,
      runLocalValidation: async () => 0,
      writeChangedResources: async () => undefined,
      isStable: async () => true,
    })).rejects.toThrow("compare failed")
    expect(cleanupCalls).toBe(0)
  })

  it("останавливается после отмены во время collect до начала транзакции", async () => {
    const controller = new AbortController()
    let releaseCollect!: () => void
    let notifyCollectStarted!: () => void
    const collectGate = new Promise<void>((resolve) => { releaseCollect = resolve })
    const collectStarted = new Promise<void>((resolve) => { notifyCollectStarted = resolve })
    let compareCalls = 0
    let beginCalls = 0
    let commitCalls = 0
    const handle = new class extends MemoryRefreshHandle {
      override async compareFiles(batch: ProjectStateFileHashBatch): Promise<ProjectStateFileChanges> {
        compareCalls += 1
        return super.compareFiles(batch)
      }

      override async beginUpdate(): Promise<void> {
        beginCalls += 1
        await super.beginUpdate()
      }

      override async commitAndCheckpoint(): Promise<{ readonly snapshotPath: string }> {
        commitCalls += 1
        return super.commitAndCheckpoint()
      }
    }()
    const running = refreshProjectState({ projectDir: "/project", signal: controller.signal }, {
      handle,
      async collectFiles() {
        notifyCollectStarted()
        await collectGate
        return collected([], [])
      },
      runLocalValidation: async () => 0,
      writeChangedResources: async () => undefined,
      isStable: async () => true,
    })
    await collectStarted
    controller.abort()
    releaseCollect()

    await expect(running).rejects.toMatchObject({ name: "AbortError" })
    expect({ compareCalls, beginCalls, commitCalls }).toEqual({ compareCalls: 0, beginCalls: 0, commitCalls: 0 })
  })

  it("передаёт отмену во время worker writer-операции и дожидается cleanup", async () => {
    const controller = new AbortController()
    const yaml = identity("cf/Конфигурация.yaml", "yaml")
    const current = collected([yaml], [1])
    let operationAborted = false
    let cleanupCalls = 0
    const handle = new class extends MemoryRefreshHandle {
      override async beginUpdate(_projectDir?: string, signal?: AbortSignal): Promise<void> {
        signal?.addEventListener("abort", () => { operationAborted = true }, { once: true })
        await super.beginUpdate()
      }

      override async commitAndCheckpoint(): Promise<{ readonly snapshotPath: string }> {
        if (operationAborted) throw controller.signal.reason
        return super.commitAndCheckpoint()
      }

      override async rollbackUpdate(): Promise<void> {
        cleanupCalls += 1
        await super.rollbackUpdate()
      }
    }()

    await expect(refreshProjectState({ projectDir: "/project", signal: controller.signal }, {
      handle,
      collectFiles: async () => current,
      async runLocalValidation(files, producer) {
        controller.abort()
        const cancelledBatch = { updates: [yamlUpdate(yaml)], hashBytes: current.hashBatch.hashBytes.slice() }
        await producer.writeBatch(cancelledBatch)
        return files.length
      },
      writeChangedResources: async () => undefined,
      isStable: async () => true,
    })).rejects.toMatchObject({ name: "AbortError" })
    expect({ operationAborted, cleanupCalls }).toEqual({ operationAborted: true, cleanupCalls: 1 })
  })

  it("передаёт один owned operation signal в writer и validation и ждёт отменённую запись", async () => {
    const yaml = identity("cf/Конфигурация.yaml", "yaml")
    const current = collected([yaml], [1])
    const userController = new AbortController()
    const primary = new Error("validation lane failed")
    let writerSignal: AbortSignal | undefined
    let validationSignal: AbortSignal | undefined
    let writeSettled = false
    let cleanupCalls = 0
    const handle = new class extends MemoryRefreshHandle {
      override async beginUpdate(projectDir: string, signal?: AbortSignal): Promise<void> {
        writerSignal = signal
        return super.beginUpdate(projectDir)
      }

      override writeBatch(): Promise<void> {
        return new Promise((_resolve, reject) => {
          writerSignal?.addEventListener("abort", () => {
            writeSettled = true
            reject(writerSignal?.reason)
          }, { once: true })
        })
      }

      override async rollbackUpdate(): Promise<void> {
        cleanupCalls += 1
        return super.rollbackUpdate()
      }
    }()

    await expect(refreshProjectState({ projectDir: "/project", signal: userController.signal }, {
      handle,
      collectFiles: async () => current,
      async runLocalValidation(_files, producer, operation: ProjectStateRefreshOperation) {
        validationSignal = operation.signal
        const write = producer.writeBatch({ updates: [yamlUpdate(yaml)], hashBytes: current.hashBatch.hashBytes.slice() })
        operation.abort(primary)
        await write
        return 1
      },
      writeChangedResources: async () => undefined,
      isStable: async () => true,
    })).rejects.toBe(primary)
    expect(writerSignal).toBeDefined()
    expect(writerSignal).not.toBe(userController.signal)
    expect(validationSignal).toBe(writerSignal)
    expect({ writeSettled, cleanupCalls }).toEqual({ writeSettled: true, cleanupCalls: 1 })
  })

  it("получает read token до checkpoint и откатывает candidate при ошибке token", async () => {
    let checkpointCalls = 0
    let rollbackCalls = 0
    const handle = new class extends MemoryRefreshHandle {
      override async createReadToken(): Promise<ProjectStateReadToken> {
        throw new Error("token failed")
      }

      override async commitAndCheckpoint(): Promise<{ readonly snapshotPath: string }> {
        checkpointCalls += 1
        return super.commitAndCheckpoint()
      }

      override async rollbackUpdate(): Promise<void> {
        rollbackCalls += 1
        return super.rollbackUpdate()
      }
    }()

    await expect(refreshProjectState({ projectDir: "/project" }, emptyRefreshDependencies(handle)))
      .rejects.toThrow("token failed")
    expect({ checkpointCalls, rollbackCalls }).toEqual({ checkpointCalls: 0, rollbackCalls: 1 })
  })

  it("после успешного checkpoint не выполняет fallible запрос read token", async () => {
    let checkpointed = false
    let tokenCalls = 0
    const handle = new class extends MemoryRefreshHandle {
      override async createReadToken(): Promise<ProjectStateReadToken> {
        tokenCalls += 1
        if (checkpointed) throw new Error("late token failed")
        return super.createReadToken()
      }

      override async commitAndCheckpoint(): Promise<{ readonly snapshotPath: string }> {
        const result = await super.commitAndCheckpoint()
        checkpointed = true
        return result
      }
    }()

    await expect(refreshProjectState({ projectDir: "/project" }, emptyRefreshDependencies(handle)))
      .resolves.toMatchObject({ readToken: new Uint8Array([1]) })
    expect(tokenCalls).toBe(1)
  })

  describe("полная dependency validation", () => {
    it("объединяет local/global diagnostics, дедуплицирует, сортирует и повторяет global на прогретом refresh", async () => {
      const yaml = identity("cf/Конфигурация.yaml", "yaml")
      const current = collected([yaml], [1])
      const duplicate: Diagnostic = {
        filePath: yaml.projectPath,
        line: 1,
        col: 1,
        severity: "error",
        source: "structure",
        message: "duplicate",
      }
      const later: Diagnostic = { ...duplicate, line: 2, source: "reference", message: "global" }
      let validationCalls = 0
      const handle = new class extends MemoryRefreshHandle {
        override async validateDependencies(): Promise<readonly Diagnostic[]> {
          validationCalls += 1
          return [later, duplicate]
        }
      }()
      const dependencies = {
        handle,
        collectFiles: async () => current,
        async runLocalValidation(files: readonly ProjectStateYamlInput[], producer: Pick<ProjectStateRefreshHandle, "writeBatch">) {
          if (files.length > 0) {
            await producer.writeBatch({
              updates: [yamlUpdate(yaml, "duplicate")],
              hashBytes: current.hashBatch.hashBytes.slice(),
            })
          }
          return files.length
        },
        writeChangedResources: async () => undefined,
        isStable: async () => true,
      }

      const cold = await refreshProjectState({ projectDir: "/project" }, dependencies)
      const warm = await refreshProjectState({ projectDir: "/project" }, dependencies)

      expect(cold.diagnostics).toEqual([duplicate, later])
      expect(warm.diagnostics).toEqual([duplicate, later])
      expect(validationCalls).toBe(2)
    })

    it("обычная global diagnostic не мешает commit/checkpoint", async () => {
      const global: Diagnostic = {
        filePath: "cf/Источник.yaml",
        line: 1,
        col: 1,
        severity: "error",
        source: "reference",
        message: "missing",
      }
      const handle = new class extends TrackingRefreshHandle {
        override async validateDependencies(): Promise<readonly Diagnostic[]> {
          return [global]
        }
      }()

      await expect(refreshProjectState({ projectDir: "/project" }, emptyRefreshDependencies(handle)))
        .resolves.toMatchObject({ diagnostics: [global] })
      expect(handle.checkpointCalls).toBe(1)
    })

    it("technical dependency failure откатывает без checkpoint, после чего следующая операция работает", async () => {
      let fail = true
      const handle = new class extends TrackingRefreshHandle {
        override async validateDependencies(): Promise<readonly Diagnostic[]> {
          if (fail) throw new Error("dependency failed")
          return []
        }
      }()
      const dependencies = emptyRefreshDependencies(handle)

      await expect(refreshProjectState({ projectDir: "/project" }, dependencies)).rejects.toThrow("dependency failed")
      expect({ rollbackCalls: handle.rollbackCalls, checkpointCalls: handle.checkpointCalls })
        .toEqual({ rollbackCalls: 1, checkpointCalls: 0 })
      fail = false
      await expect(refreshProjectState({ projectDir: "/project" }, dependencies)).resolves.toBeDefined()
      expect(handle.checkpointCalls).toBe(1)
    })

    it("early abort перед dependency validation откатывает без validation/checkpoint", async () => {
      const controller = new AbortController()
      let validationCalls = 0
      const handle = new class extends TrackingRefreshHandle {
        override async validateDependencies(): Promise<readonly Diagnostic[]> {
          validationCalls += 1
          return []
        }
      }()

      await expect(refreshProjectState({ projectDir: "/project", signal: controller.signal }, {
        ...emptyRefreshDependencies(handle),
        async runLocalValidation() {
          controller.abort()
          return 0
        },
      })).rejects.toMatchObject({ name: "AbortError" })
      expect({
        validationCalls,
        rollbackCalls: handle.rollbackCalls,
        checkpointCalls: handle.checkpointCalls,
      }).toEqual({
        validationCalls: 0,
        rollbackCalls: 1,
        checkpointCalls: 0,
      })
      await expect(refreshProjectState({ projectDir: "/project" }, emptyRefreshDependencies(handle)))
        .resolves.toBeDefined()
      expect({ validationCalls, checkpointCalls: handle.checkpointCalls })
        .toEqual({ validationCalls: 1, checkpointCalls: 1 })
    })

    it("проверяет stability после dependency validation и повторяет validation при retry", async () => {
      const events: string[] = []
      let stabilityCalls = 0
      const handle = new class extends MemoryRefreshHandle {
        override async validateDependencies(): Promise<readonly Diagnostic[]> {
          events.push("dependency")
          return []
        }
      }()

      await refreshProjectState({ projectDir: "/project" }, {
        ...emptyRefreshDependencies(handle),
        async isStable() {
          events.push("stability")
          stabilityCalls += 1
          return stabilityCalls > 1
        },
      })

      expect(events).toEqual(["dependency", "stability", "dependency", "stability"])
    })
  })
})

describe("project-state files", () => {
  it("классифицирует исчезновение между discovery и open как конфликт и ограничивает его двумя попытками", async () => {
    const projectDir = await mkdtemp(join(tmpdir(), "nkdk-project-state-missing-"))
    tempDirs.push(projectDir)
    const missingPath = join(projectDir, "Исчез.yaml")
    const ref = {
      componentPath: "cf",
      ref: {
        kind: "yaml" as const,
        role: "configuration" as const,
        projectPath: "Исчез.yaml",
        absolutePath: missingPath,
        owner: { dir: "", name: "Конфигурация", spec: configurationMetadataProjectSpec },
      },
    }
    let attempts = 0

    await expect(refreshProjectState({ projectDir }, {
      handle: new MemoryRefreshHandle(),
      async collectFiles() {
        attempts += 1
        const collection = await collectProjectStateFiles({ projectDir, discover: async () => [ref] })
        return { ...collection, yamlInputs: [], releaseBytesExcept: () => undefined }
      },
      runLocalValidation: async () => 0,
      writeChangedResources: async () => undefined,
      isStable: async () => true,
    })).rejects.toThrow("после двух попыток")
    expect(attempts).toBe(2)
  })

  it("не классифицирует прочую ошибку чтения как stability conflict", async () => {
    const projectDir = await mkdtemp(join(tmpdir(), "nkdk-project-state-io-"))
    tempDirs.push(projectDir)
    const ref = {
      componentPath: "cf",
      ref: {
        kind: "yaml" as const,
        role: "configuration" as const,
        projectPath: "Каталог.yaml",
        absolutePath: projectDir,
        owner: { dir: "", name: "Конфигурация", spec: configurationMetadataProjectSpec },
      },
    }

    await expect(collectProjectStateFiles({ projectDir, discover: async () => [ref] })).rejects.not.toBeInstanceOf(
      ProjectStateFilesChangedError,
    )
  })

  it("читает каждый ресурс, кодирует локальный xxHash64 один раз в общий big-endian буфер и проверяет stability", async () => {
    const projectDir = await mkdtemp(join(tmpdir(), "nkdk-project-state-files-"))
    tempDirs.push(projectDir)
    const yamlPath = join(projectDir, "Конфигурация.yaml")
    const resourcePath = join(projectDir, "Логотип.bin")
    await writeFile(yamlPath, "Имя: Тест\n")
    await writeFile(resourcePath, Uint8Array.from([1, 2, 3]))
    const refs = [
      {
        componentPath: "cf",
        ref: {
          kind: "yaml" as const,
          role: "configuration" as const,
          projectPath: "Конфигурация.yaml",
          absolutePath: yamlPath,
          owner: { dir: "", name: "Конфигурация", spec: configurationMetadataProjectSpec },
        },
      },
      {
        componentPath: "cf",
        ref: {
          kind: "resource" as const,
          role: "resourceOnly",
          projectPath: "Логотип.bin",
          absolutePath: resourcePath,
          owner: { dir: "", name: "Конфигурация", spec: configurationMetadataProjectSpec },
          descriptorKind: "externalFile" as const,
          source: { kind: "itemRule" as const, description: "logo" },
        },
      },
    ]
    const hashedBytes: number[][] = []

    const collected = await collectProjectStateFiles({
      projectDir,
      discover: async () => refs,
      hashBytes(bytes) {
        hashedBytes.push([...bytes])
        return bytes[0] === 0xD0 ? 0x0102030405060708n : 0x81828384858687ffn
      },
    })

    expect(hashedBytes).toHaveLength(2)
    expect(collected.hashBatch.hashBytes).toEqual(Uint8Array.from([
      1, 2, 3, 4, 5, 6, 7, 8,
      0x81, 0x82, 0x83, 0x84, 0x85, 0x86, 0x87, 0xff,
    ]))
    expect(collected.hashBatch.hashBytes.byteOffset).toBe(0)
    expect(collected.hashBatch.hashBytes.buffer.byteLength).toBe(16)
    expect(structuredClone(collected.hashBatch)).not.toHaveProperty("localHash")
    const yamlByteLength = collected.resources[0]!.bytes.byteLength
    releaseProjectResourceBytesExcept(collected, new Set(["cf/Конфигурация.yaml"]))
    expect(collected.resources.map(({ bytes }) => bytes.byteLength)).toEqual([yamlByteLength, 0])
    await expect(isProjectStateFileCollectionStable(collected)).resolves.toBe(true)
    await writeFile(resourcePath, Uint8Array.from([3, 2, 1, 0]))
    await expect(isProjectStateFileCollectionStable(collected)).resolves.toBe(false)
  })
})

class MemoryRefreshHandle implements ProjectStateRefreshHandle {
  private files = new Map<string, { identity: ProjectStateFileIdentity; update: ProjectStateFileUpdateBatch["updates"][number]; hash: Uint8Array }>()
  private nextFiles: typeof this.files | undefined

  async compareFiles(batch: ProjectStateFileHashBatch): Promise<ProjectStateFileChanges> {
    const currentPaths = new Set(batch.files.map(({ projectPath }) => projectPath))
    return {
      changed: batch.files.flatMap((file, index) => {
        const hash = batch.hashBytes.slice(index * 8, index * 8 + 8)
        const stored = this.files.get(file.projectPath)
        return stored === undefined || !bytesEqual(stored.hash, hash) ? [{ index, file }] : []
      }),
      deleted: [...this.files.values()].flatMap(({ identity }) => currentPaths.has(identity.projectPath) ? [] : [identity]),
    }
  }

  async beginUpdate(_projectDir?: string, _signal?: AbortSignal): Promise<void> {
    this.nextFiles = new Map(this.files)
  }

  async writeBatch(batch: ProjectStateFileUpdateBatch): Promise<void> {
    if (this.nextFiles === undefined) throw new Error("update not begun")
    batch.updates.forEach((update, index) => {
      this.nextFiles!.set(update.projectPath, {
        identity: update,
        update,
        hash: batch.hashBytes.slice(index * 8, index * 8 + 8),
      })
    })
  }

  async deleteFiles(projectPaths: readonly string[]): Promise<void> {
    for (const projectPath of projectPaths) this.nextFiles?.delete(projectPath)
  }

  async readLocalDiagnostics(): Promise<readonly Diagnostic[]> {
    return [...(this.nextFiles ?? this.files).values()].flatMap(({ update }) => update.kind === "yaml"
      ? update.localValidation.diagnostics.map((diagnostic) => ({ ...diagnostic, filePath: update.projectPath }))
      : [])
  }

  async validateDependencies(): Promise<readonly Diagnostic[]> {
    return []
  }

  async createReadToken(): Promise<ProjectStateReadToken> {
    return new Uint8Array([1]) as ProjectStateReadToken
  }

  async commitAndCheckpoint(): Promise<{ readonly snapshotPath: string }> {
    this.files = this.nextFiles ?? this.files
    this.nextFiles = undefined
    return { snapshotPath: "/project/.nkdk/cache/project-state.sqlite" }
  }

  async rollbackUpdate(): Promise<void> {
    this.nextFiles = undefined
  }
}

class TrackingRefreshHandle extends MemoryRefreshHandle {
  rollbackCalls = 0
  checkpointCalls = 0

  override async commitAndCheckpoint(): Promise<{ readonly snapshotPath: string }> {
    this.checkpointCalls += 1
    return super.commitAndCheckpoint()
  }

  override async rollbackUpdate(): Promise<void> {
    this.rollbackCalls += 1
    return super.rollbackUpdate()
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

function yamlUpdate(file: ProjectStateFileIdentity, message?: string): ProjectStateFileUpdateBatch["updates"][number] {
  return {
    ...file,
    kind: "yaml",
    localValidation: {
      contributedFacts: false,
      diagnostics: message === undefined ? [] : [{ line: 1, col: 1, severity: "error", source: "structure", message }],
      schemaDiagnostics: [],
    },
    references: [],
    pendingReferences: [],
    owners: [],
    fields: [],
    forms: [],
    pendingChecks: [],
    dependencies: [],
  }
}

async function writeChangedResources(
  changes: ProjectStateFileChanges,
  files: CollectedProjectStateFiles,
  producer: Pick<ProjectStateRefreshHandle, "writeBatch">,
): Promise<void> {
  const indexes = changes.changed.filter(({ file }) => file.resourceKind === "resource").map(({ index }) => index)
  if (indexes.length === 0) return
  await producer.writeBatch({
    updates: indexes.map((index) => ({ ...files.hashBatch.files[index]!, kind: "resource" as const })),
    hashBytes: hashesAt(files.hashBatch, indexes),
  })
}

function collected(
  files: readonly ProjectStateFileIdentity[],
  hashes: readonly number[],
): CollectedProjectStateFiles {
  const hashBytes = new Uint8Array(files.length * 8)
  hashes.forEach((hash, index) => hashBytes[index * 8 + 7] = hash)
  return {
    projectDir: "/project",
    resources: [],
    discover: async () => [],
    hashBatch: { files, hashBytes },
    yamlInputs: files.flatMap((identity) => identity.resourceKind === "yaml"
      ? [{ identity, value: {} }]
      : []),
    releaseBytesExcept: () => undefined,
  }
}

function emptyRefreshDependencies(handle: ProjectStateRefreshHandle) {
  return {
    handle,
    collectFiles: async () => collected([], []),
    runLocalValidation: async () => 0,
    writeChangedResources: async () => undefined,
    isStable: async () => true,
  }
}

class TestGate {
  readonly started: Promise<void>
  private readonly waiting: Promise<void>
  private notifyStarted!: () => void
  private releaseWaiting!: () => void

  constructor() {
    this.started = new Promise<void>((resolve) => { this.notifyStarted = resolve })
    this.waiting = new Promise<void>((resolve) => { this.releaseWaiting = resolve })
  }

  start(): void { this.notifyStarted() }
  release(): void { this.releaseWaiting() }
  wait(): Promise<void> { return this.waiting }
}

function hashesFor(batch: ProjectStateFileHashBatch, paths: readonly string[]): Uint8Array {
  return hashesAt(batch, paths.map((path) => batch.files.findIndex(({ projectPath }) => projectPath === path)))
}

function hashesAt(batch: ProjectStateFileHashBatch, indexes: readonly number[]): Uint8Array {
  const result = new Uint8Array(indexes.length * 8)
  indexes.forEach((index, resultIndex) => result.set(batch.hashBytes.slice(index * 8, index * 8 + 8), resultIndex * 8))
  return result
}

function bytesEqual(left: Uint8Array, right: Uint8Array): boolean {
  return left.length === right.length && left.every((byte, index) => byte === right[index])
}
