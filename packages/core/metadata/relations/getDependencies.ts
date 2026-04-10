import { graph } from "./graph"

export function getDependencies(path: string[]): Record<string, unknown> {
  const nodeId = path.join(".")
  if (!graph.hasNode(nodeId)) return {}
  const result: Record<string, unknown> = {}
  for (const neighbourId of graph.outNeighbors(nodeId)) {
    result[neighbourId] = graph.getNodeAttributes(neighbourId)
  }
  return result
}
