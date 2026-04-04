import { graph } from "./graph"

export const existsPath = ({ path }: { path: string }): boolean => {
  const [fromName, relLabel, toName] = path.split(".")
  const startNodes = graph.nodes().filter((id) => graph.getNodeAttribute(id, "name") === fromName)
  for (const startId of startNodes) {
    const found = graph.outEdges(startId).some((edgeId) => {
      if (graph.getEdgeAttribute(edgeId, "yaml") !== relLabel) return false
      return graph.getNodeAttribute(graph.target(edgeId), "name") === toName
    })
    if (found) return true
  }
  return false
}
