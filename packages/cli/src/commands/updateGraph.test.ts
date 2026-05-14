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
      (filePath.endsWith("/Свойства.yaml") ||
        filePath.endsWith("/Форма.yaml") ||
        filePath.endsWith("/Форма.nkdk")),
    pairedProjectGraphFile: (filePath: string) => {
      if (filePath.endsWith("/Форма.nkdk")) {
        return `${filePath.slice(0, -"Форма.nkdk".length)}Форма.yaml`
      }
      if (filePath.endsWith("/Форма.yaml")) {
        return `${filePath.slice(0, -"Форма.yaml".length)}Форма.nkdk`
      }
      return undefined
    },
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
  return sources.flatMap((source) => [
    graphFile(source.filePath),
    ...(source.pairedText ? [graphFile(source.pairedText.filePath)] : []),
  ])
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

      for (const fileName of ["Форма.yaml", "Форма.nkdk"] as const) {
        const fullPath = join(formsRoot, formEntry.name, fileName)
        if (existsSync(fullPath)) {
          files.push(`Справочник/${entry.name}/Формы/${formEntry.name}/${fileName}`)
        }
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

  it("полный updateGraph собирает paired Форма.nkdk и пишет в граф проекта", async () => {
    const projectPath = createProject()
    const yamlPath = "Справочник/Товары/Формы/ФормаСписка/Форма.yaml"
    const nkdkPath = "Справочник/Товары/Формы/ФормаСписка/Форма.nkdk"
    writeProjectFile(projectPath, yamlPath, "Элементы: {}\n")
    writeProjectFile(projectPath, nkdkPath, "ПолеВвода1(Реквизит):\n")

    await updateGraph(projectPath)

    const graphName = projectGraphName(projectPath)
    expect(mocks.buildGraph).toHaveBeenCalledOnce()
    expect(mocks.buildGraph.mock.calls[0]?.[0]).toMatchObject([
      {
        filePath: yamlPath,
        pairedText: {
          filePath: nkdkPath,
          text: "ПолеВвода1(Реквизит):\n",
        },
      },
    ])
    expect(mocks.writeGraph).toHaveBeenNthCalledWith(1, [], { graphName })
    expect(mocks.writeGraph).toHaveBeenNthCalledWith(
      2,
      [graphFile(yamlPath), graphFile(nkdkPath)],
      expect.objectContaining({ graphName }),
    )
  })

  it("updateGraphFiles пересобирает через buildGraph и добавляет tombstone для удалённой Форма.nkdk", async () => {
    const projectPath = createProject()
    const yamlPath = "Справочник/Товары/Формы/ФормаСписка/Форма.yaml"
    const nkdkPath = "Справочник/Товары/Формы/ФормаСписка/Форма.nkdk"
    writeProjectFile(projectPath, yamlPath, "Элементы: {}\n")

    await updateGraphFiles(projectPath, [nkdkPath])

    const graphName = projectGraphName(projectPath)
    expect(mocks.buildGraph).toHaveBeenCalledOnce()
    expect(mocks.buildGraph.mock.calls[0]?.[0]).toMatchObject([
      {
        filePath: yamlPath,
        text: "Элементы: {}\n",
      },
    ])
    expect(mocks.writeGraph).toHaveBeenCalledWith(
      [graphFile(yamlPath), { filePath: nkdkPath, nodes: [], edges: [] }],
      expect.objectContaining({ graphName }),
    )
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
    const nkdkPath = "Справочник/Товары/Формы/ФормаСписка/Форма.nkdk"
    writeProjectFile(projectPath, yamlPath, "Реквизиты: {}\n")
    writeProjectFile(projectPath, nkdkPath, "ПолеВвода1(Реквизит):\n")
    mocks.buildGraph.mockResolvedValue([])

    await updateGraphFiles(projectPath, [yamlPath])

    const payload = mocks.writeGraph.mock.calls[0]?.[0] as FileGraphData[]
    expect(payload).toMatchObject([
      { filePath: yamlPath, nodes: [], edges: [], fileStats: expect.objectContaining({ size: 23 }) },
      { filePath: nkdkPath, nodes: [], edges: [], fileStats: expect.objectContaining({ size: 39 }) },
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
