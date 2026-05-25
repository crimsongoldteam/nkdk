import { beforeEach, describe, expect, it, vi } from "vitest"

const queryMock = vi.fn()
const selectGraphMock = vi.fn()
const connectMock = vi.fn()
const closeMock = vi.fn()

vi.mock("falkordb", () => ({
  FalkorDB: { connect: (opts?: unknown) => connectMock(opts) },
}))

import { connect } from "../src/internal/connection"
import {
  createEdges,
  createFileLinks,
  createFiles,
  createNodes,
  deleteByFilePaths,
  cleanupOrphanStubs,
  ensureLabelIndexes,
  mergeNodes,
  mergeEdges,
  validateReplacePayload,
} from "../src/internal/operations"
import type { NodeData, EdgeData, FileGraphData } from "../src/types"

beforeEach(() => {
  queryMock.mockReset().mockResolvedValue({})
  selectGraphMock.mockReset().mockReturnValue({ query: queryMock })
  connectMock.mockReset().mockResolvedValue({ selectGraph: selectGraphMock, close: closeMock })
  closeMock.mockReset().mockResolvedValue(undefined)
})

describe("mergeNodes", () => {
  it("ничего не делает на пустом массиве", async () => {
    const conn = await connect()
    await mergeNodes(conn, [])
    expect(queryMock).not.toHaveBeenCalled()
  })

  it("группирует узлы по label и шлёт по одному UNWIND-MERGE на label", async () => {
    const conn = await connect()
    const nodes: NodeData[] = [
      { id: "Справочник.A", label: "MetadataCatalog", props: { name: "A", filePath: "a.yaml" } },
      { id: "Справочник.B", label: "MetadataCatalog", props: { name: "B", filePath: "b.yaml" } },
      { id: "Документ.X", label: "MetadataDocument", props: { name: "X", filePath: "x.yaml" } },
    ]
    await mergeNodes(conn, nodes)

    expect(queryMock).toHaveBeenCalledTimes(2)
    const [catalogCall, documentCall] = queryMock.mock.calls
    expect(catalogCall[0]).toContain("UNWIND [{id:\"Справочник.A\"")
    expect(catalogCall[0]).toContain("props:{`name`:\"A\",`filePath`:\"a.yaml\"}")
    expect(catalogCall[0]).toContain("MERGE (m:MetadataCatalog:GraphNode {id: n.id}) SET m += n.props")
    expect(catalogCall[1]).toBeUndefined()
    expect(documentCall[0]).toContain("MERGE (m:MetadataDocument:GraphNode {id: n.id}) SET m += n.props")
  })

  it("не дублирует GraphNode label при merge узла GraphNode", async () => {
    const conn = await connect()
    await mergeNodes(conn, [
      { id: "A", label: "GraphNode", props: { name: "A" } },
    ])

    const cypher = queryMock.mock.calls[0][0] as string
    expect(cypher).toContain("MERGE (m:GraphNode {id: n.id}) SET m += n.props")
    expect(cypher).not.toContain(":GraphNode:GraphNode")
  })

  it("использует безопасный GraphNode fallback для пустого label узла", async () => {
    const conn = await connect()
    await mergeNodes(conn, [
      { id: "A", label: "", props: { name: "A" } },
    ])

    const cypher = queryMock.mock.calls[0][0] as string
    expect(cypher).toContain("MERGE (m:GraphNode {id: n.id}) SET m += n.props")
    expect(cypher).not.toContain("m::")
  })

  it("экранирует ключи props, которые нельзя передать в Cypher-map без кавычек", async () => {
    const conn = await connect()
    await mergeNodes(conn, [
      {
        id: "Документ.А.Реквизит.Б",
        label: "MetadataAttribute",
        props: { "p_choiceParameters_Отбор.ОтветственноеЛицо": "x" },
      },
    ])

    expect(queryMock.mock.calls[0][0]).toContain("`p_choiceParameters_Отбор.ОтветственноеЛицо`")
    expect(queryMock.mock.calls[0][1]).toBeUndefined()
  })

  it("не отправляет null-свойства и null внутри массивов", async () => {
    const conn = await connect()
    await mergeNodes(conn, [
      {
        id: "Документ.А",
        label: "MetadataDocument",
        props: {
          name: "А",
          p_empty: null,
          p_values: ["one", null, "two"],
          p_onlyNulls: [null],
        },
      },
    ])

    const cypher = queryMock.mock.calls[0][0] as string
    expect(cypher).toContain("`name`:\"А\"")
    expect(cypher).toContain("`p_values`:[\"one\",\"two\"]")
    expect(cypher).not.toContain("p_empty")
    expect(cypher).not.toContain("p_onlyNulls")
    expect(cypher).not.toContain("null")
  })

  it("режет на батчи по 500", async () => {
    const conn = await connect()
    const nodes: NodeData[] = Array.from({ length: 12_000 }, (_, i) => ({
      id: `id${i}`,
      label: "MetadataCatalog",
      props: { name: `n${i}` },
    }))
    await mergeNodes(conn, nodes)

    expect(queryMock).toHaveBeenCalledTimes(24)
    expect(queryMock.mock.calls[0][0].match(/\{id:"/g)).toHaveLength(500)
    expect(queryMock.mock.calls[23][0].match(/\{id:"/g)).toHaveLength(500)
  })
})

describe("mergeEdges", () => {
  it("ничего не делает на пустом массиве", async () => {
    const conn = await connect()
    await mergeEdges(conn, [])
    expect(queryMock).not.toHaveBeenCalled()
  })

  it("группирует рёбра по kind и шлёт по одному UNWIND-MERGE на kind", async () => {
    const conn = await connect()
    const edges: EdgeData[] = [
      { src: "A", tgt: "B", kind: "VALUE", props: { yaml: "Значение" } },
      { src: "A", tgt: "C", kind: "VALUE", props: { yaml: "Значение" } },
      { src: "A", tgt: "D", kind: "REF_TYPE", props: { index: 0 } },
    ]
    await mergeEdges(conn, edges)

    expect(queryMock).toHaveBeenCalledTimes(2)
    const calls = queryMock.mock.calls
    const valueCall = calls.find((c) => (c[0] as string).includes(":VALUE"))!
    const refCall = calls.find((c) => (c[0] as string).includes(":REF_TYPE"))!
    expect(valueCall[0]).toContain("UNWIND [{src:\"A\",tgt:\"B\"")
    expect(valueCall[0]).toContain("props:{`yaml`:\"Значение\"}")
    expect(valueCall[0]).toContain("MERGE (s)-[r:VALUE]->(t) SET r = e.props")
    expect(valueCall[1]).toBeUndefined()
    expect(refCall[0]).toContain("MERGE (s)-[r:REF_TYPE]->(t) SET r = e.props")
  })

  it("отправляет props={} если у ребра не указаны свойства", async () => {
    const conn = await connect()
    const edges: EdgeData[] = [{ src: "A", tgt: "B", kind: "FORM" }]
    await mergeEdges(conn, edges)

    expect(queryMock).toHaveBeenCalledTimes(1)
    expect(queryMock.mock.calls[0][0]).toContain("props:{}")
  })

  it("использует label концов ребра, если они переданы", async () => {
    const conn = await connect()
    await mergeEdges(
      conn,
      [{ src: "A", tgt: "B", kind: "VALUE", props: { yaml: "Значение" } }],
      new Map([
        ["A", "MetadataAttribute"],
        ["B", "MetadataValue"],
      ]),
    )

    expect(queryMock.mock.calls[0][0]).toContain(
      "MATCH (s:MetadataAttribute {id: e.src}), (t:MetadataValue {id: e.tgt})",
    )
  })

  it("использует GraphNode fallback для неизвестных label концов ребра", async () => {
    const conn = await connect()
    await mergeEdges(
      conn,
      [{ src: "A", tgt: "B", kind: "VALUE", props: { yaml: "Значение" } }],
      new Map([["A", "MetadataAttribute"]]),
    )

    expect(queryMock.mock.calls[0][0]).toContain(
      "MATCH (s:MetadataAttribute {id: e.src}), (t:GraphNode {id: e.tgt})",
    )
    expect(queryMock.mock.calls[0][0]).not.toContain("(t {id: e.tgt})")
  })

  it("legacy-вызов без label ищет концы ребра через GraphNode fallback", async () => {
    const conn = await connect()
    await mergeEdges(conn, [{ src: "A", tgt: "B", kind: "VALUE" }])

    const cypher = queryMock.mock.calls[0][0] as string
    expect(cypher).toContain("MATCH (s:GraphNode {id: e.src}), (t:GraphNode {id: e.tgt})")
    expect(cypher).not.toContain("(s {id: e.src})")
    expect(cypher).not.toContain("(t {id: e.tgt})")
  })
})

describe("createFiles", () => {
  it("пишет File-узлы через CREATE", async () => {
    const conn = await connect()
    const files: FileGraphData[] = [
      { filePath: "a.yaml", fileStats: { mtimeMs: 1, size: 2, updatedAt: 3 }, nodes: [], edges: [] },
    ]

    await createFiles(conn, files)

    expect(queryMock).toHaveBeenCalledTimes(1)
    expect(queryMock.mock.calls[0][0]).toContain("CREATE (f:File {path: file.path")
    expect(queryMock.mock.calls[0][0]).not.toContain("MERGE (f:File")
  })
})

describe("createNodes", () => {
  it("пишет предметные узлы через CREATE с GraphNode label", async () => {
    const conn = await connect()
    const nodes: NodeData[] = [
      { id: "A", label: "MetadataCatalog", props: { name: "A" } },
    ]

    await createNodes(conn, nodes)

    expect(queryMock).toHaveBeenCalledTimes(1)
    expect(queryMock.mock.calls[0][0]).toContain("CREATE (m:MetadataCatalog:GraphNode {id: n.id}")
    expect(queryMock.mock.calls[0][0]).not.toContain("MERGE (m:")
  })
})

describe("createEdges", () => {
  it("пишет предметные рёбра через CREATE и сохраняет filePath", async () => {
    const conn = await connect()
    const files: FileGraphData[] = [
      {
        filePath: "a.yaml",
        nodes: [],
        edges: [{ src: "A", tgt: "B", kind: "VALUE", props: { yaml: "Значение" } }],
      },
    ]

    await createEdges(conn, files, new Map([["A", "MetadataCatalog"], ["B", "MetadataAttribute"]]))

    expect(queryMock).toHaveBeenCalledTimes(1)
    expect(queryMock.mock.calls[0][0]).toContain("MATCH (s:MetadataCatalog {id: e.src}), (t:MetadataAttribute {id: e.tgt})")
    expect(queryMock.mock.calls[0][0]).toContain("CREATE (s)-[r:VALUE")
    expect(queryMock.mock.calls[0][0]).toContain("SET r.filePath = e.filePath")
    expect(queryMock.mock.calls[0][0]).not.toContain("MERGE (s)-[r:VALUE")
  })
})

describe("createFileLinks", () => {
  it("пишет DECLARES и CONTRIBUTES через CREATE", async () => {
    const conn = await connect()
    const files: FileGraphData[] = [
      {
        filePath: "a.yaml",
        nodes: [{ id: "A", label: "MetadataCatalog", props: {} }],
        edges: [],
        declaredNodeIds: ["A"],
        contributedNodeIds: ["B"],
      },
    ]

    await createFileLinks(conn, files)

    const cypher = queryMock.mock.calls.map((call) => call[0] as string)
    expect(cypher).toContainEqual(expect.stringContaining("CREATE (f)-[:DECLARES]->(n)"))
    expect(cypher).toContainEqual(expect.stringContaining("CREATE (f)-[:CONTRIBUTES]->(n)"))
    expect(cypher).not.toContainEqual(expect.stringContaining("MERGE (f)-[:DECLARES]->(n)"))
  })
})

describe("validateReplacePayload", () => {
  it("падает на повторяющемся filePath", () => {
    const files: FileGraphData[] = [
      { filePath: "a.yaml", nodes: [], edges: [] },
      { filePath: "a.yaml", nodes: [], edges: [] },
    ]

    expect(() => validateReplacePayload(files)).toThrow("Duplicate File.path in replace payload: a.yaml")
  })

  it("падает на повторяющемся node id", () => {
    const files: FileGraphData[] = [
      {
        filePath: "a.yaml",
        nodes: [
          { id: "A", label: "MetadataCatalog", props: {} },
          { id: "A", label: "MetadataAttribute", props: {} },
        ],
        edges: [],
      },
    ]

    expect(() => validateReplacePayload(files)).toThrow("Duplicate Node.id in replace payload: A")
  })

  it("падает на повторяющейся DECLARES-связи", () => {
    const files: FileGraphData[] = [
      {
        filePath: "a.yaml",
        nodes: [{ id: "A", label: "MetadataCatalog", props: {} }],
        edges: [],
        declaredNodeIds: ["A", "A"],
      },
    ]

    expect(() => validateReplacePayload(files)).toThrow("Duplicate DECLARES link in replace payload: a.yaml -> A")
  })

  it("падает на повторяющейся CONTRIBUTES-связи", () => {
    const files: FileGraphData[] = [
      {
        filePath: "a.yaml",
        nodes: [],
        edges: [],
        contributedNodeIds: ["B", "B"],
      },
    ]

    expect(() => validateReplacePayload(files)).toThrow("Duplicate CONTRIBUTES link in replace payload: a.yaml -> B")
  })

  it("не запрещает повторяющиеся предметные рёбра", () => {
    const files: FileGraphData[] = [
      {
        filePath: "a.yaml",
        nodes: [
          { id: "A", label: "MetadataCatalog", props: {} },
          { id: "B", label: "MetadataAttribute", props: {} },
        ],
        edges: [
          { src: "A", tgt: "B", kind: "VALUE" },
          { src: "A", tgt: "B", kind: "VALUE" },
        ],
      },
    ]

    expect(() => validateReplacePayload(files)).not.toThrow()
  })
})

describe("deleteByFilePaths", () => {
  it("ничего не делает на пустом массиве", async () => {
    const conn = await connect()
    await deleteByFilePaths(conn, [])
    expect(queryMock).not.toHaveBeenCalled()
  })

  it("удаляет outgoing-рёбра, превращает узлы со входящими в stub, остальные DETACH DELETE", async () => {
    const conn = await connect()
    await deleteByFilePaths(conn, ["a.yaml", "b.yaml"])

    expect(queryMock).toHaveBeenCalledTimes(3)
    const [edgesCall, stubCall, deleteCall] = queryMock.mock.calls
    expect(edgesCall[0]).toBe(
      "MATCH (n) WHERE n.filePath IN $filePaths MATCH (n)-[r]->() DELETE r",
    )
    expect(edgesCall[1]).toEqual({ params: { filePaths: ["a.yaml", "b.yaml"] } })
    expect(stubCall[0]).toBe(
      "MATCH (n) WHERE n.filePath IN $filePaths AND ()-->(n) SET n = {id: n.id}",
    )
    expect(stubCall[1]).toEqual({ params: { filePaths: ["a.yaml", "b.yaml"] } })
    expect(deleteCall[0]).toBe(
      "MATCH (n) WHERE n.filePath IN $filePaths AND NOT ()-->(n) DETACH DELETE n",
    )
  })
})

describe("cleanupOrphanStubs", () => {
  it("удаляет узлы без filePath и без входящих рёбер, но не File-узлы", async () => {
    const conn = await connect()
    await cleanupOrphanStubs(conn)
    expect(queryMock).toHaveBeenCalledTimes(1)
    expect(queryMock.mock.calls[0][0]).toBe(
      "MATCH (n) WHERE n.filePath IS NULL AND NOT n:File AND NOT ()-->(n) DETACH DELETE n",
    )
    expect(queryMock.mock.calls[0][1]).toBeUndefined()
  })
})

describe("ensureLabelIndexes", () => {
  it("создаёт индекс по id для каждой уникальной label", async () => {
    const conn = await connect()
    await ensureLabelIndexes(conn, ["MetadataCatalog", "MetadataDocument", "MetadataCatalog"])

    expect(queryMock).toHaveBeenCalledTimes(3)
    const queries = queryMock.mock.calls.map((c) => c[0])
    expect(queries).toContain("CREATE INDEX FOR (n:GraphNode) ON (n.id)")
    expect(queries).toContain("CREATE INDEX FOR (n:MetadataCatalog) ON (n.id)")
    expect(queries).toContain("CREATE INDEX FOR (n:MetadataDocument) ON (n.id)")
  })

  it("не создаёт предметный индекс GraphNode повторно", async () => {
    const conn = await connect()
    await ensureLabelIndexes(conn, ["GraphNode", "MetadataCatalog", "GraphNode"])

    const queries = queryMock.mock.calls.map((c) => c[0])
    expect(queries.filter((q) => q === "CREATE INDEX FOR (n:GraphNode) ON (n.id)")).toHaveLength(1)
    expect(queries).toContain("CREATE INDEX FOR (n:MetadataCatalog) ON (n.id)")
  })

  it("глотает 'already indexed' / 'equivalent index'", async () => {
    queryMock.mockRejectedValueOnce(new Error("already indexed for label"))
    const conn = await connect()
    await expect(
      ensureLabelIndexes(conn, ["MetadataCatalog"]),
    ).resolves.toBeUndefined()
  })

  it("ничего не делает на пустом массиве", async () => {
    const conn = await connect()
    await ensureLabelIndexes(conn, [])
    expect(queryMock).toHaveBeenCalledTimes(1)
    expect(queryMock.mock.calls[0][0]).toBe("CREATE INDEX FOR (n:GraphNode) ON (n.id)")
  })
})
