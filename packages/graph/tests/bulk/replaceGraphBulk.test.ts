import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  deleteGraph: vi.fn(),
  graphNameOf: vi.fn(),
  ensureFileIndexes: vi.fn(),
  ensureLabelIndexes: vi.fn(),
  query: vi.fn(),
  rawCommand: vi.fn(),
  validateReplacePayload: vi.fn(),
  writeBulkCommands: vi.fn(),
}))

vi.mock("../../src/internal/connection", () => ({
  deleteGraph: mocks.deleteGraph,
  graphNameOf: mocks.graphNameOf,
  query: mocks.query,
  rawCommand: mocks.rawCommand,
}))

vi.mock("../../src/internal/operations", () => ({
  ensureFileIndexes: mocks.ensureFileIndexes,
  ensureLabelIndexes: mocks.ensureLabelIndexes,
  validateReplacePayload: mocks.validateReplacePayload,
}))

vi.mock("../../src/bulk/write", () => ({
  writeBulkCommands: mocks.writeBulkCommands,
}))

import { replaceGraphBulk } from "../../src/bulk/replaceGraphBulk"
import type { GraphConnection } from "../../src/internal/connection"
import type { FileGraphData } from "../../src/types"

describe("replaceGraphBulk", () => {
  beforeEach(() => {
    mocks.deleteGraph.mockReset().mockResolvedValue(undefined)
    mocks.graphNameOf.mockReset().mockReturnValue("testGraph")
    mocks.ensureFileIndexes.mockReset().mockResolvedValue(undefined)
    mocks.ensureLabelIndexes.mockReset().mockResolvedValue(undefined)
    mocks.query.mockReset().mockResolvedValue(undefined)
    mocks.rawCommand.mockReset().mockResolvedValue(1)
    mocks.validateReplacePayload.mockReset()
    mocks.writeBulkCommands.mockReset().mockResolvedValue({ commands: 1, nodeBlobs: 1, edgeBlobs: 0, totalBytes: 1 })
  })

  it("не выполняет массовое добавление GraphNode после GRAPH.BULK", async () => {
    const files: FileGraphData[] = [{
      filePath: "a.yaml",
      fileStats: { mtimeMs: 1, size: 2, updatedAt: 3 },
      nodes: [{ id: "A", label: "MetadataObject", props: { kind: "MetadataCatalog" } }],
      edges: [],
      declaredNodeIds: ["A"],
    }]

    await replaceGraphBulk({} as GraphConnection, files)

    expect(mocks.writeBulkCommands).toHaveBeenCalledTimes(1)
    expect(mocks.query.mock.calls.map((call) => call[0] as string)).not.toContain(
      "MATCH (n) WHERE n.id IS NOT NULL AND NOT n:File SET n:GraphNode",
    )
  })

  it("удаляет ключ графа после GRAPH.DELETE перед GRAPH.BULK", async () => {
    const files: FileGraphData[] = [{
      filePath: "a.yaml",
      fileStats: { mtimeMs: 1, size: 2, updatedAt: 3 },
      nodes: [{ id: "A", label: "MetadataObject", props: { kind: "MetadataCatalog" } }],
      edges: [],
      declaredNodeIds: ["A"],
    }]

    await replaceGraphBulk({} as GraphConnection, files)

    expect(mocks.deleteGraph).toHaveBeenCalledBefore(mocks.rawCommand)
    expect(mocks.rawCommand).toHaveBeenCalledWith({} as GraphConnection, ["DEL", "testGraph"])
    expect(mocks.rawCommand).toHaveBeenCalledBefore(mocks.writeBulkCommands)
  })
})
