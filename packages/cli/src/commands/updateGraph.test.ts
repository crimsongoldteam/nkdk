import type { FileGraphData, ProjectGraphSource } from "@nakidka/core"
import { existsSync, mkdirSync, mkdtempSync, readdirSync, writeFileSync } from "fs"
import { tmpdir } from "os"
import { join } from "path"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { projectGraphName } from "../graph/projectGraphName"
import { updateGraph, updateGraphFiles } from "./updateGraph"

const mocks = vi.hoisted(() => ({
  buildGraph: vi.fn(),
  buildGraphForChangedFile: vi.fn(),
  discoverProjectGraphFiles: vi.fn(),
  writeGraph: vi.fn(),
}))

vi.mock("@nakidka/core", () => {
  return {
    buildGraph: mocks.buildGraph,
    buildGraphForChangedFile: mocks.buildGraphForChangedFile,
    discoverProjectGraphFiles: mocks.discoverProjectGraphFiles,
    isSupportedProjectGraphFile: (filePath: string) =>
      filePath.startsWith("Справочник/") &&
      (filePath.endsWith("/Свойства.yaml") || filePath.endsWith("/Форма.yaml")),
  }
})

vi.mock("@nakidka/graph", () => ({
  updateGraph: mocks.writeGraph,
}))

const createProject = (): string => mkdtempSync(join(tmpdir(), "nakidka-update-graph-"))

const writeProjectFile = (projectPath: string, filePath: string, text: string): void => {
  const fullPath = join(projectPath, ...filePath.split("/"))
  mkdirSync(join(fullPath, ".."), { recursive: true })
  writeFileSync(fullPath, text)
}

const graphFile = (filePath: string): FileGraphData => ({
  filePath,
  nodes: [
    {
      id: filePath,
      label: "TestNode",
      props: {},
    },
  ],
  edges: [],
})

const graphPayloadFor = (sources: readonly ProjectGraphSource[]): FileGraphData[] => {
  return sources.map((source) => graphFile(source.filePath))
}

