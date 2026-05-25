import { describe, expect, it } from "vitest"
import { createBulkPlan } from "../../src/bulk/plan"
import type { FileGraphData } from "../../src/types"

describe("bulk plan", () => {
  it("назначает стабильные numeric IDs для File, предметных узлов и stub-узлов", () => {
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

    expect(plan.nodeCount).toBe(3)
    expect(plan.edgeCount).toBe(3)
    expect(plan.nodeIdByLogicalId).toEqual(new Map([
      ["a.yaml", 0],
      ["A", 1],
      ["Missing", 2],
    ]))
    expect(plan.nodeGroups.map((group) => [group.label, group.nodes.map((node) => node.id)])).toEqual([
      ["File", [0]],
      ["MetadataCatalog", [1]],
      ["GraphStub", [2]],
    ])
    expect(plan.labels).not.toContain("GraphNode")
    expect(plan.edgeGroups.map((group) => [group.kind, group.edges.map((edge) => [edge.src, edge.tgt])])).toEqual([
      ["VALUE", [[1, 2]]],
      ["DECLARES", [[0, 1]]],
      ["CONTRIBUTES", [[0, 2]]],
    ])
  })
})
