import { beforeEach, describe, expect, it, vi } from "vitest"

const queryMock = vi.fn()
const selectGraphMock = vi.fn()
const connectMock = vi.fn()
const closeMock = vi.fn()

vi.mock("falkordb", () => ({
  FalkorDB: { connect: (opts?: unknown) => connectMock(opts) },
}))

import { connect } from "../src/internal/connection"
import { mergeNodes } from "../src/internal/operations"
import type { NodeData } from "../src/types"

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