const discoverTestProjectGraphFiles = (projectPath: string): string[] => {
  const files: string[] = []
  const catalogRoot = join(projectPath, "Справочник")
  if (!existsSync(catalogRoot)) return files

  for (const entry of readdirSync(catalogRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue

    const formsRoot = join(catalogRoot, entry.name, "Формы")
    if (!existsSync(formsRoot)) continue

    for (const formEntry of readdirSync(formsRoot, { withFileTypes: true })) {
      if (!formEntry.isDirectory()) continue

      const fullPath = join(formsRoot, formEntry.name, "Форма.yaml")
      if (existsSync(fullPath)) {
        files.push(`Справочник/${entry.name}/Формы/${formEntry.name}/Форма.yaml`)
      }
    }
  }

  return files.sort()
}

describe("updateGraph command", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.buildGraph.mockImplementation(graphPayloadFor)
    mocks.discoverProjectGraphFiles.mockImplementation(discoverTestProjectGraphFiles)
    mocks.writeGraph.mockResolvedValue(undefined)
    vi.spyOn(console, "log").mockImplementation(() => undefined)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("полный updateGraph собирает Форма.yaml", async () => {
    const projectPath = createProject()
    const yamlPath = "Справочник/Товары/Формы/ФормаСписка/Форма.yaml"
    writeProjectFile(projectPath, yamlPath, "Элементы: {}\n")

    await updateGraph(projectPath)

    const graphName = projectGraphName(projectPath)
    expect(mocks.buildGraph).toHaveBeenCalledOnce()
    expect(mocks.buildGraph.mock.calls[0]?.[0]).toMatchObject([
      {
        filePath: yamlPath,
      },
    ])
    expect(mocks.writeGraph).toHaveBeenNthCalledWith(1, [], { graphName })
    expect(mocks.writeGraph).toHaveBeenNthCalledWith(
      2,
      [graphFile(yamlPath)],
      expect.objectContaining({ graphName }),
    )
  })

  it("полный updateGraph с replace пишет граф одним replace-вызовом", async () => {
    const projectPath = createProject()
    const yamlPath = "Справочник/Товары/Формы/ФормаСписка/Форма.yaml"
    writeProjectFile(projectPath, yamlPath, "Элементы: {}\n")

    await updateGraph(projectPath, { replace: true })

    const graphName = projectGraphName(projectPath)
    expect(mocks.writeGraph).toHaveBeenCalledOnce()
    expect(mocks.writeGraph).toHaveBeenCalledWith(
      [graphFile(yamlPath)],
      expect.objectContaining({ graphName, replace: true }),
    )
  })

  it("передаёт bulk: true вместе с replace", async () => {
    const projectPath = createProject()
    writeFileSync(join(projectPath, "a.yaml"), "x: y")
    mocks.buildGraph.mockResolvedValue([{ filePath: "a.yaml", nodes: [], edges: [] }])

    await updateGraph(projectPath, { replace: true, bulk: true })

    expect(mocks.writeGraph).toHaveBeenCalledWith(
      expect.any(Array),
      expect.objectContaining({ graphName: expect.any(String), replace: true, bulk: true }),
    )
  })

  it("updateGraphFiles игнорирует неподдержанный файл", async () => {
    const projectPath = createProject()
    const textPath = "Справочник/Товары/Формы/ФормаСписка/Форма.txt"

    await updateGraphFiles(projectPath, [textPath])

    expect(mocks.buildGraph).toHaveBeenCalledOnce()
    expect(mocks.buildGraph.mock.calls[0]?.[0]).toEqual([])
    expect(mocks.writeGraph).not.toHaveBeenCalled()
  })

  it("updateGraphFiles не пишет в граф при пустом batch payload", async () => {
    const projectPath = createProject()

    await updateGraphFiles(projectPath, [])

    expect(mocks.buildGraph).toHaveBeenCalledOnce()
    expect(mocks.writeGraph).not.toHaveBeenCalled()
  })

  it("updateGraphFiles записывает пустой File для прочитанного файла, который buildGraph пропустил", async () => {
    const projectPath = createProject()
    const yamlPath = "Справочник/Товары/Формы/ФормаСписка/Форма.yaml"
    writeProjectFile(projectPath, yamlPath, "Реквизиты: {}\n")
    mocks.buildGraph.mockResolvedValue([])

    await updateGraphFiles(projectPath, [yamlPath])

    const payload = mocks.writeGraph.mock.calls[0]?.[0] as FileGraphData[]
    expect(payload).toMatchObject([
      { filePath: yamlPath, nodes: [], edges: [], fileStats: expect.objectContaining({ size: 23 }) },
    ])
  })

  it("updateGraphFiles не пишет stub-сегмент для одиночной формы", async () => {
    const projectPath = createProject()
    const yamlPath = "Справочник/Контрагенты/Формы/ФормаСписка/Форма.yaml"
    const formEdge = {
      src: "Справочник.Контрагенты",
      tgt: "Справочник.Контрагенты.Форма.ФормаСписка",
      kind: "FORM",
    }
    mocks.buildGraph.mockResolvedValue([
      {
        filePath: "",
        nodes: [
          {
            id: "Справочник.Контрагенты",
            label: "MetadataCatalog",
            props: {},
          },
        ],
        edges: [formEdge],
      },
      {
        filePath: yamlPath,
        nodes: [
          {
            id: "Справочник.Контрагенты.Форма.ФормаСписка",
            label: "ClientApplicationForm",
            props: {},
          },
        ],
        edges: [],
      },
    ])
    writeProjectFile(projectPath, yamlPath, "Реквизиты: {}\n")

    await updateGraphFiles(projectPath, [yamlPath])

    const payload = mocks.writeGraph.mock.calls[0]?.[0] as FileGraphData[]
    const formFile = payload.find((file) => file.filePath === yamlPath)
    expect(payload.some((file) => file.filePath === "")).toBe(false)
    expect(formFile?.edges).toContainEqual(formEdge)
  })

  it("полный updateGraph не пишет stub-сегмент для одиночной формы", async () => {
    const projectPath = createProject()
    const yamlPath = "Справочник/Контрагенты/Формы/ФормаСписка/Форма.yaml"
    const formEdge = {
      src: "Справочник.Контрагенты",
      tgt: "Справочник.Контрагенты.Форма.ФормаСписка",
      kind: "FORM",
    }
    mocks.buildGraph.mockResolvedValue([
      {
        filePath: "",
        nodes: [
          {
            id: "Справочник.Контрагенты",
            label: "MetadataCatalog",
            props: {},
          },
        ],
        edges: [formEdge],
      },
      {
        filePath: yamlPath,
        nodes: [
          {
            id: "Справочник.Контрагенты.Форма.ФормаСписка",
            label: "ClientApplicationForm",
            props: {},
          },
        ],
        edges: [],
      },
    ])
    writeProjectFile(projectPath, yamlPath, "Реквизиты: {}\n")

    await updateGraph(projectPath)

    const payload = mocks.writeGraph.mock.calls[1]?.[0] as FileGraphData[]
    const formFile = payload.find((file) => file.filePath === yamlPath)
    expect(payload.some((file) => file.filePath === "")).toBe(false)
    expect(formFile?.edges).toContainEqual(formEdge)
  })
})
