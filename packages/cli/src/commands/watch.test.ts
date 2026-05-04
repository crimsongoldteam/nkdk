import { mkdirSync, mkdtempSync, statSync, writeFileSync } from "fs"
import { tmpdir } from "os"
import { join } from "path"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { projectGraphName } from "../graph/projectGraphName"
import { watch } from "./watch"

const mocks = vi.hoisted(() => ({
  getGraphFiles: vi.fn(async () => []),
  updateGraphFiles: vi.fn(async () => undefined),
  chokidarWatch: vi.fn(),
}))

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

const createWatcher = () => ({
  on: vi.fn().mockReturnThis(),
  close: vi.fn(async () => undefined),
})

describe("watch command", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getGraphFiles.mockResolvedValue([])
    mocks.updateGraphFiles.mockResolvedValue(undefined)
    mocks.chokidarWatch.mockReturnValue(createWatcher())
  })

  it("запускает watcher до чтения graph files и читает граф проекта", async () => {
    const projectPath = createProject()

    await watch(projectPath)

    expect(mocks.chokidarWatch).toHaveBeenCalledOnce()
    expect(mocks.getGraphFiles).toHaveBeenCalledWith({ graphName: projectGraphName(projectPath) })
    expect(mocks.chokidarWatch.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.getGraphFiles.mock.invocationCallOrder[0] ?? 0,
    )
  })

  it("не вызывает updateGraphFiles, если paired form files на диске совпадают с графом", async () => {
    const projectPath = createProject()
    const yamlPath = "Справочник/Товары/Формы/ФормаСписка/Форма.yaml"
    const nkdkPath = "Справочник/Товары/Формы/ФормаСписка/Форма.nkdk"
    writeProjectFile(projectPath, yamlPath, "Элементы: {}\n")
    writeProjectFile(projectPath, nkdkPath, "ПолеВвода1(Реквизит):\n")
    mocks.getGraphFiles.mockResolvedValue([
      graphRecord(projectPath, yamlPath),
      graphRecord(projectPath, nkdkPath),
    ])

    await watch(projectPath)

    expect(mocks.updateGraphFiles).not.toHaveBeenCalled()
  })

  it("вызывает updateGraphFiles одним batch, если граф пустой, а на диске есть paired form files", async () => {
    const projectPath = createProject()
    const yamlPath = "Справочник/Товары/Формы/ФормаСписка/Форма.yaml"
    const nkdkPath = "Справочник/Товары/Формы/ФормаСписка/Форма.nkdk"
    writeProjectFile(projectPath, yamlPath, "Элементы: {}\n")
    writeProjectFile(projectPath, nkdkPath, "ПолеВвода1(Реквизит):\n")

    await watch(projectPath)

    expect(mocks.updateGraphFiles).toHaveBeenCalledOnce()
    expect(mocks.updateGraphFiles).toHaveBeenCalledWith(projectPath, [yamlPath, nkdkPath])
  })
})
