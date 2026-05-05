import { beforeEach, describe, expect, it, vi } from "vitest"

const queryMock = vi.fn()
const selectGraphMock = vi.fn()
const connectMock = vi.fn()
const closeMock = vi.fn()

vi.mock("falkordb", () => ({
  FalkorDB: { connect: (opts?: unknown) => connectMock(opts) },
}))

import { getGraphFiles } from "../src/getGraphFiles"
import type { GraphFileRecord } from "../src/types"

beforeEach(() => {
  queryMock.mockReset()
  selectGraphMock.mockReset().mockReturnValue({ query: queryMock })
  closeMock.mockReset().mockResolvedValue(undefined)
  connectMock
    .mockReset()
    .mockResolvedValue({ selectGraph: selectGraphMock, close: closeMock })
})

describe("getGraphFiles", () => {
  it("читает File-узлы графа и закрывает соединение", async () => {
    const files: GraphFileRecord[] = [
      { path: "a.yaml", mtimeMs: 10, size: 20, updatedAt: 30 },
      { path: "b.yaml", mtimeMs: 40, size: 50, updatedAt: 60 },
    ]
    queryMock.mockResolvedValue({ data: files })

    const result = await getGraphFiles({ graphName: "g" })

    expect(selectGraphMock).toHaveBeenCalledWith("g")
    expect(queryMock).toHaveBeenCalledWith(
      "MATCH (f:File) RETURN f.path AS path, f.mtimeMs AS mtimeMs, f.size AS size, f.updatedAt AS updatedAt ORDER BY path SKIP $skip LIMIT $limit",
      { params: { skip: 0, limit: 5000 } },
    )
    expect(result).toEqual(files)
    expect(closeMock).toHaveBeenCalledTimes(1)
  })

  it("читает File-узлы постранично, чтобы не упереться в лимит FalkorDB", async () => {
    const firstPage = Array.from({ length: 5000 }, (_, index): GraphFileRecord => ({
      path: `file-${index}.yaml`,
      mtimeMs: index,
      size: index,
      updatedAt: index,
    }))
    const secondPage: GraphFileRecord[] = [
      { path: "file-5000.yaml", mtimeMs: 5000, size: 5000, updatedAt: 5000 },
    ]
    queryMock
      .mockResolvedValueOnce({ data: firstPage })
      .mockResolvedValueOnce({ data: secondPage })

    const result = await getGraphFiles({ graphName: "g" })

    expect(result).toHaveLength(5001)
    expect(queryMock).toHaveBeenCalledTimes(2)
    expect(queryMock.mock.calls[0]?.[1]).toEqual({ params: { skip: 0, limit: 5000 } })
    expect(queryMock.mock.calls[1]?.[1]).toEqual({ params: { skip: 5000, limit: 5000 } })
    expect(closeMock).toHaveBeenCalledTimes(1)
  })
})
