import type { FileGraphData, ProjectGraphSource } from "@nakidka/core"
import { mkdirSync, mkdtempSync, writeFileSync } from "fs"
import { tmpdir } from "os"
import { join } from "path"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { projectGraphName } from "../graph/projectGraphName"
import { updateGraph, updateGraphFiles } from "./updateGraph"

const mocks = vi.hoisted(() => ({
  buildGraph: vi.fn(),
  buildGraphForChangedFile: vi.fn(),
  writeGraph: vi.fn(),
}))

vi.mock("@nakidka/core", () => {
  return {
    buildGraph: mocks.buildGraph,
    buildGraphForChangedFile: mocks.buildGraphForChangedFile,
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

describe("updateGraph command", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.buildGraph.mockImplementation(graphPayloadFor)
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
})
