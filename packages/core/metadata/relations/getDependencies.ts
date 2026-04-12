import type { QueryBuilder } from "./dependencyQuery"
import { defaultGraph } from "./graph"
import type { MetadataGraph } from "./MetadataGraph"

export function getDependencies(query: QueryBuilder, g?: MetadataGraph): Record<string, unknown> {
  const gr = g ?? defaultGraph
  const steps = query.getSteps()
  if (steps.length === 0) return {}

  let currentNodes: string[] = gr.nodes().filter((id: string) => {
    const step = steps[0]
    if (step.kind !== "node") return false
    return step.fn({ id, attrs: gr.getNodeAttributes(id) })
  })

  let prevKind: string = "node"

  for (let i = 1; i < steps.length; i++) {
    const step = steps[i]
    const nextNodes: string[] = []

    for (const nodeId of currentNodes) {
      if (step.kind === "node") {
        if (prevKind === "edge") {
          if (step.fn({ id: nodeId, attrs: gr.getNodeAttributes(nodeId) })) {
            nextNodes.push(nodeId)
          }
        } else {
          for (const neighbor of gr.outNeighbors(nodeId)) {
            if (step.fn({ id: neighbor, attrs: gr.getNodeAttributes(neighbor) })) {
              nextNodes.push(neighbor)
            }
          }
        }
      } else if (step.kind === "edgeOr") {
        for (const { edge, target, attributes } of gr.outEdgeEntries(nodeId)) {
          if (step.matchers.some((fn) => fn({ id: edge, attrs: attributes }))) {
            nextNodes.push(target)
          }
        }
      } else if (step.kind === "edge") {
        for (const { edge, target, attributes } of gr.outEdgeEntries(nodeId)) {
          if (step.fn({ id: edge, attrs: attributes })) {
            nextNodes.push(target)
          }
        }
      }
    }

    prevKind = step.kind
    currentNodes = nextNodes
  }

  const result: Record<string, unknown> = {}
  for (const id of currentNodes) {
    result[id] = gr.getNodeAttributes(id)
  }
  return result
}

export function clearDependenciesGraph(g?: MetadataGraph): void {
  const gr = g ?? defaultGraph
  gr.clear()
}
