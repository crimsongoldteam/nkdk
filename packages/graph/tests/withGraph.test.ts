import { beforeEach, describe, expect, it, vi } from "vitest"

const queryMock = vi.fn()
const selectGraphMock = vi.fn()
const connectMock = vi.fn()
const closeMock = vi.fn()

vi.mock("falkordb", () => ({
  FalkorDB: { connect: (opts?: unknown) => connectMock(opts) },
}))

import { withGraph } from "../src/withGraph"

beforeEach(() => {
  queryMock.mockReset()
  selectGraphMock.mockReset().mockReturnValue({ query: queryMock })
  closeMock.mockReset().mockResolvedValue(undefined)
  connectMock
    .mockReset()
    .mockResolvedValue({ selectGraph: selectGraphMock, close: closeMock })
})

describe("withGraph", () => {
  it("открывает соединение, передаёт query в callback и закрывает", async () => {
    queryMock.mockResolvedValue({ data: [{ n: 42 }] })

    const result = await withGraph(async (g) => {
      return await g.query<{ n: number }>("MATCH (n) RETURN n.value AS n")
    })

    expect(connectMock).toHaveBeenCalledTimes(1)
    expect(queryMock).toHaveBeenCalledWith("MATCH (n) RETURN n.value AS n", undefined)
    expect(closeMock).toHaveBeenCalledTimes(1)
    expect(result).toEqual({ data: [{ n: 42 }] })
  })

  it("прокидывает params в query", async () => {
    queryMock.mockResolvedValue({})
    await withGraph(async (g) => g.query("MATCH (n {id: $id})", { id: "X" }))
    expect(queryMock).toHaveBeenCalledWith("MATCH (n {id: $id})", { params: { id: "X" } })
  })

  it("закрывает соединение даже если callback кинул ошибку", async () => {
    await expect(
      withGraph(async () => {
        throw new Error("user error")
      }),
    ).rejects.toThrow("user error")
    expect(closeMock).toHaveBeenCalledTimes(1)
  })

  it("прокидывает ConnectionOptions в connect", async () => {
    queryMock.mockResolvedValue({})
    await withGraph(async () => undefined, { url: "redis://h:1", graphName: "g" })
    expect(connectMock).toHaveBeenCalledWith({ url: "redis://h:1" })
    expect(selectGraphMock).toHaveBeenCalledWith("g")
  })

  it("возвращает значение, которое вернул callback", async () => {
    const v = await withGraph(async () => 123)
    expect(v).toBe(123)
  })
})
