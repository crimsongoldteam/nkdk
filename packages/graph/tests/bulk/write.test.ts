import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  rawCommand: vi.fn(),
}))

vi.mock("../../src/internal/connection", () => ({
  graphNameOf: () => "g",
  rawCommand: mocks.rawCommand,
}))

import { buildBulkCommands, writeBulkCommands } from "../../src/bulk/write"
import type { GraphConnection } from "../../src/internal/connection"

describe("bulk write", () => {
  beforeEach(() => {
    mocks.rawCommand.mockReset()
    mocks.rawCommand.mockResolvedValue("ok")
  })

  it("строит BEGIN-команду и последующие команды без BEGIN", () => {
    const commands = buildBulkCommands(
      [
        { kind: "node" as const, name: "A", count: 2, buffer: Buffer.alloc(30) },
        { kind: "edge" as const, name: "R", count: 3, buffer: Buffer.alloc(30) },
      ],
      { maxCommandBytes: 50, maxBlobBytes: 64 },
    )

    expect(commands).toHaveLength(2)
    expect(commands[0]!.begin).toBe(true)
    expect(commands[0]!.nodeCount).toBe(2)
    expect(commands[0]!.edgeCount).toBe(0)
    expect(commands[1]!.begin).toBe(false)
    expect(commands[1]!.nodeCount).toBe(0)
    expect(commands[1]!.edgeCount).toBe(3)
  })

  it("падает, если один blob превышает maxBlobBytes", () => {
    expect(() =>
      buildBulkCommands(
        [{ kind: "node" as const, name: "A", count: 1, buffer: Buffer.alloc(65) }],
        { maxCommandBytes: 100, maxBlobBytes: 64 },
      ),
    ).toThrow("GRAPH.BULK blob A is 65 bytes, limit is 64 bytes")
  })

  it("отправляет GRAPH.BULK через rawCommand", async () => {
    await writeBulkCommands(
      {} as GraphConnection,
      [{ begin: true, nodeCount: 1, edgeCount: 0, blobs: [Buffer.from("x")] }],
    )

    expect(mocks.rawCommand).toHaveBeenCalledWith({} as GraphConnection, [
      "GRAPH.BULK",
      "g",
      "BEGIN",
      "1",
      "0",
      Buffer.from("x"),
    ])
  })
})
