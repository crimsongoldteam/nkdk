import { mkdirSync, mkdtempSync, statSync, writeFileSync } from "fs"
import { tmpdir } from "os"
import { join } from "path"
import { beforeEach, describe, expect, it, type Mock, vi } from "vitest"
import type { GraphFileRecord } from "@nakidka/graph"
import { projectGraphName } from "../graph/projectGraphName"
import { watch } from "./watch"

const mocks = vi.hoisted(() => ({
  getGraphFiles: vi.fn<() => Promise<GraphFileRecord[]>>(async () => []),
  updateGraphFiles: vi.fn(async () => undefined),
  chokidarWatch: vi.fn(),
  statSync: vi.fn(),
  actualStatSync: undefined as undefined | typeof import("fs").statSync,
}))

vi.mock("fs", async (importOriginal) => {
  const actual = await importOriginal<typeof import("fs")>()
  mocks.actualStatSync = actual.statSync
  return {
    ...actual,
    statSync: mocks.statSync,
  }
})

vi.mock("@nakidka/graph", () => ({
  getGraphFiles: mocks.getGraphFiles,
}))

vi.mock("./updateGraph", () => ({
  updateGraphFiles: mocks.updateGraphFiles,
}))

vi.mock("chokidar", () => ({
  default: {
    watch: mocks.chokidarWatch,
  },
}))

const createProject = (): string => mkdtempSync(join(tmpdir(), "nakidka-watch-"))

const writeProjectFile = (projectPath: string, filePath: string, text: string): string => {
  const fullPath = join(projectPath, ...filePath.split("/"))
  mkdirSync(join(fullPath, ".."), { recursive: true })
  writeFileSync(fullPath, text)
  return fullPath
}

const graphRecord = (projectPath: string, filePath: string) => {
  const stats = statSync(join(projectPath, ...filePath.split("/")))
  return {
    path: filePath,
    mtimeMs: stats.mtimeMs,
    size: stats.size,
    updatedAt: Date.now(),
  }
}

type WatchEvent = "add" | "change" | "unlink" | "ready"
type WatchHandler = (path?: string) => void

const createDeferred = <T = void>() => {
  let resolve!: (value: T | PromiseLike<T>) => void
  let reject!: (error: unknown) => void
  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve
    reject = promiseReject
  })
  return { promise, resolve, reject }
}

const waitForMicrotasks = async (): Promise<void> => {
  await Promise.resolve()
}

const createWatcher = () => {
  const handlers = new Map<WatchEvent, WatchHandler[]>()
  const watcher = {
    on: vi.fn((event: WatchEvent, handler: WatchHandler) => {
      handlers.set(event, [...(handlers.get(event) ?? []), handler])
      return watcher
    }),
    close: vi.fn(async () => undefined),
    emit(event: WatchEvent, path?: string): void {
      for (const handler of handlers.get(event) ?? []) handler(path)
    },
  }
  return watcher
}

type TestWatcher = ReturnType<typeof createWatcher>

