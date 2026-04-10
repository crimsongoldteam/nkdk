import { graph } from "./graph"
import type { QueryBuilder } from "./dependencyQuery"

export function getDependencies(query: QueryBuilder): Record<string, unknown> {
  const steps = query.getSteps()
  if (steps.length === 0) return {}

  let currentNodes: string[] = graph.nodes().filter((id: string) => {
    const step = steps[0]
    if (step.kind !== "node") return false
    return step.fn({ id, attrs: graph.getNodeAttributes(id) })
  })

  for (let i = 1; i < steps.length; i++) {
    const step = steps[i]
    const nextNodes: string[] = []

    for (const nodeId of currentNodes) {
      if (step.kind === "node") {
        for (const neighbor of graph.outNeighbors(nodeId)) {
          if (step.fn({ id: neighbor, attrs: graph.getNodeAttributes(neighbor) })) {
            nextNodes.push(neighbor)
          }
        }
      } else if (step.kind === "edgeOr") {
        for (const { edge, target, attributes } of graph.outEdgeEntries(nodeId)) {
          if (step.matchers.some((fn) => fn({ id: edge, attrs: attributes }))) {
            nextNodes.push(target)
          }
        }
      }
    }

    currentNodes = nextNodes
  }

  const result: Record<string, unknown> = {}
  for (const id of currentNodes) {
    result[id] = graph.getNodeAttributes(id)
  }
  return result
}

export function clearDependenciesGraph(): void {
  graph.clear()
}
