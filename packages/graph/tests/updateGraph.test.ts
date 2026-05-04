import { beforeEach, describe, expect, it, vi } from "vitest"

const queryMock = vi.fn()
const selectGraphMock = vi.fn()
const connectMock = vi.fn()
const closeMock = vi.fn()

vi.mock("falkordb", () => ({
  FalkorDB: { connect: (opts?: unknown) => connectMock(opts) },
}))

import { updateGraph } from "../src/updateGraph"
import type { FileGraphData } from "../src/types"

beforeEach(() => {
  queryMock.mockReset().mockResolvedValue({})
  selectGraphMock.mockReset().mockReturnValue({ query: queryMock })
  closeMock.mockReset().mockResolvedValue(undefined)
  connectMock
    .mockReset()
    .mockResolvedValue({ selectGraph: selectGraphMock, close: closeMock })
})

describe("updateGraph", () => {
  it("создаёт File-узел и служебные связи для declared/contributed узлов", async () => {
    const files: FileGraphData[] = [
      {
        filePath: "Справочник/Товары/Свойства.yaml",
        fileStats: { mtimeMs: 10, size: 20, updatedAt: 30 },
        nodes: [
          { id: "Справочник.Товары", label: "MetadataCatalog", props: { name: "Товары" } },
          { id: "Справочник.Товары.Форма.ФормаСписка", label: "ClientApplicationForm", props: { name: "ФормаСписка" } },
        ],
        edges: [
          { src: "Справочник.Товары", tgt: "Справочник.Товары.Форма.ФормаСписка", kind: "FORM", props: { yaml: "Форма" } },
        ],
        declaredNodeIds: ["Справочник.Товары"],
        contributedNodeIds: ["Справочник.Товары.Форма.ФормаСписка"],
      },
    ]

    await updateGraph(files)

    const cypher = queryMock.mock.calls.map((c) => c[0] as string)
    expect(cypher).toContainEqual(expect.stringContaining("CREATE INDEX FOR (n:File) ON (n.path)"))
    expect(cypher).toContainEqual(expect.stringContaining("MERGE (f:File {path: file.path})"))
    expect(cypher).toContainEqual(expect.stringContaining("MERGE (f)-[:DECLARES]->(n)"))
    expect(cypher).toContainEqual(expect.stringContaining("MERGE (f)-[:CONTRIBUTES]->(n)"))
    expect(cypher).toContainEqual(expect.stringContaining("SET r.filePath = e.filePath"))
  })

  it("удаляет старые DECLARES/CONTRIBUTES перед новой записью файла", async () => {
    await updateGraph([{ filePath: "a.yaml", nodes: [], edges: [] }])

    const cypher = queryMock.mock.calls.map((c) => c[0] as string)
    expect(cypher).toContainEqual(expect.stringContaining("MATCH (f:File) WHERE f.path IN $filePaths"))
    expect(cypher).toContainEqual(expect.stringContaining("[oldRel:DECLARES|CONTRIBUTES]"))
    expect(cypher).toContainEqual(expect.stringContaining("DELETE oldRel"))
    expect(cypher).toContainEqual(expect.stringContaining("DETACH DELETE f"))
  })

  it("не считает DECLARES и CONTRIBUTES предметными входящими рёбрами", async () => {
    await updateGraph([{ filePath: "a.yaml", nodes: [], edges: [] }])

    const cypher = queryMock.mock.calls.map((c) => c[0] as string)
    expect(cypher).toContainEqual(expect.stringContaining("type(r) <> 'DECLARES'"))
    expect(cypher).toContainEqual(expect.stringContaining("type(r) <> 'CONTRIBUTES'"))
  })

  it("проходит полный цикл: index → delete → merge nodes → merge edges → cleanup → close", async () => {
    const files: FileGraphData[] = [
      {
        filePath: "a.yaml",
        nodes: [
          { id: "Справочник.A", label: "MetadataCatalog", props: { name: "A", filePath: "a.yaml" } },
        ],
        edges: [{ src: "Справочник.A", tgt: "Справочник.B", kind: "VALUE" }],
      },
    ]
    await updateGraph(files)

    const cypher = queryMock.mock.calls.map((c) => c[0] as string)
    expect(cypher).toContainEqual(expect.stringContaining("CREATE INDEX FOR (n:File)"))
    expect(cypher).toContainEqual(expect.stringContaining("CREATE INDEX FOR (n:MetadataCatalog)"))
    expect(cypher).toContainEqual(expect.stringContaining("MATCH (f:File) WHERE f.path IN $filePaths"))
    expect(cypher).toContainEqual(expect.stringContaining("MATCH ()-[r]->() WHERE r.filePath IN $filePaths DELETE r"))
    expect(cypher).toContainEqual(expect.stringContaining("MERGE (f:File {path: file.path})"))
    expect(cypher).toContainEqual(expect.stringContaining("MERGE (m:MetadataCatalog"))
    expect(cypher).toContainEqual(expect.stringContaining(":VALUE]"))
    expect(cypher).toContainEqual(expect.stringContaining("SET r.filePath = e.filePath"))
    expect(cypher).toContainEqual(expect.stringContaining("MERGE (f)-[:DECLARES]->(n)"))
    expect(cypher).toContainEqual(expect.stringContaining("WHERE NOT (:File)-[:DECLARES]->(n)"))
    expect(closeMock).toHaveBeenCalledTimes(1)
  })

  it("закрывает соединение даже при падении одной из операций", async () => {
    queryMock.mockReset()
    queryMock.mockResolvedValueOnce({}) // CREATE INDEX
    queryMock.mockRejectedValueOnce(new Error("boom"))

    const files: FileGraphData[] = [
      { filePath: "a.yaml", nodes: [{ id: "A", label: "X", props: {} }], edges: [] },
    ]
    await expect(updateGraph(files)).rejects.toThrow("boom")
    expect(closeMock).toHaveBeenCalledTimes(1)
  })

  it("ничего не отправляет в FalkorDB при пустом входе, но всё равно закрывает соединение", async () => {
    await updateGraph([])
    const cypher = queryMock.mock.calls.map((c) => c[0] as string)
    expect(cypher).toEqual([
      "CREATE INDEX FOR (n:File) ON (n.path)",
      "MATCH (n) WHERE NOT (:File)-[:DECLARES]->(n) OPTIONAL MATCH ()-[r]->(n) WHERE type(r) <> 'DECLARES' AND type(r) <> 'CONTRIBUTES' WITH n, count(r) AS subjectIncoming WHERE subjectIncoming = 0 DETACH DELETE n",
    ])
    expect(closeMock).toHaveBeenCalledTimes(1)
  })

  it("прокидывает ConnectionOptions в connect", async () => {
    await updateGraph([], { url: "redis://h:1", graphName: "g" })
    expect(connectMock).toHaveBeenCalledWith({ url: "redis://h:1" })
    expect(selectGraphMock).toHaveBeenCalledWith("g")
  })
})
