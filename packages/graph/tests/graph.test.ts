import { beforeEach, describe, expect, it, vi } from "vitest"

const queryMock = vi.fn()
const deleteMock = vi.fn()
const closeMock = vi.fn()
const selectGraphMock = vi.fn()
const connectMock = vi.fn()

vi.mock("falkordb", () => ({
  FalkorDB: {
    connect: (opts?: unknown) => connectMock(opts),
  },
}))

import { addCatalogs, close, connect, resetGraph } from "../src/index"

beforeEach(() => {
  queryMock.mockReset().mockResolvedValue({})
  deleteMock.mockReset().mockResolvedValue(undefined)
  closeMock.mockReset().mockResolvedValue(undefined)
  selectGraphMock.mockReset().mockImplementation(() => ({
    query: queryMock,
    delete: deleteMock,
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

describe("resetGraph", () => {
  it("вызывает Graph.delete", async () => {
    const conn = await connect()
    await resetGraph(conn)
    expect(deleteMock).toHaveBeenCalledTimes(1)
  })

  it("глотает ошибку отсутствия графа", async () => {
    deleteMock.mockRejectedValue(new Error("no such graph"))
    const conn = await connect()
    await expect(resetGraph(conn)).resolves.toBeUndefined()
  })

  it("пробрасывает прочие ошибки", async () => {
    deleteMock.mockRejectedValue(new Error("connection refused"))
    const conn = await connect()
    await expect(resetGraph(conn)).rejects.toThrow(/connection refused/)
  })
})

describe("addCatalogs", () => {
  it("отправляет один UNWIND-запрос с batch-параметром", async () => {
    const conn = await connect()
    await addCatalogs(conn, ["Номенклатура", "Контрагенты", "Организации"])
    expect(queryMock).toHaveBeenCalledTimes(1)
    const [cypher, options] = queryMock.mock.calls[0]
    expect(cypher).toBe("UNWIND $batch AS n CREATE (:Catalog {name: n})")
    expect(options).toEqual({
      params: { batch: ["Номенклатура", "Контрагенты", "Организации"] },
    })
  })

  it("не делает сетевых запросов при пустом массиве", async () => {
    const conn = await connect()
    await addCatalogs(conn, [])
    expect(queryMock).not.toHaveBeenCalled()
  })
})
