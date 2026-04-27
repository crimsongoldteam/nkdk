import { beforeEach, describe, expect, it, vi } from "vitest"

const queryMock = vi.fn()
const selectGraphMock = vi.fn()
const connectMock = vi.fn()
const closeMock = vi.fn()

vi.mock("falkordb", () => ({
  FalkorDB: { connect: (opts?: unknown) => connectMock(opts) },
}))

import { connect } from "../src/internal/connection"
import { mergeNodes, mergeEdges } from "../src/internal/operations"
import type { NodeData, EdgeData } from "../src/types"

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
    expect(catalogCall[0]).toBe(
      "UNWIND $batch AS n MERGE (m:MetadataCatalog {id: n.id}) SET m += n.props",
    )
    expect(catalogCall[1]).toEqual({
      params: {
        batch: [
          { id: "Справочник.A", props: { name: "A", filePath: "a.yaml" } },
          { id: "Справочник.B", props: { name: "B", filePath: "b.yaml" } },
        ],
      },
    })
    expect(documentCall[0]).toBe(
      "UNWIND $batch AS n MERGE (m:MetadataDocument {id: n.id}) SET m += n.props",
    )
  })

  it("режет на батчи по 5000", async () => {
    const conn = await connect()
    const nodes: NodeData[] = Array.from({ length: 12_000 }, (_, i) => ({
      id: `id${i}`,
      label: "MetadataCatalog",
      props: { name: `n${i}` },
    }))
    await mergeNodes(conn, nodes)

    expect(queryMock).toHaveBeenCalledTimes(3)
    expect(
      (queryMock.mock.calls[0][1] as { params: { batch: unknown[] } }).params.batch,
    ).toHaveLength(5000)
    expect(
      (queryMock.mock.calls[2][1] as { params: { batch: unknown[] } }).params.batch,
    ).toHaveLength(2000)
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
    expect(valueCall[0]).toBe(
      "UNWIND $batch AS e MATCH (s {id: e.src}), (t {id: e.tgt}) MERGE (s)-[r:VALUE]->(t) SET r = e.props",
    )
    expect((valueCall[1] as { params: { batch: unknown[] } }).params.batch).toHaveLength(2)
    expect(refCall[0]).toBe(
      "UNWIND $batch AS e MATCH (s {id: e.src}), (t {id: e.tgt}) MERGE (s)-[r:REF_TYPE]->(t) SET r = e.props",
    )
  })

  it("отправляет props={} если у ребра не указаны свойства", async () => {
    const conn = await connect()
    const edges: EdgeData[] = [{ src: "A", tgt: "B", kind: "FORM" }]
    await mergeEdges(conn, edges)

    expect(queryMock).toHaveBeenCalledTimes(1)
    const batch = (queryMock.mock.calls[0][1] as { params: { batch: Array<{ props: object }> } })
      .params.batch
    expect(batch[0]?.props).toEqual({})
  })
})
