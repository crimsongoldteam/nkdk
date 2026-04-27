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
    expect(cypher).toContainEqual(expect.stringContaining("CREATE INDEX FOR (n:MetadataCatalog)"))
    expect(cypher).toContainEqual(expect.stringContaining("MATCH (n) WHERE n.filePath IN $filePaths MATCH (n)-[r]->() DELETE r"))
    expect(cypher).toContainEqual(expect.stringContaining("MATCH (n) WHERE n.filePath IN $filePaths AND ()-->(n) SET n = {id: n.id}"))
    expect(cypher).toContainEqual(expect.stringContaining("MATCH (n) WHERE n.filePath IN $filePaths AND NOT ()-->(n) DETACH DELETE n"))
    expect(cypher).toContainEqual(expect.stringContaining("MERGE (m:MetadataCatalog"))
    expect(cypher).toContainEqual(expect.stringContaining(":VALUE]"))
    expect(cypher).toContainEqual(expect.stringContaining("MATCH (n) WHERE n.filePath IS NULL AND NOT ()-->(n) DETACH DELETE n"))
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
      "MATCH (n) WHERE n.filePath IS NULL AND NOT ()-->(n) DETACH DELETE n",
    ])
    expect(closeMock).toHaveBeenCalledTimes(1)
  })

  it("прокидывает ConnectionOptions в connect", async () => {
    await updateGraph([], { url: "redis://h:1", graphName: "g" })
    expect(connectMock).toHaveBeenCalledWith({ url: "redis://h:1" })
    expect(selectGraphMock).toHaveBeenCalledWith("g")
  })
})
