import { describe, expect, it } from "vitest"
import { createBulkPlan } from "../../src/bulk/plan"
import type { FileGraphData } from "../../src/types"

describe("bulk plan", () => {
  it("пропускает связи с отсутствующими узлами как обычный replace-путь", () => {
    const files: FileGraphData[] = [
      {
        filePath: "a.yaml",
        fileStats: { mtimeMs: 1, size: 2, updatedAt: 3 },
        nodes: [{ id: "A", label: "MetadataCatalog", props: { name: "A" } }],
        edges: [{ src: "A", tgt: "Missing", kind: "VALUE", props: { index: 1 } }],
        declaredNodeIds: ["A"],
        contributedNodeIds: ["Missing"],
      },
    ]

    const plan = createBulkPlan(files)

    expect(plan.nodeCount).toBe(2)
    expect(plan.edgeCount).toBe(1)
    expect(plan.nodeIdByLogicalId).toEqual(new Map([
      ["a.yaml", 0],
      ["A", 1],
    ]))
    expect(plan.nodeGroups.map((group) => [group.label, group.nodes.map((node) => node.id)])).toEqual([
      ["File", [0]],
      ["MetadataCatalog", [1]],
    ])
    expect(plan.labels).not.toContain("GraphNode")
    expect(plan.labels).not.toContain("GraphStub")
    expect(plan.edgeGroups.map((group) => [group.kind, group.edges.map((edge) => [edge.src, edge.tgt])])).toEqual([
      ["DECLARES", [[0, 1]]],
    ])
  })
})
