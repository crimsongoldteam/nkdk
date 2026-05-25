import { describe, expect, it } from "vitest"
import { BulkPropertyType } from "../../src/bulk/encoder"
import { buildBulkTokenCommands, resolveBulkTokenLimits } from "../../src/bulk/stream"
import type { BulkEdgeGroup, BulkNodeGroup } from "../../src/bulk/plan"

const readPropertyCount = (buffer: Buffer, name: string): number =>
  buffer.readUInt32LE(Buffer.byteLength(name) + 1)

const readUInt64 = (buffer: Buffer, offset: number): number =>
  Number(buffer.readBigUInt64LE(offset))

const rowOffset = (buffer: Buffer, name: string, propertyNames: readonly string[]): number =>
  Buffer.byteLength(name) + 1 + 4 + propertyNames.reduce((sum, propertyName) => sum + Buffer.byteLength(propertyName) + 1, 0)

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

  it("переупорядочивает compatible node buckets и remap-ит edge endpoints", () => {
    const nodeGroups: BulkNodeGroup[] = [
      {
        label: "MetadataCatalog",
        nodes: [
          { id: 0, logicalId: "A", props: { id: "A", value: "one" } },
          { id: 1, logicalId: "B", props: { id: "B", value: 1 } },
          { id: 2, logicalId: "C", props: { id: "C", value: "three" } },
        ],
      },
    ]
    const edgeGroups: BulkEdgeGroup[] = [
      { kind: "VALUE", edges: [{ src: 1, tgt: 2, props: {} }] },
    ]

    const { commands, stats } = buildBulkTokenCommands({ nodeGroups, edgeGroups }, {
      maxTokenBytes: 1024,
      maxCommandBytes: 4096,
    })

    const nodeBlobs = commands[0]!.blobs.filter((blob) => blob.kind === "node")
    const edgeBlob = commands[0]!.blobs.find((blob) => blob.kind === "edge")!
    const firstNodeBlobText = nodeBlobs[0]!.buffer.toString("utf8")
    const secondNodeBlobText = nodeBlobs[1]!.buffer.toString("utf8")
    expect(nodeBlobs).toHaveLength(2)
    expect(firstNodeBlobText).toContain("A\0")
    expect(firstNodeBlobText).toContain("C\0")
    expect(secondNodeBlobText).toContain("B\0")
    expect(firstNodeBlobText).not.toContain("B\0")
    expect(secondNodeBlobText).not.toContain("A\0")
    expect(secondNodeBlobText).not.toContain("C\0")
    expect(stats.nodeBlobs).toBe(2)

    const edgeRowOffset = rowOffset(edgeBlob.buffer, "VALUE", [])
    expect(readUInt64(edgeBlob.buffer, edgeRowOffset)).toBe(2)
    expect(readUInt64(edgeBlob.buffer, edgeRowOffset + 8)).toBe(1)
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

  it("использует default maxCommandBytes, если caller передал undefined", () => {
    expect(resolveBulkTokenLimits({
      maxTokenBytes: undefined,
      maxCommandBytes: undefined,
    })).toEqual({
      maxTokenBytes: 64_000_000,
      maxCommandBytes: 64_000_000,
      maxTokenCount: 1024,
    })
  })

  it("сбрасывает command до превышения maxTokenCount", () => {
    const nodeGroups: BulkNodeGroup[] = [
      {
        label: "MetadataCatalog",
        nodes: [
          { id: 0, logicalId: "A", props: { id: "A", value: "one" } },
          { id: 1, logicalId: "B", props: { id: "B", value: 1 } },
          { id: 2, logicalId: "C", props: { id: "C", value: true } },
          { id: 3, logicalId: "D", props: { id: "D", value: 1.5 } },
        ],
      },
    ]

    const { commands, stats } = buildBulkTokenCommands({ nodeGroups, edgeGroups: [] }, {
      maxTokenBytes: 1024,
      maxCommandBytes: 4096,
      maxTokenCount: 3,
    })

    expect(stats.nodeBlobs).toBe(4)
    expect(commands).toHaveLength(2)
    expect(commands[0]!.blobs).toHaveLength(2)
    expect(commands[1]!.blobs).toHaveLength(2)
  })

  it("кодирует edge token с union-схемой свойств", () => {
    const nodeGroups: BulkNodeGroup[] = [
      {
        label: "MetadataCatalog",
        nodes: [
          { id: 0, logicalId: "A", props: { id: "A" } },
          { id: 1, logicalId: "B", props: { id: "B" } },
        ],
      },
    ]
    const edgeGroups: BulkEdgeGroup[] = [
      {
        kind: "VALUE",
        edges: [
          { src: 0, tgt: 1, props: { yaml: "Реквизит" } },
          { src: 1, tgt: 0, props: { index: 2 } },
        ],
      },
    ]

    const { commands, stats } = buildBulkTokenCommands({ nodeGroups, edgeGroups }, {
      maxTokenBytes: 1024,
      maxCommandBytes: 4096,
    })

    expect(commands).toHaveLength(1)
    expect(commands[0]!.edgeCount).toBe(2)
    const edgeBlob = commands[0]!.blobs.find((blob) => blob.kind === "edge")!
    expect(stats.edgeBlobs).toBe(1)
    expect(readPropertyCount(edgeBlob.buffer, "VALUE")).toBe(2)
    expect([...edgeBlob.buffer.values()]).toContain(BulkPropertyType.Null)
  })

  it("падает, если edge endpoint не имеет bulk remap", () => {
    const edgeGroups: BulkEdgeGroup[] = [
      { kind: "VALUE", edges: [{ src: 0, tgt: 1, props: {} }] },
    ]

    expect(() =>
      buildBulkTokenCommands({ nodeGroups: [], edgeGroups }, {
        maxTokenBytes: 1024,
        maxCommandBytes: 4096,
      }),
    ).toThrow("Missing GRAPH.BULK node id remap for edge endpoint: 0")
  })
})
