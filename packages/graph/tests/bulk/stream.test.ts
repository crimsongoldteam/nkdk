import { describe, expect, it } from "vitest"
import { BulkPropertyType } from "../../src/bulk/encoder"
import { buildBulkTokenCommands } from "../../src/bulk/stream"
import type { BulkEdgeGroup, BulkNodeGroup } from "../../src/bulk/plan"

const readPropertyCount = (buffer: Buffer, name: string): number =>
  buffer.readUInt32LE(Buffer.byteLength(name) + 1)

describe("bulk stream", () => {
  it("объединяет optional свойства в один node token и кодирует пропуски как NULL", () => {
    const nodeGroups: BulkNodeGroup[] = [
      {
        label: "MetadataCatalog",
        nodes: [
          { id: 0, logicalId: "A", props: { id: "A", name: "A", enabled: true } },
          { id: 1, logicalId: "B", props: { id: "B", name: "B" } },
        ],
      },
    ]

    const { commands, stats } = buildBulkTokenCommands({ nodeGroups, edgeGroups: [] }, {
      maxTokenBytes: 1024,
      maxCommandBytes: 4096,
    })

    expect(commands).toHaveLength(1)
    expect(commands[0]!.nodeCount).toBe(2)
    expect(commands[0]!.blobs).toHaveLength(1)
    expect(stats.nodeBlobs).toBe(1)
    expect(readPropertyCount(commands[0]!.blobs[0]!.buffer, "MetadataCatalog")).toBe(3)
    expect([...commands[0]!.blobs[0]!.buffer.values()]).toContain(BulkPropertyType.Null)
  })

  it("разбивает только конфликтующие типы одного свойства", () => {
    const nodeGroups: BulkNodeGroup[] = [
      {
        label: "MetadataCatalog",
        nodes: [
          { id: 0, logicalId: "A", props: { id: "A", value: "1", optional: "x" } },
          { id: 1, logicalId: "B", props: { id: "B", value: 1 } },
        ],
      },
    ]

    const { commands, stats } = buildBulkTokenCommands({ nodeGroups, edgeGroups: [] }, {
      maxTokenBytes: 1024,
      maxCommandBytes: 4096,
    })

    expect(commands).toHaveLength(1)
    expect(commands[0]!.blobs).toHaveLength(2)
    expect(stats.nodeBlobs).toBe(2)
  })

  it("сбрасывает token до превышения maxTokenBytes", () => {
    const nodeGroups: BulkNodeGroup[] = [
      {
        label: "MetadataCatalog",
        nodes: [
          { id: 0, logicalId: "A", props: { id: "A", text: "x".repeat(40) } },
          { id: 1, logicalId: "B", props: { id: "B", text: "y".repeat(40) } },
        ],
      },
    ]

    const { commands, stats } = buildBulkTokenCommands({ nodeGroups, edgeGroups: [] }, {
      maxTokenBytes: 80,
      maxCommandBytes: 4096,
    })

    expect(commands[0]!.blobs).toHaveLength(2)
    expect(stats.nodeBlobs).toBe(2)
  })

  it("кодирует edge token с union-схемой свойств", () => {
    const edgeGroups: BulkEdgeGroup[] = [
      {
        kind: "VALUE",
        edges: [
          { src: 0, tgt: 1, props: { yaml: "Реквизит" } },
          { src: 1, tgt: 0, props: { index: 2 } },
        ],
      },
    ]

    const { commands, stats } = buildBulkTokenCommands({ nodeGroups: [], edgeGroups }, {
      maxTokenBytes: 1024,
      maxCommandBytes: 4096,
    })

    expect(commands).toHaveLength(1)
    expect(commands[0]!.edgeCount).toBe(2)
    expect(commands[0]!.blobs).toHaveLength(1)
    expect(stats.edgeBlobs).toBe(1)
    expect(readPropertyCount(commands[0]!.blobs[0]!.buffer, "VALUE")).toBe(2)
    expect([...commands[0]!.blobs[0]!.buffer.values()]).toContain(BulkPropertyType.Null)
  })
})
