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
      "MATCH (f:File) RETURN f.path AS path, f.mtimeMs AS mtimeMs, f.size AS size, f.updatedAt AS updatedAt",
      undefined,
    )
    expect(result).toEqual(files)
    expect(closeMock).toHaveBeenCalledTimes(1)
  })
})