describe("watch command", () => {
  let watcher: TestWatcher

  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getGraphFiles.mockResolvedValue([])
    mocks.updateGraphFiles.mockResolvedValue(undefined)
    mocks.statSync.mockImplementation((path) => mocks.actualStatSync?.(path))
    watcher = createWatcher()
    mocks.chokidarWatch.mockReturnValue(watcher)
  })

  it("запускает watcher до чтения graph files, но ждёт ready перед чтением графа проекта", async () => {
    const projectPath = createProject()

    const promise = watch(projectPath)
    await waitForMicrotasks()

    expect(mocks.chokidarWatch).toHaveBeenCalledOnce()
    expect(mocks.getGraphFiles).not.toHaveBeenCalled()

    watcher.emit("ready")
    await promise

    expect(mocks.getGraphFiles).toHaveBeenCalledWith({ graphName: projectGraphName(projectPath) })
    expect(mocks.chokidarWatch.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.getGraphFiles.mock.invocationCallOrder[0] ?? 0,
    )
  })

  it("не вызывает updateGraphFiles, если form YAML на диске совпадает с графом", async () => {
    const projectPath = createProject()
    const yamlPath = "Справочник/Товары/Формы/ФормаСписка/Форма.yaml"
    writeProjectFile(projectPath, yamlPath, "Элементы: {}\n")
    mocks.getGraphFiles.mockResolvedValue([
      graphRecord(projectPath, yamlPath),
    ])

    const promise = watch(projectPath)
    watcher.emit("ready")
    await promise

    expect(mocks.updateGraphFiles).not.toHaveBeenCalled()
  })

  it("вызывает updateGraphFiles одним batch, если граф пустой, а на диске есть form YAML", async () => {
    const projectPath = createProject()
    const yamlPath = "Справочник/Товары/Формы/ФормаСписка/Форма.yaml"
    writeProjectFile(projectPath, yamlPath, "Элементы: {}\n")

    const promise = watch(projectPath)
    watcher.emit("ready")
    await promise

    expect(mocks.updateGraphFiles).toHaveBeenCalledOnce()
    expect(mocks.updateGraphFiles).toHaveBeenCalledWith(projectPath, [yamlPath])
  })

  it("после initial updateGraphFiles дожимает watcher event вторым batch-вызовом", async () => {
    const projectPath = createProject()
    const yamlPath = "Справочник/Товары/Формы/ФормаСписка/Форма.yaml"
    const fullYamlPath = writeProjectFile(projectPath, yamlPath, "Элементы: {}\n")
    const initialUpdate = createDeferred()
    ;(mocks.updateGraphFiles as Mock)
      .mockImplementationOnce(async () => {
        await initialUpdate.promise
      })
      .mockResolvedValue(undefined)

    const promise = watch(projectPath)
    watcher.emit("ready")
    await vi.waitFor(() => {
      expect(mocks.updateGraphFiles).toHaveBeenCalledOnce()
    })

    watcher.emit("change", fullYamlPath)
    initialUpdate.resolve()
    await promise

    expect(mocks.updateGraphFiles).toHaveBeenCalledTimes(2)
    expect(mocks.updateGraphFiles).toHaveBeenNthCalledWith(1, projectPath, [yamlPath])
    expect(mocks.updateGraphFiles).toHaveBeenNthCalledWith(2, projectPath, [yamlPath])
  })

  it("игнорирует watcher event для неподдержанного файла", async () => {
    const projectPath = createProject()
    const textPath = "Справочник/Товары/Формы/ФормаСписка/Форма.txt"
    const fullTextPath = writeProjectFile(projectPath, textPath, "не источник формы\n")

    const promise = watch(projectPath)
    watcher.emit("ready")
    watcher.emit("change", fullTextPath)
    await promise

    expect(mocks.updateGraphFiles).not.toHaveBeenCalled()
  })

  it("передаёт unlink поддерживаемого файла в updateGraphFiles через batch queue", async () => {
    const projectPath = createProject()
    const yamlPath = "Справочник/Товары/Формы/ФормаСписка/Форма.yaml"
    const fullYamlPath = join(projectPath, ...yamlPath.split("/"))
    mocks.getGraphFiles.mockImplementation(async () => {
      watcher.emit("unlink", fullYamlPath)
      return []
    })

    const promise = watch(projectPath)
    watcher.emit("ready")
    await promise

    expect(mocks.updateGraphFiles).toHaveBeenCalledOnce()
    expect(mocks.updateGraphFiles).toHaveBeenCalledWith(projectPath, [yamlPath])
  })

  it("не падает и обновляет граф, если файл исчез перед чтением stats", async () => {
    const projectPath = createProject()
    const yamlPath = "Справочник/Товары/Формы/ФормаСписка/Форма.yaml"
    const fullYamlPath = writeProjectFile(projectPath, yamlPath, "Элементы: {}\n")
    const error = Object.assign(new Error(`ENOENT: no such file or directory, stat '${fullYamlPath}'`), {
      code: "ENOENT",
    })
    mocks.statSync.mockImplementation((path) => {
      if (path === fullYamlPath) throw error
      return mocks.actualStatSync?.(path)
    })

    const promise = watch(projectPath)
    watcher.emit("ready")
    await promise

    expect(mocks.updateGraphFiles).toHaveBeenCalledOnce()
    expect(mocks.updateGraphFiles).toHaveBeenCalledWith(projectPath, [yamlPath])
  })
})
