import { beforeEach, describe, expect, it, vi } from "vitest"

const queryMock = vi.fn()
const deleteMock = vi.fn()
const memoryUsageMock = vi.fn()
const closeMock = vi.fn()
const selectGraphMock = vi.fn()
const connectMock = vi.fn()

vi.mock("falkordb", () => ({
  FalkorDB: {
    connect: (opts?: unknown) => connectMock(opts),
  },
}))

import { close, connect, ensureIndex, query } from "../src/index"

beforeEach(() => {
  queryMock.mockReset().mockResolvedValue({})
  deleteMock.mockReset().mockResolvedValue(undefined)
  memoryUsageMock.mockReset().mockResolvedValue(1024)
  closeMock.mockReset().mockResolvedValue(undefined)
  selectGraphMock.mockReset().mockImplementation(() => ({
    query: queryMock,
    delete: deleteMock,
    memoryUsage: memoryUsageMock,
  }))
  connectMock.mockReset().mockResolvedValue({
    selectGraph: selectGraphMock,
    close: closeMock,
  })
  delete process.env["NKDK_GRAPH_URL"]
  delete process.env["NKDK_GRAPH_NAME"]
})

describe("connect", () => {
  it("подключается к дефолтному url и выбирает дефолтный граф", async () => {
    await connect()
    expect(connectMock).toHaveBeenCalledWith({ url: "redis://localhost:6379" })
    expect(selectGraphMock).toHaveBeenCalledWith("nakidka")
  })

  it("использует url и graphName из opts", async () => {
    await connect({ url: "redis://host:1234", graphName: "custom" })
    expect(connectMock).toHaveBeenCalledWith({ url: "redis://host:1234" })
    expect(selectGraphMock).toHaveBeenCalledWith("custom")
  })

  it("использует env NKDK_GRAPH_URL и NKDK_GRAPH_NAME", async () => {
    process.env["NKDK_GRAPH_URL"] = "redis://env-host:9999"
    process.env["NKDK_GRAPH_NAME"] = "env-graph"
    await connect()
    expect(connectMock).toHaveBeenCalledWith({ url: "redis://env-host:9999" })
    expect(selectGraphMock).toHaveBeenCalledWith("env-graph")
  })

  it("opts имеют приоритет над env", async () => {
    process.env["NKDK_GRAPH_URL"] = "redis://env-host:9999"
    process.env["NKDK_GRAPH_NAME"] = "env-graph"
    await connect({ url: "redis://opts:1111", graphName: "opts-graph" })
    expect(connectMock).toHaveBeenCalledWith({ url: "redis://opts:1111" })
    expect(selectGraphMock).toHaveBeenCalledWith("opts-graph")
  })
})

describe("close", () => {
  it("закрывает клиент FalkorDB", async () => {
    const conn = await connect()
    await close(conn)
    expect(closeMock).toHaveBeenCalledTimes(1)
  })
})

describe("query", () => {
  it("пробрасывает cypher и params в graph.query", async () => {
    queryMock.mockResolvedValue({ data: [{ n: 42 }] })
    const conn = await connect()
    const result = await query(conn, "MATCH (n) RETURN count(n) AS n", { limit: 10 })
    expect(queryMock).toHaveBeenCalledWith("MATCH (n) RETURN count(n) AS n", { params: { limit: 10 } })
    expect(result).toEqual({ data: [{ n: 42 }] })
  })

  it("вызывает graph.query без opts при отсутствии params", async () => {
    const conn = await connect()
    await query(conn, "MATCH (n) DETACH DELETE n")
    expect(queryMock).toHaveBeenCalledWith("MATCH (n) DETACH DELETE n", undefined)
  })

  it("возвращает результат как есть", async () => {
    const expected = { data: [{ x: 1 }], metadata: ["Nodes created: 1"] }
    queryMock.mockResolvedValue(expected)
    const conn = await connect()
    const result = await query(conn, "CREATE (n) RETURN n")
    expect(result).toBe(expected)
  })
})

describe("ensureIndex", () => {
  it("отправляет корректный CREATE INDEX Cypher", async () => {
    const conn = await connect()
    await ensureIndex(conn, "MetadataNode", "id")
    expect(queryMock).toHaveBeenCalledWith("CREATE INDEX FOR (n:MetadataNode) ON (n.id)")
  })

  it("глотает ошибку 'already indexed'", async () => {
    queryMock.mockRejectedValue(new Error("already indexed for label"))
    const conn = await connect()
    await expect(ensureIndex(conn, "MetadataNode", "id")).resolves.toBeUndefined()
  })

  it("глотает ошибку 'equivalent index'", async () => {
    queryMock.mockRejectedValue(new Error("Equivalent index already exists"))
    const conn = await connect()
    await expect(ensureIndex(conn, "MetadataNode", "path")).resolves.toBeUndefined()
  })

  it("пробрасывает прочие ошибки", async () => {
    queryMock.mockRejectedValue(new Error("connection refused"))
    const conn = await connect()
    await expect(ensureIndex(conn, "MetadataNode", "id")).rejects.toThrow(/connection refused/)
  })
})
